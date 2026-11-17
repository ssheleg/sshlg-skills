'use strict';
/**
 * `install` and `update`: the plans, the Claude channel, extra roots, the shadow prune and the
 * update lock.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  ROOT, SKILLS, channelEntries, claudeRoot, claudeScope, cliSpec, codexScope, frozenOperations,
  lazy, lockSources, log, manifest, opres, pinnedArgv, plan, progress, renderDryRun,
  reportProgress, run, sourceContract
} = require('./cli-core.js');
const attachWaitPlan = lazy('./cli-rules.js', 'attachWaitPlan');
const cmdDomains = lazy('./cli-domains.js', 'cmdDomains');
const cmdRouters = lazy('./cli-routers.js', 'cmdRouters');
const codexHeldNow = lazy('./cli-codex.js', 'codexHeldNow');
const executeWaitPlan = lazy('./cli-rules.js', 'executeWaitPlan');
const gateHostsInScope = lazy('./cli-rewire.js', 'gateHostsInScope');
const gateOptions = lazy('./cli-rewire.js', 'gateOptions');
const planCodexSteps = lazy('./cli-codex.js', 'planCodexSteps');
const refreshCodexPlugins = lazy('./cli-codex.js', 'refreshCodexPlugins');
const refreshHostGates = lazy('./cli-rewire.js', 'refreshHostGates');
const refreshSchedule = lazy('./cli-schedule.js', 'refreshSchedule');
const rewireConsentedHooks = lazy('./cli-rewire.js', 'rewireConsentedHooks');
const rewireStep = lazy('./cli-rewire.js', 'rewireStep');
const runVisibility = lazy('./cli-visibility.js', 'runVisibility');
const scheduleStep = lazy('./cli-schedule.js', 'scheduleStep');
const withUpdateLock = lazy('./cli-schedule.js', 'withUpdateLock');
const writeOutcome = lazy('./cli-codex.js', 'writeOutcome');

function shadowCandidates() {
  const base = path.join(claudeRoot(), 'skills');
  const ls = (d) => { try { return fs.readdirSync(d); } catch (_) { return []; } };

  // The INSTALLED set, not the marketplace list. Those are separate operations and a
  // marketplace outlives its plugin, so pruning on the marketplace deleted the plain
  // copy of a member whose plugin was gone — the only copy, and the skill with it.
  // Unreadable registry ⇒ empty set ⇒ nothing is pruned: a guard that never received
  // its input refuses rather than approves.
  // The record PER MARKETPLACE, not just its key (FIX-UP-04.01). A registry
  // key with an empty installPath array and no cache payload is not a provider,
  // and pruning the sole plain copy behind it deletes a working skill. The
  // record is passed whole and gated through plan.providerVerified with a
  // real filesystem probe below.
  const installedRecords = () => {
    try {
      const reg = JSON.parse(fs.readFileSync(
        path.join(claudeRoot(), 'plugins', 'installed_plugins.json'), 'utf8'));
      const byMarketplace = {};
      for (const [spec, record] of Object.entries(reg.plugins || {})) {
        const mkt = spec.split('@')[1];
        if (!mkt) continue;
        // A marketplace may host more than one plugin; concatenate their records.
        byMarketplace[mkt] = (byMarketplace[mkt] || []).concat(record || []);
      }
      return byMarketplace;
    } catch (_) { return {}; }
  };

  // Payload closure + digest: an installPath is a verified provider only when
  // the directory exists AND holds a SKILL.md (the payload a host would load),
  // not merely a path string a stale registry left behind.
  const payloadExists = (installPath) => {
    try {
      if (!fs.statSync(installPath).isDirectory()) return false;
      // SKILL.md directly, or one skill dir deep (plugins ship skills/<name>/SKILL.md).
      if (fs.existsSync(path.join(installPath, 'SKILL.md'))) return true;
      const skillsDir = path.join(installPath, 'skills');
      if (!fs.existsSync(skillsDir)) return false;
      return fs.readdirSync(skillsDir).some(
        (d) => fs.existsSync(path.join(skillsDir, d, 'SKILL.md')));
    } catch (_) { return false; }
  };

  // A copy is a shadow only where a plugin of the SAME MEMBER is installed AND
  // VERIFIED — which is not the same question as "is this run touching
  // plugins", nor "does the registry name it". That proxy is what let `update
  // --no-claude` create a copy and walk away from it, and a stale registry key
  // authorise deleting the only copy that worked.
  const members = SKILLS.map(s => ({
    name: s.name,
    marketplace: s.pluginInstall.split('@')[1],
    skillNames: s.skillNames,
  }));
  return plan.shadowsToPrune(members, installedRecords(), ls(base), payloadExists);
}

// Recoverable pruning (FIX-UP-04.02): capture each shadow copy to a verified
// quarantine before deleting it, so a wrong prune or an injected failure can be
// restored to exactly what was there. lib/quarantine.js prune() does the capture,
// the manifest and only then the delete, under the same root the candidates were
// read from (B-355).
function pruneClaudeShadows() {
  const q = require('../lib/quarantine.js');
  const candidates = shadowCandidates();
  const r = q.prune(candidates, { root: claudeRoot() });
  if (r.archived) log(`  previous quarantine archived: ${r.archived}`);
  if (r.error) log(`  shadow prune skipped: ${r.error}`);
  if (r.pruned.length) {
    log(`  pruned Claude plain copies that would shadow the plugin (quarantined, restorable): ${r.pruned.join(', ')}`);
  }
}

function skillsCliAgents(f) {
  // Never let the skills CLI drop a plain Claude copy while we manage Claude via plugin.
  const chosen = plan.resolveAgents(manifest.defaultAgents, f);
  return defaultScope(f) ? defaultPresence(chosen).present : chosen;
}

/** No --agent and no --all: the run's targets are the manifest defaults. */
function defaultScope(f) { return !f.all && !(f.agents && f.agents.length); }

/**
 * B-218 / INST-9: the skills CLI creates the home of every target it is given, so
 * a default target counts only when its home exists here. An explicit --agent or
 * --all is the operator's choice and is passed as asked.
 */
function defaultPresence(ids) {
  return require('../lib/host-targets.js').presence(ids, { home: os.homedir(), env: process.env, exists: p => fs.existsSync(p) });
}

/**
 * Run one planned skills-CLI command, labelled by what it acts on: the repo
 * for an `add`, the skill id for an `update`.
 */
function runPlanned(argv) {
  log(`\n- ${argv[2]} ${argv[3]}`);
  return run('npx', pinnedArgv(argv));
}

/**
 * The immutable plan `install` would execute — built BEFORE anything runs.
 *
 * Finding UP-02: `--dry-run` was accepted for every command and `install`/
 * `update` executed their subprocesses and deletions anyway. The plan is built
 * from one pinned plain-skills plan. Execution consumes its frozen argv; the
 * shadow candidates are re-read after installation before any pruning.
 */
function plainSkillsPlan(f, update = false) {
  if (f.claudeOnly) return [];
  if (cliSpec() !== 'skills@1.7.2') throw new Error('immutable source contract requires verified skills@1.7.2');
  return require('../lib/installer-pins').build(SKILLS, update ? updateAgents(f) : skillsCliAgents(f),
    { continueCopies: update && continueRestoreWanted(f) });
}

/**
 * B-216: family links in host roots outside the default set (Qwen Code, Devin, Droid,
 * Grok). Read here; every decision is lib/extraroots.js's. One `decide()` row per root.
 */
function extraRootPlans(f) {
  const X = require('../lib/extraroots.js');
  const home = process.env.HOME || os.homedir();
  const sharedRoot = path.join(home, '.agents', 'skills');
  const familyIds = SKILLS.flatMap((s) => plan.skillIds(s));
  const lock = lockSources();
  const scope = { agents: f.agents && f.agents.length ? f.agents : null, claudeOnly: !!f.claudeOnly };
  const which = require('../lib/pi.js').whichBin;
  // B-262: the operator's acknowledgements, read once; an unreadable config acknowledges nothing.
  let acks = {};
  try { const C = require('../lib/config.js'); acks = C.extraAckGet(C.readConfig(home)); } catch (_) { acks = {}; }
  return X.hosts(home, process.env).map((h) => {
    const entries = observedEntries(h.dir);
    const installed = !!which(h.bin) || channelEntries(h.base).some((n) => n !== 'skills' && !n.startsWith('.'));
    return X.decide({ host: h, assessed: X.assess({ entries, familyIds, lock, sharedRoot }), installed, scope, ack: acks[h.agent] });
  });
}

/**
 * One skills root as observed: each entry's name, whether it is a link, its target resolved
 * lexically from the link, whether it resolves, and whether it is a directory. Read-only.
 */
function observedEntries(dir) {
  const entries = [];
  for (const name of channelEntries(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    let st;
    try { st = fs.lstatSync(full); } catch (_) { continue; }
    const isSymlink = st.isSymbolicLink();
    let target = null;
    if (isSymlink) { try { target = path.resolve(dir, fs.readlinkSync(full)); } catch (_) { target = null; } }
    let isDir = false, live = true;
    try { isDir = fs.statSync(full).isDirectory(); } catch (_) { live = false; }
    entries.push({ name, path: full, isSymlink, target, live, isDir });
  }
  return entries;
}

/** The agents `update` hands the skills CLI: the run's set plus the extra roots to refresh (B-216). */
function updateAgents(f) {
  const base = skillsCliAgents(f);
  if (f.claudeOnly) return base;
  return [...new Set(base.concat(extraRootPlans(f).map((d) => d.addAgent).filter(Boolean)))];
}

/** Report the extra roots and remove the dangling family links the frozen plan named (B-216). */
function reconcileExtraRoots(f, planned) {
  const step = planned.steps.find((s) => s.kind === 'prune' && s.effect.extraRoots);
  if (!step) return true;
  const allowed = new Set(step.effect.paths || []);
  const q = require('../lib/extraroots.js').q;
  let ok = true;
  log('\n== Family links in other host roots (B-216) ==');
  for (const d of extraRootPlans(f)) {
    if (d.action === 'out-of-scope') continue;
    for (const line of d.lines) log(`  ${line}`);
    for (const p of d.prune) {
      if (!allowed.has(p)) { log(`  not removed (found after the plan was frozen; the next update takes it): ${p}`); continue; }
      let target;
      try { if (!fs.lstatSync(p).isSymbolicLink()) continue; target = fs.readlinkSync(p); } catch (_) { continue; }
      if (fs.existsSync(p)) continue;  // its target came back: live again, kept
      try {
        fs.unlinkSync(p);
        log(`  removed dangling family link ${p} -> ${target} (to recreate: ln -s ${q(target)} ${q(p)})`);
      } catch (e) { ok = false; log(`  NOT removed ${p}: ${e.code || e.message}`); }
    }
  }
  return ok;
}

function planInstall(f) {
  const steps = [];
  if (!f.claudeOnly) {
    for (const argv of plainSkillsPlan(f)) {
      steps.push(opres.step('subprocess', 'home', `skills add ${argv[3]}`, { cmd: 'npx', args: pinnedArgv(argv) }));
    }
    steps.push(opres.step('prune', 'home',
      'remove plain Claude copies shadowing an installed plugin (re-computed after the CLI runs)',
      { paths: shadowCandidates().map(id => path.join(claudeRoot(), 'skills', id)) }));
  }
  if (!f.member) {
    steps.push(opres.step('router-block', 'home',
      'refresh the managed routing block (its own consent and dry-run rules apply)',
      { mode: 'install' }));
  }
  const sched = scheduleStep(f);
  if (sched) steps.push(sched);
  return withClaudePlan(steps, f);
}

// B-242: which scopes a native job moves, and which aliased local paths it leaves.
function scopesNote(j) {
  const t = j.targets || [], local = t.filter(x => x.scope === 'local');
  if (!local.length && !(j.aliases || []).length) return '';
  const moving = t.filter(x => !x.exact).length;
  return `; scopes: ${t.some(x => x.scope === 'user') ? 'user + ' : ''}${local.length} local, ${moving} to move`
    + ((j.aliases || []).length ? `; left as recorded: ${j.aliases.map(a => `${a.projectPath} (alias of ${a.real})`).join(', ')}`
      // B-243: an old path that is a symlink to the renamed folder has a reported remedy.
      + (j.aliases.some(a => { try { return a.projectPath !== a.real && fs.realpathSync(a.projectPath) === a.real; } catch (_) { return false; } })
        ? ' (an old path Claude cannot address; remedy: `npx sshlg-skills hosts`)' : '')
      // B-264: a worktree or subdirectory record beside its repository root's record.
      + (j.aliases.some(a => { try { return fs.realpathSync(a.projectPath) === a.projectPath; } catch (_) { return false; } })
        ? ' (a worktree or subdirectory Claude addresses at its repository root; remedy: `npx sshlg-skills hosts`)' : '') : '');
}

// Private snapshots contain settings values and never enter printable effects.
const claudePlans = new WeakMap();

function withClaudePlan(steps, f) {
  let native = null, inventory = null;
  if (claudeScope(f).inScope) {
    inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'claude-plugin-pins.json'), 'utf8'));
    native = require('../lib/claude-pinned').prepare(SKILLS, inventory,
      { home: os.homedir(), profileRoot: claudeRoot() });
    steps.unshift(opres.step('claude-pins', 'home',
      'native immutable source transaction; protected catalogs/settings, scoped repair, rollback on failure, payload readback',
      { fingerprint: native.fingerprint, profile: native.profile,
        members: native.jobs.filter(j => j.action !== 'rebind').map(j => `${j.pluginInstall}: ${j.action} @ ${j.row.commit}; ${j.row.files.length} files${scopesNote(j)}`)
          .concat(native.equivalent.map(e => `${e.pluginInstall}: payload-equivalent (installed ${String(e.installed).slice(0, 7)}, pin ${e.pin.slice(0, 7)}; ${e.files} files equal): source rebind, no reinstall`))
          .concat(native.blocked.map(b => `${b.pluginInstall}: blocked, left as installed: ${b.reason}`)),
        journal: path.join(native.transactionRoot, 'latest.json') }));
  }
  const result = attachWaitPlan(steps, f);
  if (native) claudePlans.set(result, { native, inventory });
  return result;
}

function runClaudePlan(planned, f) {
  const saved = claudePlans.get(planned);
  if (!saved) {
    log(`\n== Updating Claude Code plugins ==\n  skipped: ${claudeScope(f).skippedBy} (the Claude host is outside this run's scope)`);
    return { ok: true, partial: false };
  }
  for (const e of saved.native.equivalent) log(`    ${e.member || e.name}: payload equals pin ${e.pin.slice(0, 7)} (${e.files} files); no reinstall: only its marketplace source moves to the pin catalog`);
  for (const b of saved.native.blocked) log(`    ${b.name}: blocked, left as installed: ${b.reason}`);
  const clean = !saved.native.blocked.length;
  if (!saved.native.jobs.length) {
    // Nothing is written; still describe the state at apply time, not at preview.
    let again;
    try { again = require('../lib/claude-pinned').prepare(SKILLS, saved.inventory, { home: os.homedir(), profileRoot: claudeRoot() }); }
    catch (e) { log(`  Claude native transaction refused before execution: ${e.message}`); return { ok: false, partial: false }; }
    if (again.fingerprint !== saved.native.fingerprint) { log('  Claude native state changed since the preview; run update again'); return { ok: false, partial: false }; }
    // B-326: a failed transaction that left nothing of its own in settings.json is marked
    // recovered here too, or its journal would read failed on every later run.
    if (again.recover) {
      try { const r = require('../lib/claude-pin-transaction').recover(again); if (r) log(`  Claude native transaction: earlier failed journal recovered (${r.receipt})`); }
      catch (e) { log(`  Claude native transaction: earlier journal not recovered: ${e.message}`); return { ok: false, partial: false }; }
    }
    log(clean ? '  Claude native transaction: not needed: every member already carries its pinned payload'
      : '  Claude native transaction: nothing else to do; blocked members above keep their installed version (partial)');
    return { ok: true, partial: !clean };
  }
  // Admission, version check and all backups happen before any other channel.
  let result;
  try { result = require('../lib/claude-pin-transaction').execute(saved.native, SKILLS, saved.inventory); }
  catch(e) { log(`  Claude native transaction refused before execution: ${e.message}`); return { ok: false, partial: false }; }
  log(`  Claude native transaction: ${result.ok ? 'verified immutable payloads' : 'failed; inspect recovery receipt'}, receipt ${result.receipt}`);
  for (const r of result.results) log(`    ${r.member}: ${r.status}${r.rollback ? '; rollback: ' + r.rollback : ''}`);
  if (result.error) log(`  ${result.error}`);
  if (!clean) log('  Claude: partial, blocked members above keep their installed version');
  // A blocked member makes the result partial; the other channels still run.
  return { ok: result.ok, partial: !clean };
}

/** The same contract for `update` — every subprocess, prune, router and runtime action. */
function planUpdate(f) {
  const steps = [];
  if (!f.claudeOnly && fs.existsSync(path.join(ROOT, '.gitmodules'))) {
    steps.push(opres.step('subprocess', 'checkout',
      f.bumpPins ? 'bump submodule pins to upstream tips (--bump-pins)'
        : 'materialize pinned submodules (pins unchanged)',
      { cmd: 'git', args: f.bumpPins
        ? ['-C', ROOT, 'submodule', 'update', '--init', '--remote', '--merge']
        : ['-C', ROOT, 'submodule', 'update', '--init', '--recursive'] }));
  }
  if (!f.claudeOnly) {
    for (const argv of plainSkillsPlan(f, true)) {
      steps.push(opres.step('subprocess', 'home', `skills ${argv[2]} ${argv[3]}`, { cmd: 'npx', args: pinnedArgv(argv) }));
    }
    steps.push(opres.step('prune', 'home',
      'remove plain Claude copies shadowing an installed plugin (re-computed after the CLI runs)',
      { paths: shadowCandidates().map(id => path.join(claudeRoot(), 'skills', id)) }));
    // B-216: roots outside the default set that hold family entries.
    const extra = extraRootPlans(f).filter((d) => d.action === 'refresh' || d.action === 'report' || d.prune.length);
    if (extra.length) {
      const of = (a) => extra.filter((d) => d.action === a).map((d) => d.agent);
      const paths = extra.flatMap((d) => d.prune);
      steps.push(opres.step('prune', 'home',
        `family links in host roots outside the default set: refresh ${of('refresh').join(', ') || 'none'}; `
          + `report ${of('report').join(', ') || 'none'}; remove ${paths.length} dangling family link(s)`,
        { paths, extraRoots: 'B-216' }));
    }
  }
  if (!f.member) {
    steps.push(opres.step('router-block', 'home',
      'refresh the managed routing block (its own consent and dry-run rules apply)',
      { mode: 'update' }));
  }
  const sched = scheduleStep(f);
  if (sched) steps.push(sched);
  try {
    const rtScope = runtimeScopeFor(f);
    steps.push(opres.step('runtime-sync', 'runtime',
      rtScope.inScope ? `refresh the wired hook runtime copy (create: false) for ${rtScope.hosts.join(', ')}`
        : `wired hook runtime copy: out of scope (skipped: ${rtScope.skippedBy}), moves with its wiring`,
      { root: require('../lib/hooks.js').runtimeDir(os.homedir()) }));
  } catch (_) { /* no runtime dir resolvable — the execution path reports it */ }
  // The one write to an operator file this run can make outside the routing block.
  steps.push(rewireStep(f));
  // Codex's native plugins, through Codex's own CLI (B-166).
  steps.push(...planCodexSteps(f));
  // Domain members per project (L5): additions only on a machine where `domains --apply` ran.
  if (claudeScope(f).inScope) {
    const rec = path.join(os.homedir(), '.sshlg-skills', 'domains.json');
    steps.push(opres.step('domain-members', 'home', fs.existsSync(rec)
      ? 'give projects that gained a domain dependency their member (project entries first, read back; through protect())'
      : 'domain members: `domains --apply` never ran here: one line if a project calls for one, nothing written',
    { file: rec }));
  }
  return withClaudePlan(steps, f);
}

function cmdInstall(f) {
  const planned = frozenOperations.get(f) || planInstall(f);
  if (f.dryRun) return renderDryRun(planned, 'install');
  const claude = runClaudePlan(planned, f);
  if (!claude.ok) return false;
  let ok = !claude.partial;
  if (!f.claudeOnly) {
    const agents = skillsCliAgents(f);
    log(`\n== Installing to agents via skills CLI: ${agents.join(', ') || 'none (no target host installed here)'} ==`);
    for (const step of planned.steps.filter(s => s.kind === 'subprocess' && s.effect.cmd === 'npx')) {
      ok = runPlanned(step.effect.args) && ok;
    }
    // Unconditional: the skills CLI auto-detects Claude Code and drops a plain
    // copy whether or not this run was asked to manage plugins, and the copy
    // decides nothing about the flag it was created under.
    pruneClaudeShadows();
  }
  ok = executeWaitPlan(planned) && ok;
  ok = refreshBlock(f, 'install') && ok;
  ok = refreshSchedule(f) && ok;
  printUpdateModel('install');
  sourceContract(planned);
  return ok;
}

/**
 * Bring the managed block level with what was just installed.
 *
 * Until this call existed, `routers` was a separate command the operator had
 * to remember. A member could ship, `update` could run to completion, and the
 * block would go on describing the family as it was — so "the instruction
 * agents read is current" was false by construction, not by accident.
 *
 * The block's own rules are untouched: the operator's wording still wins,
 * consent is still asked once and recorded, and drift is still only reported.
 * What changes is that nobody has to remember a fourth command.
 */
function refreshBlock(f, mode) {
  if (f.member) return true; // a lone member's installer speaks only for itself
  log('\n== Refreshing the routing block ==');
  // Carry the SAME scope the run was given (FIX-UP-03.02): a --no-claude /
  // --agent / --claude-only install must not rewrite the host files it did not
  // select. Dropping agents/claudeOnly here is exactly how the refresh touched
  // all three files after a scoped run.
  return cmdRouters({
    agents: f.agents,
    claude: f.claude,
    claudeOnly: f.claudeOnly,
    dryRun: f.dryRun,
    routers: f.routers,
    mode,
  });
}

function cmdUpdate(f) {
  const planned = frozenOperations.get(f) || planUpdate(f);
  if (f.dryRun) return renderDryRun(planned, 'update');
  const claude = runClaudePlan(planned, f);
  if (!claude.ok) return false;
  let ok = !claude.partial;
  // Count and execute the subprocess entries from the same frozen plan.
  progress.total =
    (!f.claudeOnly && fs.existsSync(path.join(ROOT, '.gitmodules')) ? 1 : 0)
    + planned.steps.filter(s => s.kind === 'subprocess' && s.effect.cmd === 'npx').length
    + planned.steps.filter(s => s.kind === 'subprocess' && s.effect.cmd === 'claude').length;
  progress.done = 0;
  progress.failed = [];
  if (progress.total) log(`\n== ${progress.total} steps ==`);
  // 1. Submodules are PINNED snapshots. Only materialize them (--init), never
  //    move the pins — unless the operator explicitly asks with --bump-pins.
  //    Skipped entirely for --claude-only: that flag must not touch the checkout.
  if (!f.claudeOnly && fs.existsSync(path.join(ROOT, '.gitmodules'))) {
    if (f.bumpPins) {
      log('\n== Bumping submodule pins to upstream tips (--bump-pins) ==');
      ok = run('git', ['-C', ROOT, 'submodule', 'update', '--init', '--remote', '--merge']) && ok;
      log('  ! checkout pins moved; this install still uses the published commit inventory. Stage the gitlinks, then run node scripts/sync-member-pins.js --write for the next release.');
    } else {
      log('\n== Materializing pinned submodules (pins unchanged) ==');
      ok = run('git', ['-C', ROOT, 'submodule', 'update', '--init', '--recursive']) && ok;
    }
  }
  if (!f.claudeOnly) {
    // Re-add each repository at the published commit. The upstream add command
    // overwrites existing payloads, so no unpinned `skills update` precedes it.
    const agents = updateAgents(f);
    log(`\n== Reconciling plain-skills at immutable commits: ${agents.join(', ') || 'none (no target host installed here)'} ==`);
    for (const step of planned.steps.filter(s => s.kind === 'subprocess' && s.effect.cmd === 'npx')) {
      ok = runPlanned(step.effect.args) && ok;
    }
    pruneClaudeShadows();
    ok = reconcileExtraRoots(f, planned) && ok;
  }
  // `update`, never `install`: a machine that has no block has not consented
  // to one, and an update is not the moment to ask.
  ok = executeWaitPlan(planned) && ok;
  ok = refreshBlock(f, 'update') && ok;

  // The wired copy the hooks actually EXECUTE. Until v0.47.0 this was the one thing
  // `update` did not update: the copy lived in a closure inside `cmdHooks` and ran on
  // `hooks install` alone, so a machine that only ran `update` kept executing hook code
  // from whichever release last installed them. Watched on a real machine at v0.46.0 —
  // 24 modules against the package's 25, and the missing one was that release's whole
  // point (`B-22`). Refresh only: `create` stays false, because a machine with no
  // runtime has not consented to hooks and an update is not the moment to ask. Scoped like
  // the wiring below (fix round 2, L): a run that leaves the Claude host alone leaves both,
  // unless Codex's hooks run the same copy and Codex is in scope (B-277).
  let runtimeReady = true;
  const rtScope = runtimeScopeFor(f);
  if (!rtScope.inScope) {
    log(`\n== Wired hook runtime ==\n  skipped: ${rtScope.skippedBy} (no host whose hooks run it is in this run's scope; `
      + 'the copy its hooks execute moves with their wiring)');
  } else {
    try {
      const rt = require('../lib/runtime.js');
      const root = require('../lib/hooks.js').runtimeDir(os.homedir());
      const before = rt.stale(ROOT, root);
      const r = rt.sync(ROOT, root, { create: false });
      if (r.ok === false) throw new Error(r.reason);
      if (r.reason) {
        log(`\n== Wired hook runtime ==\n  skipped: ${r.reason}`);
      } else {
        const moved = before.missing.length + before.differing.length;
        log(`\n== Wired hook runtime ==`);
        log(`  ${root} (for: ${rtScope.hosts.join(', ')})`);
        log(moved
          ? `  refreshed ${r.copied.length} file(s): ${before.missing.length} new, `
            + `${before.differing.length} changed`
          : '  already level with this package');
        for (const m of before.missing) log(`    + ${m}`);
        if (r.retired && r.retired.length) log(`  retired ${r.retired.length} file(s) this package dropped (kept under ${root}/.retired/): ${r.retired.join(', ')}`);
        if (r.ownedError) log(`  warning: ${r.ownedError}`);
      }
    } catch (e) {
      // Other update steps may finish, but failed runtime refresh makes the aggregate red.
      runtimeReady = false;
      log(`\n== Wired hook runtime ==\n  NOT refreshed: ${e.message}`);
      ok = false;
    }
  }
  // The settings entries that point AT that copy (R03, wave 1). Until 1.56.0 `update`
  // refreshed the scripts and never re-applied their wiring, so 1.55.1's widened
  // PreToolUse matcher never reached a machine that had run `hooks install` before it.
  // A machine that has consented (one entry of ours in settings.json) is re-wired here;
  // one that has not is left alone — an update is not the moment to ask.
  if (runtimeReady) ok = rewireConsentedHooks(f) && ok;
  // B-280: the guard entries other hosts carry are refreshed the same way, never added.
  if (runtimeReady) ok = refreshHostGates(f) && ok;
  // Skill visibility (B-143, wave L1). A machine whose record shows the operator ran
  // `visibility --apply` gets it again, with the same window and --keep, so skills the
  // refresh above just added are hidden by the same rule on every host. One with no
  // record has not consented — an update is not the moment to ask.
  ok = reapplyVisibility(f) && ok;
  // The nightly job and its runner copy (B-323), after the hook runtime: one copy at a time,
  // and none at all after the hook runtime copy failed (a disk that refused one copy is not
  // given a second; the job keeps its last good runner until a clean run).
  if (runtimeReady) ok = refreshSchedule(f) && ok;
  else log('\n== Nightly update job ==\n  left as it is: the hook runtime refresh failed first');
  // Inspect native Codex AFTER our visibility writes so a deferred receipt binds
  // the final profile bytes. Version replacement remains deferred: active threads
  // may retain old payload paths; listing is not generation-retirement proof.
  let restOk = ok; // everything but Codex, for the unattended runner's record (B-323)
  const codexOk = refreshCodexPlugins(f);
  ok = codexOk && ok;
  // Domain members per project (L5). Once `domains --apply` ran here, a project that gained a
  // domain dependency gets its member now; before that, one line says what `domains` would do.
  if (claudeScope(f).inScope) {
    try { const d = cmdDomains(['', '', 'domains', '--update-step']) === 0; ok = d && ok; restOk = d && restOk; }
    catch (e) { log(`\n== Domain members ==\n  not reconciled: ${e.message}`); ok = false; restOk = false; }
  }
  writeOutcome(require('../lib/updatecheck.js').updateOutcome({ ok, codexOk, codexHeld: codexHeldNow(), restOk }));

  printUpdateModel('update');

  reportProgress(ok);
  sourceContract(planned);
  return ok;
}

/**
 * Re-apply `visibility` inside `update`, scoped like the rest of the run. Claude and Codex
 * follow `claudeScope` / `codexScope` (so `--no-claude` and `--agent claude-code`, which
 * keep the Claude host out, keep it out here too); the other hosts are in scope with no
 * `--agent` list, or when the list names their skills-CLI agent id.
 */
function visibilityScope(f) {
  // Host id -> skills-CLI agent id, owned by lib/hostvis.js (B-214: Kimi is kimi-code-cli).
  const VIS_AGENT = require('../lib/hostvis.js').AGENT;
  const flags = f || {};
  const out = new Set();
  if (claudeScope(flags).inScope) out.add('claude');
  if (codexScope(flags).inScope) out.add('codex');
  if (flags.claudeOnly) return out;
  const list = flags.agents && flags.agents.length ? flags.agents : null;
  for (const [id, agent] of Object.entries(VIS_AGENT)) if (!list || list.includes(agent)) out.add(id);
  return out;
}

/**
 * Consent is explicit (L1 fix round). `visibility --apply` records `applied: true` and the
 * hosts it covered; `--revert` withdraws it. `update` — which also runs unattended, from
 * the idle hook and Fabric Dashboards — re-applies only with that consent, only on the
 * hosts the record lists, and only within this run's scope. A record from before consent
 * was recorded (1.55.x: no `applied`, no `keep`) is never extended to new hosts: one line
 * says how to re-arm, and nothing is written.
 */
function reapplyVisibility(f) {
  const home = process.env.HOME || os.homedir();
  const recordPath = path.join(home, '.sshlg-skills', 'visibility.json');
  if (!fs.existsSync(recordPath)) return true;
  let rec = {};
  try { rec = JSON.parse(fs.readFileSync(recordPath, 'utf8')); } catch (e) {
    log(`\n== Skill visibility ==\n  not re-applied: ${recordPath} does not parse (${e.message}); run \`npx sshlg-skills visibility --apply\` once to re-arm`);
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(rec, 'applied')) {
    log('\n== Skill visibility ==\n  not re-applied, the record predates explicit consent. Run `npx sshlg-skills visibility --apply [--keep …]` once to re-arm');
    return true;
  }
  if (rec.applied !== true) return true;
  const scope = visibilityScope(f);
  const only = new Set((Array.isArray(rec.hosts) ? rec.hosts : []).filter((h) => scope.has(h)));
  if (!only.size) return true;
  log(`\n== Skill visibility (re-applied: this machine ran \`visibility --apply\`; hosts: ${[...only].join(', ')}) ==`);
  return runVisibility({
    mode: 'apply', days: Number(rec.days) || undefined, keep: Array.isArray(rec.keep) ? rec.keep : [], only, reapply: true,
    // A record from before the name-only tier carries no fullDays: re-apply keeps the old
    // behaviour until the operator runs `visibility --apply` once (B-254, explicit consent).
    fullDays: typeof rec.fullDays === 'number' ? rec.fullDays : null,
  }) === 0;
}

/**
 * `update` under `~/.sshlg-skills/update.lock` (R05). A preview writes nothing and takes
 * no lock. A live holder is a refusal with exit 75 (EX_TEMPFAIL, `lock.BUSY_EXIT`; exit 2
 * stays the usage-error code) naming its pid and age; a dead one (or
 * a stale one written on another host) is taken over and logged. The lock is released on
 * the normal return, a throw, and `process.exit` elsewhere in the run (the `exit`
 * handler).
 *
 * **No signal handlers, on purpose** (fix round #1). The run is synchronous — every step
 * is a `spawnSync` — so a JS handler for SIGINT/SIGTERM/SIGHUP can only run once the whole
 * body has finished: registering one REPLACED Node's default terminate-on-signal with a
 * handler that never got a turn, and Ctrl-C or a supervisor's SIGTERM no longer stopped
 * `update` (measured: exit 0, every remaining step ran). Without handlers the signal kills
 * the process at once; the lock it leaves names a dead pid, and the next `update` takes it
 * over by the dead-pid rule and says so.
 */
function runUpdateLocked(f) {
  if (f.dryRun) return cmdUpdate(f) ? 0 : 1;
  // One lock helper for every command that takes update.lock (B-324: `config set update.mode`
  // and `schedule --apply/--revert` take it too), so their refusals read alike.
  return withUpdateLock('update', () => (cmdUpdate(f) ? 0 : 1));
}

/**
 * B-277: the runtime copy's scope: every host whose hooks execute it (Claude while its host
 * is in scope; Codex while in scope with an entry of ours in its hooks.json). Decided by
 * `lib/hooks.js runtimeScope`; this only reads Codex's hooks file (an unreadable one is
 * no consent).
 */
function runtimeScopeFor(f) {
  const hooksLib = require('../lib/hooks.js');
  const home = os.homedir();
  let codexHooks = null;
  try {
    codexHooks = JSON.parse(fs.readFileSync(path.join(hooksLib.codexRoot(home), 'hooks.json'), 'utf8'));
  } catch (_) { /* absent or unparseable: Codex has not consented here */ }
  // B-280: a host whose guard entry runs the copy keeps it in scope too.
  let gated = [];
  try {
    const gateLib = require('../lib/hostgate-install.js');
    const opts = gateOptions();
    gated = gateHostsInScope(f).filter((h) => gateLib.planRemoval(h, opts).state === 'remove');
  } catch (_) { gated = []; }
  return hooksLib.runtimeScope({
    claude: claudeScope(f), codex: codexScope(f), codexHooks, root: hooksLib.runtimeDir(home), gated,
  });
}

/**
 * The last thing install and update print: how the next version gets here.
 *
 * An installer that never mentions updates has still chosen a model — "never" — and the
 * operator finds out months later. `lib/updatemodel.js` holds the words and the reason
 * auto-update is off for a family that is pinned as a set.
 */
function printUpdateModel(mode) {
  try {
    const um = require(path.join(ROOT, 'lib', 'updatemodel.js'));
    const marketplaces = SKILLS.map((s) => s.pluginInstall.split('@')[1]).filter(Boolean);
    const findings = um.autoUpdateState(process.env.HOME || os.homedir(), marketplaces);
    // The notice describes the ACTUAL state, so it has to be asked for it.
    const cfgLib = require('../lib/config.js');
    const updateMode = cfgLib.updateMode(cfgLib.readConfig(process.env.HOME || os.homedir()));
    for (const line of um.notice(mode, findings, updateMode)) log(line);
  } catch (e) {
    // Never fail an install over its own closing note.
    log(`\n== How the next version arrives ==\n  not printed: ${e.message}`);
  }
}

/**
 * Should `update` add the Continue `--copy` restore pass (B-213)? Only when the run's
 * scope includes Continue (no --agent filter, or --agent names it), Continue itself is
 * installed, and its directory holds family copies to keep current. Copies alone are
 * not a host: a leftover ~/.continue/skills on a machine without Continue gets nothing.
 */
function continueRestoreWanted(f) {
  if (f.agents && f.agents.length && !f.agents.includes('continue')) return false;
  return continueInstalled() && continueHasFamilyCopies();
}

/** Continue is installed: its `cn` CLI is on PATH, or ~/.continue holds a config.* file. */
function continueInstalled() {
  const home = process.env.HOME || os.homedir();
  try {
    if (fs.readdirSync(path.join(home, '.continue')).some((n) => /^config\.[A-Za-z0-9]+$/.test(n))) return true;
  } catch (e) { /* no ~/.continue: decided by PATH alone */ }
  const names = process.platform === 'win32' ? ['cn.cmd', 'cn.exe', 'cn'] : ['cn'];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const n of names) {
      try {
        const file = path.join(dir, n);
        if (fs.statSync(file).isFile()) { fs.accessSync(file, fs.constants.X_OK); return true; }
      } catch (e) { /* not here */ }
    }
  }
  return false;
}

/**
 * Does this machine hold family skills in Continue's directory? Continue reads only
 * real directories, so `update` restores them as copies (lib/plan.js updatePlan).
 * Read, never assumed: a machine without Continue gets no Continue step.
 */
function continueHasFamilyCopies() {
  const dir = path.join(process.env.HOME || os.homedir(), '.continue', 'skills');
  let names = [];
  try { names = fs.readdirSync(dir); } catch (e) { return false; }
  const ids = new Set(SKILLS.flatMap((s) => plan.skillIds(s)));
  return names.some((n) => ids.has(n));
}

Object.assign(module.exports, {
  shadowCandidates, pruneClaudeShadows, skillsCliAgents, defaultScope, defaultPresence,
  runPlanned, plainSkillsPlan, extraRootPlans, observedEntries, updateAgents, reconcileExtraRoots,
  planInstall, scopesNote, claudePlans, withClaudePlan, runClaudePlan, planUpdate, cmdInstall,
  refreshBlock, cmdUpdate, visibilityScope, reapplyVisibility, runUpdateLocked, runtimeScopeFor,
  printUpdateModel, continueRestoreWanted, continueInstalled, continueHasFamilyCopies
});
