#!/usr/bin/env node
'use strict';
// Fixtures for lib/conflicts.js — which installed skills land on a router's ground.
//
// The load-bearing one is the first block: this module matches short words against
// other people's descriptions, and its first run over a real machine produced a
// report two thirds of which was words inside other words — `lease` in *please*,
// `ux` inside a longer word. That is the family's oldest matching bug (`аудит`
// matching `аудитория`, documented in lib/triggers.js) rediscovered from the other
// side, so the boundary cases are asserted before anything else.
//
// The rest is about what the module may CLAIM. A list of other people's packs
// presented as offenders is a judgement dressed as a measurement — `injectors.js`
// makes the same refusal — so the report's wording is fixtured, and so is the empty
// case, because a check nobody has watched print is indistinguishable from a broken one.

const assert = require('assert');
const C = require('../lib/conflicts.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const skill = (id, description, plugin) => ({ plugin: plugin || 'other@mkt', id, description });
const hits = (rows) => rows.map((r) => `${r.id}→${r.router}`);

// --- word boundaries, the reason this fixture exists ------------------------

it('a term inside a longer word does not match', () => {
  const rows = C.collisions([
    skill('polite-bot', 'Say please and thank you'),          // lease ⊂ please
    skill('linux-helper', 'Tips for Linux and tmux users'),   // ux ⊂ linux, tmux
    skill('seoul-guide', 'A travel guide to Seoul'),          // seo ⊂ seoul
  ]);
  assert.deepStrictEqual(hits(rows), [], `matched inside a word: ${JSON.stringify(rows)}`);
});

it('the same terms match when they are whole words', () => {
  const rows = C.collisions([
    skill('locker', 'Takes a lease on a shared registry'),
    skill('ui-helper', 'Improves the UX of a page'),
    skill('ranker', 'Runs an SEO report'),
  ]);
  assert.deepStrictEqual(hits(rows).sort(),
    ['locker→agent-sync', 'ranker→seo-llmo', 'ui-helper→super-ux'].sort());
});

it('a term is matched case-insensitively and across the id as well as the description', () => {
  assert.deepStrictEqual(hits(C.collisions([skill('figma-thing', '')])), ['figma-thing→sheleg-design']);
  assert.deepStrictEqual(hits(C.collisions([skill('anon', 'Works with FIGMA files')])), ['anon→sheleg-design']);
});

it('punctuation and hyphens are word boundaries, so a hyphenated id still matches', () => {
  assert.deepStrictEqual(hits(C.collisions([skill('build-an-mcp-server-now', '')])),
    ['build-an-mcp-server-now→agent-stack']);
});

// --- what it must not claim -------------------------------------------------

it("the family's own plugins are excluded, or its own ground buries the rest", () => {
  const all = [skill('sheleg-design', 'palette and motion', 'sheleg-design@sheleg-design-skill'),
               skill('figma-use', 'figma things')];
  assert.strictEqual(C.collisions(all).length, 2, 'without `owned`, both land');
  const rows = C.collisions(all, { owned: ['sheleg-design@sheleg-design-skill'] });
  assert.deepStrictEqual(hits(rows), ['figma-use→sheleg-design']);
});

it('a router not in scope has no ground to defend', () => {
  const s = [skill('pixel-thing', 'Sets up conversion tracking')];
  assert.deepStrictEqual(hits(C.collisions(s)), ['pixel-thing→sheleg-dev']);
  assert.deepStrictEqual(hits(C.collisions(s, { routers: ['super-ux', 'seo-llmo'] })), []);
});

it('the report says CANDIDATES and never offenders', () => {
  const text = C.report(C.collisions([skill('figma-use', '')]));
  assert.ok(/CANDIDATES, not offenders/.test(text), 'the disclaimer is missing');
  assert.ok(/never a second entry point/.test(text), 'the actual rule is missing');
  assert.ok(/hand-kept/.test(text), 'the lexicon does not admit it is hand-kept');
  assert.ok(!/offender[s]? found|violation/i.test(text), 'the report reads as a verdict');
});

it('the empty case still prints, so the check can be watched working', () => {
  const text = C.report([]);
  assert.ok(text.length > 40);
  assert.ok(/none — nothing installed here overlaps/.test(text));
});

it('a scanned count is reported when it is known, and omitted when it is not', () => {
  assert.ok(/12 skill\(s\) scanned, 0 landing\(s\)/.test(C.report([], { scanned: 12 })));
  assert.ok(!/scanned/.test(C.report([])));
});

// --- shape ------------------------------------------------------------------

it('rows are sorted, so two runs over one machine agree', () => {
  const rows = C.collisions([
    skill('zeta', 'figma', 'b@m'), skill('alpha', 'figma', 'b@m'), skill('mid', 'figma', 'a@m'),
  ]);
  assert.deepStrictEqual(rows.map((r) => `${r.plugin}/${r.id}`), ['a@m/mid', 'b@m/alpha', 'b@m/zeta']);
});

it('junk in, nothing out — never a throw', () => {
  assert.deepStrictEqual(C.collisions(null), []);
  assert.deepStrictEqual(C.collisions([null, {}, { id: '' }]), []);
  assert.deepStrictEqual(C.collisions([{ id: 'x' }]), []);
  assert.ok(C.report(null).length > 0);
});

it('every term in the lexicon belongs to a router the registry declares', () => {
  const declared = new Set(require('../lib/routers-registry.js').order());
  const unknown = Object.keys(C.TERRITORY).filter((r) => !declared.has(r));
  assert.deepStrictEqual(unknown, [], `territory for a router that does not exist: ${unknown}`);
});

it('the pure functions reach no filesystem', () => {
  const fs = require('fs');
  const guarded = ['readFileSync', 'readdirSync', 'existsSync'];
  const saved = {};
  for (const k of guarded) { saved[k] = fs[k]; fs[k] = () => { throw new Error(`conflicts touched fs.${k}`); }; }
  try {
    C.report(C.collisions([skill('figma-use', 'figma')], { owned: [] }), { scanned: 1 });
  } finally {
    for (const k of guarded) fs[k] = saved[k];
  }
});

// --- the command, as a process ----------------------------------------------
//
// `docs/DOCMAP.md` requires a new CLI verb to carry a fixture over its exact output
// and exit code, and it means as a PROCESS: the module can be perfect while the
// command that calls it throws on a machine with no plugin registry, which is the
// state of every fresh HOME and of CI.

it('`conflicts` exits 0 and prints the disclaimer on a HOME with nothing installed', () => {
  const { spawnSync } = require('child_process');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-conflicts-'));
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'conflicts'],
    { encoding: 'utf8', env: Object.assign({}, process.env, { HOME: home }) });
  const out = (r.stdout || '') + (r.stderr || '');
  assert.strictEqual(r.status, 0, `exit ${r.status}\n${out}`);
  assert.ok(/Installed skills that land on ground a router owns/.test(out), out);
  assert.ok(/none — nothing installed here overlaps/.test(out), out);
  assert.ok(/CANDIDATES, not offenders/.test(out), out);
});

it('`--help` advertises the verb, or nobody finds it', () => {
  const { spawnSync } = require('child_process');
  const path = require('path');
  const r = spawnSync(process.execPath,
    [path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), '--help'], { encoding: 'utf8' });
  assert.ok(/npx sshlg-skills conflicts/.test((r.stdout || '') + (r.stderr || '')));
});

// A directory under a plugin's `skills/` is not a skill unless it carries a
// `SKILL.md`. `super-ux` ships `skills/references/` as a shared reference
// directory for its seven real skills, so the roster the routing block MANDATES
// an agent read before substantial work handed back a skill that does not exist
// — with a blank description, because there was no front matter to read — and
// the headline count was one too high (519 where 518 are reachable).
it('A DIRECTORY WITH NO SKILL.md IS NOT A SKILL', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-nonskill-'));
  const inst = path.join(home, 'plug');
  const skills = path.join(inst, 'skills');
  fs.mkdirSync(path.join(skills, 'real'), { recursive: true });
  fs.writeFileSync(path.join(skills, 'real', 'SKILL.md'),
    '---\nname: real\ndescription: Use when something real happens.\n---\nbody\n');
  fs.mkdirSync(path.join(skills, 'references'), { recursive: true });
  fs.writeFileSync(path.join(skills, 'references', 'best-practices.md'), '# not a skill\n');

  fs.mkdirSync(path.join(home, '.claude', 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'),
    JSON.stringify({ enabledPlugins: { 'p@m': true } }));
  fs.writeFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({ plugins: { 'p@m': [{ installPath: inst }] } }));

  const found = C.readSkills(home).map((s) => s.id).sort();
  assert.deepStrictEqual(found, ['real'],
    'a reference directory was counted as a skill: ' + JSON.stringify(found));
});

// The class, not the case. `lib/router-texts.js` sat in `lib/` with in-degree 0
// — reachable from two test files and nothing else — while `package.json`'s
// `files` ships all of `lib/` and `runtime.sync` copies it into every operator's
// runtime. It had already shipped BROKEN once for exactly that reason: the tenth
// router arrived with no export and nothing went red, because nothing consumed
// it. Discovered rather than listed, so the next orphan fails here on arrival.
it('NO MODULE IN lib/ IS UNREACHABLE FROM PRODUCTION CODE', () => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const prod = [];
  for (const d of ['lib', 'hooks', 'bin', 'scripts']) {
    const dir = path.join(root, d);
    let names = [];
    try { names = fs.readdirSync(dir); } catch (e) { continue; }
    for (const n of names) if (n.endsWith('.js')) prod.push(path.join(dir, n));
  }
  const libs = fs.readdirSync(path.join(root, 'lib')).filter((n) => n.endsWith('.js'));
  const referenced = new Set();
  for (const f of prod) {
    const src = fs.readFileSync(f, 'utf8');
    for (const lib of libs) {
      const base = lib.replace(/\.js$/, '');
      // A REQUIRE, not a mention. The first version of this check matched the
      // module name anywhere in the file and passed while the orphan was still
      // in `lib/` — because `routers-registry.js` names it in a comment about
      // where the text used to live. A guard that counts prose as a reference
      // is a green that means nothing, which is the thing this repository keeps
      // filing against itself.
      //
      // Three shapes are real: `require('./x.js')`, `require('../lib/x.js')`,
      // and the dynamic `require(path.join(LIB, 'x.js'))` the hooks use.
      if (path.basename(f) === lib && path.dirname(f).endsWith('lib')) continue;
      const req = new RegExp(
        `require\\(\\s*(?:path\\.join\\([^)]*?)?['"\`][^'"\`]*${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\.js)?['"\`]`);
      if (req.test(src)) referenced.add(lib);
    }
  }
  const orphans = libs.filter((l) => !referenced.has(l));
  assert.deepStrictEqual(orphans, [],
    'unreachable from production code and yet shipped in `files` and copied into '
    + 'every operator runtime: ' + orphans.join(', '));
});

if (failures.length) {
  console.error(`FAIL: conflicts — ${failures.length} of ${checks}`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
