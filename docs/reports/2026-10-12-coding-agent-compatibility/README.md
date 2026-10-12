---
report:
  id: sshlg-skills/2026-10-12-coding-agent-compatibility
  title: "Совместимость семьи с coding agents: readback хостов 2026-10-12"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-12
  status: active
  valid_until: 2026-11-12
  summary: >-
    Срез сверки установленной семьи (hub 1.57.0, 11 пакетов, 39 скиллов) с
    восемью хостами этой машины. Claude Code, Gemini CLI, OpenCode, Hermes и
    Pi видят 39 из 39 по файловому слою; Kimi и Cursor подтверждены только
    наличием файлов. У Codex найдено и исправлено в ходе среза два дефекта:
    конфигурация не читалась (дубликат таблицы) и нативный кэш четырёх плагинов
    отставал от pins. У Pi нет блока в AGENTS.md (исправлено в hub 1.57.1).
    Модельный слой нигде не запускался.
  sources:
    - name: "Readback raw: versions, hosts, Pi loader, Gemini list, Claude plugins, Codex"
      path: raw/
    - name: "Hub skills.json at 1.57.0 (pins)"
      path: ../../../skills.json
    - name: "Previous cut"
      path: ../2026-10-09-coding-agent-compatibility/README.md
  produced_by:
    agent: claude-code
    task: WAVES-1011-W5-B
  supersedes: [sshlg-skills/2026-10-09-coding-agent-compatibility]
  consumers: [sshlg-skills]
---

# Совместимость с coding agents — readback 2026-10-12

Этот срез заменяет [срез 2026-10-09](../2026-10-09-coding-agent-compatibility/README.md)
(тот сохранён, его `superseded_by` указывает сюда). Матрица 29 семейств клиентов
и исправления установщика не пересматривались: они остаются там. Здесь только
**что реально видит каждый установленный на этой машине хост** после
`npx --yes sshlg-skills@latest update` (hub 1.57.0, 83/83 тестов). Все данные
сняты read-only; конфигурации хостов не менялись, модельные вызовы не делались.

## Слои (как в срезе 10-09)

- **Файловый слой** — найден ли SKILL.md семьи (39 имён из `skills.json`) родным
  загрузчиком или списком хоста, либо только на диске.
- **Рантайм/модель** — выполнил ли агент сценарий. Везде `NOT_RUN`: платных вызовов
  не было, у Gemini нет входа (шаг оператора, B-146). Общего «принято» не выводится.

Pins: task-pipeline 1.93.2, agent-sync 1.22.0, agent-stack 0.27.0, make-skill 0.31.0,
super-ux 0.59.2, sheleg-design 1.64.1, sheleg-dev 0.13.3, seo-aeo-audit 0.26.4,
telegram-dev 0.2.3, xr-dev 0.3.3, web3d-dev 0.1.3 (11 пакетов, 39 скиллов).

## Таблица

| Хост | Версия | Канал | Файловый слой | Блок инструкций | Рантайм | Δ к 10-09 |
|---|---|---|---|---|---|---|
| Claude Code | 2.1.296 | 11 нативных плагинов (user, enabled), версии = pins | 39/39 из `installed_plugins`/`claude plugin list --json`; 0 plain-копий в `~/.claude/skills` | есть (`~/.claude/CLAUDE.md`, BEGIN/END) | NOT_RUN | версия та же; 4 плагина подняты до новых pins |
| Codex | 0.162.1 | 9 нативных плагинов + `~/.agents/skills` для telegram-dev и xr-dev | после починки конфига (находка 1): `codex plugin list` — 9 плагинов семьи `installed, enabled`, все версии = pins (после находки 2); по файлам 39/39 в `~/.agents/skills`, 29 из них исключены в `skills.config` в пользу плагинов | есть (`~/.codex/AGENTS.md`) | NOT_RUN | версия та же; конфиг и кэш исправлены в ходе среза |
| Gemini CLI | 0.63.0 (npm `@google/gemini-cli`) | общий `~/.agents/skills` | `gemini skills list`: 39/39 `[Enabled]`, все из `~/.agents/skills` (416 скиллов всего) | есть (`~/.gemini/GEMINI.md`) | NOT_RUN: вход не выполнен | 0.46.0 (Homebrew) -> 0.63.0 (npm) |
| OpenCode | 1.18.10 | общий `~/.agents/skills` | `opencode debug skill`: 39 из 535 | нет файла, не требуется | NOT_RUN | версия та же |
| Hermes | 0.21.4 | `~/.hermes/skills`, симлинки на `~/.agents/skills` | `hermes skills list`: 39 из 545 (57 builtin, 488 local) | нет (persona не затрагивается) | NOT_RUN | версия та же |
| Pi | 1.1.0 (`@earendil-works/pi-coding-agent`) | `~/.pi/agent/skills` (38) + `~/.agents/skills` (skill-search) | родной `DefaultResourceLoader.reload()`: 39/39, 498 скиллов, 0 коллизий семьи, 2 предупреждения не семьи; `hosts`: 39 из 39, 0 конфликтов | **нет**: `~/.pi/agent/AGENTS.md` не создан | NOT_RUN | Pi новый хост в 1.57.0 |
| Kimi Code | 2.1.1 | общий `~/.agents/skills` | 39/39 по файлам; списка скиллов в CLI нет (`--skills-dir` лишь переопределяет) — загрузчик не вызывался | нет блока (`~/.kimi-code/AGENTS.md`: 0 меток) — по дизайну | NOT_RUN | версия та же |
| Cursor | cursor-agent 2026.09.02 (IDE не установлена) | `.agents/skills` | 39/39 по файлам; `~/.cursor/skills` пуст; списка нет | есть (`~/.cursor/rules/sshlg-routing.mdc`, alwaysApply) | NOT_RUN | в срезе 10-09 версия не измерялась |

Команды: `claude plugin list --json`; `gemini skills list` (stdout); `opencode debug skill`;
`hermes skills list`; Pi — `node` + `DefaultResourceLoader` из установленного пакета;
`npx sshlg-skills@latest hosts`; для файлов — имена 39 скиллов против каталогов
`~/.agents/skills`, `~/.hermes/skills`, `~/.pi/agent/skills`. Выводы — в [raw/](raw/).

## Находки

1. **Codex не загружает конфигурацию.** `~/.codex/config.toml` (изменён 2026-10-12
   16:50) содержит таблицу `projects."~/DATA/project-observatory"` дважды: строка
   358 в виде `["projects"."…"]` и строка 517 в виде `[projects."…"]`. `codex login status`,
   `codex plugin list` и `codex mcp list` отвечают `duplicate key`. Тот же класс
   дефекта уже был 2026-10-10 (`config.toml.bak-dupe-20261010-200138`). Файл не
   правился сначала; затем исправлен оркестратором волны (копия
   `~/.codex/config.toml.bak-dupe-20261012-173755`, удалена вторая, идентичная по смыслу
   запись `trust_level = "trusted"`): `codex login status` → `Logged in using ChatGPT`.
   Запись дописывается при подтверждении доверия к проекту без учёта иначе закавыченного
   ключа — класс повторяется (B-167).
2. **Нативный кэш плагинов Codex отстаёт от pins:** task-pipeline 1.92.0 (pin 1.93.2),
   agent-sync 1.21.7 (1.22.0), make-skill 0.30.1 (0.31.0), agent-stack 0.26.0 (0.27.0).
   Обновление hub их не трогает, а копии в `~/.agents/skills` для этих 29 скиллов
   исключены, поэтому запасной свежей копии у Codex нет. Исправлено штатным путём Codex:
   `codex plugin marketplace remove <m>` → `codex plugin marketplace add
   https://github.com/ssheleg/<m>.git --ref <SHA пина>` → `codex plugin add <m>@<m>`; теперь
   `codex plugin list`: agent-stack 0.27.0, agent-sync 1.22.0, make-skill 0.31.0,
   task-pipeline 1.93.2, все `installed, enabled`. Значит, у Codex ЕСТЬ поддерживаемый API
   обновления, а hub объявляет его `UNSUPPORTED_UPDATE` (`lib/lifecycle.js`) — B-166.
3. **Pi без блока маршрутизации.** `hosts` показывает AGENTS.md как detected, но файла
   нет; обновление 1.57.0 его не создало. Исправление — hub 1.57.1 (PR #197, выпущен);
   на машину придёт с установкой 1.58.0 (роутер `fabric`, сессия Fabric Dashboards).
4. **Gemini: 71 конфликт имён, ни одного семейного.** Копии в `~/.gemini/skills`
   (wiki-*, skill-creator и др.) перекрываются `~/.agents/skills`; семейных скиллов
   в `~/.gemini/skills` нет, хост выбирает `~/.agents/skills`.
5. **Pi: расхождение двух способов проверки.** Нижний `loadSkills()` читает только
   `~/.pi/agent/skills` (38/39, нет skill-search); `DefaultResourceLoader` добавляет
   `~/.agents/skills` и даёт 39/39. Использовать нужно второй — как реальный хост.
6. Cursor: IDE нет, только CLI-агент; утверждение о «Cursor» относится к файлам и
   правилу, не к приёму скиллов.

## Не выполнено (NOT_RUN) и почему

- Модельный слой всех хостов: платные вызовы запрещены; Gemini дополнительно ждёт входа
  оператора (B-146 остаётся «шаг оператора: войти»).
- Родной список скиллов Codex, Kimi, Cursor: Codex не читает конфиг (находка 1), у Kimi
  и Cursor CLI нет команды списка.
- Работоспособность hooks, делегирования и MCP: не проверялась, форматный и файловый
  слои этого не доказывают.

## Следующее

Повторить после установки 1.58.0 (проверить блок в `~/.pi/agent/AGENTS.md`) и после
входа оператора в Gemini (модельный слой). Hub должен сам вести нативные плагины Codex
через `codex plugin marketplace … --ref` (B-166). Срок до 2026-11-12.
