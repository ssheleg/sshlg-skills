'use strict';
// Immutable, private deferred-update receipts. This namespace never edits Codex files.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('./codexplugins');
const hash = (x) => crypto.createHash('sha256').update(x).digest('hex');
const SCHEMA = 'sshlg.codex-deferred/v1';
function canonical(dir) { return fs.realpathSync(dir); }
const P = require('./posix-perms.js');
function owned(stat) {
  return P.ownedByMe(stat);
}
function privateFile(file) {
  const s = fs.lstatSync(file);
  if (!s.isFile() || s.isSymbolicLink()) throw new Error('pending receipt must be a plain file');
  if (!owned(s) || !P.isPrivate(s)) throw new Error('pending receipt lacks private owner-only permissions');
}
function checkDirectory(dir, privateMode = true) {
  const s = fs.lstatSync(dir);
  if (!s.isDirectory() || s.isSymbolicLink()) throw new Error('deferred receipt directory is not a plain directory');
  // An existing hub root may be readable, but must not be writable by others.
  // The task-specific namespace itself must remain private.
  if (!owned(s) || !P.isPrivate(s, privateMode ? 0o077 : 0o022))
    throw new Error('deferred receipt directory has unsafe private ownership or permissions');
}
function directory(dir, privateMode = true) {
  try { fs.mkdirSync(dir, { mode: 0o700 }); }
  catch (e) { if (e.code !== 'EEXIST') throw e; }
  checkDirectory(dir, privateMode);
}
function immutable(file, data) {
  checkDirectory(path.dirname(file));
  const bytes = Buffer.from(JSON.stringify(data, null, 2) + '\n');
  if (fs.existsSync(file)) {
    privateFile(file);
    if (!fs.readFileSync(file).equals(bytes)) throw new Error('deferred receipt collision; existing file preserved');
    return file;
  }
  const temp = path.join(path.dirname(file), `.pending-${crypto.randomBytes(12).toString('hex')}`);
  let fd;
  try {
    fd = fs.openSync(temp, 'wx', 0o600); fs.writeFileSync(fd, bytes); fs.fsyncSync(fd);
    fs.closeSync(fd); fd = undefined;
    // Exclusive publish: a competing receipt is never overwritten.
    try { fs.linkSync(temp, file); }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      checkDirectory(path.dirname(file));
      privateFile(file);
      if (!fs.readFileSync(file).equals(bytes)) throw e;
    }
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
  return file;
}
// B-224: receipts accumulated while Codex stayed deferred (67, then 92 files). A newer
// receipt for a member supersedes its older ones: each member keeps its newest receipt, and a
// receipt goes together with its observations and its exhaustion record. A kept receipt keeps
// its newest observations. Only names this namespace writes, as private plain files, are
// removed; anything else in the directory is left alone. A watcher still reading a removed
// receipt stops on its next admission check (`pending receipt` read fails) and exits 1.
const KEEP_PER_MEMBER = 1;
const KEEP_OBSERVATIONS = 10;
const RECEIPT = /^([a-f0-9]{64})\.json$/;
function removable(file) {
  try { privateFile(file); return true; } catch (e) { return false; }
}
function cap(dir, current) {
  const mtime = (f) => fs.lstatSync(f).mtimeMs;
  const names = fs.readdirSync(dir);
  const receipts = [];
  for (const n of names) {
    if (!RECEIPT.test(n)) continue;
    const file = path.join(dir, n);
    let r; try { r = read(file); } catch (e) { continue; }   // unreadable: not ours to judge
    receipts.push({ n, file, at: mtime(file), members: [...new Set(r.items.map((i) => i.member))] });
  }
  receipts.sort((a, b) => (a.n === current ? -1 : b.n === current ? 1 : b.at - a.at || (a.n < b.n ? -1 : 1)));
  const seen = new Map(); const removed = [];
  const companions = (n) => names.filter((x) => x.startsWith(n.slice(0, -5) + '.observation-') || x.startsWith(n + '.exhausted-'));
  for (const r of receipts) {
    const keep = r.n === current || r.members.some((m) => (seen.get(m) || 0) < KEEP_PER_MEMBER);
    if (keep) {
      for (const m of r.members) seen.set(m, (seen.get(m) || 0) + 1);
      const obs = names.filter((x) => x.startsWith(r.n.slice(0, -5) + '.observation-'))
        .map((x) => ({ x, at: mtime(path.join(dir, x)) })).sort((a, b) => b.at - a.at || (a.x < b.x ? 1 : -1));
      for (const o of obs.slice(KEEP_OBSERVATIONS)) {
        const f = path.join(dir, o.x); if (removable(f)) { fs.unlinkSync(f); removed.push(o.x); }
      }
      continue;
    }
    for (const x of [...companions(r.n), r.n]) {
      const f = path.join(dir, x); if (removable(f)) { fs.unlinkSync(f); removed.push(x); }
    }
  }
  return removed;
}
function save({ home, configPath, configBytes, results, runtime }) {
  const pending = results.filter((r) => r.status === 'deferred');
  if (!pending.length) return null;
  const profile = canonical(path.dirname(configPath));
  if (!fs.readFileSync(configPath).equals(configBytes)) throw new Error('Codex config changed during inspection; rerun before recording a pending update');
  const data = { schema: SCHEMA, status: 'deferred', profile,
    requestedProfile: path.resolve(path.dirname(configPath)), configSha256: hash(configBytes),
    runtime, reason: 'DEFERRED_ACTIVE_GENERATION_SAFETY', threadLoadedVersion: 'unknown',
    items: pending.map(({ item: i }) => ({ member: i.member, pluginId: i.pluginId,
      observed: i.from || null, desired: i.pin, ref: i.ref, refKind: i.refKind, source: i.url })),
    admission: 'requires a separately reviewed supported generation-retention or all-consumer retirement adapter; no timer or process-count bypass' };
  const base = path.join(home, '.sshlg-skills'); directory(base, false);
  const dir = path.join(base, 'codex-deferred'); directory(dir);
  const file = immutable(path.join(dir, hash(JSON.stringify(data)) + '.json'), data);
  // The same intent saved again is the newest intent: its date moves, its bytes never do.
  const now = new Date(); fs.utimesSync(file, now, now);
  try { cap(dir, path.basename(file)); } catch (e) { /* retention never fails the receipt */ }
  return file;
}
function read(file) {
  privateFile(file);
  const raw = fs.readFileSync(file); const text = raw.toString('utf8');
  if (!Buffer.from(text).equals(raw)) throw new Error('pending receipt is not UTF-8');
  const r = JSON.parse(text);
  if (!r || r.schema !== SCHEMA || r.status !== 'deferred' || !path.isAbsolute(r.profile || '')
    || !path.isAbsolute(r.requestedProfile || '') || !/^[a-f0-9]{64}$/.test(r.configSha256)
    || !Array.isArray(r.items) || !r.items.length
    || r.items.some((i) => !i || ['member', 'pluginId', 'desired', 'ref', 'source'].some((k) => typeof i[k] !== 'string' || !i[k])))
    throw new Error('invalid deferred receipt');
  const dir = path.dirname(path.resolve(file));
  const parent = path.dirname(dir);
  if (path.basename(dir) !== 'codex-deferred' || path.basename(parent) !== '.sshlg-skills'
    || [dir, parent].some((p) => !fs.lstatSync(p).isDirectory() || fs.lstatSync(p).isSymbolicLink()))
    throw new Error('pending receipt is outside the plain hub-owned namespace');
  checkDirectory(dir); checkDirectory(parent, false);
  if (path.basename(file) !== hash(JSON.stringify(r)) + '.json')
    throw new Error('pending receipt content does not match its immutable identity');
  return r;
}
/** The watcher observes only. Matching catalog versions never grants mutation or proves thread retirement. */
function observe(receipt, runner) {
  if (canonical(receipt.requestedProfile) !== receipt.profile) return { status: 'profile-changed', mutationAllowed: false };
  const bytes = fs.readFileSync(path.join(receipt.profile, 'config.toml'));
  if (hash(bytes) !== receipt.configSha256) return { status: 'config-changed-rescan-required', mutationAllowed: false };
  // Scoped per marketplace (B-317): the unscoped list also reads the remote catalog.
  const read = cp.readList(runner, receipt.items.map((i) => (cp.splitPluginId(i.pluginId) || {}).marketplace),
    { profile: receipt.profile });
  const list = read.listed;
  if (!list) return { status: 'unread', mutationAllowed: false };
  const items = receipt.items.map((i) => { const p = list.get(i.pluginId); return {
    pluginId: i.pluginId, desired: i.desired, observed: p && p.version || null,
    matches: !!(p && p.installed && p.enabled && p.version === i.desired),
  }; });
  return { status: items.every((i) => i.matches) ? 'catalog-matches-thread-generation-unknown' : 'deferred',
    mutationAllowed: false, threadLoadedVersion: 'unknown', items };
}
/** Runnable POSIX-shell display only; Windows shells use different grammars. */
function watcherCommand(script, file, { platform = process.platform, executable = process.execPath } = {}) {
  if (platform === 'win32') return null;
  return [executable, script, file].map((value) => {
    if (typeof value !== 'string' || value.includes('\0')) throw new Error('watcher argv must be a string without NUL');
    return "'" + value.replace(/'/g, "'\\''") + "'";
  }).join(' ');
}
module.exports = { save, read, observe, immutable, watcherCommand, cap, KEEP_PER_MEMBER, KEEP_OBSERVATIONS };
