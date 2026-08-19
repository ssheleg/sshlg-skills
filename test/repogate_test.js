#!/usr/bin/env node
'use strict';
// Fixtures for lib/repogate.js — this repository's own gate, decided.
//
// The commit detector has to survive the spellings people actually use to get
// around a gate (`--no-verify`, `-n`, `--amend`), and must not fire on the one
// spelling that genuinely does not commit (`--dry-run`).

const assert = require('assert');
const R = require('../lib/repogate.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

it('an ordinary commit is a commit', () => {
  assert.strictEqual(R.isCommit('git commit -m "x"'), true);
  assert.strictEqual(R.isCommit('git commit'), true);
});

it('the spellings that skip checks are still commits', () => {
  for (const cmd of ['git commit --no-verify -m x', 'git commit -n -m x',
                     'git commit --amend --no-edit', 'git add -A && git commit -m x']) {
    assert.strictEqual(R.isCommit(cmd), true, `slipped past the gate: ${cmd}`);
  }
});

it('--dry-run is the one that is not', () => {
  assert.strictEqual(R.isCommit('git commit --dry-run'), false);
});

it('the verb is read in what would RUN, not anywhere in the payload', () => {
  // UM-10. Both of these cost a diagnostic before they were fixed: the gate denied a
  // `node` invocation because its JSON argument contained the words, and then denied
  // the commit of the ledger row describing the bug. The treatment already existed
  // in lib/hygiene.js and is reused rather than reimplemented.
  assert.strictEqual(R.isCommit('# git commit -m x'), false, 'a comment is not an invocation');
  assert.strictEqual(R.isCommit('cat <<EOF > note.md\ngit commit -m x\nEOF'), false,
    'a heredoc body fed to cat is data, not a script');
  assert.strictEqual(R.isCommit('bash <<EOF\ngit commit -m x\nEOF'), true,
    'a heredoc body fed to bash IS a script — stripping every heredoc would be a bypass');
  assert.strictEqual(R.isCommit('bash -c "git commit -m x"'), true,
    'a quoted invocation is an invocation');
  assert.strictEqual(R.isCommit("sh -c 'git commit'"), true);
});

it('ownership is read from the command and the cwd, never from the index', () => {
  // UM-09 and UM-11. The directories are returned relative to the shell's cwd; '.'
  // means "wherever this ran", which the hook resolves against the payload.
  assert.deepStrictEqual(R.commitDirs('git commit -m x'), ['.']);
  assert.deepStrictEqual(R.commitDirs('git add -A && git commit -m x'), ['.']);
  assert.deepStrictEqual(R.commitDirs('git -C skills/super-ux commit -m x'), ['skills/super-ux']);
  assert.deepStrictEqual(R.commitDirs('cd skills/agent-sync && git commit -m x'), ['skills/agent-sync']);
  assert.deepStrictEqual(R.commitDirs('cd skills/agent-sync && git -C ../make-skill commit -m x'),
    ['skills/agent-sync/../make-skill']);
  assert.deepStrictEqual(R.commitDirs('cd /tmp/x && git commit -m a && git commit -m b'),
    ['/tmp/x', '/tmp/x'], 'each commit in a chain is a commit somewhere');
  assert.deepStrictEqual(R.commitDirs('git status'), [], 'a read commits nowhere');
  assert.deepStrictEqual(R.commitDirs('# git commit -m x'), [],
    'a comment commits nowhere either');
});

it('other git commands are not commits', () => {
  for (const cmd of ['git status', 'git log --oneline -5', 'git show HEAD',
                     'git diff --cached', 'git push']) {
    assert.strictEqual(R.isCommit(cmd), false, `gated a read: ${cmd}`);
  }
});

it('the word commit outside git is not a commit', () => {
  assert.strictEqual(R.isCommit('echo "commit this to memory"'), false);
  assert.strictEqual(R.isCommit('grep -r commit docs/'), false);
});

// --- the front-matter half --------------------------------------------------

it('a SKILL.md is recognised wherever it sits', () => {
  assert.strictEqual(R.isSkillManifest('/repo/skills/x/SKILL.md'), true);
  assert.strictEqual(R.isSkillManifest('SKILL.md'), true);
  assert.strictEqual(R.isSkillManifest('/repo/docs/SKILL.md.bak'), false);
  assert.strictEqual(R.isSkillManifest('/repo/README.md'), false);
});

const ok = ['---', 'name: tidy-skill', 'description: Does one thing well.', '---', '', '# Body'].join('\n');

it('a legal manifest has no violations', () => {
  assert.deepStrictEqual(R.violations(ok), []);
});

it('an over-long description is caught, with its number', () => {
  const long = ok.replace('Does one thing well.', 'x'.repeat(1100));
  const v = R.violations(long);
  assert.strictEqual(v.length, 1);
  assert.strictEqual(v[0].field, 'description');
  assert.strictEqual(v[0].actual, 1100);
  assert.strictEqual(v[0].limit, 1024);
});

it('an over-long name is caught too', () => {
  const long = ok.replace('tidy-skill', 'a'.repeat(70));
  assert.deepStrictEqual(R.violations(long).map((r) => r.field), ['name']);
});

it('a folded description is measured after folding, as a host reads it', () => {
  const folded = ['---', 'name: x', 'description: >-', '  ' + 'y'.repeat(600),
                  '  ' + 'z'.repeat(600), '---'].join('\n');
  const v = R.violations(folded);
  assert.strictEqual(v.length, 1, 'a folded description longer than the limit was not measured');
  assert.ok(v[0].actual > 1024);
});

it('a file with no front matter is not a finding', () => {
  assert.deepStrictEqual(R.violations('# Just a heading\n'), []);
  assert.deepStrictEqual(R.violations(''), []);
});

it('the report names the field, both numbers, and what will fail', () => {
  const out = R.render(R.violations(ok.replace('Does one thing well.', 'x'.repeat(1100))), 'a/SKILL.md');
  assert.match(out, /description: 1100 chars/);
  assert.match(out, /limit is 1024/);
  assert.match(out, /validate --strict/);
});

it('a clean file renders nothing', () => {
  assert.strictEqual(R.render([], 'a/SKILL.md'), '');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
