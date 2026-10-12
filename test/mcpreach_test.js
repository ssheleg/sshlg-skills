#!/usr/bin/env node
'use strict';
// B-177: a configured MCP server that does not answer when a session starts leaves that
// session without its tools for good, and nothing says so. On 2026-10-12 `asset-foundry`
// (restarted by a release), `publisher` and `fabric-dashboards` refused, and an agent fell
// back to calling Foundry directly with its client token. `hosts` names local HTTP servers
// that do not answer — by a TCP connect only: no request is sent, so no header or token
// leaves the process — and points at `/mcp` → reconnect.
const assert = require('assert');
const fs = require('fs');

const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const M = require('../lib/mcpreach.js');

const failures = [];
let checks = 0;
function it(name, fn) {
  checks++;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const SECRET = 'header-value-that-must-never-print';

it('only loopback http/sse servers are listed, from user and project scopes, with no header values', () => {
  const cfg = {
    mcpServers: {
      up: { type: 'http', url: 'http://127.0.0.1:1/mcp', headers: { 'X-Token': SECRET } },
      remote: { type: 'http', url: 'https://example.com/mcp' },
      stdio: { command: 'node', args: ['x.js'] },
    },
    projects: { '/p': { mcpServers: { local: { type: 'sse', url: 'http://localhost:2/sse' } } } },
  };
  const list = M.configured(cfg);
  assert.deepStrictEqual(list.map((s) => s.name).sort(), ['local', 'up']);
  assert.ok(!JSON.stringify(list).includes(SECRET), 'a header value reached the list');
  const up = list.find((s) => s.name === 'up');
  assert.strictEqual(up.host, '127.0.0.1'); assert.strictEqual(up.port, 1); assert.strictEqual(up.scope, 'user');
});

it('`hosts` says which local MCP servers answer and which refuse, and prints no header', () => {
  // Two free ports, found in a child; one gets a listener in another process (this one
  // blocks in spawnSync, so its own event loop could not accept), the other stays closed.
  const free = () => Number(spawnSync(process.execPath, ['-e',
    "const s=require('net').createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close();})"],
    { encoding: 'utf8' }).stdout);
  const port = free(); const deadPort = free();
  const server = require('child_process').spawn(process.execPath, ['-e',
    `require('net').createServer(()=>{}).listen(${port},'127.0.0.1');setTimeout(()=>{},20000)`], { stdio: 'ignore' });
  const until = Date.now() + 5000;
  while (Date.now() < until) {
    const ok = spawnSync(process.execPath, ['-e',
      `const s=require('net').connect(${port},'127.0.0.1');s.on('connect',()=>process.exit(0));s.on('error',()=>process.exit(1))`]).status === 0;
    if (ok) break;
  }
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-mcpreach-'));
  try {
    fs.writeFileSync(path.join(home, '.claude.json'), JSON.stringify({ mcpServers: {
      alive: { type: 'http', url: `http://127.0.0.1:${port}/mcp`, headers: { 'X-Token': SECRET } },
      gone: { type: 'http', url: `http://127.0.0.1:${deadPort}/mcp` },
    } }));
    const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'hosts'],
      { env: Object.assign({}, process.env, { HOME: home }), encoding: 'utf8', timeout: 30000 });
    const out = (r.stdout || '') + (r.stderr || '');
    assert.match(out, /alive\s+answers/, out);
    assert.match(out, /gone\s+refused/, out);
    assert.match(out, /\/mcp/, 'no reconnect hint: ' + out);
    assert.ok(!out.includes(SECRET), 'a header value was printed');
  } finally {
    server.kill();
    fs.rmSync(home, { recursive: true, force: true });
  }
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
