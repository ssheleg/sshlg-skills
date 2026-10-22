'use strict';
// 1.74.2: a Codex whose `plugin list` cannot be read is not a green step. On 2026-10-22 the
// 1.74.1 `update` printed "11 of 11 steps, all green" beside "not read: codex plugin list
// failed — spawnSync codex ETIMEDOUT" (the read took 31.5 s at a load average near 60 against
// a 30 s limit), and Codex stayed at older pins. Each case runs in its own process with a
// fake `codex` first on PATH and a scratch CODEX_HOME, so no real Codex is touched.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
const box = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-unread-'));
let count = 0;
function it(name, fn) { fn(); count += 1; console.log('ok ' + name); }

function fakeCodex(dir, body) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, 'codex');
  fs.writeFileSync(p, '#!/bin/sh\n' + body + '\n');
  fs.chmodSync(p, 0o755);
}

function refresh(binDir, env) {
  const js = `const b=require(${JSON.stringify(BIN)});const ok=b.refreshCodexPlugins({});`
    + `process.stdout.write('\\nRESULT '+ok+' '+b.CODEX_READ_TIMEOUT_MS+'\\n');`;
  const r = spawnSync(process.execPath, ['-e', js], { encoding: 'utf8', timeout: 60000,
    env: { ...process.env, PATH: binDir + path.delimiter + process.env.PATH,
      CODEX_HOME: path.join(box, 'codex-home'), ...env } });
  const m = /RESULT (\w+) (\d+)/.exec(r.stdout || '');
  return { ok: m && m[1], limit: m && Number(m[2]), out: (r.stdout || '') + (r.stderr || '') };
}

try {
  fs.mkdirSync(path.join(box, 'codex-home'), { recursive: true });
  fs.writeFileSync(path.join(box, 'codex-home', 'config.toml'), [
    '[marketplaces.agent-sync]', "source_type = 'git'", 'source = "https://github.com/ssheleg/agent-sync.git"',
    'ref = "v1.23.0"', '', '[plugins."agent-sync@agent-sync"]', 'enabled = true', ''].join('\n'));
  it('the default limit for a Codex read is 120 s, not 30 s', () => {
    const dir = path.join(box, 'bin-fails');
    fakeCodex(dir, 'exit 1');
    assert.strictEqual(refresh(dir, { SSHLG_CODEX_READ_TIMEOUT_MS: '' }).limit, 120000);
  });
  it('a Codex read that times out is not a green step, and says why', () => {
    const dir = path.join(box, 'bin-slow');
    fakeCodex(dir, 'if [ "$1" = "--version" ]; then echo "codex-cli 0.200.0"; exit 0; fi; sleep 5; echo "{}"');
    const r = refresh(dir, { SSHLG_CODEX_READ_TIMEOUT_MS: '700' });
    assert.strictEqual(r.ok, 'false', r.out);
    assert.match(r.out, /not read: codex plugin list failed/);
  });
  it('a Codex whose plugin list exits non-zero is not a green step', () => {
    const dir = path.join(box, 'bin-fails2');
    fakeCodex(dir, 'if [ "$1" = "--version" ]; then echo "codex-cli 0.200.0"; exit 0; fi; echo boom >&2; exit 3');
    assert.strictEqual(refresh(dir, {}).ok, 'false');
  });
  it('a limit set below one second is raised to one second, never zero', () => {
    const dir = path.join(box, 'bin-fails3');
    fakeCodex(dir, 'exit 1');
    assert.strictEqual(refresh(dir, { SSHLG_CODEX_READ_TIMEOUT_MS: '5' }).limit, 1000);
  });
  console.log(`PASS: Codex unread is not green — ${count} cases`);
} finally {
  fs.rmSync(box, { recursive: true, force: true });
}
