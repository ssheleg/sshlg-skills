'use strict';
/**
 * Hook re-wiring and host gates that `update` refreshes on a consented machine.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { claudeScope, log, opres } = require('./cli-core.js');

/**
 * One line per family entry the refresh did not wire, with the remedy (fix round 2, K), and
 * one sentence after them (final polish 7): the remedy re-adds EVERY removed family entry, so
 * an operator who removed one on purpose is told before running it — the list repeats on
 * every `update` for an entry removed on purpose, and that is the cost of never re-adding it.
 */
function notWiredLines(skipped) {
  const lines = (skipped || []).filter((x) => !/held by/.test(x.why)).map((x) =>
    `${x.event}: not wired here (removed by hand, or new in this release): \`npx sshlg-skills hooks install\` adds it`);
  if (lines.length) {
    lines.push('note: `hooks install` re-adds every removed family entry, not only the new ones: '
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
/**
 * The settings file the hooks are wired into: the Claude profile Claude Code reads,
 * `$CLAUDE_CONFIG_DIR/settings.json` or `~/.claude/settings.json` (B-218, CLAUDE-8). The
 * same resolution the routing block, pins and visibility use (lib/apply.js `hostRoot`).
 */
function hooksSettingsFile(home) {
  return path.join(require('../lib/enablement.js').claudeRoot(home), 'settings.json');
}

function planRewire(f) {
  const hooksLib = require('../lib/hooks.js');
  const home = os.homedir();
  const file = hooksSettingsFile(home);
  const root = hooksLib.runtimeDir(home);
  const base = { file, changed: [], reasons: [], skipped: [] };
  const scoped = claudeScope(f);
  if (!scoped.inScope) return Object.assign(base, { status: 'out of scope', skippedBy: scoped.skippedBy });
  let current;
  let text;
  try {
    if (!fs.existsSync(file)) return Object.assign(base, { status: 'no settings' });
    text = fs.readFileSync(file, 'utf8');
    current = JSON.parse(text);
  } catch (e) {
    return Object.assign(base, { status: 'unparseable', error: e.message });
  }
  if (!hooksLib.consented(current, root)) return Object.assign(base, { status: 'no consent' });
  const p = hooksLib.plan(current, root, { refreshOnly: true });
  return Object.assign(base, {
    status: p.changed.length ? 'changes' : 'current',
    settings: p.settings, changed: p.changed, reasons: p.reasons, skipped: p.skipped, text,
  });
}

/** The `hooks-wiring` line of the `--dry-run` receipt, from the same `planRewire`. */
function rewireStep(f) {
  const r = planRewire(f);
  const changes = r.status === 'changes'
    ? r.reasons.map((x) => `${x.event}: ${x.reason}`)
    : [r.status === 'out of scope' ? `out of scope (skipped: ${r.skippedBy})`
      : r.status === 'unparseable' ? `does not parse (${r.error}): nothing written`
        : r.status === 'current' ? 'already matches this package' : r.status];
  for (const s of r.skipped) if (s.event === 'statusLine' && /held by/.test(s.why)) changes.push(`statusLine: ${s.why}`);
  changes.push(...notWiredLines(r.skipped));
  return opres.step('hooks-wiring', 'home',
    r.status === 'changes'
      ? 're-wire the consented hook entries (copy before write, through protect())'
      : 'hook entries in settings.json: nothing to write',
    { file: r.file, changes });
}

/** Agent ids under which `--agent` names each gated host (lib/hostgate-install.js). */
const GATE_AGENT_IDS = { gemini: ['gemini', 'gemini-cli'], kimi: ['kimi', 'kimi-cli', 'kimi-code-cli'],
  hermes: ['hermes', 'hermes-agent'], pi: ['pi'], opencode: ['opencode'] };

/** The gated hosts this run may touch: not under `--claude-only`; under `--agent`, the named ones. */
function gateHostsInScope(f) {
  const flags = f || {};
  if (flags.claudeOnly) return [];
  const all = require('../lib/hostgate-install.js').HOSTS;
  if (!flags.agents || !flags.agents.length) return all;
  return all.filter((h) => GATE_AGENT_IDS[h].some((id) => flags.agents.includes(id)));
}

function gateOptions() {
  const home = os.homedir();
  const found = require('../lib/posix-perms.js').findExecutable('node', String(process.env.PATH || '').split(path.delimiter).filter(Boolean));
  return { home, env: process.env, root: require('../lib/hooks.js').runtimeDir(home), node: found || process.execPath };
}

/**
 * B-280: refresh the guard on every host where an entry of ours is already wired (presence
 * is the consent, as for Claude's settings.json). `refreshOnly`: never adds one. Returns
 * false only when a write was refused.
 */
function refreshHostGates(f) {
  const gateLib = require('../lib/hostgate-install.js');
  const opts = Object.assign(gateOptions(), { refreshOnly: true });
  let ok = true;
  for (const h of gateHostsInScope(f)) {
    let p;
    try { p = gateLib.plan(h, opts); } catch (e) { log(`\n== Hook gate: ${h} ==\n  not read: ${e.message}`); ok = false; continue; }
    if (!['install', 'update'].includes(p.state)) continue;
    log(`\n== Hook gate: ${h} ==`);
    const w = gateLib.write(p, { home: opts.home });
    if (!w.ok) { log(`  NOT written: ${p.file} (${w.action}${w.error ? `: ${w.error}` : ''}); unchanged`); ok = false; continue; }
    log(`  refreshed ${p.file}`);
    if (w.backup) log(`  copy before write: ${w.backup}`);
  }
  return ok;
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
    log(`  ${r.file} does not parse (${r.error}): nothing written`);
    return false;
  }
  for (const s of r.skipped) if (s.event === 'statusLine' && /held by/.test(s.why)) log(`  statusLine: ${s.why}`);
  // `update` never ADDS an entry (an operator's removal stays removed), so an event a later
  // release introduced arrives only through `hooks install` — said, not left to be noticed.
  for (const line of notWiredLines(r.skipped)) log(`  ${line}`);
  if (r.status === 'current') { log('  settings.json already matches this package'); return true; }
  // Compare before replace (B-218, CLAUDE-7): written only if the file still holds the
  // bytes the plan was made from, so a concurrent edit is never lost to this refresh.
  const saved = apply.protectedWrite(r.file, JSON.stringify(r.settings, null, 2) + '\n',
    { home: os.homedir(), expected: r.text });
  if (!saved.ok) {
    log(saved.action === 'changed'
      ? `  NOT written: ${r.file} changed after it was read; nothing overwritten, run update again`
      : `  NOT written: ${saved.action}${saved.error ? ` (${saved.error})` : ''}; ${r.file} unchanged`);
    return false;
  }
  for (const x of r.reasons) log(`  ${x.event}: ${x.reason}`);
  log(`  re-wired ${r.changed.join(', ')}`);
  log(`  copy before write: ${saved.backup}`);
  log('  restart Claude Code: hooks are read at session start');
  return true;
}

Object.assign(module.exports, {
  notWiredLines, hooksSettingsFile, planRewire, rewireStep, GATE_AGENT_IDS, gateHostsInScope,
  gateOptions, refreshHostGates, rewireConsentedHooks
});
