'use strict';

/**
 * What this machine can actually reach, as an index rather than a dump.
 *
 * Why it exists. An agent picking its tools for a task was picking from memory, and the
 * memory was of the family — the nine packs whose routing block it had just read. On this
 * machine that is 28 of **490** reachable skills: 363 plain copies under `~/.claude/skills`
 * plus 129 from 21 enabled plugins. The other 462 are invisible to a router that only
 * knows its own roster, so a task that wanted `pdf`, `xlsx` or somebody else's Stripe skill
 * reached for a router instead, or for nothing.
 *
 * Why an index and not a list. Printing 490 descriptions costs more than the work it
 * informs. This groups by PROVIDER and prints counts, so the reading order is
 * provider → pack → skill and only the branch that matters is opened. That is the same
 * progressive disclosure the Agent Skills standard asks of a `SKILL.md`, applied to the
 * roster of skills itself.
 *
 * Why `--for` exists and what it is not. Given a task's words it ranks by how many of them
 * appear in a skill's own advertised description. That is a **shortlist, never a decision**:
 * the ranking is term overlap, it cannot tell `bond-relative-value` from a UX scenario just
 * because both say "scenario", and the same weakness is why `conflicts` reports candidates
 * rather than offenders. The agent chooses; this narrows what it chooses from.
 *
 * The walk is NOT reimplemented here. `conflicts.readSkills()` already enumerates enabled
 * plugins and plain copies, and a second copy of that walk is a second answer to "what is
 * installed" that agrees until somebody fixes one of them.
 */

const { readSkills } = require('./conflicts.js');

const PLAIN = /^\(plain /;

/** Split the roster into what the family ships and what it does not. */
function classify(skills, familyIds) {
  const family = new Set(familyIds || []);
  const mine = [];
  const providers = new Map();

  for (const s of skills || []) {
    if (family.has(s.id)) { mine.push(s); continue; }
    const key = s.plugin || '(unknown)';
    if (!providers.has(key)) providers.set(key, []);
    providers.get(key).push(s);
  }

  const foreign = [...providers.entries()]
    .map(([provider, list]) => ({
      provider,
      plain: PLAIN.test(provider),
      count: list.length,
      skills: list.sort((a, b) => a.id.localeCompare(b.id)),
    }))
    // Plain copies last: they are the channel most likely to be a stale duplicate,
    // and a reader scanning for a capability should meet packaged ones first.
    .sort((a, b) => (a.plain !== b.plain ? (a.plain ? 1 : -1) : b.count - a.count));

  return {
    family: mine.sort((a, b) => a.id.localeCompare(b.id)),
    foreign,
    total: (skills || []).length,
  };
}

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'with', 'is', 'it', 'this',
  'that', 'as', 'at', 'by', 'be', 'are', 'from', 'we', 'our', 'i', 'my', 'me', 'you',
  'и', 'в', 'на', 'с', 'по', 'для', 'что', 'как', 'мы', 'я', 'не', 'это',
]);

function terms(query) {
  return [...new Set(String(query || '').toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]{2,}/gu) || [])]
    .filter((t) => !STOP.has(t));
}

/**
 * Rank by how many of the task's words a skill's own description carries.
 * Ties break on the shorter description: a skill that says one thing and matches is a
 * better lead than a long one that mentions everything.
 */
const FLOOR = 2;

/**
 * How much a query word can possibly discriminate, measured against THIS corpus.
 *
 * A hand-kept stoplist was the obvious answer and is the wrong one: the words that
 * ruined the two queries in the report — `after`, `full`, `project`, `page`, `user` —
 * are not stopwords in English, they are stopwords **in a roster of skill
 * descriptions**, and which words those are is a fact about the machine's roster
 * rather than about the language. So it is counted rather than listed: a term present
 * in more than a tenth of the corpus separates nothing, whatever it means.
 *
 * The threshold is deliberately generous. At 520 skills a tenth is 52, and the words
 * it removed on the reported queries were carried by 150+ descriptions each.
 */
const SPREAD = 0.1;

/**
 * Below this the RATIO means nothing and the filter must not run.
 *
 * Found by a fixture, not by reasoning: over a six-skill corpus a single match is
 * 16.7%, so every term cleared the spread threshold and the shortlist emptied itself.
 * A ratio needs a denominator big enough for one item not to dominate it, and a
 * machine with a dozen skills has no noise problem for this to solve.
 */
const CORPUS_FLOOR = 50;

function discriminating(skills, words) {
  const n = (skills || []).length;
  if (n < CORPUS_FLOOR) return { keep: words, weak: [] };
  const keep = [];
  const weak = [];
  for (const w of words) {
    let hits = 0;
    for (const s of skills) {
      if (`${s.id} ${s.description || ''}`.toLowerCase().includes(w)) hits += 1;
    }
    (hits / n > SPREAD ? weak : keep).push(w);
  }
  return { keep, weak };
}

function rank(skills, query, limit, familyIds) {
  const asked = terms(query);
  if (!asked.length) return { rows: [], dropped: 0, floor: FLOOR, weak: [] };
  const { keep: words, weak } = discriminating(skills, asked);
  if (!words.length) return { rows: [], dropped: 0, floor: FLOOR, weak };
  const family = new Set(familyIds || []);
  const scored = [];
  let dropped = 0;
  for (const s of skills || []) {
    const hay = `${s.id} ${s.description || ''}`.toLowerCase();
    const hits = words.filter((w) => hay.includes(w));
    if (!hits.length) continue;
    // A single shared word is noise even after the weak ones are gone. One term is
    // the level at which any two English sentences overlap.
    if (hits.length < FLOOR) { dropped += 1; continue; }
    scored.push({ ...s, hits, score: hits.length, mine: family.has(s.id) });
  }
  scored.sort((a, b) => (b.score - a.score)
    // On an equal score the family's own skill goes first — it is the one whose
    // territory the block already claims, and burying it under a foreign skill that
    // tied on term count is how `make-skill` finished tenth on a query about
    // building a skill.
    || (Number(b.mine) - Number(a.mine))
    || ((a.description || '').length - (b.description || '').length)
    || a.id.localeCompare(b.id));
  const rows = scored.slice(0, limit || 12);
  return { rows, dropped, floor: FLOOR, weak };
}

function firstClause(text, cap) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  const cut = flat.slice(0, cap || 96);
  return cut.length < flat.length ? `${cut.replace(/[\s,;:—-]+$/, '')}…` : cut;
}

function pad(s, n) { return String(s).padEnd(n); }

/**
 * The index. `opts.for` adds the shortlist; `opts.expand` names providers to open fully.
 * Nothing is hidden silently — every group prints its count even when its members do not.
 */
function report(skills, familyIds, opts) {
  const o = opts || {};
  const { family, foreign, total } = classify(skills, familyIds);
  const lines = [];

  lines.push(`Toolkit — ${total} skills reachable on this machine`);
  lines.push('');

  lines.push(`  family (${family.length})`);
  for (const s of family) {
    lines.push(`    ${pad(s.id, 26)}${firstClause(s.description, 88)}`);
  }
  if (!family.length) lines.push('    none installed — `npx sshlg-skills install`');
  lines.push('');

  const foreignCount = foreign.reduce((n, g) => n + g.count, 0);
  lines.push(`  elsewhere (${foreignCount} across ${foreign.length} providers)`);
  const expand = new Set(o.expand || []);
  for (const g of foreign) {
    lines.push(`    ${pad(g.provider, 34)}${String(g.count).padStart(4)}`);
    if (expand.has(g.provider)) {
      for (const s of g.skills) lines.push(`        ${pad(s.id, 30)}${firstClause(s.description, 72)}`);
    }
  }
  lines.push('');
  lines.push('  A provider prints its count, never a sample — open one with');
  lines.push('  `--expand <provider>`. Nothing above is filtered out silently.');

  if (o.for) {
    const { rows, dropped, floor, weak } = rank(skills, o.for, o.limit, familyIds);
    lines.push('');
    lines.push(`  shortlist for "${firstClause(o.for, 60)}"`);
    // A FIXED-LENGTH answer makes a miss look like a hit: this printed seven rows
    // whether seven skills fitted or none did, so "nothing here matches" was not
    // expressible. It is now, and it is a useful answer.
    if (!rows.length) {
      lines.push(`    NOTHING on this machine matched ${floor} or more of those words.`);
      lines.push('    That is an answer, not an empty result: choose from the index');
      lines.push('    above, or bring a skill in — `npx sshlg-skills pack design` names');
      lines.push('    what a design task can reach and is not installed here.');
    }
    for (const s of rows) {
      const mine = s.mine ? '*' : ' ';
      lines.push(`   ${mine}${pad(s.id, 27)} ${String(s.score).padStart(2)}  ${pad(`[${s.hits.join(' ')}]`, 24)} ${firstClause(s.description, 50)}`);
    }
    lines.push('');
    if (weak && weak.length) {
      lines.push(`    Ignored as non-discriminating here: ${weak.join(', ')} — each appears`);
      lines.push(`    in more than a tenth of this machine's descriptions, so it separates`);
      lines.push('    nothing. Measured against this roster, not taken from a word list.');
    }
    if (dropped) {
      lines.push(`    ${dropped} more skill(s) shared exactly one of those words and are NOT`);
      lines.push('    shown — one term is the level at which any two English sentences');
      lines.push('    overlap. Nothing is hidden silently; that is the count.');
    }
    lines.push('    Ranked by term overlap with each skill\'s own description — a');
    lines.push('    SHORTLIST, not a decision. It cannot tell two senses of a word apart.');
    lines.push('    The number is the count of matched terms; `*` marks a family skill,');
    lines.push('    which wins a tie.');
  }

  return lines.join('\n');
}

module.exports = {
  classify, rank, terms, report, readSkills,
};
