# FIX-RT-01.01 — Typed intent contract

Parent `FIX-RT-01` · implementation · P1

## Что и зачем

Лексический роутер теряет намерение и смешивает аудит с изменением

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/triggers.js`

implementation; exact local source path. SHA256: `6c9810816a3a85c44f8bbd265d4a38a6d80d793a2ba94e1b5cbc9b4995a84bcc`

```text
36:  * `почему`/`why` and friends are not merely weak positives — they are the
37:  * boundary itself. An explanation that gets routed through ten gates teaches
38:  * the operator to stop reading the injection.
39:  */
40: const QUESTION = [
41:   'что делает', 'что такое', 'как работает', 'почему', 'зачем', 'объясни',
42:   'расскажи', 'покажи', 'где находится', 'в чём разница', 'можно ли',
43:   'what does', 'what is', 'how does', 'why is', 'why does', 'explain',
44:   'show me', 'where is', 'what happens', 'is it possible', 'can you explain',
45: ];
46:
47: /** Saying the refusal phrase is the decision. The hook does not argue with it. */
48: const REFUSALS = [
49:   'без пайплайна', 'без сценариев', 'без бренда', 'без дизайна', 'без seo',
50:   'без доков', 'без make-skill', 'без координации', 'как есть', 'черновиком',
51:   'на словах', 'no pipeline',
52:   // `quick` and `as is` were here and are not any more, and the reason is a
53:   // measurement rather than taste. `optedOut` is ONE boolean for all twelve
54:   // routers, sticky for the session (`turnstate.js`) and silent — so a phrase
55:   // that fires by accident does not narrow the routing, it switches the whole
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-rt-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить intent/subject/effects/facets; regex возвращает кандидатов, не разрешение действия. Audit и change могут сосуществовать в разных clauses.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

RU/EN audit-only не разрешает запись; explain+fix сохраняет действие.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-RT-01.01.json), [parent](../parents/FIX-RT-01.json). Полный audit не required prompt input.
