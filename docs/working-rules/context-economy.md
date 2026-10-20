# Context economy — what every agent loads, and what it should not

Measured on the operator machine 2026-10-15 (research by a non-author reviewer; tiktoken o200k,
Claude counts within ±15%). Before the first user word a Claude Code session here loaded about
37k tokens: the global `CLAUDE.md` (~10k, 689 lines), the skill listing (~8k), deferred tool names
(~4.5k), MCP server instructions (~4.9k), SessionStart output (~0.75k). The hub's blocks are
18–22 KB in each of five host files. Measure your own machine with
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
5. **Keep the prefix stable.** In the measured transcripts, an instruction file edited mid-session
   reached running sessions again as a whole file (one re-injection of 41k characters); batch edits.

## Measured again 2026-10-20

The global `CLAUDE.md` had grown to 50.6 KB (~12.4k tokens, 741 lines): 23.8 KB hub blocks, 26.8 KB
operator text kept as diverging hand copies per host. The skill listing filled its 30,000-character
budget: 81 of 134 skills were shown as a bare name, because almost every family description sat at
870 to 965 characters. A real session start injected about 2.4k characters of hook text, a
`compact` repeated the hub pointer, and one plugin's start hook waited out its 10 s timeout on 42
of 44 starts. task-pipeline asked for about 194k characters of reading before any code.

What 1.70.0 and the same-day member releases changed, and the rules they add:

6. **A description is a router, not a manual.** About 400 characters: one "Use when" sentence, the
   strongest trigger words in both languages, one "Not for". Trigger lists live in the body; a
   description that does not fit the listing is shown as a bare name, which routes worse than a
   short one. Plugin skills cannot be hidden with `skillOverrides`, so length is the only lever.
7. **A hook speaks once, and only when it has news.** No restating what the instructions already
   carry; nothing on `compact`/`resume` that the reloaded instructions repeat; status blocks
   collapse to one line unless something is actionable; a start hook is bounded in time.
8. **Read the head, query the log.** An entry page (`HANDOFF.md`) holds the current entry and an
   index; a retrospective's always-read floor has a byte budget, and history is archived verbatim.
9. **One source per rule across hosts.** Operator rules are one block installed into every host
   with `blocks install --agent all`; its preview is the drift report.

## Rules for work

- Delegate verbose sweeps (logs, test output, wide searches) to a subagent and keep only its
  conclusion; each subagent still starts with the full baseline, so do not spawn one for a
  lookup you can do in one command.
- Report results concisely: what changed, the evidence, what is left. No restated plans.
- Stop by contract, not by exhaustion: task-pipeline's finish line decides when an iteration
  ends; findings that do not block its objective become board rows.
- Do not re-run a check that passed on unchanged input, and do not retry an unchanged failing
  action; after two failed approaches change the approach or record a blocker.
- Never read a gate through a pipe (`| tail`) before acting on it: the hub refuses
  `<gate> | tail && git push` because the pipeline's status is `tail`'s.

## What the hub enforces

- `npx sshlg-skills context` — sizes per host, hub-managed versus other text, documented caps.
- `routing-registry-total` in `docs/DOCMAP.md` — the routing text may fall, never grow by
  accident. Cutting it still needs the paired routing evaluation (descriptions and router
  paragraphs are not shortened on synthetic scores alone).
