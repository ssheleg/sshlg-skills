'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin/sshlg-skills.js');
let checks = 0;
const failures = [];
function test(name, fn) {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'domains-profile-')));
  const write = (rel, text) => { const file = path.join(home, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); return file; };
  const json = (rel, value) => write(rel, JSON.stringify(value, null, 2) + '\n');
  const project = path.join(home, 'DATA', 'project');
  const user = JSON.stringify({ enabledPlugins: { 'web3d-dev@web3d-dev': true, 'xr-dev@xr-dev': true } }, null, 2) + '\n';
  const defaults = write('.claude/settings.json', user);
  const activeRoot = path.join(home, 'active profile');
  const active = write('active profile/settings.json', user);
  write('DATA/project/package.json', '{"dependencies":{"three":"1"}}');
  write('DATA/project/.gitignore', '.claude/settings.local.json\n');
  const env = { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: activeRoot, SSHLG_PROJECTS_ROOT: path.join(home, 'DATA'), SSHLG_SKILLS_NO_UPDATE_CHECK: '1', GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'), GIT_CONFIG_NOSYSTEM: '1' };
  const init = spawnSync('git', ['init', '-q', project], { env, encoding: 'utf8' });
  assert.strictEqual(init.status, 0, init.stderr);
  const runAt = (profile, ...args) => spawnSync(process.execPath, [BIN, 'domains', ...args], { cwd: project, env: { ...env, CLAUDE_CONFIG_DIR: profile }, encoding: 'utf8' });
  const run = (...args) => runAt(activeRoot, ...args);
  const record = path.join(home, '.sshlg-skills/domains.json');
  const local = path.join(project, '.claude/settings.local.json');
  const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const snapshot = () => [defaults, active, record, local].map(read);
  checks++;
  try { fn({ home, write, json, project, user, defaults, activeRoot, active, env, runAt, run, record, local, read, snapshot }); }
  catch (e) { failures.push(`${name}: ${e.message}`); }
  finally { fs.rmSync(home, { recursive: true, force: true }); }
}
const ok = (r) => assert.strictEqual(r.status, 0, r.stdout + r.stderr);

test('apply and revert target the relocated profile and retain default bytes', (m) => {
  ok(m.run('--apply'));
  assert.strictEqual(JSON.parse(m.read(m.active)).enabledPlugins['web3d-dev@web3d-dev'], false);
  assert.strictEqual(m.read(m.defaults), m.user);
  assert.strictEqual(JSON.parse(m.read(m.record)).profile, fs.realpathSync(m.active));
  assert.strictEqual(JSON.parse(m.read(m.local)).enabledPlugins['web3d-dev@web3d-dev'], true);
  ok(m.run('--revert'));
  assert.strictEqual(m.read(m.active), m.user);
  assert.strictEqual(m.read(m.defaults), m.user);
  assert.strictEqual(m.read(m.local), null);
});

test('changing profiles cannot redirect owned apply, update, manual changes or revert', (m) => {
  ok(m.run('--apply'));
  const before = m.snapshot();
  for (const args of [['--apply'], ['--update-step'], ['--revert'], ['--enable', 'xr-dev'], ['--disable', 'web3d-dev']]) {
    const r = m.runAt(path.join(m.home, '.claude'), ...args);
    assert.strictEqual(r.status, 1, r.stdout + r.stderr);
    assert.deepStrictEqual(m.snapshot(), before);
    assert.match(r.stdout, /profile/i);
  }
  ok(m.run('--revert'));
});

test('legacy ownership belongs to the default profile and cannot migrate by environment', (m) => {
  ok(m.runAt(path.join(m.home, '.claude'), '--apply'));
  const legacy = JSON.parse(m.read(m.record)); delete legacy.profile; m.json('.sshlg-skills/domains.json', legacy);
  const before = m.snapshot();
  const refused = m.run('--revert');
  assert.strictEqual(refused.status, 1, refused.stdout + refused.stderr);
  assert.deepStrictEqual(m.snapshot(), before);
  ok(m.runAt(path.join(m.home, '.claude'), '--revert'));
  assert.strictEqual(m.read(m.defaults), m.user);
});

test('aliases of the same profile retain the same ownership identity', (m) => {
  ok(m.run('--apply'));
  const alias = path.join(m.home, 'profile-alias'); fs.symlinkSync(m.activeRoot, alias);
  ok(m.runAt(alias, '--revert'));
  assert.strictEqual(m.read(m.active), m.user);
  assert.strictEqual(m.read(m.defaults), m.user);
});

test('hook inventory is read from the relocated plugin registry', (m) => {
  const plug = path.join(m.home, 'custom-xr');
  m.json('custom-xr/hooks/hooks.json', { hooks: {} });
  m.json('active profile/plugins/installed_plugins.json', { plugins: { 'xr-dev@xr-dev': [{ installPath: plug }] } });
  ok(m.run('--apply'));
  assert.strictEqual(JSON.parse(m.read(m.active)).enabledPlugins['xr-dev@xr-dev'], true);
  assert.strictEqual(JSON.parse(m.read(m.active)).enabledPlugins['web3d-dev@web3d-dev'], false);
  assert.strictEqual(m.read(m.defaults), m.user);
  ok(m.run('--revert'));
});

test('update-step adds project coverage using the same relocated profile', (m) => {
  ok(m.run('--apply'));
  const before = m.read(m.active);
  const fresh = path.join(m.home, 'DATA', 'new-project');
  m.write('DATA/new-project/.gitignore', '.claude/settings.local.json\n');
  m.write('DATA/new-project/package.json', '{"dependencies":{"three":"1"}}');
  assert.strictEqual(spawnSync('git', ['init', '-q', fresh], { env: m.env }).status, 0);
  ok(m.run('--update-step'));
  assert.strictEqual(m.read(m.defaults), m.user);
  assert.strictEqual(m.read(m.active), before);
  assert.strictEqual(JSON.parse(m.read(path.join(fresh, '.claude/settings.local.json'))).enabledPlugins['web3d-dev@web3d-dev'], true);
  ok(m.run('--revert'));
});

test('retargeting a profile alias refuses writes to the newly selected file', (m) => {
  const alias = path.join(m.home, 'profile-alias'); fs.symlinkSync(m.activeRoot, alias);
  ok(m.runAt(alias, '--apply'));
  const before = m.snapshot();
  fs.unlinkSync(alias); fs.symlinkSync(path.join(m.home, '.claude'), alias);
  const refused = m.runAt(alias, '--revert');
  assert.strictEqual(refused.status, 1, refused.stdout + refused.stderr);
  assert.deepStrictEqual(m.snapshot(), before);
  ok(m.run('--revert'));
});

test('enablement readers share the explicit root while keeping project settings local', (m) => {
  const E = require('../lib/enablement');
  m.json('active profile/settings.json', { enabledPlugins: { 'web3d-dev@web3d-dev': false } });
  const plug = path.join(m.home, 'custom-web3d');
  m.json('active profile/plugins/installed_plugins.json', { plugins: { 'web3d-dev@web3d-dev': [{ installPath: plug }] } });
  assert.strictEqual(E.claudeRoot(m.home, m.env), m.activeRoot);
  assert.strictEqual(E.installed(m.home, null, m.activeRoot)['web3d-dev@web3d-dev'], plug);
  assert.strictEqual(E.effective(m.home, null, null, m.activeRoot)['web3d-dev@web3d-dev'], false);
  m.json('DATA/project/.claude/settings.local.json', { enabledPlugins: { 'web3d-dev@web3d-dev': true } });
  assert.strictEqual(E.effective(m.home, m.project, null, m.activeRoot)['web3d-dev@web3d-dev'], true);
});

for (const failure of failures) console.log(`FAIL: ${failure}`);
console.log(`${failures.length ? 'FAIL' : 'OK'} (${checks} checks)`);
if (failures.length) process.exitCode = 1;
