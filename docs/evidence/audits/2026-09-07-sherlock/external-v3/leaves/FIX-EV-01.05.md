# FIX-EV-01.05 — Outcome corpus: ux-flows

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Create `repo://super-ux/evals/cases/ux-flows.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ev-01.05.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

UX-09: Воронки конкурентов из proxy превращаются в «proven base» — Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.

UX-10: Loading из существующей задержки превращён в инсценировку вычисления — Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.

UX-11: Figma fallback и provisional flow не доходят до разрешённого build state — Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.

UX-14: BP-212 ошибочно объявляет локальное тестирование оплаты невозможным — Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

UX-15: BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку — Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для ux-flows записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; ux-flows не проходит лишь по названию. Недоступный live host = NOT_RUN.

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

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.05.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
