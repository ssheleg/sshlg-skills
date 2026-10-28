#!/usr/bin/env node
'use strict';
// Fixtures for Pi as a host (R37): lib/pi.js (read-only detection and the
// duplicate report) and the routing block written to ~/.pi/agent/AGENTS.md by the
// same writer as ~/.codex/AGENTS.md. Every fixture points HOME at a temp directory.
//
// Facts this file encodes, with their source (Pi 1.1.0 docs, read 2026-10-12):
//   docs/skills.md:59-61   Pi reads ~/.pi/agent/skills, ~/.agents/skills, .pi/skills and
//                          .agents/skills (cwd up to the repo root), recursively
//   docs/skills.md:85      a name collision keeps the first discovered skill and warns
//   dist/core/package-manager.js (1.1.0, addAutoDiscoveredResources)  project roots are
//                          discovered before user roots, so a project copy wins (B-221)
//   docs/configuration.md:9,18  <agent-dir> is ~/.pi/agent or $PI_CODING_AGENT_DIR;
//                          AGENTS.md in it is a user instruction file
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const pi = require('../lib/pi.js');
const apply = require('../lib/apply.js');
const guard = require('../lib/guard.js');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-pi-'));
function skill(dir, name) {
  fs.mkdirSync(path.join(dir, name), { recursive: true });
  fs.writeFileSync(path.join(dir, name, 'SKILL.md'), `---\nname: ${name}\ndescription: x\n---\n`);
}
const FAMILY = new Set(['ux-flows', 'copywriting', 'make-skill']);
const none = () => null;

it('not detected: no ~/.pi/agent and no pi on PATH', () => {
  const r = pi.inspect({ home: tmp(), env: {}, cwd: tmp(), which: none, family: FAMILY });
  assert.strictEqual(r.detected, false);
  assert.deepStrictEqual(r.via, []);
});

it('detected by ~/.pi/agent alone, and by pi on PATH alone', () => {
  const h = tmp(); fs.mkdirSync(path.join(h, '.pi', 'agent'), { recursive: true });
  let r = pi.inspect({ home: h, env: {}, cwd: h, which: none, family: FAMILY });
  assert.strictEqual(r.detected, true);
  assert.deepStrictEqual(r.via, ['~/.pi/agent']);
  r = pi.inspect({ home: tmp(), env: {}, cwd: h, which: () => '/opt/homebrew/bin/pi', family: FAMILY });
  assert.strictEqual(r.detected, true);
  assert.deepStrictEqual(r.via, ['pi on PATH']);
});

it('PI_CODING_AGENT_DIR relocates the agent directory', () => {
  const h = tmp(); const other = tmp();
  const r = pi.inspect({ home: h, env: { PI_CODING_AGENT_DIR: other }, cwd: h, which: none, family: FAMILY });
  assert.strictEqual(r.agentDir, other);
  assert.strictEqual(r.detected, true);
});

it('family skills are reported per root, by name, found recursively', () => {
  const h = tmp();
  skill(path.join(h, '.agents', 'skills'), 'ux-flows');
  skill(path.join(h, '.agents', 'skills', 'nested'), 'copywriting');
  fs.mkdirSync(path.join(h, '.pi', 'agent', 'skills'), { recursive: true });
  const r = pi.inspect({ home: h, env: {}, cwd: h, which: none, family: FAMILY });
  assert.strictEqual(r.family.total, 3);
  assert.deepStrictEqual(r.family.visible.sort(), ['copywriting', 'ux-flows']);
  assert.deepStrictEqual(r.family.missing, ['make-skill']);
});

it('the same name through a symlink to one realpath is harmless information', () => {
  const h = tmp();
  skill(path.join(h, '.agents', 'skills'), 'ux-flows');
  fs.mkdirSync(path.join(h, '.pi', 'agent', 'skills'), { recursive: true });
  fs.symlinkSync(path.join(h, '.agents', 'skills', 'ux-flows'), path.join(h, '.pi', 'agent', 'skills', 'ux-flows'));
  const r = pi.inspect({ home: h, env: {}, cwd: h, which: none, family: FAMILY });
  assert.strictEqual(r.duplicates.harmless, 1);
  assert.strictEqual(r.duplicates.conflicts.length, 0);
});

it('the same name at two different realpaths is a conflict, and a family one is named', () => {
  const h = tmp();
  skill(path.join(h, '.agents', 'skills'), 'ux-flows');
  skill(path.join(h, '.pi', 'agent', 'skills'), 'ux-flows');
  skill(path.join(h, '.agents', 'skills'), 'unrelated');
  skill(path.join(h, '.pi', 'agent', 'skills'), 'unrelated');
  const r = pi.inspect({ home: h, env: {}, cwd: h, which: none, family: FAMILY });
  assert.strictEqual(r.duplicates.harmless, 0);
  assert.deepStrictEqual(r.duplicates.conflicts.map((c) => c.name).sort(), ['unrelated', 'ux-flows']);
  assert.deepStrictEqual(r.duplicates.familyConflicts, ['ux-flows']);
  // Pi keeps the FIRST discovered: ~/.pi/agent/skills comes before ~/.agents/skills
  const c = r.duplicates.conflicts.find((x) => x.name === 'ux-flows');
  assert.ok(c.locations[0].path.includes(path.join('.pi', 'agent', 'skills')), JSON.stringify(c));
});

it('project roots are read from cwd up to the repository root, and no further', () => {
  const h = tmp(); const above = path.join(h, 'above'); const repo = path.join(above, 'repo');
  const sub = path.join(repo, 'a', 'b');
  fs.mkdirSync(sub, { recursive: true }); fs.mkdirSync(path.join(repo, '.git'));
  skill(path.join(repo, '.agents', 'skills'), 'ux-flows');
  skill(path.join(above, '.agents', 'skills'), 'copywriting'); // above the repo root: not read
  const r = pi.inspect({ home: h, env: {}, cwd: sub, which: none, family: FAMILY });
  assert.deepStrictEqual(r.family.visible, ['ux-flows']);
});

// B-221: Pi 1.1.0 discovers project roots BEFORE the user roots, and the first name wins
// (dist/core/package-manager.js addAutoDiscoveredResources: `<cwd>/.pi/skills`, then
// `.agents/skills` from cwd up to the git root, then ~/.pi/agent/skills, then ~/.agents/skills).
it('a project root wins a name collision over both user roots (B-221)', () => {
  const h = tmp(); const repo = path.join(h, 'work', 'repo');
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
  skill(path.join(h, '.agents', 'skills'), 'ux-flows');
  skill(path.join(h, '.pi', 'agent', 'skills'), 'ux-flows');
  skill(path.join(repo, '.agents', 'skills'), 'ux-flows');
  const r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  const c = r.duplicates.conflicts.find((x) => x.name === 'ux-flows');
  assert.ok(c, JSON.stringify(r.duplicates));
  assert.strictEqual(c.locations[0].path, path.join(repo, '.agents', 'skills', 'ux-flows'), JSON.stringify(c));
  assert.deepStrictEqual(c.locations.slice(1).map((l) => l.path), [
    path.join(h, '.pi', 'agent', 'skills', 'ux-flows'), path.join(h, '.agents', 'skills', 'ux-flows')]);
  assert.deepStrictEqual(r.roots.map((x) => x.kind), ['project', 'user', 'user']);
});

it('project .pi/skills comes before project .agents/skills, nearest .agents first (B-221)', () => {
  const h = tmp(); const repo = path.join(h, 'repo'); const sub = path.join(repo, 'pkg');
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true }); fs.mkdirSync(sub, { recursive: true });
  skill(path.join(repo, '.agents', 'skills'), 'copywriting');
  skill(path.join(sub, '.agents', 'skills'), 'copywriting');
  skill(path.join(sub, '.pi', 'skills'), 'copywriting');
  const r = pi.inspect({ home: h, env: {}, cwd: sub, which: none, family: FAMILY });
  const c = r.duplicates.conflicts.find((x) => x.name === 'copywriting');
  assert.deepStrictEqual(c.locations.map((l) => l.path), [
    path.join(sub, '.pi', 'skills', 'copywriting'),
    path.join(sub, '.agents', 'skills', 'copywriting'),
    path.join(repo, '.agents', 'skills', 'copywriting')]);
});

it('.pi/skills is read in the working directory only, not in its ancestors (B-221)', () => {
  const h = tmp(); const repo = path.join(h, 'repo'); const sub = path.join(repo, 'pkg');
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true }); fs.mkdirSync(sub, { recursive: true });
  skill(path.join(repo, '.pi', 'skills'), 'make-skill');
  const r = pi.inspect({ home: h, env: {}, cwd: sub, which: none, family: FAMILY });
  assert.deepStrictEqual(r.family.visible, []);
});

it('~/.agents/skills reached as a project ancestor stays a user root, read last (B-221)', () => {
  const h = tmp();
  skill(path.join(h, '.agents', 'skills'), 'ux-flows');
  skill(path.join(h, '.pi', 'agent', 'skills'), 'ux-flows');
  const r = pi.inspect({ home: h, env: {}, cwd: h, which: none, family: FAMILY });
  assert.deepStrictEqual(r.roots.map((x) => [x.path, x.kind]), [
    [path.join(h, '.pi', 'agent', 'skills'), 'user'], [path.join(h, '.agents', 'skills'), 'user']]);
  const c = r.duplicates.conflicts.find((x) => x.name === 'ux-flows');
  assert.ok(c.locations[0].path.startsWith(path.join(h, '.pi', 'agent', 'skills')), JSON.stringify(c));
});

it('TARGETS carries pi at ~/.pi/agent/AGENTS.md and the write guard protects it', () => {
  const t = apply.TARGETS.find((x) => x.agent === 'pi');
  assert.ok(t, 'no pi target');
  assert.strictEqual(path.join(t.dir, t.file), path.join('.pi', 'agent', 'AGENTS.md'));
  assert.strictEqual(t.env, 'PI_CODING_AGENT_DIR');
  assert.ok(guard.targets('/h').includes(path.join('/h', '.pi', 'agent', 'AGENTS.md')));
});

function run(home, args, env) {
  const r = spawnSync(process.execPath, [BIN].concat(args), {
    encoding: 'utf8', env: Object.assign({}, process.env, { HOME: home }, env || {}),
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const sha = (f) => require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex');

function sandboxWithPi() {
  const home = tmp();
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(home, '.pi', 'agent'), { recursive: true });
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  fs.writeFileSync(path.join(home, '.sshlg-skills', 'state.json'), JSON.stringify({ routers: 'yes' }) + '\n');
  return home;
}

it('routers writes the block into a REAL ~/.pi/agent/AGENTS.md: preview first, backup, three identical runs', () => {
  const home = sandboxWithPi();
  const file = path.join(home, '.pi', 'agent', 'AGENTS.md');
  const mine = '# My Pi notes\n\nKeep this byte for byte.\n';
  fs.writeFileSync(file, mine);
  const dry = run(home, ['routers', '--dry-run']);
  assert.ok(dry.out.includes(file) , 'the preview does not name the Pi file: ' + dry.out.slice(0, 400));
  assert.strictEqual(fs.readFileSync(file, 'utf8'), mine, '--dry-run wrote');
  run(home, ['routers']);
  const first = sha(file);
  const body = fs.readFileSync(file, 'utf8');
  assert.ok(body.startsWith(mine) || body.includes(mine.trim()), 'text outside the sentinels changed');
  assert.ok(/SSHLG:ROUTERS:BEGIN/.test(body) && /SSHLG:ROUTERS:END/.test(body), 'no sentinels');
  assert.ok(body.includes('## Work routing'), 'no routing block');
  run(home, ['routers']); const second = sha(file);
  run(home, ['routers']); const third = sha(file);
  assert.ok(first === second && second === third, `hashes ${first.slice(0, 8)} ${second.slice(0, 8)} ${third.slice(0, 8)}`);
  const bk = path.join(home, '.sshlg-skills', 'backups');
  const copies = fs.existsSync(bk) ? fs.readdirSync(bk).filter((n) => n.includes('AGENTS.md')) : [];
  assert.ok(copies.some((n) => fs.readFileSync(path.join(bk, n), 'utf8') === mine), 'no backup of the original');
});

it('no ~/.pi/agent means nothing is created', () => {
  const home = sandboxWithPi(); fs.rmSync(path.join(home, '.pi'), { recursive: true });
  run(home, ['routers']);
  assert.ok(!fs.existsSync(path.join(home, '.pi')), 'a Pi directory was invented');
});

it('PI_CODING_AGENT_DIR is honoured by the writer', () => {
  const home = sandboxWithPi(); const alt = tmp();
  run(home, ['routers'], { PI_CODING_AGENT_DIR: alt });
  assert.ok(fs.existsSync(path.join(alt, 'AGENTS.md')), 'the relocated Pi file was not written');
  assert.ok(!fs.existsSync(path.join(home, '.pi', 'agent', 'AGENTS.md')), 'the default path was written too');
});

it('uninstall and the write guard follow PI_CODING_AGENT_DIR too (B-165)', () => {
  const home = sandboxWithPi(); const alt = tmp();
  const env = { PI_CODING_AGENT_DIR: alt };
  const file = path.join(alt, 'AGENTS.md');
  fs.writeFileSync(file, '# mine\n');
  run(home, ['routers'], env);
  assert.ok(fs.readFileSync(file, 'utf8').includes('SSHLG:ROUTERS:BEGIN'), 'not written');
  const guard = require('../lib/guard.js');
  const hit = guard.decide({ tool_name: 'Write', tool_input: { file_path: file } }, home, env);
  assert.strictEqual(hit, path.resolve(file), 'the relocated Pi file is not protected');
  run(home, ['uninstall', '--no-claude'], env);
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(!after.includes('SSHLG:ROUTERS:BEGIN'), 'uninstall left the block in the relocated file');
  assert.ok(after.includes('# mine'), 'uninstall took the operator text with it');
});

it('--agent codex does not touch the Pi file', () => {
  const home = sandboxWithPi();
  fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
  run(home, ['routers', '--agent', 'codex']);
  assert.ok(!fs.existsSync(path.join(home, '.pi', 'agent', 'AGENTS.md')));
});

it('`hosts` reports Pi: detection, where family skills are visible, duplicates', () => {
  const home = sandboxWithPi();
  skill(path.join(home, '.agents', 'skills'), 'ux-flows');
  skill(path.join(home, '.pi', 'agent', 'skills'), 'ux-flows');
  const r = run(home, ['hosts']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(/pi\s+detected/.test(r.out), r.out);
  assert.ok(/conflict.*ux-flows|ux-flows.*conflict/i.test(r.out), r.out);
  assert.ok(/family skills visible to Pi \(by name\): 1 of \d+/.test(r.out), r.out);
});

it('`hosts` names project-first precedence and that project roots need trust (B-221)', () => {
  const home = sandboxWithPi();
  const repo = path.join(home, 'repo');
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
  skill(path.join(home, '.agents', 'skills'), 'ux-flows');
  skill(path.join(repo, '.agents', 'skills'), 'ux-flows');
  const r = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: repo, encoding: 'utf8', env: Object.assign({}, process.env, { HOME: home }) });
  const out = `${r.stdout}${r.stderr}`;
  assert.strictEqual(r.status, 0, out);
  assert.ok(out.includes(`conflict: ux-flows [family]: Pi keeps ${path.join(fs.realpathSync(repo), '.agents', 'skills', 'ux-flows')}`), out);
  assert.ok(/project roots first/.test(out) && /trust/.test(out), out);
});

it('uninstall removes the managed block from the Pi file and keeps the rest', () => {
  const home = sandboxWithPi();
  const file = path.join(home, '.pi', 'agent', 'AGENTS.md');
  fs.writeFileSync(file, '# mine\n');
  run(home, ['routers']);
  assert.ok(fs.readFileSync(file, 'utf8').includes('SSHLG:ROUTERS:BEGIN'));
  const r = run(home, ['uninstall', '--no-claude', '--dry-run']);
  assert.ok(r.out.includes('.pi/agent/AGENTS.md'), r.out.slice(0, 600));
  assert.ok(fs.readFileSync(file, 'utf8').includes('SSHLG:ROUTERS:BEGIN'), 'the dry run wrote');
  run(home, ['uninstall', '--no-claude']);
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(!after.includes('SSHLG:ROUTERS:BEGIN'), 'the block is still there after uninstall');
  assert.ok(after.includes('# mine'), 'uninstall took the operator text with it');
});

// --- B-263: Pi's trust store decides whether project roots load ------------------------
//
// Pi 1.1.0 (dist/core/trust-manager.js, dist/core/project-trust.js, dist/main.js): a project
// with trust-requiring resources (`.pi/{settings.json,mcp.json,extensions,skills,prompts,
// themes,SYSTEM.md,APPEND_SYSTEM.md}`, or `.agents/skills` in cwd or any ancestor other than
// ~/.agents/skills) loads its project roots only when trusted. The decision is the nearest
// entry (cwd, then its ancestors, by realpath) in `<agent-dir>/trust.json` (true, false; null
// is no entry); without one, `defaultProjectTrust` in `<agent-dir>/settings.json` (`always`,
// `never`, otherwise `ask`); `ask` prompts in an interactive session and is false headless.
// `--approve`/`--no-approve` and an extension's `project_trust` handler override it per run.
const real = (p) => fs.realpathSync(p);
function trustRepo() {
  const h = tmp(); const repo = path.join(h, 'work', 'repo');
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
  fs.mkdirSync(path.join(h, '.pi', 'agent'), { recursive: true });
  skill(path.join(h, '.agents', 'skills'), 'ux-flows');
  skill(path.join(repo, '.agents', 'skills'), 'ux-flows');
  skill(path.join(repo, '.agents', 'skills'), 'make-skill');
  return { h, repo };
}
const writeTrust = (h, data) => fs.writeFileSync(path.join(h, '.pi', 'agent', 'trust.json'), JSON.stringify(data, null, 2) + '\n');

it('B-263: a project the store does not trust loads no project root: its copies are not counted', () => {
  const { h, repo } = trustRepo();
  writeTrust(h, { [real(repo)]: false });
  const r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.strictEqual(r.trust.verdict, 'untrusted');
  assert.strictEqual(r.trust.entry, real(repo));
  assert.deepStrictEqual(r.roots.map((x) => [x.kind, x.loaded]), [['project', false], ['user', true]]);
  assert.deepStrictEqual(r.family.visible, ['ux-flows'], 'a copy Pi will not load was counted as visible');
  assert.deepStrictEqual(r.duplicates.conflicts, [], 'a copy Pi will not load was named in a conflict');
});

it('B-263: the nearest entry decides, by realpath; a trusted parent covers the project', () => {
  const { h, repo } = trustRepo();
  writeTrust(h, { [real(path.join(h, 'work'))]: true });
  let r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.deepStrictEqual([r.trust.verdict, r.trust.entry], ['trusted', real(path.join(h, 'work'))]);
  assert.ok(r.duplicates.conflicts.some((c) => c.name === 'ux-flows'), 'a trusted project copy still wins the collision');
  writeTrust(h, { [real(path.join(h, 'work'))]: true, [real(repo)]: false, [real(h)]: null });
  r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.strictEqual(r.trust.verdict, 'untrusted', 'the nearer entry did not win');
  const link = path.join(h, 'link');
  fs.symlinkSync(repo, link);
  r = pi.inspect({ home: h, env: {}, cwd: link, which: none, family: FAMILY });
  assert.strictEqual(r.trust.verdict, 'untrusted', 'a symlinked cwd is matched by its realpath');
});

it('B-263: with no entry, defaultProjectTrust decides; ask is reported as a prompt', () => {
  const { h, repo } = trustRepo();
  const settings = (v) => fs.writeFileSync(path.join(h, '.pi', 'agent', 'settings.json'), JSON.stringify(v));
  let r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.deepStrictEqual([r.trust.verdict, r.trust.default, r.trust.store], ['asks', 'ask', 'absent']);
  assert.ok(r.roots[0].loaded, 'an interactive session that accepts loads the project roots');
  settings({ defaultProjectTrust: 'never' });
  r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.deepStrictEqual([r.trust.verdict, r.trust.default], ['untrusted', 'never']);
  assert.strictEqual(r.roots[0].loaded, false);
  settings({ defaultProjectTrust: 'always' });
  r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.strictEqual(r.trust.verdict, 'trusted');
  settings({ defaultProjectTrust: 'sometimes' });
  assert.strictEqual(pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY }).trust.default, 'ask');
});

it('B-263: a folder with no trust-requiring resources needs no trust; ~/.agents/skills is not one', () => {
  const h = tmp(); const dir = path.join(h, 'plain');
  fs.mkdirSync(dir, { recursive: true });
  skill(path.join(h, '.agents', 'skills'), 'ux-flows');
  const r = pi.inspect({ home: h, env: {}, cwd: dir, which: none, family: FAMILY });
  assert.strictEqual(r.trust.verdict, 'not-needed');
  const p = tmp();
  fs.mkdirSync(path.join(p, '.pi'), { recursive: true });
  fs.writeFileSync(path.join(p, '.pi', 'SYSTEM.md'), 'x');
  assert.strictEqual(pi.projectTrust({ home: h, env: {}, cwd: p }).needed, true, '.pi/SYSTEM.md needs trust');
});

it('B-263: a malformed store is reported as Pi reports it, never guessed; PI_CODING_AGENT_DIR moves it', () => {
  const { h, repo } = trustRepo();
  writeTrust(h, { [real(repo)]: 'yes' });
  let r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.strictEqual(r.trust.verdict, 'unknown');
  assert.match(r.trust.reason, /must be true, false, or null/);
  const other = tmp();
  fs.writeFileSync(path.join(other, 'trust.json'), JSON.stringify({ [real(repo)]: true }));
  r = pi.inspect({ home: h, env: { PI_CODING_AGENT_DIR: other }, cwd: repo, which: none, family: FAMILY });
  assert.deepStrictEqual([r.trust.verdict, r.trust.file], ['trusted', path.join(other, 'trust.json')]);
});

it('B-263: every project in the store is listed with whether Pi loads its project roots', () => {
  const { h, repo } = trustRepo();
  writeTrust(h, { '/a/yes': true, '/b/no': false, '/c/cleared': null });
  const t = pi.projectTrust({ home: h, env: {}, cwd: repo });
  assert.deepStrictEqual(t.entries, [{ path: '/a/yes', trusted: true }, { path: '/b/no', trusted: false }]);
});

it('B-263: `hosts` says per project whether Pi loads its project roots, read-only', () => {
  const home = sandboxWithPi();
  const repo = path.join(home, 'repo');
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
  skill(path.join(home, '.agents', 'skills'), 'ux-flows');
  skill(path.join(repo, '.agents', 'skills'), 'ux-flows');
  const trust = path.join(home, '.pi', 'agent', 'trust.json');
  fs.writeFileSync(trust, JSON.stringify({ [real(repo)]: false, '/elsewhere/proj': true }, null, 2) + '\n');
  const before = sha(trust);
  const env = Object.assign({}, process.env, { HOME: home });
  delete env.PI_CODING_AGENT_DIR;
  const r = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: repo, encoding: 'utf8', env });
  const out = `${r.stdout}${r.stderr}`;
  assert.strictEqual(r.status, 0, out);
  assert.ok(out.includes(`project trust here (${real(repo)}): not trusted`), out);
  assert.ok(/Pi does not load this project's roots/.test(out), out);
  assert.ok(!/conflict: ux-flows/.test(out), 'a copy Pi will not load was named in a conflict');
  assert.ok(out.includes(`${real(repo)}: not trusted, project roots not loaded`), out);
  assert.ok(out.includes('/elsewhere/proj: trusted, project roots load'), out);
  assert.ok(!out.includes('—'), 'the report carries an em dash');
  assert.strictEqual(sha(trust), before, 'hosts wrote the trust store');
});

// B-293: when Pi would ask, a project copy is visible only after the person trusts the
// project, and a headless `pi -p` (which answers no) never loads it. The counts say both.
it('B-293: in the ask state the family count splits into after-trust and headless', () => {
  const { h, repo } = trustRepo();
  const r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  assert.strictEqual(r.trust.verdict, 'asks');
  assert.deepStrictEqual(r.family.visible, ['make-skill', 'ux-flows'], 'visible once trusted');
  assert.deepStrictEqual(r.family.headless, ['ux-flows'], 'a headless run loads only the user copy');
  assert.deepStrictEqual(r.family.afterTrust, ['make-skill'], 'make-skill exists only in the project root');
  assert.deepStrictEqual(r.roots.map((x) => [x.kind, x.loaded, Boolean(x.asks)]), [['project', true, true], ['user', true, false]]);
  const c = r.duplicates.conflicts.find((x) => x.name === 'ux-flows');
  assert.ok(c && c.afterTrust, 'a conflict that needs the project copy is marked as after-trust');
});

it('B-293: trusted and untrusted projects have no after-trust part; headless equals visible', () => {
  for (const [value, visible] of [[true, ['make-skill', 'ux-flows']], [false, ['ux-flows']]]) {
    const { h, repo } = trustRepo();
    writeTrust(h, { [real(repo)]: value });
    const r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
    assert.deepStrictEqual(r.family.visible, visible, String(value));
    assert.deepStrictEqual(r.family.headless, visible, String(value));
    assert.deepStrictEqual(r.family.afterTrust, [], String(value));
    assert.ok(r.roots.every((x) => !x.asks), String(value));
    assert.ok(r.duplicates.conflicts.every((x) => !x.afterTrust), String(value));
  }
});

it('B-293: a conflict between the two user roots stays real in a headless run', () => {
  const { h, repo } = trustRepo();
  skill(path.join(h, '.pi', 'agent', 'skills'), 'copywriting');
  skill(path.join(h, '.agents', 'skills'), 'copywriting');
  const r = pi.inspect({ home: h, env: {}, cwd: repo, which: none, family: FAMILY });
  const c = r.duplicates.conflicts.find((x) => x.name === 'copywriting');
  assert.ok(c && !c.afterTrust, 'a user-root conflict was marked as after-trust');
});

it('B-293: `hosts` reports the ask state in the counts, not only in the text', () => {
  const home = sandboxWithPi();
  const repo = path.join(home, 'repo');
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
  skill(path.join(home, '.agents', 'skills'), 'ux-flows');
  skill(path.join(repo, '.agents', 'skills'), 'ux-flows');
  skill(path.join(repo, '.agents', 'skills'), 'make-skill');
  const env = Object.assign({}, process.env, { HOME: home });
  delete env.PI_CODING_AGENT_DIR;
  const r = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: repo, encoding: 'utf8', env });
  const out = `${r.stdout}${r.stderr}`;
  assert.strictEqual(r.status, 0, out);
  const m = /family skills visible to Pi \(by name\): (\d+) of (\d+) after you trust this project; (\d+) of \2 in a headless run/.exec(out);
  assert.ok(m, out);
  assert.deepStrictEqual([Number(m[1]), Number(m[3])], [2, 1], out);
  assert.ok(/only after trust: make-skill/.test(out), out);
  assert.ok(/skills root \(project\) .* \(loads after you trust the project; headless runs skip it\)/.test(out), out);
  assert.ok(/conflict: ux-flows \[family\]: Pi keeps .* \(after you trust the project\)$/m.test(out), out);
  assert.ok(!out.includes('\u2014'), 'the report carries an em dash');
  const trusted = path.join(home, '.pi', 'agent', 'trust.json');
  fs.writeFileSync(trusted, JSON.stringify({ [real(repo)]: true }) + '\n');
  const t = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: repo, encoding: 'utf8', env });
  const tout = `${t.stdout}${t.stderr}`;
  assert.ok(/family skills visible to Pi \(by name\): 2 of \d+(;|$)/m.test(tout), tout);
  assert.ok(!/headless run|only after trust/.test(tout), 'a trusted project was reported as pending trust');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
