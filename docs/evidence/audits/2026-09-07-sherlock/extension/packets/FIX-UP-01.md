# FIX-UP-01 — Обещание закреплённого релиза семьи не обеспечено установкой

P1 · очередь 1 · расчётная волна 4 · planned_not_implemented

Модули: sshlg-skills. Требования: E-05, E-06, E-07, E-08.

Прямой запрос пользователя или P1 invariant; готовность определяется prerequisites.

## Проблема и доказательства

Fixture pin-plan: manifestVersion=0.55.1, но команда add получает только ssheleg/super-ux; refresh получает vision без версии. Claude получает plugin marketplace update и plugin update без immutable ref. Pins материализуют только git-submodule checkout; npm files вообще не включает skills/ и .gitmodules. Fixture auto-update-unknown: read=false превращается в «Auto-update is OFF».

- [repo://sshlg-skills/lib/updatemodel.js:16](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/updatemodel.js#L16)
- [repo://sshlg-skills/lib/updatemodel.js:39](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/updatemodel.js#L39)
- [repo://sshlg-skills/lib/updatemodel.js:75](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/updatemodel.js#L75)
- [repo://sshlg-skills/lib/plan.js:37](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L37)
- [repo://sshlg-skills/lib/plan.js:48](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/lib/plan.js#L48)
- [repo://sshlg-skills/bin/sshlg-skills.js:315](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L315)
- [repo://sshlg-skills/bin/sshlg-skills.js:327](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/bin/sshlg-skills.js#L327)
- [repo://sshlg-skills/package.json:15](https://github.com/ssheleg/sshlg-skills/blob/7ef37e8bd5220d6ab355346634ff19196de8f41b/package.json#L15)

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

2. Завести release-set.lock с package version, provider, immutable git SHA/ref, content digest, minimum host capability для каждого member. Сначала resolve/check без записи, затем получить все payload, проверить digest и контракт совместимости; устанавливать именно эти payload. Закрепить версию skills CLI, сейчас npx выбирает внешнюю реализацию независимо. Для host API без pin объявить capability unsupported и observed actual, не называть набор pinned. Auto-update состояние: enabled/disabled/unknown + источник/время; policy отдельно от observation.

3. Согласовать изменённые interfaces с перечисленными module contracts; обновить канонический текст и реально поставляемые generated copies в той же правке.

4. Выполнить конкретную приёмку ниже; привязать receipts к candidate commit, packet revision и environment. Независимый reviewer проверяет смысл, затем integrator проверяет результат после merge.

## Приёмка

Два запуска одной версии umbrella при изменившемся upstream дают одинаковые digest либо явный UNSUPPORTED_PIN.
Network/registry/parse failure выдаёт CHECK_ERROR или UNKNOWN, не current/OFF.
Команды/lock содержат immutable source всех девяти членов; release-set receipt сравнивает expected и observed digest.
Проверка latest read-only отделена от apply; latest_available, desired, installed и active четыре разные величины.

Targeted regression + validator изменённого пакета; полный suite только для затронутого runtime/validator/contract или release gate.

## Зависимости и входы

Независимая задача; source/context freshness и claim всё равно обязательны.

## Передача исполнителю

Validate all hashes, upstream outputs and source base immediately before dispatch; recompile revision after prerequisite/merge changes. These are local audit packets, not pre-approved future execution grants.

Source bases: `{"sshlg-skills": "7ef37e8bd5220d6ab355346634ff19196de8f41b"}`.

Write scope: `repo:repo://sshlg-skills`, `file:repo://sshlg-skills/lib/updatemodel.js`, `file:repo://sshlg-skills/lib/plan.js`, `file:repo://sshlg-skills/bin/sshlg-skills.js`, `file:repo://sshlg-skills/package.json`.

Candidate edit targets are not arbitrary write grants. Before dispatch reserve explicit Create paths, new migration/ADR IDs if needed, test paths and generated-copy targets; regenerate packet and re-check ownership. Historical migrations/ADRs are immutable evidence.

Outputs: candidate change, verification receipt, context delta — точные поля в [JSON packet](FIX-UP-01.json).

Rollback: Keep previous commit/release digest. Revert this isolated change if acceptance regresses; state migrations require explicit reversible migration or recovery plan before execution. Never delete installed plain copies before verified replacement.

Primary context и appendix разделены; prompt token count ещё не измерен. Host выбирается по capability, model наследуется. До actual dispatch никакой claim не выдан.
