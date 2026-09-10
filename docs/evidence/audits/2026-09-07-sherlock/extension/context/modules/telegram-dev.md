# telegram-dev

Назначение: Bot API, MTProto и Mini Apps.

Вход: тип Telegram surface, официальный protocol contract. Выход: update processing/auth/launch/retry implementation с fixture receipts.

Граница: Claim до side effect не означает completed update. Подпись проверяется по независимому oracle; retries ограничены общим бюджетом.

Source checkout: `repo://telegram-dev`; HEAD `0263b899e5827c65d366d2bbac73557a56045235`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [integration](../contracts/integration.md), [evidence](../contracts/evidence.md).

Связанные находки:

- [DV-16: Правила восстановления дают противоположные действия для отозванной сессии](../../packets/FIX-DV-16.md)
- [TG-01: Crash fixture зелёный, но после реальной redelivery update теряется](../../packets/FIX-TG-01.md)
- [TG-02: Оmitted allowed_updates ошибочно приравнен к пустому списку](../../packets/FIX-TG-02.md)
- [TG-03: HMAC verifier удаляет поле signature и воспроизводит эту ошибку в собственном oracle](../../packets/FIX-TG-03.md)
- [TG-04: Матрица launch surfaces неверно запрещает menu-button query flow](../../packets/FIX-TG-04.md)
- [TG-05: Лимит одного FloodWait не ограничивает бесконечную retry sequence](../../packets/FIX-TG-05.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
