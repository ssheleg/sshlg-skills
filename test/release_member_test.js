'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
// B-222: a member's tag-only release checks run on the candidate BEFORE the tag is pushed.
// The member's suite runs with the annotated tag present locally (task-pipeline's retro
// declaration reads `git tag -l`), a red suite deletes the tag this run created, and only a
// green one pushes. Every case runs real git against a bare remote in a temp directory.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const W = require('../lib/releasewatch');

let cases = 0;
function test(name, fn) { fn(); cases++; console.log(`ok ${name}`); }

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'release-member-test-'));
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(base, 'no-global') };
function git(cwd, args, ok = true) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env });
  if (ok) assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout.trim();
}
// The suite passes only when the release tag exists locally: the shape of a check that a
// branch run cannot see and a tag run can.
const TAG_READING_SUITE = 'node -e "const t=require(\'child_process\').execSync(\'git tag -l v*\').toString();process.exit(t.includes(process.env.WANT)?0:1)"';

function member(name, { version = '1.2.3', plugin = version, suite = TAG_READING_SUITE, changelog = true, heading = `## v${version}`, files = {} } = {}) {
  const remote = path.join(base, `${name}.git`), repo = path.join(base, name);
  git(base, ['init', '-q', '--bare', '-b', 'main', remote]);
  fs.mkdirSync(path.join(repo, 'plugins', 'm', '.claude-plugin'), { recursive: true });
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'user.name', 'Fixture']); git(repo, ['config', 'user.email', 'fixture@example.invalid']);
  fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ version, scripts: { test: suite } }) + '\n');
  fs.writeFileSync(path.join(repo, 'plugins', 'm', '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'm', version: plugin }) + '\n');
  for (const [rel, body] of Object.entries(files)) fs.writeFileSync(path.join(repo, rel), body);
  fs.writeFileSync(path.join(repo, 'CHANGELOG.md'), changelog ? `# Changelog\n\n${heading}\n\n- a fix\n` : '# Changelog\n');
  git(repo, ['add', '-A']); git(repo, ['commit', '-q', '-m', 'release']);
  git(repo, ['remote', 'add', 'origin', remote]); git(repo, ['push', '-q', 'origin', 'main']);
  git(repo, ['fetch', '-q', 'origin']);
  return { repo, remote };
}
const remoteTags = (remote) => git(remote, ['tag', '-l']);
const localTags = (repo) => git(repo, ['tag', '-l']);

try {
  test('a green suite that needs the tag runs with it present, then the tag is pushed', () => {
    const { repo, remote } = member('green');
    const r = W.releaseMember(repo, 'v1.2.3', { push: true, env: { ...env, WANT: 'v1.2.3' } });
    assert.strictEqual(r.status, 'TAG_PUSHED');
    assert.strictEqual(r.suite.exit_code, 0);
    assert.strictEqual(remoteTags(remote), 'v1.2.3');
    assert.strictEqual(git(repo, ['cat-file', '-t', 'v1.2.3']), 'tag');
  });

  test('without --push the tag stays local and the suite verdict is reported', () => {
    const { repo, remote } = member('local');
    const r = W.releaseMember(repo, 'v1.2.3', { push: false, env: { ...env, WANT: 'v1.2.3' } });
    assert.strictEqual(r.status, 'TAG_CREATED');
    assert.strictEqual(localTags(repo), 'v1.2.3');
    assert.strictEqual(remoteTags(remote), '');
  });

  test('a red suite deletes the tag this run created and pushes nothing', () => {
    const { repo, remote } = member('red', { suite: 'node -e "process.exit(1)"' });
    assert.throws(() => W.releaseMember(repo, 'v1.2.3', { push: true, env }), /suite failed on the candidate/);
    assert.strictEqual(localTags(repo), '');
    assert.strictEqual(remoteTags(remote), '');
  });

  test('a red suite keeps a tag that existed before the run', () => {
    const { repo } = member('kept', { suite: 'node -e "process.exit(1)"' });
    git(repo, ['tag', '-a', 'v1.2.3', '-m', 'v1.2.3']);
    assert.throws(() => W.releaseMember(repo, 'v1.2.3', { push: false, env }), /suite failed/);
    assert.strictEqual(localTags(repo), 'v1.2.3');
  });

  test('a plugin.json version out of sync refuses before any tag', () => {
    const { repo } = member('drift', { plugin: '1.2.2' });
    assert.throws(() => W.releaseMember(repo, 'v1.2.3', { push: false, env }), /plugin\.json.*1\.2\.2/);
    assert.strictEqual(localTags(repo), '');
  });

  test('a missing changelog section refuses before any tag', () => {
    const { repo } = member('nolog', { changelog: false });
    assert.throws(() => W.releaseMember(repo, 'v1.2.3', { push: false, env }), /changelog/);
    assert.strictEqual(localTags(repo), '');
  });

  test('a commit the default branch does not contain refuses', () => {
    const { repo } = member('unmerged');
    fs.writeFileSync(path.join(repo, 'x.txt'), 'x\n');
    git(repo, ['add', 'x.txt']); git(repo, ['commit', '-q', '-m', 'not on main']);
    assert.throws(() => W.releaseMember(repo, 'v1.2.3', { push: false, env }), /not on origin\/main/);
    assert.strictEqual(localTags(repo), '');
  });

  test('a `## vX.Y.Z: title` heading is a changelog section, as members write it', () => {
    const { repo } = member('colon', { heading: '## v1.2.3: routed trigger phrases' });
    assert.strictEqual(W.releaseMember(repo, 'v1.2.3', { push: false, env: { ...env, WANT: 'v1.2.3' } }).status, 'TAG_CREATED');
  });

  test('a section for a longer version is not this version\'s section', () => {
    const { repo } = member('longer', { heading: '## v1.2.30: another release' });
    assert.throws(() => W.releaseMember(repo, 'v1.2.3', { push: false, env }), /changelog/);
  });

  test('a malformed tag refuses', () => {
    const { repo } = member('badtag');
    assert.throws(() => W.releaseMember(repo, '--delete', { push: false, env }), /tag/);
  });

  // B-363: task-pipeline v1.109.0 failed on a stdout line ("FAIL ... 401") that the report cut,
  // because the last 15 lines of stdout+stderr were a later suite's unittest summary on stderr.
  const NOISY = [
    "console.log('ok suite one');",
    "console.log('FAIL: negative self-test 401 did not fire');",
    "for (let i = 0; i < 30; i++) console.log('ok filler ' + i);",
    "for (let i = 0; i < 20; i++) console.error('test_case_' + i + ' ... ok');",
    "console.error('Ran 46 tests in 0.2s'); console.error('OK');",
    "process.exit(1);",
  ].join('\n');

  test('a red suite reports the failing stdout line that a later stderr tail used to cut', () => {
    const { repo } = member('noisy', { suite: 'node suite.js', files: { 'suite.js': NOISY } });
    let message = '';
    try { W.releaseMember(repo, 'v1.2.3', { push: false, env }); } catch (e) { message = e.message; }
    assert.match(message, /suite failed on the candidate/);
    assert.match(message, /FAIL: negative self-test 401 did not fire/, 'the failing line is shown');
    assert.match(message, /stdout, last \d+ lines?:[\s\S]*ok filler 29/, 'stdout has its own tail');
    assert.match(message, /stderr, last \d+ lines?:[\s\S]*Ran 46 tests/, 'stderr has its own tail');
    assert.ok(message.indexOf('ok filler 29') < message.indexOf('Ran 46 tests'), 'the tails are apart, stdout first');
    assert.match(message, /python3 on the suite's PATH: /, 'the interpreter the suite saw is named');
  });

  test('the failure report keeps the streams apart, marks failing lines and bounds its size', () => {
    const out = ['ok a', 'FAIL: one', ...Array.from({ length: 40 }, (_, i) => `ok ${i}`)].join('\n');
    const err = ['Traceback (most recent call last):', 'AssertionError: two', ...Array.from({ length: 40 }, (_, i) => `noise ${i}`)].join('\n');
    const r = W.failureReport(out, err);
    assert.match(r, /lines that name a failure:\n {2}stdout:2: FAIL: one\n {2}stderr:1: Traceback[^\n]*\n {2}stderr:2: AssertionError: two/);
    assert.ok(!r.includes('ok 24') && r.includes('ok 25') && r.includes('ok 39'), 'stdout tail is the last 15 lines');
    assert.ok(!r.includes('noise 24') && r.includes('noise 39'), 'stderr tail is the last 15 lines');
    assert.strictEqual(W.failureReport('', ''), 'the suite printed nothing');
    assert.ok(!/lines that name a failure/.test(W.failureReport('ok\n', '')), 'no failing line, no empty section');
    assert.match(W.failureReport('ok\n', ''), /stdout, last 1 line:\n {2}ok$/);
    const many = W.failureReport(Array.from({ length: 200 }, (_, i) => `FAIL ${i}`).join('\n'), '');
    assert.match(many, /stdout:1: FAIL 0/); assert.match(many, /and 180 more/);
    assert.ok(!many.includes('stdout:21: FAIL 20'), 'failing lines are capped at 20');
    const wide = W.failureReport(`FAIL ${'x'.repeat(5000)}`, '');
    assert.ok(wide.length < 1500, 'a very long line is cut');
    assert.ok(!/FAIL/.test(W.failureReport('0 failed, 12 passed\nno errors\n', '').split('stdout, last')[0]), 'a passing summary is not a failure line');
  });

  test('the interpreter line names the python3 on the given PATH, or says there is none', () => {
    assert.match(W.suiteInterpreter(base, env), /^python3 on the suite's PATH: \S.* \(\d+\.\d+/);
    assert.strictEqual(W.suiteInterpreter(base, { PATH: path.join(base, 'empty-bin') }), "python3 on the suite's PATH: none found");
  });

  test('the suite command is the package test:all when present, else test', () => {
    assert.deepStrictEqual(W.memberSuite({ scripts: { test: 'a', 'test:all': 'b' } }), ['npm', ['run', '--silent', 'test:all']]);
    assert.deepStrictEqual(W.memberSuite({ scripts: { test: 'a' } }), ['npm', ['run', '--silent', 'test']]);
    assert.throws(() => W.memberSuite({ scripts: {} }), /no test script/);
  });
} finally {
  fs.rmSync(base, { recursive: true, force: true });
}
console.log(`PASS: release member — ${cases} cases`);
