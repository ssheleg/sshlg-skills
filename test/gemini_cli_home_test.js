'use strict';
// B-204: Gemini CLI relocates with GEMINI_CLI_HOME, a HOME replacement — its config is
// <GEMINI_CLI_HOME>/.gemini and its shared skills root <GEMINI_CLI_HOME>/.agents/skills
// (Gemini CLI docs reference/configuration.md). GEMINI_CONFIG_DIR is not a Gemini
// variable; every resolver that read it must ignore it now.
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path');
const apply = require('../lib/apply'), blocks = require('../lib/blocks'), guard = require('../lib/guard');
const hostvis = require('../lib/hostvis'), catalogue = require('../lib/catalogue');
let count = 0;
function test(name, fn) {
  const box = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-cli-home-')));
  try { fn(box); count++; console.log('ok ' + name); } finally { fs.rmSync(box, { recursive: true, force: true }); }
}
const gemini = apply.TARGETS.find((t) => t.agent === 'gemini');

test('apply: GEMINI_CLI_HOME places the root at <value>/.gemini', (box) => {
  const home = path.join(box, 'home'), moved = path.join(box, 'gemini home');
  const v = apply.hostRootVerdict(gemini, home, { env: { GEMINI_CLI_HOME: moved }, platform: 'darwin' });
  assert.deepStrictEqual([v.root, v.source], [path.join(moved, '.gemini'), 'env']);
  assert.strictEqual(apply.hostRoot(gemini, home, { env: { GEMINI_CLI_HOME: moved } }), path.join(moved, '.gemini'));
});
test('apply: GEMINI_CONFIG_DIR is not a Gemini variable and is ignored', (box) => {
  const home = path.join(box, 'home');
  const v = apply.hostRootVerdict(gemini, home, { env: { GEMINI_CONFIG_DIR: path.join(box, 'x') }, platform: 'darwin' });
  assert.deepStrictEqual([v.root, v.source], [path.join(home, '.gemini'), 'platform-default']);
});
test('apply: other hosts keep their env value as the root itself', (box) => {
  const codex = apply.TARGETS.find((t) => t.agent === 'codex'), moved = path.join(box, 'cx');
  assert.strictEqual(apply.hostRoot(codex, path.join(box, 'home'), { env: { CODEX_HOME: moved } }), moved);
});
test('blocks: the Gemini target follows GEMINI_CLI_HOME and names it in the alias', (box) => {
  const home = path.join(box, 'home'), moved = path.join(box, 'g');
  const [row] = blocks.targets({ home, env: { GEMINI_CLI_HOME: moved }, agents: ['gemini'] });
  assert.strictEqual(row.file, path.join(moved, '.gemini', 'GEMINI.md'));
  assert.strictEqual(row.pathAlias, '${GEMINI_CLI_HOME}/.gemini/GEMINI.md');
  assert.strictEqual(row.rootSource, 'env');
  const [old] = blocks.targets({ home, env: { GEMINI_CONFIG_DIR: moved }, agents: ['gemini'] });
  assert.deepStrictEqual([old.file, old.rootSource], [path.join(home, '.gemini', 'GEMINI.md'), 'default']);
  const [cx] = blocks.targets({ home, env: { CODEX_HOME: path.join(box, 'cx') }, agents: ['codex'] });
  assert.strictEqual(cx.file, path.join(box, 'cx', 'AGENTS.md'));
});
test('guard: a relocated Gemini file is protected at <GEMINI_CLI_HOME>/.gemini/GEMINI.md', (box) => {
  const home = path.join(box, 'home'), moved = path.join(box, 'g');
  assert.ok(guard.targets(home, { GEMINI_CLI_HOME: moved }).includes(path.join(moved, '.gemini', 'GEMINI.md')));
  assert.ok(!guard.targets(home, { GEMINI_CONFIG_DIR: moved }).some((f) => f.startsWith(moved)));
});
test('hostvis: Gemini settings and both skill roots move with GEMINI_CLI_HOME', (box) => {
  const home = path.join(box, 'home'), moved = path.join(box, 'g');
  fs.mkdirSync(path.join(moved, '.gemini'), { recursive: true }); fs.mkdirSync(home);
  const row = hostvis.hosts(home, { GEMINI_CLI_HOME: moved }).find((h) => h.id === 'gemini');
  assert.strictEqual(row.present, true);
  assert.strictEqual(row.file, path.join(moved, '.gemini', 'settings.json'));
  assert.deepStrictEqual(row.roots, [path.join(moved, '.gemini', 'skills'), path.join(moved, '.agents', 'skills')]);
  const pi = hostvis.hosts(home, { GEMINI_CLI_HOME: moved }).find((h) => h.id === 'pi');
  assert.ok(pi.roots.includes(path.join(home, '.agents', 'skills')), 'Pi keeps the real HOME shared root');
  const plain = hostvis.hosts(home, {}).find((h) => h.id === 'gemini');
  assert.deepStrictEqual(plain.roots, [path.join(home, '.gemini', 'skills'), path.join(home, '.agents', 'skills')]);
});
test('catalogue: skills under <GEMINI_CLI_HOME>/.agents/skills are read', (box) => {
  const home = path.join(box, 'home'), moved = path.join(box, 'g');
  const dir = path.join(moved, '.agents', 'skills', 'relocated');
  fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(home);
  fs.writeFileSync(path.join(dir, 'SKILL.md'), '---\nname: relocated\ndescription: Relocated shared root\n---\n');
  const rows = catalogue.read(home, [], { env: { GEMINI_CLI_HOME: moved } });
  assert.ok(rows.some((s) => s.path === path.join(dir, 'SKILL.md')), JSON.stringify(rows.map((s) => s.path)));
});
console.log(`PASS: Gemini CLI home relocation — ${count} cases`);
