# FIX-DS-02.01 — Опрос о значении craft превращён в нормативный порядок разработки

Parent `FIX-DS-02` · implementation · P2

## Что и зачем

Опрос о значении craft превращён в нормативный порядок разработки

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`

implementation; exact local source path. SHA256: `5d7201ddf9c006dd7709b18789e4a68589c6d72b3fad8a7ba90e68a2d4f65b2c`

```text
150: half-build motion that stalls. Several packs pin their own ceiling and say so in
151: their Register. The table, the per-pack ceilings and why each one is where it is:
152: [`MOTION_DOCTRINE.md`](./MOTION_DOCTRINE.md) → *How the calibration dials bind*.
153:
154: ## The craft bar — what "done" means, in order
155:
156: When anyone can prompt their way to a prototype, craft is the only
157: differentiator left. Designers rank what it means (Figma, *State of the
158: Designer 2026*, n=906): **visual polish 58% · thoughtful problem solving 47% ·
159: clear intuitive UX 36% · emotion and delight 35% · consistency 15%.** Read that
160: as a definition of done, in that order:
161:
162: 1. **Polish** — the pack applied without exception: tokens, not literals; no
163:    ad-hoc hex, radius or font size anywhere in the diff.
164: 2. **Systems thinking** — the visual decision lives in one place (the token
165:    layer, the `SCENES` registry) and everything else reads it.
166: 3. **Clear UX** — structure and behavior are not this skill's half; if the
167:    flows and states aren't decided, stop and decide them first.
168: 4. **Emotion** — earned motion only (principle 4), and never at the cost of 1–3.
169: 5. **Consistency** — one ease, one duration set, one accent, one atom per job
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-ds-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Оставить опрос как контекст с точным смыслом и ссылкой; порядок gates вывести из dependency graph: задача/состояния/доступность/система/polish. Обязательный порядок обозначить как авторское решение, не вывод исследования. Источник: https://www.figma.com/blog/state-of-the-designer-2026/ .

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Вопрос «что доказывает 58%?» возвращает association in survey, не причинный эффект/priority. Brief со сломанной основной задачей сначала решает её даже при идеальных токенах.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DS-02.01.json), [parent](../parents/FIX-DS-02.json). Полный audit не required prompt input.
