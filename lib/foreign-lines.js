'use strict';
/**
 * Where text the pack did not write sits inside a block the pack owns.
 *
 * Pure: both sides are handed in, nothing is read or written. Three callers use
 * it — the wait-rule writer (`lib/wait-rules.js`), the routing-block refresh
 * (`lib/routers.js`) and the read-only listing (`lib/blocks.js`) — so the line
 * numbers an operator is told to look at are computed one way only.
 *
 * Line numbers are 1-based and count lines of the WHOLE file, so a message can
 * name `file:line` and the operator can open it there.
 */

/** 1-based line of the character at `offset` in `text`. */
function lineAt(text, offset) {
  let line = 1;
  for (let i = text.indexOf('\n'); i !== -1 && i < offset; i = text.indexOf('\n', i + 1)) line += 1;
  return line;
}

/**
 * Lines of `current` that `expected` does not account for, by common prefix and
 * common suffix. Returns `{ startLine, endLine }` relative to `firstLine` (the
 * file line of `current`'s first line), `null` when the two are equal, and
 * `{ startLine, endLine, missing: true }` when `current` only LOST lines (the
 * range then names the line after which the packaged text is missing).
 */
function changedRange(current, expected, firstLine) {
  if (current === expected) return null;
  const a = String(current).split('\n');
  const b = String(expected).split('\n');
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p += 1;
  let s = 0;
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s += 1;
  const from = p;
  const to = a.length - s - 1;
  if (to < from) {
    const at = firstLine + Math.max(0, from - 1);
    return { startLine: at, endLine: at, missing: true };
  }
  return { startLine: firstLine + from, endLine: firstLine + to };
}

/**
 * Indices (0-based, within `before`) of the non-blank lines of `before` that
 * `after` does not carry. A multiset match: a line the new text keeps once is
 * accounted for once. This is the test for "would replacing `before` with
 * `after` drop words": blank lines are layout, the writer settles those.
 */
function droppedLines(before, after) {
  const pool = new Map();
  for (const l of String(after).split('\n')) pool.set(l, (pool.get(l) || 0) + 1);
  const out = [];
  String(before).split('\n').forEach((l, i) => {
    const n = pool.get(l) || 0;
    if (n) { pool.set(l, n - 1); return; }
    if (l.trim()) out.push(i);
  });
  return out;
}

/** `"12"` or `"12-14"`: one way to print a range in every message. */
function span(r) {
  if (!r) return '';
  return r.startLine === r.endLine ? String(r.startLine) : `${r.startLine}-${r.endLine}`;
}

module.exports = { lineAt, changedRange, droppedLines, span };
