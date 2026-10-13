#!/usr/bin/env node
'use strict';
// `visibility` on every host, run for real in a scratch HOME (B-143, wave L1 and its fix round).
//
// The marks are the operator's and live on the machine (~/.sshlg-skills/pack-marks.json);
// the public package ships none, so with no machine file nothing is hidden by mark. Each
// host is hidden through its own switch — Gemini `skills.disabled`, Pi `-<path>`
// exclusions, OpenCode `permission.skill.<name> = "deny"`, Hermes through its own CLI (a
// fake here, on PATH, keeping its state in JSON) — and Cursor and Kimi are reported as
// unable to hide. Properties: previews write nothing; three applies leave identical bytes;
// the usage core and kept packs stay listed; an operator's own entry, and an empty
// container the operator already had, survive --revert byte for byte; no skill file is
// touched; `update` re-applies ONLY with an explicit consent record (`applied: true`),
// only on the hosts that record lists and only within the run's scope; a 1.55-era record
// is not extended; a refused host is degraded, never a failure.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-vishosts-'));

/** A scratch machine: HOME, a shims dir, a fake hermes (unless `hermes: false`). */
function machine(name, o = {}) {
  const home = path.join(base, name, 'home');
  const shims = path.join(base, name, 'bin');
  fs.mkdirSync(shims, { recursive: true });
  const w = (rel, text) => { const p = path.join(home, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
  const skill = (n) => w(path.join('.agents', 'skills', n, 'SKILL.md'), `---\nname: ${n}\ndescription: Use when testing ${n}.\n---\n# ${n}\n`);
  const hermesState = path.join(base, name, 'hermes-state.json');
  fs.writeFileSync(hermesState, JSON.stringify({ 'skills.disabled': ['mine'] }));
  if (o.hermes !== false) {
    const fake = path.join(base, name, 'fake-hermes.js');
    fs.writeFileSync(fake, `
const fs = require('fs'); const f = ${JSON.stringify(hermesState)};
const s = JSON.parse(fs.readFileSync(f, 'utf8')); const a = process.argv.slice(2);
fs.appendFileSync(f + '.calls', a.join(' ') + '\\n');
if (a[0] !== 'config') process.exit(2);
if (a[1] === 'get') { const k = a[a.length - 1]; if (!(k in s)) { console.log('Config key not set: ' + k); process.exit(1); } console.log(JSON.stringify(s[k])); process.exit(0); }
if (a[1] === 'set') { s[a[2]] = JSON.parse(a[3]); fs.writeFileSync(f, JSON.stringify(s)); process.exit(0); }
if (a[1] === 'unset') { delete s[a[2]]; fs.writeFileSync(f, JSON.stringify(s)); process.exit(0); }
process.exit(2);
`);
    fs.writeFileSync(path.join(shims, 'hermes'), `#!/bin/sh\nexec "${process.execPath}" "${fake}" "$@"\n`, { mode: 0o755 });
  }
  for (const n of ['git', 'npx', 'claude', 'codex']) fs.writeFileSync(path.join(shims, n), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const env = () => ({
    HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1', NO_COLOR: '1',
    PATH: [shims, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter),
  });
  const run = (...args) => {
    const r = spawnSync(process.execPath, [BIN, ...args], { cwd: ROOT, env: env(), encoding: 'utf8', timeout: 180000, stdin: 'ignore' });
    return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
  };
  return { home, shims, w, skill, hermesState, run, rec: () => JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'visibility.json'), 'utf8')) };
}

const sha = (p) => (fs.existsSync(p) ? crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') : 'absent');

// ── Machine A: every host present and writable ──
const A = machine('a');
const home = A.home;
const shared = path.join(home, '.agents', 'skills');
// dcf: a hidden pack, unused → hidden. used-dcf: same pack, used → listed. docx: a kept
// pack → listed. task-pipeline: family → listed. local: no pack → listed. kw: a hidden
// pack, already disabled on Gemini by the operator → theirs, survives a revert.
const LOCK = {
  dcf: 'anthropics/financial-services', 'used-dcf': 'anthropics/financial-services',
  docx: 'anthropics/skills', 'task-pipeline': 'ssheleg/task-pipeline', kw: 'anthropics/knowledge-work-plugins',
};
const writeLock = (lock) => A.w('.agents/.skill-lock.json', JSON.stringify({ version: 3, skills: Object.fromEntries(Object.entries(lock).map(([n, s]) => [n, { source: s }])) }));
for (const n of [...Object.keys(LOCK), 'local']) A.skill(n);
writeLock(LOCK);
A.w('.claude.json', JSON.stringify({ skillUsage: { 'used-dcf': { usageCount: 2, lastUsedAt: Date.now() } } }));
const CLAUDE = JSON.stringify({ model: 'x' }, null, 2) + '\n';
const claude = A.w('.claude/settings.json', CLAUDE);
fs.mkdirSync(path.join(home, '.claude', 'skills'), { recursive: true });
fs.symlinkSync(path.join(shared, 'dcf'), path.join(home, '.claude', 'skills', 'dcf'));

const GEMINI = JSON.stringify({ mcpServers: {}, skills: { disabled: ['kw'] } }, null, 2) + '\n';
const gemini = A.w('.gemini/settings.json', GEMINI);
fs.mkdirSync(path.join(home, '.pi', 'agent', 'skills'), { recursive: true });
fs.symlinkSync(path.join(shared, 'dcf'), path.join(home, '.pi', 'agent', 'skills', 'dcf'));
const piFile = path.join(home, '.pi', 'agent', 'settings.json');
// An empty permission.skill map the operator wrote before the launcher ever ran.
const OPENCODE = JSON.stringify({ $schema: 'https://opencode.ai/config.json', mcp: {}, permission: { skill: {} } }, null, 2) + '\n';
const opencode = A.w('.config/opencode/opencode.json', OPENCODE);
const HERMES_YAML = 'model:\n  default: x\n';
const hermesYaml = A.w('.hermes/config.yaml', HERMES_YAML);
fs.mkdirSync(path.join(home, '.hermes', 'skills'), { recursive: true });
fs.symlinkSync(path.join(shared, 'dcf'), path.join(home, '.hermes', 'skills', 'dcf'));
fs.symlinkSync(path.join(shared, 'kw'), path.join(home, '.hermes', 'skills', 'kw'));
fs.mkdirSync(path.join(home, '.cursor'), { recursive: true });
fs.mkdirSync(path.join(home, '.kimi-code'), { recursive: true });

const marksFile = path.join(home, '.sshlg-skills', 'pack-marks.json');
const files = [claude, gemini, piFile, opencode, A.hermesState];
const skillBytes = () => Object.keys(LOCK).concat('local').map((n) => sha(path.join(shared, n, 'SKILL.md'))).join(',');
const SKILLS_BEFORE = skillBytes();
const hermesList = () => JSON.parse(fs.readFileSync(A.hermesState, 'utf8'))['skills.disabled'];
const vis = (...args) => A.run('visibility', ...args);

it('with no machine marks, the package hides nothing by mark and does not even ask Hermes', () => {
  const r = vis();
  assert.strictEqual(r.status, 0, r.out);
  assert.ok(/no pack marks on this machine/.test(r.out), r.out);
  for (const h of ['gemini', 'pi', 'opencode', 'hermes']) assert.ok(new RegExp(`^  ${h}: nothing to hide`, 'm').test(r.out), `${h}: ${r.out}`);
  assert.ok(!fs.existsSync(`${A.hermesState}.calls`), 'hermes was called with nothing to do');
});

it('the first printed line words Fabric RM-23 as planned, not shipped', () => {
  const first = vis().out.split('\n')[0];
  assert.ok(/fallback/i.test(first) && /RM-23/.test(first) && /open|planned|is to/.test(first), first);
  assert.ok(!/takes pack-marks\.json through its RM-23 bundle/.test(first), first);
});

it('marks --init previews, then writes the machine file only with --apply', () => {
  const p = vis('marks', '--init', '--show', 'anthropics/skills');
  assert.strictEqual(p.status, 0, p.out);
  assert.ok(!fs.existsSync(marksFile), 'the preview wrote the marks');
  assert.ok(/2 hidden/.test(p.out), p.out);
  const a = vis('marks', '--init', '--show', 'anthropics/skills', '--apply');
  assert.strictEqual(a.status, 0, a.out);
  const m = JSON.parse(fs.readFileSync(marksFile, 'utf8'));
  assert.strictEqual(m.schema, 'pack-marks/1');
  assert.deepStrictEqual(m.packs.filter((x) => x.hidden).map((x) => x.pack).sort(),
    ['anthropics/financial-services', 'anthropics/knowledge-work-plugins']);
  assert.strictEqual(vis('marks', '--init', '--show', 'anthropics/skills', '--apply').status, 2, 'an existing file is replaced only with --replace');
});

it('the preview with marks names every host and the two that cannot hide, and writes nothing', () => {
  const before = files.map(sha).join(',');
  const r = vis();
  assert.strictEqual(r.status, 0, r.out);
  for (const h of ['gemini', 'pi', 'opencode']) assert.ok(new RegExp(`^  ${h}: 6 skills in its roots, 3 in hidden packs \\(1 kept by the core\\); hide 2;`, 'm').test(r.out), `${h}: ${r.out}`);
  assert.ok(/^  hermes: 2 skills in its roots, 2 in hidden packs \(0 kept by the core\); hide 2; write 2 new entries/m.test(r.out), r.out);
  assert.ok(/cannot hide on cursor/.test(r.out) && /cannot hide on kimi/.test(r.out), r.out);
  assert.strictEqual(files.map(sha).join(','), before);
  assert.ok(!fs.existsSync(path.join(home, '.sshlg-skills', 'visibility.json')));
});

const hashes = [];
for (let i = 0; i < 3; i += 1) {
  const r = vis('--apply');
  it(`--apply run ${i + 1} exits 0`, () => assert.strictEqual(r.status, 0, r.out));
  hashes.push(files.map(sha).join(','));
}

it('three applies leave identical bytes on every host', () => {
  assert.strictEqual(hashes[1], hashes[0]);
  assert.strictEqual(hashes[2], hashes[1]);
});

it('the record carries explicit consent and the hosts it covers', () => {
  const rec = A.rec();
  assert.strictEqual(rec.applied, true);
  assert.deepStrictEqual(rec.hosts.slice().sort(), ['claude', 'gemini', 'hermes', 'opencode', 'pi']);
});

it('gemini: dcf disabled; the operator entry kw kept and not owned', () => {
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(gemini, 'utf8')).skills.disabled, ['kw', 'dcf']);
  assert.deepStrictEqual(A.rec().gemini, ['dcf']);
});

it('pi: one exact exclusion per root holding each hidden skill, in the form Pi writes (no final newline)', () => {
  const t = fs.readFileSync(piFile, 'utf8');
  assert.ok(!t.endsWith('\n'));
  assert.deepStrictEqual(JSON.parse(t).skills, [
    `-${path.join(shared, 'dcf')}`, `-${path.join(shared, 'kw')}`, `-${path.join(home, '.pi', 'agent', 'skills', 'dcf')}`].sort());
});

it('opencode: dcf and kw denied inside the operator\'s own map', () => {
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(opencode, 'utf8')).permission, { skill: { dcf: 'deny', kw: 'deny' } });
});

it('hermes: written through its CLI; the operator entry kept', () => {
  assert.deepStrictEqual(hermesList().slice().sort(), ['dcf', 'kw', 'mine']);
});

it('backups of host files are 0600 in a 0700 directory (they may hold keys)', () => {
  const dir = path.join(home, '.sshlg-skills', 'backups');
  assert.strictEqual(fs.statSync(dir).mode & 0o777, 0o700);
  const names = fs.readdirSync(dir);
  assert.ok(names.some((n) => n.includes('config.yaml')) && names.some((n) => n.includes('opencode')), names.join(','));
  for (const n of names) assert.strictEqual(fs.statSync(path.join(dir, n)).mode & 0o777, 0o600, n);
});

it('no skill file was touched', () => assert.strictEqual(skillBytes(), SKILLS_BEFORE));

it('a showPacks override lists the pack again on the four hosts, and says it does nothing on Claude/Codex', () => {
  const c = A.run('config', 'set', 'visibility.pack.Anthropics/Financial-Services', 'show');
  assert.strictEqual(c.status, 0, c.out);
  assert.ok(/Claude/.test(c.out) && /--keep/.test(c.out), c.out);
  assert.strictEqual(vis('--apply').status, 0);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(gemini, 'utf8')).skills.disabled, ['kw']);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(opencode, 'utf8')).permission.skill, { kw: 'deny' });
  assert.strictEqual(A.run('config', 'set', 'visibility.pack.Anthropics/Financial-Services', 'default').status, 0);
  assert.ok(!('visibility' in JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'config.json'), 'utf8'))), 'default must leave no residue');
  assert.strictEqual(vis('--apply').status, 0);
});

it('a pack override that is not owner/repo is refused', () => {
  assert.strictEqual(A.run('config', 'set', 'visibility.pack.nonsense', 'hide').status, 2);
});

// A new skill of a hidden pack arrives (as an update's skills-CLI step would bring it).
A.skill('dcf2');
writeLock(Object.assign({}, LOCK, { dcf2: 'anthropics/financial-services' }));
fs.symlinkSync(path.join(shared, 'dcf2'), path.join(home, '.claude', 'skills', 'dcf2'));

it('update --agent pi re-applies on Pi alone', () => {
  const g = sha(gemini); const c = sha(claude);
  const r = A.run('update', '--agent', 'pi');
  assert.ok(/== Skill visibility \(re-applied/.test(r.out), r.out.slice(-2000));
  assert.ok(JSON.parse(fs.readFileSync(piFile, 'utf8')).skills.includes(`-${path.join(shared, 'dcf2')}`), 'Pi did not gain dcf2: ' + r.out.slice(r.out.indexOf('== Skill visibility')));
  assert.strictEqual(sha(gemini), g, 'a Pi-scoped update wrote Gemini');
  assert.strictEqual(sha(claude), c, 'a Pi-scoped update wrote Claude');
});

it('update --no-claude and update --agent claude-code leave Claude alone', () => {
  const c = sha(claude);
  A.run('update', '--no-claude');
  assert.strictEqual(sha(claude), c, '--no-claude wrote Claude');
  A.run('update', '--agent', 'claude-code');
  assert.strictEqual(sha(claude), c, '--agent claude-code wrote Claude, which claudeScope keeps out');
});

it('--revert returns every original byte (the operator\'s empty map included) and withdraws consent', () => {
  const r = vis('--revert');
  assert.strictEqual(r.status, 0, r.out);
  assert.strictEqual(fs.readFileSync(gemini, 'utf8'), GEMINI);
  assert.strictEqual(sha(opencode), crypto.createHash('sha256').update(OPENCODE).digest('hex'));
  assert.strictEqual(fs.readFileSync(claude, 'utf8'), CLAUDE);
  assert.ok(!fs.existsSync(piFile), 'the Pi settings file the launcher created is still there');
  assert.deepStrictEqual(hermesList(), ['mine']);
  assert.strictEqual(fs.readFileSync(hermesYaml, 'utf8'), HERMES_YAML);
  assert.strictEqual(A.rec().applied, false);
});

it('after --revert, update re-applies nothing (the record is not consent)', () => {
  const r = A.run('update', '--agent', 'pi');
  assert.ok(!/== Skill visibility \(re-applied/.test(r.out), r.out.slice(-1500));
  assert.ok(!fs.existsSync(piFile), 'update re-hid on Pi after --revert');
});

it('a 1.55-era record (no consent field) is not extended to the new hosts; update says how to re-arm', () => {
  fs.writeFileSync(path.join(home, '.sshlg-skills', 'visibility.json'), JSON.stringify({ days: 60, claude: [], codex: [] }));
  const g = sha(gemini);
  const r = A.run('update', '--agent', 'pi');
  assert.ok(/visibility --apply/.test(r.out) && /re-arm/.test(r.out), r.out.slice(-1500));
  assert.ok(!fs.existsSync(piFile), 'an old record was extended to Pi');
  assert.strictEqual(sha(gemini), g);
});

it('update leaves visibility alone where --apply never ran', () => {
  fs.rmSync(path.join(home, '.sshlg-skills', 'visibility.json'));
  const r = A.run('update', '--agent', 'pi');
  assert.ok(!/== Skill visibility/.test(r.out));
  assert.ok(!fs.existsSync(piFile));
});

// ── Machine B: hosts that cannot be written — no hermes CLI, opencode.jsonc only, a
// Gemini settings file not in the 2-space form ──
const B = machine('b', { hermes: false });
for (const n of ['dcf', 'docx']) B.skill(n);
B.w('.agents/.skill-lock.json', JSON.stringify({ version: 3, skills: { dcf: { source: 'anthropics/financial-services' }, docx: { source: 'anthropics/skills' } } }));
B.w('.gemini/settings.json', '{"mcpServers":{}}\n');
B.w('.config/opencode/opencode.jsonc', '{\n  // mine\n}\n');
fs.mkdirSync(path.join(B.home, '.hermes', 'skills'), { recursive: true });
fs.symlinkSync(path.join(B.home, '.agents', 'skills', 'dcf'), path.join(B.home, '.hermes', 'skills', 'dcf'));

it('with nothing to hide, unwritable hosts are skipped and the run succeeds', () => {
  const r = B.run('visibility', '--apply');
  assert.strictEqual(r.status, 0, r.out);
  for (const h of ['gemini', 'opencode', 'hermes']) assert.ok(new RegExp(`^  ${h}: nothing to hide`, 'm').test(r.out), `${h}: ${r.out}`);
});

it('with marks, a refused host is reported DEGRADED and the run still succeeds', () => {
  assert.strictEqual(B.run('visibility', 'marks', '--init', '--show', 'anthropics/skills', '--apply').status, 0);
  const r = B.run('visibility', '--apply');
  assert.strictEqual(r.status, 0, r.out);
  for (const h of ['gemini', 'opencode', 'hermes']) assert.ok(new RegExp(`^  ${h}: DEGRADED`, 'm').test(r.out), `${h}: ${r.out}`);
});

it('a degraded host does not fail update', () => {
  const r = B.run('update', '--agent', 'gemini-cli');
  assert.ok(/== Skill visibility \(re-applied/.test(r.out), r.out.slice(-1500));
  assert.ok(/DEGRADED/.test(r.out), r.out.slice(-1500));
  assert.ok(!/visibility.*NOT re-applied|Skill visibility[\s\S]*FAILED/.test(r.out), r.out.slice(-1500));
});

it('uninstall names what visibility still holds and how to undo it', () => {
  const r = B.run('uninstall', '--agent', 'gemini-cli');
  assert.ok(/visibility --revert/.test(r.out), r.out.slice(-1500));
});

fs.rmSync(base, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
