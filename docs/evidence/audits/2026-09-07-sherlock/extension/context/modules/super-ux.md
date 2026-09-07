# super-ux

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.

Source checkout: `repo://super-ux`; HEAD `a60f6b423c619b37a3bb43564b58b02b6200e463`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [product](../contracts/product.md), [evidence](../contracts/evidence.md).

Связанные находки:

- [UX-01: B030 не доказывает происхождение утверждения](../../packets/FIX-UX-01.md)
- [UX-02: B051 объявляет спамом текст без единого повторения](../../packets/FIX-UX-02.md)
- [UX-03: Humanization «никогда не блокирует» расходится с исполняемым B060](../../packets/FIX-UX-03.md)
- [UX-04: У одного скилла два несовместимых правила владения strings.md](../../packets/FIX-UX-04.md)
- [UX-05: Поведенческий eval выдаёт PASS проваленному процессу и не проверяет заявленный контракт](../../packets/FIX-UX-05.md)
- [UX-06: Новый проект Codex получает правило в CLAUDE.md](../../packets/FIX-UX-06.md)
- [UX-07: Язык vision и обязательный формат заголовков не согласованы на входе](../../packets/FIX-UX-07.md)
- [UX-08: Approval оператора может стереть происхождение предположения](../../packets/FIX-UX-08.md)
- [UX-09: Воронки конкурентов из proxy превращаются в «proven base»](../../packets/FIX-UX-09.md)
- [UX-10: Loading из существующей задержки превращён в инсценировку вычисления](../../packets/FIX-UX-10.md)
- [UX-11: Figma fallback и provisional flow не доходят до разрешённого build state](../../packets/FIX-UX-11.md)
- [UX-12: Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата](../../packets/FIX-UX-12.md)
- [UX-13: Общий precondition требует scenarios даже независимому copy/benchmark scope](../../packets/FIX-UX-13.md)
- [DS-06: Eval-регрессия не покрывает текущий composition/runtime](../../packets/FIX-DS-06.md)
- [UX-14: BP-212 ошибочно объявляет локальное тестирование оплаты невозможным](../../packets/FIX-UX-14.md)
- [UX-15: BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку](../../packets/FIX-UX-15.md)
- [VD-01: Идентичность фиксируется раньше визуального исследования, а наличие системы закрывает допустимый поиск композиции](../../packets/FIX-VD-01.md)
- [UP-06: Super-ux возвращает успешный exit code после неудачной установки](../../packets/FIX-UP-06.md)
- [UP-08: Host roots фиксированы и расходятся с поддерживаемыми overrides](../../packets/FIX-UP-08.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
