# seo-aeo-audit

Назначение: Диагностика публичных web surfaces для поиска и извлечения.

Вход: public URLs, crawl/render evidence, claims. Выход: scoped findings, applicability и source attribution.

Граница: Рекомендация поисковой системы не универсальный gate; absence of production effect не стирает наблюдаемый механизм.

Source checkout: `repo://seo-aeo-audit`; HEAD `db261482a520df1b7373283955921f1282de866d`. Это база аудита, patches лежат в отдельных worktrees.

Общие контракты: [evidence](../contracts/evidence.md), [product](../contracts/product.md).

Связанные находки:

- [SE-01: Рекомендации Discover превращены в обязательный gate](../../packets/FIX-SE-01.md)
- [SE-02: Любая manual action объявлена обнулением всех улучшений сайта](../../packets/FIX-SE-02.md)
- [SE-03: Cross-track проверка объявляет совместимые наблюдения противоречием](../../packets/FIX-SE-03.md)
- [SE-04: Тип источника автоматически подменяет силу конкретного утверждения](../../packets/FIX-SE-04.md)
- [EV-01: Проверка выбора названия не доказывает пользу выполнения скилла](../../packets/FIX-EV-01.md)

Upstream: [program](../program.md), [decisions](../decisions.json). Изменение public interface пересобирает пакеты consumers; сведения о реализации подтверждаются evidence в соответствующей задаче.
