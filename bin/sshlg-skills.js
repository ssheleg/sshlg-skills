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
 *   npx sshlg-skills update  [--agent a,b | --all] [--no-claude]
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
  const r = spawnSync(cmd, args, Object.assign({ stdio: 'inherit' }, opts || {}));
  return r.status === 0;
}

function parseFlags(argv) {
  const f = { agents: null, all: false, claude: true, claudeOnly: false, yes: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') f.all = true;
    else if (a === '--no-claude') f.claude = false;
    else if (a === '--claude-only') f.claudeOnly = true;
    else if (a === '--agent' || a === '-a') f.agents = (argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
    else { log(`unknown option: ${a}`); process.exit(2); }
  }
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
  npx sshlg-skills update  [--agent a,b | --all] [--no-claude]
  npx sshlg-skills list
  npx sshlg-skills agents

Defaults:
  - Non-Claude agents (${manifest.defaultAgents.join(', ')}) via the skills CLI.
  - Claude Code via its PLUGIN (not a plain copy) to avoid a shadow duplicate.
  - --all       every agent the skills CLI supports ('*'); with Claude plugins on,
                this also drops a plain Claude copy — prefer the default.
  - --no-claude skip the Claude plugin step.
  - --claude-only install/update only the Claude plugins.`);
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
      run('claude', ['plugin', 'marketplace', 'add', s.pluginMarketplace]);
      run('claude', ['plugin', 'install', s.pluginInstall]);
    }
    log('\n(restart Claude Code to apply the plugins)');
  }
  return ok;
}

function cmdUpdate(f) {
  let ok = true;
  // 1. refresh pinned submodule snapshots if we are inside the repo checkout
  if (fs.existsSync(path.join(ROOT, '.gitmodules'))) {
    log('\n== Refreshing submodule snapshots ==');
    run('git', ['-C', ROOT, 'submodule', 'update', '--remote', '--merge']);
  }
  if (!f.claudeOnly) {
    log(`\n== Updating skills-CLI installs (global) ==`);
    ok = run('npx', ['--yes', 'skills', 'update', ...SKILLS.map(s => s.name), '--global', '--yes']) && ok;
  }
  if (f.claude || f.claudeOnly) {
    log(`\n== Updating Claude Code plugins ==`);
    for (const s of SKILLS) {
      run('claude', ['plugin', 'marketplace', 'update', s.pluginInstall.split('@')[1]]);
      run('claude', ['plugin', 'update', s.pluginInstall]);
    }
    log('\n(restart Claude Code to apply)');
  }
  return ok;
}

function cmdList() {
  log('ssheleg skill family:\n');
  for (const s of SKILLS) {
    let ver = '?';
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
