#!/usr/bin/env node
'use strict';
/**
 * Per-tool-call hook cost, measured the same way every time (B-236).
 *
 *   node scripts/hook-bench.js [runs]                 # default 20 runs per case
 *   node scripts/hook-bench.js 20 --json              # machine-readable rows
 *   node scripts/hook-bench.js 20 --root <checkout>   # the hooks of another tree (a before)
 *
 * Each case pipes one payload into one real hook process (`hooks/pre-tool-use.js`,
 * `hooks/post-tool-use.js`) and times the wall clock of the whole process, which is
 * what the host waits for. `node-empty` is the floor: a node process that reads stdin
 * and exits, so the difference is what this pack's code costs on top of node itself.
 *
 * HOME is a fresh temporary directory, so the run never reads or writes the
 * operator's files; the session id is the bench's own. The figure is median and p90
 * over `runs` runs after one discarded warm-up run per case.
 *
 * Wall time on a loaded machine is mostly the scheduler. So each run also reports, from
 * inside the process, `in-proc`: milliseconds from process start to exit
 * (`performance.now()` at `exit`), and `mods`: how many of the pack's modules were loaded.
 * Those two move with the code and barely with the load.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const at = process.argv.indexOf('--root');
const ROOT = path.resolve(at > 0 ? process.argv[at + 1] : path.join(__dirname, '..'));
const runs = Math.max(1, Number(process.argv[2]) || 20);
const asJson = process.argv.includes('--json');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hook-bench-'));
const probe = path.join(home, 'probe.js');
fs.writeFileSync(probe, "process.on('exit', () => process.stderr.write('\\n@bench ' + performance.now().toFixed(2) + ' '"
  + " + Object.keys(require.cache).filter((k) => k !== __filename).length + '\\n'));\n");
const cwd = ROOT;
const base = { session_id: 'hook-bench', cwd, permission_mode: 'default', prompt_id: 'p1' };

const PRE = path.join(ROOT, 'hooks', 'pre-tool-use.js');
const POST = path.join(ROOT, 'hooks', 'post-tool-use.js');

const CASES = [
  { name: 'node-empty', script: null, payload: { ...base, tool_name: 'Bash', tool_input: { command: 'ls' } } },
  { name: 'pre Bash ls', script: PRE, payload: { ...base, tool_name: 'Bash', tool_input: { command: 'ls -la' } } },
  { name: 'pre Bash git status', script: PRE, payload: { ...base, tool_name: 'Bash', tool_input: { command: 'git status --short' } } },
  { name: 'pre Read', script: PRE, payload: { ...base, tool_name: 'Read', tool_input: { file_path: path.join(ROOT, 'README.md') } } },
  { name: 'pre Grep', script: PRE, payload: { ...base, tool_name: 'Grep', tool_input: { pattern: 'x', path: ROOT } } },
  { name: 'pre Edit', script: PRE, payload: { ...base, tool_name: 'Edit', tool_input: { file_path: path.join(ROOT, 'README.md'), old_string: 'a', new_string: 'b' } } },
  { name: 'post Bash ls', script: POST, payload: { ...base, tool_name: 'Bash', tool_input: { command: 'ls -la' }, tool_response: { stdout: 'a\nb\nc\n', stderr: '' } } },
  { name: 'post Read', script: POST, payload: { ...base, tool_name: 'Read', tool_input: { file_path: path.join(ROOT, 'README.md') }, tool_response: { content: 'hello\n'.repeat(200) } } },
];

function once(c) {
  const input = JSON.stringify(c.payload);
  const args = ['-r', probe].concat(c.script ? [c.script]
    : ['-e', "process.stdin.on('data',()=>{});process.stdin.on('end',()=>process.exit(0))"]);
  const t0 = process.hrtime.bigint();
  const r = spawnSync(process.execPath, args, {
    input, encoding: 'utf8', cwd,
    env: { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_PROJECT_DIR: cwd },
  });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  if (r.status !== 0) throw new Error(`${c.name}: exit ${r.status} ${r.stderr}`);
  const m = /@bench ([\d.]+) (\d+)/.exec(r.stderr || '');
  return { ms, inproc: m ? Number(m[1]) : NaN, mods: m ? Number(m[2]) : NaN };
}

function quantile(sorted, q) {
  const i = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, i)];
}

const rows = [];
try {
  for (const c of CASES) {
    once(c); // warm-up, discarded
    const got = [];
    for (let i = 0; i < runs; i += 1) got.push(once(c));
    const xs = got.map((g) => g.ms).sort((a, b) => a - b);
    const ins = got.map((g) => g.inproc).sort((a, b) => a - b);
    rows.push({
      case: c.name, runs, median: +quantile(xs, 0.5).toFixed(1), p90: +quantile(xs, 0.9).toFixed(1),
      max: +xs[xs.length - 1].toFixed(1), inprocMedian: +quantile(ins, 0.5).toFixed(1), mods: got[0].mods,
    });
  }
} finally {
  fs.rmSync(home, { recursive: true, force: true });
}

if (asJson) process.stdout.write(JSON.stringify({ node: process.version, rows }, null, 2) + '\n');
else {
  process.stdout.write(`node ${process.version}, ${runs} runs per case, hooks of ${ROOT}\n`
    + '(wall ms per hook process; in-proc = ms from process start to exit; mods = modules loaded)\n');
  for (const r of rows) {
    process.stdout.write(`${r.case.padEnd(22)} median ${String(r.median).padStart(6)}  p90 ${String(r.p90).padStart(6)}`
      + `  max ${String(r.max).padStart(6)}  in-proc ${String(r.inprocMedian).padStart(5)}  mods ${String(r.mods).padStart(2)}\n`);
  }
}
