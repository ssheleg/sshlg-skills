# CTX-04 — Итоговая outcome certification, поддержка hosts и staged release

P1 · очередь 3 · расчётная волна 24 · planned_not_implemented

Модули: sshlg-skills. Требования: E-05, E-06, E-01, E-02, E-10.

Интегральный gate после всех fixes и enabling outputs.

## Проблема и доказательства

Зафиксировать support tiers/version/model matrix и выполнить полный bounded corpus для 28 skills. Проверить реальную загрузку Claude Code и Codex, другие заявленные adapters по выбранному tier; затем handoff разных сессий через Fabric, stale/retry/cancel/merge cases, и A/B visual outcomes. Собрать immutable release set, staged install/upgrade/rollback receipts; обновить family pins и publish channels одной согласованной версией.



## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Зафиксировать support tiers/version/model matrix и выполнить полный bounded corpus для 28 skills. Проверить реальную загрузку Claude Code и Codex, другие заявленные adapters по выбранному tier; затем handoff разных сессий через Fabric, stale/retry/cancel/merge cases, и A/B visual outcomes. Собрать immutable release set, staged install/upgrade/rollback receipts; обновить family pins и publish channels одной согласованной версией.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Каждая finding закрыта regression proof и release digest; нет mandatory NOT_RUN для заявленного support tier. Outcome corpus оценивает изменения продукта/кода, не названия skills. Real two-host handoff и rollback проходят; clean install и upgrade из прошлой поддержанной версии дают expected active digest.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-RT-01](FIX-RT-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-RT-02](FIX-RT-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-RT-03](FIX-RT-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-RT-04](FIX-RT-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-MS-01](FIX-MS-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-MS-02](FIX-MS-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-MS-03](FIX-MS-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-MS-04](FIX-MS-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TP-01](FIX-TP-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TP-02](FIX-TP-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TP-03](FIX-TP-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TP-04](FIX-TP-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PA-01](FIX-PA-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PA-02](FIX-PA-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PA-03](FIX-PA-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-ED-01](FIX-ED-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SE-01](FIX-SE-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SE-02](FIX-SE-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SE-03](FIX-SE-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SE-04](FIX-SE-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-EV-01](FIX-EV-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UB-01](FIX-UB-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-01](FIX-UX-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-02](FIX-UX-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-03](FIX-UX-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-04](FIX-UX-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-05](FIX-UX-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-06](FIX-UX-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-07](FIX-UX-07.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-08](FIX-UX-08.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-09](FIX-UX-09.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-10](FIX-UX-10.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-11](FIX-UX-11.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-12](FIX-UX-12.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-13](FIX-UX-13.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DS-01](FIX-DS-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DS-02](FIX-DS-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DS-03](FIX-DS-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DS-04](FIX-DS-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DS-05](FIX-DS-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DS-06](FIX-DS-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-14](FIX-UX-14.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UX-15](FIX-UX-15.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-01](FIX-DV-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-02](FIX-DV-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-03](FIX-DV-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-04](FIX-DV-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-05](FIX-DV-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-06](FIX-DV-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-07](FIX-DV-07.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-08](FIX-DV-08.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-09](FIX-DV-09.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-10](FIX-DV-10.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-11](FIX-DV-11.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-12](FIX-DV-12.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-13](FIX-DV-13.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-14](FIX-DV-14.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-15](FIX-DV-15.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-16](FIX-DV-16.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-17](FIX-DV-17.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-18](FIX-DV-18.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-19](FIX-DV-19.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-DV-20](FIX-DV-20.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TG-01](FIX-TG-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TG-02](FIX-TG-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TG-03](FIX-TG-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TG-04](FIX-TG-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-TG-05](FIX-TG-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-01](FIX-AS-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-02](FIX-AS-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-03](FIX-AS-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-04](FIX-AS-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-05](FIX-AS-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-06](FIX-AS-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-07](FIX-AS-07.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-08](FIX-AS-08.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-09](FIX-AS-09.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-10](FIX-AS-10.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-11](FIX-AS-11.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-12](FIX-AS-12.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-13](FIX-AS-13.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-AS-14](FIX-AS-14.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-01](FIX-SY-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-02](FIX-SY-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-03](FIX-SY-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-04](FIX-SY-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-05](FIX-SY-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-06](FIX-SY-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-07](FIX-SY-07.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-SY-08](FIX-SY-08.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-01](FIX-PF-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-02](FIX-PF-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-03](FIX-PF-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-04](FIX-PF-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-05](FIX-PF-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-06](FIX-PF-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-07](FIX-PF-07.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-08](FIX-PF-08.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-09](FIX-PF-09.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-PF-10](FIX-PF-10.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-VD-01](FIX-VD-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-VD-02](FIX-VD-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-VD-03](FIX-VD-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-VD-04](FIX-VD-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-VD-05](FIX-VD-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-VD-06](FIX-VD-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-VD-07](FIX-VD-07.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-01](FIX-UP-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-02](FIX-UP-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-03](FIX-UP-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-04](FIX-UP-04.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-05](FIX-UP-05.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-06](FIX-UP-06.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-07](FIX-UP-07.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [FIX-UP-08](FIX-UP-08.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [CTX-01](CTX-01.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [CTX-02](CTX-02.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.
- [CTX-03](CTX-03.md) · control: Финальная certification не закрывается, пока эта задача не принята со своим proof.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b"}`.

Write scope: `repo:repo://sshlg-skills`, `file:repo://sshlg-skills/test/family_outcomes.cases.json`, `file:repo://sshlg-skills/test/host_release_acceptance.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](CTX-04.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
