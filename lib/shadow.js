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
  const list = (Array.isArray(plain) ? plain : [])
    // A caller may hand plain names (the home directory, the original shape) or
    // `{name, scope}` rows. Both are accepted rather than migrating every call site,
    // because the second location arrived after this module and its consequence is
    // different, not its check.
    .map((e) => (typeof e === 'string' ? { name: e, scope: 'home' } : e))
    .filter((e) => e && e.name);
  const map = provided instanceof Map ? provided : new Map(Object.entries(provided || {}));
  return list
    .filter((e) => map.has(e.name))
    .sort((a, b) => (a.scope === b.scope ? a.name.localeCompare(b.name) : (a.scope === 'home' ? -1 : 1)))
    .map((e) => ({ skill: e.name, plugin: map.get(e.name), scope: e.scope, at: e.at || null }));
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
  const home = rows.filter((r) => r.scope !== 'project');
  const proj = rows.filter((r) => r.scope === 'project');
  const out = [];

  if (home.length) {
    out.push(`[sshlg-skills] ${home.length} shadowing plain ${home.length === 1 ? 'copy' : 'copies'} ` +
      'in ~/.claude/skills/ — each serves the version it was copied from, forever:');
    for (const r of home) out.push(`  ${r.skill} — a plain copy shadows the plugin from ${r.plugin}`);
    out.push('  remove them, or run `npx --yes sshlg-skills@latest update`, which prunes them.');
  }

  // A project copy is exposed to something a home copy is not, and it is the half
  // with no warning anywhere: the directory is inside a git working tree, so one
  // `git add -A` about something else commits somebody's local skill install into
  // the product's history. Measured: 173 files across seven skill directories swept
  // into a commit whose message was about an MCP server. (#98)
  if (proj.length) {
    if (out.length) out.push('');
    out.push(`[sshlg-skills] ${proj.length} shadowing plain ${proj.length === 1 ? 'copy' : 'copies'} ` +
      'in THIS PROJECT\'s .claude/skills/ — two consequences, not one:');
    for (const r of proj) out.push(`  ${r.skill} — shadows the plugin from ${r.plugin}${r.at ? ` (${r.at})` : ''}`);
    out.push('  1. it beats the plugin for this project and serves its frozen version;');
    out.push('  2. it is inside a git tree, so `git add -A` commits it into the product.');
    out.push('  Ignoring the directory outright deletes the one case that is CORRECT —');
    out.push('  a skill the repository itself owns and keeps there on purpose. The');
    out.push('  allowlist shape is what to write instead:');
    out.push('      .claude/skills/*');
    out.push('      !.claude/skills/<the-one-this-repo-owns>/');
  }
  return out.join('\n');
}

module.exports = { shadows, render };
