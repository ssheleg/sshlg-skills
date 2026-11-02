#!/usr/bin/env node
'use strict';
// B-284: the routing block reaches Hermes as the hub's own plugin, two system-prompt
// sections within Hermes' caps (4,000 a section, 8,000 for all plugins; Hermes Agent 0.22.2).
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('../lib/apply.js');
const IT = require('../lib/instruction-targets.js');
const HP = require('../lib/hermes-plugin.js');
const registry = require('../lib/routers-registry.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); console.log(`ok ${name}`); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
const ALL = Object.fromEntries(registry.order().map((n) => [n, registry.REGISTRY[n].text]));
const MEMBERS = require('../skills.json').skills;
const ROW = IT.EXTRA_TARGETS.find((t) => t.agent === 'hermes');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function home() {
  const h = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hermes-')));
  fs.mkdirSync(path.join(h, '.hermes'), { recursive: true });
  fs.writeFileSync(path.join(h, '.hermes', 'config.yaml'), 'plugins:\n  enabled: []\n');
  return h;
}
/** A Hermes CLI that keeps plugins.enabled in memory and records every call. */
function fakeHermes(initial) {
  const state = { enabled: (initial || []).slice(), calls: [] };
  const run = (args) => {
    state.calls.push(args.join(' '));
    if (args[0] === 'config' && args[1] === 'get') return { ok: true, out: JSON.stringify(state.enabled), said: '' };
    if (args[0] === 'plugins' && args[1] === 'enable') { state.enabled.push(args[2]); return { ok: true, out: '', said: 'enabled' }; }
    return { ok: false, said: `unexpected: ${args.join(' ')}` };
  };
  return { state, run };
}
const opts = (h, more) => Object.assign({ home: h, env: { PATH: '' }, which: () => null, hostTargets: [], includeCursor: false,
  mode: 'update', consentRecorded: 'yes', consent: 'yes', routers: ALL, members: MEMBERS, star: true, log: () => {} }, more || {});
const run = (h, more) => A.apply(opts(h, Object.assign({ extraTargets: [ROW] }, more))).targets[0];
const dir = (h) => path.join(h, '.hermes', 'plugins', 'sshlg-routing');

it('the block splits before the router table into two sections, each within 4,000', () => {
  const block = A.renderCompact(ALL, { members: MEMBERS, star: true });
  const p = HP.parts(block);
  assert.strictEqual(p.length, 2);
  assert.ok(p[1].startsWith('<!-- SSHLG:ROUTERS:TABLE:BEGIN -->'));
  for (const x of p) assert.ok(x.length <= HP.SECTION_CAP, `${x.length}`);
  assert.strictEqual(HP.overCap(block), null);
});

it('a section over 4,000 or a total over 8,000 is refused, never cut', () => {
  assert.match(HP.overCap('x'.repeat(4001)), /section 1 .* 4001/);
  const table = '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->';
  assert.match(HP.overCap('a'.repeat(3990) + table + 'b'.repeat(4100)), /section 2/);
  assert.strictEqual(HP.overCap('a'.repeat(3990) + table + 'b'.repeat(3900)), null);
});

it('update writes the block, the plugin files and enables the plugin once; three runs, identical bytes', () => {
  const h = home();
  const fake = fakeHermes();
  const r = run(h, { hermesRun: fake.run });
  assert.strictEqual(r.action, 'created', JSON.stringify(r));
  assert.strictEqual(r.plugin.enabled, 'enabled');
  const files = ['routing.md', 'plugin.yaml', '__init__.py'].map((f) => path.join(dir(h), f));
  const before = files.map(sha);
  for (let i = 0; i < 2; i++) {
    const again = run(h, { hermesRun: fake.run });
    assert.strictEqual(again.action, 'unchanged');
    assert.strictEqual(again.plugin.enabled, 'already');
  }
  assert.deepStrictEqual(files.map(sha), before);
  assert.strictEqual(fake.state.calls.filter((c) => c.startsWith('plugins enable')).length, 1);
  assert.deepStrictEqual(fake.state.enabled, ['sshlg-routing']);
  assert.strictEqual(fs.readFileSync(files[1], 'utf8'), HP.PLUGIN_YAML);
  // config.yaml was copied before Hermes changed it
  const backups = path.join(h, '.sshlg-skills', 'backups');
  assert.ok(fs.existsSync(backups) && JSON.stringify(fs.readdirSync(backups, { recursive: true })).includes('config.yaml'));
});

it('the Python plugin registers two sections that render the two parts, and nothing after an opt-out', () => {
  const py = spawnSync('python3', ['--version']);
  if (py.error) return;   // no Python on this runner: the JS split above is still checked
  const h = home();
  run(h, { hermesRun: fakeHermes().run });
  const probe = [
    'import importlib.util, json, sys',
    'spec = importlib.util.spec_from_file_location("p", sys.argv[1])',
    'm = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)',
    'got = []',
    'class Ctx:',
    '    def register_system_prompt_section(self, id, content, position, max_chars):',
    '        got.append([id, position, max_chars, content({})])',
    'm.register(Ctx())',
    'print(json.dumps(got))',
  ].join('\n');
  const read = () => JSON.parse(spawnSync('python3', ['-c', probe, path.join(dir(h), '__init__.py')], { encoding: 'utf8' }).stdout);
  const got = read();
  const block = A.renderCompact(ALL, { members: MEMBERS, star: true });
  assert.deepStrictEqual(got.map((g) => [g[0], g[1], g[2]]), [['sshlg.routing', 'after_memory', 4000], ['sshlg.routing.table', 'after_memory', 4000]]);
  assert.deepStrictEqual(got.map((g) => g[3]), HP.parts(block));
  fs.writeFileSync(path.join(dir(h), 'routing.md'), '<!-- SSHLG:ROUTERS:OPTOUT -->\n');
  assert.deepStrictEqual(read().map((g) => g[3]), ['', '']);
  fs.unlinkSync(path.join(dir(h), 'routing.md'));
  assert.deepStrictEqual(read().map((g) => g[3]), ['', '']);
});

it('a "no" leaves no plugin directory; no consent writes nothing', () => {
  const h = home();
  const fake = fakeHermes();
  assert.strictEqual(run(h, { consent: 'no', hermesRun: fake.run }).action, 'absent');
  assert.ok(!fs.existsSync(dir(h)));
  run(h, { consent: 'undecided', consentRecorded: undefined, hermesRun: fake.run });
  assert.ok(!fs.existsSync(dir(h)));
  assert.deepStrictEqual(fake.state.calls, []);
});

it('a dry run writes nothing and runs no Hermes command', () => {
  const h = home();
  const fake = fakeHermes();
  const r = run(h, { dryRun: true, hermesRun: fake.run });
  assert.strictEqual(r.action, 'would-write');
  assert.ok(!fs.existsSync(dir(h)));
  assert.deepStrictEqual(fake.state.calls, []);
});

it('a plugin file somebody else wrote is kept and the plugin is not enabled', () => {
  const h = home();
  fs.mkdirSync(dir(h), { recursive: true });
  fs.writeFileSync(path.join(dir(h), '__init__.py'), '# mine\n');
  const fake = fakeHermes();
  const r = run(h, { hermesRun: fake.run });
  assert.strictEqual(r.plugin.files, 'kept');
  assert.strictEqual(fs.readFileSync(path.join(dir(h), '__init__.py'), 'utf8'), '# mine\n');
  assert.ok(!fake.state.calls.some((c) => c.startsWith('plugins enable')));
  assert.ok(r.plugin.lines.some((l) => /not written by sshlg-skills/.test(l)));
});

it('without the hermes CLI the block is written and the remedy is named', () => {
  const h = home();
  const r = run(h, { hermesRun: () => ({ ok: false, missing: true, said: 'spawn hermes ENOENT' }) });
  assert.strictEqual(r.action, 'created');
  assert.strictEqual(r.plugin.enabled, 'unread');
  assert.ok(r.plugin.lines.some((l) => /Run: hermes plugins enable sshlg-routing/.test(l)), r.plugin.lines.join('\n'));
});

it('an enable that exits 0 but does not list the plugin is a failure, not a success', () => {
  const h = home();
  const r = run(h, { hermesRun: (args) => (args[0] === 'config' ? { ok: true, out: '[]', said: '' } : { ok: true, out: '', said: '' }) });
  assert.strictEqual(r.plugin.enabled, 'failed');
});

it('uninstall treats routing.md as the hub\'s own file', () => {
  assert.strictEqual(ROW.ownFile, true);
  assert.strictEqual(IT.afterRemoval(ROW, A.renderCompact(ALL, { members: MEMBERS }) + '\n').action, 'delete');
});

if (failures.length) {
  for (const f of failures) console.log(`FAIL: ${f}`);
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
