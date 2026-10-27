#!/usr/bin/env node
'use strict';
// B-243: a local-scope install record left under a project's OLD path.
//
// When a project folder is renamed and its old name kept as a symlink to the new one, Claude
// Code keeps the record it wrote under the old path beside the live record under the new one.
// Claude matches local scopes by the physical cwd (measured on 2.1.299, B-242), so
// `claude plugin update/uninstall --scope local` can never reach the old record, and `update`
// leaves it as recorded. The hub reports it, read-only, with the exact remedy: a backup of
// installed_plugins.json, then the one record removed. These fixtures run the printed remedy
// against a COPY in a temp directory; the real file is never read or written.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const L = require('../lib/localrecords.js');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
const tmp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-localrec-')));
const realOr = (p) => { try { return fs.realpathSync(p); } catch (_) { return null; } };

/** A renamed project: `old` is a symlink to `live`. */
function renamed() {
  const base = tmp();
  const live = path.join(base, 'hyperframes-agent');
  fs.mkdirSync(live);
  const old = path.join(base, 'heygen-hyperframes-vr');
  fs.symlinkSync(live, old);
  const rec = (scope, projectPath) => Object.assign({ scope, installPath: '/c/x/1.0.0', version: '1.0.0' }, projectPath ? { projectPath } : {});
  const registry = { version: 2, plugins: {
    'figma@claude-plugins-official': [rec('local', old), rec('local', live)],
    'web3d-dev@web3d-dev': [rec('user'), rec('local', live), rec('local', old)],
    'only-old@m': [rec('local', old)],                                         // no live record: not an alias
    'plain@m': [rec('user'), rec('local', live)],
    'gone@m': [rec('local', path.join(base, 'deleted'))],
  } };
  return { base, live, old, registry };
}

it('an old-path record beside the live record is reported, per plugin', () => {
  const { live, old, registry } = renamed();
  const found = L.staleAliases(registry, realOr);
  assert.deepStrictEqual(found.map((a) => [a.plugin, a.projectPath, a.real]), [
    ['figma@claude-plugins-official', old, live], ['web3d-dev@web3d-dev', old, live]]);
});

it('physical paths, a missing folder and an old path with no live record are not aliases', () => {
  const { registry } = renamed();
  const names = L.staleAliases(registry, realOr).map((a) => a.plugin);
  for (const n of ['only-old@m', 'plain@m', 'gone@m']) assert.ok(!names.includes(n), n);
});

it('a malformed registry yields nothing rather than throwing', () => {
  for (const bad of [null, {}, { plugins: null }, { plugins: { x: 'nope' } }, { plugins: { x: [null, { scope: 'local' }] } }]) {
    assert.deepStrictEqual(L.staleAliases(bad, realOr), []);
  }
});

it('the printed remedy backs the file up, then removes exactly that record', () => {
  const { base, live, old, registry } = renamed();
  const file = path.join(base, 'installed_plugins.json');
  fs.writeFileSync(file, JSON.stringify(registry, null, 2));
  const before = fs.readFileSync(file, 'utf8');
  const alias = L.staleAliases(registry, realOr).find((a) => a.plugin === 'figma@claude-plugins-official');
  const lines = L.remedy(file, [alias]);
  const cmd = lines.find((l) => l.startsWith('cp '));
  assert.ok(cmd, lines.join('\n'));
  const r = spawnSync('/bin/sh', ['-c', cmd], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  const backups = fs.readdirSync(base).filter((n) => n.startsWith('installed_plugins.json.bak'));
  assert.strictEqual(backups.length, 1, backups.join(','));
  assert.strictEqual(fs.readFileSync(path.join(base, backups[0]), 'utf8'), before);
  const after = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepStrictEqual(after.plugins['figma@claude-plugins-official'].map((x) => x.projectPath), [live]);
  assert.deepStrictEqual(after.plugins['web3d-dev@web3d-dev'], registry.plugins['web3d-dev@web3d-dev'], 'another plugin changed');
  assert.ok(!fs.readFileSync(file, 'utf8').endsWith('\n'), 'Claude writes no final newline; neither does the remedy');
  assert.ok(lines.some((l) => /[Qq]uit/.test(l)), 'the remedy must say to quit running sessions first');
  assert.ok(lines.join('\n').includes(old), 'the remedy must name the old path');
});

it('one remedy drops every old-path record at once, from one backup', () => {
  const { base, live, registry } = renamed();
  const file = path.join(base, 'installed_plugins.json');
  fs.writeFileSync(file, JSON.stringify(registry, null, 2));
  const before = fs.readFileSync(file, 'utf8');
  const cmd = L.remedy(file, L.staleAliases(registry, realOr)).find((l) => l.startsWith('cp '));
  const r = spawnSync('/bin/sh', ['-c', cmd], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(fs.readFileSync(`${file}.bak-b243`, 'utf8'), before);
  const after = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepStrictEqual(after.plugins['figma@claude-plugins-official'].map((x) => x.projectPath), [live]);
  assert.deepStrictEqual(after.plugins['web3d-dev@web3d-dev'].map((x) => x.projectPath || 'user'), ['user', live]);
  assert.deepStrictEqual(after.plugins['only-old@m'], registry.plugins['only-old@m'], 'a record with no live twin was dropped');
  assert.deepStrictEqual(L.staleAliases(after, realOr), []);
});

it('`hosts` reports the records with the remedy and leaves installed_plugins.json byte for byte', () => {
  const { base, registry } = renamed();
  const home = path.join(base, 'home');
  const file = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(registry, null, 2));
  const sha = () => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const h0 = sha();
  const env = Object.assign({}, process.env, { HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1' });
  delete env.CLAUDE_CONFIG_DIR;
  const r = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: base, env, encoding: 'utf8', timeout: 60000 });
  const out = `${r.stdout}${r.stderr}`;
  assert.strictEqual(r.status, 0, out);
  assert.ok(/2 local install record\(s\) under an old project path/.test(out), out);
  assert.ok(out.includes('figma@claude-plugins-official') && out.includes('web3d-dev@web3d-dev'), out);
  assert.ok(out.includes(`cp -p '${file}'`), out);
  assert.strictEqual(sha(), h0, 'hosts wrote installed_plugins.json');
});

it('`hosts` with no such record says so in one line', () => {
  const base = tmp();
  const home = path.join(base, 'home');
  const file = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ version: 2, plugins: {} }));
  const env = Object.assign({}, process.env, { HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1' });
  delete env.CLAUDE_CONFIG_DIR;
  const r = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: base, env, encoding: 'utf8', timeout: 60000 });
  assert.ok(/no local install record under an old project path/.test(`${r.stdout}`), r.stdout);
});

// --- B-264: a git worktree's or a subdirectory's own local record -----------------------
//
// Claude addresses a local scope at the root of the git repository the folder sits in, and a
// linked worktree at its main working tree (measured on 2.1.299, lib/claude-pinned.js
// `claudeAddress`). A record written under the worktree or the subdirectory itself is never
// read or updated, and B-242 leaves it as recorded. Its remedy differs from an old path's:
// with a record at the root, the dead one is dropped; with none, the root gets its own
// install first, then the dead one is dropped.

/** A repository with a subdirectory and a linked worktree, built without git. */
function repo() {
  const base = tmp();
  const main = path.join(base, 'proj');
  fs.mkdirSync(path.join(main, '.git', 'worktrees', 'wt'), { recursive: true });
  const sub = path.join(main, 'packages', 'app');
  fs.mkdirSync(sub, { recursive: true });
  const wt = path.join(base, 'proj-wt');
  fs.mkdirSync(wt);
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${path.join(main, '.git', 'worktrees', 'wt')}\n`);
  const other = path.join(base, 'other');
  fs.mkdirSync(path.join(other, '.git'), { recursive: true });
  const otherSub = path.join(other, 'docs');
  fs.mkdirSync(otherSub);
  const rec = (scope, projectPath) => Object.assign({ scope, installPath: '/c/x/1.0.0', version: '1.0.0' }, projectPath ? { projectPath } : {});
  const registry = { version: 2, plugins: {
    'a@m': [rec('local', main), rec('local', wt), rec('local', sub)],   // root has a record
    'b@m': [rec('user'), rec('local', otherSub)],                        // root has none
    'c@m': [rec('local', main)],                                         // a root record is live
  } };
  return { base, main, sub, wt, other, otherSub, registry };
}
const address = require('../lib/claude-pinned.js').claudeAddress;

it('B-264: worktree and subdirectory records are reported with the root Claude addresses', () => {
  const { main, sub, wt, other, otherSub, registry } = repo();
  const found = L.rootRecords(registry, realOr, address);
  assert.deepStrictEqual(found.map((r) => [r.plugin, r.projectPath, r.root, r.kind, r.rootRecord]), [
    ['a@m', wt, main, 'worktree', true],
    ['a@m', sub, main, 'subdirectory', true],
    ['b@m', otherSub, other, 'subdirectory', false],
  ]);
  assert.deepStrictEqual(L.staleAliases(registry, realOr), [], 'these are not old paths');
});

it('B-264: a root, a folder outside any repository, a missing path and a malformed registry are not reported', () => {
  const base = tmp();
  const loose = path.join(base, 'loose');
  fs.mkdirSync(loose);
  const registry = { plugins: { 'x@m': [{ scope: 'local', projectPath: loose }, { scope: 'local', projectPath: path.join(base, 'gone') }, { scope: 'user' }] } };
  assert.deepStrictEqual(L.rootRecords(registry, realOr, address), []);
  for (const bad of [null, {}, { plugins: null }, { plugins: { x: 'nope' } }, { plugins: { x: [null, { scope: 'local' }] } }]) {
    assert.deepStrictEqual(L.rootRecords(bad, realOr, address), []);
  }
  assert.deepStrictEqual(L.rootRecords(registry, realOr, () => { throw new Error('boom'); }), [], 'an address probe that throws reports nothing');
});

it('B-264: the remedy installs at a root that has no record, then drops every dead record from one backup', () => {
  const { base, main, other, otherSub, registry } = repo();
  const file = path.join(base, 'installed_plugins.json');
  fs.writeFileSync(file, JSON.stringify(registry, null, 2));
  const before = fs.readFileSync(file, 'utf8');
  const found = L.rootRecords(registry, realOr, address);
  const lines = L.remedy(file, found);
  const install = lines.filter((l) => /claude plugin install/.test(l));
  assert.deepStrictEqual(install, [`cd '${other}' && claude plugin install 'b@m' --scope local`],
    'only the root with no record is installed first');
  assert.ok(lines.findIndex((l) => /claude plugin install/.test(l)) < lines.findIndex((l) => l.startsWith('cp ')),
    'the root install comes before the drop');
  const cmd = lines.find((l) => l.startsWith('cp '));
  const r = spawnSync('/bin/sh', ['-c', cmd], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(fs.readFileSync(`${file}.bak-b243`, 'utf8'), before);
  const after = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepStrictEqual(after.plugins['a@m'].map((x) => x.projectPath), [main]);
  assert.deepStrictEqual(after.plugins['b@m'].map((x) => x.projectPath || 'user'), ['user']);
  assert.deepStrictEqual(after.plugins['c@m'], registry.plugins['c@m']);
  assert.ok(lines.join('\n').includes(otherSub));
});

it('B-264: `hosts` reports worktree and subdirectory records with the remedy, read-only', () => {
  const { base, registry } = repo();
  const home = path.join(base, 'home');
  const file = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(registry, null, 2));
  const sha = () => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const h0 = sha();
  const env = Object.assign({}, process.env, { HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1' });
  delete env.CLAUDE_CONFIG_DIR;
  const r = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: base, env, encoding: 'utf8', timeout: 60000 });
  const out = `${r.stdout}${r.stderr}`;
  assert.strictEqual(r.status, 0, out);
  assert.ok(/3 local install record\(s\) Claude addresses at a repository root/.test(out), out);
  assert.ok(/a git worktree of/.test(out) && /a subdirectory of/.test(out), out);
  assert.ok(/claude plugin install 'b@m' --scope local/.test(out), out);
  assert.ok(out.includes(`cp -p '${file}'`), out);
  assert.ok(!out.includes('—'), 'the report carries an em dash');
  assert.strictEqual(sha(), h0, 'hosts wrote installed_plugins.json');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS: localrecords — ${checks} cases`);
