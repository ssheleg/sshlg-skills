# Installed readback — hub 1.65.0 (ITER-1016, 2026-10-17)

Release: `sshlg-skills@1.65.0` from [`f2f24dc`](https://github.com/ssheleg/sshlg-skills/commit/f2f24dc20e66c4f1446bb865d63f567b8b566438),
annotated tag `v1.65.0`, [release run 38982999523](https://github.com/ssheleg/sshlg-skills/actions/runs/38982999523)
selected by the tag, `npm view sshlg-skills version` → `1.65.0`.

| Member | Tag | Release run (by tag) | Registry |
|---|---|---|---|
| task-pipeline | `v1.97.1` (`67715b0`) | [38977840974](https://github.com/ssheleg/task-pipeline/actions/runs/38977840974) release=success, publish=success | `task-pipeline-skill@1.97.1` |
| sheleg-design | `v1.65.0` (`6dee513`; pin `6fdbe96` = tag + ledger only) | [38972535223](https://github.com/ssheleg/sheleg-design-skill/actions/runs/38972535223) | `sheleg-design-skill@1.65.0` |
| seo-aeo-audit | `v0.27.0` (`d11dc0d`) | [38973499159](https://github.com/ssheleg/seo-aeo-audit/actions/runs/38973499159) | `@ssheleg/seo-aeo-audit@0.27.0` |
| sheleg-dev | `v0.14.0` (`6628387`) | [38972904000](https://github.com/ssheleg/sheleg-dev/actions/runs/38972904000) | `@ssheleg/sheleg-dev@0.14.0` |
| super-ux | `v0.60.0` (`d17b51f`) | [38972911046](https://github.com/ssheleg/super-ux/actions/runs/38972911046) | `super-ux@0.60.0` |

`task-pipeline` `v1.97.0` is a failed immutable tag ([38976060549](https://github.com/ssheleg/task-pipeline/actions/runs/38976060549):
its retro named no release after the newest stamp; publish skipped) — declared in its retro, shipped as 1.97.1.

## `npx --yes sshlg-skills@latest update` on the operator machine

Exit 1, "overall partial": Codex — 9 family plugins, 3 already at the pin, 6 deferred
(`DEFERRED_ACTIVE_GENERATION_SAFETY`, B-188/B-210), receipt and read-only watcher recorded. Every other step:
"11 of 11 steps, all green".

| Check | Result |
|---|---|
| Claude plugins vs pins (`installed_plugins.json`) | task-pipeline 1.97.1, sheleg-design 1.65.0, seo-aeo-audit 0.27.0, sheleg-dev 0.14.0, super-ux 0.60.0 — all equal |
| Shared skills carry the doctrine | `~/.agents/skills/task-pipeline/references/browser.md` and `~/.agents/skills/ux-audit/references/browser-engine.md` contain "WebKit (Safari) first" |
| `hooks status` | "всё на месте и совпадает" |
| `blocks` | claude, codex, gemini, pi, both cursor files: READ, syntax valid; no foreign-text report |
| Wait rule | present on Claude, Codex, Gemini, Pi; `update` printed no host gap |
| Operator blocks kept by the update | `OPERATOR:GLOBAL-RULES` in Codex, Gemini, Pi; the browser and artifacts rules in all four files |
| OpenClaw | the hub wrote nothing (`update` log names no OpenClaw step); `~/.openclaw/openclaw.json` was created at 23:19 by Fabric's adapter (plugin entry for `fabric-agent-adapter`), not by the hub |

Not observed: model behaviour (whether an agent opens Safari first), Codex's deferred members.
