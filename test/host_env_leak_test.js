#!/usr/bin/env node
'use strict';
// B-350: a fixture must never reach an operator file through a host variable it inherited.
//
// On 2026-11-14 three routers in the operator's real ~/.claude/CLAUDE.md read fixture text
// ("Пакетный текст роутера task-pipeline.", "ux body", "copy body", from test/apply_test.js and
// test/install_routers_test.js). Both suites called `apply({ home: tmp })` without `env`;
// lib/apply.js puts CLAUDE_CONFIG_DIR ahead of `home`; the suites ran from a Switchboard isolated
// session whose CLAUDE_CONFIG_DIR held a CLAUDE.md symlinked to the real file. The write went
// through the link, its backup into the fixture's temp home, and the next `routers --update`
// recorded the fixture as the operator's own wording (B-202).
//
// Every case here points the host variables at directories whose instruction file is a symlink
// to a SENTINEL in a temp directory, runs the code path the leak used, and asserts every sentinel
// is byte for byte what it was. The first case is the control: without the isolation the same
// path DOES write the sentinel, so a guard that stopped seeing the leak would fail here first.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const T = require('./tmproot.js');

const ROOT = path.resolve(__dirname, '..');
const APPLY = JSON.stringify(path.join(ROOT, 'lib', 'apply.js'));
const SENTINEL = '# the operator\'s file\n\nprose no fixture may touch\n';

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hostleak-')));
  try { fn(base); } catch (e) { failures.push(`${name}: ${e.message}`); }
  finally { fs.rmSync(base, { recursive: true, force: true }); }
}

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

/**
 * Host roots shaped as a Switchboard isolated session leaves them: each instruction file is a
 * symlink to a sentinel outside the root. Returns { env, sentinels: [{ file, hash }] }.
 */
function trap(base) {
  const env = {};
  const sentinels = [];
  const link = (dir, file, name) => {
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(base, 'operator', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, SENTINEL);
    fs.symlinkSync(target, path.join(dir, file));
    sentinels.push({ file: target, hash: sha(target) });
  };
  env.CLAUDE_CONFIG_DIR = path.join(base, 'switchboard', 'claude-home');
  link(env.CLAUDE_CONFIG_DIR, 'CLAUDE.md', 'CLAUDE.md');
  env.CODEX_HOME = path.join(base, 'switchboard', 'codex-home');
  link(env.CODEX_HOME, 'AGENTS.md', 'AGENTS.md');
  env.GEMINI_CLI_HOME = path.join(base, 'switchboard', 'gemini-home');
  link(path.join(env.GEMINI_CLI_HOME, '.gemini'), 'GEMINI.md', 'GEMINI.md');
  env.PI_CODING_AGENT_DIR = path.join(base, 'switchboard', 'pi-agent');
  link(env.PI_CODING_AGENT_DIR, 'AGENTS.md', 'PI-AGENTS.md');
  env.HERMES_HOME = path.join(base, 'switchboard', 'hermes-home');
  fs.mkdirSync(env.HERMES_HOME, { recursive: true });
  return { env, sentinels };
}

function changed(sentinels) {
  return sentinels.filter((s) => sha(s.file) !== s.hash).map((s) => path.basename(s.file));
}

/** A fresh fixture home with every host directory present, as apply_test.js seeds one. */
function fixtureHome(base) {
  const h = path.join(base, 'fixture-home');
  for (const d of ['.claude', '.codex', '.gemini', path.join('.pi', 'agent')]) {
    fs.mkdirSync(path.join(h, d), { recursive: true });
  }
  return h;
}

/** The leaking call, verbatim in shape: apply() with a temp home and no `env`. */
function leakScript(home) {
  return `require(${APPLY}).apply({ home: ${JSON.stringify(home)}, mode: 'install', consent: 'yes',
    routers: { 'task-pipeline': 'Пакетный текст роутера task-pipeline.' }, log: () => {} });`;
}

function runChild(args, env) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', env });
}

it('control: without the isolation the leaking call writes through the symlink', (base) => {
  const { env, sentinels } = trap(base);
  const home = fixtureHome(base);
  const r = runChild(['-e', leakScript(home)], Object.assign({}, process.env, env, { HOME: home }));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(changed(sentinels).includes('CLAUDE.md'),
    'the leak path no longer writes the sentinel, so this guard proves nothing: re-derive it');
});

it('the runner\'s suite environment (tmproot.env) keeps the leaking call off every sentinel', (base) => {
  const { env, sentinels } = trap(base);
  const home = fixtureHome(base);
  const runTmp = T.open(base);
  try {
    const childEnv = Object.assign(T.env(runTmp, Object.assign({}, process.env, env)), { HOME: home });
    for (const k of T.HOST_ENV) assert.ok(!(k in childEnv), `${k} reached the suite environment`);
    const r = runChild(['-e', leakScript(home)], childEnv);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.deepStrictEqual(changed(sentinels), [], 'a sentinel changed');
    assert.ok(fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8').includes('SSHLG:ROUTERS:BEGIN'),
      'the call did not write the fixture home either, so it never ran the path');
  } finally {
    T.close(runTmp);
  }
});

for (const suite of ['apply_test.js', 'install_routers_test.js']) {
  it(`${suite} run directly from a Switchboard-shaped session leaves every sentinel alone`, (base) => {
    const { env, sentinels } = trap(base);
    const home = path.join(base, 'suite-home');
    const tmp = path.join(base, 'suite-tmp');
    fs.mkdirSync(home);
    fs.mkdirSync(tmp);
    // Not through tmproot.env: the suite's own isolation is what is under test here.
    const r = runChild([path.join(__dirname, suite)],
      Object.assign({}, process.env, env, { HOME: home, TMPDIR: tmp, TMP: tmp, TEMP: tmp }));
    assert.deepStrictEqual(changed(sentinels), [], `a sentinel changed (suite exit ${r.status})`);
    assert.strictEqual(r.status, 0, `${r.stdout}${r.stderr}`);
  });
}

it('tmproot.env drops exactly the host variables and keeps the rest', () => {
  const e = T.env('/run', { HOME: '/h', PATH: '/p', CLAUDE_CONFIG_DIR: '/c', CODEX_HOME: '/x',
    GEMINI_CLI_HOME: '/g', PI_CODING_AGENT_DIR: '/pi', HERMES_HOME: '/he' });
  assert.deepStrictEqual(e, { HOME: '/h', PATH: '/p', TMPDIR: '/run', TMP: '/run', TEMP: '/run' });
  assert.deepStrictEqual(T.HOST_ENV.slice().sort(),
    ['CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'GEMINI_CLI_HOME', 'HERMES_HOME', 'PI_CODING_AGENT_DIR']);
});

it('every host variable lib/apply.js reads is one tmproot removes', () => {
  const A = require('../lib/apply.js');
  for (const t of A.TARGETS) {
    if (t.env) assert.ok(T.HOST_ENV.includes(t.env), `${t.agent}'s ${t.env} is not in tmproot.HOST_ENV`);
  }
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
