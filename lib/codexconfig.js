'use strict';
/**
 * Read-only checks of Codex's config.toml (B-167).
 *
 * Codex refuses to start when one table is defined twice. On 2026-10-12 a project-trust
 * table was appended as `[projects."/x"]` beside an existing `["projects"."/x"]` — the same
 * key, quoted differently — and `codex login status` answered `duplicate key`. Whatever
 * wrote it did not parse the quoted form. This module only reports; Codex owns the file.
 */

/** Split a TOML dotted key into its parts, honouring basic and literal quotes. */
function keyParts(raw) {
  const parts = [];
  let cur = '';
  let quote = null;
  let quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (quote) {
      if (c === '\\' && quote === '"') { cur += raw[i + 1] || ''; i++; continue; }
      if (c === quote) { quote = null; continue; }
      cur += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; quoted = true; continue; }
    if (c === '.') { parts.push(quoted ? cur : cur.trim()); cur = ''; quoted = false; continue; }
    if (/\s/.test(c)) continue;                 // outside quotes, whitespace is never key text
    cur += c;
  }
  parts.push(quoted ? cur : cur.trim());
  return parts;
}

/**
 * Tables defined more than once, as [{key: [parts], lines: [n, …]}] (1-based lines).
 * Array tables (`[[x]]`) repeat by design and are skipped; so are comments.
 */
function duplicateTables(text) {
  const seen = new Map();
  String(text || '').split('\n').forEach((line, i) => {
    const m = line.match(/^\s*\[(?!\[)(.*)\]\s*(#.*)?$/);
    if (!m) return;
    const parts = keyParts(m[1]);
    const id = JSON.stringify(parts);
    if (!seen.has(id)) seen.set(id, { key: parts, lines: [] });
    seen.get(id).lines.push(i + 1);
  });
  return [...seen.values()].filter((t) => t.lines.length > 1);
}

/** A table key as a person reads it: `projects."/Users/x"`. */
function show(parts) {
  return parts.map((p) => (/^[A-Za-z0-9_-]+$/.test(p) ? p : JSON.stringify(p))).join('.');
}

module.exports = { duplicateTables, keyParts, show };
