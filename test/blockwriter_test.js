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

  t('install inserts after the last byte, preserving every byte before it; uninstall restores the file exactly', () => {
    const original = PROSE + ROUTERS + '\n' + HANDOFF + '\n';
    const f = fixture(original);
    const r = W.execute(W.plan(opts(f, { op: 'install' })), { home: f.home });
    assert.strictEqual(r.state, 'VERIFIED');
    const after = fs.readFileSync(f.file, 'utf8');
    assert.strictEqual(after, original + '\n' + block(ID, 'notice v2') + '\n');
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
} finally { fs.rmSync(root, { recursive: true, force: true }); }
console.log(`PASS: blockwriter — ${n} cases`);
