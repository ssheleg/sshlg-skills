# FIX-UX-04.01 — У одного скилла два несовместимых правила владения strings.md

Parent `FIX-UX-04` · implementation · P2

## Что и зачем

У одного скилла два несовместимых правила владения strings.md

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md`

implementation; exact local source path. SHA256: `949c791580f343dae6bf354c06e5b0e43e393d8170591c2833e2671a8e7513b9`

```text
21: **The opt-out is spoken, never assumed:** **"no brand"** / **«без бренда»** —
22: or **"draft it"** / **«черновиком»** — is the operator declining this route:
23: write directly and say the pack was skipped on request, never skip it silently.
24:
25: **This skill never writes to `docs/brand/`.** A term that is missing from the
26: dictionary, or a number with no row in `facts.md`, is **reported** — never
27: invented to finish the sentence. Adding it is `brand-voice`'s decision.
28:
29: ## References
30:
31: | Read | When |
32: |---|---|
33: | [ui-copy.md](references/ui-copy.md) | any string inside the product |
34: | [marketing-copy.md](references/marketing-copy.md) | pages, long form, the seven sweeps, grounding |
35: | [landing-pages.md](references/landing-pages.md) | assembling a landing page: the offer, awareness, proof, the action |
36: | [channel-playbooks.md](references/channel-playbooks.md) | a social, blog, changelog, ads or email surface |
37: | [store-copy.md](references/store-copy.md) | App Store or Google Play |
38: | [seo-aeo-safety.md](references/seo-aeo-safety.md) | anything a crawler or answer engine reads |
39: | [ai-tells.md](references/ai-tells.md) | every mode that produces text: the pass runs by default |
40: | [localization.md](references/localization.md) | any locale that is not primary |
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Разделить ownership по файлам: brand-voice владеет voice/terms/facts/channels/locale policy, copywriting пишет strings.md (proposed) и продуктовый текст. Общая схема явно разрешает эти mutations и claim при координации.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Изменение одного error string обновляет исходник и proposed row за один проход; voice/facts не меняются; нет дополнительного approval только из-за размещения strings.md.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-04.01.json), [parent](../parents/FIX-UX-04.json). Полный audit не required prompt input.
