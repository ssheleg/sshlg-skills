#!/usr/bin/env node
'use strict';
/**
 * Per-tool-call hook cost, measured the same way every time (B-236).
 *
 *   node scripts/hook-bench.js [runs]                 # default 20 runs per case
 *   node scripts/hook-bench.js 20 --json              # machine-readable rows
 *   node scripts/hook-bench.js 20 --root <checkout>   # the hooks of another tree (a before)
 *   node scripts/hook-bench.js 20 --census [--json]   # every hook one Bash call wakes (B-268)
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
 *
 * `--census` (B-268) counts processes instead of timing one hook. It READS the profile's
 * `settings.json`, its `installed_plugins.json` and each enabled plugin's `hooks/hooks.json`
 * (never writes them), keeps every PreToolUse and PostToolUse entry a Bash call wakes, and
 * runs each one, as the host does (`/bin/bash -c <command>`), under a temporary HOME in two
 * temporary git projects: `plain`, and `coordinated` (an agent-sync config and a task-pipeline
 * run in flight, the state that wakes the most). Processes are counted from two logs: a PATH
 * of shims that record the pid of every program started by name, and a `BASH_ENV` that turns
 * on `set -x` with a PS4 recording the pid of the shell that traces (bash 3.2 has no
 * BASHPID; `$(exec /bin/sh -c 'echo $PPID')` names the tracing shell itself). A program
 * started by absolute path from inside python or node is not seen, so a count is a floor.
 * A foreign hook (another tool's) is counted and never printed.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function quantile(sorted, q) {
  const i = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, i)];
}

/** Does this matcher wake the hook for `tool`? Claude Code's reading of a matcher. */
function matcherHits(matcher, tool) {
  if (matcher === undefined || matcher === null || matcher === '' || matcher === '*') return true;
  if (/^[A-Za-z0-9_|]+$/.test(matcher)) return matcher.split('|').includes(tool);
  try { return new RegExp(matcher).test(tool); } catch (e) { return false; }
}

/** Distinct processes in a census run: pids from the shell trace and the exec log. */
function processCount(traceText, execText) {
  const pids = new Map();
  for (const l of String(traceText || '').split('\n')) {
    const m = /^(\d+)$/.exec(l.trim());
    if (m && !pids.has(m[1])) pids.set(m[1], 'bash');
  }
  for (const l of String(execText || '').split('\n')) {
    const m = /^(\d+) (\S+)/.exec(l.trim());
    if (m) pids.set(m[1], m[2]);
  }
  const kinds = {};
  for (const k of pids.values()) kinds[k] = (kinds[k] || 0) + 1;
  return { n: pids.size, kinds };
}

/**
 * Every hook entry the host would run, owner named: `hub` (a command under the runtime
 * directory), `foreign` (any other profile entry), `project` (the project's own settings)
 * or the plugin's name. `family` marks the hub and the members `family` lists.
 */
function collectHooks({ settings, project, plugins, runtime, family }) {
  const out = [];
  const fam = new Set(family || []);
  const walk = (hooks, owner, root) => {
    for (const [event, groups] of Object.entries((hooks && hooks.hooks) || {})) {
      if (!Array.isArray(groups)) continue;
      for (const g of groups) {
        for (const h of (g && g.hooks) || []) {
          if (!h || typeof h.command !== 'string') continue;
          const who = owner || (runtime && h.command.includes(`${runtime}/hooks/`) ? 'hub' : 'foreign');
          out.push({ owner: who, family: who === 'hub' || fam.has(who), event, matcher: g.matcher,
            command: h.command, async: Boolean(h.async), root: root || null });
        }
      }
    }
  };
  walk(settings, null, null);
  walk(project, 'project', null);
  for (const p of plugins || []) walk(p.hooks, p.name, p.root);
  return out;
}

/** What a row prints: the script a family or project entry runs; nothing of a foreign one. */
function label(h) {
  if (h.owner === 'foreign') return '(a hook of another tool)';
  const c = String(h.command);
  const m = /(?:\$\{CLAUDE_PLUGIN_ROOT\}|\$CLAUDE_PROJECT_DIR|\$\{CLAUDE_PROJECT_DIR\}|\/runtime)\/((?:hooks|skills)\/[^"\s]+)"?(.*)$/.exec(c);
  if (!m) return c.split(/\s+/)[0];
  return `${m[1]}${m[2] ? ` ${m[2].trim()}` : ''}`.trim();
}

/** The BASH_ENV that records the pid of every shell that runs a traced command. */
function tracerEnv(traceFile) {
  return `PS4='+$(exec /bin/sh -c "echo \\$PPID >> ${traceFile}")'\nset -x\n`;
}

function bench(argv) {
  const at = argv.indexOf('--root');
  const ROOT = path.resolve(at > 0 ? argv[at + 1] : path.join(__dirname, '..'));
  const runs = Math.max(1, Number(argv[2]) || 20);
  const asJson = argv.includes('--json');

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
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
}

function census(argv) {
  const runs = Math.max(1, Number(argv[2]) || 20);
  const asJson = argv.includes('--json');
  const realHome = os.homedir();
  const profile = process.env.CLAUDE_CONFIG_DIR || path.join(realHome, '.claude');
  const settings = readJson(path.join(profile, 'settings.json')) || {};
  const installed = (readJson(path.join(profile, 'plugins', 'installed_plugins.json')) || {}).plugins || {};
  const plugins = [];
  for (const [key, on] of Object.entries(settings.enabledPlugins || {})) {
    const rows = installed[key];
    if (!on || !Array.isArray(rows) || !rows[0] || !rows[0].installPath) continue;
    const hooks = readJson(path.join(rows[0].installPath, 'hooks', 'hooks.json'));
    if (hooks) plugins.push({ name: key.split('@')[0], version: rows[0].version, root: rows[0].installPath, hooks });
  }
  const family = (readJson(path.join(__dirname, '..', 'skills.json')) || { skills: [] }).skills.map((s) => s.name);
  const runtime = path.join(realHome, '.sshlg-skills', 'runtime');
  const all = collectHooks({ settings, plugins, runtime, family })
    .filter((h) => (h.event === 'PreToolUse' || h.event === 'PostToolUse') && matcherHits(h.matcher, 'Bash'))
    .sort((a, b) => (a.event === b.event ? 0 : a.event === 'PreToolUse' ? -1 : 1));

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hook-census-'));
  const home = path.join(work, 'home');
  const shim = path.join(work, 'shim');
  const execLog = path.join(work, 'exec.log');
  const trace = path.join(work, 'trace.log');
  const bashEnv = path.join(work, 'bashenv');
  fs.mkdirSync(home); fs.mkdirSync(shim);
  fs.writeFileSync(bashEnv, tracerEnv(trace));
  const seen = new Set(['bash', 'sh', 'env']);
  for (const d of (process.env.PATH || '').split(path.delimiter)) {
    let names = [];
    try { names = fs.readdirSync(d); } catch (e) { continue; }
    for (const n of names) {
      if (seen.has(n) || !/^[A-Za-z0-9._+-]+$/.test(n)) continue;
      const p = path.join(d, n);
      try { fs.accessSync(p, fs.constants.X_OK); if (!fs.statSync(p).isFile()) continue; } catch (e) { continue; }
      seen.add(n);
      fs.writeFileSync(path.join(shim, n), `#!/bin/sh\necho "$$ ${n}" >> "${execLog}"\nexec "${p}" "$@"\n`, { mode: 0o755 });
    }
  }
  const projects = {};
  for (const name of ['plain', 'coordinated']) {
    const dir = path.join(work, name);
    fs.mkdirSync(dir);
    spawnSync('git', ['init', '-q', dir], { stdio: 'ignore' });
    projects[name] = dir;
  }
  const co = projects.coordinated;
  fs.mkdirSync(path.join(co, '.claude'));
  fs.writeFileSync(path.join(co, '.claude', 'agent-sync.json'), JSON.stringify({ backend: 'fs', guardedFiles: ['docs/board.md'] }));
  fs.mkdirSync(path.join(co, '.task-pipeline'));
  fs.writeFileSync(path.join(co, '.task-pipeline', 'run.md'), 'Run: census\nstage: 1 intake verdict pass\n');
  fs.writeFileSync(path.join(co, 'pipeline.json'), JSON.stringify({ stages: [{ id: '5', state: 'tests', gate: { command: 'npm test' } }] }));

  const payload = (event, cwd) => JSON.stringify(Object.assign(
    { session_id: 'hook-census', transcript_path: '/dev/null', cwd, permission_mode: 'default', hook_event_name: event,
      tool_name: 'Bash', tool_input: { command: 'ls -la', description: 'list' } },
    event === 'PostToolUse' ? { tool_response: { stdout: 'a\nb\n', stderr: '', interrupted: false } } : {}));
  const envFor = (h, cwd, instrument) => {
    const e = Object.assign({}, process.env, { HOME: home, USERPROFILE: home, CLAUDE_PROJECT_DIR: cwd });
    delete e.CLAUDE_SESSION_ID; delete e.CLAUDE_CODE_SESSION_ID; delete e.CLAUDE_CONFIG_DIR;
    if (h.root) e.CLAUDE_PLUGIN_ROOT = h.root; else delete e.CLAUDE_PLUGIN_ROOT;
    if (instrument) { e.PATH = `${shim}${path.delimiter}${process.env.PATH}`; e.BASH_ENV = bashEnv; }
    return e;
  };
  const runOnce = (h, event, cwd, instrument) => spawnSync('/bin/bash', ['-c', h.command], {
    input: payload(event, cwd), cwd, env: envFor(h, cwd, instrument), encoding: 'utf8', timeout: 20000,
  });

  const rows = [];
  try {
    for (const [pname, cwd] of Object.entries(projects)) {
      for (const h of all) {
        fs.writeFileSync(execLog, ''); fs.writeFileSync(trace, '');
        const r = runOnce(h, h.event, cwd, true);
        const c = processCount(fs.readFileSync(trace, 'utf8'), fs.readFileSync(execLog, 'utf8'));
        runOnce(h, h.event, cwd, false); // warm-up, discarded
        const xs = [];
        for (let i = 0; i < runs; i += 1) {
          const t0 = process.hrtime.bigint();
          runOnce(h, h.event, cwd, false);
          xs.push(Number(process.hrtime.bigint() - t0) / 1e6);
        }
        xs.sort((a, b) => a - b);
        rows.push({ project: pname, event: h.event, owner: h.owner, family: h.family, script: label(h), async: h.async,
          processes: c.n, kinds: c.kinds, median: +quantile(xs, 0.5).toFixed(1), exit: r.status });
      }
    }
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }

  const totals = [];
  for (const pname of Object.keys(projects)) {
    for (const event of ['PreToolUse', 'PostToolUse']) {
      const rs = rows.filter((r) => r.project === pname && r.event === event);
      const fam = rs.filter((r) => r.family);
      const sync = rs.filter((r) => !r.async);
      totals.push({ project: pname, event, entries: rs.length, processes: rs.reduce((a, r) => a + r.processes, 0),
        familyEntries: fam.length, familyProcesses: fam.reduce((a, r) => a + r.processes, 0),
        hubProcesses: rs.filter((r) => r.owner === 'hub').reduce((a, r) => a + r.processes, 0),
        slowestSyncMedian: sync.length ? Math.max(...sync.map((r) => r.median)) : 0 });
    }
  }
  if (asJson) {
    process.stdout.write(JSON.stringify({ node: process.version, runs, rows, totals }, null, 2) + '\n');
    return;
  }
  process.stdout.write(`node ${process.version}, census of one Bash call (ls -la), ${runs} timed runs per entry\n`
    + '(processes = distinct pids started for the entry, a floor; ms = median wall of the entry alone)\n');
  for (const r of rows) {
    const kinds = Object.entries(r.kinds).map(([k, v]) => `${k} ${v}`).join(', ');
    process.stdout.write(`${r.project.padEnd(12)}${r.event.padEnd(12)}${r.owner.padEnd(14)}${r.script.padEnd(34)}`
      + `${String(r.processes).padStart(3)} proc  ${String(r.median).padStart(6)} ms${r.async ? '  async' : ''}  (${kinds})\n`);
  }
  for (const t of totals) {
    process.stdout.write(`total ${t.project} ${t.event}: ${t.entries} entries, ${t.processes} processes `
      + `(family ${t.familyEntries} entries, ${t.familyProcesses} processes; hub ${t.hubProcesses}); slowest synchronous entry ${t.slowestSyncMedian} ms\n`);
  }
}

module.exports = { matcherHits, processCount, collectHooks, label, tracerEnv, bench, census };

if (require.main === module) {
  if (process.argv.includes('--census')) census(process.argv);
  else bench(process.argv);
}
