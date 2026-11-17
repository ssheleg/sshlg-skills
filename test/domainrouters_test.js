#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
// B-345: the router text of a domain member that is on in one project only, in
// `.claude/rules/sshlg-domains.md` there. The pure decisions first, then `domains` run for real
// in a scratch HOME: written where the member is on only in the project, ignored through the
// clone's own info/exclude, three runs leave the same bytes, authored wording wins, a file the
// person edited is left alone, and `--revert` returns every original byte.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const DR = require('../lib/domainrouters.js');
const { REGISTRY } = require('../lib/routers-registry.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const plugins = { 'xr-dev': 'xr-dev@xr-dev', 'web3d-dev': 'web3d-dev@web3d-dev', 'telegram-dev': 'telegram-dev@telegram-dev' };
const members = Object.keys(plugins);

it('a member needs its router here only when it is on in the project and not at user scope', () => {
  assert.deepStrictEqual(DR.membersFor({ members, plugins, project: { 'xr-dev@xr-dev': true }, user: { 'xr-dev@xr-dev': false } }), ['xr-dev']);
  assert.deepStrictEqual(DR.membersFor({ members, plugins, project: { 'xr-dev@xr-dev': true }, user: { 'xr-dev@xr-dev': true } }), [], 'the global block already carries it');
  assert.deepStrictEqual(DR.membersFor({ members, plugins, project: { 'xr-dev@xr-dev': false }, user: {} }), []);
  assert.deepStrictEqual(DR.membersFor({ members, plugins, project: { 'xr-dev@xr-dev': true }, user: {}, isEnabled: () => false }), [], 'routers.xr-dev off');
});

it('render: none is null; the packaged text, or the authored one when there is one', () => {
  assert.strictEqual(DR.render({ members: [], registry: REGISTRY }), null);
  const t = DR.render({ members: ['xr-dev'], registry: REGISTRY });
  assert.ok(t.startsWith(DR.HEAD) && t.includes(REGISTRY['xr-dev'].text.trim().split('\n')[0]), t);
  const a = DR.render({ members: ['xr-dev'], registry: REGISTRY, authored: () => 'My XR rule.' });
  assert.ok(a.endsWith('My XR rule.\n') && !a.includes(REGISTRY['xr-dev'].text.trim().split('\n')[0]));
  assert.ok(!/—/.test(DR.HEAD), 'an em dash in text a person reads');
});

it('decide: ours is written and removed; another\'s or an edited one is left alone', () => {
  const want = 'x\n';
  assert.strictEqual(DR.decide({ want, current: null }).action, 'write');
  assert.strictEqual(DR.decide({ want, current: want }).action, 'keep');
  assert.strictEqual(DR.decide({ want, current: 'old\n', recorded: DR.sha256('old\n') }).action, 'write');
  assert.strictEqual(DR.decide({ want, current: 'theirs\n' }).action, 'leave');
  assert.strictEqual(DR.decide({ want: null, current: 'old\n', recorded: DR.sha256('old\n') }).action, 'remove');
  assert.strictEqual(DR.decide({ want: null, current: 'edited\n', recorded: DR.sha256('old\n') }).action, 'leave');
  assert.strictEqual(DR.decide({ want: null, current: null }).action, 'keep');
});

// ── domains, for real ──
const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-domrt-')));
const env = Object.assign({}, process.env, {
  HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1', GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'), XDG_CONFIG_HOME: path.join(home, '.config'),
});
delete env.SSHLG_PROJECTS_ROOT;
const w = (abs, text) => { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); return abs; };
const dir = path.join(home, 'DATA', 'p-xr');
fs.mkdirSync(dir, { recursive: true });
spawnSync('git', ['init', '-q', dir], { env });
w(path.join(dir, '.gitignore'), '.claude/settings.local.json\n');
w(path.join(dir, 'app/src/main/AndroidManifest.xml'), '<manifest><category android:name="com.oculus.intent.category.VR"/></manifest>\n');
const USER = JSON.stringify({ enabledPlugins: { 'xr-dev@xr-dev': true, 'sheleg-dev@sheleg-dev': true } }, null, 2) + '\n';
const settings = w(path.join(home, '.claude', 'settings.json'), USER);
const rules = path.join(dir, DR.FILE);
const exclude = path.join(dir, '.git', 'info', 'exclude');
const EXCLUDE = fs.existsSync(exclude) ? fs.readFileSync(exclude, 'utf8') : null;
const run = (...args) => spawnSync(process.execPath, [BIN, ...args], { env, encoding: 'utf8', cwd: home });
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const XR_LINE = REGISTRY['xr-dev'].text.trim().split('\n')[0];

const runs = [1, 2, 3].map(() => run('domains', '--apply'));
it('--apply turns xr-dev off at user scope and writes its router text into the project', () => {
  for (const r of runs) assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(JSON.parse(read(settings)).enabledPlugins['xr-dev@xr-dev'], false, read(settings));
  assert.ok((read(rules) || '').includes(XR_LINE), read(rules));
});
it('the file is ignored through the clone\'s info/exclude and git does not see it', () => {
  assert.strictEqual(spawnSync('git', ['-C', dir, 'check-ignore', '-q', DR.FILE], { env }).status, 0);
  assert.ok(!/sshlg-domains/.test(spawnSync('git', ['-C', dir, 'status', '--porcelain'], { env, encoding: 'utf8' }).stdout));
});
it('three runs leave the same bytes', () => {
  const a = [read(rules), read(exclude)];
  run('domains', '--apply');
  assert.deepStrictEqual([read(rules), read(exclude)], a);
  assert.strictEqual((read(exclude).match(/sshlg-domains\.md/g) || []).length, 1, read(exclude));
});
it('authored wording wins over the packaged text', () => {
  const cfg = path.join(home, '.sshlg-skills', 'config.json');
  const prior = read(cfg);
  w(cfg, JSON.stringify(Object.assign(prior ? JSON.parse(prior) : {}, { authored: { 'xr-dev': 'My own XR routing rule.' } }), null, 2));
  assert.strictEqual(run('domains', '--apply').status, 0);
  assert.ok(read(rules).includes('My own XR routing rule.') && !read(rules).includes(XR_LINE), read(rules));
  if (prior === null) fs.rmSync(cfg); else w(cfg, prior);
  assert.strictEqual(run('domains', '--apply').status, 0);
  assert.ok(read(rules).includes(XR_LINE));
});
it('a file the person edited is left alone by --revert, which still restores the rest', () => {
  const ours = read(rules);
  w(rules, ours + '\nmy own note\n');
  const r = run('domains', '--revert');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.ok(/left alone: edited since/.test(r.stdout), r.stdout);
  assert.ok(read(rules).endsWith('my own note\n'));
  assert.strictEqual(read(settings), USER);
  fs.rmSync(path.join(dir, '.claude'), { recursive: true });   // the person clears what they kept
});
it('--revert after --apply returns every original byte and removes what it created', () => {
  assert.strictEqual(run('domains', '--apply').status, 0);
  assert.ok(read(rules));
  const r = run('domains', '--revert');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(read(rules), null);
  assert.ok(!fs.existsSync(path.join(dir, '.claude')), 'a directory it created is left behind: ' + spawnSync('find', [path.join(dir, '.claude')], { encoding: 'utf8' }).stdout + r.stdout);
  assert.strictEqual(read(settings), USER);
  assert.strictEqual(read(exclude), EXCLUDE, 'info/exclude not restored');
});

fs.rmSync(home, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
