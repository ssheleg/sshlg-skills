# FIX-EV-01.12 — Outcome corpus: agent-sync

Parent `FIX-EV-01` · verification · P1

## Что и зачем

Проверка выбора названия не доказывает пользу выполнения скилла

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Claims shared resources и журнал координации.

Вход: resource set, owner session, expiry. Выход: claim grant, generation/fence, renew/release receipts. Файл защищается ресурсным claim, не только названием задачи.

Граница: Agent-sync не заменяет scheduler и не доказывает enforcement на host без hook. Все writer paths должны соблюдать один authority.


## Exact targets и source окна

### Create `repo://agent-sync/evals/cases/agent-sync.json`

focused outcome corpus (new artifact). SHA256: `None`

```text
No bytes in the current base. For Edit_from_predecessor, materialize the declared upstream output; otherwise this is a proposed Create.
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-ev-01.12.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Конкретные cases этого skill

SY-01: Выданные IDs меняются задним числом; два reserve возвращают один номер — Перестановки run IDs, одна секунда, skew±5мин, delayed shard visibility, concurrent reserve одного run и retries: глобальная uniqueness и неизменность каждого уже выданного ID. Sequence test не называется race test.

SY-02: Общий last-renew позволяет активности одного агента подавлять продление чужих leases — С виртуальными часами A активен каждые100сек, B работает45мин: B lease не истекает. Explicit renew указанного key либо реально refresh, либо отвечает точной per-key причиной.

SY-03: Local renew перезаписывает уже завершённый steal — Deterministic interleavings renew↔steal, release↔renew, stale owner after suspension: не более одного owner; проигравший получает explicit lost и downstream writer отвергает старый fencing token.

SY-04: Task lease не защищает общий файл от владельца другой task lease — Две разные задачи обновляют один register: обе записи сохраняются, одновременный resource claim одного пути запрещён. Две независимые code files не сериализуются без причины.

SY-05: Пустой lock между O_EXCL и payload принимается за просроченный: два acquire выигрывают — Пауза на каждой границе create/open/write/fsync/publish; competitor никогда не получает второй won. Crash на каждой границе восстанавливается управляемо без вечного lock и без split-brain.

SY-06: Одно gated смешивает lease guarantee, видимость и наличие host enforcement — Матрица Claude/Codex × local/git × fs/cloud: status/board/setup/references согласованно сообщают каждую ось, ни один ungated host не получает enforcement=hook.

SY-07: Guard охватывает редактор и некоторые git commit, но не все записи через shell — Матрица Write/Edit/apply_patch/Bash Python/sed/redirect/git -C/env git/compound commands документирует covered/unsupported. Для заявленного enforced режима все поддержанные writes без resource grant отвергаются до эффекта.

SY-08: Поиск task-pipeline не учитывает native Codex plugin cache — Temporary HOME с только Codex cache, только Claude cache, только direct skill и полностью отсутствующей dependency: детектор корректен, без side effects и лишней установки.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Для agent-sync записать минимум positive, negative и ambiguous/no-op case из собственных audit findings; отдельно with/without skill. Не менять production integration для удобства grader.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Case manifest включает actual output oracle и raw result; agent-sync не проходит лишь по названию. Недоступный live host = NOT_RUN.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff

- `FIX-EV-01.01` (data): Uses common outcome manifest and honest result semantics.

Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-EV-01.12.json), [parent](../parents/FIX-EV-01.json). Полный audit не required prompt input.
