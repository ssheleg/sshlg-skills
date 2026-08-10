#!/usr/bin/env node
'use strict';
// Fixtures for lib/drift.js — telling the operator their text has diverged
// from the packaged one.
//
// The behaviour this covers exists because of the behaviour beside it.
// `authored` makes the operator's wording win on every run, which is right:
// the block is written into a file they own and did not write. The cost is
// that a router reworded in a later release never reaches a machine that has
// authored text, and nothing anywhere says so — the pack goes on shipping
// doctrine that silently stops at the config file.
//
// So drift is REPORTED and never applied. The operator's word still wins;
// what stops winning is silence.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const D = require('../lib/drift.js');
const C = require('../lib/config.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function tmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-drift-'));
}

it('no authored text means nothing to report', () => {
  const out = D.diverged({ packaged: { 'super-ux': 'A', 'make-skill': 'B' }, authored: {} });
  assert.deepStrictEqual(out, []);
});

it('authored text identical to the packaged one is not drift', () => {
  const out = D.diverged({
    packaged: { 'super-ux': 'same bytes' },
    authored: { 'super-ux': 'same bytes' },
  });
  assert.deepStrictEqual(out, []);
});

it('authored text that differs is reported with both bodies', () => {
  const out = D.diverged({
    packaged: { 'task-pipeline': 'new wording' },
    authored: { 'task-pipeline': 'old wording' },
  });
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].name, 'task-pipeline');
  assert.strictEqual(out[0].authored, 'old wording');
  assert.strictEqual(out[0].packaged, 'new wording');
});

it('a router out of scope is never reported — there is no section to diverge from', () => {
  // The operator may carry authored text for a member they have since
  // uninstalled. Reporting it would demand a decision about a section that is
  // not in the file.
  const out = D.diverged({
    packaged: { 'super-ux': 'A' },
    authored: { 'super-ux': 'A', 'agent-sync': 'text for a member not installed' },
  });
  assert.deepStrictEqual(out, []);
});

it('a trailing-newline difference alone is not drift', () => {
  // The block writer settles trailing whitespace. If that counted, every
  // machine would carry a permanent drift row it could never clear, and the
  // report would be trained into noise within one release.
  const out = D.diverged({
    packaged: { 'seo-llmo': 'body text\n' },
    authored: { 'seo-llmo': 'body text' },
  });
  assert.deepStrictEqual(out, []);
});

it('a difference inside the body is drift even when the edges match', () => {
  const out = D.diverged({
    packaged: { 'seo-llmo': 'first line\nSECOND line\n' },
    authored: { 'seo-llmo': 'first line\nsecond line\n' },
  });
  assert.strictEqual(out.length, 1);
});

it('reports follow the packaged order, not the order authored was written in', () => {
  // Packaged order is registry order, which is the order the block renders and
  // the order the README table prints. A report in config-file order would
  // read as a third ordering of the same eight things.
  const out = D.diverged({
    packaged: { 'super-ux': '1', 'sheleg-design': '2', 'copywriting': '3' },
    authored: { copywriting: 'x', 'super-ux': 'y', 'sheleg-design': 'z' },
  });
  assert.deepStrictEqual(out.map((e) => e.name), ['super-ux', 'sheleg-design', 'copywriting']);
});

// Comments are stripped before the scan, and that is not a detail. The first
// version of this check grepped the whole file and failed against the doc
// comment that EXPLAINS the rule — a guard firing on its own prose. This
// repository has recorded the substring-grep failure twice already
// (docs/superpowers/retro.md, 2026-08-06 and its addendum); a check that reads
// code has to be given code.
function codeOf(file) {
  return fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

it('diverged touches no filesystem — it is given both sides', () => {
  const src = codeOf(path.join(__dirname, '..', 'lib', 'drift.js'));
  assert.ok(!/require\(\s*['"]fs['"]\s*\)/.test(src), 'lib/drift.js must not require fs');
});

it('the no-filesystem guard reads code, not the comment that describes it', () => {
  // Planted, not asserted: the guard above is only evidence if it can fail.
  // A file whose ONLY mention of the module is in prose must pass, and one
  // that actually requires it must not.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-drift-guard-'));
  const prose = path.join(dir, 'prose.js');
  const real = path.join(dir, 'real.js');
  fs.writeFileSync(prose, "/** a fixture asserts the absence of require('fs') here */\nmodule.exports = {};\n");
  fs.writeFileSync(real, "const fs = require('fs');\nmodule.exports = { fs };\n");
  const hit = (f) => /require\(\s*['"]fs['"]\s*\)/.test(codeOf(f));
  assert.strictEqual(hit(prose), false, 'the guard still fires on prose');
  assert.strictEqual(hit(real), true, 'the guard no longer catches a real require');
});

it('authoredClear removes the key and hands back the bytes it removed', () => {
  const home = tmpHome();
  const body = '**Правило.**\n\nМногострочное тело\nс *разметкой* и «кавычками».';
  C.authoredSet(home, 'task-pipeline', body);
  const removed = C.authoredClear(home, 'task-pipeline');
  assert.strictEqual(removed, body);
  assert.strictEqual(C.authoredGet(C.readConfig(home), 'task-pipeline'), undefined);
});

it('authoredClear leaves every other authored router alone', () => {
  const home = tmpHome();
  C.authoredSet(home, 'super-ux', 'mine A');
  C.authoredSet(home, 'copywriting', 'mine B');
  C.authoredClear(home, 'super-ux');
  const cfg = C.readConfig(home);
  assert.strictEqual(C.authoredGet(cfg, 'super-ux'), undefined);
  assert.strictEqual(C.authoredGet(cfg, 'copywriting'), 'mine B');
});

it('clearing a router that was never authored is not an error and returns undefined', () => {
  const home = tmpHome();
  assert.strictEqual(C.authoredClear(home, 'never-authored'), undefined);
});

it('adopting stashes the operator wording under its own key, byte for byte', () => {
  // The stash already holds what a switch took out, keyed by router name.
  // Adoption is a different act and must not collide with it: switching the
  // router off and on again has to give back the wording the SWITCH removed,
  // not the wording adoption replaced. Hence a distinct key, the way
  // `superseded:` entries already live in the same file.
  const home = tmpHome();
  const body = 'my own words\nover two lines\n';
  C.authoredSet(home, 'task-pipeline', body);
  const removed = C.authoredClear(home, 'task-pipeline');
  C.stashSet(home, D.stashKey('task-pipeline'), removed);
  assert.strictEqual(D.stashKey('task-pipeline'), 'adopted:task-pipeline');
  assert.strictEqual(C.stashGet(C.readConfig(home), 'adopted:task-pipeline'), body);
  assert.strictEqual(C.stashGet(C.readConfig(home), 'task-pipeline'), undefined);
});

// ---------------------------------------------------------------------------
// The same feature as a COMMAND.
//
// The pure half above is the half that is easy to test, and this repository's
// standing instruction #2 exists because that is exactly how a green suite sat
// under a command whose second run destroyed a file. So the flags are run,
// with HOME pointed at a temp directory, and what is asserted is the exit code
// the shell gets and the bytes left in the config.

const { spawnSync } = require('child_process');
const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');

function run(home, args) {
  const r = spawnSync(process.execPath, [BIN].concat(args), {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { HOME: home }),
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const MINE = 'мой собственный текст роутера\nв две строки';

it('`routers --diff <name>` prints both sides and exits 0', () => {
  const home = tmpHome();
  C.authoredSet(home, 'task-pipeline', MINE);
  const r = run(home, ['routers', '--diff', 'task-pipeline']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(r.out.includes(MINE), 'the operator side is missing\n' + r.out);
  assert.ok(r.out.includes('пакетный текст'), 'the packaged side is missing\n' + r.out);
});

it('`routers --diff` on a router that matches says so and exits 0', () => {
  const home = tmpHome();
  const r = run(home, ['routers', '--diff', 'make-skill']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(/совпадают|пакетным текстом/.test(r.out), r.out);
});

it('a name that is not a router exits 2, the same code as config set', () => {
  const home = tmpHome();
  assert.strictEqual(run(home, ['routers', '--diff', 'nope']).code, 2);
  assert.strictEqual(run(home, ['routers', '--adopt', 'nope']).code, 2);
});

it('a flag given no value exits 2 rather than swallowing the next token', () => {
  const home = tmpHome();
  assert.strictEqual(run(home, ['routers', '--diff']).code, 2);
  assert.strictEqual(run(home, ['routers', '--adopt']).code, 2);
});

it('--diff and --adopt together are refused', () => {
  const home = tmpHome();
  const r = run(home, ['routers', '--diff', 'task-pipeline', '--adopt', 'task-pipeline']);
  assert.strictEqual(r.code, 2, r.out);
});

it('--adopt clears the authored entry and parks it under adopted:<name>', () => {
  const home = tmpHome();
  C.authoredSet(home, 'task-pipeline', MINE);
  const r = run(home, ['routers', '--update', '--adopt', 'task-pipeline']);
  assert.strictEqual(r.code, 0, r.out);
  const cfg = C.readConfig(home);
  assert.strictEqual(C.authoredGet(cfg, 'task-pipeline'), undefined, 'authored survived adoption');
  assert.strictEqual(C.stashGet(cfg, 'adopted:task-pipeline'), MINE, 'the replaced wording was not parked');
});

it('--adopt leaves every other authored router untouched', () => {
  const home = tmpHome();
  C.authoredSet(home, 'task-pipeline', MINE);
  C.authoredSet(home, 'copywriting', 'моя копия copywriting');
  run(home, ['routers', '--update', '--adopt', 'task-pipeline']);
  assert.strictEqual(C.authoredGet(C.readConfig(home), 'copywriting'), 'моя копия copywriting');
});

it('--dry-run --adopt changes nothing on disk', () => {
  const home = tmpHome();
  C.authoredSet(home, 'task-pipeline', MINE);
  const before = fs.readFileSync(C.configPath(home), 'utf8');
  const r = run(home, ['routers', '--dry-run', '--adopt', 'task-pipeline']);
  assert.strictEqual(r.code, 0, r.out);
  assert.strictEqual(fs.readFileSync(C.configPath(home), 'utf8'), before, 'a preview wrote to the config');
});

it('--dry-run --adopt does not announce an adoption that would not happen', () => {
  // The preview's job is to answer "what would I get". Reporting an adoption
  // for a router with no authored entry answers a different question, and this
  // repository has already shipped a preview that under-reported its own
  // removals (retro, 2026-08-06, defect 3).
  const home = tmpHome();
  const r = run(home, ['routers', '--dry-run', '--adopt', 'task-pipeline']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(!/принят пакетный текст/.test(r.out), 'announced an adoption with nothing to adopt\n' + r.out);
  assert.ok(/принимать нечего/.test(r.out), r.out);
});

it('adopting twice is not an error and does not overwrite the parked wording', () => {
  // The second run has nothing left to adopt. If it stashed again it would
  // park the packaged text over the operator's, and the one copy of their
  // words would be gone.
  const home = tmpHome();
  C.authoredSet(home, 'task-pipeline', MINE);
  run(home, ['routers', '--update', '--adopt', 'task-pipeline']);
  const r = run(home, ['routers', '--update', '--adopt', 'task-pipeline']);
  assert.strictEqual(r.code, 0, r.out);
  assert.strictEqual(C.stashGet(C.readConfig(home), 'adopted:task-pipeline'), MINE);
});

it('adoption never overwrites wording already parked under its key', () => {
  // The sharp edge: `adopted:<name>` is the ONLY surviving copy of what the
  // operator wrote. If an authored entry reappears by any route — the
  // over-recording defect above did exactly that, refilling it with the
  // packaged text — a second adoption would park that over the original and
  // the real wording would be gone with nothing to restore it from.
  const home = tmpHome();
  const original = 'настоящая формулировка оператора';
  C.authoredSet(home, 'task-pipeline', original);
  run(home, ['routers', '--update', '--adopt', 'task-pipeline']);
  assert.strictEqual(C.stashGet(C.readConfig(home), 'adopted:task-pipeline'), original);

  C.authoredSet(home, 'task-pipeline', 'что-то, что записалось сюда позже');
  run(home, ['routers', '--update', '--adopt', 'task-pipeline']);
  assert.strictEqual(
    C.stashGet(C.readConfig(home), 'adopted:task-pipeline'),
    original,
    'the only copy of the operator wording was overwritten by a later adoption'
  );
});

it('a router the operator never wrote is not recorded as theirs', () => {
  // The defect this catches froze every router on every machine. `migrate()`
  // returns `Object.assign({}, fallbacks, extracted)` — the packaged bodies
  // merged with the migrated ones — because its job is to supply a body for
  // each section. The command read that whole map as "what the operator just
  // wrote", so one run recorded all eight as authored, and from then on the
  // pack could never update any router's wording anywhere. `--adopt` could not
  // work either: it cleared the entry and the same run put it straight back.
  const home = tmpHome();
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), '');
  run(home, ['routers', '--update']);
  assert.deepStrictEqual(
    Object.keys(C.readConfig(home).authored || {}),
    [],
    'a machine with no hand-written rule recorded routers as the operator\'s'
  );
});

it('a rule the operator DID write by hand is still recorded as theirs', () => {
  // The other half of the same boundary. Weakening the over-recording must not
  // weaken the property it was standing in for: a hand-written heading outside
  // the block is migrated in and must survive every later run.
  const home = tmpHome();
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(home, '.claude', 'CLAUDE.md'),
    '# Rules\n\n## Роутинг работы\n\nмоё правило про конвейер, дословно\n'
  );
  run(home, ['routers', '--update']);
  const authored = C.readConfig(home).authored || {};
  assert.deepStrictEqual(Object.keys(authored), ['task-pipeline'], JSON.stringify(authored));
  assert.ok(
    authored['task-pipeline'].includes('моё правило про конвейер, дословно'),
    'the operator wording was not the thing recorded'
  );
});

it('the drift report names a diverging router and stays quiet when none diverge', () => {
  const home = tmpHome();
  const quiet = run(home, ['routers', '--update']);
  assert.ok(!/расходится/.test(quiet.out), 'reported drift with no authored text\n' + quiet.out);
  C.authoredSet(home, 'task-pipeline', MINE);
  const loud = run(home, ['routers', '--update']);
  assert.ok(/расходится/.test(loud.out), 'authored text diverged and nothing said so\n' + loud.out);
  assert.ok(/task-pipeline/.test(loud.out), loud.out);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
