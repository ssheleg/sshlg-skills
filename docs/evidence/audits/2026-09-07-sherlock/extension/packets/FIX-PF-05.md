# FIX-PF-05 — Saved Markdown brief уже есть, portable immutable node packet ещё нет

P2 · очередь 1 · расчётная волна 11 · planned_not_implemented

Модули: task-pipeline, Fabric. Требования: E-05, E-06, E-01, E-02.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

build.md требует task brief/report файлами, REQ цитаты, interfaces и отдельные worktree. Но graph schema не связывает node с brief/packet/base revision/output schema, next печатает только id/role/title. Graph и build workspace git-ignored; build cleanup удаляет packet/report. Fabric context pack содержит memory selection и task brief с SHA, но session directory удаляется, DB lock хранит ids/hash, не точные bytes и compiler version. Это не проверенный export/import пакета planner→executor.

- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md:132](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L132)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md:194](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L194)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md:201](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L201)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md:560](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/references/build.md#L560)
- [repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/graph.schema.json:65](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/plugins/task-pipeline/skills/task-pipeline/graph.schema.json#L65)
- [repo://fabric/apps/desktop/src/main/contextPack.ts:30](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/contextPack.ts#L30)
- [repo://fabric/apps/desktop/src/main/sessionBundle.ts:195](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/apps/desktop/src/main/sessionBundle.ts#L195)
- [repo://fabric/supabase/migrations/20260901000013_context_packs.sql:19](https://github.com/ssheleg/fabric/blob/629f050323ab5a302feffc7a1f4de8c079526b9a/supabase/migrations/20260901000013_context_packs.sql#L19)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [module:Fabric](../context/modules/Fabric.md) · sha256 `c4eda16b894540743b4948b5ca1d8b1de3c18e70e56a97f3a9e006e33b8ddb51`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [supporting evidence appendix](../pipeline-fabric-repro.json) · sha256 `93882b71773046385a6dd12dd638fe7dd2ad6050c8bcb943528cb79df77bb5d6`
- [supporting evidence appendix](../pipeline-fabric-chain-repro.json) · sha256 `de4770b81354d1b05b5af15d16c55d4d982f9597d3ed203b2343c1e0145f6fab`
- [supporting evidence appendix](../pipeline-fabric.json) · sha256 `32c397418c52908a631fe62a955f386e00568b97e60781e518128073cf6f6536`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Compiler фиксирует goal/REQ text/global constraints/interfaces, input artifacts с digest, base/tree, allowed scope, budgets, validation profile, skill lock. Immutable packet хранится отдельно от ephemeral credentials/worktree; resolver материализует пути на другом host. Agent transcript не нужен. Global constraints включать в каждый packet или pin shared immutable artifact; output metadata typed.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Planner process завершается; свежий executor другой runtime читает только packet и разрешённые artifact refs, выполняет task и выдаёт validated result; отсутствующий digest input → BLOCKED_INPUT; packet bytes доступны после session cleanup; воспроизведение не зависит от cwd/домашнего пути.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-PF-02](FIX-PF-02.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.
- [CTX-02](CTX-02.md) · data: Потребляет принятый контракт/результат предыдущей задачи.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5", "Fabric": "91337391aa8d24966bf0c57db381e6fe63b48bce"}`.

Write scope: `repo:repo://task-pipeline`, `repo:repo://fabric`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/references/build.md`, `file:repo://task-pipeline/plugins/task-pipeline/skills/task-pipeline/graph.schema.json`, `file:repo://fabric/apps/desktop/src/main/contextPack.ts`, `file:repo://fabric/apps/desktop/src/main/sessionBundle.ts`, `file:repo://fabric/apps/desktop/src/main/executionPacket.ts`, `file:repo://fabric/apps/desktop/test/executionPacket.test.mjs`, `append-only:repo://fabric`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-PF-05.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан. Часть рекомендации подготовлена локально в worktree; вся задача остаётся открытой до реализации/приёмки/release.
