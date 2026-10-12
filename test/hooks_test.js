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

// THE ORDER THE OTHER PACK ARRIVED IN DECIDED WHETHER WE CRIED WOLF.
//
// The existing no-op fixture above seeds `[theirs]`, so ours is appended second and
// the order happens to match on the next plan. The broken case is the mirror: ours
// installed FIRST, another pack's hook added beside it later. `others.concat([ours])`
// then always rebuilt the list as `[theirs, ours]` — the same multiset, a different
// order — and `hooks` reported a byte-perfect install as `(refreshed)` for ever.
//
// Measured 2026-09-01 on this machine, whose nine runtime scripts are byte-identical
// to the package (`diff -rq` silent): four events flagged, exactly the four another
// tool also registers, and the README names four such packs. Following the advice
// rewrote `settings.json`, spent one of ten backup slots, changed nothing, and the
// condition returned.
it('OURS INSTALLED FIRST, THEIRS ADDED LATER — a second plan is still a no-op', () => {
  const seeded = H.plan({}, ROOT, {}).settings;
  // Another pack arrives AFTER us and lands beside our entry.
  seeded.hooks.SessionStart = seeded.hooks.SessionStart.concat([FOREIGN_HOOK]);
  const ourIndexBefore = seeded.hooks.SessionStart.findIndex(
    (m) => (m.hooks || []).some((h) => H.isOurs(h.command, ROOT)));
  assert.strictEqual(ourIndexBefore, 0, 'fixture setup: ours should be first here');

  const again = H.plan(seeded, ROOT, {});
  assert.deepStrictEqual(again.changed, [],
    `a byte-identical install was reported as changed: ${again.changed}`);
  assert.deepStrictEqual(again.settings, seeded,
    'the plan rewrote settings.json while changing nothing');
  const ourIndexAfter = again.settings.hooks.SessionStart.findIndex(
    (m) => (m.hooks || []).some((h) => H.isOurs(h.command, ROOT)));
  assert.strictEqual(ourIndexAfter, 0, 'our entry was moved to the end');
});

// --- why an entry changed, and who has consented (R03) ----------------------

it('every changed event carries a reason: added | matcher | command | order', () => {
  const fresh = H.plan({}, ROOT, {});
  assert.strictEqual(fresh.reasons.length, fresh.changed.length, 'a change without a reason');
  assert.ok(fresh.reasons.every((r) => r.reason === 'added'), JSON.stringify(fresh.reasons));

  // stale matcher: the 1.55.1 case — everything else identical
  const stale = JSON.parse(JSON.stringify(fresh.settings));
  stale.hooks.PreToolUse[0].matcher = 'Edit|Write|MultiEdit|NotebookEdit|Bash';
  const m = H.plan(stale, ROOT, {});
  assert.deepStrictEqual(m.reasons, [{ event: 'PreToolUse', reason: 'matcher' }]);

  // stale command: the script moved
  const moved = JSON.parse(JSON.stringify(fresh.settings));
  moved.hooks.Notification[0].hooks[0].command = `node "${ROOT}/hooks/old-name.js"`;
  assert.deepStrictEqual(H.plan(moved, ROOT, {}).reasons,
    [{ event: 'Notification', reason: 'command' }]);

  // order only: ours duplicated, both with the right content
  const dup = JSON.parse(JSON.stringify(fresh.settings));
  dup.hooks.PostToolUse.push(JSON.parse(JSON.stringify(dup.hooks.PostToolUse[0])));
  assert.deepStrictEqual(H.plan(dup, ROOT, {}).reasons,
    [{ event: 'PostToolUse', reason: 'order' }]);
});

it('consent is one entry of ours — nothing of ours is no consent', () => {
  assert.strictEqual(H.consented({}, ROOT), false);
  assert.strictEqual(H.consented({ hooks: { SessionStart: [FOREIGN_HOOK] } }, ROOT), false);
  assert.strictEqual(H.consented(H.plan({}, ROOT, {}).settings, ROOT), true);
  const one = { hooks: { Notification: [H.entries(ROOT).Notification] } };
  assert.strictEqual(H.consented(one, ROOT), true, 'a single entry of ours is the consent');
  assert.strictEqual(H.consented(null, ROOT), false);
});

// --- the update path: refresh what is there, keep what the operator added (fix round) ---
//
// `update` is unattended. It re-applies OUR entries where they still are and nothing else:
// a field the operator added to one of them survives (#7), an entry the operator removed by
// hand stays removed (risk c), and a status line somebody else holds is left byte-identical
// without blocking the hook events (risk d). `hooks install` keeps its own semantics.

it('whyDiffers names the first differing field, and `order` only for position or duplicates (#7)', () => {
  const fresh = H.plan({}, ROOT, {}).settings;
  const timed = JSON.parse(JSON.stringify(fresh));
  timed.hooks.UserPromptSubmit[0].hooks[0].timeout = 5;
  assert.deepStrictEqual(H.plan(timed, ROOT, {}).reasons, [{ event: 'UserPromptSubmit', reason: 'timeout' }],
    'install drops an added field and must say which one, not `order`');
  const asyncFlip = JSON.parse(JSON.stringify(fresh));
  asyncFlip.hooks.SessionStart[0].hooks[0].async = true;
  assert.deepStrictEqual(H.plan(asyncFlip, ROOT, {}).reasons, [{ event: 'SessionStart', reason: 'async' }]);
  const padded = JSON.parse(JSON.stringify(fresh));
  padded.statusLine.padding = 0;
  assert.deepStrictEqual(H.plan(padded, ROOT, {}).reasons, [{ event: 'statusLine', reason: 'padding' }]);
  const slMoved = JSON.parse(JSON.stringify(fresh));
  slMoved.statusLine.command = `node "${ROOT}/hooks/old-statusline.js"`;
  assert.deepStrictEqual(H.plan(slMoved, ROOT, {}).reasons, [{ event: 'statusLine', reason: 'command' }]);
});

it('refreshOnly keeps fields the operator added to our entries and reports no change for them (#7)', () => {
  const fresh = H.plan({}, ROOT, {}).settings;
  const s = JSON.parse(JSON.stringify(fresh));
  s.hooks.UserPromptSubmit[0].hooks[0].timeout = 5;
  s.statusLine.padding = 0;
  const same = H.plan(s, ROOT, { refreshOnly: true });
  assert.deepStrictEqual(same.changed, [], `refresh rewrote current entries: ${JSON.stringify(same.reasons)}`);
  assert.deepStrictEqual(same.settings, s);
  // with a stale matcher beside them: the matcher is fixed, the added fields survive
  s.hooks.PreToolUse[0].matcher = 'Edit|Write';
  s.hooks.PreToolUse[0].hooks[0].timeout = 9;
  const r = H.plan(s, ROOT, { refreshOnly: true });
  assert.deepStrictEqual(r.reasons, [{ event: 'PreToolUse', reason: 'matcher' }]);
  assert.strictEqual(r.settings.hooks.PreToolUse[0].matcher, fresh.hooks.PreToolUse[0].matcher);
  assert.strictEqual(r.settings.hooks.PreToolUse[0].hooks[0].timeout, 9, 'the operator\'s timeout was dropped');
  assert.strictEqual(r.settings.hooks.UserPromptSubmit[0].hooks[0].timeout, 5);
  assert.strictEqual(r.settings.statusLine.padding, 0);
  // a known field we own is re-asserted, and the reason names it
  const flipped = JSON.parse(JSON.stringify(fresh));
  flipped.hooks.Notification[0].hooks[0].async = true;
  const f = H.plan(flipped, ROOT, { refreshOnly: true });
  assert.deepStrictEqual(f.reasons, [{ event: 'Notification', reason: 'async' }]);
  assert.strictEqual(f.settings.hooks.Notification[0].hooks[0].async, false);
});

it('refreshOnly never re-adds an entry the operator removed (risk c)', () => {
  const s = JSON.parse(JSON.stringify(H.plan({}, ROOT, {}).settings));
  delete s.statusLine;
  delete s.hooks.Notification;
  const r = H.plan(s, ROOT, { refreshOnly: true });
  assert.deepStrictEqual(r.changed, []);
  assert.ok(!('statusLine' in r.settings) && !('Notification' in r.settings.hooks),
    'an entry removed by hand came back');
  assert.ok(r.skipped.some((x) => x.event === 'statusLine') && r.skipped.some((x) => x.event === 'Notification'),
    `the skipped entries were not reported: ${JSON.stringify(r.skipped)}`);
  // `hooks install` still adds them — that is the explicit act
  assert.ok(H.plan(s, ROOT, {}).changed.includes('statusLine (added)'));
});

it('refreshOnly leaves a foreign status line byte-identical and does not block the events (risk d)', () => {
  const s = JSON.parse(JSON.stringify(H.plan({}, ROOT, {}).settings));
  s.statusLine = { type: 'command', command: 'other-tool statusline', padding: 2 };
  s.hooks.PreToolUse[0].matcher = 'Edit|Write';
  const r = H.plan(s, ROOT, { refreshOnly: true });
  assert.deepStrictEqual(r.conflicts, [], 'a key the update never writes was reported as a conflict');
  assert.deepStrictEqual(r.settings.statusLine, s.statusLine);
  assert.deepStrictEqual(r.reasons, [{ event: 'PreToolUse', reason: 'matcher' }]);
  assert.ok(r.skipped.some((x) => x.event === 'statusLine' && /other-tool/.test(x.why)));
  // install still sees the conflict
  assert.strictEqual(H.plan(s, ROOT, {}).conflicts.length, 1);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
