# task-pipeline

Назначение: Планирование, декомпозиция, task graph, evidence и delivery.

Вход: brief, audit findings, module decisions, host capabilities. Выход: immutable execution packets и graph revisions; исполнение только через одного authority. evidence-docs и project-audit разделяют факт, дефект и неизвестный эффект.

Граница: Markdown continuity уже есть; lease/fencing, полноценного packet compiler и Fabric adapter сейчас нет.

Source checkout: `repo://task-pipeline`; HEAD `66487ce32e7d4548fdaf7405eba5a21b44bb86d5`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [context](../contracts/context.md), [execution](../contracts/execution.md).

Связанные находки:

- [TP-01: Обязательное интервью и подтверждение модели предшествуют даже полностью определённой работе](../../packets/FIX-TP-01.md)
- [TP-02: Заявленная независимость от companions противоречит обязательному super-ux и оценке «undesigned»](../../packets/FIX-TP-02.md)
- [TP-03: Расширяемая schema спорит с обязательными стандартными стадиями и глобальными правилами](../../packets/FIX-TP-03.md)
- [TP-04: Неиспользованное правило автоматически считается ненужным](../../packets/FIX-TP-04.md)
- [PA-01: Документированное решение автоматически оправдывает дефект](../../packets/FIX-PA-01.md)
- [PA-02: Отсутствие production измерения запрещает считать доказанный механизм дефектом](../../packets/FIX-PA-02.md)
- [PA-03: Опциональная HTML-страница обязательна в критерии выхода](../../packets/FIX-PA-03.md)
- [ED-01: Переносимость зависит от совместной упаковки соседнего task-pipeline](../../packets/FIX-ED-01.md)
- [EV-01: Проверка выбора названия не доказывает пользу выполнения скилла](../../packets/FIX-EV-01.md)
- [PF-01: Graph mutation lock не является claim узла или fencing исполнителя](../../packets/FIX-PF-01.md)
- [PF-02: Старое доказательство принимается после смены кода и контракта узла](../../packets/FIX-PF-02.md)
- [PF-03: Прямой close обходит проваленную обязательную certification](../../packets/FIX-PF-03.md)
- [PF-04: Parked обязательного producer делает его consumer runnable без payload](../../packets/FIX-PF-04.md)
- [PF-05: Saved Markdown brief уже есть, portable immutable node packet ещё нет](../../packets/FIX-PF-05.md)
- [PF-06: Fabric pipeline/skill provisioning из ADR не является существующим task-pipeline integration](../../packets/FIX-PF-06.md)
- [PF-07: Fabric chainAdvance повторно запускает follower, создавая новые задачи](../../packets/FIX-PF-07.md)
- [PF-08: Fabric fan-in проверяет каждое ребро отдельно, поэтому запускает неполный consumer](../../packets/FIX-PF-08.md)
- [PF-09: Fabric task lease не ограничивает публикацию handoff текущим owner/attempt](../../packets/FIX-PF-09.md)
- [PF-10: Provider-independent packet возможен, но Codex в текущем Fabric не подключён к его tools](../../packets/FIX-PF-10.md)
- [UP-05: Перезапись member/runtime не атомарна и не даёт rollback](../../packets/FIX-UP-05.md)
- [UP-08: Host roots фиксированы и расходятся с поддерживаемыми overrides](../../packets/FIX-UP-08.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
