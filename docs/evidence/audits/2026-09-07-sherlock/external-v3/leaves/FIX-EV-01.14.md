# FIX-EV-01.14 — Outcome corpus: sheleg-design

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Create `repo://sheleg-design/evals/cases/sheleg-design.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-ev-01.14.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

DS-01: Сравнение packs сменой CSS не имеет общего token API — Workbench↔orchard↔showroom на одинаковых button/table/card states: все role vars resolve, после переключения нет старых значений; screenshot+computed-style assertions для light/dark/focus/reduced-motion.

DS-02: Опрос о значении craft превращён в нормативный порядок разработки — Вопрос «что доказывает 58%?» возвращает association in survey, не причинный эффект/priority. Brief со сломанной основной задачей сначала решает её даже при идеальных токенах.

DS-03: Производительность CSS/API описана абсолютами вместо проверяемых условий — Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.

DS-04: Duration table допускает 500ms, общий UI gate запрещает >300ms — 400ms modal fixture получает один однозначный verdict с rule ID; 150ms button и 500ms authored marketing entrance различаются; documentation and token checker используют одну таблицу.

DS-05: No-JS критерий применяется ко всем поверхностям, включая внутренние UI — Public pricing получает no-JS check; authenticated admin SPA — N/A для crawler HTML; SwiftUI screen не получает требование SSR. Общие contrast/input проверки остаются.

DS-06: Eval-регрессия не покрывает текущий composition/runtime — Каждая текущая версия имеет reproducible run manifest; ambiguous prompt проверяет route+subtools+stopping conditions, не один name. Figma unavailable/no Node/no browser явно measured degradation, не исключённый сценарий.

VD-01: Идентичность фиксируется раньше визуального исследования, а наличие системы закрывает допустимый поиск композиции — На брифе «улучшить Nicegram, сохранить бренд» показать минимум две реально разные композиции стартового чата и context sheet; у каждой неизменны бренд и сценарий, явно различаются ≥2 открытых визуальных оси. На «исправить spacing по точному Figma» вариаций не создавать. Повторить с существующим токен-файлом и без него; наличие токенов само по себе не должно закрывать exploration.

VD-02: Скриншоты и quality gates есть, но нет обязательного цикла художественной критики конкретного рендера — Один reviewer без чтения кода сравнивает до/после на одинаковом viewport/content. Для каждого замечания есть image region и видимое изменение; замечания «premium/generic» без конкретики не считаются. Оба варианта отдельно проходят accessibility/UX. При равном результате user видит осмысленный tradeoff. В eval нельзя засчитывать наличие PNG или слово polish как успех визуального качества.

VD-03: Mobile/native ветка не завершена платформенным адаптером, а общий product default остаётся вебовым — Для одного context-sheet сценария проверить web prototype и native-equivalent spec: selection, keyboard, sheet detents/dismissal, safe areas, accessibility size, submit/stop, restoration. Browser computed input font соответствует выбранному web floor; iOS native evidence не выдаётся за browser screenshot. В route на SwiftUI не появляется RN/Expo как единственный mobile ответ. Наличие Dynamic Type помечается measured/unverified, а не inferred from clamp.

VD-04: shadcn назван unstyled: token mapping ошибочно подаётся как достаточное отсутствие чужой визуальной системы — В fixture взять Card/Button/Dialog одной версии shadcn, применить pack и проверить не только цветовые variables, но вычисленные размеры, padding, radius, shadow, fonts, states. Список намеренно сохранённых defaults должен быть явным. Документация dependency подтверждается https://ui.shadcn.com/docs; version/checked date фиксируются.

VD-05: Общий kit spine фиксирует внешний API ценой базовой DOM-семантики и доступных адаптаций — Small tests: icon-only button передаёт aria-label; trigger передаёт aria-expanded/controls; submit button отправляет форму; ref.focus работает; heading h2 может выглядеть как display/h1, не меняя outline. Проверить это через реальный DOM/render хотя бы одного representative kit и structural shared-contract check39, без обязательных39live builds.

VD-06: Dials дают числовой ритуал без воспроизводимой визуальной калибровки двух осей — Два независимых исполнителя по одному brief должны объяснить через одинаковые наблюдаемые признаки, что означает density/variance. Число без anchors не считается evidence. Проверить quiet dashboard, consumer chat и accessibility-large-text: одинаковая цифра не подменяет разные платформенные задачи.

VD-07: Каталог внешнего frontend-design приписывает найденному skill запреты, которых его текущий файл не содержит — Fixture с двумя разными frontend-design реализациями одного имени показывает оба источника, выбирает actual resolved file и не печатает отсутствующие bans. Cast handoff для preserve-brand передаёт palette invariants, но оставляет composition exploration; для exact-Figma reproduction отключает aesthetic risk. Route trace хранит digest прочитанной версии.

UP-05: Перезапись member/runtime не атомарна и не даёт rollback — Fault injection на первом/среднем/последнем copy и rename сохраняет старую полностью рабочую generation или новую полностью проверенную.
SIGTERM после stage и до switch не меняет active; после switch journal позволяет rollback.
Проверка --force=false не перезаписывает existing Design shell files; --force=true создаёт recoverable generation.
Obsolete managed resources удаляются по manifest, неизвестные пользовательские файлы сохраняются.

UP-08: Host roots фиксированы и расходятся с поддерживаемыми overrides — Fixture custom CODEX_HOME/CLAUDE_CONFIG_DIR меняет только выбранный root, default stays byte-identical.
Plugin collision в custom root обнаруживается до записи; stale default root не блокирует другой профиль.
Windows/XDG/root-with-spaces и missing host дают отдельные протестированные results; неподдержанные платформы UNKNOWN.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для sheleg-design записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; sheleg-design не проходит лишь по названию. Недоступный live host = NOT_RUN.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-EV-01.01` (data): Uses common outcome manifest and honest result semantics.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.14.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
