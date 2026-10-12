#!/usr/bin/env node
'use strict';
// `visibility` on every host, run for real in a scratch HOME (B-143, wave L1).
//
// The operator marked packs to hide on 2026-10-13: hidden, never deleted. Each host is
// hidden through its own switch — Gemini `skills.disabled`, Pi `-<path>` exclusions,
// OpenCode `permission.skill.<name> = "deny"`, Hermes through its own CLI (a fake here,
// on PATH, that keeps its state in a JSON file) — and Cursor and Kimi are reported as
// unable to hide. Properties: the preview writes nothing; three applies leave identical
// bytes; the usage core and the keep marks stay listed; an operator's own entry survives
// --revert; --revert returns every original byte (and removes the Pi file it created);
// no skill file is touched; `update` re-applies on a machine that ran --apply.

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
const home = path.join(base, 'home');
const shims = path.join(base, 'bin');
fs.mkdirSync(shims, { recursive: true });
const w = (rel, text) => { const p = path.join(home, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const shared = path.join(home, '.agents', 'skills');
const skill = (name) => w(path.join('.agents', 'skills', name, 'SKILL.md'), `---\nname: ${name}\ndescription: Use when testing ${name}.\n---\n# ${name}\n`);

// dcf: a hidden pack, unused → hidden. used-dcf: same pack, used → listed. docx: a keep
// pack → listed. task-pipeline: family → listed. local: no pack → listed. kw: hidden pack
// on Gemini already disabled by the operator → theirs, survives a revert.
const LOCK = {
  dcf: 'anthropics/financial-services', 'used-dcf': 'anthropics/financial-services',
  docx: 'anthropics/skills', 'task-pipeline': 'ssheleg/task-pipeline', kw: 'anthropics/knowledge-work-plugins',
};
for (const n of [...Object.keys(LOCK), 'local']) skill(n);
w('.agents/.skill-lock.json', JSON.stringify({ version: 3, skills: Object.fromEntries(Object.entries(LOCK).map(([n, s]) => [n, { source: s }])) }));
w('.claude.json', JSON.stringify({ skillUsage: { 'used-dcf': { usageCount: 2, lastUsedAt: Date.now() } } }));

const GEMINI = JSON.stringify({ mcpServers: {}, skills: { disabled: ['kw'] } }, null, 2) + '\n';
const gemini = w('.gemini/settings.json', GEMINI);
fs.mkdirSync(path.join(home, '.pi', 'agent', 'skills'), { recursive: true });
fs.symlinkSync(path.join(shared, 'dcf'), path.join(home, '.pi', 'agent', 'skills', 'dcf'));
const piFile = path.join(home, '.pi', 'agent', 'settings.json');
const OPENCODE = JSON.stringify({ $schema: 'https://opencode.ai/config.json', mcp: {} }, null, 2) + '\n';
const opencode = w('.config/opencode/opencode.json', OPENCODE);
const HERMES_YAML = 'model:\n  default: x\n';
const hermesYaml = w('.hermes/config.yaml', HERMES_YAML);
fs.mkdirSync(path.join(home, '.hermes', 'skills'), { recursive: true });
fs.symlinkSync(path.join(shared, 'dcf'), path.join(home, '.hermes', 'skills', 'dcf'));
fs.symlinkSync(path.join(shared, 'kw'), path.join(home, '.hermes', 'skills', 'kw'));
fs.mkdirSync(path.join(home, '.cursor'), { recursive: true });
fs.mkdirSync(path.join(home, '.kimi-code'), { recursive: true });

// A fake `hermes` speaking the three `config` calls the launcher makes; its state is the
// file `hermes-state.json`, starting with one operator entry the launcher must not own.
const hermesState = path.join(base, 'hermes-state.json');
fs.writeFileSync(hermesState, JSON.stringify({ 'skills.disabled': ['mine'] }));
const FAKE = path.join(base, 'fake-hermes.js');
fs.writeFileSync(FAKE, `
const fs = require('fs'); const f = ${JSON.stringify(hermesState)};
const s = JSON.parse(fs.readFileSync(f, 'utf8')); const a = process.argv.slice(2);
fs.appendFileSync(f + '.calls', a.join(' ') + '\\n');
if (a[0] !== 'config') process.exit(2);
if (a[1] === 'get') { const k = a[a.length - 1]; if (!(k in s)) { console.log('Config key not set: ' + k); process.exit(1); } console.log(JSON.stringify(s[k])); process.exit(0); }
if (a[1] === 'set') { s[a[2]] = JSON.parse(a[3]); fs.writeFileSync(f, JSON.stringify(s)); process.exit(0); }
if (a[1] === 'unset') { delete s[a[2]]; fs.writeFileSync(f, JSON.stringify(s)); process.exit(0); }
process.exit(2);
`);
fs.writeFileSync(path.join(shims, 'hermes'), `#!/bin/sh\nexec "${process.execPath}" "${FAKE}" "$@"\n`, { mode: 0o755 });
for (const n of ['git', 'npx', 'claude', 'codex']) fs.writeFileSync(path.join(shims, n), '#!/bin/sh\nexit 0\n', { mode: 0o755 });

const env = () => ({
  HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1', NO_COLOR: '1',
  PATH: [shims, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter),
});
const run = (...args) => spawnSync(process.execPath, [BIN, ...args], { cwd: ROOT, env: env(), encoding: 'utf8', timeout: 120000, stdin: 'ignore' });
const vis = (...args) => run('visibility', ...args);
const sha = (p) => (fs.existsSync(p) ? crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') : 'absent');
const files = [gemini, piFile, opencode, hermesState];
const skillBytes = () => Object.keys(LOCK).concat('local').map((n) => sha(path.join(shared, n, 'SKILL.md'))).join(',');
const SKILLS_BEFORE = skillBytes();
const hermesList = () => JSON.parse(fs.readFileSync(hermesState, 'utf8'))['skills.disabled'];

it('the preview names every host, its count and the two that cannot hide, and writes nothing', () => {
  const r = vis();
  const out = r.stdout + r.stderr;
  assert.strictEqual(r.status, 0, out);
  assert.ok(/Fallback for sessions Fabric does not start/.test(out.split('\n')[0]), 'header line missing');
  for (const h of ['gemini', 'pi', 'opencode']) assert.ok(new RegExp(`^  ${h}: 6 skills in its roots, 3 in hidden packs \\(1 kept by the core\\); hide 2;`, 'm').test(out), `${h}: ${out}`);
  assert.ok(/^  hermes: 2 skills in its roots, 2 in hidden packs \(0 kept by the core\); hide 2; write 2 new entries/m.test(out), out);
  assert.ok(/^  gemini: .*write 1 new entry/m.test(out), 'kw is already the operator\'s on Gemini');
  assert.ok(/cannot hide on cursor/.test(out), out);
  assert.ok(/cannot hide on kimi/.test(out), out);
  assert.strictEqual(fs.readFileSync(gemini, 'utf8'), GEMINI);
  assert.ok(!fs.existsSync(piFile), 'the preview created Pi settings');
  assert.strictEqual(fs.readFileSync(opencode, 'utf8'), OPENCODE);
  assert.deepStrictEqual(hermesList(), ['mine']);
  assert.ok(!fs.existsSync(path.join(home, '.sshlg-skills', 'visibility.json')));
});

const hashes = [];
for (let i = 0; i < 3; i += 1) {
  const r = vis('--apply');
  it(`--apply run ${i + 1} exits 0`, () => assert.strictEqual(r.status, 0, r.stdout + r.stderr));
  hashes.push(files.map(sha).join(','));
}

it('three applies leave identical bytes on every host', () => {
  assert.strictEqual(hashes[1], hashes[0]);
  assert.strictEqual(hashes[2], hashes[1]);
});

it('gemini: dcf disabled; the operator entry kw kept and not owned', () => {
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(gemini, 'utf8')).skills.disabled, ['kw', 'dcf']);
  const rec = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'visibility.json'), 'utf8'));
  assert.deepStrictEqual(rec.gemini, ['dcf']);
});

it('pi: one exact exclusion per root holding each hidden skill, in the form Pi writes (no final newline)', () => {
  const t = fs.readFileSync(piFile, 'utf8');
  assert.ok(!t.endsWith('\n'));
  assert.deepStrictEqual(JSON.parse(t).skills, [
    `-${path.join(home, '.agents', 'skills', 'dcf')}`, `-${path.join(home, '.agents', 'skills', 'kw')}`,
    `-${path.join(home, '.pi', 'agent', 'skills', 'dcf')}`].sort());
});

it('opencode: dcf and kw denied, nothing else', () => {
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(opencode, 'utf8')).permission, { skill: { dcf: 'deny', kw: 'deny' } });
});

it('hermes: written through its CLI; the operator entry kept', () => {
  assert.deepStrictEqual(hermesList().slice().sort(), ['dcf', 'kw', 'mine']);
  const backups = fs.readdirSync(path.join(home, '.sshlg-skills', 'backups'));
  assert.ok(backups.some((n) => n.includes('config.yaml')), backups.join(','));
});

it('no skill file was touched', () => assert.strictEqual(skillBytes(), SKILLS_BEFORE));

it('a showPacks override lists the pack again on the next apply', () => {
  const c = run('config', 'set', 'visibility.pack.anthropics/financial-services', 'show');
  assert.strictEqual(c.status, 0, c.stdout + c.stderr);
  assert.strictEqual(vis('--apply').status, 0);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(gemini, 'utf8')).skills.disabled, ['kw']);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(opencode, 'utf8')).permission.skill, { kw: 'deny' });
  assert.strictEqual(run('config', 'set', 'visibility.pack.anthropics/financial-services', 'default').status, 0);
  assert.ok(!('visibility' in JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'config.json'), 'utf8'))), 'default must leave no residue');
  assert.strictEqual(vis('--apply').status, 0);
});

it('a pack override that is not owner/repo is refused', () => {
  const c = run('config', 'set', 'visibility.pack.nonsense', 'hide');
  assert.strictEqual(c.status, 2, c.stdout + c.stderr);
});

it('--revert returns every original byte and removes the Pi file it created', () => {
  const r = vis('--revert');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(fs.readFileSync(gemini, 'utf8'), GEMINI);
  assert.strictEqual(fs.readFileSync(opencode, 'utf8'), OPENCODE);
  assert.ok(!fs.existsSync(piFile), 'the Pi settings file the launcher created is still there');
  assert.deepStrictEqual(hermesList(), ['mine']);
  assert.strictEqual(fs.readFileSync(hermesYaml, 'utf8'), HERMES_YAML);
});

it('update re-applies visibility, within its --agent scope, on a machine that ran --apply', () => {
  // The record from --revert exists, which is the consent; run update for Pi alone.
  const r = run('update', '--agent', 'pi');
  const out = r.stdout + r.stderr;
  assert.ok(/== Skill visibility \(re-applied/.test(out), out.slice(-2000));
  assert.ok(fs.existsSync(piFile), 'update did not hide on Pi');
  assert.strictEqual(fs.readFileSync(gemini, 'utf8'), GEMINI, 'a Pi-scoped update wrote Gemini');
  assert.deepStrictEqual(hermesList(), ['mine'], 'a Pi-scoped update wrote Hermes');
});

it('update leaves visibility alone where --apply never ran', () => {
  fs.rmSync(path.join(home, '.sshlg-skills', 'visibility.json'));
  fs.rmSync(piFile);
  const r = run('update', '--agent', 'pi');
  assert.ok(!/== Skill visibility/.test(r.stdout + r.stderr));
  assert.ok(!fs.existsSync(piFile));
});

fs.rmSync(base, { recursive: true, force: true });
if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
