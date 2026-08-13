'use strict';
/**
 * Which enabled plugins speak at `SessionStart` — the check, separated from the walk.
 *
 * The routing block already carries the paragraph saying another pack's always-on
 * mandate does not outrank the family's map. Nothing on this machine could tell you
 * whether such a pack was **enabled**, and the one time it mattered the answer took a
 * hand-written Python one-liner: `superpowers` printed 854 tokens of
 * `using-superpowers` into every session and outcompeted the routing in live sessions,
 * and Claude Code has no per-hook disable for a plugin's hooks — turning the plugin off
 * is the whole remedy.
 *
 * **What this module does NOT claim.** It cannot tell doctrine from state. Of the three
 * injectors enabled here, `agent-sync`, `claude-mem` and `warp` all print their own
 * state rather than competing instructions, and no machine can sort those two apart.
 * So this reports *what injects*, never *what competes*, and it says so — a list
 * presented as a list of offenders would be a judgment about other people's packs,
 * dressed as a measurement.
 *
 * **Why one line and not a report.** The session block this joins is ~90 tokens on
 * purpose; it exists because a pack that prints its whole doctrine every session is the
 * cost this family measured elsewhere and removed. Naming three plugins and three file
 * paths every session would re-commit that mistake in miniature, and a notice that
 * arrives every turn is how an operator learns to switch a hook off. The detail lives
 * behind `sshlg-skills injectors`, which also gives the check somewhere to be **watched
 * working on a machine where nothing competes** — a guard whose output nobody has ever
 * seen is indistinguishable from one that is broken.
 *
 * Pure. Reading `settings.json` and each plugin's `hooks.json` belongs to the caller.
 */

/** The event whose timing is the whole problem: it lands before the first prompt. */
const EVENT = 'SessionStart';

/**
 * `enabled` is the list of enabled plugin specs (`name@marketplace`).
 * `hooksByPlugin` maps a spec to `{path, events}` — what its `hooks.json` declares.
 *
 * Returns one row per plugin that speaks at `SessionStart`, sorted, so two runs over
 * the same machine produce the same answer and a difference between them means
 * something. An entry that could not be read contributes nothing: a registry this
 * module cannot parse yields no claim rather than a wrong one.
 */
function injectors(enabled, hooksByPlugin) {
  const specs = Array.isArray(enabled) ? enabled : [];
  const map = hooksByPlugin instanceof Map
    ? hooksByPlugin
    : new Map(Object.entries(hooksByPlugin || {}));
  return specs
    .filter((spec) => {
      const entry = map.get(spec);
      return !!entry && Array.isArray(entry.events) && entry.events.includes(EVENT);
    })
    .sort()
    .map((spec) => ({ spec, hooksPath: (map.get(spec) || {}).path || null }));
}

/**
 * The one line for the session block, or `''` when nothing else injects.
 *
 * Empty means silent. "No other pack injects" is a sentence nobody needs every
 * session, and printing it would make the useful case harder to notice.
 */
function line(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return '';
  const names = list.map((r) => r.spec.split('@')[0]).join(', ');
  return `[sshlg-skills] Also speaking at SessionStart: ${names}. `
       + 'Enablement in settings.json is the only switch a plugin hook has — '
       + '`npx sshlg-skills injectors` names the files.';
}

/**
 * The full account, for the operator who asked. Always prints something, including on
 * a machine where nothing competes, because a check with no visible output on the only
 * machine that runs it is a check nobody has watched work.
 */
function report(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [`Enabled plugins with a ${EVENT} hook`];
  if (!list.length) {
    out.push('  none — this pack is the only thing speaking before your first prompt.');
  } else {
    for (const r of list) {
      out.push(`  ${r.spec}`);
      out.push(`    ${r.hooksPath || '(hooks.json path unresolved)'}`);
    }
  }
  out.push('');
  out.push('This lists what INJECTS, not what competes: a plugin printing its own');
  out.push('state and one printing instructions that outrank yours look identical');
  out.push('from here, and sorting them out is yours to do. Claude Code has no');
  out.push('per-hook disable for a plugin hook — the switch is the plugin itself,');
  out.push('in `enabledPlugins`.');
  return out.join('\n');
}

/**
 * `[enabledSpecs, hooksByPlugin]` read off a real machine — the ONE impure function
 * here, and it lives beside the pure ones because two callers need the identical walk.
 * The hook and `sshlg-skills injectors` had a copy each for about ten minutes, which is
 * a second home for one fact and the thing this repository refuses everywhere else.
 *
 * A plugin's hooks live at
 * `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/hooks/hooks.json`. The
 * version segment is DISCOVERED, never assumed: pinning it would silently stop finding
 * a plugin the day it updates, and a check that quietly finds nothing is the failure
 * mode this whole module exists to avoid. Anything unreadable is absent from the map,
 * so the decision makes no claim rather than a wrong one.
 */
function readRegistry(home) {
  const fs = require('fs');
  const path = require('path');
  const enabled = [];
  const map = {};
  const settings = JSON.parse(
    fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
  for (const [spec, on] of Object.entries(settings.enabledPlugins || {})) {
    if (!on) continue;
    enabled.push(spec);
    const [name, marketplace] = spec.split('@');
    const base = path.join(home, '.claude', 'plugins', 'cache',
                           marketplace || '', name || '');
    let versions = [];
    try { versions = fs.readdirSync(base); } catch (e) { continue; }
    for (const v of versions) {
      const hooksPath = path.join(base, v, 'hooks', 'hooks.json');
      try {
        const declared = JSON.parse(fs.readFileSync(hooksPath, 'utf8')).hooks || {};
        map[spec] = { path: hooksPath, events: Object.keys(declared) };
        break;
      } catch (e) { /* this version ships no hooks.json, or it is unreadable */ }
    }
  }
  return [enabled, map];
}

module.exports = { injectors, line, report, readRegistry, EVENT };
