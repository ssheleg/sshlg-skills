# CTX-04.01 — Support matrix decision

Parent `CTX-04` · decision · P1

## Что и зачем

Итоговая outcome certification, поддержка hosts и staged release

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Discovery, routing, release-set и host adapters.

Вход: intent, subject, effects, facets, HostContext. Выход: RouteDecision и InstalledReceipt. Разделить available/installed/enabled/loaded; lexical shortlist не исполняет маршрут. desired/latest/installed/active — разные поля.

Граница: Не должен навязывать delivery read-only аудиту, стирать чужие конфиги или считать cache активной установкой.


## Exact targets и source окна

### Create `repo://sshlg-skills/docs/evidence/acceptance/ctx-04.01.json`

execution receipt; create only after actual run, never prefill PASS. SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://sshlg-skills/test/audit_regressions/ctx-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Проверить named sources и перечислить только эту нерешённую decision.

2. Зафиксировать exact host versions/capabilities и mandatory tiers: предложенный baseline Claude Code+Codex; прочие adapters сохраняют declared/untested до их smoke. Пользовательские model preferences inherited.

3. Записать выбранный вариант, отвергнутые альтернативы, exact Create/Edit scope и проверяемые consequences.

4. Consumer implementation получает новую packet revision; decision artifact не считается implementation PASS.

## Наблюдаемый результат и приёмка

Matrix перечисляет required vs optional checks; неизвестные versions/capabilities не invented PASS.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

248 prerequisites перечислены в JSON inputs. Coordinator проверяет все, executor получает их current accepted digest index; не загружать все чужие prompts.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](CTX-04.01.json), [parent](../parents/CTX-04.json). Полный audit не required prompt input.
