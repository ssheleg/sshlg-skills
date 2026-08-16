#!/usr/bin/env node
'use strict';
// Fixtures for lib/apply.js — the only module allowed to write to a file the
// operator owns and did not write.
//
// It had no suite of its own until 2026-08-16, and both blockers found by that
// day's audit lived in the gap. One deleted seven of nine router blocks from a
// live `~/.cursor/rules/sshlg-routing.mdc`; the other rewrote a scratch
// `~/.claude/CLAUDE.md` to three lines with no copy on disk while printing that
// the file had not changed. Neither was catchable by a pure-core fixture,
// because neither was in the pure core: `applyCursor` read a constant instead
// of the disk, and `bin/sshlg-skills.js` grew a second write path.
//
// So the two rules this file exists for:
//   1. a write into the operator's file that upserts must upsert into what is
//      THERE, never into a template;
//   2. every such write is preceded by a backup, and a copy that cannot be
//      taken cancels the write — asserted by making the backup directory
//      unwritable and reading the file back byte for byte.
//
// Every fixture points HOME at a temp directory. One that could reach the real
// ~/.claude would be a fixture that edits the machine it runs on.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const apply = require('../lib/apply.js');
const cursor = require('../lib/cursor.js');
const R = require('../lib/routers.js');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function tmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-apply-'));
}

function seededHome() {
  const home = tmpHome();
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(home, '.cursor', 'rules'), { recursive: true });
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  fs.writeFileSync(
    path.join(home, '.sshlg-skills', 'state.json'),
    JSON.stringify({ routers: 'yes' }) + '\n'
  );
  return home;
}

function run(home, args) {
  const r = spawnSync(process.execPath, [BIN].concat(args), {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { HOME: home }),
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// Make the backup directory refuse a write, the way a full disk or a wrong
// owner would. The directory has to EXIST and be unwritable: a missing one is
// simply created, which is not the failure being modelled.
function jamBackups(home) {
  const dir = path.join(home, '.sshlg-skills', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  fs.chmodSync(dir, 0o500);
  return dir;
}
function unjam(dir) {
  try { fs.chmodSync(dir, 0o700); } catch (e) { /* the temp dir is going away anyway */ }
}

const ROUTERS = { 'task-pipeline': 'Пакетный текст роутера task-pipeline.' };

// The map table is rendered per member and every row needs a role — the column
// the map exists for. Shaped like skills.json's entries, not like its contents:
// a fixture that read the manifest would go red on the next member added.
const MEMBERS = [
  { name: 'task-pipeline', entry: '/task-pipeline', role: 'how a change reaches the repository' },
  { name: 'super-ux', entry: '/ux', role: 'what the interface must do' },
  { name: 'make-skill', entry: '/skill-audit', role: 'how the skill itself is built' },
];

// ---------------------------------------------------------------------------
// protect() — the mechanism, and its one refusal
// ---------------------------------------------------------------------------

it('protect refuses without a home rather than choosing a quieter place', () => {
  const r = apply.protect('/tmp/whatever.md', {});
  assert.strictEqual(r.action, 'backup-failed', JSON.stringify(r));
  assert.ok(/no home/.test(r.error), r.error);
});

it('protect reports backup-failed when the copy cannot be written', () => {
  const home = seededHome();
  const file = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(file, '# mine\n');
  const dir = jamBackups(home);
  const r = apply.protect(file, { home });
  unjam(dir);
  assert.strictEqual(r.action, 'backup-failed', JSON.stringify(r));
});

// ---------------------------------------------------------------------------
// applyOne — a failed copy cancels the write
// ---------------------------------------------------------------------------

it('applyOne writes nothing when the backup fails, and says so', () => {
  const home = seededHome();
  const file = path.join(home, '.claude', 'CLAUDE.md');
  const before = '# Мои правила\n\n' + apply.EMPTY_BLOCK;
  fs.writeFileSync(file, before);

  const dir = jamBackups(home);
  const rec = apply.applyOne(file, ROUTERS, { home, mode: 'update', consent: 'yes' });
  unjam(dir);

  assert.strictEqual(rec.action, 'backup-failed', JSON.stringify(rec));
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before, 'the file was written anyway');
});

// ---------------------------------------------------------------------------
// The Cursor blocker — a member-scoped run must not delete the family
// ---------------------------------------------------------------------------

it('bodyOf is the inverse of renderRule', () => {
  const body = '## Heading\n\n| a | b |\n|---|---|\n| 1 | 2 |';
  // renderRule settles the trailing newline; bodyOf gives back everything else.
  assert.strictEqual(cursor.bodyOf(cursor.renderRule(body)).replace(/\s+$/, ''), body);
});

it('bodyOf returns a file with no front-matter whole', () => {
  assert.strictEqual(cursor.bodyOf('no front matter here'), 'no front matter here');
  assert.strictEqual(cursor.bodyOf(''), '');
  assert.strictEqual(cursor.bodyOf(null), '');
});

it('applyCursor with --member scope keeps every other member’s router', () => {
  // The regression, in the shape it actually happened: a file holding the whole
  // family, refreshed by a run that speaks for one member only.
  const home = seededHome();
  const file = path.join(home, '.cursor', 'rules', cursor.FILENAME);

  const full = R.upsert(apply.EMPTY_BLOCK,
    { 'task-pipeline': 'TP body.', 'super-ux': 'UX body.', 'make-skill': 'MS body.' },
    { members: MEMBERS });
  fs.writeFileSync(file, cursor.renderRule(full.text));
  const beforeNames = (fs.readFileSync(file, 'utf8').match(/SSHLG:ROUTER:[a-z-]+:BEGIN/g) || []);
  assert.strictEqual(beforeNames.length, 3, beforeNames.join(','));

  // `members: []` is exactly what bin/sshlg-skills.js passes under --member.
  apply.applyCursor({ home, mode: 'update', consent: 'yes', routers: { 'super-ux': 'UX body, refreshed.' }, members: [] });

  const after = fs.readFileSync(file, 'utf8');
  const afterNames = (after.match(/SSHLG:ROUTER:[a-z-]+:BEGIN/g) || []);
  assert.strictEqual(afterNames.length, 3,
    'a --member run dropped a foreign router block: ' + afterNames.join(','));
  assert.ok(after.includes('TP body.'), 'task-pipeline’s body was deleted');
  assert.ok(after.includes('MS body.'), 'make-skill’s body was deleted');
  assert.ok(after.includes('UX body, refreshed.'), 'the member’s own router was not refreshed');
});

it('applyCursor still creates the file from the template when there is none', () => {
  const home = seededHome();
  const file = path.join(home, '.cursor', 'rules', cursor.FILENAME);
  const rec = apply.applyCursor({ home, mode: 'install', consent: 'yes', routers: ROUTERS, members: MEMBERS.slice(0, 1) });
  assert.strictEqual(rec.action, 'created', JSON.stringify(rec));
  assert.ok(fs.readFileSync(file, 'utf8').includes('Пакетный текст роутера task-pipeline.'));
});

it('applyCursor reports what left the block, so the caller can park it', () => {
  const home = seededHome();
  const file = path.join(home, '.cursor', 'rules', cursor.FILENAME);
  const full = R.upsert(apply.EMPTY_BLOCK,
    { 'task-pipeline': 'TP body.', 'super-ux': 'UX body.' },
    { members: MEMBERS.slice(0, 2) });
  fs.writeFileSync(file, cursor.renderRule(full.text));

  const rec = apply.applyCursor({
    home, mode: 'update', consent: 'yes',
    routers: { 'task-pipeline': 'TP body.', 'super-ux': 'UX body.' },
    members: MEMBERS.slice(0, 2),
    remove: ['super-ux'],
  });
  assert.ok(rec.removed && rec.removed['super-ux'],
    'a section removed from the Cursor rule was not reported: ' + JSON.stringify(rec.removed));
  assert.ok(rec.removed['super-ux'].includes('UX body.'), rec.removed['super-ux']);
});

it('applyCursor writes nothing when the backup fails', () => {
  const home = seededHome();
  const file = path.join(home, '.cursor', 'rules', cursor.FILENAME);
  const full = R.upsert(apply.EMPTY_BLOCK, { 'task-pipeline': 'TP body.' }, { members: MEMBERS.slice(0, 1) });
  const before = cursor.renderRule(full.text);
  fs.writeFileSync(file, before);

  const dir = jamBackups(home);
  const rec = apply.applyCursor({ home, mode: 'update', consent: 'yes', routers: { 'task-pipeline': 'TP body, changed.' }, members: MEMBERS.slice(0, 1) });
  unjam(dir);

  assert.strictEqual(rec.action, 'backup-failed', JSON.stringify(rec));
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before, 'the rule file was written anyway');
});

it('a file at our name that is not ours is left alone', () => {
  const home = seededHome();
  const file = path.join(home, '.cursor', 'rules', cursor.FILENAME);
  const foreign = '---\ndescription: someone else\n---\n\nnot ours\n';
  fs.writeFileSync(file, foreign);
  const rec = apply.applyCursor({ home, mode: 'update', consent: 'yes', routers: ROUTERS, members: [] });
  assert.strictEqual(rec.action, 'foreign-file', JSON.stringify(rec));
  assert.strictEqual(fs.readFileSync(file, 'utf8'), foreign);
});

// ---------------------------------------------------------------------------
// The migration blocker — asserted at the layer that repeats, as the house rule
// requires: the real command, run as a process, against a real file.
// ---------------------------------------------------------------------------

const HANDWRITTEN = [
  '## Роутинг работы — по умолчанию через task-pipeline',
  '',
  '**Моя формулировка, а не упакованная.**',
].join('\n');

it('`routers` leaves the operator’s file untouched when the backup fails', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  const before = '# Мои правила\n\n' + HANDWRITTEN + '\n\nПроза снизу.\n';
  fs.writeFileSync(md, before);

  const dir = jamBackups(home);
  const r = run(home, ['routers']);
  unjam(dir);

  const after = fs.readFileSync(md, 'utf8');
  assert.strictEqual(after, before,
    'the file changed while the backup failed — ' + r.out);
  assert.ok(/резервную копию/.test(r.out),
    'the run did not say why it wrote nothing: ' + r.out);
});

it('a refused write names a next step rather than only a refusal', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, '# Мои правила\n\n' + HANDWRITTEN + '\n');
  const dir = jamBackups(home);
  const r = run(home, ['routers']);
  unjam(dir);
  assert.ok(/backups/.test(r.out), 'no remedy named: ' + r.out);
});

it('with a working backup directory the migration happens and is idempotent', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, '# Мои правила\n\n' + HANDWRITTEN + '\n');

  run(home, ['routers']);
  const first = fs.readFileSync(md, 'utf8');
  assert.ok(first.includes('Моя формулировка, а не упакованная.'), 'run 1 did not migrate');
  run(home, ['routers']);
  const second = fs.readFileSync(md, 'utf8');
  assert.strictEqual(second, first, 'the second run was not idempotent');
  run(home, ['routers']);
  assert.strictEqual(fs.readFileSync(md, 'utf8'), first, 'the third run drifted');
});

it('the backup that protects the migration is actually on disk afterwards', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  const before = '# Мои правила\n\n' + HANDWRITTEN + '\n';
  fs.writeFileSync(md, before);
  run(home, ['routers']);
  const dir = path.join(home, '.sshlg-skills', 'backups');
  const copies = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.indexOf('CLAUDE.md') !== -1) : [];
  assert.ok(copies.length > 0, 'no copy of CLAUDE.md was taken before it was rewritten');
  const restorable = copies.some((n) => fs.readFileSync(path.join(dir, n), 'utf8') === before);
  assert.ok(restorable, 'a copy exists but none of them is the text that was replaced');
});

// ---------------------------------------------------------------------------
// The invariant itself: one write path
// ---------------------------------------------------------------------------

it('every write to a protected file goes through protect()', () => {
  // Cheap structural guard for the rule the two blockers broke. Each
  // `writeFileSync` in the two modules that touch the operator's files must
  // have a `protect(` within the preceding few lines.
  for (const rel of ['lib/apply.js', 'bin/sshlg-skills.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8').split('\n');
    src.forEach((line, i) => {
      if (!/fs\.writeFileSync\(/.test(line)) return;
      // Writes to the launcher's own state are not the operator's files.
      if (/sshlg-skills|state\.json|config\.json|settings\.json|\.json'/.test(line)) return;
      const window = src.slice(Math.max(0, i - 14), i).join('\n');
      assert.ok(/protect\(|saved\.action|OPTOUT/.test(window),
        `${rel}:${i + 1} writes without a protect() above it — ${line.trim()}`);
    });
  }
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
