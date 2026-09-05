#!/usr/bin/env node
'use strict';
// Fixtures for lib/materialised.js — the difference between a router obeyed from the
// tree and one skipped, and why the declaration is not the part that matters.
//
// The property under test is that a CLAIM IS RESOLVED, never believed. A project saying
// "this router's doctrine lives here" is a sentence; every path it names is opened and
// every `#marker` looked for, so an entry pointing at a file the doctrine has left
// reports FALSE. A document asserting a route was honoured when it was not is worse than
// the silence it replaced, which is the whole reason this module is allowed to exist.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const M = require('../lib/materialised.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const KNOWN = ['sheleg-design', 'copywriting', 'task-pipeline'];

/** A reader over an in-memory tree — the module never touches a disk of its own. */
function reader(files) {
  return (p) => (Object.prototype.hasOwnProperty.call(files, p) ? files[p] : null);
}

const TREE = {
  'src/globals.css': '[data-surface="workbench"] { --ink: #111; /* MEASURED */ }',
  'docs/brand/voice.md': '# Voice\n',
  'docs/brand/lint.py': 'lint\n',
};

/* -- the happy case, and it is the smaller half -------------------------- */

it('a declaration whose every path resolves is satisfied', () => {
  const rows = M.check({
    'sheleg-design': {
      materialised: ['src/globals.css#data-surface'],
      guards: ['docs/brand/lint.py'],
    },
  }, KNOWN, reader(TREE));
  assert.strictEqual(rows.length, 1);
  assert.ok(rows[0].satisfied, JSON.stringify(rows[0].problems));
  assert.deepStrictEqual(rows[0].guards, ['docs/brand/lint.py']);
});

/* -- the half that makes it worth building ------------------------------- */

it('a path that does not exist makes the declaration FALSE, not absent', () => {
  const rows = M.check({
    copywriting: { materialised: ['docs/brand/voice.md', 'docs/brand/facts.md'] },
  }, KNOWN, reader(TREE));
  assert.strictEqual(rows[0].satisfied, false);
  assert.ok(/facts\.md` does not exist/.test(rows[0].problems.join(' ')));
  // The resolved half is still reported: a partially true claim is more useful to fix
  // than a bare rejection.
  assert.deepStrictEqual(rows[0].resolved, ['docs/brand/voice.md']);
});

it('a file that survived the refactor but lost the doctrine is FALSE', () => {
  // This is the case a bare existence check cannot see, and the reason `#marker` exists:
  // the stylesheet is still there and everything the router put in it is gone.
  const gutted = Object.assign({}, TREE, { 'src/globals.css': '.button { color: red }' });
  const rows = M.check({
    'sheleg-design': { materialised: ['src/globals.css#data-surface'] },
  }, KNOWN, reader(gutted));
  assert.strictEqual(rows[0].satisfied, false);
  assert.ok(/exists but does not contain `data-surface`/.test(rows[0].problems.join(' ')),
    rows[0].problems.join(' '));
});

it('a missing guard is a problem, because the guard is what makes the claim checkable', () => {
  const rows = M.check({
    'sheleg-design': { materialised: ['src/globals.css'], guards: ['test/nope.py'] },
  }, KNOWN, reader(TREE));
  assert.strictEqual(rows[0].satisfied, false);
  assert.ok(/guard `test\/nope\.py` does not exist/.test(rows[0].problems.join(' ')));
});

it('a declaration naming no files is refused — a claim with nothing to read it from', () => {
  const rows = M.check({ copywriting: { guards: ['docs/brand/lint.py'] } }, KNOWN, reader(TREE));
  assert.strictEqual(rows[0].satisfied, false);
  assert.ok(/names no files/.test(rows[0].problems.join(' ')));
});

it('a router this family does not ship is a declaration about nothing', () => {
  const rows = M.check({ 'not-a-router': { materialised: ['src/globals.css'] } },
    KNOWN, reader(TREE));
  assert.strictEqual(rows[0].satisfied, false);
  assert.ok(/is not a router this family ships/.test(rows[0].problems.join(' ')));
});

/* -- shape and order ------------------------------------------------------ */

it('rows are sorted, so two runs over one tree agree', () => {
  const rows = M.check({
    'task-pipeline': { materialised: ['src/globals.css'] },
    copywriting: { materialised: ['docs/brand/voice.md'] },
  }, KNOWN, reader(TREE));
  assert.deepStrictEqual(rows.map((r) => r.router), ['copywriting', 'task-pipeline']);
});

it('a non-object declaration yields no rows rather than throwing', () => {
  for (const bad of [null, undefined, [], 'nope', 7]) {
    assert.deepStrictEqual(M.check(bad, KNOWN, reader(TREE)), [], JSON.stringify(bad));
  }
});

/* -- the report's own honesty --------------------------------------------- */

it('no declaration reads as "nothing is claimed", not as a pass', () => {
  const out = M.report([], { present: false });
  assert.ok(/nothing is claimed, which is the normal state/.test(out));
  assert.ok(/not invoked in this project is a router not invoked/.test(out),
    'the absent case must not imply the route was satisfied');
});

it('the report never claims the guards were run', () => {
  // Executing code out of somebody else's repository is a different act with a different
  // risk. Implying coverage the check does not have is the failure this line prevents.
  const out = M.report(M.check({
    'sheleg-design': { materialised: ['src/globals.css'], guards: ['docs/brand/lint.py'] },
  }, KNOWN, reader(TREE)), { present: true });
  assert.ok(/guards were NOT run/.test(out));
  assert.ok(/READABLE\s+here, not that it is obeyed/.test(out.replace(/\n\s*/g, ' ')),
    'the report claims more than it measured');
});

it('a FALSE row says why it is worse than no declaration at all', () => {
  const out = M.report(M.check({
    copywriting: { materialised: ['docs/brand/gone.md'] },
  }, KNOWN, reader(TREE)), { present: true });
  assert.ok(/worse than no declaration/.test(out));
  assert.ok(/1 satisfied|0 satisfied, 1 false/.test(out), out.slice(-200));
});

/* -- purity and the command's contract ------------------------------------ */

it('the module never reaches the filesystem — it is handed a reader', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'materialised.js'), 'utf8');
  const code = src.split('\n').filter((l) => !/^\s*\*/.test(l) && !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/require\(['"]fs['"]\)/.test(code), 'materialised.js requires fs');
  assert.ok(!/require\(['"]child_process['"]\)/.test(code), 'materialised.js spawns');
});

it('the command refuses a path that escapes the project root', () => {
  // A declaration is about THIS repository. `../../etc/passwd` resolving would make it
  // about something else, and the file it named would be read as evidence.
  const bin = fs.readFileSync(path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'utf8');
  const at = bin.indexOf('function cmdMaterialised(');
  assert.ok(at !== -1, 'cmdMaterialised is gone');
  const body = bin.slice(at, bin.indexOf('\nfunction ', at + 10));
  assert.ok(/startsWith\(root \+ path\.sep\)/.test(body),
    'the root containment check is missing, so a declaration can name any file on the machine');
});

it('the command never runs a guard', () => {
  const bin = fs.readFileSync(path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'utf8');
  const at = bin.indexOf('function cmdMaterialised(');
  const body = bin.slice(at, bin.indexOf('\nfunction ', at + 10));
  assert.ok(!/spawnSync|execSync|exec\(/.test(body),
    'cmdMaterialised executes something — running project code is a different act');
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
