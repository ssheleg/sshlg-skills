#!/usr/bin/env node
'use strict';
// G2 (audit 2026-11-11): `sshlg-skills settings get <key>` prints one allow-listed key of a
// Claude settings file with credential-shaped strings redacted. Fixture values are built at
// runtime so this file carries no live credential shape.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const G = require('../lib/settingsget.js');

let n = 0;
const failures = [];
function it(name, fn) { n++; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const FAKE_OR = 'sk-or-v1-' + 'b'.repeat(64);
const SETTINGS = {
  env: { ANTHROPIC_API_KEY: 'value-that-must-not-leave' },
  apiKeyHelper: '/usr/local/bin/key-helper',
  enabledPlugins: { 'a@m': true, 'b@m': false },
  hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [
    { type: 'command', command: `GITHUB_TOKEN=abc123def456 node hook.js --key ${FAKE_OR}` },
    { type: 'command', command: 'MY_TOKEN=abc123def456 node hook.js', env: { NPM_AUTH_TOKEN: 'plain' } },
    { type: 'command', command: 'curl -H "Authorization: Bearer abcdefghijklmnop" https://x.example/a?token=zzz&page=2' },
    { type: 'command', command: 'git clone https://me:hunter2@git.example/r.git && echo $PATH' },
  ] }] },
  permissions: { allow: ['Bash(npm test)'], deny: [] },
};
const TEXT = JSON.stringify(SETTINGS);

it('an allow-listed key comes back whole when nothing in it is secret', () => {
  const r = G.project(TEXT, 'enabledPlugins');
  assert.ok(r.ok);
  assert.deepStrictEqual(r.value, SETTINGS.enabledPlugins);
});
it('a dotted sub-path of an allow-listed key', () => {
  assert.deepStrictEqual(G.project(TEXT, 'permissions.allow').value, ['Bash(npm test)']);
});
it('a key outside the list is refused with exit code 2 and names the allowed keys', () => {
  for (const key of ['env', 'apiKeyHelper', '', 'hooksX', '__proto__']) {
    const r = G.project(TEXT, key);
    assert.ok(!r.ok && r.code === 2, key);
    assert.ok(/enabledPlugins, hooks, permissions, skillOverrides, extraKnownMarketplaces/.test(r.error));
  }
});
it('an absent allow-listed key is null', () => {
  assert.strictEqual(G.project(TEXT, 'skillOverrides').value, null);
});
it('invalid JSON is exit code 1', () => {
  const r = G.project('{"enabledPlugins":', 'enabledPlugins');
  assert.ok(!r.ok && r.code === 1);
});
it('hooks: every credential shape is redacted, ordinary text kept', () => {
  const out = JSON.stringify(G.project(TEXT, 'hooks').value);
  for (const leak of [FAKE_OR, 'abc123def456', 'abcdefghijklmnop', 'hunter2', 'zzz', '"plain"']) {
    assert.ok(!out.includes(leak), `leaked ${leak.slice(0, 6)}: ${out}`);
  }
  for (const kept of ['node hook.js', 'page=2', 'git.example/r.git', 'echo $PATH', '"NPM_AUTH_TOKEN"']) {
    assert.ok(out.includes(kept), `lost ${kept}: ${out}`);
  }
});
it('redactString keeps names that only contain a credential word', () => {
  assert.strictEqual(G.redactString('PYTHONPATH=/x KEYCHAIN_DIR=/y'), 'PYTHONPATH=/x KEYCHAIN_DIR=/y');
  assert.strictEqual(G.redactString('API_KEY=abc'), 'API_KEY=<redacted>');
});

function cli(args, home) {
  return spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'settings', ...args], {
    encoding: 'utf8', timeout: 15000,
    env: { PATH: path.dirname(process.execPath), HOME: home, CLAUDE_CONFIG_DIR: path.join(home, '.claude') },
  });
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'settingsget-'));
try {
  const home = path.join(tmp, 'home');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), TEXT);
  const other = path.join(tmp, 'other.json');
  fs.writeFileSync(other, JSON.stringify({ enabledPlugins: { 'z@m': true } }));
  it('cli: the default file is the profile settings.json', () => {
    const r = cli(['get', 'enabledPlugins'], home);
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.deepStrictEqual(JSON.parse(r.stdout), SETTINGS.enabledPlugins);
  });
  it('cli: --file reads another file', () => {
    const r = cli(['get', 'enabledPlugins', '--file', other], home);
    assert.strictEqual(r.status, 0);
    assert.deepStrictEqual(JSON.parse(r.stdout), { 'z@m': true });
  });
  it('cli: a refused key prints no value and exits 2', () => {
    const r = cli(['get', 'env'], home);
    assert.strictEqual(r.status, 2);
    assert.ok(!(r.stdout + r.stderr).includes('value-that-must-not-leave'));
  });
  it('cli: no verb is a usage error', () => {
    assert.strictEqual(cli([], home).status, 2);
    assert.strictEqual(cli(['get'], home).status, 2);
  });
  it('cli: a missing file exits 1', () => {
    assert.strictEqual(cli(['get', 'hooks', '--file', path.join(tmp, 'none.json')], home).status, 1);
  });
  it('the command is not a reader the credential guard refuses', () => {
    const S = require('../lib/secrets.js');
    assert.strictEqual(S.inspect('npx sshlg-skills settings get enabledPlugins --file ~/.claude/settings.json'), null);
    const v = S.inspect('jq .enabledPlugins ~/.claude/settings.json');
    assert.ok(v && v.rule === 'reads-secret-file' && v.why.includes('sshlg-skills settings get'), 'the refusal names the door');
  });
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }

if (failures.length) { console.error(`settingsget: ${failures.length}/${n} failed\n  ${failures.join('\n  ')}`); process.exit(1); }
console.log(`PASS: settingsget: ${n} cases`);
