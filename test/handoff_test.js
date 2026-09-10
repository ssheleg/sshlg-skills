'use strict';
/**
 * The inbound-work surface, and the doctrine that makes it usable.
 *
 * The surface is worth nothing without a stated SHAPE — a receiving agent cannot
 * act on "something is wrong somewhere" — so the document is checked here too:
 * both roles present, and the five parts a handoff owes actually enumerated.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const H = require('../lib/handoff.js');

let n = 0;
const it = (name, fn) => { fn(); n += 1; console.log(`  ok  ${name}`); };

it('the handoff LABEL sorts inbound work from ordinary open work', () => {
  const { handoffs, other } = H.classify([
    { kind: 'issue', number: 1, title: 'a', labels: [{ name: 'handoff' }] },
    { kind: 'pr', number: 2, title: 'b', labels: ['handoff'] },
    { kind: 'issue', number: 3, title: 'c', labels: [{ name: 'bug' }] },
    { kind: 'pr', number: 4, title: 'd', labels: [] },
  ]);
  assert.deepStrictEqual(handoffs.map((r) => r.number), [1, 2]);
  assert.deepStrictEqual(other.map((r) => r.number), [3, 4]);
});

it('the label is matched case-insensitively — a human types it by hand', () => {
  const { handoffs } = H.classify([{ kind: 'issue', number: 1, title: 'a', labels: ['Handoff'] }]);
  assert.strictEqual(handoffs.length, 1);
});

it('a malformed row is DROPPED, never guessed at — a wrong count is a lie', () => {
  const { handoffs, other } = H.classify([
    { kind: 'issue', number: 0, title: 'zero' },
    { kind: 'issue', number: 'x', title: 'nan' },
    { kind: 'nonsense', number: 5, title: 'bad kind' },
    { number: 6, title: 'no kind' },
    null, undefined, 'string', 7,
  ]);
  assert.deepStrictEqual(handoffs, []);
  assert.deepStrictEqual(other, []);
});

it('an issue reads `#n` and a pull request `!n` — one glance tells them apart', () => {
  assert.strictEqual(H.ref({ kind: 'issue', number: 12 }), '#12');
  assert.strictEqual(H.ref({ kind: 'pr', number: 12 }), '!12');
});

it('handoffs are NAMED and ordinary work is only counted', () => {
  const l = H.line({
    handoffs: [{ kind: 'issue', number: 124, title: 'routegate asks inside bypass', labels: [] }],
    other: [1, 2, 3],
  });
  assert.match(l, /#124 routegate asks inside bypass/, 'a count is not actionable');
  assert.match(l, /3 other open items/);
  assert.ok(!/routegate.*routegate/.test(l), 'the title was repeated');
});

it('more than three handoffs are summarised, not dumped into the session', () => {
  const many = [1, 2, 3, 4, 5].map((i) => ({ kind: 'issue', number: i, title: `t${i}`, labels: [] }));
  const l = H.line({ handoffs: many, other: [] });
  assert.match(l, /\(\+2 more\)/);
  assert.ok(!/t4/.test(l) && !/t5/.test(l), 'the session budget is not a queue dump');
});

it('an empty queue says nothing at all', () => {
  assert.strictEqual(H.line({ handoffs: [], other: [] }), '');
  assert.strictEqual(H.line({}), '');
  assert.strictEqual(H.line(null), '');
});

it('a cache for ANOTHER repository is not an answer about this one', () => {
  // The bug a single global stamp would have: work in nine repositories, one of
  // them ever checked, and eight reported as quiet on its evidence.
  const now = 1_000_000_000;
  const cache = { repo: 'ssheleg/super-ux', at: now, handoffs: [{ kind: 'issue', number: 1, title: 'x', labels: [] }], other: 0 };
  assert.strictEqual(H.shouldProbe(cache, 'ssheleg/task-pipeline', now), true);
  const p = H.plan(cache, 'ssheleg/task-pipeline', now);
  assert.strictEqual(p.line, '', "another repository's queue was reported as this one's");
  assert.strictEqual(p.probe, true);
  // Same repository, fresh: report it and do not probe.
  const same = H.plan(cache, 'ssheleg/super-ux', now);
  assert.match(same.line, /#1 x/);
  assert.strictEqual(same.probe, false);
});

it('a stale or future stamp probes again', () => {
  const now = 1_000_000_000;
  const base = { repo: 'r', handoffs: [], other: 0 };
  assert.strictEqual(H.shouldProbe(Object.assign({}, base, { at: now - H.CHECK_INTERVAL_MS - 1 }), 'r', now), true);
  assert.strictEqual(H.shouldProbe(Object.assign({}, base, { at: now + 5000 }), 'r', now), true);
  assert.strictEqual(H.shouldProbe(Object.assign({}, base, { at: now - 5 }), 'r', now), false);
});

it('a remote URL becomes a slug, and a filesystem path does NOT', () => {
  assert.strictEqual(H.slug('git@github.com:ssheleg/super-ux.git'), 'ssheleg/super-ux');
  assert.strictEqual(H.slug('https://github.com/ssheleg/super-ux'), 'ssheleg/super-ux');
  assert.strictEqual(H.slug('ssh://git@github.com/ssheleg/super-ux.git'), 'ssheleg/super-ux');
  // `/local/path` parsed as `local/path` before this was tightened, which would
  // have sent the probe at a repository that does not exist.
  for (const bad of ['/local/path', '../relative', 'C:\\repos\\thing', '', null, 'nonsense']) {
    assert.strictEqual(H.slug(bad), null, `slug(${JSON.stringify(bad)})`);
  }
});

it('a failed probe records an empty list, which claims nothing', () => {
  const r = H.record('ssheleg/x', [], 42);
  assert.strictEqual(r.repo, 'ssheleg/x');
  assert.strictEqual(r.at, 42);
  assert.deepStrictEqual(r.handoffs, []);
  assert.strictEqual(r.other, 0);
  assert.strictEqual(H.plan(r, 'ssheleg/x', 43).line, '');
  assert.strictEqual(H.plan(r, 'ssheleg/x', 43).probe, false, 'a failure must back off, not retry');
});

// --- the doctrine, because a surface without a stated shape is unusable ------

it('THE DOCTRINE ADDRESSES BOTH ROLES, not just the writer', () => {
  // The whole finding: every sentence the family had on handoffs was written for
  // the agent that writes one. A document that regressed to that would put the
  // read side back where it was.
  const doc = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'working-rules', 'cross-repo-handoff.md'), 'utf8');
  assert.match(doc, /^## If you are WRITING one$/m, 'the writer section is gone');
  assert.match(doc, /^## If you are RECEIVING one$/m, 'the reader section is gone');
  // The five parts are a numbered enumeration, and the sentence says five.
  const numbered = (doc.match(/^\d\. \*\*/gm) || []).length;
  assert.strictEqual(numbered, 5, `the enumeration holds ${numbered} items`);
  // Prose needles read the WHITESPACE-NORMALISED text. The first draft of this
  // assertion matched the raw file and failed on "three days", because the
  // ~80-column wrap fell between the two words — a needle defeated by the
  // corpus's formatting rather than by its content, which this family has filed
  // against itself three times. Normalise once, then match.
  const flat = doc.replace(/\s+/g, ' ');
  assert.match(flat, /\*\*Five things a receiving agent cannot proceed without\*\*/,
    'the count is not stated beside the list it counts');
  assert.match(flat, /`handoff`/, 'the label the surface filters on is not named');
  assert.match(flat, /three days/, 'the measured cost of the gap is gone');
});

it('the doctrine names the label the code actually filters on', () => {
  // Two statements of one fact; they drifted in this family before.
  const doc = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'working-rules', 'cross-repo-handoff.md'), 'utf8')
    .replace(/\s+/g, ' ');
  assert.ok(doc.includes('`' + H.HANDOFF_LABEL + '`'),
    `the document does not name HANDOFF_LABEL (${H.HANDOFF_LABEL})`);
});

console.log(`\nPASS: inbound handoffs — ${n} case(s)`);
