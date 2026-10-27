#!/usr/bin/env node
'use strict';
// B-214: three holes in `visibility` beyond Claude and Codex, each against the host's own code.
//
// - Gemini CLI 0.63.0 renames a skill as it loads it: `frontmatter.name.replace(/[:\\/<>*?"|]/g, "-")`
//   (bundle chunk skillLoader), then matches `skills.disabled` case-insensitively against THAT
//   name (`setDisabledSkills`). A `/` in a name made the written entry miss (GEMINI-5).
// - OpenCode 1.19.0 scans `skills/**/SKILL.md` under ~/.claude and ~/.agents and
//   `{skill,skills}/**/SKILL.md` under its config dir: nested skills are listed too, and
//   the inventory read only direct children (OPENCODE-4).
// - The visibility scope mapped Kimi to `kimi`, an id the skills CLI does not know; its id is
//   `kimi-code-cli` (INST-10). `update --agent kimi` is refused by the installer before the
//   visibility step, so no machine can carry the old id.
//
// Every fixture is a temp HOME; nothing reads or writes the real one.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HV = require('../lib/hostvis.js');
const targets = require('../lib/host-targets.js');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hostvis-'));
function skillAt(dir, name) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: Use when testing ${name}.\n---\n# ${name}\n`);
}
const host = (home, id) => HV.hosts(home, { XDG_CONFIG_HOME: path.join(home, '.config') }).find((h) => h.id === id);

// ── Gemini: the name it matches ──

it('gemini: the entry is the name Gemini loads (`/ : \\ < > * ? " |` become `-`)', () => {
  const h = host(tmp(), 'gemini');
  assert.strictEqual(typeof h.hostName, 'function', 'gemini has no host-name rule');
  const skills = [{ name: 'ui-toolkit/web', dirs: [] }, { name: 'a:b', dirs: [] }, { name: 'x<y>*?"|\\z', dirs: [] }, { name: 'plain', dirs: [] }];
  assert.deepStrictEqual(HV.items(h, skills, skills.map((s) => s.name)), ['a-b', 'plain', 'ui-toolkit-web', 'x-y------z']);
});

it('gemini: two names that load as one are written once', () => {
  const h = host(tmp(), 'gemini');
  assert.deepStrictEqual(HV.items(h, [], ['ui/web', 'ui:web']), ['ui-web']);
});

it('opencode and hermes keep the name as written (their loaders do not rename)', () => {
  const home = tmp();
  for (const id of ['opencode', 'hermes']) assert.deepStrictEqual(HV.items(host(home, id), [], ['ui-toolkit/web']), ['ui-toolkit/web'], id);
});

// ── OpenCode: nested skills ──

function nestedHome() {
  const home = tmp();
  const shared = path.join(home, '.agents', 'skills');
  skillAt(path.join(shared, 'zoom-sdk'), 'zoom-sdk');
  skillAt(path.join(shared, 'zoom-sdk', 'web'), 'zoom-sdk-web');              // inside a skill
  skillAt(path.join(home, '.claude', 'skills', 'synced', 'u1'), 'synced-one'); // under a plain folder
  skillAt(path.join(shared, '.hidden', 'x'), 'dot-skill');                     // dot folders are skipped
  fs.mkdirSync(path.join(home, '.config', 'opencode'), { recursive: true });
  fs.mkdirSync(path.join(home, '.gemini'), { recursive: true });
  return { home, shared };
}

it('opencode: the inventory walks nested SKILL.md like OpenCode does', () => {
  const { home } = nestedHome();
  const h = host(home, 'opencode');
  const names = HV.inventory(h, new Map(), { strict: true }).map((s) => s.name).sort();
  assert.deepStrictEqual(names, ['synced-one', 'zoom-sdk', 'zoom-sdk-web']);
});

it('opencode: a nested skill takes the pack of the installed skill that holds it', () => {
  const { home } = nestedHome();
  const lock = new Map([['zoom-sdk', 'zoom/skills']]);
  const inv = HV.inventory(host(home, 'opencode'), lock, { strict: true });
  assert.strictEqual(inv.find((s) => s.name === 'zoom-sdk-web').pack, 'zoom/skills');
  assert.strictEqual(inv.find((s) => s.name === 'synced-one').pack, null);
});

it('opencode: a symlink loop does not hang the walk', () => {
  const { home, shared } = nestedHome();
  fs.symlinkSync(shared, path.join(shared, 'zoom-sdk', 'loop'));
  const names = HV.inventory(host(home, 'opencode'), new Map(), { strict: true }).map((s) => s.name);
  assert.ok(names.includes('zoom-sdk-web'), names.join(','));
});

it('gemini keeps reading direct children only (its loader is not recursive)', () => {
  const { home } = nestedHome();
  const names = HV.inventory(host(home, 'gemini'), new Map(), { strict: true }).map((s) => s.name);
  assert.deepStrictEqual(names, ['zoom-sdk']);
});

// ── Kimi: the skills-CLI id ──

it('every visibility host maps to an agent id the pinned skills CLI knows; Kimi is kimi-code-cli', () => {
  const known = new Set(targets.snapshot.agents.map((a) => a.id));
  assert.strictEqual(HV.AGENT.kimi, 'kimi-code-cli');
  for (const [id, agent] of Object.entries(HV.AGENT)) assert.ok(known.has(agent), `${id} -> ${agent} is not a skills-CLI id`);
  for (const h of HV.hosts(tmp(), {})) assert.ok(HV.AGENT[h.id], `${h.id} has no agent id`);
});

it('`--agent kimi` (the old id) is refused before anything runs, so no record can carry it', () => {
  assert.throws(() => targets.resolve(['cursor'], { agents: ['kimi'] }), /Unknown global install agent: kimi/);
});

// ── End to end: visibility --apply writes what each host matches ──

it('visibility --apply: Gemini gets `ui-toolkit-web`, OpenCode denies the nested skill', () => {
  const { home, shared } = nestedHome();
  skillAt(path.join(shared, 'ui-toolkit-web'), 'ui-toolkit/web');
  fs.writeFileSync(path.join(home, '.agents', '.skill-lock.json'), JSON.stringify({ version: 3, skills: {
    'zoom-sdk': { source: 'zoom/skills' }, 'ui-toolkit-web': { source: 'acme/ui' } } }));
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}\n');
  fs.writeFileSync(path.join(home, '.claude.json'), '{}');
  const gemini = path.join(home, '.gemini', 'settings.json');
  fs.writeFileSync(gemini, JSON.stringify({ skills: { disabled: [] } }, null, 2) + '\n');
  const opencode = path.join(home, '.config', 'opencode', 'opencode.json');
  fs.writeFileSync(opencode, JSON.stringify({ permission: { skill: {} } }, null, 2) + '\n');
  const env = Object.assign({}, process.env, { HOME: home, XDG_CONFIG_HOME: path.join(home, '.config'), SSHLG_SKILLS_NO_UPDATE_CHECK: '1', NO_COLOR: '1' });
  delete env.CLAUDE_CONFIG_DIR; delete env.CODEX_HOME; delete env.GEMINI_CLI_HOME; delete env.HERMES_HOME;
  const run = (...args) => {
    const r = spawnSync(process.execPath, [BIN, ...args], { cwd: ROOT, env, encoding: 'utf8', timeout: 120000 });
    return { status: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
  };
  const m = run('visibility', 'marks', '--init', '--apply');
  assert.strictEqual(m.status, 0, m.out);
  const a = run('visibility', '--apply');
  assert.strictEqual(a.status, 0, a.out);
  const disabled = JSON.parse(fs.readFileSync(gemini, 'utf8')).skills.disabled;
  assert.ok(disabled.includes('ui-toolkit-web') && !disabled.includes('ui-toolkit/web'), JSON.stringify(disabled));
  const deny = JSON.parse(fs.readFileSync(opencode, 'utf8')).permission.skill;
  assert.strictEqual(deny['zoom-sdk-web'], 'deny', JSON.stringify(deny));
  assert.strictEqual(deny['zoom-sdk'], 'deny', JSON.stringify(deny));
  const r = run('visibility', '--revert');
  assert.strictEqual(r.status, 0, r.out);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(gemini, 'utf8')).skills.disabled, []);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(opencode, 'utf8')).permission.skill, {});
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS: hostvis_holes — ${checks} cases`);
