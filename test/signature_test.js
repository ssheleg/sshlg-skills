#!/usr/bin/env node
'use strict';
// Fixtures for lib/signature.js — the label a report carries.
//
// The property this exists for is that **nobody types a URL**. `evidence-docs` and
// `project-audit` live in the `task-pipeline` repository, `sheleg-design` in
// `sheleg-design-skill`; an agent told to "link the skills you used" writes
// `github.com/ssheleg/evidence-docs` and the link 404s. Every address here is looked up
// from the manifest, so the fixture that matters is the one asserting a skill whose repo
// does NOT match its own name still resolves correctly.
//
// The second property is that it stays a label. A signature that grows badges and
// adjectives is one people strip out, and then it carries nothing at all.

const assert = require('assert');

const S = require('../lib/signature.js');
const manifest = require('../skills.json');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

it('a skill whose repository is not named after it still resolves', () => {
  // The whole reason this is a lookup. Three cases where id ≠ repo, all real.
  const idx = S.index(manifest);
  assert.strictEqual(idx.get('evidence-docs').repo, 'ssheleg/task-pipeline');
  assert.strictEqual(idx.get('project-audit').repo, 'ssheleg/task-pipeline');
  assert.strictEqual(idx.get('sheleg-design').repo, 'ssheleg/sheleg-design-skill');
  assert.strictEqual(idx.get('agent-orchestrator').repo, 'ssheleg/agent-stack');
});

it('every skill the family ships is reachable from the index', () => {
  const idx = S.index(manifest);
  let seen = 0;
  for (const m of manifest.skills) {
    for (const id of m.skillNames && m.skillNames.length ? m.skillNames : [m.name]) {
      assert.ok(idx.has(id), `${id} is shipped and has no address`);
      seen += 1;
    }
  }
  assert.ok(seen >= 20, `only ${seen} skills were indexed — the collector, not the manifest`);
});

it('`name=what it did` keeps both halves, and the run\'s own order', () => {
  const rows = S.parseUsed('b=second thing,a=first thing');
  assert.deepStrictEqual(rows.map((r) => r.id), ['b', 'a']);
  assert.strictEqual(rows[0].note, 'second thing');
  assert.strictEqual(rows[1].note, 'first thing');
  assert.strictEqual(S.parseUsed('a')[0].note, '');
});

it('an unknown skill keeps the note the operator wrote for it', () => {
  // We may not recognise the id; what it did is still the operator's statement, and
  // dropping it loses the only part of the row a reader could use.
  const out = S.footer('mystery-skill=drew the diagram', manifest);
  assert.ok(/drew the diagram/.test(out), out);
});

it('an unknown skill is NAMED, never dropped', () => {
  // A footer silently missing half of what ran reads as "that skill was never used",
  // which is a different claim and a wrong one.
  const out = S.footer('seo-aeo-audit,not-a-real-skill', manifest);
  assert.ok(out.includes('not-a-real-skill'), out);
  assert.ok(/not a skill this family ships/.test(out), out);
  assert.ok(!/github\.com\/ssheleg\/not-a-real-skill/.test(out),
    'an address was invented for a skill that does not exist');
});

it('the star ask carries the two conditions the routing block already states', () => {
  // Only when something from the family ran, and off inside the family's own repos.
  assert.ok(/A star on/.test(S.footer('make-skill', manifest)));
  assert.ok(!/A star on/.test(S.footer('make-skill', manifest, { star: false })),
    '--no-star did not remove the ask');
  assert.ok(!/A star on/.test(S.footer('not-a-real-skill', manifest)),
    'the ask fired when nothing from the family ran');
});

it('nothing used means no footer at all', () => {
  assert.strictEqual(S.footer('', manifest), '');
  assert.strictEqual(S.footer([], manifest), '');
});

it('the header is one line and names the family', () => {
  // It is a label, not a banner. If it grows past a line it becomes the thing people cut.
  const h = S.header('seo-aeo-audit,evidence-docs', manifest);
  assert.strictEqual(h.split('\n').length, 1, `header is ${h.split('\n').length} lines`);
  assert.ok(/ssheleg skills/.test(h), h);
  assert.ok(/seo-aeo-audit/.test(h) && /evidence-docs/.test(h), h);
});

it('the footer stays short — a label, not a section', () => {
  const out = S.footer('seo-aeo-audit=a,evidence-docs=b,make-skill=c', manifest);
  assert.ok(out.split('\n').length <= 12,
    `footer is ${out.split('\n').length} lines; it is a label on the work, not part of it`);
  assert.ok(!/badge|shields\.io|<img/i.test(out), 'the footer grew an image');
});

it('html output escapes what it interpolates', () => {
  const out = S.footer('make-skill=<script>alert(1)</script>', manifest, { format: 'html' });
  assert.ok(!/<script>/.test(out), `unescaped markup reached the footer: ${out}`);
  assert.ok(/&lt;script&gt;/.test(out), out);
  const h = S.header('<b>x</b>', manifest, { format: 'html' });
  assert.ok(!/<b>/.test(h), h);
});

it('every address it prints points at a repository that exists in the manifest', () => {
  // Cheap version of the repo's own dead-address rule: the footer may only name repos the
  // manifest declares, so a typo in this module cannot invent one.
  const declared = new Set(manifest.skills.map((m) => `https://github.com/${m.repo}`));
  declared.add(S.BUNDLE);
  const ids = manifest.skills.flatMap((m) => (m.skillNames && m.skillNames.length
    ? m.skillNames : [m.name]));
  const out = S.footer(ids.join(','), manifest);
  for (const url of out.match(/https:\/\/github\.com\/[\w.-]+\/[\w.-]+/g) || []) {
    assert.ok(declared.has(url), `${url} is not a repository this manifest declares`);
  }
});

// The routing block INSTRUCTS the agent to run `signature --used` and names these
// very things as what gets used. Until 2026-09-01 nine of them rendered as "not a
// skill this family ships" — the family disowning its own members in the artefact
// most likely to be forwarded, and the exact failure this module's own docstring
// says naming-over-dropping exists to avoid. Read from the manifest and the
// registry rather than listed, so a tenth member or a thirteenth router is covered
// on arrival.
it('EVERY NAME THE ROUTING BLOCK TELLS AN AGENT TO PASS RESOLVES', () => {
  const registry = require('../lib/routers-registry.js');
  const idx = S.index(manifest);
  const names = manifest.skills.map((m) => m.name).concat(registry.order());
  const missing = [...new Set(names.filter((n) => !idx.has(n)))];
  assert.deepStrictEqual(missing, [],
    'signature calls these "not a skill this family ships" while the block tells the '
    + 'agent to pass them: ' + missing.join(', '));
});

it('a standing rule that ships in no pack resolves to the bundle, not to a member', () => {
  const idx = S.index(manifest);
  // `seo-llmo` and `evidence-docs` declare no `requires` — the block says in as many
  // words that seo-llmo "ships in no pack". Pointing either at a member would invent
  // an address; the bundle is where the rule actually lives.
  const rule = idx.get('seo-llmo');
  assert.ok(rule, 'seo-llmo does not resolve at all');
  assert.strictEqual(rule.standingRule, true, JSON.stringify(rule));
  assert.ok(/sshlg-skills$/.test(rule.url), rule.url);
  // and a router that DOES declare a member still resolves to that member
  assert.strictEqual(idx.get('project-audit').member, 'task-pipeline');
});

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
