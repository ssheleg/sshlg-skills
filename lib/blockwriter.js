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
  let dir;
  try { dir = fs.lstatSync(path.dirname(t.file)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (!dir || !dir.isDirectory()) refuse('HOST_ABSENT', `${path.dirname(t.pathAlias)} does not exist; the writer never installs a host`);
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

/** Remove [start, end) and the newline after it; drop a blank separator left at the end. */
function without(text, start, end) {
  let tail = text.slice(end);
  if (tail.startsWith('\n')) tail = tail.slice(1);
  let head = text.slice(0, start);
  if (!tail && head.endsWith('\n\n')) head = head.slice(0, -1);
  return head + tail;
}
/** Append a block after one blank line, keeping the file's own last byte. */
function appended(text, segment) {
  const gap = text === '' ? '' : text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  return text + gap + segment + '\n';
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
  const text = r.readState === 'READ' ? r.text : '';
  const hits = (r.blocks || []).filter((b) => b.markerId === opts.id);
  const current = hits[0];
  if (current && current.syntaxState === 'OPTOUT') refuse('OPTED_OUT', `${t.pathAlias} carries ${opts.id}:OPTOUT; the operator declined this block`);
  if (current && current.syntaxState !== 'PAIRED') refuse('TARGET_MALFORMED', `${opts.id} is ${current.syntaxState}`);
  const beforeSeg = current ? text.slice(current.offset.start, current.offset.end) : '';
  const afterSeg = op === 'install' ? sourceSegment(opts.from, opts.id) : '';
  let after = text, action = 'unchanged';
  if (op === 'install') {
    if (current) {
      after = text.slice(0, current.offset.start) + afterSeg + text.slice(current.offset.end);
      action = after === text ? 'unchanged' : 'replace';
    } else { after = appended(text, afterSeg); action = 'insert'; }
  } else if (current) {
    after = without(text, current.offset.start, current.offset.end); action = 'remove';
  }
  return {
    op, id: opts.id, owner: opts.owner, host: t.host, pathAlias: t.pathAlias, file: t.file, action,
    before: { exists: r.readState === 'READ', sha256: r.readState === 'READ' ? r.sha256 : null, mode: r.mode === undefined ? null : r.mode, text },
    after: { sha256: sha(Buffer.from(after, 'utf8')), text: after },
    diff: action === 'unchanged' ? `No change: ${opts.id} in ${t.pathAlias} is already ${op === 'install' ? 'this block' : 'absent'}.\n`
      : [`--- ${t.pathAlias} ${opts.id} (current)`, `+++ ${t.pathAlias} ${opts.id} (after ${op})`,
        ...(beforeSeg ? beforeSeg.split('\n').map((x) => '-' + x) : []),
        ...(afterSeg ? afterSeg.split('\n').map((x) => '+' + x) : []), ''].join('\n'),
  };
}

// ---- journal ------------------------------------------------------------------

function stateDir(home) { return path.join(home, ...DIR); }
function journalPath(home) { return path.join(stateDir(home), 'journal.jsonl'); }

/** Every journal record, with the hash chain checked. A damaged journal refuses writes. */
function readJournal(home) {
  const file = journalPath(home);
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  if (raw && !raw.endsWith('\n')) refuse('JOURNAL_DAMAGED', 'the journal\'s last line is incomplete; preserve it and resolve by hand');
  const out = [];
  let prev = null;
  for (const line of raw.split('\n').filter(Boolean)) {
    let rec;
    try { rec = JSON.parse(line); } catch (e) { refuse('JOURNAL_DAMAGED', 'a journal line is not JSON'); }
    if (rec.schema !== SCHEMA || rec.previousRecordSha256 !== prev) refuse('JOURNAL_DAMAGED', 'the journal chain is broken; preserve it and resolve by hand');
    prev = sha(line);
    out.push(rec);
  }
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
      after: { sha256: planned.after.sha256 } };
    let seq = 0;
    const note = (state, extra = {}) => append(home, { ...base, sequence: ++seq, state, ...extra });
    note('PREPARED');
    let wrote = false;
    try {
      const snap = snapshot(planned.file);
      if (snap.sha256 !== planned.before.sha256 || snap.exists !== planned.before.exists) refuse('TARGET_CHANGED', 'the file changed after the preview; preview again');
      const saved = apply.protect(planned.file, { home, stamp });
      if (saved.action === 'backup-failed') refuse('BACKUP_FAILED', saved.error);
      const backup = saved.action === 'saved'
        ? { state: 'saved', name: path.basename(saved.path), sha256: sha(fs.readFileSync(saved.path)) }
        : { state: 'no-file', name: null, sha256: null };
      if (backup.state === 'saved' && backup.sha256 !== planned.before.sha256) refuse('BACKUP_FAILED', 'backup bytes differ from the previewed file');
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
    return { ...rec, state };
  });
}

// ---- CLI ----------------------------------------------------------------------

const USAGE = `managed-blocks/1 writer (docs/working-rules/managed-blocks.md)
  npx sshlg-skills blocks install OWNER:NAME --owner OWNER --agent claude|codex|gemini|pi --from <local-file> [--apply] [--json]
  npx sshlg-skills blocks uninstall OWNER:NAME --owner OWNER --agent claude|codex|gemini|pi [--apply] [--json]
  npx sshlg-skills blocks resolve <operation-id> [--json]
Without --apply: a preview, and nothing is written. With --apply: backup to
~/.sshlg-skills/backups/, journal in ~/.sshlg-skills/managed-blocks/journal.jsonl.
Exit 0 done or nothing to do, 1 refused, 2 bad arguments.
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
  try { f = parse(args); } catch (e) { write(`blocks: ${e.message}\n${USAGE}`); return 2; }
  const out = (obj, text) => write(f.json ? JSON.stringify(obj, null, 2) + '\n' : text);
  try {
    if (f.op === 'resolve') {
      const r = resolve(options.home, f.id);
      out({ schema: 'managed-blocks-operation/1', operationId: r.operationId, state: r.state, markerId: r.markerId, target: r.target.pathAlias }, `${r.markerId} on ${r.target.pathAlias}: ${r.state}\n`);
      return 0;
    }
    const p = plan({ ...options, ...f });
    if (!f.apply) {
      out({ schema: 'managed-blocks-operation/1', state: 'PREVIEW', op: p.op, markerId: p.id, target: p.pathAlias, action: p.action, beforeSha256: p.before.sha256, afterSha256: p.after.sha256 },
        p.diff + (p.action === 'unchanged' ? '' : `Preview only: nothing written. Re-run with --apply to ${p.op}.\n`));
      return 0;
    }
    const r = execute(p, options);
    out({ schema: 'managed-blocks-operation/1', state: r.state, op: p.op, markerId: p.id, target: p.pathAlias, action: r.action, operationId: r.operationId, backup: r.backup ? r.backup.name : null },
      r.action === 'unchanged' ? p.diff : `${p.op} ${p.id} → ${p.pathAlias}: ${r.state}${r.backup && r.backup.name ? `; backup ${r.backup.name}` : ''}; operation ${r.operationId}\n`);
    return 0;
  } catch (e) {
    if (!(e instanceof Refusal)) throw e;
    out({ schema: 'managed-blocks-operation/1', state: 'REFUSED', code: e.code, reason: e.message }, `blocks ${f.op}: refused — ${e.message}\n`);
    return 1;
  }
}

module.exports = { admit, plan, execute, resolve, readJournal, cli, USAGE, Refusal, journalPath };
