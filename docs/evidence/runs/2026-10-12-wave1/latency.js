#!/usr/bin/env node
'use strict';
/**
 * R06 — wall time of every hook process, before and after.
 *
 *   node docs/evidence/runs/2026-10-12-wave1/latency.js [base-rev] [runs]   (default 5852c57, 10)
 *
 * Each hook is spawned the way Claude Code spawns it — JSON on stdin — `runs` times from
 * the base revision and `runs` times from the working tree, interleaved so machine load
 * hits both sides alike, in a sandbox HOME. Prints one JSON line per hook with the median
 * milliseconds of each side, after a `node -e 0` floor. Wall time on a shared laptop:
 * read the medians as ±20 ms.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { REPO, materialise, median } = require('./_base.js');

const base = process.argv[2] || '5852c57';
const RUNS = Number(process.argv[3]) || 10;
const baseRoot = materialise(base);
const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wave1-lat-')));
const env = Object.assign({}, process.env, { HOME: home, USERPROFILE: home, SSHLG_SKILLS_NO_PROBE: '1' });

const CASES = [
  ['session-start', 'session-start.js', { hook_event_name: 'SessionStart', source: 'startup', session_id: 'lat', cwd: home }],
  ['user-prompt-submit (routed)', 'user-prompt-submit.js', { session_id: '', prompt: 'сделай редизайн лендинга и почини баг в оплате' }],
  ['user-prompt-submit (no route)', 'user-prompt-submit.js', { session_id: '', prompt: 'привет, как дела у проекта сегодня' }],
  ['pre-tool-use Read', 'pre-tool-use.js', { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path: '/tmp/x' } }],
  ['pre-tool-use Edit', 'pre-tool-use.js', { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: '/tmp/x' } }],
  ['pre-tool-use Bash', 'pre-tool-use.js', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls -la' } }],
  ['post-tool-use Bash', 'post-tool-use.js', { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'ls -la' } }],
  ['repo-gate', 'repo-gate.js', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: home }],
  ['notification', 'notification.js', { hook_event_name: 'Notification', notification_type: 'agent_completed' }],
  ['config-change', 'config-change.js', { hook_event_name: 'ConfigChange', source: 'user_settings' }],
  ['file-changed', 'file-changed.js', { hook_event_name: 'FileChanged', file_path: path.join(home, 'run.md') }],
  ['statusline', 'statusline.js', { session_id: 'lat', cwd: home, workspace: { current_dir: home } }],
];

function ms(args, input) {
  const t = process.hrtime.bigint();
  spawnSync(process.execPath, args, { input, env, cwd: home, encoding: 'utf8' });
  return Number(process.hrtime.bigint() - t) / 1e6;
}

const floor = [];
for (let i = 0; i < RUNS; i += 1) floor.push(ms(['-e', '0'], ''));
console.log(JSON.stringify({ hook: 'node -e 0 (floor)', ms: Math.round(median(floor)) }));
for (const [label, script, payload] of CASES) {
  const a = [];
  const b = [];
  for (let i = 0; i < RUNS; i += 1) {
    a.push(ms([path.join(baseRoot, 'hooks', script)], JSON.stringify(payload)));
    b.push(ms([path.join(REPO, 'hooks', script)], JSON.stringify(payload)));
  }
  console.log(JSON.stringify({ hook: label, base: Math.round(median(a)), tree: Math.round(median(b)) }));
}
fs.rmSync(baseRoot, { recursive: true, force: true });
fs.rmSync(home, { recursive: true, force: true });
