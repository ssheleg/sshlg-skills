# FIX-VD-03.01 — Platform/renderer contract

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

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`

implementation; exact local source path. SHA256: `5d7201ddf9c006dd7709b18789e4a68589c6d72b3fad8a7ba90e68a2d4f65b2c`

```text
224: A style pack is a **token layer and a set of rules**. It does not ship a button.
225: Every product UI therefore needs a second decision the packs deliberately do not
226: make: which component kit draws the controls.
227:
228: **The default is `shadcn/ui`, and the question is asked once per project.** Ask it
229: the way `ux-foundation` asks the Figma question — once, at the point design work
230: starts, never per screen — and record the answer wherever the style pack is
231: recorded: with `super-ux` installed that is the screens record's *Design system*
232: line, and without it, whatever file names the pack. Default **yes**; a project
233: that already has a component layer has already answered, and migrating one on
234: taste is not a design decision.
235:
236: **Why it composes rather than competes.** `shadcn/ui` is not a theme. It is
237: unstyled primitives plus Tailwind, themed through CSS custom properties — so it
238: *consumes* a token layer instead of bringing its own look. That is exactly the
239: seam a pack is: the pack decides what `--bg` means, the kit decides what a
240: `DropdownMenu` is.
241:
242: **The two vocabularies are different, and this is the trap.** The packs resolve
243: `--bg` and `--ink` everywhere and little else by that name; `shadcn/ui` expects
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить ios-native/android-native/RN/web и HTML prototype; выбрать native-equivalent spec для web preview.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

SwiftUI route не получает Expo как единственный ответ; browser screenshot не native proof.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-03.01.json), [parent](../parents/FIX-VD-03.json). Полный audit не required prompt input.
