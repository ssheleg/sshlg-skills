'use strict';

/**
 * Which anti-AI-writing skills this machine can reach, and what each one can do.
 *
 * Why a registry rather than a hard-coded pair. Two implementations are named below
 * because they were the two asked about, not because they are the field. They already
 * differ on nearly everything that matters — where the rules come from, whether a
 * detect-only mode exists, whether the caller can name a voice — so a skill that hard-codes
 * one of them ships a preference disguised as a dependency. Everything here is data, and a
 * third implementation joins by a pull request against this list.
 *
 * **The caveat that travels with all of them, because it is the honest part.**
 * `avoid-ai-writing` states it in its own words and it applies to every entry: this is a
 * writing-quality tool, not a verdict. The patterns are more common in model output, but
 * people produce them too — under deadline, in an unfamiliar genre, and above all in a
 * second language. Independent audits of commercial AI detectors found false-positive rates
 * **above 60% on non-native English writers** (Liang et al., Stanford, *Patterns*, 2023).
 * A family that turned this into a gate would be shipping a filter that penalises exactly
 * those writers. So a humanizer ADVISES here, and nothing in this repository fails a build
 * because a detector disliked a sentence.
 *
 * Read 2026-08-28 against `blader/humanizer` v2.11.2 and
 * `conorbronsdon/avoid-ai-writing` v3.26.0.
 */

/**
 * The known implementations.
 *
 * `modes` is the contract a caller can rely on:
 *   detect  — reports patterns and changes nothing
 *   rewrite — returns humanized text
 *   edit    — writes the file in place
 *
 * `embedded` means the skill has a documented way to return ONLY the rewritten text, which
 * is what another skill needs when it is producing copy rather than reviewing it. A skill
 * without it hands back a report the caller then has to parse.
 */
const REGISTRY = [
  {
    id: 'humanizer',
    repo: 'blader/humanizer',
    install: 'npx skills add blader/humanizer',
    modes: ['rewrite', 'edit'],
    embedded: true,
    rules: "Wikipedia's \"Signs of AI writing\", WikiProject AI Cleanup",
    note: '35 numbered patterns; matches a supplied writing sample over its own style rules, '
      + 'and refuses to add a fact the source did not carry',
  },
  {
    id: 'avoid-ai-writing',
    repo: 'conorbronsdon/avoid-ai-writing',
    install: 'npx skills add conorbronsdon/avoid-ai-writing',
    modes: ['detect', 'rewrite', 'edit'],
    embedded: false,
    rules: 'its own catalogue, with P0/P1/P2 severity tiers',
    note: 'the only one here with a detect-only mode and named voice profiles '
      + '(casual · professional · technical · warm · blunt), plus context tolerance profiles',
  },
];

/** Which of them are installed, from the roster `conflicts.readSkills` already builds. */
function present(skills) {
  const ids = new Set((skills || []).map((s) => s.id));
  return REGISTRY.map((h) => ({ ...h, installed: ids.has(h.id) }));
}

/**
 * The one this run should reach for, given what is installed and what is wanted.
 *
 * `want` is a mode. Preference order is the registry's order and nothing cleverer: a
 * ranking by stars or by pattern count would be this file inventing an opinion it cannot
 * defend. When several qualify they are all returned, most-preferred first, and the caller
 * — or the operator — picks.
 */
function pick(skills, want) {
  const mode = want || 'rewrite';
  return present(skills).filter((h) => h.installed && h.modes.includes(mode));
}

function pad(s, n) { return String(s).padEnd(n); }

function report(skills, opts) {
  const o = opts || {};
  const rows = present(skills);
  const on = rows.filter((r) => r.installed);
  const lines = [];

  lines.push(`Humanizers — ${on.length} of ${rows.length} known implementations installed`);
  lines.push('');
  for (const r of rows) {
    lines.push(`  ${r.installed ? '✓' : ' '} ${pad(r.id, 20)}${r.modes.join(' · ')}`
      + `${r.embedded ? ' · embedded' : ''}`);
    lines.push(`    ${pad('', 20)}rules: ${r.rules}`);
    lines.push(`    ${pad('', 20)}${r.note}`);
    if (!r.installed) lines.push(`    ${pad('', 20)}install: ${r.install}`);
    lines.push('');
  }

  if (!on.length) {
    lines.push('  None installed. Nothing here requires one — a humanizer advises, and no');
    lines.push('  gate in this family fails because a detector disliked a sentence.');
    lines.push('');
  }

  lines.push('  A humanizer is a writing-quality tool, NOT a verdict. The patterns are more');
  lines.push('  common in model output and people produce them too — under deadline, in an');
  lines.push('  unfamiliar genre, and above all in a second language, where audits found');
  lines.push('  false-positive rates above 60% on non-native English writers.');
  if (o.contribute !== false) {
    lines.push('');
    lines.push('  Using another one? Open a pull request against `lib/humanizers.js` — the');
    lines.push('  list is data, and the two above are the two that were asked about, not');
    lines.push('  the field.');
  }
  return lines.join('\n');
}

module.exports = {
  REGISTRY, present, pick, report,
};
