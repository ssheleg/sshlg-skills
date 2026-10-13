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
// `SSHLG_SKILLS_NO_PROBE` because the session-start probes are DETACHED and write
// `~/.sshlg-skills/state.json`. Without it an earlier test's probe lands between a
// later test's fixture write and the hook's read, destroying the fixture — which
// failed on CI and passed locally on the same commit. A suite that spawns network
// processes into shared state is testing the network's timing.
const ENV = Object.assign({}, process.env,
  { HOME, USERPROFILE: HOME, SSHLG_SKILLS_NO_PROBE: '1' });

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

it('the injectors line prints once per set and again only when the set changes (R02)', () => {
  const saved = fs.existsSync(SETTINGS) ? fs.readFileSync(SETTINGS, 'utf8') : null;
  const state = path.join(HOME, '.sshlg-skills', 'state.json');
  const savedState = fs.existsSync(state) ? fs.readFileSync(state, 'utf8') : null;
  try {
    const plugin = (name) => write(path.join(HOME, '.claude', 'plugins', 'cache', 'mk', name, '1.0.0',
      'hooks', 'hooks.json'), JSON.stringify({ hooks: { SessionStart: [] } }));
    plugin('alpha'); plugin('beta');
    const enable = (...names) => write(SETTINGS, JSON.stringify({
      enabledPlugins: Object.fromEntries(names.map((n) => [`${n}@mk`, true])) }));
    const start = () => runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' })
      .hookSpecificOutput.additionalContext;
    fs.rmSync(state, { force: true });
    enable('alpha');
    assert.match(start(), /Also speaking at SessionStart: alpha/, 'the first sighting printed nothing');
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(state, 'utf8')).injectors, ['alpha@mk']);
    assert.ok(!/Also speaking/.test(start()), 'an unchanged set was printed again');
    enable('alpha', 'beta');
    assert.match(start(), /alpha, beta/, 'a grown set was not announced');
    assert.ok(!/Also speaking/.test(start()));
  } finally {
    if (saved === null) fs.rmSync(SETTINGS, { force: true }); else fs.writeFileSync(SETTINGS, saved);
    if (savedState === null) fs.rmSync(state, { force: true }); else fs.writeFileSync(state, savedState);
  }
});

// Risk f, decided: the injectors record is MACHINE-WIDE, not per session. The line says
// which plugins are enabled on this machine — a fact about the machine, not about a
// context — so a second session (any id) with the same set is told nothing new. `noted`
// is per session because a route note is about one context. Both are stated in the hook's
// docstring and the README hooks table.
it('the injectors record is machine-wide: a different session with the same set is not told again (risk f)', () => {
  const saved = fs.existsSync(SETTINGS) ? fs.readFileSync(SETTINGS, 'utf8') : null;
  const state = path.join(HOME, '.sshlg-skills', 'state.json');
  const savedState = fs.existsSync(state) ? fs.readFileSync(state, 'utf8') : null;
  try {
    write(path.join(HOME, '.claude', 'plugins', 'cache', 'mk', 'gamma', '1.0.0', 'hooks', 'hooks.json'),
      JSON.stringify({ hooks: { SessionStart: [] } }));
    write(SETTINGS, JSON.stringify({ enabledPlugins: { 'gamma@mk': true } }));
    fs.rmSync(state, { force: true });
    const start = (id) => runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup', session_id: id })
      .hookSpecificOutput.additionalContext;
    assert.match(start('session-one'), /Also speaking at SessionStart: gamma/);
    assert.ok(!/Also speaking/.test(start('session-two')), 'a second session was told the same set again');
  } finally {
    if (saved === null) fs.rmSync(SETTINGS, { force: true }); else fs.writeFileSync(SETTINGS, saved);
    if (savedState === null) fs.rmSync(state, { force: true }); else fs.writeFileSync(state, savedState);
  }
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

it('displacement: an entry someone else rewrites is recorded, then reported next session', () => {
  write(SETTINGS, '{}\n');
  cli(['hooks', 'install']);
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  s.hooks.PreToolUse[0].matcher = 'Edit';          // another installer rewrites our entry
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');

  const spoke = runHook('config-change.js',
    { hook_event_name: 'ConfigChange', source: 'user_settings', file_path: SETTINGS });
  assert.strictEqual(spoke, null,
    'ConfigChange spoke — the reference says every channel it has is discarded');

  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  assert.match(started.hookSpecificOutput.additionalContext, /PreToolUse:altered/,
    'the notice never reached a hook that can speak');
  assert.match(started.hookSpecificOutput.additionalContext, /hooks install/);
});

// Final polish, item 4: a record parked before 1.56.0 can hold `<Event>:missing` rows.
it('a parked pre-upgrade `missing` row prints no displacement line, and the stale record is cleared (final polish 4)', () => {
  const configLib = require(path.join(ROOT, 'lib', 'config.js'));
  configLib.stashSet(HOME, 'displaced:entries', JSON.stringify({ at: '2026-10-01T00:00:00Z', entries: ['Notification:missing'] }));
  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup', session_id: 'e2e-park' });
  assert.ok(!/no longer match|Notification:missing/.test(started.hookSpecificOutput.additionalContext),
    `a pre-upgrade missing row was announced:\n${started.hookSpecificOutput.additionalContext}`);
  assert.strictEqual(configLib.stashGet(configLib.readConfig(HOME), 'displaced:entries'), undefined,
    'the record holding nothing current was kept');
});

it('a repaired settings file stops being reported', () => {
  cli(['hooks', 'install']);
  runHook('config-change.js',
    { hook_event_name: 'ConfigChange', source: 'user_settings', file_path: SETTINGS });
  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  assert.ok(!/displaced|no longer match/.test(started.hookSpecificOutput.additionalContext),
    'a displacement that was repaired is still being announced');
});

// --- one rule for "our entry is current" (fix round 2, A) ------------------
//
// `update` kept an operator's `timeout` while `hooks status` and the ConfigChange detector
// still compared whole entries: every session start then said "N of this pack's entries no
// longer match … Repair: hooks install", and that repair deleted the field. Now every path
// judges by the fields this pack writes, and an entry that is gone is listed by `hooks
// status` on demand, never nagged about at session start.

function operatorTuned() {
  write(SETTINGS, JSON.stringify({ env: { KEEP: '1' } }, null, 2) + '\n');
  cli(['hooks', 'install']);
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  s.hooks.UserPromptSubmit[0].hooks[0].timeout = 5;
  s.statusLine.padding = 0;
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');
  return s;
}

it('an operator timeout is not a displacement: no "no longer match" line, and `hooks status` is clean (A)', () => {
  operatorTuned();
  runHook('config-change.js', { hook_event_name: 'ConfigChange', source: 'user_settings', file_path: SETTINGS });
  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  assert.ok(!/no longer match/.test(started.hookSpecificOutput.additionalContext),
    `an operator field was announced as a displacement:\n${started.hookSpecificOutput.additionalContext}`);
  const status = cli(['hooks', 'status']);
  assert.match(status, /всё на месте и совпадает/, `status called an operator field stale:\n${status}`);
});

it('a hand-removed event: status lists it as not wired here, session start does not nag (A)', () => {
  const s = operatorTuned();
  delete s.hooks.Notification;
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');
  runHook('config-change.js', { hook_event_name: 'ConfigChange', source: 'user_settings', file_path: SETTINGS });
  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  assert.ok(!/no longer match/.test(started.hookSpecificOutput.additionalContext),
    `a hand-removed entry was announced at session start:\n${started.hookSpecificOutput.additionalContext}`);
  const status = cli(['hooks', 'status']);
  assert.match(status, /не подключено здесь[^\n]*Notification/, `status did not list the removed event:\n${status}`);
  assert.ok(!/UserPromptSubmit: timeout/.test(status), `status called the operator's timeout stale:\n${status}`);
});

it('`hooks install` keeps the operator\'s timeout and padding, and a second install changes nothing (A)', () => {
  operatorTuned();
  const before = sha(SETTINGS);
  cli(['hooks', 'install']);
  const after = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  assert.strictEqual(after.hooks.UserPromptSubmit[0].hooks[0].timeout, 5, 'install deleted the operator\'s timeout');
  assert.strictEqual(after.statusLine.padding, 0, 'install deleted the operator\'s padding');
  assert.strictEqual(sha(SETTINGS), before, 'install rewrote a file whose entries were current');
  cli(['hooks', 'install']);
  assert.strictEqual(sha(SETTINGS), before, 'the second install rewrote the file');
});

const FOREIGN_HOOK_E2E = { matcher: 'startup', hooks: [{ type: 'command', command: 'other-pack session-start' }] };
// --- `update` re-wires a machine that has consented (R03) -------------------
//
// The real `update` command, three times, against a real settings.json. The network and
// the other tools it drives (git, npx, claude) are replaced by PATH stubs that exit 0:
// what is under test is the wiring step and the file it writes, not the skills CLI.

function updateEnv() {
  // inside HOME, so the suite's own cleanup removes it
  const stubs = fs.mkdtempSync(path.join(HOME, 'update-stubs-'));
  for (const name of ['git', 'npx', 'npm', 'claude']) {
    write(path.join(stubs, name), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(stubs, name), 0o755);
  }
  return Object.assign({}, ENV, { NODE_OPTIONS:'--require='+JSON.stringify(path.join(ROOT,'test/fixtures/native-transaction-boundary.cjs')), PATH: `${stubs}:${process.env.PATH}` });
}
function update(env) {
  const r = spawnSync('node', [path.join(ROOT, 'bin', 'sshlg-skills.js'), 'update'],
    { encoding: 'utf8', env });
  return { out: `${r.stdout}${r.stderr}`, status: r.status };
}

it('THREE real runs of `update` re-wire a stale matcher once and then change nothing (R03)', () => {
  const env = updateEnv();
  write(SETTINGS, JSON.stringify({ env: { KEEP: '1' } }, null, 2) + '\n');
  cli(['hooks', 'install']);
  // 1.55.0 shape: the PreToolUse matcher without the MCP credential tools
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const full = s.hooks.PreToolUse[0].matcher;
  s.hooks.PreToolUse[0].matcher = 'Edit|Write|MultiEdit|NotebookEdit|Bash';
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n');
  const stale = sha(SETTINGS);

  const first = update(env);
  assert.ok(/Hook wiring/.test(first.out) && /PreToolUse: matcher/.test(first.out),
    `the first update did not name the stale matcher:\n${first.out.slice(-600)}`);
  const h1 = sha(SETTINGS);
  assert.notStrictEqual(h1, stale, 'the first update changed nothing');
  const after = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  assert.strictEqual(after.hooks.PreToolUse[0].matcher, full, 'the matcher is still stale');
  assert.strictEqual(after.env.KEEP, '1', 'something outside our entries was lost');

  update(env);
  const h2 = sha(SETTINGS);
  update(env);
  const h3 = sha(SETTINGS);
  assert.strictEqual(h2, h1, 'the second update changed the file again');
  assert.strictEqual(h3, h1, 'the third update changed the file again');
  const status = cli(['hooks', 'status']);
  assert.match(status, /всё на месте и совпадает/, 'status still reports a stale entry after update');
});

it('`update` with no entry of ours in settings.json writes nothing (no consent) (R03)', () => {
  const env = updateEnv();
  const body = JSON.stringify({ env: { A: '1' }, hooks: { SessionStart: [FOREIGN_HOOK_E2E] } }, null, 2) + '\n';
  write(SETTINGS, body);
  const r = update(env);
  assert.strictEqual(fs.readFileSync(SETTINGS, 'utf8'), body, 'update wrote hooks into a machine that never consented');
  assert.ok(!/Hook wiring/.test(r.out), 'update announced wiring work it did not do');
});

// --- the fix round: scope, preview, operator fields, removals, foreign status line ---

/** A consented machine whose PreToolUse matcher is the 1.55.0 one. Returns the parsed file. */
function staleInstall() {
  write(SETTINGS, JSON.stringify({ env: { KEEP: '1' } }, null, 2) + '\n');
  cli(['hooks', 'install']);
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  s.hooks.PreToolUse[0].matcher = 'Edit|Write|MultiEdit|NotebookEdit|Bash';
  return s;
}
function saveSettings(s) { fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n'); }
function readSettings() { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); }
function updateWith(env, args) {
  const r = spawnSync('node', [path.join(ROOT, 'bin', 'sshlg-skills.js'), 'update'].concat(args),
    { encoding: 'utf8', env });
  return { out: `${r.stdout}${r.stderr}`, status: r.status };
}
const FULL_MATCHER = require('../lib/hooks.js').entries('/x').PreToolUse.matcher;

it('`update --no-claude` and `update --agent codex` leave settings.json alone and say so (#2)', () => {
  const env = updateEnv();
  saveSettings(staleInstall());
  const before = sha(SETTINGS);
  for (const [args, flag] of [[['--no-claude'], '--no-claude'], [['--agent', 'codex'], '--agent codex']]) {
    const r = updateWith(env, args);
    assert.strictEqual(sha(SETTINGS), before, `\`update ${flag}\` rewrote ~/.claude/settings.json`);
    assert.ok(new RegExp(`Hook wiring[\\s\\S]*skipped: ${flag}`).test(r.out),
      `\`update ${flag}\` did not say the wiring was skipped:\n${r.out.slice(-500)}`);
  }
  // the control: the same machine, unscoped, IS re-wired — so the two above prove scope
  const r = updateWith(env, []);
  assert.ok(/PreToolUse: matcher/.test(r.out), 'the control did not re-wire — the fixture proves nothing');
});

it('`update --dry-run` names the settings.json write and the stale field, and writes nothing (#3)', () => {
  const env = updateEnv();
  saveSettings(staleInstall());
  const before = sha(SETTINGS);
  const r = updateWith(env, ['--dry-run']);
  assert.strictEqual(sha(SETTINGS), before, 'a preview wrote settings.json');
  assert.ok(r.out.includes(SETTINGS), `the receipt does not name settings.json:\n${r.out.slice(-800)}`);
  assert.ok(/hooks-wiring/.test(r.out), 'the receipt has no hooks-wiring step');
  assert.ok(/PreToolUse: matcher/.test(r.out), 'the receipt does not say which field is stale');
  const scoped = updateWith(env, ['--dry-run', '--no-claude']);
  assert.ok(/hooks-wiring[\s\S]*out of scope/.test(scoped.out), 'a scoped preview does not say the wiring is out of scope');
});

it('fields the operator added to our entries survive `update`, and the reasons are true (#7)', () => {
  const env = updateEnv();
  const s = staleInstall();
  s.hooks.UserPromptSubmit[0].hooks[0].timeout = 5;
  s.statusLine.padding = 0;
  saveSettings(s);
  const r = updateWith(env, []);
  const after = readSettings();
  assert.strictEqual(after.hooks.UserPromptSubmit[0].hooks[0].timeout, 5, 'the operator\'s timeout was dropped');
  assert.strictEqual(after.statusLine.padding, 0, 'the operator\'s padding was dropped');
  assert.strictEqual(after.hooks.PreToolUse[0].matcher, FULL_MATCHER.replace('/x', ''), 'the stale matcher was not fixed');
  assert.ok(/PreToolUse: matcher/.test(r.out), r.out.slice(-500));
  assert.ok(!/UserPromptSubmit: /.test(r.out) && !/statusLine: /.test(r.out),
    `an entry whose matcher and command are current was reported as changed:\n${r.out.slice(-500)}`);
  const again = sha(SETTINGS);
  updateWith(env, []);
  assert.strictEqual(sha(SETTINGS), again, 'the second update changed the file');
});

it('entries the operator removed by hand stay removed across three updates (risk c)', () => {
  const env = updateEnv();
  const s = staleInstall();
  delete s.statusLine;
  delete s.hooks.Notification;
  saveSettings(s);
  const hashes = [];
  for (let i = 0; i < 3; i += 1) {
    updateWith(env, []);
    const now = readSettings();
    assert.ok(!('statusLine' in now), `run ${i + 1} put back a status line the operator removed`);
    assert.ok(!('Notification' in now.hooks), `run ${i + 1} put back a Notification hook the operator removed`);
    assert.strictEqual(now.hooks.PreToolUse[0].matcher, FULL_MATCHER.replace('/x', ''));
    hashes.push(sha(SETTINGS));
  }
  assert.strictEqual(hashes[1], hashes[0]);
  assert.strictEqual(hashes[2], hashes[0]);
});

// Fix round 2, K. `update` refreshes only entries that are present, so a family event a later
// release adds is never wired by it — and nothing said so. Each event of ours that is not wired
// is now named with the remedy, by the run and by its preview.
it('`update` and `update --dry-run` name every family event not wired here, with the `hooks install` remedy (K)', () => {
  const env = updateEnv();
  const s = staleInstall();
  delete s.hooks.Notification;
  delete s.hooks.FileChanged;
  saveSettings(s);
  for (const args of [['--dry-run'], []]) {
    const r = updateWith(env, args);
    for (const ev of ['Notification', 'FileChanged']) {
      assert.ok(new RegExp(`${ev}: not wired here[^\\n]*hooks install`).test(r.out),
        `\`update ${args.join(' ')}\` did not name ${ev} with its remedy:\n${r.out.slice(-900)}`);
    }
    assert.ok(!/PostToolUse: not wired/.test(r.out), 'a wired event was reported as not wired');
    // final polish 7: the remedy re-adds EVERY removed entry, which an operator who removed
    // one on purpose must be told before running it
    assert.ok(/`hooks install` re-adds every removed family entry/.test(r.out),
      `\`update ${args.join(' ')}\` did not say that \`hooks install\` re-adds every removed entry:\n${r.out.slice(-900)}`);
  }
  assert.ok(!('Notification' in readSettings().hooks), 'update added an event — only `hooks install` adds');
});

// Fix round 2, L. `--no-claude` (and an `--agent` list, which can never name Claude) skipped
// the settings.json wiring but still refreshed the runtime copy those entries execute — new
// scripts under old wiring. The runtime copy now follows the same scope as the wiring.
it('`update --no-claude` leaves the wired runtime copy alone too, and says so (L)', () => {
  const env = updateEnv();
  saveSettings(staleInstall());
  const rt = path.join(HOME, '.sshlg-skills', 'runtime', 'hooks', 'notification.js');
  const original = fs.readFileSync(rt, 'utf8');
  fs.writeFileSync(rt, original + '\n// stale\n');
  try {
    for (const [args, flag] of [[['--no-claude'], '--no-claude'], [['--agent', 'codex'], '--agent codex']]) {
      const r = updateWith(env, args);
      assert.ok(fs.readFileSync(rt, 'utf8').endsWith('// stale\n'),
        `\`update ${flag}\` refreshed the runtime copy while skipping its wiring`);
      assert.ok(new RegExp(`Wired hook runtime[\\s\\S]*skipped: ${flag}`).test(r.out),
        `\`update ${flag}\` did not say the runtime copy was skipped:\n${r.out.slice(-700)}`);
      const dry = updateWith(env, args.concat(['--dry-run']));
      assert.ok(/runtime-sync:[^\n]*out of scope/.test(dry.out), `the preview of \`${flag}\` would refresh the runtime:\n${dry.out.slice(-900)}`);
    }
    // the control: unscoped, the copy IS refreshed
    updateWith(env, []);
    assert.strictEqual(fs.readFileSync(rt, 'utf8'), original, 'the control did not refresh the runtime — the fixture proves nothing');
  } finally {
    fs.writeFileSync(rt, original);
  }
});

// Final polish, item 8. An `--agent` list skipped the routing block, the wiring and the
// runtime copy (the Claude host is out of its scope) but still ran `claude plugin update`
// for every member. Decided: the Claude plugin step follows the same scope (`claudeScope`).
it('`update --agent codex` runs no Claude plugin step, in the run or its preview; unscoped does (final polish 8)', () => {
  const env = updateEnv();
  saveSettings(staleInstall());
  const calls = path.join(HOME, 'claude-calls.log');
  env.SSHLG_TEST_NATIVE_CALL_LOG=calls;
  const count = () => {try{return fs.readFileSync(calls,'utf8').split('\n').filter(l=>l==='claude-pins').length;}catch(_){return 0;}};
  try { fs.unlinkSync(calls); } catch (e) { /* none yet */ }
  const r = updateWith(env, ['--agent', 'codex']);
  assert.strictEqual(count(), 0, `\`update --agent codex\` ran ${count()} claude plugin command(s):\n${r.out.slice(-600)}`);
  assert.ok(/Claude Code plugins[\s\S]*skipped: --agent codex/.test(r.out), `the run did not say the plugin step was skipped:\n${r.out.slice(-900)}`);
  const dry = updateWith(env, ['--agent', 'codex', '--dry-run']);
  assert.ok(!/claude plugin/.test(dry.out), `the preview of \`--agent codex\` lists a claude plugin step:\n${dry.out.slice(-900)}`);
  // the control: unscoped, the plugin step runs
  updateWith(env, []);
  assert.ok(count() > 0, 'the control ran no native transaction — the fixture proves nothing');
});

it('a foreign status line blocks nothing and is left byte-identical (risk d)', () => {
  const env = updateEnv();
  const s = staleInstall();
  s.statusLine = { type: 'command', command: 'other-tool statusline', padding: 2 };
  saveSettings(s);
  const r = updateWith(env, []);
  const after = readSettings();
  assert.deepStrictEqual(after.statusLine, s.statusLine, 'the foreign status line was touched');
  assert.strictEqual(after.hooks.PreToolUse[0].matcher, FULL_MATCHER.replace('/x', ''),
    `a status line the update never writes blocked the matcher fix:\n${r.out.slice(-500)}`);
});

// --- the set-update notice, as a process ------------------------------------
//
// `lib/updatecheck.js` owns the policy and is fixtured without a HOME. What only a
// process can show is that the two impure lines in the hook cannot break a session:
// the cache is a file somebody else's tooling also writes, and the probe is spawned
// into a directory that may be read-only.

it('a cache saying a newer set is out becomes exactly one line', () => {
  const dir = path.join(HOME, '.sshlg-skills');
  fs.mkdirSync(dir, { recursive: true });
  const cache = { at: Date.now(), latest: '99.0.0' };
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(
    { routers: 'yes', updateCheck: cache }) + '\n');

  // The fixture is checked BEFORE the hook, in-process. This test failed once on
  // CI and passed on the author's machine with the same inputs, and the message
  // ("got 0") could not say which half was wrong: the module that decides, or the
  // hook that carries it. Now it can — the module is asserted first, so a failure
  // names the layer instead of the symptom.
  const chk = require(path.join(ROOT, 'lib', 'updatecheck.js'));
  const installed = require(path.join(ROOT, 'package.json')).version;
  const decided = chk.plan(installed, cache, Date.now(), undefined, {}).line;
  assert.ok(decided, `the MODULE produced no line for installed=${installed} latest=${cache.latest}`);

  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  const ctx = started.hookSpecificOutput.additionalContext;
  const hits = ctx.split('\n').filter((l) => /A newer set is out/.test(l));
  assert.strictEqual(hits.length, 1,
    `the module decided a line and the HOOK emitted ${hits.length}. `
    + `installed=${installed} home=${HOME} cache=${JSON.stringify(cache)}\ncontext:\n${ctx}`);
  assert.match(hits[0], /99\.0\.0/, 'the notice does not name the version that is out');
  assert.match(hits[0], /npx sshlg-skills@latest update/, 'the notice does not carry the command');
});

it('a cache saying the set is current says nothing', () => {
  const dir = path.join(HOME, '.sshlg-skills');
  fs.mkdirSync(dir, { recursive: true });
  const installed = require(path.join(ROOT, 'package.json')).version;
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(
    { routers: 'yes', updateCheck: { at: Date.now(), latest: installed } }) + '\n');
  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  const ctx = started.hookSpecificOutput.additionalContext;
  // An absence is only evidence when something present proves the hook ran. Three
  // of these four cases were satisfiable by the feature being missing entirely,
  // which is a suite that cannot tell "silent" from "absent".
  assert.match(ctx, /ssheleg family/, 'the hook did not run, so its silence proves nothing');
  assert.ok(!/A newer set is out/.test(ctx), 'a current set was announced as out of date');
});

it('a CORRUPT cache starts the session and claims nothing', () => {
  // The file is the launcher's, but `~/.sshlg-skills/state.json` is on disk where
  // anything can truncate it. A hook that threw here would break every turn of
  // every session, including sessions of packs that never asked for this one.
  const dir = path.join(HOME, '.sshlg-skills');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'state.json'), '{ not json at all');
  const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
  const ctx = started.hookSpecificOutput.additionalContext;
  assert.match(ctx, /ssheleg family/, 'the session lost its routing note to a bad cache');
  assert.ok(!/A newer set is out/.test(ctx), 'an unreadable cache produced a version claim');
});

it('a read-only state directory starts the session anyway', () => {
  const dir = path.join(HOME, '.sshlg-skills');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ routers: 'yes' }) + '\n');
  fs.chmodSync(dir, 0o555);
  try {
    const started = runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'startup' });
    assert.match(started.hookSpecificOutput.additionalContext, /ssheleg family/,
      'an unwritable cache directory broke the session');
  } finally {
    fs.chmodSync(dir, 0o755);
  }
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

it('a system-generated turn produces no routing note, as a process', () => {
  // The harness fires UserPromptSubmit for background-task notifications too;
  // on 2026-09-06 each one in a session was "routed" off its own body text.
  const out = runHookText('user-prompt-submit.js', {
    session_id: 'e2e-systurn', prompt_id: 'p9',
    prompt: '[SYSTEM NOTIFICATION - NOT USER INPUT]\n<task-notification>agent wired the stripe checkout, сделай лендинг</task-notification>',
  });
  assert.strictEqual(out, '', `a system turn was routed: ${out.slice(0, 80)}`);
  // The same body minus the marker routes, so the silence is decided, not lucky.
  const routed = runHookText('user-prompt-submit.js', {
    session_id: 'e2e-systurn', prompt_id: 'p10',
    prompt: 'agent wired the stripe checkout, сделай лендинг',
  });
  assert.ok(routed.includes('[sshlg-routing]'), 'the control prompt stopped routing — the fixture proves nothing');
});

// B-185 seam fix (S3): a domain route whose member is installed but not loaded in this
// project says how to enable it, and the PreToolUse gate does not ask for a route that
// cannot be taken here.
it('a route to a member not loaded in this project names `domains --enable`, and the gate stays quiet', () => {
  const plug = path.join(HOME, 'tg-plugin');
  write(path.join(plug, 'skills', 'telegram-bots', 'SKILL.md'), '---\nname: telegram-bots\ndescription: Telegram bots.\n---\n');
  const reg = path.join(HOME, '.claude', 'plugins', 'installed_plugins.json');
  const regBefore = fs.existsSync(reg) ? fs.readFileSync(reg, 'utf8') : null;
  write(reg, JSON.stringify({ plugins: { 'telegram-dev@telegram-dev': [{ installPath: plug }] } }));
  const before = fs.existsSync(SETTINGS) ? fs.readFileSync(SETTINGS, 'utf8') : null;
  write(SETTINGS, JSON.stringify({ enabledPlugins: { 'telegram-dev@telegram-dev': false } }, null, 2) + '\n');
  const proj = path.join(HOME, 'tg-proj');
  fs.mkdirSync(path.join(proj, '.git'), { recursive: true });
  const session = 'e2e-unloaded';
  const note = runHookText('user-prompt-submit.js', {
    session_id: session, prompt_id: 'p1', cwd: proj, prompt: 'сделай телеграм-бота для заказов',
  });
  assert.ok(/domains --enable telegram-dev/.test(note), `no enable hint: ${note}`);
  const rec = JSON.parse(fs.readFileSync(turnsFile(session), 'utf8'));
  assert.ok(!(rec.routes || []).includes('telegram-dev'), 'a route that cannot be taken was armed for the gate');
  const again = runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p2', cwd: proj, prompt: 'сделай телеграм-бота для заказов' });
  assert.strictEqual(again, '', 'the unloaded enable hint repeated in the same session');
  // Enabled in the project: the plain note, and the route is armed.
  write(path.join(proj, '.claude', 'settings.local.json'), JSON.stringify({ enabledPlugins: { 'telegram-dev@telegram-dev': true } }, null, 2) + '\n');
  const on = runHookText('user-prompt-submit.js', {
    session_id: 'e2e-loaded', prompt_id: 'p1', cwd: proj, prompt: 'сделай телеграм-бота для заказов',
  });
  assert.ok(!/domains --enable/.test(on), on);
  assert.ok(JSON.parse(fs.readFileSync(turnsFile('e2e-loaded'), 'utf8')).routes.includes('telegram-dev'));
  if (before === null) fs.rmSync(SETTINGS, { force: true }); else fs.writeFileSync(SETTINGS, before);
  if (regBefore === null) fs.rmSync(reg, { force: true }); else fs.writeFileSync(reg, regBefore);
});

function turnsFile(session) { return path.join(HOME, '.sshlg-skills', 'turns', `${session}.json`); }

it('the same prompt twice in a session prints the routing note once (R01)', () => {
  const session = 'e2e-once';
  const prompt = 'сделай фичу экспорта в csv';
  const a = runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p1', prompt });
  const b = runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p2', prompt });
  assert.ok(a.includes('[sshlg-routing]'), 'the first turn printed nothing');
  assert.strictEqual(b, '', `the second turn repeated the note: ${b.slice(0, 80)}`);
  const noted = JSON.parse(fs.readFileSync(turnsFile(session), 'utf8')).noted;
  assert.ok(Array.isArray(noted) && noted.length >= 1, 'the printed routes were not recorded');
});

it('a new route on turn two prints only the new route (R01)', () => {
  const session = 'e2e-once-new';
  const first = runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p1', prompt: 'сделай фичу экспорта в csv' });
  const out = runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p2', prompt: 'сделай фичу экспорта в csv, поправь дизайн и анимации лендинга' });
  assert.ok(out.includes('[sshlg-routing]'), 'a route never shown before was suppressed');
  const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- this '));
  const seen = bullets(first);
  assert.ok(seen.length >= 1);
  // the delivery line is the one exception (fix round #9): a fresh facet on a writing
  // prompt brings it back beside itself
  const delivery = `- this ${require('../lib/triggers.js').routeLines()['task-pipeline']}.`;
  for (const l of bullets(out)) {
    if (l === delivery) continue;
    assert.ok(!seen.includes(l), `already-noted route printed again: ${l}`);
  }
});

it('compact and clear reset the noted routes; startup and resume keep them (R01)', () => {
  const session = 'e2e-once-reset';
  const prompt = 'сделай фичу экспорта в csv';
  runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p1', prompt });
  assert.ok(JSON.parse(fs.readFileSync(turnsFile(session), 'utf8')).noted.length >= 1);
  for (const source of ['startup', 'resume']) {
    runHook('session-start.js', { hook_event_name: 'SessionStart', source, session_id: session });
    assert.ok(JSON.parse(fs.readFileSync(turnsFile(session), 'utf8')).noted.length >= 1,
      `${source} wiped the record although the context still holds the note`);
  }
  for (const source of ['compact', 'clear']) {
    runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p2', prompt });
    runHook('session-start.js', { hook_event_name: 'SessionStart', source, session_id: session });
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(turnsFile(session), 'utf8')).noted, [],
      `${source} kept a record of notes the context no longer holds`);
    const again = runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p3', prompt });
    assert.ok(again.includes('[sshlg-routing]'), `after ${source} the note never came back`);
  }
});

// Fix round 2, D. The CHANGELOG said `fork` keeps the record like `startup` and `resume`.
// A fork is a NEW session id (`claude --help`: "--fork-session … create a new session ID"),
// and `noted` is keyed by session id, so the forked session prints its notes again.
it('a fork is a new session id, so its notes print again (D)', () => {
  const parent = 'e2e-fork-parent';
  const child = 'e2e-fork-child';
  const prompt = 'сделай фичу экспорта в csv';
  assert.ok(runHookText('user-prompt-submit.js', { session_id: parent, prompt_id: 'p1', prompt }).includes('[sshlg-routing]'));
  assert.strictEqual(runHookText('user-prompt-submit.js', { session_id: parent, prompt_id: 'p2', prompt }), '',
    'the control: the parent session does not repeat its note');
  runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'fork', session_id: child });
  const forked = runHookText('user-prompt-submit.js', { session_id: child, prompt_id: 'p3', prompt });
  assert.ok(forked.includes('[sshlg-routing]'), 'the forked session (a new id) was told nothing');
});

it('an unreadable turnstate still prints the note (R01)', () => {
  const session = 'e2e-once-bad';
  write(turnsFile(session), '{not json');
  const out = runHookText('user-prompt-submit.js',
    { session_id: session, prompt_id: 'p1', prompt: 'сделай фичу экспорта в csv' });
  assert.ok(out.includes('[sshlg-routing]'), 'a corrupt record hid the route');
});

it('a system turn neither prints nor records a note (R01)', () => {
  const session = 'e2e-once-sys';
  const out = runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p1',
    prompt: '[SYSTEM NOTIFICATION - NOT USER INPUT]\n<task-notification>сделай лендинг</task-notification>' });
  assert.strictEqual(out, '');
  const f = turnsFile(session);
  const noted = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')).noted || []) : [];
  assert.deepStrictEqual(noted, [], 'a system turn recorded a note');
});

it('a facet on turn two names task-pipeline beside it although delivery was noted (#9)', () => {
  const T = require('../lib/triggers.js');
  const lineOf = T.routeLines();
  const session = 'e2e-pair';
  const a = runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p1', prompt: 'исправь баг' });
  assert.ok(a.includes(lineOf['task-pipeline']), 'the control turn did not name delivery');
  const b = runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p2', prompt: 'сделай редизайн лендинга' });
  assert.ok(b.includes(lineOf['sheleg-design']), `the facet is missing:\n${b}`);
  assert.ok(b.includes(lineOf['task-pipeline']), `the facet came without its delivery line:\n${b}`);
});

it('payloads with no session id do not share a record: two plain runs both print (risk a)', () => {
  const plain = () => {
    const r = spawnSync('node', [path.join(ROOT, 'hooks', 'user-prompt-submit.js')],
      { input: 'сделай фичу экспорта в csv', encoding: 'utf8', env: ENV });
    assert.strictEqual(r.status, 0);
    return (r.stdout || '').trim();
  };
  const idless = () => runHookText('user-prompt-submit.js', { prompt: 'сделай фичу экспорта в csv' });
  for (const run of [plain, idless]) {
    assert.ok(run().includes('[sshlg-routing]'), 'the first id-less run printed nothing');
    assert.ok(run().includes('[sshlg-routing]'), 'a second id-less caller was hidden by the first one\'s record');
  }
});

// Fix round 2, H. Risk a stopped id-less payloads sharing `noted`, but the routes, `asked`
// and the STICKY `optedOut` still went to `turns/unknown.json`: one id-less caller's prompt
// armed an escalation on another's Edit, and one «без пайплайна» silenced every id-less caller
// for good. No session id now means no turn record at all — written or read.
it('an id-less prompt leaves no turn record: it arms nothing and silences nothing (H)', () => {
  const unknown = turnsFile('unknown');
  try { fs.unlinkSync(unknown); } catch (e) { /* none yet */ }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-'));
  const edit = () => runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'src.js') }, cwd: dir,
  });
  runHookText('user-prompt-submit.js', { prompt: 'сделай фичу экспорта в csv' });
  assert.strictEqual(edit(), null, 'an id-less caller\'s Edit was escalated on another id-less caller\'s prompt');
  runHookText('user-prompt-submit.js', { prompt: 'сделай фичу, без пайплайна' });
  assert.ok(!fs.existsSync(unknown), `an id-less payload wrote a shared turn record: ${unknown}`);
  // the refusal reached no shared record, so a caller WITH a session is unaffected (control)
  runHookText('user-prompt-submit.js', { session_id: 'e2e-h', prompt_id: 'p1', prompt: 'сделай фичу экспорта в csv' });
  const asked = runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: 'e2e-h', prompt_id: 'p1',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'src.js') }, cwd: dir,
  });
  assert.strictEqual(asked && asked.hookSpecificOutput.permissionDecision, 'ask', 'the control did not escalate');
});

// Final polish, item 5. The prompt hook read and wrote the turn record under the RAW id
// while the PreToolUse hook read it under the trimmed one (and wrote `asked` under the raw),
// so a padded id armed nothing and asked on every Edit. And an id that sanitises to the
// shared key ('...', 'unknown') is no id at all: it would share `turns/unknown.json`.
it('a padded session id keys one turn record: the Edit escalates once (final polish 5)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-'));
  const session = '  e2e-pad  ';
  runHookText('user-prompt-submit.js', { session_id: session, prompt_id: 'p1', prompt: 'сделай фичу экспорта в csv' });
  const edit = (f) => runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: session, prompt_id: 'p1',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, f) }, cwd: dir,
  });
  const first = edit('a.js');
  assert.strictEqual(first && first.hookSpecificOutput.permissionDecision, 'ask',
    'a padded id armed nothing: the prompt hook wrote under a different key than PreToolUse read');
  assert.strictEqual(edit('b.js'), null, 'a padded id was asked on every Edit: `asked` went to another key');
  assert.ok(fs.existsSync(turnsFile('e2e-pad')), 'the record is not under the trimmed id');
});

it('an id whose key is the shared one (\'...\', \'unknown\') is id-less: no record, no hidden note (final polish 5)', () => {
  const unknown = turnsFile('unknown');
  try { fs.unlinkSync(unknown); } catch (e) { /* none yet */ }
  const prompt = 'сделай фичу экспорта в csv';
  for (const id of ['...', 'unknown', '..', '  unknown ']) {
    const out = runHookText('user-prompt-submit.js', { session_id: id, prompt_id: 'p1', prompt });
    assert.ok(out.includes('[sshlg-routing]'), `the note under id ${JSON.stringify(id)} was hidden by another caller's record`);
  }
  runHookText('user-prompt-submit.js', { session_id: '...', prompt_id: 'p2', prompt: 'сделай фичу, без пайплайна' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-'));
  runHook('pre-tool-use.js', {
    hook_event_name: 'PreToolUse', session_id: 'unknown', prompt_id: 'p2',
    tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'x.js') }, cwd: dir,
  });
  runHook('session-start.js', { hook_event_name: 'SessionStart', source: 'compact', session_id: '...' });
  assert.ok(!fs.existsSync(unknown), `an id that sanitises to the shared key wrote ${unknown}`);
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

  it('THE BARE-CLI REFUSAL ADMITS IT CANNOT TELL AN EXAMPLE FROM AN INVOCATION', () => {
    // `executablePart` keeps quoted strings on purpose — `bash -c '…'` is a real
    // invocation — so a payload that QUOTES the command is refused with a sentence that
    // is untrue of it: no plain copy is created by a search. Measured 2026-09-01 while
    // shipping: `gh pr create --body` carrying a fenced block of `update` output was
    // refused by this hook, in this repository, during a release that had just filed the
    // class as B-136.
    //
    // A refusal an operator can see is wrong is how a hook gets switched off. One that
    // admits it may be wrong and names the escape keeps working.
    const out = runHook('pre-tool-use.js', {
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npx skills update ux-flows' },
    });
    assert.strictEqual(out.hookSpecificOutput.permissionDecision, 'deny');
    const why = out.hookSpecificOutput.permissionDecisionReason;
    assert.ok(/would create/.test(why),
      'the refusal still asserts a copy IS created, which is false when the text is quoted');
    assert.ok(/QUOTED rather than run/.test(why),
      'the refusal does not admit the class it gets wrong');
    assert.ok(/cannot tell an example from an invocation/.test(why),
      'the refusal does not say WHY it may be wrong');
    assert.ok(/Break the phrase|through a file|pattern split/.test(why),
      'the refusal names no escape — a refusal with no next step is how a hook is turned off');
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
