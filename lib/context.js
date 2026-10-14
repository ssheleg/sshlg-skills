'use strict';
// `sshlg-skills context`: what each host loads before the first user word, measured
// from the instruction files this hub writes into. Read-only; prints sizes, never text.
// Token figures are chars/4, an estimate (host tokenizers differ by roughly ±15%).
const fs = require('fs');
const path = require('path');

const BLOCK = /<!-- SSHLG:([A-Z0-9:-]+?):BEGIN[^]*?-->[^]*?<!-- SSHLG:\1:END -->/g;
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
  if (typeof configText !== 'string') return { cap: CODEX_DEFAULT_CAP, source: 'default' };
  const head = configText.split(/^\s*\[/m)[0];
  const m = /^\s*project_doc_max_bytes\s*=\s*(\d+)\s*$/m.exec(head);
  return m ? { cap: Number(m[1]), source: 'config.toml' } : { cap: CODEX_DEFAULT_CAP, source: 'default' };
}

/**
 * hosts: [{ agent, file, text|null }], codexConfig: string|null.
 * Returns rows plus findings a person can act on.
 */
function report(hosts, codexConfig) {
  const rows = [], findings = [];
  for (const h of hosts) {
    if (h.text == null) { rows.push({ agent: h.agent, file: h.file, present: false }); continue; }
    const row = { agent: h.agent, file: h.file, present: true, ...measure(h.text) };
    if (h.agent === 'codex') {
      const c = codexCap(codexConfig);
      row.cap = c.cap; row.capSource = c.source;
      if (row.bytes > c.cap) findings.push({ agent: 'codex', severity: 'error', message: `${h.file} is ${row.bytes} bytes, over Codex's ${c.cap}-byte instruction cap (${c.source}); Codex stops adding instructions there. Raise project_doc_max_bytes in config.toml or shorten the file.` });
    }
    if (h.agent === 'claude' && row.lines > CLAUDE_LINE_TARGET) findings.push({ agent: 'claude', severity: 'note', message: `${h.file} has ${row.lines} lines; Claude Code's guidance targets under ${CLAUDE_LINE_TARGET}. Move procedures to on-demand files.` });
    rows.push(row);
  }
  return { rows, findings, estimate: 'tokens ≈ characters / 4' };
}

function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

module.exports = { report, measure, codexCap, read, CODEX_DEFAULT_CAP, CLAUDE_LINE_TARGET };
