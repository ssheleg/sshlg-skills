'use strict';
/**
 * Launcher state and helpers every command module shares: the package root, the manifest, the step
 * counter, the child-process runner, the host roots and the plans main() freezes.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

/** A function of another command module, required when it is called (no load-time cycle). */
function lazy(file, name) { return (...args) => require(file)[name](...args); }

const plan = require('./plan.js');
const opres = require('./operation-result.js');
// B-260: every operator-file write lands through this one temp-file-and-rename helper.
const atomic = require('./atomicwrite.js');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills.json'), 'utf8'));
const SKILLS = manifest.skills;

function log(m) { process.stdout.write(m + '\n'); }

/**
 * The skills CLI, PINNED (FIX-UP-01.02). `npx skills …` floats to whatever
 * implementation npx resolves; the family pins the version in package.json's
 * `skillsCli` field so a checkout installs the same CLI it was tested with. An
 * unpinned CLI is not a pin, and this is the one external tool the launcher
 * cannot version by a submodule.
 */
function cliSpec() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    return pkg.skillsCli || 'skills';
  } catch (_) { return 'skills'; }
}

/** Replace the bare `skills` token in a plan argv with the pinned spec, so the
 * spawned `npx` resolves the pinned CLI, not the floating one. */
function pinnedArgv(argv) {
  return argv.map((a) => (a === 'skills' ? cliSpec() : a));
}

/**
 * Resolve read-only BEFORE any apply (FIX-UP-01.02): fetch every member's
 * payload and verify its digest against the lock, and BLOCK the whole apply if
 * any payload is corrupt, missing or unpinnable — before a single mutation.
 * `fetch(member)` is injected (network in production, a stub in tests) and
 * returns `{digest}` or throws/omits it. Returns `{ready, blocked}`; an
 * unpinnable member is reported, never silently treated as pinned.
 */
function resolvePayloads(lock, fetch) {
  const um = require(path.join(ROOT, 'lib', 'updatemodel.js'));
  const verdicts = um.checkLock(lock, (m) => {
    try { return fetch(m) || {}; } catch (_) { return {}; }
  });
  const blocked = verdicts.filter((v) => v.verdict !== 'SAME_BYTES');
  return { ready: blocked.length === 0, blocked, verdicts };
}

/**
 * How far through, and what failed — because `update` is 55 serial child processes.
 *
 * Measured 2026-09-01: 37 skills-CLI steps + 18 plugin calls + one submodule sync, every
 * skills step through `npx --yes` at 22.7 / 25.0 / 34.1 s warm. That is roughly a quarter
 * of an hour of inherited output with no step count, no counter, and — worse — no
 * summary: `run()` returned a bare boolean, `cmdUpdate` ANDed them into `ok` and exited
 * 1, so the ONLY signal that one of the 55 failed was the exit code. Finding the step
 * meant scrolling back through 55 spawns, and re-running cost another quarter hour.
 *
 * `total` is set by the caller that knows the plan; while it is 0 nothing is printed, so
 * `install` and the one-off verbs are untouched.
 */
const progress = { total: 0, done: 0, failed: [] };

function run(cmd, args, opts) {
  const at = progress.total ? `[${++progress.done}/${progress.total}] ` : '';
  log('  » ' + at + cmd + ' ' + args.join(' '));
  const r = spawnSync(cmd, args, Object.assign(
    { stdio: 'inherit', shell: process.platform === 'win32' }, opts || {}));
  const ok = r.status === 0;
  if (!ok && progress.total) progress.failed.push(`${cmd} ${args.join(' ')}`);
  return ok;
}

/**
 * The summary the exit code was standing in for.
 *
 * A re-run line, not just a list: the operator's next question after "what broke" is
 * always "how do I retry just that", and answering it here is cheaper than answering it
 * in a document nobody has open at minute fifteen.
 */
function reportProgress(ok = true) {
  if (!progress.total && !ok) { log('\n== result PARTIAL: a section above names what did not complete =='); return; }
  if (!progress.total) return;
  // B-242: the counter sees only subprocesses. A step that runs in process (the Claude
  // pin transaction, Codex, domains) reports through `ok`, so a partial run never ends
  // on a green line (retro #8: a wrapper's status is not the verdict).
  if (!progress.failed.length && !ok) {
    log(`\n== ${progress.done} of ${progress.total} steps ran; result PARTIAL: a section above names what did not complete ==`);
    return;
  }
  if (!progress.failed.length) {
    log(`\n== ${progress.done} of ${progress.total} steps, all green ==`);
    return;
  }
  log(`\n== FAILED ${progress.failed.length} of ${progress.total} steps ==`);
  for (const cmd of progress.failed) log(`  ✗ ${cmd}`);
  log('\nRe-run just these rather than the whole pass: each line above is the exact');
  log('command, and a repeat of the full run costs about a quarter of an hour.');
}

// The skills CLI auto-detects Claude Code and writes ~/.claude/skills/<id> even when
// we never ask for that agent. While the Claude PLUGIN channel is active those plain
// copies shadow the plugin, so prune them — "one channel per agent", enforced.
// What pruneClaudeShadows WOULD remove, computed without removing it — the same
// list feeds the operation plan (so `--dry-run` can name the deletions) and the
// deletion loop (so the receipt and the act cannot drift apart).
// The Claude config root, honouring CLAUDE_CONFIG_DIR (FIX-UP-08.01): the same
// documented override apply.js's hostRoot uses, so the shadow detector looks
// where Claude ACTUALLY reads its plain skills, not always ~/.claude. Used
// verbatim (spaces preserved), never through a shell.
function claudeRoot() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

const frozenOperations = new WeakMap();

/** Dry-run IS the render: the complete receipt, a typed result, zero mutations. */
function sourceContract(planned) {
  const selected = cmd => planned.steps.some(s => s.kind === 'subprocess' && s.effect.cmd === cmd);
  log(`  Plain-skills source contract: ${selected('npx') ? 'immutable commit selection; this is not installed-byte or native-runtime acceptance' : 'not selected'}.`);
  log(`  Claude native source contract: ${planned.steps.some(s => s.kind === 'claude-pins') ? 'immutable commit plus payload readback required; runtime/model acceptance separate' : 'not selected'}.`);
}

function renderDryRun(planned, mode) {
  log(`\n== --dry-run: the ${mode} plan, rendered: nothing executed ==`);
  sourceContract(planned);
  for (const line of opres.render(planned)) log(line);
  if (mode === 'update') {
    let rec = null;
    try { rec = JSON.parse(fs.readFileSync(path.join(process.env.HOME || os.homedir(), '.sshlg-skills', 'visibility.json'), 'utf8')); } catch (e) { rec = null; }
    if (rec && rec.applied === true && Array.isArray(rec.hosts) && rec.hosts.length) {
      log(`  then: re-apply skill visibility on ${rec.hosts.join(', ')} within this run's scope (consent from \`visibility --apply\`; preview: \`npx sshlg-skills visibility\`)`);
    }
  }
  const res = opres.result({
    scope: 'home', status: 'dry-run',
    evidence: `${planned.steps.length} action(s) planned; 0 mutations`,
  });
  log(`\nresult: ${res.status} (${res.evidence})`);
  return opres.exitCode(res) === 0;
}

/**
 * The resolved host-file set for a routing write, and whether Cursor is in it.
 * host files (CLAUDE/AGENTS/GEMINI) come from plan.resolveScope so the emitter
 * and the resolver agree; Cursor is its own agent and is included only for an
 * unscoped run or one that names it, never for --claude-only.
 */
function scopedRoutingTargets(f) {
  const apply = require('../lib/apply.js');
  const scope = plan.resolveScope({
    agents: f.agents,
    claude: f.claude,
    claudeOnly: f.claudeOnly,
    hosts: apply.TARGETS,
    consumers: [],
  });
  const selected = f.agents && f.agents.length ? new Set(f.agents) : null;
  let includeCursor;
  if (f.claudeOnly) includeCursor = false;
  else if (selected) includeCursor = selected.has('cursor');
  else includeCursor = true;
  // B-206: the other global instruction files, by the same selection.
  const extraTargets = require('../lib/instruction-targets.js').select(f);
  return { hostTargets: scope.hostTargets, includeCursor, extraTargets };
}

/**
 * Whether this run's flags keep the Claude host in scope — the one answer for the
 * settings.json wiring, the runtime copy those entries execute, and the Claude plugin step
 * (final polish 8: an `--agent` list still ran `claude plugin update`) (fix round 2, L: the copy
 * was refreshed under `--no-claude` while its wiring was skipped, so new scripts ran under old
 * entries). `skippedBy` names the flag. An `--agent` list never selects Claude (`--agent
 * claude` is refused by the skills-CLI agent table), so any `--agent` list is out of scope.
 */
function claudeScope(f) {
  const flags = f || {};
  const scope = plan.resolveScope({
    agents: flags.agents, claude: flags.claude, claudeOnly: flags.claudeOnly,
    hosts: require('../lib/apply.js').TARGETS, consumers: [],
  });
  if (scope.hostTargets.some((h) => h.agent === 'claude')) return { inScope: true };
  return { inScope: false, skippedBy: flags.claude === false ? '--no-claude' : `--agent ${(flags.agents || []).join(',')}` };
}

/**
 * Whether this run's flags keep Codex's native plugins in scope (B-166): not under
 * `--claude-only`, and under an `--agent` list only when it names `codex`.
 */
function codexScope(f) {
  const flags = f || {};
  if (flags.claudeOnly) return { inScope: false, skippedBy: '--claude-only' };
  if (flags.agents && flags.agents.length && !flags.agents.includes('codex')) {
    return { inScope: false, skippedBy: `--agent ${flags.agents.join(',')}` };
  }
  return { inScope: true };
}

/**
 * `hosts` — which agent hosts this machine has, and for Pi where the family is visible.
 *
 * Read-only. The instruction-file hosts come from apply.TARGETS (the same list the
 * routing writer uses, so this report and that write cannot disagree about which
 * hosts exist). Pi additionally gets lib/pi.js's skill-root report, because Pi reads
 * skills from several directories and a duplicate name keeps only the first.
 */
/** A path's realpath, or the resolved path when it does not resolve. */
function canonicalPath(p) { try { return fs.realpathSync(p); } catch (_) { return path.resolve(p); } }

function triggersLib() { return require('../lib/triggers.js'); }

function readLineSync() {
  const fs = require('fs');
  const buf = Buffer.alloc(1024);
  try {
    const n = fs.readSync(0, buf, 0, 1024, null);
    return buf.slice(0, n).toString('utf8').trim();
  } catch (e) {
    return '';
  }
}

// ------------------------------------------------------------ uninstall + store

/** Agent channel skills dirs that exist on THIS machine, discovered not recalled. */
function discoverChannels() {
  const skillstore = require('../lib/skillstore.js');
  const home = os.homedir();
  const ls = (d) => { try { return fs.readdirSync(d); } catch (_) { return []; } };
  return skillstore.channelCandidates(home, ls(home).filter((n) => n.startsWith('.')), ls(path.join(home, '.config')))
    .filter((p) => { try { return fs.statSync(p).isDirectory(); } catch (_) { return false; } });
}

function channelEntries(dir) {
  try { return fs.readdirSync(dir).filter((n) => n !== '.' && n !== '..'); } catch (_) { return []; }
}

/** Where the skills CLI keeps its lock on this machine (`$XDG_STATE_HOME` honoured). */
function skillLockFile() {
  return require('../lib/skillstore.js').skillLockPath(os.homedir(), process.env);
}

/** id → upstream repo, from the skills CLI's own lock. Unreadable ⇒ empty: refuse, not approve. */
function lockSources() {
  try {
    const j = JSON.parse(fs.readFileSync(skillLockFile(), 'utf8'));
    const out = {};
    for (const [id, row] of Object.entries(j.skills || {})) out[id] = (row && row.source) || '';
    return out;
  } catch (_) { return {}; }
}

/**
 * Read-only provider inventory (FIX-UP-07.01). A filesystem sweep sees every
 * SKILL.md on disk — hub copies, plugin caches, and HISTORICAL cache versions
 * of the same skill. Counting those candidates as if each were an active
 * provider read 336 files as 336 providers. This resolves candidates into
 * distinct STATES so an old cache plus one enabled version is ONE skill, not a
 * duplicate, and an undecidable precedence is reported UNKNOWN rather than
 * guessed.
 *
 * Pure. `candidates` is what the caller read off disk, each:
 *   { skillId, host, scope, namespace, realpath, digest, version,
 *     installed, enabled, applicable, loaded }
 * Grouped by (host, scope, skillId). Within a group the ACTIVE provider is the
 * single installed+enabled+applicable one; the rest are `historical`. Two
 * enabled providers → precedence UNKNOWN (never a coin toss). No enabled one →
 * `installed-not-enabled` or `none`.
 */
function resolveProviders(candidates) {
  const groups = new Map();
  for (const c of Array.isArray(candidates) ? candidates : []) {
    if (!c || !c.skillId) continue;
    const key = [c.host || '?', c.scope || '?', c.skillId].join('\u0000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const out = [];
  for (const [key, members] of groups) {
    const [host, scope, skillId] = key.split('\u0000');
    const active = members.filter((m) => m.installed && m.enabled && m.applicable);
    let state; let chosen = null; let precedence = 'n/a';
    if (active.length === 1) {
      state = 'active';
      chosen = active[0];
    } else if (active.length > 1) {
      // More than one installed+enabled+applicable: the sweep cannot say which
      // one the host would load. Do NOT pick — report it.
      state = 'active';
      precedence = 'UNKNOWN';
    } else if (members.some((m) => m.installed)) {
      state = 'installed-not-enabled';
    } else {
      state = 'none';
    }
    const historical = members.filter((m) => m !== chosen);
    out.push({
      host, scope, skillId, state, precedence,
      active: chosen ? {
        realpath: chosen.realpath, digest: chosen.digest, version: chosen.version,
        namespace: chosen.namespace, loaded: !!chosen.loaded,
      } : null,
      // Historical candidates (older caches, disabled copies) are recorded so a
      // sweep can SHOW them without treating them as active providers.
      historical: historical.map((m) => ({
        realpath: m.realpath, digest: m.digest, version: m.version,
        installed: !!m.installed, enabled: !!m.enabled,
      })),
      candidateCount: members.length,
    });
  }
  return out;
}

Object.assign(module.exports, {
  plan, opres, atomic, ROOT, manifest, SKILLS, log, cliSpec, pinnedArgv, resolvePayloads,
  progress, run, reportProgress, claudeRoot, frozenOperations, sourceContract, renderDryRun,
  scopedRoutingTargets, claudeScope, codexScope, canonicalPath, triggersLib, readLineSync,
  discoverChannels, channelEntries, skillLockFile, lockSources, resolveProviders, lazy
});
