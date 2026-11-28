#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate(); // B-350: no inherited host config root reaches this suite or its children
// Fixtures for lib/skilldigest.js (B-378): the contract's `skill-digest/1` vectors
// (fabric-agent-contract DEC-0204 and DEC-0206, `fixtures/vectors/skill-digest.json` at 711929e2, vendored
// unchanged in test/fixtures/contract/skill-digest.json) through the hub's route (entries) and
// a node's (folder), then the hub's own pins.
//
// The property under test: the digest the hub prints for a pinned member is the digest a node
// computes over the installed copy of the same bytes, so a device baseline that names it reads
// `current` on a machine that installed the pin and `changed` on one that did not.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const D = require('../lib/skilldigest.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const VECTORS = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'contract', 'skill-digest.json'), 'utf8'));

function bytesOf(file) {
  if (typeof file.text === 'string') return Buffer.from(file.text, 'utf8');
  if (typeof file.hex === 'string') return Buffer.from(file.hex, 'hex');
  return null;
}

function sha(buf) { return `sha256:${crypto.createHash('sha256').update(buf).digest('hex')}`; }

/** The entries a hub would pin for a case: links are a folder-route matter and have none. */
function entriesOf(c) {
  if (Array.isArray(c.entries)) return c.entries;
  const all = c.files.filter((f) => !f.link).map((f) => ({ path: f.path, sha256: sha(bytesOf(f)) }));
  return c.under ? D.entriesUnder(all, c.under) : all;
}

function same(actual, expected) {
  if (expected.digest) {
    assert.strictEqual(actual.canonical, expected.canonical, 'canonical bytes');
    assert.strictEqual(actual.digest, expected.digest, 'digest');
  } else {
    assert.deepStrictEqual(actual, expected);
  }
}

it('the vendored vectors are the 37 cases DEC-0204 and DEC-0206 published', () => {
  assert.strictEqual(VECTORS.cases.length, 37);
  assert.ok(VECTORS.cases.every((c) => ['both', 'entries', 'folder'].includes(c.route)));
});

for (const c of VECTORS.cases) {
  if (c.route === 'both' || c.route === 'entries') {
    it(`entries route: ${c.name}`, () => same(D.skillDigestOfEntries(c.kind, entriesOf(c)), c.expected));
  }
}

/** Writes a case's tree under a fresh folder; null when this platform cannot make its links. */
function materialise(c) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-skilldigest-'));
  const root = path.join(base, 'root');
  fs.mkdirSync(root);
  for (const f of c.outside || []) fs.writeFileSync(path.join(base, f.path), bytesOf(f));
  for (const f of c.files) {
    const at = path.join(root, ...f.path.split('/'));
    fs.mkdirSync(path.dirname(at), { recursive: true });
    if (f.link) {
      try { fs.symlinkSync(f.link, at); } catch (e) { return null; }
    } else {
      fs.writeFileSync(at, bytesOf(f));
    }
  }
  if (c.rootLink) {
    const link = path.join(base, 'linked');
    try { fs.symlinkSync(root, link, 'dir'); } catch (e) { return null; }
    return link;
  }
  return root;
}

for (const c of VECTORS.cases) {
  if (c.route !== 'both' && c.route !== 'folder') continue;
  // A file system that folds a decomposed name into its composed form (or refuses it) cannot
  // hold the NFC cases as written; the entries route above covers them on every host.
  it(`folder route: ${c.name}`, () => {
    const root = materialise(c);
    if (root === null) return; // no symbolic links on this host (Windows without the privilege)
    const names = new Set();
    for (const f of c.files) names.add(f.path.normalize('NFC').toLowerCase());
    if (names.size !== c.files.length) return; // a case-insensitive pair cannot share one folder
    same(D.skillDigestOfFolder(c.kind, root), c.expected);
  });
}

it('the folder route refuses a missing root as unreadable, never as an empty set', () => {
  assert.deepStrictEqual(D.skillDigestOfFolder('skill', path.join(os.tmpdir(), 'no-such-root-b378')), { unknown: 'unreadable', path: '' });
});

/* -- the hub's own pins --------------------------------------------------- */

const PINS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'claude-plugin-pins.json'), 'utf8'));

it('every pinned member has a plugin digest and at least one skill digest', () => {
  for (const m of PINS.members) {
    const r = D.memberDigests(m);
    assert.ok(/^sha256:[a-f0-9]{64}$/.test(r.plugin.digest || ''), `${m.name}: ${JSON.stringify(r.plugin)}`);
    assert.ok(r.skills.length > 0, `${m.name} has no skills/<id>/SKILL.md in its pin`);
    for (const s of r.skills) assert.ok(/^sha256:[a-f0-9]{64}$/.test(s.digest || ''), `${m.name}/${s.id}: ${JSON.stringify(s)}`);
  }
});

it('a folder without SKILL.md under skills/ is not a skill (super-ux skills/references)', () => {
  const ux = PINS.members.find((m) => m.name === 'super-ux');
  const ids = D.memberDigests(ux).skills.map((s) => s.id);
  assert.ok(!ids.includes('references'), ids.join(','));
  assert.ok(ids.includes('copywriting'), ids.join(','));
});

it('a pinned member installed byte for byte gives the printed digest (both routes agree)', () => {
  // Rebuild a small member from its pin: every file's bytes are unknown here, so the fixture
  // writes bytes first and pins their hashes, the way claude-plugin-pins.json is made.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-skilldigest-pin-'));
  const tree = {
    '.claude-plugin/plugin.json': '{"name":"demo","version":"1.0.0"}\n',
    'skills/demo/SKILL.md': '---\nname: demo\n---\n',
    'skills/demo/references/a.md': 'a\n',
    'README.md': '# demo\n',
  };
  const files = [];
  for (const [rel, text] of Object.entries(tree)) {
    const at = path.join(base, ...rel.split('/'));
    fs.mkdirSync(path.dirname(at), { recursive: true });
    fs.writeFileSync(at, text);
    files.push({ path: rel, sha256: crypto.createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text) });
  }
  const printed = D.memberDigests({ name: 'demo', version: '1.0.0', commit: 'x', files });
  assert.strictEqual(printed.plugin.digest, D.skillDigestOfFolder('plugin', base).digest);
  assert.strictEqual(printed.skills[0].digest, D.skillDigestOfFolder('skill', path.join(base, 'skills', 'demo')).digest);
});

it('Claude Code runtime state in an installed copy leaves the printed digest unchanged (DEC-0206)', () => {
  // Measured 2026-11-28 (request 6418d31f): a cached plugin version carries .in_use/<pid> files at
  // its root and __pycache__/*.pyc next to the scripts its hooks ran; .orphaned_at marks a version
  // to remove. None of them is the plugin's content.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-skilldigest-cc-'));
  const tree = {
    '.claude-plugin/plugin.json': '{"name":"demo","version":"1.0.0"}\n',
    'skills/demo/SKILL.md': '---\nname: demo\n---\n',
    'skills/demo/scripts/run.py': 'print(1)\n',
  };
  const files = [];
  for (const [rel, text] of Object.entries(tree)) {
    const at = path.join(base, ...rel.split('/'));
    fs.mkdirSync(path.dirname(at), { recursive: true });
    fs.writeFileSync(at, text);
    files.push({ path: rel, sha256: crypto.createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text) });
  }
  const printed = D.memberDigests({ name: 'demo', version: '1.0.0', commit: 'x', files });
  fs.mkdirSync(path.join(base, '.in_use'));
  fs.writeFileSync(path.join(base, '.in_use', '4242'), '');
  fs.writeFileSync(path.join(base, '.orphaned_at'), '1764340000000');
  fs.mkdirSync(path.join(base, 'skills', 'demo', 'scripts', '__pycache__'));
  fs.writeFileSync(path.join(base, 'skills', 'demo', 'scripts', '__pycache__', 'run.cpython-312.pyc'), Buffer.from([0x0d, 0x0d]));
  assert.strictEqual(D.skillDigestOfFolder('plugin', base).digest, printed.plugin.digest);
  assert.strictEqual(D.skillDigestOfFolder('skill', path.join(base, 'skills', 'demo')).digest, printed.skills[0].digest);
  // The same names inside a skill root stay listed: only a plugin's root holds Claude Code's state.
  fs.mkdirSync(path.join(base, 'skills', 'demo', '.in_use'));
  fs.writeFileSync(path.join(base, 'skills', 'demo', '.in_use', '1'), '');
  assert.notStrictEqual(D.skillDigestOfFolder('skill', path.join(base, 'skills', 'demo')).digest, printed.skills[0].digest);
});

it('a pin with a bare hex that is not 64 lower-case digits reads input-invalid, never a digest', () => {
  const r = D.memberDigests({ name: 'bad', files: [{ path: '.claude-plugin/plugin.json', sha256: 'ABC' }] });
  assert.deepStrictEqual(r.plugin, { unknown: 'input-invalid' });
});

it('a member without files reads input-invalid', () => {
  assert.deepStrictEqual(D.memberDigests({ name: 'empty' }).plugin, { unknown: 'input-invalid' });
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
