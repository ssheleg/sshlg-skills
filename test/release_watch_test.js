'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const W = require('../lib/releasewatch');
let checks = 0;
function test(name, fn) { fn(); checks++; }
const sha = 'a'.repeat(40);
const plan = { schema: 'release-watch/1', repository: 'ssheleg/sshlg-skills', sha,
  tag: 'v1.62.0', run_id: 10, workflow_id: 20, event: 'workflow_dispatch',
  required_jobs: ['validate'], local_receipt: '/receipt.json', allow_tag_push: true };
const run = { id: 10, workflow_id: 20, event: 'workflow_dispatch', head_sha: sha,
  status: 'completed', conclusion: 'success', run_attempt: 1 };
const jobs = [{ name: 'validate', conclusion: 'success', status: 'completed' }];
const receipt = { source_commit: sha, command: 'npm test', exit_code: 0 };
test('exact successful candidate is ready', () => assert.strictEqual(W.evaluate(plan, run, jobs, sha, receipt), 'READY'));
for (const [name, update] of Object.entries({ sha: { head_sha: 'b'.repeat(40) }, workflow: { workflow_id: 21 }, event: { event: 'push' }, failure: { conclusion: 'failure' }, skipped: { conclusion: 'skipped' } }))
  test(`wrong run ${name} refuses`, () => assert.throws(() => W.evaluate(plan, { ...run, ...update }, jobs, sha, receipt)));
test('pending is a wait, not a pass', () => assert.strictEqual(W.evaluate(plan, { ...run, status: 'in_progress', conclusion: null }, [], sha, receipt), 'WAIT'));
test('moving main refuses', () => assert.throws(() => W.evaluate(plan, run, jobs, 'b'.repeat(40), receipt)));
test('docs-only local receipt at older SHA refuses', () => assert.throws(() => W.evaluate(plan, run, jobs, sha, { ...receipt, source_commit: 'c'.repeat(40) })));
test('missing required job refuses', () => assert.throws(() => W.evaluate(plan, run, [], sha, receipt)));
test('skipped required job refuses', () => assert.throws(() => W.evaluate(plan, run, [{ ...jobs[0], conclusion: 'skipped' }], sha, receipt)));
test('failed local npm refuses', () => assert.throws(() => W.evaluate(plan, run, jobs, sha, { ...receipt, exit_code: 1 })));
test('malformed tag refuses', () => assert.throws(() => W.validatePlan({ ...plan, tag: '--delete' })));
test('unknown CI status refuses rather than waiting forever', () => assert.throws(() => W.evaluate(plan, { ...run, status: 'unknown' }, jobs, sha, receipt)));

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'release-watch-test-'));
function git(cwd, args, ok = true) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(base, 'no-global') } });
  if (ok) assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout.trim();
}
try {
  const remote = path.join(base, 'remote.git'), repo = path.join(base, 'repo');
  fs.mkdirSync(repo); git(base, ['init', '--bare', remote]); git(repo, ['init']);
  git(repo, ['config', 'user.name', 'Fixture']); git(repo, ['config', 'user.email', 'fixture@example.invalid']);
  fs.writeFileSync(path.join(repo, 'package.json'), '{"version":"1.62.0"}\n');
  fs.writeFileSync(path.join(repo, 'CHANGELOG.md'), '## v1.62.0\n\nFixture notes.\n');
  git(repo, ['add', '.']); git(repo, ['commit', '-m', 'fixture']); git(repo, ['remote', 'add', 'origin', remote]);
  const head = git(repo, ['rev-parse', 'HEAD']);
  test('safe helper creates annotated tag at fixed SHA and nonforce pushes', () => {
    W.safeTag(repo, 'v1.62.0', head, true);
    assert.strictEqual(git(repo, ['cat-file', '-t', 'v1.62.0']), 'tag');
    assert.strictEqual(git(repo, ['rev-parse', 'v1.62.0^{}']), head);
    assert.ok(git(repo, ['ls-remote', 'origin', 'refs/tags/v1.62.0^{}']).startsWith(head));
  });
  test('repeat is idempotent and does not replace tag object', () => {
    const before = git(repo, ['rev-parse', 'v1.62.0']);
    W.safeTag(repo, 'v1.62.0', head, true);
    assert.strictEqual(git(repo, ['rev-parse', 'v1.62.0']), before);
  });
  test('local lightweight tag is never replaced', () => {
    git(repo, ['tag', 'v1.62.1']);
    assert.throws(() => W.safeTag(repo, 'v1.62.1', head, true));
    assert.strictEqual(git(repo, ['cat-file', '-t', 'v1.62.1']), 'commit');
  });
  test('version mismatch refuses before considering an unrelated remote tag', () => {
    git(repo, ['tag', 'v1.62.2']); git(repo, ['push', 'origin', 'refs/tags/v1.62.2']);
    git(repo, ['tag', '-d', 'v1.62.2']);
    assert.throws(() => W.safeTag(repo, 'v1.62.2', head, true));
    assert.ok(git(repo, ['ls-remote', 'origin', 'refs/tags/v1.62.2']).startsWith(head));
    assert.strictEqual(git(repo, ['tag', '-l', 'v1.62.2']), '');
  });
  test('dirty tracked source refuses before mutation', () => {
    fs.appendFileSync(path.join(repo, 'CHANGELOG.md'), 'dirty\n');
    assert.throws(() => W.safeTag(repo, 'v1.62.0', head, true));
  });

  // Real watcher process, with read-only GitHub fixtures and a local bare Git remote.
  // The wrapper changes only URL readback; all Git mutations target this fixture.
  fs.writeFileSync(path.join(repo, 'package.json'), '{"version":"1.63.0"}\n');
  fs.writeFileSync(path.join(repo, 'CHANGELOG.md'), '## v1.63.0\n\nNew fixture.\n');
  fs.writeFileSync(path.join(repo, 'pipeline.json'), '{"release":{"enabled":true,"approval":"checks"}}');
  fs.mkdirSync(path.join(repo, 'test'));
  test('missing/unreachable pins refuse', () => {
    fs.writeFileSync(path.join(repo, 'test/check_pins.py'), 'raise SystemExit(1)\n');
    assert.throws(() => W.checkPins(repo));
  });
  test('published but behind pins remain an explicit warning', () => {
    fs.writeFileSync(path.join(repo, 'test/check_pins.py'), 'raise SystemExit(2)\n');
    assert.strictEqual(W.checkPins(repo).exit_code, 2);
  });
  test('unknown pin exit code refuses', () => {
    fs.writeFileSync(path.join(repo, 'test/check_pins.py'), 'raise SystemExit(9)\n');
    assert.throws(() => W.checkPins(repo));
  });
  fs.writeFileSync(path.join(repo, 'test/check_pins.py'), 'print("fixture pins OK")\n');
  git(repo, ['add', '.']); git(repo, ['commit', '-m', 'watcher fixture']);
  const current = git(repo, ['rev-parse', 'HEAD']);
  const fixture = path.join(base, 'gh.json'), shims = path.join(base, 'bin'); fs.mkdirSync(shims);
  const fixtureData = { run: { ...run, head_sha: current, path: '.github/workflows/validate.yml' }, jobs, main: current };
  fs.writeFileSync(fixture, JSON.stringify(fixtureData));
  const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
  fs.writeFileSync(path.join(shims, 'git'), `#!${process.execPath}\nconst {spawnSync}=require('child_process');const a=process.argv.slice(2);if(a[0]==='remote'&&a[1]==='get-url'){console.log('git@github.com:ssheleg/sshlg-skills.git');}else{const r=spawnSync(${JSON.stringify(realGit)},a,{stdio:'inherit'});process.exit(r.status||0);}\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(shims, 'gh'), `#!${process.execPath}\nconst d=JSON.parse(require('fs').readFileSync(${JSON.stringify(fixture)}));const e=process.argv.at(-1);console.log(JSON.stringify(e.includes('/jobs?')?[{jobs:d.jobs}]:e.endsWith('/branches/main')?{commit:{sha:d.main}}:d.run));\n`, { mode: 0o755 });
  const log = 'synthetic local npm success\n';
  fs.writeFileSync(path.join(base, 'npm.log'), log);
  const receiptFile = path.join(base, 'receipt.json');
  fs.writeFileSync(receiptFile, JSON.stringify({ ...receipt, source_commit: current, stdout_artifact: 'npm.log', stdout_sha256: require('crypto').createHash('sha256').update(log).digest('hex') }));
  const planFile = path.join(base, 'plan.json');
  const armed = { ...plan, sha: current, tag: 'v1.63.0', local_receipt: receiptFile };
  fs.writeFileSync(planFile, JSON.stringify(armed));
  const stateFile = path.join(base, 'state.json');
  const invoke = (more = []) => spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/release-watch.js'), '--plan', planFile, '--repo', repo, ...more], { env: { ...process.env, PATH: shims + path.delimiter + process.env.PATH }, encoding: 'utf8' });
  test('CLI default is read-only even with armed plan', () => {
    const r = invoke(); assert.strictEqual(r.status, 0, r.stderr); assert.ok(r.stdout.includes('READY'));
    assert.strictEqual(git(repo, ['tag', '-l', 'v1.63.0']), '');
  });
  test('CLI tampered local log refuses', () => {
    fs.appendFileSync(path.join(base, 'npm.log'), 'tampered');
    assert.strictEqual(invoke().status, 1); fs.writeFileSync(path.join(base, 'npm.log'), log);
  });
  test('CLI cannot execute an unarmed plan', () => {
    fs.writeFileSync(planFile, JSON.stringify({ ...armed, allow_tag_push: false }));
    assert.strictEqual(invoke(['--execute', '--state', stateFile]).status, 1);
    fs.writeFileSync(planFile, JSON.stringify(armed));
  });
  test('CLI pending run remains untagged', () => {
    fs.writeFileSync(fixture, JSON.stringify({ ...fixtureData, run: { ...fixtureData.run, status: 'in_progress', conclusion: null } }));
    assert.strictEqual(invoke(['--execute', '--state', stateFile]).status, 2);
    assert.strictEqual(git(repo, ['tag', '-l', 'v1.63.0']), '');
    fs.writeFileSync(fixture, JSON.stringify(fixtureData));
  });
  test('CLI moving main refuses without a tag', () => {
    fs.writeFileSync(fixture, JSON.stringify({ ...fixtureData, main: 'b'.repeat(40) }));
    assert.strictEqual(invoke(['--execute', '--state', stateFile]).status, 1);
    assert.strictEqual(git(repo, ['tag', '-l', 'v1.63.0']), '');
    fs.writeFileSync(fixture, JSON.stringify(fixtureData));
  });
  test('CLI successful fixed candidate pushes once and records readback', () => {
    const r = invoke(['--execute', '--state', stateFile]); assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    const state = JSON.parse(fs.readFileSync(stateFile)); assert.strictEqual(state.status, 'TAG_PUSHED'); assert.strictEqual(state.sha, current);
    assert.strictEqual(git(repo, ['rev-parse', 'v1.63.0^{}']), current);
    assert.ok(git(repo, ['ls-remote', 'origin', 'refs/tags/v1.63.0^{}']).startsWith(current));
  });
  test('CLI repeated run preserves the original annotated object', () => {
    const before = git(repo, ['rev-parse', 'v1.63.0']);
    const r = invoke(['--execute', '--state', stateFile]); assert.strictEqual(r.status, 0, r.stderr);
    assert.strictEqual(JSON.parse(fs.readFileSync(stateFile)).status, 'ALREADY_PUSHED');
    assert.strictEqual(git(repo, ['rev-parse', 'v1.63.0']), before);
  });
  test('CLI existing watcher lock is not removed or stolen', () => {
    fs.writeFileSync(stateFile + '.lock', 'owned by another watcher\n');
    assert.strictEqual(invoke(['--execute', '--state', stateFile]).status, 1);
    assert.strictEqual(fs.readFileSync(stateFile + '.lock', 'utf8'), 'owned by another watcher\n');
    fs.unlinkSync(stateFile + '.lock');
  });
  fs.mkdirSync(path.join(repo, 'scripts')); fs.mkdirSync(path.join(repo, 'lib'));
  fs.copyFileSync(path.resolve(__dirname, '../scripts/tag.sh'), path.join(repo, 'scripts/tag.sh'));
  fs.copyFileSync(path.resolve(__dirname, '../lib/releasewatch.js'), path.join(repo, 'lib/releasewatch.js'));
  git(repo, ['add', '.']); git(repo, ['commit', '-m', 'tag entry point']);
  test('shell helper refuses existing annotated tag at a different HEAD', () => {
    const before = git(repo, ['rev-parse', 'v1.63.0']);
    const r = spawnSync('bash', ['scripts/tag.sh', 'v1.63.0', '--push'], { cwd: repo, encoding: 'utf8' });
    assert.strictEqual(r.status, 1); assert.strictEqual(git(repo, ['rev-parse', 'v1.63.0']), before);
  });
  test('shell helper fresh tag uses annotated nonforce publication', () => {
    fs.writeFileSync(path.join(repo, 'package.json'), '{"version":"1.64.0"}\n');
    fs.writeFileSync(path.join(repo, 'CHANGELOG.md'), '## v1.64.0\n\nShell fixture.\n');
    git(repo, ['add', '.']); git(repo, ['commit', '-m', 'shell candidate']);
    const r = spawnSync('bash', ['scripts/tag.sh', 'v1.64.0', '--push'], { cwd: repo, encoding: 'utf8' });
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.strictEqual(git(repo, ['cat-file', '-t', 'v1.64.0']), 'tag');
    assert.ok(git(repo, ['ls-remote', 'origin', 'refs/tags/v1.64.0^{}']).startsWith(git(repo, ['rev-parse', 'HEAD'])));
  });
  fs.writeFileSync(path.join(repo, 'package.json'), '{"version":"1.65.0"}\n');
  fs.writeFileSync(path.join(repo, 'CHANGELOG.md'), '## v1.65.0\n\nRecovery fixture.\n');
  git(repo, ['add', '.']); git(repo, ['commit', '-m', 'recovery candidate']);
  const recoveryHead = git(repo, ['rev-parse', 'HEAD']);
  let recoveryObject;
  test('prepush state change preserves local intent but refuses remote mutation', () => {
    let calls = 0;
    assert.throws(() => W.safeTag(repo, 'v1.65.0', recoveryHead, true, () => { if (++calls === 2) throw new Error('main moved'); }));
    recoveryObject = git(repo, ['rev-parse', 'v1.65.0']);
    assert.strictEqual(git(repo, ['ls-remote', 'origin', 'refs/tags/v1.65.0']), '');
  });
  test('push rejection preserves the existing annotated object', () => {
    fs.writeFileSync(path.join(remote, 'hooks/pre-receive'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    assert.throws(() => W.safeTag(repo, 'v1.65.0', recoveryHead, true));
    assert.strictEqual(git(repo, ['rev-parse', 'v1.65.0']), recoveryObject);
    assert.strictEqual(git(repo, ['ls-remote', 'origin', 'refs/tags/v1.65.0']), '');
    fs.unlinkSync(path.join(remote, 'hooks/pre-receive'));
  });
  test('recovery pushes original object without retagging', () => {
    W.safeTag(repo, 'v1.65.0', recoveryHead, true);
    assert.strictEqual(git(repo, ['rev-parse', 'v1.65.0']), recoveryObject);
    assert.ok(git(repo, ['ls-remote', 'origin', 'refs/tags/v1.65.0']).startsWith(recoveryObject));
  });
  for (const kind of ['lightweight', 'other-target', 'other-object']) {
    test(`exact-version remote ${kind} refuses without changing either ref`, () => {
      const local = path.join(base, 'conflict-' + kind), upstream = local + '.git';
      fs.mkdirSync(local); git(base, ['init', '--bare', upstream]); git(local, ['init']);
      git(local, ['config', 'user.name', 'Fixture']); git(local, ['config', 'user.email', 'fixture@example.invalid']);
      fs.writeFileSync(path.join(local, 'package.json'), '{"version":"1.62.0"}');
      fs.writeFileSync(path.join(local, 'CHANGELOG.md'), '## v1.62.0\n\nFixture.\n');
      git(local, ['add', '.']); git(local, ['commit', '-m', 'candidate']); git(local, ['remote', 'add', 'origin', upstream]);
      git(local, kind === 'lightweight' ? ['tag', 'v1.62.0'] : ['tag', '-a', 'v1.62.0', '-m', 'remote']);
      git(local, ['push', 'origin', 'refs/tags/v1.62.0']); git(local, ['tag', '-d', 'v1.62.0']);
      if (kind === 'other-target') {
        fs.writeFileSync(path.join(local, 'extra'), 'new'); git(local, ['add', '.']); git(local, ['commit', '-m', 'next']);
      }
      if (kind === 'other-object') git(local, ['tag', '-a', 'v1.62.0', '-m', 'local']);
      const before = git(local, ['ls-remote', 'origin', 'refs/tags/*']), refs = git(local, ['for-each-ref', 'refs/tags']);
      assert.throws(() => W.safeTag(local, 'v1.62.0', git(local, ['rev-parse', 'HEAD']), true), /existing remote tag|objects differ/);
      assert.strictEqual(git(local, ['ls-remote', 'origin', 'refs/tags/*']), before);
      assert.strictEqual(git(local, ['for-each-ref', 'refs/tags']), refs);
    });
  }
  // A user/global ignore setting must not hide tracked member changes.
  const leaf = path.join(base, 'leaf'); fs.mkdirSync(leaf); git(leaf, ['init']);
  git(leaf, ['config', 'user.name', 'Fixture']); git(leaf, ['config', 'user.email', 'fixture@example.invalid']);
  fs.writeFileSync(path.join(leaf, 'tracked'), 'clean'); git(leaf, ['add', '.']); git(leaf, ['commit', '-m', 'leaf']);
  git(repo, ['-c', 'protocol.file.allow=always', 'submodule', 'add', leaf, 'member']);
  git(repo, ['commit', '-am', 'member']);
  git(repo, ['config', 'submodule.member.ignore', 'all']);
  const memberHead = git(repo, ['rev-parse', 'HEAD']);
  test('clean initialized member remains accepted despite ignore configuration', () => W.cleanHead(repo, memberHead));
  test('ignore=all cannot hide a tracked dirty submodule', () => {
    fs.writeFileSync(path.join(repo, 'member/tracked'), 'dirty');
    assert.throws(() => W.cleanHead(repo, memberHead), /dirty/);
    fs.writeFileSync(path.join(repo, 'member/tracked'), 'clean');
  });
  const member = path.join(repo, 'member');
  git(member, ['config', 'user.name', 'Fixture']); git(member, ['config', 'user.email', 'fixture@example.invalid']);
  git(member, ['-c', 'protocol.file.allow=always', 'submodule', 'add', leaf, 'nested']);
  git(member, ['commit', '-am', 'nested']); git(repo, ['commit', '-am', 'nested pin']);
  git(member, ['config', 'submodule.nested.ignore', 'all']);
  const nestedHead = git(repo, ['rev-parse', 'HEAD']);
  test('nested ignore settings cannot hide tracked changes', () => {
    fs.writeFileSync(path.join(member, 'nested/tracked'), 'dirty');
    assert.throws(() => W.cleanHead(repo, nestedHead), /dirty/);
    fs.writeFileSync(path.join(member, 'nested/tracked'), 'clean');
    W.cleanHead(repo, nestedHead);
  });
} finally { fs.rmSync(base, { recursive: true, force: true }); }
console.log(`OK (${checks} checks)`);
