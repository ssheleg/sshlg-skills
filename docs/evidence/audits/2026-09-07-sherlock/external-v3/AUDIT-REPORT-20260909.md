<sub>ssheleg skills — evidence-docs · agent-sync</sub>

# Sherlock external-v3 — итоговый отчёт исполнения (аудит 2026-09-09)

**Вердикт: 255/255 задач выполнены, 0 blocked.** Ветки — handoff, не релиз: ничего не смёрджено
в main семейных репо (fabric оператор влил сам), ничего не оттегировано и не опубликовано.

## Как проверялось (receipts)

| Проверка | Команда/механизм | Результат |
|---|---|---|
| Полный прогон регрессий | `for t in test/audit_regressions/*.py; python3 $t` × 10 репо | **241 сьют, 0 красных** |
| Каждый заявленный коммит | pairing-aware prefix-match против `git rev-list` запушенных веток | **264 токена, 0 недостающих** (fabric — в main) |
| Синхронизация веток | `git rev-parse <branch>` == `origin/<branch>` для 11 репо | все SYNCED |
| Рабочие деревья | `git status --porcelain` | 10/10 семейных CLEAN; fabric — WIP оператора |
| CI умбреллы | `gh run list -R ssheleg/sshlg-skills --branch sherlock/impl-20260907` | красный с CTX-04.01 → исправлено 9e64e06 (см. Findings) |
| Дрейф sync_references | `python3 test/sync_references.py` (super-ux) | 0 файлов записано |
| Лизы agent-sync | `agent_sync.py status` + reap | активных нет; 5 истёкших вычищено |

## Объём работы

| Репозиторий | Упоминаний в леджере | Коммитов впереди main (sherlock-ветка) |
|---|---|---|
| agent-stack | 21 | 24 |
| agent-sync | 9 | 14 |
| fabric | 13 | влито в fabric/main оператором |
| ledger branch | — | ~262 коммита |
| make-skill | 10 | 13 |
| seo-aeo-audit | 2 | 5 |
| sheleg-design-skill | 30 | 34 |
| sheleg-dev | 39 | 43 |
| sshlg-skills | 28 | 33 (+2 errata/audit) |
| super-ux | 38 | 41 |
| task-pipeline | 32 | 36 |
| telegram-dev | 9 | 12 |

Родительских findings: **140**, волн: 1–49, период исполнения: 2026-09-07 → 2026-09-09.

## Findings этого аудита (пост-completion)

1. **CI умбреллы был красным с CTX-04.01 по CTX-04.06** — 83/84 сьюта зелёные, один (`ctx-04.01`)
   сверял машинно-локальный `root_present` со свежим пробом НА раннере (там нет `~/.claude`).
   Исправлено: `sshlg-skills@9e64e06` — сверка по (agent, tier, status), `root_present` остаётся
   записанным наблюдением. Проверено локально + симуляцией раннера (пустой HOME).
2. **fabric-ветка уже интегрирована**: оператор влил `sherlock/impl-20260907` в `fabric/main` и
   удалил ветку; все fabric-коммиты задач подтверждены в main.
3. **Ложная тревога собственного верификатора** (честно): первый скрипт посчитал `7395ce8`
   (FIX-PF-06.01, task-pipeline) недостающим, сверив его с fabric/main. Попарная перепроверка:
   хэш корректен, леджер был прав; порча поля откачена до пуша.
4. **CI member-репо не триггерится на пуш веток** — ветки подтверждены локальными гейтами и
   свипом 241/0; CI-подтверждение появится на этапе PR.
5. **Handoff-worktree был удалён с диска** после финального пуша; восстановлен из ветки для этого
   отчёта — источник истины и есть ветка.

## Известные ограничения и риски (для проработки)

- **Needle-хрупкость доктрины**: регрессии по SKILL/references проверяют формулировки; будущий
  рерайт может уронить их без потери смысла. Осознанный компромисс.
- **Оффлайн-оракулы DV/EV-корпусов** моделируют контракт до/после фикса; сами доктринальные
  правки закрыты отдельными листами. `release_tie` DV-19 удовлетворяется только релизом.
- **Токен-бюджеты на пределе**: agent-sync SKILL ~4999/5000; sheleg-dev SKILLs под капом 4750.
- **Live-кейсы outcome-корпусов** без кредов честно NOT_RUN (никогда не PASS).
- **claude-mem не пишет память** (квота OpenRouter, 403) — действие на стороне оператора.

## Бэклог — что осталось (в порядке зависимостей)

1. **Ревью и merge 10 семейных sherlock-веток → main** (PR на каждый репо; GH-124 открыт до
   merge+release по правилу). Fabric уже влит.
2. **Релизный поезд**: релизы членов → обновление пинов умбреллы (skills.json + submodule +
   README, три вместе) → релиз sshlg-skills (annotated tag, B-93) →
   `npx --yes sshlg-skills@latest update` локально (Definition of Done) → рестарт Claude Code.
3. **DV-19 release-tie**: после релиза корпуса привязаны к тегу.
4. **CTX-04.06 → публикация**: staging принят; публикация — отдельный шаг после acceptance.
5. **Fabric follow-ups**: зарезервированные миграции 20260909000052/53 + ADR 0051 — DECIDED,
   NOT EXECUTED (docs/evidence/plans/task-pipeline-persistence-contract.md на бывшей ветке, теперь в main).
6. **agent-sync SKILL headroom**: ужать тело ниже ~4900 заранее.
7. **Прогнать live-кейсы evals** с кредами — опционально.
8. **Наблюдать CI на PR** каждого члена — первый CI-прогон веток случится там.
9. **claude-mem**: дождаться сброса квоты или сменить провайдера в ~/.claude-mem/settings.json.

## Приложение — все 255 листов (из леджера)

| ID | Задача | Репо | Коммит | Проверки |
|---|---|---|---|---|
| FIX-SY-01.01 | Immutable reservation identity |  | agent-sync@4acc62bcfea43f19c4877be0da69aee85bd93496 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-sy-01.01.py — exit 0, 10/ |
| FIX-DV-01.01 | Received vs completed state |  | sheleg-dev@aabec96 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-dv-01.01.py — exit 0, 7/7 |
| FIX-TG-01.01 | Durable inbox before ack |  | telegram-dev@3dbce80 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-tg-01.01.py — exit 0, 6/6 |
| FIX-UP-02.01 | Central operation plan |  | sshlg-skills@1c68ec0 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-up-02.01.py — OK 5 checks |
| ADOPT-M-01.01 | Добавить выборочную загрузку refs с бюджетом |  | make-skill@b25c1f6 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-01.01.py — OK 5 check |
| ADOPT-M-06.01 | Сохранить provenance вresearch synthesis |  | super-ux@43bd599 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-06.01.py — OK 6 check |
| ADOPT-M-11.01 | Добавитьstandards-vs-heuristics a11yreference |  | sheleg-design@003da99 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-11.01.py — OK 6 check |
| CTX-01.01 | Packet and context schemas |  | task-pipeline@21c9ab7 (branch sherlock/impl-20260907) | python3 test/audit_regressions/ctx-01.01.py — OK 6 checks (u |
| FIX-AS-01.01 | Saga state model |  | agent-stack@3a55516 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-as-01.01.py — OK 5 checks |
| FIX-SE-01.01 | Рекомендации Discover превращены в обязательный gate |  | seo-aeo-audit@bf1f24a (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-se-01.01.py — OK 8 checks |
| FIX-DV-01.02 | Atomic business application |  | sheleg-dev@4373115 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-dv-01.02.py — OK 5 checks |
| FIX-SY-01.02 | Allocator receipts and offline mapping |  | agent-sync@0c49be1 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-sy-01.02.py — all green,  |
| FIX-TG-01.02 | Business and send dedup |  | telegram-dev@37caa99 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-tg-01.02.py — all green,  |
| ADOPT-M-02.01 | Зафиксировать метод output eval без hostlock |  | make-skill@5fb8828 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-02.01.py — OK 6 check |
| ADOPT-M-07.01 | Подключитьresearch ledger безновойresearchroute |  | super-ux@33db323 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-07.01.py — OK 5 check |
| ADOPT-M-12.01 | Подключитьa11yevidence изdesignentry |  | sheleg-design@92086c2 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-12.01.py — OK 6 check |
| CTX-01.02 | Attempt and result schemas |  | task-pipeline@f42b6b1 (branch sherlock/impl-20260907) | python3 test/audit_regressions/ctx-01.02.py — OK 6 checks (b |
| FIX-AS-01.02 | Reconciliation and serialization |  | agent-stack@e8487fa (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-as-01.02.py — OK 5 checks |
| FIX-EV-01.01 | Outcome harness contract |  | sshlg-skills@d53e323 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-ev-01.01.py — OK 6 checks |
| FIX-SE-02.01 | Любая manual action объявлена обнулением всех улучшений сайта |  | seo-aeo-audit@c2bb4fa (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-se-02.01.py — OK 5 checks |
| FIX-DV-02.01 | Unique subscription grant |  | sheleg-dev@77b329a (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-dv-02.01.py — OK 5 checks |
| GH-124 | routegate: no escalation inside bypassPermissions; no gating of writes |  | sshlg-skills@8241090 (branch sherlock/impl-20260907) | node test/routegate_test.js — OK 19 checks (4 new #124 fixtu |
| FIX-SY-02.01 | Общий last-renew позволяет активности одного агента подавлять продлени |  | agent-sync@1079cfc (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-sy-02.01.py — all green,  |
| FIX-TG-03.01 | Separate canonicalizers |  | telegram-dev@7a8a371 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-tg-03.01.py — all green,  |
| ADOPT-M-03.01 | Подключить outcome reference кmake-skill |  | make-skill@0191014 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-03.01.py — OK 4 check |
| ADOPT-M-08.01 | Добавить сравнениеbehavioralconcepts |  | super-ux@36b4cb9 (branch sherlock/impl-20260907) | python3 test/audit_regressions/adopt-m-08.01.py — OK 5 check |
| CTX-01.03 | Typed dependency and graph closure |  | task-pipeline@200998a (branch sherlock/impl-20260907) | python3 test/packet_schema_test.py — OK 8 checks; npm test — |
| FIX-AS-02.01 | Нулевой baseline путается с отсутствующим: первый реальный расход теря |  | agent-stack@4074cb8 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-as-02.01.py — all green ( |
| FIX-DS-01.01 | Semantic token adapter |  | sheleg-design@0e58887 (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-ds-01.01.py — all green,  |
| FIX-EV-01.15 | Outcome corpus: seo-aeo-audit |  | seo-aeo-audit@103830b (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-ev-01.15.py — all green,  |
| FIX-RT-01.01 | Typed intent contract |  | sshlg-skills@0dc6c0e (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-rt-01.01.py — all green,  |
| FIX-DV-02.02 | Monotonic mirror и serialization retry |  | sheleg-dev@665fc1c (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-dv-02.02.py — all green,  |
| FIX-SY-03.01 | One local ownership critical section |  | agent-sync@c35068b (branch sherlock/impl-20260907) | python3 test/audit_regressions/fix-sy-03.01.py — all green,  |
| FIX-TG-03.02 | Strict input boundaries | telegram-dev | 897dda4 | fixture 15 checks; regression 4/4; npm test green; negatives |
| CTX-02.01 | Finding-to-parent mapper | task-pipeline | 30311b8 | regression 6/6 incl. 119-parent corpus; npm test EXIT=0; neg |
| CTX-03.01 | Bounded scenario graph | super-ux | d621682 | regression 7/7; npm test EXIT=0 (4642 checks) |
| FIX-AS-03.01 | Memory identity and contradiction | agent-stack | 8fe002d | regression 6/6; npm test EXIT=0 |
| FIX-DS-01.02 | Rendered pack comparison | sheleg-design | 535726d | regression 5/5; npm test EXIT=0 |
| FIX-EV-01.13 | Outcome corpus: make-skill | make-skill | 7ca9a78 | regression 6/6; family harness validated all 5 cases live; n |
| FIX-RT-01.02 | Composition и отрицания | sshlg-skills | 03a7368 | regression 5/5; npm test EXIT=0 (55 suites, 949 fixtures) |
| FIX-SE-03.01 | Cross-track проверка объявляет совместимые наблюдения противоречием | seo-aeo-audit | b2e0e13 | regression 6/6; npm test EXIT=0; body 4993/5000 tokens |
| FIX-DV-03.01 | Durable operation intent | sheleg-dev | 81f0ab9 | regression 6/6; npm test EXIT=0 |
| FIX-SY-03.02 | Fence-aware renewal | agent-sync | 2fabc8a | regression 4/4 (virtual clock); npm test EXIT=0 |
| CTX-02.02 | Leaf compiler | task-pipeline | b0c9747+b88fa17 | regression 7/7; npm test EXIT=0 after fixup b88fa17 (b0c9747 |
| CTX-03.02 | Clickable flow fixture | super-ux | 3b6e46c | regression 5/5; npm test EXIT=0 |
| FIX-AS-03.02 | Temporal evidence lifecycle | agent-stack | 37c0272 | regression 4/4; npm test EXIT=0 |
| FIX-EV-01.14 | Outcome corpus: sheleg-design | sheleg-design | 203eea1+03e7da2 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-EV-01.27 | Outcome corpus: telegram-bots | telegram-dev | 34057a0 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-MS-01.01 | Honest token result | make-skill | 38a6731 | regression 4/4 (independent-tokenizer comparison honestly NO |
| FIX-RT-02.01 | Route-scoped waiver state | sshlg-skills | 715fb24 | regression 4/4; npm test EXIT=0 (56 suites, 949 fixtures) |
| FIX-SE-04.01 | Тип источника автоматически подменяет силу конкретного утверждения | seo-aeo-audit | 2d5582c | regression 6/6; npm test EXIT=0; SKILL.md body 4999/5000 |
| FIX-DV-03.02 | Reconcile-first compensation | sheleg-dev | c54e3dc | regression 5/5; npm test EXIT=0 |
| FIX-SY-04.01 | Resource identity | agent-sync | 57af28b | regression 5/5; npm test EXIT=0 |
| CTX-02.03 | Content-addressed export/import | task-pipeline | 4c3e124 | regression 6/6; npm test EXIT=0 |
| CTX-03.03 | Coverage and handoff receipt | super-ux | 520a468 | regression 6/6; npm test EXIT=0 (4654 checks) |
| FIX-AS-04.01 | Fake-edge test удаляет зависимости по управлению и состоянию, если нет | agent-stack | bec2c24 | regression 5/5; npm test EXIT=0 |
| FIX-EV-01.28 | Outcome corpus: telegram-miniapps | telegram-dev | 41a93b0 | regression 7/7; harness validated 5 cases live; npm test EXI |
| FIX-MS-01.02 | Tokenizer corpus | make-skill | 5387dea | regression 5/5 (differential ran live and agreed); npm test  |
| FIX-RT-02.02 | Waiver lifecycle | sshlg-skills | fed150d | regression 5/5 (multi-turn); npm test EXIT=0 (57 suites) |
| FIX-VD-01.01 | Invariant/open-axis split | sheleg-design | e10a72a | regression 4/4; npm test EXIT=0 |
| FIX-DV-04.01 | Refund CAS проигрыш молча теряет больший cumulative refund | sheleg-dev | 634e3f0 | regression 5/5 (50x threaded convergence per order); npm tes |
| FIX-SY-04.02 | Write-mode documentation | agent-sync,agent-stack | agent-sync b8e6388 + agent-stack 78f9192 | regression 4/4; both repos npm test EXIT=0; SKILL.md 4986/50 |
| CTX-02.04 | Pre-dispatch freshness and budget | task-pipeline | 5bd6095 | regression 6/6; npm test EXIT=0 |
| FIX-EV-01.02 | Outcome corpus: brand-voice | super-ux | c8c4e78 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-EV-01.29 | Outcome corpus: telegram-userbots | telegram-dev | 6cdd1c8 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-MS-02.01 | Dependency-free YAML subset | make-skill | f8926bb | regression 6/6; npm test EXIT=0 (no existing test changed) |
| FIX-UP-01.01 | Immutable release-set lock | sshlg-skills | 65665e0 | regression 6/6; npm test EXIT=0 (58 suites) |
| FIX-VD-02.01 | Actionable render critique | sheleg-design | 7febb4b | regression 6/6; npm test EXIT=0 |
| FIX-DV-05.01 | Confirmed settlement grant | sheleg-dev | 2cda480 | regression 6/6; npm test EXIT=0; SKILL.md 4609 (worked examp |
| FIX-SY-05.01 | Пустой lock между O_EXCL и payload принимается за просроченный: два ac | agent-sync | bf30a8e | regression 5/5; npm test EXIT=0; validator self-test green ( |
| ADOPT-M-14.01 | ДобавитьUIhandoff section вpacket doctrine | task-pipeline | 9f85ab4 | regression 5/5; npm test EXIT=0 |
| FIX-AS-06.01 | Первый релиз фактически остаётся без исполняемого eval-корпуса | agent-stack | 65402d3 | regression 6/6; npm test EXIT=0 (self-test green); SKILL.md  |
| FIX-EV-01.03 | Outcome corpus: copywriting | super-ux | 2028938 | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-MS-02.02 | Optional full parser conformance | make-skill | bb8108e | regression 5/5 (PyYAML present, oracle ran live); npm test E |
| FIX-UP-01.02 | Pinned payload resolution | sshlg-skills | a672d21 | regression 6/6; npm test EXIT=0 (59 suites) |
| FIX-VD-02.02 | Bounded rerender comparison | sheleg-design | e615a3a | regression 5/5; npm test EXIT=0 |
| FIX-TG-02.01 | Оmitted allowed_updates ошибочно приравнен к пустому списку | telegram-dev | a8d16b8 | regression 4/4; npm test EXIT=0 |
| FIX-DV-05.02 | Refund and hold lifecycle | sheleg-dev | 00eb0f7 | regression 5/5; npm test EXIT=0 |
| FIX-AS-07.01 | Запрет проверки порядка пропускает подтверждение после действия | agent-stack | eee1ff2 | regression 5/5; npm test EXIT=0 (self-test green); SKILL.md  |
| FIX-EV-01.04 | Outcome corpus: ux-audit | super-ux | 2834b6e | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-EV-01.09 | Outcome corpus: evidence-docs | task-pipeline | 6909ae0 | regression 4/4; harness validated 5 cases live; npm test EXI |
| FIX-EV-01.12 | Outcome corpus: agent-sync | agent-sync | 0cf6f82 | regression 4/4; harness validated 5 cases live; npm test EXI |
| FIX-MS-03.01 | Аудит по описанию автоматически превращается в исправление и release | make-skill | c5cd153 | regression 5/5; adopt-m-03.01 needles updated; npm test EXIT |
| FIX-UP-01.03 | Update observation states | sshlg-skills | 6f1629a | regression 4/4; npm test EXIT=0 (60 suites) |
| FIX-VD-03.01 | Platform/renderer contract | sheleg-design | f0ea1c7 | regression 5/5; npm test EXIT=0 |
| FIX-TG-04.01 | Матрица launch surfaces неверно запрещает menu-button query flow | telegram-dev | 7558e9f | regression 5/5; npm test EXIT=0 |
| FIX-DV-07.01 | Opaque browser session | sheleg-dev | b363a3d | regression 5/5; npm test EXIT=0 |
| FIX-UP-05.01 | Transaction writer contract | sshlg-skills | e9657d3 | regression 4/4 (ENOSPC-on-3rd-copy fault injection); npm tes |
| FIX-AS-09.01 | Extensible OTel fields | agent-stack | 751eda0 | regression 5/5; npm test EXIT=0 (self-test green) |
| FIX-EV-01.05 | Outcome corpus: ux-flows | super-ux | a3c78e0 | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-EV-01.10 | Outcome corpus: project-audit | task-pipeline | 0c9d383 | regression 4/4; harness validated 5 cases live; npm test EXI |
| FIX-VD-03.02 | Native state matrix | sheleg-design | 0c9cba7 | regression 5/5; npm test EXIT=0 |
| PXS-01.01 | Добавить source/runtime contract для внешних заимствований | make-skill | 5596bbc | regression 5/5; npm test EXIT=0 |
| FIX-SY-07.01 | Guard охватывает редактор и некоторые git commit, но не все записи чер | agent-sync | 6c47beb | regression 4/4; npm test EXIT=0 (self-test green) |
| FIX-TG-05.01 | Лимит одного FloodWait не ограничивает бесконечную retry sequence | telegram-dev | 5303ab5 | regression 6/6; npm test EXIT=0 |
| FIX-DV-07.02 | Secret handling edges | sheleg-dev | 52de5a9 | regression 4/4; npm test EXIT=0 |
| FIX-UP-05.02 | Task-pipeline installer adapter | task-pipeline | 7a40fb3 | regression 4/4 (ENOSPC stage-crash fault); npm test EXIT=0 |
| FIX-UP-05.03 | Design installer adapter | sheleg-design | 1520051 | regression 4/4; npm test EXIT=0 |
| FIX-AS-09.02 | Disjoint billing buckets | agent-stack | 3e37e17 | regression 5/5; npm test EXIT=0 (self-test green) |
| FIX-EV-01.06 | Outcome corpus: ux-foundation | super-ux | 45777b1 | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-VD-03.03 | Host/platform tool selection | sshlg-skills | 9cc6f7e | regression 5/5; npm test EXIT=0 (62 suites) |
| FIX-MS-04.01 | Платформенные ограничения описаны как универсальные и частично устарел | make-skill | d384921 | regression 6/6; npm test EXIT=0; SKILL.md 4748 |
| FIX-DV-08.01 | ADC precedence написан в обратном порядке | sheleg-dev | 8f406ec | regression 5/5; npm test EXIT=0 |
| FIX-UP-05.04 | Recovery boundaries | sshlg-skills | c80a401 | regression 5/5; npm test EXIT=0 (63 suites) |
| FIX-AS-11.01 | Approval grant contract | agent-stack | bb002c3 | regression 6/6; npm test EXIT=0 (self-test green) |
| FIX-EV-01.07 | Outcome corpus: ux-scenarios | super-ux | 67167c8 | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-EV-01.11 | Outcome corpus: task-pipeline | task-pipeline | 970c3a3 | regression 4/4; harness validated 5 cases live; npm test EXI |
| FIX-VD-04.01 | shadcn назван unstyled: token mapping ошибочно подаётся как достаточно | sheleg-design | 2dedd82 | regression 4/4; npm test EXIT=0 |
| FIX-DV-09.01 | Per-principal OAuth client | sheleg-dev | b2df621 | regression 5/5 (threaded concurrency); npm test EXIT=0 |
| FIX-AS-11.02 | Threat model limits | agent-stack | b36f14a | regression 5/5; npm test EXIT=0 (self-test green) |
| FIX-EV-01.08 | Outcome corpus: vision | super-ux | cb76e7b | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-PA-01.01 | Документированное решение автоматически оправдывает дефект | task-pipeline | a33586f | regression 5/5; npm test EXIT=0 |
| FIX-VD-05.01 | Button DOM contract | sheleg-design-skill | d8af59a | regression 8/8; workbench tsc EXIT=0; npm test EXIT=0 (5660  |
| FIX-RT-04.01 | Route gate принимает наличие pipeline run за доказательство любого про | sshlg-skills | ed0cee7 | regression 6/6; routegate_test 24 checks; npm test EXIT=0 (6 |
| FIX-DV-09.02 | One-time OAuth state | sheleg-dev | b4035ca | regression 4/4; npm test EXIT=0 |
| FIX-EV-01.23 | Outcome corpus: agent-evals | agent-stack | 9fa1f98 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PA-02.01 | Отсутствие production измерения запрещает считать доказанный механизм  | task-pipeline | a593979 | regression 5/5; npm test EXIT=0 |
| FIX-UX-01.01 | Claim provenance schema | super-ux | e24ba68 | regression 5/5; npm test EXIT=0 (validate 4654 checks, fact  |
| FIX-VD-05.02 | Heading semantic contract | sheleg-design-skill | 628c989 | regression 5/5; workbench tsc EXIT=0; npm test EXIT=0 |
| FIX-UB-01.01 | Аудитор bundle выдаёт расчёт стоимости каталога за фактический расход  | sshlg-skills | 348d194 | regression 4/4 (live runs w/ and w/o trace); npm test EXIT=0 |
| FIX-DV-10.01 | Nonce равен присланному клиентом значению, а не ожидаемому сервером | sheleg-dev | 94170db | regression 3/3 (flow behaviour: replay-new-session/post-cons |
| FIX-EV-01.24 | Outcome corpus: agent-harness | agent-stack | 643a36e | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PF-01.01 | Attempt grant schema | task-pipeline | bd53922 | regression 3/3 (jsonschema live + stdlib fallback); npm test |
| FIX-UX-01.02 | B030 scoped validation | super-ux | ece0542 | regression 6/6 (real check_facts e2e); brand_lint_test 102;  |
| FIX-VD-05.03 | Generated kit propagation | sheleg-design-skill | fc991f9 | regression 3/3; npm test EXIT=0 |
| FIX-UP-03.01 | Explicit scope resolution | sshlg-skills | dfe3074 | regression 5/5 (node); npm test EXIT=0 (67 suites) |
| FIX-DV-11.01 | Auto-link по email игнорирует случаи, где Google не подтверждает текущ | sheleg-dev | 2ea0fb5 | regression 4/4; npm test EXIT=0 |
| FIX-EV-01.25 | Outcome corpus: agent-interop | agent-stack | fd8c49e | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PF-01.02 | Authority boundary | task-pipeline | 27410a4 | regression 7/7 (coordinator + graph process); npm test EXIT= |
| FIX-UX-02.01 | B051 объявляет спамом текст без единого повторения | super-ux | 745d31f | regression 4/4 (real check_bot_safety); brand_lint_test gree |
| FIX-VD-07.01 | Каталог внешнего frontend-design приписывает найденному skill запреты, | sshlg-skills + sheleg-design(0fa4d54) | 185a776 | regression 5/5 (node); both gates EXIT=0 (umbrella 68 suites |
| FIX-DV-12.01 | Copy-paste FastAPI skeleton не исполняет заявленный CSRF contract | sheleg-dev | cafc7f6 | regression 4/4 (full CSRF matrix); npm test EXIT=0 |
| FIX-EV-01.26 | Outcome corpus: agent-orchestrator | agent-stack | 37e493e | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PF-01.03 | Recovery and late worker | task-pipeline | ddc4386 | regression 5/5; PF-01.01/02 still green; npm test EXIT=0 |
| FIX-UX-03.01 | Advisory humanization contract | super-ux | 07dca6e | regression 5/5; npm test EXIT=0 (4654) |
| XD-01.01 | Зафиксировать источник и правила переноса | sheleg-design-skill | 0b52b45 | regression 5/5; npm test EXIT=0 |
| FIX-UP-03.02 | All emitters obey target | sshlg-skills | 16a9e41 | regression 3/3 (node, incl direct apply write); npm test EXI |
| FIX-DV-14.01 | Безусловный noscript pixel противоречит consent-gated архитектуре | sheleg-dev | eb57e96 | regression 4/4 (static checks over all snippets + planted-de |
| FIX-PF-02.01 | Proof identity | task-pipeline | 0b5efee | regression 4/4 (real git repo); graph_test 152; npm test EXI |
| FIX-PF-07.01 | Existing follower identity | fabric (passioncode-ai/fabric) | 0212763 | regression 5/5; tsc --noEmit clean; chain.test.mjs passes; p |
| FIX-UX-03.02 | B060 semantic safety | super-ux | 0d45907 | regression 4/4 (real check_ai_tells); brand_lint_test green; |
| XD-03.01 | Создать контракт пригодности визуального доказательства | sheleg-design-skill | 6b7c2d5 | regression 7/7; npm test EXIT=0 |
| FIX-AS-05.01 | Аудируемость ошибочно приравнена к статическому графу | agent-stack | 09e295f | regression 5/5; npm test EXIT=0 |
| FIX-UP-07.01 | Read-only provider inventory | sshlg-skills | 1c2d7f5 | regression 5/5 (node); npm test EXIT=0 (70 suites) |
| FIX-DV-15.01 | URL credential scrubber | sheleg-dev | c4e0346 | regression 5/5 (runs the doc code); npm test EXIT=0 |
| FIX-PF-02.02 | Revision invalidation | task-pipeline | 5eb54f1 | regression 5/5; npm test EXIT=0 |
| FIX-PF-07.02 | Crash-safe dispatch reconciliation | fabric (passioncode-ai/fabric) | 9e632a3 | regression 6/6; PF-07.01 still green; tsc EXIT=0; pushed she |
| FIX-UX-05.01 | Runner outcome states | super-ux | 7c7ea65 | regression 4/4 (real run.py + fake claude); npm test EXIT=0  |
| XD-05.01 | Добавить переносимый typography craft reference | sheleg-design-skill | fa17122 | regression 6/6; npm test EXIT=0 |
| FIX-AS-08.01 | Proportion and trial units | agent-stack | 39e7116 | regression 6/6 (wilson run from the doc); npm test EXIT=0 |
| FIX-DV-15.02 | SDK channel coverage | sheleg-dev | 619506c | regression 4/4; npm test EXIT=0 |
| FIX-PF-03.01 | Completion gate enforcement | task-pipeline | 1ee4f6a | regression 4/4; all PF siblings green; npm test EXIT=0 |
| FIX-UX-05.02 | Observable copy corpus | super-ux | 63a49f0 | regression 5/5 (real run.py + fake claude); 05.01 green; npm |
| XD-06.01 | Заменить неоткалиброванные оси примерами композиции | sheleg-design-skill | 2400ac1 | regression 5/5; npm test EXIT=0 |
| FIX-AS-08.02 | Paired and clustered comparison | agent-stack | 5f22cb4 | regression 4/4; 08.01 green; npm test EXIT=0 |
| ADOPT-M-05.01 | Добавить контрпримеры кeval contract | make-skill | f5ce6c1 | regression 4/4; npm test EXIT=0 |
| FIX-EV-01.16 | Outcome corpus: ad-tracking | sheleg-dev | 4f39d65 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PF-03.02 | Explicit exception disposition | task-pipeline | c28967f | regression 4/4; PF siblings green; npm test EXIT=0 |
| FIX-UX-10.01 | Loading из существующей задержки превращён в инсценировку вычисления | super-ux | f5eee2a | regression 5/5; npm test EXIT=0 (4660) |
| FIX-AS-10.01 | Повтор проверки старого ответа назван проверкой изменения решения моде | agent-stack | 0bce8e8 | regression 4/4; 09.01 green; npm test EXIT=0 |
| FIX-DS-02.01 | Опрос о значении craft превращён в нормативный порядок разработки | sheleg-design-skill | 04aa1ca | regression 4/4; npm test EXIT=0 |
| FIX-EV-01.17 | Outcome corpus: crypto-payments | sheleg-dev | b7a0806 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PF-04.01 | Dependency satisfaction predicate | task-pipeline | c6c8f95 | regression 5/5; npm test EXIT=0 |
| FIX-UX-11.01 | Figma fallback и provisional flow не доходят до разрешённого build sta | super-ux | e8ea7b1 | regression 5/5; npm test EXIT=0 |
| FIX-AS-12.01 | MCP shipping example не закрепляет SDK и использует прежний FastMCP co | agent-stack | c2f4195 | regression 5/5; npm test EXIT=0 |
| FIX-DS-03.01 | Производительность CSS/API описана абсолютами вместо проверяемых услов | sheleg-design-skill | 94e79e9 | regression 4/4; npm test EXIT=0 |
| FIX-EV-01.18 | Outcome corpus: error-tracking | sheleg-dev | b128408 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PF-04.02 | Fabric edge semantics | fabric (passioncode-ai/fabric) | ad6d3e0 | regression 4/4 (real chain.ts via node type-stripping); tsc  |
| FIX-PF-05.01 | Immutable packet compilation | task-pipeline | 49eadab | regression 5/5; npm test EXIT=0 |
| FIX-UX-12.01 | Статический PASS может повысить сценарий до implemented без проверки н | super-ux | 8fe3b9c | regression 6/6; npm test EXIT=0 (4660) |
| FIX-AS-13.01 | Признак long-running task ошибочно маршрутизирует в A2A вопреки MCP Ta | agent-stack | 13f2853 | regression 5/5; npm test EXIT=0 |
| FIX-DS-04.01 | Duration table допускает 500ms, общий UI gate запрещает >300ms | sheleg-design-skill | d0510af | regression 5/5 (fixtures via parsed table); npm test EXIT=0 |
| FIX-EV-01.19 | Outcome corpus: frontend-performance | sheleg-dev | 0d52934 | regression 6/6; harness validated 5 cases live; npm test EXI |
| FIX-PF-05.02 | Fabric context materialization | fabric (passioncode-ai/fabric) | 01df3d3 | regression 5/5 (real module via node type-stripping); tsc EX |
| FIX-TP-01.01 | Intake из имеющегося контекста | task-pipeline | ed67c8a | regression 6/6; npm test EXIT=0 |
| FIX-UX-15.01 | Separate applicability dimensions | super-ux | 6734f43 | regression 7/7; npm test EXIT=0 (4660) |
| FIX-AS-14.01 | Отсутствие evals ошибочно делает весь аудит unfalsifiable | agent-stack | 3fc5cf9 | regression 6/6; npm test EXIT=0 |
| FIX-DS-05.01 | No-JS критерий применяется ко всем поверхностям, включая внутренние UI | sheleg-design-skill | 0efa638 | regression 6/6 (parsed Applies-to column); npm test EXIT=0 |
| FIX-EV-01.20 | Outcome corpus: google-auth | sheleg-dev | 4c55308 | regression 6/6; harness validated 6 cases live; npm test EXI |
| FIX-PF-05.03 | Packet result metadata | task-pipeline | 37cb843 | regression 6/6; npm test EXIT=0 |
| FIX-PF-08.01 | All-prerequisite fan-in | fabric (passioncode-ai/fabric) | 0429466 | regression 5/5; PF-04.02/PF-05.02 still green; tsc EXIT=0; p |
| FIX-UX-15.02 | Technical scenario predicates | super-ux | 50d1960 | regression 6/6; 15.01 still green; npm test EXIT=0 |
| FIX-DS-06.01 | Visual composition eval: quiet dashboard | sheleg-design-skill | 3c12505 | regression 6/6; harness validated 6 cases live; npm test EXI |
| FIX-EV-01.21 | Outcome corpus: google-signin | sheleg-dev | 4bbab98 | regression 6/6; harness validated 6 cases live; npm test EXI |
| FIX-PF-06.03 | Append-only persistence contract | fabric (passioncode-ai/fabric) | da799dc | regression 5/5; pushed |
| FIX-TP-01.02 | Наследование модели | task-pipeline | f233c08 | regression 6/6; npm test EXIT=0 |
| FIX-VD-01.02 | Provisional pack path | super-ux + sheleg-design-skill | 80bc897 (super-ux) + 9685a16 (sheleg-design) | regression 5/5; npm test EXIT=0 both repos |
| FIX-EV-01.22 | Outcome corpus: stripe-billing | sheleg-dev | 46a7004 | regression 6/6; harness validated 6 cases live; npm test EXI |
| FIX-PF-06.01 | Adapter import mapping | task-pipeline + fabric | 7395ce8 (task-pipeline) + ed7249b (fabric) | regression 5/5 (adapter live via FABRIC_ROOT); npm test EXIT |
| FIX-VD-06.01 | Dials дают числовой ритуал без воспроизводимой визуальной калибровки д | sheleg-design-skill | bf78395 | regression 7/7; npm test EXIT=0 |
| XD-09.01 | Добавить матрицу давления на состояния | super-ux | dec3e01 | regression 6/6; npm test EXIT=0 (4663) |
| FIX-PF-06.02 | Single-authority dispatch integration | fabric (passioncode-ai/fabric) | bdfea39 | regression 5/5; PF-04.02/05.02/08.01 still green; tsc EXIT=0 |
| FIX-TP-02.01 | Заявленная независимость от companions противоречит обязательному supe | task-pipeline | a1d6bcc | regression 7/7; npm test EXIT=0 |
| XD-10.01 | Связать stress matrix с существующим UX contract | super-ux | 0c3de51 | regression 7/7; npm test EXIT=0 (4672) |
| FIX-DS-06.02 | Visual composition eval: consumer chat | sheleg-design-skill | 46a4efc | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-DV-06.01 | Typed amounts | sheleg-dev | def66c3 | regression 5/5; npm test EXIT=0 |
| FIX-PF-08.02 | Namespaced input merge | fabric (passioncode-ai/fabric) | b01afd5 | regression 4/4; PF-04.02/05.02/06.02/08.01 still green; tsc  |
| FIX-TP-04.01 | Неиспользованное правило автоматически считается ненужным | task-pipeline | 03ac64a | regression 8/8; npm test EXIT=0 |
| XD-11.01 | Усилить copy state contract без нового copy workflow | super-ux | 3adee47 | regression 7/7; npm test EXIT=0 |
| FIX-DS-06.03 | Visual composition eval: mobile sheet | sheleg-design-skill | 6ebd3a3 | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-DV-06.02 | Explicit excess policy | sheleg-dev | c4b49a8 | regression 5/5; 06.01 still green; npm test EXIT=0 |
| FIX-PF-09.01 | Authenticated publication | fabric (passioncode-ai/fabric) | e0f4e07 | regression 6/6 (real module via node); tsc EXIT=0; pushed |
| PXS-05.01 | Связать browser claims с состояниями и артефактами | task-pipeline | d026a87 | regression 5/5; browser_claims_test 8/8; npm test EXIT=0 |
| XD-12.01 | Зафиксировать component reuse и роль токена до kit migration | super-ux | c0cb504 | regression 6/6; npm test EXIT=0 |
| FIX-DS-06.04 | Visual composition eval: long-form landing | sheleg-design-skill | 3ab1d49 | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-DV-13.01 | Scope consent claims | sheleg-dev | e3febae | regression 5/5; npm test EXIT=0 |
| FIX-PF-09.02 | Immutable outputs and resource scope | fabric (passioncode-ai/fabric) | 07a7b1c | regression 4/4; 09.01 still green; tsc EXIT=0; pushed |
| FIX-DS-06.05 | Visual composition eval: large-text accessibility | sheleg-design-skill | 8f4c30b | regression 5/5; harness validated 5 cases live; npm test EXI |
| FIX-DV-13.02 | Mode-specific examples | sheleg-dev | 544af16 | regression 5/5; 13.01 still green; npm test EXIT=0 |
| FIX-ED-01.01 | Single-skill dependency closure | task-pipeline | e7b59dc | regression 4/4 (incl. isolated-copy resolution); npm test EX |
| FIX-UP-06.01 | Typed installer result | super-ux | 26080bb | regression 5/5 (real CLI, throwaway HOMEs, fake backends); i |
| FIX-DV-16.01 | Typed health states | sheleg-dev + telegram-dev | 0185e3a (sheleg-dev) + 3be5605 (telegram-dev) | regression 5/5; npm test EXIT=0 both repos |
| FIX-ED-01.02 | Closure validation | make-skill | cec1599 | regression 7/7; checker parity 20; npm test EXIT=0 |
| FIX-PA-03.01 | Опциональная HTML-страница обязательна в критерии выхода | task-pipeline | 8f85eb2 | regression 6/6; npm test EXIT=0 |
| FIX-UP-06.02 | Selection aggregation | super-ux | 3466820 | regression 4/4 (real CLI); 06.01 + installer still green; np |
| FIX-UP-07.02 | Native lifecycle capability | sshlg-skills + sheleg-design-skill | 8b6b4f4 (sshlg-skills) + 468958b (sheleg-design) | regression 6/6; lifecycle_test 7; npm test EXIT=0 both; DOCM |
| FIX-DV-16.02 | Cross-pack recovery agreement | sheleg-dev + telegram-dev | 8cecd32 (sheleg-dev) + a25dedb (telegram-dev) | regression 5/5; 16.01 refreshed; npm test EXIT=0 both repos |
| FIX-TP-03.01 | Kernel и profile contract | task-pipeline | 1ce8512 | regression 5/5; npm test EXIT=0 |
| FIX-UP-07.03 | Shared resolver consumer contract | sshlg-skills | 819d069 | regression 5/5; npm test EXIT=0; DOCMAP 73/970 |
| FIX-UX-04.01 | У одного скилла два несовместимых правила владения strings.md | super-ux | dd4553c | regression 5/5; npm test EXIT=0 (4672) |
| FIX-UP-04.01 | Verified replacement gate | sshlg-skills | 1f45883 | regression 7/7; fix-up-02.01 fixture updated; npm test EXIT= |
| FIX-PF-10.01 | Codex capability adapter | fabric (passioncode-ai/fabric) | 76ce1bc | regression 5/5; PF-05.02 still green; tsc EXIT=0; pushed |
| FIX-DV-17.01 | FCP ошибочно объявлен неизмеримым в поле | sheleg-dev | c3cc849 | regression 6/6; npm test EXIT=0 |
| FIX-SY-06.01 | Capability fields | agent-sync | 5491b52 | regression 6/6; npm test EXIT=0 |
| FIX-TP-03.02 | Profile-only gate dispatch | task-pipeline | b137ca9 | regression 5/5; npm test EXIT=0 |
| FIX-UX-06.01 | Новый проект Codex получает правило в CLAUDE.md | super-ux | f5ed45b | regression 7/7; npm test EXIT=0 (4672) |
| FIX-UP-04.02 | Recoverable migration | sshlg-skills | ae061e6 | regression 5/5; 04.01/02.01 still green; npm test EXIT=0; DO |
| FIX-PF-10.02 | Real two-session handoff | fabric (passioncode-ai/fabric) | c3a5f92 | regression 7/7; 10.01 still green; tsc EXIT=0; pushed |
| FIX-DV-18.01 | Оптимизационные эвристики превращены в запреты без измерений и поддерж | sheleg-dev | 5bafd17 | regression 7/7; 17.01 still green; npm test EXIT=0 |
| FIX-SY-06.02 | Generated capability docs | agent-sync | 784d52b | regression 5/5; all agent-sync regressions green; npm test E |
| FIX-UX-07.01 | Locale-independent IDs | super-ux | aaf3754 | regression 4/4; 06.01 green; npm test EXIT=0 (4672) |
| FIX-DV-19.01 | Artifact eval: stripe-billing | sheleg-dev | 51f01ea | regression 3/3; npm test EXIT=0 |
| FIX-RT-03.01 | Toolkit объявляет доступность машины по инвентарю только Claude Code | sshlg-skills | 5b6a29a | regression 5/5; npm test EXIT=0; DOCMAP 76/970 |
| FIX-SY-08.01 | Поиск task-pipeline не учитывает native Codex plugin cache | agent-sync | 88c78bd | regression 7/7; all agent-sync suites green (validate/self-t |
| FIX-UX-07.02 | ID-aware linter | super-ux | 9710253 | regression 4/4; 07.01 green; npm test EXIT=0 (4674) |
| FIX-DV-19.02 | Artifact eval: crypto-payments | sheleg-dev | 040be16 | regression 4/4; npm test EXIT=0 |
| FIX-UP-08.01 | HostContext root precedence | sshlg-skills | 08d0ad6 | regression 7/7; npm test EXIT=0; DOCMAP 77/970 |
| FIX-UX-08.01 | Approval оператора может стереть происхождение предположения | super-ux | 2b713d7 | regression 6/6; npm test EXIT=0 (4674) |
| FIX-DV-19.03 | Artifact eval: google-auth | sheleg-dev | 90f7b23 | regression 4/4; npm test EXIT=0 |
| FIX-UP-08.02 | Member installer root adapters | task-pipeline + super-ux + sheleg-design-skill | 9023469 (task-pipeline) + 59a4052 (super-ux) + f595c71 (sheleg-design) | regression 4/4; npm test EXIT=0 all three (super-ux installe |
| FIX-DV-19.04 | Artifact eval: google-signin | sheleg-dev | 3b45457 | regression 4/4; npm test EXIT=0 |
| FIX-UP-08.03 | Platform scope fixtures | sshlg-skills | f3f1b76 | regression 5/5; 08.01 green; npm test EXIT=0; DOCMAP 78/970 |
| FIX-UX-09.01 | Воронки конкурентов из proxy превращаются в «proven base» | super-ux | 8c4516e | regression 6/6; npm test EXIT=0 |
| FIX-DV-19.05 | Artifact eval: ad-tracking | sheleg-dev | ddc8019 | regression 4/4; npm test EXIT=0 |
| FIX-UX-13.01 | Общий precondition требует scenarios даже независимому copy/benchmark  | super-ux | 9c1c09c | regression 5/5; npm test EXIT=0 |
| FIX-DV-19.06 | Artifact eval: error-tracking | sheleg-dev | 2482e34 | regression 3/3; npm test EXIT=0 |
| FIX-UX-14.01 | BP-212 ошибочно объявляет локальное тестирование оплаты невозможным | super-ux | 26c1e42 | regression 5/5; npm test EXIT=0 |
| FIX-DV-19.07 | Artifact eval: frontend-performance | sheleg-dev | 3e851b6 | regression 3/3; npm test EXIT=0 |
| FIX-DV-20.01 | Ошибка окружения классифицируется как доказанный пропуск валидатора | sheleg-dev | 8e07df3 | regression 6/6; negatives 48/48 PASS; npm run test:all EXIT= |
| CTX-04.01 | Support matrix decision | sshlg-skills | 89c208a + 9e64e06 (errata) | regression 5/5; npm test EXIT=0; DOCMAP 79/970 |
| CTX-04.02 | Actual-load acceptance: Claude Code | sshlg-skills | 64bbe0f | regression 4/4; npm test EXIT=0; DOCMAP 80/970 |
| CTX-04.03 | Actual-load acceptance: Codex | sshlg-skills | a5ad41b | regression 4/4; npm test EXIT=0; DOCMAP 81/970 |
| CTX-04.04 | Cross-session integration acceptance | sshlg-skills | 69504a4 | regression 4/4 (native RAN through real fabric@sherlock chai |
| CTX-04.05 | Final parent proof closure | sshlg-skills | 8ac57b0 | regression 6/6; npm test EXIT=0; DOCMAP 83/970 |
| CTX-04.06 | Release-set staging and rollback | sshlg-skills | 76cf6a8 | regression 6/6; npm test EXIT=0; DOCMAP 84/970 |

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — every figure in the report is computed by a named command
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — lease hygiene verified and expired leases reaped
