# Детальный аудит super-ux и sheleg-design

Дата: 2026-09-07. База: закреплённые версии umbrella sshlg-skills. Проверено 8 SKILL.md целиком: 7 скиллов super-ux 0.55.1 и sheleg-design 1.59.4. Это read-only аудит и план, исходники не исправлялись. Положительные локальные проверки не означают отсутствие смысловых дефектов.

## Краткая матрица по каждому скиллу

| Скилл | Что сделано хорошо | Находки |
|---|---|---|
| vision | Anti-vision и alignment превращают направление в исполнимое ограничение; существующие решения не предлагается молча переписывать. | UX-06, UX-07 |
| ux-foundation | Отдельно описаны JTBD, силы переключения, риски моделей; reverse требует evidence и confidence; отсутствующие знания разрешено маркировать. | UX-08, UX-09, UX-10 |
| ux-flows | Платформенные third-state ветки, recovery, source/data boundary, provisional profile и consideration≠adoption продуманы; practice granularity уже сокращает накладные расходы. | UX-09, UX-10, UX-11 |
| ux-scenarios | Stable IDs, same-change rule, draft/retired, явная разница delivery и Product outcome; задачи usability testing не подсказывают UI. | UX-10, UX-11 |
| ux-audit | BLOCKED вместо courtesy PASS, scope/limits, cross-batch reconciliation, live overrides static, Product state не повышается аудитом. | UX-01, UX-02, UX-03, UX-12, UX-13 |
| brand-voice | Facts имеют Source/Checked/Review/Public, локали и регистры отдельно; неизвестные факты запрещено заполнять выдумкой. | UX-01, UX-02, UX-03 |
| copywriting | Явный semantic-preservation checklist, no-op для хорошего текста, optional tool fallback, точные факты и продуктовые термины. | UX-01, UX-02, UX-03, UX-04, UX-05 |
| sheleg-design | 39 token layers, style/motion separation, reduced-motion across CSS/JS/SMIL, falsifier+rubric до вариантов, явные пределы измеримости вкуса. | DS-01, DS-02, DS-03, DS-04, DS-05, DS-06 |

У ux-scenarios не найден отдельный уникальный дефект парсера в проверенной выборке: его риски общие с upstream flow gate (UX-11), с переносом loading (UX-10) и семантикой доказательства аудита (UX-12). Это не основание выдумывать уникальную поломку для каждой строки.

## Находки: доказательство → ущерб → конкретное исправление → приёмка

### UX-01 · P1 · B030 не доказывает происхождение утверждения

**Тип:** reproduced. **Скиллы:** brand-voice, copywriting, ux-audit.

Все публичные значения объединяются в set без subject, unit, denominator или ссылки утверждения на факт. Единственный факт «supported integrations = 500» разрешает «We serve 500 million paying customers». Воспроизведено: check_facts вернул []. Отдельно пропущены «99 languages» (голые числа <100 не извлекаются) и «2026 integrations» (любое 19xx/20xx объявлено годом).

**Доказательства:** `repo://super-ux/plugins/super-ux/scripts/brand_lint.py:843`; `repo://super-ux/plugins/super-ux/scripts/brand_lint.py:1092`; `repo://super-ux/plugins/super-ux/scripts/brand_lint.py:1134`; `repo://super-ux/plugins/super-ux/skills/brand-voice/references/brand-contract.md:218`.

**Последствие:** Ложный пропуск именно в защите от выдуманных данных. Документ/копирайтер может прочитать отсутствие B030 как подтверждение, хотя предмет и масштаб заменены. Это не доказывает, что такие утверждения уже публиковались.

**Изменение:** Ввести claim-id → fact-id, субъект, единицу, популяцию, дату и разрешённые преобразования. Линтер проверяет ссылку/единицу/точность, семантический аудит проверяет утверждение. До этого сузить обещание B030 до проверки известного числового токена и явно показывать unverified claims. Не исключать год без контекста.

**Критерий приёмки:** Три строки из probes должны получить unresolved/mismatched-claim; корректные 500 integrations проходят; 500 million customers не проходят; даты и диапазоны распознаются по типу поля.

### UX-02 · P1 · B051 объявляет спамом текст без единого повторения

**Тип:** reproduced. **Скиллы:** brand-voice, copywriting, ux-audit.

После 40 значимых слов любой token >1% даёт error. Для 45 уникальных слов частота каждого 1/45=2.22%; тест получил B051 на item0, ни одного повтора нет. Для короткой страницы условие математически невыполнимо. Дополнительно все marketing code files объединены в один документ без route mapping.

**Доказательства:** `repo://super-ux/plugins/super-ux/scripts/brand_lint.py:1531`; `repo://super-ux/plugins/super-ux/scripts/brand_lint.py:1538`; `repo://super-ux/plugins/super-ux/skills/brand-voice/references/brand-contract.md:421`.

**Последствие:** Блокирует корректную короткую копию и поощряет искусственное удлинение/синонимы; объединение страниц может скрывать локальную переоптимизацию. Фраза «lowers citation likelihood» представлена как измеренный эффект, но в коде это порог без измерения поисковой выдачи.

**Изменение:** Сделать repetition advisory с минимальным count и длиной, учитывать зарегистрированные термины и язык, группировать по реально отрендеренной странице. Удалить универсальное обещание влияния на цитирование. Google описывает unnatural repetition/manipulative intent, а не порог 1%: https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing .

**Критерий приёмки:** 45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.

### UX-03 · P1 · Humanization «никогда не блокирует» расходится с исполняемым B060

**Тип:** reproduced. **Скиллы:** brand-voice, copywriting, ux-audit.

SKILL запрещает превращать marker count в verdict/gate; reference задаёт grades «reads as written by a person», «decisive on its own», error при 3 S1. Код считает substring и выдаёт error. Цитата-словарь с delve / needless to say / in conclusion воспроизводит error и Naturalness grade C; Humanization: off с причиной ничего не меняет.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md:128`; `repo://super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md:31`; `repo://super-ux/plugins/super-ux/skills/copywriting/references/ai-tells.md:35`; `repo://super-ux/plugins/super-ux/scripts/brand_lint.py:1600`.

**Последствие:** Ухудшает авторский текст ради прохождения линтера и противоречит обязательной сохранности цитат. Возникает эвристическое распознавание происхождения текста без валидированной модели и без калибровки по языкам.

**Изменение:** Единый контракт: humanization review всегда advisory, word markers не устанавливают authorship/naturalness grade. Учитывать цитаты/код/термины, разделить редакционный off и явно выбранные brand bans. Удалить severity переход из количества маркеров.

**Критерий приёмки:** Цитируемый словарь остаётся неизменным и не блокирует; off не запускает скрытый обязательный rewrite; негативные примеры русской грамматики/второго языка проходят; semantic-preservation тесты числа/отрицания/каузальность обязательны.

### UX-04 · P2 · У одного скилла два несовместимых правила владения strings.md

**Тип:** observed_instruction_conflict. **Скиллы:** copywriting.

Правило «This skill never writes to docs/brand/» абсолютно; Write step 5 и DoD требуют добавлять/обновлять strings.md, который находится в docs/brand/.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md:25`; `repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md:81`; `repo://super-ux/plugins/super-ux/skills/copywriting/SKILL.md:161`.

**Последствие:** Агент либо нарушает собственный запрет, либо оставляет реестр несогласованным, либо делает лишний handoff на каждую строку.

**Изменение:** Разделить ownership по файлам: brand-voice владеет voice/terms/facts/channels/locale policy, copywriting пишет strings.md (proposed) и продуктовый текст. Общая схема явно разрешает эти mutations и claim при координации.

**Критерий приёмки:** Изменение одного error string обновляет исходник и proposed row за один проход; voice/facts не меняются; нет дополнительного approval только из-за размещения strings.md.

### UX-05 · P1 · Поведенческий eval выдаёт PASS проваленному процессу и не проверяет заявленный контракт

**Тип:** reproduced. **Скиллы:** copywriting.

run.py не проверяет subprocess.returncode и оценивает substring. Подмена процесса на exit 1 с stdout «Humanization: no copy produced; process failed» даёт PASS/exit 0 (EV-01). EV-04 обещает отдельную status line на поверхность, но expect содержит только один Humanization:; одна строка без обеих копий также PASS. Это локальная mock-проверка scorer, не запуск модели.

**Доказательства:** `repo://super-ux/test/evals/run.py:54`; `repo://super-ux/test/evals/run.py:62`; `repo://super-ux/test/evals/cases.json:7`; `repo://super-ux/test/evals/cases.json:40`.

**Последствие:** Метрика измеряет печать слова, а называется выполнением humanization. Ошибка harness может отчётно подтвердить отсутствие работы. cwd=реальный репозиторий, без изолированного fixture, даёт риск изменения/контаминации, платный запуск здесь намеренно не выполнялся.

**Изменение:** Ошибка/timeout/tool refusal = отдельный outcome; изолированный fixture, фиксированный scope tools, запись run manifest/stdout/artifacts. Проверять число surfaces и изменения текста/semantic invariants; не только наличие строки. Отдельно тестировать order sweeps и no-op уже хорошего текста.

**Критерий приёмки:** Обе mock-подмены из probes должны FAIL; невалидный exit никогда PASS; успешный artifact с двумя поверхностями и двумя корректными строками проходит; репозиторий до/после одинаков.

### UX-06 · P2 · Новый проект Codex получает правило в CLAUDE.md

**Тип:** observed_instruction_conflict. **Скиллы:** vision.

Step 4 правильно перечисляет файлы по агенту, затем при отсутствии всех создаёт CLAUDE.md. Линтер удовлетворяется любым из трёх файлов и не проверяет, читает ли его текущий host.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/vision/SKILL.md:123`; `repo://super-ux/plugins/super-ux/skills/vision/SKILL.md:125`; `repo://super-ux/plugins/super-ux/scripts/ux_lint.py:787`.

**Последствие:** В Codex/Gemini rule может быть установлен в невидимый файл, а наличие считаться выполненным. Это точный противоречивый путь инструкции; новый host session не запускался.

**Изменение:** Сначала определить host capabilities; default instruction target по текущему host, explicit project target приоритетнее. Проверка должна сверять materialized rule с активным target, не только с существованием любого файла.

**Критерий приёмки:** Пустые fixture Codex/Claude/Gemini создают соответственно AGENTS.md/CLAUDE.md/GEMINI.md; repeat идемпотентен; mixed-host проект получает согласованные явно обозначенные targets.

### UX-07 · P2 · Язык vision и обязательный формат заголовков не согласованы на входе

**Тип:** observed_instruction_conflict. **Скиллы:** vision.

SKILL велит писать на языке документации, но не требует прочитать scenario-format и не выделяет invariant headings. Контракт и regex требуют девять буквальных английских heading. Русская vision с семантически эквивалентными секциями будет U030.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/vision/SKILL.md:68`; `repo://super-ux/plugins/super-ux/skills/ux-scenarios/references/scenario-format.md:164`; `repo://super-ux/plugins/super-ux/scripts/ux_lint.py:741`.

**Последствие:** Риск лишнего rewrite/отказа валидации для корректного русскоязычного документа. В отличие от тела, это форматная неоднозначность, а не претензия к девяти выбранным слоям.

**Изменение:** Явно прочитать контракт до записи; использовать устойчивые section IDs с локализуемыми title либо сказать, что машинные headings остаются английскими, а содержание переводится.

**Критерий приёмки:** Русский fixture всех 9 секций проходит по canonical IDs; действительно отсутствующая anti-vision fail; изменение языка title не меняет identity.

### UX-08 · P2 · Approval оператора может стереть происхождение предположения

**Тип:** risk_from_contract. **Скиллы:** ux-foundation.

Reverse предписывает observed/inferred, затем держит inferred «until the user confirms». Контракт confirmed описывает как подтверждение наблюдением. Оператор-основатель может подтвердить желаемую персону без исследования; отдельные approval и evidence status не представлены.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md:87`; `repo://super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md:126`; `repo://super-ux/plugins/super-ux/skills/ux-foundation/SKILL.md:132`; `repo://super-ux/plugins/super-ux/skills/ux-foundation/references/scenario-format.md:92`.

**Последствие:** После подтверждения предположение начинает читаться как знание о пользователях и каскадирует в flows/brand. Реальные сфабрикованные persona в этом аудите не обнаружены; это путь ошибочного повышения уверенности.

**Изменение:** Развести evidence_kind (brief/owner-belief/interview/telemetry/code-inference), decision_status и validation_status. Approval меняет decision, но не provenance. Для эмоций и Frequency×Severity×Solvability хранить источник, шкалу и unknown вместо обязательного выдуманного балла.

**Критерий приёмки:** Owner говорит «подтверждаю» гипотезу: решение accepted, evidence остаётся inferred; реальное интервью/наблюдение добавляет dated receipt. Неизвестная частота не получает цифру ради заполнения таблицы.

### UX-09 · P2 · Воронки конкурентов из proxy превращаются в «proven base»

**Тип:** observed_semantic_conflict. **Скиллы:** ux-foundation, ux-flows.

Reference честно признаёт, что убыточная хорошо финансируемая воронка выглядит как прибыльная, но рядом говорит «Nobody keeps paying ... at a loss for months», «production spend follows return», а распространённые паттерны называет proven base. Неизвестный profit превращается в доказанную причинную эффективность.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/ux-foundation/references/funnel-research.md:81`; `repo://super-ux/plugins/super-ux/skills/ux-foundation/references/funnel-research.md:86`; `repo://super-ux/plugins/super-ux/skills/ux-foundation/references/funnel-research.md:118`.

**Последствие:** Survivorship/selection bias направляет продукт на чужую аудиторию; повторение конкурентов может быть общей ошибкой, шаблоном агентства или правилом платформы. Это логический конфликт самой методики, не установление фактической убыточности чьей-либо рекламы.

**Изменение:** Все market signals маркировать как observed exposure; вывод о механизме как hypothesis с альтернативными объяснениями. Частоты считать скриптом по corpus с denominator/дубликатами; adoption через локальный эксперимент, не «proven» из частоты.

**Критерий приёмки:** Корпус из 10 похожих funnels даёт frequent pattern, не proven conversion lift; известный убыточный рекламодатель не ломает вывод; два funnels одного владельца не независимые наблюдения.

### UX-10 · P1 · Loading из существующей задержки превращён в инсценировку вычисления

**Тип:** observed_semantic_conflict. **Скиллы:** ux-flows, ux-foundation, ux-scenarios.

BP-005 применим когда loading/preparation уже существует. Funnel-research задаёт обязательный шаг Loading как «A calculated pause that makes the result feel computed for this person», а SKILL требует занести каждый шаг (включая loading) в экран/сценарий. Это расширяет практику до искусственной задержки и создаёт риск ложного впечатления персонального расчёта.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/ux-flows/references/funnel-research.md:192`; `repo://super-ux/plugins/super-ux/skills/ux-flows/references/funnel-research.md:198`; `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:161`; `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:64`.

**Последствие:** Можно ухудшить time-to-value и ввести человека в заблуждение о реальной обработке его данных, затем легализовать это цепочкой SCN/UX audit. Нет подтверждения, что такой интерфейс уже отгружен.

**Изменение:** Loading только при реальной асинхронной работе; показывать фактическую операцию и не задерживать готовый результат. Если narrative pause нужен продукту, назвать его честно без claims персонального анализа и измерить затраты/понимание.

**Критерий приёмки:** Мгновенный локальный результат отображается без таймера; медленная операция показывает реальное pending; текст не заявляет анализ, которого нет; сценарий пустого ответа не выдаёт фиктивную персонализацию.

### UX-11 · P1 · Figma fallback и provisional flow не доходят до разрешённого build state

**Тип:** observed_instruction_conflict. **Скиллы:** ux-flows, ux-scenarios.

Design допускает provisional profile без foundation и text-only при недоступном Figma. Финальный build gate требует всю утверждённую цепочку и, при default Figma enabled, каждый state linked to frame. ux-scenarios допускает no-Traces только tiny/explicit choice. Деградация разрешает создать текст, но не объясняет, какие условия снимают блок реализации.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:98`; `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:194`; `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:278`; `repo://super-ux/plugins/super-ux/skills/ux-flows/SKILL.md:294`; `repo://super-ux/plugins/super-ux/skills/ux-scenarios/SKILL.md:33`.

**Последствие:** Нет единого терминального состояния: агент продолжает документацию и застревает на gate либо игнорирует правило. В уже авторизованной работе это выглядит повторным запросом разрешения на обычный следующий шаг.

**Изменение:** Единый state machine full / provisional / tooling-degraded / declined. Gate читает effective capabilities и accepted decisions; отсутствие optional Figma не блокирует approved text spec. Серьёзные неизвестные блокируют только зависимые решения, а не весь продукт. Сохранённые approvals учитываются во всех слоях.

**Критерий приёмки:** Brief «реализуй согласованный экран», Figma недоступен: text spec + explicit deferred frame sync, код выполняется; destructive unknown остаётся blocked; при восстановлении Figma обновляется запись без повторного запуска всей цепочки.

### UX-12 · P1 · Статический PASS может повысить сценарий до implemented без проверки наблюдаемого результата

**Тип:** observed_evidence_mismatch. **Скиллы:** ux-audit.

Loop проверяет «expected result observably occurs» против code; validated → implemented после PASS. Live pass off by default. Код может содержать ветку, но реальные env/auth/network/CSS её не дают пользователю. Источник file:line доказывает текст реализации, не всякий runtime outcome.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:210`; `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:218`; `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:249`; `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:290`.

**Последствие:** Ложная уверенность в достижимости ожидаемого результата. Не каждый static PASS ошибочен: чистые локальные свойства можно доказать чтением. Проблема — отсутствие раздельного evidence type и требований по типу проверяемого свойства.

**Изменение:** Разделить static conformance, executable verification и production observation. Для runtime зависимых критериев PASS только с тестом/браузером/проверенным runtime receipt, иначе BLOCKED/unverified. Сохранить хорошее разделение delivery vs Product outcome.

**Критерий приёмки:** Fixture содержит кнопку и handler, но overlay перехватывает click: static-conformant, live FAIL, implemented не выставляется. Pure static invariant допускает PASS с указанием proof type. В недоступном browser не придумывается результат.

### UX-13 · P2 · Общий precondition требует scenarios даже независимому copy/benchmark scope

**Тип:** observed_instruction_conflict. **Скиллы:** ux-audit.

В начале unconditional stop если нет scenarios; ниже copy требует только voice и single-pass scopes запускают только соответствующий pass. Standalone brand/copy проекта без UX цепочки ошибочно маршрутизируется в создание scenarios. Benchmark также требует file:line для внешних наблюдений.

**Доказательства:** `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:25`; `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:45`; `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:70`; `repo://super-ux/plugins/super-ux/skills/ux-audit/SKILL.md:203`.

**Последствие:** Scope creep, создание ненужных артефактов и потеря времени до read-only ответа. Существует развилка текста, а не доказанный сбой live invocation.

**Изменение:** Предусловия вычислять после scope: scenario → base, copy → brand, benchmark → observed URLs+receipts. Схема evidence допускает URL+timestamp+capture для внешних данных; file:line только для code claims.

**Критерий приёмки:** Запрос /ux-audit copy в блоге с brand без scenarios проводит только copy audit; /ux-audit all без base объясняет ограничение; benchmark не выдумывает локальный file:line.

### DS-01 · P1 · Сравнение packs сменой CSS не имеет общего token API

**Тип:** observed_contract_gap. **Скиллы:** sheleg-design.

SKILL честно говорит, что во всех packs совпадают только --bg/--ink, но велит менять только token layer на существующей странице с тем же markup. Workbench использует --panel/--accent/--r-control/--font-ui; orchard — --surface/--cta/--radius-sm/--font-sans. Не определён adapter для сравнения.

**Доказательства:** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:179`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:197`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/workbench.css:5`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/orchard.css:8`.

**Последствие:** Исчезающие declarations/fallback или остатки предыдущего CSS дают неверную оценку pack. Это подтверждённый интерфейсный разрыв; браузерное воспроизведение всех 39 packs здесь не проводилось.

**Изменение:** Ввести небольшой semantic role API и per-pack adapter, не переименовывая identity tokens. Harness заменяет весь scope atomically, обнаруживает unresolved var и не наследует старый pack. Проверять совместимость компонентных slots; сравнивать layout отдельно когда pack требует другой композиции.

**Критерий приёмки:** Workbench↔orchard↔showroom на одинаковых button/table/card states: все role vars resolve, после переключения нет старых значений; screenshot+computed-style assertions для light/dark/focus/reduced-motion.

### DS-02 · P2 · Опрос о значении craft превращён в нормативный порядок разработки

**Тип:** source_verified_inference_error. **Скиллы:** sheleg-design.

Числа 58/47/36/35/15 воспроизводятся в первоисточнике Figma, но это частота определения craft, не измерение эффективного порядка работ. Скилл делает переход «Read that as a definition of done, in that order», ставя polish до problem solving/clear UX.

**Доказательства:** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:154`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md:159`.

**Последствие:** Искажение корректных данных на стадии интерпретации. Может усиливать оптимизацию под внешнюю убедительность до решения пользовательской задачи, хотя Creative Director отдельно требует alignment-first.

**Изменение:** Оставить опрос как контекст с точным смыслом и ссылкой; порядок gates вывести из dependency graph: задача/состояния/доступность/система/polish. Обязательный порядок обозначить как авторское решение, не вывод исследования. Источник: https://www.figma.com/blog/state-of-the-designer-2026/ .

**Критерий приёмки:** Вопрос «что доказывает 58%?» возвращает association in survey, не причинный эффект/priority. Brief со сломанной основной задачей сначала решает её даже при идеальных токенах.

### DS-03 · P2 · Производительность CSS/API описана абсолютами вместо проверяемых условий

**Тип:** source_verified_overclaim. **Скиллы:** sheleg-design.

Запрещён сам addEventListener(scroll) как якобы обязательно janky; filter/clip-path названы safe. Производительность зависит от объёма работы/paint/device. MDN описывает допустимый scroll handler с throttling; Chrome/web.dev предупреждает о стоимости blur и рекомендует измерять pipeline, а не обещает safe для любого filter.

**Доказательства:** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:168`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:179`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:182`.

**Последствие:** Лишние зависимости/переписывание корректного кода и разрешение дорогих эффектов по имени свойства. Нет измерения деградации конкретного shipped app; дефект — формулировка технического правила.

**Изменение:** Заменить API blacklist на budget и recipe: cheap passive reading, avoid layout thrashing, cleanup, measured long tasks/dropped frames. filter/clip-path — conditional, профиль на целевых устройствах. Ссылки: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event ; https://web.dev/articles/animations-guide .

**Критерий приёмки:** Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.

### DS-04 · P2 · Duration table допускает 500ms, общий UI gate запрещает >300ms

**Тип:** observed_instruction_conflict. **Скиллы:** sheleg-design.

Строка modals/drawers/sheets = 200–500ms; следующее правило UI ≤300ms. Exception entrance описан, но таблица не разделяет entrance/interaction/exit, и modal animation обычно отвечает обоим словам.

**Доказательства:** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:114`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:117`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md:315`.

**Последствие:** Агент выбирает корректный по таблице 400ms drawer и нарушает gate либо считает любой UI transition entrance и обходит потолок.

**Изменение:** Единая таблица по purpose+frequency+platform с explicit exceptions и canonical duration IDs. Разделить interactive feedback, spatial modal transition и marketing entrance, убрать пересечение трактовок.

**Критерий приёмки:** 400ms modal fixture получает один однозначный verdict с rule ID; 150ms button и 500ms authored marketing entrance различаются; documentation and token checker используют одну таблицу.

### DS-05 · P2 · No-JS критерий применяется ко всем поверхностям, включая внутренние UI

**Тип:** observed_scope_gap. **Скиллы:** sheleg-design.

Creative Director включает product/agent/native surfaces, а общая обязательная Quality table требует content in served HTML без условия public/web. Router SEO отдельно исключает logged-in internal tools. Native screen вообще не имеет served HTML.

**Доказательства:** `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:32`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:202`; `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md:216`.

**Последствие:** Ненужный SSR/ложный FAIL для внутреннего SPA или native app. Может расширить объём дизайн-задачи до архитектуры backend без пользы.

**Изменение:** Applicability predicates на каждую проверку: public-web-crawlable → no-JS content, web-internal → loading/error/accessibility, native → platform semantics. В отчёте NOT_APPLICABLE с причиной, а не PASS без запуска.

**Критерий приёмки:** Public pricing получает no-JS check; authenticated admin SPA — N/A для crawler HTML; SwiftUI screen не получает требование SSR. Общие contrast/input проверки остаются.

### DS-06 · P2 · Eval-регрессия не покрывает текущий composition/runtime

**Тип:** observed_validation_limit. **Скиллы:** sheleg-design.

Design результаты версии 1.58.2, baseline 1.59.4; UX результаты 0.52.2, baseline 0.55.1. По одному trigger probe вместо обещанных трёх, scenario design оценивает планы read-only, а live build/Figma explicitly not reproducible. Это честно раскрыто, но не доказательство текущего исполнения/роутинга в полном окружении.

**Доказательства:** `repo://sheleg-design/test/evals/RESULTS.md:16`; `repo://sheleg-design/test/evals/RESULTS.md:38`; `repo://sheleg-design/test/evals/RESULTS.md:47`; `repo://super-ux/test/evals/RESULTS.md:12`; `repo://super-ux/test/evals/RESULTS.md:81`.

**Последствие:** Чистые structural gates можно принять за behavioral confidence. Full roster текущего host сильно больше 28/31 кандидата; layered routing нельзя оценить вопросом «which ONE skill».

**Изменение:** Сохранить историю, добавить current-version manifest, реальные packaged installs, несколько seeds/repeats на поддержанных host/model, multi-skill route sequence и resource budget. Runtime fixtures вместо только планов; transcript/content hash сохранять за пределами /tmp.

**Критерий приёмки:** Каждая текущая версия имеет reproducible run manifest; ambiguous prompt проверяет route+subtools+stopping conditions, не один name. Figma unavailable/no Node/no browser явно measured degradation, не исключённый сценарий.

## Архитектура, которая сохраняет сильную сторону семейства

Оставить слои vision → foundation → flows/screens → scenarios → implementation → verification → outcomes, но превратить стрелки в контракты данных. У каждого объекта должны быть стабильный ID, owner, source/provenance, decision status, evidence status, artifact revision и dependency links. Approval оператора, наличие кода, успешный executable test и измеренный пользовательский результат являются четырьмя разными состояниями.

Роутер сначала определяет намерение и scope, затем обязательные предпосылки конкретного scope, затем effective capabilities. Планирование/аудит не должно автоматически переходить в изменения. Одно решение о Figma/brand/pack/approval записывается и используется всем графом. Tooling-degraded и provisional — допустимые состояния с явно описанными разрешёнными выходами; неизвестное блокирует только зависящий от него шаг.

Единый registry практик нужен не как ещё один список правил, а как типизированные записи: fact/policy/preference/heuristic, applies_when, source, source-date, population, confidence, enforcement, exception. Hard gate допустим для нарушенного контракта/наблюдаемого дефекта. Вкус, статистическая частота чужого решения и machine-drafting marker не становятся error по умолчанию.

Для визуального слоя нужен semantic role adapter поверх индивидуальных token packs; для текста — claim-id/fact-id поверх числового поиска. Оба механизма решают одну проблему: одинаковый токен не означает одинаковый смысл. Проверки должны валидировать связь, а не только наличие слов/чисел.

## Сценарии для проверки жизнеспособности

| Сценарий | Корректный маршрут и ожидаемый результат |
|---|---|
| Новый продукт, мало данных | foundation provisional → минимальный flow/scenario; hypotheses остаются hypotheses; не заполнять personas как observed |
| Согласованный UI change, Figma не подключён | чтение сохранённых decisions → text-only spec → authorized build; frame sync deferred |
| Аудит брендовой статьи без приложения | ux-audit copy → brand evidence; не создавать personas/flows |
| Аудит конкурента | capture+URL+time evidence; frequent pattern не становится доказанным lift |
| Хорошая цитата с marker words | preserve quotation; advisory либо no-op; не переписывать ради B060 |
| Ложное число с существующим значением | claim semantic mismatch блокирует; совпадение 500 не доказывает 500 million customers |
| 45-словный текст | отсутствие повторов не спам; B051 не требует раздувания |
| Reverse существующего продукта | code-inference отдельно от пользовательского evidence; owner approval не стирает provenance |
| Визуальное сравнение двух packs | semantic adapters, no unresolved vars, одинаковые control states и честный layout scope |
| Internal native/mobile surface | public-web SEO/no-JS N/A; platform accessibility и state checks остаются |
| Runtime недоступен | static conformance выводится отдельно, outcome остаётся unverified; отсутствие browser не PASS |
| Уже авторизованный run | approvals и opt-outs учитываются графом; не повторять вопросы из каждого SKILL |

## Последовательность реализации для этих восьми скиллов

1. Зафиксировать baseline и перенести probes в постоянные regression fixtures. Первые блокирующие поправки: UX-01/02/03/05, потому что они дают ложные утверждения о данных и качестве.
2. Унифицировать enforcement taxonomy и state machine: evidence≠approval≠delivery≠outcome; predicates для scope/capability; закрыть UX-04/06/07/11/12/13.
3. Пройти источники практик и переписать причинные обобщения в гипотезы: UX-08/09/10, DS-02/03/04. Не просто смягчить тон: сохранить область применимости, источник и запрещённый вывод.
4. Ввести semantic adapters tokens и claim references; закрыть DS-01 и полноценно UX-01. Сначала два контрастных pack и три типа claims, затем распространить схему миграцией.
5. Сделать host/package degradation suite и scope fixtures (DS-05/06), replay текущих версий с сохранёнными артефактами. Coverage рассчитывать по каждому skill/route/negative case, не общим числом check assertions.
6. Прогнать representative product changes end-to-end: новый продукт, существующий SPA, mobile purchase, брендовый блог, перевод, Figma unavailable. Сравнить baseline/candidate по завершению задачи, ложным gates, сохранности смысла, времени/токенам и реально наблюдаемым UI результатам.
7. Release только когда принятые критерии каждого finding проверены и evidence сохранено. «100%» означает 100% оговорённых acceptance checks на конкретной версии/матрице, а не гарантию истинности любого будущего вывода модели.

## Выполненные проверки и границы

| Команда / проверка | Результат |
|---|---|
| `python3 test/validate.py` в pinned super-ux | exit 0, OK (4623 checks); один explicitly unlooked внешний registry факт |
| `python3 test/brand_lint_test.py` там же | exit 0, OK (102 checks) |
| `python3 test/ux_lint_test.py` там же | exit 0, OK (142 checks) |
| `python3 test/validate.py` в pinned sheleg-design | exit 0, OK (5641 checks); существующие floors допускают 2 unanswered component classes и 4/5 uncarved scrub exceptions |
| `python3 test/evals_validate.py --self-test` в pinned sheleg-design | exit 0, planted invalid trigger class caught |
| `python3 ux-design-probes.py` (приложенный artifact) | восемь синтетических результатов; неверные B030/051/060/scorer состояния воспроизведены |
| `git diff ca855d9..562786b --stat` в local sheleg-design-skill | только CHANGELOG.md, 3 insertion / 2 deletion; runtime различия между local и pinned не обнаружены этим diff |
| Primary web проверки | Google spam-policy не даёт 1% threshold; Figma подтверждает числа, но смысл survey; MDN/Chrome дают условные performance guidance |

Реальные модели повторно не запускались, remote Figma не изменялся, 39 packs не рендерились полностью. Живые CI/distribution/внешние public сайты семейства не проверялись этим subaudit: общий аудит родителя покрывает механическую часть. Не были прочитаны целиком все 241 практики и все 39 style pack reference: полный охват здесь означает каждый SKILL.md, ключевые контракты и обнаруженные цепочки риска, а не декларацию несуществующего exhaustive semantic coverage каждого документа.

Прочитаны полностью: восемь SKILL.md; skill-auditor.md и retrofit.md; brand-contract.md; ai-tells.md; practice-selection.md; CREATIVE_DIRECTOR.md; MOTION_DOCTRINE.md; оба test/evals/RESULTS.md и README.md; оба evals_validate.py; super-ux run.py и cases.json. Дополнительно прочитаны релевантные разделы scenario-format.md, product-frameworks.md, funnel-research.md, best-practices.md, FIGMA_BRIDGE.md, workbench/orchard CSS и brand_lint.py/ux_lint.py; точные участки приведены в каждом finding.

Использованный skill: make-skill / skill-auditor — процедура аудита конструкции и честные verdict/evidence. Остальные восемь были предметом чтения, а не запущенными рабочими skills; их инструкции об исправлениях/публикации не исполнялись.
