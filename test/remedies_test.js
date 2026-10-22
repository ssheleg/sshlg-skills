#!/usr/bin/env node
'use strict';
// Every refusal the secret guards print offers a step that works WITHOUT Observatory,
// and offers it before any step that needs Observatory (USR-011, N-5).
//
// WHY. The hub ships to people who installed the skills and nothing else. A refusal
// whose only way forward is `vault.py put` or `use_secret.py` is an obstacle for them,
// and an obstacle gets switched off. B-173 (1.59.1) fixed the DigitalOcean refusal by
// hand; nothing held the rule for the next refusal anybody writes. This suite does:
//
//   1. every refusal the guards can print is reached from a corpus — `lib/secrets.js`
//      and `lib/mcpsecrets.js` are read for their `rule: '…'` names, and a rule with
//      no corpus case fails here, so a new refusal cannot arrive unchecked;
//   2. each refusal has a concrete step of the kind its rule needs (a file with mode
//      600 or stdin where a value has to be kept; a presence/size/mode probe where a
//      value only has to be checked) that names no Observatory tool;
//   3. that step comes before the first step naming an Observatory tool.
//
// The Read/Grep refusal is printed by `hooks/pre-tool-use.js` itself, so it is taken
// from a real hook process rather than from a module.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const S = require('../lib/secrets.js');
const M = require('../lib/mcpsecrets.js');

let n = 0;
const failures = [];
function it(name, fn) {
  n += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');
/** A step that needs Observatory: its tools, its engine, or the product by name. */
const NEEDS_OBSERVATORY = /vault\.py|use_secret\.py|project-observatory|\bObservatory\b/;
/** The label that introduces the free route is not itself a dependency. */
const FREE_LABEL = /\bwithout Observatory\b:?/gi;

// rule -> the Observatory-free step that rule owes its reader.
const KEEP_VALUE = /mode 600|\bstdin\b/;           // a value must be kept somewhere
const PROBE = /test -f|wc -c|stat -f/;               // a value must only be checked
const OWED = {
  'mcp-credential-result': KEEP_VALUE,
  'literal-credential': KEEP_VALUE,
  'secret-into-stdin-program': KEEP_VALUE,
  'expansion-into-print': /\[ -n "\$\w+" \]|\$\{#\w+\}/,
  'reads-secret-file': PROBE,
  'dumps-environment': /printenv \w+ >\/dev\/null|grep -c/,
  'curl-prints-headers': /-o \/dev\/null/,
  'content-read-tool': /presence, size or mode probe/,
};

const FAKE_OR = 'sk-or-v1-' + 'a'.repeat(64);
const VAR = 'OPENROUTER_API_KEY';
// rule -> commands that reach it. Built at runtime so this file carries no live shape.
const CORPUS = {
  'secret-into-stdin-program': ["cat x | python3 - <<'PY'\nprint(1)\nPY", "cat x | sh -s <<'SH'\necho 1\nSH"],
  'literal-credential': [`export OR=${FAKE_OR}`],
  'expansion-into-print': [`echo "key: \${${VAR}:-not set}"`, `printf "%s\\n" "$${VAR}"`],
  'reads-secret-file': ['cat ~/proj/.env', 'head -3 ~/.ssh/id_ed25519'],
  'dumps-environment': ['env', 'printenv'],
  'curl-prints-headers': [`curl -v -H "Authorization: Bearer $${VAR}" https://example.com`],
};

/**
 * The remedy part of a refusal: what follows the diagnosis, without the shared
 * "if this text is QUOTED" tail. A multi-line refusal states its diagnosis on the first
 * line; a one-line refusal in its first sentence. Matching the whole text let the
 * diagnosis ("reads its CODE from stdin") stand in for a remedy that had been deleted.
 */
function remedyOf(why) {
  const body = why.split('\nIf this text is QUOTED')[0];
  if (body.includes('\n')) return body.slice(body.indexOf('\n') + 1);
  const m = /(?<=\.)\s+(?=[A-Z`(])/.exec(body);
  return m ? body.slice(m.index + m[0].length) : '';
}
/** Steps in reading order: lines, then sentences inside a line. */
function steps(text) {
  return text.split('\n').flatMap((line) => line.split(/(?<=[.;])\s+(?=[A-Z`(])/));
}
/** Index of the first step that names Observatory, after the free label is set aside. */
function firstObservatoryStep(list) {
  return list.findIndex((s) => NEEDS_OBSERVATORY.test(s.replace(FREE_LABEL, '')));
}
function check(rule, why) {
  const owed = OWED[rule];
  assert.ok(owed, `refusal rule ${rule} has no Observatory-free step defined in this suite`);
  const list = steps(remedyOf(why));
  const free = list.findIndex((s) => owed.test(s) && !NEEDS_OBSERVATORY.test(s.replace(FREE_LABEL, '')));
  assert.ok(free !== -1, `${rule}: no step without Observatory matching ${owed} in:\n${why}`);
  const obs = firstObservatoryStep(list);
  assert.ok(obs === -1 || free < obs,
    `${rule}: the Observatory step comes first ("${list[obs]}") before the free one ("${list[free]}")`);
}

/** Code lines only: a `rule:` or `say(` inside a comment is not a refusal site. */
function codeOf(src) {
  return src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
}
/**
 * Every rule a guard module can return, read from its source in any quoting. A `rule:`
 * the scan cannot read as a literal (a variable, a template with a substitution) fails,
 * so a refusal cannot slip past by its spelling.
 */
function rulesIn(file, dir = path.join(ROOT, 'lib')) {
  const src = codeOf(fs.readFileSync(path.join(dir, file), 'utf8'));
  // A `rule` key, bare or quoted ('rule', "rule", `rule`), followed by a colon.
  const KEY = String.raw`(?:['"\`]rule['"\`]|\brule)\s*:`;
  const sites = src.match(new RegExp(KEY, 'g')) || [];
  const named = [...src.matchAll(new RegExp(KEY + String.raw`\s*(['"\`])([a-z-]+)\1`, 'g'))].map((m) => m[2]);
  // Shorthand `{ rule, why }` names no literal: unreadable, so refused like a variable.
  const shorthand = src.match(/[{,]\s*rule\s*(?=[,}])/g) || [];
  assert.ok(named.length === sites.length && !shorthand.length, `${file}: a rule is spelled in a form this scan cannot read`);
  return named;
}
/**
 * Every `say('deny', …)` in the PreToolUse hook, by the expression that supplies its
 * reason. A deny site this table does not name fails: it is either a credential refusal
 * this suite must check, or it must be listed here as one that handles no credential.
 */
const HOOK_DENY_SITES = {
  'leak.why': 'secrets.inspect — every rule in the corpus above',
  "'This content read targets": 'content-read-tool — checked through the hook process below',
  'hit.why': 'mcpsecrets.inspectTool — every registered tool above',
  '`\\`${bare.verb}': 'not a credential refusal: the bare skills CLI would shadow a plugin',
  '`${target} is an instruction file': 'not a credential refusal: a backup could not be taken',
  '`\\`${masked.gate}': 'not a credential refusal: a gate read through a pipe would let git run on a red gate',
  '`\\`${selfUpdate.command}': 'not a credential refusal: a host self-update inside a substitution (B-223)',
};
function hookDenySites() {
  const src = codeOf(fs.readFileSync(path.join(ROOT, 'hooks', 'pre-tool-use.js'), 'utf8'));
  const calls = src.match(/\bsay\s*\(/g) || [];
  const parsed = [...src.matchAll(/\bsay\s*\(\s*(['"`])(\w+)\1\s*,\s*([^\n]*)/g)];
  // The definition `function say(decision, reason)` is a call-shaped site with no literal.
  assert.strictEqual(parsed.length, calls.length - 1, 'a say() call passes its decision in a form this scan cannot read');
  return parsed.filter((m) => m[2] === 'deny').map((m) => m[3].trim());
}

const seen = new Set();
for (const [rule, commands] of Object.entries(CORPUS)) {
  commands.forEach((cmd, i) => {
    // Named by index: a case name that quoted the command would print the fake key shape.
    it(`${rule} #${i + 1}`, () => {
      const v = S.inspect(cmd, { cwd: '/tmp', home: '/home/fixture' });
      assert.ok(v, 'the corpus command was not refused');
      assert.strictEqual(v.rule, rule);
      seen.add(rule);
      check(rule, v.why);
    });
  });
}

for (const server of Object.keys(M.REGISTRY)) {
  for (const tool of Object.keys(M.REGISTRY[server])) {
    it(`mcp-credential-result: ${server}/${tool}`, () => {
      const v = M.inspectTool(`mcp__${server}__${tool}`);
      assert.strictEqual(v.rule, 'mcp-credential-result');
      seen.add(v.rule);
      check(v.rule, v.why);
    });
  }
}

it('the Read/Grep refusal printed by the hook process', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'pre-tool-use.js')], {
    input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: '/tmp/.env' } }), encoding: 'utf8',
  });
  const out = JSON.parse(r.stdout.trim()).hookSpecificOutput;
  assert.strictEqual(out.permissionDecision, 'deny');
  check('content-read-tool', out.permissionDecisionReason);
});

it('every deny site in the PreToolUse hook is in the table', () => {
  const sites = hookDenySites();
  const unknown = sites.filter((reason) => !Object.keys(HOOK_DENY_SITES).some((k) => reason.startsWith(k)));
  assert.deepStrictEqual(unknown, [], 'a new deny site in hooks/pre-tool-use.js: check its remedy here or list it');
  assert.strictEqual(sites.length, Object.keys(HOOK_DENY_SITES).length, 'a listed deny site is gone; update the table');
});

// The PostToolUse labelled-credential note (I-6, B-195) is not a refusal: it denies nothing
// and has no `rule:`. It still offers its reader a way forward, and holds to the same order.
OWED['labelled-credential-note'] = KEEP_VALUE;
it('the labelled-credential note printed by the PostToolUse hook process', () => {
  const crypto = require('crypto');
  const v = crypto.randomBytes(24).toString('base64url') + '7Q';
  const r = spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'post-tool-use.js')], {
    input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: '/tmp/app.yaml' },
      tool_response: { file: { content: `SERVICE_API_KEY: ${v}` } } }), encoding: 'utf8',
  });
  const note = JSON.parse(r.stdout.trim()).hookSpecificOutput.additionalContext;
  assert.ok(/LABELLED CREDENTIAL IN OUTPUT/.test(note) && !note.includes(v), 'the note did not print, or quoted the value');
  check('labelled-credential-note', note);
});
it('the PostToolUse hook and the labelled detector deny nothing and declare no rule', () => {
  const post = codeOf(fs.readFileSync(path.join(ROOT, 'hooks', 'post-tool-use.js'), 'utf8'));
  assert.ok(!/permissionDecision|['"`]deny['"`]/.test(post), 'hooks/post-tool-use.js now denies: list its site in HOOK_DENY_SITES and check its remedy');
  assert.deepStrictEqual(rulesIn('labelledsecrets.js'), [], 'lib/labelledsecrets.js declares a refusal rule: add it to the corpus');
});

it('the rule scan reads every quoting and refuses what it cannot read', () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'remedies-'));
  try {
    const lib = path.join(tmp, 'lib');
    fs.mkdirSync(lib);
    fs.writeFileSync(path.join(lib, 'x.js'), "return { rule: 'a-b', why: 1 };\nreturn { rule: \"c-d\", why: 2 };\nreturn { rule: `e-f` };\n// rule: 'in-a-comment'\n");
    const scan = (file) => rulesIn(file, lib);
    assert.deepStrictEqual(scan('x.js'), ['a-b', 'c-d', 'e-f']);
    fs.writeFileSync(path.join(lib, 'q.js'), "return { 'rule': 'g-h', why: 1 };\nreturn { \"rule\": \"i-j\" };\n");
    assert.deepStrictEqual(scan('q.js'), ['g-h', 'i-j']);
    fs.writeFileSync(path.join(lib, 'z.js'), "const rule = 'k-l';\nreturn { rule, why: 1 };\n");
    assert.throws(() => scan('z.js'), /cannot read/);
    fs.writeFileSync(path.join(lib, 'w.js'), "return { why: 1, rule };\n");
    assert.throws(() => scan('w.js'), /cannot read/);
    fs.writeFileSync(path.join(lib, 'y.js'), 'return { rule: NAME, why: 1 };\n');
    assert.throws(() => scan('y.js'), /cannot read/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

it('every refusal rule in the guard modules is reached by the corpus', () => {
  const declared = new Set([...rulesIn('secrets.js'), ...rulesIn('mcpsecrets.js')]);
  assert.ok(declared.size >= 7, `found only ${declared.size} rules — the source scan is broken`);
  const missing = [...declared].filter((r) => !seen.has(r));
  assert.deepStrictEqual(missing, [], 'a refusal rule has no corpus case here, so its remedy is unchecked');
});

it('the checker itself refuses an Observatory-only remedy and an Observatory-first one', () => {
  assert.throws(() => check('literal-credential', 'Diagnosis.\nStore it with `vault.py put P E N` on stdin.'), /no step without Observatory/);
  assert.throws(() => check('mcp-credential-result',
    'Diagnosis.\nPipe it to `vault.py put P E N` on stdin.\nWithout Observatory: write it to a file with mode 600.'), /comes first/);
  check('mcp-credential-result', 'Diagnosis.\nWrite it to a file with mode 600.\nWith Observatory: `vault.py put` on stdin.');
  check('content-read-tool', 'This read targets a secret. Use a presence, size or mode probe.');
});

it('a diagnosis that mentions stdin or mode 600 is not a remedy', () => {
  assert.throws(() => check('secret-into-stdin-program',
    'This program reads its CODE from stdin while a heredoc also feeds stdin.\nOr pipe it through `use_secret.py`.'),
  /no step without Observatory/);
  assert.throws(() => check('literal-credential', 'A file with mode 600 is safer than argv. Use `vault.py put`.'),
    /no step without Observatory/);
});

if (failures.length) {
  process.stderr.write(`remedies: ${failures.length}/${n} failed\n  ${failures.join('\n  ')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS: remedies — ${n} cases\n`);
