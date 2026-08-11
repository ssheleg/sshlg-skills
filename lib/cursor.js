'use strict';
/**
 * Cursor's channel — one file per rule, not a block inside someone else's.
 *
 * `~/.cursor/rules/*.mdc` is markdown with YAML front-matter and
 * `alwaysApply: true`. That is a different SHAPE from the other three targets,
 * not a different path: there is no operator prose around the block to
 * preserve, because the file is ours end to end. Which makes this the simpler
 * writer of the two — and the one that must be careful in the opposite
 * direction, since owning a file means an overwrite destroys whatever was
 * there without a diff to notice it.
 *
 * So the emitted file is **self-identifying**: it carries the same sentinels
 * as the block. A file that does not have them was not written by this pack,
 * and is left alone rather than replaced.
 *
 * Pure: it is handed the rendered body and returns text.
 */

const FILENAME = 'sshlg-routing.mdc';

const DESCRIPTION =
  'Роутинг работы по семье ssheleg — карта членов, точки входа и правила, ' +
  'когда какой скил обязателен. Managed by sshlg-skills.';

/**
 * The `.mdc` for a rendered block body.
 *
 * `alwaysApply: true` is the whole point: a rule Cursor loads only on demand
 * would be a routing block nobody routes by.
 */
function renderRule(body) {
  return [
    '---',
    `description: ${DESCRIPTION}`,
    'alwaysApply: true',
    '---',
    '',
    String(body || '').replace(/\s+$/, ''),
    '',
  ].join('\n');
}

/**
 * May this pack write here?
 *
 * Absent — yes, it is ours to create. Present and carrying our sentinel — yes,
 * it is ours to refresh. Present without it — **no**: someone else's rule
 * happens to sit at that name, and overwriting it would delete a file whose
 * author never opted in.
 */
function mayWrite(existing, beginMark) {
  if (existing === null || existing === undefined) return true;
  return String(existing).indexOf(beginMark) !== -1;
}

module.exports = { FILENAME, DESCRIPTION, renderRule, mayWrite };
