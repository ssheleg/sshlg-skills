---
report:
  id: sshlg-skills/2026-10-16-coding-agent-compatibility
  title: "Совместимость семьи с coding agents: гейты, правила, установщик — 2026-10-16"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-16
  status: active
  valid_until: 2026-11-16
  summary: >-
    Сверка hub 1.64.0 с текущей документацией 17 coding agents, найденных на этой машине
    (12 установлены, 5 только каталогами). Скиллы доходят везде: 39/39 там, где есть
    список хоста. Гейты (хуки) хаб ставит только Claude Code, хотя аналоги есть у Codex,
    Gemini, Kimi, Cursor, OpenCode, Hermes и Pi; в Cursor наши хуки Claude уже срабатывают
    без тестов. Правила оператора полностью доходили только до Claude: синхронизированы
    в ходе среза. 91 находка: 16 blocking, 44 deferred, 31 noise; 8 закрыты на машине,
    хаб должен 18 строк бэклога (B-201…B-218).
  sources:
    - name: "Consolidated findings, 91 rows with evidence, fix and status"
      path: raw/findings.json
      read_at: 2026-10-16
    - name: "Official documentation and source links, 80 entries"
      path: raw/sources.json
      read_at: 2026-10-16
    - name: "Hub source at 1.64.0 + docs"
      url: "https://github.com/ssheleg/sshlg-skills/commit/a5c1615"
      read_at: 2026-10-16
    - name: "Previous cut"
      path: ../2026-10-13-coding-agent-compatibility/README.md
  produced_by:
    agent: "Claude Code"
    task: HOSTCOMPAT-1016
  supersedes: [sshlg-skills/2026-10-13-coding-agent-compatibility]
  consumers: [sshlg-skills, operator]
---

<sub>ssheleg skills — evidence-docs · project-reports</sub>

# Совместимость с coding agents — гейты, правила, установщик (2026-10-16)

Прошлые срезы (09, 12, 13 октября) мерили в основном **файловый слой**: видит ли хост
39 скиллов семьи. Этот срез отвечает на вопрос оператора шире: работают ли **все правила
и гейты** в каждом установленном агенте, и правильно ли `install`/`update` ставит и
поддерживает скиллы, блок маршрутизации, правило ожидания, правила оператора, хуки и
видимость. Для каждого хоста прочитана его текущая официальная документация или исходник
установленной версии ([80 источников](raw/sources.json)).

Метод: семь независимых проверок (Claude Code; Codex; Gemini + Qwen; Cursor + Windsurf +
Kiro + Copilot; OpenCode + Kimi + Hermes + Goose; Pi + Continue + Droid + Warp + ZCode;
установщик/обновлятор). Все read-only по машине, кроме исправлений, перечисленных в
разделе «Сделано на машине». Модельные пробы — по одной ограниченной на хост, только где
есть вход: Claude (haiku, $0.0068), Codex (`codex exec`, read-only, из пустого каталога);
OpenCode, Kimi и Goose — против локальной заглушки модели на 127.0.0.1, без платного
ключа (снятый промпт — доказательство). Захваченные промпты содержат приватные инструкции
оператора и в репозиторий не попадают.

## Матрица

«Правила» — блок маршрутизации семьи и правила оператора в загружаемых инструкциях;
«до» — на начало среза, «после» — после исправлений на машине.

| Хост | Версия (последняя) | Скиллы | Правила до → после | Гейты хаба | Обновление |
|---|---|---|---|---|---|
| Claude Code | 2.1.299 (2.1.301) | 11 плагинов = pins; **19 из 39 видны без описания** (бюджет списка) | полные → полные | 8 хуков, совпадают с 2.1.299; проба: SessionStart и UserPromptSubmit сработали | работает; гейт версии пропускает только 2.1.x |
| Codex | 0.162.1 (0.163.0) | 39/39 ровно по разу; 3 плагина отстают от pins (B-188) | маршрутизация + часть → полные | нет, хотя у Codex есть хуки в формате Claude | реальный `update` выходит 1 (B-188) |
| Gemini CLI | 0.63.0 (0.64.0) | 39/39 `Enabled` | маршрутизация + часть → полные | нет (есть BeforeTool/SessionStart) | работает; неверная переменная переноса |
| Pi | 1.1.0 (1.3.0) | 39/39 по родному загрузчику | только маршрутизация → полные + правило ожидания | нет (extension API может блокировать) | правило ожидания не доходило до нового хоста |
| Cursor (cursor-agent) | 2026.09.02 (2026.10.14) | 39/39 по файлам; нет входа | маршрутизация + часть → полные | **наши хуки Claude срабатывают сами** (импорт из `~/.claude/settings.json`); 3 защиты молчат | работает; `.mdc` грузятся только для проектов под `$HOME` |
| OpenCode | 1.19.0 (1.19.3) | 39/39 | полные — через запасное чтение `~/.claude/CLAUDE.md` | нет | работает; держится на отсутствии своего AGENTS.md |
| Kimi Code | 2.1.1 (2.2.0) | 39/39; описания режутся до 250 символов | только секции Fabric → полные (временно, через `~/.agents/AGENTS.md`) | нет (есть `[[hooks]]`) | цели в хабе нет |
| Goose | 1.44.0 (1.54.0) | 39/39 из 525, скрытие не применяется | нет → полные (временно, через `~/.agents/AGENTS.md`) | нет | цели в хабе нет |
| Hermes | 0.21.4 (0.22.2) | 39/39; описания режутся до 57 символов | **нет → нет** (глобального файла инструкций нет) | нет | цели в хабе нет |
| ZCode.app | 3.14.4 | 39/39 по ссылкам | нет | нет | цели в хабе нет |
| Warp | AI выключен | 39/39 если включить | через `~/.agents/AGENTS.md` | нет | — |
| VS Code Copilot Chat | 0.48.1 | 39/39 через `~/.agents/skills` | полные — читает `~/.claude/CLAUDE.md` | нет | хаб не знает этого потребителя |
| Continue, Droid, Qwen, Windsurf, Kiro | не установлены | старые ссылки/копии в их каталогах | — | — | `update` копирует Continue без Continue |

## Главное

1. **Скиллы доходят везде, где хост их читает.** Таблица адаптеров `skills@1.7.2` = последняя
   опубликованная (`--verify-source`: 79 целей, digest совпадает); пути глобальных каталогов
   совпадают с текущей документацией всех установленных хостов. Офлайн-гейт: `npm test`
   exit 0, «PASS: 137 checks green», 2368 фикстур.
2. **Гейты есть только в Claude Code** (`lib/hooks.js:3`). У Codex, Gemini, Kimi, Cursor,
   OpenCode, Hermes и Pi есть собственный механизм блокировки вызова инструмента, но хаб
   его не использует, поэтому защита от чтения секретов, гигиена команд, repo gate и
   напоминания о маршруте там не действуют. Исключение — Cursor: он сам импортирует хуки из
   `~/.claude/settings.json`; защита от чтения секретов там срабатывает, MCP-защита,
   эскалация route gate и подсказки маршрута — нет (другие имена полей). Это не покрыто
   тестами, а README утверждает «hooks — Claude Code only».
3. **Правила оператора полностью были только в Claude.** Codex, Gemini, Pi и Cursor держали
   разные ручные копии; в Codex не было 5 основных секций и «No approval questions», в Pi —
   ничего, кроме блока семьи. Kimi, Goose и Hermes правил не получали вовсе. Причина —
   несколько ручных копий без единого источника. Исправлено на машине (ниже); механизм
   остаётся долгом хаба (B-207).
4. **Установщик ломается от чужого текста в управляемом блоке.** Строка оператора внутри
   `SSHLG:RULE:wait-is-not-a-stop` останавливает весь `update`/`install` с кодом 2 на
   всех хостах, не называя файл (`lib/wait-rules.js:66`, `bin/sshlg-skills.js:1591`);
   так и случилось сегодня с новым правилом про локальные артефакты, пока его не вынесли.
   Обновление блока маршрутизации, наоборот, **молча удаляет** текст оператора внутри
   секции роутера (`lib/routers.js:266-277`, `:370-371`) — воспроизведено во временном HOME.
5. **Claude Code:** описания одной семьи (32 546 символов) больше бюджета списка
   (30 000); с плагинами — 68 658 > 30 000, и 19 скиллов семьи модель видит без описания.
   `skillOverrides` не действует на скиллы плагинов, поэтому README:617 («hides every skill
   outside the usage core») неверен для них. Гейт версии в `lib/claude-pin-transaction.js:79-84`
   примет только 2.1.x — первая 2.2.x остановит обновление плагинов.

## Сделано на машине в ходе среза

Всё через бэкап; правила оператора — штатным писателем `blocks install` (журнал
`~/.sshlg-skills/managed-blocks/journal.jsonl`), источник — `~/.claude/CLAUDE.md`.

| Что | Как | Проверка |
|---|---|---|
| Правило «отчёты/артефакты только локально» вынесено из блока `wait-is-not-a-stop` в Claude/Codex/Gemini (из-за него падал `update`) | перенос секции перед маркером `BEGIN` | `rules` → unchanged; `blocks` → syntax valid |
| Блок `OPERATOR:GLOBAL-RULES` в Codex, Gemini, Pi — недостающие секции | `blocks install … --owner OPERATOR --apply` | сверка заголовков: 0 недостающих, 0 дублей на каждом хосте |
| `OBSERVATORY:AGENT-UPDATES` в Gemini и Pi | `blocks install … --owner OBSERVATORY --apply`, текст из Claude | то же |
| Правило ожидания в Pi | `npx sshlg-skills rules --apply --agent pi` | маркеры в `~/.pi/agent/AGENTS.md:358-398` |
| `~/.agents/AGENTS.md` для Kimi, Goose, Warp, Droid | симлинк на `~/.pi/agent/AGENTS.md` (файл ведёт хаб) | 0 недостающих секций; 40 821 байт (Kimi рекомендует ≤ 32 КиБ, только предупреждает) |
| Cursor: `operator-global-rules.mdc` (10 секций); `planning-workflow.mdc` убран в бэкап — требовал Superpowers вопреки записанным решениям | запись файла / перенос в `~/.sshlg-skills/backups/` | список `~/.cursor/rules` |
| Запрет облачных инструментов публикации (`Artifact`, `ArtifactData`, `ArtifactComments`, `mcp__claude_ai_Claude_Docs`) | `~/.claude/settings.json` `permissions.deny` | все три пути записи хаба в `settings.json` сохраняют чужие ключи (проверка Claude) |

## Долг хаба — строки бэклога

| Строка | Находки | Суть |
|---|---|---|
| B-201 | INST-1, INST-3 | чужой текст в блоке правила ожидания роняет весь `update` с кодом 2; `blocks` его не видит |
| B-202 | INST-2 | обновление маршрутизации молча стирает текст оператора внутри секций роутеров |
| B-203 | CLAUDE-2 | гейт версии Claude Code только 2.1.x |
| B-204 | GEMINI-1 | `GEMINI_CONFIG_DIR` не существует; Gemini использует `GEMINI_CLI_HOME` |
| B-205 | CLAUDE-1, GOOSE-2, PI-4, GEMINI-10, PI-6 | бюджет списка: 19/39 без описания в Claude; `visibility` не предупреждает; Goose пропускается молча |
| B-206 | INST-4, KIMI-1, GOOSE-1, HERMES-1, ZCODE-1, WINDSURF-1, KIRO-2, QWEN-1, OPENCODE-1/2, COPILOT-1, WARP-1 | цели инструкций для всех хостов, читающих глобальный файл; хаб-управляемый `~/.agents/AGENTS.md` вместо временного симлинка |
| B-207 | CODEX-1, GEMINI-2, PI-2, CURSOR-4 | правила оператора — один источник и рендер во все хосты с проверкой расхождения |
| B-208 | INST-5, PI-1 | включённое правило ожидания не распространяется на новый хост |
| B-209 | INST-13, CURSOR-2/3, CODEX-3, GEMINI-4, KIMI-3, OPENCODE-3, HERMES-4, PI-3, CONT-2 | адаптеры гейтов для хостов с хуками; первым — Cursor (уже срабатывает без тестов) |
| B-210 | CODEX-2, INST-6, CODEX-9 | (к B-188) фоновый `update` каждый раз FAILED; dry-run называет отложенными и плагины на pin |
| B-211 | CODEX-4 | хуки участников на правку файлов в Codex инертны (`apply_patch` без `file_path`) |
| B-212 | CODEX-6, INST-12, CLAUDE-3 | `context` неверно моделирует лимиты Codex и не видит порог 40 000 символов Claude |
| B-213 | CONT-1, CLI4-X1, GEMINI-8, CODEX-8, HUB-IDE-2 | `update --agent X` всегда добавляет 11 копий Continue, даже без Continue |
| B-214 | GEMINI-5, OPENCODE-4, INST-10 | дыры видимости: `/` в имени (Gemini), вложенные скиллы (OpenCode), id Kimi |
| B-215 | CURSOR-1, INST-7, INST-11, HUB-IDE-1, CODEX-10, CODEX-11 | README/документы: «пять каналов», «hooks — только Claude», Cursor-глобальность, Kimi, universal-адаптеры, ссылки Codex, `$name` |
| B-216 | INST-8, QWEN-2, DROID-1, CURSOR-7, WINDSURF-2 | неуправляемые семейные ссылки в каталогах хостов вне набора по умолчанию |
| B-217 | HERMES-3, KIMI-2, HERMES-2 | Hermes пишет через ссылки в общий `~/.agents/skills`; обрезка описаний 250/57 символов |
| B-218 | CLAUDE-5..9, INST-9, INST-14, OPENCODE-2 | мелочи и наблюдение за upstream (`--bare` по умолчанию, OpenCode 2) |

## Шаги оператора

- Войти в Gemini CLI (B-146) и задать доверенные папки (GEMINI-7): без них MCP не
  подключается, а headless-запуск прерывается.
- `cursor-agent login`, затем `cursor-agent update` (CURSOR-5) — после этого возможна проба.
- Обновить хосты по желанию: Claude 2.1.301 исправляет отказ правки артефактов при
  PreToolUse-хуке на Edit/Write; Goose отстаёт на 10 минорных версий.
- Решить судьбу секции «MCP на этой машине заводится в шлюзе» (`~/.codex/AGENTS.md`,
  `~/.cursor/rules/mcp-gateway.mdc`): по `~/CLAUDE.md` старый шлюз выведен, архивные
  маршруты не применяются. Не удалено — это решение оператора.
- `~/.claude/CLAUDE.md` — 626 строк / 40 058 символов, выше порога предупреждения Claude
  (40 000) и в 3 раза выше рекомендованных 200 строк (CLAUDE-3).

## Не проверено

- Модельный слой Gemini, Cursor, Hermes, Pi, ZCode: нет входа или проба небезопасна по
  стоимости. Для Pi системный промпт собран офлайн родным загрузчиком.
- Не установленные хосты (Continue, Droid, Qwen, Windsurf, Kiro, Copilot CLI) — только
  контракт по документации и состояние каталогов.
- Поведение модели (выбирает ли она нужный скилл) — вне этого среза.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — every claim pinned to file:line or a command or a doc link
- `project-reports` — dated cut superseding 2026-10-13 — not a skill this family ships

<sub>A star on [the bundle](https://github.com/ssheleg/sshlg-skills) helps.</sub>
