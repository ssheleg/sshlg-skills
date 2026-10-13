'use strict';
// A per-host write-ahead receipt. Only fingerprints and ownership are journalled:
// host settings may contain secrets, so their bytes live only in protected backups.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const apply = require('./apply.js');
const HOSTS = ['claude', 'codex', 'gemini', 'pi', 'opencode', 'hermes'];
const hash = (text) => text === null ? null : crypto.createHash('sha256').update(text).digest('hex');
function read(file) {
  try { return fs.readFileSync(file, 'utf8'); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
/** Missing policy is distinct from unreadable or malformed policy. Never log its bytes. */
function object(file) {
  const text = read(file);
  if (text === null) return null;
  let value;
  try { value = JSON.parse(text); } catch (e) { throw new Error(`${file}: invalid JSON`); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${file}: not a JSON object`);
  return value;
}
function validate(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error('visibility record is not an object');
  for (const h of HOSTS) if (r[h] !== undefined && (!Array.isArray(r[h]) || r[h].some((x) => typeof x !== 'string')))
    throw new Error(`visibility record ${h} is not a list of strings`);
  if (r.files !== undefined && (!r.files || typeof r.files !== 'object' || Array.isArray(r.files)
    || Object.entries(r.files).some(([h, f]) => !HOSTS.includes(h) || typeof f !== 'string' || !path.isAbsolute(f))))
    throw new Error('visibility record files is not a host-to-absolute-path map');
  if (r.pending) {
    const p = r.pending;
    if (!HOSTS.includes(p.host) || typeof p.file !== 'string' || !['file', 'hermes'].includes(p.kind)
      || !p.next || p.next.pending || ![p.before, p.after].every((x) => x === null || /^[a-f0-9]{64}$/.test(x)))
      throw new Error('visibility record has an invalid pending write');
    validate(p.next);
  }
  return r;
}
/** Backup first; atomic replacement preserves the original file's mode and symlink. */
function write(file, text, home, mode) {
  const saved = apply.protect(file, { home });
  if (saved.action === 'backup-failed') throw new Error(`backup failed: ${saved.error}`);
  let dest = file;
  let permissions = mode || 0o600;
  if (fs.existsSync(file)) {
    // rename would otherwise bypass a deliberately read-only target.
    fs.accessSync(file, fs.constants.W_OK);
    permissions = mode || (fs.statSync(file).mode & 0o777);
    dest = fs.realpathSync(file);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const temp = path.join(path.dirname(dest), `.visibility-${process.pid}-${crypto.randomBytes(8).toString('hex')}.tmp`);
  let fd;
  try {
    fd = fs.openSync(temp, 'wx', 0o600);
    fs.writeFileSync(fd, text, 'utf8');
    fs.fchmodSync(fd, permissions);
    fs.fsyncSync(fd);
    fs.closeSync(fd); fd = undefined;
    fs.renameSync(temp, dest);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
  return saved;
}
function probe(p, env) {
  if (p.kind === 'hermes') {
    const result = require('./hostvis.js').hermesRead(env);
    if (result.reason) throw new Error(result.reason);
    return hash(JSON.stringify(result.list));
  }
  return hash(read(p.file));
}
function recover(record, env) {
  validate(record);
  if (!record.pending) return record;
  const p = record.pending;
  const actual = probe(p, env);
  if (actual === p.after) return p.next;
  if (actual === p.before) { const before = { ...record }; delete before.pending; return before; }
  throw new Error(`pending ${p.host} write is ambiguous: settings match neither fingerprint; preserve visibility.json and inspect the protected backup before retrying`);
}
/** A failed checkpoint leaves pending on disk and stops the run before another host. */
function journal(file, home, initial, env) {
  let current = initial;
  const save = (next) => {
    validate(next);
    write(file, JSON.stringify(next, null, 2) + '\n', home, 0o600);
    current = next;
  };
  return {
    get current() { return current; }, save,
    transact(spec, next, action) {
      try {
        if (probe(spec, env) !== spec.before) return { landed: false, error: new Error('settings changed since the preview; run visibility again') };
      } catch (error) { return { landed: false, error }; }
      const previous = current;
      save({ ...previous, pending: { ...spec, next } });
      let error;
      try { action(); } catch (e) { error = e; }
      // Even a CLI reporting failure may have committed its write: read, never retry blindly.
      const resolved = recover(current, env);
      const landed = resolved === current.pending.next;
      save(resolved);
      return { landed, error };
    },
  };
}
module.exports = { hash, read, object, validate, write, recover, journal };
