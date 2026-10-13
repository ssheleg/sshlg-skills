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
      || s.uid !== process.getuid()) throw Error('runtime root must be canonical and owned by this user');
  // Writers leave identity empty under such a root, so its locks stay UNKNOWN until
  // they are released; the remedy only binds locks written after it.
  if (s.mode & 0o022) throw Error(`runtime root is writable by others; run \`chmod go-w ${real}\` so new locks can be bound`);
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
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const held = fs.fstatSync(fd);
    if (!held.isFile() || held.ino !== s.ino || held.dev !== s.dev) throw Error('recovery metadata changed');
    const bytes = fs.readFileSync(fd);
    return { digest: hash(bytes), dev: s.dev, ino: s.ino, bytes };
  } finally { fs.closeSync(fd); }
}
const UNBOUND = 'lock is not bound to this boot, user and runtime root (an older or unbound writer); recovery cannot prove its holder dead, so wait for it to be released';
function observe(root) {
  const bound = canonical(root), snap = snapshot(path.join(root, LOCK));
  if (!snap) return { ...bound, state: 'NO_LOCK', expected: 'absent', holder: null };
  let data;
  try {
    const text = snap.bytes.toString('utf8');
    if (!Buffer.from(text).equals(snap.bytes)) throw Error('invalid UTF-8');
    data = require('./json-spans').parse(text).data;
  } catch (_) { return { ...bound, state: 'UNKNOWN', expected: snap.digest, holder: null, reason: UNBOUND }; }
  const id = data && data.identity;
  const keys = (obj, expected) => obj && !Array.isArray(obj) && Object.keys(obj).sort().join(',') === expected.slice().sort().join(',');
  if (!keys(data, ['pid', 'nonce', 'identity']) || !keys(id, ['version', 'root', 'dev', 'ino', 'boot', 'uid'])
      || id.version !== 1 || id.root !== bound.root || id.dev !== bound.dev || id.ino !== bound.ino || id.uid !== process.getuid()
      || id.boot !== bootIdentity() || !Number.isSafeInteger(data.pid) || data.pid < 1
      || !/^[a-f0-9]{32}$/.test(data.nonce)) return { ...bound, state: 'UNKNOWN', expected: snap.digest, holder: null, reason: UNBOUND };
  let state = 'BUSY';
  try { process.kill(data.pid, 0); } catch (e) { state = e.code === 'ESRCH' ? 'DEAD' : 'UNKNOWN'; }
  const reason = state === 'BUSY' ? `runtime writer pid ${data.pid} is alive; wait for it to finish, then inspect again`
    : state === 'UNKNOWN' ? `cannot signal pid ${data.pid}, so its holder cannot be proven dead` : null;
  return { ...bound, state, expected: snap.digest, holder: data.pid, reason, snap };
}
// Writers bind the resolved root (record), so callers resolve it once here: a home
// reached through a symlink is ordinary, not a different runtime.
function resolve(root) {
  try { return { root: fs.realpathSync.native(path.resolve(root)) }; }
  catch (e) {
    if (e.code !== 'ENOENT') throw e;
    return { missing: { ok: false, state: 'NOT_INSTALLED', reason: `no hook runtime at ${path.resolve(root)}; \`npx sshlg-skills hooks install\` creates it`, expected: null, holder: null } };
  }
}
function inspect(given) {
  try {
    const { root, missing } = resolve(given);
    if (missing) return missing;
    const { snap, ...result } = observe(root);
    let journalPresent = false;
    try {
      const journal = fs.lstatSync(path.join(root, '.switch-journal.json'));
      if (!journal.isFile() || journal.isSymbolicLink() || journal.nlink !== 1 || journal.uid !== process.getuid()) throw Error('unsafe runtime journal');
      journalPresent = true;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
    return { ok: true, reason: null, ...result, state: result.state === 'NO_LOCK' && journalPresent ? 'PENDING_JOURNAL' : result.state, journalPresent };
  } catch (e) { return { ok: false, state: 'UNKNOWN', reason: e.message, expected: null, holder: null }; }
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
const progress = { retired: false };
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
    fs.unlinkSync(path.join(root, LOCK)); progress.retired = true;
  }
  // A normal writer can win this wx acquisition. Never remove that successor.
  fence();
  const result = require('./runtime').recover(root);
  return { ...result, state: result.ok ? (result.recovered ? 'RECOVERED' : 'NO_PENDING_JOURNAL') : 'UNRESOLVED', retired: observation.state === 'DEAD' };
}
// Every recover result carries recovered/retired: false when nothing ran, null when
// a worker may have acted and did not report what it did.
const refused = (state, reason, extra) => ({ ok: false, state, reason, recovered: false, retired: false, restored: [], ...extra });
function recover(root, expected) {
  if (typeof expected !== 'string' || !/^(absent|[a-f0-9]{64})$/.test(expected)) return refused('UNKNOWN', 'inspect first and supply the exact expected lock digest');
  const view = inspect(root);
  if (!view.ok) return refused(view.state, view.reason);
  if (view.expected !== expected) return refused(view.state, `the lock changed since inspection (now ${view.expected}); inspect again and pass that digest`, { expected: view.expected });
  if (!['DEAD', 'NO_LOCK', 'PENDING_JOURNAL'].includes(view.state)) return refused(view.state, view.reason, { holder: view.holder });
  // Fixed system capability, never a PATH-selected arbitrary executable.
  const r = spawnSync('/usr/bin/python3', ['-I', '-c', HELPER, view.root, process.execPath, __filename, expected], { encoding: 'utf8', timeout: 30000, maxBuffer: 65536 });
  const detail = (r.stderr || '').trim().slice(0, 1024);
  if (r.error && r.error.code === 'ENOENT') return refused('UNRESOLVED', 'recovery needs /usr/bin/python3 (on macOS, the Command Line Tools: `xcode-select --install`); nothing was changed', { exit: null, signal: null, detail });
  let value = null;
  try {
    value = JSON.parse(r.stdout);
    if (!value || typeof value.ok !== 'boolean' || typeof value.state !== 'string' || typeof value.retired !== 'boolean') value = null;
  } catch (_) { value = null; }
  // The worker's own refusal names what it did; success must also exit 0.
  if (value && !r.error && !r.signal && (r.status === 0 ? value.ok : r.status === 2 && !value.ok)) return { ...value, exit: r.status, detail };
  if (!r.error && !r.signal && r.status === 2 && /^recovery admission refused/.test(detail)) return refused('UNRESOLVED', 'recovery admission refused before any change; inspect again', { exit: 2, signal: null, detail });
  if (!r.error && !r.signal && r.status !== 0 && !r.stdout && /xcode-select|developer tools/i.test(detail)) return refused('UNRESOLVED', 'recovery needs /usr/bin/python3, which is only the Command Line Tools stub here: run `xcode-select --install`; nothing was changed', { exit: r.status, signal: null, detail });
  return { ok: false, state: 'UNRESOLVED', reason: 'recovery was interrupted or its result is unreadable; inspect again', recovered: null, retired: null, restored: null, exit: r.status, signal: r.signal || null, detail };
}
module.exports = { inspect, recover, record };
if (require.main === module) {
  try {
    if (process.argv.length !== 8 || process.argv[2] !== '--worker') throw Error('internal worker requires coordinator admission');
    const [, , , root, expected, fd, dev, ino] = process.argv;
    const result = worker(root, expected, Number(fd), Number(dev), Number(ino));
    process.stdout.write(JSON.stringify({ reason: null, ...result }) + '\n');
    if (!result.ok) process.exitCode = 2;
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, state: 'UNRESOLVED', reason: 'runtime recovery refused: ' + e.message, recovered: false, restored: [], retired: progress.retired }) + '\n');
    process.exitCode = 2;
  }
}
