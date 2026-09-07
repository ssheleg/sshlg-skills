# FIX-RT-03.01 — Toolkit объявляет доступность машины по инвентарю только Claude Code

Parent `FIX-RT-03` · implementation · P2

## Что и зачем

Toolkit объявляет доступность машины по инвентарю только Claude Code

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Edit `repo://sshlg-skills/lib/conflicts.js`

implementation; exact local source path. SHA256: `0a48a039bf15efdff66dc6e03850b0d4b643b1ba3589f46e9e84991b66a03a03`

```text
153:  * parses and left empty when it does not — a skill contributes its id either way,
154:  * because dropping it would make an unparseable skill invisible to a check whose
155:  * whole job is to notice what is installed.
156:  */
157: function readSkills(home) {
158:   const fs = require('fs');
159:   const path = require('path');
160:   const out = [];
161:   const seen = new Set();
162:
163:   const describe = (dir) => {
164:     try {
165:       const text = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
166:       const fm = /^---\n([\s\S]*?)\n---/.exec(text);
167:       if (!fm) return '';
168:       const d = /^description:\s*(?:>-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m.exec(fm[1]);
169:       return d ? d[1].replace(/\s+/g, ' ') : '';
170:     } catch (e) { return ''; }
171:   };
172:   const add = (plugin, dir, id) => {
```

### Edit `repo://sshlg-skills/lib/toolkit.js`

implementation; exact local source path. SHA256: `7dc8cc6f6de0c342cc219277178e0c3d826b818d7ce6c83fc34a48f0528a333a`

```text
196:   const o = opts || {};
197:   const { family, foreign, total } = classify(skills, familyIds);
198:   const lines = [];
199:
200:   lines.push(`Toolkit — ${total} skills reachable on this machine`);
201:   lines.push('');
202:
203:   lines.push(`  family (${family.length})`);
204:   for (const s of family) {
205:     lines.push(`    ${pad(s.id, 26)}${firstClause(s.description, 88)}`);
206:   }
207:   if (!family.length) lines.push('    none installed — `npx sshlg-skills install`');
208:   lines.push('');
209:
210:   const foreignCount = foreign.reduce((n, g) => n + g.count, 0);
211:   lines.push(`  elsewhere (${foreignCount} across ${foreign.length} providers)`);
212:   const expand = new Set(o.expand || []);
213:   for (const g of foreign) {
214:     lines.push(`    ${pad(g.provider, 34)}${String(g.count).padStart(4)}`);
215:     if (expand.has(g.provider)) {
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/fix-rt-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Host adapters: discovered / enabled / exposed / callable отдельно, namespace+provenance+content digest вместо голого id. В отчёте показывать host и недоступные capability; сохранить просмотр других хостов как inventory.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Синтетические host homes: broken symlink, одноимённый чужой скилл, plugin только в Claude и skill только в Codex; roster active host содержит только реально разрешимые записи.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-UP-07.01` (data): Toolkit показывает effective provider inventory вместо Claude-only roster.
- `FIX-UP-07.02` (data): Toolkit показывает effective provider inventory вместо Claude-only roster.
- `FIX-UP-07.03` (data): Toolkit показывает effective provider inventory вместо Claude-only roster.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-RT-03.01.json), [parent](../parents/FIX-RT-03.json). Полный audit не required prompt input.
