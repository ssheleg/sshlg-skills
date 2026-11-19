#!/usr/bin/env node
'use strict';
require('./tmproot.js').isolate();
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const M = require('./members_present.js');

let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-members-')));
const manifest = { skills: [{ name: 'a', dir: 'skills/a' }, { name: 'b', dir: 'skills/b' }, { name: 'c', dir: 'skills/c' }] };
fs.writeFileSync(path.join(tmp, 'skills.json'), JSON.stringify(manifest));
fs.mkdirSync(path.join(tmp, 'skills/a'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'skills/a/SKILL.md'), 'x');
fs.mkdirSync(path.join(tmp, 'skills/b'), { recursive: true }); // an uninitialised submodule: empty

it('an absent or empty member directory is missing; a populated one is not', () => {
  assert.deepStrictEqual(M.missingMembers(tmp), ['b', 'c']);
});
it('the note names the count, the members and the command', () => {
  const n = M.note(['b', 'c'], 3);
  assert.match(n, /^NOTE: 2 of 3 pinned members are not checked out \(b, c\)/);
  assert.match(n, /git submodule update --init/);
});
it('a complete checkout prints nothing', () => { assert.strictEqual(M.note([], 3), ''); });
it('this repository\'s own checkout is read without throwing', () => {
  assert.ok(Array.isArray(M.missingMembers(path.resolve(__dirname, '..'))));
});

fs.rmSync(tmp, { recursive: true, force: true });
if (failures.length) { for (const f of failures) process.stdout.write(`FAIL: ${f}\n`); process.exit(1); }
process.stdout.write(`PASS: members present — ${checks} cases\n`);
