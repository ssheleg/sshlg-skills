'use strict';
/**
 * Whether the local MCP servers Claude Code is configured with are answering (B-177).
 *
 * Claude Code connects to each MCP server once, when a session starts (and on `/mcp` →
 * reconnect). A server that refuses then leaves that session without its tools for good,
 * silently — the session's model only sees the tools are absent. On 2026-10-12 a Foundry
 * release restart did exactly that, and an agent fell back to calling the service directly
 * with its client token.
 *
 * Read-only and quiet: only `type: http|sse` servers whose URL is on loopback are probed,
 * by a TCP connect alone — no request is sent, so no header or token leaves this process,
 * and no third-party host is contacted. Header values are never read into the result.
 */
const { spawnSync } = require('child_process');

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

/** The loopback http/sse servers declared in a parsed ~/.claude.json, user and project scope. */
function configured(cfg) {
  const out = [];
  const take = (servers, scope) => {
    for (const [name, c] of Object.entries(servers || {})) {
      const type = c && c.type;
      if (type !== 'http' && type !== 'sse') continue;
      let u;
      try { u = new URL(c.url); } catch (e) { continue; }
      if (!LOOPBACK.has(u.hostname)) continue;
      const port = Number(u.port || (u.protocol === 'https:' ? 443 : 80));
      out.push({ name, scope, host: u.hostname.replace(/^\[|\]$/g, ''), port });
    }
  };
  take(cfg && cfg.mcpServers, 'user');
  for (const [proj, pc] of Object.entries((cfg && cfg.projects) || {})) take(pc && pc.mcpServers, `project ${proj}`);
  return out;
}

/** Probe each server by TCP connect, in parallel, in a child process (callers stay sync). */
function probe(list, timeoutMs) {
  if (!list.length) return [];
  const code = `
    const net = require('net');
    const list = JSON.parse(process.argv[1]); const t = Number(process.argv[2]);
    Promise.all(list.map((s) => new Promise((done) => {
      const sock = net.connect({ host: s.host, port: s.port });
      const end = (ok, why) => { sock.destroy(); done(Object.assign({}, s, { answers: ok, why })); };
      sock.setTimeout(t, () => end(false, 'timeout'));
      sock.once('connect', () => end(true, ''));
      sock.once('error', (e) => end(false, e.code || 'error'));
    }))).then((r) => process.stdout.write(JSON.stringify(r)));`;
  const r = spawnSync(process.execPath, ['-e', code, JSON.stringify(list), String(timeoutMs || 1500)],
    { encoding: 'utf8', timeout: (timeoutMs || 1500) + 5000 });
  try { return JSON.parse(r.stdout); } catch (e) { return list.map((s) => Object.assign({}, s, { answers: false, why: 'probe failed' })); }
}

module.exports = { configured, probe };
