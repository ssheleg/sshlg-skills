---
report:
  id: sshlg-skills/2026-10-09-coding-agent-compatibility
  title: "Совместимость семейных скиллов с coding agents"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-09
  status: active
  valid_until: 2026-11-09
  summary: >-
    Проверены 38 скиллов в 11 пакетах и первичные контракты 29 семейств клиентов.
    Исправления затрагивают выбор глобальных целей установщика, автономность
    устанавливаемой папки и инструкции о возможностях хоста в пяти пакетах.
    Обнаружение скилла, активация плагина и проверка поведения разделены.
  sources:
    - name: "Dated primary source ledger: 47 entries"
      path: ../../evidence/host-compat/research/sources.json
    - name: "Additional primary source ledger: 24 entries, one unavailable body"
      path: ../../evidence/host-compat/research/additional-sources.json
    - name: "Final breadth ledger: Droid and Pi, 13 readable sources"
      path: ../../evidence/host-compat/research/extra-sources.json
    - name: "Pinned family payload census"
      path: ../../evidence/host-compat/portability/README.md
    - name: "Pinned installer source"
      url: https://github.com/vercel-labs/skills/blob/v1.5.25/src/agents.ts
      read_at: 2026-10-09
  produced_by:
    agent: Codex
    task: host-compat-20261009
  supersedes: []
  consumers: [make-skill, task-pipeline, agent-sync, super-ux, sheleg-dev]
---

<sub>ssheleg skills — make-skill · task-pipeline · agent-sync · evidence-docs · project-reports · openai-docs</sub>

# Совместимость с coding agents

Срез начат 2026-10-09, выпуск и локальная установка завершены 2026-10-10.
**Доставка: DELIVERED.** Точные версии, коммиты и выполненная установка
фиксируются в [едином delivery receipt](../../evidence/host-compat/delivery.json).
Этот отчёт не утверждает, что все возможности работают у всех клиентов.

## Что проверено

- Все **38 скиллов в 11 закреплённых пакетах**: 537 файлов исходного payload,
  формат, локальные ссылки и инструкции с привязкой к хосту. Исходный
  [census](../../evidence/host-compat/portability/README.md) сохраняет найденные
  проблемы; он не переписывается в якобы изначально чистый результат.
- **29 семейств клиентов**, **84 ссылки на первичные источники** (83 прочитаны;
  тело международной страницы TRAE недоступно): пути, приоритеты, формат,
  команды, делегирование, hooks и границы неизвестного. Полные
  [матрица](../../evidence/host-compat/research/host-matrix.json) и
  [первый список ссылок](../../evidence/host-compat/research/sources.json),
  [дополнительные 10 семейств](../../evidence/host-compat/research/additional-hosts.json)
  [24 дополнительные ссылки](../../evidence/host-compat/research/additional-sources.json),
  [Droid и Pi](../../evidence/host-compat/research/extra-hosts.json) и
  [их 13 источников](../../evidence/host-compat/research/extra-sources.json).
- Установщик `skills@1.5.25`: 79 идентификаторов, 77 глобальных целей;
  Eve и PromptScript поддерживают только проектную установку. Источник и
  воспроизводимая проверка — [HC-3](../../evidence/host-compat/installer-review.md).
- Локальные версии и доступное обнаружение проверяются отдельно. Модельные
  вызовы не запускались. Сохранность настроек проверена в явно указанном scope;
  изменение MCP относительно самого раннего снимка раскрыто отдельно ниже.

## Матрица адаптации

Ниже — основной путь, а не исчерпывающая таблица приоритетов. Источники каждой
строки и разрешённые неопределённости находятся в JSON-матрице выше.

| Клиент | Доставка / обнаружение семейных скиллов | Существенная граница |
|---|---|---|
| Claude Code | Нативные плагины; plain-копии не дублируются | JSON hooks, команды и определения агентов требуют активации плагина; строгий валидатор проверяет лишь часть metadata |
| Codex | Нативные плагины и общий `.agents/skills` с сохранением исключений дубликатов | `openai.yaml` и plugin manifest — собственный контракт; список файлов не доказывает активный session provider |
| Kimi Code | Общий `.agents/skills` или `$KIMI_CODE_HOME/skills` | Ветка 2.x использует `.kimi-code`; старые Python CLI пути не универсальны; hooks TOML |
| Hermes | `$HERMES_HOME/skills` | Общий home-каталог требует `external_dirs`; проектные скиллы требуют trust |
| Cursor | Общий `.agents/skills` и нативные roots | Порядок same-name кандидатов здесь не установлен; remote/cloud — отдельная поверхность |
| Gemini CLI | Общий `.agents/skills` или `.gemini/skills` | Собственные invocation/extension правила |
| OpenCode | Общий `.agents/skills` или config/skills | Игнорирование поля не означает его исполнение |
| Windsurf / Devin Desktop | Общий и нативные roots по текущей документации | Текущие docs переименованы; legacy `.windsurf` остаётся отдельным случаем |
| GitHub Copilot | `.agents/skills`, `.copilot/skills` и проектные roots | Инструкции комбинируются; не переносить чужую модель приоритетов |
| Cline | `.cline/skills` | Документирован приоритет глобальных скиллов; общий `.agents` не подтверждён |
| Roo | `.agents/skills`, `.roo/skills`, режимные папки | Учитывать режим клиента |
| Kilo | `.agents/skills` или `.kilo/skills` | Старое `.kilocode` не общий актуальный контракт |
| Goose | Общий `.agents/skills` и config roots | Данные привязаны к проверенному исходному коммиту |
| OpenClaw | `<state-dir>/skills` | Общий `.agents` автоматически читается только при стандартном state-dir |
| Kiro | `.kiro/skills` | Общий `.agents` не подтверждён; CLI/IDE/cloud различаются |
| Zed | Прямые дочерние папки `.agents/skills` | Trust и лимит metadata; встроенный внешний агент использует свой loader |
| Amp | Несколько нативных/common roots | Нельзя обобщать правило «проект всегда выше global» |
| Continue | `.continue/skills`, отдельная установка с `--copy` | Проверенный loader пропускает дочерние симлинки; смешанная установка воспроизведена и исправлена |
| Qwen Code | Нативные `.qwen` roots | Общий global `.agents` не подтверждён |
| Antigravity | Отдельные пути IDE 2.0 и CLI | Legacy adapter не доказывает приём текущим клиентом |
| Warp | Нативный и общий формат по источникам | См. точные roots и ограничения в дополнительной матрице |
| Augment / Auggie | `.augment/skills` и совместимые roots | User `.augment` имеет приоритет над project |
| JetBrains Junie | `.junie` и общий `.agents` | Импорт сторонних roots и native discovery различаются |
| OpenHands | Предпочтительно `.agents`, поддерживаются legacy roots | Сохранять границы legacy формата |
| Mistral Vibe | Нативные roots по матрице | `allowed-tools` ограничивает инструменты; семантика отличается от Claude |
| TRAE | CN и международный клиент разделены | Международный контракт не установлен по недоступной странице |
| Aider | Явное чтение convention Markdown | Нативное обнаружение SKILL не установлено; AiderDesk — другой продукт |
| Factory Droid | Нативные `.factory` и общие `.agents` roots | Скиллы не регистрируют hooks и custom droids; installer использует общий root |
| Pi | Общий `.agents` и `$PI_CODING_AGENT_DIR/skills` | Порядок загрузки проверен по цепочке вызовов; subagents требуют расширения, симлинки поддержаны в проверенном исходнике |

Дополнительная матрица содержит точные пути, scope каждого клиента и ссылки;
неизвестные поля не превращены в обещание поддержки.

## Исправления

| Владелец | Подтверждённая проблема | Изменение и проверка |
|---|---|---|
| sshlg-skills | `--all` передавал wildcard вместе с global, включая неподдерживаемые цели и plain Claude | Явный snapshot: 76 целей с plugin-каналом Claude, 77 без него; неизвестные/project-only цели отклоняются до изменений. Регрессии сначала падали, затем прошли; проверен реальный argv и копируемый runtime |
| sshlg-skills / Continue | Смешанная установка создаёт симлинки, которые loader пропускает | Continue выделен в отдельный `--copy` вызов, включая pinned lock; порядок остальных целей сохранён. Реальный upstream CLI + pinned loader: single 1 / mixed 0 / copy 1 |
| make-skill | Обобщения «это бывает только у Claude», путаница текстовой подстановки и shell env, устаревшее отсутствие sync | Проверка capability каждого хоста; текущие Codex ссылки; versioned validator probe 0/1/0; условная односторонняя claude.ai sync; независимое review |
| task-pipeline | Обязательные verifier-файлы и audit-метод выходили за устанавливаемую папку | Локальные verifier-процедуры с проверкой точного тела; самостоятельный audit-method; offline JSON/HTML и JSON-only; независимость review не подменяется self-review |
| agent-sync | Жёсткий путь `.agents` и универсальное отрицание hooks | Путь от реально загруженного SKILL; native adapter проверяется отдельно; board lease arbitration не считается доказательством hook enforcement |
| sheleg-dev | Утверждение, что non-Claude не имеет MCP/команд и setup недоступен | Проверка shell/network/MCP/permissions по факту, подготовка конфигурации при ограничениях |
| super-ux | Обязательное параллельное делегирование без альтернативы | Последовательное покрытие тех же областей/сценариев при отсутствии subagents |

После разделения вызовов upstream также может создать обычную копию для
соседней группы из одной цели. Порядок целей и их флаги сохраняются; одинаковый
тип хранения (симлинк или папка) не обещается.

Остальные шесть пакетов не получили механического переписывания без найденной
проблемы. Две навигационные sibling-ссылки, при которых метод уже локален,
сохранены; семь обязательных выходов из payload устранены у владельцев.

## Повторная проверка после исправлений

[Окончательный срез исходников](../../evidence/host-compat/post-fix/README.md):
38 скиллов, 542 файла, 38 успешных запусков аудитора и 721 PASS.
Семь обязательных выходов за payload устранены. Оставшиеся две навигационные
ссылки и три примера в шаблоне перечислены явно; они не выданы за сломанные
зависимости. Этот срез проверяет исходники и не подменяет публикацию/установку.
После восстановления выпуска task-pipeline 1.90.2 [полная сверка payload](../../evidence/host-compat/post-fix/final-pin-equivalence.json)
подтвердила те же 542 файла, байты и Git-права у окончательных pins. Это
обоснованное повторное использование исходного аудита, а не ещё 721 новый тест.

## Выпуск и установка

Опубликованы **sshlg-skills 1.54.7**, make-skill 0.29.2, task-pipeline 1.90.2,
agent-sync 1.21.5, super-ux 0.59.1 и sheleg-dev 0.13.2.
[Registry-проверки](../../evidence/host-compat/releases/README.md) сверили
пакеты с точными Git-коммитами; у общего установщика совпали все 60 файлов.
Установочная команда опубликованной версии завершилась с кодом 0.
[134 сравнения](../../evidence/host-compat/local/installed-payloads.json)
подтвердили содержимое 38 общих,38 Hermes, 38 Continue копий, 11 плагинов
Claude и 9 уже существовавших нативных плагинов Codex.

[Свежие версии и обнаружение](../../evidence/host-compat/local/after.json):
Claude 2.1.296, Codex 0.162.1, Kimi 2.1.1, Hermes 0.21.4, Gemini 0.46.0,
OpenCode 1.18.10. Codex, Gemini, OpenCode и Hermes обнаружили все 38 семейных
скиллов. Для Kimi подтверждён документированный общий root и наличие файлов.
Continue source-helper увидел 38 папок после установки против 0 до неё.
Все 29 исключённых путей Codex остались прежними.

[Сохранность](../../evidence/host-compat/local/protected-preservation.json):
проверены семь конфигурационных путей, ручной текст четырёх инструкций
(включая Safari-first и webpilot), исходная рабочая папка и оба экспорта чатов.
Все 2874 старых файла в 37 версиях кэша Claude сохранили байты и права;
клиент добавил лишь пять меток `.orphaned_at`, поэтому полная идентичность
наборов файлов намеренно не заявляется. [Receipt кэша](../../evidence/host-compat/local/claude-cache-preservation.json).

Самое раннее сравнение конфигурации Codex вернуло FAIL: кроме ожидаемых
marketplace pins изменился MCP-раздел. [Сверка по времени](../../evidence/host-compat/local/config-reconciliation.json)
подтвердила, что MCP-изменение уже было в снимке до последнего нативного
обновления task-pipeline; после него и глобальной установки весь конфиг
побайтово одинаков. Причина раннего изменения не установлена; FAIL сохранён,
чужое состояние не откатывалось. За время задачи наблюдаемая версия Codex
сменилась с 0.162.0 на 0.162.1; обновление самого клиента эта задача не запускала.

## Локальное подтверждение и ограничения

[Readback](../../evidence/host-compat/local-readback.json) хранит только версии,
счётчики и семейные идентификаторы. Полные локальные конфиги/логи не публикуются.
Метки `NOT_RUN`, `NOT_ESTABLISHED` и отсутствие установленного CLI имеют разные
значения. Список SKILL.md и успешный CLI installer не доказывают выполнение
сценария агентом, доставку MCP или действие hook.

Новые копии не создаются там, где клиент уже читает общий каталог. Глобальные
инструкции не размножаются по всем хостам: Hermes persona и Kimi SYSTEM.md имеют
другой смысл. Обновления сохраняют прежние настройки и исключения Codex.

После обновления появились ошибки hooks; воспроизведён отказ запуска по
удалённым старым cache-путям. [Восстановлены точные прежние версии](../../evidence/host-compat/local/stale-cache-repair.json):
три изолированные startup-пробы перешли с 127 на 0; оператор подтвердил, что
новые сообщения об ошибках перестали появляться. Старые пути сохраняются до
завершения использующих их сессий; это не проверка всех сценариев hooks.

Дополнительное ограничение процесса выпуска: у make-skill 0.29.2, super-ux
0.59.1 и sheleg-dev 0.13.2 опубликованы lightweight-теги. Проверенные npm-пакеты
соответствуют исходникам, но `git describe` может показывать прежний annotated
тег. [Остаточная задача P2](../../evidence/host-compat/checks.json) требует
annotated-тега и проверки его типа при следующем обычном выпуске владельца;
уже публичные теги не переписываются.

## Следующее обслуживание

Повторить проверку при смене `skillsCli`, основной версии клиента или до
2026-11-09. Новый pin установщика обязан иметь совпадающий snapshot; расхождение
отклоняется до установки. Для обещания конкретного hook/делегирования необходим
отдельный нативный адаптер и наблюдаемая проверка его действия. Не маркировать
всю семью «проверено в runtime» на основании форматного аудита.

Следующая задача после этой доставки: предложенная ранее **VISIBILITY-1** —
отдельно оценить стоимость общего каталога сторонних скиллов; она не выполняется
скрыто в задаче совместимости.

## Источники и передача

[Единый читаемый список всех 84 ссылок по агентам](../../evidence/host-compat/research/SOURCES.md).

- [Первые 47 ссылок](../../evidence/host-compat/research/sources.json) и
  [ещё 24 ссылки с датами и статусом чтения](../../evidence/host-compat/research/additional-sources.json).
- [Droid и Pi: заключительный срез и 13 источников](../../evidence/host-compat/research/README-extra.md).
- [Дополнительное исследование и воспроизведение Continue](../../evidence/host-compat/research/README-additional.md).
- [Выводы исследования и противоречия источников](../../evidence/host-compat/research/README.md).
- [Единый план и границы задачи](../../evidence/host-compat/README.md).
- [Коммиты, релизы, registry и установленный payload](../../evidence/host-compat/delivery.json).

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — host capability and packaging corrections
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — isolated implementation and delivery
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — file ownership
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — verification receipts
- `project-reports` — durable compatibility report — not a skill this family ships
- `openai-docs` — official Codex contracts — not a skill this family ships
