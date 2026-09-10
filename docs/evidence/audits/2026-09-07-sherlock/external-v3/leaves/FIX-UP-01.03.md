# FIX-UP-01.03 — Update observation states

Parent `FIX-UP-01` · implementation · P1

## Что и зачем

Обещание закреплённого релиза семьи не обеспечено установкой

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/updatemodel.js`

implementation; exact local source path. SHA256: `ff43743035a24c336ebbff6a8b9fc2340ac9de33eef78de0b37a2b1b79483dcb`

```text
12:  * official CLI. Measured here 2026-08-28: of 20 marketplaces on one machine, the 2
13:  * installed by that tool carry `autoUpdate: true` and 18 have no such key, because
14:  * `claude plugin marketplace add` never sets it.
15:  *
16:  * **This family leaves it off deliberately, and that is the part worth writing down.**
17:  * The nine packs are released and pinned as a set; `skills.json` says which versions belong
18:  * together and the launcher refuses a per-member argument for the same reason. Per-
19:  * marketplace auto-update updates each one on its own clock, so a machine drifts into a
20:  * combination nobody tested — which is precisely the failure the launcher exists to
21:  * prevent. For a pack that stands alone the flag is the better answer; for a family that
22:  * composes it is not.
23:  *
24:  * So the installer states the model, and reports it when somebody has turned the flag on
25:  * behind its back. Reporting rather than reverting: the file belongs to the operator and
26:  * to Claude Code, and silently rewriting somebody's setting is how a tool loses trust.
27:  */
28:
29: const FAMILY_LINE = 'npx sshlg-skills@latest update';
30:
31: /** The notice, as lines. Pure — no filesystem, no HOME, so a fixture can read every word. */
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-up-01.03.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Enabled/disabled/unknown и checked_at/source; network/parse failure не current/OFF.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Error fixture даёт CHECK_ERROR/UNKNOWN без зелёной current строки.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-01.02` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-01.03.json), [parent](../parents/FIX-UP-01.json). Полный audit не required prompt input.
