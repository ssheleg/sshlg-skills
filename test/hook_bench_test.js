#!/usr/bin/env node
'use strict';
// B-268: the pure half of `scripts/hook-bench.js --census`, the count of processes one Bash
// tool call starts across every hook the host runs for it. The census itself spawns the
// installed hooks; what it decides (which entries a Bash call wakes, whose they are, how
// many processes a trace names) is fixtured here without a HOME.

const assert = require('assert');
const path = require('path');
const B = require('../scripts/hook-bench.js');
const H = require('../lib/hooks.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

it('requiring the bench runs nothing: no output, no temporary HOME', () => {
  assert.strictEqual(typeof B.census, 'function');
  assert.strictEqual(typeof B.bench, 'function');
});

it('a matcher of plain names is an exact list, as Claude Code reads it', () => {
  assert.strictEqual(B.matcherHits('Bash|Read|Grep', 'Bash'), true);
  assert.strictEqual(B.matcherHits('Edit|Write|MultiEdit', 'Bash'), false);
  assert.strictEqual(B.matcherHits('BashOutput', 'Bash'), false);
});

it('no matcher, an empty one and `*` match every tool', () => {
  for (const m of [undefined, null, '', '*']) assert.strictEqual(B.matcherHits(m, 'Bash'), true, String(m));
});

it('any other matcher is a RegExp: anchored lists hit, MCP patterns miss, a broken one misses', () => {
  assert.strictEqual(B.matcherHits(H.PRE_TOOL_MATCHER, 'Bash'), true);
  assert.strictEqual(B.matcherHits('mcp__.*', 'Bash'), false);
  assert.strictEqual(B.matcherHits('mcp__.*prowl.*', 'Bash'), false);
  assert.strictEqual(B.matcherHits('(', 'Bash'), false);
});

it('processes are the distinct pids of the shell trace and the exec log, named by what ran', () => {
  const trace = '100\n100\n101\n102\n';
  const execs = '101 cat\n103 python3\n104 cut\n';
  const got = B.processCount(trace, execs);
  assert.strictEqual(got.n, 5);
  assert.deepStrictEqual(got.kinds, { bash: 2, cat: 1, python3: 1, cut: 1 });
});

it('an empty trace and log is zero processes, not a crash', () => {
  assert.deepStrictEqual(B.processCount('', ''), { n: 0, kinds: {} });
});

it('entries are collected from the profile, the project and each enabled plugin, owner named', () => {
  const runtime = '/h/.sshlg-skills/runtime';
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: H.PRE_TOOL_MATCHER, hooks: [{ type: 'command', command: `node "${runtime}/hooks/pre-tool-use.js"` }] },
        { matcher: '*', hooks: [{ type: 'command', command: 'sh -c "some notifier"' }] },
      ],
      SessionStart: [{ hooks: [{ type: 'command', command: `node "${runtime}/hooks/session-start.js"` }] }],
    },
  };
  const project = { hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/hooks/repo-gate.js"' }] }] } };
  const plugins = [
    { name: 'agent-sync', root: '/p/agent-sync', hooks: { hooks: {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: '"${CLAUDE_PLUGIN_ROOT}/hooks/guard.sh"' }] }],
      PostToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: '"${CLAUDE_PLUGIN_ROOT}/hooks/renew.sh"', async: true }] }],
    } } },
    { name: 'prowl', root: '/p/prowl', hooks: { hooks: {
      PreToolUse: [{ matcher: 'mcp__.*prowl.*', hooks: [{ type: 'command', command: 'node x.js' }] }],
    } } },
  ];
  const got = B.collectHooks({ settings, project, plugins, runtime, family: ['agent-sync', 'task-pipeline'] });
  const bashPre = got.filter((h) => h.event === 'PreToolUse' && B.matcherHits(h.matcher, 'Bash'));
  assert.deepStrictEqual(bashPre.map((h) => [h.owner, h.family]),
    [['hub', true], ['foreign', false], ['project', false], ['agent-sync', true]]);
  const renew = got.find((h) => h.owner === 'agent-sync' && h.event === 'PostToolUse');
  assert.strictEqual(renew.async, true);
  assert.strictEqual(renew.root, '/p/agent-sync');
  assert.ok(got.some((h) => h.owner === 'prowl' && h.family === false));
});

it('a foreign command is never printed: its label names only that it is foreign', () => {
  assert.strictEqual(B.label({ owner: 'foreign', command: 'curl -H "Authorization: x" https://e' }), '(a hook of another tool)');
  assert.strictEqual(B.label({ owner: 'agent-sync', command: '"${CLAUDE_PLUGIN_ROOT}/hooks/guard.sh"' }), 'hooks/guard.sh');
  assert.strictEqual(B.label({ owner: 'hub', command: 'node "/h/.sshlg-skills/runtime/hooks/pre-tool-use.js"' }), 'hooks/pre-tool-use.js');
  assert.strictEqual(B.label({ owner: 'fabric', command: 'python3 -S "${CLAUDE_PLUGIN_ROOT}/skills/x/scripts/s.py" hook stop' }), 'skills/x/scripts/s.py hook stop');
});

it('the shell tracer records the pid of the shell that traces, not of a fork it makes', () => {
  const env = B.tracerEnv('/w/trace.log');
  assert.ok(/exec \/bin\/sh -c/.test(env), env);
  assert.ok(env.includes('$PPID'), env);
  assert.ok(env.includes(path.join('/w', 'trace.log')), env);
  assert.ok(/set -x/.test(env), env);
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS: hook_bench — ${checks} cases`);
