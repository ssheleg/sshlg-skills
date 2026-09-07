# FIX-UP-05 — Перезапись member/runtime не атомарна и не даёт rollback

P1 · очередь 0 · расчётная волна 5 · planned_not_implemented

Модули: task-pipeline, sheleg-design, sshlg-skills. Требования: E-05, E-06, E-07, E-08.

Риск потери денег/данных/владения либо побочные эффекты updater: исправить первым.

## Проблема и доказательства

Fixture force-copy-failure: task-pipeline --force удаляет старую valid installation до copy; injected ENOSPC на первой copyFileSync даёт exit1, старый SKILL.md больше не существует. Design JS и runtime копируют поверх по одному файлу без staging; Design shell аналогично пишет прямо в target (и не использует --force как защиту существующих файлов вне plugin gate). Последние ветки подтверждены чтением кода, без инъекции сбоя в каждой.

- [repo://task-pipeline/bin/task-pipeline.js:52](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L52)
- [repo://task-pipeline/bin/task-pipeline.js:57](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/bin/task-pipeline.js#L57)
- [repo://task-pipeline/install.sh:45](https://github.com/ssheleg/task-pipeline/blob/66487ce32e7d4548fdaf7405eba5a21b44bb86d5/install.sh#L45)
- [repo://sheleg-design/bin/cli.js:501](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/bin/cli.js#L501)
- [repo://sheleg-design/install.sh:78](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/install.sh#L78)
- [repo://sheleg-design/install.sh:82](https://github.com/ssheleg/sheleg-design-skill/blob/562786b30f07f50a294d70a4c3ffd40794624f42/install.sh#L82)
- [repo://sshlg-skills/lib/runtime.js:103](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/runtime.js#L103)
- [repo://sshlg-skills/lib/runtime.js:119](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/runtime.js#L119)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:task-pipeline](../context/modules/task-pipeline.md) · sha256 `28e7c9316bc1a404c821b54e382b8944583945506f889d5d59fce880cf5c5d4e`
- [module:sheleg-design](../context/modules/sheleg-design.md) · sha256 `4f855319ae55cbe0e8ea9371442a5b10cec3cf1cf77153040cd47d883aa4b982`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [contract:context](../context/contracts/context.md) · sha256 `dca078915830462880380196886a99d5ae6e7bde2996b490663f8192d2bef2b0`
- [contract:execution](../context/contracts/execution.md) · sha256 `1232bc9f2df522dd87e97fdcd1f7b1450d12be824964655a765bb587fb3365b4`
- [contract:visual](../context/contracts/visual.md) · sha256 `f0ade3ef08c35a0e93c97543b950062ac20b21f709f0cac84e943f21c1453c36`
- [contract:product](../context/contracts/product.md) · sha256 `cc0ab01df11f1558d5d8d1a1869363a437d5499de8537fc521391e28af01e163`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`
- [supporting evidence appendix](../install-routing.json) · sha256 `cde90833817785137df98f034a0edec82514445c2421695b8ea6cf8282645451`
- [supporting evidence appendix](../install-logs/results.json) · sha256 `6c74ddf4586897cd821c34addcbfaaabf34e963644b3fc1433168d007387b2e0`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Единый transaction writer: подготовить sibling staging на том же filesystem, проверить required-file manifest и digest, fsync где нужно, записать journal, переключить pointer/rename с recoverable previous generation. Сохранять пользовательские файлы отдельно; не очищать неизвестные extras вслепую. Для remote shell скачать manifest+payload закреплённого commit полностью до switch. Все installers применяют одинаковую --force semantics.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Fault injection на первом/среднем/последнем copy и rename сохраняет старую полностью рабочую generation или новую полностью проверенную.
SIGTERM после stage и до switch не меняет active; после switch journal позволяет rollback.
Проверка --force=false не перезаписывает existing Design shell files; --force=true создаёт recoverable generation.
Obsolete managed resources удаляются по manifest, неизвестные пользовательские файлы сохраняются.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-UP-01](FIX-UP-01.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"task-pipeline": "66487ce32e7d4548fdaf7405eba5a21b44bb86d5", "sheleg-design": "562786b30f07f50a294d70a4c3ffd40794624f42", "sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b"}`.

Write scope: `repo:repo://task-pipeline`, `repo:repo://sheleg-design`, `repo:repo://sshlg-skills`, `file:repo://task-pipeline/bin/task-pipeline.js`, `file:repo://task-pipeline/install.sh`, `file:repo://sheleg-design/bin/cli.js`, `file:repo://sheleg-design/install.sh`, `file:repo://sshlg-skills/lib/runtime.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UP-05.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
