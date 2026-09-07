# FIX-VD-05.01 — Button DOM contract

Parent `FIX-VD-05` · implementation · P1

## Что и зачем

Общий kit spine фиксирует внешний API ценой базовой DOM-семантики и доступных адаптаций

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/DESIGN_SYNC_BRIDGE.md`

implementation; exact local source path. SHA256: `54af980e952ed2d95a1fbbea613b6924c633d86e37f38c41052268abac798d38`

```text
64:   forbids. Inlining it is how a token layer rots.
65: - **The bans travel with the values.** One accent, one atom per job, and whatever
66:   else [`styles/`](./styles/) says this pack refuses. A design agent given components
67:   and no bans will use them correctly and compose them wrongly.
68: - **Names are the interface.** The spine — the same six component names and props in
69:   every pack — exists so switching packs swaps identity, not API. This is the
70:   component-level form of a lesson the token layer already learned the hard way.
71:   The six are `Button`, `Card`, `Chip`, `Stat`, `Heading` and `Rule`, and their
72:   `*Props` bodies are byte-identical across all thirty-nine kits once comments are
73:   stripped. Everything a kit ships beyond them is that pack's signature —
74:   `Specimen` in `showroom`, `RegistrationMarks` in `blueprint`, `ModelBlock` in
75:   `maquette` — and belongs to it alone. Until 1.11.0 this paragraph asserted the
76:   count and named none of the six bridges, which left a reader with a number and no way
77:   to check a delivered kit against it.
78:
79: ## 3. Figma — one border at a time
80:
81: There are now two borders: Figma ↔ pack ([`FIGMA_BRIDGE.md`](./FIGMA_BRIDGE.md)) and
82: pack ↔ Claude Design (this file). The pack sits in the middle and is the source of
83: truth for both.
```

### Edit `repo://sheleg-design/kits/workbench/src/Button.tsx`

implementation; exact local source path. SHA256: `b89d875d79dd52c05c5920d0d70a90f0f60d2157d2f8361c5f566df9087ab11c`

```text
1: import type { ReactNode } from 'react';
2:
3: export interface ButtonProps {
4:   /** `primary` is the accent fill — at most one per view. */
5:   variant?: 'primary' | 'secondary' | 'ghost';
6:   size?: 'sm' | 'md' | 'lg';
7:   disabled?: boolean;
8:   onClick?: () => void;
9:   children: ReactNode;
10:   className?: string;
11: }
12:
13: export function Button({
14:   variant = 'primary',
15:   size = 'md',
16:   disabled = false,
17:   onClick,
18:   children,
19:   className,
20: }: ButtonProps) {
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-vd-05.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Default type=button overridable, native/ARIA props и ref forwarding; не разрешать default props молча стирать explicit caller props.

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Submit работает, icon-only aria-label и trigger controls пробрасываются, ref.focus доступен.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-VD-05.01.json), [parent](../parents/FIX-VD-05.json). Полный audit не required prompt input.
