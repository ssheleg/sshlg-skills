'use strict';
// Immutable, private deferred-update receipts. This namespace never edits Codex files.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('./codexplugins');
const hash = (x) => crypto.createHash('sha256').update(x).digest('hex');
const SCHEMA = 'sshlg.codex-deferred/v1';
function canonical(dir) { return fs.realpathSync(dir); }
function directory(dir) {
  try { fs.mkdirSync(dir, { mode: 0o700 }); }
  catch (e) { if (e.code !== 'EEXIST') throw e; }
  const s = fs.lstatSync(dir);
  if (!s.isDirectory() || s.isSymbolicLink()) throw new Error('deferred receipt directory is not a plain directory');
}
function immutable(file, data) {
  const bytes = Buffer.from(JSON.stringify(data, null, 2) + '\n');
  if (fs.existsSync(file)) {
    if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()
      || !fs.readFileSync(file).equals(bytes)) throw new Error('deferred receipt collision; existing file preserved');
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
      if (e.code !== 'EEXIST' || fs.lstatSync(file).isSymbolicLink()
        || !fs.readFileSync(file).equals(bytes)) throw e;
    }
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
  return file;
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
  const base = path.join(home, '.sshlg-skills'); directory(base);
  const dir = path.join(base, 'codex-deferred'); directory(dir);
  return immutable(path.join(dir, hash(JSON.stringify(data)) + '.json'), data);
}
function read(file) {
  if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) throw new Error('pending receipt must be a plain file');
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
  if (path.basename(file) !== hash(JSON.stringify(r)) + '.json')
    throw new Error('pending receipt content does not match its immutable identity');
  return r;
}
/** The watcher observes only. Matching catalog versions never grants mutation or proves thread retirement. */
function observe(receipt, runner) {
  if (canonical(receipt.requestedProfile) !== receipt.profile) return { status: 'profile-changed', mutationAllowed: false };
  const bytes = fs.readFileSync(path.join(receipt.profile, 'config.toml'));
  if (hash(bytes) !== receipt.configSha256) return { status: 'config-changed-rescan-required', mutationAllowed: false };
  const result = runner('codex', ['plugin', 'list', '--json'], { read: true, profile: receipt.profile });
  if (!result || result.error || result.signal || result.status !== 0) return { status: 'unread', mutationAllowed: false };
  const list = cp.parsePluginList(result.stdout);
  if (!list) return { status: 'unread', mutationAllowed: false };
  const items = receipt.items.map((i) => { const p = list.get(i.pluginId); return {
    pluginId: i.pluginId, desired: i.desired, observed: p && p.version || null,
    matches: !!(p && p.installed && p.enabled && p.version === i.desired),
  }; });
  return { status: items.every((i) => i.matches) ? 'catalog-matches-thread-generation-unknown' : 'deferred',
    mutationAllowed: false, threadLoadedVersion: 'unknown', items };
}
module.exports = { save, read, observe, immutable };
