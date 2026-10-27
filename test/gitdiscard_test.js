#!/usr/bin/env node
'use strict';
// B-240: `git checkout`/`restore`/`reset --hard`/`stash`/`clean -f` over uncommitted work.
//
// The decision is pure: `targets(command)` reads which destructive git invocations a
// payload would run (through the same lexer `lib/hygiene.js` uses, so heredoc bodies and
// comments are data and `bash -c '…'` is code), and `decide(targets, probes)` reads the
// dirty state the hook probed for exactly those paths. Nothing here touches a file.

const assert = require('assert');
const D = require('../lib/gitdiscard.js');

let n = 0;
const failures = [];
function it(name, fn) {
  n += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const one = (cmd) => {
  const t = D.targets(cmd);
  assert.strictEqual(t.length, 1, `expected one target for ${JSON.stringify(cmd)}, got ${JSON.stringify(t)}`);
  return t[0];
};
const none = (cmd) => assert.deepStrictEqual(D.targets(cmd), [], `expected no target for ${JSON.stringify(cmd)}`);
const Z = (...records) => records.join('\0') + '\0';

// --- each destructive form is read, with its paths and what it would lose ---------

it('git checkout -- <paths> restores from the index: unstaged changes are lost', () => {
  const t = one('git checkout -- lib/a.js lib/b.js');
  assert.strictEqual(t.form, 'checkout');
  assert.deepStrictEqual(t.pathspecs, ['lib/a.js', 'lib/b.js']);
  assert.deepStrictEqual(t.lose, { index: false, worktree: true, untracked: false, dirs: false, ignored: false });
  assert.strictEqual(t.dir, '.');
});

it('git checkout <ref> -- <paths> loses staged and unstaged changes', () => {
  const t = one('git checkout HEAD~1 -- README.md');
  assert.strictEqual(t.form, 'checkout');
  assert.deepStrictEqual(t.pathspecs, ['README.md']);
  assert.ok(t.lose.index && t.lose.worktree);
});

it('git checkout . and git checkout <file> without -- are read as paths', () => {
  assert.deepStrictEqual(one('git checkout .').pathspecs, ['.']);
  assert.deepStrictEqual(one('git checkout src/x.ts').pathspecs, ['src/x.ts']);
  const two = one('git checkout main src/x.ts');
  assert.deepStrictEqual(two.pathspecs, ['src/x.ts']);
  assert.ok(two.lose.index, 'a ref then a path restores from the ref');
});

it('git checkout -f discards every tracked change in the repository', () => {
  const t = one('git checkout -f main');
  assert.deepStrictEqual(t.pathspecs, [':/']);
  assert.ok(t.lose.index && t.lose.worktree);
});

it('git restore without --staged loses unstaged changes; --staged --worktree loses both', () => {
  const w = one('git restore lib/a.js');
  assert.strictEqual(w.form, 'restore');
  assert.deepStrictEqual(w.pathspecs, ['lib/a.js']);
  assert.deepStrictEqual(w.lose, { index: false, worktree: true, untracked: false, dirs: false, ignored: false });
  const sw = one('git restore --staged --worktree --source=HEAD -- .');
  assert.deepStrictEqual(sw.pathspecs, ['.']);
  assert.ok(sw.lose.index && sw.lose.worktree);
  assert.ok(one('git restore -SW a').lose.index, 'the short cluster -SW is --staged --worktree');
  assert.deepStrictEqual(one('git restore -s HEAD~2 a b').pathspecs, ['a', 'b'], '-s consumes its value');
});

it('git reset --hard loses every tracked change in the repository', () => {
  const t = one('git reset --hard origin/main');
  assert.strictEqual(t.form, 'reset --hard');
  assert.deepStrictEqual(t.pathspecs, [':/']);
  assert.ok(t.lose.index && t.lose.worktree && !t.lose.untracked);
});

it('git stash, push and save take tracked changes; -u and -a take untracked too', () => {
  for (const cmd of ['git stash', 'git stash push', 'git stash save wip', 'git stash -m keep', 'git stash --keep-index']) {
    const t = one(cmd);
    assert.strictEqual(t.form, 'stash', cmd);
    assert.deepStrictEqual(t.pathspecs, [':/'], cmd);
    assert.ok(t.lose.index && t.lose.worktree && !t.lose.untracked, cmd);
  }
  assert.ok(one('git stash -u').lose.untracked);
  assert.ok(one('git stash push --include-untracked').lose.untracked);
  assert.ok(one('git stash --all').lose.untracked);
  assert.deepStrictEqual(one('git stash push -m "keep it" -- lib/a.js').pathspecs, ['lib/a.js']);
});

it('git clean -f deletes untracked files; -d adds untracked directories', () => {
  const f = one('git clean -f');
  assert.strictEqual(f.form, 'clean');
  assert.deepStrictEqual(f.pathspecs, ['.']);
  assert.deepStrictEqual(f.lose, { index: false, worktree: false, untracked: true, dirs: false, ignored: false });
  assert.ok(one('git clean -fdx').lose.dirs);
  assert.deepStrictEqual(one('git clean --force -e keep.txt -- build').pathspecs, ['build']);
});

// --- benign forms are not targets ------------------------------------------------

it('benign forms are not read as destructive', () => {
  [
    'git checkout -b feature', 'git checkout -B x origin/x', 'git checkout --orphan gh-pages',
    'git checkout -', 'git checkout', 'git checkout --detach', 'git checkout -p -- a.js',
    'git checkout --theirs -- a.js', 'git checkout --ours a.js',
    'git restore --staged a.js', 'git restore -S a.js', 'git restore -p a.js',
    'git reset', 'git reset --soft HEAD~1', 'git reset --keep HEAD~1', 'git reset a.js',
    'git stash list', 'git stash show -p', 'git stash pop', 'git stash apply stash@{1}',
    'git stash drop', 'git stash branch b', 'git stash -p',
    'git clean -n', 'git clean -fn', 'git clean --dry-run -f', 'git clean -fi', 'git clean -X', 'git clean -d',
    'git status', 'git switch main', 'git switch -c feature', 'git switch --detach v1',
    'git log --oneline -- a.js',
  ].forEach(none);
});

// --- the payload is read the way the shell reads it ---------------------------------

it('heredoc bodies fed to a non-shell and comments are data', () => {
  none("cat > notes.md <<'EOF'\ngit checkout -- a.js\ngit reset --hard\nEOF");
  none("python3 - <<'PY'\nprint('git stash')\nPY");
  none('# git checkout -- a.js\nls');
  none('echo "git checkout -- a.js"');
  none("gh pr create --body 'run git reset --hard'");
});

it('bash -c, a shell heredoc and a command substitution are code', () => {
  assert.deepStrictEqual(one("bash -c 'git checkout -- a.js'").pathspecs, ['a.js']);
  assert.strictEqual(one("sh -lc \"cd sub && git stash\"").dir, 'sub');
  assert.strictEqual(one("bash <<'EOF'\ngit reset --hard\nEOF").form, 'reset --hard');
  assert.strictEqual(one('echo "$(git stash)"').form, 'stash');
});

it('the directory follows cd and git -C, and an unresolvable one is skipped (fail open)', () => {
  assert.strictEqual(one('cd skills/x && git checkout -- a.js').dir, 'skills/x');
  assert.strictEqual(one('git -C ../other restore a.js').dir, '../other');
  assert.strictEqual(one('cd /abs/repo; git -C sub reset --hard').dir, '/abs/repo/sub');
  assert.strictEqual(one('cd ~/DATA/x && git stash').dir, '~/DATA/x');
  none('cd "$REPO" && git checkout -- a.js');
  none('git --git-dir=/x/.git --work-tree=/y checkout -- a.js');
  none('git checkout -- $(git ls-files -m)');
  none('git restore --pathspec-from-file=list.txt');
});

it('several invocations in one payload are each read', () => {
  const t = D.targets('git add -A && git stash && git checkout -- a.js');
  assert.deepStrictEqual(t.map((x) => x.form), ['stash', 'checkout']);
});

it(`the override ${D.OVERRIDE} on the command itself is honoured, and only there`, () => {
  none(`${D.OVERRIDE} git checkout -- a.js`);
  none(`env ${D.OVERRIDE} git reset --hard`);
  assert.strictEqual(D.targets(`${D.OVERRIDE} git stash && git checkout -- a.js`).length, 1,
    'the override covers its own command, not the next one');
  assert.strictEqual(one('SSHLG_DISCARD_OK=0 git stash').form, 'stash', 'only the value 1 overrides');
});

it('the cheap precheck says no for a payload that never names git', () => {
  assert.strictEqual(D.mightDiscard('ls -la && npm test'), false);
  assert.strictEqual(D.mightDiscard('git status'), true);
  assert.strictEqual(D.mightDiscard(''), false);
  assert.strictEqual(D.mightDiscard(null), false);
});

// --- B-270: ignored files, git switch, xargs and an exported override ----------------

it('B-270: git clean -x counts ignored files too; -X counts only ignored ones', () => {
  const x = one('git clean -fx');
  assert.ok(x.lose.untracked && x.lose.ignored, 'clean -x deletes untracked and ignored files');
  const X = one('git clean -fX');
  assert.ok(!X.lose.untracked && X.lose.ignored, 'clean -X deletes ignored files only');
  assert.ok(one('git clean -fdX').lose.dirs);
  assert.ok(one('git clean --force -x -- config').lose.ignored);
  assert.strictEqual(one('git clean -fd').lose.ignored, false);
});

it('B-270: an ignored .env is lost to clean -x and -X, and safe from a plain clean -f', () => {
  const env = Z('!! .env');
  const v = D.decide(D.targets('git clean -fdx'), [{ dir: '/r', out: env }]);
  assert.ok(v, 'clean -fdx over an ignored .env was allowed');
  assert.match(v.why, /\.env \(ignored\)/);
  assert.match(v.why, /ignored/);
  assert.ok(D.decide(D.targets('git clean -fX'), [{ dir: '/r', out: env }]));
  assert.strictEqual(D.decide(D.targets('git clean -f'), [{ dir: '/r', out: env }]), null,
    'a clean without -x keeps ignored files');
  assert.strictEqual(D.decide(D.targets('git clean -fX'), [{ dir: '/r', out: Z('?? new.txt') }]), null,
    'clean -X keeps untracked files that are not ignored');
  assert.strictEqual(D.decide(D.targets('git clean -fX'), [{ dir: '/r', out: Z('!! node_modules/') }]), null,
    'without -d an ignored directory stays');
  assert.ok(D.decide(D.targets('git clean -fdX'), [{ dir: '/r', out: Z('!! node_modules/') }]));
});

it('B-270: git switch --discard-changes and -f discard every tracked change', () => {
  for (const cmd of ['git switch --discard-changes main', 'git switch -f main', 'git switch --force main',
    'git switch -c fresh -f', 'git switch -fc fresh']) {
    const t = one(cmd);
    assert.strictEqual(t.form, 'switch', cmd);
    assert.deepStrictEqual(t.pathspecs, [':/'], cmd);
    assert.ok(t.lose.index && t.lose.worktree && !t.lose.untracked, cmd);
  }
  assert.ok(D.decide(D.targets('git switch -f main'), [{ dir: '/r', out: Z(' M a.js') }]));
});

it('B-270: xargs fed by a readable producer is read with the paths it feeds', () => {
  assert.deepStrictEqual(one('echo a.js b.js | xargs git checkout --').pathspecs, ['a.js', 'b.js']);
  assert.deepStrictEqual(one("printf '%s\\n' lib/a.js | xargs git restore").pathspecs, ['lib/a.js']);
  // A git listing feeds the files it lists: the probe covers its scope.
  const diff = one('git diff --name-only | xargs git checkout --');
  assert.strictEqual(diff.form, 'checkout');
  assert.deepStrictEqual(diff.pathspecs, [':/']);
  assert.deepStrictEqual(one('git ls-files -m -- lib | xargs git checkout --').pathspecs, ['lib']);
  assert.deepStrictEqual(one('git diff --name-only -z -- src | xargs -0 git restore').pathspecs, ['src']);
  assert.deepStrictEqual(one('git ls-files --modified | xargs -I{} git checkout -- {}').pathspecs, [':/']);
  assert.deepStrictEqual(one('git ls-files -o --exclude-standard | xargs rm -f && git stash').pathspecs, [':/']);
  assert.strictEqual(one('cd sub && git diff --name-only | xargs git checkout --').dir, 'sub');
  // xargs over a whole-repository form needs no paths at all.
  assert.strictEqual(one('cat refs.txt | xargs git reset --hard').form, 'reset --hard');
  const v = D.decide(D.targets('git diff --name-only | xargs git checkout --'), [{ dir: '/r', out: Z(' M a.js') }]);
  assert.ok(v && /a\.js \(unstaged\)/.test(v.why), 'xargs over a dirty file was allowed');
  assert.ok(v.why.includes(`\`${D.OVERRIDE} xargs git checkout --\``), `the override is not runnable: ${v.why}`);
});

it('B-270: xargs whose input cannot be read is allowed (fail open)', () => {
  none('cat list.txt | xargs git checkout --');
  none('xargs git checkout -- < list.txt');
  none('xargs -a list.txt git checkout --');
  none('git diff --name-only HEAD~1 | xargs git checkout --');
  none('git diff --name-status | xargs git checkout --');
  none('git -C other diff --name-only | xargs git checkout --');
  none('echo a.js | xargs -0 git checkout --');
  none('git diff --name-only | xargs -I{} git checkout -- src/{}');
  none('echo "$FILES" | xargs git checkout --');
  none('git diff --name-only | xargs git log --');
  none(`git diff --name-only | ${D.OVERRIDE} xargs git checkout --`);
  none(`git diff --name-only | xargs ${D.OVERRIDE} git checkout --`);
});

it('B-270: an override exported earlier in the same payload is honoured for what follows', () => {
  none(`export ${D.OVERRIDE}; git checkout -- a.js`);
  none(`export A=1 ${D.OVERRIDE} && git reset --hard`);
  assert.strictEqual(one(`git stash; export ${D.OVERRIDE}; git checkout -- a.js`).form, 'stash',
    'an export covers the commands after it, not before');
  assert.strictEqual(one('export SSHLG_DISCARD_OK=0; git stash').form, 'stash', 'only the value 1 overrides');
});

// --- porcelain in, verdict out -----------------------------------------------------

it('parsePorcelain reads -z records, skipping the source of a rename', () => {
  const rows = D.parsePorcelain(Z(' M lib/a.js', 'R  new.js', 'old.js', '?? tmp/', 'A  added.js'));
  assert.deepStrictEqual(rows.map((r) => r.path), ['lib/a.js', 'new.js', 'tmp/', 'added.js']);
  assert.deepStrictEqual(D.parsePorcelain(''), []);
  assert.deepStrictEqual(D.parsePorcelain(null), []);
});

it('a dirty path refuses, naming the path, the remedy and the override', () => {
  const t = D.targets('git checkout -- lib/a.js');
  const v = D.decide(t, [{ dir: '/repo', out: Z(' M lib/a.js') }]);
  assert.ok(v, 'not refused');
  assert.match(v.why, /lib\/a\.js \(unstaged\)/);
  assert.match(v.why, /\/repo/);
  assert.match(v.why, /commit/);
  assert.match(v.why, /copy/);
  assert.ok(v.why.includes(`${D.OVERRIDE} git checkout -- lib/a.js`), 'the override is not named with the command');
  assert.ok(!v.why.includes('\u2014'), 'the refusal carries an em dash');
  assert.deepStrictEqual(v.dirty[0].paths, ['lib/a.js']);
});

it('a clean probe allows, and a failed probe allows (fail open)', () => {
  const t = D.targets('git checkout -- lib/a.js');
  assert.strictEqual(D.decide(t, [{ dir: '/repo', out: '' }]), null);
  assert.strictEqual(D.decide(t, [null]), null);
  assert.strictEqual(D.decide(t, []), null);
  assert.strictEqual(D.decide([], []), null);
});

it('only the changes the form would lose count', () => {
  const staged = Z('M  a.js');
  assert.strictEqual(D.decide(D.targets('git checkout -- a.js'), [{ dir: '/r', out: staged }]), null,
    'a staged-only change survives a checkout from the index');
  assert.ok(D.decide(D.targets('git reset --hard'), [{ dir: '/r', out: staged }]), 'reset --hard loses a staged change');
  assert.strictEqual(D.decide(D.targets('git stash'), [{ dir: '/r', out: Z('?? new.txt') }]), null,
    'a plain stash leaves untracked files alone');
  assert.ok(D.decide(D.targets('git stash -u'), [{ dir: '/r', out: Z('?? new.txt') }]));
  assert.strictEqual(D.decide(D.targets('git clean -f'), [{ dir: '/r', out: Z('?? build/') }]), null,
    'clean without -d leaves untracked directories');
  assert.ok(D.decide(D.targets('git clean -fd'), [{ dir: '/r', out: Z('?? build/') }]));
  assert.strictEqual(D.decide(D.targets('git clean -f'), [{ dir: '/r', out: Z(' M a.js') }]), null,
    'clean never touches a tracked change');
});

it('the stash refusal says where the work goes and why that is not keeping it', () => {
  const v = D.decide(D.targets('git stash'), [{ dir: '/r', out: Z(' M a.js', 'MM b.js') }]);
  assert.match(v.why, /stash/);
  assert.match(v.why, /b\.js \(staged, unstaged\)/);
});

it('a long list is capped and counted', () => {
  const recs = Array.from({ length: 25 }, (_, i) => ` M f${i}.js`);
  const v = D.decide(D.targets('git reset --hard'), [{ dir: '/r', out: Z(...recs) }]);
  assert.match(v.why, /and 15 more/);
  assert.strictEqual(v.dirty[0].paths.length, 25);
});

it('never throws on hostile input', () => {
  for (const x of [undefined, null, 42, {}, '\0\0', 'git', 'git checkout -- ', '"'.repeat(1000), '$('.repeat(500)]) {
    D.targets(x);
    D.decide(D.targets(String(x)), [{ dir: 1, out: x }]);
    D.parsePorcelain(x);
  }
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${n}`);
  process.exit(1);
}
console.log(`PASS: gitdiscard \u2014 ${n} cases`);
