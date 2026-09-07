# Внешние источники для Sherlock Skills: Composio и OpenAI curated

Проверено 2026-09-07. Рекомендация: **не добавлять обязательные внешние skills, SDK, API keys или MCP providers**. Перенести несколько конкретных knowledge patterns и независимых regression fixtures в существующие owners семьи. Большая часть полезной общей доктрины у семьи уже есть; новые конкурирующие маршруты её не улучшат.

## Снимки и покрытие

| Источник | HEAD | Содержимое scope | Статус |
|---|---|---|---|
| [composio](https://github.com/composio-community/awesome-codex-skills) | `0930e1373789d2eda449039f7ac154b33031de89` | 880 SKILL.md | README catalog + реально bundled skills |
| [openai](https://github.com/openai/skills) | `49f948faa9258a0c61caceaf225e179651397431` | 39 SKILL.md | README объявляет deprecated; это исторический snapshot |

В Composio: 48 верхнеуровневых skills и 832 `composio-skills/*` automation. В OpenAI рассмотрены ровно 39 skills в `.curated`; `.system`/`.experimental` вне этого scope. 919 SKILL.md и их текстовые файлы просканированы автоматически на runtime/dependency/license сигналы. У 16 SKILL.md body прочитан целиком; ещё у 4 прочитаны целевые разделы и зависимости. 899 — static scan only, не смысловой аудит каждой инструкции. Скрипты не запускались и импортом не исполнялись. Собственные scanner/report scripts только читают источники и пишут audit artifacts.

[Полный per-skill JSON](platform-sources.json) содержит verdict, license, coverage, SHA, permalink для каждого из 919 skills. [Dependency scan](platform-inventory.json) содержит для каждого skill команды, MCP/auth/network/package/assets/host сигналы, точные строки, package manifests и imports; сигналы regex не доказывают необходимость зависимости, а отсутствие совпадения не доказывает zero-dependency.

Ссылки README на brooks-lint, bringyour-migration-auditor, codebase-recon, Bernstein, Emdash, AuraKit, Vibe-Skills, polywave и другие внешние репозитории **не считались bundled содержимым и не проверялись**. Это каталог ссылок, не транзитивная поставка этих skills.

OpenAI README line 2 прямо рекомендует current examples в openai/plugins: [openai/README.md:2](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/README.md:2) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/README.md#L2). Поэтому curated не принимается как действующая спецификация host capabilities.

## Лицензии и NOTICE

В корне обоих snapshots LICENSE/NOTICE отсутствуют. Найдены per-skill документы: 40 Apache-2.0, 9 MIT, 8 Figma Developer Terms/Beta; у 862 skill folders лицензия не указана ни локально, ни в repo root. Это наблюдение файлов, не утверждение, что у каждого такого материала нет правообладателя или условий где-либо ещё. Решение для плана: не копировать материал без ясного source/permission record.

Все 8 Figma skills в этой `.curated` выборке governed by Figma Developer Terms/Beta; принадлежность OpenAI репозиторию не превращает их в Apache. Их код, тексты и assets в обязательный pack не переносить. Apache Playwright навыки имеют Microsoft NOTICE; при конкретном переносе сохранить applicable LICENSE/NOTICE и описание адаптации. Для остальных adopted material фиксировать origin SHA, path, lines, local modifications. Никаких blanket «репозиторий open source — можно копировать всё».

## Что требует внешнюю инфраструктуру

832 Composio automation skills исключены из обязательного пути семьи: это Rube/Composio toolkit adapters, а не автономные знания. Показательный slackbot skill пишет «No API keys needed», но требует Rube MCP, ACTIVE connection и auth-link flow: [composio/composio-skills/slackbot-automation/SKILL.md:14](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/composio-skills/slackbot-automation/SKILL.md:14) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/composio-skills/slackbot-automation/SKILL.md#L14). Отсутствие ручного API key не означает отсутствие OAuth/account/provider/network/cost dependencies. Остальные SaaS docs не читались подробно: их предполагаемые лимиты и права не утверждаются.

npx/npm wrappers — тоже зависимости, даже если global install не нужен. Browser package ещё не означает установленные browsers. Статические security/authoring guides можно использовать как знания; их готовые execution harnesses и чужие install/config команды отдельно исключены. Ни `curl | bash`, ни `codex mcp add`, ни `npm install`, ни foreign `--help` в аудите не выполнялись.

## Глубоко рассмотренные кандидаты

### composio / skill-creator

**Решение:** ADAPT_KNOWLEDGE_ONLY; DO_NOT_REPLACE_MAKE_SKILL. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Короткий body, отдельные references/assets/scripts, выбор степени предписания по хрупкости операции; concrete user examples прежде общего руководства. Всё это уже частично есть в make-skill: заимствование должно дать fixtures и проверяемую упаковку, а не новый router.

**Зависимости:** Текстовый workflow не требует API/MCP. init_skill.py использует Python stdlib; quick_validate.py импортирует yaml (PyYAML); package_skill.py импортирует этот validator и zipfile. requirements/lock для PyYAML в skill не найден. Локальная запись/ZIP — side effects.

**Исключения и проблемы:** Два обещанных references отсутствуют. SKILL.md запрещает любые extra frontmatter fields, хотя собственная metadata есть и validator разрешает license/allowed-tools/metadata. Проверки name/description запускаются только если stripped value truthy: пустые строки доходят до success. Validator не проверяет semantic description, resource refs или package closure, хотя body это обещает. Packager берёт все rglob files без allowlist/секрет-фильтра и без защиты от выхода через symlink. Подсказки <5k words/500 lines не являются измерением токенов; слово Unlimited для ресурсов нельзя переносить как бюджетную гарантию.

**Evidence:**
- [composio/skill-creator/SKILL.md:28](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md:28) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md#L28)
- [composio/skill-creator/SKILL.md:120](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md:120) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md#L120)
- [composio/skill-creator/SKILL.md:304](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md:304) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md#L304)
- [composio/skill-creator/SKILL.md:331](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md:331) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md#L331)
- [composio/skill-creator/scripts/quick_validate.py:10](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/quick_validate.py:10) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/quick_validate.py#L10)
- [composio/skill-creator/scripts/quick_validate.py:60](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/quick_validate.py:60) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/quick_validate.py#L60)
- [composio/skill-creator/scripts/package_skill.py:71](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/package_skill.py:71) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/package_skill.py#L71)
### composio / mcp-builder

**Решение:** ADAPT_EVAL_CASE_DESIGN; EXCLUDE_HARNESS. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Независимые read-only вопросы с заранее известным стабильным ответом; realistic multi-hop и ограниченные результаты tools. Полезно для seed corpus до первого production релиза.

**Зависимости:** Исполнение harness требует Python, openai SDK, mcp SDK, OPENAI_API_KEY и MCP server. requirements содержит два mcp lower bounds. SDK docs/API изучение требует сети; реализации также используют Pydantic/Zod. Это не zero-key eval runner.

**Исключения и проблемы:** Не копировать evaluator: EVALUATION_PROMPT объявлен, но messages начинается только user question; последующий scorer требует XML response. while True без max tool calls/turns/cost; list_tools не ограничен read-only allowlist. Read-only QA в prose не защищает runtime от mutating calls. String equality подходит лишь точным scalar tasks и не заменяет trajectory/side-effect assertions.

**Evidence:**
- [composio/mcp-builder/SKILL.md:261](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/SKILL.md:261) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/SKILL.md#L261)
- [composio/mcp-builder/scripts/requirements.txt:1](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/requirements.txt:1) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/requirements.txt#L1)
- [composio/mcp-builder/scripts/evaluation.py:21](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py:21) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py#L21)
- [composio/mcp-builder/scripts/evaluation.py:118](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py:118) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py#L118)
- [composio/mcp-builder/scripts/evaluation.py:158](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py:158) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py#L158)
- [composio/mcp-builder/scripts/evaluation.py:265](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py:265) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/scripts/evaluation.py#L265)
### composio / webapp-testing

**Решение:** KEEP_INSPECT_THEN_ACT; EXCLUDE_WRAPPER. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Разделить запуск сервера, установление готовности, наблюдение DOM и действия. Повторяемая локальная QA может использовать уже имеющийся browser channel.

**Зависимости:** Python Playwright, Chromium binary, local app server; wrapper stdlib, но запускает произвольную --server shell command. Установка Playwright не включается в обязательные зависимости семьи.

**Исключения и проблемы:** Предписывает выполнить script --help до чтения кода: неприемлемо как правило аудита неизвестного пакета. Обязательный networkidle конфликтует с рекомендацией Playwright assertions для readiness. with_server.py направляет stdout/stderr в PIPE без чтения; заполнение буфера может повесить шумный сервер. Terminate применяется к shell process, полного process-tree cleanup не доказано. Эти риски выявлены по коду, scripts не запускались.

**Evidence:**
- [composio/webapp-testing/SKILL.md:14](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/SKILL.md:14) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/SKILL.md#L14)
- [composio/webapp-testing/SKILL.md:58](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/SKILL.md:58) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/SKILL.md#L58)
- [composio/webapp-testing/SKILL.md:72](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/SKILL.md:72) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/SKILL.md#L72)
- [composio/webapp-testing/scripts/with_server.py:70](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/scripts/with_server.py:70) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/scripts/with_server.py#L70)
- [composio/webapp-testing/scripts/with_server.py:100](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/scripts/with_server.py:100) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/scripts/with_server.py#L100)
### composio / create-plan

**Решение:** ALREADY_COVERED; DO_NOT_INSTALL. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Read-only planning, небольшие atomic ordered tasks и вопросы только при реальной блокировке. Можно использовать как краткую форму внутри task-pipeline stages 2–4.

**Зависимости:** Дополнительных runtime packages/API/MCP не указано; нужны чтение локальных файлов и модель.

**Исключения и проблемы:** Полный skill вводит отдельную planning entry и жёсткий output template, дублируя task-pipeline. Не принимать fixed 6–10 checklist items как универсальную норму.

**Evidence:**
- [composio/create-plan/SKILL.md:16](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/create-plan/SKILL.md:16) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/create-plan/SKILL.md#L16)
- [composio/create-plan/SKILL.md:23](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/create-plan/SKILL.md:23) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/create-plan/SKILL.md#L23)
- [composio/create-plan/SKILL.md:32](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/create-plan/SKILL.md:32) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/create-plan/SKILL.md#L32)
### composio / codebase-migrate

**Решение:** EXCLUDE_RUNTIME; BATCHING_ALREADY_COVERED. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Одна трансформация на reviewable batch, проверка и rollback по batch. Сама идея переносима, но уже покрыта pipeline.

**Зависимости:** Обязательные curl|bash installer, composio login, GitHub+Linear/Jira connection; local git/rg + codemod/test runner. Нет требования API key в shell, но это всё равно новый provider/auth dependency.

**Исключения и проблемы:** Нет per-skill/root license; не копировать текст/скрипты. Пример grep -v done.list фильтрует literal regex, а не содержимое файла; filename splitting через shell/xargs хрупкое. CLI orchestration и автоматический merge не переносить.

**Evidence:**
- [composio/codebase-migrate/SKILL.md:20](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/codebase-migrate/SKILL.md:20) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/codebase-migrate/SKILL.md#L20)
- [composio/codebase-migrate/SKILL.md:53](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/codebase-migrate/SKILL.md:53) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/codebase-migrate/SKILL.md#L53)
- [composio/codebase-migrate/SKILL.md:106](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/codebase-migrate/SKILL.md:106) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/codebase-migrate/SKILL.md#L106)
### composio / notion-research-documentation

**Решение:** ADAPT_CITATION_CHECKS; EXCLUDE_NOTION_WORKFLOW. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** У каждой существенной мысли источник, проверка URL, даты/устаревания и прямой цитаты; формат отчёта выбирается под решение. Использовать локальные citations и существующий evidence-docs.

**Зависимости:** Оригинальный workflow требует Notion MCP, OAuth, доступ к workspace, создание/редактирование remote pages; setup меняет Codex config. Citation checklist как текст не требует Notion.

**Исключения и проблемы:** Нельзя переносить auto-install MCP и provider-specific mention tags как обязательный формат. Evaluations README утверждает across Codex models, но перечисляет Haiku/Sonnet/Opus: это перенос текста, не экспериментальные результаты. MIT notice доступен внутри skill.

**Evidence:**
- [composio/notion-research-documentation/SKILL.md:12](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/SKILL.md:12) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/SKILL.md#L12)
- [composio/notion-research-documentation/SKILL.md:19](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/SKILL.md:19) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/SKILL.md#L19)
- [composio/notion-research-documentation/reference/citations.md:184](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/reference/citations.md:184) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/reference/citations.md#L184)
- [composio/notion-research-documentation/evaluations/README.md:12](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/evaluations/README.md:12) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/evaluations/README.md#L12)
### composio / skill-installer

**Решение:** REFERENCE_FOR_PATH_VALIDATION; DO_NOT_INSTALL. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Явный CODEX_HOME, --ref, отказ перезаписи существующей папки, ограничение archive extraction каталогом назначения. Это полезные acceptance examples для UP, не новый installer.

**Зависимости:** Python stdlib + Git/network; публичный download без API key, private optional GH_TOKEN/GITHUB_TOKEN или git credentials. Runtime writes в destination и temp.

**Исключения и проблемы:** Atomic upgrade/rollback и provider resolution отсутствуют; _copy_skill делает copytree прямо в target. Metadata отмечает default main, но code resolves repo default branch. Это installer новых plain copies, не решение обновления всей семьи/нативного plugin.

**Evidence:**
- [composio/skill-installer/SKILL.md:40](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/SKILL.md:40) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/SKILL.md#L40)
- [composio/skill-installer/scripts/install-skill-from-github.py:47](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py:47) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py#L47)
- [composio/skill-installer/scripts/install-skill-from-github.py:126](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py:126) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py#L126)
- [composio/skill-installer/scripts/install-skill-from-github.py:195](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py:195) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py#L195)
- [composio/skill-installer/scripts/install-skill-from-github.py:218](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py:218) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/scripts/install-skill-from-github.py#L218)
### composio / gh-fix-ci

**Решение:** PREFER_OPENAI_COPY_FOR_COMPARISON; OPTIONAL_EXISTING_GH. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Связь check name → run URL/head SHA → лог/фрагмент; missing logs выводятся явно, внешние CI providers не выдаются за проверенные.

**Зависимости:** gh CLI, GitHub authentication/network; Python stdlib helper. Не zero-auth.

**Исключения и проблемы:** Ссылается на plan skill, которого нет под этим именем; в root есть create-plan. Требует escalated auth status и дополнительные approvals даже при уже данном scope. Эти host/policy предположения не переносить.

**Evidence:**
- [composio/gh-fix-ci/SKILL.md:12](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-fix-ci/SKILL.md:12) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-fix-ci/SKILL.md#L12)
- [composio/gh-fix-ci/SKILL.md:15](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-fix-ci/SKILL.md:15) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-fix-ci/SKILL.md#L15)
- [composio/gh-fix-ci/SKILL.md:50](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-fix-ci/SKILL.md:50) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-fix-ci/SKILL.md#L50)
### composio / content-research-writer

**Решение:** EXCLUDE_COPY; DO_NOT_USE_EXAMPLES_AS_FACTS. Покрытие: SELECTED_SECTIONS_SEMANTIC_READ.

**Полезное:** Research gaps и связывание тезиса с источником — полезные общие приёмы, уже есть evidence-docs/copywriting.

**Зависимости:** Локальные drafts и web research; отдельный обязательный SDK не выявлен в просмотренных разделах. Полный workflow не исполнялся.

**Исключения и проблемы:** License отсутствует. В примере research приведены реальные на вид проценты/источники и эксперт Dr. Jane Smith без проверяемых ссылок; это illustrative material, не факт для переноса. Setup говорит Claude Code внутри Codex catalog. Прочитаны только релевантные первые 170 строк, остальной текст механически просканирован.

**Evidence:**
- [composio/content-research-writer/SKILL.md:46](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/content-research-writer/SKILL.md:46) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/content-research-writer/SKILL.md#L46)
- [composio/content-research-writer/SKILL.md:148](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/content-research-writer/SKILL.md:148) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/content-research-writer/SKILL.md#L148)
- [composio/content-research-writer/SKILL.md:154](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/content-research-writer/SKILL.md:154) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/content-research-writer/SKILL.md#L154)
### openai / cli-creator

**Решение:** HIGHEST_VALUE_KNOWLEDGE_TRANSFER. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Composable doctor/discover/resolve/read/preview-write, stable JSON/error contract, stdout JSON vs stderr progress, nonzero errors и offline mode. Хорошая опора для UP-02/03/06/08 и недостающего machine-readable OperationResult.

**Зависимости:** Текст/пример stdlib контрактов переносим без ключей. Готовый workflow создаёт и устанавливает CLI, выбирает Rust/Node/Python и предлагает crates/packages; эти установки не обязательны для adoption.

**Исключения и проблемы:** Не брать default Rust или global PATH install. У семьи Node/Python уже есть; использовать текущий runtime. doctor не должен автоматически делать сеть/login, чтобы offline/current/unknown оставались различимы.

**Evidence:**
- [openai/skills/.curated/cli-creator/SKILL.md:28](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md:28) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md#L28)
- [openai/skills/.curated/cli-creator/SKILL.md:45](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md:45) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md#L45)
- [openai/skills/.curated/cli-creator/SKILL.md:75](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md:75) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md#L75)
- [openai/skills/.curated/cli-creator/references/agent-cli-patterns.md:87](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/references/agent-cli-patterns.md:87) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/references/agent-cli-patterns.md#L87)
- [openai/skills/.curated/cli-creator/references/agent-cli-patterns.md:103](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/references/agent-cli-patterns.md:103) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/references/agent-cli-patterns.md#L103)
### openai / security-threat-model

**Решение:** ADAPT_EVIDENCE_AND_ASSUMPTION_SCHEMA. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Отделить runtime от CI/test code; concrete trust boundaries, attacker capabilities и non-capabilities; факты, предположения и существующие mitigations сопровождаются адресами. Применить для PA-02/AS-14 без отрицания подтверждённых code defects.

**Зависимости:** Repo read + модель; дополнительных SDK/API/MCP в skill не требуется. Mermaid artifact опционален для нашей адаптации.

**Исключения и проблемы:** Оригинал требует pause/1–3 questions перед final report. У нас спрашивать только существенное недостающее, доступный read-only audit не блокировать. Шаблон заранее требует 5–10 abuse paths и 2–3 examples per severity: не производить находки ради квоты.

**Evidence:**
- [openai/skills/.curated/security-threat-model/SKILL.md:19](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md:19) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md#L19)
- [openai/skills/.curated/security-threat-model/SKILL.md:32](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md:32) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md#L32)
- [openai/skills/.curated/security-threat-model/SKILL.md:48](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md:48) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md#L48)
- [openai/skills/.curated/security-threat-model/references/prompt-template.md:15](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/references/prompt-template.md:15) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/references/prompt-template.md#L15)
- [openai/skills/.curated/security-threat-model/references/prompt-template.md:28](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/references/prompt-template.md:28) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/references/prompt-template.md#L28)
### openai / security-ownership-map

**Решение:** ADAPT_BOUNDED_QUERY_IDEA_ONLY. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Большой analysis graph остаётся артефактом, модель получает bounded slice по ID/filter/limit. Хороший concrete пример для context-engineering без чтения целого JSON.

**Зависимости:** Полный skill требует Python+networkx и Git history; Neo4j/Gephi optional. Query helper использует stdlib, но ожидает generated dataset; его успешность не доказывает качество ownership inference.

**Исключения и проблемы:** Не добавлять networkx/Neo4j в семью и не превращать commit count в реальное security ownership. Не выдавать вычисленные timezone/person attribution за подтверждённую роль. Shallow clone непригоден для полноты history-based выводов.

**Evidence:**
- [openai/skills/.curated/security-ownership-map/SKILL.md:13](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/SKILL.md:13) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/SKILL.md#L13)
- [openai/skills/.curated/security-ownership-map/SKILL.md:107](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/SKILL.md:107) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/SKILL.md#L107)
- [openai/skills/.curated/security-ownership-map/scripts/query_ownership.py:15](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/scripts/query_ownership.py:15) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/scripts/query_ownership.py#L15)
### openai / security-best-practices

**Решение:** SELECTIVE_REFERENCE_ROUTING; NO_BLANKET_IMPORT. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Сначала language/framework scope, затем только подходящие references; report содержит ID, severity, impact и точные code lines.

**Зависимости:** Текстовые guides для Python/JS/TS/Go; runtime SDK для самой проверки не нужен; web fallback optional. Framework references просканированы, не все глубоко проверены.

**Исключения и проблемы:** Общие рекомендации про случайные IDs не заменяют authorization. Blanket security exceptions из project docs не доказывают безопасность; не переносить в PA-01. TLS/HSTS guidance обусловлено deployment context, не универсальный запрет.

**Evidence:**
- [openai/skills/.curated/security-best-practices/SKILL.md:15](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md:15) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md#L15)
- [openai/skills/.curated/security-best-practices/SKILL.md:43](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md:43) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md#L43)
- [openai/skills/.curated/security-best-practices/SKILL.md:78](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md:78) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md#L78)
### openai / define-goal

**Решение:** ALREADY_MATCHES_USER_AUTHORIZATION; ADAPT_GOAL_FIELDS. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Outcome/evidence/scope/stop condition вместо activity goal, goal tool только при explicit user request. В inputs/outputs task backlog использовать те же fields.

**Зависимости:** Инструкции без SDK; исполнение goal workflow требует runtime get_goal/create_goal. Перенос fields не требует этих tools.

**Исключения и проблемы:** Не вводить goal tool для каждого pipeline run, не создавать промежуточные ledger только потому, что skill описывает measurable goals.

**Evidence:**
- [openai/skills/.curated/define-goal/SKILL.md:16](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md:16) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md#L16)
- [openai/skills/.curated/define-goal/SKILL.md:46](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md:46) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md#L46)
- [openai/skills/.curated/define-goal/SKILL.md:55](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md:55) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md#L55)
### openai / gh-fix-ci

**Решение:** OPTIONAL_IF_GH_ALREADY_PRESENT. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** CI provider scope, missing-log disclosure и machine-readable log inspection. Более аккуратный fallback inline plan, чем у Composio.

**Зависимости:** gh + authenticated GitHub + network, Python helper. Полный skill без existing auth не работает.

**Исключения и проблемы:** Не вводить GitHub prerequisite для локальной pipeline. Explicit extra plan approval не копировать при уже разрешённой работе. Read-only extracted log fixture допустим в offline tests.

**Evidence:**
- [openai/skills/.curated/gh-fix-ci/SKILL.md:12](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md:12) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md#L12)
- [openai/skills/.curated/gh-fix-ci/SKILL.md:42](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md:42) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md#L42)
- [openai/skills/.curated/gh-fix-ci/SKILL.md:48](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md:48) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md#L48)
### openai / playwright

**Решение:** ADAPT_FRESH_OBSERVATION_RULE; KEEP_HOST_ADAPTER. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Snapshot перед action, refs обновляются после navigation/DOM changes, evidence paths; сильный принцип без привязки к CLI.

**Зависимости:** npx wrapper тянет @playwright/cli, browser binaries/runtime; сеть при fetch package. Наличие npx не означает наличие Playwright или offline execution.

**Исключения и проблемы:** Не запускать auto npm install и не добавлять cli как обязательную зависимость. Не заменять тестовые assertions browser automation команды. Сохранить Apache LICENSE и NOTICE при переносе материала; icon assets не нужны.

**Evidence:**
- [openai/skills/.curated/playwright/SKILL.md:13](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md:13) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md#L13)
- [openai/skills/.curated/playwright/SKILL.md:63](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md:63) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md#L63)
- [openai/skills/.curated/playwright/SKILL.md:125](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md:125) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md#L125)
- [openai/skills/.curated/playwright/SKILL.md:138](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md:138) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md#L138)
- [openai/skills/.curated/playwright/NOTICE.txt:1](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/NOTICE.txt:1) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/NOTICE.txt#L1)
### openai / playwright-interactive

**Решение:** ADAPT_QA_CLAIM_MATRIX_ONLY. Покрытие: SELECTED_SECTIONS_SEMANTIC_READ.

**Полезное:** Единая inventory requirements/features/claims; каждый claim со state+functional check+visual evidence; normal input для signoff; full toggle cycle; functional success не доказывает visual success.

**Зависимости:** Оригинал требует js_repl, Playwright package+browser/Electron, config changes и danger-full-access; эти runtime requirements исключены. Наш текст QA использует имеющиеся инструменты или honest NOT_RUN.

**Исключения и проблемы:** Не копировать setup/npm init/install и требование выключить sandbox. Не копировать persistent handle/runtime code. Не дублировать browser.md, где уже есть look/suite/library: добавить только недостающую table contract и regression scenario.

**Evidence:**
- [openai/skills/.curated/playwright-interactive/SKILL.md:10](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md:10) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L10)
- [openai/skills/.curated/playwright-interactive/SKILL.md:42](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md:42) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L42)
- [openai/skills/.curated/playwright-interactive/SKILL.md:292](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md:292) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L292)
- [openai/skills/.curated/playwright-interactive/SKILL.md:330](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md:330) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L330)
- [openai/skills/.curated/playwright-interactive/NOTICE.txt:1](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/NOTICE.txt:1) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/NOTICE.txt#L1)
### openai / figma

**Решение:** EXCLUDE_IMPORT; OPTIONAL_EXISTING_PROVIDER_ONLY. Покрытие: SKILL_FULL_SEMANTIC_READ.

**Полезное:** Наблюдаемый подход: exact design node + screenshot + существующие project tokens. Для нашей семьи уже есть Figma bridge; отдельный skill не нужен.

**Зависимости:** Figma MCP, access/auth и assets endpoint; config reference требует FIGMA_OAUTH_TOKEN, network и host config.

**Исключения и проблемы:** LICENSE — Figma Developer Terms/Beta, не Apache. Не импортировать текст/assets/code в обязательный pack. Config советует echo полного токена; это исключить независимо от лицензии. Raw localhost asset assumption зависит от host/network, не portable.

**Evidence:**
- [openai/skills/.curated/figma/SKILL.md:14](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/SKILL.md:14) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/SKILL.md#L14)
- [openai/skills/.curated/figma/LICENSE.txt:1](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/LICENSE.txt:1) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/LICENSE.txt#L1)
- [openai/skills/.curated/figma/references/figma-mcp-config.md:19](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/references/figma-mcp-config.md:19) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/references/figma-mcp-config.md#L19)
### openai / figma-create-design-system-rules

**Решение:** EXCLUDE_IMPORT_TERMS; HOST_MAP_REFERENCE_ONLY. Покрытие: SELECTED_SECTIONS_SEMANTIC_READ.

**Полезное:** Разделение project instructions по host явно показывает нужность HostContext, но source не служит доказательством всех лимитов hosts.

**Зависимости:** Requires Figma MCP create_design_system_rules; доступ к codebase; persistent writes в CLAUDE.md/AGENTS.md/Cursor rule.

**Исключения и проблемы:** Developer Terms/Beta. Не копировать workflow или assets. Generic sample «all interactive elements aria-labels» не универсальное accessibility правило; новые ошибки можно занести вместе с красивым template. Прочитаны ключевые workflow/host/example sections; auxiliary docs только scan.

**Evidence:**
- [openai/skills/.curated/figma-create-design-system-rules/SKILL.md:15](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md:15) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md#L15)
- [openai/skills/.curated/figma-create-design-system-rules/SKILL.md:52](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md:52) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md#L52)
- [openai/skills/.curated/figma-create-design-system-rules/SKILL.md:180](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md:180) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md#L180)
- [openai/skills/.curated/figma-create-design-system-rules/LICENSE.TXT:1](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/LICENSE.TXT:1) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/LICENSE.TXT#L1)
### openai / openai-docs

**Решение:** ADAPT_FRESHNESS_PROVENANCE; EXCLUDE_AUTO_SETUP. Покрытие: SELECTED_SECTIONS_SEMANTIC_READ.

**Полезное:** Приоритет первичного источника, reuse fresh same-thread material, явно устаревший fallback, отличие callable capability от общей документации. Полезно для UP active-vs-doc evidence и research fixtures.

**Зависимости:** Исходный workflow использует Docs MCP или Node fetch-codex-manual helper, curl/network/temp cache; нет обязательного API key для public docs, но network/provider остаётся dependency. Модельные API задачи отдельный scope.

**Исключения и проблемы:** If MCP missing предписывает самостоятельно codex mcp add и escalation. Не переносить: в семье host routing/settings не должны меняться ради чтения docs. Репозиторий deprecated; metadata snapshot не current host specification.

**Evidence:**
- [openai/skills/.curated/openai-docs/SKILL.md:14](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md:14) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md#L14)
- [openai/skills/.curated/openai-docs/SKILL.md:40](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md:40) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md#L40)
- [openai/skills/.curated/openai-docs/SKILL.md:96](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md:96) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md#L96)
- [openai/skills/.curated/openai-docs/SKILL.md:108](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md:108) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md#L108)

Вывод по webapp-testing подтверждён отдельно текущей первичной [Playwright API documentation](https://playwright.dev/docs/api/class-page#page-wait-for-load-state): networkidle не рекомендуется как readiness criterion для тестирования, вместо него — web assertions. Ни браузерные fixtures, ни live auth, ни MCP evals не запускались; code-level findings не означают подтверждённый внешний инцидент.

## Конкретные задачи adoption

Задачи с ENRICH_EXISTING уточняют уже имеющиеся findings и не должны удваивать backlog. Ни одна не вводит обязательный новый пакет, API key или MCP server.

### PXS-01 · Добавить source/runtime contract для внешних заимствований

**Режим:** NEW_SMALL_TASK. Связь: MS-04, UP-01, UP-07.

**Source:**
- [composio/skill-creator/SKILL.md:70](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md:70) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md#L70)
- [openai/skills/.curated/cli-creator/SKILL.md:75](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md:75) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md#L75)
- [openai/README.md:2](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/README.md:2) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/README.md#L2)

**Точные изменения:**
- Create [skills/make-skill/plugins/make-skill/skills/make-skill/references/external-adoption.md](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/references/external-adoption.md)
- Edit [skills/make-skill/plugins/make-skill/skills/make-skill/references/authoring.md](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/references/authoring.md)
- Create [skills/make-skill/test/evals/fixtures/external-adoption.json](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/test/evals/fixtures/external-adoption.json)

**Входы:**
- Pinned source SHA + selected files/lines + per-file license/NOTICE
- Existing host capability record and actual installed tools

**Выходы:**
- Краткий contract: origin/ref/digest/license/notice; knowledge vs executable; commands/MCP/accounts/network/assets; allowed host; optional fallback
- 4 offline fixtures: no key but OAuth; npx present/package absent; missing license; deprecated source

**Выборы уже разрешены:**
- Отдельный reference внутри make-skill, не новый skill/router
- Required deps не меняются; неизвестная лицензия запрещает копирование материала, но не собственный анализ
- Spec metadata не расширять неподдерживаемым requires field: audit sidecar/compatibility используют existing standard

**Приёмка:**
- Все 4 fixtures выбирают правильный adoption verdict и не вызывают install/login
- Каждая copied/adapted source содержит pinned permalink и attribution receipt
- No key не выводится как no dependency

**Зависимости:** нет.
### PXS-02 · Дополнить UP backlog точным CLI operation-result контрактом

**Режим:** ENRICH_EXISTING_UP_NOT_DUPLICATE. Связь: UP-02, UP-03, UP-06, UP-08.

**Source:**
- [openai/skills/.curated/cli-creator/SKILL.md:45](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md:45) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md#L45)
- [openai/skills/.curated/cli-creator/references/agent-cli-patterns.md:87](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/references/agent-cli-patterns.md:87) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/references/agent-cli-patterns.md#L87)

**Точные изменения:**
- Create [lib/operation-result.js](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/operation-result.js)
- Edit [bin/sshlg-skills.js](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js)
- Create [test/operation-result_test.js](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/test/operation-result_test.js)

**Входы:**
- Existing UP OperationPlan: requested hosts/channels/preview flag
- Child exit/error/signal; desired/installed/active evidence

**Выходы:**
- Typed JSON receipt with operation id, status, scope, evidence, error class, remediation
- stdout JSON/stderr progress; empty results distinct from missing observation

**Выборы уже разрешены:**
- Оставить Node stdlib, без Rust/SDK/CLI parser package
- Не делать live network inside default doctor; network check отдельный явный режим
- Эта запись уточняет UP tasks, не добавляет второй independent implementation

**Приёмка:**
- Dry-run имеет 0 mutations, но complete plan receipt
- Auth/network/parse/child failures nonzero; unsupported/unknown не masquerade as success
- UP fixtures возвращают scope и effect fields без секретов

**Зависимости:** нет.
### PXS-03 · Дать agent-evals офлайн seed corpus до production

**Режим:** ENRICH_EXISTING_AS06. Связь: AS-06, EV-01.

**Source:**
- [composio/mcp-builder/SKILL.md:261](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/SKILL.md:261) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/SKILL.md#L261)
- [composio/mcp-builder/reference/evaluation.md:35](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/reference/evaluation.md:35) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/reference/evaluation.md#L35)

**Точные изменения:**
- Edit [skills/agent-stack/plugins/agent-stack/skills/agent-evals/SKILL.md](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/plugins/agent-stack/skills/agent-evals/SKILL.md)
- Edit [skills/agent-stack/test/evals/scenarios.json](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/test/evals/scenarios.json)
- Create [skills/agent-stack/test/evals/fixtures/bootstrap-corpus.json](https://github.com/ssheleg/agent-stack/blob/1f99f8f0914f122da1629e6ede6fd60a7e23d1ea/test/evals/fixtures/bootstrap-corpus.json)

**Входы:**
- Документированные outcome/forbidden-effects
- 6 synthetic immutable local cases plus production cases when available

**Выходы:**
- Corpus provenance synthetic|production, frozen inputs/expected outputs, reset rules
- Behavioral fixtures beyond name-trigger matching

**Выборы уже разрешены:**
- Не брать OpenAI/MCP evaluator, XML wrappers или API keys
- Точный scalar matcher только для scalar задач; side effects и trajectories отдельные assertions
- Seed corpus дополняется production traces, не объявляется доказательством полного coverage

**Приёмка:**
- Первый релиз имеет исполняемые offline assertions без production telemetry
- Повреждённый fixture/input/runner => TEST_ERROR, не behavior fail/pass
- Isolation: результат case B одинаков независимо от запуска case A

**Зависимости:** PXS-01.
### PXS-04 · Развести кодовый дефект, эксплуатационный факт и предположение в аудите

**Режим:** ENRICH_EXISTING_AUDIT_FIXES. Связь: PA-02, AS-14, PA-01.

**Source:**
- [openai/skills/.curated/security-threat-model/SKILL.md:19](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md:19) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md#L19)
- [openai/skills/.curated/security-threat-model/references/prompt-template.md:28](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/references/prompt-template.md:28) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/references/prompt-template.md#L28)

**Точные изменения:**
- Edit [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/audit.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/audit.md)
- Edit [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/documentation.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/documentation.md)
- Create [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/templates/finding-evidence.json](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/templates/finding-evidence.json)

**Входы:**
- Source path+line+SHA; reproduction command/output; environment scope
- Deployment evidence available or missing; attacker model if security applies

**Выходы:**
- Minimal finding schema observed_mechanism / observed_incident / assumption / deployment_unknown
- Risk priority with prerequisites and mitigation evidence

**Выборы уже разрешены:**
- Не превращать отсутствие production/logs в запрет finding
- Не навязывать интервью; спросить только если неизвестное меняет действие
- Не копировать threat model quota или требование report always waits

**Приёмка:**
- Confirmed local crash + no production logs остаётся code defect, external incidence UNKNOWN
- Documented exception не меняет failed invariant в PASS
- Unknown attacker control понижает уверенность exploitability, не стирает observed behavior

**Зависимости:** нет.
### PXS-05 · Связать browser claims с состояниями и артефактами

**Режим:** SMALL_EXTENSION_OF_EXISTING_BROWSER_DOCTRINE. Связь: небольшое дополнение текущего контракта.

**Source:**
- [openai/skills/.curated/playwright-interactive/SKILL.md:42](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md:42) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L42)
- [openai/skills/.curated/playwright-interactive/SKILL.md:292](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md:292) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L292)
- [openai/skills/.curated/playwright-interactive/SKILL.md:330](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md:330) · [SHA permalink](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L330)

**Точные изменения:**
- Edit [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/browser.md](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/browser.md)
- Create [skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/templates/browser-claims.json](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/templates/browser-claims.json)
- Create [skills/task-pipeline/test/browser_claims_test.py](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/test/browser_claims_test.py)

**Входы:**
- Existing scenario/requirement IDs
- Claim, viewport, state/control cycle, available browser channel

**Выходы:**
- Schema claim→scenario→state→assertion→artifact/review status
- Small offline validator and 3 test rows: missing artifact, wrong state, valid control cycle

**Выборы уже разрешены:**
- Не вводить Playwright/js_repl обязательной зависимостью
- Не дублировать существующее look/suite/library; добавить machine-readable связь
- Оригинальные Apache sources атрибутировать; Figma text/assets не переносить

**Приёмка:**
- Functional PASS при missing visual proof не даёт visual PASS
- Same screenshot из initial state не закрывает claim про opened/error state
- No browser channel => NOT_RUN с причиной, validator работает stdlib

**Зависимости:** PXS-01.
### PXS-06 · Превратить слабости чужого skill-creator в регрессии наших валидаторов

**Режим:** ENRICH_EXISTING_MS_AND_ED. Связь: MS-02, MS-04, ED-01.

**Source:**
- [composio/skill-creator/SKILL.md:304](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md:304) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md#L304)
- [composio/skill-creator/scripts/quick_validate.py:60](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/quick_validate.py:60) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/quick_validate.py#L60)
- [composio/skill-creator/scripts/package_skill.py:71](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/package_skill.py:71) · [SHA permalink](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/scripts/package_skill.py#L71)

**Точные изменения:**
- Edit [skills/make-skill/test/checker_parity_test.py](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/test/checker_parity_test.py)
- Create [skills/make-skill/test/evals/fixtures/resource-closure.json](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/test/evals/fixtures/resource-closure.json)
- Edit [skills/make-skill/plugins/make-skill/skills/make-skill/references/distribution.md](https://github.com/ssheleg/make-skill/blob/015052149a9c62a8a69e18a2a5dd6bf2f6e8196a/plugins/make-skill/skills/make-skill/references/distribution.md)

**Входы:**
- Minimal independently written cases: empty metadata, missing plain-path ref, sibling-only install, external symlink, accidental secret file
- Current make-skill checker and family package manifests

**Выходы:**
- Negative regression corpus with explicit expected scope
- Packaging acceptance requiring resource closure and allowed payload list

**Выборы уже разрешены:**
- Не копировать quick_validate/package_skill.py и не добавлять PyYAML ради чужого runtime
- Применить текущий parser improvement из MS-02
- Бюджет только actual tokenizer или UNKNOWN; words/lines не становятся tokens

**Приёмка:**
- Empty name/description rejected and valid nonempty metadata accepted
- Missing required reference detected в actual packaged copy, не только whole checkout
- Symlink наружу и undeclared secret fixture не попадают в publishable payload

**Зависимости:** PXS-01.

## Инвентарь остальных навыков

Таблица ниже покрывает все 48 верхнеуровневых Composio и 39 curated OpenAI entries. Для 832 SaaS adapters verdict по каждому хранится в JSON; одинаковые provider constraints здесь не повторяются 832 раза. D = full SKILL body read; S = selected sections read; scan = mechanical scan only. «Не выбран» не означает плохой skill: он не закрывает конкретный пробел семьи при условии отсутствия обязательных новых dependencies.

| Repo / skill | Read | License | Verdict |
|---|---|---|---|
| [composio/agent-deep-links](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/agent-deep-links/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/brand-guidelines](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/brand-guidelines/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/canvas-design](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/canvas-design/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/changelog-generator](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/changelog-generator/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/codebase-migrate](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/codebase-migrate/SKILL.md#L1) | D | UNSPECIFIED | EXCLUDE_RUNTIME; BATCHING_ALREADY_COVERED |
| [composio/competitive-ads-extractor](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/competitive-ads-extractor/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/connect](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/connect/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/connect-apps](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/connect-apps/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/content-research-writer](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/content-research-writer/SKILL.md#L1) | S | UNSPECIFIED | EXCLUDE_COPY; DO_NOT_USE_EXAMPLES_AS_FACTS |
| [composio/create-plan](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/create-plan/SKILL.md#L1) | D | Apache-2.0 | ALREADY_COVERED; DO_NOT_INSTALL |
| [composio/datadog-logs](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/datadog-logs/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/deploy-pipeline](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/deploy-pipeline/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/developer-growth-analysis](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/developer-growth-analysis/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/domain-name-brainstormer](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/domain-name-brainstormer/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/email-draft-polish](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/email-draft-polish/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/file-organizer](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/file-organizer/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/gh-address-comments](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-address-comments/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/gh-fix-ci](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/gh-fix-ci/SKILL.md#L1) | D | Apache-2.0 | PREFER_OPENAI_COPY_FOR_COMPARISON; OPTIONAL_EXISTING_GH |
| [composio/helium-mcp](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/helium-mcp/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/image-enhancer](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/image-enhancer/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/internal-comms](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/internal-comms/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/invoice-organizer](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/invoice-organizer/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/issue-triage](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/issue-triage/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/langsmith-fetch](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/langsmith-fetch/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/lead-research-assistant](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/lead-research-assistant/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/linear](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/linear/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/mcp-builder](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/mcp-builder/SKILL.md#L1) | D | Apache-2.0 | ADAPT_EVAL_CASE_DESIGN; EXCLUDE_HARNESS |
| [composio/meeting-insights-analyzer](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/meeting-insights-analyzer/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/meeting-notes-and-actions](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/meeting-notes-and-actions/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/notion-knowledge-capture](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-knowledge-capture/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/notion-meeting-intelligence](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-meeting-intelligence/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/notion-research-documentation](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-research-documentation/SKILL.md#L1) | D | MIT | ADAPT_CITATION_CHECKS; EXCLUDE_NOTION_WORKFLOW |
| [composio/notion-spec-to-implementation](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/notion-spec-to-implementation/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/paperjsx](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/paperjsx/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/pr-review-ci-fix](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/pr-review-ci-fix/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/raffle-winner-picker](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/raffle-winner-picker/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/sentry-triage](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/sentry-triage/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/skill-creator](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-creator/SKILL.md#L1) | D | Apache-2.0 | ADAPT_KNOWLEDGE_ONLY; DO_NOT_REPLACE_MAKE_SKILL |
| [composio/skill-installer](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-installer/SKILL.md#L1) | D | Apache-2.0 | REFERENCE_FOR_PATH_VALIDATION; DO_NOT_INSTALL |
| [composio/skill-share](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/skill-share/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/slack-gif-creator](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/slack-gif-creator/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/spreadsheet-formula-helper](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/spreadsheet-formula-helper/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/support-ticket-triage](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/support-ticket-triage/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/tailored-resume-generator](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/tailored-resume-generator/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/template-skill](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/template-skill/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/theme-factory](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/theme-factory/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [composio/video-downloader](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/video-downloader/SKILL.md#L1) | scan | UNSPECIFIED | NOT_SELECTED_DOMAIN_OR_RUNTIME; LICENSE_UNSPECIFIED_NO_COPY |
| [composio/webapp-testing](https://github.com/composio-community/awesome-codex-skills/blob/0930e1373789d2eda449039f7ac154b33031de89/webapp-testing/SKILL.md#L1) | D | Apache-2.0 | KEEP_INSPECT_THEN_ACT; EXCLUDE_WRAPPER |
| [openai/aspnet-core](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/aspnet-core/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/chatgpt-apps](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/chatgpt-apps/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/cli-creator](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md#L1) | D | Apache-2.0 | HIGHEST_VALUE_KNOWLEDGE_TRANSFER |
| [openai/cloudflare-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cloudflare-deploy/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/define-goal](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md#L1) | D | Apache-2.0 | ALREADY_MATCHES_USER_AUTHORIZATION; ADAPT_GOAL_FIELDS |
| [openai/figma](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/SKILL.md#L1) | D | Figma Developer Terms / Beta | EXCLUDE_IMPORT; OPTIONAL_EXISTING_PROVIDER_ONLY |
| [openai/figma-code-connect-components](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-code-connect-components/SKILL.md#L1) | scan | Figma Developer Terms / Beta | EXCLUDE_COPY_TERMS_AND_PROVIDER |
| [openai/figma-create-design-system-rules](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md#L1) | S | Figma Developer Terms / Beta | EXCLUDE_IMPORT_TERMS; HOST_MAP_REFERENCE_ONLY |
| [openai/figma-create-new-file](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-new-file/SKILL.md#L1) | scan | Figma Developer Terms / Beta | EXCLUDE_COPY_TERMS_AND_PROVIDER |
| [openai/figma-generate-design](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-generate-design/SKILL.md#L1) | scan | Figma Developer Terms / Beta | EXCLUDE_COPY_TERMS_AND_PROVIDER |
| [openai/figma-generate-library](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-generate-library/SKILL.md#L1) | scan | Figma Developer Terms / Beta | EXCLUDE_COPY_TERMS_AND_PROVIDER |
| [openai/figma-implement-design](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-implement-design/SKILL.md#L1) | scan | Figma Developer Terms / Beta | EXCLUDE_COPY_TERMS_AND_PROVIDER |
| [openai/figma-use](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-use/SKILL.md#L1) | scan | Figma Developer Terms / Beta | EXCLUDE_COPY_TERMS_AND_PROVIDER |
| [openai/gh-address-comments](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-address-comments/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/gh-fix-ci](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md#L1) | D | Apache-2.0 | OPTIONAL_IF_GH_ALREADY_PRESENT |
| [openai/hatch-pet](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/hatch-pet/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/jupyter-notebook](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/jupyter-notebook/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/linear](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/linear/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/migrate-to-codex](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/migrate-to-codex/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/netlify-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/netlify-deploy/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/notion-knowledge-capture](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-knowledge-capture/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/notion-meeting-intelligence](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-meeting-intelligence/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/notion-research-documentation](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-research-documentation/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/notion-spec-to-implementation](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-spec-to-implementation/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/openai-docs](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md#L1) | S | Apache-2.0 | ADAPT_FRESHNESS_PROVENANCE; EXCLUDE_AUTO_SETUP |
| [openai/pdf](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/pdf/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/playwright](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md#L1) | D | Apache-2.0 | ADAPT_FRESH_OBSERVATION_RULE; KEEP_HOST_ADAPTER |
| [openai/playwright-interactive](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md#L1) | S | Apache-2.0 | ADAPT_QA_CLAIM_MATRIX_ONLY |
| [openai/render-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/render-deploy/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/screenshot](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/screenshot/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/security-best-practices](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md#L1) | D | Apache-2.0 | SELECTIVE_REFERENCE_ROUTING; NO_BLANKET_IMPORT |
| [openai/security-ownership-map](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/SKILL.md#L1) | D | Apache-2.0 | ADAPT_BOUNDED_QUERY_IDEA_ONLY |
| [openai/security-threat-model](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md#L1) | D | Apache-2.0 | ADAPT_EVIDENCE_AND_ASSUMPTION_SCHEMA |
| [openai/sentry](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/sentry/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/speech](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/speech/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/transcribe](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/transcribe/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/vercel-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/vercel-deploy/SKILL.md#L1) | scan | MIT | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/winui-app](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/winui-app/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |
| [openai/yeet](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/yeet/SKILL.md#L1) | scan | Apache-2.0 | NOT_SELECTED_DOMAIN_OR_RUNTIME |

## Порядок и границы завершения

Сначала PXS-01 задаёт provenance/dependency rules и PXS-06 добавляет внешние негативные примеры к существующим validators. Затем PXS-02 уточняет acceptance уже приоритетных UP fixes. PXS-03 исправляет AS-06 и даёт first-release eval corpus. PXS-04/05 уточняют evidence/QA contracts, не создавая конкурирующего маршрута.

Завершение этой ветки — все новые offline fixtures дают ожидаемые positive/negative результаты, copies сохраняют provenance/license/NOTICE, default family workflow не требует ни одного нового provider/key/package. Live APIs могут оставаться опциональными и возвращать NOT_RUN/UNSUPPORTED при недоступности. Установка foreign skills целиком не является критерием успеха.

Применено: make-skill/skill-auditor — read-only evidence метод; собственный inventory scanner; глубокое чтение выбранных исходников. Семейные repositories не редактировались.
