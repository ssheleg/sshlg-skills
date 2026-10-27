'use strict';
// `sshlg-skills context`: what each host loads before the first user word, measured
// from the instruction files this hub writes into. Read-only; prints sizes, never text.
// Token figures are chars/4, an estimate (host tokenizers differ by roughly ±15%).
const fs = require('fs');
const path = require('path');

const BLOCK = /<!-- SSHLG:([A-Za-z0-9:-]+?):BEGIN[^]*?-->[^]*?<!-- SSHLG:\1:END -->/g;
// Documented caps a host applies to its instruction chain.
// Codex 0.163 reads the global AGENTS.md (or AGENTS.override.md) in full
// (codex-rs/codex-home/src/instructions); project_doc_max_bytes caps only the project
// chain, combined, root to cwd, cutting the file that crosses it (core/src/agents_md.rs).
const CODEX_DEFAULT_CAP = 32 * 1024;  // project_doc_max_bytes default
const CLAUDE_LINE_TARGET = 200;       // "target under 200 lines per CLAUDE.md file" (Claude Code memory docs)
const CLAUDE_FILE_WARN = 40000;       // Claude Code warns on a memory file above 40,000 characters
// Kimi 2.3.1 warns when its AGENTS.md chain passes 32 KiB (binary: `totalBytes > 32768`);
// the chain starts with ~/.kimi-code/AGENTS.md and ~/.agents/AGENTS.md (B-206).
const KIMI_WARN_BYTES = 32768;

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
  const c = codexCap(codexConfig);
  const unsure = c.source === 'unparsed' || c.source === 'unreadable';
  let projectBytes = 0, cut = null, kimiBytes = 0;
  const kimiFiles = [];
  for (const h of hosts) {
    // B-206: a host that reads ~/.claude/CLAUDE.md only as a fallback is named, so the reliance is known.
    if (h.fallback && h.fallbackActive) findings.push({ agent: h.agent, severity: 'note', message: `${h.agent} reads ${h.fallback} as a fallback${h.file ? ` while ${h.file} is absent` : ''}; the routing block reaches it only from there.` });
    else if (h.fallback && h.file && h.text != null) findings.push({ agent: h.agent, severity: 'note', message: `${h.file} exists, so ${h.agent} no longer reads ${h.fallback}; the routing block reaches it only if that file carries it.` });
    if (!h.file) continue;   // a fallback-only host has no file of its own to measure
    if (h.error) { rows.push({ agent: h.agent, scope: h.scope || 'global', file: h.file, present: false, error: h.error }); findings.push({ agent: h.agent, severity: 'error', message: `${h.file} is unreadable (${h.error})` }); continue; }
    if (h.text == null) { rows.push({ agent: h.agent, scope: h.scope || 'global', file: h.file, present: false }); continue; }
    const row = { agent: h.agent, scope: h.scope || 'global', file: h.file, present: true, ...measure(h.text) };
    if (h.agent === 'codex' && h.shadowed) row.shadowed = true;
    if (h.cap) {
      row.cap = h.cap; row.capSource = 'host documentation (characters)';
      if (h.text.length > h.cap) findings.push({ agent: h.agent, severity: 'error', message: `${h.file} is ${h.text.length} characters, over this host's ${h.cap}-character cap; it reads only the first ${h.cap}. Shorten the file.` });
    }
    if (h.kimiChain) { kimiBytes += row.bytes; kimiFiles.push(h.file); }
    if (h.agent === 'codex' && row.scope === 'project') {
      row.cap = c.cap; row.capSource = c.source;
      if (projectBytes + row.bytes > c.cap && !cut) cut = h.file;
      projectBytes += row.bytes;
    }
    if (h.agent === 'claude' && row.lines > CLAUDE_LINE_TARGET) findings.push({ agent: 'claude', severity: 'note', message: `${h.file} has ${row.lines} lines; Claude Code's guidance targets under ${CLAUDE_LINE_TARGET}. Move procedures to on-demand files.` });
    if (h.agent === 'claude' && h.text.length > CLAUDE_FILE_WARN) findings.push({ agent: 'claude', severity: 'note', message: `${h.file} is ${h.text.length} characters; Claude Code warns above 40,000 characters per file. Move procedures to on-demand files.` });
    rows.push(row);
  }
  if (kimiBytes > KIMI_WARN_BYTES) findings.push({ agent: 'kimi', severity: 'note', message: `Kimi loads ${kimiBytes} bytes of global AGENTS.md (${kimiFiles.join(' + ')}), over the ${KIMI_WARN_BYTES} it recommends; it warns, it does not cut.` });
  if (projectBytes && unsure) findings.push({ agent: 'codex', severity: 'note', message: `config.toml's project_doc_max_bytes is ${c.source}; assuming the documented 32768 default.` });
  if (cut) findings.push({ agent: 'codex', severity: unsure ? 'note' : 'error', message: `Codex's project instructions are ${projectBytes} bytes, over its ${c.cap}-byte cap (${c.source}); Codex reads them root to cwd and cuts ${cut} where the cap falls, without a warning. Raise project_doc_max_bytes in config.toml or shorten the files.` });
  return { rows, findings, estimate: 'tokens ≈ characters / 4' };
}

/** A directory's parents, nearest first, ending at the filesystem root. */
function ancestors(dir) {
  const out = [];
  for (let d = path.resolve(dir); ; d = path.dirname(d)) { out.push(d); if (path.dirname(d) === d) break; }
  return out;
}
const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };

/** The project files Codex reads for cwd: nearest `.git` ancestor (else cwd alone) down to cwd. */
function codexProjectFiles(cwd) {
  const up = ancestors(cwd);
  const rootAt = up.findIndex((d) => fs.existsSync(path.join(d, '.git')));
  const dirs = (rootAt < 0 ? [up[0]] : up.slice(0, rootAt + 1)).reverse();
  const out = [];
  for (const d of dirs) {
    const f = ['AGENTS.override.md', 'AGENTS.md'].map((n) => path.join(d, n)).find(isFile);
    if (f) out.push(f);
  }
  return out;
}

/** The project memory files Claude Code reads for cwd: every ancestor's CLAUDE.md family, outermost first. */
function claudeProjectFiles(cwd, measured) {
  const seen = new Set((measured || []).map((f) => path.resolve(f)));
  const out = [];
  for (const d of ancestors(cwd).reverse()) {
    for (const n of ['CLAUDE.md', path.join('.claude', 'CLAUDE.md'), 'CLAUDE.local.md']) {
      const f = path.join(d, n);
      if (!seen.has(f) && isFile(f)) { seen.add(f); out.push(f); }
    }
  }
  return out;
}

/** Text, null when absent, or { error: code } when present but unreadable. */
function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; return { error: e.code || 'EIO' }; }
}
/** A host entry for report(): never throws. */
function host(agent, file, scope) {
  const r = read(file);
  const h = r && typeof r === 'object' ? { agent, file, text: null, error: r.error } : { agent, file, text: r };
  if (scope) h.scope = scope;
  return h;
}

module.exports = { report, measure, codexCap, read, host, codexProjectFiles, claudeProjectFiles, CODEX_DEFAULT_CAP, CLAUDE_LINE_TARGET, CLAUDE_FILE_WARN, KIMI_WARN_BYTES };
