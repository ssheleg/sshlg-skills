# FIX-UP-05.03 — Design installer adapter

Parent `FIX-UP-05` · implementation · P1

## Что и зачем

Перезапись member/runtime не атомарна и не даёт rollback

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/bin/cli.js`

implementation; exact local source path. SHA256: `e61994965d33da1d88ca261cd985acdd1e6c04b9d9a545a0a8834e003ae99e53`

```text
497:     );
498:     process.exit(1);
499:   }
500:
501:   fs.mkdirSync(targetDir, { recursive: true });
502:   for (const f of files) {
503:     const dest = path.join(targetDir, f);
504:     fs.mkdirSync(path.dirname(dest), { recursive: true });
505:     fs.copyFileSync(path.join(SKILL_DIR, f), dest);
506:   }
507:
508:   const rel = path.relative(cwd, targetDir) || ".";
509:   console.log(
510:     `\n${c("green", "✓")} ${c("bold", "SHELEG Design")} installed to ${c("blue", rel + "/")}\n` +
511:       `  ${c("dim", "SKILL.md")}            the agent skill\n` +
512:       `  ${c("dim", "SHELEG_DESIGN.md")}    the full reference\n` +
513:       `  ${c("dim", "MOTION_DOCTRINE.md")}  whether to animate at all — read before any animation\n` +
514:       `  ${c("dim", "styles/")}             style packs + token CSS (instrument-console / editorial-luxury / workbench / briefing-room / atrium / orchard / field-notes / cyclorama / showroom / blueprint / prism / maquette / scoreboard / datasheet / manpage / pigeonhole / roster)\n\n` +
515:       `Your Cursor / Claude agent can now discover the skill and build\n` +
516:       `cinematic, scroll-driven pages — or style product UI (dashboards, admin,\n` +
```

### Edit `repo://sheleg-design/install.sh`

implementation; exact local source path. SHA256: `9f9b08d7d4d430b7c74b0d6b64a6b2b7977a5fff25ecb037a1338f7d8d74fbd2`

```text
74:     fi
75:     ;;
76: esac
77:
78: mkdir -p "$TARGET" "$TARGET/styles" "$TARGET/styles/tokens"
79:
80: for f in SKILL.md CREATIVE_DIRECTOR.md STYLE_PACK_INDEX.md DESIGN_SYNC_BRIDGE.md SHELEG_DESIGN.md FIGMA_BRIDGE.md AI_PRODUCT_PATTERNS.md MOTION_DOCTRINE.md MOTION_PRODUCTION.md SURFACE_COMPOSITION.md MOBILE_SURFACES.md styles/STYLE_PACK_TEMPLATE.md styles/instrument-console.md styles/editorial-luxury.md styles/workbench.md styles/briefing-room.md styles/atrium.md styles/orchard.md styles/field-notes.md styles/cyclorama.md styles/showroom.md styles/blueprint.md styles/prism.md styles/maquette.md styles/scoreboard.md styles/tokens/instrument-console.css styles/tokens/editorial-luxury.css styles/tokens/workbench.css styles/tokens/briefing-room.css styles/tokens/atrium.css styles/tokens/orchard.css styles/tokens/field-notes.css styles/tokens/cyclorama.css styles/tokens/showroom.css styles/tokens/blueprint.css styles/tokens/prism.css styles/tokens/maquette.css styles/tokens/scoreboard.css styles/datasheet.md styles/tokens/datasheet.css styles/manpage.md styles/tokens/manpage.css styles/pigeonhole.md styles/tokens/pigeonhole.css styles/roster.md styles/tokens/roster.css styles/ora.md styles/outrank.md styles/babylove.md styles/tokens/ora.css styles/tokens/outrank.css styles/tokens/babylove.css styles/tenor.md styles/tokens/tenor.css styles/paperclip.md styles/tokens/paperclip.css styles/ledger.md styles/tokens/ledger.css styles/awning.md styles/tokens/awning.css styles/router.md styles/tokens/router.css styles/daylight.md styles/tokens/daylight.css styles/notation.md styles/tokens/notation.css styles/almanac.md styles/tokens/almanac.css styles/vitrine.md styles/tokens/vitrine.css styles/proscenium.md styles/tokens/proscenium.css styles/bulletin.md styles/tokens/bulletin.css styles/patchbay.md styles/tokens/patchbay.css styles/nameplate.md styles/tokens/nameplate.css styles/rimlight.md styles/tokens/rimlight.css styles/onionskin.md styles/tokens/onionskin.css styles/deskmate.md styles/tokens/deskmate.css styles/test-drive.md styles/tokens/test-drive.css styles/surveyor.md styles/tokens/surveyor.css styles/chorus.md styles/tokens/chorus.css; do
81:   if [ -f "$SRC_DIR/$f" ]; then
82:     cp "$SRC_DIR/$f" "$TARGET/$f"
83:   elif command -v curl >/dev/null 2>&1; then
84:     curl -fsSL "$RAW/$f" -o "$TARGET/$f"
85:   elif command -v wget >/dev/null 2>&1; then
86:     wget -q "$RAW/$f" -O "$TARGET/$f"
87:   else
88:     echo "Need a local checkout, curl, or wget to install $f" >&2
89:     exit 1
90:   fi
91: done
92:
93: echo "SHELEG Design installed to $TARGET/"
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-up-05.03.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Тот же writer contract для design cli/shell; no runtime dependency on sibling checkout.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

--force=true recoverable generation; obsolete managed-only removal.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-05.01` (data): Uses transaction writer or adapters for recovery testing.
- `FIX-UP-01.01` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-01.02` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- `FIX-UP-01.03` (data): Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UP-05.03.json), [parent](../parents/FIX-UP-05.json). Полный audit не required prompt input.
