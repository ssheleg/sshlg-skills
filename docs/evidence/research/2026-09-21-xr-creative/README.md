<sub>ssheleg skills — make-skill · task-pipeline · evidence-docs · agent-harness · agent-interop</sub>

# XR, игровые движки и креативное производство в harness

Исследование и стратегия от 21 сентября 2026. **Результат этого этапа — аудит и 16 пакетов реализации.** Новые навыки ещё не выпущены, MCP не установлены, публичная версия Foundry не опубликована. Факты об исходниках, документированные возможности провайдеров и предлагаемые изменения разделены в материалах ниже.

## Дополнение: vLLM-Omni и изменения xr-dev

По следующему запросу добавлен [разбор vLLM-Omni](VLLM-OMNI.md) и **уже изменены исходники всех шести xr-dev навыков**: семь новых справочников и исправления опубликованы в [проверяемой ветке xr-dev](https://github.com/ssheleg/xr-dev/blob/584be61cafc965d8c4f1352747639c48e5cc968e/docs/evidence/verification/2026-09-21-platform-coverage/HANDOFF.md). [Карта дополнений и проверок](XR-COVERAGE.md) отделяет выполненные изменения от невыполненных проверок на модели/GPU/шлеме. Это ещё не релиз и не обновление установленного пакета.

vLLM-Omni предлагается как опциональный GPU-сервис за Foundry: сначала один тип генерации и измерение качества/стоимости, затем масштабирование. Добавлен P16; готовый адаптер или работающая установка здесь не заявлены.

## Что предлагается сделать

| Направление | Решение | Материал |
|---|---|---|
| Meta Quest / Horizon | Сохранить шесть владельцев xr-dev, исправить найденные ошибки и дополнить процедуры сборки, аудита, измерения и публикации | [Аудит XR и движков](XR.md) |
| Godot, Unity, Unreal | Новый пакет `game-dev`: `godot-development`, `godot-xr`, `unity-3d-vr-games`, `unreal-development` | [Границы навыков](ARCHITECTURE.md), P03–P06 |
| Графика и медиапроизводство | Новый пакет `creative-dev`: `creative-production`, `blender-production`, `ai-media-production` | [Инструменты и связки](CREATIVE.md), P02/P07/P12 |
| Asset Foundry | Развивать существующий сервис и его навык; сначала исправить переносимость, затем подготовить чистую публичную поставку | [Архитектура](ARCHITECTURE.md), P08–P11 |
| Harness / Observatory | Подключать проверенные релизы; сервисы устанавливать отдельно, наблюдение за Foundry сделать опциональным | P14–P15 |

Названия новых пакетов — предложение. `realtime-graphics`, отдельный аудионавык и новые провайдеры остаются кандидатами, пока проверка маршрутизации и реальные задачи не обоснуют отдельного владельца. Для аудио уже есть полезные HyperFrames/media-use/Foundry компоненты.

## Что изменило первоначальную картину

1. **xr-dev уже содержит хорошую основу.** Формальные проверки шести навыков проходят. Но есть шесть семантических находок: трактовка оценочных ограничений Spatial SDK, суммирование CPU/GPU времени, настройка MCP в обход шлюза, дрейф команд CLI, отсутствие выполненных поведенческих проверок и неполный путь без Meta companions. Подробности и источники — [XR](XR.md).
2. **Godot требует проверки версии и renderer.** Текущие официальные страницы дают разные рекомендации для Quest; в навыке нужна процедура выбора и проверки, а не вечная настройка из одного tutorial. Сборка самого движка — специальный путь, не обязательный старт проекта. [Источники и план](XR.md).
3. **App Lab больше нельзя описывать как отдельный актуальный канал.** Материалы переведены на современную схему Horizon Store, тестовые каналы и отдельные состояния загрузки, review и релиза. [Публикация](XR.md#publishing-and-distribution).
4. **Ваш HeyGen-форк — HyperFrames.** Проверен `sshlg/heygen-hyperframes-vr`: это открытый движок композиции/рендера, а не доказательство открытости моделей генерации HeyGen. [Разбор трёх продуктов](CREATIVE.md#heygen-distinguish-three-different-products).
5. **Blender MCP полезен для интерактивной работы, но не заменяет проверяемый production pipeline.** Нужны исходный `.blend`, скрипт, экспорт, повторный импорт и проверка в целевом движке. Для фоновых Foundry workers предлагается отдельный Blender Python/CLI путь. [Разбор Blender](CREATIVE.md#blender-mcp-concrete-capabilities-and-failure-boundaries).
6. **Foundry ещё нельзя считать готовой публичной поставкой.** В чистой установке воспроизведено отсутствие реестра в wheel. Найдено расхождение между построением адаптера и отчётом готовности. Приватные доказательства сохранены в его репозитории; публичный план не содержит операционных конфигураций. [Индекс передачи](HANDOFF.md).
7. **Заимствовать стоит процедуры и знания, а не чужие обязательные циклы.** GodotPrompter и claudedesignskills изучены на фиксированных коммитах; найденные полезные части и причины отказа от остальных перечислены в [таблице адаптации](CREATIVE.md#what-to-take-from-the-supplied-skill-repositories).

## Как читать и продолжать

- [BRIEF](BRIEF.md) — исходные требования XR-01…XR-08 и границы исследования.
- [XR](XR.md) — Meta Spatial SDK, Godot, Unity, Unreal, advanced XR, производительность, комфорт и Store.
- [CREATIVE](CREATIVE.md) — текущие навыки, Higgsfield, HeyGen, HyperFrames, Blender MCP, fal, ComfyUI, ElevenLabs, Runway, Recraft, Meshy/Tripo и обработка ассетов.
- [ARCHITECTURE](ARCHITECTURE.md) — владельцы, общие контракты, связка Foundry → Blender/медиа → движок/рендер → Observatory.
- [PACKETS](PACKETS.md) — 16 ограниченных задач: владелец, файлы, зависимости, изменения и проверяемые критерии готовности.
- [VERIFICATION](VERIFICATION.md) — что действительно проверено и что пока не проверялось.
- [HANDOFF](HANDOFF.md) — один вход для следующего агента, репозитории, ветки и точная следующая задача.

Машиночитаемые доказательства: [аудитор](mechanical-audit.json), [xr-dev inventory](xr-inventory.json), [установленные медианавыки](installed-creative-inventory.json), [upstream revisions](upstream-snapshots.json), [выборочные исходники и HTTP receipts](source-evidence.json). Проверка локальных ссылок/структуры выполняется скриптом [verify_report.py](verify_report.py).

Для новых навыков критерий успеха — агент может и создать небольшой работающий пример, и провести предметный аудит чужого проекта. Для ассетов — файл действительно импортируется, для видео — полный ролик воспроизводится, для Quest — отдельно есть доказательство на устройстве. Перечень библиотек сам по себе этого не подтверждает.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — audited skill packaging and upstream reuse
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — structured research and implementation packets
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — recorded sources checks and limits
- [`agent-harness`](https://github.com/ssheleg/agent-stack) — defined harness capability boundaries
- [`agent-interop`](https://github.com/ssheleg/agent-stack) — classified MCP and gateway connections
