'use strict';
/**
 * The managed routing block — parsing and rendering only.
 *
 * This module never reads or writes a file. That is deliberate: it edits the
 * operator's global agent instructions, a file governing every project and
 * every session, and the rules that keep it intact should be provable without
 * a HOME, a temp directory, or any code path capable of a write.
 *
 * The block is parsed into a list of segments and rendered by concatenating
 * them, so a round-trip is byte-exact by construction rather than by care.
 * Anything this module does not understand is carried through as chrome.
 */

const BEGIN = '<!-- SSHLG:ROUTERS:BEGIN';
const END = '<!-- SSHLG:ROUTERS:END -->';
const OPTOUT = '<!-- SSHLG:ROUTERS:OPTOUT -->';

const SECTION_RE =
  /<!-- SSHLG:ROUTER:([a-z0-9-]+):BEGIN -->\n([\s\S]*?)\n<!-- SSHLG:ROUTER:\1:END -->/g;

const STATE = {
  ABSENT: 'absent',
  OPTED_OUT: 'opted-out',
  MALFORMED: 'malformed',
  PRESENT: 'present',
};

function countOccurrences(text, needle) {
  let count = 0;
  let from = 0;
  for (;;) {
    const at = text.indexOf(needle, from);
    if (at === -1) return count;
    count += 1;
    from = at + needle.length;
  }
}

/**
 * Split a block body into ordered segments.
 *
 * `chrome` is everything the parser does not own — the heading, blank lines,
 * the table, and anything a future version writes that this one has never
 * heard of. It is copied verbatim, which is what lets an older launcher meet
 * a newer block without damaging it.
 */
function segment(block) {
  const segments = [];
  let cursor = 0;
  SECTION_RE.lastIndex = 0;
  let match;
  while ((match = SECTION_RE.exec(block)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: 'chrome', raw: block.slice(cursor, match.index) });
    }
    segments.push({
      type: 'section',
      name: match[1],
      body: match[2],
      raw: match[0],
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < block.length) {
    segments.push({ type: 'chrome', raw: block.slice(cursor) });
  }
  return segments;
}

/**
 * Classify a file and, when it carries a well-formed block, take it apart.
 *
 * Order matters: the opt-out marker is checked first and outranks a present
 * block, because a user who left that marker has said no in the only place
 * that survives every reinstall.
 */
function parse(text) {
  const source = typeof text === 'string' ? text : '';

  if (source.includes(OPTOUT)) {
    return { state: STATE.OPTED_OUT, before: source, block: '', after: '', segments: [], sections: [] };
  }

  const begins = countOccurrences(source, BEGIN);
  const ends = countOccurrences(source, END);

  if (begins === 0 && ends === 0) {
    return { state: STATE.ABSENT, before: source, block: '', after: '', segments: [], sections: [] };
  }
  if (begins !== 1 || ends !== 1) {
    return { state: STATE.MALFORMED, before: source, block: '', after: '', segments: [], sections: [] };
  }

  const beginAt = source.indexOf(BEGIN);
  const endAt = source.indexOf(END);
  if (endAt < beginAt) {
    return { state: STATE.MALFORMED, before: source, block: '', after: '', segments: [], sections: [] };
  }

  let blockEnd = endAt + END.length;
  if (source[blockEnd] === '\n') blockEnd += 1;

  const block = source.slice(beginAt, blockEnd);
  const segments = segment(block);
  return {
    state: STATE.PRESENT,
    before: source.slice(0, beginAt),
    block,
    after: source.slice(blockEnd),
    segments,
    sections: segments.filter((s) => s.type === 'section'),
  };
}

/** The block, rebuilt from its segments. Exact by construction. */
function render(parsed) {
  if (!parsed || !parsed.segments || !parsed.segments.length) return parsed && parsed.block ? parsed.block : '';
  return parsed.segments.map((s) => s.raw).join('');
}

module.exports = { parse, render, segment, STATE, BEGIN, END, OPTOUT, SECTION_RE };
