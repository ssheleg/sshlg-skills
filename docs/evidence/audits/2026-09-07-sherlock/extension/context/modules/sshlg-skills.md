# sshlg-skills

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.

Source checkout: `repo://sshlg-skills`; HEAD `7ef37e8bd5220d6ab355346634ff19196de8f41b`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [install](../contracts/install.md), [routing](../contracts/routing.md).

Связанные находки:

- [RT-01: Лексический роутер теряет намерение и смешивает аудит с изменением](../../packets/FIX-RT-01.md)
- [RT-02: Отказ от одного маршрута выключает всю эскалацию; цитата тоже считается отказом](../../packets/FIX-RT-02.md)
- [RT-03: Toolkit объявляет доступность машины по инвентарю только Claude Code](../../packets/FIX-RT-03.md)
- [RT-04: Route gate принимает наличие pipeline run за доказательство любого пройденного маршрута](../../packets/FIX-RT-04.md)
- [UB-01: Аудитор bundle выдаёт расчёт стоимости каталога за фактический расход каждого сеанса](../../packets/FIX-UB-01.md)
- [VD-03: Mobile/native ветка не завершена платформенным адаптером, а общий product default остаётся вебовым](../../packets/FIX-VD-03.md)
- [VD-07: Каталог внешнего frontend-design приписывает найденному skill запреты, которых его текущий файл не содержит](../../packets/FIX-VD-07.md)
- [UP-01: Обещание закреплённого релиза семьи не обеспечено установкой](../../packets/FIX-UP-01.md)
- [UP-02: Принятый --dry-run всё равно запускает обновления и удаляет файлы](../../packets/FIX-UP-02.md)
- [UP-03: Выбор агента не ограничивает весь update](../../packets/FIX-UP-03.md)
- [UP-04: Prune удаляет единственную plain-копию по непроверенной записи registry](../../packets/FIX-UP-04.md)
- [UP-05: Перезапись member/runtime не атомарна и не даёт rollback](../../packets/FIX-UP-05.md)
- [UP-07: Updater не управляет native Codex plugin provider и не проверяет active digest](../../packets/FIX-UP-07.md)
- [UP-08: Host roots фиксированы и расходятся с поддерживаемыми overrides](../../packets/FIX-UP-08.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
