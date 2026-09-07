# Пак-триаж — 2026-09-06 (read-only, решение оператора)

Источник: `~/.agents/.skill-lock.json` (465 записей). «Коллизии» — скилы, которые
`npx sshlg-skills conflicts` называет кандидатами на землю роутеров семьи.
**Ничего не удалено.** Отметь пак/скилы к удалению — снятие делается удалением
симлинков из `~/.claude/skills/` и каталогов из хаба, источник не трогается.

| # | Пак (репо) | Скилов | Коллизий | Примеры | Рекомендация |
|---|---|---|---|---|---|
| | `anthropics/knowledge-work-plugins` | 171 | 24 | accessibility-review, account-research, analyze, architecture | решить по использованию: 171 скил бизнес-работы; главный вклад в 530-строчный ростер |
| | ↳ коллизии | | | brand-review, cash-flow-snapshot, comp-analysis, content-creation, create-viz, data-context-extractor, data-visualization, design-critique, design-system, discover-brand, documentation, draft-content… | |
| | `anthropics/financial-services` | 65 | 10 | 3-statement-model, accrual-schedule, ai-readiness, audit-xls | если финансы не твой профиль — снять целиком (65 скилов) |
| | ↳ коллизии | | | bond-relative-value, earnings-preview, financial-plan, fixed-income-portfolio, ib-check-deck, initiating-coverage, kyc-doc-parse, kyc-rules, tear-sheet, unit-economics | |
| | `anthropics/claude-plugins-official` | 23 | 6 | access, agent-development, build-mcp-app, build-mcp-server | дубли плагинов: многое уже стоит ПЛАГИНАМИ — проверить и снять plain-копии |
| | ↳ коллизии | | | build-mcp-app, build-mcp-server, build-mcpb, m5-onboard, mcp-integration, skill-development | |
| | `mattpocock/skills` | 21 | 0 | design-an-interface, edit-article, git-guardrails-claude-code, grill-me | оставить выборочно (dev-приёмы), снять пересечения |
| | `anthropics/skills` | 20 | 5 | academy-guide, algorithmic-art, brand-guidelines, canvas-design | ядро Anthropic (docx/pptx/pdf…) — оставить |
| | ↳ коллизии | | | academy-guide, brand-guidelines, canvas-design, frontend-design, skill-creator | |
| | `anthropics/claude-tag-plugins` | 19 | 1 | asana-api, bigquery-api, config-guide, confluence-api | Slack-обвязка: если Claude Tag не используется — снять |
| | ↳ коллизии | | | graphing | |
| | `Leonxlnx/taste-skill` | 13 | 0 | brandkit, design-taste-frontend, design-taste-frontend-v1, full-output-enforcement | вкусовые надстройки — по желанию |
| | `remotion-dev/skills` | 12 | 0 | remotion-best-practices, remotion-captions, remotion-create, remotion-docs | оставить, если делаешь видео в Remotion |
| | `vercel-labs/agent-skills` | 9 | 2 | deploy-to-vercel, vercel-cli-with-tokens, vercel-composition-patterns, vercel-optimize | оставить (перф/React), следить за пересечением с frontend-performance |
| | ↳ коллизии | | | vercel-optimize, web-design-guidelines | |
| | `anthropics/claude-code` | 9 | 0 | Agent Development, Command Development, Hook Development, MCP Integration | служебные — оставить |
| | `heygen-com/hyperframes` | 8 | 5 | embedded-captions, figma, hyperframes, hyperframes-core | по желанию |
| | ↳ коллизии | | | embedded-captions, figma, hyperframes, hyperframes-creative, talking-head-recut | |
| | `ssheleg/super-ux` | 7 | 0 | brand-voice, copywriting, ux-audit, ux-flows | СЕМЬЯ/wiki/проектные — не трогать |
| | `ssheleg/sheleg-dev` | 7 | 0 | ad-tracking, crypto-payments, error-tracking, frontend-performance | СЕМЬЯ/wiki/проектные — не трогать |
| | `sickn33/antigravity-awesome-skills` | 6 | 0 | bash-linux, docker-expert, nextjs-best-practices, prisma-expert | по желанию |
| | `anthropics/life-sciences` | 6 | 0 | clinical-trial-protocol-skill, instrument-data-to-allotrope, nextflow-development, scientific-problem-selection | по желанию |
| | `wshobson/agents` | 5 | 0 | modern-javascript-patterns, python-design-patterns, react-native-design, responsive-design | по желанию |
| | `kepano/obsidian-skills` | 5 | 0 | defuddle, json-canvas, obsidian-bases, obsidian-cli | СЕМЬЯ/wiki/проектные — не трогать |
| | `modelcontextprotocol/ext-apps` | 4 | 0 | add-app-to-server, convert-web-app, create-mcp-app, migrate-oai-app | по желанию |
| | `ssheleg/agent-stack` | 4 | 0 | agent-evals, agent-harness, agent-interop, agent-orchestrator | СЕМЬЯ/wiki/проектные — не трогать |
| | `stablyai/orca` | 4 | 0 | computer-use, orca-cli, orca-linear, orchestration | по желанию |
| | `anthropics/claude-cookbooks` | 4 | 1 | analyzing-financial-statements, applying-brand-guidelines, cookbook-audit, creating-financial-models | по желанию |
| | ↳ коллизии | | | creating-financial-models | |
| | `ssheleg/task-pipeline` | 3 | 0 | evidence-docs, project-audit, task-pipeline | СЕМЬЯ/wiki/проектные — не трогать |
| | `ssheleg/telegram-dev` | 3 | 0 | telegram-bots, telegram-miniapps, telegram-userbots | СЕМЬЯ/wiki/проектные — не трогать |
| | `anthropics/claude-agent-sdk-demos` | 3 | 0 | action-creator, executive-briefing, listener-creator | по желанию |
| | `addyosmani/web-quality-skills` | 2 | 0 | performance, seo | по желанию |
| | `github/awesome-copilot` | 2 | 0 | gsap-framer-scroll-animation, multi-stage-dockerfile | по желанию |
| | `ssheleg/make-skill` | 2 | 0 | <skill-name>, make-skill | СЕМЬЯ/wiki/проектные — не трогать |
| | `shadcn/ui` | 2 | 0 | migrate-radix-to-base, shadcn | по желанию |
| | `supabase/agent-skills` | 2 | 1 | supabase, supabase-postgres-best-practices | по желанию |
| | ↳ коллизии | | | supabase | |
| | `jimliu/baoyu-skills` | 1 | 0 | baoyu-infographic | по желанию |
| | `nextlevelbuilder/ui-ux-pro-max-skill` | 1 | 0 | ui-ux-pro-max | по желанию |
| | `openai/openai-agents-js` | 1 | 0 | openai-knowledge | по желанию |
| | `coreyhaines31/marketingskills` | 1 | 0 | ai-seo | по желанию |
| | `nailorsh/agents_utils` | 1 | 0 | telegram-mini-apps-react | по желанию |
| | `gokapso/agent-skills` | 1 | 0 | integrate-whatsapp | по желанию |
| | `supercent-io/skills-template` | 1 | 0 | frontend-design-system | по желанию |
| | `calm-north/seojuice-skills` | 1 | 0 | optimize-for-ai | по желанию |
| | `elevenlabs/skills` | 1 | 0 | text-to-speech | по желанию |
| | `jeremylongshore/claude-code-plugins-plus-skills` | 1 | 0 | tensorflow-model-trainer | по желанию |
| | `mindrally/skills` | 1 | 0 | computer-vision-opencv | по желанию |
| | `alirezarezvani/claude-skills` | 1 | 0 | senior-computer-vision | по желанию |
| | `blader/humanizer` | 1 | 0 | humanizer | по желанию |
| | `Digidai/product-manager-skills` | 1 | 0 | product-manager-skills | по желанию |
| | `emilkowalski/skill` | 1 | 0 | emil-design-eng | по желанию |
| | `vercel-labs/skills` | 1 | 0 | find-skills | по желанию |
| | `cloudai-x/threejs-skills` | 1 | 0 | threejs-animation | по желанию |
| | `dylantarre/animation-principles` | 1 | 0 | motion-designer | по желанию |
| | `bear2u/my-skills` | 1 | 0 | landing-page-guide-v2 | по желанию |
| | `ssheleg/sheleg-design-skill` | 1 | 0 | sheleg-design | СЕМЬЯ/wiki/проектные — не трогать |
| | `ssheleg/seo-aeo-audit` | 1 | 0 | seo-aeo-audit | СЕМЬЯ/wiki/проектные — не трогать |
| | `ssheleg/agent-sync` | 1 | 0 | agent-sync | СЕМЬЯ/wiki/проектные — не трогать |
| | `anthropics/launch-your-agent` | 1 | 0 | wrap-up | по желанию |
| | `conorbronsdon/avoid-ai-writing` | 1 | 0 | avoid-ai-writing | по желанию |
