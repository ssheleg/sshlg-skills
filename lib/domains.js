'use strict';
/**
 * Which family members a project calls for — decided from the project's own files.
 *
 * Why it exists (plan 2026-10-13 § L5, operator decision "Yes, by domain"). Claude Code
 * lists every enabled plugin's skills in every session: measured that day, family plugins
 * held ≈ 38k of a ≈ 61k-character listing, and four DOMAIN members — `xr-dev` 6.2k,
 * `sheleg-dev` 6.4k, `telegram-dev` 2.8k, `web3d-dev` 2.7k — were listed in every project
 * while being called in a handful. The core members stay on machine-wide; a domain member
 * is enabled in `.claude/settings.local.json` of each project whose repository calls for
 * it, and turned off at user scope only after every such project has its entry.
 *
 * Evidence is what a repository DEPENDS on or DECLARES — a dependency in a manifest, a
 * Quest intent in an AndroidManifest, `navigator.xr` in source — never its name and never
 * its prose. Optionally, a 60-day usage table: a project that called a member's skill.
 *
 * Decisions here are pure (`evidenceIn`, `parseUsage`, `editEnabled`, `plan`,
 * `revertPlan`); `scan` is the one function that reads a directory, and it never writes.
 * `bin/sshlg-skills.js` backs up, writes and reads back.
 */

const DOMAIN_MEMBERS = ['xr-dev', 'web3d-dev', 'telegram-dev', 'sheleg-dev'];
// Their Claude Code plugin specs, for readers without skills.json (the hook runtime);
// test/domains_test.js holds them equal to skills.json's `pluginInstall`.
const PLUGIN_SPECS = {
  'xr-dev': 'xr-dev@xr-dev', 'web3d-dev': 'web3d-dev@web3d-dev',
  'telegram-dev': 'telegram-dev@telegram-dev', 'sheleg-dev': 'sheleg-dev@sheleg-dev',
};
/** What a reader says where a member is installed but not loaded. */
const enableHint = (m) => `not loaded here; enable with \`npx sshlg-skills domains --enable ${m}\``;
const KEEP_ON_HOOKS = 'kept on: ships hooks (a safety gate is not a listing)';

// npm package names, matched whole.
const NPM = [
  ['web3d-dev', /^(three|@react-three\/(fiber|drei))$/],
  ['telegram-dev', /^(grammy|telegraf|node-telegram-bot-api|telegram|@telegram-apps\/.+|@twa-dev\/sdk)$/],
  ['xr-dev', /^(@react-three\/xr|@meta-quest\/.+|@webxr-input-profiles\/.+|iwer|@iwer\/.+)$/],
  ['sheleg-dev', /^(stripe|@stripe\/.+|@sentry\/.+|posthog-js|posthog-node|react-ga4|@react-oauth\/google|google-auth-library|coinbase-commerce-node|@coinbase\/commerce-.+|@nowpayments\/.+|@cryptomus\/.+)$/],
];
// Python distribution names, compared normalised (PEP 503: case, `-`, `_`, `.` alike).
const PY = [
  ['telegram-dev', ['aiogram', 'python-telegram-bot', 'telethon', 'pyrogram', 'pytelegrambotapi']],
  ['sheleg-dev', ['stripe', 'sentry-sdk', 'posthog', 'google-auth', 'coinbase-commerce']],
  ['xr-dev', ['pyopenxr']],
];
// Text markers in build and platform files.
const TEXT = {
  gradle: [['xr-dev', /com\.meta\.xr|com\.meta\.spatial|meta-spatial-sdk|org\.khronos\.openxr|openxr_loader|com\.oculus/]],
  unity: [['xr-dev', /"(com\.meta\.xr[^"]*|com\.unity\.xr\.(openxr|oculus|meta-openxr)|com\.oculus[^"]*)"\s*:/]],
  android: [['xr-dev', /com\.oculus\.intent\.category\.VR|android\.hardware\.vr\.headtracking/]],
  cmake: [['xr-dev', /\bopenxr(_loader)?\b/i]],
  godot: [['xr-dev', /openxr\/enabled\s*=\s*true/]],
  source: [
    ['xr-dev', /\bnavigator\.xr\b/],
    ['sheleg-dev', /googletagmanager\.com\/gtag\/js|\bgtag\(\s*['"](config|event|consent)['"]/],
  ],
};
const SOURCE_EXT = /\.(m?jsx?|cjs|tsx?|vue|svelte|astro|html?)$/;
// The source markers as one POSIX ERE, for `git grep -E` in lib/domainscan.js.
const SOURCE_PATTERN = "navigator\\.xr|googletagmanager\\.com/gtag/js|gtag\\([[:space:]]*['\"](config|event|consent)['\"]";
const SOURCE_GLOBS = ['*.js', '*.jsx', '*.mjs', '*.cjs', '*.ts', '*.tsx', '*.vue', '*.svelte', '*.astro', '*.html', '*.htm'];

/** Which reader a repository-relative path gets, or null for a file that is not read. */
function kindOf(rel) {
  const p = String(rel).replace(/\\/g, '/');
  const base = p.slice(p.lastIndexOf('/') + 1);
  if (/(^|\/)Packages\/manifest\.json$/.test(p)) return 'unity';
  if (base === 'package.json') return 'npm';
  if (/^requirements[^/]*\.txt$/.test(base) || ['pyproject.toml', 'Pipfile', 'setup.py', 'setup.cfg'].includes(base)) return 'python';
  if (/\.gradle(\.kts)?$/.test(base) || base === 'libs.versions.toml') return 'gradle';
  if (base === 'AndroidManifest.xml') return 'android';
  if (base === 'CMakeLists.txt') return 'cmake';
  if (base === 'project.godot') return 'godot';
  if (SOURCE_EXT.test(base) && !/\.min\.js$/.test(base) && !/\.d\.ts$/.test(base)) return 'source';
  return null;
}

const norm = (s) => String(s).toLowerCase().replace(/[-_.]+/g, '-');

function pythonNames(base, text) {
  const out = new Set();
  const lineStart = /^\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*(\[[^\]]*\])?\s*([<>=~!;@ ]|$)/;
  if (/^requirements/.test(base) || base === 'setup.cfg') {
    for (const raw of text.split('\n')) {
      const line = raw.replace(/#.*$/, '');
      if (/^\s*-/.test(line)) continue; // -r, -e and other options
      const m = lineStart.exec(line);
      if (m && (base !== 'setup.cfg' || /^\s+/.test(raw))) out.add(norm(m[1]));
    }
  }
  if (!/^requirements/.test(base)) {
    // A quoted requirement: the name opens the string and a specifier or the quote follows.
    const quoted = /["']([A-Za-z0-9][A-Za-z0-9._-]*)(\[[^\]]*\])?\s*(?=[<>=~!;]|["'])/g;
    let m;
    while ((m = quoted.exec(text)) !== null) out.add(norm(m[1]));
    // Poetry / Pipfile tables: `name = "^1"` or `name = {version = …}`.
    for (const raw of text.split('\n')) {
      const k = /^\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*=\s*["{*]/.exec(raw.replace(/#.*$/, ''));
      if (k) out.add(norm(k[1]));
    }
  }
  return out;
}

/** Evidence one file carries: `[{member, kind, why}]`, `why` = "<rel>: <what matched>". */
function evidenceIn(rel, text) {
  const kind = kindOf(rel);
  if (!kind) return [];
  const src = String(text || '');
  const out = [];
  const add = (member, what) => {
    if (!out.some((e) => e.member === member && e.why.endsWith(`: ${what}`))) out.push({ member, kind, why: `${rel}: ${what}` });
  };
  if (kind === 'npm') {
    let data;
    try { data = JSON.parse(src); } catch (e) { return []; }
    if (!data || typeof data !== 'object') return [];
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const dep of Object.keys(data[field] || {})) {
        for (const [member, re] of NPM) if (re.test(dep)) add(member, dep);
      }
    }
    return out;
  }
  if (kind === 'python') {
    const base = String(rel).replace(/\\/g, '/').split('/').pop();
    const names = pythonNames(base, src);
    for (const [member, pkgs] of PY) for (const p of pkgs) if (names.has(norm(p))) add(member, p);
    return out;
  }
  for (const [member, re] of TEXT[kind] || []) {
    const m = re.exec(src);
    if (m) add(member, m[1] && kind === 'unity' ? m[1] : m[0]);
  }
  return out;
}

// Directories whose contents are not the project's own declarations.
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit',
  '.venv', 'venv', 'env', '__pycache__', 'Pods', 'DerivedData', 'Library', 'Temp', 'Logs', 'obj',
  'vendor', '.gradle', 'target', 'coverage', '.turbo', '.cache', 'third_party', '.expo', 'fixtures',
  '__fixtures__', 'testdata', '.claude', '.task-pipeline', 'site-packages', '.output', 'raw']);
const MAX_ENTRIES = 30000;
const MAX_DEPTH = 8;
const MAX_MANIFEST = 1024 * 1024;
const MAX_SOURCE = 256 * 1024;
const KEEP_WHY = 3;

/**
 * Walk one repository and collect its evidence — the fallback for a directory git cannot
 * list (`lib/domainscan.js` asks git first: faster, and it honours .gitignore). Reads, never writes; follows no symlink;
 * does not descend into a nested repository or submodule (a `.git` below the root) —
 * its declarations are its own. Bounded: `truncated` says the walk stopped early.
 * Source files are read only while a member they can prove is still unproven.
 */
function scan(dir, fs, path) {
  const evidence = {};
  let entries = 0;
  let truncated = false;
  const sourceMembers = TEXT.source.map(([m]) => m);
  const note = (ev) => {
    for (const e of ev) {
      const list = evidence[e.member] || (evidence[e.member] = []);
      if (list.length < KEEP_WHY && !list.includes(e.why)) list.push(e.why);
    }
  };
  const walk = (abs, rel, depth) => {
    let list;
    try { list = fs.readdirSync(abs, { withFileTypes: true }); } catch (e) { return; }
    list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    if (depth > 0 && list.some((d) => d.name === '.git')) return;
    const dirs = [];
    for (const d of list) {
      if (++entries > MAX_ENTRIES) { truncated = true; return; }
      const r = rel ? `${rel}/${d.name}` : d.name;
      if (d.isDirectory()) {
        if (!SKIP_DIRS.has(d.name) && !(d.name.startsWith('.') && d.name !== '.github')) dirs.push([d.name, r]);
        continue;
      }
      if (!d.isFile()) continue;
      const kind = kindOf(r);
      if (!kind) continue;
      if (kind === 'source' && sourceMembers.every((m) => evidence[m])) continue;
      const file = path.join(abs, d.name);
      let size = 0;
      try { size = fs.statSync(file).size; } catch (e) { continue; }
      if (size > (kind === 'source' ? MAX_SOURCE : MAX_MANIFEST)) continue;
      let text;
      try { text = fs.readFileSync(file, 'utf8'); } catch (e) { continue; }
      note(evidenceIn(r, text));
    }
    if (depth >= MAX_DEPTH) return;
    for (const [name, r] of dirs) {
      if (truncated) return;
      walk(path.join(abs, name), r, depth + 1);
    }
  };
  walk(dir, '', 0);
  return { evidence, truncated, entries };
}

/** Claude Code's name for a project's transcript directory: every non-alphanumeric → `-`. */
function encodeDir(abs) {
  return String(abs).replace(/[^A-Za-z0-9]/g, '-');
}

/**
 * The 60-day usage table (`uniq -c` lines: `<count> <encoded dir>\t<skill>`) as
 * encoded dir → {member: calls}. A skill counts for a member by its `member:` prefix or,
 * bare, by the member's own skill names. Lines that do not parse are skipped.
 */
function parseUsage(text, members) {
  const out = new Map();
  const byName = new Map();
  for (const m of members || []) for (const s of m.skillNames || []) byName.set(s, m.name);
  const names = new Set((members || []).map((m) => m.name));
  for (const line of String(text || '').split('\n')) {
    const m = /^\s*(\d+)\s+(\S+)\t(\S+)\s*$/.exec(line);
    if (!m) continue;
    const skill = m[3];
    const prefix = skill.includes(':') ? skill.split(':')[0] : null;
    const member = prefix ? (names.has(prefix) ? prefix : null) : byName.get(skill);
    if (!member) continue;
    const row = out.get(m[2]) || {};
    row[member] = (row[member] || 0) + Number(m[1]);
    out.set(m[2], row);
  }
  return out;
}

/** Read project choices without imposing the editor's narrower formatting contract. */
function readEnabled(text) {
  if (text === null || text === undefined) return { ok: true, enabled: {} };
  let data;
  try { data = JSON.parse(text); } catch (_) { return { ok: false, reason: 'invalid JSON' }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'not a JSON object' };
  const ep = data.enabledPlugins;
  if (ep === undefined) return { ok: true, enabled: {} };
  if (!ep || typeof ep !== 'object' || Array.isArray(ep)) return { ok: false, reason: 'enabledPlugins is not an object' };
  if (Object.values(ep).some((value) => typeof value !== 'boolean')) return { ok: false, reason: 'enabledPlugins has non-boolean values' };
  return { ok: true, enabled: ep };
}

/**
 * Edit `enabledPlugins` in a Claude settings file's text. `set` writes key → value;
 * `unset` removes a key only while it still holds the value given (else it is `kept`:
 * the operator changed it). The rest of the file comes back byte for byte: an edit is
 * accepted only for the 2-space form Claude Code writes, with or without its final
 * newline; anything else is refused rather than reformatted. `null` text is an absent
 * file, created only when there is something to set. An emptied `enabledPlugins` goes.
 */
function editEnabled(text, { set, unset, keepEmpty } = {}) {
  const sets = Object.entries(set || {});
  if (text === null || text === undefined) {
    if (!sets.length) return { ok: true, text: null, changed: [], kept: [] };
    const ep = {};
    for (const [k, v] of sets) ep[k] = v;
    return { ok: true, text: JSON.stringify({ enabledPlugins: ep }, null, 2) + '\n', changed: sets.map(([k]) => k), kept: [] };
  }
  let data;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, reason: `does not parse: ${e.message}` }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'is not a JSON object' };
  const pretty = JSON.stringify(data, null, 2);
  const nl = text === pretty + '\n';
  if (!nl && text !== pretty) return { ok: false, reason: 'is not in the 2-space JSON format Claude Code writes; refusing to reformat it' };
  if (data.enabledPlugins !== undefined && (typeof data.enabledPlugins !== 'object' || Array.isArray(data.enabledPlugins) || data.enabledPlugins === null)) {
    return { ok: false, reason: 'enabledPlugins is not an object' };
  }
  const ep = Object.assign({}, data.enabledPlugins || {});
  const changed = [];
  const kept = [];
  for (const [k, v] of sets) if (ep[k] !== v) { ep[k] = v; changed.push(k); }
  for (const [k, expected] of Object.entries(unset || {})) {
    if (ep[k] === expected) { delete ep[k]; changed.push(k); }
    else if (Object.prototype.hasOwnProperty.call(ep, k)) kept.push(k);
  }
  if (!changed.length) return { ok: true, text, changed, kept };
  // An emptied map goes, unless the caller knows the operator had one (keepEmpty).
  if (Object.keys(ep).length || keepEmpty) data.enabledPlugins = ep;
  else delete data.enabledPlugins;
  return { ok: true, text: JSON.stringify(data, null, 2) + (nl ? '\n' : ''), changed, kept };
}

/**
 * What `--apply` would do. Inputs are plain data:
 *   projects: [{dir, evidence: {member: [why]}, local: {key: value}, ignored: {ok, why} | () => {ok, why}}]
 *   user:     user-scope enabledPlugins
 *   owned:    the record `--apply` wrote last time, or null
 *   plugins:  member → "<plugin>@<marketplace>"
 *
 * A member is MANAGED while it is on at user scope and was not turned back on by the
 * operator after an `--apply`, or while it is off at user scope by this command's own
 * hand. Anything else is the operator's and left alone (`skipped`, with why).
 *
 * Add before remove: a member goes off at user scope only when every project with
 * evidence for it has, or is about to get, its entry. A project that cannot be written
 * (its git does not ignore the file) is `refused` and `blocked` keeps that member on —
 * and a member this command already turned off goes back on (`userOn`).
 * An entry the operator set false in a project is `respected` and blocks nothing.
 * A project read only in part (`partial`: the members it could not rule out) leaves those
 * members `uncertain`, and an uncertain member is not turned off either. `onlyAdd` (the
 * unattended update step) never turns anything off: `userOff` is empty, `wouldOff` says
 * what an interactive `--apply` would do. `keepOn` names members that are never scoped
 * (their plugin ships hooks), with the reason.
 */
function plan({ projects, user, owned, plugins, onlyAdd, keepOn }) {
  // This invariant also holds in an npm install without checked-out member sources.
  keepOn = Object.assign({}, keepOn || {}, { 'sheleg-dev': KEEP_ON_HOOKS });
  const ownedUser = (owned && owned.user) || {};
  const ownedProjects = (owned && owned.projects) || {};
  const u = user || {};
  const managed = {};
  const skipped = [];
  const keptOnBack = [];
  for (const member of DOMAIN_MEMBERS) {
    const key = (plugins || {})[member];
    if (!key) { skipped.push({ member, why: 'not in this release' }); continue; }
    const v = u[key];
    // A plugin that ships hooks carries a gate every session needs (sheleg-dev's money gate
    // denies refunds, payouts and live keys): it is never scoped, and one an older --apply
    // turned off goes back on.
    if ((keepOn || {})[member]) {
      skipped.push({ member, key, why: keepOn[member] });
      if (v === false && ownedUser[key] === false) keptOnBack.push(key);
      continue;
    }
    if (v === true && ownedUser[key] === false && !((owned && owned.pendingUser) || {})[key]) skipped.push({ member, key, why: 'turned back on at user scope since `domains --apply`; left as you set it' });
    else if (v === true) managed[member] = { key, off: false };
    else if (v === false && ownedUser[key] === false) managed[member] = { key, off: true };
    else if (v === false) skipped.push({ member, key, why: 'turned off at user scope by you; left alone' });
    else skipped.push({ member, key, why: 'not enabled at user scope here (not installed?)' });
  }
  const adds = [];
  const refused = [];
  const respected = [];
  const present = [];
  const blockedBy = {};
  const uncertainBy = {};
  for (const p of projects || []) {
    // A project read only in part cannot rule a member OUT: what it did not read may call
    // for it. Evidence it did find still counts (that member is ruled in, and gets its entry).
    for (const member of p.partial || []) {
      const m = managed[member];
      if (m && !(p.evidence || {})[member]) (uncertainBy[m.key] || (uncertainBy[m.key] = [])).push(p.dir);
    }
    const want = [];
    for (const member of Object.keys(p.evidence || {}).sort()) {
      const m = managed[member];
      if (!m) continue;
      const lv = (p.local || {})[m.key];
      if (lv === true) present.push({ dir: p.dir, key: m.key, ours: ((ownedProjects[p.dir] || {}).plugins || []).includes(m.key) });
      else if (lv === false) respected.push({ dir: p.dir, key: m.key });
      else want.push(m.key);
    }
    if (!want.length) continue;
    const ig = typeof p.ignored === 'function' ? p.ignored() : p.ignored;
    if (ig && ig.ok) adds.push({ dir: p.dir, keys: want });
    else {
      refused.push({ dir: p.dir, keys: want, why: (ig && ig.why) || 'not known to be ignored by git' });
      for (const k of want) (blockedBy[k] || (blockedBy[k] = [])).push(p.dir);
    }
  }
  const userOff = [];
  const userOn = keptOnBack.slice();
  for (const member of DOMAIN_MEMBERS) {
    const m = managed[member];
    if (!m) continue;
    if (!m.off && !blockedBy[m.key] && !uncertainBy[m.key]) userOff.push(m.key);
    // Already off by this command's hand, and a project that calls for it cannot get its
    // entry (one added since, or one whose file broke): the member goes back on machine-wide,
    // or that project would have it nowhere.
    if (m.off && (blockedBy[m.key] || uncertainBy[m.key])) userOn.push(m.key);
  }
  const blocked = Object.keys(blockedBy).sort().map((key) => ({ key, dirs: blockedBy[key] }));
  const uncertain = Object.keys(uncertainBy).sort().map((key) => ({ key, dirs: uncertainBy[key] }));
  // The unattended update step only adds: what an interactive --apply would turn off is
  // reported as `wouldOff`, never done.
  const wouldOff = userOff.slice();
  return { managed, skipped, adds, refused, respected, present, userOff: onlyAdd ? [] : userOff, wouldOff, userOn, blocked, uncertain };
}

/**
 * What `--revert` undoes, in order: user-scope values this command set false and that
 * are still false go back on FIRST, then project entries it added that still hold true
 * are removed. A value changed since is the operator's and stays.
 */
function revertPlan({ owned, user, locals }) {
  const u = user || {};
  const userOn = Object.keys((owned && owned.user) || {}).filter((k) => u[k] === false).sort();
  const unset = [];
  for (const dir of Object.keys((owned && owned.projects) || {}).sort()) {
    const lv = (locals || {})[dir] || {};
    const keys = (owned.projects[dir].plugins || []).filter((k) => lv[k] === true);
    if (keys.length) unset.push({ dir, keys });
  }
  return { userOn, unset };
}

/** Why a `domains.json` cannot be trusted, or null when its shape is the one written. */
function validRecord(r) {
  const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  if (!obj(r)) return 'it is not a JSON object';
  if (r.profile !== undefined && (typeof r.profile !== 'string' || !require('path').isAbsolute(r.profile))) return '`profile` is not an absolute settings path';
  if (r.roots !== undefined && !(Array.isArray(r.roots) && r.roots.every((x) => typeof x === 'string'))) return '`roots` is not a list of paths';
  if (!obj(r.user || {}) || Object.values(r.user || {}).some((v) => v !== false)) return '`user` is not a map of plugin → false';
  if (!obj(r.pendingUser || {}) || Object.values(r.pendingUser || {}).some((v) => v !== true)) return '`pendingUser` is not a map of plugin to true';
  if (!obj(r.projects || {})) return '`projects` is not a map';
  if (r.applied !== undefined && typeof r.applied !== 'boolean') return '`applied` is not true or false';
  if (!obj(r.manual || {})) return '`manual` is not a map';
  for (const [dir, ms] of Object.entries(r.manual || {})) {
    if (!Array.isArray(ms) || !ms.every((m) => DOMAIN_MEMBERS.includes(m))) return `manual entry ${dir} is not a list of domain members`;
  }
  for (const [dir, p] of Object.entries(r.projects || {})) {
    if (!obj(p) || !Array.isArray(p.plugins) || !p.plugins.every((k) => typeof k === 'string')) return `project ${dir} has no \`plugins\` list`;
    if (p.priorValues !== undefined && (!obj(p.priorValues) || Object.values(p.priorValues).some((v) => v !== false))) return `project ${dir} has invalid priorValues`;
  }
  return null;
}

/**
 * Is a usage table still inside its window? `skill-usage-60d-YYYY-MM-DD.tsv` covers the 60
 * days before its date; once that window has fully passed it describes nothing current.
 * The table is the operator's own measurement — no hub command produces it.
 */
function usageFresh(name, now) {
  const m = /^skill-usage-(\d+)d-(\d{4})-(\d{2})-(\d{2})\.tsv$/.exec(String(name));
  if (!m) return false;
  const at = Date.UTC(Number(m[2]), Number(m[3]) - 1, Number(m[4]));
  if (!Number(m[1]) || new Date(at).toISOString().slice(0, 10) !== `${m[2]}-${m[3]}-${m[4]}`) return false;
  const age = (now === undefined ? Date.now() : now) - at;
  return age >= 0 && age <= Number(m[1]) * 86400e3;
}

module.exports = {
  validRecord, usageFresh, PLUGIN_SPECS, enableHint, KEEP_ON_HOOKS,
  DOMAIN_MEMBERS, kindOf, evidenceIn, scan, encodeDir, parseUsage, readEnabled, editEnabled, plan, revertPlan,
  SKIP_DIRS, MAX_ENTRIES, SOURCE_PATTERN, SOURCE_GLOBS, SOURCE_MEMBERS: TEXT.source.map(([m]) => m),
};
