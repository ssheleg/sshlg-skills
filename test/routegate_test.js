#!/usr/bin/env node
'use strict';
// Fixtures for lib/routegate.js and lib/turnstate.js — the routing escalation.
//
// Every check here is a way this feature becomes the thing operators disable.
// A prompt on every tool call, a prompt for a typo, a prompt while the route is
// already being taken, a prompt after someone said no — each one is a separate
// fixture, because each one is a separate way to be wrong.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const R = require('../lib/routegate.js');
const S = require('../lib/turnstate.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const LINES = { 'task-pipeline': 'changes the repository → `/task-pipeline` owns the route' };
const edit = (over) => Object.assign(
  { tool_name: 'Edit', prompt_id: 'p1', tool_input: { file_path: '/repo/src.js' } }, over || {});
const asked = { promptId: 'p1', routes: ['task-pipeline'], optedOut: false, asked: false };

it('bypassPermissions is the operator\'s answer — no escalation inside it (#124)', () => {
  const v = R.decide(edit({ permission_mode: 'bypassPermissions' }), asked,
    { runOpen: false, lines: LINES });
  assert.strictEqual(v, null, 'the gate asked inside a mode whose one guarantee is no prompts');
});

it('a write landing outside the project changes no repository (#124)', () => {
  for (const target of ['/private/tmp/claude-501/sess/scratchpad/ga_admin.py',
    '../sibling/file.js', '/etc/hosts']) {
    const v = R.decide(edit({ cwd: '/repo', tool_input: { file_path: target } }), asked,
      { runOpen: false, lines: LINES });
    assert.strictEqual(v, null, `gated a write to ${target}, which is outside /repo`);
  }
});

it('a write INSIDE the project still escalates, relative or absolute (#124)', () => {
  for (const target of ['src/app.js', '/repo/src/app.js']) {
    const v = R.decide(edit({ cwd: '/repo', tool_input: { file_path: target } }), asked,
      { runOpen: false, lines: LINES });
    assert.ok(v, `stayed silent for ${target}, which is inside /repo`);
  }
});

it('a notebook write outside the project is judged by the same rule (#124)', () => {
  const v = R.decide(edit({ cwd: '/repo', tool_name: 'NotebookEdit',
    tool_input: { notebook_path: '/tmp/nb.ipynb' } }), asked,
    { runOpen: false, lines: LINES });
  assert.strictEqual(v, null);
});

it('a prompt that asked for a route escalates once', () => {
  const v = R.decide(edit(), asked, { runOpen: false, lines: LINES });
  assert.ok(v, 'the un-routed path was not escalated at all');
  assert.match(v.reason, /task-pipeline/);
});

it('the prompt names the refusal phrase, or it teaches nothing', () => {
  const v = R.decide(edit(), asked, { runOpen: false, lines: LINES });
  assert.match(v.reason, /без пайплайна/, 'no way out was offered');
  assert.match(v.reason, /rest of the session/, 'the opt-out\'s scope is not stated');
});

it('the second call of the same turn is silent', () => {
  assert.strictEqual(
    R.decide(edit(), Object.assign({}, asked, { asked: true }), { runOpen: false, lines: LINES }),
    null, 'a turn that edits forty files would ask forty times');
});

it('a run already open is silent — the route was taken', () => {
  assert.strictEqual(R.decide(edit(), asked, { runOpen: true, lines: LINES }), null,
    'the pipeline would interrupt itself');
});

it('an opted-out session is silent', () => {
  assert.strictEqual(
    R.decide(edit(), Object.assign({}, asked, { optedOut: true }), { runOpen: false, lines: LINES }),
    null);
});

it('a prompt with no route is silent', () => {
  assert.strictEqual(
    R.decide(edit(), Object.assign({}, asked, { routes: [] }), { runOpen: false, lines: LINES }),
    null, 'an unclassified prompt was escalated — that is a prompt on every edit');
});

it('a classification from an EARLIER turn does not escalate this one', () => {
  assert.strictEqual(
    R.decide(edit({ prompt_id: 'p2' }), asked, { runOpen: false, lines: LINES }), null,
    'a stale record escalated a call nobody asked about');
});

it('Bash is not gated — that would be a prompt in front of the work', () => {
  assert.ok(!R.TOOLS.includes('Bash'),
    'gating shell commands puts a permission prompt in front of tests and logs');
  assert.strictEqual(
    R.decide(edit({ tool_name: 'Bash', tool_input: { command: 'npm test' } }), asked,
      { runOpen: false, lines: LINES }), null);
});

it('every write tool IS gated', () => {
  for (const t of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']) {
    assert.ok(R.decide(edit({ tool_name: t }), asked, { runOpen: false, lines: LINES }),
      `${t} changes the repository and was not escalated`);
  }
});

it('a missing state is silence, not a throw', () => {
  assert.strictEqual(R.decide(edit(), undefined, {}), null);
  assert.strictEqual(R.decide(undefined, asked, {}), null);
});

// --- the turn store ---------------------------------------------------------

const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'turnstate-'));

it('what one turn records, the next hook reads', () => {
  S.write(HOME, 'sess-1', { promptId: 'p1', routes: ['task-pipeline'] });
  assert.deepStrictEqual(S.read(HOME, 'sess-1').routes, ['task-pipeline']);
});

it('opting out is STICKY — a later turn cannot quietly un-decline it', () => {
  S.write(HOME, 'sess-2', { optedOut: true });
  S.write(HOME, 'sess-2', { optedOut: false, promptId: 'p9' });
  assert.strictEqual(S.read(HOME, 'sess-2').optedOut, true,
    'a session that declined was re-enrolled by the next prompt');
});

it('a session id cannot escape the directory', () => {
  const f = S.fileFor(HOME, '../../etc/passwd');
  assert.ok(f.startsWith(path.join(HOME, ...S.DIR)), `escaped: ${f}`);
  assert.ok(!f.includes('..'), f);
});

it('an unreadable or absent record reads as empty', () => {
  assert.deepStrictEqual(S.read(HOME, 'never-seen'), {});
  const f = S.fileFor(HOME, 'broken');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, 'not json');
  assert.deepStrictEqual(S.read(HOME, 'broken'), {});
});

it('old sessions are pruned, current ones are not', () => {
  S.write(HOME, 'stale', { routes: [] });
  const f = S.fileFor(HOME, 'stale');
  const old = Date.now() - 1000 * 60 * 60 * 24 * 30;
  fs.utimesSync(f, new Date(old), new Date(old));
  S.write(HOME, 'fresh', { routes: [] });
  const removed = S.prune(HOME, Date.now(), 1000 * 60 * 60 * 24 * 7);
  assert.ok(removed >= 1, 'nothing was pruned — this directory grows one file per session forever');
  assert.ok(!fs.existsSync(f), 'the stale record survived');
  assert.ok(fs.existsSync(S.fileFor(HOME, 'fresh')), 'a current session was pruned');
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
