#!/usr/bin/env node
'use strict';
// Fixtures for lib/hooks.js — the edit to the operator's settings.json.
//
// Two properties carry the file, and both are about not destroying something the
// operator did not ask about:
//   - another pack's SessionStart hook survives ours being added;
//   - another tool's statusLine is a reported conflict, never a silent overwrite.
//
// The third is idempotence, asserted on the computed edit rather than on a write,
// because a pure planner is where that can be proven without a HOME.

const assert = require('assert');
const H = require('../lib/hooks.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = '/opt/sshlg-skills';
const FOREIGN_HOOK = {
  matcher: 'startup',
  hooks: [{ type: 'command', command: '"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd" session-start' }],
};

it('adding ours keeps another pack\'s SessionStart hook', () => {
  const before = { hooks: { SessionStart: [FOREIGN_HOOK] } };
  const { settings } = H.plan(before, ROOT, {});
  const events = settings.hooks.SessionStart;
  assert.strictEqual(events.length, 2, `expected theirs + ours, got ${events.length}`);
  assert.deepStrictEqual(events[0], FOREIGN_HOOK, 'the other pack\'s hook was modified');
  assert.ok(H.isOurs(events[1].hooks[0].command, ROOT), 'ours was not added');
});

it('a second plan is a no-op — ours is refreshed in place, never duplicated', () => {
  const first = H.plan({ hooks: { SessionStart: [FOREIGN_HOOK] } }, ROOT, {});
  const second = H.plan(first.settings, ROOT, {});
  assert.deepStrictEqual(second.settings, first.settings, 'the second plan changed the file again');
  assert.deepStrictEqual(second.changed, [], `second plan still reports: ${second.changed}`);
  assert.strictEqual(second.settings.hooks.SessionStart.length, 2, 'ours was appended twice');
});

it('a foreign statusLine is a conflict, and is NOT taken without force', () => {
  const before = { statusLine: { type: 'command', command: 'bash /elsewhere/caveman.sh' } };
  const { settings, conflicts } = H.plan(before, ROOT, {});
  assert.strictEqual(conflicts.length, 1, 'the conflict was not reported');
  assert.strictEqual(conflicts[0].key, 'statusLine');
  assert.deepStrictEqual(settings.statusLine, before.statusLine,
    'someone else\'s status line was replaced without being asked');
});

it('with force it is taken, and the conflict is still reported', () => {
  const before = { statusLine: { type: 'command', command: 'bash /elsewhere/caveman.sh' } };
  const { settings, conflicts, changed } = H.plan(before, ROOT, { force: true });
  assert.strictEqual(conflicts.length, 1, 'force silenced the report of what it displaced');
  assert.ok(H.isOurs(settings.statusLine.command, ROOT), 'force did not take the status line');
  assert.ok(changed.some((c) => /replaced/.test(c)), `changed says: ${changed}`);
});

it('an absent statusLine is simply set, with no conflict', () => {
  const { settings, conflicts } = H.plan({}, ROOT, {});
  assert.deepStrictEqual(conflicts, []);
  assert.ok(H.isOurs(settings.statusLine.command, ROOT));
});

it('removal takes ours out and leaves theirs untouched', () => {
  const installed = H.plan({ hooks: { SessionStart: [FOREIGN_HOOK] } }, ROOT, {}).settings;
  const { settings } = H.removal(installed, ROOT);
  assert.deepStrictEqual(settings.hooks.SessionStart, [FOREIGN_HOOK],
    'removal did not restore the file to just the other pack\'s hook');
  assert.ok(!settings.statusLine, 'our status line survived removal');
});

it('removal deletes the key rather than leaving an empty array', () => {
  const installed = H.plan({}, ROOT, {}).settings;
  const { settings } = H.removal(installed, ROOT);
  assert.ok(!settings.hooks || !('UserPromptSubmit' in settings.hooks),
    'an empty UserPromptSubmit array was left behind');
  assert.ok(!('hooks' in settings), `an empty hooks object was left: ${JSON.stringify(settings.hooks)}`);
});

it('removal is idempotent and does not invent keys on a clean file', () => {
  const { settings, changed } = H.removal({}, ROOT);
  assert.deepStrictEqual(settings, {});
  assert.deepStrictEqual(changed, []);
});

it('everything outside our keys is preserved byte for byte', () => {
  const before = {
    env: { CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' },
    enabledPlugins: { 'caveman@caveman': true },
    hooks: { PostToolUse: [{ hooks: [{ type: 'command', command: 'their-linter' }] }] },
  };
  const { settings } = H.plan(before, ROOT, {});
  assert.deepStrictEqual(settings.env, before.env);
  assert.deepStrictEqual(settings.enabledPlugins, before.enabledPlugins);
  // We wire PostToolUse ourselves now, so this event is shared. Theirs must come
  // back untouched and FIRST — appending ours is the whole contract.
  assert.deepStrictEqual(settings.hooks.PostToolUse[0], before.hooks.PostToolUse[0],
    'another pack\'s PostToolUse hook was modified');
  const back = H.removal(settings, ROOT).settings;
  assert.deepStrictEqual(back, before, 'install then remove did not round-trip to the original');
});

// --- the events added in this release --------------------------------------

it('every wired event round-trips: install then remove is the identity', () => {
  // The property that makes `remove` an undo. It broke the moment the event list
  // lived in two places, which is why WIRED is now the only list.
  const foreign = {};
  for (const e of H.EVENTS) {
    foreign[e] = [{ hooks: [{ type: 'command', command: `their-${e}-hook` }] }];
  }
  const before = { hooks: foreign };
  const installed = H.plan(before, ROOT, {}).settings;
  for (const e of H.EVENTS) {
    assert.strictEqual(installed.hooks[e].length, 2, `${e}: theirs and ours should both be there`);
  }
  const back = H.removal(installed, ROOT).settings;
  assert.deepStrictEqual(back, before, 'a wired event was left behind by removal');
});

it('the guard covers every tool that can write to a file', () => {
  const guard = H.entries(ROOT).PreToolUse;
  for (const tool of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Bash']) {
    assert.ok(guard.matcher.split('|').includes(tool),
      `${tool} can write and is not matched: ${guard.matcher}`);
  }
});

it('SessionStart runs on resume and fork, or a resumed session gets no pointer', () => {
  const m = H.entries(ROOT).SessionStart.matcher.split('|');
  for (const source of ['startup', 'clear', 'compact', 'resume', 'fork']) {
    assert.ok(m.includes(source), `SessionStart does not run on ${source}`);
  }
});

it('FileChanged matches a FILENAME — its matcher is not a tool name', () => {
  // The one event whose matcher means something else entirely. Wiring a tool name
  // here would watch a file literally called `Bash`.
  assert.strictEqual(H.entries(ROOT).FileChanged.matcher, 'run.md');
});

it('ConfigChange watches the file this pack writes to', () => {
  assert.strictEqual(H.entries(ROOT).ConfigChange.matcher, 'user_settings');
});

it('Notification does not fire on permission prompts', () => {
  const m = H.entries(ROOT).Notification.matcher.split('|');
  assert.ok(!m.includes('permission_prompt'),
    'a desktop ping on every permission prompt is a ping that gets muted');
});

it('every entry is a command hook pointing inside the runtime directory', () => {
  const root = H.runtimeDir('/home/x');
  const w = H.entries(root);
  for (const e of H.EVENTS) {
    const h = w[e].hooks[0];
    assert.strictEqual(h.type, 'command', `${e} is not a command hook`);
    assert.ok(h.command.includes(root), `${e} wired outside the runtime dir: ${h.command}`);
  }
  assert.ok(w.statusLine.command.includes(root));
});

it('describe names every wired event, so status cannot under-report', () => {
  const d = H.describe(ROOT).join('\n');
  for (const e of H.EVENTS.concat(['statusLine'])) {
    assert.ok(d.includes(e), `describe() omits ${e} — status would say it is installed when it is not`);
  }
});

it('the wired directory is the operator\'s, never the package\'s', () => {
  // v0.41.0 shipped with `__dirname/..` wired. From a clone that is the repo and
  // works; via `npx` it is npm's cache, which npx may prune — leaving three
  // hooks that fail silently on every prompt. Worse than not installing them.
  const dir = H.runtimeDir('/home/x');
  assert.strictEqual(dir, '/home/x/.sshlg-skills/runtime');
  assert.ok(!/node_modules|_npx/.test(dir), `the runtime dir looks like a package path: ${dir}`);
});

it('every entry points inside the runtime directory', () => {
  const root = H.runtimeDir('/home/x');
  const { settings } = H.plan({}, root, {});
  const wired = [
    settings.statusLine.command,
    settings.hooks.SessionStart[0].hooks[0].command,
    settings.hooks.UserPromptSubmit[0].hooks[0].command,
  ];
  for (const cmd of wired) {
    assert.ok(cmd.includes(root), `wired outside the runtime dir: ${cmd}`);
  }
});

it('describe names all three entries and the matcher', () => {
  const d = H.describe(ROOT).join('\n');
  for (const k of ['SessionStart', 'UserPromptSubmit', 'statusLine', H.MATCHER]) {
    assert.ok(d.includes(k), `describe() omits ${k}`);
  }
});

it('isOurs matches by path, so a copy elsewhere is not claimed', () => {
  assert.strictEqual(H.isOurs(`node "${ROOT}/hooks/session-start.js"`, ROOT), true);
  assert.strictEqual(H.isOurs('node "/somewhere/else/hooks/session-start.js"', ROOT), false);
  assert.strictEqual(H.isOurs(undefined, ROOT), false);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
