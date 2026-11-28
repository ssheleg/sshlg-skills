'use strict';
/**
 * `audit skills`: the walker half of the read-only skills audit (B-368, ST-18).
 *
 * It reads what Claude Code loads (the plugin and plain skills `conflicts` already
 * reads, the installed plugin versions, the `skillUsage` counter) and, with
 * `--project <root>`, the project's own `.claude/skills` and `.agents/skills`; then it
 * hands the listings to `lib/skillsaudit.js`, which decides. It writes nothing.
 *
 * Runners other than Claude Code whose home exists here are named in `degraded` with
 * the reason, so a harness shows "not read" rather than an empty list (PS-1). Reading
 * Codex, Hermes and Pi is B-368's next step.
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

  const others = [
    { id: 'codex', dir: process.env.CODEX_HOME || path.join(home, '.codex') },
    { id: 'hermes', dir: path.join(home, '.hermes') },
    { id: 'pi', dir: path.join(home, '.pi') },
  ];
  for (const r of others) {
    if (fs.existsSync(r.dir)) runners.push({ id: r.id, profile: r.dir, read: false, reason: 'not read by this release (B-368 next step)' });
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

module.exports = { cmdAudit, collect, parse };
