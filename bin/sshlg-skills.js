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
function pruneClaudeShadows(skillIds) {
  const base = path.join(os.homedir(), '.claude', 'skills');
  const pruned = [];
  for (const id of skillIds) {
    const d = path.join(base, id);
    try {
      if (fs.existsSync(d)) { fs.rmSync(d, { recursive: true, force: true }); pruned.push(id); }
    } catch (_) { /* leave it; not fatal */ }
  }
  if (pruned.length) {
    log(`  pruned Claude plain copies that would shadow the plugin: ${pruned.join(', ')}`);
  }
}

function usage() {
  log(`sshlg-skills — install/update the ssheleg skill family everywhere

Skills: ${SKILLS.map(s => s.name).join(', ')}

Usage:
  npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only]
  npx sshlg-skills update  [--agent a,b | --all] [--no-claude] [--claude-only] [--bump-pins]
  npx sshlg-skills routers [--member <name>] [--update] [--dry-run]
  npx sshlg-skills config  [list]
  npx sshlg-skills config  set routers.<name> on|off
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
  let agents = agentList(f);
  if (f.claude && !f.all) agents = agents.filter(a => a !== 'claude-code');
  if (f.all && f.claude) log('  ! --all includes claude-code: a plain Claude copy will be added alongside the plugin (duplicate). Use the default agent set to avoid this.');
  return agents;
}

function cmdInstall(f) {
  let ok = true;
  if (!f.claudeOnly) {
    const agents = skillsCliAgents(f);
    // the skills CLI wants ONE `--agent` flag per agent (it does not split a
    // comma/space-joined value) — flatten to repeated flags.
    const agentFlags = agents.reduce((acc, a) => acc.concat('--agent', a), []);
    log(`\n== Installing to agents via skills CLI: ${agents.join(', ')} ==`);
    for (const s of SKILLS) {
      log(`\n- ${s.name} (${s.repo})`);
      ok = run('npx', ['--yes', 'skills', 'add', s.repo, ...agentFlags, '--global', '--yes']) && ok;
    }
    if (f.claude) pruneClaudeShadows(SKILLS.flatMap(s => s.skillNames || [s.name]));
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
  return ok;
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
    // A repo can ship several skills under different ids (super-ux ships
    // ux-foundation/ux-flows/ux-scenarios/ux-audit — there is no "super-ux"
    // skill), and `skills update` matches INSTALLED SKILL names, not repo names.
    const names = SKILLS.flatMap(s => (s.skillNames && s.skillNames.length ? s.skillNames : [s.name]));
    log(`\n== Updating skills-CLI installs (global): ${names.join(', ')} ==`);
    // One invocation per skill: a single bad id must not fail the whole batch.
    for (const n of names) {
      ok = run('npx', ['--yes', 'skills', 'update', n, '--global', '--yes']) && ok;
    }
    if (f.claude) pruneClaudeShadows(names);
  }
  if (f.claude || f.claudeOnly) {
    log(`\n== Updating Claude Code plugins ==`);
    for (const s of SKILLS) {
      ok = run('claude', ['plugin', 'marketplace', 'update', s.pluginInstall.split('@')[1]]) && ok;
      ok = run('claude', ['plugin', 'update', s.pluginInstall]) && ok;
    }
    log('\n(restart Claude Code to apply)');
  }
  return ok;
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
  const fs = require('fs');
  const path = require('path');
  const home = process.env.HOME || require('os').homedir();

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
    if (moved.text !== src && decision === 'yes' && !f.dryRun) {
      fs.writeFileSync(file, moved.text, 'utf8');
    }
    // Hand the migrated text on rather than letting apply re-read the file:
    // on a dry run nothing was written, and re-reading would preview the
    // additions without the removals that come with them.
    sources[file] = decision === 'yes' ? moved.text : src;
    Object.assign(packaged, moved.routers);
    Object.assign(superseded, moved.superseded);
    // Whatever migration just moved is the operator's, and this is the only
    // moment it is still identifiable as such: the heading it came from is
    // about to leave the file.
    for (const name of Object.keys(moved.routers)) {
      if (preserve.indexOf(name) === -1) preserve.push(name);
      if (!f.dryRun && decision === 'yes') configLib.authoredSet(home, name, moved.routers[name]);
    }
  }

  const res = apply.apply({
    home, mode, consent: decision, routers: packaged,
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

  for (const r of res.targets) {
    if (r.action === 'agent-absent') continue;
    log(`routers: ${r.file} — ${r.action}`);
    if (r.diff) log(r.diff);
  }
  if (remove.length) log(`routers: выключены настройкой — ${remove.join(', ')}`);
  for (const id of Object.keys(superseded)) {
    log(`routers: вытеснен рукописный раздел "${id}" — тело сохранено в ${configLib.configPath(home)}`);
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

function main(argv) {
  const [cmd, ...rest] = argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { usage(); return 0; }
  if (cmd === 'list' || cmd === 'ls') { cmdList(); return 0; }
  if (cmd === 'agents') { cmdAgents(); return 0; }
  // Before parseFlags: `config` takes positional arguments, and that parser
  // exits on any token it does not recognise as a flag.
  if (cmd === 'config') return cmdConfig(rest);
  const f = parseFlags(rest);
  if (cmd === 'install' || cmd === 'i') return cmdInstall(f) ? 0 : 1;
  if (cmd === 'update' || cmd === 'up') return cmdUpdate(f) ? 0 : 1;
  if (cmd === 'routers') return cmdRouters(f) ? 0 : 1;
  log(`unknown command: ${cmd}`); usage(); return 2;
}

process.exit(main(process.argv));
