#!/usr/bin/env node
'use strict';
// `visibility --apply` run for real, three times, against real files in a scratch HOME.
//
// Standing instruction #2: prove idempotence at the layer that repeats. The pure module
// has its own fixtures; this is the command an operator runs twice. Three runs, because
// the first→second transition can settle a difference second→third would catch. Then
// `--revert` must return the operator's original bytes, and every write must have left a
// backup first.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-vis-'));
const w = (rel, text) => { const p = path.join(home, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const skill = (dir, name) => w(path.join(dir, name, 'SKILL.md'), `---\nname: ${name}\ndescription: Use when testing ${name}.\n---\n# ${name}\n`);
for (const n of ['used', 'unused', 'named', 'mine-already', 'quiet']) { skill('.agents/skills', n); fs.mkdirSync(path.join(home, '.claude', 'skills'), { recursive: true }); fs.symlinkSync(path.join(home, '.agents', 'skills', n), path.join(home, '.claude', 'skills', n)); }
skill('.agents/skills', 'task-pipeline');
const SETTINGS = JSON.stringify({ model: 'x', skillOverrides: { 'mine-already': 'on' } }, null, 2) + '\n';
const settings = w('.claude/settings.json', SETTINGS);
// `quiet` is core (used within 60 days) but not used within 14: name-only (B-254).
w('.claude.json', JSON.stringify({ skillUsage: {
  used: { usageCount: 1, lastUsedAt: Date.now() },
  quiet: { usageCount: 2, lastUsedAt: Date.now() - 30 * 86400e3 },
} }));
w('.claude/CLAUDE.md', 'Read the `named` skill first.\n');
const CODEX = 'model = "m"\n\n["skills"]\n"config" = [{ "path" = "/elsewhere/SKILL.md", "enabled" = false }]\n\n[tail]\nk = 1\n';
const codex = w('.codex/config.toml', CODEX);

const run = (...args) => spawnSync(process.execPath, [BIN, 'visibility', ...args], {
  env: Object.assign({}, process.env, { HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1' }), encoding: 'utf8',
});
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

it('without --apply nothing is written', () => {
  const r = run();
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), SETTINGS);
  assert.strictEqual(fs.readFileSync(codex, 'utf8'), CODEX);
});

const hashes = [];
for (let i = 0; i < 3; i += 1) {
  const r = run('--apply');
  it(`--apply run ${i + 1} exits 0`, () => assert.strictEqual(r.status, 0, r.stderr + r.stdout));
  hashes.push([sha(settings), sha(codex)]);
}

it('three runs leave identical bytes', () => {
  assert.deepStrictEqual(hashes[1], hashes[0]);
  assert.deepStrictEqual(hashes[2], hashes[1]);
});

it('only the unused skill is hidden; core, named and operator-set are untouched', () => {
  const ov = JSON.parse(fs.readFileSync(settings, 'utf8')).skillOverrides;
  assert.deepStrictEqual(ov, { 'mine-already': 'on', unused: 'user-invocable-only', quiet: 'name-only' });
});

it('the record owns the name-only value and the full window it used', () => {
  const rec = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'visibility.json'), 'utf8'));
  assert.deepStrictEqual(rec.claudeNameOnly, ['quiet']);
  assert.strictEqual(rec.fullDays, 14);
});

it('the preview reports the name-only tier', () => {
  const r = run();
  assert.ok(/name-only tier: core skills not used within 14 days/.test(r.stdout), r.stdout);
});

it('codex gains the non-core, non-family shared skills and keeps its own entry', () => {
  const t = fs.readFileSync(codex, 'utf8');
  assert.ok(t.includes('"/elsewhere/SKILL.md"'), t);
  assert.ok(t.includes(path.join(home, '.agents', 'skills', 'unused', 'SKILL.md')), t);
  assert.ok(!t.includes(path.join('skills', 'task-pipeline', 'SKILL.md')), 'a family skill was disabled');
  assert.ok(!t.includes(path.join('skills', 'used', 'SKILL.md')), 'a core skill was disabled');
});

it('the first write left a backup of each file', () => {
  const dir = path.join(home, '.sshlg-skills', 'backups');
  const names = fs.readdirSync(dir);
  assert.ok(names.some((n) => n.includes('settings.json')), names.join(','));
  assert.ok(names.some((n) => n.includes('config.toml')), names.join(','));
  const back = names.filter((n) => n.includes('settings.json')).map((n) => fs.readFileSync(path.join(dir, n), 'utf8'));
  assert.ok(back.includes(SETTINGS), 'no backup holds the original settings');
});

it('--revert returns the original bytes of both files', () => {
  const r = run('--revert');
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), SETTINGS);
  assert.strictEqual(fs.readFileSync(codex, 'utf8'), CODEX);
});

it('--full-days off restores the description and keeps the hide', () => {
  assert.strictEqual(run('--apply', '--full-days', 'off').status, 0);
  const ov = JSON.parse(fs.readFileSync(settings, 'utf8')).skillOverrides;
  assert.deepStrictEqual(ov, { 'mine-already': 'on', unused: 'user-invocable-only' });
  assert.strictEqual(run('--apply').status, 0);
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).skillOverrides.quiet, 'name-only');
});

it('a name-only value the operator changed by hand is theirs: revert leaves it', () => {
  const ov = JSON.parse(fs.readFileSync(settings, 'utf8'));
  ov.skillOverrides.quiet = 'on';
  fs.writeFileSync(settings, JSON.stringify(ov, null, 2) + '\n');
  assert.strictEqual(run('--revert').status, 0);
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).skillOverrides.quiet, 'on');
  fs.writeFileSync(settings, SETTINGS);
  fs.rmSync(path.join(home, '.sshlg-skills', 'visibility.json'), { force: true });
});

// Review 2026-10-10, finding 2: an entry the operator already had was recorded as the
// launcher's, so --revert deleted it.
it('--revert keeps a Codex entry the operator had before --apply', () => {
  const unused = path.join(home, '.agents', 'skills', 'unused', 'SKILL.md');
  const mine = `model = "m"\n\n[skills]\nconfig = [{ path = ${JSON.stringify(unused)}, enabled = false }]\n`;
  fs.writeFileSync(codex, mine);
  fs.rmSync(path.join(home, '.sshlg-skills', 'visibility.json'), { force: true });
  assert.strictEqual(run('--apply').status, 0);
  assert.strictEqual(run('--revert').status, 0);
  assert.strictEqual(fs.readFileSync(codex, 'utf8'), mine);
});

// Finding 3: a host file that did not exist was still recorded as owned, so a value the
// operator created afterwards was removed by --revert.
it('a missing settings.json is not recorded as owned', () => {
  fs.rmSync(settings);
  fs.rmSync(path.join(home, '.sshlg-skills', 'visibility.json'), { force: true });
  assert.strictEqual(run('--apply').status, 0);
  const rec = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'visibility.json'), 'utf8'));
  assert.deepStrictEqual(rec.claude, []);
  const later = JSON.stringify({ skillOverrides: { unused: 'user-invocable-only' } }, null, 2) + '\n';
  fs.writeFileSync(settings, later);
  assert.strictEqual(run('--revert').status, 0);
  assert.strictEqual(fs.readFileSync(settings, 'utf8'), later);
});

fs.rmSync(home, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
