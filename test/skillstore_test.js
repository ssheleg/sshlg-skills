#!/usr/bin/env node
'use strict';
// Fixtures for lib/skillstore.js and the uninstall/backup/wipe/restore commands.
//
// The launcher had install and update and no way back: no uninstall, and no
// recoverable path to clearing the agents' skill stores. Each check here is a
// way the way back becomes the thing that loses data — a wipe over a backup
// that was never verified, an uninstall that deletes a foreign skill on a name
// collision, a restore that "succeeds" while bringing back fewer entries than
// the manifest promises, a dry run that mutates.

const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const S = require('../lib/skillstore.js');
const R = require('../lib/routers.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ---------------------------------------------------------------- pure rules

it('channel candidates: dot-dirs and ~/.config only — never DATA, never our own store', () => {
  const got = S.channelCandidates('/h', ['.claude', '.agents', '.sshlg-skills', '.config', 'DATA', '.gemini'], ['goose']);
  assert.ok(got.includes('/h/.claude/skills') && got.includes('/h/.agents/skills'));
  assert.ok(got.includes('/h/.config/goose/skills'));
  assert.ok(got.includes('/h/.gemini/antigravity/skills'), 'nested channels are known');
  assert.ok(!got.some((p) => p.includes('DATA')), 'a project tree is not an agent channel');
  assert.ok(!got.some((p) => p.includes('.sshlg-skills')), 'the backup store almost became a channel');
});

const IDS = ['vision', 'task-pipeline'];
const MEMBERS = ['super-ux', 'task-pipeline'];

it('a symlink into the family is removable; a symlink elsewhere is a name, not provenance', () => {
  assert.ok(S.classifyFamilyEntry(
    { name: 'vision', isSymlink: true, target: '/h/.agents/skills/vision' }, IDS, MEMBERS).remove);
  assert.ok(S.classifyFamilyEntry(
    { name: 'vision', isSymlink: true, target: '/h/DATA/super-ux/skills/vision' }, IDS, MEMBERS).remove);
  const foreign = S.classifyFamilyEntry(
    { name: 'vision', isSymlink: true, target: '/opt/other/vision' }, IDS, MEMBERS);
  assert.ok(!foreign.remove, 'a foreign skill was deleted on a name collision');
});

it('a real directory is removed only when the lock attributes it to ssheleg', () => {
  assert.ok(S.classifyFamilyEntry(
    { name: 'vision', isSymlink: false, lockRepo: 'ssheleg/super-ux' }, IDS, MEMBERS).remove);
  assert.ok(!S.classifyFamilyEntry(
    { name: 'vision', isSymlink: false, lockRepo: 'other/skills' }, IDS, MEMBERS).remove);
  assert.ok(!S.classifyFamilyEntry(
    { name: 'vision', isSymlink: false }, IDS, MEMBERS).remove,
  'an unattributed real directory was deleted');
  assert.ok(!S.classifyFamilyEntry(
    { name: 'not-ours', isSymlink: true, target: '/h/.agents/skills/vision' }, IDS, MEMBERS).remove);
});

it('the wipe gate: no archive, empty manifest, or a count mismatch each cancel the wipe', () => {
  assert.ok(!S.wipeGate(null).ok);
  assert.ok(!S.wipeGate({ archive: '', manifestTotal: 5, verifiedCount: 5 }).ok);
  assert.ok(!S.wipeGate({ archive: '/a.tar.gz', manifestTotal: 0, verifiedCount: 0 }).ok,
    'a wipe with nothing to restore from was allowed');
  const short = S.wipeGate({ archive: '/a.tar.gz', manifestTotal: 5, verifiedCount: 4 });
  assert.ok(!short.ok && /will not restore/.test(short.reason));
  assert.ok(S.wipeGate({ archive: '/a.tar.gz', manifestTotal: 5, verifiedCount: 5 }).ok);
});

it('restore verification names every channel that came back short', () => {
  const man = S.manifest([{ path: '/h/.claude/skills', entries: ['a', 'b'] },
    { path: '/h/.agents/skills', entries: ['a'] }], 'stamp');
  assert.strictEqual(man.total, 3);
  const bad = S.restoreVerify(man, { '/h/.claude/skills': 1, '/h/.agents/skills': 1 });
  assert.ok(!bad.ok && bad.mismatches.length === 1 && /promises 2, found 1/.test(bad.mismatches[0]));
  assert.ok(S.restoreVerify(man, { '/h/.claude/skills': 2, '/h/.agents/skills': 1 }).ok);
});

it('removeBlock: the sentinel region goes, every byte outside it stays', () => {
  const APPLY = require('../lib/apply.js');
  const src = 'above\n\n' + APPLY.EMPTY_BLOCK + '\nbelow\n';
  const r = R.removeBlock(src);
  assert.ok(r.removed);
  assert.strictEqual(r.text, 'above\n\nbelow\n');
  const untouched = R.removeBlock('no block here\n');
  assert.ok(!untouched.removed && untouched.text === 'no block here\n');
  const half = R.removeBlock('x\n' + R.BEGIN + ' -->\nno end marker\n');
  assert.ok(!half.removed, 'half a block was guessed at');
  const opt = R.removeBlock('a\n<!-- SSHLG:ROUTERS:OPTOUT -->\nb\n');
  assert.ok(opt.removed && opt.text === 'a\nb\n');
});

// ------------------------------------------------------------ end to end

const BIN = path.resolve(__dirname, '..', 'bin', 'sshlg-skills.js');
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'skillstore-'));

function seed() {
  // two channels + the hub, a family skill, a foreign skill, a foreign symlink
  fs.mkdirSync(path.join(HOME, '.agents', 'skills', 'vision'), { recursive: true });
  fs.writeFileSync(path.join(HOME, '.agents', 'skills', 'vision', 'SKILL.md'), '# vision\n');
  fs.mkdirSync(path.join(HOME, '.agents', 'skills', 'foreign-skill'), { recursive: true });
  fs.writeFileSync(path.join(HOME, '.agents', 'skills', 'foreign-skill', 'SKILL.md'), '# foreign\n');
  fs.mkdirSync(path.join(HOME, '.claude', 'skills'), { recursive: true });
  fs.symlinkSync(path.join(HOME, '.agents', 'skills', 'vision'),
    path.join(HOME, '.claude', 'skills', 'vision'));
  fs.mkdirSync(path.join(HOME, '.zed', 'skills'), { recursive: true });
  fs.mkdirSync(path.join(HOME, 'elsewhere', 'vision'), { recursive: true });
  fs.symlinkSync(path.join(HOME, 'elsewhere', 'vision'), path.join(HOME, '.zed', 'skills', 'vision'));
  fs.writeFileSync(path.join(HOME, '.agents', '.skill-lock.json'), JSON.stringify({
    version: 3,
    skills: {
      vision: { source: 'ssheleg/super-ux' },
      'foreign-skill': { source: 'other/skills' },
    },
  }, null, 2));
  const APPLY = require('../lib/apply.js');
  fs.writeFileSync(path.join(HOME, '.claude', 'CLAUDE.md'),
    '# Mine\n\nhand-written above\n\n' + APPLY.EMPTY_BLOCK + '\nhand-written below\n');
  fs.mkdirSync(path.join(HOME, '.cursor', 'rules'), { recursive: true });
  fs.writeFileSync(path.join(HOME, '.cursor', 'rules', 'sshlg-routing.mdc'), '---\nalwaysApply: true\n---\nblock\n');
}

function launcher(args) {
  return spawnSync('node', [BIN, ...args],
    { env: Object.assign({}, process.env, { HOME }), encoding: 'utf8' });
}

function treeHash() {
  return execFileSync('bash', ['-c',
    `cd "${HOME}" && find . -not -path './.sshlg-skills*' -print | LC_ALL=C sort | shasum | cut -d' ' -f1`],
  { encoding: 'utf8' }).trim();
}

seed();

it('e2e: backup → wipe → restore round-trips, symlinks preserved as symlinks', () => {
  const b = launcher(['backup']);
  assert.strictEqual(b.status, 0, b.stdout + b.stderr);
  assert.match(b.stdout, /verified (\d+)\/\1 entr/);
  const w = launcher(['wipe']);
  assert.strictEqual(w.status, 0, w.stdout + w.stderr);
  assert.strictEqual(fs.readdirSync(path.join(HOME, '.agents', 'skills')).length, 0, 'the hub survived the wipe');
  assert.strictEqual(fs.readdirSync(path.join(HOME, '.claude', 'skills')).length, 0);
  const r = launcher(['restore']);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /restore: verified/);
  assert.ok(fs.existsSync(path.join(HOME, '.agents', 'skills', 'vision', 'SKILL.md')));
  assert.ok(fs.lstatSync(path.join(HOME, '.claude', 'skills', 'vision')).isSymbolicLink(),
    'a symlink came back as a copy — the shadow trap, recreated by our own restore');
  assert.ok(fs.existsSync(path.join(HOME, '.agents', 'skills', 'foreign-skill', 'SKILL.md')));
});

it('e2e: uninstall --dry-run renders the plan and mutates NOTHING', () => {
  const before = treeHash();
  const d = launcher(['uninstall', '--dry-run', '--no-claude']);
  assert.strictEqual(d.status, 0, d.stdout + d.stderr);
  assert.match(d.stdout, /nothing executed/);
  assert.strictEqual(treeHash(), before, 'a dry run changed the tree');
});

it('e2e: uninstall removes the family, keeps the stranger, strips the block, spares the prose', () => {
  const u = launcher(['uninstall', '--no-claude']);
  assert.strictEqual(u.status, 0, u.stdout + u.stderr);
  assert.ok(!fs.existsSync(path.join(HOME, '.agents', 'skills', 'vision')), 'the family skill survived');
  assert.ok(!fs.existsSync(path.join(HOME, '.claude', 'skills', 'vision')));
  assert.ok(fs.existsSync(path.join(HOME, '.agents', 'skills', 'foreign-skill')), 'the foreign skill was deleted');
  assert.ok(fs.existsSync(path.join(HOME, '.zed', 'skills', 'vision')),
    'a foreign symlink was deleted on a name collision');
  const lock = JSON.parse(fs.readFileSync(path.join(HOME, '.agents', '.skill-lock.json'), 'utf8'));
  assert.ok(!lock.skills.vision && lock.skills['foreign-skill'], 'the lock was not rewritten correctly');
  const lockCopies = fs.readdirSync(path.join(HOME, '.sshlg-skills', 'backups'))
    .filter((n) => n.includes('skill-lock'));
  assert.ok(lockCopies.length, 'no protect() copy of the lock was taken before the rewrite');
  const md = fs.readFileSync(path.join(HOME, '.claude', 'CLAUDE.md'), 'utf8');
  assert.ok(!md.includes('SSHLG:ROUTERS:BEGIN'), 'the managed block survived');
  assert.ok(md.includes('hand-written above') && md.includes('hand-written below'),
    'uninstall ate the operator\'s own prose');
  assert.ok(!fs.existsSync(path.join(HOME, '.cursor', 'rules', 'sshlg-routing.mdc')));
  const backups = fs.readdirSync(path.join(HOME, '.sshlg-skills', 'backups'));
  assert.ok(backups.some((n) => n.includes('claude_CLAUDE.md') || /CLAUDE/.test(n)),
    `no pre-write copy of CLAUDE.md among: ${backups.join(', ')}`);
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
