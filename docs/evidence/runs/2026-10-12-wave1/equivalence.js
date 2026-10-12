#!/usr/bin/env node
'use strict';
/**
 * R06 — the stem prefilter changes no answer.
 *
 *   node docs/evidence/runs/2026-10-12-wave1/equivalence.js [base-rev]   (default 5852c57)
 *
 * Generates prompts from the shipped phrase table (triggers, objects, QUESTION, REFUSALS)
 * in the forms people type — inflected endings, a verbal prefix, a hyphen for a space,
 * upper case, `ё`, a Latin brand inside Russian, a verb in front, a question around it —
 * and compares `match`, `optedOut`, `isQuestion` and `render` (no `noted`) of the base
 * revision's `lib/triggers.js` with the working tree's. Prints one JSON line; `diffs` must
 * be 0. Adapted from the fix-round verifier's harness.
 */
const path = require('path');
const { REPO, materialise } = require('./_base.js');

const fs = require('fs');
const base = process.argv[2] || '5852c57';
const baseRoot = materialise(base);
process.on('exit', () => fs.rmSync(baseRoot, { recursive: true, force: true }));
const O = require(path.join(baseRoot, 'lib', 'triggers.js'));
const N = require(path.join(REPO, 'lib', 'triggers.js'));

const phrases = new Set(N.QUESTION.concat(N.REFUSALS));
const objects = new Set();
for (const spec of Object.values(N.ROUTES)) {
  (spec.triggers || []).forEach((t) => phrases.add(t));
  (spec.objects || []).forEach((t) => objects.add(t));
}
const ruEnd = ['', 'а', 'у', 'ом', 'е', 'ы', 'и', 'ой', 'ами', 'ов', 'ую', 'ть', 'ться', 'ите'];
const enEnd = ['', 's', 'ing', 'ed', 'es', 'ion'];
const pre = ['', 'от', 'пере', 'за', 'вы', 'по', 'недо'];
const brand = (s) => s.replace(/телеграм/g, 'Telegram').replace(/фигм/g, 'Figma');
function variants(p) {
  const out = new Set([p, p.toUpperCase(), p.replace(/е/g, 'ё'), p.replace(/ /g, '-'),
    p.replace(/ /g, ' это '), brand(p), brand(p).replace(/ /g, '-')]);
  const words = p.split(/\s+/);
  for (let i = 0; i < words.length; i += 1) {
    for (const e of (/[а-яё]/.test(words[i]) ? ruEnd : enEnd)) {
      const w = words.slice();
      w[i] = words[i] + e; out.add(w.join(' '));
      w[i] = words[i].slice(0, -1) + e; out.add(w.join(' '));
    }
  }
  for (const x of pre) out.add(x + p);
  return [...out];
}
const verbs = ['сделай ', 'почини ', 'добавь ', 'fix ', 'build '];
const texts = new Set(['', 'привет', 'аудитория', 'ботинок', 'почему упал трафик?']);
for (const p of [...phrases, ...objects]) {
  for (const v of variants(p)) {
    texts.add(v);
    texts.add(`слушай, ${v} пожалуйста`);
    for (const vb of verbs) texts.add(vb + v);
    texts.add(`что такое ${v}?`);
  }
}
const diffs = [];
for (const t of texts) {
  const a = JSON.stringify(O.match(t));
  const b = JSON.stringify(N.match(t));
  if (a !== b) diffs.push(['match', t, a, b]);
  if (O.optedOut(t) !== N.optedOut(t)) diffs.push(['optedOut', t]);
  if (O.isQuestion(t) !== N.isQuestion(t)) diffs.push(['isQuestion', t]);
  if (O.render(t) !== N.render(t)) diffs.push(['render', t]);
}
console.log(JSON.stringify({
  base, phrases: phrases.size, objects: objects.size, prompts: texts.size,
  comparisons: texts.size * 4, diffs: diffs.length, sample: diffs.slice(0, 5),
}));
process.exit(diffs.length ? 1 : 0);
