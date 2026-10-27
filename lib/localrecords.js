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
  return [
    'Quit running Claude Code sessions first (a running session can write the file back), then:',
    `cp -p ${q(file)} ${q(backup)} && node -e ${q(SCRIPT)} ${q(file)} ${pairs}`,
    `This drops only the old-path record(s) named above (${list.map((a) => a.projectPath).filter((v, i, x) => x.indexOf(v) === i).join(', ')}); `
      + `the live records stay. Undo: cp -p ${q(backup)} ${q(file)}`,
  ];
}

module.exports = { staleAliases, remedy };
