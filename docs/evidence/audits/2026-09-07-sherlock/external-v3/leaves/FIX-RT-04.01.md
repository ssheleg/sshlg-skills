# FIX-RT-04.01 — Route gate принимает наличие pipeline run за доказательство любого пройденного маршрута

Parent `FIX-RT-04` · implementation · P2

## Что и зачем

Route gate принимает наличие pipeline run за доказательство любого пройденного маршрута

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/routegate.js`

implementation; exact local source path. SHA256: `e35b4a5046543ed95a0f89a1cb4c468a62e09f8a95a94d8167aad61169e19ef3`

```text
49:
50:   if (!TOOLS.includes(p.tool_name)) return null;
51:   if (s.optedOut) return null;
52:   if (s.asked) return null;
53:   if (o.runOpen) return null;
54:   if (!s.routes || !s.routes.length) return null;
55:   // A turn's classification belongs to that turn. Without this, a stale record
56:   // from a previous prompt would escalate a call nobody asked about.
57:   if (p.prompt_id && s.promptId && p.prompt_id !== s.promptId) return null;
58:
59:   return { reason: render(s.routes, o.lines) };
60: }
61:
62: /**
63:  * What the operator reads in the permission prompt.
64:  *
65:  * It names the route, what taking it costs, and the exact phrase that declines it
66:  * — because a prompt that only says "are you sure" teaches nothing and gets
67:  * answered the same way every time.
68:  */
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-rt-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Использовать receipt выбранного маршрута с task_id, skill_digest и допустимыми эффектами. Проверять нужный маршрут, а не существование чужого run.md. Не превращать это в новое подтверждение каждого обратимого действия.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Read-only audit с receipt не запрашивает pipeline; старый run не разрешает новую несвязанную публикацию; все bypass/degraded поверхности явно перечислены.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-RT-01.01` (data): Gate проверяет typed RouteDecision, а не любой существующий pipeline run.
- `FIX-RT-01.02` (data): Gate проверяет typed RouteDecision, а не любой существующий pipeline run.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-RT-04.01.json), [parent](../parents/FIX-RT-04.json). Полный audit не required prompt input.
