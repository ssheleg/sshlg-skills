# Аудит установки, обновления и маршрутизации семейства

2026-09-07 · Дополнение к основному Sherlock audit · read-only · 8 новых задач UP-01…UP-08.

Основная проблема: launcher описывает единую закреплённую семью, но исполняет независимые latest-операции и не устанавливает связь между желаемым релизом, записанными файлами и реально загруженным host provider. Функциональные проверки в temp HOME дополнительно показали реальные нежелательные записи при dry-run и выборочном --agent. Это подтверждённые дефекты кода/контракта; внешнего происшествия аудит не устанавливает.

## Что проверено и что не следует считать доказанным

Смыслово прочитаны install/update и router control flow umbrella, plan.js, updatemodel.js, runtime.js, relevant apply/consent, все install-функции task-pipeline, super-ux и sheleg-design (Node и shell). Прочитаны guards, payload copy и status aggregation; внутренние interactive selector rendering, design-kit generation и мигратор артефактов не относятся к этой дополнительной проверке. Изменений исходников, конфигов, board или live установок не было.

На диске узко измерены только семейные SKILL.md: 336 кандидатов из исторических cache и hub, 28 разных skill names. Это не 336 активных skills. Native Codex cache содержит 25 names; текущий session-loaded digest из этих файлов не выводится. Полный inventory с realpath и SHA-256 сохранён в [providers.json](install-logs/providers.json).

Primary-source проверка: текущий [skills CLI update.ts](https://raw.githubusercontent.com/vercel-labs/skills/main/src/update.ts) делает глобальный refresh и re-add без host selector. Его [agents.ts](https://raw.githubusercontent.com/vercel-labs/skills/main/src/agents.ts) учитывает CODEX_HOME и CLAUDE_CONFIG_DIR. [Claude Code docs](https://code.claude.com/docs/en/discover-plugins) различают обновлённые на диске plugin versions и уже загруженную сессию; reload/следующий запуск — отдельная стадия. Third-party auto-update default не доказывает состояние конкретной установки. Retrieval сделан 2026-09-07; upstream main изменяемый, production contract нужно закрепить версией.

Существующие RT-03 (toolkit inventory), SY-08 (agent-sync lookup) не подсчитаны второй раз. UP-07 добавляет отдельный lifecycle пробел и concrete provider inventory. RT-01/02/04, UB-01 и MS-01…04 в этом расширении не переоткрываются.

## Проверки

Команда воспроизведения: `node audit://extension/install-logs/reproduce.cjs`. Каждый дочерний процесс получает временный HOME; все внутренние npx/claude/git subprocesses подменены. Реальные записи происходят только в собственных временных fixture папках, затем они удаляются. Copy failure инъецирует ENOSPC намеренно; это воспроизведение ошибки восстановления, а не настоящий disk exhaustion или TEST_ERROR.

| Fixture | Полученный результат | Оценка |
|---|---|---|
| dry-run | exit0; 38 child calls; plainSurvives=false; runtimeChanged=true | Дефект воспроизведён |
| agent-scope | CLAUDE.md, AGENTS.md, GEMINI.md изменены при --agent codex --no-claude | Дефект воспроизведён |
| stale-registry | все installs failed; plugin payload отсутствует; plain копия удалена | Дефект воспроизведён |
| force-copy-failure | injected ENOSPC, exit1, старая установка удалена | Дефект воспроизведён |
| super-menu-failure | обязательные операции exit1; installer exit0 | Дефект воспроизведён |
| custom-host-root | default root изменён, выбранный CODEX_HOME не изменён | Дефект воспроизведён |
| pin-plan | manifest version отсутствует в actual argv | Разрыв контракта подтверждён |
| auto-update-unknown | read=false ⇒ текст OFF | Разрыв состояния подтверждён |
| plan_test.js | OK (20 checks) | PASS существующей suite |
| updatemodel_test.js | OK (10 checks) | PASS существующей suite |

[Машинный протокол fixtures](install-logs/results.json), [короткий лог](install-logs/reproduce-summary.txt), отдельные stdout/stderr логи рядом. Зелёные существующие unit tests не опровергают новые сценарии: они подтверждают старый контракт, включая argv без pin. Полные suites намеренно не запускались.

## Приоритетный backlog

| Задача | Приоритет | Что должно измениться |
|---|---|---|
| UP-01 | P1 | Обещание закреплённого релиза семьи не обеспечено установкой |
| UP-02 | P1 | Принятый --dry-run всё равно запускает обновления и удаляет файлы |
| UP-03 | P2 | Выбор агента не ограничивает весь update |
| UP-04 | P1 | Prune удаляет единственную plain-копию по непроверенной записи registry |
| UP-05 | P1 | Перезапись member/runtime не атомарна и не даёт rollback |
| UP-06 | P2 | Super-ux возвращает успешный exit code после неудачной установки |
| UP-07 | P2 | Updater не управляет native Codex plugin provider и не проверяет active digest |
| UP-08 | P2 | Host roots фиксированы и расходятся с поддерживаемыми overrides |

### UP-01 · P1 · Обещание закреплённого релиза семьи не обеспечено установкой

**Область:** sshlg-skills.

**Наблюдение.** Fixture pin-plan: manifestVersion=0.55.1, но команда add получает только ssheleg/super-ux; refresh получает vision без версии. Claude получает plugin marketplace update и plugin update без immutable ref. Pins материализуют только git-submodule checkout; npm files вообще не включает skills/ и .gitmodules. Fixture auto-update-unknown: read=false превращается в «Auto-update is OFF».

**Последствие.** Одна и та же версия umbrella может приводить к разным наборам байтов в разные дни. Сбой в середине оставляет смешанную семью; отчёт «pinned and released as a set» не доказывает совместимость. Отсутствие автоматической проверки latest само по себе допустимая явно описанная политика, но его нельзя путать с закреплением фактически установленного набора.

**Доказательства:**
- [lib/updatemodel.js:16](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/updatemodel.js#L16)
- [lib/updatemodel.js:39](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/updatemodel.js#L39)
- [lib/updatemodel.js:75](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/updatemodel.js#L75)
- [lib/plan.js:37](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L37)
- [lib/plan.js:48](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L48)
- [bin/sshlg-skills.js:315](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L315)
- [bin/sshlg-skills.js:327](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L327)
- [package.json:15](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/package.json#L15)

**Решение.** Завести release-set.lock с package version, provider, immutable git SHA/ref, content digest, minimum host capability для каждого member. Сначала resolve/check без записи, затем получить все payload, проверить digest и контракт совместимости; устанавливать именно эти payload. Закрепить версию skills CLI, сейчас npx выбирает внешнюю реализацию независимо. Для host API без pin объявить capability unsupported и observed actual, не называть набор pinned. Auto-update состояние: enabled/disabled/unknown + источник/время; policy отдельно от observation.

**Критерии приёмки:**
- Два запуска одной версии umbrella при изменившемся upstream дают одинаковые digest либо явный UNSUPPORTED_PIN.
- Network/registry/parse failure выдаёт CHECK_ERROR или UNKNOWN, не current/OFF.
- Команды/lock содержат immutable source всех девяти членов; release-set receipt сравнивает expected и observed digest.
- Проверка latest read-only отделена от apply; latest_available, desired, installed и active четыре разные величины.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

### UP-02 · P1 · Принятый --dry-run всё равно запускает обновления и удаляет файлы

**Область:** sshlg-skills.

**Наблюдение.** Изолированный fixture dry-run: update --no-claude --agent codex --dry-run, exit=0; вызваны 38 mocked child processes; реально в temp HOME удалён .claude/skills/vision/SKILL.md и изменён runtime/lib/plan.js. В выводе роутера при этом «Ничего не изменено». Subprocesses подменены, поэтому настоящих npm/git/claude обновлений не было.

**Последствие.** Оператор, проверяющий предполагаемые изменения, вместо просмотра получает реальные filesystem mutations; при реальных subprocesses код также запускает операции обновления. Эта ошибка непосредственно нарушает значение принятого флага.

**Доказательства:**
- [bin/sshlg-skills.js:83](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L83)
- [bin/sshlg-skills.js:318](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L318)
- [bin/sshlg-skills.js:319](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L319)
- [bin/sshlg-skills.js:350](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L350)
- [bin/sshlg-skills.js:618](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L618)

**Решение.** Строить единый immutable OperationPlan для subprocesses, prune, routers и runtime. Dry-run рендерит план без исполнения; либо отклонять этот флаг для неподдерживаемой команды до первой операции. Одна центральная граница mutation, а не dryRun только у emitters.

**Критерии приёмки:**
- Снимки всех temp HOME/project/runtime файлов до и после install/update --dry-run побайтно равны.
- Spy подтверждает 0 mutating child calls, 0 deletes, 0 writes, в том числе при --bump-pins и --all.
- JSON plan показывает будущие удаления, scope и версии без фразы про выполненную установку.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

### UP-03 · P2 · Выбор агента не ограничивает весь update

**Область:** sshlg-skills.

**Наблюдение.** Fixture agent-scope: update --no-claude --agent codex с ранее данным consent=yes меняет все три fixture файла: .claude/CLAUDE.md, .codex/AGENTS.md и .gemini/GEMINI.md. refreshBlock не передаёт agents/claudeOnly; apply iterates all TARGETS. Refresh skills update name --global не содержит агентного scope; это действительно глобальный интерфейс upstream, а не пропущенный поддерживаемый флаг. Shared hub по определению тоже общий.

**Последствие.** Пользовательское ожидание выборочного обновления расходится с реальным графом записи. Даже --no-claude может поменять Claude-инструкции, удалить его plain skill и обновить runtime. Добавление --agent к неподдерживающему его upstream update проблему не решит.

**Доказательства:**
- [lib/plan.js:48](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L48)
- [lib/plan.js:91](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L91)
- [bin/sshlg-skills.js:267](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L267)
- [bin/sshlg-skills.js:347](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L347)
- [lib/apply.js:180](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L180)
- [lib/apply.js:203](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L203)

**Решение.** Разделить --host/--channel и --scope shared|host; resolver до начала операций показывает затрагиваемые shared storage и indirect consumers. Передать выбранные targets во все emitters; общие объекты обновлять только как явно названную часть плана. Для host-only использовать staging точного payload/add к поддерживаемому агенту либо объявлять невозможность изоляции общего hub.

**Критерии приёмки:**
- Fixture с Claude/Codex/Gemini/Cursor сохраняет все невыбранные instruction files.
- --claude-only не обновляет Codex/Gemini instructions; --no-claude не меняет Claude state, кроме явно выбранного shared scope.
- Test на два агента, читающих один symlink target, показывает shared-effect до apply и не обещает per-host isolation.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

**Зависимости:** UP-02.

### UP-04 · P1 · Prune удаляет единственную plain-копию по непроверенной записи registry

**Область:** sshlg-skills.

**Наблюдение.** Fixture stale-registry задаёт plugins={"super-ux@super-ux":[]}, без cache payload. Все 9 mocked skills installs вернули failure. Launcher всё равно удалил уникальный fixture .claude/skills/vision/SKILL.md, затем завершился exit1. Registry keys преобразуются в marketplace names; массив scopes/installPath и реально существующий payload не проверяются, backup/provenance не делаются. Обратный сценарий fresh-all-order: mocked skills add создаёт Claude plain vision, затем mocked plugin install регистрирует plugin; install --all заканчивается exit0, обе записи остаются. --all даёт wildcard, prune идёт раньше plugin install и после него не повторяется. Это проверка порядка orchestration с моделируемыми эффектами внешнего CLI, не live подтверждение поведения host.

**Последствие.** Stale/empty registry, отключённый или сломанный plugin и локально изменённая plain-копия могут привести к потере единственного доступного skill или пользовательской редакции. Подтверждено в изолированном HOME; потеря пользовательского файла на реальной машине не утверждается.

**Доказательства:**
- [bin/sshlg-skills.js:125](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L125)
- [bin/sshlg-skills.js:139](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L139)
- [bin/sshlg-skills.js:156](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L156)
- [bin/sshlg-skills.js:238](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L238)
- [lib/plan.js:60](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L60)
- [lib/plan.js:126](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L126)

**Решение.** Prune превратить в migration после успешной верификации целевого provider. Проверять точный plugin spec, applicable scope, enabled state, cache payload/required resources, digest. Plain symlink managed source можно переключить атомарно; неизвестные/изменённые папки сохранять в quarantine с manifest и restore. Empty/corrupt registry = UNKNOWN, без удаления.

**Критерии приёмки:**
- Матрица absent/corrupt/empty/stale/disabled/wrong-scope plugin не удаляет единственную копию.
- Injected install failure сохраняет старую рабочую копию и её digest.
- Отдельный fixture edited plain skill создаёт recoverable backup и journal; restore возвращает байты и symlink тип.
- Проверка exact spec не считает любую другую запись из marketplace доказательством замены всех skills.
- Fresh install --all сначала формирует правильные provider targets и после успешной миграции не оставляет создаваемую им plain копию рядом с plugin; нужны explicit invocations обоих каналов в smoke-test.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

**Зависимости:** UP-07.

### UP-05 · P1 · Перезапись member/runtime не атомарна и не даёт rollback

**Область:** task-pipeline, sheleg-design, sshlg-skills.

**Наблюдение.** Fixture force-copy-failure: task-pipeline --force удаляет старую valid installation до copy; injected ENOSPC на первой copyFileSync даёт exit1, старый SKILL.md больше не существует. Design JS и runtime копируют поверх по одному файлу без staging; Design shell аналогично пишет прямо в target (и не использует --force как защиту существующих файлов вне plugin gate). Последние ветки подтверждены чтением кода, без инъекции сбоя в каждой.

**Последствие.** Диск, permission error или остановка процесса могут оставить отсутствующий либо смешанный пакет, на который уже смотрит агент/hook. Backup global markdown в apply.js не покрывает payload skill/runtime. Повтор запуска иногда чинит состояние, но это не rollback и не гарантия доступности.

**Доказательства:**
- [skills/task-pipeline/bin/task-pipeline.js:52](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L52)
- [skills/task-pipeline/bin/task-pipeline.js:57](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L57)
- [skills/task-pipeline/install.sh:45](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/install.sh#L45)
- [skills/sheleg-design/bin/cli.js:501](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/bin/cli.js#L501)
- [skills/sheleg-design/install.sh:78](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/install.sh#L78)
- [skills/sheleg-design/install.sh:82](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/install.sh#L82)
- [lib/runtime.js:103](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/runtime.js#L103)
- [lib/runtime.js:119](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/runtime.js#L119)

**Решение.** Единый transaction writer: подготовить sibling staging на том же filesystem, проверить required-file manifest и digest, fsync где нужно, записать journal, переключить pointer/rename с recoverable previous generation. Сохранять пользовательские файлы отдельно; не очищать неизвестные extras вслепую. Для remote shell скачать manifest+payload закреплённого commit полностью до switch. Все installers применяют одинаковую --force semantics.

**Критерии приёмки:**
- Fault injection на первом/среднем/последнем copy и rename сохраняет старую полностью рабочую generation или новую полностью проверенную.
- SIGTERM после stage и до switch не меняет active; после switch journal позволяет rollback.
- Проверка --force=false не перезаписывает existing Design shell files; --force=true создаёт recoverable generation.
- Obsolete managed resources удаляются по manifest, неизвестные пользовательские файлы сохраняются.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

**Зависимости:** UP-01.

### UP-06 · P2 · Super-ux возвращает успешный exit code после неудачной установки

**Область:** super-ux.

**Наблюдение.** Fixture super-menu-failure: stdin выбирает пункт 3 (Claude plugin); все четыре вызванных child operations замоканы с status1. Вывод содержит plugin install failed, но процесс заканчивается exit0. installClaudePlugin не возвращает status; menu отслеживает только refused ветку skills picker и печатает update line.

**Последствие.** Shell/CI/родительский launcher считает установку удачной, хотя обязательная часть не выполнена. Предупреждение в тексте не исправляет machine-readable signal; предложение маршрутизатора может описывать отсутствующую возможность.

**Доказательства:**
- [skills/super-ux/bin/super-ux.js:244](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L244)
- [skills/super-ux/bin/super-ux.js:264](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L264)
- [skills/super-ux/bin/super-ux.js:278](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L278)
- [skills/super-ux/bin/super-ux.js:445](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L445)
- [skills/super-ux/bin/super-ux.js:459](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L459)

**Решение.** Все install functions возвращают typed result installed|unchanged|refused|unsupported|failed; menu агрегирует только выбранные обязательные операции, устанавливает nonzero на failure и печатает completion отдельно от optional routing offer. Различать ENOENT, permission, network и backend nonzero, сохраняя command, exit/signal и recovery.

**Критерии приёмки:**
- Selected plugin failure и skills CLI failure => exit1; explicit refusal=>3; unsupported host=>выбранный стабильный nonzero.
- Optional absent router launcher не превращает удачную установку skill в failure.
- Mixed selections дают PARTIAL с конкретными failed operations и не печатают overall success.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

### UP-07 · P2 · Updater не управляет native Codex plugin provider и не проверяет active digest

**Область:** sshlg-skills.

**Наблюдение.** В skills.json Codex описан только каналом skills CLI. Install/update имеют только skills CLI, Claude plugin и local runtime операции. Узкая filesystem инвентаризация прочитала 336 SKILL.md candidates в hub и семейных Claude/Codex caches; все 28 skill names имеют hub, для 25 names есть native Codex plugin cache (telegram только hub/Claude в измерении). Historical cache versions не равны active providers. Провайдер, реально выбранный host для следующей/текущей сессии, launcher не разрешает и его digest не сравнивает.

**Последствие.** Обновить hub недостаточно для утверждения, что Codex использует новую plugin-копию. Установка и обновление могут быть успешными в одном канале, тогда как namespaced invocation берёт другой. Это lifecycle-пробел в дополнение к RT-03 про inventory и SY-08 про lookup; не утверждается, что все cache candidates активны или что plain skill всегда затеняет namespaced plugin в каждом host.

**Доказательства:**
- [skills.json:225](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/skills.json#L225)
- [bin/sshlg-skills.js:231](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L231)
- [bin/sshlg-skills.js:283](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L283)
- [bin/sshlg-skills.js:323](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L323)
- [bin/sshlg-skills.js:64](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L64)
- [skills/sheleg-design/bin/cli.js:528](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/bin/cli.js#L528)

**Решение.** Ввести read-only provider resolver с host API adapter, project/user/admin scopes, exact skill id и namespace, canonical realpath, source digest, installed/enabled/applicable/loaded states. Codex native plugin install/update передавать только поддерживаемому host API; при отсутствии API выдавать UNSUPPORTED_UPDATE и конкретный ручной шаг. Receipt имеет desired/installed/loaded digest и reload-required, а неизвестное не окрашивает зелёным. Одинаковые capabilities должны лежать под make-skill/runtime/toolkit/update, а не в разных списках.

**Критерии приёмки:**
- Fixture: stale native plugin + fresh hub => report mismatch и не overall current.
- Fixture: cache old versions + только одна enabled version => candidates не считаются active duplicates.
- Project override и namespaced invocation разрешаются отдельно; unknown runtime precedence => UNKNOWN, без prune.
- После supported update/reload smoke-test host показывает нужный skill/version/source digest; без live host статус NOT-RUN.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

**Связь с основным аудитом:** RT-03, SY-08.

### UP-08 · P2 · Host roots фиксированы и расходятся с поддерживаемыми overrides

**Область:** sshlg-skills, task-pipeline, super-ux, sheleg-design.

**Наблюдение.** Fixture custom-host-root запускает update --agent codex --no-claude с CODEX_HOME в отдельной temp папке. Custom AGENTS.md остаётся прежним, default ~/.codex/AGENTS.md меняется. Source paths для Claude guards также жёстко используют .claude. Текущий primary upstream skills CLI учитывает CODEX_HOME и CLAUDE_CONFIG_DIR, поэтому subprocess installation и family router/prune могут работать с разными home roots.

**Последствие.** На custom profile/config root skill может обновиться в одном host-home, а обязательные инструкции — в другом. Guard может не увидеть plugin в реальном Claude profile либо проверять чужой default profile. Наличие таких overrides на реальной машине не проверялось и для дефекта не требуется.

**Доказательства:**
- [lib/apply.js:34](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L34)
- [lib/apply.js:187](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/apply.js#L187)
- [bin/sshlg-skills.js:138](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L138)
- [skills/task-pipeline/bin/task-pipeline.js:196](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L196)
- [skills/task-pipeline/bin/task-pipeline.js:203](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L203)
- [skills/super-ux/bin/super-ux.js:47](https://github.com/ssheleg/super-ux/blob/a60f6b423c619b37a3bb43564b58b02b6200e463/bin/super-ux.js#L47)
- [skills/sheleg-design/bin/cli.js:381](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/bin/cli.js#L381)

**Решение.** Единый HostContext resolver: explicit CLI root > документированный host env > platform default; использовать его и для install, inventory, guards, router, consent scope, rollback. Поддерживать alternate profiles явно. Не выводить наличие установленного host только из случайной оставшейся директории; capability probe отдельно от pathname.

**Критерии приёмки:**
- Fixture custom CODEX_HOME/CLAUDE_CONFIG_DIR меняет только выбранный root, default stays byte-identical.
- Plugin collision в custom root обнаруживается до записи; stale default root не блокирует другой профиль.
- Windows/XDG/root-with-spaces и missing host дают отдельные протестированные results; неподдержанные платформы UNKNOWN.

**Границы уверенности.** Подтверждён дефект/пробел реализации; наличие внешнего инцидента и фактическая версия в уже работающих сессиях не установлены.

**Зависимости:** UP-03, UP-07.

## Матрица host capabilities

SUPPORTED_ADAPTER/EMITTER означает найденный реализационный путь и изолированную проверку там, где она перечислена. Это не live certification хоста. NO_EMITTER — отсутствие маршрутизатора в launcher, а не отсутствие skill support у самого продукта.

| Host | Установка / обновление | Роутинг | Ограничение |
|---|---|---|---|
| Claude Code | SUPPORTED_ADAPTER: claude CLI plugin; SUPPORTED_ADAPTER: latest marketplace/plugin, pin absent | SUPPORTED_EMITTER: ~/.claude/CLAUDE.md + optional Claude hooks | Enabled scope/cache/session not verified; custom config root ignored |
| DeepSeek Harness | DECLARED_DIRECT_HUB: no launcher install operation; INDIRECT_SHARED_HUB | NO_EMITTER | Six-root/rank statement is declaration in manifest; live harness not verified |
| Cursor | SUPPORTED_ADAPTER: skills CLI; standalone project rules installer; SUPPORTED_ADAPTER: hub; project rules require explicit member installer | SUPPORTED_EMITTER: ~/.cursor/rules/sshlg-routing.mdc when rules dir exists | Project rules can independently remain old; live priority/activation not tested |
| Codex | SUPPORTED_ADAPTER: external skills CLI; native plugin not managed; SUPPORTED_ADAPTER: hub refresh; native plugin UNKNOWN | SUPPORTED_EMITTER: ~/.codex/AGENTS.md | Native cache exists; active provider/digest UNKNOWN; CODEX_HOME ignored by emitter |
| Gemini CLI | SUPPORTED_ADAPTER: external skills CLI; SUPPORTED_ADAPTER: global hub | SUPPORTED_EMITTER: ~/.gemini/GEMINI.md | Live priority/activation not tested |
| OpenCode | SUPPORTED_DELEGATION: external skills CLI --agent opencode; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| Windsurf | SUPPORTED_DELEGATION: external skills CLI --agent windsurf; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| Zed | SUPPORTED_DELEGATION: external skills CLI --agent zed; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| Kilo Code | SUPPORTED_DELEGATION: external skills CLI --agent kilo; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| Kimi CLI | SUPPORTED_DELEGATION: external skills CLI --agent kimi-code-cli; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| Hermes | SUPPORTED_DELEGATION: external skills CLI --agent hermes-agent; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| OpenClaw | SUPPORTED_DELEGATION: external skills CLI --agent openclaw; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| Kiro | SUPPORTED_DELEGATION: external skills CLI --agent kiro-cli; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |
| Goose | SUPPORTED_DELEGATION: external skills CLI --agent goose; SUPPORTED_DELEGATION: global update then add | NO_FAMILY_EMITTER | Host-specific hooks/commands/role agents not installed by family adapter; runtime parity UNKNOWN |

## Жизнеспособная архитектура и порядок внедрения

1. **Сначала остановить неправильные записи:** UP-02 central dry-run boundary, UP-04 safe no-prune при UNKNOWN/failed replacement, UP-06 nonzero failures. Это небольшие защитные изменения до общего refactor; не нужно ждать нового формата релизов, чтобы прекратить потерю копий.
2. **Описать платформы один раз:** HostContext + provider resolver (UP-07/08), где capability, path, scope и precedence являются данными adapter. Один skill id может иметь namespaced и plain providers; удаление не следует автоматически из совпадения имени.
3. **Разделить desired и observed:** release-set.lock (UP-01), read-only check-latest с typed UNKNOWN/error; получить exact payload и вычислить digest. Catalog version, installed version и loaded version не взаимозаменяемы.
4. **Построить OperationPlan:** все host/shared targets, subprocesses, downloads, writes, deletion/quarantine и reload requirements видны до apply (UP-02/03). Dry-run и apply используют тот же plan hash.
5. **Обеспечить транзакцию:** stage всех payload, верификация, recoverable old generation, atomic switch, receipt, rollback (UP-04/05). Для external host APIs, не поддерживающих атомарность, фиксировать PARTIAL и ограниченную компенсацию; не обещать all-or-nothing. Router emits только фактически доступные capabilities и обновляется после успешного соответствующего payload.
6. **Подтвердить работу хостом:** после restart/reload проверить discovery, explicit invocation, scope и loaded digest. При отсутствии host/API оставить NOT-RUN. Только эти smoke receipts дополняют файловые тесты до end-to-end evidence.

Минимальная матрица сценариев: fresh install; repeated install; one member behind; member version ahead; stale/disabled plugin plus edited plain copy; shared hub read by two hosts; project override; custom HOME/config root; dry-run; no internet; upstream moved; insufficient disk; child timeout/nonzero; crash before/after switch; concurrent update; rollback; host already running during update. Acceptance должна описывать observed final state, а не только exit0 команды.

Граница «100%»: все перечисленные acceptance tests зелёные, supported host/provider pairs прошли recorded smoke tests, а unsupported пары честно указаны в capability matrix. Нельзя считать 70+ агентных идентификаторов внешнего CLI доказательством полной эквивалентности hooks, commands, role agents и plugin reload.

## Что уже сделано хорошо

Pure plan builders позволяют быстро воспроизводить argv без сети; resolver отличает declared skill names от repository names. Router writes имеют backup guard, opt-out и сохранение авторского текста. Runtime копируется из npx cache в стабильный home path. Update агрегирует subprocess failures и показывает точные команды retry; задача UP-06 нужна для member installer, не отрицает этот плюс umbrella. Task-pipeline plain installer явно сообщает, что plugin role agents не установлены. Design installer проверяет bundle до копирования и exact Claude plugin name в registry; это полезные основы, которым не хватает unified lifecycle и атомарности.

Использовано: make-skill/skill-auditor — метод evidence-based аудита; код installers и pure fixtures — проверка поведения. Source edits и live installations не выполнялись.
