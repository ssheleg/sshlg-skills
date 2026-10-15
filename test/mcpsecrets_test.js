#!/usr/bin/env node
'use strict';
// The MCP tools whose answer carries a credential (lib/mcpsecrets.js).
//
// Case 1 is the call that leaked five clusters' passwords on 2026-10-10. The second
// half asserts that ordinary reads of the same server, and tools that only NAME
// credentials, pass — a guard that refuses ordinary work gets switched off.

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const M = require('../lib/mcpsecrets.js');
const H = require('../lib/hooks.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const DENIED = [
  'mcp__digitalocean__db-cluster-list',
  'mcp__digitalocean__db-cluster-get',
  'mcp__digitalocean__db-cluster-get-user',
  'mcp__digitalocean__docr-docker-credentials',
  'mcp__digitalocean__doks-get-kubeconfig',
  'mcp__plugin_digitalocean_digitalocean__db-cluster-list',
];
const PASSED = [
  'mcp__digitalocean__db-cluster-get-ca',
  'mcp__digitalocean__db-cluster-get-firewall-rules',
  'mcp__digitalocean__apps-list',
  'mcp__digitalocean__docr-list',
  'mcp__observatory__observatory_credentials',
  'mcp__other__db-cluster-list',
  'Bash',
  '',
];

for (const tool of DENIED) {
  it(`denies ${tool}`, () => {
    const hit = M.inspectTool(tool);
    assert.ok(hit, 'expected a refusal');
    assert.strictEqual(hit.rule, 'mcp-credential-result');
    // USR-011: a skills-only user has no vault.py; the route they can run comes first,
    // and the vault stays named as the alternative (ordering: test/remedies_test.js).
    assert.match(hit.why, /mode 600[\s\S]*vault\.py put/, 'the free route is missing or not first');
  });
}
for (const tool of PASSED) {
  it(`passes ${tool || '(empty)'}`, () => assert.strictEqual(M.inspectTool(tool), null));
}

it('the matcher wakes the hook for every registered tool and no other MCP call', () => {
  const re = new RegExp(`^(?:${M.MATCHER})$`);
  for (const tool of DENIED) assert.ok(re.test(tool), tool);
  for (const tool of PASSED.filter((t) => t.startsWith('mcp__'))) assert.ok(!re.test(tool), tool);
});

it('the wired PreToolUse matcher carries the registry', () => {
  const wired = H.WIRED.find((w) => w.event === 'PreToolUse');
  assert.ok(wired.matcher.includes(M.MATCHER));
  assert.ok(new RegExp(`^(?:${wired.matcher})$`).test('mcp__digitalocean__db-cluster-list'));
  assert.ok(new RegExp(`^(?:${wired.matcher})$`).test('Bash'));
});

it('the hook process denies the call end to end', () => {
  const hook = path.join(__dirname, '..', 'hooks', 'pre-tool-use.js');
  const run = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ tool_name: 'mcp__digitalocean__db-cluster-list', tool_input: {} }),
    encoding: 'utf8',
  });
  const out = JSON.parse(run.stdout.trim());
  assert.strictEqual(out.hookSpecificOutput.permissionDecision, 'deny');
  const quiet = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ tool_name: 'mcp__digitalocean__db-cluster-get-ca', tool_input: {} }),
    encoding: 'utf8',
  });
  assert.strictEqual(quiet.stdout.trim(), '');
});

if (failures.length) {
  process.stderr.write(`mcpsecrets: ${failures.length}/${checks} failed\n  ${failures.join('\n  ')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS: mcpsecrets — ${checks} checks\n`);
