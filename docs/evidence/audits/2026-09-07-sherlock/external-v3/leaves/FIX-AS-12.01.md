# FIX-AS-12.01 — MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor

Parent `FIX-AS-12` · implementation · P2

## Что и зачем

MCP shipping example не закрепляет SDK и использует прежний FastMCP constructor

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Agent graph, prompts, evals, protocols, metering.

Вход: agent-system requirements и measured model/tool capabilities. Выход: typed execution graph, eval corpus, protocol adapters, usage receipts.

Граница: Не удалять control/resource edges. Saga не 2PC. Tool success и оценка prose не заменяют outcome evidence.


## Exact targets и source окна

### Edit `repo://agent-stack/plugins/agent-stack/skills/agent-interop/references/mcp-ship.md`

implementation; exact local source path. SHA256: `6136ea1b3b0a4db76c76e6e3023a1de2beae725e3596e67fc1a3400c9a850d38`

```text
1: # Shipping an MCP server — mount it, and debug the client that cannot reach it
2:
3: **Load this when:** the server is written and now has to reach someone — mounting it inside
4: an existing web app, or fixing a client that will not connect.
5:
6: **Spec pinned:** MCP `2026-07-28` transports; FastMCP/Starlette mounting shapes · read 2026-08-13
7:
8: `mcp.md` is the protocol. This file starts where that one stops, and covers the part that
9: is not in any specification: where the endpoint actually lands, and why the client says 404.
10: For **publishing** to the registry, see `registry.md`. For designing the tool set in the
11: first place, Anthropic's `mcp-server-dev` plugin is built for it and this file does not
12: repeat it.
13:
14: ## Contents
15:
16: - Mounting into an existing web app
17: - Auth middleware and a health endpoint
18: - Client configuration
19: - Debugging a client that will not connect
20:
```

Тестовый artifact: `repo://agent-stack/test/audit_regressions/fix-as-12.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. У каждого executable example назвать distribution, imports, tested version и lifecycle. Дать отдельные v2/current и v1 migration paths, health route с проверенным порядком registration. Проверять localhost protocol call, а не только наличие строки в markdown.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

В чистом env из pinned requirements пример запускается, health возвращает200, unauthenticated endpoint401, discovery/tools/list/tools/call проходят. Старый SDK либо поддержан отдельным fixture, либо явно out-of-scope.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-AS-12.01.json), [parent](../parents/FIX-AS-12.json). Полный audit не required prompt input.
