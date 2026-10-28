'use strict';
/**
 * Claude Code local-scope install records under a project's OLD path (B-243). Read-only.
 *
 * A project folder renamed with its old name kept as a symlink leaves two local records in
 * `installed_plugins.json`: the old path and the live one. Claude addresses a local scope by
 * the physical cwd (measured on 2.1.299 for B-242), so `claude plugin update|uninstall
 * --scope local` run from either name reaches the live record only; the old one can never be
 * addressed. `update` already leaves it as recorded (lib/claude-pinned.js `aliases`). This
 * module names such records and the exact manual remedy; nothing in the hub writes the file
 * outside the native pin transaction.
 *
 * Decided here from values the caller passes (the parsed registry and a realpath function),
 * so the rule is fixtured without a HOME.
 */
const path = require('path');

/**
 * @param registry  parsed installed_plugins.json
 * @param realpath  (p) => physical path, or null when it does not resolve
 * @returns [{ plugin, projectPath, real }] old-path records beside a live record at `real`
 */
function staleAliases(registry, realpath) {
  const out = [];
  const plugins = registry && typeof registry === 'object' && registry.plugins && typeof registry.plugins === 'object'
    ? registry.plugins : {};
  for (const [plugin, records] of Object.entries(plugins)) {
    if (!Array.isArray(records)) continue;
    const locals = records.filter((r) => r && r.scope === 'local' && typeof r.projectPath === 'string' && path.isAbsolute(r.projectPath));
    for (const r of locals) {
      const real = realpath(r.projectPath);
      if (!real || real === r.projectPath) continue;
      if (locals.some((o) => o !== r && o.projectPath === real)) out.push({ plugin, projectPath: r.projectPath, real });
    }
  }
  return out.sort((a, b) => (a.plugin < b.plugin ? -1 : a.plugin > b.plugin ? 1 : 0));
}

/**
 * B-264: local records Claude addresses at ANOTHER folder. Claude runs a local scope at the
 * root of the git repository the folder sits in, and a linked worktree at its main working
 * tree (lib/claude-pinned.js `claudeAddress`, measured on 2.1.299). A record written under
 * the worktree or the subdirectory itself is never read or updated; B-242 leaves it as
 * recorded beside a root record, and blocks its member without one.
 *
 * @param registry  parsed installed_plugins.json
 * @param realpath  (p) => physical path, or null when it does not resolve
 * @param address   (dir) => {address, worktree}: the folder Claude addresses for `dir`
 * @returns [{ plugin, projectPath, root, kind: 'worktree'|'subdirectory', rootRecord }]
 */
function rootRecords(registry, realpath, address) {
  const out = [];
  const plugins = registry && typeof registry === 'object' && registry.plugins && typeof registry.plugins === 'object'
    ? registry.plugins : {};
  for (const [plugin, records] of Object.entries(plugins)) {
    if (!Array.isArray(records)) continue;
    const locals = records.filter((r) => r && r.scope === 'local' && typeof r.projectPath === 'string' && path.isAbsolute(r.projectPath));
    for (const r of locals) {
      // An old path (a symlink) is staleAliases' case; a missing folder is nobody's here.
      if (realpath(r.projectPath) !== r.projectPath) continue;
      let at = null;
      try { at = address(r.projectPath); } catch (_) { continue; }
      if (!at || typeof at.address !== 'string' || at.address === r.projectPath) continue;
      out.push({
        plugin, projectPath: r.projectPath, root: at.address,
        kind: at.worktree ? 'worktree' : 'subdirectory',
        rootRecord: locals.some((o) => o !== r && o.projectPath === at.address),
      });
    }
  }
  return out.sort((a, b) => (a.plugin < b.plugin ? -1 : a.plugin > b.plugin ? 1 : 0));
}

/** A string quoted for a POSIX shell. */
function q(s) { return `'${String(s).replace(/'/g, "'\\''")}'`; }

// The PRINTED remedy, run by the operator after the `cp -p` backup in the same line; the hub
// never runs it. It removes the local records at each exact (plugin, projectPath) pair and
// writes the file back the way Claude Code does (two-space JSON, no final newline). Double
// quotes only, so the whole script sits inside one pair of single quotes.
const SCRIPT = 'const {readFileSync:r,writeFileSync:w}=require("fs"),[f,...a]=process.argv.slice(1),d=JSON.parse(r(f,"utf8"));'
  + 'for(let i=0;i<a.length;i+=2)d.plugins[a[i]]=d.plugins[a[i]].filter(x=>!(x&&x.scope==="local"&&x.projectPath===a[i+1]));'
  + 'w(f,JSON.stringify(d,null,2))';

/**
 * The exact remedy for `aliases` in one `file`: quit sessions, one backup, drop exactly those
 * records in one write (one command, so a second backup never overwrites the first).
 */
function remedy(file, aliases) {
  const list = [].concat(aliases || []);
  const backup = `${file}.bak-b243`;
  const pairs = list.map((a) => `${q(a.plugin)} ${q(a.projectPath)}`).join(' ');
  // B-264: a worktree or subdirectory record whose root has no record of its own: the
  // root gets its own install first, so the project keeps the plugin once the dead one goes.
  const installs = list.filter((a) => a.root && a.rootRecord === false)
    .map((a) => `cd ${q(a.root)} && claude plugin install ${q(a.plugin)} --scope local`)
    .filter((v, i, x) => x.indexOf(v) === i);
  return [
    'Quit running Claude Code sessions first (a running session can write the file back), then:',
    ...(installs.length ? ['Give each repository root with no record its own install (Claude reads the local scope there):', ...installs] : []),
    `cp -p ${q(file)} ${q(backup)} && node -e ${q(SCRIPT)} ${q(file)} ${pairs}`,
    `This drops only the record(s) named above (${list.map((a) => a.projectPath).filter((v, i, x) => x.indexOf(v) === i).join(', ')}); `
      + `the live records stay. Undo: cp -p ${q(backup)} ${q(file)}`,
  ];
}

module.exports = { staleAliases, rootRecords, remedy };
