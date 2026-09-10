# agent-sync

Назначение: Claims shared resources и журнал координации.

Вход: resource set, owner session, expiry. Выход: claim grant, generation/fence, renew/release receipts. Файл защищается ресурсным claim, не только названием задачи.

Граница: Agent-sync не заменяет scheduler и не доказывает enforcement на host без hook. Все writer paths должны соблюдать один authority.

Source checkout: `repo://agent-sync`; HEAD `ef45d404d1604a9a0d142f983b5cccc495133ca0`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [execution](../contracts/execution.md), [install](../contracts/install.md).

Связанные находки:

- [SY-01: Выданные IDs меняются задним числом; два reserve возвращают один номер](../../packets/FIX-SY-01.md)
- [SY-02: Общий last-renew позволяет активности одного агента подавлять продление чужих leases](../../packets/FIX-SY-02.md)
- [SY-03: Local renew перезаписывает уже завершённый steal](../../packets/FIX-SY-03.md)
- [SY-04: Task lease не защищает общий файл от владельца другой task lease](../../packets/FIX-SY-04.md)
- [SY-05: Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают](../../packets/FIX-SY-05.md)
- [SY-06: Одно gated смешивает lease guarantee, видимость и наличие host enforcement](../../packets/FIX-SY-06.md)
- [SY-07: Guard охватывает редактор и некоторые git commit, но не все записи через shell](../../packets/FIX-SY-07.md)
- [SY-08: Поиск task-pipeline не учитывает native Codex plugin cache](../../packets/FIX-SY-08.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
