# make-skill

Назначение: Стандарт конструкции, валидаторы, упаковка и scope аудита.

Вход: skill/plugin, target host, declared operation. Выход: conformance receipt со scope/version/limitations. Audit не повышает полномочия до release.

Граница: Синтаксический PASS не доказывает смысл, качество результата или безопасность. Tokens должны измеряться подходящим tokenizer.

Source checkout: `repo://make-skill`; HEAD `015052149a9c62a8a69e18a2a5dd6bf2f6e8196a`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [evidence](../contracts/evidence.md), [install](../contracts/install.md).

Связанные находки:

- [MS-01: Приближение chars/3.9 выдаёт PASS токенового лимита](../../packets/FIX-MS-01.md)
- [MS-02: Самодельный YAML parser теряет типы metadata](../../packets/FIX-MS-02.md)
- [MS-03: Аудит по описанию автоматически превращается в исправление и release](../../packets/FIX-MS-03.md)
- [MS-04: Платформенные ограничения описаны как универсальные и частично устарели](../../packets/FIX-MS-04.md)
- [ED-01: Переносимость зависит от совместной упаковки соседнего task-pipeline](../../packets/FIX-ED-01.md)
- [EV-01: Проверка выбора названия не доказывает пользу выполнения скилла](../../packets/FIX-EV-01.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
