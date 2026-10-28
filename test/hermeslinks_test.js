#!/usr/bin/env node
'use strict';
// B-286: third-party skills Hermes reads through a link into the shared ~/.agents/skills.
//
// B-217 gave Hermes its own copy of every FAMILY skill, so a `skill_manage(patch)` stays in
// ~/.hermes/skills. Every other skill there is still a link into the shared store: measured
// 2026-10-28 on the operator machine, 360 such links (449 when the row was filed), so a
// Hermes self-patch to one of them changes the copy Kimi, Goose, Codex and the rest read.
// The hub does not take ownership of third-party skills. `hosts` reports the count and the
// exact remedy per source, and writes nothing. These fixtures run on a temporary HOME; the
// real ~/.hermes and ~/.agents are never read or written.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HL = require('../lib/hermeslinks.js');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
let checks = 0;
const failures = [];
function it(name, fn) { checks += 1; try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); } }
const made = [];
const tmp = () => { const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-hermeslinks-'))); made.push(d); return d; };

const SHARED = '/h/.agents/skills';
const link = (name, target, live = true) => ({ name, isSymlink: true, target, live, isDir: live });
const copy = (name) => ({ name, isSymlink: false, target: null, live: true, isDir: true });

// ---- the decision, pure ------------------------------------------------------------------

it('assess: family copies and links, third-party links into the shared store, the rest counted', () => {
  const a = HL.assess({
    familyIds: ['ux-flows', 'make-skill'],
    sharedRoot: SHARED,
    lock: { pdf: 'anthropics/skills', docx: 'anthropics/skills', remotion: 'remotion-dev/skills' },
    entries: [
      copy('ux-flows'), link('make-skill', `${SHARED}/make-skill`),
      link('pdf', `${SHARED}/pdf`), link('docx', `${SHARED}/docx`), link('remotion', `${SHARED}/remotion`),
      link('orphan', `${SHARED}/orphan`),
      link('wiki-update', '/pkg/obsidian_wiki/_data/skills/wiki-update'),
      link('gone', `${SHARED}/gone`, false),
      copy('own-skill'),
    ],
  });
  assert.deepStrictEqual(a.family, { copies: ['ux-flows'], links: ['make-skill'] });
  assert.deepStrictEqual(a.shared.map((s) => s.name), ['docx', 'orphan', 'pdf', 'remotion']);
  assert.deepStrictEqual(a.bySource, [
    { source: 'anthropics/skills', names: ['docx', 'pdf'] },
    { source: 'remotion-dev/skills', names: ['remotion'] },
  ]);
  assert.deepStrictEqual(a.unsourced, ['orphan']);
  assert.strictEqual(a.elsewhere, 1, 'a link outside the shared store is not the hub\'s to report as shared');
  assert.strictEqual(a.dangling, 1);
  assert.strictEqual(a.ownCopies, 1);
});

it('assess: a lexical target with `..` segments inside the shared store counts; a sibling prefix does not', () => {
  const a = HL.assess({ familyIds: [], sharedRoot: SHARED, lock: {},
    entries: [link('a', '/h/.hermes/skills/../../.agents/skills/a'), link('b', '/h/.agents/skills-old/b')] });
  assert.deepStrictEqual(a.shared.map((s) => s.name), ['a']);
  assert.strictEqual(a.elsewhere, 1);
});

it('report: per source one copy-pasteable command naming only the linked skills; nothing when nothing is linked', () => {
  const a = HL.assess({ familyIds: ['ux-flows'], sharedRoot: SHARED,
    lock: { pdf: 'anthropics/skills', "it's": 'o/r' },
    entries: [copy('ux-flows'), link('pdf', `${SHARED}/pdf`), link("it's", `${SHARED}/it's`)] });
  const lines = HL.report(a, { dir: '/h/.hermes/skills' });
  const text = lines.join('\n');
  assert.ok(text.includes('2 third-party skill(s) are links into the shared ~/.agents/skills'), text);
  assert.ok(lines.includes('    npx skills add anthropics/skills --skill pdf --agent hermes-agent --global --copy --yes   (1)'), text);
  assert.ok(lines.includes("    npx skills add o/r --skill 'it'\\''s' --agent hermes-agent --global --copy --yes   (1)"), text);
  assert.ok(/does not take over third-party skills/.test(text), text);
  const clean = HL.report(HL.assess({ familyIds: ['ux-flows'], sharedRoot: SHARED, lock: {}, entries: [copy('ux-flows')] }),
    { dir: '/h/.hermes/skills' }).join('\n');
  assert.ok(/no third-party skill is a link into ~\/\.agents\/skills/.test(clean), clean);
  assert.ok(!/npx skills add/.test(clean), clean);
});

it('report: family links (a bare `npx skills update` re-linked them) name `npx sshlg-skills update` as the remedy', () => {
  const a = HL.assess({ familyIds: ['ux-flows', 'make-skill'], sharedRoot: SHARED, lock: {},
    entries: [link('ux-flows', `${SHARED}/ux-flows`), copy('make-skill')] });
  const text = HL.report(a, { dir: '/h/.hermes/skills' }).join('\n');
  assert.ok(/1 family skill\(s\) are links again/.test(text), text);
  assert.ok(text.includes('npx --yes sshlg-skills@latest update'), text);
});

it('report: a linked skill with no source in the lock is named, with no invented command', () => {
  const a = HL.assess({ familyIds: [], sharedRoot: SHARED, lock: {}, entries: [link('orphan', `${SHARED}/orphan`)] });
  const text = HL.report(a, { dir: '/h/.hermes/skills' }).join('\n');
  assert.ok(/no source recorded in ~\/\.agents\/\.skill-lock\.json.*orphan/.test(text), text);
  assert.ok(!/npx skills add/.test(text), text);
});

it('assess and report never throw on empty or malformed input', () => {
  for (const x of [undefined, null, {}, { entries: [null, 7, {}] }]) {
    const a = HL.assess(x);
    assert.ok(Array.isArray(HL.report(a, {})));
  }
});

// ---- `hosts` on a temporary HOME: reported, nothing written ------------------------------

/** Every path under `dir` with its kind, link target or content hash: what "unchanged" means. */
function tree(dir) {
  const out = [];
  const walk = (d) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n);
      const st = fs.lstatSync(p);
      if (st.isSymbolicLink()) out.push(`${p} -> ${fs.readlinkSync(p)}`);
      else if (st.isDirectory()) { out.push(`${p}/`); walk(p); }
      else out.push(`${p} ${crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}`);
    }
  };
  walk(dir);
  return out;
}

function machine() {
  const base = tmp();
  const home = path.join(base, 'home');
  const shared = path.join(home, '.agents', 'skills');
  const hermes = path.join(home, '.hermes', 'skills');
  for (const n of ['pdf', 'docx', 'remotion', 'ux-flows']) {
    fs.mkdirSync(path.join(shared, n), { recursive: true });
    fs.writeFileSync(path.join(shared, n, 'SKILL.md'), `---\nname: ${n}\n---\n`);
  }
  fs.mkdirSync(path.join(hermes, 'ux-flows'), { recursive: true });
  fs.writeFileSync(path.join(hermes, 'ux-flows', 'SKILL.md'), '---\nname: ux-flows\n---\n');
  for (const n of ['pdf', 'docx', 'remotion']) fs.symlinkSync(`../../.agents/skills/${n}`, path.join(hermes, n));
  fs.writeFileSync(path.join(home, '.agents', '.skill-lock.json'), JSON.stringify({ version: 3, skills: {
    pdf: { source: 'anthropics/skills' }, docx: { source: 'anthropics/skills' }, remotion: { source: 'remotion-dev/skills' },
    'ux-flows': { source: 'ssheleg/super-ux' } } }));
  return { base, home };
}

function hosts(base, home, extra) {
  const env = Object.assign({}, process.env, { HOME: home, SSHLG_SKILLS_NO_UPDATE_CHECK: '1' }, extra || {});
  delete env.CLAUDE_CONFIG_DIR; delete env.HERMES_HOME; delete env.XDG_STATE_HOME;
  Object.assign(env, extra || {});
  const r = spawnSync(process.execPath, [BIN, 'hosts'], { cwd: base, env, encoding: 'utf8', timeout: 60000 });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

it('`hosts` reports the linked third-party skills per source and leaves ~/.hermes and ~/.agents byte for byte', () => {
  const { base, home } = machine();
  const before = tree(home);
  const r = hosts(base, home);
  assert.strictEqual(r.status, 0, r.out);
  assert.ok(r.out.includes('Hermes (B-286)'), r.out);
  assert.ok(r.out.includes('family skills: 1 own copies, 0 links'), r.out);
  assert.ok(r.out.includes('3 third-party skill(s) are links into the shared ~/.agents/skills'), r.out);
  assert.ok(r.out.includes('npx skills add anthropics/skills --skill docx pdf --agent hermes-agent --global --copy --yes   (2)'), r.out);
  assert.ok(r.out.includes('npx skills add remotion-dev/skills --skill remotion --agent hermes-agent --global --copy --yes   (1)'), r.out);
  assert.deepStrictEqual(tree(home), before, '`hosts` changed a file under the temporary HOME');
});

it('`hosts` honours HERMES_HOME and says so when Hermes is absent', () => {
  const { base, home } = machine();
  const moved = path.join(base, 'hermes-home');
  fs.renameSync(path.join(home, '.hermes'), moved);
  // The relative links pointed from the old place; from here they are absolute ones.
  for (const n of ['pdf', 'docx', 'remotion']) {
    fs.unlinkSync(path.join(moved, 'skills', n));
    fs.symlinkSync(path.join(home, '.agents', 'skills', n), path.join(moved, 'skills', n));
  }
  const r = hosts(base, home, { HERMES_HOME: moved });
  assert.ok(r.out.includes(`${path.join(moved, 'skills')}`) && r.out.includes('3 third-party skill(s)'), r.out);
  const none = hosts(base, home);
  assert.ok(/Hermes \(B-286\): absent/.test(none.out), none.out);
});

for (const d of made) fs.rmSync(d, { recursive: true, force: true });

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS: hermeslinks — ${checks} cases`);
