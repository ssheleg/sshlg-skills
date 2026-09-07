# sheleg-design

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.

Source checkout: `repo://sheleg-design`; HEAD `562786b30f07f50a294d70a4c3ffd40794624f42`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [visual](../contracts/visual.md), [product](../contracts/product.md).

Связанные находки:

- [DS-01: Сравнение packs сменой CSS не имеет общего token API](../../packets/FIX-DS-01.md)
- [DS-02: Опрос о значении craft превращён в нормативный порядок разработки](../../packets/FIX-DS-02.md)
- [DS-03: Производительность CSS/API описана абсолютами вместо проверяемых условий](../../packets/FIX-DS-03.md)
- [DS-04: Duration table допускает 500ms, общий UI gate запрещает >300ms](../../packets/FIX-DS-04.md)
- [DS-05: No-JS критерий применяется ко всем поверхностям, включая внутренние UI](../../packets/FIX-DS-05.md)
- [DS-06: Eval-регрессия не покрывает текущий composition/runtime](../../packets/FIX-DS-06.md)
- [VD-01: Идентичность фиксируется раньше визуального исследования, а наличие системы закрывает допустимый поиск композиции](../../packets/FIX-VD-01.md)
- [VD-02: Скриншоты и quality gates есть, но нет обязательного цикла художественной критики конкретного рендера](../../packets/FIX-VD-02.md)
- [VD-03: Mobile/native ветка не завершена платформенным адаптером, а общий product default остаётся вебовым](../../packets/FIX-VD-03.md)
- [VD-04: shadcn назван unstyled: token mapping ошибочно подаётся как достаточное отсутствие чужой визуальной системы](../../packets/FIX-VD-04.md)
- [VD-05: Общий kit spine фиксирует внешний API ценой базовой DOM-семантики и доступных адаптаций](../../packets/FIX-VD-05.md)
- [VD-06: Dials дают числовой ритуал без воспроизводимой визуальной калибровки двух осей](../../packets/FIX-VD-06.md)
- [VD-07: Каталог внешнего frontend-design приписывает найденному skill запреты, которых его текущий файл не содержит](../../packets/FIX-VD-07.md)
- [UP-05: Перезапись member/runtime не атомарна и не даёт rollback](../../packets/FIX-UP-05.md)
- [UP-07: Updater не управляет native Codex plugin provider и не проверяет active digest](../../packets/FIX-UP-07.md)
- [UP-08: Host roots фиксированы и расходятся с поддерживаемыми overrides](../../packets/FIX-UP-08.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
