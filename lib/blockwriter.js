'use strict';
/**
 * managed-blocks/1 writer: preview, install and uninstall ONE named block in ONE host
 * instruction file, for the tool that owns the block. The convention it implements is
 * `docs/working-rules/managed-blocks.md`; read that before changing anything here.
 *
 * WHY. Two tools already keep blocks in the same `~/.claude/CLAUDE.md` — the hub's
 * routing block and Observatory's `OBSERVATORY:AGENT-UPDATES` — each with its own
 * writer, its own backup place and no shared record (Observatory INB-005). One writer
 * that any tool can call, with the hub's backups and an append-only journal, makes the
 * file recoverable whichever tool touched it last.
 *
 * WHAT IT REFUSES. Blocks the hub writes through a dedicated, consented path
 * (`SSHLG:ROUTERS` and its subregions, the wait rule), the `SSHLG:REPOSITORY-HANDOFF`
 * block whose owner the operator has not decided (B-174), any other `SSHLG:` name, a
 * caller whose declared owner differs from the marker's owner prefix, a target whose
 * markers are not cleanly paired, an operator opt-out, a symlinked or unreadable file,
 * a host that is not installed, and any target with an unresolved journal operation.
 * The declared owner is a guard against accidents between cooperating tools, not
 * authentication.
 *
 * WHAT IT GUARANTEES. Every byte outside the selected block is preserved; the file is
 * copied by `apply.protect()` (`~/.sshlg-skills/backups/`, readback-verified) before the
 * write; the replacement goes through a temporary file, a snapshot comparison and a
 * readback; the journal records PREPARED, BACKUP_VERIFIED, WRITE_INTENT and VERIFIED
 * (or REFUSED / RECOVERY_REQUIRED). Preview writes nothing at all — no directory, lock,
 * backup or journal line.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const B = require('./blocks.js');
const apply = require('./apply.js');

const SCHEMA = 'managed-blocks-journal/1';
const DIR = ['.sshlg-skills', 'managed-blocks'];
const HOSTS = ['claude', 'codex', 'gemini', 'pi'];
const TERMINAL = new Set(['VERIFIED', 'REFUSED', 'RECOVERED_NO_WRITE', 'RECOVERED_COMMITTED']);
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');

class Refusal extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const refuse = (code, message) => { throw new Refusal(code, message); };

/** Who may write `id` through this writer, or the refusal that says who does instead. */
function admit(id, owner) {
  if (!/^[A-Z0-9][A-Z0-9_.-]*(?::[A-Za-z0-9_.-]+)+$/.test(id || '')) refuse('BAD_MARKER', 'a block id is OWNER:NAME, owner in capitals');
  const reg = B.REGISTRY[id];
  if (id === 'SSHLG:REPOSITORY-HANDOFF') refuse('OPERATOR_DECISION_REQUIRED', 'no tool owns SSHLG:REPOSITORY-HANDOFF until the operator decides (B-174)');
  if (reg && reg.dedicated) refuse('DEDICATED_WRITER', `${id} is written by ${reg.writer}, not by blocks install`);
  if (/^SSHLG:ROUTER(S:|:)/.test(id)) refuse('DEDICATED_WRITER', `${id} is a subregion of SSHLG:ROUTERS`);
  if (id.startsWith('SSHLG:')) refuse('RESERVED_PREFIX', 'SSHLG: names are the hub\'s and each has a registered writer');
  const prefix = id.split(':')[0];
  if (!owner) refuse('OWNER_REQUIRED', `pass --owner ${prefix}`);
  if (owner !== prefix) refuse('OWNER_MISMATCH', `--owner ${owner} cannot write a ${prefix} block`);
  return prefix;
}

/** The one host file a writer may touch, resolved like `blocks` lists it. */
function target({ home, env = {}, agent }) {
  if (!HOSTS.includes(agent)) refuse('UNSUPPORTED_HOST', `the writer supports ${HOSTS.join(', ')} (one instruction file each)`);
  const [t] = B.targets({ home, env, agents: [agent] });
  // The host directory may be a symlink (a dotfiles checkout): `blocks` reads through it,
  // so the writer does too. The FILE itself must not be a link (B.read refuses that).
  const hostDir = path.dirname(t.file);
  let link = false, dir;
  try { link = fs.lstatSync(hostDir).isSymbolicLink(); dir = fs.statSync(hostDir); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (!dir) refuse('HOST_ABSENT', `${path.dirname(t.pathAlias)} ${link ? 'is a link to nothing' : 'does not exist'}; the writer never installs a host`);
  if (!dir.isDirectory()) refuse('HOST_ABSENT', `${path.dirname(t.pathAlias)} is not a directory`);
  return t;
}

/** The block's exact segment from a local source file holding one complete block. */
function sourceSegment(from, id) {
  if (!from || /^[a-z]+:\/\//i.test(from)) refuse('SOURCE_REQUIRED', '--from <local file> holding the one block to install');
  const r = B.read(path.resolve(from));
  if (r.readState !== 'READ') refuse('SOURCE_UNREADABLE', `source ${r.readState}${r.reason ? ' ' + r.reason : ''}`);
  if (!r.ok || r.blocks.length !== 1) refuse('SOURCE_INVALID', 'the source must hold exactly one complete block and no other marker');
  const b = r.blocks[0];
  if (b.markerId !== id || b.syntaxState !== 'PAIRED') refuse('SOURCE_INVALID', `the source block is ${b.markerId} ${b.syntaxState}, not a paired ${id}`);
  return r.text.slice(b.offset.start, b.offset.end);
}

/** The file's own line ending: CRLF only when every newline in it is CRLF. */
function eolOf(text) {
  return text.includes('\r\n') && !/(^|[^\r])\n/.test(text) ? '\r\n' : '\n';
}
/** A source segment in the target's line endings. */
function inEol(segment, eol) { return segment.replace(/\r\n/g, '\n').replace(/\n/g, eol); }

/**
 * Remove [start, end) and the one line ending after it — nothing else. Install adds
 * exactly the block and its line ending, so the pair is exactly reversible for any file
 * that ends with a line ending, blank trailing lines included.
 */
function without(text, start, end, eol) {
  let tail = text.slice(end);
  if (tail.startsWith(eol)) tail = tail.slice(eol.length);
  else if (tail.startsWith('\n')) tail = tail.slice(1);
  return text.slice(0, start) + tail;
}
/**
 * Append a block on its own line: after the file's final line ending, or after an added
 * one when the file has none (the one byte a round trip keeps: "X" and "X\n" append
 * identically). No blank-line separator is added, because none could be taken back
 * without guessing whose blank line it was.
 */
function appended(text, segment, eol) {
  const gap = text === '' || text.endsWith('\n') ? '' : eol;
  return text + gap + segment + eol;
}

/** The ids of every marker in a parse, in order, for comparing before and after. */
const ids = (blocks) => blocks.map((b) => `${b.markerId}:${b.syntaxState}`);

/** The latest completed install of `id` on `canonical`, from the journal; null when none. */
function lastInstall(home, canonical, id) {
  const done = new Set(['VERIFIED', 'RECOVERED_COMMITTED']);
  const hits = [...operations(readJournal(home)).values()]
    .filter((r) => r.op === 'install' && r.markerId === id && r.target.canonical === canonical && done.has(r.state));
  return hits.length ? hits[hits.length - 1] : null;
}

/** Pure planning: what install/uninstall would change. Writes nothing. */
function plan(opts) {
  const op = opts.op;
  if (op !== 'install' && op !== 'uninstall') refuse('BAD_OPERATION', 'install or uninstall');
  admit(opts.id, opts.owner);
  const t = target(opts);
  const r = B.read(t.file, opts.io);
  if (!['READ', 'ABSENT'].includes(r.readState)) refuse('TARGET_UNREADABLE', `${t.pathAlias}: ${r.readState}${r.reason ? ' ' + r.reason : ''}`);
  if (r.readState === 'READ' && !r.ok) refuse('TARGET_MALFORMED', `${t.pathAlias}: markers are not cleanly paired (${r.issues.map((i) => `${i.code}@${i.line}`).join(', ')}); fix by hand first`);
  // A rename would replace a file the operator made read-only; honour the mode instead.
  if (r.readState === 'READ' && !(r.mode & 0o200)) refuse('READ_ONLY', `${t.pathAlias} is read-only (mode ${r.mode.toString(8)}); make it writable first if the change is wanted`);
  const text = r.readState === 'READ' ? r.text : '';
  const eol = eolOf(text);
  const hits = (r.blocks || []).filter((b) => b.markerId === opts.id);
  const current = hits[0];
  if (current && current.syntaxState === 'OPTOUT') refuse('OPTED_OUT', `${t.pathAlias} carries ${opts.id}:OPTOUT; the operator declined this block`);
  if (current && current.syntaxState !== 'PAIRED') refuse('TARGET_MALFORMED', `${opts.id} is ${current.syntaxState}`);
  const beforeSeg = current ? text.slice(current.offset.start, current.offset.end) : '';
  const afterSeg = op === 'install' ? inEol(sourceSegment(opts.from, opts.id), eol) : '';
  let after = text, action = 'unchanged';
  if (op === 'install') {
    if (current) {
      after = text.slice(0, current.offset.start) + afterSeg + text.slice(current.offset.end);
      action = after === text ? 'unchanged' : 'replace';
    } else { after = appended(text, afterSeg, eol); action = 'insert'; }
  } else if (current) {
    after = without(text, current.offset.start, current.offset.end, eol); action = 'remove';
  }
  // The result must parse as the same markers plus (or minus) exactly this one block:
  // an unterminated `<!--` earlier in the file would otherwise swallow an appended block.
  if (action !== 'unchanged') {
    const parsed = B.parse(after);
    const others = (bl) => ids(bl.filter((b) => b.markerId !== opts.id));
    const mine = parsed.blocks.filter((b) => b.markerId === opts.id);
    if (!parsed.ok || JSON.stringify(others(parsed.blocks)) !== JSON.stringify(others(r.blocks || []))
      || mine.length !== (op === 'install' ? 1 : 0) || (mine[0] && mine[0].syntaxState !== 'PAIRED')) {
      refuse('RESULT_WOULD_NOT_PARSE', `after this ${op}, ${t.pathAlias} would not read as the same markers ${op === 'install' ? 'plus' : 'minus'} one paired ${opts.id}; look for an unterminated <!-- comment`);
    }
  }
  // Edits made inside the block are dropped by replace and uninstall: say so before the write.
  const warnings = [];
  if (current && action !== 'unchanged') {
    let canonical = null, last = null, journalOk = true;
    try { canonical = path.join(fs.realpathSync.native(path.dirname(t.file)), path.basename(t.file)); last = lastInstall(opts.home, canonical, opts.id); }
    catch (e) { journalOk = false; }
    const seg = sha(Buffer.from(beforeSeg, 'utf8'));
    if (!journalOk) warnings.push('the journal could not be read to tell whether the block was edited');
    else if (!last) warnings.push(`${opts.id} was not installed through this writer; its current text stays in the backup taken before the write`);
    else if (last.segmentSha256 !== seg) warnings.push(`${opts.id} was edited since operation ${last.operationId}; those in-block edits are dropped by this ${op} and stay in the backup taken before the write`);
  }
  return {
    op, id: opts.id, owner: opts.owner, host: t.host, pathAlias: t.pathAlias, file: t.file, action, warnings,
    segmentSha256: op === 'install' ? sha(Buffer.from(afterSeg, 'utf8')) : null,
    before: { exists: r.readState === 'READ', sha256: r.readState === 'READ' ? r.sha256 : null, mode: r.mode === undefined ? null : r.mode, text },
    after: { sha256: sha(Buffer.from(after, 'utf8')), text: after },
    diff: action === 'unchanged' ? `No change: ${opts.id} in ${t.pathAlias} is already ${op === 'install' ? 'this block' : 'absent'}.\n`
      : [`--- ${t.pathAlias} ${opts.id} (current)`, `+++ ${t.pathAlias} ${opts.id} (after ${op})`,
        ...(beforeSeg ? beforeSeg.split(/\r?\n/).map((x) => '-' + x) : []),
        ...(afterSeg ? afterSeg.split(/\r?\n/).map((x) => '+' + x) : []), ''].join('\n')
        + warnings.map((w) => `Warning: ${w}\n`).join(''),
  };
}

// ---- journal ------------------------------------------------------------------

function stateDir(home) { return path.join(home, ...DIR); }
function journalPath(home) { return path.join(stateDir(home), 'journal.jsonl'); }
/**
 * `journal.head` beside the journal: the record count and the last line's hash, rewritten
 * after every append. The chain catches an edited or removed middle record; the head
 * catches whole trailing records cut off. Deleting the journal AND its head together is
 * not detected.
 */
// Bound at load: the head's rename is bookkeeping, separate from the target's rename
// (which tests interrupt by replacing fs.renameSync).
const renameHead = fs.renameSync.bind(fs);
function headPath(home) { return path.join(stateDir(home), 'journal.head'); }
function readHead(home) {
  let raw;
  try { raw = fs.readFileSync(headPath(home), 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  let h;
  try { h = JSON.parse(raw); } catch (e) { refuse('JOURNAL_DAMAGED', 'journal.head is not JSON'); }
  if (!h || !Number.isSafeInteger(h.count) || h.count < 1 || !/^[a-f0-9]{64}$/.test(h.lastSha256 || '')) refuse('JOURNAL_DAMAGED', 'journal.head has an unknown shape');
  return h;
}
function writeHead(home, count, lastSha256) {
  const file = headPath(home), tmp = file + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
  const fd = fs.openSync(tmp, 'wx', 0o600);
  try { fs.writeSync(fd, JSON.stringify({ schema: 'managed-blocks-journal-head/1', count, lastSha256 }) + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  renameHead(tmp, file);
}

/** Every journal record, with the hash chain checked. A damaged journal refuses writes. */
function readJournal(home) {
  const file = journalPath(home);
  let raw;
  const head = readHead(home);
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    if (head) refuse('JOURNAL_DAMAGED', `the journal is missing but journal.head records ${head.count} records`);
    return [];
  }
  if (raw && !raw.endsWith('\n')) refuse('JOURNAL_DAMAGED', 'the journal\'s last line is incomplete; preserve it and resolve by hand');
  const out = [];
  let prev = null;
  for (const line of raw.split('\n').filter(Boolean)) {
    let rec;
    try { rec = JSON.parse(line); } catch (e) { refuse('JOURNAL_DAMAGED', 'a journal line is not JSON'); }
    if (!rec || typeof rec !== 'object' || Array.isArray(rec) || !rec.target || typeof rec.target !== 'object') refuse('JOURNAL_DAMAGED', 'a journal line is not a record');
    if (rec.schema !== SCHEMA || rec.previousRecordSha256 !== prev) refuse('JOURNAL_DAMAGED', 'the journal chain is broken; preserve it and resolve by hand');
    prev = sha(line);
    out.push(rec);
  }
  if (head) {
    // One extra, correctly chained record is the crash window between append and head.
    const lines = raw.split('\n').filter(Boolean);
    const at = head.count - 1;
    const matches = lines.length > at && sha(lines[at]) === head.lastSha256;
    if (!matches || lines.length > head.count + 1) refuse('JOURNAL_DAMAGED', `journal.head records ${head.count} records ending in a line the journal no longer holds; records were removed`);
  } else if (out.length) refuse('JOURNAL_DAMAGED', 'the journal has records but journal.head is missing');
  return out;
}
/** operationId → its latest record. */
function operations(records) {
  const ops = new Map();
  for (const r of records) ops.set(r.operationId, r);
  return ops;
}
/** Operations on this canonical target that never reached a terminal state. */
function pending(home, canonical) {
  return [...operations(readJournal(home)).values()].filter((r) => r.target.canonical === canonical && !TERMINAL.has(r.state));
}
function append(home, record) {
  const file = journalPath(home);
  const records = readJournal(home);
  const prev = records.length ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).pop() : null;
  const line = JSON.stringify({ schema: SCHEMA, ...record, at: new Date().toISOString(), previousRecordSha256: prev === null ? null : sha(prev) });
  const fd = fs.openSync(file, 'a', 0o600);
  try { fs.fchmodSync(fd, 0o600); fs.writeSync(fd, line + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  writeHead(home, records.length + 1, sha(line));
}
function ensureDir(home) {
  const dir = stateDir(home);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const st = fs.lstatSync(dir);
  if (!st.isDirectory() || st.isSymbolicLink()) refuse('STATE_UNSAFE', `${DIR.join('/')} must be a real directory`);
  fs.chmodSync(dir, 0o700);
  return dir;
}
/** One non-stealing lock for every managed-block write on this machine: exclusive inode, no stale inference. */
function locked(home, fn) {
  const lock = path.join(ensureDir(home), '.lock');
  let fd;
  try { fd = fs.openSync(lock, 'wx', 0o600); } catch (e) {
    if (e.code === 'EEXIST') refuse('LOCKED', `another managed-block write holds ${DIR.join('/')}/.lock; if no writer runs, remove that file by hand`);
    throw e;
  }
  const own = fs.fstatSync(fd);
  try { return fn(); } finally {
    fs.closeSync(fd);
    try { const now = fs.lstatSync(lock); if (now.dev === own.dev && now.ino === own.ino) fs.unlinkSync(lock); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
}

function snapshot(file) {
  try {
    const st = fs.lstatSync(file);
    if (!st.isFile() || st.isSymbolicLink()) refuse('TARGET_UNSUPPORTED', 'not a regular file');
    return { exists: true, sha256: sha(fs.readFileSync(file)), mode: st.mode & 0o777, dev: st.dev, ino: st.ino };
  } catch (e) { if (e.code === 'ENOENT') return { exists: false, sha256: null, mode: null }; throw e; }
}
const sameSnap = (a, b) => a.exists === b.exists && a.sha256 === b.sha256 && a.mode === b.mode && a.dev === b.dev && a.ino === b.ino;

/** The newest bound backup of this file when its bytes are exactly the previewed ones. */
function reusable(planned, home) {
  if (!planned.before.exists) return null;
  let found;
  try { found = require('./backup.js').lookup({ file: planned.file, home }); } catch (e) { return null; }
  if (found.state !== 'bound') return null;
  const st = fs.lstatSync(found.path);
  if (!st.isFile() || (st.mode & 0o077)) return null;
  const digest = sha(fs.readFileSync(found.path));
  return digest === planned.before.sha256 ? { state: 'reused', name: path.basename(found.path), sha256: digest } : null;
}

/**
 * Carry out a plan made by `plan()`. Returns the operation record; throws a Refusal
 * (journaled as REFUSED when the journal was reachable) when anything moved.
 */
function execute(planned, { home, stamp } = {}) {
  if (!home) refuse('HOME_REQUIRED', 'no home: refusing to write without a backup place');
  if (planned.action === 'unchanged') return { state: 'UNCHANGED', operationId: null, action: 'unchanged' };
  return locked(home, () => {
    const canonical = path.join(fs.realpathSync.native(path.dirname(planned.file)), path.basename(planned.file));
    const open = pending(home, canonical);
    if (open.length) refuse('RECOVERY_REQUIRED', `operation ${open[0].operationId} on ${planned.pathAlias} is ${open[0].state}; run: npx sshlg-skills blocks resolve ${open[0].operationId}`);
    const operationId = crypto.randomBytes(16).toString('hex');
    const base = { operationId, op: planned.op, owner: planned.owner, markerId: planned.id,
      target: { host: planned.host, pathAlias: planned.pathAlias, canonical },
      before: { exists: planned.before.exists, sha256: planned.before.sha256, mode: planned.before.mode },
      after: { sha256: planned.after.sha256 }, segmentSha256: planned.segmentSha256 };
    let seq = 0;
    const note = (state, extra = {}) => append(home, { ...base, sequence: ++seq, state, ...extra });
    note('PREPARED');
    let wrote = false;
    try {
      const snap = snapshot(planned.file);
      if (snap.sha256 !== planned.before.sha256 || snap.exists !== planned.before.exists) refuse('TARGET_CHANGED', 'the file changed after the preview; preview again');
      // A retry of the same failing write reuses the newest copy when it already holds
      // these exact bytes, instead of taking a new one each time (which would also push
      // older copies out of the ten-copy history).
      let backup = reusable(planned, home);
      if (!backup) {
        const saved = apply.protect(planned.file, { home, stamp });
        if (saved.action === 'backup-failed') refuse('BACKUP_FAILED', saved.error);
        backup = saved.action === 'saved'
          ? { state: 'saved', name: path.basename(saved.path), sha256: sha(fs.readFileSync(saved.path)) }
          : { state: 'no-file', name: null, sha256: null };
      }
      if (backup.state !== 'no-file' && backup.sha256 !== planned.before.sha256) refuse('BACKUP_FAILED', 'backup bytes differ from the previewed file');
      note('BACKUP_VERIFIED', { backup });
      const parent = fs.realpathSync.native(path.dirname(planned.file));
      const tmp = path.join(parent, '.sshlg-block-' + crypto.randomBytes(12).toString('hex') + '.tmp');
      const mode = planned.before.exists ? planned.before.mode : 0o644;
      let fd;
      try {
        fd = fs.openSync(tmp, 'wx', 0o600);
        fs.fchmodSync(fd, mode);
        fs.writeFileSync(fd, planned.after.text); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
        if (fs.readFileSync(tmp, 'utf8') !== planned.after.text) refuse('WRITE_FAILED', 'temporary copy readback differs');
        if (fs.realpathSync.native(path.dirname(planned.file)) !== parent || !sameSnap(snapshot(planned.file), snap)) refuse('TARGET_CHANGED', 'the file changed during the write; nothing replaced');
        note('WRITE_INTENT', { backup });
        wrote = true;
        fs.renameSync(tmp, planned.file);
      } finally {
        if (fd !== undefined) fs.closeSync(fd);
        try { fs.unlinkSync(tmp); } catch (e) { if (e.code !== 'ENOENT') throw e; }
      }
      const now = snapshot(planned.file);
      if (now.sha256 !== planned.after.sha256 || now.mode !== mode) throw new Refusal('READBACK_DIFFERS', 'the written file does not read back as planned');
      note('VERIFIED', { backup });
      return { ...base, state: 'VERIFIED', action: planned.action, backup };
    } catch (e) {
      try { note(wrote ? 'RECOVERY_REQUIRED' : 'REFUSED', { reason: e.code || 'ERROR' }); } catch (_) { /* the open record stays, and blocks the next write */ }
      if (wrote) { e.operationId = operationId; e.recovery = true; }
      throw e;
    }
  });
}

/**
 * Classify an unfinished operation against the file as it is now: the recorded
 * before bytes → RECOVERED_NO_WRITE, the recorded after bytes → RECOVERED_COMMITTED,
 * anything else stays open for a person. It never writes the host file.
 */
function resolve(home, operationId) {
  return locked(home, () => {
    const last = operations(readJournal(home)).get(operationId);
    if (!last) refuse('UNKNOWN_OPERATION', operationId);
    if (TERMINAL.has(last.state)) return last;
    const now = snapshot(last.target.canonical);
    let state;
    if (now.exists === last.before.exists && now.sha256 === last.before.sha256) state = 'RECOVERED_NO_WRITE';
    else if (now.exists && now.sha256 === last.after.sha256) state = 'RECOVERED_COMMITTED';
    else refuse('UNRESOLVED', `${last.target.pathAlias} matches neither the recorded before nor after bytes; compare it with backup ${last.backup ? last.backup.name : '(none)'} by hand`);
    const rec = { ...last, sequence: last.sequence + 1, state };
    delete rec.at; delete rec.previousRecordSha256; delete rec.schema; delete rec.reason;
    append(home, rec);
    return { ...rec, state, removedTemporaryFiles: sweep(last.target.canonical) };
  });
}

/**
 * Remove this writer's own leftover temporary files beside a target: regular files
 * named exactly like the ones `execute` creates. Anything else is left alone.
 */
function sweep(canonical) {
  const dir = path.dirname(canonical);
  let removed = 0;
  let names = [];
  try { names = fs.readdirSync(dir); } catch (e) { return 0; }
  for (const n of names) {
    if (!/^\.sshlg-block-[a-f0-9]{24}\.tmp$/.test(n)) continue;
    const p = path.join(dir, n);
    try { if (fs.lstatSync(p).isFile()) { fs.unlinkSync(p); removed++; } } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return removed;
}

// ---- CLI ----------------------------------------------------------------------

const USAGE = `managed-blocks/1 writer (docs/working-rules/managed-blocks.md)
  npx sshlg-skills blocks install OWNER:NAME --owner OWNER --agent claude|codex|gemini|pi --from <local-file> [--apply] [--json]
  npx sshlg-skills blocks uninstall OWNER:NAME --owner OWNER --agent claude|codex|gemini|pi [--apply] [--json]
  npx sshlg-skills blocks resolve <operation-id> [--json]
Without --apply: a preview, and nothing is written. With --apply: backup to
~/.sshlg-skills/backups/, journal in ~/.sshlg-skills/managed-blocks/journal.jsonl.
Exit 0 done or nothing to do, 1 refused or failed, 2 bad arguments.
`;

function parse(args) {
  const [verb, id, ...rest] = args;
  const f = { op: verb, id, apply: false, json: false };
  const seen = new Set();
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (seen.has(a)) throw Error('Duplicate flag: ' + a);
    seen.add(a);
    if (a === '--apply') f.apply = true;
    else if (a === '--json') f.json = true;
    else if (['--owner', '--agent', '--from'].includes(a)) {
      const v = rest[++i];
      if (!v || v.startsWith('--')) throw Error('Missing value for ' + a);
      f[a.slice(2)] = v;
    } else throw Error(`Unknown blocks ${verb} flag: ${a}`);
  }
  if (!id) throw Error(`blocks ${verb} needs ${verb === 'resolve' ? 'an operation id' : 'a block id OWNER:NAME'}`);
  if (verb === 'resolve' && (f.owner || f.agent || f.from || f.apply)) throw Error('resolve takes only an operation id and --json');
  if (verb === 'uninstall' && f.from) throw Error('uninstall takes no --from');
  if (verb !== 'resolve' && !f.agent) throw Error('--agent is required');
  return f;
}

function cli(args, options, write) {
  if (args.includes('--help') || args.includes('-h')) { write(USAGE); return 0; }
  let f;
  try { f = parse(args); } catch (e) {
    write(args.includes('--json')
      ? JSON.stringify({ schema: 'managed-blocks-operation/1', state: 'ERROR', code: 'BAD_ARGUMENTS', reason: e.message }, null, 2) + '\n'
      : `blocks: ${e.message}\n${USAGE}`);
    return 2;
  }
  const out = (obj, text) => write(f.json ? JSON.stringify(obj, null, 2) + '\n' : text);
  try {
    if (f.op === 'resolve') {
      const r = resolve(options.home, f.id);
      out({ schema: 'managed-blocks-operation/1', operationId: r.operationId, state: r.state, markerId: r.markerId, target: r.target.pathAlias, removedTemporaryFiles: r.removedTemporaryFiles || 0 },
        `${r.markerId} on ${r.target.pathAlias}: ${r.state}${r.removedTemporaryFiles ? `; removed ${r.removedTemporaryFiles} leftover temporary file(s)` : ''}\n`);
      return 0;
    }
    const p = plan({ ...options, ...f });
    if (!f.apply) {
      out({ schema: 'managed-blocks-operation/1', state: 'PREVIEW', op: p.op, markerId: p.id, target: p.pathAlias, action: p.action, beforeSha256: p.before.sha256, afterSha256: p.after.sha256, warnings: p.warnings },
        p.diff + (p.action === 'unchanged' ? '' : `Preview only: nothing written. Re-run with --apply to ${p.op}.\n`));
      return 0;
    }
    const r = execute(p, options);
    out({ schema: 'managed-blocks-operation/1', state: r.state, op: p.op, markerId: p.id, target: p.pathAlias, action: r.action, operationId: r.operationId, backup: r.backup ? r.backup.name : null, warnings: p.warnings },
      r.action === 'unchanged' ? p.diff : `${p.op} ${p.id} → ${p.pathAlias}: ${r.state}${r.backup && r.backup.name ? `; backup ${r.backup.name}` : ''}; operation ${r.operationId}\n`
        + p.warnings.map((w) => `Warning: ${w}${r.backup && r.backup.name ? ` (${r.backup.name})` : ''}\n`).join(''));
    return 0;
  } catch (e) {
    // Every failure answers in the same shape, never as a stack trace. After a write
    // intent the bytes may or may not have landed: say so and name the resolve command.
    const resolveHint = e.operationId ? `npx sshlg-skills blocks resolve ${e.operationId}` : null;
    const refused = e instanceof Refusal && !e.recovery;
    const state = e.recovery ? 'RECOVERY_REQUIRED' : refused ? 'REFUSED' : 'ERROR';
    const reason = refused ? e.message : `${e.code || 'ERROR'}: ${e.message}${e.recovery ? '; the file may or may not have changed' : ''}`;
    out({ schema: 'managed-blocks-operation/1', state, code: e.code || 'ERROR', reason, operationId: e.operationId || null, resolve: resolveHint },
      `blocks ${f.op}: ${refused ? 'refused' : 'failed'} — ${reason}${resolveHint ? `\nRun: ${resolveHint}` : ''}\n`);
    return 1;
  }
}

module.exports = { admit, plan, execute, resolve, readJournal, cli, USAGE, Refusal, journalPath, headPath };
