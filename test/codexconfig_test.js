#!/usr/bin/env node
'use strict';
// B-167: Codex refuses to start when ~/.codex/config.toml defines one table twice — on
// 2026-10-12 a project-trust table appeared as both ["projects"."/x"] and [projects."/x"],
// the same key in two quotings, and `codex login status` answered `duplicate key`.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const C = require('../lib/codexconfig.js');

const failures = [];
let checks = 0;
function it(name, fn) {
  checks++;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const DUP = [
  '[projects."/Users/x/DATA/a"]', 'trust_level = "trusted"', '',
  '["projects"."/Users/x/DATA/b"]', '"trust_level" = "trusted"', '',
  '[projects."/Users/x/DATA/b"]', 'trust_level = "trusted"', '',
].join('\n');

it('the same table in two quotings is one duplicate, with both line numbers', () => {
  const d = C.duplicateTables(DUP);
  assert.strictEqual(d.length, 1, JSON.stringify(d));
  assert.deepStrictEqual(d[0].key, ['projects', '/Users/x/DATA/b']);
  assert.deepStrictEqual(d[0].lines, [4, 7]);
});

it('distinct tables, array tables and quoted dots are not duplicates', () => {
  const ok = [
    '[a]', 'x = 1', '[a.b]', '[[c]]', 'y = 1', '[[c]]', 'y = 2',
    '["a.b"]', 'z = 1', '[ "a" . "c" ]', '# [a]', 'w = "[a]"',
  ].join('\n');
  assert.deepStrictEqual(C.duplicateTables(ok), []);
});

it('whitespace around the dots does not hide a duplicate', () => {
  const d = C.duplicateTables('[ projects . "/p" ]\n\n["projects"."/p"]\n');
  assert.strictEqual(d.length, 1, JSON.stringify(d));
});

it('`hosts` names the duplicate and the remedy, and changes nothing', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-codexconfig-'));
  try {
    fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
    const cfg = path.join(home, '.codex', 'config.toml');
    fs.writeFileSync(cfg, DUP);
    const before = fs.readFileSync(cfg, 'utf8');
    const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'hosts'],
      { env: Object.assign({}, process.env, { HOME: home, CODEX_HOME: '' }), encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    assert.match(out, /duplicate table/i, out);
    assert.match(out, /projects\.\"\/Users\/x\/DATA\/b\"|projects.*\/Users\/x\/DATA\/b/, out);
    assert.match(out, /lines 4 and 7/, out);
    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), before, 'hosts wrote to the config');
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
