'use strict';
/**
 * One temporary directory per `npm test` run, removed when the run ends.
 *
 * Suites make their fixture homes with `fs.mkdtempSync(os.tmpdir() + ...)`, and many never
 * remove them. On 2026-11-02 that left 1 928 `sshlg-*` trees (about 46 GB, 89 of them with a
 * Hermes install) in the operator's TMPDIR between 13:33 and 16:57 and filled the disk for
 * every agent on the machine. Fixing each suite would leave the next one to forget, so the
 * runner points TMPDIR (and TMP, TEMP) of every suite at a directory of its own and
 * removes it at exit, whatever the suites did.
 *
 * A run that is killed cannot clean up after itself, so each root carries its runner's pid
 * and the next run removes roots whose runner is gone.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const PREFIX = 'sshlg-skills-run-';

/**
 * Every variable that relocates a root the hub may write: an agent's config home, the XDG
 * homes, the project directory a hook acts on, the projects root `domains` enrols.
 *
 * A suite inherits them from the session that runs it, and the hub puts each one AHEAD of
 * the fixture's `home`. A Switchboard isolated session sets CLAUDE_CONFIG_DIR to a home
 * whose CLAUDE.md is a symlink to the operator's real ~/.claude/CLAUDE.md, so
 * `apply({ home: tmp })` in a fixture wrote the fixture's router text into the real file
 * (B-350, 2026-11-14: three routers read «Пакетный текст роутера task-pipeline.», "ux body",
 * "copy body"). The runner removes them for every suite, every suite removes them from its
 * own process at load (`isolate()`), and a suite that needs one sets it to a path of its own.
 * `test/host_env_leak_test.js` fails when lib/, bin/ or hooks/ reads a `*_HOME`, `*_DIR` or
 * `*_ROOT` variable missing here.
 */
const HOST_ENV = [
  'CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'GEMINI_CLI_HOME', 'PI_CODING_AGENT_DIR', 'HERMES_HOME',
  'KIMI_CODE_HOME', 'QWEN_HOME', 'GROK_HOME', 'XDG_CONFIG_HOME', 'FLATPAK_XDG_CONFIG_HOME',
  'XDG_DATA_HOME', 'XDG_STATE_HOME', 'FABRIC_SERVICES_DIR', 'CLAUDE_PROJECT_DIR', 'SSHLG_PROJECTS_ROOT',
];
// Not here, on purpose: APPDATA and LOCALAPPDATA. The hub only reads them, to find Zed's
// settings (lib/host-targets.js) and Fabric's services directory (lib/machine.js) on Windows,
// and never writes under them; a suite may need them to resolve Windows paths.

/**
 * Remove HOST_ENV from this process's environment, so the suite's own apply() calls and
 * every child it spawns with `process.env` start without a host root. Every suite calls it
 * at load, before it builds an environment; running `node test/<suite>.js` directly is then
 * as safe as `npm test`. Returns the names it removed.
 */
function isolate() {
  const removed = [];
  for (const k of HOST_ENV) if (k in process.env) { delete process.env[k]; removed.push(k); }
  return removed;
}

/** A copy of `base` (default process.env) without the HOST_ENV variables. */
function withoutHostEnv(base) {
  const out = Object.assign({}, base || process.env);
  for (const k of HOST_ENV) delete out[k];
  return out;
}
const OWNER = '.runner-pid';

function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/** Remove roots under `base` whose runner is gone. Returns the names removed. */
function reapStale(base) {
  const removed = [];
  let names = [];
  try { names = fs.readdirSync(base); } catch (_) { return removed; }
  for (const name of names) {
    if (!name.startsWith(PREFIX)) continue;
    const dir = path.join(base, name);
    let pid = NaN;
    try { pid = Number(fs.readFileSync(path.join(dir, OWNER), 'utf8').trim()); } catch (_) { /* no owner file */ }
    // A root without an owner file is one being created right now, or not ours: keep it.
    if (Number.isNaN(pid) || alive(pid)) continue;
    try { fs.rmSync(dir, { recursive: true, force: true }); removed.push(name); } catch (_) { /* next run retries */ }
  }
  return removed;
}

/** Create this run's root under `base` (default os.tmpdir()). */
function open(base) {
  const parent = base || os.tmpdir();
  const dir = fs.mkdtempSync(path.join(parent, PREFIX));
  fs.writeFileSync(path.join(dir, OWNER), `${process.pid}\n`);
  return dir;
}

/** The environment a suite runs with: every temp variable points into `dir`, no host root inherited. */
function env(dir, base) {
  return Object.assign(withoutHostEnv(base), { TMPDIR: dir, TMP: dir, TEMP: dir });
}

function close(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* reaped by the next run */ }
}

module.exports = { PREFIX, OWNER, HOST_ENV, withoutHostEnv, isolate, open, env, close, reapStale, alive };
