#!/usr/bin/env node
'use strict';
// Fixtures for lib/brief.js and scripts/site.js#skillBrief — the capability
// sentence a pack page renders for each skill it ships.
//
// Why it is gated this hard. The text is authored by nine repositories over a year and
// nothing forces it into one shape; the transform runs at build time and its output is
// published prose on the family's most-read pages. The first pass shipped half a
// Russian keyword list and a stray quote mark into `/skills/seo-aeo-audit/`, because
// `"why doesn't ChatGPT cite us"` is a double-quoted trigger holding an apostrophe and
// the matcher ended it at `doesn`. Mangled prose on a public page is worse than the
// short page it replaced, so the shape of every rendered brief is asserted rather than
// eyeballed, and a description the transform cannot handle fails the build.

const assert = require('assert');

const { capabilityBrief } = require('../lib/brief.js');
const site = require('../scripts/site.js');
const data = require('../skills.json');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

it('a labelled trigger list goes, including the unquoted items trailing it', () => {
  // `starting any marketing surface` is a trigger with no quotes around it. Stopping at
  // the last quote mark strands it as a sentence fragment in the middle of the page.
  const out = capabilityBrief(
    'Use when defining how a product speaks — tone of voice, locales. Triggers - '
    + '"tone of voice" / "тон оф войс", "brand voice", starting any marketing surface, '
    + 'onboarding a product into docs/brand/. For writing the actual text, see copywriting.',
  );
  assert.ok(!/tone of voice" \//.test(out), out);
  assert.ok(!/marketing surface/.test(out), 'an unquoted trailing trigger survived\n' + out);
  assert.ok(/^Use when defining how a product speaks/.test(out), out);
  assert.ok(/see copywriting\.$/.test(out), 'the sentence after the list was eaten\n' + out);
});

it('an unlabelled trigger list goes and its clause is closed up', () => {
  // Several descriptions never write the word "Triggers" — the quoted list just follows
  // a dash mid-sentence. Removing it leaves the dash on both sides of nothing.
  const out = capabilityBrief(
    'Use when creating or publishing agent skills and Claude Code plugins - "make a '
    + 'skill" / "сделай скилл", "wrap it in a plugin" - or when a skill must reach an '
    + 'MCP server. NOT for a version bump.',
  );
  assert.ok(!/["“”]/.test(out), out);
  assert.ok(!/\s[-–—]\s*[.,;:]/.test(out), 'a dangling dash was left behind\n' + out);
  assert.ok(/plugins, or when a skill must reach an MCP server\./.test(out), out);
  assert.ok(/NOT for a version bump\.$/.test(out), out);
});

it('a double-quoted trigger holding an apostrophe is one phrase, not two', () => {
  // The regression that shipped. A class of every quote mark ends the phrase at the
  // apostrophe, and everything after it — including the next eleven triggers — is read
  // as prose and published.
  const out = capabilityBrief(
    'Use when auditing a website - "why doesn\'t ChatGPT cite us" / "почему нас не '
    + 'цитирует ChatGPT", "indexing issues" / "проверь индексацию". Runs ten tracks.',
  );
  assert.ok(!/["“”]/.test(out), 'trigger residue reached the page\n' + out);
  assert.ok(!/ChatGPT cite us|цитирует|индексацию/.test(out), out);
  assert.strictEqual(out, 'Use when auditing a website. Runs ten tracks.');
});

it('an apostrophe in ordinary prose is not read as a quote', () => {
  // The other half of the same rule. `Stripe's … don't` are two apostrophes with prose
  // between them; treating them as a delimited phrase deletes the sentence.
  const out = capabilityBrief(
    "Use when connecting a product to Stripe. Covers Stripe's toolchain and what it "
    + "doesn't retry, and the operator's own database.",
  );
  assert.ok(/Stripe's toolchain/.test(out), 'prose between two apostrophes was cut\n' + out);
  assert.ok(/operator's own database/.test(out), out);
});

it('nothing in, nothing out — and no invented full stop', () => {
  assert.strictEqual(capabilityBrief(''), '');
  assert.strictEqual(capabilityBrief(null), '');
  assert.strictEqual(capabilityBrief(undefined), '');
});

it('every brief the family renders is publishable prose', () => {
  // The assertion that matters: this runs over what actually ships, so a member that
  // rewords its description into a shape the transform mishandles fails here rather
  // than on the page.
  let seen = 0;
  for (const m of data.skills) {
    for (const name of m.skillNames || []) {
      const b = site.skillBrief(m, name);
      const where = `${m.name}/${name}`;
      assert.ok(!/["“”‘’]/.test(b), `${where}: quote residue — ${b}`);
      assert.ok(!/\s[-–—]\s*[.,;:]/.test(b), `${where}: dangling connective — ${b}`);
      assert.ok(!/[.,;:]{2,}/.test(b), `${where}: doubled punctuation — ${b}`);
      assert.ok(/^[A-ZА-Я]/.test(b), `${where}: does not start a sentence — ${b}`);
      assert.ok(/[.!?]$/.test(b), `${where}: does not end one — ${b}`);
      assert.ok(b.split(/\s+/).length >= 12,
        `${where}: ${b.split(/\s+/).length} words is a label, not a description — ${b}`);
      seen += 1;
    }
  }
  // A collector that finds nothing passes every assertion above it.
  assert.ok(seen >= 20, `only ${seen} briefs were read — the collector, not the pages`);
});

it('a skill whose front matter declares no description fails the build', () => {
  // The same rule as entryPath: a heading with nothing under it is the defect, and a
  // page that renders one is worse than a build that stopped.
  const m = data.skills.find((s) => (s.skillNames || []).length);
  assert.throws(() => site.skillBrief(m, 'no-such-entry-point'),
    /no plugins\/\*\/skills\/no-such-entry-point\/SKILL\.md exists/,
    'a name with no SKILL.md behind it rendered a brief anyway');
});

it('a block-scalar description is read, not the folding marker', () => {
  // Seven of the nine packs write `description: >-`. A reader that takes the rest of
  // the line returns `>-`, which looks like the skills have no descriptions rather
  // than like a broken parser — the first pass at this did exactly that.
  const packs = data.skills.filter((m) => (m.skillNames || []).length);
  const briefs = packs.flatMap((m) => (m.skillNames || []).map((n) => site.skillBrief(m, n)));
  assert.ok(briefs.every((b) => !/^[>|][-+]?$/.test(b.trim())),
    'a folding marker was rendered as the description');
  assert.ok(briefs.some((b) => b.split(/\s+/).length > 60),
    'no long description survived — the block-scalar arm never ran');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
