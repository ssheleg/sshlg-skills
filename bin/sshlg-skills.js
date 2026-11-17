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
 * This file holds the usage, the flag parser and the dispatch; each command's body
 * lives in the `lib/cli-*.js` module of its area (cut on 2026-11-17, B-357), with
 * the state they share in `lib/cli-core.js`.
 *
 *   npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only] [--dry-run] [--routers yes|no]
 *   npx sshlg-skills update  [--agent a,b | --all] [--no-claude] [--claude-only] [--bump-pins] [--dry-run]
 *   npx sshlg-skills list
 *   npx sshlg-skills agents
 *   npx sshlg-skills hosts
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  ROOT, SKILLS, cliSpec, frozenOperations, log, manifest, pinnedArgv, plan, resolvePayloads,
  resolveProviders
} = require('../lib/cli-core.js');
const { CODEX_READ_TIMEOUT_MS, refreshCodexPlugins } = require('../lib/cli-codex.js');
const { cmdConfig } = require('../lib/cli-config.js');
const { runDomainsLocked } = require('../lib/cli-domains.js');
const { cmdEnroll } = require('../lib/cli-enroll.js');
const { cmdHooks } = require('../lib/cli-hooks.js');
const { cmdHosts } = require('../lib/cli-hosts.js');
const {
  cmdAgents, cmdConflicts, cmdContext, cmdHumanizers, cmdInjectors, cmdList, cmdMaterialised,
  cmdPack, cmdSettings, cmdSignature, cmdToolkit
} = require('../lib/cli-info.js');
const {
  cmdInstall, defaultPresence, defaultScope, plainSkillsPlan, planInstall, planUpdate,
  runUpdateLocked, skillsCliAgents
} = require('../lib/cli-install.js');
const { cmdRouters } = require('../lib/cli-routers.js');
const { cmdRules, parseRuleFlags } = require('../lib/cli-rules.js');
const { cmdSchedule } = require('../lib/cli-schedule.js');
const {
  cmdBackupAll, cmdRestoreAll, cmdUninstall, cmdWipeAll
} = require('../lib/cli-uninstall.js');
const { cmdVisibility } = require('../lib/cli-visibility.js');

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
    else if (a === '--routers') {
      // The person's answer to the routing-block question, passed by whoever runs the
      // installer for them (an agent has no terminal to prompt in).
      const v = argv[++i];
      if (v !== 'yes' && v !== 'no') { log('--routers needs yes or no'); process.exit(2); }
      f.routers = v;
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

function usageText() {
  return `sshlg-skills: install/update the ssheleg skill family everywhere

Skills: ${SKILLS.map(s => s.name).join(', ')}

Usage:
  npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only] [--dry-run] [--routers yes|no]
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
  npx sshlg-skills config  set update.mode auto|notify|off
                                                      # how the next set arrives: auto (default) installs
                                                      # it nightly and when you go idle; notify only says
                                                      # it is out; off says nothing (B-323)
  npx sshlg-skills schedule [--apply | --revert] [--dry-run] [--json]
                                                      # the nightly update job: status, level with update.mode, remove
  npx sshlg-skills hooks   [status]                   # what is wired, and what holds it
  npx sshlg-skills hooks   install [--force] [--dry-run] [--codex] [--gemini] [--kimi] [--hermes] [--pi] [--opencode]
                                                      # --codex: also the guard in Codex's hooks.json
  npx sshlg-skills context [--json]                    # what each host loads before the first word; caps
  npx sshlg-skills hooks   recovery inspect [--json]
  npx sshlg-skills hooks   recovery recover --expect <digest|absent> [--json]
  npx sshlg-skills hooks   remove
  npx sshlg-skills hosts                              # hosts detected here; Pi visibility; Codex config
                                                      # duplicates; local MCP servers that do not answer
  npx sshlg-skills injectors                          # who else speaks at SessionStart
  npx sshlg-skills conflicts                          # installed skills on a router's ground
  npx sshlg-skills humanizers                         # anti-AI-writing skills this machine can reach
  npx sshlg-skills signature --used "<skill>[=what it did],…"
                                                      # report header + footer, links looked up
  npx sshlg-skills toolkit [--for "<task>"] [--find "<concept>, …" [--json]] [--expand <provider>]
                                                      # every skill this machine can reach
  npx sshlg-skills visibility [--apply | --revert] [--days 60] [--full-days 14|off] [--keep a,b]
                    [--measure]                       # Claude/Codex: hide all outside the core;
                                                      # Claude: quiet core skills name-only;
                                                      # Gemini/Pi/OpenCode/Hermes: hide marked
                                                      # packs; Cursor/Kimi: cannot hide
  npx sshlg-skills visibility marks [--init --show <owner/repo,…> [--replace] [--apply]]
                                                      # this machine's pack marks
                                                      # (~/.sshlg-skills/pack-marks.json)
  npx sshlg-skills blocks [--agent claude|codex|gemini|pi|cursor] [--json]\n  npx sshlg-skills blocks diff OWNER:NAME --from <local-file> --agent <host>\n                                                      # read-only markers and selected local diff\n  npx sshlg-skills blocks install|uninstall OWNER:NAME --owner OWNER --agent <host>|all [--from <file>] [--apply]\n  npx sshlg-skills blocks resolve <operation-id>\n                                                      # managed-blocks/1 writer for a tool's own block; preview unless --apply\n  npx sshlg-skills rules [--apply] [--agent codex|gemini|pi|cursor] [--claude-only]\n                                                      # opt-in wait rule; preview unless --apply\n  npx sshlg-skills rules recovery inspect [--json]\n  npx sshlg-skills rules recovery finalize --operation <id> [--apply] [--json]\n                                                      # metadata only; never restores host instructions\n  npx sshlg-skills domains [--apply | --revert] [--root <dir>] [--no-usage]
  npx sshlg-skills domains --enable|--disable <member> [--project <dir>]
                                                      # xr-dev, web3d-dev, telegram-dev; hook-bearing members stay global
                                                      # load only in projects that call for them
  npx sshlg-skills pack [<name>] [--lane <id>] [--check]
                                                      # curated recommendations, measured here
  npx sshlg-skills materialised                       # routers this project says live in its tree
  npx sshlg-skills enroll [--root DIR] [--dry-run] [--json] [--surface public-web|app-text|internal]
                                                      # this repository's routes: SSHLG:PROJECT block in its
                                                      # CLAUDE.md/AGENTS.md, routers.json for existing material
  npx sshlg-skills enroll --prune [--apply] [--root DIR] [--json]
                                                      # drop routers.json entries enroll wrote whose material
                                                      # is gone; preview unless --apply
  npx sshlg-skills settings get <key> [--file <path>]
                                                      # one Claude settings key, credentials redacted:
                                                      # enabledPlugins, hooks, permissions,
                                                      # skillOverrides, extraKnownMarketplaces
  npx sshlg-skills list [--verbose | -v | --json]
  npx sshlg-skills agents
  npx sshlg-skills help [<command>]                   # this text, or one command's part of it
  npx sshlg-skills <command> --help | -h              # the same; prints only, writes nothing
  npx sshlg-skills --version | -v                     # the package version

Defaults:
  - Non-Claude agents (${manifest.defaultAgents.join(', ')}) via the skills CLI,
                each only where its home exists here (no home is created).
  - Claude Code via its PLUGIN (not a plain copy) to avoid a shadow duplicate.
  - --all       all globally supported agents in the pinned skills CLI snapshot.
                Excludes project-only targets and plain Claude while plugins are on.
  - --no-claude skip the Claude plugin step, and leave the Claude host alone: no
                routing-block write to CLAUDE.md, no hook re-wiring in
                settings.json, no refresh of the runtime copy those hooks run.
                Any --agent list does the same for those three, and in update
                also skips the Claude plugin step: no --agent value selects
                Claude (--agent claude exits 2). Scope a run to Claude with
                --claude-only, or pass no scope flag.
  - update exits 75 when another update holds ~/.sshlg-skills/update.lock
                (retry later; nothing failed) and 2 on a usage error.
  - install and update keep the nightly update job level with update.mode:
                written and registered on auto, removed on notify or off.
  - update never ADDS a hook entry: one removed by hand stays removed, and an
                event a later release introduces arrives through
                \`hooks install\`; update names each one not wired here.
  - --claude-only install/update only the Claude plugins.
  - --bump-pins  (update only) also fast-forward the pinned submodules to their
                 upstream tips (off by default so pins stay reproducible).
  - --dry-run    (install/update) build the full operation plan (every
                 subprocess, prune, router, runtime and settings.json hook-wiring
                 action), render it, and execute NOTHING. The receipt is
                 complete; the mutations are zero.`;
}

function usage() { log(usageText()); }

/**
 * B-198: one command's part of the usage above, so `<command> --help` has one
 * source. The lines are every `npx sshlg-skills <name>` entry with the comment
 * lines under it; install and update add the Defaults section their flags are
 * explained in. Returns null for a name the usage does not list.
 */
const HELP_ALIASES = { i: 'install', up: 'update', un: 'uninstall', ls: 'list', packs: 'pack', materialized: 'materialised' };
function commandUsage(cmd) {
  const name = HELP_ALIASES[cmd] || cmd;
  if (!/^[a-z]+$/.test(name)) return null;
  const text = usageText();
  const head = new RegExp(`^  npx sshlg-skills ${name}(\\s|$)`);
  const out = [];
  let taking = false;
  for (const line of text.split('\n')) {
    if (/^  npx sshlg-skills /.test(line)) taking = head.test(line);
    else if (taking && !/^\s+#/.test(line)) taking = false;
    if (taking) out.push(line);
  }
  if (!out.length) return null;
  const parts = ['Usage:', ...out];
  if (name === 'install' || name === 'update') parts.push('', text.slice(text.indexOf('Defaults:')));
  return parts.join('\n');
}

/** `--help`/`-h` among a command's arguments, before a `--` terminator. */
function wantsHelp(args) {
  for (const a of args) {
    if (a === '--') return false;
    if (a === '--help' || a === '-h') return true;
  }
  return false;
}

function main(argv) {
  const [cmd, ...rest] = argv.slice(2);
  if (cmd === '--version' || cmd === '-v') { log(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version); return 0; }
  if (cmd === 'help' && rest.length && !wantsHelp(rest.slice(0, 1))) {
    const u = commandUsage(rest[0]);
    if (u) { log(u); return 0; }
    log(`unknown command: ${rest[0]}`); usage(); return 2;
  }
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { usage(); return 0; }
  // B-198: before dispatch, so no command parses, locks, backs up or spawns on a
  // help request. `blocks` keeps its own help: it documents each verb in full.
  if (cmd !== 'blocks' && wantsHelp(rest)) {
    const u = commandUsage(cmd);
    if (u) { log(u); return 0; }
    log(`unknown command: ${cmd}`); usage(); return 2;
  }
  if (cmd === 'list' || cmd === 'ls') { cmdList(argv); return 0; }
  if (cmd === 'agents') { cmdAgents(); return 0; }
  if (cmd === 'hosts') { cmdHosts(); return 0; }
  // Before parseFlags: `config` takes positional arguments, and that parser
  // exits on any token it does not recognise as a flag.
  if (cmd === 'config') return cmdConfig(rest);
  if (cmd === 'blocks') {
    try { return require('../lib/blocks.js').cli(rest, {home:os.homedir(),env:process.env}, s=>process.stdout.write(s)); }
    catch (e) { log(`blocks: ${e.message}`); return 2; }
  }
  if (cmd === 'rules') {
    if (rest[0] === 'recovery') return require('../lib/wait-recovery-cli.js').cli(rest.slice(1), {home:process.env.HOME || os.homedir(),env:process.env});
    try { return cmdRules(parseRuleFlags(rest)) ? 0 : 1; }
    catch (e) { log(`rules: ${e.message}`); return 2; }
  }
  // Also before parseFlags: `hooks` takes a positional subcommand.
  if (cmd === 'hooks') { const r = cmdHooks(rest); return typeof r === 'number' ? r : (r ? 0 : 1); }
  if (cmd === 'schedule') return cmdSchedule(argv);
  if (cmd === 'injectors') { cmdInjectors(); return 0; }
  if (cmd === 'context') return cmdContext(rest);
  if (cmd === 'conflicts') { cmdConflicts(); return 0; }
  if (cmd === 'toolkit') { return cmdToolkit(argv) || 0; }
  if (cmd === 'visibility') return cmdVisibility(argv);
  if (cmd === 'domains') return runDomainsLocked(argv);
  if (cmd === 'pack' || cmd === 'packs') { return cmdPack(argv); }
  if (cmd === 'materialised' || cmd === 'materialized') { return cmdMaterialised(argv); }
  if (cmd === 'enroll') { return cmdEnroll(argv); }
  if (cmd === 'signature') { return cmdSignature(argv); }
  if (cmd === 'humanizers') { return cmdHumanizers(argv); }
  if (cmd === 'settings') { return cmdSettings(rest); }
  // `restore` takes a positional archive name.
  if (cmd === 'restore') return cmdRestoreAll(rest) ? 0 : 1;
  const f = parseFlags(rest);
  if (['install', 'i', 'update', 'up'].includes(cmd)) {
    // Fail before building/executing any operation, including plugin-only runs.
    try {
      skillsCliAgents(f); plainSkillsPlan(f, cmd === 'update' || cmd === 'up');
      const planned = cmd === 'update' || cmd === 'up' ? planUpdate(f) : planInstall(f);
      frozenOperations.set(f, planned);
    }
    catch (e) { log(e.message); return 2; }
    if (defaultScope(f) && !f.claudeOnly) {
      const absent = defaultPresence(plan.resolveAgents(manifest.defaultAgents, f)).absent.map(a => a.id);
      if (absent.length) log(`  default hosts not installed here, skipped: ${absent.join(', ')} (no home created; --agent <id> installs there anyway)`);
    }
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

module.exports = { cliSpec, pinnedArgv, resolvePayloads, resolveProviders, refreshCodexPlugins, CODEX_READ_TIMEOUT_MS };
