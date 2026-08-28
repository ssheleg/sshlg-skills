'use strict';

/**
 * The capability sentence of a skill, from the description its own SKILL.md
 * advertises — with the trigger enumeration removed.
 *
 * Why this exists. A pack page listed the names of the skills it ships as pills and
 * never said what any of them DOES: `/skills/seo-aeo-audit/` carried 173 words of
 * prose against 318 words of link text, so the page most likely to be asked "what is
 * this pack for" was 65% navigation. The answer was already written — every skill's
 * front-matter `description` is what the agent runtime itself reads — so the page
 * derives it rather than restating it, and the two cannot drift.
 *
 * Why the triggers come out. That description ends in a bilingual list of the phrases
 * that fire the skill — `"SEO audit" / "сделай SEO-аудит", "why did my traffic drop"
 * / "почему упал трафик"`. Rendered on a public page that is a keyword list wearing
 * prose, which is the one tactic an audit of this family must never ship. What is
 * left is the two halves a reader and an engine both want: what the skill is FOR, and
 * what it is NOT for.
 *
 * The enumeration comes in two shapes, because the descriptions were written by hand
 * over a year and nothing forced them into one:
 *
 *   labelled    `… locales. Triggers - "tone of voice" / "тон оф войс", … .`
 *   unlabelled  `… and Claude Code plugins - "make a skill" / "сделай скилл", … .`
 *
 * A labelled list is dropped to the end of its sentence, because its tail items are
 * often unquoted (`starting any marketing surface`) and stopping at the last quote
 * strands them. An unlabelled list has no sentence of its own — it sits mid-clause —
 * so only the quoted run is taken and the clause is closed up.
 *
 * This is a transform over text somebody else may edit tomorrow, so it is not trusted:
 * `test/brief_test.js` asserts the shape of the result for every skill the family
 * ships, and the build refuses prose it would be embarrassing to publish rather than
 * publishing it. A stripper that silently emits `plugins - or when a skill must` is
 * the same defect class as a pill that 404s.
 */

// A quoted phrase runs to the NEXT MARK OF ITS OWN KIND, never to whichever mark
// comes first. `"why doesn't ChatGPT cite us"` is one double-quoted trigger holding an
// apostrophe; a character class of every quote mark ends it at `doesn` and the rest of
// the list bleeds into the page — which is what shipped to `/skills/seo-aeo-audit/` on
// the first pass here, half a Russian keyword list and a stray `"` in the prose.
//
// The single-quote arm is narrower than the others on purpose: `'claim this task'` is a
// trigger, `Stripe's agent toolchain` is not, and only the position of the mark tells
// them apart. So an opening `'` must begin a word and its closing `'` must end one.
const QUOTED = '(?:"[^"]*"|“[^”]*”|‘[^’]*’|(?<=^|[\\s(\\/,;:—–-])\'[^\']*\'(?=[\\s.,;:)\\/—–-]|$))';
const SEP = '(?:\\s*(?:,|/|;|—|–|-|\\bor\\b|\\band\\b|\\bи\\b)\\s*)';

const LABEL = new RegExp(`(?:^|[\\s.,;:—–-])Triggers?\\s*[-–—:]\\s*`, 'i');
const RUN = new RegExp(`${QUOTED}(?:${SEP}(?:${QUOTED}|/[A-Za-z][\\w-]*))*`, 'g');

/** End of the sentence containing index `i` — a period followed by a capital. */
function sentenceEnd(s, i) {
  const b = /[.!?]\s+(?=[A-ZА-Я])/g;
  b.lastIndex = i;
  const m = b.exec(s);
  return m ? m.index + m[0].length : s.length;
}

function tidy(s) {
  return s
    .replace(/\s+/g, ' ')
    // the run sat between two dashes; removing it leaves both behind
    .replace(/(\s+[-–—])(\s+[-–—])+/g, '$1')
    // a clause left open by the run that was removed: `plugins - or when` → `plugins, or when`
    .replace(/\s+[-–—]\s+(?=(?:or|and|when|NOT|Not|for)\b)/g, ', ')
    // …or left dangling at the end of its clause: `keywords - .` → `keywords.`
    .replace(/\s+[-–—]\s*(?=[.,;:])/g, '')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/([.,;:])\1+/g, '$1')
    .replace(/,\s*\./g, '.')
    .replace(/\s*[-–—,;:]\s*$/, '')
    .trim();
}

function capabilityBrief(description) {
  let s = String(description == null ? '' : description).replace(/\s+/g, ' ').trim();
  if (!s) return '';

  const label = LABEL.exec(s);
  if (label) {
    const from = label.index === 0 ? 0 : label.index + 1;
    s = s.slice(0, from) + s.slice(sentenceEnd(s, label.index + label[0].length));
  }
  s = s.replace(RUN, ' ');

  // The site is English. Any Cyrillic left in a description at this point is a trigger
  // ANALOGUE — the same phrase again in the other language — never capability prose, because
  // every pack in this family writes its capability sentence in English and its triggers in
  // both. `task-pipeline` proved the rule the hard way: its analogues are neither quoted nor
  // labelled (`… hardening; фича, фикс, рефактор …`, `audit/аудит, bug hunt/проверь ошибки`),
  // so both arms above passed straight over them and nine Russian words shipped onto
  // /skills/task-pipeline/ as prose.
  //
  // Paired forms go first, keeping the English side: `audit/аудит` -> `audit`. Then bare runs,
  // with the separator that introduced them, so no orphan comma is left behind.
  s = s
    .replace(/([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)*)\s*\/\s*[А-Яа-яЁё][^,;.]*/g, '$1')
    .replace(/[;,—–-]?\s*[А-Яа-яЁё][А-Яа-яЁё\s,]*[А-Яа-яЁё]/g, '')
    .replace(/[А-Яа-яЁё]+/g, '');
  // No separate repair for a clause left open by the removal (`… PR review, or on.`):
  // the analogue arms consume the connective along with the run they introduce, and
  // `test/brief_test.js` pins the property rather than the mechanism — a repair that
  // never fires is a branch nobody exercises, and one was removed here after a plant
  // showed it made no difference to any description the family ships.

  s = tidy(s);
  if (s && !/[.!?]$/.test(s)) s += '.';
  return s;
}

module.exports = { capabilityBrief };
