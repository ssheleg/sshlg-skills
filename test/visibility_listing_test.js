#!/usr/bin/env node
'use strict';
// B-337 (audit 2026-11-11): the Claude listing estimate counts plugin commands, leaves out
// entries with `disable-model-invocation: true` and plugins whose marketplace cannot load,
// and prints the measuring recipe when no debug count exists. Scratch HOME, preview only.
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

const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'visibility'], {
  cwd: home, encoding: 'utf8',
  env: Object.assign({}, process.env, { HOME: home, CLAUDE_CONFIG_DIR: path.join(home, '.claude'), SSHLG_SKILLS_NO_UPDATE_CHECK: '1' }),
});
const out = `${r.stdout}${r.stderr}`;

it('the preview runs', () => assert.strictEqual(r.status, 0, out));
it('the estimate is plain + plugin skill + plugin command, nothing else', () => {
  const want = V.listingChars([
    { name: 'plain-one', description: 'Use when testing the plain skill.', state: 'on' },
    { name: 'p:p-skill', description: 'Use when testing the plugin skill.', state: 'on' },
    { name: 'p:p-cmd', description: 'Run the plugin command.', state: 'on' },
  ]);
  const m = /launcher's estimate ≈ (\d+) →/.exec(out);
  assert.ok(m, out);
  assert.strictEqual(Number(m[1]), want, out);
  assert.ok(/1 plugin command\(s\)/.test(out), out);
});
it('with no debug count, the measuring recipe is printed', () => {
  assert.ok(out.includes('claude -p ok --debug-file <file>'), out);
});

fs.rmSync(home, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
