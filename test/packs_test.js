#!/usr/bin/env node
'use strict';
// Fixtures for lib/packs.js — the curated recommendations, and what they may not become.
//
// The property under test is not the contents of the pack; those are a judgement and
// will change. It is that a pack CANNOT SHIP A DEAD END: every entry carries an address
// and a command, the command is not one of the two shapes measured dead in the wild, a
// declined row cannot also tell you how to install the thing it declined, and the output
// never presents itself as a mandate.
//
// The shipped pack is run through the same refusals as the fixtures, because a rule that
// only holds for test data is a rule about test data.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const P = require('../lib/packs.js');
const C = require('../lib/conflicts.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const LANES = [
  { id: 'style', asks: 'which direction', owner: 'sheleg-design' },
  // An unowned lane must declare BOTH a default and a refusal phrase — the demo pack
  // obeys the same rule the shipped one does, or the rule is about test data.
  { id: 'a11y', asks: 'can it be used', owner: null, fallback: 'alpha', refusal: 'no a11y' },
];

function pack(over) {
  // The a11y lane's fallback is derived from the pack's own entries rather than
  // hardcoded: several cases below replace `entries` wholesale, and a fixture whose
  // scaffolding fails the rule under test tells you nothing about the rule.
  const built = Object.assign({
    id: 'demo',
    role: 'a demonstration pack',
    lanes: LANES,
    modes: [['new design', 'style first']],
    entries: [{
      id: 'alpha',
      provides: ['alpha'],
      lane: 'style',
      source: 'owner/alpha',
      install: ['claude plugin install alpha@alpha'],
      why: 'it does the thing',
    }],
    declined: [],
  }, over || {});
  if (!over || !over.lanes) {
    const first = (built.entries[0] || {}).id;
    built.lanes = built.lanes.map((l) => (l.owner || !first ? l : Object.assign({}, l, { fallback: first })));
  }
  return built;
}

/* -- structure ---------------------------------------------------------- */

it('a valid pack passes', () => {
  assert.ok(P.assertPack(pack()));
});

it('an entry with no install command is refused — a note is not a recommendation', () => {
  assert.throws(() => P.assertPack(pack({
    entries: [{ id: 'a', provides: ['a'], lane: 'style', source: 'o/a', why: 'w' }],
  })), /needs an install command/);
});

it('an entry with no source is refused — an address is what --check resolves', () => {
  assert.throws(() => P.assertPack(pack({
    entries: [{ id: 'a', provides: ['a'], lane: 'style', install: ['x'], why: 'w' }],
  })), /needs a source/);
});

it('an entry with no `provides` is refused — nothing could decide presence', () => {
  assert.throws(() => P.assertPack(pack({
    entries: [{ id: 'a', provides: [], lane: 'style', source: 'o/a', install: ['x'], why: 'w' }],
  })), /provides/);
});

it('an entry with no `why` is refused — a list of names is not a recommendation', () => {
  assert.throws(() => P.assertPack(pack({
    entries: [{ id: 'a', provides: ['a'], lane: 'style', source: 'o/a', install: ['x'] }],
  })), /needs a `why`/);
});

it('an undeclared lane is refused — a lane is the question, not a free-text tag', () => {
  assert.throws(() => P.assertPack(pack({
    entries: [{ id: 'a', provides: ['a'], lane: 'vibes', source: 'o/a', install: ['x'], why: 'w' }],
  })), /is not declared/);
});

it('a duplicate id is refused — presence would be decided twice and could disagree', () => {
  const e = { id: 'a', provides: ['a'], lane: 'style', source: 'o/a', install: ['x'], why: 'w' };
  assert.throws(() => P.assertPack(pack({ entries: [e, Object.assign({}, e)] })), /duplicate id/);
});

it('a pack with no lanes is refused — a flat list answers no question', () => {
  assert.throws(() => P.assertPack(pack({ lanes: [] })), /needs lanes/);
});

it('an unowned lane with no stated default is refused', () => {
  // Naming a gap and stopping there was measured failing: a run read `a11y GAP` in
  // the pack's own output and shipped two public pages without opening the lane.
  assert.throws(() => P.assertPack(pack({
    lanes: [{ id: 'style', asks: 'x', owner: 'sheleg-design' },
            { id: 'a11y', asks: 'y', owner: null, refusal: 'no a11y' }],
  })), /needs a `fallback`/);
});

it('an unowned lane with no refusal phrase is refused', () => {
  // Every owned route in this family has one, so declining it is an act. Without it,
  // skipping the lane is indistinguishable from never knowing it existed.
  assert.throws(() => P.assertPack(pack({
    lanes: [{ id: 'style', asks: 'x', owner: 'sheleg-design' },
            { id: 'a11y', asks: 'y', owner: null, fallback: 'alpha' }],
  })), /needs a `refusal`/);
});

it('a fallback that is not an entry is refused — its install command could not print', () => {
  assert.throws(() => P.assertPack(pack({
    lanes: [{ id: 'style', asks: 'x', owner: 'sheleg-design' },
            { id: 'a11y', asks: 'y', owner: null, fallback: 'nowhere', refusal: 'no a11y' }],
  })), /is not an entry in this pack/);
});

it('the report prints a default and a refusal phrase for every unowned lane', () => {
  const out = P.report(pack(), [], {});
  assert.ok(/lanes nobody owns/.test(out));
  assert.ok(out.includes('default: alpha'), 'the default is not named');
  assert.ok(out.includes('"no a11y"'), 'the refusal phrase is not printed');
});

it('every unowned lane in the SHIPPED pack carries both', () => {
  for (const p of Object.values(P.PACKS)) {
    for (const l of p.lanes.filter((x) => !x.owner)) {
      assert.ok(l.fallback && l.refusal, `${p.id}/${l.id} is a gap with no way to act on it`);
    }
  }
});

/* -- the dead-install refusals, each measured in the wild ---------------- */

it('`claude plugin add` is refused — it is not a subcommand', () => {
  // Measured 2026-09-03: `claude plugin add` → `error: unknown command 'add'`, printed
  // from a process that exits 0. A published article carries it as an install line.
  assert.throws(() => P.assertPack(pack({
    entries: [{
      id: 'a', provides: ['a'], lane: 'style', source: 'o/a', why: 'w',
      install: ['claude plugin add anthropic/frontend-design'],
    }],
  })), /not a subcommand/);
});

it('an install that copies into ~/.claude/skills is refused — that is the shadow', () => {
  // The other line measured in the wild the same day. A plain copy under
  // ~/.claude/skills shadows a plugin of the same name and serves its frozen version
  // for ever, which is the failure lib/shadow.js exists to find.
  assert.throws(() => P.assertPack(pack({
    entries: [{
      id: 'a', provides: ['a'], lane: 'style', source: 'o/a', why: 'w',
      install: ['git clone https://github.com/x/y.git && cp -r y/plugins/z/skills/* ~/.claude/skills'],
    }],
  })), /shadows a plugin/);
});

it('the shadow refusal is not defeated by $HOME or ${HOME}', () => {
  for (const home of ['$HOME', '${HOME}']) {
    assert.throws(() => P.assertPack(pack({
      entries: [{
        id: 'a', provides: ['a'], lane: 'style', source: 'o/a', why: 'w',
        install: [`cp -R src/* ${home}/.claude/skills`],
      }],
    })), /shadows a plugin/, `${home} walked past the refusal`);
  }
});

it('copying OUT of ~/.claude/skills is not refused — the destination is what harms', () => {
  // Widening a refusal buys false positives with the operator's own attention, so both
  // directions are asserted. The first draft keyed on the flag cluster and let `cp -R`
  // through; keying on the destination is what closed it, and this is the other half.
  assert.doesNotThrow(() => P.assertPack(pack({
    entries: [{
      id: 'a', provides: ['a'], lane: 'style', source: 'o/a', why: 'w',
      install: ['cp -r ~/.claude/skills/mine /tmp/backup'],
    }],
  })), 'refused a command that copies out of the skills directory');
});

it('a bare `skills update <name>` is refused — it re-creates the plain copy', () => {
  assert.throws(() => P.assertPack(pack({
    entries: [{
      id: 'a', provides: ['a'], lane: 'style', source: 'o/a', why: 'w',
      install: ['npx skills update sheleg-design'],
    }],
  })), /plain Claude copy/);
});

it('a legitimate install command is NOT refused — the guard has to stay narrow', () => {
  // Widening a refusal buys false positives, and a pack that cannot express the normal
  // install is worse than one that permits an odd command.
  for (const cmd of [
    'claude plugin marketplace add AccessLint/skills',
    'claude plugin install accesslint@accesslint',
    'npx --yes skills add anthropics/skills --skill frontend-design',
    'npx --yes sshlg-skills@latest update',
  ]) {
    assert.doesNotThrow(() => P.assertPack(pack({
      entries: [{ id: 'a', provides: ['a'], lane: 'style', source: 'o/a', why: 'w', install: [cmd] }],
    })), `refused a legitimate command: ${cmd}`);
  }
});

/* -- declined rows ------------------------------------------------------ */

it('a declined row that carries an install command is refused', () => {
  assert.throws(() => P.assertPack(pack({
    declined: [{ id: 'x', source: 'o/x', reason: 'r', install: ['claude plugin install x@x'] }],
  })), /cannot decline something and tell you how to install it/);
});

it('a declined row with no reason is refused — a decline with no measurement is an opinion', () => {
  assert.throws(() => P.assertPack(pack({
    declined: [{ id: 'x', source: 'o/x' }],
  })), /opinion/);
});

it('a declined row may have no address at all, and says so', () => {
  const p = pack({ declined: [{ id: 'ghost', source: null, reason: 'no repository is given anywhere' }] });
  assert.ok(P.assertPack(p));
  const out = P.report(p, [], {});
  assert.ok(out.includes('(no address given)'), 'a sourceless decline printed as if it had an address');
});

/* -- presence ----------------------------------------------------------- */

const INSTALLED = [
  { plugin: '(plain ~/.claude/skills)', id: 'alpha', description: '' },
  { plugin: 'vendor@market', id: 'zeta', description: '' },
];

it('presence matches on ANY of the provides ids', () => {
  const p = pack({
    entries: [{ id: 'multi', provides: ['nope', 'zeta'], lane: 'style', source: 'o/m', install: ['x'], why: 'w' }],
  });
  const { present, missing } = P.presence(p, INSTALLED);
  assert.strictEqual(missing.length, 0);
  assert.strictEqual(present[0].via, 'zeta');
  assert.deepStrictEqual(present[0].providers, ['vendor@market']);
});

it('an entry nothing provides is missing, and its command is printed', () => {
  const p = pack({
    entries: [{
      id: 'gone', provides: ['nowhere'], lane: 'a11y', source: 'o/g', why: 'w',
      install: ['claude plugin install gone@gone'],
    }],
  });
  const out = P.report(p, INSTALLED, {});
  assert.ok(out.includes('missing (1)'), out.split('\n').slice(0, 3).join(' | '));
  assert.ok(out.includes('$ claude plugin install gone@gone'), 'the install command was not printed');
});

it('presence on an empty machine reports everything missing rather than throwing', () => {
  const out = P.report(pack(), [], {});
  assert.ok(out.includes('present (0)'));
  assert.ok(out.includes('missing (1)'));
});

it('a machine that has everything says so instead of printing an empty section', () => {
  const out = P.report(pack(), INSTALLED, {});
  assert.ok(out.includes('none — everything this pack declares is installed here.'),
    'the empty missing section printed nothing, which reads as an error');
});

/* -- the report's own honesty ------------------------------------------- */

it('the report always says it is a recommendation, not a mandate', () => {
  // Not switchable, and asserted on the parsed sentence rather than on a keyword: a
  // curated list printed by the same tool that ships the routers reads as an order
  // unless it says otherwise.
  const out = P.report(pack(), INSTALLED, {});
  assert.ok(/RECOMMENDATIONS measured against this machine, not a mandate/.test(out));
  assert.ok(/never a second entry point/.test(out));
});

it('a lane with no owner prints GAP rather than an empty cell', () => {
  const out = P.report(pack(), [], {});
  const row = out.split('\n').find((l) => l.trim().startsWith('a11y'));
  assert.ok(row && row.includes('GAP'), `the ownerless lane did not announce itself: ${row}`);
});

it('every lane is printed, including the ones no entry serves', () => {
  const out = P.report(pack(), [], {});
  for (const l of LANES) {
    assert.ok(out.split('\n').some((line) => line.trim().startsWith(l.id)), `lane ${l.id} missing`);
  }
});

it('--lane narrows the entries and drops the declined section', () => {
  const p = pack({ declined: [{ id: 'x', source: 'o/x', reason: 'measured and refused' }] });
  const all = P.report(p, [], {});
  const one = P.report(p, [], { lane: 'a11y' });
  assert.ok(all.includes('considered and NOT recommended'));
  assert.ok(!one.includes('considered and NOT recommended'),
    'a narrowed view still printed a decline that has nothing to do with the lane');
});

it('a long id does not run into the next column', () => {
  // `pad` only ever grows a field. The first draft hardcoded 28 and
  // `vercel-react-view-transitions` (29 characters) printed as
  // `vercel-react-view-transitionsmotion`. Widths are measured from the rows now.
  const long = 'a-very-long-skill-identifier-indeed';
  const p = pack({
    entries: [{ id: long, provides: ['alpha'], lane: 'style', source: 'o/a', install: ['x'], why: 'w' }],
  });
  const row = P.report(p, INSTALLED, {}).split('\n').find((l) => l.includes(long));
  assert.ok(/ {2}style/.test(row), `columns collided: ${JSON.stringify(row)}`);
});

it('a wrapped why does not repeat its own label on continuation lines', () => {
  const p = pack({
    entries: [{
      id: 'a', provides: ['nope'], lane: 'style', source: 'o/a', install: ['x'],
      why: 'word '.repeat(60).trim(),
    }],
  });
  const whys = P.report(p, [], {}).split('\n').filter((l) => l.includes('why:'));
  assert.strictEqual(whys.length, 1, `the label was repeated on ${whys.length} lines`);
});

/* -- --check renders silence as silence ---------------------------------- */

it('an unreachable address is never reported as gone', () => {
  // Standing instruction #4 and #11: the unauthenticated GitHub API rate-limits to 60
  // an hour and then answers 403 with a JSON body — which a naive reader turns into
  // "missing" for every row at once. It did, while this pack was being built: five
  // candidates and the known-clean control all reported 404 in one sweep.
  const r = P.checkReport([{ id: 'a', source: 'o/a', error: 'rate limited' }]);
  assert.ok(r.text.includes('unreachable (rate limited)'));
  assert.ok(!/GONE/.test(r.text), 'silence was rendered as absence');
  assert.ok(r.text.includes('Every declared address resolves to itself.'),
    'an unreachable row was counted as a defect, which would make an offline run red');
  assert.strictEqual(r.bad, 0, 'an unreachable row counted as a defect');
  assert.strictEqual(P.checkExit(r), 0, 'an offline run would turn a build red');
});

it('a moved address is reported as MOVED and counted as needing an edit', () => {
  const r = P.checkReport([{ id: 'a', source: 'accesslint/claude-marketplace', movedTo: 'AccessLint/skills' }]);
  assert.ok(r.text.includes('MOVED → AccessLint/skills'));
  assert.ok(r.text.includes('1 address(es) need editing'));
  // 2, never 1: an address that moved upstream is not this commit's defect. Watched
  // firing against a real planted rename — `accesslint/claude-marketplace` still
  // redirects, so this is the live case rather than a synthetic one.
  assert.strictEqual(P.checkExit(r), 2, 'a moved address did not raise the warning code');
});

it('an archived source counts as needing an edit', () => {
  const r = P.checkReport([{ id: 'a', source: 'o/a', archived: true }]);
  assert.ok(r.text.includes('archived'));
  assert.ok(r.text.includes('1 address(es) need editing'));
  assert.strictEqual(P.checkExit(r), 2);
});


it('--check never returns 1, on any input', () => {
  // The whole design of the code: 1 blocks a build. A rotted address is the EXPECTED
  // state — the pack was built from articles where three of five had moved — so a
  // blocking code would make somebody else's rename this repository's red build, and
  // the lesson `check_pins.py` already paid for is that such a gate gets re-run rather
  // than read.
  for (const rows of [
    [],
    [{ id: 'a', source: 'o/a' }],
    [{ id: 'a', source: 'o/a', movedTo: 'o/b' }],
    [{ id: 'a', source: 'o/a', status: 404 }],
    [{ id: 'a', source: 'o/a', archived: true }],
    [{ id: 'a', source: 'o/a', error: 'offline' }],
  ]) {
    const code = P.checkExit(P.checkReport(rows));
    assert.notStrictEqual(code, 1, `returned 1 for ${JSON.stringify(rows)}`);
    assert.ok(code === 0 || code === 2, `unexpected code ${code}`);
  }
});

it('an empty check reports clean rather than throwing', () => {
  const r = P.checkReport([]);
  assert.ok(r.text.includes('Every declared address resolves to itself.'));
  assert.strictEqual(P.checkExit(r), 0);
});

/* -- the shipped pack lives under the same rules ------------------------- */

it('every shipped pack passes its own refusals', () => {
  for (const p of Object.values(P.PACKS)) P.assertPack(p);
});

it('every shipped entry sits in a lane the pack declares, and no lane is orphaned', () => {
  for (const p of Object.values(P.PACKS)) {
    const laneIds = new Set(p.lanes.map((l) => l.id));
    for (const e of p.entries) assert.ok(laneIds.has(e.lane), `${e.id}: lane ${e.lane}`);
  }
});

it('the a11y lane is ownerless, and that is the finding rather than an omission', () => {
  // If a router ever takes accessibility, this fixture is the thing that says so out
  // loud instead of the lane quietly changing shape.
  const a11y = P.PACKS.design.lanes.find((l) => l.id === 'a11y');
  assert.strictEqual(a11y.owner, null,
    'a11y gained an owner — update the pack, the board row and this fixture together');
});

it('the walk is conflicts.js\'s, not a second copy of it', () => {
  assert.strictEqual(P.readSkills, C.readSkills,
    'packs exports a different reader than conflicts — that is a second home for one fact');
});

it('the module never reaches the filesystem', () => {
  // Pure, like inventory.js and routers.js. The one impure call is the imported walk.
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'packs.js'), 'utf8');
  const code = src.split('\n').filter((l) => !/^\s*\*/.test(l) && !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/require\(['"]fs['"]\)/.test(code), 'packs.js requires fs');
  assert.ok(!/require\(['"]child_process['"]\)/.test(code), 'packs.js spawns');
});

it('the command prints and never installs — there is no write path to find', () => {
  // The refusal lib/updatemodel.js records: settings.json and known_marketplaces.json
  // belong to the operator. If an --install flag is ever added, this fails first.
  const bin = fs.readFileSync(path.join(__dirname, '..', 'bin', 'sshlg-skills.js'), 'utf8');
  const at = bin.indexOf('function cmdPack(');
  assert.ok(at !== -1, 'cmdPack is gone');
  const body = bin.slice(at, bin.indexOf('\nfunction ', at + 10));
  assert.ok(!/--install/.test(body), 'cmdPack grew an --install flag');
  assert.ok(!/writeFileSync|plugin\s+install/.test(body),
    'cmdPack writes or spawns an install — the pack reports and never writes');
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
