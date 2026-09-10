# FIX-EV-01.23 — Outcome corpus: agent-evals

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Create `repo://agent-stack/evals/cases/agent-evals.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-ev-01.23.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

AS-06: Первый релиз фактически остаётся без исполняемого eval-корпуса — Greenfield feature с нулём production traces имеет минимум happy, adversarial и failure/retry trials; пустой корпус либо неисполненные observables не закрывают gate.

AS-07: Запрет проверки порядка пропускает подтверждение после действия — Перестановка двух независимых read calls проходит; перестановка confirm/charge или acquire/write обязана провалить тест. Отрицательный пример должен быть сохранён рядом с rubric.

AS-08: Статистические правила выдают предположения за универсальные границы — Граничные n=1,3 и p=0,1 не дают нулевую неопределённость; контрольные positive/negative correlation кейсы, paired и unpaired дизайны дают заранее вычисленные интервалы.

AS-09: OpenTelemetry: закрытый enum и неверное сложение вложенных token counters — Golden traces: total input=300, cached=40, total output=180, reasoning=50 остаются 480 total tokens, не570. Проверить billing join для каждого провайдера; custom op сохраняется без ложного ERROR.

AS-10: Повтор проверки старого ответа назван проверкой изменения решения модели — Мутация candidate на заведомо неверный tool должна менять результат gate; regrade old trace явно помечается не проверкой candidate.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для agent-evals записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; agent-evals не проходит лишь по названию. Недоступный live host = NOT_RUN.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-EV-01.01` (data): Uses common outcome manifest and honest result semantics.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.23.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
