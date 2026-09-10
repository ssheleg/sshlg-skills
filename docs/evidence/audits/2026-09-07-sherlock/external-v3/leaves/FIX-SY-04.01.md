# FIX-SY-04.01 — Resource identity

Parent `FIX-SY-04` · implementation · P1

## Что и зачем

Task lease не защищает общий файл от владельца другой task lease

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Claims shared resources и журнал координации.

Вход: resource set, owner session, expiry. Выход: claim grant, generation/fence, renew/release receipts. Файл защищается ресурсным claim, не только названием задачи.

Граница: Agent-sync не заменяет scheduler и не доказывает enforcement на host без hook. Все writer paths должны соблюдать один authority.


## Exact targets и source окна

### Edit `repo://agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`

implementation; exact local source path. SHA256: `9b64e93e16025c61cce840b5facbeed619927a20c07f6f919ac92816d6ddc3b6`

```text
2844:         return findings
2845:
2846:     # -- guard -------------------------------------------------------------
2847:
2848:     def guard(self, path: str) -> tuple[bool, str]:
2849:         rel = os.path.relpath(os.path.abspath(path), str(self.root))
2850:         patterns = self.cfg.get("guardedFiles") or []
2851:         if not any(matches_glob(rel, p) for p in patterns):
2852:             return True, "not a guarded file"
2853:
2854:         # A lease is required in every mode. What differs between backends is how
2855:         # strongly it is arbitrated, and that is what `gated` reports — not whether
2856:         # the check runs. A local lock file is genuine mutual exclusion between
2857:         # agents on one machine; it is only across machines that fs cannot arbitrate.
2858:         held = self.held()
2859:         if held:
2860:             note = "" if self.gated else " (advisory: arbitrated locally only)"
2861:             return True, f"held by this run ({', '.join(held)}){note}"
2862:
2863:         # Name the OTHER key, never just the other run. "r-x holds a lease right now"
```

Тестовый artifact: `repo://agent-sync/test/audit_regressions/fix-sy-04.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Resource key = canonical repo identity + canonical path, не task ID; shared registry lock отдельный от task lease.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Две разные tasks одного файла конфликтуют, разные files не блокируются без причины.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-SY-04.01.json), [parent](../parents/FIX-SY-04.json). Полный audit не required prompt input.
