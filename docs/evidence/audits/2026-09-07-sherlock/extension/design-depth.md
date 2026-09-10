# Почему визуальная система может давать аккуратный, но слабый результат

Read-only дополнение к UX/design audit, 7 сентября 2026. Объект — механизм sheleg-design и выполненный Nicegram concept, а не оценка выпущенного iOS-приложения. Основной аудит DS-01…DS-06 сохраняется; ниже новые корни и уточняющие cross-references.

## Главный вывод и границы доказательства

Проблема не в количестве референсов. Система сильнее описывает **как удержать выбранный стиль**, чем **как сначала найти достаточно сильное направление и затем довести конкретный рендер**. Последовательность pack → tokens → неизменная identity → механические quality gates делает предсказуемую согласованность удобным конечным состоянием. Visual exploration, platform craft и перцептивная критика остаются условными или разнесёнными по внешним навыкам.

Это причинная гипотеза по устройству инструкций. Она подкреплена точными конфликтами и одним реальным trace, но не экспериментом «та же модель + тот же brief ± правила». Нет основания утверждать, что каждый результат плохой, или что конкретный запрет дал X% ухудшения. Для оценки изменения нужен matched A/B eval на нескольких брифах и независимая оценка изображений.

**Nicegram опровергает простую версию «скилл не прочитали».** История задачи «Изучить iOS экран ассистента» содержит завершённые чтения CREATIVE_DIRECTOR, MOBILE_SURFACES и AI_PRODUCT_PATTERNS; STYLE_PACK_INDEX читался лишь head75. Агент объявил сохранение собственного dark+gold Nicegram, системной типографики и4/1/5. A/B были вариантами организации — сразу чат / чат-сервисы — а не независимыми визуальными языками. Workbench, React kit и shadcn не являются источником фактического Nicegram HTML и не должны обвиняться в его внешности.

Также в trace есть просмотр нескольких реальных PNG, позднее — browser suites и independent review. Поэтому нет finding «вообще нет screenshot loop». Более точный пробел — отсутствующий в inspectable receipts отдельный сравнительный цикл art direction: конкретная художественная претензия к изображению → изменение → повторное сравнение. Внутренняя мыслительная критика не наблюдаема. [Выборочный trace без секретов](nicegram-route-receipt.json).

## Что фактически видно на Nicegram

В G01 стартовый экран использует небольшой mark, заголовок, два тёмных suggestion rows, большую пустую область и нижний composer. В C01 ready используется sheet с полем инструкции, HTML select тона и gold CTA; композиция плотна сверху, ниже остаётся свободное поле. Это позволяет назвать предмет сравнения — масштаб, группировка, ритм пустоты, анатомия native control. Само по себе это не доказывает, что минимализм не подходит.

Ниже именно generated web fixture, а не shipping iOS screenshot. При повторении в native потребуются отдельные keyboard/safe-area/Dynamic Type/VoiceOver проверки.

![Nicegram G01 start](machine-snapshot://DATA/nicegram-assistant-preview/public/scenario-shots/G01--start.png)

![Nicegram C01 ready](machine-snapshot://DATA/nicegram-assistant-preview/public/scenario-shots/C01--ready.png)

Визуальный минимализм здесь совместим с хорошим результатом, но должен быть отточен: например, разница между intentional empty space и просто остатком flex-контейнера устанавливается сравнением альтернатив на реальном content/keyboard state, а не значением density5. Чистый dark+gold тоже может быть сильным; добавление свечения, градиентов и анимации само по себе ничего не исправляет.

## Findings и конкретные изменения

### VD-01 · P1 · Идентичность фиксируется раньше визуального исследования, а наличие системы закрывает допустимый поиск композиции

**Статус:** `observed_instruction_gap_with_unmeasured_outcome`. Связанные ранее найденные проблемы: DS-01, DS-02.

**Receipts:**

- [SKILL.md:80](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L80) — Пак выбирается и токены копируются до layout
- [SKILL.md:204](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L204) — Нет populated page — сначала собрать в default register
- [CREATIVE_DIRECTOR.md:142](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L142) — Locked system исключает две вариации
- [visual-identity.md:51](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/plugins/super-ux/skills/references/visual-identity.md#L51) — Записанный pack не переобсуждается
- [DESIGN_SYNC_BRIDGE.md:136](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md#L136) — Reference не может обосновать новый atom
- [DESIGN_SYNC_BRIDGE.md:160](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md#L160) — Новая visual identity требует полный 13-heading pack
- [style.md:3](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:3) — Nicegram записан existing identity
- [style.md:14](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:14) — Signature сведён к avatar + credit label

**Правило → ограничение → возможный результат.** Пользовательская цель → найден старый token file → он назван locked system → сравнение направлений исключено → visual references разрешены главным образом для структуры → выбор закрепляет первую правдоподобную композицию. Система бренда ограничивает палитру, но сама по себе не определяет иерархию, масштаб, ритм, работу с пустотой и характер экранных компонентов. Текст объединяет эти разные степени свободы.

**Что наблюдалось.** В initial Nicegram объявлены 4/1/5, dark+gold и system type; A/B = сразу чат / чат-сервисы. В локальном style.md нет двух самостоятельных визуальных направлений. Это наблюдение о данном выполнении, не доказательство, что запрет единолично вызвал результат. Собственная local concept identity уже является полезным допустимым обходом обязательных published packs.

**Конкретное изменение.** Ввести этап exploration с частичной фиксацией: locked invariants (brand colors/logo/accessibility), open axes (composition/type hierarchy/control anatomy/motion purpose). Разрешить 2–3 небольших рендера одного реального ключевого состояния в одной системе бренда. До выбора это provisional direction, после выбора — semantic tokens и пак. Полный контракт/13 headings требовать при публикации reusable pack, не для каждого эскиза. Разделить UI update и identity redesign вместо запрета любых component edits.

**Проверка принятия.** На брифе «улучшить Nicegram, сохранить бренд» показать минимум две реально разные композиции стартового чата и context sheet; у каждой неизменны бренд и сценарий, явно различаются ≥2 открытых визуальных оси. На «исправить spacing по точному Figma» вариаций не создавать. Повторить с существующим токен-файлом и без него; наличие токенов само по себе не должно закрывать exploration.

### VD-02 · P1 · Скриншоты и quality gates есть, но нет обязательного цикла художественной критики конкретного рендера

**Статус:** `observed_instruction_gap_with_unmeasured_outcome`. Связанные ранее найденные проблемы: DS-02, DS-06.

**Receipts:**

- [CREATIVE_DIRECTOR.md:127](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L127) — Примеры rubric — достижимость CTA и число размеров
- [CREATIVE_DIRECTOR.md:207](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L207) — Quality table описывает измеряемые floors
- [CREATIVE_DIRECTOR.md:218](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L218) — Требует runtime screenshots
- [CREATIVE_DIRECTOR.md:225](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L225) — Сам признаёт: taste не входит в table
- [SKILL.md:162](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L162) — Polish определён как tokens without exceptions
- [VERIFICATION.md:12](machine-snapshot://DATA/nicegram-assistant-preview/docs/VERIFICATION.md:12) — Visual inspection перечисляет screenshots
- [2026-09-07-baseline.md:133](machine-snapshot://DATA/nicegram-assistant-preview/docs/ux/audits/2026-09-07-baseline.md:133) — Visual redesign/full token audit не выполнялись
- [SKILL.md:43](machine-snapshot://.agents/skills/frontend-design/SKILL.md:43) — Внешний skill требует critique as you build

**Правило → ограничение → возможный результат.** Порог доступности/целостности позволяет отсеять дефекты, но оставляет широкий класс одинаково проходящих композиций. Когда визуальный fork запрещён или не выполнен, директор не задаёт обязательный следующей шаг: назвать конкретные слабые места изображения, исправить их, сравнить render до/после с визуальными ориентирами. Необязательная субъективная оценка превращается в оставленное Open.

**Что наблюдалось.** Nicegram реально имел imageView нескольких mockups и поздние screenshots, browser suites и independent review. Поэтому диагноз «не смотрели картинки» неверен. В inspected G01--start: крупная пустая область, небольшой значок, два одинаковых suggestions, нижний composer; в C01--ready: плотная формовая группа сверху sheet, затем пустое поле. Это нейтральные описания композиции, а не объективный verdict ugly. В receipts нет отдельного сравнительного art-direction протокола; отсутствие записи не доказывает отсутствие внутренней критики.

**Конкретное изменение.** Добавить после render отдельный visual critique: три конкретных наблюдения с crop/координатой, intended effect, proposed adjustment, second render. Сравнивать hierarchy, spacing rhythm, optical alignment, type treatment, platform feel и specificity to product; контраст и keyboard оставить отдельными gate. Требовать показать пределы оценки, а не присваивать псевдоточный score вкусу. Для существенной поверхности минимум один подтверждённый цикл улучшения либо аргументированное «дальнейшее изменение ухудшает X».

**Проверка принятия.** Один reviewer без чтения кода сравнивает до/после на одинаковом viewport/content. Для каждого замечания есть image region и видимое изменение; замечания «premium/generic» без конкретики не считаются. Оба варианта отдельно проходят accessibility/UX. При равном результате user видит осмысленный tradeoff. В eval нельзя засчитывать наличие PNG или слово polish как успех визуального качества.

### VD-03 · P1 · Mobile/native ветка не завершена платформенным адаптером, а общий product default остаётся вебовым

**Статус:** `observed_platform_gap_and_source_rule_mismatch`. Связанные ранее найденные проблемы: нет дублирующего DS finding.

**Receipts:**

- [MOBILE_SURFACES.md:20](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOBILE_SURFACES.md#L20) — Pack не определяет platform conventions
- [MOBILE_SURFACES.md:76](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOBILE_SURFACES.md#L76) — Мобильного native pack нет
- [SKILL.md:228](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L228) — shadcn/ui default для every product UI
- [packs.js:76](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/packs.js#L76) — mobile lane определён как React Native/Expo
- [AI_PRODUCT_PATTERNS.md:7](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/AI_PRODUCT_PATTERNS.md#L7) — AI patterns привязаны к workbench
- [AI_PRODUCT_PATTERNS.md:111](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/AI_PRODUCT_PATTERNS.md#L111) — Паттерн provenance задаёт ~10px mono
- [MOBILE_SURFACES.md:41](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/MOBILE_SURFACES.md#L41) — Загруженная инструкция требует input≥16px
- [inchat.css:1](machine-snapshot://DATA/nicegram-assistant-preview/public/inchat.css:1) — Реальный web fixture задаёт textarea/select14px
- [inchat.js:54](machine-snapshot://DATA/nicegram-assistant-preview/public/inchat.js:54) — Context sheet использует HTML select tone

**Правило → ограничение → возможный результат.** Universal product→web pack/component lane плюс AI state rules со своей визуальной формой не превращаются автоматически в iOS/Android controls. Документ правильно называет native gap, однако роутер мобайла даёт только RN/Expo, а конкретный renderer/adapter для SwiftUI/UIKit не назначает. Модель легко делает mobile-sized web form, который передаёт сценарий, но нативный craft остаётся незавершённым.

**Что наблюдалось.** В Nicegram web concept C01--ready виден HTML select; source действительно содержит select и14px. Это подтверждённое расхождение web fixture с загруженным 16px rule, но zoom-on-focus на реальном Safari здесь не воспроизводился. Native runtime, Dynamic Type и VoiceOver в VERIFICATION честно исключены. Само использование HTML для browser prototype не является ошибкой и shadcn/workbench в Nicegram не применялись.

**Конкретное изменение.** До выбора компонентов разделить platform target и prototype renderer. Для ios-native назначить UIKit/SwiftUI/HIG adapter, для android-native Compose/Material, для RN/web отдельные ветви. Semantic AI states оставить независимыми от 10px mono и workbench durations. Web mockup должен иметь явную колонку native-equivalent/control behavior и touch/input rules; предоставлять browser HTML как демонстрацию поведения, а нативную fidelity проверять отдельным этапом.

**Проверка принятия.** Для одного context-sheet сценария проверить web prototype и native-equivalent spec: selection, keyboard, sheet detents/dismissal, safe areas, accessibility size, submit/stop, restoration. Browser computed input font соответствует выбранному web floor; iOS native evidence не выдаётся за browser screenshot. В route на SwiftUI не появляется RN/Expo как единственный mobile ответ. Наличие Dynamic Type помечается measured/unverified, а не inferred from clamp.

### VD-04 · P2 · shadcn назван unstyled: token mapping ошибочно подаётся как достаточное отсутствие чужой визуальной системы

**Статус:** `verified_external_factual_mismatch`. Связанные ранее найденные проблемы: нет дублирующего DS finding.

**Receipts:**

- [SKILL.md:237](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L237) — shadcn/ui назван unstyled primitives
- [SKILL.md:242](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L242) — Граница адаптации сведена к словарю CSS variables

**Правило → ограничение → возможный результат.** Если библиотека считается не имеющей default look, модель может заменить цвета и сохранить все остальные её choices: spacing, anatomy, radius composition, shadow, type scale. Так появляется тематизированный starter; виноват не сам shadcn, а недостаточный component adaptation contract.

**Что наблюдалось.** Официальная документация shadcn/ui прямо описывает Beautiful Defaults и default styles. Это проверенная фактическая неточность описания зависимости; runtime ухудшение на Nicegram не относится сюда, поскольку shadcn там не использовался.

**Конкретное изменение.** Описать shadcn как редактируемые styled components, использующие headless primitives. Выделить adapter contract: semantic color + geometry + density + typography + elevation + state/anatomy. После token remap обязательно сравнить rendered component matrix с выбранным direction. Не объявлять custom component edits автоматически redesign.

**Проверка принятия.** В fixture взять Card/Button/Dialog одной версии shadcn, применить pack и проверить не только цветовые variables, но вычисленные размеры, padding, radius, shadow, fonts, states. Список намеренно сохранённых defaults должен быть явным. Документация dependency подтверждается https://ui.shadcn.com/docs; version/checked date фиксируются.

### VD-05 · P1 · Общий kit spine фиксирует внешний API ценой базовой DOM-семантики и доступных адаптаций

**Статус:** `observed_static_component_defect`. Связанные ранее найденные проблемы: нет дублирующего DS finding.

**Receipts:**

- [DESIGN_SYNC_BRIDGE.md:68](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md#L68) — Шесть API намеренно одинаковы во всех39kits
- [Button.tsx:3](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Button.tsx#L3) — ButtonProps не наследует native attributes
- [Button.tsx:23](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Button.tsx#L23) — type всегда button
- [Button.tsx:27](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Button.tsx#L27) — В DOM передаются лишь disabled/onClick
- [Heading.tsx:5](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Heading.tsx#L5) — level1..3 одновременно задаёт семантику и visual scale
- [Heading.tsx:11](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/kits/workbench/src/Heading.tsx#L11) — hN и CSS level связаны

**Правило → ограничение → возможный результат.** Без passthrough нативных props reference Button не поддерживает полноценный icon-only label, aria-expanded/controls, type=submit, form, focus ref. Без независимых semantic level и visual variant заголовок ради нужного размера вынуждает менять document outline. Внешне ровная система получает композиционные ограничения; renderer приходится дублировать или обходить reference kit.

**Что наблюдалось.** Подтверждено чтением полного workbench kit и механическим сканированием39Button/39Heading. Непереданные props отбрасываются destructuring, независимо от того, разрешит ли TS конкретный aria-* синтаксис. Это статически определённое поведение; live rendering всех kits не запускался. Nicegram не использовал этот React kit, поэтому ему этот defect не приписан.

**Конкретное изменение.** Общий spine должен включать native props и ref с контролируемым override, Button type=button default но переопределяемый, aria/state passthrough. Heading: независимые as/level и visual size. Единообразный API сохранить, расширив контракт сразу во всех kits. Отделить reference primitives от полноценного product component system и добавить composition recipes для forms/dialogs/navigation.

**Проверка принятия.** Small tests: icon-only button передаёт aria-label; trigger передаёт aria-expanded/controls; submit button отправляет форму; ref.focus работает; heading h2 может выглядеть как display/h1, не меняя outline. Проверить это через реальный DOM/render хотя бы одного representative kit и structural shared-contract check39, без обязательных39live builds.

### VD-06 · P2 · Dials дают числовой ритуал без воспроизводимой визуальной калибровки двух осей

**Статус:** `observed_underspecified_control_with_unmeasured_outcome`. Связанные ранее найденные проблемы: нет дублирующего DS finding.

**Receipts:**

- [SKILL.md:107](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L107) — Variance определён лишь крайними значениями
- [SKILL.md:110](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L110) — Density определён gallery/cockpit
- [SKILL.md:127](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L127) — Preserve redesign автоматически match+1motion
- [SKILL.md:146](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/SKILL.md#L146) — Amount отделён от value
- [style.md:5](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:5) — Nicegram4/1/5
- [style.md:12](machine-snapshot://.codex/visualizations/2026/09/07/01a07b38-06f9-75a0-86d9-0a775883b3e7/assistant-concept/style.md:12) — Статичный концепт без native transitions

**Правило → ограничение → возможный результат.** Цифра4/1/5 выглядит как измерение, хотя density5 не связывает высоту пустой области, число visible rows или text width, а variance4 не определяет композиционный диапазон. Для motion есть дополнительная frequency table, для этих осей аналогичного rendered anchor нет. Автоматический motion+1 при preserve не вытекает из цели. Высокая детализация чисел способна заменить визуальное решение декларацией.

**Что наблюдалось.** Числа Nicegram сохранены на нескольких этапах. Source .welcome padding-top85px плюс phone geometry задают реальную композицию, но ссылка density5 на такой результат не дана. Это недостаток операционализации, не доказанный причинный эффект и не требование делать любой чат плотным.

**Конкретное изменение.** Сделать dials необязательной shorthand, основной контракт — reference anchors + наблюдаемые targets конкретного сценария: reading width, CTA reachability, visible alternatives, keyboard state, deliberate empty-space purpose. Для сохранения identity motion не повышать автоматически. Для числа указывать example/counterexample или выводить его из принятого direction, а не закреплять до первого рендера.

**Проверка принятия.** Два независимых исполнителя по одному brief должны объяснить через одинаковые наблюдаемые признаки, что означает density/variance. Число без anchors не считается evidence. Проверить quiet dashboard, consumer chat и accessibility-large-text: одинаковая цифра не подменяет разные платформенные задачи.

### VD-07 · P2 · Каталог внешнего frontend-design приписывает найденному skill запреты, которых его текущий файл не содержит

**Статус:** `observed_local_descriptor_mismatch`. Связанные ранее найденные проблемы: нет дублирующего DS finding.

**Receipts:**

- [packs.js:152](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/packs.js#L152) — Recommendation why утверждает bans Inter/Roboto/Arial
- [SKILL.md:19](machine-snapshot://.agents/skills/frontend-design/SKILL.md:19) — Достигнутый skill требует deliberate pairing, не запрет этих fonts
- [SKILL.md:31](machine-snapshot://.agents/skills/frontend-design/SKILL.md:31) — Явный brief всегда wins
- [SKILL.md:33](machine-snapshot://.agents/skills/frontend-design/SKILL.md:33) — Внешний plan вводит собственные palette/type/signature
- [CREATIVE_DIRECTOR.md:104](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md#L104) — Внешний skill допускается только как lane tool

**Правило → ограничение → возможный результат.** Роутинг оценивает tool по hand-authored why, но presence устанавливается по имени, не по semantic version/digest. Поэтому достигнутый локальный frontend-design может иметь другую доктрину. Одновременно его собственный процесс предлагает создать identity заново, а sheleg разрешает лишь работу внутри pack. Без scoped brief контрактов модель либо подавляет полезную exploration часть, либо заводит вторую identity.

**Что наблюдалось.** В текущем reachable ~/.agents/skills/frontend-design/SKILL.md нет Inter/Roboto/Arial bans. Исходный upstream по source string не переаудирован, поэтому finding именно про несоответствие recommendation реально достигнутому skill на этой машине. В retrieved Nicegram turn его чтение не найдено; обвинять конкурирующий skill в результате Nicegram нельзя.

**Конкретное изменение.** Указывать resolved path/digest/version/provenance и обновлять why по достигнутому descriptor либо помечать как generic upstream description. Для каждого cast tool давать scoped input: что fixed, что open, какие deliverables нужны, чьи инструкции о copy/implementation применимы. frontend-design использовать для concept hypotheses/visual critique внутри согласованных границ, а не второй end-to-end router.

**Проверка принятия.** Fixture с двумя разными frontend-design реализациями одного имени показывает оба источника, выбирает actual resolved file и не печатает отсутствующие bans. Cast handoff для preserve-brand передаёт palette invariants, но оставляет composition exploration; для exact-Figma reproduction отключает aesthetic risk. Route trace хранит digest прочитанной версии.

О фактической стороне VD-04: [официальная документация shadcn/ui](https://ui.shadcn.com/docs) описывает собственные default styles. О DOM-контракте VD-05: [React Common components](https://react.dev/reference/react-dom/components/common) описывает стандартные ARIA attributes; wrapper должен явно передать их в DOM. Эти источники проверены 2026-09-07. Остальные ограничения выше установлены по локальным текстам и коду, а их будущие визуальные последствия отмечены как гипотезы.

## Предлагаемая архитектура design lane

1. **Brief + scenario contract.** super-ux даёт job, реальные данные, состояния и границы. sheleg-design добавляет platform target, output renderer, preserved brand invariants и свободные visual axes. Read-only аудит не создаёт новый UX продуктовый pack автоматически.
2. **Reference board.** 3–5 конкретных визуальных ориентиров, каждый со ссылкой/изображением, задачей, наблюдаемым приёмом и ограничением переноса. Отделить «наблюдал» от «решил применить». Разрешить анализ типографики, elevation, control anatomy и optical rhythm; это не разрешение копировать чужую идентичность или игнорировать выбранный бренд.
3. **Visual exploration.** Для существенного открытого решения2–3 небольших rendered directions на одинаковом реальном сценарии. Различаются композиция, типографический характер и один намеренный выразительный приём; не только hue. Для exact implementation/малой правки этап не нужен. Существующий бренд фиксирует именно brand invariants, а не всё пространство решений.
4. **Choose direction.** Сначала usability/accessibility hard floors, затем сравнительное профессиональное суждение с конкретными достоинствами/недостатками. При двух защищаемых вариантах показать выбор человеку; не спрашивать разрешение перед каждым обратимым рендером. Зафиксировать выбранный эталон и отклонённые варианты как evidence — production harness удаляется, comparative artifacts сохраняются.
5. **Semantic system.** Только теперь примитивы → semantic roles → component tokens/platform adapter. Пак становится reusable commitment. Существующий pack может быть исходным материалом, но не обязательным итогом. Реальный component geometry/state anatomy проверяется отдельно от color aliases. Изменение разрешённой open axis не считается drift до выбора.
6. **Render → critique → edit → render.** Один owner удерживает chosen direction; внешний frontend-design/impeccable работает scoped на exploration/critique, implementation tool — на code, a11y tool — на accessibility. На каждый существенный визуальный комментарий есть screenshot/crop и исправление. Responsive, keyboard, long text и состояния должны проверяться в том же цикле.
7. **Scenario walkthrough + handoff.** Пользователь открывает цель, а затем проходит реальный clickable route; рядом карта и prepared states. Демо и production evidence разнесены. Для завершения нужны design choice, inspected render и scenario evidence; ни число PNG, ни token lint отдельно не дают статуса «дизайн хороший».

Такой pipeline жизнеспособен без обязательного Figma/Mobbin, без39live builds и без постоянного спора двух роутеров. При отсутствии references честно использовать предоставленные изображения/существующий UI/платформенные defaults и указать ограничение. При отсутствии renderer отдавать provisional concept с непройденной visual проверкой; не объявлять source review осмотром картинки.

## UX clickable scenario matrix как обязательный выход для сложной поверхности

У Nicegram уже есть14 journeys/111prepared nodes по собственным receipts; это полезная инфраструктура, её не нужно строить повторно. Следующий шаг — добавить сравнение визуального исполнения к существующей карте, а не наращивать число страниц.

| Измерение | Что хранить | Что доказать |
|---|---|---|
| Scenario | ID, user goal, source/provisional status, start preconditions | цель не придумана как подтверждённое пользовательское исследование |
| Node/state | screenID, UI state, content fixture, selected reference render | prepared node не выдаётся за пройденный пользователем путь |
| Edge | реальное действие, expected response, side effects, recovery | переход кликается; ошибка не маскируется достижением цели |
| Context | аккаунт, доступ/баланс, выбранные сообщения, draft | context/draft не теряются при map, back, error и handoff |
| Visual | directionID, viewport/theme/text size, screenshot, critique delta | state fidelity и control anatomy видимы на целевой поверхности |
| Evidence | code anchor, executed check, observed render, native gap | browser fixture не подменяет native runtime и production integration |

Минимальные representative маршруты: первый вопрос; пустой/длинный ответ; stop/retry; context selection и редактирование черновика; append/replace/Undo; balance/auth recovery; system keyboard; accessibility large text; offline/service failure; scope change между чатами. Не нужно полное декартово произведение111×все viewport: risk-based representative states плюс проверенные edge transitions. Матрица должна помогать выбирать покрытие и обнаруживать дырки.

## Как доказать улучшение самого навыка

Сравнить frozen current instructions с candidate на одинаковой модели, версии инструментов, brief и бюджете. Набор: существующий consumer iOS chat с брендом, новый productivity app, плотный dashboard, editorial marketing, exact Figma update, reduced-motion/large-text вариант. На существенных briefs несколько независимых runs; blind reviewers видят изображения/интеракции без labels current/candidate. Оценивать по отдельности scenario completion, accessibility, platform fidelity, visual hierarchy, product specificity, deliberate craft и стоимость/latency. Никакого сводного процента «красоты» из static lints. Human preference сохранять как предпочтение, не универсальный факт.

Принятие candidate: нет регрессии сценариев/доступности, direction evidence и реальные render critiques присутствуют, comparative judgments показывают устойчивую пользу хотя бы на consumer/native и new-design задачах; exact-update не раздут обязательным exploration. Если выигрыш неустойчив — уточнить rule, не расширять список bans. Такой эксперимент здесь не выполнялся.

## Полнота чтения и проверок

Полностью прочитаны local SKILL, CREATIVE_DIRECTOR, MOBILE_SURFACES, AI_PRODUCT_PATTERNS, DESIGN_SYNC_BRIDGE, FIGMA_BRIDGE; super-ux visual-identity/figma-integration; достигнутый frontend-design; весь default workbench kit:12TSX,12usage docs, styles.css, index, README, package/tsconfig и conventions. Motion/pack corpus покрыты ранее ux-design и coverage-supplement, а здесь не выдаются за новый независимый повтор всех чтений. Кинематический renderer не исполнялся.

Nicegram: прочитаны design style, tokens/styles/inchat styles и verification/brief; selected code sections подтверждают controls. Посмотрены original board, G01 start и C01 ready screenshots. Сценарии и test results взяты из локальных receipts/истории и не перезапускались в этом дополнении. Полное чужое приложение и private Swift repos заново не аудировались. Никаких source/board edits, server launches, deploy, сообщений в другую задачу или credentials в artifacts.

Механический scan39kits прочитал Button/Heading полностью, остальные38kits целиком не проверялись в этой подзадаче. JSON отличает `read_full`, `read_selected` и structural scanned files с SHA256. Точные результаты scan ниже; это контрактная проверка, не live React test.

```json
{
  "probe": "39 Button/Heading source-contract scan; no execution of React code",
  "count": 39,
  "native_props_inheritance": 0,
  "props_spread": 0,
  "fixed_button_type": 39,
  "heading_coupled": 39
}
```

Подробный [JSON findings + coverage](design-depth.json); [скрипт повторения структурной проверки](build-design-depth.py). Команда повторения: `python3 audit://extension/build-design-depth.py`.
