# Context economy — what every agent loads, and what it should not

Measured on the operator machine 2026-10-15 (research by a non-author reviewer; tiktoken o200k,
Claude counts within ±15%). Before the first user word a Claude Code session here loaded about
37k tokens: the global `CLAUDE.md` (~10k, 689 lines), the skill listing (~8k), deferred tool names
(~4.5k), MCP server instructions (~4.9k), SessionStart output (~0.75k). The hub's routing block
is about 20 KB in each of five host files. Measure your own machine with
`npx sshlg-skills context`.

## Rules for instruction files (all hosts)

1. **Always-loaded text is for rules that apply to most tasks.** A procedure used by one kind
   of task (releases, model choice, spending detail, browser setup) lives in an on-demand file
   with a one-line trigger: "Before X, read Y." Claude Code's guidance targets under 200 lines
   per `CLAUDE.md`; imports do not reduce context cost.
2. **One home per rule.** A rule stated in two places costs twice and can contradict itself;
   when two instructions conflict a model may pick either. Point at the home instead of
   restating it.
3. **Imperative and short.** State the rule and its reason in one sentence. Dates, quotations
   and history go into HTML comments or the reference file. Avoid emphasis inflation:
   aggressive wording makes models over-apply a rule.
4. **Respect host caps.** Codex stops adding instruction files once the combined size reaches
   `project_doc_max_bytes` (32 KiB by default); `context` reports it as an error.
5. **Keep the prefix stable.** Editing a loaded instruction file mid-session re-injects the whole
   file into running sessions; batch edits.

## Rules for work

- Delegate verbose sweeps (logs, test output, wide searches) to a subagent and keep only its
  conclusion; each subagent still starts with the full baseline, so do not spawn one for a
  lookup you can do in one command.
- Report results concisely: what changed, the evidence, what is left. No restated plans.
- Stop by contract, not by exhaustion: task-pipeline's finish line decides when an iteration
  ends; findings that do not block its objective become board rows.

## What the hub enforces

- `npx sshlg-skills context` — sizes per host, hub-managed versus other text, documented caps.
- `routing-registry-total` in `docs/DOCMAP.md` — the routing text may fall, never grow by
  accident. Cutting it still needs the paired routing evaluation (descriptions and router
  paragraphs are not shortened on synthetic scores alone).
