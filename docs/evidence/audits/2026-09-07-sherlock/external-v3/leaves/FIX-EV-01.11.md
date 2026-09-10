# FIX-EV-01.11 — Outcome corpus: task-pipeline

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.


## Exact targets и source окна

### Create `repo://task-pipeline/evals/cases/task-pipeline.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://task-pipeline/test/audit_regressions/fix-ev-01.11.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

TP-01: Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе — Полный brief → 0 лишних вопросов, задача с реальным неоднозначным контрактом → один содержательный вопрос; отдельно измерить quality/time/tokens с baseline.

TP-02: Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned» — Без super-ux, но с валидными scenarios проходит контракт; без любого сценарного артефакта требует его создать; чужой дизайн оценивается по результату.

TP-03: Расширяемая schema спорит с обязательными стандартными стадиями и глобальными правилами — Трёхстадийный custom profile валиден и не получает дополнительные stage0/7/10; обязательные kernel invariants всё равно проверяются.

TP-04: Неиспользованное правило автоматически считается ненужным — Пять запусков без платежей не удаляют payment safety; истёкший временный workaround с проверенным заменяющим механизмом уходит в архив; все удаления объяснимы.

EV-01: Проверка выбора названия не доказывает пользу выполнения скилла — Каждый из 28 имеет опубликованный manifest сценариев и прогоны на заявленных supported hosts; trace доказывает загрузку и outcome, ухудшение не скрывается средним.

PF-01: Graph mutation lock не является claim узла или fencing исполнителя — Два claim одного node/version дают одного победителя; restart/expiry позволяет новый attempt, late old attempt не публикует result; независимые add сохраняются; недоступный lock не запускает external work.

PF-02: Старое доказательство принимается после смены кода и контракта узла — Старый verdict после v2 либо изменения check/REQ/packet получает STALE и graph byte-identical; downstream stale пересобирается; изменение независимого node не требует бессмысленной инвалидизации всего графа.

PF-03: Прямой close обходит проваленную обязательную certification — Fail любого обязательного gate не позволяет complete; изменение candidate сбрасывает certification; raw fabricated verdict или чужой attempt не проходит; authorized waiver не становится measured PASS.

PF-04: Parked обязательного producer делает его consumer runnable без payload — Park/cancel required producer не запускает consumer; optional skipped edge разрешён только с declared fallback; retry/replan создаёт новую provenance, coverage не объявляет parked requirement fulfilled.

PF-05: Saved Markdown brief уже есть, portable immutable node packet ещё нет — Planner process завершается; свежий executor другой runtime читает только packet и разрешённые artifact refs, выполняет task и выдаёт validated result; отсутствующий digest input → BLOCKED_INPUT; packet bytes доступны после session cleanup; воспроизведение не зависит от cwd/домашнего пути.

PF-06: Fabric pipeline/skill provisioning из ADR не является существующим task-pipeline integration — Golden import/export сохраняет REQ/node/typed edge/check/skills и manual gates; unsupported schema version явная ошибка; edit pipeline не меняет in-flight run; fresh host подтверждает bytes реально загруженного skill; planning agent не перепроходит grill для executors.

PF-07: Fabric chainAdvance повторно запускает follower, создавая новые задачи — Два ticks и два desktop workers дают один logical attempt; crash до/после spawn не теряет mapping и не повторяет completed work; retry получает новый attempt с predecessor; loop bound считает chain переходы.

PF-08: Fabric fan-in проверяет каждое ребро отдельно, поэтому запускает неполный consumer — Diamond: C running → zero spawn; оба done и all inputs → один spawn с report+schema; conflicting names → explicit conflict, не last-write-wins; один predecessor cancelled/parked → consumer blocked или declared fallback.

PF-09: Fabric task lease не ограничивает публикацию handoff текущим owner/attempt — СессияB не публикует за live ownerA; после takeover публикация старого A rejected; повтор same idempotency key возвращает тот же receipt; correction creates output version и инвалидирует подписанных consumers; read-only observers продолжают читать.

PF-10: Provider-independent packet возможен, но Codex в текущем Fabric не подключён к его tools — Один golden packet Claude/Codex executors: одинаковые contract inputs/outputs и authority restrictions; actual tool discovery/call receipt, cleanup/revoke; отрицательный unsupported host не запускается как supposedly connected. Не переносить native hidden reasoning/transcript между vendor runtimes.

UP-05: Перезапись member/runtime не атомарна и не даёт rollback — Fault injection на первом/среднем/последнем copy и rename сохраняет старую полностью рабочую generation или новую полностью проверенную.
SIGTERM после stage и до switch не меняет active; после switch journal позволяет rollback.
Проверка --force=false не перезаписывает existing Design shell files; --force=true создаёт recoverable generation.
Obsolete managed resources удаляются по manifest, неизвестные пользовательские файлы сохраняются.

UP-08: Host roots фиксированы и расходятся с поддерживаемыми overrides — Fixture custom CODEX_HOME/CLAUDE_CONFIG_DIR меняет только выбранный root, default stays byte-identical.
Plugin collision в custom root обнаруживается до записи; stale default root не блокирует другой профиль.
Windows/XDG/root-with-spaces и missing host дают отдельные протестированные results; неподдержанные платформы UNKNOWN.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для task-pipeline записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; task-pipeline не проходит лишь по названию. Недоступный live host = NOT_RUN.

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

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.11.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
