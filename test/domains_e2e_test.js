#!/usr/bin/env node
'use strict';
// `domains` run for real against fixture projects in a scratch HOME.
//
// One project per domain, one with no domain (whose NAME and README name all four, so a
// name-based detector would fail), one called for only by 60-day usage, and one whose
// git does not ignore `.claude/settings.local.json` — that one must be refused, and its
// refusal must keep its member on at user scope (add before remove). Three `--apply` runs
// leave identical bytes; `--revert` returns every original byte and removes what it
// created; every write to an existing file left a backup first.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-dom-')));
const root = path.join(home, 'DATA');
const env = Object.assign({}, process.env, {
  HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1', GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'), XDG_CONFIG_HOME: path.join(home, '.config'),
});
delete env.SSHLG_PROJECTS_ROOT;
const w = (abs, text) => { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); return abs; };
const S = (o) => JSON.stringify(o, null, 2) + '\n';
const IGNORE = '.claude/settings.local.json\n';
function project(name, files, ignore) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  const g = spawnSync('git', ['init', '-q', dir], { env, encoding: 'utf8' });
  if (g.status !== 0) throw new Error(`git init: ${g.stderr}`);
  if (ignore !== false) w(path.join(dir, '.gitignore'), IGNORE);
  for (const [rel, text] of Object.entries(files)) w(path.join(dir, rel), text);
  return dir;
}

const P = {
  web3d: project('p-web3d', { 'package.json': S({ dependencies: { three: '^0.186.1', '@react-three/fiber': '9' } }) }),
  tg: project('p-tg', { 'bot/requirements.txt': 'aiogram==3.4.1\n' }),
  xr: project('p-xr', { 'app/src/main/AndroidManifest.xml': '<manifest><category android:name="com.oculus.intent.category.VR"/></manifest>\n' }),
  money: project('p-money', {
    'package.json': S({ dependencies: { '@stripe/stripe-js': '4', '@sentry/node': '8' } }),
    '.claude/settings.local.json': S({ permissions: { allow: ['Bash(ls)'] } }),
    'web/index.html': '<script async src="https://www.googletagmanager.com/gtag/js?id=G-1"></script>\n',
  }),
  // The name and the README say three.js, Telegram, Stripe and Quest; the dependencies
  // say nothing. A vendored three inside node_modules is not the project's dependency.
  none: project('three-telegram-stripe-quest', {
    'package.json': S({ dependencies: { react: '18' } }),
    'README.md': 'A three.js scene, a Telegram bot, Stripe checkout and a Quest build.\n',
    'node_modules/three/package.json': S({ name: 'three', dependencies: { stripe: '1' } }),
    'node_modules/webxr-polyfill/index.js': 'if (navigator.xr) { gtag("config", "G-1"); }\n',
  }),
  used: project('p-used', { 'README.md': 'nothing declared\n' }),
  noignore: project('p-noignore', { 'package.json': S({ dependencies: { grammy: '1' } }) }, false),
};
w(path.join(home, '.sshlg-skills', 'usage', 'skill-usage-60d-2026-10-13.tsv'),
  `   2 ${P.used.replace(/[^A-Za-z0-9]/g, '-')}\tquest-store\n   5 ${P.none.replace(/[^A-Za-z0-9]/g, '-')}\tsuper-ux:copywriting\n`);
const USER = S({
  model: 'opus',
  enabledPlugins: {
    'task-pipeline@task-pipeline': true, 'xr-dev@xr-dev': true, 'web3d-dev@web3d-dev': true,
    'telegram-dev@telegram-dev': true, 'sheleg-dev@sheleg-dev': true, 'figma@claude-plugins-official': true,
  },
});
const settings = w(path.join(home, '.claude', 'settings.json'), USER);
const local = (dir) => path.join(dir, '.claude', 'settings.local.json');
const record = path.join(home, '.sshlg-skills', 'domains.json');
const MONEY_LOCAL = fs.readFileSync(local(P.money), 'utf8');

const run = (...args) => spawnSync(process.execPath, [BIN, ...args], { env, encoding: 'utf8', cwd: home });
const runIn = (cwd, ...args) => spawnSync(process.execPath, [BIN, ...args], { env, encoding: 'utf8', cwd });
const sha = (p) => (fs.existsSync(p) ? crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') : 'absent');
const watched = () => [settings, record, ...Object.values(P).map(local)];
const snapshot = () => watched().map(sha);
const enabled = (file) => (JSON.parse(fs.readFileSync(file, 'utf8')).enabledPlugins || {});

const before = snapshot();
const preview = run('domains');
it('the preview exits 0 and writes nothing', () => {
  assert.strictEqual(preview.status, 0, preview.stderr + preview.stdout);
  assert.deepStrictEqual(snapshot(), before);
});
it('the preview names each member with its evidence, the refusal, and the removals', () => {
  const o = preview.stdout;
  assert.ok(o.includes('package.json: three'), o);
  assert.ok(o.includes('bot/requirements.txt: aiogram'), o);
  assert.ok(o.includes('com.oculus.intent.category.VR'), o);
  assert.ok(o.includes('web/index.html: googletagmanager.com/gtag/js'), 'source evidence through git grep is missing');
  assert.ok(o.includes('used 60d: 2 call'), o);
  assert.ok(/p-noignore[^\n]*refused/.test(o), o);
  assert.ok(/- ~\/\.claude\/settings\.json[^\n]*xr-dev@xr-dev[^\n]*true → false/.test(o), o);
  assert.ok(!o.includes('RM-23'), 'a private board id reached public output');
  assert.ok(!/Fabric/.test(o), 'a Fabric line on a machine without Fabric');
  assert.ok(!o.includes('three-telegram-stripe-quest'), 'a project with no evidence was listed');
});

it('before any --apply, the update step prints one line and writes nothing', () => {
  const r = run('domains', '--update-step');
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.ok(/project\(s\) call for a domain member[^\n]*`npx sshlg-skills domains`/.test(r.stdout), r.stdout);
  assert.ok(!r.stdout.includes('p-web3d'), 'the one-liner names projects');
  assert.deepStrictEqual(snapshot(), before);
});

const hashes = [];
const applies = [];
for (let i = 0; i < 3; i += 1) {
  const r = run('domains', '--apply');
  applies.push(r);
  it(`--apply run ${i + 1} exits 0`, () => assert.strictEqual(r.status, 0, r.stderr + r.stdout));
  hashes.push(snapshot());
}
it('three --apply runs leave identical bytes', () => {
  assert.deepStrictEqual(hashes[1], hashes[0]);
  assert.deepStrictEqual(hashes[2], hashes[1]);
});

it('each domain project gets its member at project scope, read back from the file', () => {
  assert.deepStrictEqual(enabled(local(P.web3d)), { 'web3d-dev@web3d-dev': true });
  assert.deepStrictEqual(enabled(local(P.tg)), { 'telegram-dev@telegram-dev': true });
  assert.deepStrictEqual(enabled(local(P.xr)), { 'xr-dev@xr-dev': true });
  assert.deepStrictEqual(enabled(local(P.used)), { 'xr-dev@xr-dev': true });
  const money = JSON.parse(fs.readFileSync(local(P.money), 'utf8'));
  assert.deepStrictEqual(money, { permissions: { allow: ['Bash(ls)'] }, enabledPlugins: { 'sheleg-dev@sheleg-dev': true } });
});
it('the no-domain project and the refused project get no file', () => {
  assert.ok(!fs.existsSync(local(P.none)));
  assert.ok(!fs.existsSync(local(P.noignore)));
});
it('user scope: written members off; the refused one stays on; core and others untouched', () => {
  const u = JSON.parse(fs.readFileSync(settings, 'utf8'));
  assert.strictEqual(u.model, 'opus');
  assert.deepStrictEqual(u.enabledPlugins, {
    'task-pipeline@task-pipeline': true, 'xr-dev@xr-dev': false, 'web3d-dev@web3d-dev': false,
    'telegram-dev@telegram-dev': true, 'sheleg-dev@sheleg-dev': false, 'figma@claude-plugins-official': true,
  });
  assert.ok(/telegram-dev@telegram-dev[^\n]*stays on/.test(applies[0].stdout), applies[0].stdout);
});
it('every write to an existing file left a backup holding its original bytes', () => {
  const dir = path.join(home, '.sshlg-skills', 'backups');
  const all = fs.readdirSync(dir).map((n) => fs.readFileSync(path.join(dir, n), 'utf8'));
  assert.ok(all.includes(USER), 'no backup of settings.json');
  assert.ok(all.includes(MONEY_LOCAL), 'no backup of the project settings.local.json');
});

it('hosts prints the per-project domain summary as counts', () => {
  const r = run('hosts');
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/xr-dev\s+user scope off \(by domains\)[^\n]*evidence in 2 project\(s\), enabled in 2/.test(r.stdout), r.stdout);
  assert.ok(/telegram-dev\s+user scope on[^\n]*evidence in 2 project\(s\), enabled in 1/.test(r.stdout), r.stdout);
  for (const d of Object.values(P)) assert.ok(!r.stdout.includes(path.basename(d)), `hosts named ${path.basename(d)}`);
});

// `update` keeps it true: a project that gains a dependency gets its member on the next
// run of the step `update` calls — the same function `--apply` runs once a record exists.
it('a project that gains a domain dependency gets its member at the next update step', () => {
  const later = project('p-later', { 'package.json': S({ dependencies: { '@react-three/drei': '9' } }) });
  const r = run('domains', '--update-step');
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.deepStrictEqual(enabled(local(later)), { 'web3d-dev@web3d-dev': true });
  fs.rmSync(later, { recursive: true, force: true });
});

it('--revert returns every original byte and removes the files it created', () => {
  const r = run('domains', '--revert');
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
  assert.strictEqual(fs.readFileSync(local(P.money), 'utf8'), MONEY_LOCAL);
  for (const k of ['web3d', 'tg', 'xr', 'used']) {
    assert.ok(!fs.existsSync(local(P[k])), `${k}: created file left behind`);
    assert.ok(!fs.existsSync(path.join(P[k], '.claude')), `${k}: created directory left behind`);
  }
  assert.ok(!fs.existsSync(record), 'the ownership record outlived the revert');
});

it('--revert keeps a value the operator changed after --apply', () => {
  assert.strictEqual(run('domains', '--apply').status, 0);
  const u = JSON.parse(fs.readFileSync(settings, 'utf8'));
  u.enabledPlugins['xr-dev@xr-dev'] = true; // the operator turns it back on by hand
  fs.writeFileSync(settings, S(u));
  const again = run('domains', '--apply');
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['xr-dev@xr-dev'], true, again.stdout);
  assert.strictEqual(run('domains', '--revert').status, 0);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
});

it('a project file in another format is refused in the preview AND the apply, like an ignore refusal', () => {
  fs.writeFileSync(local(P.money), '{"permissions":{}}\n'); // not the format Claude Code writes
  const pre = run('domains');
  assert.ok(/p-money[^\n]*refused — the file is not in the 2-space/.test(pre.stdout), pre.stdout);
  const r = run('domains', '--apply');
  assert.strictEqual(r.status, 0, 'a planned refusal exits like an ignore refusal');
  assert.ok(/p-money[^\n]*refused/.test(r.stdout), r.stdout);
  assert.strictEqual(fs.readFileSync(local(P.money), 'utf8'), '{"permissions":{}}\n');
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['sheleg-dev@sheleg-dev'], true, r.stdout);
  assert.strictEqual(run('domains', '--revert').status, 0);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
  fs.writeFileSync(local(P.money), MONEY_LOCAL);
});

it('a negated ignore rule is not "ignored": that project is refused and keeps its member', () => {
  const neg = project('p-negated', { 'package.json': S({ dependencies: { three: '1' } }) }, false);
  w(path.join(neg, '.gitignore'), '*.local.json\n!.claude/settings.local.json\n');
  const r = run('domains', '--apply');
  assert.ok(/p-negated[^\n]*refused/.test(r.stdout), r.stdout);
  assert.ok(!fs.existsSync(local(neg)), 'wrote a file git would commit');
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['web3d-dev@web3d-dev'], true);
  assert.strictEqual(run('domains', '--revert').status, 0);
  fs.rmSync(neg, { recursive: true, force: true });
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
});

it('a member already off by domains comes back on when a later project cannot get its entry', () => {
  assert.strictEqual(run('domains', '--apply').status, 0);
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['web3d-dev@web3d-dev'], false);
  const late = project('p-late-unignored', { 'package.json': S({ dependencies: { three: '1' } }) }, false);
  const r = run('domains', '--update-step');
  assert.ok(/p-late-unignored[^\n]*refused/.test(r.stdout), r.stdout);
  assert.ok(!/every project with evidence has its member/.test(r.stdout), r.stdout);
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['web3d-dev@web3d-dev'], true, r.stdout);
  fs.rmSync(late, { recursive: true, force: true });
  assert.strictEqual(run('domains', '--revert').status, 0);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
});

it('a project write that throws is reported, the others are recorded, and --revert undoes them', () => {
  // A .claude directory nobody may write into: the read finds no file, the write throws EACCES.
  fs.mkdirSync(path.join(P.xr, '.claude'), { mode: 0o555 });
  const r = run('domains', '--apply');
  fs.chmodSync(path.join(P.xr, '.claude'), 0o755);
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.ok(!/at .*\.js:\d+/.test(r.stderr), `a stack trace: ${r.stderr}`);
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['xr-dev@xr-dev'], true, 'xr-dev went off with a project unwritten');
  assert.ok(fs.existsSync(record), 'no ownership record after a partial apply');
  assert.deepStrictEqual(enabled(local(P.web3d)), { 'web3d-dev@web3d-dev': true });
  assert.strictEqual(run('domains', '--revert').status, 0);
  assert.ok(!fs.existsSync(path.join(P.web3d, '.claude')), 'revert left the partial apply behind');
  fs.rmSync(path.join(P.xr, '.claude'), { recursive: true, force: true });
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
});

it('a project file that cannot be read is refused, not taken for absent', () => {
  fs.mkdirSync(local(P.xr), { recursive: true }); // a directory where the file should be
  const r = run('domains');
  assert.ok(/p-xr[^\n]*refused — cannot read/.test(r.stdout), r.stdout);
  fs.rmSync(path.join(P.xr, '.claude'), { recursive: true, force: true });
});

it('a malformed ownership record stops --apply and --revert with a reason', () => {
  w(record, JSON.stringify({ roots: 'x', user: {}, projects: {} }));
  for (const flag of ['--apply', '--revert']) {
    const r = run('domains', flag);
    assert.strictEqual(r.status, 1, flag + r.stdout + r.stderr);
    assert.ok(/domains\.json/.test(r.stdout) && !r.stderr.includes('TypeError'), r.stdout + r.stderr);
  }
  fs.rmSync(record);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
});

// ── fix round 1 (readings of e27a040) ──
const other = path.join(home, 'roots');
function projectIn(rootDir, name, files, ignore) {
  const dir = path.join(rootDir, name);
  fs.mkdirSync(dir, { recursive: true });
  spawnSync('git', ['init', '-q', dir], { env });
  if (ignore !== false) w(path.join(dir, '.gitignore'), IGNORE);
  for (const [rel, text] of Object.entries(files)) w(path.join(dir, rel), text);
  return dir;
}

it('bootstrap: --enable writes a manual entry in the cwd git root, later runs keep it, --disable removes it', () => {
  const fresh = project('p-fresh', { 'README.md': 'a Quest app, no code yet\n' });
  fs.mkdirSync(path.join(fresh, 'src'));
  const e = runIn(path.join(fresh, 'src'), 'domains', '--enable', 'xr-dev');
  assert.strictEqual(e.status, 0, e.stdout + e.stderr);
  assert.deepStrictEqual(enabled(local(fresh)), { 'xr-dev@xr-dev': true });
  const rec = JSON.parse(fs.readFileSync(record, 'utf8'));
  assert.deepStrictEqual(rec.manual[fresh], ['xr-dev']);
  const pre = run('domains');
  assert.ok(/p-fresh[^\n]*manual/.test(pre.stdout), pre.stdout);
  assert.strictEqual(run('domains', '--apply').status, 0);
  assert.deepStrictEqual(enabled(local(fresh)), { 'xr-dev@xr-dev': true });
  const d = run('domains', '--disable', 'xr-dev', '--project', fresh);
  assert.strictEqual(d.status, 0, d.stdout + d.stderr);
  assert.ok(!fs.existsSync(local(fresh)), 'the entry --enable created is still there');
  assert.ok(!(JSON.parse(fs.readFileSync(record, 'utf8')).manual || {})[fresh]);
  assert.strictEqual(run('domains', '--enable', 'nope-dev', '--project', fresh).status, 2);
  assert.strictEqual(run('domains', '--revert').status, 0);
  fs.rmSync(fresh, { recursive: true, force: true });
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
  assert.ok(!fs.existsSync(record));
});

it('a missing root, or a root with no git repositories, refuses --apply and --update-step', () => {
  fs.mkdirSync(other, { recursive: true });
  for (const root of [path.join(home, 'no-such-root'), other]) {
    const r = run('domains', '--apply', '--root', root);
    assert.strictEqual(r.status, 1, `--apply ${root}: ${r.stdout}`);
    assert.deepStrictEqual(fs.readFileSync(settings, 'utf8'), USER);
    assert.ok(!fs.existsSync(record), 'a refused root was recorded');
    // The update step on a machine where --apply ran, with its recorded root now gone.
    const rec = S({ roots: [root], applied: true, user: {}, projects: {}, manual: {} });
    w(record, rec);
    const u = run('domains', '--update-step');
    assert.strictEqual(u.status, 1, `--update-step ${root}: ${u.stdout}`);
    assert.strictEqual(fs.readFileSync(record, 'utf8'), rec, 'the update step rewrote the record');
    fs.rmSync(record);
  }
  // Where --apply never ran, a machine without ~/DATA must not turn `update` red.
  const none = run('domains', '--update-step', '--root', path.join(home, 'no-such-root'));
  assert.strictEqual(none.status, 0, none.stdout);
});

it('a project read only partly (broken git) blocks turning off every member it could not rule out', () => {
  const root2 = path.join(home, 'root2');
  projectIn(root2, 'good', { 'package.json': S({ dependencies: { three: '1' } }) });
  const broken = path.join(root2, 'broken');
  w(path.join(broken, '.git'), 'gitdir: /nowhere/at/all\n');
  w(path.join(broken, 'package.json'), S({ dependencies: { grammy: '1' } }));
  const r = run('domains', '--apply', '--root', root2);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const u = JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins;
  for (const k of ['xr-dev@xr-dev', 'web3d-dev@web3d-dev', 'sheleg-dev@sheleg-dev']) assert.strictEqual(u[k], true, `${k} off despite a partial scan\n${r.stdout}`);
  assert.ok(/broken[^\n]*not read in full/.test(r.stdout), r.stdout);
  assert.strictEqual(run('domains', '--revert').status, 0);
  fs.rmSync(root2, { recursive: true, force: true });
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
});

it('a symlinked repository under the root is followed, keyed by the link, deduplicated by realpath', () => {
  const root3 = path.join(home, 'root3');
  fs.mkdirSync(root3, { recursive: true });
  const outside = projectIn(path.join(home, 'outside'), 'real', { 'package.json': S({ dependencies: { three: '1' } }) });
  fs.symlinkSync(outside, path.join(root3, 'a-link'));
  fs.symlinkSync(outside, path.join(root3, 'b-link'));
  const r = run('domains', '--root', root3);
  assert.ok(/1 git repositor/.test(r.stdout), r.stdout);
  assert.ok(/\+ a-link: /.test(r.stdout) && !/b-link/.test(r.stdout), r.stdout);
  fs.rmSync(root3, { recursive: true, force: true });
  fs.rmSync(path.join(home, 'outside'), { recursive: true, force: true });
});

it('the update step only adds: it never turns a member off at user scope', () => {
  fs.writeFileSync(local(P.money), '{"permissions":{}}\n'); // sheleg-dev blocked at the first apply
  assert.strictEqual(run('domains', '--apply').status, 0);
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['sheleg-dev@sheleg-dev'], true);
  fs.writeFileSync(local(P.money), MONEY_LOCAL); // unblocked
  const r = run('domains', '--update-step');
  assert.strictEqual(r.status, 0, r.stdout);
  assert.deepStrictEqual(enabled(local(P.money)), { 'sheleg-dev@sheleg-dev': true });
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).enabledPlugins['sheleg-dev@sheleg-dev'], true, r.stdout);
  assert.ok(/domains --apply/.test(r.stdout), 'the update step does not say how to turn it off');
  assert.strictEqual(run('domains', '--revert').status, 0);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
  assert.strictEqual(fs.readFileSync(local(P.money), 'utf8'), MONEY_LOCAL);
});

it('an empty "enabledPlugins": {} the operator had survives --revert byte for byte', () => {
  const had = S({ enabledPlugins: {} });
  w(local(P.web3d), had);
  assert.strictEqual(run('domains', '--apply').status, 0);
  assert.deepStrictEqual(enabled(local(P.web3d)), { 'web3d-dev@web3d-dev': true });
  assert.strictEqual(run('domains', '--revert').status, 0);
  assert.strictEqual(fs.readFileSync(local(P.web3d), 'utf8'), had);
  fs.rmSync(path.join(P.web3d, '.claude'), { recursive: true, force: true });
});

it('--revert with an unreadable user settings.json keeps the entries and the record and exits 1', () => {
  assert.strictEqual(run('domains', '--apply').status, 0);
  fs.chmodSync(settings, 0o000);
  const r = run('domains', '--revert');
  fs.chmodSync(settings, 0o644);
  assert.strictEqual(r.status, 1, r.stdout);
  assert.ok(fs.existsSync(record));
  assert.deepStrictEqual(enabled(local(P.web3d)), { 'web3d-dev@web3d-dev': true });
  assert.strictEqual(run('domains', '--revert').status, 0);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), USER);
});

it('a hand-made {} domains.json is not "apply ran": the update step only prints its line', () => {
  w(record, '{}\n');
  const r = run('domains', '--update-step');
  assert.strictEqual(r.status, 0, r.stdout);
  assert.ok(/`npx sshlg-skills domains` previews/.test(r.stdout), r.stdout);
  assert.ok(!fs.existsSync(local(P.web3d)));
  fs.rmSync(record);
});

it('the Fabric line prints only where Fabric is installed, and names no private id', () => {
  const svc = path.join(home, 'Library', 'Application Support', 'ai.passioncode.fabric', 'services');
  fs.mkdirSync(svc, { recursive: true });
  const r = run('domains');
  fs.rmSync(path.join(home, 'Library'), { recursive: true, force: true });
  if (process.platform === 'darwin') assert.ok(/Fabric/.test(r.stdout), r.stdout);
  assert.ok(!r.stdout.includes('RM-23'));
});

it('--root points it at another projects directory', () => {
  const other = path.join(home, 'elsewhere');
  fs.mkdirSync(other);
  const r = run('domains', '--root', other);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/0 project\(s\) with evidence/.test(r.stdout), r.stdout);
});

fs.rmSync(home, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
