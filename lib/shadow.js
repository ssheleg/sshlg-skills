'use strict';
/**
 * Which plain copies are shadowing a plugin — the check, separated from the walk.
 *
 * A directory at `~/.claude/skills/<id>` beats the plugin that provides the same
 * skill id, and serves whatever version it was copied from until somebody deletes
 * it. The machine's `CLAUDE.md` carries this check as a Python one-liner, which
 * means it runs when a person remembers it; `install` and `update` prune the
 * copies they create, which leaves every copy created by anything else.
 *
 * **The cheap version of this check under-reports, and knowing why is the
 * module.** Comparing a plain copy's name against *marketplace* names misses
 * every skill whose plugin ships under a different name — `sheleg-design` comes
 * from `sheleg-design-skill`, the `ux-*` skills come from `super-ux`. So the
 * comparison here is against the skill ids each enabled plugin actually provides.
 *
 * Pure: it is handed two listings and returns the overlap. Walking `~/.claude`
 * belongs to the hook, which is also where the mid-run window is checked.
 */

/**
 * `provided` maps a skill id to the plugin spec that ships it; `plain` is the
 * list of directory names under `~/.claude/skills/`.
 *
 * Returns one row per shadow, sorted, so two runs of the same machine state
 * produce the same report and a diff between them means something.
 */
function shadows(plain, provided) {
  const names = Array.isArray(plain) ? plain : [];
  const map = provided instanceof Map ? provided : new Map(Object.entries(provided || {}));
  return names
    .filter((n) => map.has(n))
    .sort()
    .map((n) => ({ skill: n, plugin: map.get(n) }));
}

/**
 * The report, or `''` when the machine is clean.
 *
 * Empty means silent: a hook that says "no shadows" after every skills command
 * is a hook whose output stops being read, and the one time it matters it will
 * be skimmed along with the rest.
 */
function render(rows) {
  if (!rows || !rows.length) return '';
  const lines = rows.map((r) => `  ${r.skill} — a plain copy shadows the plugin from ${r.plugin}`);
  return [
    `[sshlg-skills] ${rows.length} shadowing plain ${rows.length === 1 ? 'copy' : 'copies'} ` +
      'in ~/.claude/skills/ — each serves the version it was copied from, forever:',
    ...lines,
    `  remove them, or run \`npx --yes sshlg-skills@latest update\`, which prunes them.`,
  ].join('\n');
}

module.exports = { shadows, render };
