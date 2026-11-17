'use strict';
/**
 * The Codex half of `update`: the native plugin refresh, its pins and what it held back.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const { ROOT, SKILLS, codexScope, log, opres } = require('./cli-core.js');

function codexConfigPath() {
  return path.join(require('../lib/codexplugins.js').codexHome(process.env, os.homedir()), 'config.toml');
}

function readCodexConfig() {
  try { return fs.readFileSync(codexConfigPath(), 'utf8'); } catch (_) { return null; }
}

/**
 * The ref a member's Codex marketplace is re-added at. A checkout knows the pin's
 * COMMIT — the gitlink `git ls-tree HEAD skills/<name>` reads from what is committed,
 * not from the working tree. The published package ships no submodules and no SHA, so
 * there the ref is the member's release tag `v<version>`; every member's tag peels to
 * its gitlink (measured for all eleven on 2026-10-12), and the readback checks the
 * version either way. `--dry-run` runs no subprocess, so it always shows the tag.
 */
function codexPinRef(s, opts) {
  if (!(opts && opts.noGit)) {
    const r = spawnSync('git', ['-C', ROOT, 'ls-tree', 'HEAD', s.dir], { encoding: 'utf8' });
    const m = r.status === 0 && /^160000 commit ([0-9a-f]{40})\t/m.exec(r.stdout || '');
    if (m) return { ref: m[1], kind: 'commit' };
  }
  return { ref: `v${s.version}`, kind: 'tag' };
}

/**
 * The runner `lib/codexplugins.js` drives Codex through. A mutating call is logged and
 * counted like every other `update` step, and a failure lands in the closing summary; a
 * read (`--version`, `plugin list`) is captured and stays quiet.
 */
// A read of Codex's plugin list took 31.5 s on a loaded machine (2026-10-22); 30 s timed it
// out. SSHLG_CODEX_READ_TIMEOUT_MS overrides, never below one second.
const CODEX_READ_TIMEOUT_MS = Math.max(1000, Number(process.env.SSHLG_CODEX_READ_TIMEOUT_MS) || 120000);

function codexRunner(cmd, args, opts) {
  if (!opts || !opts.read || !(args.length === 1 && args[0] === '--version'
    || args[0] === 'plugin' && args[1] === 'list' && (args.length === 2 || args.length === 3 && args[2] === '--json'
      || args.length === 5 && args[2] === '--json' && args[3] === '-m' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(args[4]))))
    throw new Error('Codex native mutation is deferred');
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'], timeout: CODEX_READ_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 });
  return { status: r.status, signal: r.signal, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

/** Whether the last Codex pass held plugins back and did nothing else wrong (B-323). */
let codexHeld = false;

/** What the last Codex refresh held back, for the outcome `update` writes. */
function codexHeldNow() { return codexHeld; }

/**
 * How `update` ended, for the unattended runner that started it (`lib/updaterun.js` sets
 * `SSHLG_SKILLS_OUTCOME`): exit 1 alone cannot say "only Codex is waiting".
 */
function writeOutcome(o) {
  const file = process.env.SSHLG_SKILLS_OUTCOME;
  if (!file) return;
  try { require('../lib/store.js').writeJson(file, () => o); } catch (_) { /* the runner reads FAILED */ }
}

/** The Codex half of `update` (B-166): read, refresh what is behind, read back. */
function refreshCodexPlugins(f) {
  codexHeld = false;
  log('\n== Native host lifecycle: Codex plugins ==');
  const scope = codexScope(f);
  if (!scope.inScope) {
    log(`  skipped: ${scope.skippedBy} (Codex is outside this run's scope)`);
    return true;
  }
  const cp = require('../lib/codexplugins.js');
  const lc = require('../lib/lifecycle.js');
  let out;
  let configBytes;
  try {
    configBytes = fs.existsSync(codexConfigPath()) ? fs.readFileSync(codexConfigPath()) : null;
    out = cp.refreshAll({
      skills: SKILLS,
      only: f.member || null,
      runner: codexRunner,
      readConfig: () => configBytes === null ? null : configBytes.toString('utf8'),
      configPath: codexConfigPath(),
      pinRef: (s) => codexPinRef(s),
      onItem: (it) => log(`\n- ${it.pluginId}: native catalog ${it.from}; requested pin ${it.pin}; checking generation safety`),
      onResult: (res) => { for (const l of cp.resultLines(res)) log(l); },
    });
  } catch (e) {
    log(`  NOT refreshed: ${e.message}`);
    return false;
  }
  if (out.status === 'skipped') { log(`  skipped: ${out.why}`); return true; }
  if (out.status === 'unsupported') {
    const u = lc.planHostLifecycle({ name: 'Codex', api: null,
      manualStep: `this Codex has no \`codex plugin\` marketplace CLI (${out.why}). Update the family `
        + 'plugins through Codex\'s own plugin manager and reload the session. No Codex native files were touched.' });
    log(`  ${u.host}: UNSUPPORTED_UPDATE: ${u.manualStep}`);
    return true;
  }
  if (out.status === 'unread') {
    log(`  not read: codex plugin list failed: ${out.why}. Nothing in Codex was touched.`);
    // Not looked is not green: the summary reads PARTIAL and names this section.
    return false;
  }
  for (const it of out.items) {
    if (it.action === 'skip') log(`  ${it.pluginId}: left alone: ${it.why}`);
  }
  if (out.results.some((r) => r.status === 'deferred')) {
    try {
      const file = require('../lib/codex-pending').save({ home: os.homedir(), configPath: codexConfigPath(),
        configBytes, results: out.results, runtime: out.runtime });
      log(`  Deferred update receipt: ${file}`);
      const watcher = require('../lib/codex-pending').watcherCommand(path.join(ROOT, 'lib', 'codex-deferred-watch.js'), file);
      log(watcher ? `  Native-host-read-only watcher (POSIX shell): ${watcher}`
        : '  Watcher command display is POSIX-only; no runnable Windows shell command is emitted.');
    } catch (e) { log(`  Pending receipt FAILED: ${e.message}`); return false; }
    codexHeld = cp.heldOnly(out.results);
  }
  log(cp.summaryLine(out));
  if (out.results.some((r) => r.status === 'current')) log('  (start a new Codex session to load them)');
  return out.results.every((r) => r.status === 'current');
}

/**
 * What the Codex pass WOULD do, for `--dry-run`: read-only, no subprocess. Without
 * running `codex plugin list` the installed versions are unknown, so every family
 * marketplace configured in Codex is listed with the condition under which it moves.
 */
function planCodexSteps(f) {
  if (!codexScope(f).inScope) return [];
  const text = readCodexConfig();
  if (text === null) return [];
  const cp = require('../lib/codexplugins.js');
  const mks = cp.readMarketplaces(text);
  const steps = [];
  for (const s of SKILLS) {
    if (f.member && s.name !== f.member) continue;
    const ids = cp.splitPluginId(s.pluginInstall);
    const mk = ids && mks.get(ids.marketplace);
    if (!mk || mk.source_type !== 'git' || mk.other.length
      || cp.normalizeSource(mk.source) !== cp.normalizeSource(cp.familyUrl(s))) continue;
    const pin = codexPinRef(s, { noGit: true });
    steps.push(opres.step('codex-deferred', 'home',
      `Codex ${s.pluginInstall}: inspect native catalog; defer a version change until generation retention is supported`,
      { pluginId: s.pluginInstall, desired: s.version, ref: pin.ref, reason: cp.DEFER_REASON }));
  }
  return steps;
}

Object.assign(module.exports, {
  codexConfigPath, readCodexConfig, codexPinRef, CODEX_READ_TIMEOUT_MS, codexRunner, codexHeld,
  codexHeldNow, writeOutcome, refreshCodexPlugins, planCodexSteps
});
