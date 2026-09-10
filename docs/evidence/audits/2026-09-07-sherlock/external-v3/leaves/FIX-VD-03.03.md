# FIX-VD-03.03 — Host/platform tool selection

Parent `FIX-VD-03` · implementation · P1

## Что и зачем

Mobile/native ветка не завершена платформенным адаптером, а общий product default остаётся вебовым

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/packs.js`

implementation; exact local source path. SHA256: `0f8ffe8e513e6ac996b57157e0963862659b683eccb2d5f9497c25380999c75f`

```text
72:   { id: 'tokens', asks: 'theme, palette, spacing and type scales', owner: 'sheleg-design' },
73:   { id: 'figma', asks: 'the design-to-code seam', owner: 'sheleg-design' },
74:   { id: 'copy', asks: 'how the surface sounds', owner: 'copywriting' },
75:   { id: 'implement', asks: 'the quality of the code that renders it', owner: null, fallback: 'web-design-guidelines', refusal: 'no markup review' },
76:   { id: 'mobile', asks: 'React Native and Expo surfaces', owner: null, fallback: 'vercel-react-native-skills', refusal: 'no mobile' },
77:   { id: 'verify', asks: 'what it actually looks like in a browser', owner: null, fallback: 'webapp-testing', refusal: 'not looked at' },
78:   {
79:     id: 'a11y',
80:     asks: 'whether it can be used at all',
81:     owner: null,
82:     fallback: 'accesslint',
83:     refusal: 'no a11y',
84:     // B-140 asked the family to choose: a router takes this lane, or the family says
85:     // permanently that it delegates it. It delegates it, and the reason is measured
86:     // rather than preferred — an eleventh router was tried and refused.
87:     delegated: true,
88:     standing: 'The family DELEGATES accessibility, permanently and on purpose. An '
89:       + 'eleventh router was the obvious answer and was measured to be the wrong one: '
90:       + 'the routing eval on 2026-08-31 stopped a block change because every arm '
91:       + 'widened routing on the silence probes — a new router costs precision across '
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-vd-03.03.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Pack resolver учитывает native capabilities и scoped fallback, не только web default.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Native request выбирает matching candidate, unsupported tool не fake native readiness.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-VD-03.02` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-03.03.json), [parent](../parents/FIX-VD-03.json). Полный audit не required prompt input.
