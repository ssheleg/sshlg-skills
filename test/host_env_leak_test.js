#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
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
// The trap points every HOST_ENV variable at a directory of its own, shaped as a Switchboard
// isolated home leaves it: instruction files, `skills/` and `plugins/` are symlinks into an
// "operator" directory. A case passes when nothing under the trap or behind its links changed.
// The suites that spawn the CLI or a hook, or call apply(), are DISCOVERED and each runs directly
// (not through the runner) under its own trap. The control case proves the leak path still
// writes the sentinel without isolation, so a guard that stopped seeing the leak fails first.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const T = require('./tmproot.js');

const ROOT = path.resolve(__dirname, '..');
const APPLY = JSON.stringify(path.join(ROOT, 'lib', 'apply.js'));
const SENTINEL = '# the operator\'s file\n\nprose no fixture may touch\n';
const SELF = path.basename(__filename);

let checks = 0;
const failures = [];
const bases = [];
function base() {
  const b = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hostleak-')));
  bases.push(b);
  return b;
}
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

/** Every file and link under `dir`, with its bytes or target: a write anywhere changes it. */
function treeHash(dir) {
  const h = crypto.createHash('sha256');
  const walk = (d) => {
    let names = [];
    try { names = fs.readdirSync(d).sort(); } catch (_) { return; }
    for (const n of names) {
      const p = path.join(d, n);
      const st = fs.lstatSync(p);
      h.update(`${path.relative(dir, p)}\0${st.isSymbolicLink() ? 'L' : st.isDirectory() ? 'D' : 'F'}\0`);
      if (st.isSymbolicLink()) h.update(fs.readlinkSync(p));
      else if (st.isDirectory()) walk(p);
      else h.update(fs.readFileSync(p));
      h.update('\n');
    }
  };
  walk(dir);
  return h.digest('hex');
}

/** Where each host root keeps an instruction or config file the hub may write. */
const FILES = {
  CLAUDE_CONFIG_DIR: ['CLAUDE.md', 'settings.json'],
  CODEX_HOME: ['AGENTS.md', 'config.toml'],
  GEMINI_CLI_HOME: [path.join('.gemini', 'GEMINI.md'), path.join('.gemini', 'settings.json')],
  PI_CODING_AGENT_DIR: ['AGENTS.md'],
  HERMES_HOME: ['config.yaml'],
  KIMI_CODE_HOME: ['AGENTS.md', 'config.toml'],
  QWEN_HOME: ['QWEN.md'],
  XDG_STATE_HOME: [path.join('skills', '.skill-lock.json')],
};

/**
 * Host roots shaped as a Switchboard isolated session leaves them. Every HOST_ENV variable is
 * set; files in FILES and the `skills/` and `plugins/` directories of the Claude home are
 * symlinks into `<base>/operator`. Returns { env, root, operator, before }.
 */
function trap(b) {
  const root = path.join(b, 'switchboard');
  const operator = path.join(b, 'operator');
  fs.mkdirSync(operator, { recursive: true });
  const env = {};
  for (const k of T.HOST_ENV) {
    const dir = path.join(root, k.toLowerCase());
    fs.mkdirSync(dir, { recursive: true });
    env[k] = dir;
    for (const rel of FILES[k] || []) {
      const target = path.join(operator, k.toLowerCase(), rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, SENTINEL);
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.symlinkSync(target, path.join(dir, rel));
    }
  }
  for (const sub of ['skills', 'plugins']) {
    const target = path.join(operator, 'claude', sub);
    fs.mkdirSync(path.join(target, 'kept'), { recursive: true });
    fs.writeFileSync(path.join(target, 'kept', 'SKILL.md'), SENTINEL);
    fs.symlinkSync(target, path.join(env.CLAUDE_CONFIG_DIR, sub));
  }
  return { env, root, operator, before: { root: treeHash(root), operator: treeHash(operator) } };
}

/** The trapped trees that changed, by name; empty when the trap held. */
function sprung(t) {
  const out = [];
  if (treeHash(t.operator) !== t.before.operator) out.push('a sentinel behind a symlink');
  if (treeHash(t.root) !== t.before.root) out.push('a host root');
  return out;
}

/** A fresh fixture home with every host directory present, as apply_test.js seeds one. */
function fixtureHome(b) {
  const h = path.join(b, 'fixture-home');
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

// --- discovery -------------------------------------------------------------------------

const JS_REACH = /sshlg-skills\.js|\b(?:A|apply)\.apply(?:One|Cursor|Extra)?\(|['"]hooks['"]|hooks\/[a-z-]+\.js/;
const PY_REACH = /sshlg-skills\.js|apply\.js|["']hooks["']|hooks\/[a-z-]+\.js/;

function pySuites() {
  const out = fs.readdirSync(__dirname).filter((f) => f.endsWith('_test.py')).map((f) => path.join(__dirname, f));
  const audit = path.join(__dirname, 'audit_regressions');
  if (fs.existsSync(audit)) {
    for (const f of fs.readdirSync(audit)) if (f.endsWith('.py')) out.push(path.join(audit, f));
  }
  return out.concat([path.join(__dirname, 'validate.py')]).sort();
}
const jsSuites = () => fs.readdirSync(__dirname).filter((f) => f.endsWith('_test.js')).sort()
  .map((f) => path.join(__dirname, f));

/** Suites that spawn the CLI or a hook, or call apply(): the ones that can reach a host root. */
function reaching() {
  const js = jsSuites().filter((f) => path.basename(f) !== SELF && JS_REACH.test(fs.readFileSync(f, 'utf8')));
  const py = pySuites().filter((f) => PY_REACH.test(fs.readFileSync(f, 'utf8')));
  return { js, py };
}

// --- static checks ---------------------------------------------------------------------

it('every suite the runner discovers isolates its own process at load', () => {
  const missing = [];
  for (const f of jsSuites()) {
    const head = fs.readFileSync(f, 'utf8').split('\n').slice(0, 5).join('\n');
    if (!/require\('\.\/tmproot\.js'\)\.isolate\(\);/.test(head)) missing.push(path.relative(ROOT, f));
  }
  for (const f of pySuites()) {
    // The call must come before the first top-level import other than its own line and
    // `from __future__`: a module imported first could read the environment at import time.
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const call = lines.findIndex((l) => /^_runpy\.run_path\([^\n]*'hostenv\.py'\)\)\['isolate'\]\(\)/.test(l));
    const firstImport = lines.findIndex((l) => /^(import|from) /.test(l) && !/^from __future__ /.test(l)
      && !/^import os as _os, runpy as _runpy\b/.test(l));
    if (call === -1 || (firstImport !== -1 && firstImport < call)) missing.push(path.relative(ROOT, f));
  }
  assert.deepStrictEqual(missing, [], 'these suites never call isolate()');
});

it('discovery finds the suites that reach a host root, the two that leaked among them', () => {
  const r = reaching();
  const names = r.js.map((f) => path.basename(f));
  for (const n of ['apply_test.js', 'install_routers_test.js', 'machine_predicate_test.js', 'pi_test.js',
    'drift_test.js', 'hooks_e2e_test.js']) assert.ok(names.includes(n), `${n} was not discovered`);
  assert.ok(r.js.length >= 40 && r.py.length >= 5, `discovery shrank: ${r.js.length} js, ${r.py.length} py`);
});

it('tmproot.env and isolate() drop exactly the host variables and keep the rest', () => {
  const host = Object.fromEntries(T.HOST_ENV.map((k) => [k, `/${k}`]));
  const e = T.env('/run', Object.assign({ HOME: '/h', PATH: '/p' }, host));
  assert.deepStrictEqual(e, { HOME: '/h', PATH: '/p', TMPDIR: '/run', TMP: '/run', TEMP: '/run' });
  const r = spawnSync(process.execPath, ['-e',
    `const T=require(${JSON.stringify(path.join(__dirname, 'tmproot.js'))});T.isolate();` +
    'process.stdout.write(JSON.stringify(T.HOST_ENV.filter((k)=>k in process.env).concat(process.env.KEEP)))'],
  { encoding: 'utf8', env: Object.assign({ KEEP: 'kept', PATH: process.env.PATH }, host) });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.deepStrictEqual(JSON.parse(r.stdout), ['kept']);
});

it('the Python helper reads the same list from tmproot.js and removes it', () => {
  const host = Object.fromEntries(T.HOST_ENV.map((k) => [k, `/${k}`]));
  const code = 'import runpy,os,json,sys;m=runpy.run_path(sys.argv[1]);m["isolate"]();'
    + 'print(json.dumps([m["host_env"](), [k for k in m["host_env"]() if k in os.environ]]))';
  const r = spawnSync('python3', ['-I', '-c', code, path.join(__dirname, 'hostenv.py')],
    { encoding: 'utf8', env: Object.assign({ PATH: process.env.PATH }, host) });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.deepStrictEqual(JSON.parse(r.stdout), [T.HOST_ENV, []]);
});

it('every root-locating variable lib/, bin/ and hooks/ read is one tmproot removes', () => {
  const READS = [
    /\b(?:process\.env|env|e|c\.env|o\.env)\.([A-Z][A-Z0-9_]*(?:_HOME|_DIR|_ROOT))\b/g,
    /\bpick\(\s*\w+,\s*'([A-Z][A-Z0-9_]*)'/g,
    /\benv\[['"]([A-Z][A-Z0-9_]*(?:_HOME|_DIR|_ROOT))['"]\]/g,
    /\benv:\s*'([A-Z][A-Z0-9_]*)'/g,
    // `(env || process.env).XDG_STATE_HOME` (lib/skillstore.js): a read after a parenthesis.
    /\)\.([A-Z][A-Z0-9_]*(?:_HOME|_DIR|_ROOT))\b/g,
  ];
  const seen = new Set();
  for (const dir of ['lib', 'bin', 'hooks']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((n) => n.endsWith('.js'))) {
      const src = fs.readFileSync(path.join(ROOT, dir, f), 'utf8');
      for (const re of READS) for (const m of src.matchAll(re)) seen.add(m[1]);
    }
  }
  // The files the 2026-11-16 reviews named (instruction-targets, hostgate-install, skillstore) must
  // contribute what they read.
  for (const k of ['XDG_CONFIG_HOME', 'XDG_STATE_HOME', 'HERMES_HOME', 'KIMI_CODE_HOME', 'QWEN_HOME']) {
    assert.ok(seen.has(k), `the scan no longer sees ${k}: the reader changed shape, re-derive the scan`);
  }
  const missing = [...seen].filter((k) => !T.HOST_ENV.includes(k)).sort();
  assert.deepStrictEqual(missing, [], 'read by the hub and not removed from suites');
});

// --- dynamic checks --------------------------------------------------------------------

it('control: without the isolation the leaking call writes through the symlink', () => {
  const b = base();
  const t = trap(b);
  const home = fixtureHome(b);
  const r = spawnSync(process.execPath, ['-e', leakScript(home)],
    { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, t.env, { HOME: home }) });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(sprung(t).includes('a sentinel behind a symlink'),
    'the leak path no longer writes the sentinel, so this guard proves nothing: re-derive it');
});

it('the runner\'s suite environment (tmproot.env) keeps the leaking call off the trap', () => {
  const b = base();
  const t = trap(b);
  const home = fixtureHome(b);
  const runTmp = T.open(b);
  try {
    const childEnv = Object.assign(T.env(runTmp, Object.assign({}, process.env, t.env)), { HOME: home });
    for (const k of T.HOST_ENV) assert.ok(!(k in childEnv), `${k} reached the suite environment`);
    const r = spawnSync(process.execPath, ['-e', leakScript(home)], { cwd: ROOT, encoding: 'utf8', env: childEnv });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.deepStrictEqual(sprung(t), [], 'the trap sprang');
    assert.ok(fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8').includes('SSHLG:ROUTERS:BEGIN'),
      'the call did not write the fixture home either, so it never ran the path');
  } finally {
    T.close(runTmp);
  }
});

/**
 * How long one trapped suite may run before it is treated as hung. Some suites allow their own
 * children 180 s (codex_native_e2e, visibility_hosts_e2e, extraroots) and the guard runs up to
 * eight at once, so the limit sits well above that.
 */
const LIMIT_MS = 600000;

/** Run one discovered suite directly, from a Switchboard-shaped session, under its own trap. */
function runTrapped(file) {
  return new Promise((resolve) => {
    const b = base();
    const t = trap(b);
    const home = path.join(b, 'suite-home');
    const tmp = path.join(b, 'suite-tmp');
    fs.mkdirSync(home);
    fs.mkdirSync(tmp);
    const cmd = file.endsWith('.py') ? 'python3' : process.execPath;
    // A process group of its own, so a timeout kills the CLI processes the suite spawned too,
    // and none outlives the trap deleted below.
    const child = spawn(cmd, [file], {
      cwd: ROOT,
      env: Object.assign({}, process.env, t.env, { HOME: home, USERPROFILE: home, TMPDIR: tmp, TMP: tmp, TEMP: tmp }),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    let out = '';
    let timedOut = false;
    let settled = false;
    // A hung suite must not hang the gate: its group is killed after LIMIT_MS, recorded as a failure.
    const timer = setTimeout(() => {
      timedOut = true;
      try { process.kill(-child.pid, 'SIGKILL'); } catch (_) { try { child.kill('SIGKILL'); } catch (__) { /* gone */ } }
    }, LIMIT_MS);
    const finish = (code, spawnError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const result = { file, code, out, timedOut, spawnError, sprung: sprung(t) };
      // Each suite's tree goes as soon as it is judged, so 82 trees never sit on the disk at once.
      fs.rmSync(b, { recursive: true, force: true });
      const at = bases.indexOf(b);
      if (at !== -1) bases.splice(at, 1);
      resolve(result);
    };
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    // A suite that cannot start (python3 missing) is a failure of that suite, not a crash of the guard.
    child.on('error', (e) => finish(null, e.message));
    child.on('close', (code) => finish(code, null));
  });
}

async function trapped() {
  const { js, py } = reaching();
  const queue = js.concat(py);
  const width = Math.max(2, Math.min(8, Math.floor(os.cpus().length / 2)));
  const results = [];
  const worker = async () => {
    while (queue.length) results.push(await runTrapped(queue.shift()));
  };
  await Promise.all(Array.from({ length: width }, worker));
  results.sort((a, b) => a.file.localeCompare(b.file));
  for (const r of results) {
    checks += 1;
    const name = path.relative(ROOT, r.file);
    if (r.spawnError) failures.push(`${name} could not be started under the trap: ${r.spawnError}`);
    else if (r.timedOut) failures.push(`${name} run directly under the trap did not finish in ${LIMIT_MS / 1000} s and was killed`);
    else if (r.sprung.length) failures.push(`${name} run directly under the trap changed ${r.sprung.join(' and ')} (exit ${r.code})`);
    else if (r.code !== 0) failures.push(`${name} run directly under the trap exited ${r.code}:\n${r.out.slice(-1500)}`);
  }
}

const removeBases = () => { for (const b of bases.splice(0)) fs.rmSync(b, { recursive: true, force: true }); };

trapped().then(() => {
  removeBases();
  if (failures.length) {
    failures.forEach((f) => console.log(`FAIL: ${f}`));
    console.log(`${failures.length} failure(s) out of ${checks} checks`);
    process.exit(1);
  }
  console.log(`OK (${checks} checks)`);
}).catch((e) => {
  removeBases();
  console.log(`FAIL: the guard itself failed: ${e && e.stack ? e.stack : e}`);
  process.exit(1);
});
