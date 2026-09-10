# Отбор внешних design/UX знаний для семьи ssheleg

Аудит на 2026-09-07. Это план выборочного переноса знаний, а не установка внешних skill-пакетов. Исходники и family repositories не изменялись; чужие scripts/hooks/binaries не выполнялись.

**Решение:** взять методику visual exploration → выбранное направление → semantic tokens → render critique → fix verification. Убрать чужие роутеры, непрерывные approval loops, догматические style bans и обязательный сетевой runtime. Прирост качества модели пока является проверяемой гипотезой.

## Зафиксированные источники

- **impeccable**: `4db7f6ba4b6ef661bc8a721261b691b40648c08a`, [исходник](https://github.com/pbakaus/impeccable/tree/4db7f6ba4b6ef661bc8a721261b691b40648c08a). Clone clean: True.
- **juliano-designer**: `c259656c76d9758d7ead46b0d2f125cbe84f8665`, [исходник](https://github.com/julianoczkowski/designer-skills/tree/c259656c76d9758d7ead46b0d2f125cbe84f8665). Clone clean: True.

Impeccable здесь — один umbrella skill v4.2.2 и 23 команды, а не 23 независимых SKILL.md. Есть дополнительные административные doctor/hooks/pin/unpin и alias teach; они не становятся новыми семейными entrypoints. Julian содержит 8 отдельных skills. Одноимённый Julian frontend-design не равен уже установленному на машине frontend-design: их запреты различаются.

## Лицензии и происхождение

**impeccable — Apache-2.0.** Если копируется/адаптируется охраняемый текст: приложить применимую лицензию, сохранить относящиеся notices/атрибуцию, заметно отметить изменения. Это запись требований источника, не юридическое заключение. Impeccable NOTICE указывает MIT-derived platform-design-skills (ehmo); исходный полный MIT notice ещё проверить перед заимствованием platform текста. [LICENSE:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/LICENSE:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/LICENSE#L1)

[NOTICE.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/NOTICE.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/NOTICE.md#L1)

**juliano-designer — Apache-2.0.** Если копируется/адаптируется охраняемый текст: приложить применимую лицензию, сохранить относящиеся notices/атрибуцию, заметно отметить изменения. Это запись требований источника, не юридическое заключение. Отдельный NOTICE в tracked inventory не найден; assets/fonts не включены в перенос. [LICENSE:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/LICENSE:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/LICENSE#L1)

## Dependency closure и исключения

Переносимые references должны замыкаться на локальные документы, существующие component/token contracts и доступный render capability. Сетевые источники сохраняются как provenance, не как boot-запрос. Если реального capture нет, возможна статическая работа с состоянием visual-unverified; никакой автоматической установки инструмента.

### D-01 · mandatory-original

Общий setup запускает launcher; при отсутствии binary launcher скачивает и запускает платформенный release. Checksum проверяется, но это всё равно внешняя исполняемая зависимость.

Исключена: новый reference использует только локальные документы/доступные capabilities, не зовёт внешний runtime.

[SKILL.md:19](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md:19) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md#L19) · [impeccable:91](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/scripts/impeccable:91) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/scripts/impeccable#L91) · [impeccable:117](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/scripts/impeccable:117) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/scripts/impeccable#L117) · [impeccable:133](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/scripts/impeccable:133) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/scripts/impeccable#L133)

### D-02 · new-work-original

Concept seed делает сетевой roll, загружает world cards, chosen event имеет opt-out telemetry. Это не чистая локальная markdown-эвристика.

Исключена: новый reference использует только локальные документы/доступные capabilities, не зовёт внешний runtime.

[concept_seed.rs:41](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/concept_seed.rs:41) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/concept_seed.rs#L41) · [concept_seed.rs:66](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/concept_seed.rs:66) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/concept_seed.rs#L66) · [concept_seed.rs:96](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/concept_seed.rs:96) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/concept_seed.rs#L96) · [new-work.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/new-work.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/new-work.md#L1)

### D-03 · conditional-original

CLI generate-image требует OPENAI_API_KEY; native image tool — иной доступный путь. Google Fonts rendering имеет сетевую зависимость. Ни один путь не обязателен в переносе.

Исключена: новый reference использует только локальные документы/доступные capabilities, не зовёт внешний runtime.

[generate_image.rs:269](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/generate_image.rs:269) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/generate_image.rs#L269) · [generate_image.rs:333](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/generate_image.rs:333) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/context/src/generate_image.rs#L333) · [font_render.rs:85](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/cli/src/font_render.rs:85) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/crates/cli/src/font_render.rs#L85)

### D-04 · host-original

Plugin hooks запускают binary при Edit/Write и Stop; playbooks называют AskUserQuestion, agent roles, provider paths и live server. Не импортировать hooks/config/runtime вместе с знаниями.

Исключена: новый reference использует только локальные документы/доступные capabilities, не зовёт внешний runtime.

[hooks.json:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/hooks/hooks.json:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/hooks/hooks.json#L1) · [hooks.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/hooks.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/hooks.md#L1) · [live-setup.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/live-setup.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/live-setup.md#L1) · [live.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/live.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/live.md#L1)

### D-05 · distribution-only

npm CLI объявляет Node >=22.18 и platform optionalDependencies. Девзависимости AI/browser относятся к разработке данного инструмента, их нельзя автоматически назвать обязательными зависимостями markdown-переноса.

Исключена: новый reference использует только локальные документы/доступные capabilities, не зовёт внешний runtime.

[package.json:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/package.json:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/package.json#L1)

### D-06 · julian-instructions

Julian — инструкции, но frontend body предписывает Google Fonts/CDN и рекомендует Framer Motion; design-review привязан к именованным MCP. README npx install — установка источника, не обязательный шаг для адаптации.

Исключена: новый reference использует только локальные документы/доступные capabilities, не зовёт внешний runtime.

[SKILL.md:23](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md:23) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md#L23) · [SKILL.md:25](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md:25) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md#L25) · [SKILL.md:38](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md:38) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md#L38) · [README.md:10](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/README.md:10) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/README.md#L10)

## Вердикт по каждому skill и command

adapt — перенести ограниченный метод; reference — справочный материал; reject — не брать workflow; optional — отдельная добровольная интеграция, не обязательный слой. Во всех adapt сохраняются семейные владельцы UX/design/copy/pipeline.

### I-00 · impeccable/impeccable — reference

**Взять:** Разделять назначение конкретной поверхности: принять решение, выполнить задачу, прочитать, пережить опыт. Существующая визуальная система — доказательство, отсутствие DESIGN.md не делает проект greenfield. Сохранять product truth при redesign.

**Исключить:** Не импортировать broad router, launcher context, PRODUCT.md/DESIGN.md как новых владельцев истины, обязательный craft-floor, глобальный потолок ровно двух QA-проходов. Не переносить право source/tool directives управлять агентом.

**Связь с аудитом:** VD-01, VD-02, VD-07. Идеи — в CREATIVE_DIRECTOR; маршрутизацией продолжает владеть sheleg-design.

[SKILL.md:19](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md:19) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md#L19) · [SKILL.md:33](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md:33) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md#L33) · [SKILL.md:15](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md:15) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md#L15)

### I-01 · impeccable/craft — reject

**Взять:** Ничего отдельного: deprecated alias new-work.

**Исключить:** Не создавать ещё один build entrypoint.

**Связь с аудитом:** route hygiene; отдельный дефект не заявляется. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[craft.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/craft.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/craft.md#L1-L5) · [craft.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/craft.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/craft.md#L1)

### I-02 · impeccable/shape — adapt

**Взять:** Перед визуалом зафиксировать задачу, функциональные сценарии, объём, ограничения существующего продукта; отделить UX-решение от поверхности.

**Исключить:** Не создавать параллельный super-ux процесс, surface-server, PRODUCT/brief authority и новые approval gates.

**Связь с аудитом:** UX-08, VD-01. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[shape.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/shape.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/shape.md#L1-L59)

### I-03 · impeccable/init — reject

**Взять:** Полезная мысль: repo inference остаётся гипотезой; durable context нужен. Это уже ответственность UX/brand.

**Исключить:** Обязательное создание PRODUCT.md и новое интервью; не считать timeout/инференс подтверждением пользователя.

**Связь с аудитом:** UX-08, UX-13. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[init.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/init.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/init.md#L1-L131)

### I-04 · impeccable/document — adapt

**Взять:** Документировать наблюдаемые роли и решения после рендера; различать обнаруженный факт, предложенный токен и placeholder. Указывать область, компоненты и источник значений.

**Исключить:** Новый обязательный DESIGN.md/8-heading формат, Stitch sidecar, внешний schema fetch; не генерировать фиктивные 5–10 компонентов или считать восстановленную палитру фактом.

**Связь с аудитом:** DS-01, VD-01, VD-04. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[document.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/document.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/document.md#L1-L416)

### I-05 · impeccable/extract — adapt

**Взять:** Разделять primitive/semantic/component roles; инвентаризировать повтор по назначению; сохранить API, доступность и визуальную паритетность при извлечении.

**Исключить:** Механическое правило количества повторов как обязательный порог; миграция на чужую библиотеку; создание токенов для каждого разового значения.

**Связь с аудитом:** DS-01, VD-05. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[extract.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/extract.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/extract.md#L1-L69)

### I-06 · impeccable/critique — adapt

**Взять:** Сначала независимое чтение фактического рендера, потом механические результаты. У находки есть видимое место, значение для задачи, исправление и проверка; сохранять удачные решения, разрешать disagreement с lint.

**Исключить:** Два обязательных агента/detect binary/overlay server; сумма Nielsen-оценок как ship authority; canned personas как реальные пользователи; универсальное ограничение числа вариантов и принудительные вопросы.

**Связь с аудитом:** VD-02, DS-02, VD-06. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[critique.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/critique.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/critique.md#L1-L806)

### I-07 · impeccable/audit — reference

**Взять:** Матрица областей проверки и evidence-scoped технический review. Нативная ветка явно отличается от web.

**Исключить:** Новый competing audit; не выдавать code reading за screenreader/performance runtime и не превращать detector taste в доступность.

**Связь с аудитом:** VD-02, VD-03. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[audit.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/audit.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/audit.md#L1-L136) · [audit.native.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/audit.native.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/audit.native.md#L1)

### I-08 · impeccable/polish — adapt

**Взять:** Классифицировать дефект: локальный, общий паттерн, отсутствующий токен, несоответствие концепции. Исправлять на верном уровне; повторно смотреть тот же сценарий после fix. Проверять свежесть review snapshot.

**Исключить:** Обязательный CLI snapshot, ritual handoff и бинарный detector; token alignment не заменяет художественный judgment.

**Связь с аудитом:** VD-02, DS-01, DS-02. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[polish.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/polish.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/polish.md#L1-L105)

### I-09 · impeccable/bolder — adapt

**Взять:** Усилить выбранную выразительную ось, сохранив основную задачу и соседние элементы; boldness оценивается по композиции, не числу эффектов.

**Исключить:** Не превращать любое усиление в смену бренда или обязательную покупку/генерацию assets.

**Связь с аудитом:** VD-01, VD-06. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[bolder.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/bolder.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/bolder.md#L1-L33)

### I-10 · impeccable/quieter — adapt

**Взять:** Найти источник конкурирующего внимания; уменьшать ненужную интенсивность, сохранять фокус и характер.

**Исключить:** Фиксированные проценты saturation/accent, запреты neutral gray и отдельных easing как универсальная истина.

**Связь с аудитом:** VD-06, DS-04. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[quieter.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/quieter.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/quieter.md#L1-L99)

### I-11 · impeccable/distill — reference

**Взять:** Удалять препятствия в выполнении задачи; проверять сохранность смысла и функций.

**Исключить:** Удаление половины текста, legal copy, шагов, рамок и цветов по числовой квоте; не менять требования ради минимализма.

**Связь с аудитом:** UX-08, VD-01. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[distill.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/distill.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/distill.md#L1-L111)

### I-12 · impeccable/harden — adapt

**Взять:** Матрица min/typical/max/empty/invalid content × locale × permissions × network × concurrent action. Draft preservation, recovery, logical layout, human-readable error.

**Исключить:** Не переносить raw error.message, production rapid clicks, универсальные truncation/no-JS, немецкий как всегда longest, байтовые эвристики emoji; тестировать fixture/sandbox.

**Связь с аудитом:** UX-10, UX-12, DS-05, VD-02. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[harden.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/harden.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/harden.md#L1-L336)

### I-13 · impeccable/onboard — adapt

**Взять:** Различать first use, cleared content, no results, permission denied и error; показать реальный первый успех, уважать skip/dismiss.

**Исключить:** Обязательная иллюстрация в каждом empty state, квота 3–7 шагов, installation Tippy/Intro/Shepherd, глобальный localStorage flag без user scope.

**Связь с аудитом:** UX-10, UX-12. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[onboard.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/onboard.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/onboard.md#L1-L234)

### I-14 · impeccable/animate — adapt

**Взять:** Обосновать motion изменением состояния; проверить interruption/replay/reduced-motion; сначала стандартные средства, измерять стоимость при необходимости.

**Исключить:** Жёсткие универсальные длительности/GPU-обещания и обязательная animation library. Не брать эффект ради демонстрации технической новизны.

**Связь с аудитом:** DS-03, DS-04, UX-10. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[animate.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/animate.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/animate.md#L1-L89)

### I-15 · impeccable/colorize — adapt

**Взять:** Сопоставить semantic color roles, пары foreground/background во всех состояниях, намерение accent. Сравнивать цвет в контексте реального рендера.

**Исключить:** Принудительный OKLCH rewrite, процентные рецепты, запрет нейтральных серых и семантика цвета без иной подсказки.

**Связь с аудитом:** DS-01, VD-06. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[colorize.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/colorize.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/colorize.md#L1-L86)

### I-16 · impeccable/typeset — adapt

**Взять:** Проверять роли, hierarchy, фактически загруженный face, measure, width/weight, язык, числовое выравнивание, fallback и длинный контент; одна семья может быть достаточна.

**Исключить:** Google Fonts/font detector как обязательные зависимости, запреты популярных/system fonts, фиксированное число семейств и размеры вне контекста.

**Связь с аудитом:** VD-02, VD-06. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[typeset.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/typeset.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/typeset.md#L1-L80)

### I-17 · impeccable/layout — adapt

**Взять:** Проверять порядок внимания, близость элементов, ритм, плотность по частоте использования, ширину контейнера и доступный фокус-порядок. Оптическую коррекцию делать после просмотра.

**Исключить:** Бездоказательные dials и универсальная запретительная грамматика cards/grids; не путать визуальную перестановку с изменением DOM-порядка.

**Связь с аудитом:** VD-01, VD-02, VD-06. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[layout.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/layout.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/layout.md#L1-L84)

### I-18 · impeccable/delight — adapt

**Взять:** Проверять связь жеста/эффекта с продуктом, повторное использование, стоимость времени и спокойную деградацию; removal test — останется ли смысл.

**Исключить:** Искусственная задержка ради впечатления вычисления, конфетти и пасхалки по умолчанию, обязательные внешние assets.

**Связь с аудитом:** UX-10, DS-04. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[delight.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/delight.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/delight.md#L1-L70)

### I-19 · impeccable/overdrive — optional

**Взять:** Каталог способов исследования выразительного эффекта, performance budget, removal test и fallback, только когда brief требует эффекта.

**Исключить:** Новые browser APIs/3D/libs как обязательная эстетика, непроверенная текущая compatibility matrix, широкая технологическая переделка.

**Связь с аудитом:** DS-03, VD-01. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[overdrive.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/overdrive.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/overdrive.md#L1-L127)

### I-20 · impeccable/clarify — adapt

**Взять:** Состояние → что произошло → что сохранилось → доступное действие и его последствия; согласованность терминов, целые локализуемые сообщения.

**Исключить:** Новый copy owner; произвольное сокращение юридических условий или фактов, изменение фактического состояния ради приятного текста.

**Связь с аудитом:** UX-01, UX-04, UX-10. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[clarify.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/clarify.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/clarify.md#L1-L94)

### I-21 · impeccable/adapt — adapt

**Взять:** Контекст использования важнее одного breakpoint: input, container, zoom, locale, safe areas, keyboard. На native применять системные паттерны и отдельные captures.

**Исключить:** Width не доказывает touch; не заменять любую таблицу карточками; не вводить обязательный набор библиотек или web-only template; font_scale восстанавливать в прежнее значение.

**Связь с аудитом:** VD-03, VD-05, VD-02. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[adapt.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/adapt.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/adapt.md#L1-L312) · [adapt.native.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/adapt.native.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/adapt.native.md#L1) · [ios.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/ios.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/ios.md#L1) · [android.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/android.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/android.md#L1)

### I-22 · impeccable/optimize — reference

**Взять:** Measure before/after и выявление bottleneck — материал для существующего frontend-performance, не новый owner.

**Исключить:** Не переносить lazy-loading hero из примера, ASCII-only font subset, запрет inline functions, обязательные CDN/мониторинг/новые библиотеки.

**Связь с аудитом:** DS-03. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[optimize.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/optimize.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/optimize.md#L1-L258)

### I-23 · impeccable/live — optional

**Взять:** Идея сравнивать варианты одного элемента на том же реальном контенте полезна. Можно реализовать существующими preview tools.

**Исключить:** Целый live runtime: server, inject scripts, listener/polling, launch CLI, tool _instructions как authority. Это отдельная opt-in интеграция вне обязательного плана.

**Связь с аудитом:** VD-02. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[live.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/live.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/live.md#L1-L325)

### J-01 · juliano-designer/grill-me — reference

**Взять:** Сначала искать ответы в проекте; для неопределённого решения предложить мотивированный default.

**Исключить:** Relentless interview и обход всех ветвей в каждом UI-task; обязательное ожидание ответов на обратимые детали.

**Связь с аудитом:** route hygiene; отдельный дефект не заявляется. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/grill-me/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/grill-me/SKILL.md#L1-L21) · [SKILL.md:3](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/grill-me/SKILL.md:3) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/grill-me/SKILL.md#L3)

### J-02 · juliano-designer/design-brief — adapt

**Взять:** Ограничения, non-goals, реальные/placeholder content, существующие компоненты, принципы опыта и ключевые взаимодействия.

**Исключить:** Новая .design authority и полное повторное интервью; reuse не означает запрет на доказанно необходимое исправление системы.

**Связь с аудитом:** UX-08, VD-01. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-brief/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-brief/SKILL.md#L1-L120) · [SKILL.md:31](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-brief/SKILL.md:31) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-brief/SKILL.md#L31) · [SKILL.md:19](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-brief/SKILL.md:19) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-brief/SKILL.md#L19)

### J-03 · juliano-designer/information-architecture — adapt

**Взять:** Navigation primary/secondary/utility, приоритет контента, URL/name consistency, рост структуры и конкретные переходы.

**Исключить:** Выбор feature по mtime; отдельная IA truth вне scenarios; предположение о 80% времени как установленное знание.

**Связь с аудитом:** UX-08, UX-12. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/information-architecture/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/information-architecture/SKILL.md#L1-L111)

### J-04 · juliano-designer/design-tokens — adapt

**Взять:** Каталог семантических color/state roles и расширение существующей системы вместо новой палитры на каждый экран.

**Исключить:** Tokens до исследования, latest-mtime selection, обязательный dark mode и фиксированные durations/breakpoints; не копировать всю naming schema в несовместимый CSS API.

**Связь с аудитом:** DS-01, DS-04, VD-01. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-tokens/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-tokens/SKILL.md#L1-L196) · [SKILL.md:27](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-tokens/SKILL.md:27) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-tokens/SKILL.md#L27) · [SKILL.md:150](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-tokens/SKILL.md:150) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-tokens/SKILL.md#L150)

### J-05 · juliano-designer/brief-to-tasks — adapt

**Взять:** Вертикальный срез с UI+style+interaction; reuse/modify/create, риск и визуальный приоритет; проверяемый собственный результат.

**Исключить:** Горизонтальный Foundation/Core/Interactions/Responsive template, запрет любой setup-задачи, feature selection по mtime. Пользоваться pipeline compiler.

**Связь с аудитом:** VD-02, UX-12. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md#L1-L74) · [SKILL.md:6](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md:6) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md#L6) · [SKILL.md:49](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md:49) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md#L49) · [SKILL.md:17](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md:17) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/brief-to-tasks/SKILL.md#L17)

### J-06 · juliano-designer/frontend-design — reference

**Взять:** Восемь именованных эстетических направлений как факультативные prompts для axes: hierarchy, grid, material, density, rhythm, motion. Проверять на конкретном brief.

**Исключить:** Универсальные Inter/Roboto/Arial/system bans, Google Fonts/CDN и Framer Motion, обязательный dark mode/two-font pairing, min-width-only; стилевые определения не объявлять культурной или исторической истиной.

**Связь с аудитом:** VD-01, VD-06, VD-07. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md#L1-L144) · [SKILL.md:23](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md:23) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md#L23) · [SKILL.md:3](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md:3) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/frontend-design/SKILL.md#L3)

### J-07 · juliano-designer/design-review — adapt

**Взять:** Смотреть фактические screenshots; сохранять filename/viewport/page/state, actual font loading, overflow, layering и состояния. Указывать must-fix и evidence.

**Исключить:** Жёсткий приоритет конкретных MCP вместо capability; обязательное ожидание user screenshots при доступных иных средствах; 375/768/1280 как универсальная полнота.

**Связь с аудитом:** VD-02, VD-03, UX-12. Собственная краткая reference-методика в существующем owner skill; не новый entrypoint, не установка внешнего skill.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md#L1-L249) · [SKILL.md:35](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md:35) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md#L35) · [SKILL.md:48](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md:48) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md#L48) · [SKILL.md:112](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md:112) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md#L112)

### J-08 · juliano-designer/design-flow — reject

**Взять:** Полезная последовательность brief→structure→build→review уже есть у семьи.

**Исключить:** Конкурирующий pipeline; confirmation после каждого шага и task; review только on request оставляет finish без обязательного доказательства рендера.

**Связь с аудитом:** VD-02, UX-12. Не включать в обязательный маршрут; использовать только в указанном ограниченном качестве.

[SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-flow/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-flow/SKILL.md#L1-L124) · [SKILL.md:80](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-flow/SKILL.md:80) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-flow/SKILL.md#L80) · [SKILL.md:95](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-flow/SKILL.md:95) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-flow/SKILL.md#L95)

## Глубокие reference-кандидаты

### K-DIR · new-work / operate

Сохранение действующей идентичности не закрывает исследование композиции. Открытые оси и инварианты объявляются отдельно; сравнить две действительно разные композиции одной и той же задачи и контента одним cast; lock semantic values после выбранного направления.

Не переносить: Concept-seed lottery/API, обязательные 7 кандидатов/3 изображения, generated-image default, непроверенный score 0.72, approval из недоступности question tools, лимит SVG и запреты шрифтов.

Закрываемые проблемы: VD-01, VD-02, VD-06.

[new-work.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/new-work.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/new-work.md#L1) · [operate.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/operate.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/operate.md#L1)

### K-EVID · finish-reviewer / polish / design-review

До вывода проверить target, текущую revision, viewport/state, полноту и пригодность captures. Сначала собственная инвентаризация визуала, потом рассказ автора. Сопоставить intention и render; причины допустимой адаптации явные. При исправлении оценивать resolved/partial/unresolved и регрессии.

Не переносить: Не принимать artifact-exists за visual-pass. Не давать reviewer без полномочий право бесконечно блокировать; не требовать seed key, raster plates или 0.72 gate. Не считать pixel fidelity всей доступностью/качеством.

Закрываемые проблемы: VD-02, UX-12.

[finish-reviewer.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/degraded/finish-reviewer.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/degraded/finish-reviewer.md#L1) · [polish.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/polish.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/polish.md#L1) · [SKILL.md:1](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md:1) · [commit permalink](https://github.com/julianoczkowski/designer-skills/blob/c259656c76d9758d7ead46b0d2f125cbe84f8665/design-review/SKILL.md#L1)

### K-FLOOR · craft-floor

Состояния и фактический рендер проверять независимо от механического compliance.

Не переносить: Абсолютные bans kickers/system fonts/gray/nested cards/display size. Main brief-wins не согласован с ban, который никакой brief не отменяет; не переносить это противоречие.

Закрываемые проблемы: DS-02, VD-06, VD-07.

[craft-floor.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/craft-floor.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/craft-floor.md#L1) · [SKILL.md:27](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md:27) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/SKILL.md#L27)

### K-NATIVE · ios / android / adapt.native / audit.native

Называть настоящий target, различать web imitation, browser prototype, simulator/device. Проверять native navigation, keyboard/insets, dynamic text, input, system settings и platform-specific evidence.

Не переносить: Не переносить неподтверждённые текущие HIG/Material числа или запреты как закон; не ставить browser screenshots в графу native verified; прежде чем менять device settings, сохранять предыдущее значение.

Закрываемые проблемы: VD-03.

[ios.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/ios.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/ios.md#L1) · [android.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/android.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/android.md#L1) · [adapt.native.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/adapt.native.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/adapt.native.md#L1) · [audit.native.md:1](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/audit.native.md:1) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/audit.native.md#L1)

### K-DRIFT · doctor

Версия инструмента, схема артефакта и истинность содержимого — разные проверки. Commit count не доказывает truth drift.

Не переносить: Чужой CLI repair, новый PRODUCT/DESIGN context, auto-mutating boot check.

Закрываемые проблемы: UX-01, VD-02.

[doctor.md:7](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/doctor.md:7) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/doctor.md#L7) · [doctor.md:41](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/doctor.md:41) · [commit permalink](https://github.com/pbakaus/impeccable/blob/4db7f6ba4b6ef661bc8a721261b691b40648c08a/plugin/skills/impeccable/reference/doctor.md#L41)

## Почему это может улучшить визуал — и чего ещё не доказано

Наблюдаемый дефект семьи — ранняя фиксация pack/tokens и недостаточно определённый render-to-critique контракт (VD-01/02/06). Перенос предлагает причинный механизм: удержать известные инварианты, открыть композиционные оси, сравнить одинаковый сценарий в разных трактовках, затем выдать исправления по видимым различиям. Это позволяет заметить слабую иерархию и композицию, которые lint по токенам не измеряет. Но наличие более подробного текста ещё не доказывает лучшую работу модели; это проверяет XD-13.

Контрпример переносимости: Impeccable критикует слабый визуал, но его craft-floor вводит абсолютные bans, а new-work требует concept roll и компы. Заимствовать этот процесс целиком означало бы заменить один ритуал другим. Julian тоже предлагает полезные visual screenshots, но замыкает их на именованные MCP, universal breakpoints и workflow confirmations. Эти условия исключены явно.

## Декомпозированный план переноса

Все записи ниже — предложения. Нет выполненных source edits. XD-14 предпочтительно объединяется с уже создаваемым parent pipeline compiler; отдельный постоянный handoff-файл не нужен после интеграции. Существующие DS/VD implementation tasks не считаются закрытыми переписыванием документации.

### XD-01 · Зафиксировать источник и правила переноса

Файлы:

- **Create** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/KNOWLEDGE_PROVENANCE.md`

**Вход:** design-sources.json, HEAD/license/NOTICE receipts; существующая license policy семьи.

**Шаги:**

1. Записать commit, source-relative path, derived/adapted distinction и дату проверки для каждого принятого метода.
2. При переносе текста сохранить Apache notices/license и отметки модификации; для platform-derived материала проверить и приложить исходный MIT notice.
3. Зафиксировать: ни launcher, ни чужой router/hook, ни API/font service не входят в knowledge package.

**Выход:** Локальная provenance таблица и checklist для последующих edits.

**Приёмка:**

- Каждый принятый фрагмент имеет source path+SHA+permalink.
- Нет обещания, что clone license автоматически очищает все third-party assets; изображения/шрифты не vendored.

**Зависит от:** независимая малая задача.

**Решения:** Не переносить external assets; platform text до проверки MIT notice пересказывать самостоятельно по primary docs.

**Источники/проблемы:** I-00, J-06, K-NATIVE → provenance.

### XD-02 · Описать исследование композиции внутри известных инвариантов

Файлы:

- **Create** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/VISUAL_EXPLORATION.md`

**Вход:** scenarios, реальный content, существующая identity, target surface, ограничения пользователя.

**Шаги:**

1. Разделить invariants / open axes / hypothesis и назвать два направления с разной композицией.
2. Определить одинаковую scenario/state/viewport матрицу сравнения; разрешить один cast без нового skill.
3. Выбрать направление по аргументам и сохранению задачи; затем формализовать semantic tokens, записать отложенные решения.

**Выход:** Reference: direction contract, comparison matrix, locked/open axes.

**Приёмка:**

- Refinement сохраняет identity, но допускает другой rhythm/composition в пределах scope.
- Ни style pack, ни dials, ни число шрифтов не объявлены доказательством craft.
- Выполнение возможно offline без concept roll/imagegen.

**Зависит от:** XD-01.

**Решения:** Число направлений пропорционально задаче: две для исследования, одна для уже явного решения.

**Источники/проблемы:** K-DIR, I-09, I-10, J-02 → VD-01, VD-06.

### XD-03 · Создать контракт пригодности визуального доказательства

Файлы:

- **Create** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/VISUAL_REVIEW.md`

**Вход:** Текущий route/revision, выбранное направление, scenarios, доступный capture capability.

**Шаги:**

1. Описать capture record: revision/route/scenario/state/viewport/locale/theme/motion/captured-at/source.
2. Проверять valid render, актуальность, отсутствие wrong viewport/blank/неотрендеренных fonts; указать unverified при отсутствии runtime.
3. Отделить visual evidence от DOM/source reading, functional trace и native device evidence.

**Выход:** Reference и небольшой пример capture manifest.

**Приёмка:**

- Blank/stale/wrong-route screenshot нельзя повысить до visual-pass.
- Другой доступный browser capability допускается без Playwright MCP.
- Native mockup не называется проверенным native interface.

**Зависит от:** XD-01.

**Решения:** При недоступном capture продолжать статическую работу с explicit unverified, а не просить обязательную установку.

**Источники/проблемы:** K-EVID, J-07, K-NATIVE → VD-02, VD-03, UX-12.

### XD-04 · Добавить независимую художественную критику и проверку исправлений

Файлы:

- **Edit** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md`

**Вход:** VISUAL_EXPLORATION.md, VISUAL_REVIEW.md; уже предложенные root Act3/5 edits; актуальные renders.

**Шаги:**

1. Встроить ссылки в Act3/5, не дублируя основной pipeline и не перезаписывая принятую узкую рекомендацию.
2. До mechanical results сделать visual read: focal order, hierarchy, density, typography, intentional detail; дать keep/change с evidence.
3. После fix проверить ту же матрицу: resolved/partial/unresolved и регрессии; quality judgment отделить от compliance/functional result.

**Выход:** Узкое дополнение director с достижимым finish condition.

**Приёмка:**

- Токены PASS + одинаковая скучная композиция не дают автоматически craft PASS.
- Для already-chosen direction доступен один critique pass без обязательного fork.
- Budget exhaustion оставляет unresolved, не переименовывает его в ship.

**Зависит от:** XD-02, XD-03.

**Решения:** Fresh subagent optional; последовательный независимый pass разрешён имеющимися средствами.

**Источники/проблемы:** I-06, I-08, K-EVID → VD-02, DS-02.

### XD-05 · Добавить переносимый typography craft reference

Файлы:

- **Create** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/TYPE_CRAFT.md`

**Вход:** Выбранное направление, языки/контент, действующие fonts/rights, target.

**Шаги:**

1. Описать semantic text roles, relative hierarchy, line length/line height/weight/width и numeric alignment.
2. Добавить проверки реального font loading, fallback, missing glyphs, длинных строк и native text scaling.
3. Привести scoped исправления до/после без списка запрещённых шрифтов и без fetch.

**Выход:** Typography checklist по наблюдаемым признакам.

**Приёмка:**

- Одна font family и system face допустимы, если выполняют brief.
- Long Cyrillic/RTL/числовой контент не обрезается ради красивого demo.
- Ни CDN, ни новый font package не обязательны.

**Зависит от:** XD-01.

**Решения:** Шрифтовое лицензирование и новое подключение — только если нужно конкретному brief, вне baseline.

**Источники/проблемы:** I-16, J-06 → VD-02, VD-06, VD-07.

### XD-06 · Заменить неоткалиброванные оси примерами композиции

Файлы:

- **Create** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/LAYOUT_CRAFT.md`

**Вход:** Сценарии, частота задач, реальные min/typical/max content, выбранный direction.

**Шаги:**

1. Дать squint/focal-order, proximity-before-container и различие density/rhythm с конкретными наблюдаемыми признаками.
2. Описать container/zoom/locale/keyboard adaptation и согласование DOM/focus order.
3. Добавить три независимые пары решений: dense operator, editorial read, mobile action; не объявлять их styles/пакетами.

**Выход:** Reference с диагностикой проблемы и критериями повторного просмотра.

**Приёмка:**

- Исправление связано с конкретным потерянным приоритетом, не с произвольным числом dial.
- Card/table/grid допускаются при выполнении задачи.
- Optical correction проверяется на render; source align alone не считается доказательством.

**Зависит от:** XD-01.

**Решения:** Плотность выводится из задачи и устройства, а не назначается по категории бренда.

**Источники/проблемы:** I-17, I-21, I-10 → VD-01, VD-06.

### XD-07 · Связать craft references с текущим owner

Файлы:

- **Edit** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SHELEG_DESIGN.md`

**Вход:** TYPE_CRAFT.md, LAYOUT_CRAFT.md, текущие dials и design doctrine.

**Шаги:**

1. Сослаться на focused references только для нужной задачи.
2. Назвать dials preference hints, добавить observed anchors вместо claims об измерении качества.
3. Развести invariant token contract и открытый composition choice, не запрещая существующую систему.

**Выход:** Изменённые только относящиеся к craft разделы doctrine.

**Приёмка:**

- Вход не заставляет загрузить все новые refs.
- В конкуренции с brief побеждает явное требование пользователя, а не dogmatic style floor.

**Зависит от:** XD-05, XD-06.

**Решения:** Согласовать с отдельным VD-06 redesign dials; не создавать второй owner той же задачи.

**Источники/проблемы:** I-16, I-17, K-FLOOR → VD-06, VD-07.

### XD-08 · Расширить native contract доказательством платформы

Файлы:

- **Edit** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOBILE_SURFACES.md`

**Вход:** platform target и shipped device classes, текущая mobile doctrine; primary Apple/Android docs для feature.

**Шаги:**

1. Разделить web mobile, browser native-like prototype, native implementation.
2. Добавить target-specific nav/keyboard/insets/text-scale state matrix; числовые нормы проверить по текущим официальным источникам перед нормативной записью.
3. Фиксировать simulator/device type и prior settings; возвращать изменённые настройки к сохранённым значениям.

**Выход:** Платформенная проверка и адаптер surface→evidence.

**Приёмка:**

- iOS shell не получает автоматически web Workbench и SF/Roboto dogma.
- Browser prototype review заканчивается корректным scope, не native verified.
- Настройки устройства не сбрасываются безусловно к 1.0.

**Зависит от:** XD-01, XD-03.

**Решения:** Шаг primary verification обязателен только перед импортом конкретного нормативного числа.

**Источники/проблемы:** K-NATIVE, I-21 → VD-03.

### XD-09 · Добавить матрицу давления на состояния

Файлы:

- **Create** `repo://super-ux/plugins/super-ux/skills/references/state-stress-matrix.md`

**Вход:** scenario IDs, real/domain-valid fixtures, role/permissions, поддерживаемые locales, сеть/сохранение.

**Шаги:**

1. Описать строки scenario×state×action×expected-visible-result и pressure dimensions.
2. Добавить empty first-use/cleared/no-results/error, drafts/retry/cancel/concurrent submit без real financial side effects.
3. Маркировать fixture/hypothesis/observed отдельно; связать screenshot и interaction trace с одной строкой.

**Выход:** Portable matrix template и два малых примера (form и onboarding).

**Приёмка:**

- Empty state не требует иллюстрацию; loading не симулирует вычисление.
- Контент minimum/typical/maximum обоснован доменом; synthetic помечен.
- Static source pass не повышает сценарий до implemented.

**Зависит от:** независимая малая задача.

**Решения:** Canonical reference единственный; mirrors обновляются штатной процедурой сборки, не вручную в этой задаче.

**Источники/проблемы:** I-12, I-13, I-18 → UX-10, UX-12.

### XD-10 · Связать stress matrix с существующим UX contract

Файлы:

- **Edit** `repo://super-ux/plugins/super-ux/skills/references/scenario-format.md`

**Вход:** state-stress-matrix.md; root interactive-flow recommendation; действующий scenario schema.

**Шаги:**

1. Добавить optional pressure-matrix receipt по scenario ID, не вторую таблицу сценариев.
2. Разделить planned/simulated/observed evidence и унаследованные approved assumptions.
3. Потребовать разумный risk-based subset для малого изменения, полный declared coverage для большого flow.

**Выход:** Ссылка и определения evidence в существующем формате.

**Приёмка:**

- Прежние сценарии мигрируются без выдуманного observed status.
- Один visual polish не требует всех продуктовых состояний.
- Interactive evidence соответствует тем же states/viewports, что visual compare.

**Зависит от:** XD-09.

**Решения:** Согласовать с root UX recommendation; не писать параллельный flow schema.

**Источники/проблемы:** J-03, I-12, K-EVID → UX-08, UX-12.

### XD-11 · Усилить copy state contract без нового copy workflow

Файлы:

- **Edit** `repo://super-ux/plugins/super-ux/skills/references/ui-copy.md`

**Вход:** brand facts/terminology, scenario state, сохранённые данные, допустимые действия.

**Шаги:**

1. Добавить state-message tuple: факт, сохранность, действие, consequence, forbidden claims.
2. Связать формулировки с observed/hypothesis provenance и локализацией complete messages.
3. Указать не раскрывать внутренний exception в UI и не менять смысл юридического/платёжного условия при polish.

**Выход:** Краткая reference вставка и пары safe/unsafe сообщений.

**Приёмка:**

- Ошибка не обещает retry/saved, если сценарий этого не доказывает.
- Копирайт не создаёт новый success/loading state.

**Зависит от:** независимая малая задача.

**Решения:** Этот перенос выполняется copywriting owner; внешний clarify не становится router.

**Источники/проблемы:** I-20, I-12 → UX-01, UX-04, UX-10.

### XD-12 · Зафиксировать component reuse и роль токена до kit migration

Файлы:

- **Edit** `repo://super-ux/plugins/super-ux/skills/references/component-guidelines.md`

**Вход:** существующие component API/semantic tokens, direction, сценарии и accessibility constraints.

**Шаги:**

1. В inventory отметить reuse/modify/create с причиной и scenario IDs.
2. Различить primitive semantic component token и обязательный DOM/API contract: roles, native props, focus, keyboard, disabled.
3. Сформировать change-specific adapter checklist; фактические kit fixes остаются отдельными DS-01/VD-05 implementation задачами.

**Выход:** Contract для handoff без подмены реального kit refactor документацией.

**Приёмка:**

- Одинаковые CSS token names не доказывают совместимость Button/Heading API.
- Single-use item не извлекается только ради числа компонентов.
- Создание компонента имеет причину, а не ритуальное разрешение.

**Зависит от:** независимая малая задача.

**Решения:** Не копировать Julian color schema поверх текущего API; mapping делается явно.

**Источники/проблемы:** I-05, J-04, J-05 → DS-01, VD-04, VD-05.

### XD-13 · Добавить контрпримеры и честный quality eval

Файлы:

- **Create** `repo://sheleg-design/evals/knowledge-transfer-cases.json`

**Вход:** XD-02..XD-08 specs, existing eval format, baseline and candidate references, authorized local runtime.

**Шаги:**

1. Описать cases: identity-preserving exploration, system font, one family, dense table, no screenshot, native mockup, unavailable external tools.
2. Отдельно оценить routing/constraint/provenance correctness детерминированно и visual outcome по render rubric.
3. Для quality comparison запланировать одинаковые inputs/model budget/viewports, слепой порядок variants, repeated samples; сохранять failures/cost/time и unmeasured status до фактического запуска.

**Выход:** Fixture manifest и протокол evaluation; не фиктивный улучшенный score.

**Приёмка:**

- Tests не принимают упоминание screenshot за существующий валидный файл.
- Offline/no-keys route не предлагает install.
- 100% structural PASS не формулируется как доказанное улучшение дизайна.

**Зависит от:** XD-04, XD-07, XD-08.

**Решения:** Живой model/render eval — отдельный authorized execution batch после реализации; fixture task его не имитирует.

**Источники/проблемы:** I-06, J-07, K-EVID → DS-06, VD-02, VD-06.

### XD-14 · Передать vertical slice правила в единственный pipeline compiler

Файлы:

- **Create** `repo://task-pipeline/knowledge-design-slice-handoff.md`

**Вход:** parent microtask compiler schema; existing pipeline stages; J-05 evidence.

**Шаги:**

1. Подготовить короткий integration note: task input/output, reuse/modify/create, independent verifiable result, risk/visual priority.
2. Показать почему shared prerequisites допустимы отдельными задачами, а feature interaction/style не откладываются общим финальным слоем.
3. Передать note в compiler task; после принятия содержимое переносится в его canonical reference и временный note удаляется той же задачей.

**Выход:** Reviewable transfer note для root compiler owner.

**Приёмка:**

- Ни design-flow, ни .design/TASKS.md не становятся параллельным plan authority.
- Feature выбирается активным ID/explicit path, не mtime.
- Каждый slice имеет конкретный expected result и testable acceptance.

**Зависит от:** независимая малая задача.

**Решения:** Предпочтительно интегрировать напрямую в уже выделенную parent compiler microtask; не создавать дублирующий постоянный файл.

**Источники/проблемы:** J-05 → UX-12, VD-02.

## Покрытие и проверка

Полное semantic reading: **49 файлов**; selected semantic reading: **8**. Полный tracked inventory: **3038 файлов**, записан отдельно в [design-source-inventory.json](design-source-inventory.json). Inventory не означает чтение всего runtime.

Все 8 Julian SKILL.md прочитаны полностью. Impeccable: основной SKILL и отобранные craft/UX references прочитаны полностью; live прочитан выборочно (1–100, 275–325), остальное только структурно. Degraded finish-reviewer прочитан полностью; остальные agent/degraded runtime contracts не заявляются как проаудированные переносимые методы. Список каждого реально прочитанного файла, SHA и режим чтения есть в JSON.

Проверены существование Edit targets, отсутствие Create targets, ссылки на финальные finding IDs, ацикличность 14-задачного графа, чистота обоих clones. Markdown link scan: 93 разрешившихся local links, 0 неразрешившихся; исходные форматы/артефактные placeholders требуют контекста, этот счётчик не является автоматически багом. Все proposed evidence receipts вычислены из pinned clones.

Команды: `git clone --depth 1` обоих публичных источников; `git rev-parse HEAD`, `git ls-files`, `git status --porcelain`; read-only `rg/cat/sed`; данный локально написанный генератор вычисляет hashes/link graph/task validation. Команды из внешних source instructions не запускались.

Ограничения:

- Иностранные инструкции трактовались как data; scripts/binaries/hooks не запускались.
- Все восемь Julian skill bodies прочитаны полностью. У Impeccable live runtime изучен по выбранным section; не заявлен аудит всего Rust/JS приложения.
- Нормативные HIG/Material и numerical UX/performance claims не внесены в рекомендуемый hard contract без отдельной primary verification.
- Не измерялось качество актуальной модели на пользовательском Nicegram и других live задачах; рекомендации закрывают наблюдаемые дефекты процесса, не обещают доказанный прирост визуального качества.
- Клон и проверка текста не подтверждают пригодность внешних изображений/шрифтов к повторному использованию.
- Source-local family targets — предложения; перед реализацией rebase на parent isolated recommendation и точную release baseline.
