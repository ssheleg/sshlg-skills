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
const fs = require('fs');
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
  for (const f of [CLAUDE, CURSOR, SETTINGS, path.join(HOME, '.codex', 'hooks.json'),
                   path.join(HOME, '.codex', 'AGENTS.md'),
                   path.join(HOME, '.gemini', 'GEMINI.md'),
                   path.join(HOME, '.pi', 'agent', 'AGENTS.md')]) {
    assert.ok(list.includes(f), `not protected: ${f}`);
  }
});

// B-287: Cursor's wait-rule file is written by `lib/blocks.js` and was not in the list.
// The guard now reads every file the blocks inspector names from that one source, so a
// file added there is protected here without a second list to forget.
it('every file lib/blocks.js names is protected, the Cursor wait rule included', () => {
  const list = G.targets(HOME);
  const WAIT = path.join(HOME, '.cursor', 'rules', 'sshlg-wait.mdc');
  assert.ok(list.includes(WAIT), `not protected: ${WAIT}`);
  for (const t of require('../lib/blocks.js').targets({ home: HOME })) {
    assert.ok(list.includes(t.file), `blocks.js names ${t.file} but the guard does not protect it`);
  }
  assert.strictEqual(hit({ tool_name: 'Write', tool_input: { file_path: WAIT } }), WAIT);
  assert.strictEqual(hit(bash(`echo x > ~/.cursor/rules/sshlg-wait.mdc`)), WAIT);
});

// B-288: the refusal named every protected file "an instruction file".
it('each protected file is named by its kind', () => {
  assert.strictEqual(G.kind(CLAUDE), 'an instruction file');
  assert.strictEqual(G.kind(CURSOR), 'an instruction file');
  assert.strictEqual(G.kind(path.join(HOME, '.cursor', 'rules', 'sshlg-wait.mdc')), 'an instruction file');
  assert.strictEqual(G.kind(SETTINGS), 'a settings file');
  assert.strictEqual(G.kind(path.join(HOME, '.codex', 'hooks.json')), 'a hooks file');
  assert.strictEqual(G.kind('/relocated/claude/settings.json'), 'a settings file');
  for (const f of G.targets(HOME)) assert.ok(/^an? (instruction|settings|hooks) file$/.test(G.kind(f)), f);
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

it('a read-only tool naming a protected file is silence: the guard decides writes only', () => {
  for (const t of ['Read', 'Grep', 'Glob', 'NotebookRead']) {
    assert.strictEqual(G.decide({ tool_name: t, tool_input: { file_path: CLAUDE } }, HOME), null, t);
  }
  assert.strictEqual(G.decide({ tool_name: 'Write', tool_input: { file_path: CLAUDE } }, HOME), CLAUDE);
  assert.strictEqual(G.decide({ tool_input: { file_path: CLAUDE } }, HOME), CLAUDE, 'no tool name keeps the old reading');
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
it('a heredoc body fed to a non-shell is data, and a body fed to a shell is not', () => {
  // `B-136`, second spelling. `python3 - <<'EOF' … print('do not touch <path>') … EOF`
  // was flagged as a write: the body carries the path beside a word this guard reads as
  // a write verb, and none of it ever runs as shell. The hook answers `allow`, so the
  // false positive spent the operator's own permission prompt on an unrelated call.
  // Measured before the fix — the python case fired and the node case did not, which is
  // the shape of an accident rather than a rule.
  const data = [
    ['python', `python3 - <<'EOF'\nprint('do not touch ${CLAUDE}')\nEOF`],
    ['node', `node - <<'EOF'\nconsole.log('rm ${CLAUDE}')\nEOF`],
    ['a docstring naming the path', `python3 - <<'PY'\n"""writes ${CLAUDE}"""\nPY`],
  ];
  const flagged = data.filter(([, c]) => G.decide(bash(c), HOME));
  assert.deepStrictEqual(flagged.map(([n]) => n), [],
    'a heredoc body fed to a non-shell was read as a command');

  // and the half that must NOT be lost: what survives the strip still runs.
  const writes = [
    ['cat with the redirect before the body', `cat > ${CLAUDE} <<'EOF'\nx\nEOF`],
    ['a bash heredoc', `bash <<'EOF'\necho x > ${CLAUDE}\nEOF`],
    ['an sh heredoc', `sh <<'EOF'\ntee ${CLAUDE} < /dev/null\nEOF`],
  ];
  const missed = writes.filter(([, c]) => G.decide(bash(c), HOME) !== CLAUDE);
  assert.deepStrictEqual(missed.map(([n]) => n), [],
    'the strip took a body that genuinely executes');
});

it('the heredoc treatment is imported, not a second parser', () => {
  // A copied heredoc parser is exactly what this family's copied-mechanism guard exists
  // to catch, and two of them drift on the first fix applied to one.
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'guard.js'), 'utf8');
  assert.ok(/require\('\.\/hygiene\.js'\)/.test(src),
    'guard.js no longer imports the treatment');
  assert.ok(!/function executablePart/.test(src),
    'guard.js grew its own copy of executablePart');
});

// Codex apply_patch (B-209): lib/hookpayload.js hands the patch's paths over as a list.
it('a list of paths hits the first protected one, and misses when none is', () => {
  assert.strictEqual(hit({ tool_name: 'apply_patch', tool_input: { file_paths: ['/w/a.js', CLAUDE] } }), CLAUDE);
  assert.strictEqual(hit({ tool_name: 'apply_patch', tool_input: { file_paths: ['/w/a.js', CLAUDE + '.bak', 7] } }), null);
  assert.strictEqual(hit({ tool_name: 'apply_patch', tool_input: { file_paths: [] } }), null);
});

// B-218 CLAUDE-8: the hooks wiring follows CLAUDE_CONFIG_DIR, so does its settings file.
it('a relocated Claude profile protects its settings.json too', () => {
  const env = { CLAUDE_CONFIG_DIR: '/profiles/work' };
  assert.ok(G.targets(HOME, env).includes('/profiles/work/settings.json'));
  assert.strictEqual(G.decide({ tool_name: 'Write', tool_input: { file_path: '/profiles/work/settings.json' } }, HOME, env),
    '/profiles/work/settings.json');
});

// ---- B-273: Codex's hooks.json -------------------------------------------------
// `hooks install --codex` writes it (B-209), and like settings.json it has no version
// control behind it. CODEX_HOME relocates it, as it relocates AGENTS.md.

const CODEX_HOOKS = path.join(HOME, '.codex', 'hooks.json');

it('B-273: Codex hooks.json is protected at ~/.codex and under CODEX_HOME', () => {
  assert.ok(G.targets(HOME).includes(CODEX_HOOKS));
  const env = { CODEX_HOME: '/profiles/codex' };
  assert.ok(G.targets(HOME, env).includes('/profiles/codex/hooks.json'));
  assert.strictEqual(G.decide({ tool_name: 'Write', tool_input: { file_path: '/profiles/codex/hooks.json' } }, HOME, env),
    '/profiles/codex/hooks.json');
});

it('B-273: writes to Codex hooks.json are caught (Edit, apply_patch paths, shell redirect)', () => {
  assert.strictEqual(hit({ tool_name: 'Edit', tool_input: { file_path: CODEX_HOOKS } }), CODEX_HOOKS);
  assert.strictEqual(hit({ tool_name: 'apply_patch', tool_input: { file_paths: ['/repo/x.js', CODEX_HOOKS] } }), CODEX_HOOKS);
  assert.strictEqual(hit(bash('echo {} > ~/.codex/hooks.json')), CODEX_HOOKS);
});

it('B-273: reading or copying Codex hooks.json, or a neighbouring file, is silence', () => {
  assert.strictEqual(hit({ tool_name: 'Read', tool_input: { file_path: CODEX_HOOKS } }), null);
  assert.strictEqual(hit(bash('cat ~/.codex/hooks.json')), null);
  assert.strictEqual(hit(bash('cp ~/.codex/hooks.json /tmp/h.json')), null);
  assert.strictEqual(hit(bash('echo x > ~/.codex/hooks.json.bak')), null);
  assert.strictEqual(hit({ tool_name: 'Write', tool_input: { file_path: '/repo/hooks/hooks.json' } }), null);
  // CODEX_HOME set: the relocated file is the one, and an unrelated hooks.json is not.
  assert.strictEqual(G.decide({ tool_name: 'Write', tool_input: { file_path: '/elsewhere/hooks.json' } }, HOME,
    { CODEX_HOME: '/profiles/codex' }), null);
});

// ---- B-281: the instruction targets beyond apply.TARGETS ------------------------
// lib/instruction-targets.js is the one list of those files (B-206); the guard reads it
// rather than keeping a second hand list that drifts the day a host is added.

const IT = require('../lib/instruction-targets.js');
const QWEN = path.join(HOME, '.qwen', 'QWEN.md');
const NEW_FILES = [
  path.join(HOME, '.agents', 'AGENTS.md'),
  path.join(HOME, '.zcode', 'AGENTS.md'),
  QWEN,
  path.join(HOME, '.kiro', 'steering', 'sshlg-routing.md'),
  path.join(HOME, '.codeium', 'windsurf', 'memories', 'global_rules.md'),
];

it('B-281: every new instruction target is protected', () => {
  const list = G.targets(HOME);
  for (const f of NEW_FILES) assert.ok(list.includes(f), `not protected: ${f}`);
});

it('B-281: the list is DERIVED from lib/instruction-targets.js, every row, both env states', () => {
  for (const env of [{}, { QWEN_HOME: '/profiles/qwen' }]) {
    const list = G.targets(HOME, env);
    for (const t of IT.EXTRA_TARGETS) {
      const f = t.file(HOME, env);
      assert.ok(list.includes(f), `${t.agent}: ${f} is written by the hub and not protected`);
    }
  }
  // One source: guard.js names none of these hosts' paths by hand.
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'guard.js'), 'utf8');
  for (const word of ['.zcode', '.qwen', '.kiro', '.codeium', 'QWEN.md', 'global_rules.md']) {
    assert.ok(!src.includes(`'${word}'`), `guard.js hand-lists ${word}; read it from lib/instruction-targets.js`);
  }
});

it('B-281: every apply.TARGETS file is protected, at home and relocated by its variable', () => {
  const A = require('../lib/apply.js');
  for (const t of A.TARGETS) {
    assert.ok(G.targets(HOME).includes(path.join(HOME, t.dir, t.file)), `${t.agent} default`);
    const env = { [t.env]: '/moved' };
    const moved = t.envIsHome ? path.join('/moved', t.dir, t.file) : path.join('/moved', t.file);
    assert.ok(G.targets(HOME, env).includes(moved), `${t.agent} under ${t.env}`);
  }
});

it('B-281: QWEN_HOME relocates QWEN.md, and the default stays protected', () => {
  const env = { QWEN_HOME: '/profiles/qwen' };
  assert.ok(G.targets(HOME, env).includes('/profiles/qwen/QWEN.md'));
  assert.ok(G.targets(HOME, env).includes(QWEN));
  assert.strictEqual(G.decide({ tool_name: 'Edit', tool_input: { file_path: '/profiles/qwen/QWEN.md' } }, HOME, env),
    '/profiles/qwen/QWEN.md');
});

it('B-281: writes to the new targets are caught, by file tool and by shell', () => {
  for (const f of NEW_FILES) {
    assert.strictEqual(hit({ tool_name: 'Write', tool_input: { file_path: f } }), f, f);
    assert.strictEqual(hit(bash(`echo x >> ~/${path.relative(HOME, f)}`)), f, `redirect into ${f}`);
  }
  assert.strictEqual(hit(bash('rm ~/.kiro/steering/sshlg-routing.md')), NEW_FILES[3]);
});

it('B-281: neighbours of the new targets are silence', () => {
  assert.strictEqual(hit({ tool_name: 'Write', tool_input: { file_path: path.join(HOME, '.kiro', 'steering', 'product.md') } }), null);
  assert.strictEqual(hit({ tool_name: 'Write', tool_input: { file_path: path.join(HOME, '.agents', 'skills', 'x', 'SKILL.md') } }), null);
  assert.strictEqual(hit({ tool_name: 'Read', tool_input: { file_path: QWEN } }), null);
  assert.strictEqual(hit(bash('cat ~/.zcode/AGENTS.md')), null);
  assert.strictEqual(hit(bash('cp ~/.qwen/QWEN.md ~/.qwen/QWEN.md.2026-10-27')), null);
});

it('B-273/B-281: the real hook takes the copy before a write to the new files', () => {
  const os = require('os');
  const { spawnSync } = require('child_process');
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-guard-e2e-')));
  try {
    const files = [path.join(home, '.codex', 'hooks.json'), path.join(home, '.qwen', 'QWEN.md')];
    for (const f of files) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, `operator text in ${path.basename(f)}\n`); }
    const env = Object.assign({}, process.env, { HOME: home, USERPROFILE: home, SSHLG_SKILLS_NO_PROBE: '1' });
    for (const k of ['CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'QWEN_HOME', 'GEMINI_CLI_HOME', 'PI_CODING_AGENT_DIR']) delete env[k];
    for (const f of files) {
      const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'hooks', 'pre-tool-use.js')], {
        input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: f }, cwd: home }),
        encoding: 'utf8', env, timeout: 15000,
      });
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(/copy taken before the write/.test(r.stderr || ''), `${f}: ${r.stderr}`);
    }
    const copies = fs.readdirSync(path.join(home, '.sshlg-skills', 'backups')).filter((n) => !n.startsWith('.'));
    const bodies = copies.map((n) => fs.readFileSync(path.join(home, '.sshlg-skills', 'backups', n), 'utf8'));
    for (const f of files) assert.ok(bodies.includes(`operator text in ${path.basename(f)}\n`), `no copy of ${f}: ${copies}`);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
