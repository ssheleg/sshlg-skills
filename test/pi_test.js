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

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
