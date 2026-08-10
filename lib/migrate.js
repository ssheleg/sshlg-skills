'use strict';
/**
 * Moving hand-written router rules into the managed block.
 *
 * The rules an operator wrote themselves are better than the ones this
 * package ships — not because the prose is nicer, but because the asides are
 * load-bearing. "Прогонять десять стадий ради одного символа — самый быстрый
 * способ научить обходить пайплайн стороной" is the sentence that makes the
 * rule get followed rather than skimmed, and it is exactly the kind of line a
 * rewrite smooths into nothing.
 *
 * So migration moves text; it never regenerates it. The packaged defaults are
 * used only for a router the operator never wrote.
 */

/** Hand-written headings this migration recognises, and what they become. */
// No \b here. JavaScript's word boundary is ASCII-only, so it never matches
// after a Cyrillic letter -- `Роутинг работы\b` silently found nothing while
// `UX scenarios\b` worked, because the latter happens to end in ASCII.
const KNOWN_HEADINGS = [
  { router: 'super-ux', match: /^##[ \t]+UX scenarios(?=[\s—-]|$).*$/m },
  { router: 'task-pipeline', match: /^##[ \t]+Роутинг работы(?=[\s—-]|$).*$/m },
];

/**
 * Where the section starting at `from` ends: the next heading of level 1 or
 * 2, or EOF.
 *
 * H1 counts. A scan for `## ` alone runs straight past an H1 to the end of
 * the file, and in the operator's own CLAUDE.md the section being cut is
 * followed by exactly that — every rule after it would have gone with the
 * cut. A deeper heading (`### `) does not end anything: it is part of the
 * section it sits in.
 */
function sectionEnd(text, from) {
  const next = text.slice(from).search(/^#{1,2}[ \t]/m);
  return next === -1 ? text.length : from + next;
}

/**
 * The half-open range the managed block occupies, or `null`.
 *
 * Migration reads HAND-WRITTEN rules, and the block is machine-written. The
 * two collided because the block's own heading is `## Роутинг работы — семья
 * ssheleg` and one of the headings below matches `## Роутинг работы`: on a
 * second run migration took the block's heading for a hand-written rule and
 * cut from there to the next H1 or EOF — carrying the closing sentinel, and
 * every rule the operator had written below it, out of the file. The command
 * then reported the block malformed and refused to touch it again.
 *
 * Shipped in v0.22.0 and reproduced against it. It stayed invisible because
 * idempotence was proven on `upsert`, which is pure, while the corruption
 * happened one layer up, in the command that runs migration first.
 */
function blockRange(text) {
  const from = text.indexOf(BLOCK_BEGIN);
  if (from === -1) return null;
  const endAt = text.indexOf(BLOCK_END, from);
  if (endAt === -1) return { start: from, end: text.length };
  return { start: from, end: endAt + BLOCK_END.length };
}

const BLOCK_BEGIN = '<!-- SSHLG:ROUTERS:BEGIN';
const BLOCK_END = '<!-- SSHLG:ROUTERS:END -->';

/** Does `[start,end)` touch the managed block at all? */
function insideBlock(range, start, end) {
  return !!range && start < range.end && end > range.start;
}

/**
 * Find the hand-written rules without changing anything.
 *
 * Returns the body of each recognised heading verbatim — trimmed only of the
 * blank lines that separate it from its neighbours, never reflowed. Anything
 * that overlaps the managed block is skipped: that text is not hand-written,
 * and moving it would mean migration eating its own output.
 */
function extract(text) {
  const routers = {};
  const spans = [];
  const block = blockRange(text);

  for (const { router, match } of KNOWN_HEADINGS) {
    const hit = matchOutsideBlock(text, match, block);
    if (!hit) continue;
    const start = hit.index;
    const bodyFrom = start + hit[0].length;
    const end = sectionEnd(text, bodyFrom);
    if (insideBlock(block, start, end)) continue;
    const body = text.slice(bodyFrom, end).replace(/^\n+/, '').replace(/\n+$/, '');
    if (body) {
      routers[router] = body;
      spans.push({ start, end, router });
    }
  }

  spans.sort((a, b) => a.start - b.start);
  return { routers, spans };
}

/**
 * The first match of `re` that does not start inside the managed block.
 *
 * `String.match` would hand back the block's own heading and stop looking;
 * a hand-written rule below the block would then never be found.
 */
function matchOutsideBlock(text, re, block) {
  const scan = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let hit;
  while ((hit = scan.exec(text)) !== null) {
    if (!block || hit.index < block.start || hit.index >= block.end) return hit;
    if (hit.index === scan.lastIndex) scan.lastIndex += 1; // never loop on an empty match
  }
  return null;
}

/**
 * Hand-written headings a router now SUPERSEDES rather than absorbs.
 *
 * `task-pipeline`'s router claims planning as its own stages 2–4, so a second
 * planning rule beside it is not a duplicate — it is a competitor, and two
 * rules for one job means the agent picks. Removal happens **only when the
 * superseding router is actually written**: taking a rule out with nothing
 * put in its place is not supersession, it is deleting someone else's text.
 *
 * The body is handed back rather than dropped. `~/.claude/CLAUDE.md` is not
 * under version control, so there is nothing to restore it from.
 */
const SUPERSEDED = [
  {
    id: 'task-planning',
    match: /^##[ \t]+Task planning(?=[\s—-]|$).*$/m,
    supersededBy: 'task-pipeline',
  },
];

/** The superseded sections present, given the routers about to be written. */
function findSuperseded(text, willWrite) {
  const superseded = {};
  const spans = [];
  const writing = willWrite || [];
  const block = blockRange(text);

  for (const { id, match, supersededBy } of SUPERSEDED) {
    if (!writing.includes(supersededBy)) continue;
    const hit = matchOutsideBlock(text, match, block);
    if (!hit) continue;
    const start = hit.index;
    const bodyFrom = start + hit[0].length;
    const end = sectionEnd(text, bodyFrom);
    if (insideBlock(block, start, end)) continue;
    const body = text.slice(bodyFrom, end).replace(/^\n+/, '').replace(/\n+$/, '');
    if (!body) continue;
    superseded[id] = body;
    spans.push({ start, end, id });
  }

  return { superseded, spans };
}

/**
 * Remove the recognised headings and hand back their bodies.
 *
 * Spans are cut back to front so earlier indices stay valid, and the cut
 * leaves exactly one blank line where the section was, so the surrounding
 * document keeps its shape instead of collapsing.
 */
function migrate(text, opts) {
  const { routers, spans } = extract(text);
  const fallbacks = (opts && opts.fallbacks) || {};
  const merged = Object.assign({}, fallbacks, routers);

  const sup = findSuperseded(text, Object.keys(merged));

  // Both kinds of span are cut in one back-to-front pass, so a superseded
  // section above a migrated one cannot invalidate the other's indices.
  let out = text;
  const all = spans.concat(sup.spans).sort((a, b) => a.start - b.start);
  for (const span of all.slice().reverse()) {
    const head = out.slice(0, span.start).replace(/\n+$/, '\n');
    const tail = out.slice(span.end).replace(/^\n+/, '');
    out = head + (head && tail ? '\n' : '') + tail;
  }

  return {
    text: out,
    routers: spans.length || Object.keys(fallbacks).length ? merged : {},
    // What was actually CUT OUT of the file, as opposed to what `routers`
    // hands back to be written. The two are different questions and merging
    // them cost this repository a release: `routers` is deliberately
    // fallbacks-merged, so a caller asking it "which of these did the operator
    // write?" is told "all of them", records every router as authored on the
    // first run, and freezes the block against every later release.
    migrated: Object.keys(routers),
    superseded: sup.superseded,
  };
}

module.exports = {
  extract, migrate, findSuperseded, blockRange,
  KNOWN_HEADINGS, SUPERSEDED, sectionEnd,
};
