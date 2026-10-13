'use strict';
/**
 * Which skills keep their place in a host's model-facing listing — decided here, from
 * data handed in. No filesystem access: `bin/sshlg-skills.js` reads, backs up and writes.
 *
 * Why it exists. Measured 2026-10-10 on the operator's machine: Claude Code logged
 * `Skill listing over budget: 634 skills, 274398 chars > 30000 budget`, and Codex logged
 * that it removed every description and dropped 220 skills from the model-visible list —
 * `task-pipeline` among them. A host that overflows drops descriptions (Claude: least used
 * first) or whole skills (Codex), so which skills an agent can SEE became an accident of
 * the catalogue's size. Names alone cost Claude ~13.6k of its 30k characters.
 *
 * The operator's design (2026-10-10): a small CORE stays listed — the family, what was
 * used recently, and what the operator's own instructions name in backticks. Everything
 * else is hidden from the model and reached by the first step every task now takes:
 * read the meaning, search the whole catalogue (`toolkit --find`), open the SKILL.md.
 * Hiding deletes nothing: Claude keeps a hidden skill in its `/` menu
 * (`skillOverrides: "user-invocable-only"`), Codex keeps the file (`enabled = false`).
 *
 * Ownership. The launcher records what it wrote and its revert removes only that, and
 * only while the value is still the one it set — a value the operator changed since is
 * theirs. A key the operator set before the launcher ran is never planned over.
 */

const HIDE = 'user-invocable-only';
const DESC_CAP = 1536;
const DEFAULT_DAYS = 60;

/** Skill names the instruction text references deliberately: inside backticks. */
function namedIn(text, names) {
  const out = new Set();
  const src = String(text || '');
  for (const n of names || []) {
    if (src.includes('`' + n + '`') || src.includes('`/' + n + '`') || src.includes('`' + n + ':')
        || src.includes(':' + n + '`')) out.add(n);
  }
  return out;
}

/**
 * The core: family skills, anything used within `days`, and anything the operator's
 * instructions name. Usage keys are Claude's own (`plugin:skill` for a plugin skill,
 * the bare name for a personal one); a family skill is core whatever its usage.
 */
function core({ personal, family, usage, now, days, instructions }) {
  const window = (days || DEFAULT_DAYS) * 86400e3;
  const set = new Set(family || []);
  for (const n of personal || []) {
    const u = (usage || {})[n];
    if (u && typeof u.lastUsedAt === 'number' && now - u.lastUsedAt <= window) set.add(n);
  }
  for (const n of namedIn(instructions, personal)) set.add(n);
  return set;
}

function claudePlan({ personal, core: coreSet, overrides, keep }) {
  const kept = new Set(keep || []);
  const hide = [];
  const respected = [];
  for (const n of personal || []) {
    if (coreSet.has(n) || kept.has(n)) continue;
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, n)) { respected.push(n); continue; }
    hide.push(n);
  }
  return { hide: hide.sort(), respected: respected.sort() };
}

/**
 * Edit `skillOverrides` in Claude's settings.json text. The file is the operator's, so
 * the rest of it must come back byte for byte: an edit is accepted only when the file
 * is already in the form `JSON.stringify(_, null, 2)` produces, which is how Claude Code
 * writes it. Anything else is refused with a reason rather than reformatted.
 */
function editClaudeSettings(text, { set, unset, prune }) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, reason: `settings.json does not parse: ${e.message}` }; }
  if (JSON.stringify(data, null, 2) + '\n' !== text) {
    return { ok: false, reason: 'settings.json is not in the 2-space JSON format Claude Code writes; refusing to reformat it' };
  }
  const ov = Object.assign({}, data.skillOverrides || {});
  let changed = false;
  for (const n of set || []) if (ov[n] !== HIDE) { ov[n] = HIDE; changed = true; }
  const kept = [];
  for (const n of unset || []) {
    if (ov[n] === HIDE) { delete ov[n]; changed = true; }
    else if (n in ov) kept.push(n);
  }
  // Nothing to do leaves the file exactly as it was — including an empty map the
  // operator wrote, which is theirs.
  if (!changed) return { ok: true, text, kept };
  // Existing keys keep their order (insertion order survives Object.assign); new ones
  // append. An emptied map goes with the key: only the launcher's own values were
  // removed to empty it, so it is the launcher's residue.
  // `prune: false` keeps an emptied map: the operator had it before the launcher wrote
  // into it, so it is theirs (the caller knows from its record whether it created it).
  if (Object.keys(ov).length || prune === false) data.skillOverrides = ov;
  else delete data.skillOverrides;
  return { ok: true, text: JSON.stringify(data, null, 2) + '\n', kept };
}

// One inline table of the shape Codex itself writes: { "path" = "…", "enabled" = false }.
const ENTRY = /\{\s*("?)path\1\s*=\s*"((?:[^"\\]|\\.)*)"\s*,\s*("?)enabled\3\s*=\s*(true|false)\s*\}/g;
const TABLE = /^\s*\[\s*"?skills"?\s*\]\s*(?:#.*)?$/;
const CONFIG = /^(\s*"?config"?\s*=\s*)\[(.*)\]\s*$/;
// Any OTHER way TOML can define `skills`: a dotted header or array of tables
// (`[skills.x]`, `[[skills.config]]`), a dotted key or an inline table at top level.
// `[skills.x]` beside a plain `[skills]` header is legal and left alone; without one,
// appending `[skills]` could redefine what those already define, so it is refused.
const ELSEWHERE = /^\s*(?:\[\[\s*"?skills"?\s*\.|\[\s*"?skills"?\s*\.|"?skills"?\s*(?:\.|=))/;

const ESC = { '"': '"', '\\': '\\', b: '\b', t: '\t', n: '\n', f: '\f', r: '\r' };
function tomlDecode(s) {
  return s.replace(/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (m, c) => {
    if (c[0] === 'u' || c[0] === 'U') return String.fromCodePoint(parseInt(c.slice(1), 16));
    return Object.prototype.hasOwnProperty.call(ESC, c) ? ESC[c] : m;
  });
}
function tomlString(s) {
  return '"' + String(s).replace(/[\\"\u0000-\u001f\u007f]/g, (c) => {
    if (c === '\\') return '\\\\';
    if (c === '"') return '\\"';
    const named = { '\b': 'b', '\t': 't', '\n': 'n', '\f': 'f', '\r': 'r' }[c];
    return named ? `\\${named}` : `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
  }) + '"';
}

/**
 * Add or remove `enabled = false` entries in Codex's `[skills] config` array.
 *
 * Only the one-line inline-array form Codex writes is edited; every entry in it must be
 * recognised, or the edit is refused — a guessed TOML edit to the operator's config is
 * the failure this refuses to risk. With no `skills` defined anywhere, a `[skills]`
 * table is appended. `added` names the paths this call actually wrote, so the caller
 * records ownership of those and never of an entry the operator already had.
 */
function editCodexConfig(text, { disable, enable }) {
  const src = String(text);
  const lines = src.split('\n');
  const at = lines.findIndex((l) => TABLE.test(l.replace(/\r$/, '')));
  const want = (disable || []).slice();
  const drop = new Set(enable || []);
  if (at === -1) {
    const other = lines.find((l) => ELSEWHERE.test(l));
    if (other !== undefined) return { ok: false, reason: `skills is already defined another way (${other.trim()}); edit it by hand` };
    if (!want.length) return { ok: true, text: src, added: [] };
    const body = want.map((p) => `{ path = ${tomlString(p)}, enabled = false }`).join(', ');
    const sep = src === '' || src.endsWith('\n') ? '' : '\n';
    return { ok: true, text: `${src}${sep}\n[skills]\nconfig = [${body}]\n`, added: want };
  }
  const other = lines.find((l, i) => i !== at && TABLE.test(l.replace(/\r$/, '')));
  if (other !== undefined) return { ok: false, reason: 'the [skills] table appears twice; refusing to guess' };
  let ci = -1;
  for (let i = at + 1; i < lines.length && !/^\s*\[/.test(lines[i]); i += 1) {
    if (/^\s*"?config"?\s*=/.test(lines[i])) { ci = i; break; }
  }
  if (ci === -1) return { ok: false, reason: 'the [skills] table has no one-line `config = [...]` entry; edit it by hand' };
  const cr = lines[ci].endsWith('\r') ? '\r' : '';
  const m = CONFIG.exec(lines[ci].slice(0, lines[ci].length - cr.length));
  if (!m) return { ok: false, reason: '[skills] config spans several lines or is not an inline array; refusing to guess' };
  const inner = m[2];
  const entries = [...inner.matchAll(ENTRY)];
  const opened = (inner.match(/\{/g) || []).length;
  if (entries.length !== opened) return { ok: false, reason: `[skills] config holds ${opened} tables, ${entries.length} recognised; refusing to guess` };
  const quoted = entries.length ? entries[0][1] === '"' : /^\s*"/.test(m[1]);
  const key = (k) => (quoted ? `"${k}"` : k);
  const have = new Set(entries.map((e) => tomlDecode(e[2])));
  const kept = entries.filter((e) => !(drop.has(tomlDecode(e[2])) && e[4] === 'false')).map((e) => e[0]);
  const added = [];
  for (const p of want) {
    if (have.has(p)) continue;
    have.add(p);
    added.push(p);
    kept.push(`{ ${key('path')} = ${tomlString(p)}, ${key('enabled')} = false }`);
  }
  if (!added.length && kept.length === entries.length) return { ok: true, text: src, added };
  lines[ci] = `${m[1]}[${kept.join(', ')}]${cr}`;
  return { ok: true, text: lines.join('\n'), added };
}

/** Characters a listing spends: a listed name, plus its description while `on`. */
function listingChars(rows) {
  let n = 0;
  for (const r of rows || []) {
    if (r.state === 'hidden') continue;
    n += String(r.name).length;
    if (r.state === 'on') n += Math.min(DESC_CAP, String(r.description || '').length);
  }
  return n;
}

// ── Packs: the operator's marks (pack-marks.json) and per-machine overrides ──
//
// Operator decision 2026-10-13 (B-143): the recommended packs are HIDDEN from every host's
// model listing, never deleted. The marks are the operator's and live on the machine,
// `~/.sshlg-skills/pack-marks.json` (schema pack-marks/1); the public package ships only an
// example, because one operator's marks shipped as defaults would hide them for everyone.
// This launcher's `visibility` is the host-wide fallback for sessions Fabric does not
// start; Fabric's RM-23 (open) is to read the same machine file.
//
// Precedence on Gemini, Pi, OpenCode and Hermes, strongest first: a family pack is never
// hidden; the usage core (family, used within the window by Claude Code usage, named in
// the operator's instructions, --keep) is never hidden; `visibility.showPacks` in
// ~/.sshlg-skills/config.json; `visibility.hidePacks`; the machine mark; unmarked packs are
// listed. Claude and Codex hide everything outside the core and ignore pack marks.

const MARKS_SCHEMA = 'pack-marks/1';
const FAMILY_PACK = /^ssheleg\//i;
const PACK = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const MARK_FIELDS = ['pack', 'audience', 'host', 'hidden', 'markedBy', 'markedAt', 'reason'];

/** Every way `data` fails pack-marks/1, as sentences; empty means valid. */
function marksProblems(data) {
  const out = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['pack-marks: not a JSON object'];
  if (data.schema !== MARKS_SCHEMA) out.push(`pack-marks: schema must be "${MARKS_SCHEMA}", got ${JSON.stringify(data.schema)}`);
  if (!Number.isInteger(data.revision) || data.revision < 1) out.push('pack-marks: revision must be a positive integer');
  if (!Array.isArray(data.packs)) { out.push('pack-marks: packs must be a list'); return out; }
  const seen = new Set();
  data.packs.forEach((m, i) => {
    const at = `pack-marks: packs[${i}]`;
    if (!m || typeof m !== 'object') { out.push(`${at} is not an object`); return; }
    for (const f of MARK_FIELDS) if (!(f in m)) out.push(`${at} (${m.pack}) has no ${f}`);
    if (typeof m.pack !== 'string' || !PACK.test(m.pack)) out.push(`${at}: pack must be owner/repo, got ${JSON.stringify(m.pack)}`);
    else if (seen.has(m.pack.toLowerCase())) out.push(`${at}: ${m.pack} is marked twice (duplicate)`);
    else seen.add(m.pack.toLowerCase());
    if ('hidden' in m && typeof m.hidden !== 'boolean') out.push(`${at} (${m.pack}): hidden must be true or false`);
    if ('host' in m && (!Array.isArray(m.host) || !m.host.length || m.host.some((h) => typeof h !== 'string' || !h)))
      out.push(`${at} (${m.pack}): host must be ["*"] or a non-empty list of host names`);
    if ('markedAt' in m && !/^\d{4}-\d{2}-\d{2}$/.test(String(m.markedAt))) out.push(`${at} (${m.pack}): markedAt must be YYYY-MM-DD`);
    if (m.hidden === true && FAMILY_PACK.test(String(m.pack))) out.push(`${at}: ${m.pack} is a family pack and cannot be hidden`);
  });
  return out;
}

/** pack → { hidden, host } from a VALID file; an invalid one marks nothing. */
function marksIndex(data) {
  const out = new Map();
  if (marksProblems(data).length) return out;
  for (const m of data.packs) out.set(m.pack.toLowerCase(), { hidden: m.hidden, host: m.host.slice() });
  return out;
}

function packLists(config) {
  const v = (config && config.visibility) || {};
  const list = (x) => (Array.isArray(x) ? x.filter((s) => typeof s === 'string').map((s) => s.toLowerCase()) : []);
  return { hide: list(v.hidePacks), show: list(v.showPacks) };
}

/** Is `pack` hidden on `host`? See the precedence above; the core is applied by the caller. */
function packHidden(pack, host, { marks, config } = {}) {
  // GitHub owner/repo names are case-insensitive; the lock, the marks and an override
  // typed by hand may each spell one pack differently.
  const key = String(pack || '').toLowerCase();
  if (!key || FAMILY_PACK.test(key)) return false;
  const o = packLists(config);
  if (o.show.includes(key)) return false;
  if (o.hide.includes(key)) return true;
  const m = marks && marks.get(key);
  if (!m || m.hidden !== true) return false;
  return m.host.includes('*') || m.host.includes(host);
}

/** Names a host hides: skills of a hidden pack that are not in the core. Sorted, unique. */
function hostHide({ skills, host, marks, config, core: coreSet }) {
  const out = new Set();
  for (const s of skills || []) {
    if (!s.pack || (coreSet && coreSet.has(s.name))) continue;
    if (packHidden(s.pack, host, { marks, config })) out.add(s.name);
  }
  return [...out].sort();
}

const HIDE_REASON = 'operator mark: hidden from model listings, not deleted; a skill used in the last 60 days (by Claude Code usage) stays listed';

/**
 * The machine file `visibility marks --init` writes: one row per installed pack — the
 * family and `show` listed, every other pack hidden. The marks are the operator's and
 * live on the machine (`~/.sshlg-skills/pack-marks.json`); the public package ships none.
 */
function marksFromLock({ packs, show, date, revision }) {
  const keep = new Set((show || []).map((p) => String(p).toLowerCase()));
  const rows = [...new Set(packs || [])].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).map((pack) => {
    const family = FAMILY_PACK.test(pack);
    const hidden = !family && !keep.has(pack.toLowerCase());
    return {
      pack, audience: family ? 'the ssheleg family' : 'not recorded', host: ['*'], hidden,
      markedBy: 'operator', markedAt: date,
      reason: family ? 'family member: always listed' : hidden ? HIDE_REASON : 'operator mark: kept listed',
    };
  });
  return {
    schema: MARKS_SCHEMA,
    revision: revision || 1,
    note: 'The operator\'s per-pack marks for this machine. hidden=true hides a pack\'s skills from a host\'s model listing through that host\'s own switch; nothing is deleted. A skill used in the last 60 days (by Claude Code usage) stays listed. Read by `npx sshlg-skills visibility`; Fabric\'s RM-23 (open) is to read this file too.',
    packs: rows,
  };
}

/**
 * The `visibility` object of config.json after one `config set visibility.pack.<p> <state>`.
 * `hide` and `show` keep the two lists disjoint; `default` removes the pack from both;
 * an emptied list goes, so the file keeps deviations only.
 */
function setPackOverride(visibility, pack, state) {
  if (!PACK.test(String(pack))) throw new Error(`a pack is owner/repo — got "${pack}"`);
  if (!['hide', 'show', 'default'].includes(state)) throw new Error(`state must be hide, show or default — got "${state}"`);
  const v = Object.assign({}, visibility || {});
  const same = (p) => String(p).toLowerCase() === String(pack).toLowerCase();
  const raw = (x) => (Array.isArray(x) ? x.filter((p) => typeof p === 'string') : []);
  const hide = raw(v.hidePacks).filter((p) => !same(p));
  const show = raw(v.showPacks).filter((p) => !same(p));
  if (state === 'hide') hide.push(pack);
  if (state === 'show') show.push(pack);
  if (hide.length) v.hidePacks = hide.sort(); else delete v.hidePacks;
  if (show.length) v.showPacks = show.sort(); else delete v.showPacks;
  return v;
}

// ── JSON settings the launcher edits for Gemini, Pi and OpenCode ──
//
// Same rule as editClaudeSettings: the file is the operator's, so it must come back byte
// for byte. An edit is accepted only when the file is in the 2-space form the host writes
// (`JSON.stringify(_, null, 2)`, with or without the final newline — Pi writes none);
// a commented or hand-formatted file is refused with a reason rather than reformatted.

function openJson(text, { create, newline }) {
  if (text === null || text === undefined) {
    if (!create) return { skip: true };
    return { data: {}, nl: newline === false ? '' : '\n' };
  }
  let data;
  try { data = JSON.parse(text); } catch (e) { return { reason: `does not parse as JSON (${e.message}); refusing to edit it` }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { reason: 'is not a JSON object; refusing to edit it' };
  const flat = JSON.stringify(data, null, 2);
  if (text === flat + '\n') return { data, nl: '\n' };
  if (text === flat) return { data, nl: '' };
  return { reason: 'is not in the 2-space JSON form its host writes; refusing to reformat it' };
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

/**
 * Walk to the parent of the leaf; `make` creates missing objects and names each one it
 * created (dotted), so the caller can record which containers are the launcher's.
 */
function walk(data, keys, make) {
  let o = data;
  const chain = [];
  const created = [];
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i];
    if (o[k] === undefined) {
      if (!make) return { missing: true };
      o[k] = {};
      created.push(keys.slice(0, i + 1).join('.'));
    }
    if (!isObj(o[k])) return { reason: `${keys.slice(0, i + 1).join('.')} is not an object; edit it by hand` };
    chain.push([o, k, keys.slice(0, i + 1).join('.')]);
    o = o[k];
  }
  return { parent: o, chain, created };
}

/**
 * After a removal emptied the leaf, drop the leaf and the containers above it — but only
 * those in `prunable`, the paths the launcher itself created. A container the operator
 * had, even an empty one, is theirs and stays (fix round, L1: `{"skills":{"disabled":[]}}`
 * came back as `{}`).
 */
function pruneLeaf(w, leaf, leafPath, prunable) {
  const may = new Set(prunable || []);
  if (!may.has(leafPath)) return;
  delete w.parent[leaf];
  for (let i = w.chain.length - 1; i >= 0; i -= 1) {
    const [o, k, at] = w.chain[i];
    if (may.has(at) && isObj(o[k]) && !Object.keys(o[k]).length) delete o[k]; else break;
  }
}

/**
 * Add/remove strings in the list at `keys`. `added` names what this call wrote — never an
 * entry already there, which is the operator's — so the caller owns exactly that.
 * `createdPaths` names the containers this call created; pass them back as `prunable`
 * on the call that removes the last entry.
 */
function editJsonList(text, { keys, add, remove, create, newline, prunable }) {
  const f = openJson(text, { create, newline });
  if (f.skip) return { ok: true, text, added: [], createdPaths: [], skipped: true };
  if (f.reason) return { ok: false, reason: f.reason };
  const want = (add || []).filter((n, i, a) => a.indexOf(n) === i);
  const leaf = keys[keys.length - 1];
  const leafPath = keys.join('.');
  const probe = walk(f.data, keys, false);
  if (probe.reason) return { ok: false, reason: probe.reason };
  const cur = probe.missing ? undefined : probe.parent[leaf];
  if (cur !== undefined && !Array.isArray(cur)) return { ok: false, reason: `${leafPath} is not a list; edit it by hand` };
  const list = cur || [];
  const have = new Set(list);
  const drop = new Set(remove || []);
  const kept = list.filter((x) => !drop.has(x));
  const added = want.filter((n) => !have.has(n));
  if (!added.length && kept.length === list.length) return { ok: true, text: text === undefined ? null : text, added: [], createdPaths: [] };
  const w = walk(f.data, keys, true);
  const createdPaths = w.created.slice();
  if (cur === undefined && added.length) createdPaths.push(leafPath);
  const next = kept.concat(added);
  if (next.length) w.parent[leaf] = next;
  else { w.parent[leaf] = []; pruneLeaf(w, leaf, leafPath, prunable); }
  return { ok: true, text: JSON.stringify(f.data, null, 2) + f.nl, added, createdPaths, created: text === null || text === undefined };
}

/**
 * Set `value` for names absent from the map at `keys`; remove names only while they still
 * hold `value`. A name the operator set to anything — even `value` itself, before the
 * launcher ran — is `respected` and never recorded as the launcher's.
 */
function editJsonMap(text, { keys, set, value, unset, create, newline, prunable }) {
  const f = openJson(text, { create, newline });
  if (f.skip) return { ok: true, text, added: [], respected: [], createdPaths: [], skipped: true };
  if (f.reason) return { ok: false, reason: f.reason };
  const leaf = keys[keys.length - 1];
  const leafPath = keys.join('.');
  const probe = walk(f.data, keys, false);
  if (probe.reason) return { ok: false, reason: probe.reason };
  const cur = probe.missing ? undefined : probe.parent[leaf];
  if (cur !== undefined && !isObj(cur)) return { ok: false, reason: `${leafPath} is ${JSON.stringify(cur)}, not a per-name map; edit it by hand` };
  const map = Object.assign({}, cur || {});
  const added = [];
  const respected = [];
  let removed = 0;
  for (const n of unset || []) if (map[n] === value) { delete map[n]; removed += 1; }
  for (const n of set || []) {
    if (Object.prototype.hasOwnProperty.call(map, n)) { if (!added.includes(n)) respected.push(n); continue; }
    map[n] = value;
    added.push(n);
  }
  if (!added.length && !removed) return { ok: true, text: text === undefined ? null : text, added, respected, createdPaths: [] };
  const w = walk(f.data, keys, true);
  const createdPaths = w.created.slice();
  if (cur === undefined && added.length) createdPaths.push(leafPath);
  w.parent[leaf] = map;
  if (!Object.keys(map).length) pruneLeaf(w, leaf, leafPath, prunable);
  return { ok: true, text: JSON.stringify(f.data, null, 2) + f.nl, added, respected, createdPaths, created: text === null || text === undefined };
}

/** What a JSON settings file holds at `keys` right now — the readback ownership is filtered by. */
function jsonAt(text, keys) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return undefined; }
  let o = data;
  for (const k of keys) { if (!o || typeof o !== 'object') return undefined; o = o[k]; }
  return o;
}

module.exports = {
  core, claudePlan, editClaudeSettings, editCodexConfig, listingChars, namedIn, HIDE, DEFAULT_DAYS,
  MARKS_SCHEMA, marksProblems, marksIndex, marksFromLock, packHidden, hostHide, setPackOverride,
  editJsonList, editJsonMap, jsonAt,
};
