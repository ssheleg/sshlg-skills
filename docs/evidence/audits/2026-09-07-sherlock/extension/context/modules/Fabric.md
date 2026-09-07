# Fabric

Назначение: Durable authority и host execution adapter для планов.

Вход: exported graph revision + packets; выход: AttemptGrant, ResultEnvelope, IntegrationReceipt. Один из pipeline types может быть task-pipeline.

Граница: Исследована локальная кодовая база; production DB/live dispatch не проверялись. Не запускать одновременно graph.py и chainAdvance как два scheduler одного run.

Source checkout: `repo://fabric`; HEAD `91337391aa8d24966bf0c57db381e6fe63b48bce`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [execution](../contracts/execution.md), [context](../contracts/context.md).

Связанные находки:

- [PF-04: Parked обязательного producer делает его consumer runnable без payload](../../packets/FIX-PF-04.md)
- [PF-05: Saved Markdown brief уже есть, portable immutable node packet ещё нет](../../packets/FIX-PF-05.md)
- [PF-06: Fabric pipeline/skill provisioning из ADR не является существующим task-pipeline integration](../../packets/FIX-PF-06.md)
- [PF-07: Fabric chainAdvance повторно запускает follower, создавая новые задачи](../../packets/FIX-PF-07.md)
- [PF-08: Fabric fan-in проверяет каждое ребро отдельно, поэтому запускает неполный consumer](../../packets/FIX-PF-08.md)
- [PF-09: Fabric task lease не ограничивает публикацию handoff текущим owner/attempt](../../packets/FIX-PF-09.md)
- [PF-10: Provider-independent packet возможен, но Codex в текущем Fabric не подключён к его tools](../../packets/FIX-PF-10.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
