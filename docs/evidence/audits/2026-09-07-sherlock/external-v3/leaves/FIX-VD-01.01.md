# FIX-VD-01.01 — Invariant/open-axis split

Parent `FIX-VD-01` · implementation · P1

## Что и зачем

Идентичность фиксируется раньше визуального исследования, а наличие системы закрывает допустимый поиск композиции

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
76:    a static, fully-legible page. The effect is a bonus, never a dependency.
77:
78: ## Style packs
79:
80: The visual identity comes from a style pack. Before choosing one, read
81: [the style-pack index](./STYLE_PACK_INDEX.md); then read the chosen pack in full
82: and copy its token layer from `styles/tokens/<pack>.css`. Do not transcribe token
83: tables or infer values from screenshots.
84:
85: A materialized kit supplies component states:
86:
87: ```bash
88: npx sheleg-design-skill --kit <pack>
89: ```
90:
91: The generated `src/styles.css` is authoritative for states a core pack leaves
92: open. A widened pack's kit and `## Components` section must agree. Where `npx`
93: is unreachable — no node, no registry — nothing is blocked: the chosen pack and
94: its token layer in `styles/tokens/<pack>.css` still carry the rules by reading,
95: but the component states only a kit materializes are then **unverified** — say
```

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`

implementation; exact local source path. SHA256: `245951a4a3adc9f52566b13cbb35b7e9548200e6d04fbf59a857502c4a442bf2`

```text
138:    visual language being set for the first time.
139:
140: ### When NOT to fork
141:
142: A token change. A spacing fix. A bug. A surface with a locked design system,
143: where the answer is *apply the system* and two variations are two ways of
144: disobeying it. Anything where the brief already determines the answer — forking
145: there does not explore a space, it manufactures a choice and then spends someone's
146: attention resolving it.
147:
148: ### How to run it
149:
150: Two subagents, launched together, each given:
151:
152: - the **same** brief from Act 1, verbatim,
153: - the **same** rubric, verbatim,
154: - **its own cast, declared and disjoint** — variation A on this pack's style pack
155:   and doctrine; variation B on the outside skills cast in Act 2,
156: - an instruction to produce a **working surface**, not a description of one,
157: - **no knowledge of the other variation.** They must not read each other's output,
```

### Create `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/VISUAL_EXPLORATION.md`

External-method enrichment owned by this outcome. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-01.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Brand lock фиксирует palette/logo/accessibility, но оставляет composition/type hierarchy/imagery open; exact Figma исключает exploration.

Уточнение XD-02: Число направлений пропорционально задаче: две для исследования, одна для уже явного решения.
Разделить invariants / open axes / hypothesis и назвать два направления с разной композицией.
Определить одинаковую scenario/state/viewport матрицу сравнения; разрешить один cast без нового skill.
Выбрать направление по аргументам и сохранению задачи; затем формализовать semantic tokens, записать отложенные решения.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Existing token file не запрещает два существенно разных direction renders; exact-Figma не генерирует варианты.
Refinement сохраняет identity, но допускает другой rhythm/composition в пределах scope.
Ни style pack, ни dials, ни число шрифтов не объявлены доказательством craft.
Выполнение возможно offline без concept roll/imagegen.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-01.01.json), [parent](../parents/FIX-VD-01.json). Полный audit не required prompt input.
