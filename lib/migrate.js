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

/** The index where the section starting at `from` ends: the next `## `, or EOF. */
function sectionEnd(text, from) {
  const next = text.slice(from).search(/^##\s/m);
  return next === -1 ? text.length : from + next;
}

/**
 * Find the hand-written rules without changing anything.
 *
 * Returns the body of each recognised heading verbatim — trimmed only of the
 * blank lines that separate it from its neighbours, never reflowed.
 */
function extract(text) {
  const routers = {};
  const spans = [];

  for (const { router, match } of KNOWN_HEADINGS) {
    const hit = match.exec(text);
    if (!hit) continue;
    const start = hit.index;
    const bodyFrom = start + hit[0].length;
    const end = sectionEnd(text, bodyFrom);
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
 * Remove the recognised headings and hand back their bodies.
 *
 * Spans are cut back to front so earlier indices stay valid, and the cut
 * leaves exactly one blank line where the section was, so the surrounding
 * document keeps its shape instead of collapsing.
 */
function migrate(text, opts) {
  const { routers, spans } = extract(text);
  const fallbacks = (opts && opts.fallbacks) || {};

  let out = text;
  for (const span of spans.slice().reverse()) {
    const head = out.slice(0, span.start).replace(/\n+$/, '\n');
    const tail = out.slice(span.end).replace(/^\n+/, '');
    out = head + (head && tail ? '\n' : '') + tail;
  }

  const merged = Object.assign({}, fallbacks, routers);
  return { text: out, routers: spans.length || Object.keys(fallbacks).length ? merged : {} };
}

module.exports = { extract, migrate, KNOWN_HEADINGS, sectionEnd };
