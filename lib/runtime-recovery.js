'use strict';
// Optional POSIX recovery capability. Ordinary runtime writers need only Node.
// The permanent coordinator inode is NEVER removed, replaced, or chmod'ed.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const LOCK = '.sync.lock';
const COORDINATOR = '.recovery-coordinator';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function bootIdentity() {
  if (process.platform === 'linux') {
    const boot = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
    if (!/^[a-f0-9-]{36}$/i.test(boot)) throw Error('boot identity unavailable');
    return hash(boot + '\n' + fs.readlinkSync('/proc/self/ns/pid'));
  }
  if (process.platform === 'darwin') {
    const r = spawnSync('/usr/sbin/sysctl', ['-n', 'kern.bootsessionuuid'], { encoding: 'utf8', timeout: 3000, maxBuffer: 4096 });
    if (r.error || r.signal || r.status !== 0 || !/^[a-f0-9-]{36}$/i.test(r.stdout.trim())) throw Error('boot identity unavailable');
    return hash(r.stdout.trim());
  }
  throw Error('recovery requires supported POSIX process identity');
}
function canonical(root) {
  const absolute = path.resolve(root), real = fs.realpathSync.native(absolute), s = fs.lstatSync(real);
  if (real !== absolute || !s.isDirectory() || !Number.isSafeInteger(s.dev) || !Number.isSafeInteger(s.ino)
      || s.uid !== process.getuid() || (s.mode & 0o022)) throw Error('runtime root must be canonical, owned, and not writable by others');
  return { root: real, dev: s.dev, ino: s.ino };
}
function record(root) {
  // Unsupported platforms still create an ordinary unbound lock. Recovery never
  // upgrades that absence of evidence into a dead-holder claim.
  let identity = null;
  try { const real = fs.realpathSync.native(root), bound = canonical(real); identity = { version: 1, ...bound, boot: bootIdentity(), uid: process.getuid() }; } catch (_) { /* UNKNOWN */ }
  return { pid: process.pid, nonce: crypto.randomBytes(16).toString('hex'), identity };
}
function snapshot(file) {
  let s;
  try { s = fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  if (!s.isFile() || s.isSymbolicLink() || !Number.isSafeInteger(s.dev) || !Number.isSafeInteger(s.ino)
      || s.nlink !== 1 || s.uid !== process.getuid() || (s.mode & 0o777) !== 0o600 || s.size > 16384) throw Error('unsafe recovery metadata');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const held = fs.fstatSync(fd);
    if (held.ino !== s.ino || held.dev !== s.dev) throw Error('recovery metadata changed');
    const bytes = fs.readFileSync(fd);
    return { digest: hash(bytes), dev: s.dev, ino: s.ino, bytes };
  } finally { fs.closeSync(fd); }
}
function observe(root) {
  const bound = canonical(root), snap = snapshot(path.join(root, LOCK));
  if (!snap) return { ...bound, state: 'NO_LOCK', expected: 'absent', holder: null };
  let data;
  try {
    const text = snap.bytes.toString('utf8');
    if (!Buffer.from(text).equals(snap.bytes)) throw Error('invalid UTF-8');
    data = require('./json-spans').parse(text).data;
  } catch (_) { return { ...bound, state: 'UNKNOWN', expected: snap.digest, holder: null }; }
  const id = data && data.identity;
  const keys = (obj, expected) => obj && !Array.isArray(obj) && Object.keys(obj).sort().join(',') === expected.slice().sort().join(',');
  if (!keys(data, ['pid', 'nonce', 'identity']) || !keys(id, ['version', 'root', 'dev', 'ino', 'boot', 'uid'])
      || id.version !== 1 || id.root !== bound.root || id.dev !== bound.dev || id.ino !== bound.ino || id.uid !== process.getuid()
      || id.boot !== bootIdentity() || !Number.isSafeInteger(data.pid) || data.pid < 1
      || !/^[a-f0-9]{32}$/.test(data.nonce)) return { ...bound, state: 'UNKNOWN', expected: snap.digest, holder: null };
  let state = 'BUSY';
  try { process.kill(data.pid, 0); } catch (e) { state = e.code === 'ESRCH' ? 'DEAD' : 'UNKNOWN'; }
  return { ...bound, state, expected: snap.digest, holder: data.pid, snap };
}
function inspect(root) {
  try {
    const { snap, ...result } = observe(root);
    let journalPresent = false;
    try {
      const journal = fs.lstatSync(path.join(root, '.switch-journal.json'));
      if (!journal.isFile() || journal.isSymbolicLink() || journal.nlink !== 1 || journal.uid !== process.getuid()) throw Error('unsafe runtime journal');
      journalPresent = true;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
    return { ok: true, ...result, state: result.state === 'NO_LOCK' && journalPresent ? 'PENDING_JOURNAL' : result.state, journalPresent };
  } catch (e) { return { ok: false, state: 'UNKNOWN', reason: e.message }; }
}
// exec replaces Python with Node at the same PID. The inherited open file
// description retains flock until the worker exits, including SIGKILL. No
// supervisor may unlock while a payload writer remains alive.
const HELPER = String.raw`
import os, sys, stat, fcntl
try:
    root, node, module, expected = sys.argv[1:]
    if os.path.realpath(root) != root: raise ValueError('runtime root changed')
    r = os.lstat(root)
    if not stat.S_ISDIR(r.st_mode) or r.st_uid != os.getuid() or r.st_mode & 0o022: raise ValueError('unsafe runtime root')
    p = os.path.join(root, '.recovery-coordinator')
    try:
        prior = os.lstat(p)
    except FileNotFoundError:
        prior = None
    if prior and (not stat.S_ISREG(prior.st_mode) or prior.st_nlink != 1 or prior.st_uid != os.getuid() or stat.S_IMODE(prior.st_mode) != 0o600): raise ValueError('unsafe recovery coordinator')
    fd = os.open(p, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    s = os.fstat(fd)
    if not stat.S_ISREG(s.st_mode) or s.st_nlink != 1 or s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) != 0o600: raise ValueError('unsafe recovery coordinator')
    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    t = os.lstat(p)
    if (s.st_dev, s.st_ino) != (t.st_dev, t.st_ino): raise ValueError('recovery coordinator changed')
    os.set_inheritable(fd, True)
    os.execv(node, [node, module, '--worker', root, expected, str(fd), str(r.st_dev), str(r.st_ino)])
except Exception as e:
    print('recovery admission refused: ' + type(e).__name__, file=sys.stderr)
    sys.exit(2)
`;
function sameRoot(a, b) { return a.root === b.root && a.dev === b.dev && a.ino === b.ino; }
function worker(root, expected, fd, dev, ino) {
  const initial = canonical(root);
  if (initial.dev !== dev || initial.ino !== ino) throw Error('runtime root changed after coordinator admission');
  const held = fs.fstatSync(fd), file = path.join(root, COORDINATOR);
  function fence() {
    if (!sameRoot(initial, canonical(root))) throw Error('runtime root changed during recovery');
    const current = fs.lstatSync(file);
    const fresh = fs.fstatSync(fd);
    if (!fresh.isFile() || !Number.isSafeInteger(fresh.dev) || !Number.isSafeInteger(fresh.ino)
        || fresh.nlink !== 1 || fresh.uid !== process.getuid() || (fresh.mode & 0o777) !== 0o600
        || current.isSymbolicLink() || current.nlink !== 1 || current.ino !== held.ino || current.dev !== held.dev) throw Error('recovery coordinator changed');
  }
  fence();
  // Prove/acquire exclusion on THIS inherited open file description, not merely
  // on the pathname. Closing the short child never unlocks the worker's copy.
  // A separate description held by another worker must refuse this acquisition.
  const locked = spawnSync('/usr/bin/python3', ['-I', '-c', String.raw`
import sys, fcntl
try:
    fcntl.flock(3, fcntl.LOCK_EX | fcntl.LOCK_NB)
except OSError:
    sys.exit(2)
`, file], { stdio: ['ignore', 'pipe', 'pipe', fd], timeout: 3000, maxBuffer: 4096, encoding: 'utf8' });
  if (locked.error || locked.signal || locked.status !== 0) throw Error('coordinator exclusion not demonstrated');
  fence();
  const observation = observe(root);
  if (observation.expected !== expected) throw Error('expected runtime lock changed; inspect again');
  if (!['DEAD', 'NO_LOCK'].includes(observation.state)) throw Error('runtime holder is alive or unknown');
  if (observation.state === 'DEAD') {
    const again = observe(root); fence();
    if (again.state !== 'DEAD' || again.expected !== expected || again.snap.dev !== observation.snap.dev || again.snap.ino !== observation.snap.ino) throw Error('runtime holder changed before retirement');
    fs.unlinkSync(path.join(root, LOCK));
  }
  // A normal writer can win this wx acquisition. Never remove that successor.
  fence();
  const result = require('./runtime').recover(root);
  return { ...result, state: result.ok ? (result.recovered ? 'RECOVERED' : 'NO_PENDING_JOURNAL') : 'UNRESOLVED', retired: observation.state === 'DEAD' };
}
function recover(root, expected) {
  if (typeof expected !== 'string' || !/^(absent|[a-f0-9]{64})$/.test(expected)) return { ok: false, state: 'UNKNOWN', reason: 'inspect first and supply the exact expected lock digest' };
  const view = inspect(root);
  if (!view.ok || !['DEAD', 'NO_LOCK', 'PENDING_JOURNAL'].includes(view.state) || view.expected !== expected) return { ok: false, state: view.state, reason: 'runtime holder or expected lock is not admitted' };
  // Fixed system capability, never a PATH-selected arbitrary executable.
  const r = spawnSync('/usr/bin/python3', ['-I', '-c', HELPER, view.root, process.execPath, __filename, expected], { encoding: 'utf8', timeout: 30000, maxBuffer: 65536 });
  if (r.error || r.signal || r.status !== 0) return { ok: false, state: 'UNRESOLVED', reason: 'recovery capability refused or interrupted; inspect again', exit: r.status, signal: r.signal || null, detail: (r.stderr || '').trim().slice(0, 1024) };
  try {
    const value = JSON.parse(r.stdout);
    if (!value || typeof value.ok !== 'boolean' || typeof value.state !== 'string') throw Error('invalid result');
    return value;
  } catch (_) { return { ok: false, state: 'UNKNOWN', reason: 'recovery result unreadable; inspect again' }; }
}
module.exports = { inspect, recover, record };
if (require.main === module) {
  try {
    if (process.argv.length !== 8 || process.argv[2] !== '--worker') throw Error('internal worker requires coordinator admission');
    const [, , , root, expected, fd, dev, ino] = process.argv;
    const result = worker(root, expected, Number(fd), Number(dev), Number(ino));
    process.stdout.write(JSON.stringify(result) + '\n');
    if (!result.ok) process.exitCode = 2;
  } catch (e) { process.stderr.write('runtime recovery refused: ' + e.message + '\n'); process.exitCode = 2; }
}
