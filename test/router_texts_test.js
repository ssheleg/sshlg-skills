#!/usr/bin/env node
'use strict';
// Every router text carries four things. A router without a boundary swallows
// everything, and one without a refusal phrase leaves no way to say no.
//
// The rule check is split by kind on purpose. A router backed by a member is
// conditional on that member being installed and must say so; a rule with no
// member behind it (`seo-llmo`, `evidence-docs`) holds unconditionally, and
// making it claim otherwise would be a lie in the operator's own file.

const assert = require('assert');
const T = require('../lib/router-texts.js');
const registry = require('../lib/routers-registry.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const EXPECTED = [
  'super-ux', 'sheleg-design', 'copywriting', 'seo-llmo',
  'evidence-docs', 'task-pipeline', 'make-skill', 'agent-sync',
];

it('the registry holds exactly the eight routers, in table order', () => {
  assert.deepStrictEqual(registry.order(), EXPECTED);
});

for (const name of EXPECTED) {
  const entry = registry.REGISTRY[name];
  const text = entry.text;

  it(`${name}: states its rule`, () => {
    assert.ok(/^\*\*/.test(text), 'the text does not open with a bold rule');
    if (entry.requires.length) {
      assert.ok(
        /установлен/.test(text),
        'a router backed by a member must say it is conditional on that member'
      );
    } else {
      assert.ok(
        !/Если `[a-z-]+` установлен/.test(text),
        'a rule with no member must not pretend to depend on one'
      );
    }
  });
  it(`${name}: names its boundary in both directions`, () => {
    assert.ok(/\*\*Граница/.test(text), 'no boundary heading');
    assert.ok(/НЕ через/.test(text), 'no negative half — the boundary is one-sided');
  });
  it(`${name}: names a refusal phrase`, () => {
    assert.ok(/Фраза отказа/.test(text));
  });
  it(`${name}: places itself against its neighbours`, () => {
    assert.ok(/Место среди роутеров/.test(text));
  });
  it(`${name}: has both table cells`, () => {
    assert.ok(entry.answers && entry.answers.length > 3, 'no "answers" cell');
    assert.ok(entry.when && entry.when.length > 3, 'no "when" cell');
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

it('task-pipeline puts planning inside the pipeline, not beside it', () => {
  assert.ok(
    /Планирование[^.]*часть пайплайна/.test(T.TASK_PIPELINE),
    'the text does not claim planning as its own'
  );
  assert.ok(
    /стадии 2–4/.test(T.TASK_PIPELINE),
    'planning is claimed without naming where it happens'
  );
});

it('sheleg-design draws its seam against super-ux by fidelity, not by surface', () => {
  assert.ok(T.SHELEG_DESIGN.includes('Вайрфрейм'));
  assert.ok(/КАК это выглядит/.test(T.SHELEG_DESIGN));
});

it('seo-llmo is design-time and names the audit as the check, not the method', () => {
  assert.ok(/НА ПРОЕКТИРОВАНИИ/.test(T.SEO_LLMO));
  assert.ok(T.SEO_LLMO.includes('/seo-aeo-audit'));
});

it('evidence-docs demands a receipt and a command, not a claim', () => {
  assert.ok(T.EVIDENCE_DOCS.includes('file:line'));
  assert.ok(/код(ом)? выхода/.test(T.EVIDENCE_DOCS));
});

it('installing super-ux alone contributes its two routers plus the memberless rules', () => {
  const r = T.forMembers(['super-ux']);
  assert.deepStrictEqual(
    Object.keys(r).sort(),
    ['copywriting', 'evidence-docs', 'seo-llmo', 'super-ux']
  );
});

it('installing nothing still contributes the rules that need no skill', () => {
  const r = T.forMembers([]);
  assert.deepStrictEqual(Object.keys(r).sort(), ['evidence-docs', 'seo-llmo']);
});

it('installing the whole family contributes all eight', () => {
  const r = T.forMembers([
    'super-ux', 'task-pipeline', 'agent-sync',
    'make-skill', 'sheleg-design', 'seo-aeo-audit',
  ]);
  assert.deepStrictEqual(Object.keys(r).sort(), EXPECTED.slice().sort());
});

it('seo-aeo-audit contributes no router of its own — the rule is not the skill', () => {
  const r = T.forMembers(['seo-aeo-audit']);
  assert.deepStrictEqual(Object.keys(r).sort(), ['evidence-docs', 'seo-llmo']);
});

it('BY_MEMBER is derived from the registry, so it cannot drift from it', () => {
  assert.deepStrictEqual(Object.keys(T.BY_MEMBER['super-ux']).sort(), ['copywriting', 'super-ux']);
  assert.deepStrictEqual(Object.keys(T.BY_MEMBER['sheleg-design']), ['sheleg-design']);
  assert.strictEqual(T.BY_MEMBER['seo-aeo-audit'], undefined);
});

it('rows() renders only the names present, in registry order', () => {
  const r = registry.rows(['task-pipeline', 'super-ux']);
  assert.deepStrictEqual(r.map((x) => x[0]), ['super-ux', 'task-pipeline']);
});

it('rows() ignores a name the registry has never heard of', () => {
  assert.deepStrictEqual(registry.rows(['not-a-router']), []);
});

it('a router switched off is resolved away and reported as disabled', () => {
  const isEnabled = (n) => n !== 'seo-llmo';
  const installed = ['super-ux'];
  assert.ok(!('seo-llmo' in registry.resolve({ installed, isEnabled })));
  assert.deepStrictEqual(registry.disabled({ installed, isEnabled }), ['seo-llmo']);
});

it('an uninstalled member is not "disabled" — there is no section to remove', () => {
  const off = registry.disabled({ installed: [], isEnabled: () => false });
  assert.deepStrictEqual(off.sort(), ['evidence-docs', 'seo-llmo']);
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
