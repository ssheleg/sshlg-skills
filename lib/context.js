'use strict';
// `sshlg-skills context`: what each host loads before the first user word, measured
// from the instruction files this hub writes into. Read-only; prints sizes, never text.
// Token figures are chars/4, an estimate (host tokenizers differ by roughly ±15%).
const fs = require('fs');
const path = require('path');

const BLOCK = /<!-- SSHLG:([A-Za-z0-9:-]+?):BEGIN[^]*?-->[^]*?<!-- SSHLG:\1:END -->/g;
// Documented caps a host applies to its instruction chain.
const CODEX_DEFAULT_CAP = 32 * 1024;  // project_doc_max_bytes default (Codex AGENTS.md docs)
const CLAUDE_LINE_TARGET = 200;       // "target under 200 lines per CLAUDE.md file" (Claude Code memory docs)

function measure(text) {
  const bytes = Buffer.byteLength(text, 'utf8');
  let managed = 0;
  for (const m of text.matchAll(BLOCK)) managed += Buffer.byteLength(m[0], 'utf8');
  return { bytes, lines: text.split('\n').length, approxTokens: Math.round(text.length / 4), managedBytes: managed, operatorBytes: bytes - managed };
}

/** Codex's combined cap, from a top-level `project_doc_max_bytes` in config.toml. */
function codexCap(configText) {
  if (configText && typeof configText === 'object') return { cap: CODEX_DEFAULT_CAP, source: 'unreadable' };
  if (typeof configText !== 'string') return { cap: CODEX_DEFAULT_CAP, source: 'default' };
  // Top-level keys end at the first real table header (`[name]` / `[[name]]` on its own line).
  const head = configText.replace(/^\uFEFF/, '').split(/^[ \t]*\[\[?[A-Za-z0-9_."' -]+\]\]?[ \t]*(?:#.*)?$/m)[0];
  const line = /^[ \t]*(?:project_doc_max_bytes|"project_doc_max_bytes"|'project_doc_max_bytes')[ \t]*=(.*)$/m.exec(head);
  if (!line) return { cap: CODEX_DEFAULT_CAP, source: 'default' };
  const m = /^[ \t]*([0-9][0-9_]*)[ \t]*(?:#.*)?$/.exec(line[1]);
  if (!m) return { cap: CODEX_DEFAULT_CAP, source: 'unparsed' };
  return { cap: Number(m[1].replace(/_/g, '')), source: 'config.toml' };
}

/**
 * hosts: [{ agent, file, text|null }], codexConfig: string|null.
 * Returns rows plus findings a person can act on.
 */
function report(hosts, codexConfig) {
  const rows = [], findings = [];
  for (const h of hosts) {
    if (h.error) { rows.push({ agent: h.agent, file: h.file, present: false, error: h.error }); findings.push({ agent: h.agent, severity: 'error', message: `${h.file} is unreadable (${h.error})` }); continue; }
    if (h.text == null) { rows.push({ agent: h.agent, file: h.file, present: false }); continue; }
    const row = { agent: h.agent, file: h.file, present: true, ...measure(h.text) };
    if (h.agent === 'codex') {
      const c = codexCap(codexConfig);
      row.cap = c.cap; row.capSource = c.source;
      const unsure = c.source === 'unparsed' || c.source === 'unreadable';
      if (unsure) findings.push({ agent: 'codex', severity: 'note', message: `config.toml's project_doc_max_bytes is ${c.source}; assuming the documented 32768 default.` });
      if (h.shadowed) row.shadowed = true;
      else if (row.bytes > c.cap) findings.push({ agent: 'codex', severity: unsure ? 'note' : 'error', message: `${h.file} is ${row.bytes} bytes, over Codex's ${c.cap}-byte instruction cap (${c.source}); Codex's AGENTS.md docs say it stops adding instruction files at that combined size. Raise project_doc_max_bytes in config.toml or shorten the file.` });
    }
    if (h.agent === 'claude' && row.lines > CLAUDE_LINE_TARGET) findings.push({ agent: 'claude', severity: 'note', message: `${h.file} has ${row.lines} lines; Claude Code's guidance targets under ${CLAUDE_LINE_TARGET}. Move procedures to on-demand files.` });
    rows.push(row);
  }
  return { rows, findings, estimate: 'tokens ≈ characters / 4' };
}

/** Text, null when absent, or { error: code } when present but unreadable. */
function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; return { error: e.code || 'EIO' }; }
}
/** A host entry for report(): never throws. */
function host(agent, file) {
  const r = read(file);
  return r && typeof r === 'object' ? { agent, file, text: null, error: r.error } : { agent, file, text: r };
}

module.exports = { report, measure, codexCap, read, host, CODEX_DEFAULT_CAP, CLAUDE_LINE_TARGET };
