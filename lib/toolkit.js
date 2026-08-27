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
function rank(skills, query, limit) {
  const words = terms(query);
  if (!words.length) return [];
  const scored = [];
  for (const s of skills || []) {
    const hay = `${s.id} ${s.description || ''}`.toLowerCase();
    const hits = words.filter((w) => hay.includes(w));
    if (!hits.length) continue;
    scored.push({ ...s, hits, score: hits.length });
  }
  scored.sort((a, b) => (b.score - a.score)
    || ((a.description || '').length - (b.description || '').length)
    || a.id.localeCompare(b.id));
  return scored.slice(0, limit || 12);
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
    const shortlist = rank(skills, o.for, o.limit);
    lines.push('');
    lines.push(`  shortlist for "${firstClause(o.for, 60)}"`);
    if (!shortlist.length) {
      lines.push('    nothing matched — the words share no term with any description,');
      lines.push('    which means choose from the index above, not that nothing fits.');
    }
    for (const s of shortlist) {
      const mine = (familyIds || []).indexOf(s.id) !== -1 ? '*' : ' ';
      // `pad` only ever grows a field, so a long hit list would run straight into the
      // description with no space between them. One is added unconditionally.
      lines.push(`   ${mine}${pad(s.id, 27)}${pad(`[${s.hits.join(' ')}]`, 25)} ${firstClause(s.description, 56)}`);
    }
    lines.push('');
    lines.push('    Ranked by term overlap with each skill\'s own description — a');
    lines.push('    SHORTLIST, not a decision. It cannot tell two senses of a word apart.');
    lines.push('    `*` marks a family skill.');
  }

  return lines.join('\n');
}

module.exports = {
  classify, rank, terms, report, readSkills,
};
