'use strict';
/**
 * `audit skills`: the walker half of the read-only skills audit (B-368, ST-18).
 *
 * It reads what Claude Code loads (the plugin and plain skills `conflicts` already
 * reads, the installed plugin versions, the `skillUsage` counter) and, with
 * `--project <root>`, the project's own `.claude/skills` and `.agents/skills`; then it
 * hands the listings to `lib/skillsaudit.js`, which decides. It writes nothing.
 *
 * Codex is read from its plugin cache (`<CODEX_HOME>/plugins/cache/<marketplace>/<plugin>/
 * <version>/skills/<id>`, the newest version folder of each plugin) and its plain
 * `<CODEX_HOME>/skills/<id>`. A plugin `config.toml` marks `enabled = false` is skipped;
 * one with no readable flag counts (an unreadable flag never hides a plugin).
 * Pi is read the way Pi 1.1.0 discovers skills (`lib/pi.js`): its user roots
 * `<PI_CODING_AGENT_DIR or ~/.pi/agent>/skills` and `~/.agents/skills` as global copies, and,
 * with `--project`, `.pi/skills` and `.agents/skills` up to the git root as project copies,
 * only when Pi trusts the project (a project it asks about is read and noted).
 * Hermes is read from its profile folder `<HERMES_HOME or ~/.hermes>/skills`, walked as Hermes
 * walks it (agent/skill_utils.py `iter_skill_index_files`: links followed, `.archive`, VCS and
 * dependency folders pruned, a skill's `references`/`templates`/`assets`/`scripts` not
 * scanned), named by the front matter's `name` or the folder, minus `skills.disabled` in
 * its config.yaml. Its `external_dirs`, `create_dir`, plugin and project skills are not read,
 * and the runner's note says so (PS-1: a part not read is named, never shown as empty).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const { ROOT, log, manifest } = require('./cli-core.js');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
}

function projectCopies(root) {
  const out = [];
  for (const rel of ['.claude/skills', '.agents/skills']) {
    const dir = path.join(root, rel);
    let names = [];
    try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { continue; }
    for (const d of names) {
      if (!d.isDirectory() && !d.isSymbolicLink()) continue;
      const at = path.join(dir, d.name);
      let callable = false;
      try { callable = fs.statSync(path.join(fs.realpathSync(at), 'SKILL.md')).isFile(); } catch (_) { callable = false; }
      out.push({ name: d.name, scope: 'project', channel: 'plain', plugin: null, version: null, path: at, callable });
    }
  }
  return out;
}

/** Codex's skills: the newest cached version of each plugin, then its plain skills folder. */
function codexCopies(codexHome) {
  const { compareVersions, codexPluginFlags } = require('./skillsaudit.js');
  let flags = new Map();
  try { flags = codexPluginFlags(fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8')); } catch (_) { flags = new Map(); }
  const ls = (d) => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return []; } };
  const callableAt = (dir) => { try { return fs.statSync(path.join(fs.realpathSync(dir), 'SKILL.md')).isFile(); } catch (_) { return false; } };
  const out = [];
  const cache = path.join(codexHome, 'plugins', 'cache');
  for (const mkt of ls(cache).filter((d) => d.isDirectory())) {
    for (const plug of ls(path.join(cache, mkt.name)).filter((d) => d.isDirectory())) {
      if (flags.get(`${plug.name}@${mkt.name}`) === false) continue; // disabled in config.toml: Codex does not load it
      const versions = ls(path.join(cache, mkt.name, plug.name)).filter((d) => d.isDirectory()).map((d) => d.name)
        .sort((a, b) => (compareVersions(a, b) === null ? a.localeCompare(b) : compareVersions(a, b)));
      const version = versions[versions.length - 1];
      if (!version) continue;
      const base = path.join(cache, mkt.name, plug.name, version, 'skills');
      for (const d of ls(base)) {
        if (!d.isDirectory() && !d.isSymbolicLink()) continue;
        const dir = path.join(base, d.name);
        if (!callableAt(dir)) continue;
        out.push({ name: d.name, scope: 'global', channel: 'plugin', plugin: `${plug.name}@${mkt.name}`, version, path: path.join(dir, 'SKILL.md'), callable: true });
      }
    }
  }
  const plain = path.join(codexHome, 'skills');
  for (const d of ls(plain)) {
    if (d.name.startsWith('.') || (!d.isDirectory() && !d.isSymbolicLink())) continue;
    const dir = path.join(plain, d.name);
    out.push({ name: d.name, scope: 'global', channel: 'plain', plugin: null, version: null, path: dir, callable: callableAt(dir) });
  }
  return out;
}

/** Pi's skills: user roots as global copies; project roots when Pi loads them. */
function piCopies(home, env, project) {
  const pi = require('./pi.js');
  const agentDir = env.PI_CODING_AGENT_DIR || path.join(home, '.pi', 'agent');
  const userAgents = path.join(home, '.agents', 'skills');
  const out = [];
  const seenRoot = new Set();
  const add = (root, scope) => {
    let rr = null;
    try { rr = fs.realpathSync(root); } catch (_) { return; }
    if (seenRoot.has(rr)) return; // the same directory twice in Pi's list is read once
    seenRoot.add(rr);
    for (const s of pi.scan(root)) out.push({ name: s.name, scope, channel: 'plain', plugin: null, version: null, path: s.path, real: s.real, callable: true });
  };
  let note = null;
  if (project) {
    const trust = pi.projectTrust({ home, env, cwd: project });
    if (trust.verdict === 'untrusted' || trust.verdict === 'unknown') {
      note = `project skills not loaded (Pi trust: ${trust.verdict}${trust.reason ? `, ${trust.reason}` : ''})`;
    } else {
      if (trust.verdict === 'asks') note = 'project skills load only once the person accepts Pi\'s trust prompt (a headless run does not load them)';
      add(path.join(project, '.pi', 'skills'), 'project');
      for (const d of pi.projectDirs(project)) {
        const p = path.join(d, '.agents', 'skills');
        if (path.resolve(p) !== path.resolve(userAgents)) add(p, 'project');
      }
    }
  }
  add(path.join(agentDir, 'skills'), 'global');
  add(userAgents, 'global');
  return { copies: out, note };
}

const HERMES_EXCLUDED = new Set(['.git', '.github', '.hub', '.archive', '.curator_backups', '.locks',
  '.venv', 'venv', 'node_modules', 'site-packages', '__pycache__', '.tox', '.nox', '.pytest_cache', '.mypy_cache', '.ruff_cache']);
const HERMES_SUPPORT = new Set(['references', 'templates', 'assets', 'scripts']);
const HERMES_MAX_DEPTH = 8;

/** Hermes' profile skills: every SKILL.md under `<hermesHome>/skills`, minus `skills.disabled`. */
function hermesCopies(hermesHome) {
  const { hermesDisabled, frontmatterName } = require('./skillsaudit.js');
  let disabled = new Set();
  try { disabled = hermesDisabled(fs.readFileSync(path.join(hermesHome, 'config.yaml'), 'utf8')); } catch (_) { disabled = new Set(); }
  const out = [];
  const seen = new Set();
  (function walk(dir, depth) {
    let rd = null;
    try { rd = fs.realpathSync(dir); } catch (_) { return; }
    if (seen.has(rd) || depth > HERMES_MAX_DEPTH) return; // a link loop, or deeper than any skill tree
    seen.add(rd);
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    const isSkill = ents.some((e) => e.name === 'SKILL.md' && !e.isDirectory());
    if (isSkill) {
      const md = path.join(dir, 'SKILL.md');
      let head = '';
      try { const fd = fs.openSync(md, 'r'); const b = Buffer.alloc(4000); const n = fs.readSync(fd, b, 0, 4000, 0); fs.closeSync(fd); head = b.slice(0, n).toString('utf8'); } catch (_) { head = ''; }
      const name = frontmatterName(head) || path.basename(dir);
      if (!disabled.has(name)) out.push({ name, scope: 'global', channel: 'plain', plugin: null, version: null, path: dir, real: rd, callable: true });
    }
    for (const e of ents.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (HERMES_EXCLUDED.has(e.name) || (isSkill && HERMES_SUPPORT.has(e.name))) continue;
      const p = path.join(dir, e.name);
      let isDir = e.isDirectory();
      if (!isDir && e.isSymbolicLink()) { try { isDir = fs.statSync(p).isDirectory(); } catch (_) { isDir = false; } }
      if (isDir) walk(p, depth + 1);
    }
  })(path.join(hermesHome, 'skills'), 0);
  return { copies: out, disabled: disabled.size };
}

/** Everything the decision module needs, read from this machine. Never writes. */
function collect(opts) {
  const o = opts || {};
  const home = o.home || process.env.HOME || os.homedir();
  const apply = require('./apply.js');
  const claudeRoot = apply.hostRoot(apply.TARGETS.find((t) => t.agent === 'claude'), home);
  const runners = [];

  const claude = { id: 'claude-code', profile: claudeRoot, copies: [] };
  try {
    const conflicts = require('./conflicts.js');
    const skills = conflicts.readSkills(home, { claudeRoot, cwd: o.project || process.cwd() });
    const registry = (readJson(path.join(claudeRoot, 'plugins', 'installed_plugins.json')) || {}).plugins || {};
    for (const s of skills) {
      const isPlugin = s.namespace === 'claude:plugin';
      const rec = isPlugin && Array.isArray(registry[s.plugin]) ? registry[s.plugin][0] : null;
      claude.copies.push({
        name: s.id, scope: 'global', channel: isPlugin ? 'plugin' : 'plain',
        plugin: isPlugin ? s.plugin : null, version: rec && rec.version ? String(rec.version) : null,
        path: isPlugin ? s.path : path.join(claudeRoot, 'skills', s.id), callable: s.callable !== false,
      });
    }
    if (o.project) claude.copies.push(...projectCopies(o.project));
  } catch (e) {
    claude.read = false;
    claude.reason = `cannot read the installed skills (${e.code || e.message})`;
  }
  runners.push(claude);

  const codexHome = process.env.CODEX_HOME || path.join(home, '.codex');
  if (fs.existsSync(codexHome)) {
    const codex = { id: 'codex', profile: codexHome, copies: [] };
    try {
      codex.copies = codexCopies(codexHome);
      if (o.project) codex.copies.push(...projectCopies(o.project).filter((c) => c.path.includes(`${path.sep}.agents${path.sep}`)));
    } catch (e) { codex.read = false; codex.reason = `cannot read the Codex skills (${e.code || e.message})`; }
    runners.push(codex);
  }

  const env = o.env || process.env;
  const piDir = env.PI_CODING_AGENT_DIR || path.join(home, '.pi', 'agent');
  if (fs.existsSync(piDir)) {
    const pi = { id: 'pi', profile: piDir, copies: [] };
    try {
      const got = piCopies(home, env, o.project);
      pi.copies = got.copies;
      if (got.note) pi.note = got.note;
    } catch (e) { pi.read = false; pi.reason = `cannot read the Pi skills (${e.code || e.message})`; }
    runners.push(pi);
  }

  const hermesHome = (env.HERMES_HOME && String(env.HERMES_HOME).trim()) || path.join(home, '.hermes');
  if (fs.existsSync(path.join(hermesHome, 'skills'))) {
    const hermes = { id: 'hermes', profile: hermesHome, copies: [] };
    try {
      const got = hermesCopies(hermesHome);
      hermes.copies = got.copies;
      hermes.note = `profile skills only (${got.disabled} disabled in config.yaml left out); skills.external_dirs, skills.create_dir, plugin and project skills not read`;
    } catch (e) { hermes.read = false; hermes.reason = `cannot read the Hermes skills (${e.code || e.message})`; }
    runners.push(hermes);
  }

  const usagePath = path.join(process.env.CLAUDE_CONFIG_DIR ? claudeRoot : home, '.claude.json');
  const raw = (readJson(usagePath) || {}).skillUsage;
  const usage = { 'claude-code': {} };
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [name, v] of Object.entries(raw)) {
      if (v && typeof v === 'object' && Number.isFinite(v.lastUsedAt)) usage['claude-code'][name] = v.lastUsedAt;
    }
  }

  const pins = {};
  const ownedPlugins = [];
  const routed = [];
  for (const m of manifest.skills) {
    if (m.pluginInstall) {
      ownedPlugins.push(m.pluginInstall);
      if (m.version) pins[m.pluginInstall.split('@')[0]] = m.version;
    }
    routed.push(m.name, ...(m.skillNames || []));
  }
  try {
    const triggers = require(path.join(ROOT, 'lib', 'triggers.js'));
    const configLib = require(path.join(ROOT, 'lib', 'config.js'));
    for (const e of triggers.externalRoutes(configLib.externalGet(configLib.readConfig(home)))) routed.push(e.skill);
  } catch (_) { /* no declared routes: the family's own still count */ }

  return { runners, pins, ownedPlugins, routed, usage, now: Date.now(), days: o.days };
}

function parse(args) {
  const f = { json: false, full: false, project: null, days: 60 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') f.json = true;
    else if (a === '--full') f.full = true;
    else if (a === '--project' || a === '--days') {
      const v = args[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`);
      if (a === '--project') f.project = path.resolve(v);
      else {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1) throw new Error('--days needs a whole number of days, 1 or more');
        f.days = n;
      }
    }
  }
  return f;
}

function cmdAudit(rest) {
  const [what, ...args] = rest || [];
  if (what !== 'skills') {
    log(what ? `audit: unknown subject ${what} (only: skills)` : 'audit: name what to audit: npx sshlg-skills audit skills [--json]');
    return 2;
  }
  let f;
  try { f = parse(args); } catch (e) { log(`audit skills: ${e.message}`); return 2; }
  if (f.project && !fs.existsSync(f.project)) { log(`audit skills: --project ${f.project} does not exist`); return 2; }
  const A = require('./skillsaudit.js');
  const report = A.audit(collect({ project: f.project, days: f.days }));
  if (f.project) report.project = f.project;
  // writeSync: main() calls process.exit, which cuts an async write to a pipe short.
  if (f.json) fs.writeSync(1, `${JSON.stringify(report, null, 2)}\n`);
  else log(A.render(report, { full: f.full, days: f.days }));
  return 0;
}

module.exports = { cmdAudit, collect, parse, piCopies, hermesCopies };
