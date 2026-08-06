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

// --- where a section ends ------------------------------------------------
//
// Found against the real file rather than by reading: in the operator's own
// CLAUDE.md the section to be cut is followed by an H1, and a scan for the
// next `## ` runs straight past it to EOF. The cut would have taken every
// rule after it.

it('a section ends at the next H1, not only at the next H2', () => {
  const src = [
    '## Роутинг работы — по умолчанию через task-pipeline',
    '',
    'тело роутера',
    '',
    '# graphify',
    '',
    'правило про граф, которое обязано выжить',
    '',
  ].join('\n');
  const r = M.extract(src);
  assert.ok(!r.routers['task-pipeline'].includes('graphify'), 'the cut swallowed the H1 below it');
  assert.ok(!r.routers['task-pipeline'].includes('обязано выжить'));
});

it('a deeper subheading does NOT end its parent section', () => {
  const src = [
    '## Роутинг работы — по умолчанию через task-pipeline',
    '',
    'тело',
    '',
    '### Подраздел',
    '',
    'часть того же правила',
    '',
    '## Следующее',
  ].join('\n');
  const r = M.extract(src);
  assert.ok(r.routers['task-pipeline'].includes('часть того же правила'), 'a child ended its parent');
  assert.ok(!r.routers['task-pipeline'].includes('Следующее'));
});

// --- migration must not read its own output ------------------------------
//
// Shipped in v0.22.0 and reproduced against it: the block's own heading is
// `## Роутинг работы — семья ssheleg`, which the `## Роутинг работы` pattern
// matches. On a SECOND run migration took it for a hand-written rule and cut
// from there to EOF — carrying the closing sentinel and every rule below it
// out of the operator's global instructions. The command then called the
// block malformed and refused to touch it again.
//
// It hid because idempotence was proven on `upsert`, which is pure, while the
// damage happened one layer up in the command that runs migration first.

const BLOCK_HEAD = '<!-- SSHLG:ROUTERS:BEGIN — managed by sshlg-skills -->';
const BLOCK_TAIL = '<!-- SSHLG:ROUTERS:END -->';

const SETTLED = [
  '# Мои правила',
  '',
  BLOCK_HEAD,
  '## Роутинг работы — семья ssheleg',
  '',
  '<!-- SSHLG:ROUTER:task-pipeline:BEGIN -->',
  'тело роутера',
  '<!-- SSHLG:ROUTER:task-pipeline:END -->',
  '',
  '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->',
  '| `task-pipeline` | … | … |',
  '<!-- SSHLG:ROUTERS:TABLE:END -->',
  BLOCK_TAIL,
  '',
  'Проза, которая обязана пережить второй прогон.',
  '',
].join('\n');

it('the block heading is not mistaken for a hand-written rule', () => {
  const r = M.extract(SETTLED);
  assert.deepStrictEqual(r.spans, [], 'migration claimed a span inside the managed block');
  assert.deepStrictEqual(r.routers, {});
});

it('a second migration over a settled file changes nothing at all', () => {
  const r = M.migrate(SETTLED, { fallbacks: { 'task-pipeline': 'packaged' } });
  assert.strictEqual(r.text, SETTLED, 'the settled file was rewritten');
});

it('the closing sentinel survives a second migration', () => {
  const r = M.migrate(SETTLED, { fallbacks: { 'task-pipeline': 'packaged' } });
  assert.ok(r.text.includes(BLOCK_TAIL), 'the block lost its end marker');
});

it('prose below the block survives a second migration', () => {
  const r = M.migrate(SETTLED, { fallbacks: { 'task-pipeline': 'packaged' } });
  assert.ok(r.text.includes('Проза, которая обязана пережить второй прогон.'));
});

it('a hand-written rule BELOW the block is still found', () => {
  // The fix must skip the block, not stop at it: `String.match` would return
  // the block's own heading and never look further.
  const src = SETTLED + '\n## UX scenarios — global (super-ux)\n\nмоё правило про сценарии\n';
  const r = M.extract(src);
  assert.ok(r.routers['super-ux'], 'a rule below the block was missed');
  assert.ok(r.routers['super-ux'].includes('моё правило про сценарии'));
});

it('a superseded heading inside the block is left alone', () => {
  const withInner = SETTLED.replace(
    '## Роутинг работы — семья ssheleg',
    '## Роутинг работы — семья ssheleg\n\n## Task planning — inside the block'
  );
  const r = M.migrate(withInner, { fallbacks: { 'task-pipeline': 'packaged' } });
  assert.deepStrictEqual(r.superseded, {}, 'supersession reached inside the managed block');
});

// --- superseded headings -------------------------------------------------
//
// The competing planning rule is removed rather than moved: task-pipeline's
// own router now claims planning as its stages 2–4. Removal without
// replacement would just be deleting someone else's text, so it happens only
// when the superseding router is actually written — and the body comes back
// so the caller can keep it. ~/.claude/CLAUDE.md is not under version control.

const WITH_PLANNING = [
  '# Global rules',
  '',
  '## Роутинг работы — по умолчанию через task-pipeline',
  '',
  'тело роутера пайплайна',
  '',
  '## Task planning — always the Superpowers cycle',
  '',
  'Trigger. When I ask to make a plan, run the full Superpowers cycle.',
  '',
  '# graphify',
  '',
  'правило про граф',
  '',
].join('\n');

it('the superseded heading goes when the superseding router is written', () => {
  const r = M.migrate(WITH_PLANNING, { fallbacks: { 'task-pipeline': 'packaged' } });
  assert.ok(!r.text.includes('## Task planning'), 'the competing rule survived');
  assert.ok(!r.text.includes('full Superpowers cycle'));
});

it('its body comes back rather than disappearing', () => {
  const r = M.migrate(WITH_PLANNING, { fallbacks: { 'task-pipeline': 'packaged' } });
  const body = r.superseded['task-planning'];
  assert.ok(body, 'nothing handed back');
  assert.ok(body.includes('full Superpowers cycle'), 'the body was not the section');
  assert.ok(WITH_PLANNING.includes(body), 'the body was altered on the way out');
});

it('everything below the superseded section survives', () => {
  const r = M.migrate(WITH_PLANNING, { fallbacks: { 'task-pipeline': 'packaged' } });
  assert.ok(r.text.includes('# graphify'), 'the H1 below it was taken too');
  assert.ok(r.text.includes('правило про граф'));
});

it('no task-pipeline router means no removal — this is supersession, not deletion', () => {
  // Without the pipeline's own heading either: migrating it would itself put
  // a task-pipeline router in play, and then supersession is correct.
  const noPipeline = WITH_PLANNING
    .replace('## Роутинг работы — по умолчанию через task-pipeline\n\nтело роутера пайплайна\n\n', '');
  assert.ok(!noPipeline.includes('Роутинг работы'), 'fixture did not actually drop the heading');

  const r = M.migrate(noPipeline, { fallbacks: { 'super-ux': 'packaged' } });
  assert.ok(r.text.includes('## Task planning'), 'a rule was deleted with nothing replacing it');
  assert.deepStrictEqual(r.superseded, {});
});

it('a file without the superseded heading is untouched by the rule', () => {
  const plain = '# h\n\n## Что-то\n\nтело\n';
  const r = M.migrate(plain, { fallbacks: { 'task-pipeline': 'packaged' } });
  assert.deepStrictEqual(r.superseded, {});
});

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
