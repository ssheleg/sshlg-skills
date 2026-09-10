# FIX-DS-03.01 — Производительность CSS/API описана абсолютами вместо проверяемых условий

Parent `FIX-DS-03` · implementation · P2

## Что и зачем

Производительность CSS/API описана абсолютами вместо проверяемых условий

Конкретная реализация приведена в шагах ниже.

## Решения

Proposed decisions in v3 brief and parent contracts are fixed for this leaf; local names/refactoring remain executor judgment.

Общие решения: использовать существующие family owners и artifact paths; не добавлять обязательные external packages/keys/runtime fetch. Parent acceptance и provenance сохраняются. Модель наследуется. Historical evidence read-only.

## Модуль и связи

Назначение: Art direction, semantic tokens, platform components, render critique.

Вход: approved или provisional UX scenarios, brand invariants, target platform. Выход: выбранное направление, component anatomy, tokens, stateful renders и quality receipt.

Граница: Lock бренда не закрывает открытые композиционные оси. Flow approval не означает craft approval. Kit contract должен сохранять DOM/native semantics.


## Exact targets и source окна

### Edit `repo://sheleg-design/plugins/sheleg-design/skills/sheleg-design/MOTION_DOCTRINE.md`

implementation; exact local source path. SHA256: `a9b04b4df0bda4053c0b7214e2fd0a9915bf326350da84e7351e5c1a21ecf879`

```text
164: ## 5. Forbidden forms
165:
166: These are not stylistic preferences. Each one is a defect with a known failure.
167:
168: - **`window.addEventListener("scroll", …)`** — runs every frame, unbatched,
169:   janky. Use `useScroll()`, `ScrollTrigger`, `IntersectionObserver`, or CSS
170:   scroll-driven animation (`animation-timeline: view()`).
171: - **Scroll progress computed from `window.scrollY` into component state** — same
172:   defect, now with a re-render on every frame.
173: - **`requestAnimationFrame` loops that write to component state** — use motion
174:   values (`useMotionValue` / `useTransform`) so the work stays off the render
175:   cycle.
176: - **State for continuous input** — pointer position, scroll progress, magnetic
177:   hover, physics. Storing these in `useState` re-renders the tree on every
178:   movement and collapses on mobile.
179: - **Animating a property that triggers layout** — `top`, `left`, `width`,
180:   `height`, `padding`, `margin`, `gap`, `font-size`. These re-lay-out the
181:   document on every frame. Animate `transform` and `opacity`, which the
182:   compositor handles alone; `filter` and `clip-path` are also safe. Paint-only
183:   changes (`background-color`, `border-color`, `color`, `box-shadow`) are
```

Тестовый artifact: `repo://sheleg-design/test/audit_regressions/fix-ds-03.01.py`. Это planned Create/extend; wiring в существующий runner принадлежит этой же правке.

## Шаги

1. Прочитать primary packet и проверить hash актуальных edit targets; upstream outputs materialize до claim.

2. Заменить API blacklist на budget и recipe: cheap passive reading, avoid layout thrashing, cleanup, measured long tasks/dropped frames. filter/clip-path — conditional, профиль на целевых устройствах. Ссылки: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event ; https://web.dev/articles/animations-guide .

3. В той же правке добавить focused positive/negative regression по acceptance; обновить только применимые canonical docs и generated counterparts.

4. Записать candidate commit, actual checks/outputs и remaining limits; не повышать NOT_RUN до PASS.

## Наблюдаемый результат и приёмка

Дешёвый scroll listener не отклоняется без измеренного дефекта; full-screen animated blur проходит только performance budget; 60/120Hz и reduced-motion проверяются отдельно.

Positive и исходный failure case проверяются по поведению, не по повторению слов инструкции.

## Входы и handoff



Outputs: candidate change + verification receipt + context delta. До dispatch нужны current source hashes, produced prerequisite outputs, scope claim и host capabilities. Сейчас это план, grants не выданы.

## Границы и откат

- Не реализовывать соседние parent outcomes без отдельной задачи.
- Не устанавливать внешний skill runtime, не добавлять API key/MCP service и не скачивать assets автоматически.
- Не редактировать historical ADR/migration или чужой продуктовый проект по ссылке evidence.

Invalid material decision → smallest counterexample to planner; unresolved decision becomes bounded decision leaf. Do not improvise cross-module redesign.

Revert isolated candidate; preserve previous release bytes. Persistence changes require append-only migration/recovery decision before execution.

Appendix и полный parent contract: [leaf JSON](FIX-DS-03.01.json), [parent](../parents/FIX-DS-03.json). Полный audit не required prompt input.
