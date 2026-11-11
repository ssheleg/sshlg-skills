#!/usr/bin/env node
'use strict';
// B-337 (audit 2026-11-11): the Claude listing estimate counts plugin commands, leaves out
// entries with `disable-model-invocation: true` and plugins whose marketplace cannot load,
// and prints the measuring recipe when no debug count exists. Scratch HOME, preview only.
// B-337 second pass (2026-11-11): a plugin command and skill of one name are one entry with the
// command's description, the preview counts entries, and `--measure` reads Claude Code's own
// count from one `claude -p` run (a fake executable here).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const V = require('../lib/visibility.js');

let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-listing-'));
const w = (rel, text) => { const p = path.join(home, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const md = (name, desc, extra) => `---\nname: ${name}\ndescription: ${desc}\n${extra || ''}---\n# ${name}\n`;
w('.claude/skills/plain-one/SKILL.md', md('plain-one', 'Use when testing the plain skill.'));
w('.claude/skills/manual-only/SKILL.md', md('manual-only', 'Use only by hand.', 'disable-model-invocation: true\n'));
// A plugin installed outside the plugin cache (as a Homebrew package is), with a command.
w('opt/pkg/plugins/p/skills/p-skill/SKILL.md', md('p-skill', 'Use when testing the plugin skill.'));
w('opt/pkg/plugins/p/commands/p-cmd.md', '---\ndescription: Run the plugin command.\n---\nbody\n');
// A skill with the command's name: Claude Code lists one entry, with the command's description.
w('opt/pkg/plugins/p/skills/p-cmd/SKILL.md', md('p-cmd', 'Use when the twin skill of the command would be counted a second time.'));
w('opt/pkg/plugins/p/commands/p-hidden.md', '---\ndescription: Hidden command.\ndisable-model-invocation: true\n---\nbody\n');
// A plugin whose marketplace has no install location on disk: Claude Code loads nothing of it.
w('.claude/plugins/cache/gone/g/1/skills/g-skill/SKILL.md', md('g-skill', 'Use when testing an unloadable plugin.'));
w('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: {
  'p@market': [{ installPath: path.join(home, 'opt/pkg/plugins/p'), scope: 'user' }],
  'g@gone': [{ installPath: path.join(home, '.claude/plugins/cache/gone/g/1'), scope: 'user' }],
} }));
w('.claude/plugins/known_marketplaces.json', JSON.stringify({
  market: { installLocation: path.join(home, 'opt/pkg') },
  gone: { installLocation: path.join(home, 'nowhere') },
}));
w('.claude/settings.json', JSON.stringify({ enabledPlugins: { 'p@market': true, 'g@gone': true } }));
w('.claude.json', JSON.stringify({ skillUsage: {
  'plain-one': { usageCount: 1, lastUsedAt: Date.now() },
} }));

const run = (args, env) => {
  const got = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'visibility'].concat(args || []), {
    cwd: home, encoding: 'utf8',
    env: Object.assign({}, process.env, { HOME: home, CLAUDE_CONFIG_DIR: path.join(home, '.claude'), SSHLG_SKILLS_NO_UPDATE_CHECK: '1' }, env || {}),
  });
  return { status: got.status, out: `${got.stdout}${got.stderr}` };
};
const r = run();
const out = r.out;
// A fake `claude`: writes the two listing lines Claude Code 2.1.299 logs to --debug-file, from
// the folder it was started in (recorded so the test can check it was empty and removed).
const fake = (body) => {
  const p = w(`bin/fake-claude-${Math.random().toString(36).slice(2)}.js`, `#!/usr/bin/env node\n${body}\n`);
  fs.chmodSync(p, 0o755);
  return p;
};
const seen = path.join(home, 'fake-seen.json');
const overBudget = fake(`const fs = require('fs');
const a = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(seen)}, JSON.stringify({ args: a, cwd: process.cwd(), files: fs.readdirSync(process.cwd()) }));
fs.writeFileSync(a[a.indexOf('--debug-file') + 1], [
  '2026-11-11T17:37:05.031Z [DEBUG] getSkills returning: 4 skill dir commands, 1 plugin skills, 2 bundled skills, 1 builtin plugin skills',
  '2026-11-11T17:37:07.826Z [WARN] Skill listing over budget: 6 skills, 40000 chars > 30000 budget — descriptions will be truncated.',
].join('\\n'));`);
const underBudget = fake(`const fs = require('fs');
const a = process.argv.slice(2);
fs.writeFileSync(a[a.indexOf('--debug-file') + 1], '2026-11-11T17:37:05.031Z [DEBUG] getSkills returning: 4 skill dir commands, 1 plugin skills, 2 bundled skills, 1 builtin plugin skills\\n');`);
const failing = fake('process.exit(3);');

it('the preview runs', () => assert.strictEqual(r.status, 0, out));
it('the estimate is plain + plugin skill + plugin command, nothing else', () => {
  const want = V.listingChars([
    { name: 'plain-one', description: 'Use when testing the plain skill.', state: 'on' },
    { name: 'p:p-skill', description: 'Use when testing the plugin skill.', state: 'on' },
    { name: 'p:p-cmd', description: 'Run the plugin command.', state: 'on' },
  ]);
  const m = /launcher's estimate ≈ (\d+) → \d+ characters \((\d+) → \d+ entries\)/.exec(out);
  assert.ok(m, out);
  assert.strictEqual(Number(m[1]), want, out);
  assert.strictEqual(Number(m[2]), 3, out);
  assert.ok(/1 plugin command\(s\)/.test(out), out);
});
it('with no debug count, the preview names --measure and runs nothing', () => {
  assert.ok(out.includes('npx sshlg-skills visibility --measure'), out);
  assert.ok(!fs.existsSync(seen), 'the preview without --measure started claude');
});
it('--measure prints Claude Code\'s count and what the estimate does not see', () => {
  const got = run(['--measure'], { SSHLG_SKILLS_CLAUDE: overBudget });
  assert.strictEqual(got.status, 0, got.out);
  const est = Number(/launcher's estimate ≈ (\d+) →/.exec(got.out)[1]);
  assert.ok(got.out.includes('6 entries, 40000 characters > 30000 budget; 2 bundled and 1 built-in plugin skill(s) are not on disk'), got.out);
  assert.ok(got.out.includes(`entries the estimate does not see: 3, characters: ${40000 - est}.`), got.out);
  const s = JSON.parse(fs.readFileSync(seen, 'utf8'));
  // No MCP server (a Fabric one would register the temp folder as a board project), no hook.
  assert.deepStrictEqual(s.args.slice(0, 6), ['-p', 'ok', '--no-session-persistence', '--strict-mcp-config',
    '--settings', '{"disableAllHooks":true}'], JSON.stringify(s));
  assert.deepStrictEqual(s.files, [], 'claude was started from a folder that was not empty');
  assert.ok(!fs.existsSync(s.cwd), 'the measuring folder was left behind');
});
it('--measure under budget says so instead of inventing a count', () => {
  const got = run(['--measure'], { SSHLG_SKILLS_CLAUDE: underBudget });
  assert.ok(got.out.includes('within its budget (it logs a count only when over); 2 bundled and 1 built-in plugin skill(s) are not on disk'), got.out);
});
it('--measure that cannot run says why and keeps the preview', () => {
  const failed = run(['--measure'], { SSHLG_SKILLS_CLAUDE: failing });
  assert.strictEqual(failed.status, 0, failed.out);
  assert.ok(/own count: not measured: `\S+ -p ok` exited 3\./.test(failed.out), failed.out);
  const absent = run(['--measure'], { SSHLG_SKILLS_CLAUDE: path.join(home, 'no-such-claude') });
  assert.ok(/not measured: `\S+no-such-claude` is not on PATH\./.test(absent.out), absent.out);
});
it('listingRows: the later row of one name wins, hidden rows drop', () => {
  const rows = V.listingRows([
    { name: 'a', description: 'skill', state: 'on' }, { name: 'b', state: 'hidden' },
    { name: 'a', description: 'command', state: 'on' },
  ]);
  assert.deepStrictEqual(rows.map((x) => [x.name, x.description]), [['a', 'command']]);
});
it('parseListingLog: the last of each line wins; a log without them gives nulls', () => {
  const log = ['t1 [WARN] Skill listing over budget: 1 skills, 10 chars > 5 budget',
    'x [DEBUG] getSkills returning: 1 skill dir commands, 0 plugin skills, 7 bundled skills, 2 builtin plugin skills',
    't2 [WARN] Skill listing over budget: 2 skills, 20 chars > 5 budget'].join('\n');
  assert.deepStrictEqual(V.parseListingLog(log), { over: { at: 't2', skills: 2, chars: 20, budget: 5 }, bundled: 7, builtinPlugin: 2 });
  assert.deepStrictEqual(V.parseListingLog('nothing'), { over: null, bundled: null, builtinPlugin: null });
});

fs.rmSync(home, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
