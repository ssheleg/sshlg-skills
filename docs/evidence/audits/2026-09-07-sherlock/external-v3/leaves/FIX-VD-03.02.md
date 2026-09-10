# FIX-VD-03.02 — Native state matrix

Parent `FIX-VD-03` · implementation · P1

## Что и зачем

Mobile/native ветка не завершена платформенным адаптером, а общий product default остаётся вебовым

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOBILE_SURFACES.md`

implementation; exact local source path. SHA256: `a65dc292c48868b0c5d1ca4ead4aad17d1c4dec32253ffe5e81ecab86b72031e`

```text
16: A style pack owns the **identity** of a mobile screen exactly as it owns a
17: desktop one: field, ink, the one accent, type voice, radii, motion tokens. None
18: of that changes because the viewport got smaller.
19:
20: A pack does **not** own **platform convention** — where the primary navigation
21: lives, whether a secondary view is a push or a sheet, which gestures are
22: expected to dismiss it, what the system does with the notch and the home
23: indicator. No pack in this library states any of it, and none should: convention
24: belongs to iOS, to Android, and to what the category's users have already been
25: trained on by every other app on their phone. This is the same shape as a
26: `Contract: core` pack declaring which sections it leaves to you — say out loud
27: that convention is your call, and do not read the pack's silence as permission
28: to invent.
29:
30: ## The six rules every pack already carries — and one no pack answers
31:
32: Rules 1–5 are not new. They are stated inside individual packs, where a reader
33: looking for *mobile* would not think to look, so they are collected here with
34: their homes named. Rule 6 is the opposite: nothing in this library answers it,
35: and pretending otherwise is worse than the gap.
```

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/AI_PRODUCT_PATTERNS.md`

implementation; exact local source path. SHA256: `c51fba0ba6dd8268313025f70fad65519e1f04eabf870df6a6167ff0f81e6182`

```text
3: Style packs cover how a product looks. This covers the surfaces that did not
4: exist when most design systems were written: a model streaming an answer, an
5: agent taking actions on someone's behalf, a result that might be wrong.
6:
7: Use it with the [`workbench`](./styles/workbench.md) pack — these are patterns
8: and states, not a palette. Every token named here is workbench's.
9:
10: > **The one rule everything below follows: honest state.** A model's output is
11: > uncertain, slow, occasionally refused, and sometimes wrong. An interface that
12: > hides any of those is not calmer — it is lying, and the user finds out later
13: > and trusts nothing afterwards.
14:
15: ---
16:
17: ## Contents
18:
19: - 1. The five states of a model call
20: - 2. Streaming beats spinners
21: - 3. Latency has two numbers
22: - 4. Provenance and uncertainty
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-03.02.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для sheet/input/keyboard/safe-area/restore перечислить expected native behavior и evidence status; AI states не требуют 10px mono.

Уточнение XD-08: Шаг primary verification обязателен только перед импортом конкретного нормативного числа.
Разделить web mobile, browser native-like prototype, native implementation.
Добавить target-specific nav/keyboard/insets/text-scale state matrix; числовые нормы проверить по текущим официальным источникам перед нормативной записью.
Фиксировать simulator/device type и prior settings; возвращать изменённые настройки к сохранённым значениям.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Context-sheet matrix покрывает keyboard/dismissal/restore; large text measured/unverified явно.
iOS shell не получает автоматически web Workbench и SF/Roboto dogma.
Browser prototype review заканчивается корректным scope, не native verified.
Настройки устройства не сбрасываются безусловно к 1.0.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-VD-03.01` (data): Consumes the preceding contract/state/API decision described in this outcome.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-03.02.json), [parent](../parents/FIX-VD-03.json). Полный audit не required prompt input.
