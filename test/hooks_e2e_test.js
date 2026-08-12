#!/usr/bin/env node
'use strict';
// End-to-end fixtures for the hook SCRIPTS and the command that wires them.
//
// Standing instruction #2 of this repository's retrospective exists because a
// pure core with nine passing round-trip fixtures once sat under a command whose
// second run destroyed the file. Purity is what makes a module easy to test; the
// layer that repeats is the one a person actually runs twice.
//
// So everything here runs the real thing: the real scripts, fed the real payload
// shapes on stdin, and the real `hooks install` three times against a real
// settings.json in a real (temporary) HOME.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hooks-e2e-'));
const ENV = Object.assign({}, process.env, { HOME, USERPROFILE: HOME });

/** Run a hook script the way Claude Code runs it: JSON on stdin, JSON on stdout. */
function runHook(script, payload) {
  const r = spawnSync('node', [path.join(ROOT, 'hooks', script)], {
    input: JSON.stringify(payload), encoding: 'utf8', env: ENV,
  });
  assert.strictEqual(r.status, 0, `${script} exited ${r.status}: ${r.stderr}`);
  const out = (r.stdout || '').trim();
  return out ? JSON.parse(out) : null;
}

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

const SETTINGS = path.join(HOME, '.claude', 'settings.json');
const CLAUDE_MD = path.join(HOME, '.claude', 'CLAUDE.md');

// --- the guard, as a process ------------------------------------------------

it('a write to the operator instruction file is allowed AND copied', () => {
  write(CLAUDE_MD, '# rules\nsomething the operator wrote\n');
  const out = runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: CLAUDE_MD },
  });
  assert.strictEqual(out.hookSpecificOutput.permissionDecision, 'allow');
  const dir = path.join(HOME, '.sshlg-skills', 'backups');
  const copies = fs.readdirSync(dir);
  assert.strictEqual(copies.length, 1, `expected exactly one copy, got ${copies.length}`);
  assert.strictEqual(fs.readFileSync(path.join(dir, copies[0]), 'utf8'),
    '# rules\nsomething the operator wrote\n', 'the copy is not the file');
});

it('a write whose copy cannot be taken is DENIED, and the file is untouched', () => {
  const before = fs.readFileSync(CLAUDE_MD, 'utf8');
  const dir = path.join(HOME, '.sshlg-skills', 'backups');
  const saved = fs.readdirSync(dir).map((n) => [n, fs.readFileSync(path.join(dir, n))]);
  // A FILE where the backup directory belongs, so no copy can be created at all.
  // An unwritable directory is not enough and finding that out was worth the
  // fixture: the stamp resolves to the second, so a copy taken in the same second
  // reuses an existing name and rewriting an existing file needs no directory
  // permission. The plant passed while the guard was blind.
  fs.rmSync(dir, { recursive: true, force: true });
  fs.writeFileSync(dir, 'not a directory');
  try {
    const out = runHook('pre-tool-use.js', {
      hook_event_name: 'PreToolUse', tool_name: 'Write',
      tool_input: { file_path: CLAUDE_MD, content: 'replaced' },
    });
    assert.strictEqual(out.hookSpecificOutput.permissionDecision, 'deny',
      'an unbackable write was allowed — this is the defect the module exists for');
    assert.match(out.hookSpecificOutput.permissionDecisionReason, /not performed/);
  } finally {
    fs.rmSync(dir, { force: true });
    fs.mkdirSync(dir, { recursive: true });
    for (const [n, buf] of saved) fs.writeFileSync(path.join(dir, n), buf);
  }
  assert.strictEqual(fs.readFileSync(CLAUDE_MD, 'utf8'), before);
});

it('two copies inside one second are two copies, not one overwritten', () => {
  // The defect the fixture above surfaced by accident: an agent edits faster than
  // the stamp resolves, and the second copy would take the first one's name.
  const backup = require('../lib/backup.js');
  const file = path.join(HOME, '.claude', 'CLAUDE.md');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stamp-'));
  fs.writeFileSync(file, 'first');
  const a = backup.save({ file, home: HOME, dir, stamp: '20260812T101500Z' });
  fs.writeFileSync(file, 'second');
  const b = backup.save({ file, home: HOME, dir, stamp: '20260812T101500Z' });
  assert.notStrictEqual(a.path, b.path, 'the second copy overwrote the first');
  assert.strictEqual(fs.readFileSync(a.path, 'utf8'), 'first', 'the earlier content was lost');
  assert.strictEqual(fs.readFileSync(b.path, 'utf8'), 'second');
});

it('an ordinary file produces no output at all', () => {
  assert.strictEqual(runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: '/tmp/x.js' },
  }), null, 'the guard spoke on a turn nobody asked it about');
});

it('a bare skills-CLI update of a family member is denied by the real script', () => {
  const out = runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', tool_name: 'Bash',
    tool_input: { command: 'npx skills update task-pipeline' },
  });
  assert.strictEqual(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /sshlg-skills@latest update/);
});

it('the launcher itself is not denied by that guard', () => {
  assert.strictEqual(runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', tool_name: 'Bash',
    tool_input: { command: 'npx --yes sshlg-skills@latest update' },
  }), null);
});

it('a malformed payload is silence and exit 0, never a broken turn', () => {
  for (const script of ['pre-tool-use.js', 'post-tool-use.js', 'notification.js',
                        'config-change.js', 'file-changed.js', 'session-start.js']) {
    const r = spawnSync('node', [path.join(ROOT, 'hooks', script)],
      { input: 'not json at all', encoding: 'utf8', env: ENV });
    assert.strictEqual(r.status, 0, `${script} exited ${r.status} on garbage input`);
  }
});

// --- the events that only speak in one way ----------------------------------

it('the notification script emits a terminal sequence and nothing else', () => {
  const out = runHook('notification.js',
    { hook_event_name: 'Notification', notification_type: 'idle_prompt', message: 'waiting' });
  assert.deepStrictEqual(Object.keys(out), ['terminalSequence'],
    'this event discards every other field — sending one ships a dead payload');
  assert.ok(out.terminalSequence.includes('777;notify;'));
});

it('a permission prompt produces nothing', () => {
  assert.strictEqual(runHook('notification.js',
    { hook_event_name: 'Notification', notification_type: 'permission_prompt', message: 'x' }), null);
});

it('session start returns the pointer, and a title only where one lands', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-'));
  write(path.join(project, '.task-pipeline', 'run.md'),
    'Run: `agent-time enforcement` · 2026-08-12\nstage: 5 build — gate auto — verdict pass — 2026-08-12\n');

  const started = runHook('session-start.js',
    { hook_event_name: 'SessionStart', source: 'startup', cwd: project });
  const o = started.hookSpecificOutput;
  assert.match(o.additionalContext, /routing block/i);
  assert.strictEqual(o.sessionTitle, 'agent-time enforcement');
  assert.deepStrictEqual(o.watchPaths, [path.join(project, '.task-pipeline', 'run.md')]);

  const compacted = runHook('session-start.js',
    { hook_event_name: 'SessionStart', source: 'compact', cwd: project });
  assert.ok(!('sessionTitle' in compacted.hookSpecificOutput),
    'a title was sent on `compact`, where the reference says it is ignored');
});

it('the ledger moving produces one line, and a deleted ledger produces none', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-'));
  const ledger = path.join(project, '.task-pipeline', 'run.md');
  write(ledger, 'stage: 6 tests — gate manual — verdict pass — 2026-08-12\niter: 1 — item B-01 — closed at gate 6\n');
  const out = runHook('file-changed.js',
    { hook_event_name: 'FileChanged', file_path: ledger, event: 'change' });
  assert.match(out.systemMessage, /6 tests/);

  fs.unlinkSync(ledger);
  assert.strictEqual(runHook('file-changed.js',
    { hook_event_name: 'FileChanged', file_path: ledger, event: 'unlink' }), null);
});

// --- the command that repeats -----------------------------------------------

function cli(args) {
  return execFileSync('node', [path.join(ROOT, 'bin', 'sshlg-skills.js')].concat(args),
    { encoding: 'utf8', env: ENV });
}

it('THREE real runs of `hooks install` leave the file identical', () => {
  // Three, not two: the first→second transition can settle a formatting
  // difference that second→third would have caught.
  write(SETTINGS, JSON.stringify({
    env: { CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' },
    enabledPlugins: { 'caveman@caveman': true },
  }, null, 2) + '\n');

  cli(['hooks', 'install']);
  const first = sha(SETTINGS);
  cli(['hooks', 'install']);
  const second = sha(SETTINGS);
  cli(['hooks', 'install']);
  const third = sha(SETTINGS);

  assert.strictEqual(second, first, 'the second install rewrote the file');
  assert.strictEqual(third, second, 'the third install rewrote the file');
});

it('the install wired every event, pointing at the operator\'s own copy', () => {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const H = require('../lib/hooks.js');
  for (const e of H.EVENTS) {
    assert.ok(s.hooks[e], `${e} was not wired`);
    const cmd = s.hooks[e][0].hooks[0].command;
    assert.ok(cmd.includes(path.join(HOME, '.sshlg-skills', 'runtime')),
      `${e} points outside the operator's runtime copy: ${cmd}`);
    const script = /"([^"]+)"/.exec(cmd)[1];
    assert.ok(fs.existsSync(script), `${e} is wired to a file that does not exist: ${script}`);
  }
});

it('`hooks remove` restores the file byte for byte', () => {
  const original = JSON.stringify({
    env: { CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' },
    enabledPlugins: { 'caveman@caveman': true },
  }, null, 2) + '\n';
  write(SETTINGS, original);
  cli(['hooks', 'install']);
  assert.notStrictEqual(fs.readFileSync(SETTINGS, 'utf8'), original, 'install changed nothing');
  cli(['hooks', 'remove']);
  assert.strictEqual(fs.readFileSync(SETTINGS, 'utf8'), original,
    'remove is not an undo — something of ours was left behind, or something of theirs was lost');
});

it('displacement: an entry someone else drops is recorded, then reported next session', () => {
  write(SETTINGS, '{}\n');
  cli(['hooks', 'install']);
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  delete s.hooks.PreToolUse;                       // another installer rewrites the file
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');

  const spoke = runHook('config-change.js',
    { hook_event_name: 'ConfigChange', source: 'user_settings', file_path: SETTINGS });
  assert.strictEqual(spoke, null,
    'ConfigChange spoke — the reference says every channel it has is discarded');

  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  assert.match(started.hookSpecificOutput.additionalContext, /PreToolUse:missing/,
    'the notice never reached a hook that can speak');
  assert.match(started.hookSpecificOutput.additionalContext, /hooks install/);
});

it('a repaired settings file stops being reported', () => {
  cli(['hooks', 'install']);
  runHook('config-change.js',
    { hook_event_name: 'ConfigChange', source: 'user_settings', file_path: SETTINGS });
  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  assert.ok(!/displaced|no longer match/.test(started.hookSpecificOutput.additionalContext),
    'a displacement that was repaired is still being announced');
});

// --- the repository's own gate, as a process --------------------------------

/** Run the project gate against a throwaway project whose suite we control. */
function runGate(payload, suiteExit) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-proj-'));
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({
    name: 'fixture', version: '0.0.0',
    scripts: { test: suiteExit === 0 ? 'node -e "console.log(\'PASS: green\')"'
      : 'node -e "console.log(\'FAIL: the planted check\'); process.exit(1)"' },
  }));
  const r = spawnSync('node', [path.join(ROOT, 'hooks', 'repo-gate.js')], {
    input: JSON.stringify(payload), encoding: 'utf8',
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: project }),
  });
  assert.strictEqual(r.status, 0, `repo-gate exited ${r.status}: ${r.stderr}`);
  const out = (r.stdout || '').trim();
  return out ? JSON.parse(out) : null;
}

it('a commit is refused while the suite is red, and the reason carries the failure', () => {
  const out = runGate({
    hook_event_name: 'PreToolUse', tool_name: 'Bash',
    tool_input: { command: 'git commit -m "wip"' },
  }, 1);
  assert.strictEqual(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /the planted check/,
    'the refusal does not carry the failing output, so it cannot be acted on');
});

it('a commit proceeds while the suite is green', () => {
  assert.strictEqual(runGate({
    hook_event_name: 'PreToolUse', tool_name: 'Bash',
    tool_input: { command: 'git commit -m "wip"' },
  }, 0), null, 'a legitimate commit was gated — the gate must open, not only close');
});

it('a non-commit never pays for the suite at all', () => {
  // A gate that ran the suite on `git status` would be removed within a day.
  assert.strictEqual(runGate({
    hook_event_name: 'PreToolUse', tool_name: 'Bash',
    tool_input: { command: 'git status' },
  }, 1), null);
});

it('an over-long SKILL.md description is reported in the turn it was written', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-'));
  const file = path.join(dir, 'SKILL.md');
  fs.writeFileSync(file, `---\nname: x\ndescription: ${'y'.repeat(1100)}\n---\n`);
  const r = spawnSync('node', [path.join(ROOT, 'hooks', 'repo-gate.js')], {
    input: JSON.stringify({
      hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: file },
    }), encoding: 'utf8', env: process.env,
  });
  const out = JSON.parse(r.stdout.trim());
  assert.strictEqual(out.decision, 'block');
  assert.match(out.reason, /1100 chars/);
});

it('an ordinary file written is silence', () => {
  const r = spawnSync('node', [path.join(ROOT, 'hooks', 'repo-gate.js')], {
    input: JSON.stringify({
      hook_event_name: 'PostToolUse', tool_name: 'Write',
      tool_input: { file_path: path.join(ROOT, 'README.md') },
    }), encoding: 'utf8', env: process.env,
  });
  assert.strictEqual((r.stdout || '').trim(), '');
});

try {
  if (failures.length) {
    failures.forEach((f) => console.log('FAIL: ' + f));
    console.log(`${failures.length} failure(s) out of ${checks} checks`);
    process.exit(1);
  }
  console.log(`OK (${checks} checks)`);
} finally {
  fs.rmSync(HOME, { recursive: true, force: true });
}
