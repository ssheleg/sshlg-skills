# FIX-UP-04 — Prune удаляет единственную plain-копию по непроверенной записи registry

P1 · очередь 0 · расчётная волна 16 · planned_not_implemented

Модули: sshlg-skills. Требования: E-05, E-06, E-07, E-08.

Риск потери денег/данных/владения либо побочные эффекты updater: исправить первым.

## Проблема и доказательства

Fixture stale-registry задаёт plugins={"super-ux@super-ux":[]}, без cache payload. Все 9 mocked skills installs вернули failure. Launcher всё равно удалил уникальный fixture .claude/skills/vision/SKILL.md, затем завершился exit1. Registry keys преобразуются в marketplace names; массив scopes/installPath и реально существующий payload не проверяются, backup/provenance не делаются. Обратный сценарий fresh-all-order: mocked skills add создаёт Claude plain vision, затем mocked plugin install регистрирует plugin; install --all заканчивается exit0, обе записи остаются. --all даёт wildcard, prune идёт раньше plugin install и после него не повторяется. Это проверка порядка orchestration с моделируемыми эффектами внешнего CLI, не live подтверждение поведения host.

- [repo://sshlg-skills/bin/sshlg-skills.js:125](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L125)
- [repo://sshlg-skills/bin/sshlg-skills.js:139](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L139)
- [repo://sshlg-skills/bin/sshlg-skills.js:156](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L156)
- [repo://sshlg-skills/bin/sshlg-skills.js:238](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L238)
- [repo://sshlg-skills/lib/plan.js:60](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L60)
- [repo://sshlg-skills/lib/plan.js:126](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L126)

## Связанный контекст

- [user requirements](../work-brief.md) · sha256 `ad3ad9a4108e26d14e3a9938454dc9b367c675ffc41f33958438f37f3350e8a1`
- [program](../context/program.md) · sha256 `984a3785a4fcaf9ac7e83939f59ab8aecb5aea0caf78feea73ba19bcbaa1b137`
- [decisions](../context/decisions.json) · sha256 `6e24144cc9b4da987300cd8168b1d5fb7dd777d627fdac9012cc55706c37768f`
- [module:sshlg-skills](../context/modules/sshlg-skills.md) · sha256 `1ba5c103f173da419a57a05153cf840fe5a10515f5f8261d194c719fb8420363`
- [contract:install](../context/contracts/install.md) · sha256 `4b090371d7db5576524793dd70a93b0be5bb3803b339e42f2932513eab8db289`
- [contract:routing](../context/contracts/routing.md) · sha256 `9e54f451c9efbda462e0f798751573114c5b787fb2fe435591057e96e108954b`
- [supporting evidence appendix](../install-routing.json) · sha256 `cde90833817785137df98f034a0edec82514445c2421695b8ea6cf8282645451`
- [supporting evidence appendix](../install-logs/results.json) · sha256 `6c74ddf4586897cd821c34addcbfaaabf34e963644b3fc1433168d007387b2e0`

## Решение и последовательность

1. Восстановить именно описанный механизм на закреплённых ниже исходниках; сохранить отрицательный baseline и не заменять его проверкой формулировки.

2. Prune превратить в migration после успешной верификации целевого provider. Проверять точный plugin spec, applicable scope, enabled state, cache payload/required resources, digest. Plain symlink managed source можно переключить атомарно; неизвестные/изменённые папки сохранять в quarantine с manifest и restore. Empty/corrupt registry = UNKNOWN, без удаления.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Матрица absent/corrupt/empty/stale/disabled/wrong-scope plugin не удаляет единственную копию.
Injected install failure сохраняет старую рабочую копию и её digest.
Отдельный fixture edited plain skill создаёт recoverable backup и journal; restore возвращает байты и symlink тип.
Проверка exact spec не считает любую другую запись из marketplace доказательством замены всех skills.
Fresh install --all сначала формирует правильные provider targets и после успешной миграции не оставляет создаваемую им plain копию рядом с plugin; нужны explicit invocations обоих каналов в smoke-test.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

- [FIX-UP-07](FIX-UP-07.md) · data: Нужен согласованный результат prerequisite, указанный в аудите этого механизма.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b"}`.

Write scope: `repo:repo://sshlg-skills`, `file:repo://sshlg-skills/bin/sshlg-skills.js`, `file:repo://sshlg-skills/lib/plan.js`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UP-04.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
