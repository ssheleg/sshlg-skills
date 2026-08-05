#!/usr/bin/env node
'use strict';
// Migration must move the operator's wording, not paraphrase it. The asides
// are the part that makes a rule get followed instead of skimmed, and they
// are exactly what a rewrite would smooth away.

const assert = require('assert');
const M = require('../lib/migrate.js');
const T = require('../lib/router-texts.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ASIDE_UX = 'Файла нет → предложи `/ux` (плагин super-ux) до работы над UI.';
const ASIDE_TP = 'Прогонять десять стадий ради одного символа — самый быстрый способ научить меня обходить пайплайн стороной.';

const HANDWRITTEN = [
  '# Global rules',
  '',
  '## UX scenarios — global (super-ux)',
  '',
  'Для любого проекта с интерфейсом:',
  '',
  '- `docs/ux/scenarios.md` — источник правды. ' + ASIDE_UX,
  '',
  '## Язык',
  '',
  'Отвечаю на языке вопроса.',
  '',
  '## Роутинг работы — по умолчанию через task-pipeline',
  '',
  '**Если `task-pipeline` установлен, любая работа идёт через него.**',
  '',
  ASIDE_TP,
  '',
  '## Что-то ещё',
  '',
  'хвост',
  ''
].join('\n');

it('both hand-written routers are found', () => {
  const r = M.extract(HANDWRITTEN);
  assert.deepStrictEqual(Object.keys(r.routers).sort(), ['super-ux', 'task-pipeline']);
});

it('the operator asides survive character for character', () => {
  const r = M.extract(HANDWRITTEN);
  assert.ok(r.routers['super-ux'].includes(ASIDE_UX));
  assert.ok(r.routers['task-pipeline'].includes(ASIDE_TP));
});

it('an unrelated heading between them is not swallowed', () => {
  const r = M.extract(HANDWRITTEN);
  assert.ok(!r.routers['super-ux'].includes('Отвечаю на языке вопроса'));
  assert.ok(!r.routers['super-ux'].includes('## Язык'));
});

it('migration removes the originals and keeps everything else', () => {
  const out = M.migrate(HANDWRITTEN);
  assert.ok(!out.text.includes('## UX scenarios — global (super-ux)'));
  assert.ok(!out.text.includes('## Роутинг работы — по умолчанию через task-pipeline'));
  assert.ok(out.text.includes('## Язык'));
  assert.ok(out.text.includes('Отвечаю на языке вопроса.'));
  assert.ok(out.text.includes('## Что-то ещё'));
  assert.ok(out.text.includes('хвост'));
  assert.ok(out.text.startsWith('# Global rules'));
});

it('an absent heading falls back to the packaged default, not to invention', () => {
  const only = '# notes\n\n## Роутинг работы — по умолчанию через task-pipeline\n\nтело\n';
  const out = M.migrate(only, { fallbacks: T.forMembers(['super-ux', 'task-pipeline']) });
  assert.ok(out.routers['task-pipeline'].includes('тело'), 'the hand-written one wins');
  assert.strictEqual(out.routers['super-ux'], T.SUPER_UX, 'the missing one takes the default');
});

it('a file with no hand-written rules migrates nothing and loses nothing', () => {
  const plain = '# notes\n\n## Язык\n\nтекст\n';
  const out = M.migrate(plain);
  assert.strictEqual(out.text, plain);
  assert.deepStrictEqual(out.routers, {});
});

it('migration is idempotent — a second pass finds nothing left to move', () => {
  const once = M.migrate(HANDWRITTEN);
  const twice = M.migrate(once.text);
  assert.strictEqual(twice.text, once.text);
  assert.deepStrictEqual(twice.routers, {});
});


it('every extracted body appears verbatim in the source', () => {
  // The strongest statement available without a real file: whatever came out
  // is a substring of what went in, so nothing was reflowed or paraphrased.
  const r = M.extract(HANDWRITTEN);
  for (const body of Object.values(r.routers)) {
    assert.ok(HANDWRITTEN.includes(body), 'a body was altered on the way out');
  }
});

it('a body wrapped across lines keeps its line breaks', () => {
  const wrapped = '# h\n\n## Роутинг работы — по умолчанию через task-pipeline\n\n' +
    'первая строка предложения\nвторая строка того же предложения.\n';
  const r = M.extract(wrapped);
  assert.ok(r.routers['task-pipeline'].includes('первая строка предложения\nвторая строка'));
});

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
