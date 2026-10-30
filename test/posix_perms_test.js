'use strict';
// Windows has no POSIX mode bits worth reading: Node reports 0o666 for files, fs.chmod only
// toggles read-only, and process.getuid does not exist. Reported from a 1.84.0 install
// (2026-10-28): every write behind a backup refused with "backup retention storage is not
// private and owned". These cases run the Windows branch on any machine by overriding
// process.platform and by widening every mode the way Windows reports it.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

let cases = 0;
function test(name, fn) { fn(); cases++; console.log(`ok ${name}`); }

const P = require('../lib/posix-perms.js');

test('a group-readable mode is private on Windows and not on POSIX', () => {
  assert.strictEqual(P.isPrivate({ mode: 0o100666 }, 0o077, 'win32'), true);
  assert.strictEqual(P.isPrivate({ mode: 0o100666 }, 0o077, 'darwin'), false);
  assert.strictEqual(P.isPrivate({ mode: 0o100600 }, 0o077, 'linux'), true);
});

test('ownership is not judged by uid on Windows', () => {
  assert.strictEqual(P.ownedByMe({ uid: 0 }, 'win32'), true);
  if (typeof process.getuid === 'function') {
    assert.strictEqual(P.ownedByMe({ uid: process.getuid() + 1 }, 'darwin'), false);
  }
});

test('an executable on Windows is found by its PATHEXT extension, on POSIX by its exec bit', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'perms-path-'));
  fs.writeFileSync(path.join(d, 'codex.cmd'), '@echo off\n');
  fs.writeFileSync(path.join(d, 'plain'), 'x');
  // Windows file names are case-insensitive, so PATHEXT's `.CMD` names codex.cmd
  assert.strictEqual(String(P.findExecutable('codex', [d], { PATHEXT: '.EXE;.CMD' }, 'win32')).toLowerCase(), path.join(d, 'codex.cmd').toLowerCase());
  assert.strictEqual(P.findExecutable('plain', [d], {}, 'win32'), null, 'no extension is not an executable on Windows');
  // The exec-bit half needs a POSIX file system: Windows has no exec bit to set (CI windows job).
  if (process.platform === 'win32') return;
  fs.writeFileSync(path.join(d, 'tool'), '#!/bin/sh\n'); fs.chmodSync(path.join(d, 'tool'), 0o755);
  assert.strictEqual(P.findExecutable('tool', [d], {}, 'darwin'), path.join(d, 'tool'));
  fs.chmodSync(path.join(d, 'tool'), 0o644);
  assert.strictEqual(P.findExecutable('tool', [d], {}, 'darwin'), null);
});

// The real failure, end to end: protect() takes a backup through the retention store.
function withWindowsModes(platform, fn) {
  const real = { lstat: fs.lstatSync, stat: fs.statSync, fstat: fs.fstatSync };
  const widen = (s) => { if (s && typeof s.mode === 'number') { s.mode |= 0o066; } return s; };
  const desc = Object.getOwnPropertyDescriptor(process, 'platform');
  fs.lstatSync = (...a) => widen(real.lstat(...a));
  fs.statSync = (...a) => widen(real.stat(...a));
  fs.fstatSync = (...a) => widen(real.fstat(...a));
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
  try { return fn(); } finally {
    fs.lstatSync = real.lstat; fs.statSync = real.stat; fs.fstatSync = real.fstat;
    Object.defineProperty(process, 'platform', desc);
  }
}
function freshHome() {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'perms-home-'));
  fs.mkdirSync(path.join(h, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(h, '.claude', 'CLAUDE.md'), '# mine\n');
  return h;
}

test('with Windows-shaped modes, protect() takes its backup on win32', () => {
  for (const k of Object.keys(require.cache)) if (/[\\/]lib[\\/]/.test(k)) delete require.cache[k];
  const h = freshHome();
  const r = withWindowsModes('win32', () => require('../lib/apply.js').protect(path.join(h, '.claude', 'CLAUDE.md'), { home: h }));
  assert.notStrictEqual(r.action, 'backup-failed', JSON.stringify(r));
});

test('the same modes on POSIX still refuse: the control that shows the guard is live', () => {
  for (const k of Object.keys(require.cache)) if (/[\\/]lib[\\/]/.test(k)) delete require.cache[k];
  const h = freshHome();
  const r = withWindowsModes(process.platform === 'win32' ? 'linux' : process.platform,
    () => require('../lib/apply.js').protect(path.join(h, '.claude', 'CLAUDE.md'), { home: h }));
  assert.strictEqual(r.action, 'backup-failed', JSON.stringify(r));
  assert.match(String(r.error), /not private and owned/);
});

console.log(`PASS: posix perms — ${cases} cases`);
