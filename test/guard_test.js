#!/usr/bin/env node
'use strict';
// Fixtures for lib/guard.js — which tool calls are about to overwrite a file the
// operator cannot recover.
//
// Two failure directions, and the file is worthless without both:
//   - a MISS lets an unbacked write through, which is the defect this whole
//     module exists to close;
//   - a FALSE HIT takes a copy of a file nobody touched, and a guard that fires
//     on `cat` is a guard the operator switches off inside a week.
//
// Every near miss below is a real shape an agent emits, not an invented one.

const assert = require('assert');
const path = require('path');
const G = require('../lib/guard.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const HOME = '/home/op';
const CLAUDE = path.join(HOME, '.claude', 'CLAUDE.md');
const CURSOR = path.join(HOME, '.cursor', 'rules', 'sshlg-routing.mdc');
const SETTINGS = path.join(HOME, '.claude', 'settings.json');

const hit = (payload) => G.decide(payload, HOME);
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });

it('every documented target is protected, and each one is reachable', () => {
  const list = G.targets(HOME);
  assert.strictEqual(list.length, 5, `expected five targets, got ${list.length}`);
  for (const f of [CLAUDE, CURSOR, SETTINGS,
                   path.join(HOME, '.codex', 'AGENTS.md'),
                   path.join(HOME, '.gemini', 'GEMINI.md')]) {
    assert.ok(list.includes(f), `not protected: ${f}`);
  }
});

// ---- the file tools -------------------------------------------------------

it('Edit on a protected file is caught', () => {
  assert.strictEqual(hit({ tool_name: 'Edit', tool_input: { file_path: CLAUDE } }), CLAUDE);
});

it('Write on a protected file is caught', () => {
  assert.strictEqual(hit({ tool_name: 'Write', tool_input: { file_path: CURSOR } }), CURSOR);
});

it('NotebookEdit names its file differently and is still caught', () => {
  assert.strictEqual(hit({ tool_name: 'NotebookEdit', tool_input: { notebook_path: CLAUDE } }), CLAUDE);
});

it('an ordinary source file is silence', () => {
  assert.strictEqual(hit({ tool_name: 'Edit', tool_input: { file_path: '/repo/lib/x.js' } }), null);
});

it('a file whose name merely starts with a protected one is NOT it', () => {
  assert.strictEqual(hit({ tool_name: 'Write', tool_input: { file_path: CLAUDE + '.bak' } }), null,
    'a backup of the file was mistaken for the file');
});

// ---- Bash: the forms that write -------------------------------------------

it('truncating redirect', () => assert.strictEqual(hit(bash(`echo hi > ${CLAUDE}`)), CLAUDE));
it('appending redirect', () => assert.strictEqual(hit(bash(`echo hi >> ${CLAUDE}`)), CLAUDE));
it('tee', () => assert.strictEqual(hit(bash(`echo hi | tee ${CLAUDE}`)), CLAUDE));
it('sed -i', () => assert.strictEqual(hit(bash(`sed -i '' 's/a/b/' ${CLAUDE}`)), CLAUDE));
it('cp over it', () => assert.strictEqual(hit(bash(`cp /tmp/new ${CLAUDE}`)), CLAUDE));
it('mv over it', () => assert.strictEqual(hit(bash(`mv /tmp/new ${CLAUDE}`)), CLAUDE));
it('rm', () => assert.strictEqual(hit(bash(`rm -f ${CLAUDE}`)), CLAUDE));
it('heredoc', () => assert.strictEqual(hit(bash(`cat > ${CLAUDE} <<'EOF'\nx\nEOF`)), CLAUDE));

it('the tilde spelling is the same file', () => {
  assert.strictEqual(hit(bash('echo hi > ~/.claude/CLAUDE.md')), CLAUDE);
});

it('the $HOME spelling is the same file', () => {
  assert.strictEqual(hit(bash('echo hi > $HOME/.claude/CLAUDE.md')), CLAUDE);
  assert.strictEqual(hit(bash('echo hi > ${HOME}/.claude/CLAUDE.md')), CLAUDE);
});

it('a write buried after a harmless first command is still caught', () => {
  assert.strictEqual(hit(bash(`cd /tmp && printf x >> ${CURSOR}`)), CURSOR);
});

it('settings.json counts — the launcher is not the only thing that edits it', () => {
  assert.strictEqual(hit(bash(`echo '{}' > ${SETTINGS}`)), SETTINGS);
});

// ---- Bash: the near misses that must stay silent ---------------------------

it('reading it is not writing it', () => {
  for (const cmd of [`cat ${CLAUDE}`, `grep -n foo ${CLAUDE}`, `head -20 ${CLAUDE}`,
                     `wc -l ${CLAUDE}`, `diff ${CLAUDE} /tmp/other`]) {
    assert.strictEqual(hit(bash(cmd)), null, `fired on a read: ${cmd}`);
  }
});

it('writing a BACKUP of it is not writing it', () => {
  assert.strictEqual(hit(bash(`cp ${CLAUDE} ${CLAUDE}.2026-08-12`)), null,
    'copying the file to a dated name was read as overwriting the file');
});

it('reading it while writing somewhere else implicates nothing', () => {
  assert.strictEqual(hit(bash(`cat ${CLAUDE} > /tmp/copy.md`)), null,
    'a read piped into another file was read as a write to the source');
});

it('a path that merely contains the name is a different file', () => {
  assert.strictEqual(hit(bash('echo x > /repo/docs/CLAUDE.md')), null);
  assert.strictEqual(hit(bash(`echo x > ${CLAUDE}.tmp`)), null);
});

it('an unrelated command with no path at all is silence', () => {
  assert.strictEqual(hit(bash('npm test && git status')), null);
});

// ---- shape robustness ------------------------------------------------------

it('a payload with no input at all is silence, not a throw', () => {
  assert.strictEqual(hit({}), null);
  assert.strictEqual(hit({ tool_name: 'Bash' }), null);
  assert.strictEqual(G.decide(undefined, HOME), null);
});

it('the matcher list covers every tool that can write', () => {
  for (const t of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Bash']) {
    assert.ok(G.TOOLS.includes(t), `the hook matcher would miss ${t}`);
  }
});

// EVERY ORDINARY SPELLING OF "WRITE TO THE FILE", MEASURED IN BOTH DIRECTIONS.
//
// Ten spellings on 2026-09-01: three caught, seven not. The sharpest was
// `echo x > "$HOME/.claude/CLAUDE.md"` — `spellings()` enumerates `$HOME/…` and
// `${HOME}/…` ON PURPOSE, so the author meant to catch that line, and a pair of quotes
// cancelled it because `REDIRECT` is tested against `segment.slice(0, at)`, which ends
// in the quote. Quoting a `$HOME` path is standard agent practice. `2>` and `&>` were
// excluded by a character class and truncate exactly as `>` does; `>|` lost its path to
// the pipe split.
//
// The negatives matter as much: widening a guard that already decides `allow` buys
// false positives with the operator's own permission prompt, so each one is asserted.
const H = '/Users/tester';
const CM = `${H}/.claude/CLAUDE.md`;
const WRITES = [
  ['plain tilde', 'echo x > ~/.claude/CLAUDE.md'],
  ['plain absolute', `echo x > ${CM}`],
  ['quoted $HOME', 'echo x > "$HOME/.claude/CLAUDE.md"'],
  ['quoted ${HOME}', 'echo x > "${HOME}/.claude/CLAUDE.md"'],
  ['quoted tilde', 'echo x > "~/.claude/CLAUDE.md"'],
  ['no space before the quote', `echo x >"${CM}"`],
  ['fd redirect 2>', 'cmd 2> ~/.claude/CLAUDE.md'],
  ['fd redirect &>', 'cmd &> ~/.claude/CLAUDE.md'],
  ['clobber >|', 'echo x >| ~/.claude/CLAUDE.md'],
  ['append >>', 'echo x >> ~/.claude/CLAUDE.md'],
  ['tee', 'echo x | tee ~/.claude/CLAUDE.md'],
  ['rm', 'rm ~/.claude/CLAUDE.md'],
];
const NOT_WRITES = [
  ['reading it', 'cat ~/.claude/CLAUDE.md'],
  ['a neighbouring file', 'echo x > ~/.claude/CLAUDE.md.bak'],
  ['the name inside a pipe', 'echo x | grep CLAUDE.md'],
  ['a comparison, not a write', `diff ${CM} /tmp/other`],
];

it('EVERY ORDINARY SPELLING OF A WRITE IS CAUGHT', () => {
  const missed = WRITES.filter(([, cmd]) =>
    !G.decide({ tool_name: 'Bash', tool_input: { command: cmd } }, H));
  assert.deepStrictEqual(missed.map(([n]) => n), [],
    'these destroy the file and walk past the guard');
});

it('AND WIDENING IT DID NOT BUY FALSE POSITIVES', () => {
  const overcaught = NOT_WRITES.filter(([, cmd]) =>
    G.decide({ tool_name: 'Bash', tool_input: { command: cmd } }, H));
  assert.deepStrictEqual(overcaught.map(([n]) => n), [],
    'the guard claimed a write that is not one — and it answers `allow`, so a false '
    + 'positive spends the operator\'s own permission prompt');
});

// THE GAP THAT WAS DECLARED IS NOW CLOSED, AND THE FIXTURE CLOSED WITH IT.
//
// `cd ~/.claude && echo x > CLAUDE.md` writes the same file as the absolute form, and
// only the first walked past: `spellings()` enumerates absolute and `$HOME` forms, none
// of which appear in a command that has already moved. The segments run in order, so the
// cwd is tracked across them and the relative spelling is offered beside the others.
//
// The resolver is `lib/repogate.js`'s, exported rather than copied — this family keeps a
// guard against copied mechanisms, and a second `cd` parser is what it exists to catch.
//
// The negatives matter as much as before, and one of them is new: a file of the same
// NAME under a different directory must not be claimed.
it('A PATH THE SHELL ALREADY MOVED TO IS STILL THE SAME FILE', () => {
  const P = (command, cwd) => ({ tool_name: 'Bash', cwd, tool_input: { command } });
  const CM = path.join(HOME, '.claude', 'CLAUDE.md');
  const CLAUDE_DIR = path.join(HOME, '.claude');

  const writes = [
    ['cd then relative', `cd ${CLAUDE_DIR} && echo x > CLAUDE.md`, '/tmp'],
    ['cd with a tilde', 'cd ~/.claude && echo x > CLAUDE.md', '/tmp'],
    ['cd then a second segment', `cd ${CLAUDE_DIR}; echo x > CLAUDE.md`, '/tmp'],
    ['already in the directory', 'echo x > CLAUDE.md', CLAUDE_DIR],
  ];
  const missed = writes.filter(([, c, cwd]) => G.decide(P(c, cwd), HOME) !== CM);
  assert.deepStrictEqual(missed.map(([n]) => n), [],
    'a write the shell reached by moving first was not caught');

  const notWrites = [
    ['a CLAUDE.md somewhere else', 'cd /tmp && echo x > CLAUDE.md', '/tmp'],
    ['a neighbouring file', `cd ${CLAUDE_DIR} && echo x > CLAUDE.md.bak`, '/tmp'],
    ['reading it', `cd ${CLAUDE_DIR} && cat CLAUDE.md`, '/tmp'],
    ['no cd, no path', 'echo x > CLAUDE.md', '/tmp'],
  ];
  const overcaught = notWrites.filter(([, c, cwd]) => G.decide(P(c, cwd), HOME));
  assert.deepStrictEqual(overcaught.map(([n]) => n), [],
    'the guard claimed a file that is not the protected one — widening a guard must not '
    + 'buy false positives, even now that an over-catch costs only an unnecessary copy');
});
if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
