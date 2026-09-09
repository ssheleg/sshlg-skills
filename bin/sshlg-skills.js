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
      f.agents = v.split(',').map(s => s.trim()).filter(Boolean);
      if (!f.agents.length) { log('--agent got an empty list'); process.exit(2); }
    }
    else if (a.startsWith('-')) { log(`unknown option: ${a}`); process.exit(2); }
    // ignore stray non-flag tokens (e.g. a trailing shell comment zsh doesn't strip)
    else log(`  (ignoring stray argument: ${a})`);
  }
  if (f.claudeOnly && !f.claude) { log('--claude-only and --no-claude contradict each other'); process.exit(2); }
  return f;
}

function agentList(f) {
  if (f.all) return ['*'];
  if (f.agents && f.agents.length) return f.agents;
  return manifest.defaultAgents.slice();
}

// The skills CLI auto-detects Claude Code and writes ~/.claude/skills/<id> even when
// we never ask for that agent. While the Claude PLUGIN channel is active those plain
// copies shadow the plugin, so prune them — "one channel per agent", enforced.
// What pruneClaudeShadows WOULD remove, computed without removing it — the same
// list feeds the operation plan (so `--dry-run` can name the deletions) and the
// deletion loop (so the receipt and the act cannot drift apart).
function shadowCandidates() {
  const base = path.join(os.homedir(), '.claude', 'skills');
  const ls = (d) => { try { return fs.readdirSync(d); } catch (_) { return []; } };

  // The INSTALLED set, not the marketplace list. Those are separate operations and a
  // marketplace outlives its plugin, so pruning on the marketplace deleted the plain
  // copy of a member whose plugin was gone — the only copy, and the skill with it.
  // Unreadable registry ⇒ empty set ⇒ nothing is pruned: a guard that never received
  // its input refuses rather than approves.
  const installedMarketplaces = () => {
    try {
      const reg = JSON.parse(fs.readFileSync(
        path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json'), 'utf8'));
      return Object.keys(reg.plugins || {})
        .map(spec => spec.split('@')[1]).filter(Boolean);
    } catch (_) { return []; }
  };

  // A copy is a shadow only where a plugin of the SAME MEMBER is installed —
  // which is not the same question as "is this run touching plugins". That
  // proxy is what let `update --no-claude` create a copy and walk away from
  // it, beside a live plugin, serving a frozen version forever.
  const members = SKILLS.map(s => ({
    name: s.name,
    marketplace: s.pluginInstall.split('@')[1],
    skillNames: s.skillNames,
  }));
  return plan.shadowsToPrune(members, installedMarketplaces(), ls(base));
}

function pruneClaudeShadows() {
  const base = path.join(os.homedir(), '.claude', 'skills');
  const pruned = [];
  for (const id of shadowCandidates()) {
    try {
      fs.rmSync(path.join(base, id), { recursive: true, force: true });
      pruned.push(id);
    } catch (_) { /* leave it; not fatal */ }
  }
  if (pruned.length) {
    log(`  pruned Claude plain copies that would shadow the plugin: ${pruned.join(', ')}`);
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
  npx sshlg-skills hooks   [status]                   # what is wired, and what holds it
  npx sshlg-skills hooks   install [--force] [--dry-run]
  npx sshlg-skills hooks   remove
  npx sshlg-skills injectors                          # who else speaks at SessionStart
  npx sshlg-skills conflicts                          # installed skills on a router's ground
  npx sshlg-skills humanizers                         # anti-AI-writing skills this machine can reach
  npx sshlg-skills signature --used "<skill>[=what it did],…"
                                                      # report header + footer, links looked up
  npx sshlg-skills toolkit [--for "<task>"] [--expand <provider>]
                                                      # every skill this machine can reach
  npx sshlg-skills pack [<name>] [--lane <id>] [--check]
  npx sshlg-skills materialised                       # routers this project says live in its tree
                                                      # curated recommendations, measured here
  npx sshlg-skills list
  npx sshlg-skills agents

Defaults:
  - Non-Claude agents (${manifest.defaultAgents.join(', ')}) via the skills CLI.
  - Claude Code via its PLUGIN (not a plain copy) to avoid a shadow duplicate.
  - --all       every agent the skills CLI supports ('*'); with Claude plugins on,
                this also drops a plain Claude copy — prefer the default.
  - --no-claude skip the Claude plugin step.
  - --claude-only install/update only the Claude plugins.
  - --bump-pins  (update only) also fast-forward the pinned submodules to their
                 upstream tips — off by default so pins stay reproducible.
  - --dry-run    (install/update) build the full operation plan — every
                 subprocess, prune, router and runtime action — render it, and
                 execute NOTHING. The receipt is complete; the mutations are zero.`);
}

function skillsCliAgents(f) {
  // Never let the skills CLI drop a plain Claude copy while we manage Claude via plugin.
  const agents = plan.resolveAgents(agentList(f), f);
  if (f.all && f.claude) log('  ! --all includes claude-code: a plain Claude copy will be added alongside the plugin (duplicate). Use the default agent set to avoid this.');
  return agents;
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
      { paths: shadowCandidates().map(id => path.join(os.homedir(), '.claude', 'skills', id)) }));
  }
  if (f.claude || f.claudeOnly) {
    for (const s of SKILLS) {
      steps.push(opres.step('subprocess', 'home', `claude plugin marketplace add (${s.name})`,
        { cmd: 'claude', args: ['plugin', 'marketplace', 'add', s.pluginMarketplace] }));
      steps.push(opres.step('subprocess', 'home', `claude plugin install ${s.pluginInstall}`,
        { cmd: 'claude', args: ['plugin', 'install', s.pluginInstall] }));
    }
  }
  if (!f.member) {
    steps.push(opres.step('router-block', 'home',
      'refresh the managed routing block (its own consent and dry-run rules apply)',
      { mode: 'install' }));
  }
  return opres.buildPlan(steps);
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
    for (const argv of plan.updatePlan(SKILLS, skillsCliAgents(f))) {
      steps.push(opres.step('subprocess', 'home', `skills ${argv[2]} ${argv[3]}`, { cmd: 'npx', args: pinnedArgv(argv) }));
    }
    steps.push(opres.step('prune', 'home',
      'remove plain Claude copies shadowing an installed plugin (re-computed after the CLI runs)',
      { paths: shadowCandidates().map(id => path.join(os.homedir(), '.claude', 'skills', id)) }));
  }
  if (f.claude || f.claudeOnly) {
    for (const s of SKILLS) {
      steps.push(opres.step('subprocess', 'home', `claude plugin marketplace update (${s.name})`,
        { cmd: 'claude', args: ['plugin', 'marketplace', 'update', s.pluginInstall.split('@')[1]] }));
      steps.push(opres.step('subprocess', 'home', `claude plugin update ${s.pluginInstall}`,
        { cmd: 'claude', args: ['plugin', 'update', s.pluginInstall] }));
    }
  }
  if (!f.member) {
    steps.push(opres.step('router-block', 'home',
      'refresh the managed routing block (its own consent and dry-run rules apply)',
      { mode: 'update' }));
  }
  try {
    steps.push(opres.step('runtime-sync', 'runtime',
      'refresh the wired hook runtime copy (create: false)',
      { root: require('../lib/hooks.js').runtimeDir(os.homedir()) }));
  } catch (_) { /* no runtime dir resolvable — the execution path reports it */ }
  return opres.buildPlan(steps);
}

/** Dry-run IS the render: the complete receipt, a typed result, zero mutations. */
function renderDryRun(planned, mode) {
  log(`\n== --dry-run: the ${mode} plan, rendered — nothing executed ==`);
  for (const line of opres.render(planned)) log(line);
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
    + (!f.claudeOnly ? plan.updatePlan(SKILLS, agentsForCount).length : 0)
    + ((f.claude || f.claudeOnly) ? SKILLS.length * 2 : 0);
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
    for (const argv of plan.updatePlan(SKILLS, agents)) ok = runPlanned(argv) && ok;
    pruneClaudeShadows();
  }
  if (f.claude || f.claudeOnly) {
    log(`\n== Updating Claude Code plugins ==`);
    for (const s of SKILLS) {
      ok = run('claude', ['plugin', 'marketplace', 'update', s.pluginInstall.split('@')[1]]) && ok;
      ok = run('claude', ['plugin', 'update', s.pluginInstall]) && ok;
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
  // runtime has not consented to hooks and an update is not the moment to ask.
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
  printUpdateModel('update');

  reportProgress();
  return ok;
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
    for (const line of um.notice(mode, findings)) log(line);
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

function cmdAgents() {
  log('Agents are handled by the vercel `skills` CLI (70+). The named ones:\n');
  log('  claude-code (via plugin), cursor, opencode, kilo, kimi-code-cli,');
  log('  hermes-agent, openclaw, codex, gemini-cli, windsurf, zed, and more.\n');
  log("Full list / exact ids:  npx skills add <any-repo> --agent __x__  (prints valid agents)");
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
  const scopeOpts = f.member
    ? { member: f.member, isEnabled }
    : { installed: manifest.skills.map((s) => s.name), isEnabled };

  const packaged = registry.resolve(scopeOpts);
  const remove = registry.disabled(scopeOpts);

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
    const file = path.join(home, t.dir, t.file);
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
  if (remove.length) log(`routers: выключены настройкой — ${remove.join(', ')}`);
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
    log('\nПоменять:  npx sshlg-skills config set routers.<имя> on|off');
    return 0;
  }

  if (sub !== 'set') {
    log(`config: неизвестная подкоманда "${sub}" — есть list и set`);
    return 2;
  }

  if (!key || key.indexOf('routers.') !== 0) {
    log('config set: ключ должен начинаться с "routers." — других разделов пока нет');
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
    return;
  }
  log(inj.report(inj.injectors(...read)));
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
  const routers = registry.scope({ installed });
  log(conflicts.report(
    conflicts.collisions(skills, { owned, routers }),
    { scanned: skills.length }));
}

/**
 * `toolkit` — what this machine can reach, before a task decides what to use.
 *
 * The family's map answers "what do I have" with nine packs. This answers it with the
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

  const at = argv.indexOf('--for');
  const forQuery = at !== -1 && argv[at + 1] && !argv[at + 1].startsWith('--') ? argv[at + 1] : '';
  const expand = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--expand' && argv[i + 1] && !argv[i + 1].startsWith('--')) expand.push(argv[i + 1]);
  }
  const li = argv.indexOf('--limit');
  const limit = li !== -1 && argv[li + 1] ? Number(argv[li + 1]) || 12 : 12;

  log(toolkit.report(skills, family, { for: forQuery, expand, limit }));
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
    const { changed, conflicts } = hooksLib.plan(current, root, {});
    log('hooks: что ставит семья\n  ' + hooksLib.describe(root).join('\n  '));
    log(changed.length
      ? `\nhooks: НЕ установлено или устарело — ${changed.join(', ')}\n  ` +
        `поставить: npx sshlg-skills hooks install`
      : '\nhooks: всё на месте и совпадает');
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
      `remove the managed routing block from ~/${t.dir}/${t.file} (backup first; bytes outside the sentinels untouched)`,
      { file: path.join(os.homedir(), t.dir, t.file) }));
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
    const file = path.join(home, t.dir, t.file);
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
  // Before parseFlags: `config` takes positional arguments, and that parser
  // exits on any token it does not recognise as a flag.
  if (cmd === 'config') return cmdConfig(rest);
  // Also before parseFlags: `hooks` takes a positional subcommand.
  if (cmd === 'hooks') return cmdHooks(rest) ? 0 : 1;
  if (cmd === 'injectors') { cmdInjectors(); return 0; }
  if (cmd === 'conflicts') { cmdConflicts(); return 0; }
  if (cmd === 'toolkit') { cmdToolkit(argv); return 0; }
  if (cmd === 'pack' || cmd === 'packs') { return cmdPack(argv); }
  if (cmd === 'materialised' || cmd === 'materialized') { return cmdMaterialised(argv); }
  if (cmd === 'signature') { return cmdSignature(argv); }
  if (cmd === 'humanizers') { return cmdHumanizers(argv); }
  // `restore` takes a positional archive name.
  if (cmd === 'restore') return cmdRestoreAll(rest) ? 0 : 1;
  const f = parseFlags(rest);
  if (cmd === 'install' || cmd === 'i') return cmdInstall(f) ? 0 : 1;
  if (cmd === 'update' || cmd === 'up') return cmdUpdate(f) ? 0 : 1;
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
