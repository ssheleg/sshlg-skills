# Family audit 2026-09-13 — the hook key nobody read, and everything found beside it

**Status:** live plan. Every task below carries enough context to be executed by an agent
that has never seen this session. Task state lives in [`progress.json`](progress.json)
beside this file; a task leaves the queue only through a commit hash and a gate line.

**Trigger.** Claude Code 2.1.270 prints at every session start:

```
agent-sync: hooks.json: unknown key "if" in hooks.PreToolUse[1] ignored
```

**Root cause, confirmed against the binary** (`~/.local/share/claude/versions/2.1.270`,
zod schema strings): a hook matcher GROUP is `{matcher, hooks}` and nothing else (`Rt()`);
a command HANDLER is `{type, command, args, if, shell, timeout, statusMessage, once, async,
asyncRewake}` (`Td()`, plus three `@internal` keys). `if` at group level was never
evaluated — declared since agent-sync 0.1.0 (2026-07-29), ignored silently for six weeks,
and announced from 2.1.270 by the loader (`Plugin ${name}: hooks.json: unknown key … ignored`,
level `warn`). `claude plugin validate --strict` passes the defective file (measured: all
nine members `✔ Validation passed` with the key in place), and the warning does not
reproduce in `claude -p` — so **only a repository gate can catch this class before a
session start.**

## How this plan was produced (the method the operator asked to make standard)

1. **Find.** Toolkit measured (`npx sshlg-skills toolkit --for …`); every member's gate
   run locally (10/10 EXIT=0 before any change); every `hooks.json` and `settings.json`
   hook block linted against the schema above; four read-only auditors in parallel —
   three `make-skill:skill-auditor` runs over all 28 skills and 9 plugin shells, one
   doc-claims resolver over 1,104 addresses in nine members.
2. **Confirm.** Every finding re-opened at its `file:line` by the auditor that raised it;
   withdrawn ones are listed in the audit transcripts, not here. Cross-checked against
   `claude-mem` (this session's own observations, no concurrent session).
3. **Propose.** One task per defect, with the minimal fix and the check that would have
   refused it — the family rule "fix every copy in the same change" decides task
   boundaries (HK-01/02/03 are one mechanism in three repositories).
4. **Plan-audit** (the mechanic HK-20 makes doctrine): each task was checked for
   contradiction with its neighbours, given a priority derived from blast radius, and
   decomposed until a leaf is one PR in one repository with one gate line.

## Model routing for this plan

| Phase | Model / effort | Why |
|---|---|---|
| audit, design, planning, plan-audit (this document, HK-20's design) | **Fable 5.1, effort high** | the cost of a wrong plan is every task after it |
| execution of a leaf task with a complete packet | **Opus 5, effort high** (xhigh for HK-05, HK-20 build) | the packet carries the judgment; the leaf needs care, not discovery |
| a leaf whose packet turns out incomplete | stop, escalate back to planning | do not improvise context — that is the failure this plan exists to prevent |

Switch with `/model` and `/effort` in the session. A release step (tag, publish) is run by
whoever holds the PR, at either level.

## Standing rules every task inherits

- **Route:** `/task-pipeline` for anything that changes a repository; `make-skill` for
  anything that changes a skill's construction. Say the route in the PR body.
- **Coordination:** every member has `.claude/agent-sync.json`; the umbrella uses git
  leases. `python3 <agent_sync.py> acquire <TASK-ID>` before touching a guarded file, and
  release on every path. The umbrella's script is
  `skills/agent-sync/plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`; in
  `~/DATA/agent-sync` it is `plugins/agent-sync/skills/agent-sync/scripts/agent_sync.py`.
- **Release shape (members):** branch → PR → CI green → squash-merge → **annotated** tag
  `vX.Y.Z` on the merge commit → `release.yml` publishes (GitHub release + npm, registry
  serve check up to 10 min) → umbrella pin bump (three homes: `skills.json`, the
  submodule pointer, the README table — `test/validate.py` refuses a partial move) →
  umbrella release → `npx --yes sshlg-skills@latest update` on this machine → restart
  Claude Code. **Never** tag before the squash-merge lands (two tags were burned that way).
- **Dated records are not rewritten.** CHANGELOG entries, `docs/evidence/*` sections,
  audit bundles and spec files state what was true at a version. Annotate in a new entry.
- **Counts are measured, never restated:** task-pipeline's `Guards: N → M` must equal the
  workflow's count; the umbrella's DOCMAP ratchet marker is re-derived by `test/run.js`.
- **Verification is a line you can paste:** every task's acceptance names the command
  and the exact expected line. "Looks fine" is not a gate.

---

## Queue

Priority: **P0** in flight this session · **P1** blocks recurrence or is the operator's
explicit ask · **P2** a real defect with a bounded fix · **P3** hygiene and decisions.

### HK-01 · agent-sync · P0 · the group-level `if` leaves `hooks.json` — v1.20.1

**State:** implemented on branch `fix-hk-01-hooks-if` in `~/DATA/agent-sync` this session;
gate `PASS: agent-sync v1.20.1 — all checks green`; self-test plant `hooks.json key at the
wrong level` runs in `python3 test/validate.py --self-test`. Remaining: PR, CI, merge, tag,
publish.

**Why remove rather than move.** A handler-level `if` would be REAL, and a real
`Bash(git commit *)` skips `git -C <dir> commit`, `env X=1 git commit` and
`cd d && git commit` — the three forms `guard.sh`'s parser exists to cover (measured
2026-08-07: a day of commits bypassed the guard through `git -C`). The parser IS the
guard; the key filtered nothing for its whole life, so removing it changes no behaviour.

**Files touched:** `plugins/agent-sync/hooks/hooks.json` (key removed, description says
why), `hooks/guard.sh` header, `references/hooks.md` (shipped shape + a paragraph),
`README.md` hook table, `test/validate.py` (`check_hooks_manifest` key sets + plant),
`test/audit_regressions/fix-sy-07.01.py` (coverage derived from matchers + description,
asserts no `if` at either level), `docs/evidence/backlog.md` AS-09 row, CHANGELOG,
`docs/evidence/verification.md` REQ-29/REQ-30, six version homes → 1.20.1.

**Acceptance:** `npm test` → `PASS: agent-sync v1.20.1 — all checks green` and
`SELF-TEST PASS`; `npm view @ssheleg/agent-sync version` → `1.20.1`; a fresh Claude Code
session with the plugin at 1.20.1 prints no `unknown key` line.

### HK-02 · task-pipeline · P0 · the exported template stops filtering nothing — v1.86.2

**State:** PR open from `fix-hk-02-hooks-if` (this session); `npm test` EXIT=0; CI takes
~105 min (#91). Remaining: merge, tag, publish.

**Why this one MOVES the key instead of removing it.** The template's handler is
`bash scripts/check-docs.sh >&2 || exit 2` — it does not parse the command, so with the
key inert it ran on every Bash call of every project that copied the block, and a red
docs gate refused `ls`. A handler-level `if` is the intended best-effort filter here
(`references/hooks.md` already calls `if` "a good filter and a bad boundary").

**Files touched:** `templates/hooks.example.json` (handler `if`, top-level
`_filter_note`), `references/hooks.md` ×2 (source + evidence-docs mirror via
`python3 test/audit_regressions/fix-ed-01.01.py --sync`), `test/validate.py` (shape
check), `test/audit_regressions/fix-hk-02.py` (plant), CHANGELOG (`Guards: 429 → 429`),
`docs/evidence/verification.md` header + HK rows, four version homes → 1.86.2.

**Acceptance:** PR checks green; `npm view task-pipeline-skill version` → `1.86.2`;
`python3 test/audit_regressions/fix-hk-02.py` → `all green`.

### HK-03 · sshlg-skills · P0 · pins to 1.20.1 / 1.86.2, and `injectors` cites the running version — v1.48.3

**State:** `lib/injectors.js` fixed and fixtured this session (`orderVersions`,
`installedVersion`; `node test/injectors_test.js` → `PASS: injectors — 14 checks`);
verified live: `injectors` now cites `…/agent-sync/1.20.0/hooks/hooks.json`, not `1.18.6`.
Remaining: wait for HK-01 and HK-02 to publish, then move both pins (three homes each),
bump to 1.48.3, CHANGELOG, ledger row, `npm test` (re-derive the DOCMAP ratchet marker),
PR, merge, annotated tag, publish, `npx --yes sshlg-skills@latest update`, restart.

**Why `injectors` was wrong.** `readRegistry` walked `readdirSync` of the plugin cache
and took the first version directory with a readable `hooks.json`; the cache holds every
version ever installed and the listing put `1.18.6` first. Fixed by consulting
`installed_plugins.json` for the running version, then newest semver.

**Acceptance:** `python3 test/check_pins.py` → `every pin matches its release`;
`npm test` EXIT=0 with the ratchet marker matching; `npm view sshlg-skills version` →
`1.48.3`; `npx sshlg-skills injectors` names the `1.20.1` path.

### HK-20 · task-pipeline · P1 · the plan-audit gate and model routing (operator's ask)

**The ask, verbatim in substance.** After a plan is produced, run a second pass over
every task: no contradictions between tasks, each has a priority, and — the point — each
is decomposed and filled with enough context that ANY agent picks it up and executes
without error, because agents change between sessions and context loss is where work
dies. Smarter models (Fable, effort high) do the study, audit and planning; working
models (Opus, high or xhigh by project complexity) execute the plan.

**Where it lands.** Stage 4 (plan) of `plugins/task-pipeline/skills/task-pipeline/SKILL.md`
gains a gate that stage 5 cannot open without: **plan-audit**. Doctrine in a new
`references/plan-audit.md` (≤ 100 lines or with `## Contents`), a packet template in
`templates/task-packet.md`, and a check in `scripts/graph.py` (or a new
`scripts/plan_audit.py`) that reads `.task-pipeline/graph.json` and refuses to advance.

**Decomposition:**

1. **Packet contract** — every task node carries: `objective` (one sentence), `why`
   (the defect or need, with its receipt `file:line` / command output), `scope` (files
   it may touch) and `non_goals`, `steps` (ordered, each with the command or edit),
   `acceptance` (a pasteable command + the exact expected line), `gate` (the repo's test
   command), `deps` (task ids), `priority` (derived: blast radius × recurrence), `model`
   (`plan` or `execute`), `rollback` (what to revert if acceptance fails). Write it as
   `templates/task-packet.md` and as a JSON schema fragment in `pipeline.schema.json`.
2. **The contradiction pass** — a pure function over the graph: two tasks that name the
   same file with incompatible `steps`, a dep cycle, a task whose `deps` name an id that
   does not exist, two tasks with the same priority and a shared file and no ordering.
   Output is a list of pairs with the reason; empty list is the gate.
3. **The fresh-agent test** — the doctrine's one measurement: spawn a context-free
   subagent (`Task`/`Agent` tool with a clean prompt) that reads ONLY the packet and must
   restate objective, first command and acceptance line; a packet that needs the chat to
   be understood fails. Record the result on the node (`packet_verified: <date>`).
4. **Model routing doctrine** — one table in SKILL.md (stage → model/effort → why), the
   `/model` and `/effort` switch named, and the rule that a leaf whose packet is
   incomplete stops and returns to planning instead of improvising. Mirror the same
   table into the umbrella's routing block only if the operator wants it in every
   session (open question — default: SKILL.md only).
5. **Gates and evidence** — `test/validate.py` checks the template, the schema fragment
   and the SKILL.md table exist and agree; an audit regression in
   `test/audit_regressions/hk-20.py` plants a packet missing `acceptance` and a graph
   with a dep cycle and requires refusal. `Guards:` count stays measured. Update
   `references/planning.md` pointers, `docs/DOCMAP.md` single home, CHANGELOG, ledger;
   SKILL.md body is at 4691 tokens of 4750 — **the table must displace, not add**
   (move prose to the new reference).
6. **Release** as v1.87.0 (feature), then umbrella pin (HK-03's shape).

**Acceptance:** a run in a scratch repo through stages 0–4 refuses stage 5 when one task
lacks `acceptance`; passes when packets are complete; `npm test` EXIT=0; the
fresh-agent test recorded on every node of the scratch plan.

**Model:** design and the doctrine text at Fable high; the script and tests at Opus
xhigh (the graph schema is the repo's most coupled surface).

### HK-04 · make-skill · P1 · the family standard refuses a hook key Claude Code does not know

**Why.** Nine validators, one CI auditor (`scripts/audit_skill.py --house`, pinned in
every member's CI), `claude plugin validate --strict` — none saw the key. The auditor is
the one place a check covers all nine at once (the shared-mechanism rule).

**Decomposition:**

1. `references/host-capabilities.md` (currently shows the shape at :57-63 and "Narrow
   further with `if`" at :86): state the two key sets verbatim with the source (Claude
   Code 2.1.270 schema) and the failure mode (ignored silently below 2.1.270, warned
   from it, `validate --strict` passes it).
2. `scripts/audit_skill.py`: new check `HOOKS_SCHEMA` — for `hooks/hooks.json` in the
   plugin dir: every group ⊆ `{matcher, hooks}`, every handler ⊆ the handler set; GAP
   with `file:path` and the stray key. Make the same auditor skip `__pycache__` for
   `BUNDLE_NESTED` (three members hit it on a byte-compile cache the tests create).
3. `test/validate.py` plant + `test/plant_guard_test.py` case: a copy with `if` beside
   `matcher` must report the GAP; a copy with `if` on the handler must not.
4. CHANGELOG, ledger, version 0.29.0; release; umbrella pin.

**Acceptance:** `make-skill-audit ~/DATA/agent-sync/plugins/agent-sync --house` at the
pre-1.20.1 commit → `GAP HOOKS_SCHEMA …if…`; at 1.20.1 → `0 GAP`.

### HK-05 · task-pipeline · P1 · issue #91 — the workflow is 59 bytes from its ceiling

**Why now.** `validate.yml` is 511,941 of GitHub's 512,000 bytes: HK-02 could not add its
negative as a step (it went to `test/audit_regressions/` instead), and every future guard
hits the same wall. The 105-minute run is the same packaging problem (~13.7 s per step,
462 steps).

**Decomposition:**

1. Design a batch runner: one workflow step runs `python3 test/negatives.py --ci`, which
   executes every plant in parallel (it already does locally with
   `concurrent.futures`) and prints one verdict line per case in a fixed format
   `NEG <n>/<N> <PASS|FAIL> <name>`.
2. Keep the count derivable: `test/validate.py`'s `_true_neg` reads the workflow steps
   today; teach it to read the plant registry that `negatives.py --list` reads instead,
   so `Guards: N → M` still refuses a stale number. The registry becomes the single
   home; the workflow no longer duplicates the plants.
3. Migrate in two PRs: (a) the runner + registry with the workflow unchanged (count
   equal, both paths green); (b) delete the per-step blocks, keeping the property
   checks as steps. Watch the byte count and the run time on each.
4. Record the measured before/after (bytes, minutes) in the CHANGELOG; close #91 with
   the run URL.

**Acceptance:** `wc -c .github/workflows/validate.yml` well under 400,000; validate job
under 20 minutes; `python3 test/validate.py` still refuses a CHANGELOG `Guards:` number
that disagrees with the registry (plant it).

**Model:** Opus xhigh; the design step at Fable high is done — this packet is it.

### HK-06 · sheleg-design-skill · P2 · four reference files no agent can reach

**Receipt.** `LAYOUT_CRAFT.md`, `TYPE_CRAFT.md`, `KNOWLEDGE_PROVENANCE.md`,
`VISUAL_REVIEW.md` (17,001 bytes, commit `381d2f9`) are named by no shipped file except
each other; regression tests `test/audit_regressions/xd-0{1,3,5,6}.01.py` assert their
content; SKILL.md body is 4730/4750 tokens.

**Decomposition:** (1) add four load-trigger lines in SKILL.md — displace, do not add:
move an equal amount of prose into the reference it belongs to; (2) `test/validate.py`
reachability gate: every shipped `.md` under the skill is named from SKILL.md or from a
file SKILL.md names (transitively), watched failing on the current tree first;
(3) re-run the trigger evals for the new bare `redesign`/`редизайн` phrase (see HK-09);
(4) v1.61.0, pin.

**Acceptance:** the new check refuses the pre-change tree and passes after; body ≤ 4750
by `make-skill-audit … --house`.

### HK-07 · super-ux · P2 · `vision` points its contract at a sibling skill

**Receipt.** `plugins/super-ux/skills/vision/SKILL.md:71` names
`ux-scenarios/references/scenario-format.md`; `vision/references/` holds only
`system-map.md`. On `npx skills add ssheleg/super-ux --skill vision` the contract is
dangling. Rule: contracts live inside the skill dir.

**Decomposition:** write the link as `[scenario-format.md](references/scenario-format.md)`;
run `python3 test/sync_references.py` (its `SKILL_LINK_RE` copies the file into
`vision/references/`); add the case to the sync test; v0.56.1; pin.

**Acceptance:** `ls plugins/super-ux/skills/vision/references/scenario-format.md` exists;
`npm test` EXIT=0.

### HK-08 · sheleg-dev (+ agent-stack) · P2 · the money gate's degradation, and a trigger that matches two packs

**Receipts.** (a) `hooks/hooks.json:4-26` ships a PreToolUse gate refusing refunds,
payouts, disputes and live keys; `stripe-billing/SKILL.md` never mentions it and
`crypto-payments/SKILL.md:296-301` defers to the README — no `## Degradation` section,
against `host-capabilities.md:222-236` (three axes in the body). Template exists at
`error-tracking/SKILL.md:258-270`. (b) `stripe-billing/SKILL.md:16` advertises bare
`биллинг`; `agent-stack/…/agent-orchestrator/SKILL.md:13` advertises `биллинг LLM`; the
umbrella lists both (`sshlg-skills/lib/triggers.js:402,452`).

**Decomposition:** (1) `## Degradation` in both bodies from the template (both are at
4279/4384 tokens — room exists); (2) decide the trigger: narrow stripe-billing to
`биллинг подписок` OR declare the pair shared-by-design in the umbrella's
`triggers.js` with a reason — one PR each side, the umbrella's `route_coverage.js`
watched on the change; (3) v0.12.1 sheleg-dev; pin.

**Acceptance:** `make-skill-audit … --house` 0 GAP on both skills; umbrella
`node test/route_coverage.js` reports the probe «биллинг LLM» routing to agent-stack only.

### HK-09 · five repos · P2 · evals that describe a description that no longer exists

**Receipts.** `test/evals/RESULTS.md` rows dated 2026-08-31 at copywriting 0.52.2 /
make-skill 0.25.2 / sheleg-design 1.58.2, while the descriptions since gained
`"error text" / "текст ошибки"`, `"skill audit" / «аудит скилов»`, `"redesign" /
«редизайн, свёрстай, вёрстка»`; sheleg-dev / agent-stack / telegram-dev evals at 0.11.1 /
0.17.1 / 0.1.10; task-pipeline's three scenario rows say "not run"; evidence-docs and
project-audit have no eval set at all (only `"skill": "task-pipeline"` in
`test/evals/*.json`), and `аудит проекта` textually matches both task-pipeline and
project-audit.

**Decomposition (one PR per repo, same method as agent-sync's
`test/evals/RESULTS.md` 2026-08-31 — fresh context-free subagents, two models, 3 runs per
contested cell):** (1) re-run the trigger sets where the description moved and add
dated rows; (2) task-pipeline: execute the three scenarios in a scratch repo;
(3) task-pipeline: `test/evals/<skill>/` for evidence-docs and project-audit with
near-miss negatives that pit project-audit against bare `аудит`; add "what is true of
the whole project (project-audit)" to task-pipeline's Not-for (67 chars of headroom);
(4) patch releases; pins.

**Acceptance:** every `RESULTS.md` row is dated at or after the description's last
change (`git log -1 --format=%cd -- <SKILL.md>`); no probe routes to two family skills.

### HK-10 · sshlg-skills (+ agent-sync) · P3 · 171 expired leases nobody holds

**Receipt.** `agent_sync.py residue` in the umbrella: 10 local locks and **161 refs**
`refs/agent-sync/leases/*` on `origin`, all from dead runs `r-883021cf7` / `r-2d51807cd`
on this host, expired 4+ days against a 2700 s TTL (payload example: run `r-2d51807cd`,
ts `2026-09-09T09:02:23Z`). `~/DATA/agent-sync` holds 2 more (`ASY-W2`,
`fix-own-lease`, 12–14 days). The classifier is right to refuse them (`foreign` /
`ambiguous`); only a named operator decision clears them.

**Decomposition:** `git ls-remote origin 'refs/agent-sync/leases/*' | awk '{print $2}' |
sed 's#refs/agent-sync/leases/##'` → the key list; `python3 <agent_sync.py> reap
--i-own-this <keys…>` in each repo (it refuses a live lease and prints every payload it
destroys); re-run `residue` → `no lease refs on origin — swept and empty`. Record the
count in the umbrella ledger the way AW-9 did (16 reaped on 2026-09-06). Then the real
fix: a task in agent-sync — `finish`/`session-end.sh` must reap the run's own expired
refs on the git plane, since a dead run leaves its refs forever (AS-01a fixed reporting,
not the leak).

**Acceptance:** `agent_sync.py status` → `expired locks : none` in both repos; a new
agent-sync backlog row names the leak with this receipt.

### HK-11 · six repos · P3 · low hygiene, one PR per repo

Batch per repository; each item carries its receipt from the auditors.

- **agent-sync:** `claude plugin validate --strict` as its own CI job (`validate.yml:72-73`
  sits inside `validate`; task-pipeline's `plugin-conformance` job is the shape).
- **task-pipeline:** link `scripts/graph.py` and `scripts/execution_authority.py` from
  SKILL.md `## References` (reachable only through `references/work-graph.md` today).
- **sheleg-dev:** `## Degradation` is HK-08; here: `compatibility:` front matter for
  ad-tracking and stripe-billing (they run node fixtures), `plugin.json` homepage to
  `skills.sshlg.me` (matches package.json), `chmod +x hooks/money-gate.js`, README
  "what loads on demand" table (1 of 26 references named) and both invocation forms.
- **agent-stack:** `compatibility:` for agent-harness (`scripts/audit_agent.py`),
  reword `test/validate.py` mentions in agent-harness:122 and agent-interop:44 to "the
  repository's validator" (the file does not ship), homepage, README references (19/27)
  and invocation forms; align `test/validate.py`'s token estimator with the auditor's
  tiktoken count (it reports agent-evals 4961 / agent-orchestrator 4762 against the
  auditor's 4374 / 4309).
- **telegram-dev:** README invocation forms.
- **seo-aeo-audit:** estimator disagreement (~4998 vs 4685) — same fix as agent-stack;
  the six bare `scripts/*.py` mentions in root documents resolve only under
  `SKILL_DIR` (README:263-280, DOCMAP:22-43) — prefix them.
- **super-ux:** one shelf sentence per skill naming the transitive-closure references
  with a load trigger (ux-audit 13 unnamed, ux-scenarios 8, ux-foundation 6,
  brand-voice 4, ux-flows 3, copywriting 2).

**Acceptance per repo:** `make-skill-audit <every skill> --house` 0 GAP; `npm test`
EXIT=0; patch release; pin.

### HK-12 · sshlg-skills · P3 · four flags in the debt plan say "open" about closed work

**Receipt.** `docs/evidence/audits/2026-09-10-debts/progress.json` flags:
`HOUSE-GAPS-FROM-SHERLOCK-20260910` open while HOUSE-01..07 are done;
`TP-186-TAGGED-BUT-NOT-RELEASED-20260910` open while v1.86.1 shipped;
`PIN-DRY-RUN-FOUND-TWO-DEBTS-20260910` open while both patch releases landed.

**Decomposition:** set each to `resolved` with the commit or tag that closed it; leave
`CODEX-CHANNEL-CARRIES-NO-FAMILY-SKILLS` as `open-for-the-operator` (HK-13). Same PR as
HK-03 is fine.

### HK-13 · operator decisions · P3 · reported, not changed

Each of these is a choice, not a defect; the plan records the receipt so the choice is
made once.

1. **Plugin cache history** — `~/.claude/plugins/cache/` keeps every installed version:
   task-pipeline 15 dirs / 19 MB, super-ux 11 / 29 MB, chrome-devtools-mcp 1.6 GB,
   `temp_git_1789048689598_uo31za` 21 dirs, `thedotmack/_claude-mem-13.24.0.broken.bak`
   481 MB. Claude Code owns the directory; the family's `update` does not prune it.
   Decide: leave, or a documented `find … -mtime` sweep in `~/CLAUDE.md`.
2. **`~/DATA/skills`** — 176 symlinks into the hub, created 2026-08-27, described
   nowhere. Decide: document as a channel, or remove.
3. **Codex channel** — `~/.codex/skills` holds none of the family's 29 (routing block
   present in `~/.codex/AGENTS.md`). Decide: `node bin/sshlg-skills.js install --agent
   codex`, or record the omission as deliberate in `skills.json`.
4. **The hub triage** — B-143, 340 skills from bulk pack installs awaiting marking
   (`npx sshlg-skills conflicts` lists 38 on router ground).

---

## What was measured and found clean (so nobody re-audits it next week)

| Surface | Result | How |
|---|---|---|
| ten gates | 10/10 EXIT=0 before any change | `npm test` in each repo, parallel |
| pins vs registry | every pin matches its release | `python3 test/check_pins.py`, `npm view` ×9 |
| plugin manifests | 9/9 `✔ Validation passed` | `claude plugin validate --strict` |
| hook key schema | 1 of 6 family `hooks.json` defective (agent-sync); `settings.json` 19 groups clean | linter against the 2.1.270 key sets |
| shadows / broken links | 0 / 0 across 7 channels | the CLAUDE.md checks |
| routers | unchanged in all four operator files | `npx sshlg-skills routers` |
| doc claims | 1,104 addresses in nine members, 0 dead | `test/doc_refs.py` driver |
| CHANGELOG head = package.json | 9/9 | doc-claims agent |
| open issues / PRs | 1 issue (task-pipeline #91), 0 PRs before this session | `gh` |
| Claude Code | 2.1.270, MCP `codebase-memory` failed to connect (not family) | session banner |
