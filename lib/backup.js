'use strict';
/**
 * A copy of the operator's file, taken before this pack overwrites it.
 *
 * Two defects in this repository's history destroyed or overwrote
 * `~/.claude/CLAUDE.md`, a file with no version control behind it. Both times
 * the copy that saved it existed because an agent happened to make one — once
 * ten minutes before it was needed. That is a habit, and a habit protects
 * whoever remembers it.
 *
 * Three decisions are worth stating, because each one is a mistake not made:
 *
 * 1. **Backups live in our directory, never the agent's.** A copy dropped
 *    beside the original is read by the tool that owns that directory:
 *    `~/.cursor/rules/` loads every `*.mdc` it finds, so one careless name
 *    turns a backup into an always-apply rule. Our own directory cannot do
 *    that to anybody.
 *
 * 2. **A failed backup cancels the write.** Degrading to "no backup, wrote
 *    anyway" would reproduce exactly the situation this module replaces, minus
 *    the agent who used to notice. The caller reports `backup-failed` and the
 *    operator's file is untouched.
 *
 * 3. **The copy is read back and compared before the original is touched.** A
 *    write that returned without throwing is not evidence that bytes landed.
 *
 * New copies bind to the canonical target path. Legacy flattened names remain
 * readable as unbound candidates, never automatic restore authority. Tests use
 * synthetic homes; this is a backup mechanism, not a transaction journal.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Where copies go, relative to home. Ours, so nothing else globs it. */
const DIR = ['.sshlg-skills', 'backups'];

/** How many copies of one file to keep. Older ones are pruned oldest-first. */
const KEEP = 10;

/**
 * A filesystem-safe, sortable UTC stamp: `20260812T104500Z`.
 *
 * Sortable matters more than pretty — pruning picks victims by sorting names,
 * so the stamp has to order lexicographically the way it orders in time. The
 * colons of a plain ISO string are not safe on every filesystem.
 */
function stamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

/** Historical flat key. Slash and underscore can collide: retain it only for
 * listing legacy candidates, never for new copies, pruning or automatic restore. */
function legacyKeyFor(file, home) {
  const rel = (home ? path.relative(home, file) : '') || path.basename(file);
  const key = rel
    // Separators go first: while they are still separators, `..` is still a
    // traversal and can be recognised as one.
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    // No run of dots survives anywhere in the name, not merely at the front. A
    // file outside home relativises to `../..`, and a key is a flat filename.
    .replace(/\.{2,}/g, '_')
    .replace(/^[._]+/, '');
  // A path that sanitises away entirely — `..` on its own — would otherwise
  // name every backup the same empty-keyed file.
  return key || 'file';
}

/** Canonical target identity, independent of lexical profile aliases. Missing
 * targets use their existing canonical parent; unknown parents are not guessed. */
function canonicalTarget(file) {
  const absolute = path.resolve(file);
  try { return fs.realpathSync(absolute); }
  catch (e) {
    if (e.code !== 'ENOENT') throw e;
    // A dangling file symlink is not an absent regular target.
    try { if (fs.lstatSync(absolute).isSymbolicLink()) throw new Error('backup target is a dangling symlink'); }
    catch (err) { if (err.code !== 'ENOENT') throw err; }
    return path.join(fs.realpathSync(path.dirname(absolute)), path.basename(absolute));
  }
}
function identity(file) {
  const canonical = canonicalTarget(file);
  const label = path.basename(canonical).replace(/[^A-Za-z0-9._-]/g, '_').replace(/\.{2,}/g, '_').slice(0, 64) || 'file';
  return { canonical, key: label + '--v2-' + crypto.createHash('sha256').update(canonical).digest('hex') };
}
function keyFor(file) { return identity(file).key; }
const suffix = /^\d{8}T\d{6}Z(?:-\d+)?$/;
function records(names, key) {
  return names.filter(n => n.startsWith(key + '.') && suffix.test(n.slice(key.length + 1)));
}
function ordered(names) {
  return [...names].sort((a,b) => {
    const split = n => { const m = /^(.*Z)(?:-(\d+))?$/.exec(n); return m ? [m[1], BigInt(m[2] || 1)] : [n, 1n]; };
    const x=split(a),y=split(b);return x[0]===y[0] ? (x[1]===y[1]?0:x[1]<y[1]?-1:1) : x[0]<y[0] ? -1 : 1;
  });
}

/** Full backup filename: the key, then the stamp. */
function nameFor(file, home, stampStr) {
  return `${keyFor(file, home)}.${stampStr}`;
}

/**
 * Which existing names to delete so that `keep` copies of `key` survive.
 *
 * Only names carrying this exact key are candidates — a run backing up one
 * file must never prune another's history. Returns oldest first.
 */
function toPrune(names, key, keep, preserve) {
  const mine = ordered(records(names, key));
  const excess = mine.length - keep;
  return excess > 0 ? mine.filter(n=>n!==preserve).slice(0, excess) : [];
}

/**
 * Copy `file` into the backup directory, verify the bytes, prune the history.
 *
 * Throws if the copy cannot be proven — callers treat a throw as "do not
 * write". Returns `no-file` when there is nothing to protect yet, which is not
 * a failure: creating the block in a file that does not exist destroys nothing.
 */
function save(opts) {
  const file = opts.file, home = opts.home;
  const keep=opts.keep===undefined?KEEP:opts.keep;
  if(!Number.isSafeInteger(keep)||keep<1) throw new Error('backup keep must be a positive integer');
  try { fs.lstatSync(file); } catch(e) { if(e.code==='ENOENT') return {action:'no-file',file};throw e; }
  const id = identity(file), original = fs.readFileSync(id.canonical);
  if (canonicalTarget(file)!==id.canonical) throw new Error('backup target profile changed while reading');
  const requestedDir = opts.dir || path.join(home, ...DIR);
  fs.mkdirSync(requestedDir, { recursive:true, mode:0o700 });
  if (!fs.lstatSync(requestedDir).isDirectory()) throw new Error('backup directory must be a regular directory, not a symlink');
  const dir=fs.realpathSync(requestedDir);
  fs.chmodSync(dir, fs.statSync(dir).mode & 0o700);
  const time=opts.stamp || stamp(new Date());
  if (!/^\d{8}T\d{6}Z$/.test(time)) throw new Error('invalid backup stamp');
  const base=id.key+'.'+time;
  const tmp=path.join(dir,'.pending-'+crypto.randomBytes(16).toString('hex'));
  let fd, dest;
  try {
    fd=fs.openSync(tmp,'wx',0o600);fs.fchmodSync(fd,0o600);
    fs.writeFileSync(fd,original);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
    if(!fs.readFileSync(tmp).equals(original)) throw new Error('backup temporary copy does not match original');
    if(canonicalTarget(file)!==id.canonical || fs.realpathSync(requestedDir)!==dir)
      throw new Error('backup target or directory identity changed before publication');
    // Publish complete verified bytes without an overwrite window. link(2) is
    // exclusive even if another process allocates the same second/suffix first.
    for(let n=1;;n++) {
      dest=path.join(dir,n===1?base:base+'-'+String(n).padStart(6,'0'));
      try { fs.linkSync(tmp,dest);break; }
      catch(e) { if(e.code!=='EEXIST')throw e; }
    }
    if(!fs.readFileSync(dest).equals(original)) throw new Error('published backup does not match original');
    if(canonicalTarget(file)!==id.canonical || fs.realpathSync(requestedDir)!==dir)
      throw new Error('backup target or directory identity changed during publication');
  } finally {
    if(fd!==undefined)fs.closeSync(fd);
    try{fs.unlinkSync(tmp);}catch(e){if(e.code!=='ENOENT')throw e;}
  }
  // Only complete v2 names with this exact target digest. Legacy, unknown,
  // symlink and pending entries remain untouched. Concurrent prunes may race
  // to remove the same old entry; absence is not permission to touch another.
  const mine=records(fs.readdirSync(dir),id.key).filter(n=>{
    try{return fs.lstatSync(path.join(dir,n)).isFile();}catch(e){if(e.code==='ENOENT')return false;throw e;}
  });
  const pruned=toPrune(mine,id.key,keep,path.basename(dest));
  for(const old of pruned){try{fs.unlinkSync(path.join(dir,old));}catch(e){if(e.code!=='ENOENT')throw e;}}
  return {action:'saved',file,path:dest,bytes:original.length,pruned,identity:id.canonical};
}

/**
 * Resolve the newest bound copy, absence, or preserved unbound legacy candidates.
 *
 * A snapshot is taken by one hook and read by another — `PreToolUse` copies the
 * config `obsidian-wiki setup` is about to truncate, `PostToolUse` puts back what
 * it dropped — so the two need a way to name the same copy without passing state
 * between processes. Timestamps and numeric collision suffixes order complete
 * records; a selected record must be a regular non-symlink file.
 */
function lookup(opts) {
  const dir=opts.dir || path.join(opts.home,...DIR);
  let st;
  try{st=fs.lstatSync(dir);}catch(e){if(e.code==='ENOENT')return {state:'absent',path:null};throw e;}
  if(!st.isDirectory())throw new Error('backup directory must be a regular directory');
  const canonicalDir=fs.realpathSync(dir);
  const names=fs.readdirSync(canonicalDir),id=identity(opts.file);
  const mine=ordered(records(names,id.key));
  if(mine.length){
    const selected=path.join(canonicalDir,mine[mine.length-1]);
    if(!fs.lstatSync(selected).isFile())throw new Error('bound backup is not a regular non-symlink file');
    if(canonicalTarget(opts.file)!==id.canonical || fs.realpathSync(dir)!==canonicalDir)
      throw new Error('backup lookup profile or directory identity changed');
    return {state:'bound',path:selected,identity:id.canonical};
  }
  const legacyKeys=new Set([legacyKeyFor(opts.file,opts.home)]);
  if(opts.home)legacyKeys.add(legacyKeyFor(id.canonical,fs.realpathSync(opts.home)));
  const candidates=ordered([...new Set([...legacyKeys].flatMap(k=>records(names,k)))]).map(n=>path.join(canonicalDir,n));
  return candidates.length?{state:'legacy-unbound',path:null,candidates}:{state:'absent',path:null};
}
function latest(opts) {
  const found=lookup(opts);
  if(found.state==='legacy-unbound'){
    const error=new Error('legacy backup has no unambiguous target identity; automatic restore refused; preserve the old files for explicit ownership review');
    error.code='BACKUP_LEGACY_UNBOUND';throw error;
  }
  return found.path;
}

/**
 * `save`, reduced to the question the writers ask: may I write?
 *
 * Returns the record on success and `{action:'backup-failed'}` on any failure,
 * so one unwritable target does not abort the other three — the run still
 * reports a record per target, and every record is true.
 */
function guard(opts) {
  try {
    return save(opts);
  } catch (e) {
    return { action: 'backup-failed', file: opts.file, error: e.message };
  }
}

module.exports = { save, guard, latest, lookup, stamp, keyFor, legacyKeyFor, nameFor, toPrune, DIR, KEEP };
