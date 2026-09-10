# agent-stack

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.

Source checkout: `repo://agent-stack`; HEAD `1f99f8f0914f122da1629e6ede6fd60a7e23d1ea`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [execution](../contracts/execution.md), [evidence](../contracts/evidence.md).

Связанные находки:

- [AS-01: Сага названа two-phase commit; неопределённый HTTP-исход предписано компенсировать как отказ](../../packets/FIX-AS-01.md)
- [AS-02: Нулевой baseline путается с отсутствующим: первый реальный расход теряется](../../packets/FIX-AS-02.md)
- [AS-03: Лексическое сходство усиливает противоречащую память и может вернуть старую инструкцию](../../packets/FIX-AS-03.md)
- [AS-04: Fake-edge test удаляет зависимости по управлению и состоянию, если нет явного payload](../../packets/FIX-AS-04.md)
- [AS-05: Аудируемость ошибочно приравнена к статическому графу](../../packets/FIX-AS-05.md)
- [AS-06: Первый релиз фактически остаётся без исполняемого eval-корпуса](../../packets/FIX-AS-06.md)
- [AS-07: Запрет проверки порядка пропускает подтверждение после действия](../../packets/FIX-AS-07.md)
- [AS-08: Статистические правила выдают предположения за универсальные границы](../../packets/FIX-AS-08.md)
- [AS-09: OpenTelemetry: закрытый enum и неверное сложение вложенных token counters](../../packets/FIX-AS-09.md)
- [AS-10: Повтор проверки старого ответа назван проверкой изменения решения модели](../../packets/FIX-AS-10.md)
- [AS-11: confirm:true и отсутствие одного элемента trifecta не являются доказательством безопасности](../../packets/FIX-AS-11.md)
- [AS-12: MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor](../../packets/FIX-AS-12.md)
- [AS-13: Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Tasks](../../packets/FIX-AS-13.md)
- [AS-14: Отсутствие evals ошибочно делает весь аудит unfalsifiable](../../packets/FIX-AS-14.md)
- [SY-04: Task lease не защищает общий файл от владельца другой task lease](../../packets/FIX-SY-04.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
