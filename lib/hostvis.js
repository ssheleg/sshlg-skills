'use strict';
/**
 * Hiding the operator-marked packs on the hosts beyond Claude and Codex — each through
 * that host's OWN switch, never by deleting, moving or editing a skill file.
 *
 * The decisions are `lib/visibility.js`'s; this module reads each host's skill roots and
 * settings and writes the one value that host documents for switching a skill off. What
 * was researched on 2026-10-13, per host (sources in the README's visibility section):
 *
 * - Gemini CLI 0.63.0: `skills.disabled` in `<gemini dir>/settings.json` — exactly what
 *   `gemini skills disable <name> --scope user` writes (`skillSettings.ts`), matched by
 *   skill name, case-insensitively; `SkillManager.getSkills()` drops disabled skills.
 * - Pi 1.1.0: the `skills` array in `<agent dir>/settings.json` with `-<path>` entries,
 *   "exact exclusion" (docs/settings.md#resources; `isEnabledByOverrides` in
 *   dist/core/package-manager.js). One entry per root the skill is found in.
 * - Hermes 0.21.4: `skills.disabled` in config.yaml, written by its own CLI
 *   (`hermes config set skills.disabled '<json list>'`) — the list `hermes skills config`
 *   edits interactively and `_find_all_skills` skips.
 * - OpenCode 1.18.10: `permission.skill.<name> = "deny"` in opencode.json; `Skill.available`
 *   drops a denied skill from the listing and the call is refused.
 * - Cursor agent 2026.09.02: no per-skill switch; its model filter reads the skill's own
 *   `disable-model-invocation` front matter, and a third-party SKILL.md is never edited.
 *   Kimi 2.1.1: a permission rule refuses the call but the listing keeps the skill — not
 *   hiding, so not applied.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const V = require('./visibility.js');
const apply = require('./apply.js');

const target = (agent) => apply.TARGETS.find((t) => t.agent === agent);

/** The front-matter `name:` of a SKILL.md, or null. */
function skillName(file, opts) {
  let text;
  try { text = fs.readFileSync(file, 'utf8').slice(0, 4000); } catch (e) {
    if (opts && opts.strict && e.code !== 'ENOENT') throw e;
    return null;
  }
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const n = /^name:\s*(.+?)\s*$/m.exec(m[1]);
  return n ? n[1].replace(/^(['"])(.*)\1$/, '$2') : null;
}

/** Each skill directory directly under `root` (symlinks followed): { dir, base, name }. */
function readRoot(root, opts) {
  let names = [];
  try { names = fs.readdirSync(root); } catch (e) {
    if (opts && opts.strict && e.code !== 'ENOENT') throw e;
    return [];
  }
  const out = [];
  for (const base of names.sort()) {
    if (base.startsWith('.')) continue;
    const dir = path.join(root, base);
    const file = path.join(dir, 'SKILL.md');
    try { if (!fs.statSync(file).isFile()) continue; } catch (e) {
      if (opts && opts.strict && !['ENOENT', 'ENOTDIR'].includes(e.code)) throw e;
      continue;
    }
    out.push({ dir, base, name: skillName(file, opts) || base });
  }
  return out;
}

/** name → pack (`owner/repo`) from the skills CLI's lock; empty when there is none. */
function readLock(home, opts) {
  const out = new Map();
  try {
    const data = JSON.parse(fs.readFileSync(path.join(home, '.agents', '.skill-lock.json'), 'utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)
      || !data.skills || typeof data.skills !== 'object' || Array.isArray(data.skills)) throw new Error('skill lock has no skills object');
    if (opts && opts.strict && Object.values(data.skills).some((v) => !v || typeof v !== 'object'
      || Array.isArray(v) || typeof v.source !== 'string' || !v.source.trim()))
      throw new Error('skill lock has an invalid source entry');
    // Keyed lower-case: a skill directory, its front-matter name and the lock may each
    // spell one skill differently on a case-insensitive filesystem.
    for (const [n, v] of Object.entries(data.skills || {})) if (v && typeof v.source === 'string') out.set(n.toLowerCase(), v.source);
  } catch (e) {
    if (opts && opts.strict && e.code !== 'ENOENT') throw new Error(`cannot read skill lock (${e.code || 'invalid JSON/shape'})`);
    /* no lock: no pack is known, so nothing is hidden by pack */
  }
  return out;
}

function packOf(entry, lock) {
  let real = entry.dir;
  try { real = fs.realpathSync(entry.dir); } catch (e) { /* keep the link path */ }
  const get = (k) => lock.get(String(k).toLowerCase());
  return get(entry.base) || get(path.basename(real)) || get(entry.name) || null;
}

/**
 * The hosts, as found under `home` and `env`. `present` is false for a host this machine
 * does not have; `cannot` names why a present host has no supported switch.
 */
function hosts(home, env) {
  const e = env || process.env;
  const gemini = apply.hostRoot(target('gemini'), home, { env: e });
  const pi = apply.hostRoot(target('pi'), home, { env: e });
  const shared = path.join(home, '.agents', 'skills');
  // GEMINI_CLI_HOME replaces HOME for Gemini alone (B-204): its shared root moves with it.
  const geminiShared = path.join(e.GEMINI_CLI_HOME || home, '.agents', 'skills');
  const xdg = e.XDG_CONFIG_HOME || path.join(home, '.config');
  const opencode = path.join(xdg, 'opencode');
  const hermes = e.HERMES_HOME || path.join(home, '.hermes');
  const kimi = [path.join(home, '.kimi-code'), path.join(home, '.kimi')].find((d) => fs.existsSync(d));
  const ocJsonc = path.join(opencode, 'opencode.jsonc');
  const ocJson = path.join(opencode, 'opencode.json');
  return [
    {
      id: 'gemini', present: fs.existsSync(gemini), kind: 'json-list',
      roots: [path.join(gemini, 'skills'), geminiShared], file: path.join(gemini, 'settings.json'), keys: ['skills', 'disabled'],
      label: `${path.join(gemini, 'settings.json')} skills.disabled`,
    },
    {
      id: 'pi', present: fs.existsSync(pi), kind: 'json-list', create: true, newline: false, byPath: true,
      roots: [shared, path.join(pi, 'skills')], file: path.join(pi, 'settings.json'), keys: ['skills'],
      label: `${path.join(pi, 'settings.json')} skills ("-<path>" exact exclusions)`,
    },
    {
      id: 'opencode', present: fs.existsSync(opencode), kind: 'json-map', value: 'deny',
      roots: [path.join(home, '.claude', 'skills'), shared, path.join(opencode, 'skills'), path.join(opencode, 'skill')],
      file: ocJson, keys: ['permission', 'skill'],
      refuse: !fs.existsSync(ocJson) && fs.existsSync(ocJsonc)
        ? 'its config is opencode.jsonc (comments); add permission.skill entries by hand' : null,
      label: `${ocJson} permission.skill.<name> = "deny"`,
    },
    {
      id: 'hermes', present: fs.existsSync(hermes), kind: 'hermes-cli',
      roots: [path.join(hermes, 'skills')], file: path.join(hermes, 'config.yaml'),
      label: 'hermes config set skills.disabled',
    },
    {
      id: 'cursor', present: fs.existsSync(path.join(home, '.cursor')),
      cannot: 'Cursor agent CLI 2026.09.02 has no per-skill switch (only a skill\'s own disable-model-invocation front matter, and a third-party SKILL.md is not edited)',
    },
    {
      id: 'kimi', present: !!kimi,
      cannot: 'Kimi 2.1.1 can only refuse the call ([[permission.rules]] decision="deny" pattern="Skill(<name>)"); the listing keeps the skill',
    },
    {
      // B-205: Goose read ~/.agents/skills and was skipped without a word.
      id: 'goose', present: fs.existsSync(path.join(xdg, 'goose')),
      cannot: 'Goose 1.44.0 has no per-skill switch (config.yaml can only turn the whole `skills` extension off; `goose skills` only lists)',
    },
  ];
}

/** Every skill a host reads, with its pack: [{ name, pack, dirs: [...] }]. */
function inventory(host, lock, opts) {
  const byName = new Map();
  for (const root of host.roots) {
    for (const entry of readRoot(root, opts)) {
      const cur = byName.get(entry.name) || { name: entry.name, pack: null, dirs: [], bases: new Set() };
      cur.pack = cur.pack || packOf(entry, lock);
      cur.dirs.push(entry.dir);
      cur.bases.add(entry.base);
      byName.set(entry.name, cur);
    }
  }
  return [...byName.values()];
}

/** The items a host's switch takes for `names`: names, or Pi's `-<path>` exclusions. */
function items(host, skills, names) {
  if (!host.byPath) return names.slice().sort();
  const want = new Set(names);
  const out = [];
  for (const s of skills) if (want.has(s.name)) for (const d of s.dirs) out.push(`-${d}`);
  return out.sort();
}

// ── Hermes, through its own CLI ──

function hermesRun(args, env) {
  const r = spawnSync('hermes', args, { encoding: 'utf8', env: env || process.env, timeout: 60000 });
  if (r.error) return { ok: false, missing: r.error.code === 'ENOENT', reason: r.error.message };
  return { ok: r.status === 0, status: r.status, out: String(r.stdout || ''), err: String(r.stderr || '') };
}

/** The current `skills.disabled` list, [] when unset, or { reason } when unreadable. */
function hermesRead(env) {
  const r = hermesRun(['config', 'get', '--json', 'skills.disabled'], env);
  if (r.missing) return { reason: 'the hermes CLI is not on PATH' };
  const said = `${r.out || ''}${r.err || ''}`;
  if (!r.ok) return /not set/i.test(said) ? { list: [] } : { reason: `hermes config get failed: ${said.trim().split('\n')[0]}` };
  try {
    const v = JSON.parse(r.out.trim() || 'null');
    if (v === null) return { list: [] };
    if (!Array.isArray(v)) return { reason: 'skills.disabled is not a list; edit it by hand' };
    return { list: v.map(String) };
  } catch (e) { return { reason: `hermes config get printed something other than JSON (${e.message})` }; }
}

function hermesWrite(list, env) {
  const r = list.length
    ? hermesRun(['config', 'set', 'skills.disabled', JSON.stringify(list)], env)
    : hermesRun(['config', 'unset', 'skills.disabled'], env);
  if (r.missing) return { reason: 'the hermes CLI is not on PATH' };
  if (!r.ok) return { reason: `hermes config ${list.length ? 'set' : 'unset'} failed: ${`${r.out}${r.err}`.trim().split('\n')[0]}` };
  return {};
}

module.exports = { hosts, inventory, items, readLock, readRoot, skillName, hermesRead, hermesWrite, target };
