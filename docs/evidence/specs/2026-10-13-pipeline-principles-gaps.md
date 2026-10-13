# Gap table: the pipeline doctrine and the operator's rules and Fabric principles (2026-10-13)

Wave L3 of [the load-optimization plan](../plans/2026-10-13-load-optimization.md) (§ L3). This is a
read-only analysis. It changes no member. Gaps the hub owns become board rows B-182..B-184. The
gaps owned by task-pipeline, agent-sync and fabric-workspace are listed below with file, current
text and proposed text, so each owner can file them. task-pipeline #112 is in flight in another
session, so this branch edits nothing there.

## What was read, at which commit

| Source | Ref |
|---|---|
| The operator's global rules: *A wait is not a stop*, *Fabric project board*, *Release approvals / Approval by checks*, *Releases are the agent's* | the operator's global instruction file, sections dated 2026-10-11 and 2026-10-12 (operator-authored, outside the hub's managed block) |
| Fabric principles §10 and §11, `agents-first.md` *The project board*, `rules.md` §4 and §11, `lifecycle.md` LC-19, `platforms.md` PL-10 | fabric-workspace `origin/main` `1b6bc72f` |
| task-pipeline 1.93.3, the version this hub pins: `SKILL.md`, `references/waves.md`, `stages.md` (stage 7), `continuity.md`, `deploy-targets.md`, `loop-guard.md` | task-pipeline `main` `52fa75d` |
| task-pipeline PR #112 (`feat/release-iteration`), including the new `references/iteration.md` | head `ad3d089` (the round-3 fix; the coordinator calls it the round-4 read) |
| The hub's routing text for task-pipeline | `lib/routers-registry.js` `TASK_PIPELINE`, at this branch's base |
| agent-sync lease doctrine | agent-sync 1.21.7: `SKILL.md` *Claiming*, `references/branching.md`, `references/hooks.md` (`renew.sh`) |

## What #112 already closes

Measured against `main` `52fa75d`. Each item below was missing on main and is present at `ad3d089`:

- **The loop arms on a standing instruction.** `continuity.md` → *What arms the loop* adds a
  third source: "a standing instruction the host already carries", cited as
  `loop: armed by <source:line>`. On main the loop is "Default off … Ask once at preflight, or
  read `run.loop`".
- **A wait is a watcher.** `continuity.md` → *What a watcher may do unasked* puts reviews, CI,
  peer answers and release runs on a watcher, then takes the next item. The watcher may merge,
  release a lease, rebase or notify only where a standing instruction names that class of act.
  Dependent work goes on stacked branches. Polling follows the pace of the wait (1–2 minutes for a
  PR or a peer).
- **Durable waits.** `continuity.md` → *Waits outlive turns*: a launchd, systemd or `at` trigger,
  or a board row with a due time, and the wait's line goes into the handoff.
- **The compaction carve-out.** `continuity.md` → *What happens at the signal*: finish the
  current unit, write the next task into the handoff, start nothing.
- **§11 items 1–3.** `iteration.md`: the five-entry hotfix lane, the 13-step release iteration,
  and question rounds that never block, with three triggers.
- **§11 item 4, read and write.** `iteration.md` → *The learning loop*: `lessons.py`, source 7b
  at stage 0, and the store write at step 13. Stage 10 in `stages.md` names
  `lessons.py add`.
- **Releases are the agent's.** `iteration.md` → *What the operator sees*: "a recorded
  'releases are the agent's' decision is such a record for the tag and the publish its release
  run performs". `waves.md` → *What stays human* now admits "a specific standing authorization".
- **Waves and iteration agree on tagging.** A wave's stage 7 integrates to main **without
  tagging**. The full release gate runs once, at iteration step 10 (`waves.md` → *How the
  stages map*).

**Outside #112's reach on its own:** `iteration.md` → *Learning loop* writes to
`~/.sshlg-skills/lessons/`, which the family has not yet recorded in `state-json.md`. That is
board row B-181 on branch `docs/lessons-index`, not on this branch.

## The gap table

Every gap below is present on main **and** at #112 `ad3d089`, unless the row says otherwise.

| # | Rule | Where the doctrine says otherwise or is silent | Proposed fix | Owner |
|---|---|---|---|---|
| G1 | §10.5 and the operator: "a wait is not a stop … a turn ends only at a human gate, with one line per wait" | `waves.md` → *The wave loop* (`ad3d089` lines 176–182) says "the run stops only when the whole frontier is blocked". It does not separate a frontier blocked by **waits** (CI, review, a peer, a release run) from one blocked by **people**. It does not link #112's watcher section. | TP-1 below | task-pipeline |
| G2 | The same | `graph.py next` exit `4` means "what remains is blocked or parked". The work graph has no state for "waiting on a watcher". A run reading exit 4 cannot tell that only waits remain from a case that needs the operator. | TP-2: a `waiting` node state that carries `waiting_on` (kind and watcher), plus a distinct exit code | task-pipeline |
| G3 | §11.1, "no fix travels alone" | `waves.md` → *The close pass*, item 2 (`ad3d089` lines 199–201): "Every finding is fixed in the wave or parked". It does not separate a finding on the wave's own nodes from one elsewhere. That contradicts `iteration.md` → *No fix travels alone*. | TP-3 | task-pipeline |
| G4 | The operator, *Releases are the agent's*; §9, "authority is a record" | `waves.md` → *Rationalizations*, the last-but-one row (`ad3d089` line 254): "Ask for the specific go once, in the batch". `waves.md` lines 135–138 attach "without a specific standing authorization" to deploying only, not to publishing or tagging. Both send the agent to ask for a go the record already gives. | TP-4 | task-pipeline |
| G5 | The same | `SKILL.md` step 4 (`52fa75d` line 184, `ad3d089` line 187): for a `manual` gate, "**wait for the operator's explicit 'continue'/go**". It does not say a specific standing authorization is that go for the gate whose act it names. Stage 7's gate is `manual`, so step 4 contradicts `stages.md` stage 7 ("unless the operator already authorised releases"). | TP-5 | task-pipeline |
| G6 | The same | The `pipeline.schema.json` `release` block has `approval` (`checks`, `reviewers`) but no field for **who authorised the act**. The authorization lives in prose, and stage 7 cannot cite a `source:line`. | TP-6: `release.authorized_by` | task-pipeline |
| G7 | The operator, *Approval by checks*: "push the tag, watch the run, and report" | `deploy-targets.md` → *When the release waits for an approval*, the `checks` path (line 175): "Push the tag, watch the run … and report". It does not say the watch is a watcher while independent work goes on, how often it polls ("a release run every few minutes", §10.5), or what follows the published release. | TP-7 | task-pipeline |
| G8 | The operator, *Releases are the agent's*: "confirm the published package, update the local install and close the backlog row" | `deploy-targets.md` → *The verification trio*, item 1, checks the running version for a service only. Neither stage 8 nor `iteration.md` step 11 names **refreshing an install of the released artefact on this machine** (a skill, a plugin, a CLI). | TP-8 | task-pipeline |
| G9 | The operator, *Release approvals — always with the link* (`reviewers` path) | `deploy-targets.md` lines 179–187 hand over the direct link. After that, nothing puts the `waiting` run on a watcher that resumes once it is approved. The operator's notification channel is not named either, even generically, so the request goes only into the chat. | TP-9 | task-pipeline |
| G10 | The operator and `agents-first.md` → *The project board*: "a cross-project ask goes only through `com.submit` addressed to a Project … never … SendMessage" | task-pipeline has **no outbound ask path**. `iteration.md` line 134 says "Questions from peer sessions join the same queue", which covers inbound only. `templates/canvas.md` line 37 names a contract owner as "<repository or **peer session**>". No skill text tells an agent to use SendMessage (searched: none in task-pipeline, hub or agent-sync 1.21.7). The gap is that no text names the board. | TP-10 | task-pipeline |
| G11 | The same | The hub's [cross-repo-handoff.md](../../working-rules/cross-repo-handoff.md) makes a `handoff`-labelled issue or PR **the** way to carry work across a repository boundary. [handoff-layers.md](../../working-rules/handoff-layers.md) lists five layers, and none of them is the Fabric project board. | Add the board as the ask channel, wherever a Fabric hub serves the project. Keep the issue or PR as the **artifact** the board message points at, and as the fallback while the board is unreachable. The pending submission and its idempotency key are recorded in the HANDOFF and submitted once the board answers. | **hub — B-182** |
| G12 | §11.4: "a lesson seen in two projects becomes a rule in the shared doctrine" | `iteration.md` → *Promote* (`ad3d089` line 322) sends `lessons.py candidates` to the `learned.md` queue **through `retro.publish`**, which is off by default (stage 10: "Absent, the step does not exist"). Where `retro.publish` is unset, a candidate seen in two projects goes nowhere. | TP-11 | task-pipeline (#112) |
| G13 | §10.5: "a lease held half an hour after a merge blocks the next agent" | agent-sync 1.21.7 says "acquire → do the work → release", and its `merge` verb releases the lease. But `branching.md` → *What this does not do* says a PR-reviewed project "keeps doing that; `merge` is then the wrong command", so nothing says when a PR flow releases. `renew.sh` renews every held lease after **every** tool call (`references/hooks.md`). An agent that follows §10 and takes the next task while its PR waits keeps renewing the old lease for as long as it works. | AS-1 | agent-sync |
| G14 | `agents-first.md`: "These do not carry a cross-project ask: … an agent-sync mailbox" | agent-sync's `signal <DEP-ID> <state>` moves a cross-repo dependency through `filed`, `accepted` and `delivered`. Nothing says it records a state and does **not** carry the ask. | AS-2 | agent-sync |
| G15 | The operator, *Approval by checks*; `platforms.md` PL-10: the guard "replaces a person's approval … the environment has no reviewers" | fabric-workspace `rules.md` §11 (line 207) still says "**A person approves.** The `release` environment waits for a member of `release-approvers`". Two org pages contradict each other. | FW-1 | fabric-workspace |
| G16 | §11.5: "The method's home is task-pipeline's `iteration.md`" | `principles.md` line 138 links `…/blob/main/…/references/iteration.md`. That file is not on task-pipeline `main` (`52fa75d`) until #112 merges, so the link resolves to nothing today. | FW-2: none if #112 merges soon; otherwise mark the link pending #112 | fabric-workspace |
| G17 | `agents-first.md`: an unreachable board → "say so" | It names no durable place for the ask while the board is down. §10.5 requires every wait to be durable. | FW-3 | fabric-workspace |
| G18 | The operator, *Releases are the agent's* (for this hub) | The hub's own `pipeline.json` has no `release` block, so stage 7 cannot read `release.approval`. The hub's `release.yml` has no reviewer environment (only `github-pages` exists) and gates `publish` on `needs: validate`, which makes it `checks` in practice. Stage 7's check also reads "authorization is specific rather than inherited" and cites no record. | Declare `release: {enabled: true, trigger: "tag", approval: "checks"}` and cite the operator's standing release authorization (2026-10-11) in stage 7's check. Stage 8 already refreshes local installs. | **hub — B-183** |
| G19 | L3 item 3: the routing block names `waves` and, after #112, `iteration` | `TASK_PIPELINE` in `lib/routers-registry.js` names only `/task-pipeline waves`. | Already filed as **B-179** (at the pin past #112). No new row. | hub (B-179) |
| G20 | The operator, *A wait is not a stop*, as text an agent reads | The routing block carries no wait rule. | Already filed as **B-175** (an opt-in family block, written per host). No new row. | hub (B-175) |
| G21 | §11.1, "no fix travels alone" | The operator's own global rule says "Fix adjacent defects or record them in the backlog". The first half invites a fix that travels alone. That sentence is operator-authored, outside the hub's managed block, so the hub may not rewrite it. | Ask in the next operator question round: "record adjacent defects in the backlog with an id. Fix them in this change only when they sit on its own seam, or when they fall in the hotfix lane." | the operator (no repository) |

**Filing the non-hub rows** is board row **B-184**: file TP-*, AS-* and FW-* on their owners'
boards once #112 merges. Before that, TP-1..TP-11 would collide with the open PR.

## task-pipeline: exact edits (file them after #112 lands; line numbers at `ad3d089`)

**TP-1. `references/waves.md` → *The wave loop*, lines 178–182.**
Current: "A genuine ambiguity parks its node `needs-operator` and the wave goes on with the nodes
it does not block; the run stops only when the whole frontier is blocked. When the board is empty,
it says so once."
Proposed: "A genuine ambiguity parks its node `needs-operator`, and the wave goes on with the
nodes it does not block. **A node waiting on CI, a review, a peer or a release run is not
blocked: it is waiting.** Its wait goes on a watcher ([`continuity.md`](continuity.md) → *What a
watcher may do unasked*, *Waits outlive turns*), and the run takes the next runnable node, then
the next item on the board. A question round ([`iteration.md`](iteration.md) → *Question rounds*)
is called only when the frontier is blocked by **people**. The turn ends only at a human gate, with
one line per wait: what it waits on, and which watcher or trigger acts on it. When the board is
empty, the run says so once."

**TP-2. `references/work-graph.md`, `graph.schema.json`, `scripts/graph.py`.** Add
`status: waiting` with a required `waiting_on: {kind: ci|review|peer|release|time|lease, watcher:
<job id or durable trigger>}`. Under `next`, a waiting node is not runnable, and it does not count
as blocked either. Add an exit code (say `5`) for "only waiting nodes remain". A `waiting` node
without `watcher` fails `validate`. Test: a graph whose only open node is waiting exits 5, not 4.

**TP-3. `references/waves.md` → *The close pass*, item 2, lines 199–201.**
Current: "Every finding is fixed in the wave or parked with a board row and its reason; nothing
is dropped silently."
Proposed: "A finding on a node this wave closes is fixed in the wave: it is part of that node's
certification. **A finding anywhere else joins the inventory with an id and lands on a canvas
node** ([`iteration.md`](iteration.md) → *No fix travels alone*), unless it is one of the hotfix
lane's five entries. Nothing is dropped silently."

**TP-4. `references/waves.md`, lines 135–138 and line 254.**
Lines 135–138, current: "Publishing, tagging, deploying without a specific standing authorization,
sending to a person, spending money, deleting data: each waits for the operator's explicit go,
asked with a verified direct link."
Proposed: "Publishing, tagging, deploying, sending to a person, spending money, deleting data:
each waits for the operator's explicit go, asked with a verified direct link, **unless a specific
standing authorization names that act**. If one does, the run cites it as `source:line` and acts
([`continuity.md`](continuity.md) → *The limit, before the capability*)."
Line 254, current reality cell: "An outward act is never assumed. Ask for the specific go once, in
the batch". Proposed: "An outward act is never assumed. Cite the standing authorization that names
it, or ask for the specific go once, in the batch".

**TP-5. `SKILL.md` step 4, line 187.**
Current: "for `manual`, present the result and **wait for the operator's explicit
'continue'/go** — neither of the other two ever substitutes for a required manual approval."
Proposed: "for `manual`, present the result and **wait for the operator's explicit go**, or cite
the specific standing authorization that names this gate's act (`authorized by <source:line>`;
`references/continuity.md` → *The limit, before the capability*). A generic flag never
substitutes, and neither of the other two gate types does. While a manual gate waits, nodes it
does not block continue."

**TP-6. `pipeline.schema.json` → `definitions.release`.** Add
`authorized_by: string`, described as "the `source:line` of the specific standing authorization
for the tag and the publish; absent, stage 7 asks". In `stages.md` stage 7 (main line 592), after
"unless the operator already authorised releases", add "(`release.authorized_by`, cited on the
gate line)".

**TP-7. `references/deploy-targets.md`, the `checks` path, line 175.**
Current: "Push the tag, watch the run selected **by the tag you pushed**, and report what was
published, or the guard's refusal and its cause."
Proposed: "Push the tag, and **put the run selected by the tag on a watcher**, polled every few
minutes while it runs ([`continuity.md`](continuity.md) → *Waits outlive turns*). Take the next
independent item meanwhile. When the watcher sees the run end, report what was published, or the
guard's refusal and its cause. Then run stage 8 on the published artefact."

**TP-8. `references/deploy-targets.md` → *The verification trio*, item 1, line 209.** Add: "For
an artefact that is **installed** rather than served (a package, a plugin, a skill, a CLI): the
registry answers the new version, and where this machine has an install of it, that install is
refreshed through the project's own update path and its installed version is read back." Also in
`iteration.md` step 11's *Done when* cell (line 64): "… and every install of it on this machine
refreshed and read back".

**TP-9. `references/deploy-targets.md`, the `reviewers` path, after line 187.** Add: "Then put the
waiting run on a watcher. When the run is approved and finishes, it continues the release (stage
8). Where the host's instructions name a notification channel for approvals, send the same link
there too, with an event id that stays stable per (repository, tag, run), so retries do not
duplicate."

**TP-10. Outbound asks: `references/iteration.md` → *Question rounds* (after line 134) and
`templates/canvas.md` line 37.** In `iteration.md`, add: "A question whose answer belongs to another
project goes out as **one ask to that Project**. Where a Fabric hub serves the project, that is
the project board (`com.submit`, addressed to the Project, with the question id as the idempotency
key). Otherwise it is a `handoff`-labelled issue on the owning repository. Never a message to a
session. The row records the board message id or the issue URL, and the node waits on a watcher
(TP-2)." In `canvas.md` line 37, change the Owner column from "<repository or peer session>" to
"<repository, or the owning Project on the board>".

**TP-11. `references/iteration.md` → *Promote*, line 322.** Add: "With `retro.publish` unset,
stage 10 still prints `lessons.py candidates`. Each candidate becomes a board row in the project
('promote lesson L-… to shared doctrine'), so a lesson seen in two projects is never left with
nowhere to go." This is small enough to fold into #112 itself.

## agent-sync: exact edits (1.21.7)

**AS-1. `SKILL.md` → *Claiming*, and `references/branching.md` → *What this does not do*.**
Current, in `branching.md`: "A project that reviews through pull requests keeps doing that;
`merge` is then the wrong command, and `finish` is still the right one."
Proposed addition: "**In a pull-request flow, release the lease when the guarded edit is pushed to
the branch.** From then on, the PR carries the claim. If a lease must cover the merge itself, a
watcher releases it within two minutes of the merge (Fabric principle 10). Never hold it while the
session moves on to other work." Mechanism: `renew.sh` renews a lease only while the run has
touched a guarded file of that key within the last `renewIntervalSeconds × N`. A lease whose
files have gone untouched for longer ages out instead of being renewed forever. Test: a run that
acquires, pushes, then works on unrelated files for longer than the TTL no longer holds the lease.

**AS-2. `SKILL.md`, the command table row for `signal`.** Add: "`signal` records a dependency's
state. It carries no ask: where a Fabric hub serves the project, the ask goes to the board
(`com.submit`), and the DEP row cites the board message id."

## fabric-workspace: exact edits (`1b6bc72f`)

**FW-1. `knowledge/rules.md` §11, line 207.** Current: "**A person approves.** The `release`
environment waits for a member of `release-approvers` …". Proposed lead: "**Approval is per product:
`checks` or `reviewers`** (`release-signing/products.json`, `"approval"`). Under `checks`,
`release-guard` admits the release ([PL-10](platforms.md#pl-10)): the agent pushes the tag, watches
the run and reports, and sends no approval request. Under `reviewers`, a member of
`release-approvers` approves …". The existing reviewer text follows, unchanged.

**FW-2. `knowledge/principles.md` line 138.** The `iteration.md` link resolves once task-pipeline
#112 merges. If #112 is still open when this is read, append "(on task-pipeline's branch until its
release)".

**FW-3. `knowledge/agents-first.md` → *The project board*, line 78.** Current: "A board that answers
`not_available` or `board.state: unavailable` is unreachable, not empty: say so." Proposed
addition: "Keep the ask durable meanwhile. Write it, with its idempotency key, into your own HANDOFF
or board as *pending submission*, and carry its content in a `handoff`-labelled issue on the owning
repository if one is needed. Submit it, with the same key, once the board answers (principle 10,
item 5)."

## How this was checked

- Every *current* quote above was read from the named ref with `git show <ref>:<path>`, and
  `grep -n` gave the line numbers.
- `iteration.md` is absent from task-pipeline `main` (`git ls-tree -r --name-only origin/main`
  lists no `references/iteration.md`).
- No SendMessage instruction exists in task-pipeline (`git grep -n -i SendMessage origin/pr112`
  returns nothing), in the hub, or in agent-sync 1.21.7's `SKILL.md`.
- The hub's release environments come from
  `gh api repos/ssheleg/sshlg-skills/environments`, which returns `github-pages` only.
