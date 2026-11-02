#!/usr/bin/env node
'use strict';
// B-280: the family guard on Gemini CLI, Kimi Code CLI, Hermes Agent, Pi and OpenCode.
// Payload fixtures follow the installed hosts read on 2026-11-02 (lib/hostgate.js header).
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const G = require('../lib/hostgate.js');
const I = require('../lib/hostgate-install.js');

const REPO = path.resolve(__dirname, '..');
const GATE = path.join(REPO, 'hooks', 'host-gate.js');
const CLI = path.join(REPO, 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
const pending = [];
function it(name, fn) {
  checks += 1;
  try {
    const r = fn();
    if (r && typeof r.then === 'function') pending.push(r.then(() => console.log(`ok ${name}`), (e) => failures.push(`${name}: ${e.stack}`)));
    else console.log(`ok ${name}`);
  } catch (e) { failures.push(`${name}: ${e.stack}`); }
}
const tmp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hostgate-')));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const tools = (list) => list.map((p) => [p.tool_name, p.tool_input.file_path || p.tool_input.command || p.tool_input.pattern]);

it('each host call becomes the Claude call the guard reads', () => {
  const cwd = '/w';
  assert.deepStrictEqual(tools(G.toClaude('gemini', { tool: 'run_shell_command', input: { command: 'cat .env', dir_path: 'sub' }, cwd })), [['Bash', 'cat .env']]);
  assert.strictEqual(G.toClaude('gemini', { tool: 'run_shell_command', input: { command: 'ls', dir_path: 'sub' }, cwd })[0].cwd, '/w/sub');
  assert.deepStrictEqual(tools(G.toClaude('gemini', { tool: 'read_file', input: { file_path: '.env' }, cwd })), [['Read', '/w/.env']]);
  assert.deepStrictEqual(tools(G.toClaude('gemini', { tool: 'read_many_files', input: { paths: ['a/.env', 'src/**/*.js'] }, cwd })), [['Read', '/w/a/.env']]);
  assert.deepStrictEqual(tools(G.toClaude('gemini', { tool: 'replace', input: { file_path: '/x/CLAUDE.md' }, cwd })), [['Edit', '/x/CLAUDE.md']]);
  assert.deepStrictEqual(tools(G.toClaude('gemini', { tool: 'grep_search', input: { pattern: 'KEY', dir_path: '.' }, cwd })), [['Grep', 'KEY']]);
  assert.deepStrictEqual(tools(G.toClaude('kimi', { tool: 'Read', input: { path: '.env' }, cwd })), [['Read', '/w/.env']]);
  assert.deepStrictEqual(tools(G.toClaude('kimi', { tool: 'Bash', input: { command: 'env' }, cwd })), [['Bash', 'env']]);
  assert.deepStrictEqual(tools(G.toClaude('hermes', { tool: 'terminal', input: { command: 'ls', workdir: '/t' }, cwd })), [['Bash', 'ls']]);
  assert.deepStrictEqual(tools(G.toClaude('hermes', { tool: 'patch', input: { patch: '*** Begin Patch\n*** Update File: a.txt\n*** End Patch' }, cwd })), [['Edit', '/w/a.txt']]);
  assert.strictEqual(G.toClaude('hermes', { tool: 'search_files', input: { pattern: 'x', target: 'files' }, cwd })[0].tool_input.output_mode, 'files_with_matches');
  assert.deepStrictEqual(tools(G.toClaude('pi', { tool: 'write', input: { path: 'n.txt', content: 'x' }, cwd })), [['Write', '/w/n.txt']]);
  assert.deepStrictEqual(tools(G.toClaude('opencode', { tool: 'edit', input: { filePath: '/a/b' }, cwd })), [['Edit', '/a/b']]);
  assert.deepStrictEqual(tools(G.toClaude('opencode', { tool: 'apply_patch', input: { patchText: '*** Add File: z.js\n' }, cwd })), [['Edit', '/w/z.js']]);
  // No session id: the route escalation (`ask`) is never armed on these hosts.
  for (const p of G.toClaude('kimi', { tool: 'Bash', input: { command: 'ls' }, cwd })) assert.strictEqual(p.session_id, undefined);
});

it('what is not gated, or not understood, becomes nothing', () => {
  assert.deepStrictEqual(G.toClaude('gemini', { tool: 'web_fetch', input: {} }), []);
  assert.deepStrictEqual(G.toClaude('pi', { tool: 'bash', input: { command: 42 } }), []);
  assert.deepStrictEqual(G.toClaude('opencode', null), []);
  assert.deepStrictEqual(G.toClaude('nobody', { tool: 'bash', input: { command: 'ls' } }), []);
  assert.deepStrictEqual(G.toClaude('gemini', { tool: 'mcp_unknown_tool', input: {} }), []);
});

it('a refusal is spelled in each host\'s words; a pass is silence', () => {
  assert.deepStrictEqual(JSON.parse(G.answer('gemini', 'no')), { decision: 'deny', reason: 'no' });
  assert.deepStrictEqual(JSON.parse(G.answer('hermes', 'no')), { decision: 'block', reason: 'no' });
  assert.strictEqual(JSON.parse(G.answer('kimi', 'no')).hookSpecificOutput.permissionDecision, 'deny');
  assert.strictEqual(G.answer('gemini', null), '');
  assert.strictEqual(G.denied('{"hookSpecificOutput":{"permissionDecision":"allow"}}'), null);
  assert.strictEqual(G.denied('garbage'), null);
});

function gate(host, payload, cwd) {
  return spawnSync(process.execPath, [GATE, host], { input: payload, cwd: cwd || os.tmpdir(), encoding: 'utf8', timeout: 20000 });
}

it('host-gate.js refuses a credential read on each command host and exits 0', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, '.env'), 'X=1\n');
  const cases = [
    ['gemini', { hook_event_name: 'BeforeTool', tool_name: 'read_file', tool_input: { file_path: '.env' }, cwd: d }, (o) => o.decision === 'deny'],
    ['kimi', { hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { path: '.env' } }, (o) => o.hookSpecificOutput.permissionDecision === 'deny'],
    ['hermes', { hook_event_name: 'pre_tool_call', tool_name: 'read_file', tool_input: { path: '.env' }, cwd: d }, (o) => o.decision === 'block'],
  ];
  for (const [host, payload, test] of cases) {
    const r = gate(host, JSON.stringify(payload), d);
    assert.strictEqual(r.status, 0, `${host}: ${r.stderr}`);
    assert.ok(test(JSON.parse(r.stdout)), `${host}: ${r.stdout}`);
  }
});

it('host-gate.js is silent and exits 0 on an ordinary call, garbage, an unknown host and no input', () => {
  const ok = [
    gate('gemini', JSON.stringify({ tool_name: 'run_shell_command', tool_input: { command: 'ls' }, cwd: os.tmpdir() })),
    gate('kimi', 'not json'),
    gate('hermes', '{"tool_name":'),
    gate('nobody', JSON.stringify({ tool_name: 'Read', tool_input: { path: '.env' } })),
    gate('gemini', ''),
  ];
  for (const r of ok) { assert.strictEqual(r.status, 0); assert.strictEqual(r.stdout, ''); }
});

async function loadPlugin(host, root) {
  const d = tmp();
  const file = path.join(d, `${host}.mjs`);
  fs.writeFileSync(file, I.ownFile(host, root, process.execPath));
  return import(file);
}

it('the Pi extension blocks a credential read, passes the rest and never throws', async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, '.env'), 'X=1\n');
  let handler;
  (await loadPlugin('pi', REPO)).default({ on: (event, fn) => { assert.strictEqual(event, 'tool_call'); handler = fn; } });
  const blocked = await handler({ toolName: 'read', input: { path: '.env' } }, { cwd: d });
  assert.strictEqual(blocked.block, true);
  assert.ok(blocked.reason.length > 10);
  assert.strictEqual(await handler({ toolName: 'bash', input: { command: 'ls' } }, { cwd: d }), undefined);
  assert.strictEqual(await handler(null, null), undefined);
  // A runtime that is gone: no handler at all, so nothing can block.
  let none = null;
  (await loadPlugin('pi', path.join(d, 'missing'))).default({ on: () => { none = 'registered'; } });
  assert.strictEqual(none, null);
});

it('the OpenCode plugin throws only to refuse', async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, '.env'), 'X=1\n');
  const mod = await loadPlugin('opencode', REPO);
  assert.deepStrictEqual(Object.keys(mod), ['SshlgSkillsGate']);
  const hooks = await mod.SshlgSkillsGate({ directory: d });
  await assert.rejects(() => hooks['tool.execute.before']({ tool: 'read' }, { args: { filePath: '.env' } }), /credential/);
  await hooks['tool.execute.before']({ tool: 'bash' }, { args: { command: 'ls' } });
  await hooks['tool.execute.before'](undefined, undefined);
  assert.deepStrictEqual(await (await loadPlugin('opencode', path.join(d, 'missing'))).SshlgSkillsGate({}), {});
});

// --- installation, on a home with every host and somebody else's hooks beside ours ---
const GEMINI = JSON.stringify({ hooks: { BeforeTool: [{ hooks: [{ type: 'command', command: '/bin/sh ~/.orca/gemini-hook.sh', timeout: 10000 }] }] }, ui: { theme: 'x' } }, null, 2) + '\n';
const KIMI = 'default_model = "k"\n\n[[hooks]]\nevent = "PreToolUse"\ncommand = "orca-hook"\ntimeout = 10\n';
const HERMES = 'model:\n  default: m\nplugins:\n  enabled:\n  - sshlg-routing\n';
function home() {
  const h = tmp();
  fs.mkdirSync(path.join(h, '.gemini'));
  fs.writeFileSync(path.join(h, '.gemini', 'settings.json'), GEMINI);
  fs.mkdirSync(path.join(h, '.kimi-code'));
  fs.writeFileSync(path.join(h, '.kimi-code', 'config.toml'), KIMI);
  fs.mkdirSync(path.join(h, '.hermes'));
  fs.writeFileSync(path.join(h, '.hermes', 'config.yaml'), HERMES);
  fs.mkdirSync(path.join(h, '.pi', 'agent'), { recursive: true });
  fs.mkdirSync(path.join(h, '.config', 'opencode'), { recursive: true });
  fs.mkdirSync(path.join(h, '.claude'));
  return h;
}
const opts = (h, more) => Object.assign({ home: h, env: {}, root: '/R/runtime', node: '/usr/bin/node' }, more || {});
const files = (h) => I.HOSTS.map((x) => I.where(x, h, {}).file);
function installAll(h) {
  for (const host of I.HOSTS) {
    const p = I.plan(host, opts(h));
    if (p.state === 'current') continue;
    assert.ok(['install', 'update'].includes(p.state), `${host}: ${JSON.stringify(p)}`);
    assert.strictEqual(I.write(p, { home: h }).ok, true, host);
  }
}

it('install wires all five beside the hooks already there; three runs, identical bytes', () => {
  const h = home();
  installAll(h);
  const before = files(h).map(sha);
  installAll(h);
  installAll(h);
  assert.deepStrictEqual(files(h).map(sha), before);
  const g = JSON.parse(fs.readFileSync(files(h)[0], 'utf8'));
  assert.strictEqual(g.ui.theme, 'x');
  assert.strictEqual(g.hooks.BeforeTool.length, 2);
  assert.ok(g.hooks.BeforeTool[0].hooks[0].command.includes('orca'));
  assert.match(g.hooks.BeforeTool[1].hooks[0].command, /^node "\/R\/runtime\/hooks\/host-gate\.js" gemini 2>\/dev\/null \|\| true$/);
  assert.strictEqual(g.hooks.BeforeTool[1].matcher, require('../lib/hooks.js').GEMINI_MATCHER);
  const kimi = fs.readFileSync(files(h)[1], 'utf8');
  assert.ok(kimi.startsWith(KIMI) && kimi.includes('command = "node /R/runtime/hooks/host-gate.js kimi"'), kimi);
  const hermes = fs.readFileSync(files(h)[2], 'utf8');
  assert.ok(hermes.startsWith(HERMES) && hermes.includes('pre_tool_call:'), hermes);
  assert.ok(fs.readFileSync(files(h)[3], 'utf8').startsWith(I.FILE_HEADER));
  for (const x of I.HOSTS) assert.strictEqual(I.planRemoval(x, opts(h)).state, 'remove', x);
  assert.deepStrictEqual(I.wired(opts(h)), I.HOSTS);
});

it('remove gives back the original bytes and deletes the own files, after a copy', () => {
  const h = home();
  installAll(h);
  for (const host of I.HOSTS) assert.strictEqual(I.write(I.planRemoval(host, opts(h)), { home: h }).ok, true, host);
  assert.strictEqual(fs.readFileSync(files(h)[1], 'utf8'), KIMI);
  assert.strictEqual(fs.readFileSync(files(h)[2], 'utf8'), HERMES);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(files(h)[0], 'utf8')), JSON.parse(GEMINI));
  assert.ok(!fs.existsSync(files(h)[3]) && !fs.existsSync(files(h)[4]));
  assert.ok(fs.readdirSync(path.join(h, '.sshlg-skills', 'backups'), { recursive: true }).length >= 5);
  for (const x of I.HOSTS) assert.strictEqual(I.planRemoval(x, opts(h)).state, 'not-wired', x);
});

it('an absent host is never created; update adds nothing where no gate was wired', () => {
  const h = tmp();
  for (const x of I.HOSTS) assert.strictEqual(I.plan(x, opts(h)).state, 'absent-host', x);
  assert.deepStrictEqual(fs.readdirSync(h), []);
  const g = home();
  for (const x of I.HOSTS) assert.strictEqual(I.plan(x, opts(g, { refreshOnly: true })).state, 'not-wired', x);
});

it('update refreshes a wired gate whose runtime moved', () => {
  const h = home();
  installAll(h);
  const p = I.plan('kimi', opts(h, { root: '/R2/runtime', refreshOnly: true }));
  assert.strictEqual(p.state, 'update');
  assert.ok(p.next.includes('/R2/runtime/hooks/host-gate.js') && !p.next.includes('/R/runtime'));
  assert.strictEqual(p.next.split(I.BEGIN).length, 2, 'one block, not two');
});

it('conflicts write nothing: Hermes with hooks of its own, a foreign plugin file, a torn block', () => {
  const h = home();
  fs.writeFileSync(files(h)[2], HERMES + 'hooks:\n  post_tool_call: []\n');
  const hp = I.plan('hermes', opts(h));
  assert.strictEqual(hp.state, 'conflict');
  assert.match(hp.reason, /pre_tool_call/);
  fs.mkdirSync(path.dirname(files(h)[4]), { recursive: true });
  fs.writeFileSync(files(h)[4], 'export const Mine = async () => ({});\n');
  assert.strictEqual(I.plan('opencode', opts(h)).state, 'conflict');
  assert.strictEqual(I.planRemoval('opencode', opts(h)).state, 'not-wired');
  fs.writeFileSync(files(h)[1], KIMI + I.BEGIN + '\n[[hooks]]\n');
  assert.strictEqual(I.plan('kimi', opts(h)).state, 'conflict');
});

it('`hooks install --kimi --pi` and `hooks remove` through the launcher', () => {
  const h = home();
  const env = Object.assign({}, process.env, { HOME: h, USERPROFILE: h });
  for (const k of ['CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'HERMES_HOME', 'KIMI_CODE_HOME', 'GEMINI_CLI_HOME', 'PI_CODING_AGENT_DIR', 'XDG_CONFIG_HOME']) delete env[k];
  const run = (...args) => spawnSync(process.execPath, [CLI, 'hooks', ...args], { env, encoding: 'utf8', timeout: 60000 });
  const dry = run('install', '--kimi', '--dry-run');
  assert.strictEqual(dry.status, 0, dry.stdout + dry.stderr);
  assert.strictEqual(fs.readFileSync(files(h)[1], 'utf8'), KIMI);
  const r = run('install', '--kimi', '--pi');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const runtime = path.join(h, '.sshlg-skills', 'runtime');
  assert.ok(fs.readFileSync(files(h)[1], 'utf8').includes(path.join(runtime, 'hooks', 'host-gate.js')));
  assert.ok(fs.existsSync(path.join(runtime, 'hooks', 'host-gate.js')) && fs.existsSync(path.join(runtime, 'lib', 'hostgate.js')));
  assert.ok(fs.existsSync(files(h)[3]));
  assert.match(run('status').stdout, /hooks kimi: подключено и совпадает/);
  const rm = run('remove');
  assert.strictEqual(rm.status, 0, rm.stdout + rm.stderr);
  assert.strictEqual(fs.readFileSync(files(h)[1], 'utf8'), KIMI);
  assert.ok(!fs.existsSync(files(h)[3]));
  const absent = spawnSync(process.execPath, [CLI, 'hooks', 'install', '--opencode'], { env: Object.assign({}, env, { HOME: tmp() }), encoding: 'utf8', timeout: 60000 });
  assert.notStrictEqual(absent.status, 0);
  assert.match(absent.stdout + absent.stderr, /opencode is not installed here/);
});

Promise.all(pending).then(() => {
  if (failures.length) {
    for (const f of failures) console.log(`FAIL: ${f}`);
    console.log(`${failures.length} failure(s) out of ${checks} checks`);
    process.exit(1);
  }
  console.log(`OK (${checks} checks)`);
});
