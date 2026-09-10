# FIX-UX-02.01 — B051 объявляет спамом текст без единого повторения

Parent `FIX-UX-02` · implementation · P1

## Что и зачем

B051 объявляет спамом текст без единого повторения

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Vision → UX foundation → flows ↔ scenarios → prototype → UX audit; brand/copy.

Вход: цели, аудитория, ограничения и evidence с происхождением. Выход: scenario graph, flow coverage, UI strings и product decisions. Дизайн читает эти outputs, а не изобретает другое поведение.

Граница: Assumption, operator decision, implementation evidence и production effect не превращаются друг в друга автоматически.


## Exact targets и source окна

### Edit `repo://super-ux/plugins/super-ux/scripts/brand_lint.py`

implementation; exact local source path. SHA256: `02230a1fdead54b9f5dd57a903b6316d6b42a4e7fa45b011b4d065ee0502803d`

```text
1527:                  if len(pooled) > 1 else pooled[0][0])
1528:         per_file.append((label, {}, "\n\n".join(d[2] for d in pooled)))
1529:
1530:     for path, fields, body in per_file:
1531:         words = [w.lower().strip(".,:;!?()\"'") for w in body.split()]
1532:         real = [w for w in words if len(w) > 3 and w not in STOPWORDS]
1533:         if len(real) >= 40:
1534:             counts: dict[str, int] = {}
1535:             for word in real:
1536:                 counts[word] = counts.get(word, 0) + 1
1537:             for word, count in sorted(counts.items()):
1538:                 if count / len(words) > 0.01:
1539:                     findings.append(Finding(
1540:                         "B051", SEVERITY_ERROR, path, 0,
1541:                         f"`{word}` is {count / len(words):.1%} of the "
1542:                         f"document -- above 1% reads as stuffing, which "
1543:                         f"lowers citation likelihood rather than raising it",
1544:                     ))
1545:                     break
1546:
```

### Edit `repo://super-ux/plugins/super-ux/skills/brand-voice/references/brand-contract.md`

implementation; exact local source path. SHA256: `f2bef5e66047c516fe183448b8d5aa862c0478a32534fb5cd075855b33feb5f6`

```text
417: | B041 | E | an iOS keyword-field rule broken |
418: | B042 | E | a link in a body where the surface's physics forbid it |
419: | B043 | W | more hashtags than the surface tolerates |
420: | B050 | E | AI search declared a target while a crawler is blocked |
421: | B051 | E | a token exceeds 1% of a marketing document |
422: | B052 | E | a filler opener |
423: | B053 | W | no named author where the surface needs one |
424: | B054 | W | the title promises more than the body delivers |
425: | B060 | W/E | machine-drafting markers; error at three S1 |
426: | B061 | E | humor where the user is losing something |
427: | B062 | E | AT-06, a rhetorical dash standing in for a full stop, comma or colon |
428: | B063 | W | AT-07, a document title or heading ends in a full stop |
429: | B065 | E | a registry row carries a `Kind` the contract does not declare |
430: | B064 | W/E | the humanization pass: absent field warns that the default `on` applies unrecorded; an out-of-enum value errors; `off` with no `Humanization declined:` reason errors |
431: | B070 | E | a declared locale has no locale file |
432: | B071 | W | locale parity below the declared threshold |
433: | B072 | W | a locale row left identical to the primary |
434: | B073 | E | a field overflows under the locale's coefficient |
435:
436: ---
```

Тестовый artifact: `repo://super-ux/test/audit_regressions/fix-ux-02.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Сделать repetition advisory с минимальным count и длиной, учитывать зарегистрированные термины и язык, группировать по реально отрендеренной странице. Удалить универсальное обещание влияния на цитирование. Google описывает unnatural repetition/manipulative intent, а не порог 1%: https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing .

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

45/80/100 уникальных слов без повторов не дают finding; реальные повторные блоки дают advisory; domain term repetition сохраняется; страницы проверяются независимо.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-UX-02.01.json), [parent](../parents/FIX-UX-02.json). Полный audit не required prompt input.
