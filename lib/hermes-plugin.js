'use strict';
/**
 * B-284: the routing block for Hermes, as a plugin the hub owns.
 *
 * Hermes has no global instruction file (SOUL.md is its persona), but a plugin can freeze
 * text into every new session prompt through `register_system_prompt_section`. Measured
 * in Hermes Agent 0.22.2 (`hermes_cli/plugins_dispatch.py:70-74`, `plugins.py:957`): one
 * position (`after_memory`), 4,000 characters a section, 8,000 for every plugin's sections
 * together; a section over its own cap or past the total is skipped whole, never cut, and
 * plugins are opt-in (`plugins.py:1410`, nothing is enabled by default).
 *
 * So the compact block (the map, the protocol and the router table) goes into
 * `<hermes home>/plugins/sshlg-routing/routing.md` through the same writer as Windsurf's
 * capped file (`apply.applyCompact`: consent, opt-out line, backup, hand-edit guard). The
 * plugin beside it registers that file as two sections, split before the router table, and
 * reads the file at each new session, so an opt-out line or a deleted file silences it
 * without a restart. The hub enables the plugin with Hermes' own CLI, after a backup of
 * `config.yaml`.
 *
 * The 8,000 total is shared: Fabric's context section takes up to 4,000 (349 measured on
 * 2026-11-02). Sections render in id order, `fabric.context` before `sshlg.routing*`, so a
 * full Fabric section can push the router table out of a session; Hermes logs it.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const NAME = 'sshlg-routing';
const SECTION_CAP = 4000;
const TOTAL_CAP = 8000;
const TABLE_MARK = '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->';
const HEADER = '# sshlg-skills managed Hermes plugin (B-284). `npx sshlg-skills update` rewrites this file.';

const PLUGIN_YAML = [
  HEADER,
  `name: ${NAME}`,
  // The plugin's own format, not the hub's release: a hub release must not rewrite it.
  'version: 1.0.0',
  'description: The sshlg family routing map, frozen into each new Hermes session prompt.',
  'kind: standalone',
  "requires_hermes: '>=0.21.4'",
  '',
].join('\n');

const INIT_PY = [
  HEADER,
  '"""Register routing.md as two system-prompt sections; Hermes caps each at 4,000 characters."""',
  'import re',
  'from pathlib import Path',
  '',
  '_BLOCK = Path(__file__).resolve().parent / "routing.md"',
  `_TABLE = "${TABLE_MARK}"`,
  `_CAP = ${SECTION_CAP}`,
  '# The opt-out is a line holding only this comment, as the hub reads it (lib/routers.js OPTOUT_RE);',
  '# the block\'s own BEGIN line names the marker in its instructions.',
  '_OPTOUT = re.compile(r"^[ \\t]*<!-- SSHLG:ROUTERS:OPTOUT -->[ \\t]*$", re.M)',
  '',
  '',
  'def _parts():',
  '    try:',
  '        text = _BLOCK.read_text(encoding="utf-8")',
  '    except (OSError, UnicodeDecodeError):',
  '        return []',
  '    if _OPTOUT.search(text) or "SSHLG:ROUTERS:BEGIN" not in text:',
  '        return []',
  '    i = text.find(_TABLE)',
  '    parts = [text[:i], text[i:]] if i >= 0 else [text]',
  '    return [p.strip() for p in parts if p.strip()]',
  '',
  '',
  'def _section(n):',
  '    def render(_info):',
  '        parts = _parts()',
  '        return parts[n] if n < len(parts) and len(parts[n]) <= _CAP else ""',
  '    return render',
  '',
  '',
  'def register(ctx):',
  '    if not callable(getattr(ctx, "register_system_prompt_section", None)):',
  '        return',
  `    ctx.register_system_prompt_section("${NAME.replace('-', '.')}", _section(0), position="after_memory", max_chars=_CAP)`,
  `    ctx.register_system_prompt_section("${NAME.replace('-', '.')}.table", _section(1), position="after_memory", max_chars=_CAP)`,
  '',
].join('\n');

const FILES = { 'plugin.yaml': PLUGIN_YAML, '__init__.py': INIT_PY };

function hermesHome(home, env) {
  const e = env || {};
  return (e.HERMES_HOME && String(e.HERMES_HOME).trim()) || path.join(home, '.hermes');
}
function pluginDir(home, env) { return path.join(hermesHome(home, env), 'plugins', NAME); }

/** The two sections the plugin will register for a block, as Hermes strips them. Pure. */
function parts(block) {
  const text = String(block);
  const i = text.indexOf(TABLE_MARK);
  return (i < 0 ? [text] : [text.slice(0, i), text.slice(i)]).map((p) => p.trim()).filter(Boolean);
}

/** Why a block cannot ride in Hermes' caps, or null when it can. Pure. */
function overCap(block) {
  const p = parts(block);
  const big = p.map((x, n) => [n, x.length]).filter(([, len]) => len > SECTION_CAP);
  if (big.length) {
    return `Hermes skips a plugin section over ${SECTION_CAP} characters whole; section ${big[0][0] + 1} of the routing block `
      + `is ${big[0][1]}; nothing written`;
  }
  const total = p.reduce((s, x) => s + x.length, 0);
  if (total > TOTAL_CAP) return `the routing sections are ${total} characters, over the ${TOTAL_CAP} Hermes allows all plugins together; nothing written`;
  return null;
}

/**
 * The plugin's own files: written when absent or when they still hold an earlier hub
 * version (they carry HEADER); a file without it is somebody's and is left as it is.
 */
function ensureFiles(dir, protect) {
  const out = [];
  for (const [name, body] of Object.entries(FILES)) {
    const file = path.join(dir, name);
    let cur = null;
    try { cur = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') return { action: 'unreadable', file, reason: e.code }; }
    if (cur === body) continue;
    if (cur !== null && !cur.startsWith(HEADER)) {
      return { action: 'kept', file, reason: `${file} was not written by sshlg-skills; left as it is and the plugin was not enabled` };
    }
    const saved = protect(file);
    if (saved.action === 'backup-failed') return { action: 'backup-failed', file, reason: saved.error };
    require('./atomicwrite.js').write(file, body);
    out.push(name);
  }
  return { action: out.length ? 'written' : 'unchanged', files: out };
}

function hermesRun(args, env) {
  const r = spawnSync('hermes', args, { encoding: 'utf8', env: env || process.env, timeout: 60000,
    stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
  if (r.error) return { ok: false, missing: r.error.code === 'ENOENT', said: r.error.message };
  return { ok: r.status === 0, said: `${r.stdout || ''}${r.stderr || ''}`.trim(), out: String(r.stdout || '') };
}

/** `plugins.enabled` as Hermes reads it: a list, or {reason}. */
function enabledList(env, run) {
  const r = (run || hermesRun)(['config', 'get', '--json', 'plugins.enabled'], env);
  if (r.missing) return { reason: 'the hermes CLI is not on PATH' };
  if (!r.ok) return /not set/i.test(r.said) ? { list: [] } : { reason: `hermes config get failed: ${r.said.split('\n')[0]}` };
  try {
    const v = JSON.parse((r.out || '').trim() || 'null');
    if (v === null) return { list: [] };
    return Array.isArray(v) ? { list: v.map(String) } : { reason: 'plugins.enabled is not a list' };
  } catch (e) { return { reason: `hermes config get printed something other than JSON (${e.message})` }; }
}

/**
 * Enable the plugin when it is not, after a backup of config.yaml; read back. `deps`:
 * env, protect(file), run(args, env) (defaults to the hermes CLI), configFile.
 */
function ensureEnabled(deps) {
  const run = deps.run || hermesRun;
  const before = enabledList(deps.env, run);
  if (before.reason) return { action: 'unread', reason: before.reason };
  if (before.list.includes(NAME)) return { action: 'already' };
  const saved = deps.protect(deps.configFile);
  if (saved.action === 'backup-failed') return { action: 'backup-failed', reason: saved.error };
  const r = run(['plugins', 'enable', NAME, '--no-allow-tool-override'], deps.env);
  if (!r.ok) return { action: 'failed', reason: `hermes plugins enable failed: ${(r.said || '').split('\n')[0]}` };
  const after = enabledList(deps.env, run);
  if (after.reason || !after.list.includes(NAME)) {
    return { action: 'failed', reason: `hermes plugins enable exited 0 but plugins.enabled does not list ${NAME}` };
  }
  return { action: 'enabled' };
}

/**
 * The Hermes row of `apply.applyExtra`. The block file goes through `applyCompact`; once
 * it holds the block, the plugin files and the enablement follow. `api` is
 * {applyCompact, renderCompact, protect} from apply.js (no require cycle).
 */
function apply(t, file, opts, api) {
  const block = api.renderCompact(opts.routers || {}, opts);
  const why = overCap(block);
  if (why) return { file, action: 'over-cap', reason: why };
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    // A "no" leaves no plugin directory behind just to hold an opt-out line.
    if (opts.consent === 'no') return { file, action: 'absent' };
    // The directory is made exactly when applyCompact would write the block into it.
    if (!opts.dryRun && opts.consent === 'yes' && (opts.mode === 'install' || opts.consentRecorded === 'yes')) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  const record = api.applyCompact(file, opts.routers || {}, TOTAL_CAP, opts);
  if (opts.dryRun || !['created', 'updated', 'unchanged'].includes(record.action)) return record;
  const protect = (f) => api.protect(f, opts);
  const files = ensureFiles(dir, protect);
  const lines = [];
  if (files.action === 'written') lines.push(`Hermes plugin ${dir}: wrote ${files.files.join(', ')}`);
  if (files.reason) lines.push(files.reason);
  let enabled = null;
  if (['written', 'unchanged'].includes(files.action)) {
    enabled = ensureEnabled({ env: (opts && opts.env) || process.env, protect, run: opts.hermesRun,
      configFile: path.join(hermesHome(opts.home, (opts && opts.env) || process.env), 'config.yaml') });
    if (enabled.action === 'enabled') lines.push(`Hermes plugin ${NAME}: enabled (hermes plugins enable); new Hermes sessions carry the routing map`);
    else if (enabled.action !== 'already') lines.push(`Hermes plugin ${NAME}: not enabled: ${enabled.reason}. Run: hermes plugins enable ${NAME}`);
  }
  record.plugin = { files: files.action, enabled: enabled && enabled.action, lines };
  return record;
}

module.exports = { NAME, SECTION_CAP, TOTAL_CAP, HEADER, FILES, PLUGIN_YAML, INIT_PY, hermesHome, pluginDir, parts, overCap, ensureFiles, enabledList, ensureEnabled, apply };
