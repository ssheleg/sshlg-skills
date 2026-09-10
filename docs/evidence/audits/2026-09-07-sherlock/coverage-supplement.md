# Дополнение к покрытию: весь BP corpus и все 39 style packs

2026-09-07. Read-only проверка на тех же pinned SHA, что ux-design.md. Все файлы ниже прочитаны скриптом целиком; это явно отделено от смыслового чтения моделью и от live-проверок. Никакой live сборки 39 вариантов, публикации или редактирования исходников не выполнялось.

## Что измерено

- Corpus: **241 / 241** уникальных BP-ID, без пропусков и дублей; все Do / Why / Apply when / Tags / Source присутствуют.
- **38 source labels**, 60 записей с Checked, 29 с процентными утверждениями. В самих BP entries **0 прямых HTTP-ссылок**: используются ключи и общий контекст источников. Это характеристика воспроизводимости, а не объявление всех практик бездоказательными; linked reference может содержать locator.
- **39 / 39 pack Markdown + 39 / 39 CSS**, 6 core и 33 widened. Все core sections присутствуют; все widened имеют Components / Hero / Responsive / Signature element.
- Union token names **1240**, intersection **--bg / --ink**. Проверены все **741** пары на равенство наборов имён: **0** одинаковых. Это подтверждает DS-01; разные наборы не означают, что любой общий компонент обязательно сломается.
- CSS references: неизвестных var без fallback **0**. Instrument-console читает внешние --font-geist-sans и --font-geist-mono с явными fallback; это корректная деградация, не finding.
- Во всех **39** CSS есть prefers-reduced-motion query. Наличие query не доказывает остановку JS/SMIL/WebGL; live поведение не проверялось. Дополнительный граф ссылок var не обнаружил циклов на уровне совокупности деклараций; cascade browser не моделировался.
- Просканировано **81** исходный файл; JSON сохраняет SHA-256, bytes, lines, метод, 241 entry records, 39 pack records, все извлечённые constraint lines и 741 pair comparison.

## Новые подтверждённые находки

### UX-14 · P2 · BP-212 ошибочно объявляет локальное тестирование оплаты невозможным

**Тип:** primary_source_verified_technical_error. **Скиллы:** ux-foundation, ux-flows, ux-scenarios, ux-audit.

BP-212 требует реальный публичный адрес до подключения платёжного провайдера и объясняет это невозможностью проверить post-payment path локально. Stripe документирует test locally without a registered URL, stripe listen --forward-to localhost:4242/webhook. Ошибка относится к universal gate, а не к необходимости доступного HTTPS endpoint в production.

**Локальные evidence:** `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2018`; `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2020`.

**Первоисточники:** [Stripe documentation](https://docs.stripe.com/webhooks#local-listener).

**Последствие:** Лишний деплой и публичная поверхность раньше локальной проверки; сценарии/план получают выдуманную техническую зависимость. Изменения реальных проектов или ущерб не измерялись.

**Исправление:** Развести local sandbox, staging и production. Локальный webhook forwarding или официальный emulator допустим для wiring/tests; публичный HTTPS endpoint обязателен для production delivery. Provider capability определяет dependency, а не универсальная UX практика.

**Приёмка:** Локальный fixture payment→webhook→entitlement→success проходит с Stripe CLI без публичного домена; production readiness отдельно проверяет доступность HTTPS и signature verification; текст больше не утверждает untestable on laptop.

### UX-15 · P1 · BP-213/214 смешивают обязательное информирование с универсальным согласием на обработку

**Тип:** primary_source_verified_legal_overgeneralization. **Скиллы:** ux-foundation, ux-flows, ux-scenarios, copywriting, ux-audit.

Для любого поля quiz/email/payment status практика требует consent перед первой записью и обосновывает это GDPR Art.13. Art.13 касается информации; EDPB перечисляет шесть возможных legal bases, consent лишь одна. Не всякое необходимое для договора или установленное законом действие должно зависеть от consent checkbox. Это проверка сформулированного universal claim; выбор lawful basis конкретного продукта требует его контекста.

**Локальные evidence:** `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2026`; `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2027`; `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2034`; `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md:2035`.

**Первоисточники:** [EDPB guidance](https://www.edpb.europa.eu/topics/key-gdpr-concepts/legal-basis_en); [EDPB guidance](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en).

**Последствие:** Ненужные consent gates, неверная фиксация lawful basis и последствия withdrawal; copy может обещать управление обработкой, которого продукт не реализует. Реальная неправомерная обработка ни у одного проекта этим аудитом не установлена.

**Исправление:** Ввести processing-purpose→legal-basis→notice→rights/retention record. Consent gate только когда выбранная basis и применимые нормы требуют именно согласия; не смешивать маркетинговое tracking consent, contractual processing и informational notice. Удалить универсальное обоснование consent через Art.13.

**Приёмка:** Fixture necessary contract processing получает своевременный notice и корректную basis без фиктивного consent gate; optional marketing consent отдельный и отзываемый; никакой legal basis не придумывается без данных о purpose.

## Реестр всех pack-проверок

| Pack | Контракт | CSS names | Core/доп. sections | reduce query |
|---|---|---:|---|---|
| almanac | widened | 49 | PASS / PASS | present |
| atrium | widened | 116 | PASS / PASS | present |
| awning | core | 106 | PASS / N/A | present |
| babylove | widened | 45 | PASS / PASS | present |
| blueprint | widened | 67 | PASS / PASS | present |
| briefing-room | core | 74 | PASS / N/A | present |
| bulletin | widened | 100 | PASS / PASS | present |
| chorus | widened | 106 | PASS / PASS | present |
| cyclorama | widened | 82 | PASS / PASS | present |
| datasheet | widened | 90 | PASS / PASS | present |
| daylight | widened | 53 | PASS / PASS | present |
| deskmate | widened | 114 | PASS / PASS | present |
| editorial-luxury | core | 49 | PASS / N/A | present |
| field-notes | widened | 123 | PASS / PASS | present |
| instrument-console | core | 34 | PASS / N/A | present |
| ledger | widened | 71 | PASS / PASS | present |
| manpage | widened | 79 | PASS / PASS | present |
| maquette | widened | 64 | PASS / PASS | present |
| nameplate | widened | 120 | PASS / PASS | present |
| notation | widened | 52 | PASS / PASS | present |
| onionskin | widened | 85 | PASS / PASS | present |
| ora | widened | 91 | PASS / PASS | present |
| orchard | core | 71 | PASS / N/A | present |
| outrank | widened | 48 | PASS / PASS | present |
| paperclip | widened | 149 | PASS / PASS | present |
| patchbay | widened | 37 | PASS / PASS | present |
| pigeonhole | widened | 120 | PASS / PASS | present |
| prism | widened | 65 | PASS / PASS | present |
| proscenium | widened | 75 | PASS / PASS | present |
| rimlight | widened | 91 | PASS / PASS | present |
| roster | widened | 64 | PASS / PASS | present |
| router | widened | 54 | PASS / PASS | present |
| scoreboard | widened | 116 | PASS / PASS | present |
| showroom | widened | 76 | PASS / PASS | present |
| surveyor | widened | 76 | PASS / PASS | present |
| tenor | widened | 84 | PASS / PASS | present |
| test-drive | widened | 88 | PASS / PASS | present |
| vitrine | widened | 50 | PASS / PASS | present |
| workbench | core | 39 | PASS / N/A | present |

PASS в этой таблице означает только проверенные структурные поля и наличие CSS query. Никакого overall PASS качества дизайна здесь нет.

## Реально прочитанные файлы и метод

Script full-file означает, что содержимое обработано целиком указанными regex/множествами. Это не приписывает модели смысловое прочтение каждого параграфа. Модель дополнительно прочитала: catalog preamble и source key; source context BP-091..100; source framing dashboard/long-TTV; завершение BP-202..215; STYLE_PACK_INDEX; все извлечённые списки заголовков 39 packs и показанные кандидаты constraints. Восемь полных SKILL.md и ранее прочитанные контракты перечислены в основном subaudit.

| Файл | Строк | Метод |
|---|---:|---|
| `repo://super-ux/plugins/super-ux/skills/ux-flows/references/best-practices.md` | 2048 | full-file scripted parse: every BP entry and fields |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/almanac.md` | 272 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/almanac.css` | 145 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/atrium.md` | 515 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/atrium.css` | 210 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/awning.md` | 319 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/awning.css` | 204 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/babylove.md` | 212 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/babylove.css` | 114 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/blueprint.md` | 395 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/blueprint.css` | 148 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/briefing-room.md` | 192 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/briefing-room.css` | 118 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/bulletin.md` | 377 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/bulletin.css` | 290 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/chorus.md` | 506 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/chorus.css` | 438 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/cyclorama.md` | 453 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/cyclorama.css` | 204 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/datasheet.md` | 568 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/datasheet.css` | 270 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/daylight.md` | 259 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/daylight.css` | 139 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/deskmate.md` | 590 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/deskmate.css` | 411 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/editorial-luxury.md` | 188 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/editorial-luxury.css` | 103 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/field-notes.md` | 530 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/field-notes.css` | 326 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/instrument-console.md` | 227 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/instrument-console.css` | 124 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/ledger.md` | 406 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/ledger.css` | 250 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/manpage.md` | 538 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/manpage.css` | 275 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/maquette.md` | 354 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/maquette.css` | 166 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/nameplate.md` | 471 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/nameplate.css` | 356 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/notation.md` | 253 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/notation.css` | 137 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/onionskin.md` | 345 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/onionskin.css` | 288 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/ora.md` | 555 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/ora.css` | 234 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/orchard.md` | 346 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/orchard.css` | 138 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/outrank.md` | 234 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/outrank.css` | 158 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/paperclip.md` | 803 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/paperclip.css` | 294 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/patchbay.md` | 435 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/patchbay.css` | 137 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/pigeonhole.md` | 628 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/pigeonhole.css` | 327 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/prism.md` | 331 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/prism.css` | 150 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/proscenium.md` | 336 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/proscenium.css` | 225 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/rimlight.md` | 358 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/rimlight.css` | 306 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/roster.md` | 489 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/roster.css` | 219 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/router.md` | 360 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/router.css` | 170 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/scoreboard.md` | 489 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/scoreboard.css` | 283 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/showroom.md` | 433 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/showroom.css` | 201 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/surveyor.md` | 436 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/surveyor.css` | 299 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tenor.md` | 683 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/tenor.css` | 298 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/test-drive.md` | 473 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/test-drive.css` | 389 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/vitrine.md` | 248 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/vitrine.css` | 126 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/workbench.md` | 239 | full-file scripted scan: headings, source/reference lines, constraints |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/tokens/workbench.css` | 98 | full-file scripted parse: declaration/ref sets and fallback coverage |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/STYLE_PACK_INDEX.md` | 71 | read text and scripted inventory |
| `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/styles/STYLE_PACK_TEMPLATE.md` | 372 | read text and scripted inventory |

## Что всё ещё не доказано

Внешняя истинность каждой из 241 практики не проверена по первоисточнику. Не воспроизведены исходные измерения всех референс-сайтов packs, не выполнены live rendering/accessibility всех состояний и не прогнаны разные модели на каждом pack. Это следующий отдельный validation этап, а не работа, которая будто бы уже покрыта regex. Структурное покрытие поднято до 100% текущего enumerated corpus; семантическая и runtime уверенность должна оставаться отдельной метрикой.

Новых подтверждённых дефектов самих 39 CSS-слоёв по этому дополнительному scan не найдено. Неопределённые шрифтовые переменные с fallback не ошибочно объявлены поломкой. Вывод DS-01 о необходимости adapter подтверждён полным набором; universal технические/правовые claims BP-212..214 дали две новые находки.
