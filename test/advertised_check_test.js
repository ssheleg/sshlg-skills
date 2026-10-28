#!/usr/bin/env node
'use strict';
// B-295: a member's own gate runs `test/advertised_check.js` before it releases. It held
// only the soundness half (every routed trigger is still advertised); a member could ship
// a new `## Triggers` phrase no route reaches, and the hub's completeness fixture
// (`test/triggers_test.js`) then failed when the hub pinned that release. The check now
// runs the completeness half for the one member too, through the same extraction and the
// same allow-list (`test/advertised_phrases.js`), offline, from a copy of a real member.
//
// Every fixture works on a temp copy of a member's `plugins/`; nothing touches $HOME or
// the submodule itself.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CHECK = path.join(__dirname, 'advertised_check.js');
const MEMBER = 'xr-dev';
const SOURCE = path.join(ROOT, 'skills', MEMBER, 'plugins');

let n = 0;
const failures = [];
function it(name, fn) {
  n += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const run = (root, member = MEMBER) => {
  const r = spawnSync(process.execPath, [CHECK, '--member', member, '--root', root], { encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};

/** A temp member checkout holding a copy of the real member's shipped plugins. */
function copyMember() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-advertised-'));
  fs.cpSync(SOURCE, path.join(root, 'plugins'), { recursive: true });
  return root;
}
const webxr = (root) => path.join(root, 'plugins', MEMBER, 'skills', 'quest-webxr', 'SKILL.md');
const PLANT = 'квантовый телепорт шлема';

if (!fs.existsSync(SOURCE)) {
  console.log(`SKIP: advertised_check: skills/${MEMBER} is not checked out, so there is no member to copy`);
  process.exit(0);
}

it('a clean member passes both halves, and says it read the advertised phrases', () => {
  const r = run(copyMember());
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /advertises all \d+ routed trigger/);
  assert.match(r.out, /every one of its \d+ advertised phrase\(s\) reaches its route or is allow-listed/, r.out);
});

it('a new ## Triggers phrase no route reaches fails in the member, before the hub pins it', () => {
  const root = copyMember();
  const file = webxr(root);
  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, text.replace('## Triggers\n', `## Triggers\n\nAlso: "${PLANT}".\n`));
  const r = run(root);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(r.out.includes(`xr-dev: "${PLANT}" (xr-dev/quest-webxr, ## Triggers)`), r.out);
  assert.match(r.out, /lib\/triggers\.js/, 'the remedy does not name the route table');
  assert.match(r.out, /advertised_phrases\.js/, 'the remedy does not name the allow-list');
  assert.ok(!r.out.includes('\u2014'), 'the refusal carries an em dash');
});

it('a phrase planted in the description\'s Triggers list is read too', () => {
  const root = copyMember();
  const file = webxr(root);
  const text = fs.readFileSync(file, 'utf8');
  const planted = text.replace(/^description: /m, `description: Triggers - "${PLANT}". `);
  assert.notStrictEqual(planted, text, 'the plant did not land');
  fs.writeFileSync(file, planted);
  const r = run(root);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(r.out.includes(`"${PLANT}" (xr-dev/quest-webxr, description)`), r.out);
});

it('an allow-listed phrase the member stops advertising is reported as stale', () => {
  const root = copyMember();
  const file = webxr(root);
  const text = fs.readFileSync(file, 'utf8');
  const planted = text.replace('"bubblewrap",', '');
  assert.notStrictEqual(planted, text, 'the plant did not land');
  fs.writeFileSync(file, planted);
  const r = run(root);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(r.out.includes('xr-dev/quest-webxr: "bubblewrap" is no longer advertised'), r.out);
});

it('a new skill no route names fails, as the hub fixture would', () => {
  const root = copyMember();
  const dir = path.join(root, 'plugins', MEMBER, 'skills', 'quest-brandnew');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), '---\nname: quest-brandnew\ndescription: Use when testing.\n---\n\n# x\n');
  const r = run(root);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(r.out.includes('xr-dev/quest-brandnew'), r.out);
});

it('the extraction and the allow-list are shared with the hub fixture, not copied', () => {
  const check = fs.readFileSync(CHECK, 'utf8');
  const fixture = fs.readFileSync(path.join(__dirname, 'triggers_test.js'), 'utf8');
  for (const src of [check, fixture]) {
    assert.match(src, /require\([^)]*advertised_phrases\.js'?\)?/, 'not read from test/advertised_phrases.js');
    assert.ok(!/function (?:quotedPhrases|advertisedPhrases|completeness)\b/.test(src), 'a second copy of the extraction');
    assert.ok(!/const NOT_ROUTED = /.test(src), 'a second copy of the allow-list');
  }
});

it('every materialised member passes the check at this hub revision', () => {
  const base = path.join(ROOT, 'skills');
  const checked = [];
  for (const member of fs.readdirSync(base).sort()) {
    const root = path.join(base, member);
    if (!fs.existsSync(path.join(root, 'plugins'))) continue;
    const r = run(root, member);
    assert.strictEqual(r.code, 0, `${member}: ${r.out}`);
    checked.push(member);
  }
  assert.ok(checked.length >= 5, `only ${checked.length} members were checked`);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${n}`);
  process.exit(1);
}
// The runner counts `PASS: <name> \u2014 n cases` (test/run.js COUNTS); the dash is its format.
console.log(`PASS: advertised_check \u2014 ${n} cases`);
