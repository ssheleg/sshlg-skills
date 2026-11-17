'use strict';
/**
 * `rules`: the opt-in wait rule, and the wait plan install, update and uninstall attach.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const os = require('os');

const { log, opres, scopedRoutingTargets } = require('./cli-core.js');

/**
 * `config` — the pack's settings.
 *
 * Kept out of `parseFlags` on purpose: its arguments are positional, and that
 * parser exits on anything that is not a known flag.
 */
const WAIT_PLANS = new WeakMap();

function waitPlan(f, options = {}) {
  const scoped = scopedRoutingTargets(f);
  return require('../lib/wait-rules.js').plan(process.env.HOME || os.homedir(), {
    hostTargets: scoped.hostTargets, cursor: scoped.includeCursor, ...options,
  });
}

function attachWaitPlan(steps, f, options = {}) {
  if (f.member) return opres.buildPlan(steps);
  const pending = waitPlan(f, { automatic: true, ...options });
  steps.push(opres.step('working-rule', 'home', 'refresh only previously applied wait-rule profiles', {
    changes: pending.rows.map(waitRowLine),
  }));
  const planned = opres.buildPlan(steps);
  WAIT_PLANS.set(planned, pending);
  return planned;
}

// One wording for the plan and the run. A refused block names `file:line` and its remedy
// (B-201); a host the enabled rule has not reached names the command that applies it (B-208).
function waitRowLine(r) {
  if (r.action === 'refused') return `${r.agent}: refused: ${r.reason}; ${r.remedy}`;
  if (r.command) return `${r.agent}: not applied: ${r.file}: rules.wait is on, this host has no ownership receipt; apply it here: ${r.command}`;
  return `${r.agent}: ${r.action} (${r.file})`;
}

function executeWaitPlan(planned) {
  const pending = WAIT_PLANS.get(planned);
  if (!pending) return true;
  const result = require('../lib/wait-rules.js').execute(pending);
  for (const r of result.results) {
    if (r.action === 'refused') log(`rules.wait: ${r.agent} refused: ${r.error}; ${r.remedy}. Every other step of this run continues; the run reports partial (exit 1).`);
    else if (r.command) log(`rules.wait: ${r.agent} not applied: ${r.file}: rules.wait is on and this host has no ownership receipt (an update never extends it to a new host); apply it here: ${r.command}`);
    else if (r.action === 'agent-absent') continue;
    else log(`rules.wait: ${r.agent} ${r.action}${r.error ? ': ' + r.error : ''}`);
  }
  return result.ok;
}

function parseRuleFlags(args) {
  const f = { claude: true, agents: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--apply') f.apply = true;
    else if (a === '--dry-run') f.dryRun = true;
    else if (a === '--no-claude') f.claude = false;
    else if (a === '--claude-only') f.claudeOnly = true;
    else if (a === '--agent') {
      const value = args[++i];
      if (!value || value.startsWith('-')) throw Error('--agent needs codex, gemini, pi or cursor');
      const names = value.split(',').map(s => s.trim());
      if (names.some(n => !['codex', 'gemini', 'pi', 'cursor'].includes(n))) throw Error('unsupported wait-rule host; Claude Code uses --claude-only');
      f.agents.push(...names);
    } else throw Error(`unsupported rules argument: ${a}`);
  }
  if (f.claudeOnly && (!f.claude || f.agents.length)) throw Error('contradictory rules host scope');
  return f;
}

function cmdRules(f) {
  if (f.member) { log('rules: member-only scope cannot apply a family working rule'); return false; }
  try {
    const pending = waitPlan(f);
    log(`rules.wait: ${pending.policy.enabled ? 'on' : 'off'}; ${f.apply && !f.dryRun ? 'apply' : 'preview'}`);
    for (const r of pending.rows) {
      log(`  ${r.agent}: ${r.action} (${r.file})`);
      if (['write', 'remove'].includes(r.action)) {
        if (r.owned) log(r.owned.segment.split('\n').map(line => '- ' + line).join('\n'));
        if (r.segment) log(r.segment.split('\n').map(line => '+ ' + line).join('\n'));
      }
    }
    if (!f.apply || f.dryRun) return true;
    const result = require('../lib/wait-rules.js').execute(pending);
    for (const r of result.results) if (r.action === 'failed') log(`rules.wait: ${r.agent} refused: ${r.error}; inspect ${require('../lib/wait-rules.js').receiptPath(pending.home)}`);
    return result.ok;
  } catch (e) { log(`rules.wait: refused: ${e.message}`); return false; }
}

Object.assign(module.exports, {
  WAIT_PLANS, waitPlan, attachWaitPlan, waitRowLine, executeWaitPlan, parseRuleFlags, cmdRules
});
