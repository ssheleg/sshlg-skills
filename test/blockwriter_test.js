'use strict';
// managed-blocks/1 writer (lib/blockwriter.js). Every case runs in a synthetic HOME:
// the operator's own instruction files are never opened. The cases that matter most
// are the byte ones — outside the selected block nothing may change, a preview writes
// nothing at all, and an interrupted write is classified, never guessed.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const W = require('../lib/blockwriter.js');

let n = 0;
function t(label, f) { f(); n++; console.log('  ok  ' + label); }
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
const block = (id, body) => `<!-- ${id}:BEGIN -->\n${body}\n<!-- ${id}:END -->`;
const ID = 'OBSERVATORY:AGENT-UPDATES';
const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blockwriter-'));
let k = 0;
/** A fresh synthetic home with ~/.claude/CLAUDE.md holding `text`, and a source file. */
function fixture(text, body = 'notice v2') {
  const home = path.join(root, 'h' + (++k));
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  const file = path.join(home, '.claude', 'CLAUDE.md');
  if (text !== null) { fs.writeFileSync(file, text); fs.chmodSync(file, 0o640); }
  const from = path.join(home, 'source.md');
  fs.writeFileSync(from, block(ID, body) + '\n');
  return { home, file, from };
}
/** Every file under home with its bytes' hash and mode — the whole tree, not one file. */
function tree(dir) {
  const out = {};
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else out[path.relative(dir, p)] = [sha(fs.readFileSync(p)), fs.statSync(p).mode & 0o777];
  } };
  walk(dir);
  return out;
}
const cli = (home, args, env = {}) => spawnSync(process.execPath, [BIN, 'blocks', ...args],
  { env: { PATH: process.env.PATH, HOME: home, ...env }, encoding: 'utf8' });
const opts = (f, extra = {}) => ({ home: f.home, env: {}, agent: 'claude', id: ID, owner: 'OBSERVATORY', from: f.from, ...extra });
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

const PROSE = '# Operator rules\n\nhand-written line\n';
const ROUTERS = block('SSHLG:ROUTERS', 'routing');
const HANDOFF = block('SSHLG:REPOSITORY-HANDOFF', 'handoff');

try {
  t('admission: hub blocks keep their dedicated writers; REPOSITORY-HANDOFF stays undecided', () => {
    assert.strictEqual(code(() => W.admit('SSHLG:ROUTERS', 'SSHLG')), 'DEDICATED_WRITER');
    assert.strictEqual(code(() => W.admit('SSHLG:ROUTER:fabric', 'SSHLG')), 'DEDICATED_WRITER');
    assert.strictEqual(code(() => W.admit('SSHLG:RULE:wait-is-not-a-stop', 'SSHLG')), 'DEDICATED_WRITER');
    assert.strictEqual(code(() => W.admit('SSHLG:REPOSITORY-HANDOFF', 'SSHLG')), 'OPERATOR_DECISION_REQUIRED');
    assert.strictEqual(code(() => W.admit('SSHLG:NEW-THING', 'SSHLG')), 'RESERVED_PREFIX');
    assert.strictEqual(code(() => W.admit(ID, 'FABRIC')), 'OWNER_MISMATCH');
    assert.strictEqual(code(() => W.admit(ID)), 'OWNER_REQUIRED');
    assert.strictEqual(code(() => W.admit('lower:case', 'lower')), 'BAD_MARKER');
    assert.strictEqual(W.admit(ID, 'OBSERVATORY'), 'OBSERVATORY');
  });

  t('preview (CLI, default) writes nothing anywhere under HOME', () => {
    const f = fixture(PROSE + ROUTERS + '\n');
    const before = tree(f.home);
    const r = cli(f.home, ['install', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--from', f.from]);
    assert.strictEqual(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stdout, /\+notice v2/);
    assert.match(r.stdout, /Preview only: nothing written/);
    assert.deepStrictEqual(tree(f.home), before);
    assert(!fs.existsSync(path.join(f.home, '.sshlg-skills')));
  });

  t('install appends the block on its own line, preserving every byte before it; uninstall restores the file exactly', () => {
    const original = PROSE + ROUTERS + '\n' + HANDOFF + '\n';
    const f = fixture(original);
    const r = W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    assert.strictEqual(r.state, 'VERIFIED');
    const after = fs.readFileSync(f.file, 'utf8');
    assert.strictEqual(after, original + block(ID, 'notice v2') + '\n');
    assert.strictEqual(fs.statSync(f.file).mode & 0o777, 0o640, 'mode preserved');
    const u = W.execute(W.plan(opts(f, { op: 'uninstall', from: undefined })), { home: f.home });
    assert.strictEqual(u.state, 'VERIFIED');
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), original);
  });

  t('replace changes only the selected segment; backup and journal bind the old bytes', () => {
    const head = PROSE + ROUTERS + '\n\n';
    const tail = '\n\n' + HANDOFF + '\nlast line without newline';
    const original = head + block(ID, 'notice v1') + tail;
    const f = fixture(original);
    const r = W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home, stamp: '20261014T120000Z' });
    const after = fs.readFileSync(f.file, 'utf8');
    assert.strictEqual(after, head + block(ID, 'notice v2') + tail);
    const backup = path.join(f.home, '.sshlg-skills', 'backups', r.backup.name);
    assert.strictEqual(fs.readFileSync(backup, 'utf8'), original);
    assert.strictEqual(fs.statSync(backup).mode & 0o777, 0o600);
    const journal = W.readJournal(f.home);
    assert.deepStrictEqual(journal.map((x) => x.state), ['PREPARED', 'BACKUP_VERIFIED', 'WRITE_INTENT', 'VERIFIED']);
    assert(journal.every((x) => x.operationId === r.operationId));
    assert.strictEqual(journal[0].before.sha256, sha(original));
    assert.strictEqual(journal[3].after.sha256, sha(after));
    const raw = fs.readFileSync(W.journalPath(f.home), 'utf8');
    assert(!raw.includes('notice v1') && !raw.includes('notice v2') && !raw.includes('hand-written'), 'the journal carries no block or file text');
    assert.strictEqual(fs.statSync(W.journalPath(f.home)).mode & 0o777, 0o600);
    assert.strictEqual(fs.statSync(path.dirname(W.journalPath(f.home))).mode & 0o777, 0o700);
  });

  t('the real CLI is idempotent: three --apply runs, one write, one journaled operation', () => {
    const f = fixture(PROSE);
    const hashes = [];
    for (let i = 0; i < 3; i++) {
      const r = cli(f.home, ['install', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--from', f.from, '--apply', '--json']);
      assert.strictEqual(r.status, 0, r.stderr + r.stdout);
      assert.strictEqual(JSON.parse(r.stdout).state, i === 0 ? 'VERIFIED' : 'UNCHANGED');
      hashes.push(sha(fs.readFileSync(f.file)));
    }
    assert.strictEqual(new Set(hashes).size, 1);
    assert.strictEqual(new Set(W.readJournal(f.home).map((x) => x.operationId)).size, 1);
  });

  t('a new file is created only inside an installed host, and a missing host is refused', () => {
    const f = fixture(null);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), block(ID, 'notice v2') + '\n');
    assert.strictEqual(code(() => W.plan(opts(f, { op: 'install', agent: 'codex' }))), 'HOST_ABSENT');
    assert.strictEqual(code(() => W.plan(opts(f, { op: 'install', agent: 'cursor' }))), 'UNSUPPORTED_HOST');
  });

  t('the host root follows CLAUDE_CONFIG_DIR like blocks lists it', () => {
    const f = fixture(PROSE);
    const alt = path.join(f.home, 'alt-claude');
    fs.mkdirSync(alt);
    fs.writeFileSync(path.join(alt, 'CLAUDE.md'), PROSE);
    const p = W.plan(opts(f, { op: 'install', env: { CLAUDE_CONFIG_DIR: alt } }));
    assert.strictEqual(p.pathAlias, '${CLAUDE_CONFIG_DIR}/CLAUDE.md');
    W.execute(p, { home: f.home });
    assert(fs.readFileSync(path.join(alt, 'CLAUDE.md'), 'utf8').includes('notice v2'));
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE);
  });

  t('opt-out, malformed markers, symlinked targets and bad sources are refused without writes', () => {
    const cases = [
      [PROSE + `<!-- ${ID}:OPTOUT -->\n`, 'OPTED_OUT'],
      [PROSE + `<!-- ${ID}:BEGIN -->\nunclosed\n`, 'TARGET_MALFORMED'],
      [PROSE + block('SSHLG:ROUTERS', block(ID, 'nested')) + '\n', 'TARGET_MALFORMED'],
    ];
    for (const [text, want] of cases) {
      const f = fixture(text);
      const before = tree(f.home);
      assert.strictEqual(code(() => W.plan(opts(f, { op: 'install' }))), want, text);
      assert.deepStrictEqual(tree(f.home), before);
    }
    const f = fixture(PROSE);
    const real = path.join(f.home, 'real.md');
    fs.renameSync(f.file, real);
    fs.symlinkSync(real, f.file);
    assert.strictEqual(code(() => W.plan(opts(f, { op: 'install' }))), 'TARGET_UNREADABLE');
    const g = fixture(PROSE);
    fs.writeFileSync(g.from, block(ID, 'a') + '\n' + block('OTHER:B', 'b') + '\n');
    assert.strictEqual(code(() => W.plan(opts(g, { op: 'install' }))), 'SOURCE_INVALID');
    fs.writeFileSync(g.from, block('OTHER:B', 'b') + '\n');
    assert.strictEqual(code(() => W.plan(opts(g, { op: 'install' }))), 'SOURCE_INVALID');
    assert.strictEqual(code(() => W.plan(opts(g, { op: 'install', from: 'https://example.com/x.md' }))), 'SOURCE_REQUIRED');
  });

  t('a file changed between preview and write is refused and journaled REFUSED', () => {
    const f = fixture(PROSE);
    const p = W.plan(opts(f, { op: 'install' }));
    fs.appendFileSync(f.file, 'operator edit\n');
    assert.strictEqual(code(() => W.execute(p, { home: f.home })), 'TARGET_CHANGED');
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE + 'operator edit\n');
    assert.strictEqual(W.readJournal(f.home).pop().state, 'REFUSED');
  });

  t('a failed backup cancels the write', () => {
    const f = fixture(PROSE);
    fs.mkdirSync(path.join(f.home, '.sshlg-skills'), { mode: 0o700 });
    fs.writeFileSync(path.join(f.home, '.sshlg-skills', 'backups'), 'not a directory');
    assert.strictEqual(code(() => W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home })), 'BACKUP_FAILED');
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE);
  });

  t('an interrupted write is RECOVERY_REQUIRED, blocks the next write, and resolve classifies it', () => {
    const rename = fs.renameSync;
    // (a) crash before the rename landed → before bytes → RECOVERED_NO_WRITE
    const a = fixture(PROSE);
    fs.renameSync = () => { throw Object.assign(new Error('simulated crash'), { code: 'EIO' }); };
    try { assert.strictEqual(code(() => W.execute(W.plan(opts(a, { op: 'install' })), { home: a.home })), 'EIO'); }
    finally { fs.renameSync = rename; }
    const open = W.readJournal(a.home).pop();
    assert.strictEqual(open.state, 'RECOVERY_REQUIRED');
    assert.strictEqual(code(() => W.execute(W.plan(opts(a, { op: 'install' })), { home: a.home })), 'RECOVERY_REQUIRED');
    assert.strictEqual(W.resolve(a.home, open.operationId).state, 'RECOVERED_NO_WRITE');
    assert.strictEqual(W.execute(W.plan(opts(a, { op: 'install' })), { home: a.home }).state, 'VERIFIED');
    // (b) crash after the rename landed → after bytes → RECOVERED_COMMITTED
    const b = fixture(PROSE);
    fs.renameSync = (...x) => { rename(...x); throw Object.assign(new Error('simulated crash'), { code: 'EIO' }); };
    try { code(() => W.execute(W.plan(opts(b, { op: 'install' })), { home: b.home })); } finally { fs.renameSync = rename; }
    assert.strictEqual(W.resolve(b.home, W.readJournal(b.home).pop().operationId).state, 'RECOVERED_COMMITTED');
    // (c) a third content stays open for a person
    const c = fixture(PROSE);
    fs.renameSync = () => { throw Object.assign(new Error('simulated crash'), { code: 'EIO' }); };
    try { code(() => W.execute(W.plan(opts(c, { op: 'install' })), { home: c.home })); } finally { fs.renameSync = rename; }
    fs.appendFileSync(c.file, 'someone else\n');
    const id = W.readJournal(c.home).pop().operationId;
    assert.strictEqual(code(() => W.resolve(c.home, id)), 'UNRESOLVED');
    assert.strictEqual(W.readJournal(c.home).pop().state, 'RECOVERY_REQUIRED');
    // the CLI names the command that resolves it
    const r = cli(c.home, ['install', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--from', c.from, '--apply']);
    assert.strictEqual(r.status, 1);
    assert.match(r.stdout, new RegExp(`blocks resolve ${id}`));
  });

  t('a damaged journal and a held lock refuse, and nothing is written', () => {
    const f = fixture(PROSE);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    fs.appendFileSync(W.journalPath(f.home), '{"schema":"managed-blocks-journal/1"');
    assert.strictEqual(code(() => W.execute(W.plan(opts(f, { op: 'uninstall', from: undefined })), { home: f.home })), 'JOURNAL_DAMAGED');
    assert(fs.readFileSync(f.file, 'utf8').includes('notice v2'));
    const g = fixture(PROSE);
    fs.mkdirSync(path.join(g.home, '.sshlg-skills', 'managed-blocks'), { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(g.home, '.sshlg-skills', 'managed-blocks', '.lock'), '');
    assert.strictEqual(code(() => W.execute(W.plan(opts(g, { op: 'install' })), { home: g.home })), 'LOCKED');
    assert.strictEqual(fs.readFileSync(g.file, 'utf8'), PROSE);
  });

  t('--help answers for blocks and for each writer verb; bad flags exit 2', () => {
    const f = fixture(PROSE);
    for (const args of [['--help'], ['install', '--help'], ['uninstall', '-h'], ['resolve', '--help']]) {
      const r = cli(f.home, args);
      assert.strictEqual(r.status, 0, args.join(' ') + r.stderr);
      assert.match(r.stdout, /blocks install OWNER:NAME/);
    }
    assert.strictEqual(cli(f.home, ['install', ID, '--agent', 'claude', '--from', f.from, '--force']).status, 2);
    assert.strictEqual(cli(f.home, ['uninstall', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--from', f.from]).status, 2);
  });

  t('an edit made between the backup and the rename is kept, not overwritten (pre-rename compare)', () => {
    const f = fixture(PROSE);
    const p = W.plan(opts(f, { op: 'install' }));
    const write = fs.writeFileSync;
    let fired = false;
    // The temporary copy is written after the backup: edit the target at that moment.
    fs.writeFileSync = (target, data, ...rest) => {
      if (!fired && typeof target === 'number' && data === p.after.text) { fired = true; fs.appendFileSync(f.file, 'operator edit\n'); }
      return write(target, data, ...rest);
    };
    try { assert.strictEqual(code(() => W.execute(p, { home: f.home })), 'TARGET_CHANGED'); }
    finally { fs.writeFileSync = write; }
    assert(fired, 'the edit was never made — the case proves nothing');
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE + 'operator edit\n');
    assert.strictEqual(W.readJournal(f.home).pop().state, 'REFUSED');
    assert.deepStrictEqual(fs.readdirSync(path.dirname(f.file)), ['CLAUDE.md'], 'no temporary file left beside the target');
  });

  t('a backup that does not hold the previewed bytes cancels the write (backup-hash compare)', () => {
    const f = fixture(PROSE);
    const p = W.plan(opts(f, { op: 'install' }));
    const A = require('../lib/apply.js');
    const protect = A.protect;
    // The file changes after the preview check and before the copy: the copy is of other bytes.
    A.protect = (file, o) => { fs.appendFileSync(f.file, 'late edit\n'); return protect(file, o); };
    try { assert.strictEqual(code(() => W.execute(p, { home: f.home })), 'BACKUP_FAILED'); }
    finally { A.protect = protect; }
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE + 'late edit\n');
    assert.strictEqual(W.readJournal(f.home).pop().state, 'REFUSED');
  });

  t('the journal chain: an edited middle record that is still valid JSON is refused', () => {
    const f = fixture(PROSE);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    const file = W.journalPath(f.home);
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    const rec = JSON.parse(lines[1]);
    rec.state = 'REFUSED'; // valid JSON, same count, last line untouched — only the chain sees it
    lines[1] = JSON.stringify(rec);
    fs.writeFileSync(file, lines.join('\n') + '\n');
    assert.strictEqual(code(() => W.readJournal(f.home)), 'JOURNAL_DAMAGED');
    assert.strictEqual(code(() => W.execute(W.plan(opts(f, { op: 'uninstall', from: undefined })), { home: f.home })), 'JOURNAL_DAMAGED');
    assert(fs.readFileSync(f.file, 'utf8').includes('notice v2'));
  });

  t('the journal head: a whole trailing operation cut off, or a missing head, is refused; the crash window is not', () => {
    const f = fixture(PROSE);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    W.execute(W.plan(opts(f, { op: 'uninstall', from: undefined })), { home: f.home });
    const file = W.journalPath(f.home);
    const full = fs.readFileSync(file, 'utf8');
    const lines = full.split('\n').filter(Boolean);
    assert.strictEqual(lines.length, 8);
    fs.writeFileSync(file, lines.slice(0, 4).join('\n') + '\n'); // the chain of the first four is intact
    assert.strictEqual(code(() => W.readJournal(f.home)), 'JOURNAL_DAMAGED');
    fs.writeFileSync(file, full);
    assert.strictEqual(fs.statSync(W.headPath(f.home)).mode & 0o777, 0o600);
    const head = fs.readFileSync(W.headPath(f.home));
    fs.unlinkSync(W.headPath(f.home));
    assert.strictEqual(code(() => W.readJournal(f.home)), 'JOURNAL_DAMAGED');
    // Crash between the journal append and the head update: one extra chained record.
    fs.writeFileSync(W.headPath(f.home), JSON.stringify({ schema: 'managed-blocks-journal-head/1', count: 7, lastSha256: sha(lines[6]) }) + '\n');
    assert.strictEqual(W.readJournal(f.home).length, 8);
    fs.writeFileSync(W.headPath(f.home), head);
  });

  t('install then uninstall round-trips files ending in a newline exactly, blank trailing lines included', () => {
    for (const original of ['abc\n\n', 'abc\n\n\n', '# x\n', '', PROSE + ROUTERS + '\n', 'a\r\nb\r\n\r\n']) {
      const f = fixture(original);
      W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
      assert(fs.readFileSync(f.file, 'utf8').startsWith(original), 'install changed a byte before the block');
      W.execute(W.plan(opts(f, { op: 'uninstall', from: undefined })), { home: f.home });
      assert.strictEqual(fs.readFileSync(f.file, 'utf8'), original, JSON.stringify(original));
    }
    const g = fixture('# x'); // documented: a file without a final newline gains one
    W.execute(W.plan(opts(g, { op: 'install' })), { home: g.home });
    W.execute(W.plan(opts(g, { op: 'uninstall', from: undefined })), { home: g.home });
    assert.strictEqual(fs.readFileSync(g.file, 'utf8'), '# x\n');
  });

  t('a symlinked host directory is written through, like blocks reads it; a dangling one is named', () => {
    const f = fixture(null);
    const real = path.join(f.home, 'dotfiles-claude');
    fs.mkdirSync(real);
    fs.writeFileSync(path.join(real, 'CLAUDE.md'), PROSE);
    fs.rmdirSync(path.join(f.home, '.claude'));
    fs.symlinkSync(real, path.join(f.home, '.claude'));
    assert.strictEqual(W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home }).state, 'VERIFIED');
    assert(fs.lstatSync(path.join(f.home, '.claude')).isSymbolicLink(), 'the link itself is kept');
    assert(fs.readFileSync(path.join(real, 'CLAUDE.md'), 'utf8').includes('notice v2'));
    const g = fixture(null);
    fs.rmdirSync(path.join(g.home, '.claude'));
    fs.symlinkSync(path.join(g.home, 'nowhere'), path.join(g.home, '.claude'));
    assert.throws(() => W.plan(opts(g, { op: 'install' })), /HOST_ABSENT: ~\/\.claude is a link to nothing/);
  });

  t('an error under --apply answers in the JSON shape and names blocks resolve, without a stack trace', () => {
    const f = fixture(PROSE);
    const rename = fs.renameSync;
    let said = '';
    fs.renameSync = () => { throw Object.assign(new Error('simulated disk error'), { code: 'EIO' }); };
    let status;
    try { status = W.cli(['install', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--from', f.from, '--apply', '--json'], { home: f.home, env: {} }, (x) => { said += x; }); }
    finally { fs.renameSync = rename; }
    assert.strictEqual(status, 1);
    const out = JSON.parse(said);
    assert.strictEqual(out.state, 'RECOVERY_REQUIRED');
    assert.strictEqual(out.code, 'EIO');
    assert.match(out.resolve, /^npx sshlg-skills blocks resolve [a-f0-9]{32}$/);
    assert(!said.includes('    at '), 'a stack trace reached the output');
    said = '';
    fs.renameSync = () => { throw Object.assign(new Error('simulated disk error'), { code: 'EIO' }); };
    try { W.cli(['install', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--from', f.from, '--apply'], { home: f.home, env: {} }, (x) => { said += x; }); }
    finally { fs.renameSync = rename; }
    assert.match(said, /refused — RECOVERY_REQUIRED/, 'the next write names the open operation');
  });

  t('the journal head covers the last record: an edited or deleted last line is refused', () => {
    const f = fixture(PROSE);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    const file = W.journalPath(f.home);
    const full = fs.readFileSync(file, 'utf8');
    const lines = full.split('\n').filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]);
    last.state = 'REFUSED';
    fs.writeFileSync(file, lines.slice(0, -1).concat(JSON.stringify(last)).join('\n') + '\n');
    assert.strictEqual(code(() => W.readJournal(f.home)), 'JOURNAL_DAMAGED');
    fs.writeFileSync(file, lines.slice(0, -1).join('\n') + '\n');
    assert.strictEqual(code(() => W.readJournal(f.home)), 'JOURNAL_DAMAGED');
    fs.writeFileSync(file, full);
    assert.strictEqual(W.readJournal(f.home).length, 4);
    fs.writeFileSync(file, full + 'null\n');
    assert.strictEqual(code(() => W.readJournal(f.home)), 'JOURNAL_DAMAGED');
  });

  t('an unexpected error answers as JSON ERROR, exit 1; retries reuse one backup; bad arguments answer JSON', () => {
    const f = fixture(PROSE);
    const open = fs.openSync;
    fs.openSync = (p, ...rest) => {
      if (String(p).includes('.sshlg-block-')) throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
      return open(p, ...rest);
    };
    const outs = [];
    try {
      for (let i = 0; i < 3; i++) {
        let said = '';
        const status = W.cli(['install', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--from', f.from, '--apply', '--json'], { home: f.home, env: {} }, (x) => { said += x; });
        assert.strictEqual(status, 1);
        outs.push(JSON.parse(said));
      }
    } finally { fs.openSync = open; }
    assert(outs.every((o) => o.state === 'ERROR' && o.code === 'EACCES' && o.resolve === null));
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE);
    const backups = fs.readdirSync(path.join(f.home, '.sshlg-skills', 'backups')).filter((n) => n.startsWith('CLAUDE.md--v2-'));
    assert.strictEqual(backups.length, 1, `three failed retries took ${backups.length} backups`);
    assert.deepStrictEqual(W.readJournal(f.home).filter((r) => r.state === 'BACKUP_VERIFIED').map((r) => r.backup.state), ['saved', 'reused', 'reused']);
    let said = '';
    assert.strictEqual(W.cli(['install', ID, '--agent', 'claude', '--json', '--bogus'], { home: f.home, env: {} }, (x) => { said += x; }), 2);
    assert.strictEqual(JSON.parse(said).code, 'BAD_ARGUMENTS');
  });

  t('a write whose result would not parse is refused: an unterminated <!-- would swallow the block', () => {
    const f = fixture('# x\n<!-- a note never closed\n');
    const before = tree(f.home);
    assert.strictEqual(code(() => W.plan(opts(f, { op: 'install' }))), 'RESULT_WOULD_NOT_PARSE');
    assert.deepStrictEqual(tree(f.home), before);
  });

  t('a fenced example of the block is neither replaced nor removed', () => {
    const example = '```markdown\n' + block(ID, 'example') + '\n```\n';
    const f = fixture(PROSE + example);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE + example + block(ID, 'notice v2') + '\n');
    fs.writeFileSync(f.from, block(ID, 'notice v3') + '\n');
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE + example + block(ID, 'notice v3') + '\n');
    W.execute(W.plan(opts(f, { op: 'uninstall', from: undefined })), { home: f.home });
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), PROSE + example);
  });

  t('a read-only file is refused, not replaced by a rename', () => {
    const f = fixture(PROSE);
    fs.chmodSync(f.file, 0o444);
    assert.strictEqual(code(() => W.plan(opts(f, { op: 'install' }))), 'READ_ONLY');
    assert.strictEqual(fs.statSync(f.file).mode & 0o777, 0o444);
  });

  t('CRLF files get the block in CRLF and keep every byte', () => {
    const original = '# rules\r\n\r\nline\r\n';
    const f = fixture(original);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    const after = fs.readFileSync(f.file, 'utf8');
    assert.strictEqual(after, original + block(ID, 'notice v2').replace(/\n/g, '\r\n') + '\r\n');
    assert(!/[^\r]\n/.test(after), 'a bare LF was written into a CRLF file');
    W.execute(W.plan(opts(f, { op: 'uninstall', from: undefined })), { home: f.home });
    assert.strictEqual(fs.readFileSync(f.file, 'utf8'), original);
  });

  t('resolve removes the writer\'s own leftover temporary files and nothing else', () => {
    const f = fixture(PROSE);
    const rename = fs.renameSync;
    const unlink = fs.unlinkSync;
    fs.renameSync = () => { throw Object.assign(new Error('simulated crash'), { code: 'EIO' }); };
    fs.unlinkSync = (p) => { if (String(p).includes('.sshlg-block-')) return; return unlink(p); }; // the crash leaves the temporary file
    try { code(() => W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home })); }
    finally { fs.renameSync = rename; fs.unlinkSync = unlink; }
    const dir = path.dirname(f.file);
    fs.writeFileSync(path.join(dir, '.sshlg-block-notours.tmp'), 'someone else');
    assert.strictEqual(fs.readdirSync(dir).filter((n) => /^\.sshlg-block-[a-f0-9]{24}\.tmp$/.test(n)).length, 1);
    const r = W.resolve(f.home, W.readJournal(f.home).pop().operationId);
    assert.strictEqual(r.state, 'RECOVERED_NO_WRITE');
    assert.strictEqual(r.removedTemporaryFiles, 1);
    assert.deepStrictEqual(fs.readdirSync(dir).sort(), ['.sshlg-block-notours.tmp', 'CLAUDE.md']);
  });

  t('replacing or removing an edited block warns that the edits are dropped and names the backup', () => {
    const f = fixture(PROSE);
    W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    assert.deepStrictEqual(W.plan(opts(f, { op: 'uninstall', from: undefined })).warnings, [], 'an unedited block warns');
    fs.writeFileSync(f.file, fs.readFileSync(f.file, 'utf8').replace('notice v2', 'notice v2 plus my own line'));
    const p = W.plan(opts(f, { op: 'uninstall', from: undefined }));
    assert.strictEqual(p.warnings.length, 1);
    assert.match(p.warnings[0], /edited since operation [a-f0-9]{32}; those in-block edits are dropped/);
    let said = '';
    W.cli(['uninstall', ID, '--owner', 'OBSERVATORY', '--agent', 'claude', '--apply'], { home: f.home, env: {} }, (x) => { said += x; });
    assert.match(said, /Warning: .*edits are dropped.*\(CLAUDE\.md--v2-[a-f0-9]{64}\.\d{8}T\d{6}Z/);
    const g = fixture(PROSE + block(ID, 'placed by hand') + '\n');
    assert.match(W.plan(opts(g, { op: 'install' })).warnings[0], /not installed through this writer/);
  });
} finally { fs.rmSync(root, { recursive: true, force: true }); }
console.log(`PASS: blockwriter — ${n} cases`);
