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
  const list = steps(why);
  const free = list.findIndex((s) => owed.test(s) && !NEEDS_OBSERVATORY.test(s.replace(FREE_LABEL, '')));
  assert.ok(free !== -1, `${rule}: no step without Observatory matching ${owed} in:\n${why}`);
  const obs = firstObservatoryStep(list);
  assert.ok(obs === -1 || free < obs,
    `${rule}: the Observatory step comes first ("${list[obs]}") before the free one ("${list[free]}")`);
}

/** Every `rule: '…'` a guard module can return, read from its source. */
function rulesIn(file) {
  const src = fs.readFileSync(path.join(ROOT, 'lib', file), 'utf8');
  return [...src.matchAll(/rule:\s*'([a-z-]+)'/g)].map((m) => m[1]);
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

it('every refusal rule in the guard modules is reached by the corpus', () => {
  const declared = new Set([...rulesIn('secrets.js'), ...rulesIn('mcpsecrets.js')]);
  assert.ok(declared.size >= 7, `found only ${declared.size} rules — the source scan is broken`);
  const missing = [...declared].filter((r) => !seen.has(r));
  assert.deepStrictEqual(missing, [], 'a refusal rule has no corpus case here, so its remedy is unchecked');
});

it('the checker itself refuses an Observatory-only remedy and an Observatory-first one', () => {
  assert.throws(() => check('literal-credential', 'Store it with `vault.py put P E N` on stdin.'), /no step without Observatory/);
  assert.throws(() => check('mcp-credential-result',
    'Pipe it to `vault.py put P E N` on stdin.\nWithout Observatory: write it to a file with mode 600.'), /comes first/);
  check('mcp-credential-result', 'Write it to a file with mode 600.\nWith Observatory: `vault.py put` on stdin.');
});

if (failures.length) {
  process.stderr.write(`remedies: ${failures.length}/${n} failed\n  ${failures.join('\n  ')}\n`);
  process.exit(1);
}
process.stdout.write(`PASS: remedies — ${n} cases\n`);
