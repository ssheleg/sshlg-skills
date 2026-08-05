#!/usr/bin/env node
'use strict';
// Every router text carries four things. A router without a boundary swallows
// everything, and one without a refusal phrase leaves no way to say no.

const assert = require('assert');
const T = require('../lib/router-texts.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const ALL = { 'super-ux': T.SUPER_UX, copywriting: T.COPYWRITING, 'task-pipeline': T.TASK_PIPELINE };

for (const [name, text] of Object.entries(ALL)) {
  it(`${name}: states its rule`, () => {
    assert.ok(/установлен/.test(text));
  });
  it(`${name}: names its boundary in both directions`, () => {
    assert.ok(/\*\*Граница/.test(text), 'no boundary heading');
    assert.ok(/НЕ через/.test(text), 'no negative half — the boundary is one-sided');
  });
  it(`${name}: names a refusal phrase`, () => {
    assert.ok(/Фраза отказа/.test(text));
  });
  it(`${name}: places itself against the other routers`, () => {
    assert.ok(/Место среди роутеров/.test(text));
  });
}

it('copywriting carries the D3 boundary in both directions', () => {
  assert.ok(T.COPYWRITING.includes('отгружается пользователю продукта'));
  for (const excluded of ['коммит', 'README', 'внутренние доки', 'ответы в чате']) {
    assert.ok(T.COPYWRITING.includes(excluded), `missing exclusion: ${excluded}`);
  }
});

it('copywriting names both refusal phrases', () => {
  assert.ok(T.COPYWRITING.includes('без бренда'));
  assert.ok(T.COPYWRITING.includes('черновиком'));
});

it('installing super-ux alone contributes two routers, not three', () => {
  const r = T.forMembers(['super-ux']);
  assert.deepStrictEqual(Object.keys(r).sort(), ['copywriting', 'super-ux']);
});

it('installing the bundle contributes all three', () => {
  const r = T.forMembers(['super-ux', 'task-pipeline', 'agent-sync']);
  assert.deepStrictEqual(Object.keys(r).sort(), ['copywriting', 'super-ux', 'task-pipeline']);
});

it('a member that contributes no router adds nothing', () => {
  assert.deepStrictEqual(T.forMembers(['agent-sync']), {});
});

if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
