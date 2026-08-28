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
 *   npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only]
 *   npx sshlg-skills update  [--agent a,b | --all] [--no-claude] [--claude-only] [--bump-pins]
 *   npx sshlg-skills list
 *   npx sshlg-skills agents
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const plan = require('../lib/plan.js');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills.json'), 'utf8'));
const SKILLS = manifest.skills;

function log(m) { process.stdout.write(m + '\n'); }
function run(cmd, args, opts) {
  log('  » ' + cmd + ' ' + args.join(' '));
  const r = spawnSync(cmd, args, Object.assign(
    { stdio: 'inherit', shell: process.platform === 'win32' }, opts || {}));
  return r.status === 0;
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
function pruneClaudeShadows() {
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
  const pruned = [];
  for (const id of plan.shadowsToPrune(members, installedMarketplaces(), ls(base))) {
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
  npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only]
  npx sshlg-skills update  [--agent a,b | --all] [--no-claude] [--claude-only] [--bump-pins]
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
  npx sshlg-skills signature --used "<skill>[=what it did],…"
                                                      # report header + footer, links looked up
  npx sshlg-skills toolkit [--for "<task>"] [--expand <provider>]
                                                      # every skill this machine can reach
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
                 upstream tips — off by default so pins stay reproducible.`);
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
  return run('npx', argv);
}

function cmdInstall(f) {
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
  return cmdRouters({
    claude: f.claude,
    dryRun: f.dryRun,
    mode,
  });
}

function cmdUpdate(f) {
  let ok = true;
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

function cmdList() {
  log('ssheleg skill family:\n');
  for (const s of SKILLS) {
    let ver = s.version || '?';
    const pj = path.join(ROOT, s.dir, 'plugins', s.name, '.claude-plugin', 'plugin.json');
    try { ver = JSON.parse(fs.readFileSync(pj, 'utf8')).version; } catch (_) {}
    log(`  ${s.name.padEnd(16)} v${ver.padEnd(8)} ${s.repo}`);
    log(`  ${' '.repeat(16)}          ${s.desc}`);
  }
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

  const res = apply.apply({
    home, mode, consent: decision, routers: packaged,
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

function main(argv) {
  const [cmd, ...rest] = argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { usage(); return 0; }
  if (cmd === 'list' || cmd === 'ls') { cmdList(); return 0; }
  if (cmd === 'agents') { cmdAgents(); return 0; }
  // Before parseFlags: `config` takes positional arguments, and that parser
  // exits on any token it does not recognise as a flag.
  if (cmd === 'config') return cmdConfig(rest);
  // Also before parseFlags: `hooks` takes a positional subcommand.
  if (cmd === 'hooks') return cmdHooks(rest) ? 0 : 1;
  if (cmd === 'injectors') { cmdInjectors(); return 0; }
  if (cmd === 'conflicts') { cmdConflicts(); return 0; }
  if (cmd === 'toolkit') { cmdToolkit(argv); return 0; }
  if (cmd === 'signature') { return cmdSignature(argv); }
  const f = parseFlags(rest);
  if (cmd === 'install' || cmd === 'i') return cmdInstall(f) ? 0 : 1;
  if (cmd === 'update' || cmd === 'up') return cmdUpdate(f) ? 0 : 1;
  if (cmd === 'routers') return cmdRouters(f) ? 0 : 1;
  log(`unknown command: ${cmd}`); usage(); return 2;
}

process.exit(main(process.argv));
