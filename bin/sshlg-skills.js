#!/usr/bin/env node
/*
 * sshlg-skills — one launcher/updater for the ssheleg skill family
 * (super-ux, task-pipeline, make-skill, sheleg-design) across every agent.
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

function usage() {
  log(`sshlg-skills — install/update the ssheleg skill family everywhere

Skills: ${SKILLS.map(s => s.name).join(', ')}

Usage:
  npx sshlg-skills install [--agent a,b | --all] [--no-claude] [--claude-only]
  npx sshlg-skills update  [--agent a,b | --all] [--no-claude] [--claude-only] [--bump-pins]
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
  // 1. Submodules are PINNED snapshots. Only materialise them (--init), never
  //    move the pins — unless the operator explicitly asks with --bump-pins.
  //    Skipped entirely for --claude-only: that flag must not touch the checkout.
  if (!f.claudeOnly && fs.existsSync(path.join(ROOT, '.gitmodules'))) {
    if (f.bumpPins) {
      log('\n== Bumping submodule pins to upstream tips (--bump-pins) ==');
      ok = run('git', ['-C', ROOT, 'submodule', 'update', '--init', '--remote', '--merge']) && ok;
      log('  ! pins moved — commit the gitlinks to make this reproducible');
    } else {
      log('\n== Materialising pinned submodules (pins unchanged) ==');
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

function main(argv) {
  const [cmd, ...rest] = argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { usage(); return 0; }
  if (cmd === 'list' || cmd === 'ls') { cmdList(); return 0; }
  if (cmd === 'agents') { cmdAgents(); return 0; }
  const f = parseFlags(rest);
  if (cmd === 'install' || cmd === 'i') return cmdInstall(f) ? 0 : 1;
  if (cmd === 'update' || cmd === 'up') return cmdUpdate(f) ? 0 : 1;
  log(`unknown command: ${cmd}`); usage(); return 2;
}

process.exit(main(process.argv));
