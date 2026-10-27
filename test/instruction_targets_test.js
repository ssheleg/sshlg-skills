#!/usr/bin/env node
'use strict';
// B-206: the routing block for every host that reads a global instruction file.
// Every fixture is a temp HOME with a PATH that holds no host binary, so the machine
// running the suite (which may have Kimi, Goose or Warp installed) cannot leak in.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('../lib/apply.js');
const IT = require('../lib/instruction-targets.js');
const R = require('../lib/routers.js');
const registry = require('../lib/routers-registry.js');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
const ENV = { PATH: '' };
const NOBIN = () => null;
function home() { return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-it-'))); }
function mk(h, ...parts) { const d = path.join(h, ...parts); fs.mkdirSync(d, { recursive: true }); return d; }
const ROUTERS = { 'task-pipeline': 'pipeline body', 'super-ux': 'ux body' };
const ALL = Object.fromEntries(registry.order().map((n) => [n, registry.REGISTRY[n].text]));
const MEMBERS = require('../skills.json').skills;
const target = (agent) => IT.EXTRA_TARGETS.find((t) => t.agent === agent);
const opts = (h, more) => Object.assign({ home: h, env: ENV, which: NOBIN, hostTargets: [], includeCursor: false, mode: 'update', consentRecorded: 'yes', consent: 'yes', routers: ROUTERS, members: [], log: () => {} }, more || {});
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

it('a home holding only skills/ is not a host; any other entry or a binary is', () => {
  const h = home();
  mk(h, '.qwen', 'skills');
  assert.strictEqual(IT.presence('qwen', h, { env: ENV, which: NOBIN }).present, false);
  fs.writeFileSync(path.join(h, '.qwen', 'settings.json'), '{}');
  assert.strictEqual(IT.presence('qwen', h, { env: ENV, which: NOBIN }).present, true);
  const h2 = home();
  assert.strictEqual(IT.presence('goose', h2, { env: ENV, which: (b) => (b === 'goose' ? '/x/goose' : null) }).present, true);
});

it('an absent host gets nothing: no file, no directory', () => {
  const h = home();
  mk(h, '.qwen', 'skills');   // what the skills CLI leaves behind
  const r = A.apply(opts(h, { extraTargets: IT.EXTRA_TARGETS }));
  for (const t of IT.EXTRA_TARGETS) {
    const row = r.targets.find((x) => x.agent === t.agent);
    assert.strictEqual(row.action, 'agent-absent', `${t.agent}: ${row.action}`);
  }
  assert.ok(!fs.existsSync(path.join(h, '.qwen', 'QWEN.md')));
  assert.ok(!fs.existsSync(path.join(h, '.zcode')));
  assert.ok(!fs.existsSync(path.join(h, '.agents')));
  assert.ok(!fs.existsSync(path.join(h, '.kiro')));
  assert.ok(!fs.existsSync(path.join(h, '.codeium')));
});

it('an installed ZCode gets the full block on update once consent is on record', () => {
  const h = home();
  mk(h, '.zcode', 'cli');
  const r = A.apply(opts(h, { extraTargets: [target('zcode')] }));
  const file = path.join(h, '.zcode', 'AGENTS.md');
  assert.strictEqual(r.targets.find((x) => x.agent === 'zcode').action, 'created');
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.includes('<!-- SSHLG:ROUTER:task-pipeline:BEGIN -->'));
  // Without consent on record, update introduces nothing (same rule as TARGETS).
  const h2 = home();
  mk(h2, '.zcode', 'cli');
  const r2 = A.apply(opts(h2, { extraTargets: [target('zcode')], consentRecorded: undefined }));
  assert.strictEqual(r2.targets.find((x) => x.agent === 'zcode').action, 'absent');
  assert.ok(!fs.existsSync(path.join(h2, '.zcode', 'AGENTS.md')));
});

it('Qwen honours QWEN_HOME', () => {
  const h = home();
  const q = mk(h, 'qhome');
  fs.writeFileSync(path.join(q, 'settings.json'), '{}');
  const env = { PATH: '', QWEN_HOME: q };
  const r = A.apply(opts(h, { env, extraTargets: [target('qwen')] }));
  assert.strictEqual(r.targets[0].action, 'created');
  assert.ok(fs.readFileSync(path.join(q, 'QWEN.md'), 'utf8').includes(R.BEGIN));
});

it('the shared ~/.agents/AGENTS.md: a regular file keeps every byte outside the sentinels', () => {
  const h = home();
  mk(h, '.warp');
  fs.writeFileSync(path.join(h, '.warp', 'settings.toml'), '');
  mk(h, '.agents', 'skills');
  const file = path.join(h, '.agents', 'AGENTS.md');
  const mine = '# Shared operator rules\n\nkeep me exactly\n';
  fs.writeFileSync(file, mine);
  const r = A.apply(opts(h, { extraTargets: [target('agents')] }));
  const row = r.targets[0];
  assert.strictEqual(row.action, 'updated');
  assert.deepStrictEqual(row.serves, ['warp']);
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.startsWith(mine));
  assert.strictEqual(R.removeBlock(text).text.replace(/\n+$/, '\n'), mine);
});

it('the shared file as a symlink to a hub-managed file is reported, never written through', () => {
  const h = home();
  mk(h, '.kimi-code');
  fs.writeFileSync(path.join(h, '.kimi-code', 'config.toml'), '');
  mk(h, '.agents');
  const pi = path.join(mk(h, '.pi', 'agent'), 'AGENTS.md');
  fs.writeFileSync(pi, '# pi\n');
  const link = path.join(h, '.agents', 'AGENTS.md');
  fs.symlinkSync(pi, link);
  const before = sha(pi);
  const r = A.apply(opts(h, { extraTargets: [target('agents')] }));
  assert.strictEqual(r.targets[0].action, 'served-via-symlink');
  assert.strictEqual(r.targets[0].target, pi);
  assert.ok(/already served via symlink to /.test(r.targets[0].reason));
  assert.strictEqual(sha(pi), before);
  assert.ok(fs.lstatSync(link).isSymbolicLink());
});

it('the shared file as a symlink to a foreign file is left alone with the manual step', () => {
  const h = home();
  mk(h, '.kimi-code');
  fs.writeFileSync(path.join(h, '.kimi-code', 'config.toml'), '');
  mk(h, '.agents');
  const foreign = path.join(mk(h, 'notes'), 'shared-entry.md');
  fs.writeFileSync(foreign, '# compact entry\n');
  fs.symlinkSync(foreign, path.join(h, '.agents', 'AGENTS.md'));
  const r = A.apply(opts(h, { extraTargets: [target('agents')] }));
  assert.strictEqual(r.targets[0].action, 'foreign-symlink');
  assert.ok(/replace the link with a regular file/.test(r.targets[0].reason));
  assert.strictEqual(fs.readFileSync(foreign, 'utf8'), '# compact entry\n');
});

it('Kiro: written only where ~/.kiro/steering already exists', () => {
  const h = home();
  mk(h, '.kiro', 'settings');
  let r = A.apply(opts(h, { extraTargets: [target('kiro')] }));
  assert.strictEqual(r.targets[0].action, 'agent-absent');
  assert.ok(!fs.existsSync(path.join(h, '.kiro', 'steering')));
  mk(h, '.kiro', 'steering');
  r = A.apply(opts(h, { extraTargets: [target('kiro')] }));
  assert.strictEqual(r.targets[0].action, 'created');
  const text = fs.readFileSync(path.join(h, '.kiro', 'steering', 'sshlg-routing.md'), 'utf8');
  assert.ok(text.startsWith(R.BEGIN), 'a steering file must not start with anything Kiro could read as front matter');
});

it('the compact block for every router fits Windsurf (6,000) and a Hermes plugin section (8,000)', () => {
  const block = A.renderCompact(ALL, { members: MEMBERS, star: true });
  assert.ok(block.length <= target('windsurf').cap, `compact block is ${block.length} characters`);
  assert.ok(block.length <= IT.HERMES_PLUGIN_CAP);
  assert.ok(!/SSHLG:ROUTER:[a-z0-9-]+:BEGIN/.test(block), 'router sections leaked into the compact form');
  for (const name of registry.order()) assert.ok(block.includes(`| \`${name}\` |`), `${name} missing from the table`);
  assert.ok(block.includes('<!-- SSHLG:ROUTERS:PROTOCOL:BEGIN -->'));
  assert.strictEqual(R.parse(block + '\n').state, R.STATE.PRESENT);
});

it('Windsurf gets the compact block, and a refresh after a router change replaces it', () => {
  const h = home();
  const mem = mk(h, '.codeium', 'windsurf', 'memories');
  const file = path.join(mem, 'global_rules.md');
  fs.writeFileSync(file, 'Prefer small diffs.\n');
  const r = A.apply(opts(h, { extraTargets: [target('windsurf')] }));
  const row = r.targets[0];
  assert.strictEqual(row.action, 'updated');
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.startsWith('Prefer small diffs.\n'));
  assert.ok(text.length <= 6000);
  const rendered = { [file]: row.rendered };
  const r2 = A.apply(opts(h, { extraTargets: [target('windsurf')], routers: ALL, rendered }));
  assert.strictEqual(r2.targets[0].action, 'updated');
  assert.ok(fs.readFileSync(file, 'utf8').includes('`make-skill`'));
});

it('Windsurf over its cap is refused, not truncated, and the file is untouched', () => {
  const h = home();
  const mem = mk(h, '.codeium', 'windsurf', 'memories');
  const file = path.join(mem, 'global_rules.md');
  const mine = 'x'.repeat(5000) + '\n';
  fs.writeFileSync(file, mine);
  const r = A.apply(opts(h, { extraTargets: [target('windsurf')], routers: ALL, members: MEMBERS }));
  assert.strictEqual(r.targets[0].action, 'over-cap');
  assert.ok(/over this host's 6000/.test(r.targets[0].reason));
  assert.strictEqual(fs.readFileSync(file, 'utf8'), mine);
});

it('a compact block the hub did not last write is kept and named', () => {
  const h = home();
  const mem = mk(h, '.codeium', 'windsurf', 'memories');
  const file = path.join(mem, 'global_rules.md');
  const block = A.renderCompact(ROUTERS, {}).replace('Compact form:', 'My own words. Compact form:');
  fs.writeFileSync(file, block + '\n');
  const r = A.apply(opts(h, { extraTargets: [target('windsurf')] }));
  assert.strictEqual(r.targets[0].action, 'kept');
  assert.strictEqual(fs.readFileSync(file, 'utf8'), block + '\n');
});

it('a compact target opted out stays opted out', () => {
  const h = home();
  const mem = mk(h, '.codeium', 'windsurf', 'memories');
  const file = path.join(mem, 'global_rules.md');
  fs.writeFileSync(file, R.OPTOUT + '\n');
  const r = A.apply(opts(h, { extraTargets: [target('windsurf')] }));
  assert.strictEqual(r.targets[0].action, 'opted-out');
  assert.strictEqual(fs.readFileSync(file, 'utf8'), R.OPTOUT + '\n');
});

it('scope: --claude-only selects no extra target; --agent picks by the hub or skills-CLI id', () => {
  assert.deepStrictEqual(IT.select({ claudeOnly: true }), []);
  assert.strictEqual(IT.select({}).length, IT.EXTRA_TARGETS.length);
  assert.deepStrictEqual(IT.select({ agents: ['kiro-cli', 'codex'] }).map((t) => t.agent), ['kiro']);
  assert.deepStrictEqual(IT.select({ agents: ['kimi-code-cli'] }).map((t) => t.agent), ['agents']);
});

it('describe names the reported hosts: OpenCode and Copilot fallback, Hermes manual step', () => {
  const h = home();
  mk(h, '.config', 'opencode');
  fs.writeFileSync(path.join(h, '.config', 'opencode', 'opencode.json'), '{}');
  mk(h, '.hermes');
  fs.writeFileSync(path.join(h, '.hermes', 'SOUL.md'), 'persona');
  mk(h, '.vscode', 'extensions', 'github.copilot-chat-0.36.2');
  const rows = IT.describe(h, { env: ENV, which: NOBIN });
  const by = (a) => rows.find((r) => r.agent === a);
  assert.strictEqual(by('opencode').present, true);
  assert.strictEqual(by('opencode').fallbackActive, true);
  assert.strictEqual(by('opencode').fallback, path.join(h, '.claude', 'CLAUDE.md'));
  fs.writeFileSync(path.join(h, '.config', 'opencode', 'AGENTS.md'), '# own\n');
  assert.strictEqual(IT.describe(h, { env: ENV, which: NOBIN }).find((r) => r.agent === 'opencode').fallbackActive, false);
  assert.strictEqual(by('copilot').present, true);
  assert.strictEqual(by('hermes').kind, 'reported');
  assert.ok(/Not written/.test(by('hermes').manual));
  assert.strictEqual(by('kimi').servedBy, 'agents');
});

it('the code this change added carries no em dash in text a person reads', () => {
  for (const f of ['lib/instruction-targets.js', 'lib/atomicwrite.js']) {
    const text = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.ok(!text.includes('\u2014'), `${f} carries U+2014`);
  }
});

// Three real runs of the CLI against one HOME: the bytes of every extra target are
// identical after runs 1, 2 and 3 (CLAUDE.md "prove idempotence where repetition happens").
it('three `routers --update` runs leave every extra target byte-identical', () => {
  const h = home();
  mk(h, '.claude');
  fs.writeFileSync(path.join(h, '.claude', 'CLAUDE.md'), '# mine\n');
  mk(h, '.sshlg-skills');
  fs.writeFileSync(path.join(h, '.sshlg-skills', 'state.json'), JSON.stringify({ routers: 'yes' }) + '\n');
  mk(h, '.zcode', 'cli');
  mk(h, '.codeium', 'windsurf', 'memories');
  fs.writeFileSync(path.join(h, '.codeium', 'windsurf', 'memories', 'global_rules.md'), 'Prefer small diffs.\n');
  mk(h, '.warp');
  fs.writeFileSync(path.join(h, '.warp', 'settings.toml'), '');
  mk(h, '.agents', 'skills');
  fs.writeFileSync(path.join(h, '.agents', 'AGENTS.md'), '# shared\n');
  const files = [
    path.join(h, '.zcode', 'AGENTS.md'),
    path.join(h, '.codeium', 'windsurf', 'memories', 'global_rules.md'),
    path.join(h, '.agents', 'AGENTS.md'),
  ];
  const runs = [];
  for (let i = 0; i < 3; i += 1) {
    const r = spawnSync(process.execPath, [BIN, 'routers', '--update'], {
      encoding: 'utf8', env: { HOME: h, PATH: path.dirname(process.execPath) },
    });
    assert.strictEqual(r.status, 0, (r.stdout || '') + (r.stderr || ''));
    runs.push(files.map((f) => (fs.existsSync(f) ? sha(f) : 'absent')));
  }
  assert.ok(runs[0].every((x) => x !== 'absent'), `not every target was written: ${JSON.stringify(runs[0])}`);
  assert.deepStrictEqual(runs[1], runs[0]);
  assert.deepStrictEqual(runs[2], runs[0]);
  if (process.env.SSHLG_PRINT_HASHES) console.log(JSON.stringify(runs));
  assert.ok(fs.readFileSync(files[1], 'utf8').length <= 6000);
});

// B-283: `sshlg-routing.md` in Kiro's steering directory is a file the hub names and
// creates. Uninstall removes it (backup first) when the block was all it held; a file
// the operator added text to keeps that text.
it('afterRemoval: an own file left empty is deleted, any other text is written back', () => {
  const kiro = target('kiro');
  const block = `${R.BEGIN}\n## routing\nbody\n${R.END}\n`;
  assert.strictEqual(kiro.ownFile, true);
  assert.strictEqual(IT.afterRemoval(kiro, block).action, 'delete');
  assert.strictEqual(IT.afterRemoval(kiro, block + '\n\n').action, 'delete');
  const mine = IT.afterRemoval(kiro, block + '\n# mine\n');
  assert.strictEqual(mine.action, 'write');
  assert.strictEqual(mine.text.trim(), '# mine');
  assert.strictEqual(IT.afterRemoval(kiro, '# no block here\n').action, 'none');
  for (const t of IT.EXTRA_TARGETS.filter((x) => x.agent !== 'kiro')) {
    assert.ok(!t.ownFile, `${t.agent}: a host-named file is never the hub's to delete`);
    assert.strictEqual(IT.afterRemoval(t, block).action, 'write', t.agent);
  }
});

function kiroHome() {
  const h = home();
  mk(h, '.claude');
  fs.writeFileSync(path.join(h, '.claude', 'CLAUDE.md'), '# mine\n');
  mk(h, '.sshlg-skills');
  fs.writeFileSync(path.join(h, '.sshlg-skills', 'state.json'), JSON.stringify({ routers: 'yes' }) + '\n');
  mk(h, '.kiro', 'steering');
  return h;
}
const runIn = (h, args) => spawnSync(process.execPath, [BIN].concat(args), { encoding: 'utf8', env: { HOME: h, PATH: path.dirname(process.execPath) } });

it('uninstall removes the Kiro steering file the hub created when the block was its only content', () => {
  const h = kiroHome();
  const file = path.join(h, '.kiro', 'steering', 'sshlg-routing.md');
  assert.strictEqual(runIn(h, ['routers', '--update']).status, 0);
  assert.ok(fs.readFileSync(file, 'utf8').includes(R.BEGIN), 'the block was not written');
  const before = fs.readFileSync(file, 'utf8');
  const dry = runIn(h, ['uninstall', '--no-claude', '--dry-run']);
  assert.ok(/sshlg-routing\.md/.test(dry.stdout), dry.stdout.slice(0, 400));
  assert.ok(fs.existsSync(file), 'the dry run removed it');
  const r = runIn(h, ['uninstall', '--no-claude']);
  assert.ok(!fs.existsSync(file), (r.stdout || '') + (r.stderr || ''));
  assert.match(r.stdout, /routers: removed .*sshlg-routing\.md \(the hub created it and the block was all it held; copy: /);
  const backups = fs.readdirSync(path.join(h, '.sshlg-skills', 'backups')).filter((n) => n.startsWith('sshlg-routing.md--v2-'));
  assert.ok(backups.some((n) => fs.readFileSync(path.join(h, '.sshlg-skills', 'backups', n), 'utf8') === before), 'no backup of the file');
  assert.ok(fs.existsSync(path.join(h, '.kiro', 'steering')), 'the steering directory is Kiro\'s and stays');
});

it('uninstall keeps a Kiro steering file the operator added text to, without the block', () => {
  const h = kiroHome();
  const file = path.join(h, '.kiro', 'steering', 'sshlg-routing.md');
  assert.strictEqual(runIn(h, ['routers', '--update']).status, 0);
  fs.appendFileSync(file, '\n# my own steering\n');
  runIn(h, ['uninstall', '--no-claude']);
  assert.ok(fs.existsSync(file), 'a file holding operator text was deleted');
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(!after.includes(R.BEGIN));
  assert.ok(after.includes('# my own steering'));
});

// B-282: ZCode's onboarding can migrate ~/.claude/CLAUDE.md over ~/.zcode/AGENTS.md.
it('the ZCode row names the onboarding migration and its remedy in hosts', () => {
  const z = target('zcode');
  assert.match(z.note, /onboarding/);
  assert.match(z.note, /~\/\.claude\/CLAUDE\.md/);
  assert.match(z.note, /npx sshlg-skills update/);
  const h = home();
  mk(h, '.zcode', 'cli');
  assert.strictEqual(IT.describe(h, { env: ENV, which: NOBIN }).find((r) => r.agent === 'zcode').note, z.note);
  const r = runIn(h, ['hosts']);
  assert.ok(r.stdout.includes(z.note), r.stdout.slice(-1500));
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
