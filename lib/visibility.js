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
function editClaudeSettings(text, { set, unset }) {
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
  if (Object.keys(ov).length) data.skillOverrides = ov;
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

module.exports = { core, claudePlan, editClaudeSettings, editCodexConfig, listingChars, namedIn, HIDE, DEFAULT_DAYS };
