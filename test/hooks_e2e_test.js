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
// `realpathSync`, because macOS's tmpdir is a symlink (`/var` → `/private/var`) and
// the post-tool-use restore resolves its target with `realpathSync` before deriving
// the backup key — a HOME spelled through the symlink names a different key than the
// hook computes, and `latest()` silently finds nothing.
const HOME = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hooks-e2e-')));
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

/**
 * Raw stdout AND stderr, for the case where the ABSENCE of stdout is the assertion.
 *
 * `runHook` parses stdout as JSON and returns null when it is empty, which cannot tell
 * "no decision" from "a decision that failed to parse" — and "no decision" is exactly
 * what the happy path must now produce.
 */
function runHookRaw(script, payload) {
  const r = spawnSync('node', [path.join(ROOT, 'hooks', script)], {
    input: JSON.stringify(payload), encoding: 'utf8', env: ENV,
  });
  assert.strictEqual(r.status, 0, `${script} exited ${r.status}: ${r.stderr}`);
  return { stdout: r.stdout || '', stderr: r.stderr || '' };
}

/** Some hooks answer in plain text (SessionStart context, the prompt note). */
function runHookText(script, payload) {
  const r = spawnSync('node', [path.join(ROOT, 'hooks', script)], {
    input: JSON.stringify(payload), encoding: 'utf8', env: ENV,
  });
  assert.strictEqual(r.status, 0, `${script} exited ${r.status}: ${r.stderr}`);
  return (r.stdout || '').trim();
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

// THE COPY IS TAKEN AND NO DECISION IS EMITTED.
//
// This asserted `permissionDecision: 'allow'`, and that bypasses the permission system:
// the tool call proceeds without the operator being asked. So installing this pack made
// writes and deletions to the five most consequential files on the machine LESS
// interactive than before it was installed — the opposite of what the module is for, and
// `rm` is in `ALL_ARGS`, so `rm ~/.claude/CLAUDE.md` was copied and then auto-approved.
//
// `deny` stays: refusing a write whose copy could not be taken is the whole value. What
// went is the half that decided FOR the operator on the happy path.
it('a write to the operator instruction file is COPIED, and decides nothing', () => {
  write(CLAUDE_MD, '# rules\nsomething the operator wrote\n');
  const out = runHookRaw('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: CLAUDE_MD },
  });
  assert.strictEqual(String(out.stdout || '').trim(), '',
    'the hook emitted a permission decision on the happy path — that spends the '
    + "operator's own prompt on the files this module calls unrecoverable");
  assert.ok(/copy taken before the write/.test(out.stderr || ''),
    `the copy's path was not reported: ${JSON.stringify(out.stderr)}`);
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

it('the wiki-config restore restores the keys, through a copy of its own (UM-06)', () => {
  // The restore in post-tool-use.js was the one write to an operator-owned file
  // outside `protect()` — CLAUDE.md's "no second write path" invariant, found as
  // UM-06. These fixtures watch the routed version doing both halves: the write
  // is preceded by a copy of the bytes it overwrites, and a copy that cannot be
  // taken cancels the write instead of degrading to "wrote anyway".
  const backup = require('../lib/backup.js');
  const cfg = path.join(HOME, '.obsidian-wiki', 'config');
  const full = 'OBSIDIAN_VAULT_PATH=/v\nCLAUDE_HISTORY_PATH=/h\n# comment kept\n';
  const truncated = 'OBSIDIAN_VAULT_PATH=/new\n';
  write(cfg, full);
  // The snapshot PreToolUse would have taken, with an explicit older stamp.
  assert.strictEqual(backup.save({ file: cfg, home: HOME, stamp: '20260812T090000Z' }).action, 'saved');
  fs.writeFileSync(cfg, truncated);                 // what `setup` leaves behind
  const out = runHook('post-tool-use.js', {
    hook_event_name: 'PostToolUse', tool_name: 'Bash',
    tool_input: { command: 'obsidian-wiki setup' },
  });
  assert.match(out.hookSpecificOutput.additionalContext, /restored from the snapshot/);
  const after = fs.readFileSync(cfg, 'utf8');
  assert.ok(after.includes('CLAUDE_HISTORY_PATH=/h'), 'the dropped key did not come back');
  assert.ok(after.includes('OBSIDIAN_VAULT_PATH=/new'), "setup's own value was reverted");
  const dir = path.join(HOME, '.sshlg-skills', 'backups');
  const copies = fs.readdirSync(dir).filter((n) => n.startsWith('obsidian-wiki_config.')).sort();
  assert.strictEqual(copies.length, 2,
    `expected the pre-run snapshot plus the pre-write copy, got: ${copies.join(', ')}`);
  assert.strictEqual(fs.readFileSync(path.join(dir, copies[1]), 'utf8'), truncated,
    'the pre-write copy is not the bytes the restore was about to overwrite');
});

it('a restore whose copy cannot be taken does NOT write, and names the remedy', () => {
  const backup = require('../lib/backup.js');
  const cfg = path.join(HOME, '.obsidian-wiki', 'config');
  const full = 'OBSIDIAN_VAULT_PATH=/v\nOBSIDIAN_SOURCES_EXCLUDE=x\n';
  const truncated = 'OBSIDIAN_VAULT_PATH=/newer\n';
  write(cfg, full);
  // A snapshot stamped to sort newest, so `latest()` finds a FULL config to merge from.
  assert.strictEqual(backup.save({ file: cfg, home: HOME, stamp: '20270101T000000Z' }).action, 'saved');
  fs.writeFileSync(cfg, truncated);
  const dir = path.join(HOME, '.sshlg-skills', 'backups');
  fs.chmodSync(dir, 0o555);   // `latest()` can still read the snapshot; no new copy can land
  let out;
  try {
    out = runHook('post-tool-use.js', {
      hook_event_name: 'PostToolUse', tool_name: 'Bash',
      tool_input: { command: 'obsidian-wiki setup' },
    });
  } finally {
    fs.chmodSync(dir, 0o755);
  }
  assert.strictEqual(fs.readFileSync(cfg, 'utf8'), truncated,
    'the restore wrote without a copy — the exact degradation the gate exists to refuse');
  assert.match(out.hookSpecificOutput.additionalContext, /NOT performed/);
  assert.match(out.hookSpecificOutput.additionalContext, /\.sshlg-skills\/backups/,
    'the refusal does not name its remedy — how an operator learns to switch a hook off');
});

it('a malformed payload is silence and exit 0, never a broken turn', () => {
  // Discovered, not listed. The hand-written six left out `statusline.js`,
  // `user-prompt-submit.js` and `repo-gate.js` — and repo-gate is the one wired
  // from a COMMITTED .claude/settings.json into every clone of this repository,
  // where a throw would break every Bash call in the project. A new hook joins
  // this fixture by existing (2026-08-16, F-umbrella-11).
  const HOOKS = fs.readdirSync(path.join(ROOT, 'hooks')).filter((f) => f.endsWith('.js'));
  assert.ok(HOOKS.length >= 9, `expected every hook, found ${HOOKS.length}`);
  for (const script of HOOKS) {
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
  // A real repository with something staged: the gate only claims a commit whose
  // changes are in THIS project's index, because a commit made inside a submodule
  // must not be judged by the umbrella's suite.
  execFileSync('git', ['init', '-q'], { cwd: project });
  fs.writeFileSync(path.join(project, 'staged.txt'), 'x');
  execFileSync('git', ['add', 'staged.txt'], { cwd: project });
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

// --- the progress widget, as processes -------------------------------------

/** A project with a ledger, and optionally its own stage list. */
function project(ledger, stages) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prog-'));
  write(path.join(dir, '.task-pipeline', 'run.md'), ledger);
  if (stages) {
    fs.writeFileSync(path.join(dir, 'pipeline.json'),
      JSON.stringify({ stages: stages.map((id) => ({ id })) }));
  }
  return dir;
}

const MIDRUN = [
  'Run: `something` · 2026-08-13',
  'stage: 0 intake — gate manual — verdict pass — 2026-08-13T01:00:00Z',
  'stage: 1 docs — gate auto — verdict pass — 2026-08-13T01:05:00Z',
  'stage: 2 spec — gate auto — verdict pass — 2026-08-13T01:10:00Z',
].join('\n');

function statusLine(dir) {
  const r = spawnSync('node', [path.join(ROOT, 'hooks', 'statusline.js')],
    { input: JSON.stringify({ cwd: dir }), encoding: 'utf8', env: ENV });
  return (r.stdout || '').trim();
}

it('THE DEFECT, as a process: no fraction is built from the ledger\'s line count', () => {
  const line = statusLine(project(MIDRUN, null));
  assert.ok(!/gates 3\/3/.test(line), `the false success shipped again: ${line}`);
  assert.ok(/3 gates passed/.test(line), line);
});

it('with the project\'s stage list the fraction is the project\'s', () => {
  const line = statusLine(project(MIDRUN, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  assert.ok(/gates 3\/11/.test(line), line);
  assert.ok(/27%/.test(line), line);
  assert.ok(/0✓ 1✓ 2✓ 3·/.test(line), `the rail is missing or wrong: ${line}`);
});

it('the ledger hook prints the block and moves the taskbar', () => {
  const dir = project(MIDRUN, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const out = runHook('file-changed.js', {
    hook_event_name: 'FileChanged', cwd: dir,
    file_path: path.join(dir, '.task-pipeline', 'run.md'), event: 'change',
  });
  assert.match(out.systemMessage, /gates 3\/11/);
  assert.match(out.systemMessage, /[█░]/, 'no bar in the printed block');
  assert.ok(out.terminalSequence.includes(']9;4;1;27'),
    `no taskbar progress: ${JSON.stringify(out.terminalSequence)}`);
});

it('no stage list, no bar and no taskbar claim', () => {
  const dir = project(MIDRUN, null);
  const out = runHook('file-changed.js', {
    hook_event_name: 'FileChanged', cwd: dir,
    file_path: path.join(dir, '.task-pipeline', 'run.md'), event: 'change',
  });
  assert.ok(!/[█░]/.test(out.systemMessage), 'a bar was drawn with no denominator');
  assert.ok(!out.terminalSequence, 'a percentage was claimed with nothing behind it');
});

it('a manual gate with no verdict pings the operator', () => {
  const dir = project(MIDRUN + '\nstage: 7 deploy — gate manual — 2026-08-13T01:20:00Z',
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const out = runHook('file-changed.js', {
    hook_event_name: 'FileChanged', cwd: dir,
    file_path: path.join(dir, '.task-pipeline', 'run.md'), event: 'change',
  });
  assert.ok(out.terminalSequence.includes('777;notify;'),
    'the one moment a person is required passed without a ping');
  assert.match(out.systemMessage, /waiting on you/);
});

// --- the routing escalation, as processes ----------------------------------

it('the un-routed path is escalated once per turn, then goes quiet', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-'));
  const session = 'e2e-route';
  runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p1', prompt: 'сделай фичу экспорта в csv' });

  const first = runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: session, prompt_id: 'p1',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'src.js') }, cwd: dir,
  });
  assert.strictEqual(first.hookSpecificOutput.permissionDecision, 'ask');
  assert.match(first.hookSpecificOutput.permissionDecisionReason, /task-pipeline/);
  assert.match(first.hookSpecificOutput.permissionDecisionReason, /без пайплайна/);

  const second = runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: session, prompt_id: 'p1',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'other.js') }, cwd: dir,
  });
  assert.strictEqual(second, null, 'a turn editing many files would prompt on each one');
});

it('a refusal phrase silences the session, not merely the turn', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-'));
  const session = 'e2e-optout';
  runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p1', prompt: 'сделай фичу, без пайплайна' });
  runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p2', prompt: 'теперь сделай ещё одну фичу' });
  assert.strictEqual(runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: session, prompt_id: 'p2',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'src.js') }, cwd: dir,
  }), null, 'a session that declined was asked again on the next prompt');
});

it('with a run already open, nothing is escalated', () => {
  const dir = project(MIDRUN, null);
  const session = 'e2e-open';
  runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p1', prompt: 'сделай фичу экспорта' });
  assert.strictEqual(runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: session, prompt_id: 'p1',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'src.js') }, cwd: dir,
  }), null, 'the pipeline interrupted itself mid-run');
});

it('a prompt with no route never escalates', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-'));
  const session = 'e2e-noroute';
  runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p1', prompt: 'что делает этот модуль?' });
  assert.strictEqual(runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: session, prompt_id: 'p1',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'src.js') }, cwd: dir,
  }), null, 'an unclassified prompt was escalated — that is a prompt on every edit');
});

it('a commit made in ANOTHER repository is not this project\'s commit', () => {
  // The deadlock this prevents was real: committing inside a submodule ran the
  // umbrella's suite, which was red for a reason the submodule commit was about
  // to fix. What decides is where the command would RUN — not what happens to be
  // staged here, which is a different question the command itself can change.
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-owner-'));
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-other-'));
  for (const dir of [project, other]) execFileSync('git', ['init', '-q'], { cwd: dir });
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({
    name: 'fixture', version: '0.0.0',
    scripts: { test: 'node -e "process.exit(1)"' },   // red: a gate that ran would deny
  }));
  // ...and this project's index is DIRTY, which used to be enough to claim the commit
  fs.writeFileSync(path.join(project, 'staged.txt'), 'x');
  execFileSync('git', ['add', 'staged.txt'], { cwd: project });

  const r = spawnSync('node', [path.join(ROOT, 'hooks', 'repo-gate.js')], {
    input: JSON.stringify({
      hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: other,
      tool_input: { command: 'git commit -m x' },
    }),
    encoding: 'utf8',
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: project }),
  });
  assert.strictEqual((r.stdout || '').trim(), '',
    'a commit belonging to another repository was gated by this one\'s suite');

  // the same, addressed by `-C` from inside this project
  const byFlag = spawnSync('node', [path.join(ROOT, 'hooks', 'repo-gate.js')], {
    input: JSON.stringify({
      hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: project,
      tool_input: { command: `git -C ${other} commit -m x` },
    }),
    encoding: 'utf8',
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: project }),
  });
  assert.strictEqual((byFlag.stdout || '').trim(), '',
    '`git -C <other repo> commit` was gated by this repository\'s suite');
});

it('the compound form does not walk past the gate', () => {
  // UM-09, and it is the reason the index question had to go. `git add -A && git
  // commit` stages nothing AT DECISION TIME, because this hook fires before the
  // command runs — so the old ownership test concluded "not ours" and exited 0
  // without running the suite. Measured on 2026-08-19 against a throwaway project:
  // no output, exit 0, no suite. This case is that bypass, watched being refused.
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-compound-'));
  execFileSync('git', ['init', '-q'], { cwd: project });
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({
    name: 'fixture', version: '0.0.0',
    scripts: { test: 'node -e "console.log(\'FAIL: the planted check\'); process.exit(1)"' },
  }));
  fs.writeFileSync(path.join(project, 'unstaged.txt'), 'x');   // present, deliberately NOT staged
  for (const command of ['git add -A && git commit -m x',
                         'git add . ; git commit -m x',
                         'git commit -am x']) {
    const r = spawnSync('node', [path.join(ROOT, 'hooks', 'repo-gate.js')], {
      input: JSON.stringify({
        hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: project,
        tool_input: { command },
      }),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: project }),
    });
    const out = (r.stdout || '').trim();
    assert.ok(out, `the gate never ran for: ${command}`);
    assert.strictEqual(JSON.parse(out).hookSpecificOutput.permissionDecision, 'deny',
      `a red suite did not refuse: ${command}`);
  }
});

it('the payload without a cwd still gates what it can', () => {
  // Older payload shapes carry no `cwd`. The fallback is the index question, and its
  // documented weakness is narrowed rather than kept: a command that stages
  // something itself is not excused by an empty index.
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-nocwd-'));
  execFileSync('git', ['init', '-q'], { cwd: project });
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({
    name: 'fixture', version: '0.0.0',
    scripts: { test: 'node -e "console.log(\'FAIL: planted\'); process.exit(1)"' },
  }));
  const r = spawnSync('node', [path.join(ROOT, 'hooks', 'repo-gate.js')], {
    input: JSON.stringify({
      hook_event_name: 'PreToolUse', tool_name: 'Bash',
      tool_input: { command: 'git add -A && git commit -m x' },
    }),
    encoding: 'utf8',
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: project }),
  });
  assert.match((r.stdout || ''), /deny/,
    'with no cwd and nothing staged, a self-staging commit walked past the gate');
});

try {
  it('THE SHADOW GUARD SAYS SO WHEN IT HAS NO MANIFEST TO READ', () => {
    // `lib/runtime.js` copies `skills.json` beside the hooks, and its comment named
    // `lib/plan.js` and the bin as the consumers — neither of which reads it. The real
    // consumer is this hook's shadow guard, and its read was a bare swallow: a reader
    // trimming the runtime payload on the strength of that comment would have dropped
    // the manifest, the guard would have returned an empty id set, and it would have
    // denied nothing with no message.
    //
    // Still exit 0 and still no permission decision — a missing manifest is a
    // diagnostic, not a verdict, and a hook answering `allow` to it would be deciding
    // what it cannot know.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-nomanifest-'));
    try {
      const hooks = path.join(dir, 'hooks');
      fs.mkdirSync(hooks, { recursive: true });
      fs.cpSync(path.join(ROOT, 'lib'), path.join(dir, 'lib'), { recursive: true });
      fs.copyFileSync(path.join(ROOT, 'hooks', 'pre-tool-use.js'),
        path.join(hooks, 'pre-tool-use.js'));
      // deliberately NO skills.json beside it

      const r = spawnSync(process.execPath, [path.join(hooks, 'pre-tool-use.js')], {
        input: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Bash',
          tool_input: { command: 'npx skills update ux-flows' },
        }),
        encoding: 'utf8',
      });
      assert.strictEqual(r.status, 0, 'a hook must never fail a turn, even blind');
      assert.ok(/no skills\.json beside the hook/.test(r.stderr || ''),
        `the guard went inert without saying so: stderr=${JSON.stringify(r.stderr)}`);
      assert.ok(!/permissionDecision/.test(r.stdout || ''),
        'a missing manifest is a diagnostic, not a verdict — it must decide nothing');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  if (failures.length) {
    failures.forEach((f) => console.log('FAIL: ' + f));
    console.log(`${failures.length} failure(s) out of ${checks} checks`);
    process.exit(1);
  }
  console.log(`OK (${checks} checks)`);
} finally {
  fs.rmSync(HOME, { recursive: true, force: true });
}
