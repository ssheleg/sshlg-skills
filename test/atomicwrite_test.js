#!/usr/bin/env node
'use strict';
// Fixtures for lib/atomicwrite.js (B-260): the one helper every write to an
// operator-owned file goes through after `apply.protect()` took the copy.
// A crash between writing and renaming must leave the original byte for byte,
// and no half-written file under the name the host reads. Every fixture works
// in a temp directory; none can reach the real $HOME.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const atomic = require('../lib/atomicwrite.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-atomic-'));
const strays = (dir) => fs.readdirSync(dir).filter((n) => n.endsWith('.tmp'));
const mode = (f) => fs.statSync(f).mode & 0o7777;

it('creates a missing file with the umask-shaped default mode', () => {
  const d = tmp(), f = path.join(d, 'AGENTS.md');
  atomic.write(f, 'hello\n');
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'hello\n');
  const umask = process.umask();
  assert.strictEqual(mode(f), 0o666 & ~umask);
  assert.deepStrictEqual(strays(d), []);
});

it('applies opts.mode only when it creates the file', () => {
  const d = tmp(), f = path.join(d, 'a.md');
  atomic.write(f, 'one', { mode: 0o600 });
  assert.strictEqual(mode(f), 0o600);
  fs.chmodSync(f, 0o640);
  atomic.write(f, 'two', { mode: 0o600 });
  assert.strictEqual(mode(f), 0o640, 'an existing file keeps its own mode');
});

it('replaces an existing file and keeps its mode', () => {
  const d = tmp(), f = path.join(d, 'CLAUDE.md');
  fs.writeFileSync(f, 'old');
  fs.chmodSync(f, 0o640);
  atomic.write(f, 'new');
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'new');
  assert.strictEqual(mode(f), 0o640);
  assert.deepStrictEqual(strays(d), []);
});

it('writes through a symlink to its target and leaves the link a link', () => {
  const d = tmp(), real = path.join(d, 'real', 'AGENTS.md'), link = path.join(d, 'link.md');
  fs.mkdirSync(path.dirname(real));
  fs.writeFileSync(real, 'old');
  fs.symlinkSync(real, link);
  atomic.write(link, 'new');
  assert.ok(fs.lstatSync(link).isSymbolicLink(), 'the symlink was replaced by a regular file');
  assert.strictEqual(fs.readlinkSync(link), real);
  assert.strictEqual(fs.readFileSync(real, 'utf8'), 'new');
  assert.deepStrictEqual(strays(d), []);
  assert.deepStrictEqual(strays(path.dirname(real)), []);
});

it('a dangling symlink is refused and left as it is', () => {
  const d = tmp(), link = path.join(d, 'link.md');
  fs.symlinkSync(path.join(d, 'nowhere.md'), link);
  assert.throws(() => atomic.write(link, 'x'), /symlink/);
  assert.ok(fs.lstatSync(link).isSymbolicLink());
  assert.ok(!fs.existsSync(path.join(d, 'nowhere.md')));
});

it('a crash between write and rename leaves the original intact and no temp file', () => {
  const d = tmp(), f = path.join(d, 'CLAUDE.md');
  fs.writeFileSync(f, 'ORIGINAL BYTES\n');
  const rename = fs.renameSync;
  fs.renameSync = () => { throw Object.assign(new Error('simulated crash'), { code: 'EIO' }); };
  try { assert.throws(() => atomic.write(f, 'NEW'), /simulated crash/); }
  finally { fs.renameSync = rename; }
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'ORIGINAL BYTES\n');
  assert.deepStrictEqual(strays(d), []);
});

it('a failed flush to disk leaves the original intact and no temp file', () => {
  const d = tmp(), f = path.join(d, 'CLAUDE.md');
  fs.writeFileSync(f, 'ORIGINAL');
  const fsync = fs.fsyncSync;
  fs.fsyncSync = () => { throw Object.assign(new Error('simulated ENOSPC'), { code: 'ENOSPC' }); };
  try { assert.throws(() => atomic.write(f, 'NEW'), /ENOSPC/); }
  finally { fs.fsyncSync = fsync; }
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'ORIGINAL');
  assert.deepStrictEqual(strays(d), []);
});

it('beforeRename sees the complete temp file and can still cancel the replacement', () => {
  const d = tmp(), f = path.join(d, 'x.md');
  fs.writeFileSync(f, 'ORIGINAL');
  let seen = null;
  assert.throws(() => atomic.write(f, 'NEW', { beforeRename: (t) => { seen = fs.readFileSync(t, 'utf8'); throw new Error('target changed'); } }), /target changed/);
  assert.strictEqual(seen, 'NEW');
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'ORIGINAL');
  assert.deepStrictEqual(strays(d), []);
});

it('a read-only target is refused rather than bypassed by the rename', () => {
  if (process.getuid && process.getuid() === 0) return;   // root writes anything
  const d = tmp(), f = path.join(d, 'ro.md');
  fs.writeFileSync(f, 'KEEP');
  fs.chmodSync(f, 0o444);
  assert.throws(() => atomic.write(f, 'NEW'), (e) => e.code === 'EACCES');
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'KEEP');
  assert.deepStrictEqual(strays(d), []);
});

it('a directory at the path is refused', () => {
  const d = tmp(), f = path.join(d, 'dir.md');
  fs.mkdirSync(f);
  assert.throws(() => atomic.write(f, 'x'), /not a regular file/);
  assert.ok(fs.statSync(f).isDirectory());
});

it('buffers are written byte for byte', () => {
  const d = tmp(), f = path.join(d, 'b.bin');
  const bytes = Buffer.from([0, 1, 2, 0xff, 0xfe]);
  atomic.write(f, bytes);
  assert.ok(fs.readFileSync(f).equals(bytes));
});

it('three writes of the same text leave the same bytes (idempotent)', () => {
  const d = tmp(), f = path.join(d, 'same.md');
  const hashes = [];
  for (let i = 0; i < 3; i += 1) {
    atomic.write(f, 'stable\n');
    hashes.push(require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex'));
  }
  assert.strictEqual(new Set(hashes).size, 1);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
