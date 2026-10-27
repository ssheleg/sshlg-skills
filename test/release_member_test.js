'use strict';
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

function member(name, { version = '1.2.3', plugin = version, suite = TAG_READING_SUITE, changelog = true, heading = `## v${version}` } = {}) {
  const remote = path.join(base, `${name}.git`), repo = path.join(base, name);
  git(base, ['init', '-q', '--bare', '-b', 'main', remote]);
  fs.mkdirSync(path.join(repo, 'plugins', 'm', '.claude-plugin'), { recursive: true });
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'user.name', 'Fixture']); git(repo, ['config', 'user.email', 'fixture@example.invalid']);
  fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ version, scripts: { test: suite } }) + '\n');
  fs.writeFileSync(path.join(repo, 'plugins', 'm', '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'm', version: plugin }) + '\n');
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

  test('the suite command is the package test:all when present, else test', () => {
    assert.deepStrictEqual(W.memberSuite({ scripts: { test: 'a', 'test:all': 'b' } }), ['npm', ['run', '--silent', 'test:all']]);
    assert.deepStrictEqual(W.memberSuite({ scripts: { test: 'a' } }), ['npm', ['run', '--silent', 'test']]);
    assert.throws(() => W.memberSuite({ scripts: {} }), /no test script/);
  });
} finally {
  fs.rmSync(base, { recursive: true, force: true });
}
console.log(`PASS: release member — ${cases} cases`);
