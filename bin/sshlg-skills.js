#!/usr/bin/env node
/*
 * sshlg-skills — one launcher/updater for the ssheleg skill family
 * (super-ux, task-pipeline, agent-sync, make-skill, sheleg-design, seo-aeo-audit)
 * across every agent.
 *
 * It is a thin orchestrator over the tools that already know how to reach each
 * agent: the vercel `skills` CLI (70+ agents), `claude plugin` (Claude Code),
 * and `git submodule` (pinned snapshots). Zero npm dependencies.
 *
 *   npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only] [--dry-run]
 *   npx sshlg-skills update  [--agent a,b | --all] [--no-claude] [--claude-only] [--bump-pins] [--dry-run]
 *   npx sshlg-skills list
 *   npx sshlg-skills agents
 *   npx sshlg-skills hosts
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const plan = require('../lib/plan.js');
const opres = require('../lib/operation-result.js');

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
function reportProgress() {
  if (!progress.total) return;
  if (!progress.failed.length) {
    log(`\n== ${progress.done} of ${progress.total} steps, all green ==`);
    return;
  }
  log(`\n== FAILED ${progress.failed.length} of ${progress.total} steps ==`);
  for (const cmd of progress.failed) log(`  ✗ ${cmd}`);
  log('\nRe-run just these rather than the whole pass — each line above is the exact');
  log('command, and a repeat of the full run costs about a quarter of an hour.');
}

function parseFlags(argv) {
  const f = { agents: null, all: false, claude: true, claudeOnly: false, bumpPins: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') f.all = true;
    else if (a === '--no-claude') f.claude = false;
    else if (a === '--claude-only') f.claudeOnly = true;
    else if (a === '--bump-pins') f.bumpPins = true;
    else if (a === '--dry-run') f.dryRun = true;
    else if (a === '--update') f.mode = 'update';
    else if (a === '--diff') {
      const v = argv[++i];
      if (!v || v.startsWith('-')) { log('--diff needs a router name, e.g. --diff task-pipeline'); process.exit(2); }
      f.diff = v;
    }
    else if (a === '--adopt') {
      // Comma list and never "all". Adoption replaces words a person wrote in
      // a file with no version control behind it, so each one is named.
      const v = argv[++i];
      if (!v || v.startsWith('-')) { log('--adopt needs a router name, e.g. --adopt task-pipeline'); process.exit(2); }
      f.adopt = v.split(',').map(s => s.trim()).filter(Boolean);
      if (!f.adopt.length) { log('--adopt got an empty list'); process.exit(2); }
    }
    else if (a === '--member') {
      const v = argv[++i];
      if (!v || v.startsWith('-')) { log('--member needs a value'); process.exit(2); }
      f.member = v;
    }
    else if (a === '--agent' || a === '-a') {
      const v = argv[++i];
      if (!v || v.startsWith('-')) { log('--agent needs a value, e.g. --agent cursor,zed'); process.exit(2); }
      const added = v.split(',').map(s => s.trim()).filter(Boolean);
      if (!added.length) { log('--agent got an empty list'); process.exit(2); }
      f.agents = (f.agents || []).concat(added);
    }
    else if (a.startsWith('-')) { log(`unknown option: ${a}`); process.exit(2); }
    // ignore stray non-flag tokens (e.g. a trailing shell comment zsh doesn't strip)
    else log(`  (ignoring stray argument: ${a})`);
  }
  if (f.claudeOnly && !f.claude) { log('--claude-only and --no-claude contradict each other'); process.exit(2); }
  return f;
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
// restored to exactly what was there. The fs logic lives in lib/quarantine.js
// (the pack's own recovery state), delegated here.
function pruneClaudeShadows() {
  const q = require('../lib/quarantine.js');
  const skillstore = require('../lib/skillstore.js');
  const pruned = [];
  const rows = [];
  const candidates = shadowCandidates();
  // A previous run's store is keyed by the same ids. Roll it aside BEFORE the first
  // capture, or the second run throws EEXIST here and `update` dies with the plain
  // copies already created and nothing pruned (v1.48.3, measured 2026-09-14).
  if (candidates.length) {
    const rolled = q.rollPrevious();
    if (rolled) log(`  previous quarantine archived: ${rolled}`);
  }
  for (const id of candidates) {
    const row = q.capture(id);
    if (!row) { /* could not quarantine → do NOT delete: recoverability first */ continue; }
    try {
      fs.rmSync(path.join(claudeRoot(), 'skills', id), { recursive: true, force: true });
      pruned.push(id);
      rows.push(row);
    } catch (_) { /* leave it; not fatal */ }
  }
  if (rows.length) q.writeManifest(rows, skillstore.stampName(new Date()));
  if (pruned.length) {
    log(`  pruned Claude plain copies that would shadow the plugin (quarantined, restorable): ${pruned.join(', ')}`);
  }
}

/**
 * The stash key holding whatever status line `hooks install --force` displaced.
 *
 * Deliberately its own key, not the router stash: `hooks remove` must be able to
 * give a tool back its status line without touching wording adoption parked under
 * `adopted:<name>`.
 */
const DISPLACED_STATUSLINE = 'displaced:statusLine';

function usage() {
  log(`sshlg-skills — install/update the ssheleg skill family everywhere

Skills: ${SKILLS.map(s => s.name).join(', ')}

Usage:
  npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only] [--dry-run]
  npx sshlg-skills update  [--agent a,b | --all] [--no-claude] [--claude-only] [--bump-pins] [--dry-run]
  npx sshlg-skills uninstall [--no-claude] [--dry-run]
                                                      # the reverse of install: family skills out of
                                                      # every channel, plugins, routing block, hooks
  npx sshlg-skills backup                             # archive ALL skills of ALL agents (tar.gz + manifest)
  npx sshlg-skills wipe [--dry-run]                   # backup + verify, THEN remove them all
  npx sshlg-skills restore [<archive>]                # bring the newest (or named) backup back
  npx sshlg-skills routers [--member <name>] [--update] [--dry-run]
  npx sshlg-skills routers --diff <name>              # your wording vs the packaged one
  npx sshlg-skills routers --update --adopt <name>    # take the packaged wording for it
  npx sshlg-skills config  [list]
  npx sshlg-skills config  set routers.<name> on|off
  npx sshlg-skills config  set routes.external.<name>.triggers "a, b, c"
                                                      # a route YOU declare for a skill outside
                                                      # the family (.skill <id>, .line <text>, or off)
  npx sshlg-skills config  set visibility.pack.<owner/repo> hide|show|default
                                                      # override this machine's pack mark (Gemini,
                                                      # Pi, OpenCode, Hermes; not Claude/Codex)
  npx sshlg-skills hooks   [status]                   # what is wired, and what holds it
  npx sshlg-skills hooks   install [--force] [--dry-run]
  npx sshlg-skills hooks   remove
  npx sshlg-skills hosts                              # hosts detected here; Pi visibility; Codex config
                                                      # duplicates; local MCP servers that do not answer
  npx sshlg-skills injectors                          # who else speaks at SessionStart
  npx sshlg-skills conflicts                          # installed skills on a router's ground
  npx sshlg-skills humanizers                         # anti-AI-writing skills this machine can reach
  npx sshlg-skills signature --used "<skill>[=what it did],…"
                                                      # report header + footer, links looked up
  npx sshlg-skills toolkit [--for "<task>"] [--find "<concept>, …"] [--expand <provider>]
                                                      # every skill this machine can reach
  npx sshlg-skills visibility [--apply | --revert] [--days 60] [--keep a,b]
                                                      # Claude/Codex: hide all outside the core;
                                                      # Gemini/Pi/OpenCode/Hermes: hide marked
                                                      # packs; Cursor/Kimi: cannot hide
  npx sshlg-skills visibility marks [--init --show <owner/repo,…> [--replace] [--apply]]
                                                      # this machine's pack marks
                                                      # (~/.sshlg-skills/pack-marks.json)
  npx sshlg-skills domains [--apply | --revert] [--root <dir>] [--no-usage]
  npx sshlg-skills domains --enable|--disable <member> [--project <dir>]
                                                      # xr-dev, web3d-dev, telegram-dev; hook-bearing members stay global
                                                      # load only in projects that call for them
  npx sshlg-skills pack [<name>] [--lane <id>] [--check]
  npx sshlg-skills materialised                       # routers this project says live in its tree
                                                      # curated recommendations, measured here
  npx sshlg-skills list
  npx sshlg-skills agents

Defaults:
  - Non-Claude agents (${manifest.defaultAgents.join(', ')}) via the skills CLI.
  - Claude Code via its PLUGIN (not a plain copy) to avoid a shadow duplicate.
  - --all       all globally supported agents in the pinned skills CLI snapshot.
                Excludes project-only targets and plain Claude while plugins are on.
  - --no-claude skip the Claude plugin step, and leave the Claude host alone: no
                routing-block write to CLAUDE.md, no hook re-wiring in
                settings.json, no refresh of the runtime copy those hooks run.
                Any --agent list does the same for those three, and in update
                also skips the Claude plugin step: no --agent value selects
                Claude (--agent claude exits 2) — scope a run to Claude with
                --claude-only, or pass no scope flag.
  - update exits 75 when another update holds ~/.sshlg-skills/update.lock
                (retry later; nothing failed) and 2 on a usage error.
  - update never ADDS a hook entry: one removed by hand stays removed, and an
                event a later release introduces arrives through
                \`hooks install\` — update names each one not wired here.
  - --claude-only install/update only the Claude plugins.
  - --bump-pins  (update only) also fast-forward the pinned submodules to their
                 upstream tips — off by default so pins stay reproducible.
  - --dry-run    (install/update) build the full operation plan — every
                 subprocess, prune, router, runtime and settings.json hook-wiring
                 action — render it, and execute NOTHING. The receipt is
                 complete; the mutations are zero.`);
}

function skillsCliAgents(f) {
  // Never let the skills CLI drop a plain Claude copy while we manage Claude via plugin.
  return plan.resolveAgents(manifest.defaultAgents, f);
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
 * from the SAME arrays the execution loops walk (`plan.installPlan`,
 * `plan.updatePlan`, `shadowCandidates`), so the receipt a dry run renders and
 * the actions a real run takes cannot drift apart.
 */
function planInstall(f) {
  const steps = [];
  if (!f.claudeOnly) {
    for (const argv of plan.installPlan(SKILLS, skillsCliAgents(f))) {
      steps.push(opres.step('subprocess', 'home', `skills add ${argv[3]}`, { cmd: 'npx', args: pinnedArgv(argv) }));
    }
    steps.push(opres.step('prune', 'home',
      'remove plain Claude copies shadowing an installed plugin (re-computed after the CLI runs)',
      { paths: shadowCandidates().map(id => path.join(claudeRoot(), 'skills', id)) }));
  }
  if (f.claude || f.claudeOnly) {
    const installed = require(path.join(ROOT, 'lib', 'enablement.js')).installed(process.env.HOME || os.homedir());
    for (const s of SKILLS) {
      steps.push(opres.step('subprocess', 'home', `claude plugin marketplace add (${s.name})`,
        { cmd: 'claude', args: ['plugin', 'marketplace', 'add', s.pluginMarketplace] }));
      // Reinstalling enables an existing plugin; updating preserves project scoping.
      const action = installed[s.pluginInstall] ? 'update' : 'install';
      steps.push(opres.step('subprocess', 'home', `claude plugin ${action} ${s.pluginInstall}`,
        { cmd: 'claude', args: ['plugin', action, s.pluginInstall] }));
    }
  }
  if (!f.member) {
    steps.push(opres.step('router-block', 'home',
      'refresh the managed routing block (its own consent and dry-run rules apply)',
      { mode: 'install' }));
  }
  return opres.buildPlan(steps);
}

/** Plugin registries as sets, or null when unreadable — the input `plan.pluginUpdatePlan` needs. */
function pluginRegistries() {
  const read = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(claudeRoot(), 'plugins', file), 'utf8')); }
    catch (_) { return null; }
  };
  const known = read('known_marketplaces.json');
  const installed = read('installed_plugins.json');
  return {
    known: known && typeof known === 'object' ? new Set(Object.keys(known)) : null,
    installed: installed && installed.plugins ? new Set(Object.keys(installed.plugins)) : null,
  };
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
    for (const argv of plan.updatePlan(SKILLS, skillsCliAgents(f), { continueCopies: continueHasFamilyCopies() })) {
      steps.push(opres.step('subprocess', 'home', `skills ${argv[2]} ${argv[3]}`, { cmd: 'npx', args: pinnedArgv(argv) }));
    }
    steps.push(opres.step('prune', 'home',
      'remove plain Claude copies shadowing an installed plugin (re-computed after the CLI runs)',
      { paths: shadowCandidates().map(id => path.join(claudeRoot(), 'skills', id)) }));
  }
  // The Claude plugin step follows the Claude host's scope (final polish 8): an `--agent`
  // list never selects Claude, so it no longer runs `claude plugin update` either.
  if (claudeScope(f).inScope) {
    const reg = pluginRegistries();
    for (const args of plan.pluginUpdatePlan(SKILLS, reg.known, reg.installed)) {
      steps.push(opres.step('subprocess', 'home', `claude ${args.join(' ')}`, { cmd: 'claude', args }));
    }
  }
  if (!f.member) {
    steps.push(opres.step('router-block', 'home',
      'refresh the managed routing block (its own consent and dry-run rules apply)',
      { mode: 'update' }));
  }
  try {
    const rtScope = claudeScope(f);
    steps.push(opres.step('runtime-sync', 'runtime',
      rtScope.inScope ? 'refresh the wired hook runtime copy (create: false)'
        : `wired hook runtime copy — out of scope (skipped: ${rtScope.skippedBy}), moves with its wiring`,
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
      : 'domain members — `domains --apply` never ran here: one line if a project calls for one, nothing written',
    { file: rec }));
  }
  return opres.buildPlan(steps);
}

/** Dry-run IS the render: the complete receipt, a typed result, zero mutations. */
function renderDryRun(planned, mode) {
  log(`\n== --dry-run: the ${mode} plan, rendered — nothing executed ==`);
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
  log(`\nresult: ${res.status} — ${res.evidence}`);
  return opres.exitCode(res) === 0;
}

function cmdInstall(f) {
  const planned = planInstall(f);
  if (f.dryRun) return renderDryRun(planned, 'install');
  let ok = true;
  if (!f.claudeOnly) {
    const agents = skillsCliAgents(f);
    log(`\n== Installing to agents via skills CLI: ${agents.join(', ')} ==`);
    for (const argv of plan.installPlan(SKILLS, agents)) ok = runPlanned(argv) && ok;
    // Unconditional: the skills CLI auto-detects Claude Code and drops a plain
    // copy whether or not this run was asked to manage plugins, and the copy
    // decides nothing about the flag it was created under.
    pruneClaudeShadows();
  }
  if (f.claude || f.claudeOnly) {
    log(`\n== Installing Claude Code plugins ==`);
    for (const s of SKILLS) {
      log(`\n- ${s.name}`);
      ok = run('claude', ['plugin', 'marketplace', 'add', s.pluginMarketplace]) && ok;
      ok = run('claude', ['plugin', 'install', s.pluginInstall]) && ok;
    }
    log('\n(restart Claude Code to apply the plugins)');
  }
  ok = refreshBlock(f, 'install') && ok;
  printUpdateModel('install');
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
    mode,
  });
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
  return { hostTargets: scope.hostTargets, includeCursor };
}

function cmdUpdate(f) {
  const planned = planUpdate(f);
  if (f.dryRun) return renderDryRun(planned, 'update');
  let ok = true;
  // The plan is COUNTED, not estimated — the same arrays the loops below walk, so a
  // member added to the family changes the denominator without anyone remembering to.
  const agentsForCount = f.claudeOnly ? [] : skillsCliAgents(f);
  progress.total =
    (!f.claudeOnly && fs.existsSync(path.join(ROOT, '.gitmodules')) ? 1 : 0)
    + (!f.claudeOnly ? plan.updatePlan(SKILLS, agentsForCount, { continueCopies: continueHasFamilyCopies() }).length : 0)
    + (claudeScope(f).inScope ? SKILLS.length * 2 : 0);
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
      log('  ! pins moved — commit the gitlinks to make this reproducible');
    } else {
      log('\n== Materializing pinned submodules (pins unchanged) ==');
      ok = run('git', ['-C', ROOT, 'submodule', 'update', '--init', '--recursive']) && ok;
    }
  }
  if (!f.claudeOnly) {
    // `update` RECONCILES: refresh every declared skill, then add whatever is
    // missing. `skills update <name>` is a no-op for a skill installed
    // nowhere, so refreshing alone can never deliver a member added to the
    // family after a channel was last fed — which is how seven of nineteen
    // skills were found absent from the hub on 2026-08-10, after an `update`
    // that had named all nineteen out loud.
    const agents = skillsCliAgents(f);
    const names = SKILLS.flatMap(s => plan.skillIds(s));
    log(`\n== Updating skills-CLI installs (global): ${names.join(', ')} ==`);
    log(`   then reconciling against: ${agents.join(', ') || '(no agents resolved — add step skipped)'}`);
    // One invocation per skill: a single bad id must not fail the whole batch.
    for (const argv of plan.updatePlan(SKILLS, agents, { continueCopies: continueHasFamilyCopies() })) ok = runPlanned(argv) && ok;
    pruneClaudeShadows();
  }
  // Scoped like the routing block, the wiring and the runtime copy (final polish 8): an
  // `--agent` list left the Claude host's files alone and still ran `claude plugin update`
  // for every member. `claudeScope` is the one answer for all four.
  const pluginScope = claudeScope(f);
  if (!pluginScope.inScope) {
    log(`\n== Updating Claude Code plugins ==\n  skipped: ${pluginScope.skippedBy} (the Claude host is outside this run's scope)`);
  } else {
    log(`\n== Updating Claude Code plugins ==`);
    // Reconciles like the skills-CLI half: a member this machine has never seen is added
    // and installed rather than refreshed (plan.pluginUpdatePlan). The plan and this loop
    // read the same function, so the dry-run receipt and the real run cannot drift.
    const reg = pluginRegistries();
    for (const args of plan.pluginUpdatePlan(SKILLS, reg.known, reg.installed)) {
      ok = run('claude', args) && ok;
    }
    log('\n(restart Claude Code to apply)');
  }
  // `update`, never `install`: a machine that has no block has not consented
  // to one, and an update is not the moment to ask.
  ok = refreshBlock(f, 'update') && ok;

  // The wired copy the hooks actually EXECUTE. Until v0.47.0 this was the one thing
  // `update` did not update: the copy lived in a closure inside `cmdHooks` and ran on
  // `hooks install` alone, so a machine that only ran `update` kept executing hook code
  // from whichever release last installed them. Watched on a real machine at v0.46.0 —
  // 24 modules against the package's 25, and the missing one was that release's whole
  // point (`B-22`). Refresh only: `create` stays false, because a machine with no
  // runtime has not consented to hooks and an update is not the moment to ask. Scoped like
  // the wiring below (fix round 2, L): a run that leaves the Claude host alone leaves both.
  const rtScope = claudeScope(f);
  if (!rtScope.inScope) {
    log(`\n== Wired hook runtime ==\n  skipped: ${rtScope.skippedBy} (the Claude host is outside this run's scope; `
      + 'the copy its hooks execute moves with their wiring)');
  } else {
    try {
      const rt = require('../lib/runtime.js');
      const root = require('../lib/hooks.js').runtimeDir(os.homedir());
      const before = rt.stale(ROOT, root);
      const r = rt.sync(ROOT, root, { create: false });
      if (r.reason) {
        log(`\n== Wired hook runtime ==\n  skipped: ${r.reason}`);
      } else {
        const moved = before.missing.length + before.differing.length;
        log(`\n== Wired hook runtime ==`);
        log(`  ${root}`);
        log(moved
          ? `  refreshed ${r.copied.length} file(s) — ${before.missing.length} new, `
            + `${before.differing.length} changed`
          : '  already level with this package');
        for (const m of before.missing) log(`    + ${m}`);
      }
    } catch (e) {
      // A runtime that cannot be refreshed must not fail the whole update — but it must
      // say so, because silence here is what made B-22 invisible for five releases.
      log(`\n== Wired hook runtime ==\n  NOT refreshed: ${e.message}`);
      ok = false;
    }
  }
  // The settings entries that point AT that copy (R03, wave 1). Until 1.56.0 `update`
  // refreshed the scripts and never re-applied their wiring, so 1.55.1's widened
  // PreToolUse matcher never reached a machine that had run `hooks install` before it.
  // A machine that has consented (one entry of ours in settings.json) is re-wired here;
  // one that has not is left alone — an update is not the moment to ask.
  ok = rewireConsentedHooks(f) && ok;
  // Native host lifecycle (FIX-UP-07.02, B-166). Codex loads the family's plugins
  // from its OWN marketplace cache, not from the skills-CLI copies (those are
  // excluded in its skills.config), so a re-pin reaches Codex only through Codex's
  // own CLI: remove the marketplace, re-add it at the pin, add the plugin, and read
  // the loaded version back. Only that readback says `current`. A Codex whose
  // plugin CLI cannot be driven is still UNSUPPORTED_UPDATE, and nothing is touched.
  ok = refreshCodexPlugins(f) && ok;
  // Skill visibility (B-143, wave L1). A machine whose record shows the operator ran
  // `visibility --apply` gets it again, with the same window and --keep, so skills the
  // refresh above just added are hidden by the same rule on every host. One with no
  // record has not consented — an update is not the moment to ask.
  ok = reapplyVisibility(f) && ok;
  // Domain members per project (L5). Once `domains --apply` ran here, a project that gained a
  // domain dependency gets its member now; before that, one line says what `domains` would do.
  if (claudeScope(f).inScope) {
    try { ok = cmdDomains(['', '', 'domains', '--update-step']) === 0 && ok; }
    catch (e) { log(`\n== Domain members ==\n  not reconciled: ${e.message}`); ok = false; }
  }

  printUpdateModel('update');

  reportProgress();
  return ok;
}

/**
 * Re-apply `visibility` inside `update`, scoped like the rest of the run. Claude and Codex
 * follow `claudeScope` / `codexScope` (so `--no-claude` and `--agent claude-code`, which
 * keep the Claude host out, keep it out here too); the other hosts are in scope with no
 * `--agent` list, or when the list names their skills-CLI agent id.
 */
const VIS_AGENT = { gemini: 'gemini-cli', pi: 'pi', opencode: 'opencode', hermes: 'hermes-agent', cursor: 'cursor', kimi: 'kimi' };

function visibilityScope(f) {
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
    log('\n== Skill visibility ==\n  not re-applied: the record predates explicit consent — run `npx sshlg-skills visibility --apply [--keep …]` once to re-arm');
    return true;
  }
  if (rec.applied !== true) return true;
  const scope = visibilityScope(f);
  const only = new Set((Array.isArray(rec.hosts) ? rec.hosts : []).filter((h) => scope.has(h)));
  if (!only.size) return true;
  log(`\n== Skill visibility (re-applied: this machine ran \`visibility --apply\`; hosts: ${[...only].join(', ')}) ==`);
  return runVisibility({
    mode: 'apply', days: Number(rec.days) || undefined, keep: Array.isArray(rec.keep) ? rec.keep : [], only, reapply: true,
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
  const lock = require('../lib/updatelock.js');
  const home = os.homedir();
  const got = lock.acquire(home);
  if (!got.ok) {
    const h = got.holder || {};
    log(`update: refused — ${got.message}${h.host ? ` on ${h.host}` : ''}.`);
    log(`  lock: ${lock.lockPath(home)} (taken over once its process is gone; a lock from another host after 30 minutes)`);
    return lock.BUSY_EXIT;
  }
  if (got.tookOver) log(`update: took over update.lock — ${got.tookOver}`);
  if (got.degraded) log(`update: running without a lock — ${got.degraded}`);
  const free = () => { lock.release(home, got.token); };
  process.on('exit', free);
  try {
    return cmdUpdate(f) ? 0 : 1;
  } finally {
    free();
  }
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
function codexRunner(cmd, args, opts) {
  const read = opts && opts.read;
  if (!read && progress.total) {
    // `onItem` added this item's three steps to the total; a rollback's steps are only
    // known once it starts, so they extend the total as they run.
    progress.done++;
    if (progress.done > progress.total) progress.total = progress.done;
  }
  if (!read) {
    const at = progress.total ? `[${progress.done}/${progress.total}] ` : '';
    log('  » ' + at + cmd + ' ' + args.join(' '));
  }
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
  if (!read) {
    for (const line of `${r.stdout || ''}${r.stderr || ''}`.split(/\r?\n/).filter(Boolean)) log(`      ${line}`);
    if ((r.error || r.status !== 0) && progress.total) progress.failed.push(`${cmd} ${args.join(' ')}`);
  }
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

/** The Codex half of `update` (B-166): read, refresh what is behind, read back. */
function refreshCodexPlugins(f) {
  log('\n== Native host lifecycle: Codex plugins ==');
  const scope = codexScope(f);
  if (!scope.inScope) {
    log(`  skipped: ${scope.skippedBy} (Codex is outside this run's scope)`);
    return true;
  }
  const cp = require('../lib/codexplugins.js');
  const lc = require('../lib/lifecycle.js');
  let out;
  try {
    out = cp.refreshAll({
      skills: SKILLS,
      only: f.member || null,
      runner: codexRunner,
      readConfig: readCodexConfig,
      configPath: codexConfigPath(),
      pinRef: (s) => codexPinRef(s),
      onItem: (it) => (progress.total && (progress.total += cp.refreshCommands(it).length), log(`\n- ${it.pluginId}: Codex reports ${it.from}, the pin is ${it.pin} `
        + `— re-adding ${it.marketplace} at ${it.ref} (${it.refKind === 'commit' ? 'the pin\'s commit' : 'the release tag'}; `
        + `previous ${it.prev.ref || 'default branch'} recorded for rollback)`)),
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
    log(`  ${u.host}: UNSUPPORTED_UPDATE — ${u.manualStep}`);
    return true;
  }
  if (out.status === 'unread') {
    log(`  not read: codex plugin list failed — ${out.why}. Nothing in Codex was touched.`);
    return true;
  }
  for (const it of out.items) {
    if (it.action === 'skip') log(`  ${it.pluginId}: left alone — ${it.why}`);
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
    const item = { marketplace: ids.marketplace, url: cp.familyUrl(s), ref: pin.ref, pluginId: s.pluginInstall };
    for (const c of cp.refreshCommands(item)) {
      steps.push(opres.step('subprocess', 'home',
        `Codex ${s.pluginInstall} — ${c.step}, only if \`codex plugin list\` reports a version other than `
          + `${s.version} (a checkout re-adds at the pin's commit; previous ref ${mk.ref || 'default branch'} kept for rollback)`,
        { cmd: 'codex', args: c.args }));
    }
  }
  return steps;
}

/**
 * One line per family entry the refresh did not wire, with the remedy (fix round 2, K), and
 * one sentence after them (final polish 7): the remedy re-adds EVERY removed family entry, so
 * an operator who removed one on purpose is told before running it — the list repeats on
 * every `update` for an entry removed on purpose, and that is the cost of never re-adding it.
 */
function notWiredLines(skipped) {
  const lines = (skipped || []).filter((x) => !/held by/.test(x.why)).map((x) =>
    `${x.event}: not wired here (removed by hand, or new in this release) — \`npx sshlg-skills hooks install\` adds it`);
  if (lines.length) {
    lines.push('note: `hooks install` re-adds every removed family entry, not only the new ones — '
      + 'skip it if you removed these on purpose');
  }
  return lines;
}

/**
 * What `update` would do to `~/.claude/settings.json` — one answer for the run AND for
 * `--dry-run` (fix round #3: the preview had no such step, so it omitted the one write to
 * an operator file the run makes).
 *
 * `status` is one of:
 *   - `out of scope` — the run's flags exclude the Claude host (`--no-claude`, an `--agent`
 *     list without `claude`); `skippedBy` names the flag (fix round #2). The routing
 *     block already honours the same scope (FIX-UP-03.02), through `plan.resolveScope`.
 *   - `no settings` / `unparseable` / `no consent` — nothing to write, and why;
 *   - `current` — the entries already match;
 *   - `changes` — `settings` is the edit, `reasons` says why per entry.
 * `skipped` lists entries the refresh leaves alone: removed by hand, or a status line
 * somebody else holds (`hooks.plan` with `refreshOnly`).
 */
function planRewire(f) {
  const hooksLib = require('../lib/hooks.js');
  const home = os.homedir();
  const file = path.join(home, '.claude', 'settings.json');
  const root = hooksLib.runtimeDir(home);
  const base = { file, changed: [], reasons: [], skipped: [] };
  const scoped = claudeScope(f);
  if (!scoped.inScope) return Object.assign(base, { status: 'out of scope', skippedBy: scoped.skippedBy });
  let current;
  try {
    if (!fs.existsSync(file)) return Object.assign(base, { status: 'no settings' });
    current = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return Object.assign(base, { status: 'unparseable', error: e.message });
  }
  if (!hooksLib.consented(current, root)) return Object.assign(base, { status: 'no consent' });
  const p = hooksLib.plan(current, root, { refreshOnly: true });
  return Object.assign(base, {
    status: p.changed.length ? 'changes' : 'current',
    settings: p.settings, changed: p.changed, reasons: p.reasons, skipped: p.skipped,
  });
}

/** The `hooks-wiring` line of the `--dry-run` receipt, from the same `planRewire`. */
function rewireStep(f) {
  const r = planRewire(f);
  const changes = r.status === 'changes'
    ? r.reasons.map((x) => `${x.event}: ${x.reason}`)
    : [r.status === 'out of scope' ? `out of scope (skipped: ${r.skippedBy})`
      : r.status === 'unparseable' ? `does not parse (${r.error}) — nothing written`
        : r.status === 'current' ? 'already matches this package' : r.status];
  for (const s of r.skipped) if (s.event === 'statusLine' && /held by/.test(s.why)) changes.push(`statusLine: ${s.why}`);
  changes.push(...notWiredLines(r.skipped));
  return opres.step('hooks-wiring', 'home',
    r.status === 'changes'
      ? 're-wire the consented hook entries (copy before write, through protect())'
      : 'hook entries in settings.json — nothing to write',
    { file: r.file, changes });
}

/**
 * Re-apply the hooks wiring on a machine that already consented to it.
 *
 * Consent is the presence of one entry of ours in `~/.claude/settings.json`. With none
 * this does nothing. With one, `hooks.plan(..., {refreshOnly: true})` computes the edit:
 * only entries of ours that are present are refreshed, fields the operator added to them
 * are kept, and a status line somebody else holds is left alone without blocking the rest.
 * It is written through the same `protect()` backup the `hooks install` path takes (a
 * backup that fails cancels the write). Every changed entry is logged with the field that
 * differed (`matcher`, `command`, another field's name, or `order`).
 *
 * Returns false only on a failure worth a non-zero exit: an unparseable file or a
 * backup that could not be taken. Declining (out of scope, no consent) is success.
 */
function rewireConsentedHooks(f) {
  const apply = require('../lib/apply.js');
  const r = planRewire(f);
  if (r.status === 'out of scope') {
    log(`\n== Hook wiring ==\n  skipped: ${r.skippedBy} (the Claude host is outside this run's scope; settings.json untouched)`);
    return true;
  }
  if (r.status === 'no settings' || r.status === 'no consent') return true;
  log('\n== Hook wiring ==');
  if (r.status === 'unparseable') {
    log(`  ${r.file} does not parse (${r.error}) — nothing written`);
    return false;
  }
  for (const s of r.skipped) if (s.event === 'statusLine' && /held by/.test(s.why)) log(`  statusLine: ${s.why}`);
  // `update` never ADDS an entry (an operator's removal stays removed), so an event a later
  // release introduced arrives only through `hooks install` — said, not left to be noticed.
  for (const line of notWiredLines(r.skipped)) log(`  ${line}`);
  if (r.status === 'current') { log('  settings.json already matches this package'); return true; }
  const saved = apply.protect(r.file, { home: os.homedir() });
  if (saved.action === 'backup-failed') {
    log(`  NOT written: no backup could be taken (${saved.error}); ${r.file} unchanged`);
    return false;
  }
  fs.writeFileSync(r.file, JSON.stringify(r.settings, null, 2) + '\n', 'utf8');
  for (const x of r.reasons) log(`  ${x.event}: ${x.reason}`);
  log(`  re-wired ${r.changed.join(', ')}`);
  log(`  copy before write: ${saved.path}`);
  log('  restart Claude Code — hooks are read at session start');
  return true;
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
    const autoOn = cfgLib.autoUpdateEnabled(
      cfgLib.readConfig(process.env.HOME || os.homedir()));
    for (const line of um.notice(mode, findings, autoOn)) log(line);
  } catch (e) {
    // Never fail an install over its own closing note.
    log(`\n== How the next version arrives ==\n  not printed: ${e.message}`);
  }
}

/**
 * `signature` — the header and footer a report carries.
 *
 * The links are LOOKED UP from the manifest, never typed: `evidence-docs` lives in the
 * `task-pipeline` repository, and an agent writing that URL from memory gets it wrong.
 * The only thing a caller writes is what each skill did.
 */
function cmdSignature(argv) {
  const sig = require(path.join(ROOT, 'lib', 'signature.js'));
  const val = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '';
  };
  const used = val('--used');
  if (!used) {
    log('usage: npx sshlg-skills signature --used "<skill>[=what it did],…" '
      + '[--format md|html|text] [--part header|footer|both] [--no-star]');
    return 1;
  }
  const format = val('--format') || 'md';
  const part = val('--part') || 'both';
  const opts = { format, star: !argv.includes('--no-star') };
  if (part === 'header' || part === 'both') log(sig.header(used, manifest, opts));
  if (part === 'both') log('');
  if (part === 'footer' || part === 'both') log(sig.footer(used, manifest, opts));
  return 0;
}

/**
 * `humanizers` — which anti-AI-writing skills this machine can reach.
 *
 * Same split as `toolkit` and `conflicts` for the machine half: WHICH implementation is
 * here is a fact about one machine, read when asked. The doctrine half does NOT ship in
 * the block — no router text mentions humanization, and that is deliberate: the pass
 * itself lives in `copywriting`'s own Humanize mode, which the c888696 record found
 * already stricter than either external implementation. What always ships is the caveat
 * in `lib/humanizers.js`, printed on every run of this command and not switchable off.
 * The registry is data so a third implementation joins by pull request.
 */
function cmdHumanizers(argv) {
  const hum = require(path.join(ROOT, 'lib', 'humanizers.js'));
  const conflicts = require(path.join(ROOT, 'lib', 'conflicts.js'));
  let skills = [];
  try {
    skills = conflicts.readSkills(process.env.HOME || os.homedir());
  } catch (e) {
    log(`cannot read the installed skills (${e.message}) — no answer rather than a wrong one`);
    return 1;
  }
  log(hum.report(skills, { contribute: !argv.includes('--quiet') }));
  return 0;
}

/**
 * The roster, answering the two questions the README offers this command for.
 *
 * It printed name, version, repo and the full marketing paragraph — 22 lines and 5,398
 * bytes, of which ~4,900 were nine descriptions — and answered neither *"when does each
 * of these fire?"* nor *"am I current?"*. The data for the first was sitting unused in
 * the same manifest this function already reads: `entry` and `role` are on every member
 * and neither was ever printed.
 *
 * The descriptions are behind `--verbose` rather than deleted: they are what a stranger
 * reads once, and what an operator scrolls past every time.
 *
 * `role` is the same cell the routing block's map table renders, so this roster and that
 * table cannot drift — a member's role has one home.
 */
function cmdList(argv) {
  const verbose = (argv || []).includes('--verbose') || (argv || []).includes('-v');
  log('ssheleg skill family:\n');
  for (const s of SKILLS) {
    let ver = s.version || '?';
    const pj = path.join(ROOT, s.dir, 'plugins', s.name, '.claude-plugin', 'plugin.json');
    try { ver = JSON.parse(fs.readFileSync(pj, 'utf8')).version; } catch (_) {}
    const entry = s.entry || '—';
    log(`  ${s.name.padEnd(16)} v${String(ver).padEnd(9)} ${String(entry).padEnd(16)} ${s.role || ''}`);
    if (verbose) log(`  ${' '.repeat(16)} ${s.repo}\n  ${' '.repeat(16)} ${s.desc}\n`);
  }
  if (!verbose) log('\n  --verbose adds each member\'s repository and full description.');
  log(`\nInstall:  npx sshlg-skills install       Update:  npx sshlg-skills update`);
}

/**
 * `hosts` — which agent hosts this machine has, and for Pi where the family is visible.
 *
 * Read-only. The instruction-file hosts come from apply.TARGETS (the same list the
 * routing writer uses, so this report and that write cannot disagree about which
 * hosts exist). Pi additionally gets lib/pi.js's skill-root report, because Pi reads
 * skills from several directories and a duplicate name keeps only the first.
 */
function cmdHosts() {
  const apply = require('../lib/apply.js');
  const piLib = require('../lib/pi.js');
  const home = os.homedir();
  log('Agent hosts with an instruction file the routing block is written to (Cursor, a separate rules file, is not listed):\n');
  for (const t of apply.TARGETS) {
    const v = apply.hostRootVerdict(t, home, {});
    const present = v.supported && fs.existsSync(v.root);
    const file = v.supported ? path.join(v.root, t.file) : '(unsupported platform)';
    log(`  ${t.agent.padEnd(8)} ${present ? 'detected' : 'absent  '}  ${file}`);
  }
  // B-167: Codex will not start while its config defines one table twice.
  const codexT = apply.TARGETS.find((t) => t.agent === 'codex');
  const cv = codexT && apply.hostRootVerdict(codexT, home, {});
  const codexCfg = cv && cv.supported ? path.join(cv.root, 'config.toml') : null;
  if (codexCfg && fs.existsSync(codexCfg)) {
    const dups = require('../lib/codexconfig.js').duplicateTables(fs.readFileSync(codexCfg, 'utf8'));
    const show = require('../lib/codexconfig.js').show;
    if (dups.length) {
      log(`\nCodex config ${codexCfg}: ${dups.length} duplicate table(s) — Codex refuses to start (\`duplicate key\`):`);
      for (const d of dups) log(`  ${show(d.key)} at lines ${d.lines.join(' and ')}`);
      log('  Copy the file, then delete the later entry if both say the same; nothing here was changed.');
    } else {
      log(`\nCodex config ${codexCfg}: no duplicate tables.`);
    }
  }
  // B-177: a local MCP server that does not answer when a session starts leaves that session
  // without its tools for good. TCP connect only — no request, no header leaves this process.
  const claudeJson = path.join(home, '.claude.json');
  if (fs.existsSync(claudeJson)) {
    let cfg = null;
    try { cfg = JSON.parse(fs.readFileSync(claudeJson, 'utf8')); } catch (e) { /* unreadable: say so */ }
    if (!cfg) log(`\nClaude Code MCP: ${claudeJson} is not readable JSON; nothing probed.`);
    else {
      const reach = require('../lib/mcpreach.js');
      const res = reach.probe(reach.configured(cfg), 1500);
      if (res.length) {
        log(`\nClaude Code MCP servers on this machine (${res.length}, TCP connect only):`);
        for (const s of res) log(`  ${s.name.padEnd(24)} ${s.answers ? 'answers' : 'refused'}  ${s.host}:${s.port}  (${s.scope})${s.answers ? '' : ` — ${s.why}`}`);
        if (res.some((s) => !s.answers)) {
          log('  A session started while a server refused has none of its tools until `/mcp` → reconnect');
          log('  (or a new session). Do not work around it by calling the service directly with its token.');
        }
      }
    }
  }
  // L5: which domain members load where. Counts only — a project's name stays in `domains`.
  try { domainsSummary(home); } catch (e) { log(`\nDomain members per project: not read (${e.message})`); }
  const family = new Set(SKILLS.flatMap((s) => s.skillNames || []));
  const r = piLib.inspect({ home, env: process.env, cwd: process.cwd(), which: (b) => piLib.whichBin(b), family });
  log('\nPi (@earendil-works/pi-coding-agent):');
  if (!r.detected) { log('  pi      absent    no ~/.pi/agent and no `pi` on PATH'); return; }
  log(`  pi      detected  via ${r.via.join(', ')}; agent dir ${r.agentDir}`);
  log('  Pi does not load Claude Code plugins: the family reaches it as plain skill directories and through AGENTS.md.');
  for (const root of r.roots) log(`  skills root (${root.kind})  ${root.path}  ${root.skills} skill(s)`);
  log(`  family skills visible to Pi (by name): ${r.family.visible.length} of ${r.family.total}` +
      (r.family.missing.length ? `; not visible: ${r.family.missing.join(', ')}` : ''));
  log(`  duplicate names across Pi's roots: ${r.duplicates.harmless} harmless (one realpath), ` +
      `${r.duplicates.conflicts.length} conflict(s) (different realpaths) of ${r.names} names`);
  for (const c of r.duplicates.conflicts) {
    const mark = r.duplicates.familyConflicts.includes(c.name) ? ' [family]' : '';
    log(`  conflict: ${c.name}${mark} — Pi keeps ${c.locations[0].path}; shadowed: ${c.locations.slice(1).map((l) => l.path).join(', ')}`);
  }
}

function cmdAgents() {
  const targets = require('../lib/host-targets.js');
  const snapshot = targets.validateSnapshot(targets.snapshot, cliSpec());
  const rows = snapshot.agents;
  const globals = rows.filter(row => row.global).length;
  const width = Math.max(...rows.map(row => row.id.length)) + 2;
  log(`Pinned installer targets (${snapshot.skillsCli}): ${rows.length} IDs, ${globals} global, ${rows.length - globals} project-only.\n`);
  for (const row of rows) log(`  ${row.id.padEnd(width)}${row.global ? 'global' : 'project-only'}`);
  log('\nThese are installer destinations, not native runtime acceptance.');
  log('Project-only targets cannot be selected by this global-install wrapper.');
  log('Claude Code uses the plugin channel by default; --all excludes its plain skill target.');
  log('--all --no-claude includes the plain claude-code target and skips the plugin step.');
  log(`Default set: ${manifest.defaultAgents.join(', ')}  (Claude via plugin)`);
}

/**
 * `routers` — write the managed routing block.
 *
 * Exposed as its own command so a single member's installer can delegate here
 * instead of vendoring the writer. The block lists several routers and a
 * precedence table describing what this machine actually has; a lone member
 * rendering it would produce a table for routers nobody installed, which is
 * worse than no table.
 */
function cmdRouters(f) {
  const registry = require('../lib/routers-registry.js');
  const configLib = require('../lib/config.js');
  const apply = require('../lib/apply.js');
  const consent = require('../lib/consent.js');
  const migrate = require('../lib/migrate.js');
  const drift = require('../lib/drift.js');
  const fs = require('fs');
  const path = require('path');
  const home = process.env.HOME || require('os').homedir();

  if (f.diff && f.adopt) {
    log('--diff смотрит, --adopt меняет. Вместе они не идут: сначала посмотри, потом принимай.');
    process.exit(2);
  }

  // Adoption runs BEFORE the settings are read for this run. Clearing an
  // authored entry is what lets the packaged text through, and reading the
  // config first would hand the rest of the command the record it just
  // deleted.
  const adopted = [];
  if (f.adopt && f.adopt.length) {
    for (const name of f.adopt) {
      if (!Object.prototype.hasOwnProperty.call(registry.REGISTRY, name)) {
        log(`--adopt: роутера "${name}" нет. Валидные имена: ${registry.order().join(', ')}`);
        process.exit(2);
      }
      if (f.dryRun) {
        // A preview must not report an adoption that would not happen: with no
        // authored entry there is nothing to take over.
        if (configLib.authoredGet(configLib.readConfig(home), name) !== undefined) adopted.push(name);
        else log(`routers: "${name}" и так на пакетном тексте — принимать нечего`);
        continue;
      }
      const previous = configLib.authoredClear(home, name);
      if (previous === undefined) {
        log(`routers: "${name}" и так на пакетном тексте — принимать нечего`);
        continue;
      }
      // Parked, not dropped: the one act that overwrites a person's words
      // keeps them, under a key the on/off switch will not hand back.
      //
      // Write-once. What is already parked is the only surviving copy of what
      // the operator wrote; a second adoption — after an authored entry
      // reappeared by any route — would park today's text over it and leave
      // nothing to restore from.
      const parked = configLib.stashGet(configLib.readConfig(home), drift.stashKey(name));
      if (parked === undefined) configLib.stashSet(home, drift.stashKey(name), previous);
      adopted.push(name);
    }
  }

  // The settings decide which routers this machine wants; the registry decides
  // which ones it may speak for. With --member, only that member's own — a
  // lone installer speaks for itself and never for the family's rules.
  const config = configLib.readConfig(home);
  const isEnabled = (n) => configLib.isEnabled(config, n);
  // The machine decides the routers that hold only where something is installed
  // outside the family (B-169: `fabric` needs Fabric's services directory).
  const machine = require(path.join(ROOT, 'lib', 'machine.js'));
  const scopeOpts = f.member
    ? { member: f.member, isEnabled }
    : { installed: manifest.skills.map((s) => s.name), isEnabled, machine: machine.probe({ home }) };

  const packaged = registry.resolve(scopeOpts);
  const switchedOff = registry.disabled(scopeOpts);
  // Off this machine: a section a block already carries (1.58.0 wrote `fabric`
  // everywhere) leaves it. Not a refusal, so it is not reported as one below.
  const offMachine = registry.offMachine(scopeOpts);
  const remove = switchedOff.concat(offMachine);

  // The registry's own text, copied before the precedence loop below writes
  // the operator's over it. This is the only moment both sides exist in one
  // place, and without the copy the comparison has nothing to compare.
  const registryText = Object.assign({}, packaged);

  // `--diff` inspects and returns. It writes nothing, asks no consent and does
  // not reach the block: the whole reason to look is to decide, and a look
  // that changed the file would be a decision taken on the operator's behalf.
  if (f.diff) {
    if (!Object.prototype.hasOwnProperty.call(registry.REGISTRY, f.diff)) {
      // Exit 2, the same as `--adopt` above and `config set` below: naming a
      // thing that is not a router is one mistake and deserves one code.
      log(`--diff: роутера "${f.diff}" нет. Валидные имена: ${registry.order().join(', ')}`);
      process.exit(2);
    }
    const mine = configLib.authoredGet(config, f.diff);
    const theirs = registryText[f.diff];
    if (theirs === undefined) {
      log(`routers --diff ${f.diff}: этот роутер сейчас не в области действия — его участник не установлен или он выключен настройкой.`);
      return true;
    }
    if (mine === undefined) {
      log(`routers --diff ${f.diff}: раздел идёт пакетным текстом — расходиться не с чем.`);
      return true;
    }
    if (!drift.diverged({ packaged: { [f.diff]: theirs }, authored: { [f.diff]: mine } }).length) {
      log(`routers --diff ${f.diff}: тексты совпадают.`);
      return true;
    }
    log(`--- твой текст (${configLib.configPath(home)})`);
    log(mine);
    log('');
    log('+++ пакетный текст (lib/routers-registry.js)');
    log(theirs);
    log('');
    log(`Принять пакетный:  npx sshlg-skills routers --update --adopt ${f.diff}`);
    return true;
  }

  // Precedence for a body: what the operator wrote > what a setting took out
  // > the packaged default.
  //
  // `preserve` is the half that matters on every run after the first. Once
  // migration has moved a hand-written rule in and removed its heading, the
  // file no longer says the section is theirs — so without this record the
  // packaged text regenerates over it, and "hand-written rules win" would be
  // true exactly once.
  const restored = [];
  const preserve = [];
  for (const name of Object.keys(packaged)) {
    const authored = configLib.authoredGet(config, name);
    if (authored !== undefined) {
      packaged[name] = authored; // used only if the section is missing entirely
      preserve.push(name);
      continue;
    }
    const stashed = configLib.stashGet(config, name);
    if (stashed !== undefined) {
      packaged[name] = stashed;
      restored.push(name);
    }
  }

  if (!Object.keys(packaged).length && !remove.length) {
    log('routers: ни один установленный участник не даёт роутера — нечего писать');
    return true;
  }

  const mode = f.mode || 'install';
  let decision = 'yes';
  if (f.dryRun) {
    // A preview answers "what would I get", not "what happens if I decline".
    // Nothing is written either way, so it previews the block itself and says
    // plainly that no decision was made.
    log('--dry-run: показываю, что было бы записано. Ничего не изменено, ' +
        'согласие не запрошено и не записано.');
  } else if (mode === 'install') {
    decision = consent.askConsent({
      home,
      persist: !f.dryRun,
      interactive: process.stdin.isTTY === true,
      prompt: (q) => { process.stdout.write(q); return readLineSync(); },
      log,
    });
  }

  // Hand-written rules win over the packaged text, so migration runs first and
  // its result is what gets written.
  const superseded = {};
  const sources = {};
  for (const t of apply.TARGETS) {
    const file = path.join(apply.hostRoot(t, home), t.file);   // honours CODEX_HOME & co. (B-165)
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    const moved = migrate.migrate(src, { fallbacks: packaged });
    const wants = moved.text !== src && decision === 'yes' && !f.dryRun;
    // Nothing to write counts as nothing left undone; only a wanted write can
    // fail to happen.
    let wrote = !wants;
    if (wants) {
      // Through `protect()`, like every other write to a file the operator owns
      // and did not write. For eight releases this one was not, and it was the
      // only write in the pack that could destroy `~/.claude/CLAUDE.md` leaving
      // no copy anywhere: reproduced 2026-08-16 against a scratch HOME with the
      // backup directory unwritable, the file went from four sections to three
      // lines while the run printed «Файл не изменён». The house rule names the
      // shape — there is no second write path — and this was the second one.
      const saved = apply.protect(file, { home });
      if (saved.action === 'backup-failed') {
        log(`${file} — НЕ записан: не удалось сделать резервную копию ` +
            `(${saved.error}). Файл не изменён. Освободи ` +
            `~/.sshlg-skills/backups/ и повтори.`);
      } else {
        fs.writeFileSync(file, moved.text, 'utf8');
        wrote = true;
      }
    }
    // Hand the migrated text on rather than letting apply re-read the file:
    // on a dry run nothing was written, and re-reading would preview the
    // additions without the removals that come with them.
    //
    // But only what is true of the disk now. A refused write means the
    // operator's headings are still in the file, so passing the migrated text
    // would hand `apply` a baseline in which they had already gone — and it
    // would then compute a diff against a state that does not exist.
    sources[file] = decision === 'yes' && wrote ? moved.text : src;
    if (!wrote) continue;
    Object.assign(packaged, moved.routers);
    Object.assign(superseded, moved.superseded);
    // Whatever migration just moved is the operator's, and this is the only
    // moment it is still identifiable as such: the heading it came from is
    // about to leave the file.
    //
    // `moved.migrated`, NOT `moved.routers`. The latter is the bodies to
    // write, fallbacks merged in, so iterating it claimed authorship of all
    // eight routers on the first run of any machine.
    for (const name of moved.migrated || []) {
      if (preserve.indexOf(name) === -1) preserve.push(name);
      if (!f.dryRun && decision === 'yes') configLib.authoredSet(home, name, moved.routers[name]);
    }
  }

  const scoped = scopedRoutingTargets(f);
  const res = apply.apply({
    home, mode, consent: decision, routers: packaged,
    // Only the selected host files are written; the rest stay byte-identical.
    hostTargets: scoped.hostTargets, includeCursor: scoped.includeCursor,
    // What the operator decided once, so a target added in a later release
    // reaches a machine that already said yes.
    consentRecorded: consent.readState(home).routers,
    // With --member the caller speaks only for itself and must not render a
    // roster of the whole family from a manifest it happens to ship.
    members: f.member ? [] : SKILLS,
    remove, preserve, sources, dryRun: f.dryRun, log,
  });

  // Whatever left the block is kept, not dropped. A switch that loses the
  // operator's wording on the way out is a switch nobody dares use twice, and
  // the file it was taken from has no version control behind it.
  if (!f.dryRun && decision === 'yes') {
    for (const r of res.targets) {
      for (const [name, body] of Object.entries(r.removed || {})) {
        // A section that left because the machine lacks what it is about keeps
        // only words the operator wrote; the packaged text needs no copy, and a
        // stashed copy would come back instead of the current text the day the
        // machine gains it.
        if (offMachine.includes(name) && registry.REGISTRY[name]
            && body.trim() === registry.REGISTRY[name].text.trim()) continue;
        configLib.stashSet(home, name, body);
      }
    }
    for (const [id, body] of Object.entries(superseded)) {
      configLib.stashSet(home, 'superseded:' + id, body);
    }
    // A restored section is live again, so its copy in the settings is now a
    // stale duplicate of text that has a home.
    for (const name of restored) configLib.stashClear(home, name);
  }

  // A copy of every file this run modified, taken before it was modified. Said
  // once rather than per target: four identical lines about the same directory
  // is how a useful line becomes noise the operator learns to skip.
  const saved = res.targets.filter((t) => t.backup && t.backup.action === 'saved');
  const blocked = res.targets.filter((t) => t.action === 'backup-failed');

  for (const r of res.targets) {
    if (r.action === 'agent-absent') continue;
    log(`routers: ${r.file} — ${r.action}`);
    if (r.diff) log(r.diff);
  }
  if (saved.length) {
    log(`routers: копии до записи — ${path.dirname(saved[0].backup.path)} (${saved.length})`);
  }
  for (const b of blocked) {
    // The write did not happen. Saying only "backup-failed" leaves the operator
    // to guess whether their file was touched, which is the one thing they need
    // to know for certain.
    log(`routers: ${b.file} — НЕ записан: не удалось сделать резервную копию ` +
        `(${b.backup && b.backup.error}). Файл не изменён.`);
  }
  if (switchedOff.length) log(`routers: выключены настройкой — ${switchedOff.join(', ')}`);
  for (const name of offMachine) {
    const what = machine.PREDICATES[registry.REGISTRY[name].machine];
    log(`routers: ${name} — not on this machine: ${what ? what.what : 'its machine predicate does not hold'}`);
  }
  for (const id of Object.keys(superseded)) {
    log(`routers: вытеснен рукописный раздел "${id}" — тело сохранено в ${configLib.configPath(home)}`);
  }
  if (adopted.length) {
    log(`routers: принят пакетный текст — ${adopted.join(', ')}` +
        (f.dryRun ? ' (--dry-run: ничего не записано)'
                  : `; прежние формулировки сохранены в ${configLib.configPath(home)}`));
  }

  // The report, last, because it is about the NEXT run rather than this one.
  //
  // The operator's wording wins on every run, which is the point — but a
  // router reworded upstream then never arrives, and until now nothing said
  // so. Reporting does not change what was just written; it removes the one
  // outcome nobody chose, which is finding out by reading two files side by
  // side.
  const diverging = drift.diverged({
    packaged: registryText,
    authored: (configLib.readConfig(home) || {}).authored || {},
  });
  if (diverging.length) {
    log('');
    log(`routers: твой текст расходится с пакетным — ${diverging.map((e) => e.name).join(', ')}`);
    log('  Твоё слово по-прежнему выигрывает: блок записан с твоими формулировками.');
    log('  Посмотреть разницу:  npx sshlg-skills routers --diff <имя>');
    log('  Принять пакетный:    npx sshlg-skills routers --update --adopt <имя>');
  }
  return true;
}

/**
 * `config` — the pack's settings.
 *
 * Kept out of `parseFlags` on purpose: its arguments are positional, and that
 * parser exits on anything that is not a known flag.
 */
function cmdConfig(argv) {
  const registry = require('../lib/routers-registry.js');
  const configLib = require('../lib/config.js');
  const home = process.env.HOME || require('os').homedir();
  const [sub, key, value] = argv;

  if (!sub || sub === 'list') {
    const config = configLib.readConfig(home);
    log(`Настройки пака — ${configLib.configPath(home)}\n`);
    for (const name of registry.order()) {
      log(`  routers.${name.padEnd(16)} ${configLib.isEnabled(config, name) ? 'on' : 'off'}`);
    }
    log(`  update.auto${' '.repeat(11)} ${configLib.autoUpdateEnabled(config) ? 'on' : 'off'}`);
    const declared = configLib.externalGet(config);
    const names = Object.keys(declared).sort();
    log(names.length ? '\nОбъявленные маршруты (не участники семьи):' : '\nОбъявленных маршрутов нет.');
    for (const n of names) {
      const spec = declared[n] || {};
      const problems = triggersLib().routeProblems(n, spec);
      log(`  routes.external.${n}  → ${spec.skill || n}${problems.length ? '  (НЕ действует: ' + problems[0] + ')' : ''}`);
      log(`    triggers: ${triggersLib().splitTriggers(spec.triggers).join(', ')}`);
    }
    const packs = configLib.packOverridesGet(config);
    log(`\nВидимость паков (поверх pack-marks.json): hidePacks ${packs.hidePacks.length}, showPacks ${packs.showPacks.length}`);
    for (const p of packs.hidePacks) log(`  visibility.pack.${p}  hide`);
    for (const p of packs.showPacks) log(`  visibility.pack.${p}  show`);
    log('\nПоменять:  npx sshlg-skills config set routers.<имя> on|off');
    log('           npx sshlg-skills config set update.auto on|off');
    log('           npx sshlg-skills config set routes.external.<имя>.triggers "слово, фраза, …"');
    log('           npx sshlg-skills config set routes.external.<имя>.skill <skill-id>');
    log('           npx sshlg-skills config set routes.external.<имя> off');
    log('           npx sshlg-skills config set visibility.pack.<owner/repo> hide|show|default');
    return 0;
  }

  if (sub !== 'set') {
    log(`config: неизвестная подкоманда "${sub}" — есть list и set`);
    return 2;
  }

  if (key === 'update.auto') {
    if (configLib.STATES.indexOf(value) === -1) {
      log(`config set: состояние должно быть on или off — получено "${value === undefined ? '' : value}"`);
      return 2;
    }
    const wasAuto = configLib.autoUpdateEnabled(configLib.readConfig(home)) ? 'on' : 'off';
    if (wasAuto === value) {
      log(`update.auto: ${value} (без изменений)`);
      return 0;
    }
    configLib.setAutoUpdate(home, value);
    log(`update.auto: ${wasAuto} → ${value}`);
    log(value === 'off'
      ? 'Набор больше не обновляется сам. Обновить вручную: npx sshlg-skills@latest update'
      : 'Набор будет обновляться, когда ты отойдёшь — целиком, все девять паков.');
    return 0;
  }

  if (key && key.indexOf('routes.external.') === 0) return configExternal(home, key, argv.slice(2));

  if (key && key.indexOf('visibility.pack.') === 0) {
    const pack = key.slice('visibility.pack.'.length);
    const before = configLib.packOverridesGet(configLib.readConfig(home));
    const was = before.showPacks.includes(pack) ? 'show' : before.hidePacks.includes(pack) ? 'hide' : 'default';
    try { configLib.setPackOverride(home, pack, value); } catch (e) {
      log(`config set ${key}: ${e.message}`);
      return 2;
    }
    log(`visibility.pack.${pack}: ${was} → ${value}${was === value ? ' (без изменений)' : ''}`);
    log('Действует на Gemini, Pi, OpenCode и Hermes. На Claude и Codex переопределение пака ничего не меняет:');
    log('там скрыто всё вне ядра, а оставить скил в списке можно через `visibility --apply --keep <скил>`.');
    log('Применить: npx sshlg-skills visibility --apply (предпросмотр — без --apply).');
    return 0;
  }

  if (!key || key.indexOf('routers.') !== 0) {
    log('config set: ключ должен начинаться с "routers.", "routes.external." или "visibility.pack.", или быть "update.auto"');
    return 2;
  }

  const name = key.slice('routers.'.length);
  if (!Object.prototype.hasOwnProperty.call(registry.REGISTRY, name)) {
    log(`config set: роутера "${name}" нет. Валидные имена:`);
    for (const n of registry.order()) log(`  routers.${n}`);
    return 2;
  }

  if (configLib.STATES.indexOf(value) === -1) {
    log(`config set: состояние должно быть on или off — получено "${value === undefined ? '' : value}"`);
    return 2;
  }

  const was = configLib.isEnabled(configLib.readConfig(home), name) ? 'on' : 'off';
  if (was === value) {
    log(`routers.${name}: ${value} (без изменений)`);
    return 0;
  }
  configLib.setRouter(home, name, value);
  log(`routers.${name}: ${was} → ${value}`);
  log('Запусти `npx sshlg-skills routers --update`, чтобы применить.');
  return 0;
}

function triggersLib() { return require('../lib/triggers.js'); }

/**
 * `config set routes.external.<name>[.triggers|.skill|.line] <value…>` — a route the
 * operator declares for a skill outside the family.
 *
 * Every word after the key is the value, so an unquoted trigger list still arrives
 * whole. The declaration is validated BEFORE it is written: the prompt hook that reads
 * it must fail silent and would drop a bad entry without a word, so this is the one
 * place a mistake can be said out loud. `off` removes the declaration.
 */
function configExternal(home, key, rest) {
  const configLib = require('../lib/config.js');
  const T = triggersLib();
  const m = /^routes\.external\.([^.]+)(?:\.(triggers|skill|line))?$/.exec(key);
  const value = rest.join(' ').trim();
  if (!m) {
    log(`config set: не понял ключ "${key}" — routes.external.<имя>.triggers|skill|line или routes.external.<имя> off`);
    return 2;
  }
  const [, name, field] = m;
  if (!field) {
    if (value !== 'off') {
      log(`config set ${key}: без поля принимается только off — получено "${value}"`);
      return 2;
    }
    const was = configLib.externalClear(home, name);
    log(was === undefined ? `routes.external.${name}: не объявлен (без изменений)`
                          : `routes.external.${name}: удалён — ${configLib.configPath(home)}`);
    return 0;
  }
  if (!value) {
    log(`config set ${key}: нужно значение`);
    return 2;
  }
  const current = configLib.externalGet(configLib.readConfig(home))[name] || {};
  const patch = { [field]: field === 'triggers' ? T.splitTriggers(value) : value };
  const next = Object.assign({}, current, patch);
  // Setting the skill or the line before the triggers is allowed; anything else wrong
  // with the declaration is refused now rather than dropped by the hook later.
  const problems = T.routeProblems(name, next)
    .filter((p) => field === 'triggers' || !/^no triggers/.test(p));
  if (problems.length) {
    log(`config set ${key}: не записано —`);
    for (const p of problems) log(`  - ${p}`);
    return 2;
  }
  const stored = configLib.externalSet(home, name, patch);
  log(`routes.external.${name}.${field}: записано в ${configLib.configPath(home)}`);
  const route = T.externalRoutes({ [name]: stored })[0];
  if (route) {
    log(`  → ${route.skill}; ${route.triggers.length} trigger(s): ${route.triggers.join(', ')}`);
    log('  Хук промпта назовёт этот маршрут со следующего сообщения; `conflicts` и');
    log('  `toolkit --for` читают его при каждом запуске.');
  } else {
    log('  Маршрут ещё не действует: задай routes.external.' + name + '.triggers');
  }
  return 0;
}

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

/**
 * `hooks` — wire the family's three entries into the operator's settings.json.
 *
 * The whole edit is computed by `lib/hooks.js`, which is pure and fixtured; this
 * function does the two things that need a filesystem: take the backup, and
 * write. It goes through `protect()` for the same reason the routing block does
 * — `settings.json` is the operator's file, has no version control behind it,
 * and this pack does not get a second write path to one of those.
 */
/**
 * `injectors` — who else speaks at `SessionStart`, in full, on demand.
 *
 * The session block carries one line and only when there is somebody; this is where the
 * file paths live. It also gives the check a place to be **watched working on a machine
 * where nothing competes**: a guard whose output nobody has ever seen is
 * indistinguishable from a guard that is broken, and the empty case prints too.
 */
function cmdInjectors() {
  const inj = require(path.join(ROOT, 'lib', 'injectors.js'));
  // `$HOME` before `os.homedir()`, the same order every other command here uses —
  // the fixtures override the environment variable.
  const home = process.env.HOME || os.homedir();
  let read;
  try {
    read = inj.readRegistry(home);
  } catch (e) {
    // The registry is the input. Saying "nothing else injects" because a file could
    // not be read would be the false-clear this module exists to refuse.
    log(`cannot read the plugin registry (${e.message}) — no answer rather than a wrong one`);
    read = null;
  }
  if (read) log(inj.report(inj.injectors(...read)));
  // The second half is independent of the first: MCP declarations live in other files,
  // so a registry that could not be read must not silence what can be.
  let mcp;
  try {
    mcp = inj.readMcp(home);
  } catch (e) {
    log(`\ncannot read the MCP declarations (${e.message}) — no answer rather than a wrong one`);
    return;
  }
  log('');
  log(inj.mcpReport(inj.mcpFindings(mcp.servers, mcp.delivered), { transcript: mcp.transcript }));
}

/**
 * `conflicts` — which installed skills land on ground a router owns.
 *
 * The map's arbitration paragraph is general because the block is written on every
 * operator's machine and this one's roster is not theirs. This is the other half:
 * the rule ships, the roster is read here. Same split, same reason, as `injectors`.
 *
 * Its own members are excluded — the family's skills obviously land on the family's
 * ground, and twenty rows of that would bury the four that matter.
 */
function cmdConflicts() {
  const conflicts = require(path.join(ROOT, 'lib', 'conflicts.js'));
  const registry = require(path.join(ROOT, 'lib', 'routers-registry.js'));
  const home = process.env.HOME || os.homedir();
  let skills;
  try {
    skills = conflicts.readSkills(home);
  } catch (e) {
    log(`cannot read the installed skills (${e.message}) — no answer rather than a wrong one`);
    return;
  }
  const owned = manifest.skills.map((s) => s.pluginInstall).filter(Boolean);
  const installed = manifest.skills.map((s) => s.name);
  const routers = registry.scope({ installed, machine: require(path.join(ROOT, 'lib', 'machine.js')).probe({ home }) });
  // Routes the operator declared: their triggers are their ground (REQ-04, 2026-10-08).
  let external = [];
  try {
    const triggers = require(path.join(ROOT, 'lib', 'triggers.js'));
    const configLib = require(path.join(ROOT, 'lib', 'config.js'));
    external = triggers.externalRoutes(configLib.externalGet(configLib.readConfig(home)));
  } catch (e) { external = []; }
  log(conflicts.report(
    conflicts.collisions(skills, { owned, routers, external }),
    { scanned: skills.length }));
}

/**
 * `toolkit` — what this machine can reach, before a task decides what to use.
 *
 * The family's map answers "what do I have" with its packs. This answers it with the
 * number that is actually true: 490 reachable skills on the machine it was written on, of
 * which 28 are the family's. An agent choosing tools from the block alone is choosing from
 * 6% of what is installed, and the other 94% is invisible rather than rejected.
 *
 * Same split as `injectors` and `conflicts`, for the same reason: the doctrine that a task
 * should look before it reaches ships to every operator in the block; WHICH skills are here
 * is a fact about one machine and is read at the moment it is asked for.
 */
function cmdToolkit(argv) {
  const toolkit = require(path.join(ROOT, 'lib', 'toolkit.js'));
  const home = process.env.HOME || os.homedir();
  let skills;
  try {
    skills = toolkit.readSkills(home);
  } catch (e) {
    log(`cannot read the installed skills (${e.message}) — no answer rather than a wrong one`);
    return;
  }
  const family = manifest.skills.reduce(
    (acc, m) => acc.concat(m.skillNames && m.skillNames.length ? m.skillNames : [m.name]), []);

  const li0 = argv.indexOf('--limit');
  const findAt = argv.indexOf('--find');
  if (findAt !== -1) {
    const query = argv[findAt + 1] && !argv[findAt + 1].startsWith('--') ? argv[findAt + 1] : '';
    if (!query) { log('usage: npx sshlg-skills toolkit --find "<concept>, <concept>, …"'); return 2; }
    // Visibility is read, never assumed: a skill the operator hid from the listing is
    // exactly the one this search exists to reach.
    let overrides = {};
    try {
      overrides = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8')).skillOverrides || {};
    } catch (e) { overrides = {}; }
    const additional = toolkit.readShared(home, skills);
    const all = skills.concat(additional)
      .map((s) => Object.assign({}, s, { visibility: s.namespace === 'claude:plain' ? overrides[s.id] : undefined }));
    const { rows, total } = toolkit.find(all, query, li0 !== -1 ? Number(argv[li0 + 1]) || 12 : 12);
    log(toolkit.renderFind(rows, query, total, { showCopies: argv.includes('--copies') }));
    for (const warning of additional.warnings || []) log(`  catalogue incomplete: ${warning}`);
    return 0;
  }

  const at = argv.indexOf('--for');
  const forQuery = at !== -1 && argv[at + 1] && !argv[at + 1].startsWith('--') ? argv[at + 1] : '';
  const expand = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--expand' && argv[i + 1] && !argv[i + 1].startsWith('--')) expand.push(argv[i + 1]);
  }
  const li = argv.indexOf('--limit');
  const limit = li !== -1 && argv[li + 1] ? Number(argv[li + 1]) || 12 : 12;

  // The shortlist starts from what the prompt hook would route this task to, so the two
  // never disagree — and the words the family's own routes are built from are never
  // thrown away as too common (REQ-06, 2026-10-08).
  const triggers = require(path.join(ROOT, 'lib', 'triggers.js'));
  let external = [];
  try {
    const configLib = require(path.join(ROOT, 'lib', 'config.js'));
    external = triggers.externalRoutes(configLib.externalGet(configLib.readConfig(home)));
  } catch (e) { external = []; }
  const seeds = forQuery ? toolkit.seedsFor(triggers, forQuery, external) : [];
  const protect = toolkit.advertisedWords(triggers.ROUTES);

  log(toolkit.report(skills, family, { for: forQuery, expand, limit, seeds, protect }));
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

/**
 * `visibility` — which skills a host's model listing keeps, and hiding the rest.
 *
 * The decisions live in `lib/visibility.js`; this reads the inputs, backs every file up
 * through `protect()` before writing it, and records what it wrote so `--revert` removes
 * exactly that. Without `--apply` or `--revert` it writes nothing.
 */
function cmdVisibility(argv) {
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  const flag = (name) => argv.includes(name);
  const value = (name) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  if (argv[3] === 'marks') return cmdVisibilityMarks(argv);
  if (flag('--apply') && flag('--revert')) { log('visibility: --apply and --revert contradict each other'); return 2; }
  return runVisibility({
    mode: flag('--revert') ? 'revert' : flag('--apply') ? 'apply' : 'preview',
    days: Number(value('--days')) || V.DEFAULT_DAYS,
    keep: (value('--keep') || '').split(',').map((s) => s.trim()).filter(Boolean),
  });
}

/**
 * The work of `visibility`, callable from `update` (which re-applies it on a machine whose
 * record shows the operator ran `--apply`). `opts.only` limits the run to a set of host
 * ids; a host outside it keeps its record untouched.
 */
function runVisibility(opts) {
  // Direct visibility and update share one machine mutation lock. Re-apply is already
  // inside runUpdateLocked; read-only previews deliberately do not acquire it.
  if (opts.mode === 'preview' || opts.reapply) return runVisibilityUnlocked(opts);
  const lock = require('../lib/updatelock.js');
  const home = process.env.HOME || os.homedir();
  const got = lock.acquire(home);
  if (!got.ok || got.degraded) {
    log(`visibility: refused — ${got.message || got.degraded}`);
    return got.ok ? 1 : lock.BUSY_EXIT;
  }
  if (got.tookOver) log(`visibility: took over update.lock — ${got.tookOver}`);
  try { return runVisibilityUnlocked(opts); }
  finally { lock.release(home, got.token); }
}

function runVisibilityUnlocked(opts) {
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  const HV = require(path.join(ROOT, 'lib', 'hostvis.js'));
  const toolkit = require(path.join(ROOT, 'lib', 'toolkit.js'));
  const apply = require(path.join(ROOT, 'lib', 'apply.js'));
  const configLib = require(path.join(ROOT, 'lib', 'config.js'));
  const home = process.env.HOME || os.homedir();
  const S = require(path.join(ROOT, 'lib', 'visibility-state.js'));
  const readErrors = new Map();
  const read = (p) => { try { return S.read(p); } catch (e) { readErrors.set(p, e.code || 'cannot read'); return null; } };
  const claudeRoot = apply.hostRoot(HV.target('claude'), home, { env: process.env });
  const codexRoot = apply.hostRoot(HV.target('codex'), home, { env: process.env });
  const doApply = opts.mode === 'apply';
  const doRevert = opts.mode === 'revert';
  const days = opts.days || V.DEFAULT_DAYS;
  const keep = opts.keep || [];
  const inScope = (id) => !opts.only || opts.only.has(id);

  const recordPath = path.join(home, '.sshlg-skills', 'visibility.json');
  let owned = { claude: [], codex: [], gemini: [], pi: [], opencode: [], hermes: [], piCreated: false, created: {}, hosts: [] };
  try {
    const stored = S.validate(JSON.parse(S.read(recordPath) || '{}'));
    const recovered = S.recover(stored, process.env);
    if (stored.pending) log(`  recovered pending ${stored.pending.host} write from its fingerprint${!doApply && !doRevert ? ' (preview only)' : ''}`);
    owned = Object.assign(owned, recovered);
  } catch (e) { log(`visibility: ownership record not usable — ${e.message}; nothing written`); return 1; }
  const createdOf = (id) => (owned.created && Array.isArray(owned.created[id]) ? owned.created[id] : []);

  const policyErrors = [];
  let skills = [];
  if (!doRevert) {
    try { skills = toolkit.readSkills(home, { claudeRoot, strict: true }).filter((s) => s.callable !== false); }
    catch (e) { policyErrors.push(`Claude inventory: ${e.code || 'invalid registry/skill'}`); }
  }
  const personal = skills.filter((s) => s.namespace === 'claude:plain').map((s) => s.id);
  const family = manifest.skills.reduce((acc, m) => acc.concat(m.skillNames && m.skillNames.length ? m.skillNames : [m.name]), []);
  let usage = {};
  if (!doRevert) {
    const usagePath = path.join(process.env.CLAUDE_CONFIG_DIR ? claudeRoot : home, '.claude.json');
    try {
      const u = (S.object(usagePath) || {}).skillUsage;
      if (u !== undefined && (!u || typeof u !== 'object' || Array.isArray(u)
        || Object.values(u).some((v) => !v || typeof v !== 'object' || Array.isArray(v)
          || (v.lastUsedAt !== undefined && (typeof v.lastUsedAt !== 'number' || !Number.isFinite(v.lastUsedAt))))))
        throw new Error('invalid skillUsage');
      usage = u || {};
    }
    catch (e) { policyErrors.push(`usage: ${e.code || e.message}`); }
  }
  const instructionsPath = path.join(claudeRoot, 'CLAUDE.md');
  const instructions = doRevert ? '' : read(instructionsPath) || '';
  if (readErrors.has(instructionsPath)) policyErrors.push(`instructions: ${readErrors.get(instructionsPath)}`);
  const now = Date.now();
  const coreSet = V.core({ personal, family, usage, now, days, instructions });
  for (const k of keep) coreSet.add(k);

  // ── Claude ──
  const settingsPath = path.join(claudeRoot, 'settings.json');
  const settingsText = read(settingsPath);
  let settingsData = {};
  try { settingsData = JSON.parse(settingsText || '{}'); } catch (e) { settingsData = {}; }
  const overrides = settingsData.skillOverrides || {};
  const mine = new Set(owned.claude.filter((n) => overrides[n] === V.HIDE));
  const foreign = {};
  for (const [k, v] of Object.entries(overrides)) if (!mine.has(k)) foreign[k] = v;
  const plan = doRevert ? { hide: [], respected: [] } : V.claudePlan({ personal, core: coreSet, overrides: foreign, keep });
  const claudeSet = plan.hide.filter((n) => !mine.has(n));
  const claudeUnset = [...mine].filter((n) => !plan.hide.includes(n));
  const stateOf = (s, ov) => {
    if (s.loaded === false) return 'hidden';  // installed, not loaded here (B-185): not in the listing
    if (s.namespace !== 'claude:plain') return 'on';
    const v = ov[s.id];
    if (v === 'off' || v === V.HIDE) return 'hidden';
    return v === 'name-only' ? 'name-only' : 'on';
  };
  const after = Object.assign({}, overrides);
  for (const n of claudeSet) after[n] = V.HIDE;
  for (const n of claudeUnset) delete after[n];
  const charsBefore = V.listingChars(skills.map((s) => ({ name: s.plugin && s.namespace === 'claude:plugin' ? `${s.plugin.split('@')[0]}:${s.id}` : s.id, description: s.description, state: stateOf(s, overrides) })));
  const charsAfter = V.listingChars(skills.map((s) => ({ name: s.plugin && s.namespace === 'claude:plugin' ? `${s.plugin.split('@')[0]}:${s.id}` : s.id, description: s.description, state: stateOf(s, after) })));

  // ── Codex ──
  const codexPath = path.join(codexRoot, 'config.toml');
  const codexText = read(codexPath);
  const sharedRoot = path.join(home, '.agents', 'skills');
  let shared = [];
  if (!doRevert) {
    try { shared = HV.readRoot(sharedRoot, { strict: true }).map((s) => s.base); }
    catch (e) { policyErrors.push(`shared inventory: ${e.code || 'cannot read'}`); }
  }
  const familySet = new Set(family);
  const codexWant = doRevert ? [] : shared.filter((n) => !familySet.has(n) && !coreSet.has(n)).map((n) => path.join(sharedRoot, n, 'SKILL.md'));
  const codexAdd = codexWant.filter((p) => !owned.codex.includes(p));
  const codexDrop = owned.codex.filter((p) => !codexWant.includes(p));

  // ── The operator's pack marks: a machine file, never the package's (L1 fix round) ──
  const marksPath = path.join(home, '.sshlg-skills', 'pack-marks.json');
  const marksText = doRevert ? null : read(marksPath);
  if (readErrors.has(marksPath)) policyErrors.push(`pack marks: ${readErrors.get(marksPath)}`);
  let marksData = null;
  let markProblems = [];
  if (marksText !== null) {
    try { marksData = JSON.parse(marksText); markProblems = V.marksProblems(marksData); } catch (e) { markProblems = [`does not parse (${e.message})`]; }
  }
  const marks = V.marksIndex(marksData);
  let config = {}, lock = new Map();
  if (!doRevert) {
    if (markProblems.length) policyErrors.push('pack marks: invalid pack-marks/1');
    try {
      config = S.object(configLib.configPath(home)) || {};
      const v = config.visibility;
      if (v !== undefined && (!v || typeof v !== 'object' || Array.isArray(v)
        || ['hidePacks', 'showPacks'].some((k) => v[k] !== undefined && (!Array.isArray(v[k]) || v[k].some((x) => typeof x !== 'string')))))
        throw new Error('invalid visibility overrides');
    } catch (e) { policyErrors.push(`config: ${e.code || e.message}`); }
    try { lock = HV.readLock(home, { strict: true }); } catch (e) { policyErrors.push(e.message); }
  }
  if (policyErrors.length) {
    log(`visibility: policy not usable — ${policyErrors.join('; ')}; settings and ownership unchanged`); return 1;
  }
  const hostList = HV.hosts(home, process.env);
  let files;
  try {
    files = Object.fromEntries([['claude', settingsPath], ['codex', codexPath]]
      .concat(hostList.filter((h) => h.file && !h.cannot).map((h) => [h.id, h.file]))
      .map(([id, file]) => [id, S.profilePath(file)]));
  } catch (e) { log(`visibility: profile identity not usable (${e.code || e.message}); nothing written`); return 1; }
  // Old Claude/Codex receipts could only target their hard-coded defaults. New ones
  // bind every host, so consent and owned entries cannot migrate to another profile.
  for (const [id, file] of Object.entries(files)) {
    if (!inScope(id)) continue;
    const prior = (owned.files || {})[id] || (id === 'claude' ? S.profilePath(path.join(home, '.claude/settings.json'))
      : id === 'codex' ? S.profilePath(path.join(home, '.codex/config.toml')) : null);
    const carriesState = (owned[id] || []).length || createdOf(id).length || (opts.reapply && (owned.hosts || []).includes(id));
    if (!prior && carriesState) {
      log(`visibility: legacy ${id} ownership is not bound to a profile; preserve ${recordPath} and backups, restore a verified files.${id} binding from the original apply before retrying; nothing written`); return 1;
    }
    if (prior && path.resolve(prior) !== file && carriesState) {
      log(`visibility: ${id} profile differs from ownership at ${prior}; select that profile and revert first; nothing written`); return 1;
    }
  }
  const inv = {};
  const seen = new Set(personal);
  for (const h of hostList) if (h.present && !h.cannot) {
    try { inv[h.id] = doRevert ? [] : HV.inventory(h, lock, { strict: true }); }
    catch (e) { log(`visibility: ${h.id} inventory not usable (${e.code || 'cannot read'}); settings and ownership unchanged`); return 1; }
    inv[h.id].forEach((s) => seen.add(s.name));
  }
  // The core over every name a host reads, not only Claude's personal skills: a skill
  // used in the window (by Claude Code usage) stays listed on every host, whatever its mark.
  const coreAll = V.core({ personal: [...seen], family, usage, now, days, instructions });
  for (const k of keep) coreAll.add(k);
  const installedPacks = new Set(lock.values());
  const hiddenPacks = [...installedPacks].filter((p) => V.packHidden(p, '*', { marks, config }));
  const ov = config.visibility || {};

  log('Host-wide fallback for sessions Fabric does not start. Fabric\'s RM-23 (open) is to read ~/.sshlg-skills/pack-marks.json and own visibility in the sessions it starts.');
  log(`Skill visibility — core = family + used within ${days} days (by Claude Code usage) + named in ${instructionsPath}${keep.length ? ' + --keep' : ''}`);
  log(`  core: ${coreSet.size} skills (Claude, Codex); ${coreAll.size} across every host's roots`);
  if (doRevert) {
    log('  pack marks: not needed for revert — undo uses the ownership record');
  } else if (marksText === null) {
    log('  pack marks: no pack marks on this machine (~/.sshlg-skills/pack-marks.json) — no pack is hidden by mark.');
    log('    Write them: `npx sshlg-skills visibility marks --init --show <owner/repo,…>` (preview), then add --apply.');
  } else if (markProblems.length) {
    log(`  pack marks: ~/.sshlg-skills/pack-marks.json NOT read — ${markProblems[0]}; no pack is hidden by mark`);
  } else {
    log(`  pack marks: ~/.sshlg-skills/pack-marks.json revision ${marksData.revision}; ${hiddenPacks.length} of ${installedPacks.size} installed packs hidden`);
  }
  if ((ov.hidePacks || []).length || (ov.showPacks || []).length) {
    log(`  overrides (config.json): hidePacks ${(ov.hidePacks || []).length}, showPacks ${(ov.showPacks || []).length} — Gemini, Pi, OpenCode and Hermes only`);
  }
  if (inScope('claude')) {
    log(`  Claude: ${personal.length} personal skills; hide ${claudeSet.length} more, un-hide ${claudeUnset.length}; ` +
        `${Object.keys(foreign).length} operator-set override(s) left alone`);
    log(`  Claude listing ≈ ${charsBefore} → ${charsAfter} characters (names + descriptions, 1536 cap each).`);
    log('    Budget: Claude Code logs it — `claude -p x --debug` then look for "Skill listing over budget"');
    log('    (30000 characters measured on 2026-10-10). Over budget, descriptions drop least-used first.');
  }
  if (inScope('codex')) {
    log(`  Codex: ${shared.length} shared skills; disable up to ${codexAdd.length} more (entries already present are left as they are), re-enable ${codexDrop.length}` +
        (codexText === null ? ` (${codexPath}: ${readErrors.get(codexPath) || 'absent'} — skipped)` : ''));
  }
  log('  Claude and Codex hide everything outside the core (pack marks and overrides do not change them; --keep does).');

  // Plan every other host. `edit` is pure, so the preview reports what --apply would add.
  const hostPlans = [];
  for (const h of hostList) {
    if (!inScope(h.id)) continue;
    if (!h.present) { log(`  ${h.id}: not installed here — skipped`); continue; }
    if (h.cannot) { log(`  ${h.id}: cannot hide on ${h.id} — ${h.cannot}`); continue; }
    const list = inv[h.id];
    const names = doRevert ? [] : V.hostHide({ skills: list, host: h.id, marks, config, core: coreAll });
    const marked = list.filter((s) => s.pack && V.packHidden(s.pack, h.id, { marks, config })).length;
    const want = HV.items(h, list, names);
    const ownedHere = owned[h.id] || [];
    // Nothing planned and nothing owned: the host is not touched — not even read through
    // its CLI — so a host that cannot be written cannot fail a run that asks nothing of it.
    if (!want.length && !ownedHere.length && !createdOf(h.id).length) {
      log(`  ${h.id}: nothing to hide${marked ? ` (${marked} in hidden packs, all kept by the core)` : ''}`);
      continue;
    }
    const add = want.filter((x) => !ownedHere.includes(x));
    const drop = ownedHere.filter((x) => !want.includes(x));
    const p = { h, names, want, add, drop, ownedHere };
    if (h.refuse) { p.reason = h.refuse; }
    else if (h.kind === 'hermes-cli') {
      const cur = HV.hermesRead(process.env);
      if (cur.reason) p.reason = cur.reason;
      else {
        p.current = cur.list;
        p.next = cur.list.filter((x) => !drop.includes(x)).concat(add.filter((x) => !cur.list.includes(x)));
        p.added = add.filter((x) => !cur.list.includes(x));
        p.changed = p.next.length !== cur.list.length || p.added.length > 0;
      }
    } else {
      p.text = read(h.file);
      if (readErrors.has(h.file)) {
        p.reason = `${h.file}: ${readErrors.get(h.file)}`; hostPlans.push(p); continue;
      }
      const prunable = createdOf(h.id);
      const edit = h.kind === 'json-list'
        ? V.editJsonList(p.text, { keys: h.keys, add, remove: drop, create: h.create, newline: h.newline, prunable })
        : V.editJsonMap(p.text, { keys: h.keys, set: add, value: h.value, unset: drop, prunable });
      if (!edit.ok) p.reason = `${h.file} ${edit.reason}`;
      else if (edit.skipped && want.length) p.reason = `no ${path.basename(h.file)} — create it, or run the host once`;
      else { p.edit = edit; p.added = edit.added; p.changed = edit.text !== p.text; }
    }
    log(`  ${h.id}: ${list.length} skills in its roots, ${marked} in hidden packs` +
        `${doRevert ? '' : ` (${marked - names.length} kept by the core)`}; hide ${names.length}; ` +
        (p.reason ? `DEGRADED — ${p.reason}`
          : `write ${p.added.length} new entr${p.added.length === 1 ? 'y' : 'ies'}, remove ${drop.length} — ${h.label}`));
    hostPlans.push(p);
  }
  log('  A hidden skill stays installed: no file is deleted or moved, the SKILL.md is still readable,');
  log('  and `npx sshlg-skills toolkit --find "<concepts>"` finds it by meaning.');
  if (!doApply && !doRevert) { log('\n  Nothing written. `--apply` hides, `--revert` undoes only what this command wrote.'); return 0; }

  const degraded = [];
  let record = Object.assign({}, owned, {
    note: 'Written by `npx sshlg-skills visibility`; --revert removes these entries. Pending holds a write-ahead receipt; applied is consent for update on hosts only.',
    days, keep, marksRevision: marksData && !markProblems.length ? marksData.revision : null,
    updatedAt: new Date().toISOString(), created: Object.assign({}, owned.created || {}),
    files: Object.assign({}, owned.files || {}, Object.fromEntries(Object.entries(files).filter(([id]) => inScope(id)))),
  });
  if (doApply && !opts.reapply) {
    record.applied = true;
    record.hosts = [];
    if (settingsText !== null) record.hosts.push('claude');
    if (codexText !== null) record.hosts.push('codex');
    for (const h of hostList) if (h.present && !h.cannot) record.hosts.push(h.id);
    if (opts.only) record.hosts = record.hosts.filter((x) => opts.only.has(x)).concat((owned.hosts || []).filter((x) => !opts.only.has(x)));
  } else if (doRevert) {
    // Withdraw before the first undo, so an interruption cannot re-arm an update.
    record.applied = false;
    record.hosts = [];
  }
  const journal = S.journal(recordPath, home, record, process.env);
  const clone = () => JSON.parse(JSON.stringify(journal.current));
  const degrade = (id, reason) => { log(`  ${id}: DEGRADED, not written — ${reason}`); degraded.push(id); };
  const transact = (id, file, before, after, next, action, kind = 'file') => {
    const result = journal.transact({ host: id, file: files[id] || file, kind, before: S.hash(before), after: S.hash(after) }, next, action);
    if (!result.landed) { degrade(id, result.error ? result.error.message : 'write did not take effect'); return; }
    log(`  ${id}: written and read back${result.error ? ' (the write reported an error but its result was confirmed)' : ''}`);
  };
  // Receipt failure is fatal, unlike one unavailable host: no unjournalled host write is allowed.
  try {
    journal.save(record);
    const writeSimple = (id, file, before, edit, entries) => {
      if (!inScope(id)) return;
      if (readErrors.has(file)) { degrade(id, readErrors.get(file)); return; }
      if (before === null) return;
      const r = edit(before);
      if (!r.ok) { degrade(id, r.reason); return; }
      const next = clone();
      next[id] = entries(r);
      if (id === 'claude') {
        if (claudeSet.length && !('skillOverrides' in settingsData)) next.created.claude = ['skillOverrides'];
        if (doRevert) delete next.created.claude;
      }
      if (r.text === before) { journal.save(next); log(`  ${id}: already as planned`); return; }
      transact(id, file, before, r.text, next, () => S.write(file, r.text, home));
    };
    const claudeCreated = createdOf('claude').includes('skillOverrides') || !Object.prototype.hasOwnProperty.call(owned, 'applied');
    writeSimple('claude', settingsPath, settingsText,
      (t) => V.editClaudeSettings(t, { set: claudeSet, unset: claudeUnset, prune: claudeCreated }), () => plan.hide.slice().sort());
    writeSimple('codex', codexPath, codexText,
      (t) => V.editCodexConfig(t, { disable: codexAdd, enable: codexDrop }),
      (r) => [...new Set(owned.codex.filter((p) => codexWant.includes(p)).concat(r.added || []))].sort());

    for (const p of hostPlans) {
      const { h } = p;
      if (p.reason) { degrade(h.id, p.reason); continue; }
      const next = clone();
      next[h.id] = [...new Set(p.ownedHere.filter((x) => p.want.includes(x)).concat(p.added))].sort();
      if (!p.changed) { journal.save(next); log(`  ${h.id}: already as planned`); continue; }
      if (h.kind === 'hermes-cli') {
        transact(h.id, h.file, JSON.stringify(p.current), JSON.stringify(p.next), next, () => {
          const saved = apply.protect(h.file, { home });
          if (saved.action === 'backup-failed') throw new Error(`backup failed: ${saved.error}`);
          const w = HV.hermesWrite(p.next, process.env);
          if (w.reason) throw new Error(w.reason);
        }, 'hermes');
        continue;
      }
      const text = p.edit.text;
      const removePi = h.id === 'pi' && owned.piCreated && text === '{}';
      if (removePi) {
        next.piCreated = false; next.pi = []; delete next.created.pi;
      } else {
        if (h.id === 'pi' && p.edit.created) next.piCreated = true;
        const at = V.jsonAt(text || '', h.keys);
        const cp = new Set(createdOf(h.id).concat(p.edit.createdPaths || []));
        if (at === undefined) cp.clear();
        if (cp.size) next.created[h.id] = [...cp].sort(); else delete next.created[h.id];
      }
      transact(h.id, h.file, p.text, removePi ? null : text, next, () => {
        if (removePi) {
          const saved = apply.protect(h.file, { home });
          if (saved.action === 'backup-failed') throw new Error(`backup failed: ${saved.error}`);
          fs.unlinkSync(h.file);
        } else S.write(h.file, text, home);
      });
    }
  } catch (e) {
    log(`  visibility stopped: ${e.message}. The ownership receipt is preserved; retry visibility --revert after resolving the error.`);
    return 1;
  }
  if (degraded.length) log(`  degraded (not written, the run continues): ${degraded.join(', ')}`);
  log('  Restart the host session to load the new listing.');
  return 0;
}

/**
 * `visibility marks` — the operator's pack marks, a MACHINE file
 * (`~/.sshlg-skills/pack-marks.json`, pack-marks/1). The public package ships no marks:
 * shipping one operator's marks as defaults would hide them for everyone who applied.
 * `--init --show <owner/repo,…>` writes one row per installed pack (the family and the
 * shown packs listed, the rest hidden); without `--apply` it previews; an existing file is
 * replaced only with `--replace`, after a backup.
 */
function cmdVisibilityMarks(argv) {
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  const HV = require(path.join(ROOT, 'lib', 'hostvis.js'));
  const apply = require(path.join(ROOT, 'lib', 'apply.js'));
  const home = process.env.HOME || os.homedir();
  const file = path.join(home, '.sshlg-skills', 'pack-marks.json');
  const flag = (name) => argv.includes(name);
  const value = (name) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  let text = null;
  try { text = require('../lib/visibility-state.js').read(file); }
  catch (e) { log(`visibility marks: cannot read ${file} (${e.code || 'read error'}); nothing written`); return 1; }
  let cur = null;
  try { cur = text === null ? null : JSON.parse(text); } catch (e) { cur = null; }
  if (!flag('--init')) {
    if (text === null) { log(`No pack marks on this machine (${file}).`); log('Write them: npx sshlg-skills visibility marks --init --show <owner/repo,…> [--apply]'); return 0; }
    const problems = cur ? V.marksProblems(cur) : ['does not parse'];
    if (problems.length) { log(`${file}: NOT valid pack-marks/1 — ${problems.join('; ')}`); return 1; }
    log(`${file}: revision ${cur.revision}; ${cur.packs.length} packs, ${cur.packs.filter((m) => m.hidden).length} hidden`);
    for (const m of cur.packs) log(`  ${m.hidden ? 'hide' : 'show'}  ${m.pack}${m.host.includes('*') ? '' : ` (${m.host.join(', ')})`}`);
    return 0;
  }
  const show = (value('--show') || '').split(',').map((x) => x.trim()).filter(Boolean);
  let packs;
  try { packs = [...new Set(HV.readLock(home, { strict: true }).values())]; }
  catch (e) { log(`visibility marks: ${e.message}; nothing written`); return 1; }
  if (!packs.length) { log('visibility marks: no installed packs (~/.agents/.skill-lock.json) — nothing to mark'); return 2; }
  const known = new Set(packs.map((p) => p.toLowerCase()));
  for (const p of show) if (!known.has(p.toLowerCase())) log(`  note: ${p} is not installed here; marked listed anyway`);
  if (text !== null && !flag('--replace')) {
    log(`visibility marks: ${file} exists — pass --replace to write a new revision (a backup is taken first)`);
    return 2;
  }
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const revision = cur && Number.isInteger(cur.revision) ? cur.revision + 1 : 1;
  const allPacks = packs.concat(show.filter((p) => !known.has(p.toLowerCase())));
  const data = V.marksFromLock({ packs: allPacks, show, date, revision });
  const hidden = data.packs.filter((m) => m.hidden);
  log(`Pack marks for this machine → ${file} (revision ${revision})`);
  log(`  ${data.packs.length} packs: ${hidden.length} hidden, ${data.packs.length - hidden.length} listed (family and --show)`);
  for (const m of hidden) log(`  hide  ${m.pack}`);
  if (!flag('--apply')) { log('\n  Nothing written. Add --apply to write it (a backup is taken first).'); return 0; }
  const saved = apply.protect(file, { home });
  if (saved.action === 'backup-failed') { log(`  NOT written — backup failed (${saved.error})`); return 1; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  log(`  written${saved.path ? ` (backup ${saved.path})` : ''}. Preview the hosts: npx sshlg-skills visibility`);
  return 0;
}

/**
 * `domains` — domain members load only in the projects that call for them (plan
 * 2026-10-13 § L5). The decisions live in `lib/domains.js`; this reads the inputs, backs
 * every existing file up through `protect()` before writing it, reads every write back,
 * and records what it wrote in `~/.sshlg-skills/domains.json` so `--revert` removes
 * exactly that. Without `--apply`, `--revert`, `--enable`, `--disable` or `--update-step`
 * it writes nothing.
 *
 * Order is the point: every project entry is written AND read back before a member is
 * turned off at user scope, so no project with evidence loses its member, even for one
 * session. A project that cannot be written keeps its member on machine-wide; a project
 * read only in part keeps on every member it could not rule out. Only an interactive
 * `--apply` turns a member off: the unattended `update` step only adds.
 */
const DOMAINS_LOCAL = path.join('.claude', 'settings.local.json');

/** A symlink alias is the same profile; changing its target is a different profile. */
function domainsProfilePath(file) {
  try { return fs.realpathSync(file); } catch (e) {
    try { return path.join(fs.realpathSync(path.dirname(file)), path.basename(file)); }
    catch (_) { return path.resolve(file); }
  }
}

function domainsInputs(argv, home) {
  const D = require(path.join(ROOT, 'lib', 'domains.js'));
  const E = require(path.join(ROOT, 'lib', 'enablement.js'));
  const settingsPath = path.join(E.claudeRoot(home), 'settings.json');
  const profile = domainsProfilePath(settingsPath);
  const settingsLabel = path.resolve(E.claudeRoot(home)) === path.join(home, '.claude') ? '~/.claude/settings.json' : settingsPath;
  const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } };
  // Only a missing file is "absent"; any other read error is reported, never taken for absence.
  const readLocal = (p) => {
    try { return { text: fs.readFileSync(p, 'utf8') }; } catch (e) { return e.code === 'ENOENT' ? { text: null } : { text: null, error: e.code || e.message }; }
  };
  const value = (name) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  const recordPath = path.join(home, '.sshlg-skills', 'domains.json');
  const rr = readLocal(recordPath);
  const recordText = rr.text;
  // A record that does not parse, or has another shape, is NOT "no record": members may be off
  // by this command's hand. It is named, and the writers refuse to act on it.
  let owned = null;
  let recordError = rr.error ? `cannot be read (${rr.error})` : null;
  if (recordText !== null) {
    try { owned = JSON.parse(recordText); } catch (e) { recordError = `does not parse (${e.message})`; }
    if (!recordError) recordError = D.validRecord(owned);
    if (recordError) owned = null;
  }
  const ownedProfile = owned && domainsProfilePath(owned.profile || path.join(home, '.claude', 'settings.json'));
  const profileError = owned && ownedProfile !== profile
    ? `ownership belongs to Claude profile ${ownedProfile}; selected profile is ${profile}. Restore CLAUDE_CONFIG_DIR to the owning profile before applying or reverting` : null;
  const rootArg = value('--root') || process.env.SSHLG_PROJECTS_ROOT || null;
  const roots = (rootArg ? rootArg.split(path.delimiter) : (owned && owned.roots && owned.roots.length ? owned.roots : null) || [path.join(home, 'DATA')])
    .filter(Boolean).map((r) => path.resolve(r.replace(/^~(?=$|\/)/, home)));
  // Every git repository directly under a root. A symlink to a directory is followed and
  // keyed by the LINK path (the one Claude Code opens); two names for one repository are
  // one project, the first by name.
  const dirs = [];
  const rootErrors = [];
  const seen = new Set();
  const addDir = (dir) => {
    let real;
    try { real = fs.realpathSync(dir); } catch (e) { return false; }
    if (seen.has(real)) return false;
    seen.add(real);
    dirs.push(dir);
    return true;
  };
  for (const r of roots) {
    let entries;
    try { entries = fs.readdirSync(r, { withFileTypes: true }); } catch (e) { rootErrors.push(`${r}: ${e.code || e.message}`); continue; }
    const names = entries.filter((d) => !d.name.startsWith('.')).filter((d) => {
      if (d.isDirectory()) return true;
      if (!d.isSymbolicLink()) return false;
      try { return fs.statSync(path.join(r, d.name)).isDirectory(); } catch (e) { return false; }
    }).map((d) => d.name).sort();
    for (const n of names) if (fs.existsSync(path.join(r, n, '.git'))) addDir(path.join(r, n));
  }
  const rootRepos = dirs.length;
  // Projects the operator chose with --enable are projects wherever they live.
  for (const dir of Object.keys((owned && owned.manual) || {})) if (fs.existsSync(dir)) addDir(dir);
  // Usage: the newest 60-day table, unless --no-usage. Private (mode 600); only counts are read.
  let usage = new Map();
  let usageFile = null;
  if (!argv.includes('--no-usage')) {
    const udir = path.join(home, '.sshlg-skills', 'usage');
    let tables = [];
    // The operator's own measurement (no hub command produces it); one past its window is ignored.
    try { tables = fs.readdirSync(udir).filter((n) => D.usageFresh(n)).sort(); } catch (e) { tables = []; }
    if (tables.length) {
      usageFile = path.join(udir, tables[tables.length - 1]);
      usage = D.parseUsage(read(usageFile) || '', SKILLS.filter((s) => D.DOMAIN_MEMBERS.includes(s.name)));
    }
  }
  const plugins = {};
  for (const s of SKILLS) if (D.DOMAIN_MEMBERS.includes(s.name)) plugins[s.name] = s.pluginInstall;
  // A member whose plugin ships hooks is never scoped (its gate must run in every session).
  // Read from the installed plugin's own directory, or this checkout's pin when not installed.
  const installedAt = E.installed(home);
  const keepOn = { 'sheleg-dev': D.KEEP_ON_HOOKS };
  for (const m of D.DOMAIN_MEMBERS) {
    const dirs = [installedAt[plugins[m]], path.join(ROOT, 'skills', m, 'plugins', m)].filter(Boolean);
    if (dirs.some((d) => fs.existsSync(path.join(d, 'hooks', 'hooks.json')))) keepOn[m] = D.KEEP_ON_HOOKS;
  }
  const localPath = (dir) => path.join(dir, DOMAINS_LOCAL);
  const enabledOf = (text) => { try { const d = JSON.parse(text); return (d && d.enabledPlugins) || {}; } catch (e) { return {}; } };
  const kinds = {};
  // Evidence from a child that asks git, several repositories at a time (lib/domainscan.js).
  // A child that fails leaves every project to the in-process walk: slower, and partial.
  let scanned = {};
  const child = dirs.length ? spawnSync(process.execPath, [path.join(ROOT, 'lib', 'domainscan.js')],
    { input: JSON.stringify(dirs), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }) : { status: 0, stdout: '{}' };
  try { scanned = child.status === 0 ? JSON.parse(child.stdout || '{}') : {}; } catch (e) { scanned = {}; }
  const projects = dirs.map((dir) => {
    let s = scanned[dir];
    if (!s) {
      const w = D.scan(dir, fs, path);
      s = { evidence: w.evidence, via: w.truncated ? 'walk (stopped early)' : 'walk', partial: D.DOMAIN_MEMBERS.slice() };
    }
    const evidence = s.evidence;
    const used = usage.get(D.encodeDir(dir)) || {};
    for (const [member, calls] of Object.entries(used)) (evidence[member] || (evidence[member] = [])).push(`used 60d: ${calls} call(s)`);
    for (const member of ((owned && owned.manual) || {})[dir] || []) (evidence[member] || (evidence[member] = [])).push('manual: chosen with --enable');
    for (const list of Object.values(evidence)) for (const why of list) {
      const k = why.startsWith('used 60d') ? 'usage' : why.startsWith('manual:') ? 'manual' : (D.kindOf(why.split(': ')[0]) || 'other');
      kinds[k] = (kinds[k] || 0) + 1;
    }
    const lr = readLocal(localPath(dir));
    const sr = readLocal(path.join(dir, '.claude', 'settings.json'));
    // Read semantic choices independently of the narrower lossless-write format.
    // A project settings file may be valid JSON without having been printed by us.
    const shared = sr.error ? { ok: false, reason: 'unreadable file' } : D.readEnabled(sr.text);
    const local = lr.error ? { ok: false, reason: 'unreadable file' } : D.readEnabled(lr.text);
    const sharedOK = shared.ok;
    const localOK = local.ok;
    const settingsOK = sharedOK && localOK;
    let verdict;
    // Shared project choices precede local ones; user scope must not masquerade as
    // a project entry. Unknown shared settings cannot authorize a local override.
    const writable = () => verdict || (verdict = settingsOK ? domainsWritable(dir, lr, D)
      : { ok: false, why: `cannot read valid .claude/${sharedOK ? 'settings.local.json' : 'settings.json'}` });
    const settingsReasons = [[shared, '.claude/settings.json'], [local, '.claude/settings.local.json']]
      .filter(([result]) => !result.ok).map(([result, file]) => `${file}: ${result.reason}`);
    return { dir, evidence, via: [s.via, ...settingsReasons].join('; '),
      partial: settingsOK ? (s.partial || []) : D.DOMAIN_MEMBERS.slice(),
      local: settingsOK ? Object.assign({}, shared.enabled, local.enabled) : {}, ignored: writable };
  });
  const ur = readLocal(settingsPath);
  return { D, read, readLocal, roots, rootErrors, rootRepos, dirs, projects, usageFile, kinds, plugins, owned, recordError,
    recordPath, recordText, profile, profileError, settingsPath, settingsLabel, userText: ur.text, userError: ur.error, user: enabledOf(ur.text), localPath, enabledOf, value, keepOn };
}

/** May this project's settings.local.json be written? Readable, Claude Code's format, git-ignored. */
function domainsWritable(dir, lr, D) {
  if (lr.error) return { ok: false, why: `cannot read .claude/settings.local.json (${lr.error})` };
  if (lr.text !== null) {
    const probe = D.editEnabled(lr.text, { set: { 'probe@probe': true } });
    if (!probe.ok) return { ok: false, why: `the file ${probe.reason}` };
  }
  // -q decides: with -v, git also exits 0 when the last matching rule is a negation
  // (`!.claude/settings.local.json`), which leaves the file committable. Any ignore source
  // counts (.gitignore, info/exclude, the global excludes file): it is git's own rule, and
  // the file is never committed from this machine either way (operator decision 2026-10-13).
  const q = spawnSync('git', ['-C', dir, 'check-ignore', '-q', DOMAINS_LOCAL], { encoding: 'utf8' });
  if (q.status === 1) return { ok: false, why: 'git does not ignore .claude/settings.local.json (or it is tracked) — add it to .gitignore, then run again' };
  if (q.status !== 0) return { ok: false, why: `git check-ignore failed: ${String(q.stderr || (q.error && q.error.message) || '').trim()}` };
  const v = spawnSync('git', ['-C', dir, 'check-ignore', '-v', DOMAINS_LOCAL], { encoding: 'utf8' });
  return { ok: true, why: `ignored by ${String(v.stdout).trim().split('\t')[0] || 'git'}` };
}

/** Back up (an existing file), write, and say so; false when the backup failed. */
function domainsWriteFile(apply, home, file, before, after, label) {
  if (before !== null) {
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') { log(`  ${label}: NOT written — backup failed (${saved.error})`); return false; }
  }
  try { fs.writeFileSync(file, after, { encoding: 'utf8', mode: 0o600 }); return true; }
  catch (e) { log(`  ${label}: NOT written — ${e.code || e.message}`); return false; }
}

/** The Fabric line, only where Fabric is installed — and with no board id. */
function domainsFabricLine(home, say) {
  try {
    const machine = require(path.join(ROOT, 'lib', 'machine.js'));
    if (machine.holds('fabric', machine.probe({ home }))) {
      say('  Fabric is installed here. Fabric plans to choose skill layers per agent in the sessions it');
      say('  starts; until that ships, this command is the setting for every session on this machine.');
    }
  } catch (e) { /* no machine probe: no Fabric line */ }
}

function runDomainsLocked(argv) {
  const writes = ['--apply', '--revert', '--enable', '--disable', '--update-step'].some((f) => argv.includes(f));
  if (!writes) return cmdDomains(argv);
  const lock = require('../lib/updatelock.js');
  const home = process.env.HOME || os.homedir();
  const got = lock.acquire(home);
  if (!got.ok || got.degraded) {
    log(`domains: refused — ${got.message || got.degraded}; configuration not written`);
    return got.ok ? 1 : lock.BUSY_EXIT;
  }
  const free = () => lock.release(home, got.token);
  process.on('exit', free);
  try { return cmdDomains(argv); }
  finally { free(); process.removeListener('exit', free); }
}

function cmdDomains(argv) {
  const apply = require(path.join(ROOT, 'lib', 'apply.js'));
  const home = process.env.HOME || os.homedir();
  const doApply = argv.includes('--apply');
  const doRevert = argv.includes('--revert');
  const updateStep = argv.includes('--update-step');
  const enableArg = argv.includes('--enable');
  const disableArg = argv.includes('--disable');
  if ([doApply, doRevert, updateStep, enableArg, disableArg].filter(Boolean).length > 1) {
    log('domains: pick one of --apply, --revert, --enable, --disable'); return 2;
  }
  const I = domainsInputs(argv, home);
  const { D } = I;
  const name = (dir) => path.basename(dir);
  if (I.recordError) {
    log(`domains: ~/.sshlg-skills/domains.json ${I.recordError} — it decides what --revert undoes, so nothing acts on it.`);
    log('  Restore it from ~/.sshlg-skills/backups/ (newest sshlg-skills_domains.json.*) or move it aside, then run again.');
    if (doApply || doRevert || updateStep || enableArg || disableArg) return 1;
  }
  if (I.profileError) {
    log(`domains: refused — ${I.profileError}; nothing written`);
    return doApply || doRevert || updateStep || enableArg || disableArg ? 1 : 0;
  }
  if (enableArg || disableArg) return domainsManual(I, apply, home, enableArg ? 'enable' : 'disable');
  if (doRevert) return domainsRevert(I, apply, home);

  const applied = !!(I.owned && I.owned.applied === true);
  // `update` on a machine where `domains --apply` never ran: one line, nothing written.
  if (updateStep && !applied) {
    const P0 = D.plan({ projects: I.projects, user: I.user, owned: I.owned, plugins: I.plugins, keepOn: I.keepOn, onlyAdd: true });
    const n = P0.adds.length + P0.refused.length;
    if (n) {
      log(`\n== Domain members ==\n  ${n} project(s) call for a domain member that is on machine-wide here; `
        + '`npx sshlg-skills domains` previews loading them per project, `--apply` does it.');
    }
    return 0;
  }
  // A root that cannot be read, or roots holding no repository, make "no evidence" mean
  // "not looked": nothing may be turned off, or recorded, on that basis.
  const rootProblem = I.rootErrors.length ? `cannot read ${I.rootErrors.join('; ')}`
    : !I.rootRepos ? `no git repositories under ${I.roots.join(path.delimiter)}` : null;
  if (rootProblem && (doApply || updateStep)) {
    log(`domains: refused — ${rootProblem}. Point --root (or $SSHLG_PROJECTS_ROOT) at your projects directory.`);
    return 1;
  }
  const P = D.plan({ projects: I.projects, user: I.user, owned: I.owned, plugins: I.plugins, keepOn: I.keepOn, onlyAdd: updateStep });
  const withEvidence = I.projects.filter((p) => Object.keys(p.evidence).length);
  const partial = I.projects.filter((p) => p.partial.length);
  const quiet = updateStep;
  const say = quiet ? () => {} : log;
  if (quiet) {
    log('\n== Domain members ==');
    for (const r of P.refused) log(`  ! ${name(r.dir)}: ${r.keys.join(', ')} refused — ${r.why}`);
    if (P.wouldOff.length) log(`  ${P.wouldOff.join(', ')} could go off at user scope; \`update\` never turns a member off — run \`npx sshlg-skills domains --apply\` to do it`);
    if (!P.adds.length && !P.userOn.length) {
      log(P.refused.length ? '  nothing written; the projects above are refused' : '  every project with evidence has its member; nothing written');
      return 0;
    }
  }
  say(`Domain members by project in Claude Code — core and hook-bearing members stay on everywhere; domain members load where a project calls for them`);
  say(`  projects root: ${I.roots.join(path.delimiter)} (${I.rootRepos} git repositories${partial.length ? `; ${partial.length} not read in full` : ''})`);
  if (rootProblem) say(`  ! ${rootProblem} — --apply refuses until the root is right`);
  say(`  usage: ${I.usageFile ? `${path.basename(I.usageFile)} (a 60-day call counts as evidence)` : 'none read'}`);
  say(`  ${withEvidence.length} project(s) with evidence`);
  for (const p of partial) say(`  ? ${name(p.dir)}: not read in full (${p.via}) — ${p.partial.filter((m) => !p.evidence[m]).join(', ') || 'nothing'} not ruled out, so not turned off`);
  const byDir = new Map(I.projects.map((p) => [p.dir, p]));
  const evOf = (dir, member) => (byDir.get(dir).evidence[member] || []).join('; ');
  for (const member of D.DOMAIN_MEMBERS) {
    const key = I.plugins[member];
    const skip = P.skipped.find((s) => s.member === member);
    const projectsFor = withEvidence.filter((p) => p.evidence[member]);
    say(`\n  ${member} (${key}) — evidence in ${projectsFor.length} project(s)${skip ? `; not managed: ${skip.why}` : ''}`);
    if (skip) {
      if (P.userOn.includes(key)) say(`    + ${key}: restore the safety hooks at user scope`);
      continue;
    }
    const gi = (dir) => byDir.get(dir).ignored().why.replace(home, '~');
    for (const a of P.adds) if (a.keys.includes(key)) say(`    + ${name(a.dir)}: enabledPlugins["${key}"] = true — ${evOf(a.dir, member)} [${gi(a.dir)}]`);
    for (const x of P.present) if (x.key === key) say(`    = ${name(x.dir)}: already on in the project — ${evOf(x.dir, member)}`);
    for (const x of P.respected) if (x.key === key) say(`    = ${name(x.dir)}: set false in the project by you; left alone`);
    for (const r of P.refused) if (r.keys.includes(key)) say(`    ! ${name(r.dir)}: refused — ${r.why}`);
    const b = P.blocked.find((x) => x.key === key);
    const u = P.uncertain.find((x) => x.key === key);
    if (P.userOff.includes(key)) say(`    - ${I.settingsLabel} enabledPlugins["${key}"]: true → false`);
    else if (P.userOn.includes(key)) say(`    + ${I.settingsLabel} enabledPlugins["${key}"]: false → true — ${(b || u).dirs.length} project(s) could not be covered (${(b || u).dirs.map(name).join(', ')})`);
    else if (P.managed[member] && P.managed[member].off) say(`    = ${I.settingsLabel} enabledPlugins["${key}"]: already false (by domains)`);
    else if (b) say(`    = ${key} stays on at user scope: ${b.dirs.length} project(s) could not get their entry (${b.dirs.map(name).join(', ')})`);
    else if (u) say(`    = ${key} stays on at user scope: ${u.dirs.length} project(s) not read in full (${u.dirs.map(name).join(', ')})`);
  }
  say(`\n  Evidence kinds: ${Object.entries(I.kinds).sort().map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`);
  domainsFabricLine(home, say);
  say('  A member back in one project: `npx sshlg-skills domains --enable <member>` there, then restart');
  say('  the session; `--disable` takes it out again; `--revert` undoes everything this command wrote.');
  if (!doApply && !updateStep) {
    say('\n  Nothing written. `--apply` writes the project entries first, reads them back, and only then');
    say('  turns a member off at user scope; `--revert` undoes only what this command wrote.');
    return 0;
  }

  // ── projects first ──
  let failed = false;
  const owned = domainsOwnedCopy(I);
  if (doApply) owned.applied = true;
  const newlyBlocked = new Set();
  for (const a of P.adds) {
    const r = domainsWriteProject(I, apply, home, owned, a.dir, a.keys);
    if (!r.ok) { failed = true; r.keys.forEach((k) => newlyBlocked.add(k)); }
  }
  // ── then user scope ──
  // Off only for members whose every project write held; back on for a member already off by
  // this command whose project could not get its entry — now or in a write above.
  const off = P.userOff.filter((k) => !newlyBlocked.has(k));
  const offByUs = new Set(Object.values(P.managed).filter((m) => m.off).map((m) => m.key));
  const on = [...new Set(P.userOn.concat([...newlyBlocked].filter((k) => offByUs.has(k))))];
  for (const k of newlyBlocked) if (P.userOff.includes(k)) log(`  ${k} stays on at user scope: a project write above failed`);
  // Read again now, not at the start: the project writes took time, and the file may have moved.
  const userNow = I.read(I.settingsPath);
  if ((off.length || on.length) && userNow === null) {
    log(`  ${I.settingsLabel}: cannot read the current file — no global changes written`);
    failed = true;
  }
  if ((off.length || on.length) && userNow !== null) {
    const set = Object.fromEntries(off.map((k) => [k, false]).concat(on.map((k) => [k, true])));
    const r = D.editEnabled(userNow, { set });
    if (!r.ok) { log(`  ${I.settingsLabel}: NOT written — the file ${r.reason}`); failed = true; }
    else if (!domainsRecordUserIntent(I, owned, off, apply, home)) {
      log('  global settings NOT written — ownership intent could not be persisted'); failed = true;
    } else if (r.text === userNow || domainsWriteFile(apply, home, I.settingsPath, userNow, r.text, I.settingsLabel)) {
      const back = I.enabledOf(I.read(I.settingsPath) || '');
      for (const k of off) {
        if (back[k] === false) { owned.user[k] = false; delete owned.pendingUser[k]; log(`  ${I.settingsLabel}: ${k} off at user scope (read back)`); }
        else { log(`  ${I.settingsLabel}: ${k} did not read back false`); failed = true; }
      }
      for (const k of on) {
        if (back[k] === true) { delete owned.user[k]; delete owned.pendingUser[k]; log(`  ${I.settingsLabel}: ${k} back on at user scope — preserve hooks or coverage for an unverified project (read back)`); }
        else { log(`  ${I.settingsLabel}: ${k} did not read back true`); failed = true; }
      }
    } else failed = true;
  }
  domainsDropStale(I, owned);
  if (!writeRecord(I, owned, apply, home)) return 1;
  if (!quiet) log('  Restart Claude Code sessions to load the new plugin set.');
  return failed ? 1 : 0;
}

function domainsRecordUserIntent(I, owned, off, apply, home) {
  const prior = Object.assign({}, owned.user);
  const priorPending = Object.assign({}, owned.pendingUser);
  for (const k of off) { owned.user[k] = false; owned.pendingUser[k] = true; }
  if (writeRecord(I, owned, apply, home)) return true;
  owned.user = prior;
  owned.pendingUser = priorPending;
  return false;
}

function domainsOwnedCopy(I) {
  const o = I.owned || {};
  return {
    roots: I.roots, profile: I.profile, applied: o.applied === true,
    user: Object.assign({}, o.user || {}),
    // A previous process may have exited after writing false but before clearing intent.
    pendingUser: Object.fromEntries(Object.entries(o.pendingUser || {}).filter(([k]) => I.user[k] !== false)),
    projects: JSON.parse(JSON.stringify(o.projects || {})),
    manual: JSON.parse(JSON.stringify(o.manual || {})),
  };
}

/** Read failure or malformed JSON cannot erase recovery ownership. */
function domainsKnownPlugins(I, file) {
  const lr = I.readLocal(file);
  if (lr.error) return { known: false };
  if (lr.text === null) return { known: true, plugins: {} };
  try {
    const parsed = JSON.parse(lr.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { known: false };
    const ep = parsed.enabledPlugins;
    if (ep !== undefined && (!ep || typeof ep !== 'object' || Array.isArray(ep)
      || Object.values(ep).some((v) => typeof v !== 'boolean'))) return { known: false };
    return { known: true, plugins: ep || {} };
  } catch (e) { return { known: false }; }
}

/** Ownership of project entries the operator has since removed or flipped is dropped. */
function domainsDropStale(I, owned) {
  for (const dir of Object.keys(owned.projects)) {
    const local = domainsKnownPlugins(I, I.localPath(dir));
    if (!local.known) continue; // unknown is not proof that our entry disappeared
    const lv = local.plugins;
    owned.projects[dir].plugins = owned.projects[dir].plugins.filter((k) => lv[k] === true);
    if (!owned.projects[dir].plugins.length) delete owned.projects[dir];
  }
}

/**
 * Write `keys` true into one project's settings.local.json: writability judged first, backup
 * of an existing file, read back. One project's I/O error is that project's refusal, and
 * ownership intent is persisted before bytes land, so a later failure leaves --revert able
 * to undo it. Returns {ok, keys}.
 */
function domainsWriteProject(I, apply, home, owned, dir, keys) {
  const { D } = I;
  const file = I.localPath(dir);
  const label = `${path.basename(dir)}/.claude/settings.local.json`;
  const no = (why) => { log(`  ${label}: NOT written — ${why}`); return { ok: false, keys }; };
  try {
    const lr = I.readLocal(file);
    const w = domainsWritable(dir, lr, D);
    if (!w.ok) return no(w.why);
    const before = lr.text;
    const r = D.editEnabled(before, { set: Object.fromEntries(keys.map((k) => [k, true])) });
    if (!r.ok) return no(`the file ${r.reason}`);
    let had = false;
    try { had = before !== null && Object.prototype.hasOwnProperty.call(JSON.parse(before), 'enabledPlugins'); } catch (e) { had = false; }
    const prev = owned.projects[dir] || { created: before === null, createdDir: !fs.existsSync(path.dirname(file)), hadEnabledPlugins: had, plugins: [] };
    const mine = keys.filter((k) => r.changed.includes(k));
    if (mine.length) {
      // Durable intent BEFORE the configuration write: an interrupted or failed apply can
      // still be reverted. Entries already true never become ours.
      const saved = JSON.parse(JSON.stringify(owned.projects));
      prev.priorValues = Object.assign({}, prev.priorValues || {});
      const original = I.enabledOf(before || '');
      for (const k of mine) {
        if (original[k] === false) prev.priorValues[k] = false;
        else delete prev.priorValues[k];
      }
      prev.plugins = [...new Set(prev.plugins.concat(mine))].sort();
      owned.projects[dir] = prev;
      if (!writeRecord(I, owned, apply, home)) {
        owned.projects = saved;
        return no('ownership intent could not be persisted');
      }
    }
    if (r.text !== before) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (!domainsWriteFile(apply, home, file, before, r.text, label)) return { ok: false, keys };
    }
    const back = I.enabledOf(I.read(file) || '');
    const bad = keys.filter((k) => back[k] !== true);
    if (bad.length) { log(`  ${label}: read back without ${bad.join(', ')} — not counted`); return { ok: false, keys: bad }; }
    log(`  ${label}: ${keys.join(', ')} on (read back)`);
    return { ok: true, keys };
  } catch (e) { return no(e.code || e.message); }
}

/** `--enable <member>` / `--disable <member>` in one project: the bootstrap and its undo. */
function domainsManual(I, apply, home, mode) {
  const { D } = I;
  const member = I.value(mode === 'enable' ? '--enable' : '--disable');
  if (!member || !D.DOMAIN_MEMBERS.includes(member)) {
    log(`domains --${mode} <member>: one of ${D.DOMAIN_MEMBERS.join(', ')}`); return 2;
  }
  let dir = I.value('--project');
  if (dir) dir = path.resolve(dir.replace(/^~(?=$|\/)/, home));
  else {
    const g = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
    if (g.status !== 0) { log(`domains --${mode}: not inside a git repository — pass --project <dir>`); return 2; }
    dir = String(g.stdout).trim();
  }
  if (!fs.existsSync(dir)) { log(`domains --${mode}: ${dir} does not exist`); return 2; }
  const key = I.plugins[member];
  const owned = domainsOwnedCopy(I);
  const label = `${path.basename(dir)}/.claude/settings.local.json`;
  if (mode === 'enable') {
    const r = domainsWriteProject(I, apply, home, owned, dir, [key]);
    if (!r.ok) { domainsDropStale(I, owned); writeRecord(I, owned, apply, home); return 1; }
    owned.manual[dir] = [...new Set((owned.manual[dir] || []).concat(member))].sort();
    if (!writeRecord(I, owned, apply, home)) return 1;
    log(`  ${member} is on in ${path.basename(dir)}; later runs keep it (recorded as your choice).`);
    log('  Restart the Claude Code session in that project (or reconnect) to load it.');
    return 0;
  }
  // --disable: forget the choice; remove the entry only if this command wrote it.
  owned.manual[dir] = (owned.manual[dir] || []).filter((m) => m !== member);
  if (!owned.manual[dir].length) delete owned.manual[dir];
  const rec = owned.projects[dir];
  let failed = false;
  if (rec && rec.plugins.includes(key)) {
    const res = domainsUnsetProject(I, apply, home, dir, rec, [key]);
    if (res.ok) { rec.plugins = rec.plugins.filter((k) => k !== key); if (!rec.plugins.length) delete owned.projects[dir]; }
    else failed = true;
  } else log(`  ${label}: no entry of ours for ${member}; nothing removed`);
  if (!writeRecord(I, owned, apply, home)) return 1;
  log(`  If ${path.basename(dir)} still has evidence for ${member}, the next --apply adds it back; set it to false there to keep it off.`);
  return failed ? 1 : 0;
}

/** Remove `keys` from a project file this command wrote them into; created files go. */
function domainsUnsetProject(I, apply, home, dir, rec, keys) {
  const { D } = I;
  const file = I.localPath(dir);
  const label = `${path.basename(dir)}/.claude/settings.local.json`;
  try {
    const lr = I.readLocal(file);
    if (lr.error) { log(`  ${label}: NOT written — cannot read it (${lr.error})`); return { ok: false }; }
    const current = I.enabledOf(lr.text || '');
    const restore = keys.filter((k) => current[k] === true && (rec.priorValues || {})[k] === false);
    const r = D.editEnabled(lr.text, {
      set: Object.fromEntries(restore.map((k) => [k, false])),
      unset: Object.fromEntries(keys.filter((k) => !restore.includes(k)).map((k) => [k, true])),
      keepEmpty: !!rec.hadEnabledPlugins,
    });
    if (!r.ok) { log(`  ${label}: NOT written — the file ${r.reason}`); return { ok: false }; }
    if (r.text === lr.text) return { ok: true };
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') { log(`  ${label}: NOT written — backup failed (${saved.error})`); return { ok: false }; }
    // A file this command created and left holding nothing else goes, with its directory.
    if (rec.created && JSON.stringify(JSON.parse(r.text)) === '{}') {
      fs.rmSync(file);
      if (rec.createdDir) { try { fs.rmdirSync(path.dirname(file)); } catch (e) { /* not empty: something else lives there */ } }
      log(`  ${label}: removed (this command created it)`);
    } else {
      fs.writeFileSync(file, r.text, 'utf8');
      log(`  ${label}: ${keys.join(', ')} removed`);
    }
    return { ok: true };
  } catch (e) { log(`  ${label}: NOT written — ${e.code || e.message}`); return { ok: false }; }
}

/** The ownership record, written only when it changed — three runs leave the same bytes. */
function writeRecord(I, owned, apply, home) {
  const manual = owned.manual || {};
  const empty = !Object.keys(owned.user).length && !Object.keys(owned.projects).length && !Object.keys(manual).length;
  const text = empty ? null : JSON.stringify({
    note: 'Written by `npx sshlg-skills domains`; --revert undoes exactly these values while they still hold.',
    roots: owned.roots, profile: owned.profile || I.profile, applied: owned.applied === true, user: owned.user, pendingUser: owned.pendingUser || {}, projects: owned.projects, manual,
  }, null, 2) + '\n';
  // Keep the old valid record if disk-full/permissions/interruption prevents a new one.
  // Update the in-memory text after EACH intent, not only after the whole command.
  let tmp;
  try {
    const current = I.readLocal(I.recordPath);
    if (current.error) throw new Error(`cannot read ownership record (${current.error})`);
    if (text === current.text) { I.recordText = text; return true; }
    if (current.text !== null) {
      const saved = apply.protect(I.recordPath, { home });
      if (saved.action === 'backup-failed') throw new Error(`backup failed (${saved.error})`);
    }
    if (text === null) fs.rmSync(I.recordPath, { force: true });
    else {
      fs.mkdirSync(path.dirname(I.recordPath), { recursive: true });
      tmp = `${I.recordPath}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, text, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      fs.renameSync(tmp, I.recordPath);
    }
    I.recordText = text;
    return true;
  } catch (e) {
    log(`  ownership record NOT updated — ${e.code || e.message}; existing recovery record kept`);
    return false;
  } finally {
    if (tmp) { try { fs.rmSync(tmp, { force: true }); } catch (e) { /* retained for recovery */ } }
  }
}

function domainsRevert(I, apply, home) {
  const { D } = I;
  if (!I.owned) { log('domains --revert: no ~/.sshlg-skills/domains.json — nothing of ours to undo.'); return 0; }
  const ownedUser = Object.keys(I.owned.user || {});
  // User scope comes back on FIRST. If settings.json cannot be read, nothing is undone:
  // removing project entries now would leave those projects without their member.
  const userKnown = domainsKnownPlugins(I, I.settingsPath).known;
  if (ownedUser.length && (I.userError || I.userText === null || !userKnown)) {
    log(`  ${I.settingsLabel}: ${I.userError ? `cannot read it (${I.userError})` : I.userText === null ? 'missing' : 'not valid plugin settings'} — nothing undone; the record is kept`);
    return 1;
  }
  const locals = {};
  const unreadable = [];
  for (const dir of Object.keys(I.owned.projects || {})) {
    const local = domainsKnownPlugins(I, I.localPath(dir));
    if (local.known) locals[dir] = local.plugins;
    else unreadable.push(dir);
  }
  const R = D.revertPlan({ owned: I.owned, user: I.user, locals });
  let failed = unreadable.length > 0;
  const owned = { roots: I.owned.roots, profile: I.profile, applied: false, user: {}, projects: {}, manual: {} };
  for (const dir of unreadable) {
    owned.projects[dir] = I.owned.projects[dir];
    log(`  ${path.basename(dir)}/.claude/settings.local.json: cannot read valid settings — recovery ownership kept`);
  }
  if (R.userOn.length) {
    const r = D.editEnabled(I.userText, { set: Object.fromEntries(R.userOn.map((k) => [k, true])) });
    if (!r.ok) {
      log(`  ${I.settingsLabel}: NOT written — the file ${r.reason}`);
      return 1;
    }
    if (!domainsWriteFile(apply, home, I.settingsPath, I.userText, r.text, I.settingsLabel)) {
      log('  project entries kept: removing them now would leave those projects without their member');
      return 1;
    }
    const back = I.enabledOf(I.read(I.settingsPath) || '');
    for (const k of R.userOn) {
      if (back[k] === true) log(`  ${I.settingsLabel}: ${k} back on at user scope`);
      else { owned.user[k] = false; failed = true; log(`  ${I.settingsLabel}: ${k} did not read back true`); }
    }
  }
  if (failed) {
    log('  project entries kept until user scope reads back on');
    Object.assign(owned, { applied: I.owned.applied === true, projects: I.owned.projects, manual: I.owned.manual || {} });
    writeRecord(I, owned, apply, home);
    return 1;
  }
  for (const u of R.unset) {
    const rec = I.owned.projects[u.dir];
    const res = domainsUnsetProject(I, apply, home, u.dir, rec, u.keys);
    if (!res.ok) { owned.projects[u.dir] = rec; failed = true; }
  }
  if (!writeRecord(I, owned, apply, home)) return 1;
  log('  Restart Claude Code sessions to load the restored plugin set.');
  return failed ? 1 : 0;
}

/** `hosts`: the per-project picture as counts — never a project's name. */
function domainsSummary(home) {
  const I = domainsInputs([], home);
  const { D } = I;
  const ownedUser = (I.owned && I.owned.user) || {};
  if (I.profileError) { log(`Domain members: ${I.profileError}`); return; }
  log(`\nDomain members per project in Claude Code (${I.rootRepos} git repositories under ${I.roots.length} root(s); \`domains\` previews):`);
  if (I.rootErrors.length) log(`  ! ${I.rootErrors.length} root(s) cannot be read; \`domains --apply\` refuses until they can`);
  if (I.recordError) log(`  ~/.sshlg-skills/domains.json ${I.recordError}; \`domains\` says how to recover it.`);
  for (const member of D.DOMAIN_MEMBERS) {
    const key = I.plugins[member];
    const v = I.user[key];
    const state = v === true ? 'on' : v === false ? (ownedUser[key] === false ? 'off (by domains)' : 'off (by you)') : 'absent';
    const withEv = I.projects.filter((p) => p.evidence[member]);
    const on = withEv.filter((p) => p.local[key] === true).length;
    log(`  ${member.padEnd(13)} user scope ${state}; evidence in ${withEv.length} project(s), enabled in ${on}`);
  }
  const partial = I.projects.filter((p) => p.partial.length).length;
  if (partial) log(`  ${partial} project(s) not read in full keep the members they could not rule out on`);
  domainsFabricLine(home, log);
}

/**
 * `pack` — what a task can reach that this machine does NOT have.
 *
 * The third member of the same family as `injectors`, `conflicts` and `toolkit`, and the
 * only one that can answer about ABSENCE: `toolkit` enumerates what is installed and by
 * construction cannot name a skill that is not. The doctrine — a curated recommendation
 * is a tool the router may reach for, never a second entry point — ships in the block;
 * WHICH of them are already here is a fact about one machine, read when asked.
 *
 * **It prints and never installs**, by the same refusal `lib/updatemodel.js` records:
 * `settings.json` and `known_marketplaces.json` belong to the operator, and a launcher
 * that changed somebody's installed set to match its own opinion is the class of act
 * that destroyed `~/.claude/CLAUDE.md` twice here. There is no `--install`.
 */
function cmdPack(argv) {
  const packs = require(path.join(ROOT, 'lib', 'packs.js'));
  const rest = argv.slice(3);
  const name = rest.find((a) => !a.startsWith('--'));

  if (!name && !rest.includes('--check')) { log(packs.index(packs.PACKS)); return 0; }

  const pack = packs.PACKS[name || 'design'];
  if (!pack) {
    log(`unknown pack: ${name} — known: ${Object.keys(packs.PACKS).join(', ')}`);
    return 2;
  }

  if (rest.includes('--check')) {
    const summary = packs.checkReport(checkAddresses(pack));
    log(summary.text);
    // 2, never 1 — the same split `test/check_pins.py` uses and for the reason its CI
    // step records: an address that moved upstream is not this commit's defect, and a
    // gate that fails for somebody else's rename teaches people to re-run it.
    return packs.checkExit(summary);
  }

  const li = rest.indexOf('--lane');
  const lane = li !== -1 && rest[li + 1] && !rest[li + 1].startsWith('--') ? rest[li + 1] : '';
  if (lane && !pack.lanes.some((l) => l.id === lane)) {
    log(`unknown lane: ${lane} — known: ${pack.lanes.map((l) => l.id).join(', ')}`);
    return 2;
  }

  const home = process.env.HOME || os.homedir();
  let skills;
  try {
    skills = packs.readSkills(home);
  } catch (e) {
    log(`cannot read the installed skills (${e.message}) — no answer rather than a wrong one`);
    return 1;
  }
  log(packs.report(pack, skills, { lane }));
  return 0;
}

/**
 * Resolve every declared address, and say which instrument answered.
 *
 * `gh` first because it is authenticated: the unauthenticated GitHub API allows 60
 * requests an hour, and when it runs out it answers **403 with a JSON body**, which a
 * naive reader turns into "repository missing" for every row at once. That happened
 * while this pack was being built — five candidates reported 404 in one sweep, and the
 * control case `anthropics/skills` reported 404 too, which is what gave it away. A
 * measurement that returns the same answer for every input is a fact about the
 * instrument (`docs/evidence/retro.md`, standing instruction #4), so a row that cannot
 * be resolved says `unreachable` and never `gone`.
 */
function checkAddresses(pack) {
  const seen = new Set();
  const targets = [];
  for (const e of pack.entries.concat(pack.declined || [])) {
    const src = e.source;
    if (!src || seen.has(src)) continue;
    seen.add(src);
    targets.push({ id: e.id, source: src, repo: /^[\w.-]+\/[\w.-]+$/.test(src) });
  }

  const hasGh = spawnSync('gh', ['--version'], { stdio: 'ignore' }).status === 0;
  return targets.map((t) => {
    if (!t.repo) return { id: t.id, source: t.source, error: 'not a repository address — nothing to resolve' };
    if (!hasGh) return { id: t.id, source: t.source, error: 'no `gh` on PATH; the unauthenticated API rate-limits to 60/hour and answers 403, which reads as "gone"' };
    const r = spawnSync('gh', ['api', `repos/${t.source}`,
      '--jq', '[.full_name, .archived, .pushed_at] | @tsv'], { encoding: 'utf8' });
    if (r.status !== 0) {
      const msg = String(r.stderr || '').split('\n')[0].slice(0, 60) || 'gh failed';
      return { id: t.id, source: t.source, error: msg };
    }
    const [full, archived, pushed] = String(r.stdout).trim().split('\t');
    return {
      id: t.id,
      source: t.source,
      movedTo: full && full.toLowerCase() !== t.source.toLowerCase() ? full : null,
      archived: archived === 'true',
      pushedAt: (pushed || '').slice(0, 10),
    };
  });
}

/**
 * `materialised` — the difference between a router obeyed from the tree and one skipped.
 *
 * A project can declare that a router's doctrine now lives in its own files: tokens with
 * their provenance markers, a voice pack, a fact registry, a scenario contract. Work that
 * obeys such a router stops invoking it, because the answers are cheaper to read than to
 * load — and a retrospective cannot tell that from a route somebody skipped for budget.
 *
 * **The declaration is not evidence; resolving it is.** Every path is opened and every
 * `#marker` looked for, so an entry naming a file that no longer carries the doctrine
 * reports FALSE rather than satisfied — a document asserting a route was honoured when it
 * was not is worse than the silence it replaced.
 *
 * The guards are **not run**. Executing code out of somebody's repository is a different
 * act with a different risk; the project's own gate runs them, and the report says so
 * rather than implying it.
 */
function cmdMaterialised(argv) {
  const M = require(path.join(ROOT, 'lib', 'materialised.js'));
  const rest = argv.slice(3);
  const at = rest.indexOf('--root');
  const root = at !== -1 && rest[at + 1] ? path.resolve(rest[at + 1]) : process.cwd();
  const file = path.join(root, M.DECL_PATH);

  if (!fs.existsSync(file)) { log(M.report([], { present: false })); return 0; }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    // A declaration that does not parse is not an absent declaration, and reporting it
    // as one would hide the very file the operator is being asked to trust.
    log(`${M.DECL_PATH} does not parse (${e.message}) — a claim nobody can read is not a`);
    log('claim. Fix the JSON or delete the file; it is currently neither.');
    return 1;
  }

  const registry = require(path.join(ROOT, 'lib', 'routers-registry.js'));
  const known = Object.keys(registry.REGISTRY);
  const read = (rel) => {
    // Resolved under the project root, and refused if it escapes: a declaration is about
    // THIS repository, and `../../etc/passwd` resolving would make it about something else.
    const target = path.resolve(root, rel);
    if (target !== root && !target.startsWith(root + path.sep)) return null;
    try { return fs.readFileSync(target, 'utf8'); } catch (e) { return null; }
  };

  const rows = M.check(raw, known, read);
  log(M.report(rows, { present: true }));
  return rows.some((r) => !r.satisfied) ? 2 : 0;
}

function cmdHooks(argv) {
  const fs = require('fs');
  const pathMod = require('path');
  const hooksLib = require('../lib/hooks.js');
  const apply = require('../lib/apply.js');
  const configLib = require('../lib/config.js');

  const sub = (argv[0] && !argv[0].startsWith('-')) ? argv[0] : 'status';
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run');
  const home = os.homedir();
  // The settings point at the copy in the operator's directory, never at this
  // package: run via npx, `__dirname` is npm's cache and npx may prune it, which
  // would leave hooks that fail silently on every prompt.
  const root = hooksLib.runtimeDir(home);
  const pkgRoot = pathMod.resolve(__dirname, '..');
  const file = pathMod.join(home, '.claude', 'settings.json');

  /**
   * Refresh the wired copy from this package. Idempotent; called on install.
   *
   * The copy itself moved to `lib/runtime.js` in v0.47.0 so `update` could call the
   * SAME one. It lived here as a closure, which is why `update` could not reach it and
   * why a machine that only ran `update` executed hook code from whichever release last
   * ran `hooks install` — `B-22`, found at stage 8 rather than by a gate.
   */
  function syncRuntime() {
    require('../lib/runtime.js').sync(pkgRoot, root, { create: true });
    return root;
  }

  let current = {};
  if (fs.existsSync(file)) {
    try {
      current = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      // Refusing beats guessing. A settings.json that does not parse is either
      // mid-edit or damaged, and rewriting it from a partial read is how the
      // rest of it disappears.
      log(`hooks: ${file} не парсится (${e.message}) — ничего не записано.`);
      return false;
    }
  }

  if (sub === 'status') {
    // The same plan `hooks install` writes and `update` refreshes (fix round 2, A): an entry
    // is current when the fields this pack writes match, so a field the operator added (a
    // `timeout`) is not "stale". An entry of ours that is absent — removed by hand, never
    // installed, or an event a later release added — is listed apart: `update` never adds
    // one, only `hooks install` does, and saying "stale" would hide which repair applies.
    const { conflicts, reasons } = hooksLib.plan(current, root, {});
    const stale = reasons.filter((r) => r.reason !== 'added');
    const absent = reasons.filter((r) => r.reason === 'added');
    log('hooks: что ставит семья\n  ' + hooksLib.describe(root).join('\n  '));
    if (stale.length) {
      log(`\nhooks: устарело — ${stale.map((r) => r.event).join(', ')}\n  ` +
        stale.map((r) => `${r.event}: ${r.reason}`).join('\n  ') + '\n  ' +
        'обновить: npx sshlg-skills hooks install (или update)');
    }
    if (absent.length) {
      log(`\nhooks: не подключено здесь (снято вручную или ещё не ставилось) — ` +
        `${absent.map((r) => r.event).join(', ')}\n  ` +
        'добавить: npx sshlg-skills hooks install (update их не добавляет)');
    }
    if (!reasons.length) log('\nhooks: всё на месте и совпадает');
    for (const c of conflicts) log(`hooks: ${c.key} держит ${c.held_by} — ${c.note}`);
    return true;
  }

  if (sub === 'remove') {
    const { settings, changed } = hooksLib.removal(current, root);
    // Give back what --force displaced. `--adopt` already solves this shape for
    // router wording by parking the replaced text; a status line taken with the
    // operator's consent and then silently not returned would be the same defect
    // with a different key. Without this, `remove` is not an undo.
    const parked = configLib.stashGet(configLib.readConfig(home), DISPLACED_STATUSLINE);
    if (parked) {
      try {
        settings.statusLine = JSON.parse(parked);
        changed.push('statusLine (returned to its previous owner)');
      } catch (e) {
        log(`hooks: припаркованный statusLine не парсится (${e.message}) — оставляю без него`);
      }
    }
    if (!changed.length) { log('hooks: ничего нашего не установлено'); return true; }
    if (dryRun) { log(`hooks: --dry-run — снял бы ${changed.join(', ')}`); return true; }
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') {
      log(`hooks: НЕ записан ${file} — не удалось сделать копию (${saved.error}). Файл не изменён.`);
      return false;
    }
    fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    if (parked) configLib.stashClear(home, DISPLACED_STATUSLINE);
    log(`hooks: снято — ${changed.join(', ')}`);
    log(`hooks: копия до записи — ${saved.path}`);
    return true;
  }

  if (sub !== 'install') { log(`hooks: неизвестное подкоманда '${sub}'`); return false; }

  const { settings, changed, conflicts } = hooksLib.plan(current, root, { force });
  const blocking = conflicts.filter(() => !force);
  if (blocking.length) {
    for (const c of blocking) {
      log(`hooks: ${c.key} уже держит ${c.held_by}\n  ${c.note}`);
    }
    log('hooks: ничего не записано. Заменить осознанно: npx sshlg-skills hooks install --force');
    return false;
  }
  if (dryRun) {
    log(changed.length
      ? `hooks: --dry-run — записал бы ${changed.join(', ')}, скопировав в ${root}`
      : `hooks: --dry-run — записи не нужны; обновил бы копию в ${root}`);
    return true;
  }

  // The copy is refreshed even when settings need no change: a `hooks install`
  // after a package update must move the new scripts into place, and "already
  // wired" was true of the paths while the code behind them was stale.
  try {
    syncRuntime();
    log(`hooks: скрипты синхронизированы в ${root}`);
  } catch (e) {
    log(`hooks: не удалось скопировать скрипты в ${root} (${e.message}) — ничего не записано`);
    return false;
  }
  if (!changed.length) { log('hooks: настройки уже на месте'); return true; }

  const saved = apply.protect(file, { home });
  if (saved.action === 'backup-failed') {
    log(`hooks: НЕ записан ${file} — не удалось сделать копию (${saved.error}). Файл не изменён.`);
    return false;
  }
  // Park what force displaced BEFORE writing over it, and only if nothing is
  // parked already: a second forced install must not overwrite the original
  // owner's entry with our own, which is the write-once rule `adopted:<name>`
  // follows for the same reason.
  for (const c of conflicts) {
    if (c.key !== 'statusLine') continue;
    if (configLib.stashGet(configLib.readConfig(home), DISPLACED_STATUSLINE)) continue;
    configLib.stashSet(home, DISPLACED_STATUSLINE, JSON.stringify(current.statusLine));
  }

  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  log(`hooks: записано — ${changed.join(', ')}`);
  for (const c of conflicts) {
    log(`hooks: вытеснено — ${c.key} держал ${c.held_by}`);
    log(`hooks: прежний ${c.key} сохранён в ${configLib.configPath(home)} — ` +
        `\`hooks remove\` вернёт его на место`);
  }
  log(`hooks: копия до записи — ${saved.path}`);
  log('hooks: перезапусти Claude Code — хуки читаются на старте сессии');
  return true;
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

/** id → upstream repo, from the skills CLI's own lock. Unreadable ⇒ empty: refuse, not approve. */
function lockSources() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.agents', '.skill-lock.json'), 'utf8'));
    const out = {};
    for (const [id, row] of Object.entries(j.skills || {})) out[id] = (row && row.source) || '';
    return out;
  } catch (_) { return {}; }
}

/**
 * What `uninstall` would remove — computed once, walked by both the dry run
 * and the real run (the UP-02 rule: one array, two renderings).
 */
function uninstallRemovals() {
  const skillstore = require('../lib/skillstore.js');
  const familyIds = SKILLS.flatMap((s) => plan.skillIds(s));
  const memberNames = SKILLS.map((s) => s.name);
  const lock = lockSources();
  const removals = [];
  const kept = [];
  for (const channel of discoverChannels()) {
    for (const name of channelEntries(channel)) {
      if (!familyIds.includes(name)) continue;
      const full = path.join(channel, name);
      let isSymlink = false; let target = '';
      try { isSymlink = fs.lstatSync(full).isSymbolicLink(); } catch (_) { continue; }
      if (isSymlink) { try { target = fs.realpathSync(full); } catch (_) { try { target = fs.readlinkSync(full); } catch (_) { target = ''; } } }
      const verdict = skillstore.classifyFamilyEntry(
        { name, isSymlink, target, lockRepo: lock[name] || '' }, familyIds, memberNames);
      (verdict.remove ? removals : kept).push({ path: full, name, reason: verdict.reason });
    }
  }
  return { removals, kept, familyIds };
}

function planUninstall(f) {
  const apply = require('../lib/apply.js');
  const cursor = require('../lib/cursor.js');
  const { removals, kept } = uninstallRemovals();
  const steps = [];
  steps.push(opres.step('prune', 'home',
    `remove ${removals.length} family skill entr(ies) across the agent channels (${kept.length} name-collision entr(ies) left in place)`,
    { paths: removals.map((r) => r.path) }));
  steps.push(opres.step('runtime-sync', 'home',
    'drop the removed ids from ~/.agents/.skill-lock.json (protect() copy first)',
    { ids: [...new Set(removals.map((r) => r.name))] }));
  if (f.claude !== false) {
    for (const s of SKILLS) {
      steps.push(opres.step('subprocess', 'home', `claude plugin uninstall (${s.name})`,
        { cmd: 'claude', args: ['plugin', 'uninstall', s.pluginInstall] }));
      steps.push(opres.step('subprocess', 'home', `claude plugin marketplace remove (${s.name})`,
        { cmd: 'claude', args: ['plugin', 'marketplace', 'remove', s.name] }));
    }
  }
  for (const t of apply.TARGETS) {
    steps.push(opres.step('router-block', 'home',
      `remove the managed routing block from ${path.join(apply.hostRoot(t, os.homedir()), t.file)} (backup first; bytes outside the sentinels untouched)`,
      { file: path.join(apply.hostRoot(t, os.homedir()), t.file) }));
  }
  steps.push(opres.step('prune', 'home', 'remove the Cursor rules file (backup first)',
    { paths: [path.join(os.homedir(), '.cursor', 'rules', cursor.FILENAME)] }));
  steps.push(opres.step('runtime-sync', 'home', 'hooks remove (returns any displaced statusLine)', {}));
  return opres.buildPlan(steps);
}

/**
 * The reverse of `install`, at the same depth install reaches: the 28 family
 * skills out of every agent channel (provenance-checked — a foreign skill
 * that merely shares a name is reported and kept), the Claude plugins and
 * their marketplaces, the managed routing blocks (through `protect()`, bytes
 * outside the sentinels preserved), the Cursor rules file, and the hooks.
 * Backups precede every operator-file write; a copy that cannot be taken
 * cancels that write and only that write.
 */
function cmdUninstall(f) {
  const planned = planUninstall(f);
  if (f.dryRun) return renderDryRun(planned, 'uninstall');
  const apply = require('../lib/apply.js');
  const R = require('../lib/routers.js');
  const cursor = require('../lib/cursor.js');
  const home = os.homedir();
  let ok = true;

  const { removals, kept } = uninstallRemovals();
  log(`\n== Removing family skills from the agent channels ==`);
  for (const r of removals) {
    try { fs.rmSync(r.path, { recursive: true, force: true }); log(`  - ${r.path} (${r.reason})`); }
    catch (e) { log(`  ! ${r.path}: ${e.message}`); ok = false; }
  }
  for (const k of kept) log(`  = left in place: ${k.path} — ${k.reason}`);

  const lockFile = path.join(home, '.agents', '.skill-lock.json');
  const dropped = [...new Set(removals.map((r) => r.name))];
  if (dropped.length && fs.existsSync(lockFile)) {
    // The same copy-first rule as every other write: protect() takes the
    // backup, and a copy that cannot be taken cancels the rewrite.
    const savedLock = apply.protect(lockFile, { home });
    if (savedLock.action === 'backup-failed') {
      log(`  ! lock NOT rewritten — the backup failed (${savedLock.error}); the file is unchanged`);
      ok = false;
    } else {
      try {
        const j = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
        let hits = 0;
        for (const id of dropped) if (j.skills && j.skills[id]) { delete j.skills[id]; hits += 1; }
        fs.writeFileSync(lockFile, JSON.stringify(j, null, 2) + '\n', 'utf8');
        log(`  lock: dropped ${hits} entr(ies); copy at ${savedLock.path}`);
      } catch (e) { log(`  ! lock not rewritten: ${e.message}`); ok = false; }
    }
  }

  if (f.claude !== false) {
    log(`\n== Removing Claude Code plugins ==`);
    for (const s of SKILLS) {
      // Plugin first, then its marketplace: the reverse of install's order.
      run('claude', ['plugin', 'uninstall', s.pluginInstall]);
      run('claude', ['plugin', 'marketplace', 'remove', s.name]);
    }
  }

  log(`\n== Removing the managed routing block ==`);
  for (const t of apply.TARGETS) {
    const file = path.join(apply.hostRoot(t, home), t.file);   // honours CODEX_HOME & co. (B-165)
    if (!fs.existsSync(file)) { log(`  routers: ${file} — absent`); continue; }
    const before = fs.readFileSync(file, 'utf8');
    const res = R.removeBlock(before);
    if (!res.removed) { log(`  routers: ${file} — no managed block`); continue; }
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') {
      log(`  ! ${file} NOT written — the backup failed (${saved.error}); the file is unchanged`);
      ok = false; continue;
    }
    fs.writeFileSync(file, res.text, 'utf8');
    log(`  routers: block removed from ${file} (copy: ${saved.path})`);
  }
  const mdc = path.join(home, '.cursor', 'rules', cursor.FILENAME);
  if (fs.existsSync(mdc)) {
    const saved = apply.protect(mdc, { home });
    if (saved.action === 'backup-failed') { log(`  ! ${mdc} kept — backup failed (${saved.error})`); ok = false; }
    else { fs.unlinkSync(mdc); log(`  routers: removed ${mdc} (copy: ${saved.path})`); }
  }

  log(`\n== Removing hooks ==`);
  ok = cmdHooks(['remove']) && ok;

  // Skill visibility is NOT undone here: its values sit in other hosts' settings and
  // undoing them is a separate, previewable act. What it still holds is named instead.
  try {
    const rec = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'visibility.json'), 'utf8'));
    const held = ['claude', 'codex', 'gemini', 'pi', 'opencode', 'hermes']
      .filter((h) => Array.isArray(rec[h]) && rec[h].length).map((h) => `${h} ${rec[h].length}`);
    if (held.length || rec.applied === true) {
      log(`\n== Skill visibility (left in place) ==`);
      log(`  still hidden by this launcher: ${held.join(', ') || 'none'}${rec.applied === true ? '; update re-applies it while consent stands' : ''}`);
      log('  Undo it: npx sshlg-skills visibility --revert   (preview: npx sshlg-skills visibility)');
    }
  } catch (e) { /* no record: visibility never ran here */ }

  log('\n(restart every agent — skills are read at session start)');
  log('To reinstall: npx sshlg-skills install');
  return ok;
}

// ------------------------------------------------- backup / wipe / restore (ALL skills)

function backupsDir() {
  const d = path.join(os.homedir(), '.sshlg-skills', 'backups');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/**
 * Archive EVERY agent's skills directory — the whole store, not just the
 * family — as one tar.gz relative to $HOME, symlinks preserved as symlinks,
 * with a manifest beside it that restore verifies against. Returns the
 * verification input for `wipeGate`, so `wipe` cannot proceed on a backup
 * this function could not prove.
 */
function cmdBackupAll() {
  const skillstore = require('../lib/skillstore.js');
  const home = os.homedir();
  const channels = discoverChannels().map((p) => ({ path: p, entries: channelEntries(p) }));
  const nonEmpty = channels.filter((c) => c.entries.length);
  if (!nonEmpty.length) { log('backup: no agent skills directories found — nothing to archive'); return null; }
  const stamp = skillstore.stampName(new Date());
  const man = skillstore.manifest(nonEmpty, stamp);
  const archive = path.join(backupsDir(), `${stamp}.tar.gz`);
  const rel = nonEmpty.map((c) => path.relative(home, c.path));
  log(`\n== Backing up ${man.total} entr(ies) from ${nonEmpty.length} channel(s) ==`);
  for (const c of nonEmpty) log(`  ${c.path} — ${c.entries.length}`);
  const r = spawnSync('tar', ['-czf', archive, '-C', home, ...rel], { stdio: 'inherit' });
  if (r.status !== 0) { log('backup: tar failed — no archive written'); return null; }
  // Verify against the archive's OWN listing, not the plan.
  const list = spawnSync('tar', ['-tzf', archive], { encoding: 'utf8' });
  if (list.status !== 0) { log('backup: the archive does not list back — treating as failed'); return null; }
  const listed = list.stdout.split('\n').filter(Boolean);
  let verifiedCount = 0;
  for (const c of nonEmpty) {
    const prefix = path.relative(home, c.path) + '/';
    for (const name of c.entries) {
      if (listed.some((l) => l === prefix + name || l.startsWith(prefix + name + '/') || l === prefix + name + '/')) verifiedCount += 1;
    }
  }
  fs.writeFileSync(archive.replace(/\.tar\.gz$/, '.manifest.json'), JSON.stringify(man, null, 2) + '\n', 'utf8');
  log(`backup: ${archive}`);
  log(`backup: verified ${verifiedCount}/${man.total} entr(ies) against the archive's own listing`);
  return { archive, manifestTotal: man.total, verifiedCount, channels: nonEmpty };
}

/**
 * Back up EVERYTHING, verify the archive, and only then tear the stores down.
 * A backup that could not be taken and proven cancels the wipe — the same
 * copy-first rule the operator files live under, held for the skill stores.
 */
function cmdWipeAll(f) {
  const skillstore = require('../lib/skillstore.js');
  if (f.dryRun) {
    const channels = discoverChannels().map((p) => ({ path: p, entries: channelEntries(p) })).filter((c) => c.entries.length);
    log(`\n== --dry-run: wipe would back up, verify, then remove ==`);
    for (const c of channels) log(`  ${c.path} — ${c.entries.length} entr(ies)`);
    log(`(${channels.reduce((n, c) => n + c.entries.length, 0)} entr(ies) total; 0 mutations)`);
    return true;
  }
  const backup = cmdBackupAll();
  const gate = skillstore.wipeGate(backup || {});
  if (!gate.ok) { log(`\nwipe REFUSED: ${gate.reason}`); return false; }
  log(`\n== Wiping (${gate.reason}) ==`);
  let ok = true;
  for (const c of backup.channels) {
    for (const name of c.entries) {
      const full = path.join(c.path, name);
      try { fs.rmSync(full, { recursive: true, force: true }); }
      catch (e) { log(`  ! ${full}: ${e.message}`); ok = false; }
    }
    log(`  cleared ${c.path} (${c.entries.length})`);
  }
  log(`\nTo bring everything back: npx sshlg-skills restore`);
  log('(restart every agent — skills are read at session start)');
  return ok;
}

/** Bring a backup back, newest by default, and verify counts against its manifest. */
function cmdRestoreAll(rest) {
  const skillstore = require('../lib/skillstore.js');
  const home = os.homedir();
  const dir = backupsDir();
  const named = (rest || []).find((a) => !a.startsWith('-'));
  let archive = named ? (fs.existsSync(named) ? named : path.join(dir, named)) : null;
  if (!archive) {
    const all = fs.readdirSync(dir).filter((n) => /^skills-all-.*\.tar\.gz$/.test(n)).sort();
    if (!all.length) { log(`restore: no skills-all-*.tar.gz in ${dir}`); return false; }
    archive = path.join(dir, all[all.length - 1]);
  }
  if (!fs.existsSync(archive)) { log(`restore: ${archive} does not exist`); return false; }
  log(`\n== Restoring ${archive} into ${home} ==`);
  const r = spawnSync('tar', ['-xzf', archive, '-C', home], { stdio: 'inherit' });
  if (r.status !== 0) { log('restore: tar failed'); return false; }
  const manFile = archive.replace(/\.tar\.gz$/, '.manifest.json');
  if (!fs.existsSync(manFile)) {
    log('restore: extracted, but no manifest sits beside the archive — counts not verified');
    return true;
  }
  const man = JSON.parse(fs.readFileSync(manFile, 'utf8'));
  const observed = {};
  for (const row of man.channels) observed[row.path] = channelEntries(row.path).length;
  const v = skillstore.restoreVerify(man, observed);
  if (!v.ok) { for (const m of v.mismatches) log(`  ! ${m}`); log('restore: extracted, but the counts above disagree with the manifest'); return false; }
  log(`restore: verified — ${man.total} entr(ies) across ${man.channels.length} channel(s) match the manifest`);
  log('(restart every agent — skills are read at session start)');
  return true;
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

function main(argv) {
  const [cmd, ...rest] = argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { usage(); return 0; }
  if (cmd === 'list' || cmd === 'ls') { cmdList(argv); return 0; }
  if (cmd === 'agents') { cmdAgents(); return 0; }
  if (cmd === 'hosts') { cmdHosts(); return 0; }
  // Before parseFlags: `config` takes positional arguments, and that parser
  // exits on any token it does not recognise as a flag.
  if (cmd === 'config') return cmdConfig(rest);
  // Also before parseFlags: `hooks` takes a positional subcommand.
  if (cmd === 'hooks') return cmdHooks(rest) ? 0 : 1;
  if (cmd === 'injectors') { cmdInjectors(); return 0; }
  if (cmd === 'conflicts') { cmdConflicts(); return 0; }
  if (cmd === 'toolkit') { return cmdToolkit(argv) || 0; }
  if (cmd === 'visibility') return cmdVisibility(argv);
  if (cmd === 'domains') return runDomainsLocked(argv);
  if (cmd === 'pack' || cmd === 'packs') { return cmdPack(argv); }
  if (cmd === 'materialised' || cmd === 'materialized') { return cmdMaterialised(argv); }
  if (cmd === 'signature') { return cmdSignature(argv); }
  if (cmd === 'humanizers') { return cmdHumanizers(argv); }
  // `restore` takes a positional archive name.
  if (cmd === 'restore') return cmdRestoreAll(rest) ? 0 : 1;
  const f = parseFlags(rest);
  if (['install', 'i', 'update', 'up'].includes(cmd)) {
    // Fail before building/executing any operation, including plugin-only runs.
    try { skillsCliAgents(f); }
    catch (e) { log(e.message); return 2; }
    if (f.all && !f.claudeOnly) {
      const excluded = require('../lib/host-targets.js').excludedGlobal();
      log(`  --all excludes non-global targets (${cliSpec()}): ${excluded.join(', ')}`);
      if (f.claude) log('  claude-code uses the plugin channel; no plain Claude target is added.');
    }
  }
  if (cmd === 'install' || cmd === 'i') return cmdInstall(f) ? 0 : 1;
  if (cmd === 'update' || cmd === 'up') return runUpdateLocked(f);
  if (cmd === 'uninstall' || cmd === 'un') return cmdUninstall(f) ? 0 : 1;
  if (cmd === 'backup') return cmdBackupAll() ? 0 : 1;
  if (cmd === 'wipe') return cmdWipeAll(f) ? 0 : 1;
  if (cmd === 'routers') return cmdRouters(f) ? 0 : 1;
  log(`unknown command: ${cmd}`); usage(); return 2;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { cliSpec, pinnedArgv, resolvePayloads, resolveProviders };
