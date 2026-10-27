#!/usr/bin/env node
'use strict';
// The family's hook scripts as Cursor and Codex run them, and the installer that wires
// them (B-209; B-218 CLAUDE-7, CLAUDE-8).
//
// Cursor imports the PreToolUse entry from ~/.claude/settings.json and sends its own
// payload. For a permission hook, Cursor BLOCKS the call when the output is not JSON
// (https://cursor.com/docs/agent/hooks), so every answer here is checked against the
// validator Cursor applies (transcribed from cursor-agent 2026.09.02-c22c1a3 index.js).
// Codex runs the same script from ~/.codex/hooks.json (https://learn.chatgpt.com/docs/hooks).
//
// Everything runs the real scripts and the real CLI in a temporary HOME; nothing here
// reads or writes the operator's own files.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');
const HOME = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hosts-e2e-')));
const BASE_ENV = Object.assign({}, process.env, { HOME, USERPROFILE: HOME, SSHLG_SKILLS_NO_PROBE: '1' });
delete BASE_ENV.CLAUDE_CONFIG_DIR;
delete BASE_ENV.CODEX_HOME;
delete BASE_ENV.GEMINI_CLI_HOME;
delete BASE_ENV.CLAUDE_PROJECT_DIR;

function hookRaw(script, stdin, env) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'hooks', script)], {
    input: typeof stdin === 'string' ? stdin : JSON.stringify(stdin),
    encoding: 'utf8', env: env || BASE_ENV,
  });
  assert.strictEqual(r.status, 0, `${script} exited ${r.status}: ${r.stderr}`);
  return { stdout: r.stdout || '', stderr: r.stderr || '' };
}

function cli(args, env) {
  return spawnSync(process.execPath, [path.join(ROOT, 'bin', 'sshlg-skills.js')].concat(args),
    { encoding: 'utf8', env: env || BASE_ENV });
}

function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function write(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
function backups() {
  const dir = path.join(HOME, '.sshlg-skills', 'backups');
  try { return fs.readdirSync(dir); } catch (e) { return []; }
}

/**
 * Cursor's acceptance of a preToolUse answer: empty stdout is "no decision"; anything else
 * must parse (Cursor also tries the last `{...}` suffix, which a clean line never needs)
 * and pass the validator: an object, `permission` in allow|deny|ask, messages strings.
 */
function cursorAccepts(stdout) {
  const t = stdout.trim();
  if (!t) return null;
  const v = JSON.parse(t);
  assert.ok(v && typeof v === 'object' && !Array.isArray(v), 'not an object');
  if (v.permission !== undefined) assert.ok(['allow', 'deny', 'ask'].includes(v.permission), `permission ${v.permission}`);
  for (const k of ['user_message', 'agent_message']) {
    if (v[k] !== undefined) assert.strictEqual(typeof v[k], 'string', k);
  }
  return v;
}

const CURSOR = { conversation_id: 'conv-e2e', generation_id: 'gen-1', hook_event_name: 'preToolUse',
  model: 'auto', cwd: HOME, tool_use_id: 'tu-1' };
const cursor = (o) => Object.assign({}, CURSOR, o);

const CLAUDE_MD = path.join(HOME, '.claude', 'CLAUDE.md');
write(CLAUDE_MD, '# operator rules\n');

// --- Cursor: the guards that must hold -----------------------------------------

it('Cursor Shell reading a credential file is refused in Cursor\'s own shape', () => {
  const v = cursorAccepts(hookRaw('pre-tool-use.js', cursor({ tool_name: 'Shell', tool_input: { command: 'cat /tmp/.env' } })).stdout);
  assert.ok(v, 'nothing was said: the secret guard does not reach Cursor\'s shell');
  assert.strictEqual(v.permission, 'deny');
  assert.ok(v.user_message.length > 20 && v.agent_message === v.user_message);
  assert.strictEqual(v.hookSpecificOutput, undefined, 'the nested shape is read by Cursor only behind a flag');
});

it('Cursor Read of a credential file (`path`, not `file_path`) is refused', () => {
  const v = cursorAccepts(hookRaw('pre-tool-use.js', cursor({ tool_name: 'Read', tool_input: { path: '/tmp/.env' } })).stdout);
  assert.strictEqual(v && v.permission, 'deny');
});

it('Cursor Read of an ordinary file says nothing', () => {
  assert.strictEqual(hookRaw('pre-tool-use.js', cursor({ tool_name: 'Read', tool_input: { path: '/tmp/docs/readme.md' } })).stdout, '');
});

it('Cursor Write to the operator instruction file is copied first and decides nothing', () => {
  const before = backups().length;
  const out = hookRaw('pre-tool-use.js', cursor({ tool_name: 'Write', tool_input: { path: CLAUDE_MD, file_text: 'x' } }));
  assert.strictEqual(out.stdout, '');
  assert.match(out.stderr, /copy taken before the write/);
  assert.strictEqual(backups().length, before + 1);
});

it('Cursor Delete of the operator instruction file is copied first', () => {
  const before = backups().length;
  const out = hookRaw('pre-tool-use.js', cursor({ tool_name: 'Delete', tool_input: { path: CLAUDE_MD } }));
  assert.strictEqual(out.stdout, '');
  assert.strictEqual(backups().length, before + 1, 'a delete of an unrecoverable file went uncopied');
});

it('Cursor MCP:<tool> whose answer carries a credential is refused', () => {
  const v = cursorAccepts(hookRaw('pre-tool-use.js', cursor({ tool_name: 'MCP:db-cluster-list', tool_input: {} })).stdout);
  assert.strictEqual(v && v.permission, 'deny');
  assert.match(v.user_message, /db-cluster-list/);
});

it('Cursor MCP:<tool> that is not registered passes silently', () => {
  assert.strictEqual(hookRaw('pre-tool-use.js', cursor({ tool_name: 'MCP:list_issues', tool_input: { q: 'x' } })).stdout, '');
});

it('Cursor shell hygiene refusals arrive in Cursor\'s shape too', () => {
  const v = cursorAccepts(hookRaw('pre-tool-use.js', cursor({ tool_name: 'Shell', tool_input: { command: 'npx skills update task-pipeline' } })).stdout);
  assert.strictEqual(v && v.permission, 'deny');
});

// --- Cursor: the route escalation degrades to silence, the prompt note arrives ----

it('Claude control: an armed turn escalates the un-routed edit', () => {
  const dir = fs.mkdtempSync(path.join(HOME, 'hosts-route-'));
  hookRaw('user-prompt-submit.js', { session_id: 'claude-route', prompt_id: 'p1', prompt: 'сделай фичу экспорта в csv' });
  const out = JSON.parse(hookRaw('pre-tool-use.js', { hook_event_name: 'PreToolUse', session_id: 'claude-route',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'a.js') }, cwd: dir }).stdout);
  assert.strictEqual(out.hookSpecificOutput.permissionDecision, 'ask');
});

it('Cursor: the same turn gets the route note as additional_context, and the edit is not escalated', () => {
  const dir = fs.mkdtempSync(path.join(HOME, 'hosts-route-'));
  const note = hookRaw('user-prompt-submit.js', { conversation_id: 'conv-route', generation_id: 'g',
    hook_event_name: 'beforeSubmitPrompt', prompt: 'сделай фичу экспорта в csv' }).stdout;
  const parsed = JSON.parse(note.trim());
  assert.ok(typeof parsed.additional_context === 'string' && /task-pipeline/.test(parsed.additional_context),
    `the prompt note did not reach Cursor as JSON: ${note}`);
  const out = hookRaw('pre-tool-use.js', cursor({ conversation_id: 'conv-route', cwd: dir,
    tool_name: 'Write', tool_input: { path: path.join(dir, 'a.js') } }));
  assert.strictEqual(out.stdout, '', 'Cursor does not enforce `ask`; saying it spends the turn record for nothing');
});

it('Cursor: a prompt that names no route prints nothing at all', () => {
  assert.strictEqual(hookRaw('user-prompt-submit.js', { conversation_id: 'c2', hook_event_name: 'beforeSubmitPrompt', prompt: 'what time is it?' }).stdout, '');
});

// --- Cursor: stdout is JSON or nothing, whatever arrives ------------------------

const ODD = [
  '', 'not json', '[]', '{', 'null',
  JSON.stringify({ hook_event_name: 'preToolUse' }),
  JSON.stringify(cursor({ tool_name: 'Shell', tool_input: '{bad' })),
  JSON.stringify(cursor({ tool_name: 'Shell', tool_input: null })),
  JSON.stringify(cursor({ tool_name: 42, tool_input: { command: 'cat /tmp/.env' } })),
  JSON.stringify(cursor({ tool_name: 'MCP:', tool_input: {} })),
  JSON.stringify(cursor({ tool_name: 'Read', tool_input: { path: 7 } })),
  JSON.stringify(cursor({ tool_name: 'Grep', tool_input: { pattern: 'x', path: '/tmp/.env', output_mode: 'content' } })),
  JSON.stringify(cursor({ tool_name: 'Task', tool_input: { prompt: 'x' } })),
  JSON.stringify(cursor({ tool_name: 'Shell', tool_input: { command: 'echo `pi update`' } })),
];
for (const [i, stdin] of ODD.entries()) {
  it(`Cursor odd payload #${i}: stdout is empty or a JSON answer Cursor accepts`, () => {
    cursorAccepts(hookRaw('pre-tool-use.js', stdin).stdout);
  });
}

// --- Codex: the same script, its payload ---------------------------------------

const CODEX = { session_id: 'codex-s', turn_id: 'turn-1', hook_event_name: 'PreToolUse', model: 'gpt',
  cwd: HOME, permission_mode: 'default', transcript_path: null };
const codex = (o) => Object.assign({}, CODEX, o);

it('Codex apply_patch on ~/.codex/AGENTS.md (a relative path in the patch) is copied first', () => {
  write(path.join(HOME, '.codex', 'AGENTS.md'), '# codex rules\n');
  const before = backups().length;
  const out = hookRaw('pre-tool-use.js', codex({ tool_name: 'apply_patch', tool_input: {
    command: '*** Begin Patch\n*** Update File: .codex/AGENTS.md\n@@\n-# codex rules\n+# changed\n*** End Patch\n' } }));
  assert.strictEqual(out.stdout, '');
  assert.match(out.stderr, /copy taken before the write/);
  assert.strictEqual(backups().length, before + 1);
});

it('Codex apply_patch whose BODY quotes a refused command is not refused (the body is data)', () => {
  const out = hookRaw('pre-tool-use.js', codex({ tool_name: 'apply_patch', tool_input: {
    command: '*** Begin Patch\n*** Add File: notes.md\n+run npx skills update task-pipeline and cat /tmp/.env\n*** End Patch\n' } }));
  assert.strictEqual(out.stdout, '');
});

it('Codex Bash reading a credential file is refused in the Claude shape Codex reads', () => {
  const v = JSON.parse(hookRaw('pre-tool-use.js', codex({ tool_name: 'Bash', tool_input: { command: 'cat /tmp/.env' } })).stdout);
  assert.strictEqual(v.hookSpecificOutput.permissionDecision, 'deny');
});

it('Codex MCP tool whose answer carries a credential is refused', () => {
  const v = JSON.parse(hookRaw('pre-tool-use.js', codex({ tool_name: 'mcp__digitalocean__db-cluster-get', tool_input: {} })).stdout);
  assert.strictEqual(v.hookSpecificOutput.permissionDecision, 'deny');
});

// --- the installer: Codex --------------------------------------------------------

const FOREIGN_CODEX = {
  hooks: {
    SessionStart: [{ hooks: [{ type: 'command', command: 'python3 other-session.py', timeout: 5 }] }],
    PreToolUse: [{ hooks: [{ type: 'command', command: ': other-pack pre-tool', timeout: 10 }] }],
  },
};

it('`hooks install --codex` with no Codex home writes nothing anywhere and says so', () => {
  const env = Object.assign({}, BASE_ENV, { CODEX_HOME: path.join(HOME, 'no-codex-here') });
  const settings = path.join(HOME, '.claude', 'settings.json');
  const had = fs.existsSync(settings) ? sha(settings) : null;
  const r = cli(['hooks', 'install', '--codex'], env);
  assert.notStrictEqual(r.status, 0, 'an install that could not do what was asked reported success');
  assert.ok(!fs.existsSync(path.join(HOME, 'no-codex-here')), 'the host home was created');
  assert.strictEqual(fs.existsSync(settings) ? sha(settings) : null, had, 'the Claude half was written anyway');
  assert.match(r.stdout + r.stderr, /codex/i);
});

const CODEX_HOME = path.join(HOME, 'codex-home');
const CODEX_ENV = Object.assign({}, BASE_ENV, { CODEX_HOME });
const CODEX_HOOKS = path.join(CODEX_HOME, 'hooks.json');

it('THREE real runs of `hooks install --codex` write once, then leave hooks.json byte-identical', () => {
  write(CODEX_HOOKS, JSON.stringify(FOREIGN_CODEX, null, 2) + '\n');
  const before = backups().length;
  const runs = [];
  for (let i = 0; i < 3; i += 1) {
    const r = cli(['hooks', 'install', '--codex'], CODEX_ENV);
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    runs.push(sha(CODEX_HOOKS));
  }
  assert.strictEqual(runs[1], runs[0], 'the second run rewrote hooks.json');
  assert.strictEqual(runs[2], runs[1], 'the third run rewrote hooks.json');
  const after = JSON.parse(fs.readFileSync(CODEX_HOOKS, 'utf8'));
  const ours = after.hooks.PreToolUse.find((g) => g.hooks.some((h) => h.command.includes('/.sshlg-skills/runtime/hooks/pre-tool-use.js')));
  assert.ok(ours, 'no entry of ours in hooks.json');
  assert.strictEqual(ours.matcher, require('../lib/hooks.js').CODEX_MATCHER);
  assert.deepStrictEqual(Object.keys(ours.hooks[0]).sort(), ['command', 'timeout', 'type']);
  assert.deepStrictEqual(after.hooks.SessionStart, FOREIGN_CODEX.hooks.SessionStart, 'a foreign event changed');
  assert.deepStrictEqual(after.hooks.PreToolUse[0], FOREIGN_CODEX.hooks.PreToolUse[0], 'a foreign PreToolUse entry changed');
  const codexCopies = backups().length - before;
  assert.ok(codexCopies >= 1, 'hooks.json was written without a copy');
});

it('`hooks` reports the Codex entry as wired', () => {
  const r = cli(['hooks'], CODEX_ENV);
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /codex[^\n]*подключено и совпадает/i, r.stdout);
});

it('`hooks` names a stale Codex matcher and the repair', () => {
  const j = JSON.parse(fs.readFileSync(CODEX_HOOKS, 'utf8'));
  const g = j.hooks.PreToolUse.find((x) => x.hooks.some((h) => h.command.includes('/.sshlg-skills/runtime/')));
  g.matcher = 'Bash';
  write(CODEX_HOOKS, JSON.stringify(j, null, 2) + '\n');
  const r = cli(['hooks'], CODEX_ENV);
  assert.match(r.stdout, /codex[^\n]*устарело[\s\S]*PreToolUse: matcher[\s\S]*hooks install --codex/i, r.stdout);
  assert.strictEqual(cli(['hooks', 'install', '--codex'], CODEX_ENV).status, 0);
  assert.match(cli(['hooks'], CODEX_ENV).stdout, /подключено и совпадает/);
});

it('`hooks install` without --codex leaves hooks.json alone', () => {
  const h = sha(CODEX_HOOKS);
  assert.strictEqual(cli(['hooks', 'install'], CODEX_ENV).status, 0);
  assert.strictEqual(sha(CODEX_HOOKS), h);
});

it('`hooks remove` takes our Codex entry out and leaves the foreign ones as they were', () => {
  const r = cli(['hooks', 'remove'], CODEX_ENV);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(CODEX_HOOKS, 'utf8')), FOREIGN_CODEX);
  assert.strictEqual(fs.readFileSync(CODEX_HOOKS, 'utf8'), JSON.stringify(FOREIGN_CODEX, null, 2) + '\n',
    'a 2-space file did not round-trip byte for byte');
});

it('an existing Codex home with no hooks.json gets one holding only our entry', () => {
  const home2 = path.join(HOME, 'codex-fresh');
  fs.mkdirSync(home2, { recursive: true });
  const r = cli(['hooks', 'install', '--codex'], Object.assign({}, BASE_ENV, { CODEX_HOME: home2 }));
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const j = JSON.parse(fs.readFileSync(path.join(home2, 'hooks.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(j.hooks), ['PreToolUse']);
});

it('an unparseable hooks.json is refused and left exactly as it was', () => {
  const home3 = path.join(HOME, 'codex-broken');
  write(path.join(home3, 'hooks.json'), '{ "hooks": ');
  const h = sha(path.join(home3, 'hooks.json'));
  const r = cli(['hooks', 'install', '--codex'], Object.assign({}, BASE_ENV, { CODEX_HOME: home3 }));
  assert.notStrictEqual(r.status, 0);
  assert.strictEqual(sha(path.join(home3, 'hooks.json')), h);
});

// --- the installer: CLAUDE_CONFIG_DIR (CLAUDE-8) ---------------------------------

it('`hooks install` writes the profile CLAUDE_CONFIG_DIR names, not ~/.claude', () => {
  const profile = path.join(HOME, 'claude-profile');
  fs.mkdirSync(profile, { recursive: true });
  const env = Object.assign({}, BASE_ENV, { CLAUDE_CONFIG_DIR: profile });
  const homeSettings = path.join(HOME, '.claude', 'settings.json');
  const had = fs.existsSync(homeSettings) ? sha(homeSettings) : null;
  const r = cli(['hooks', 'install'], env);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const s = JSON.parse(fs.readFileSync(path.join(profile, 'settings.json'), 'utf8'));
  assert.ok(s.hooks && s.hooks.PreToolUse, 'the profile was not wired');
  assert.strictEqual(fs.existsSync(homeSettings) ? sha(homeSettings) : null, had, '~/.claude/settings.json was written');
  assert.match(cli(['hooks'], env).stdout, /всё на месте и совпадает/);
});

// --- compare before replace (CLAUDE-7) ---------------------------------------------

const apply = require('../lib/apply.js');

it('protectedWrite refuses when the file changed since it was read, and writes nothing', () => {
  const f = path.join(HOME, 'cbr', 'settings.json');
  write(f, '{"a":1}\n');
  const read = fs.readFileSync(f, 'utf8');
  write(f, '{"a":1,"permissions":{"allow":["x"]}}\n');   // a concurrent edit lands
  const r = apply.protectedWrite(f, '{"a":2}\n', { home: HOME, expected: read });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.action, 'changed');
  assert.strictEqual(fs.readFileSync(f, 'utf8'), '{"a":1,"permissions":{"allow":["x"]}}\n');
});

it('protectedWrite writes, copies first and reads back when nothing moved', () => {
  const f = path.join(HOME, 'cbr', 'settings.json');
  const read = fs.readFileSync(f, 'utf8');
  const r = apply.protectedWrite(f, '{"b":1}\n', { home: HOME, expected: read });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.ok(r.backup && fs.readFileSync(r.backup, 'utf8') === read, 'no copy of what was replaced');
  assert.strictEqual(fs.readFileSync(f, 'utf8'), '{"b":1}\n');
});

it('protectedWrite writes THROUGH a symlinked settings file and keeps the link and its mode', () => {
  const real = path.join(HOME, 'dotfiles', 'settings.json');
  write(real, '{"c":1}\n');
  fs.chmodSync(real, 0o600);
  const link = path.join(HOME, 'linked', 'settings.json');
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(real, link);
  const r = apply.protectedWrite(link, '{"c":2}\n', { home: HOME, expected: '{"c":1}\n' });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.ok(fs.lstatSync(link).isSymbolicLink(), 'the link was replaced by a file');
  assert.strictEqual(fs.readFileSync(real, 'utf8'), '{"c":2}\n');
  assert.strictEqual(fs.statSync(real).mode & 0o777, 0o600);
});

it('protectedWrite creates an absent file when absence was what it read', () => {
  const f = path.join(HOME, 'cbr', 'new.json');
  const r = apply.protectedWrite(f, '{}\n', { home: HOME, expected: null });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(fs.readFileSync(f, 'utf8'), '{}\n');
});

// The temporary HOME goes, whatever happened above: nothing of it is evidence once printed.
try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) { /* best effort */ }

if (failures.length) {
  process.stderr.write(`hooks_hosts_e2e: ${failures.length}/${checks} failed\n  ${failures.join('\n  ')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS: hooks_hosts_e2e — ${checks} cases\n`);
