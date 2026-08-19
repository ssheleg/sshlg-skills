# Manifesto conformance — the program backlog

> **What this is.** The single home for the **state of one cross-repository program**: bringing the
> ssheleg family into conformance with the Proof of Done manifesto
> (`~/DATA/pod-manifesto/manifesto.md`), after the 2026-08-18 audit that scored all nine members
> against 61 extracted requirements.
>
> **What this is NOT.** It is not a second copy of any member's debt. A row here that belongs to a
> member is *also* filed in that member's own `docs/evidence/backlog.md`, and **that file stays the
> single home for the member's debt**; this file is the single home for *program* state — which task,
> which agent, which wave, what closed it. Cross-referenced by id. Two homes for one fact is the
> defect M-44 names; two homes for two different facts is a propagation matrix.
>
> **Write discipline.** Only the orchestrating session writes this file. Task agents return a typed
> verdict and never edit it. That is deliberate: the audit's G4 found that no member implements the
> checker the manifesto requires before a convergence (M-25), and the family's lease is per-task-id
> rather than per-file (agent-sync audit, M-24), so 30 agents appending to one ledger is the exact
> collision the audit flagged. The orchestrator is the checker.
>
> **Source of every row.** `scratchpad/REPORT.md` (consolidated) and `scratchpad/audit-<member>.md`
> (nine per-member reports, each with `path:line` evidence). Audit date 2026-08-18.

## How to read a row

| column | meaning |
|---|---|
| `id` | program id. Prefix = owning repository. |
| `M` | the manifesto requirement it closes (M-01…M-61 from the extracted set) |
| `evidence` | where the defect was measured, `path:line`, relative to the owning repo |
| `done when` | the acceptance criterion — a command, a refused plant, or a resolved reference |
| `wave` | execution order. Rows in one repo never run concurrently; different repos do. |
| `state` | `open` · `claimed` · `landed` · `verified` · `deferred` · `dropped` |

`landed` means the change is committed. `verified` means an independent check observed it —
these are different states and the program does not collapse them (M-10).

---

## Wave 1 — the two claims that are false right now

Ordered first because they are the only rows where the family is currently **asserting something
untrue** to an outside reader.

| id | M | title | evidence | done when | state |
|---|---|---|---|---|---|
| SD-01 ✅ | M-44 M-07 | **VERIFIED 2026-08-19** at `sheleg-dev@e401603` — 8 dead references where the audit sampled 6, 11 closed repo-wide; see the closes ledger. `sheleg-dev/SECURITY.md` is a wholesale copy from `seo-aeo-audit` — five paths that do not exist, shipped in the published npm tarball, including a "verify for yourself" command that cannot run | `SECURITY.md:10,11,17,35,54,56`; `package.json:17` | every path in `SECURITY.md` resolves (`test -e`), the verify command runs, and the B-47 path guard at `test/validate.py:255-307` is widened beyond CONTRIBUTING with its own planted defect | **verified** |
| UM-03 | M-07 | two of the umbrella's own references do not resolve — a manifesto about resolvable addresses shipping unresolvable ones | `README.md:66` (`npm run test:negatives` → exit 1, "Missing script"); `docs/evidence/convergence.md:10` (`scripts/check-convergence.sh` absent) | both citations name a target that exists; `npm run` shows the script or the claim points at the 20 CI plants / the member's real `templates/convergence.sh` | open |

## Wave 2 — close the last manifesto gap, then make the manifesto true

`TP-01` runs **before** `PM-01`: the manifesto's paragraph should describe the state after this
program, not during it. If B-080 closes, `:445` becomes a stronger paragraph — all four requirements
built, with commits — instead of a corrected one.

| id | M | title | evidence | done when | state |
|---|---|---|---|---|---|
| TP-01 | M-22 | **B-080, the one manifesto gap still open** — a node cannot say how it will be closed, while `agents/verifier.md:61` orders an agent to "run the checks the task named". Node props measured `blocked_by,evidence,id,owner,parked_reason,serves,status,title,touches` — no `check` | `docs/evidence/backlog.md:15`; `graph.schema.json`; `agents/verifier.md:61` | `check` exists on the node schema, is required for a node the verifier closes, `graph.py validate` exits 1 without it, and a planted defect is refused in `negatives.py` | open |
| PM-01 | M-08 M-43 | `manifesto:445` asserts in the present tense that four rows are open. Three closed 2026-08-17 (B-076 schema `auto·judgment·manual` + required `judge`; B-077 via B-085 `violations()` refuses unresolvable `serves`; B-081 `Observed at` + four invalidators). The permalinks still resolve and still read `open` — the receipt confirms a belief a day out of date. **Widened 2026-08-19: the claim lives in five surfaces, not one** — `manifesto.md:445`, `index.html:653` (prose), `index.html:721-722` (footnotes N4 and N5), `llms.txt:51`, and umbrella `README.md:71` (that last one is UM-06) | `manifesto.md:445`; `index.html:653,721,722`; `llms.txt:51`; task-pipeline `docs/evidence/backlog.md:15,16,41,42` at HEAD `62d7afc` | all four pod-manifesto surfaces state what is true at a named commit and date, link each close, and name whatever remains; `tools/check-parity.py` exits 0 — verified by re-reading the four rows, not by trusting this row | open |
| PM-04 | M-43 | **New row, found 2026-08-19 while baselining the mirror.** `tools/check-links.py` proves every citation **resolves** — 24 references checked, 0 unresolved, run with a token so the check measures the reference and not the rate limit. It cannot detect that a resolved citation has gone **stale**: the four backlog permalinks resolve perfectly and now describe a state three of whose four rows no longer hold. Resolution and currency are different properties, and the repository checks only the first — which is how the defect in PM-01 survived a green CI | `tools/check-links.py`; the four permalinks at `manifesto.md:445` | a currency check exists: for every citation whose claim this document characterises, the cited row's present state is fetched and compared against what the prose asserts, and a divergence fails. Planted defect required — the check must have been watched failing | open |
| UM-06 | M-08 M-43 | the same stale claim mirrored in the umbrella README | `README.md:71` | agrees with `manifesto:445` after PM-01, and cites the same commits | open |
| PM-02 | M-40 | E2's anchor `audit.md#L44-L64` includes the pass-7 row `\| 7 \| 19 \| 4 \|`, which reverses the decay the paragraph teaches — a reader following the receipt lands on the anomaly. task-pipeline's B-082 is open about exactly this | `manifesto.md:354`; task-pipeline `references/audit.md:44-64` | the citation lands only on what it claims, or the prose accounts for pass 7; B-082 closed in the same change | open |
| TP-02 | M-40 | `residue.md` says the inventory was queried "one minute later" beside a 3:12-old process, so the two lines cannot describe one instant — the source of the manifesto's opening story | `references/residue.md:28-48` | the record states both observation times so the pair is readable as one event | open |

## Wave 3 — the highest-leverage mechanism in the family

| id | M | title | evidence | done when | state |
|---|---|---|---|---|---|
| SU-01 | M-17 | **Nothing refuses a requirement with no observable.** `ux_lint.py` never opens a scenario or story body — no rule reads `Expected result`, `Acceptance criteria` or `Success metric`. The dogfood: 15 own scenarios `Status: implemented`, **0 carry `Coverage:`**, no test touches `bin/super-ux.js`, `npm test` exits 0. The skill that demands the chain before code cannot tell that its own chain closes on nothing | `plugins/super-ux/scripts/ux_lint.py:269-350,92-102`; `docs/ux/scenarios.md:13-27` | a `U06x` rule family refuses a scenario or story with no observable; the pack's own 15 scenarios either carry one or are marked honestly; a planted defect is refused | open |
| SU-02 | M-21 | a shipped scenario silently counts as validated; `unobserved` appears nowhere; audit PASS flips `validated → implemented` | `plugins/super-ux/skills/ux-audit/SKILL.md:211-212` | a `Product:` state `unobserved \| observed \| contradicted` exists, with no floor and no target — a hypothesis may stay unobserved forever without failing a gate | open |
| SU-03 | M-44 | `facts.md` has no duplicate-key check and its `Value` column is carried, not computed — states 3500 validator checks, measured 3506 | `plugins/super-ux/scripts/brand_lint.py:820-887`; `docs/brand/facts.md:36` | a B033 duplicate-key rule exists and each numeric fact row runs its own command | open |

## Wave 4 — adoption of mechanisms the family already owns

Every row here is copying something that is already written and tested one directory away. These are
propagation failures, not design failures (audit G2, G6).

| id | M | title | evidence | done when | state |
|---|---|---|---|---|---|
| UM-02 | M-31 | the `judgment` gate type ships in the pinned schema and is unused — `pipeline.json` stage 2 types "The design is approved" as an `auto` gate, the exact defect task-pipeline's B-076 closed, still live one layer up | `pipeline.json:38-40`; task-pipeline `pipeline.schema.json:208,230` | stages 2/3/9 are typed `judgment` with a named `judge`; `validate.py:159` already runs the schema, so no new code | open |
| UM-05 | M-43 | proof never expires here: 129 ledger rows, 123 marked `verified`, `grep -c 'Observed at\|invalidat'` → 0. task-pipeline shipped invalidation on 2026-08-17 and the umbrella never adopted it | `docs/evidence/verification.md`; task-pipeline `templates/verification.md` | the ledger carries `Observed at` and the four invalidators, and a stale row is reported rather than read as current | open |
| UM-04 | M-44 | both ratchets below truth — `DOCMAP.md:140` says 32 suites / 562 fixtures against counted 34 / 585; `verification.md:11` says 119/113 against its own command's 129/123 | `docs/DOCMAP.md:140`; `docs/evidence/verification.md:11` | the figures are recomputed by `validate.py` and a stale stated figure fails, as it already does for board priority at `:1395` | open |
| UM-01 | M-49 | **a closed run's ledger permanently silences the route gate.** `.task-pipeline/run.md:117` records `stage: 10 acceptance — verdict pass — 2026-08-14`; the file is still present and still being appended to (65 ledger lines, `event:` rows written during the 2026-08-18 audit), while `hooks/pre-tool-use.js:61` derives `runOpen` from `fs.existsSync` and `lib/routegate.js:53` returns null when open | `.task-pipeline/run.md`; `hooks/pre-tool-use.js:61`; `lib/routegate.js:53` | `runOpen` is derived from ledger **content**, or stage 10 archives `run.md`; the route gate demonstrably fires again after a closed run | open |
| AS-01 | M-49 | **17 lease files exist across the family and all 17 are expired**, oldest 2026-08-16T00:23:27Z. `agent_sync.py status` prints `leases held: none` / `other runs: none holding anything` beside three expired locks in the directory it just read. The reaping logic exists at `agent_sync.py:1344-1350` and nothing calls it for reporting | measured 2026-08-19 across `*/.agent-sync/leases/*.lock`; `agent_sync.py:1344-1350,2542,3168-3174` | `status` and `finish` enumerate expired locks as residue; own spent state may be reaped, foreign or ambiguous state is reported and left alone (M-50); the 17 present locks are resolved under that rule | open |
| MS-01 | M-49 | 49 leftover repo copytrees and 55 `planted` directories under `/var/folders/…/T/` from the parity test | `test/checker_parity_test.py:60,160-166` | the test uses `TemporaryDirectory()` and prints what it left behind | open |
| SE-01 | M-40 | **the client report cannot separate `pass` from `never looked`** — the instruments can and the deliverable cannot. `url_inspection.py:236-250` grants CONFIRMED only to the N of M URLs the index answered; the report offers a free-text "Not checked" table and a `Status` column with no vocabulary, which no check reads | `templates/audit-report.template.md:47-65` vs `scripts/url_inspection.py:236-250` | the coverage table has a closed vocabulary (`observed / partial / unlooked / blocked-by <gate>`), seeded by `preflight.py --format json`; a track that returned nothing cannot render as one that came back clean | open |
| SE-02 | M-32 | no output carries provenance — no script emits `observed_at`, a tool version or a run id | `scripts/*.py` (grep for `__version__\|observed_at\|timestamp` → none) | every JSON payload carries `producer{skill_version, script, observed_at, args}` and both report skeletons carry the block | open |
| SE-03 | M-43 M-44 | a proof marked `observed` expired unnoticed: `SECURITY.md` asserts "22 lines… six `open()`", measured today 26 / 7 / 7, and `agent_surface.py` is missing from the I/O table | `SECURITY.md:5,10,20,85,88`; `docs/evidence/verification.md:51` | the grep counts are a validator guard rather than prose, and the ledger row carries `invalidated_by` | open |
| SG-03 | M-44 | two stale facts inside the document that owns single homes — `DOCMAP.md:91` says "a fourteen-kit build matrix" against 29, and `:97-99` says coordination is "ungated" while `.claude/agent-sync.json` guards 9 files | `docs/DOCMAP.md:91,97-99`; the counted-claims regex at `test/validate.py:836-843` misses hyphenated compounds | `COUNTED` matches the hyphenated form, the two facts agree with the count, and the shared-state section is generated | open |
| TP-03 | M-44 | four shipped surfaces say "34 reference files" against a directory of 35, and the validator's own claim registry printed `reference files: dormant (truth 35)` without firing — its pattern only matches the phrasing "N files under `references/`" | `SKILL/scripts/graph.py:873`; `templates/run.md:23,39`; `test/validate.py:533,3202` | the claim registry matches any phrasing of a counted claim, and the five stale numbers found family-wide are re-run through it | open |

## Wave 5 — the money boundary

Held together in one wave because they are one boundary, and because the manifesto's own test at
`:200` — "a credential that cannot reach production is stronger than a sentence saying not to use it
there" — fails literally here. sheleg-dev scored FULL 3 / ABSENT 15, the worst on both counts in the
family, and all three FULL rows are the artifact layer rather than the money layer.

| id | M | title | evidence | done when | state |
|---|---|---|---|---|---|
| SD-02 | M-06 | `crypto-payments` has **no test/live credential boundary** — one `HELEKET_API_KEY` that is also the signing secret, and "test mode" is a merchant-account toggle, so a dev run holds the production credential and the skill never says so | `references/heleket-provider.md:126,1153` | `HELEKET_ENV` plus a boot assertion that key and env agree — the shape `stripe-billing/references/price-integrity.md:62-64` already prescribes — and a separate sandbox merchant account is required | open |
| SD-03 | M-30 | all four MANUAL-gate categories (money, production access, publication, destructive) are named in prose and stop nothing; the plugin ships no hooks, no permission list, no gate | `crypto-payments/SKILL.md:309-310`; `stripe-billing/references/webhook-events.md:169-170` | a `PreToolUse` hook refuses `sk_live_`, `rk_live_`, `--live`, `create_refund`, `payouts`; the refusal names its remedy; the hook fails silent rather than breaking a turn | open |
| SD-04 | M-40 | the money invariants ship as prose and delegate enforcement to the reader ("delete each guard and re-run") — the webhook-is-the-payment rule, the duplicate `event_id` rule, the cumulative-refund rule | `stripe-billing/references/testing-and-local-dev.md:157-172`; `ad-tracking/SKILL.md:264-296` | `fixtures/` ship a proration `invoice.paid`, a duplicate `evt_`, a two-step cumulative refund and an out-of-order pair, with a copy-in assertion pack | open |

## Wave 6 — doctrine reconciliation

agent-stack is doctrine *about* building agent systems, and it is the member that disagrees with the
manifesto most directly. These are text changes with no mechanism behind them, which is why they are
last — and why each must land in the same change as whatever check can hold it.

| id | M | title | evidence | done when | state |
|---|---|---|---|---|---|
| AG-01 ✅ | M-25 | **VERIFIED 2026-08-19** at `agent-stack@2b3d45e` — see the closes ledger. **the checker asks for confidence where the manifesto asks for evidence.** `manifesto:186` requires *arrived / matches contract / **carries its evidence** / does not contradict a sibling*; `graph-engineering.md:154-161` substitutes "under-confident — a confidence signal below the bar". In a family whose first value is Evidence over confidence, and whose own text says "an uncalibrated judge is an opinion with a number attached", the gate guarding every convergence never asks what a branch can show | `references/graph-engineering.md:154-161`; `agent-evals/SKILL.md:172-178` | "carries its evidence" is the sixth checker item; the confidence signal stays optional | **verified** |
| AG-02 | M-22 | **the node contract lost two fields** — `manifesto:156` names one input, one job, one output, **one owner**, **its own completion test**; `graph-engineering.md:52` names three. Both give the same justification in nearly the same words, which makes the omission conspicuous — and the two dropped fields are exactly B-080 | `references/graph-engineering.md:52-55` (grep for `owner`/`completion test` → exit 1) | both rows exist in §1, consistent with whatever TP-01 lands | open |
| AG-03 | M-17 M-19 | **agent-evals instructs the opposite of the manifesto.** `manifesto:122`: building the evidence graph after the code "lets the output decide what counts as success". `agent-evals/SKILL.md:203`: "**Never author the suite up front.**" Opposite imperatives, both stated as rules; agent-evals has no requirement or observable concept, so the reconciling clause is not there to find | `agent-evals/SKILL.md:22-23,203`; `agent-orchestrator/SKILL.md:368` | the two tiers are named — the observable is decided before implementation, the production-grown corpus is the regression tier on top | open |
| AG-04 | M-57 | `audit.md:20-25` refuses a score ("a prioritized plan, not a score") and `:112-121` computes `P = blast × confidence / effort` over three axes; irreversibility and coordination are absent, against `manifesto:422` | `references/audit.md:20-25,112-121` | the four axes are published beside the number, or the division is dropped | open |
| SE-04 | M-57 | the same defect in the other member that ranks by a composed score: `priority = (impact × confidence) / effort`, irreversibility only in a template, coordination absent | `SKILL.md:229-238`; `templates/action-plan.template.md:40-43` | as AG-04 | open |
| SG-02 | M-17 | "degrade to calm" has no observable — `sloplint.py:208` asserts only that the string `prefers-reduced-motion` appears in a doctrine file, while 2 of 29 token layers ship no reduced-motion branch, including the pack that mandates a particle field | `test/sloplint.py:208`; `tokens/instrument-console.css`; `tokens/editorial-luxury.css`; B-040 at `docs/evidence/backlog.md:56` | a token layer declaring `--dur-*`/`--ease-*` owes a reduce block, with a planted defect | open |
| SG-04 | M-52 M-55 | the retrospective register stopped — last run stamp is v1.26.0 / 2026-08-13 against CHANGELOG 1.43.0, so 26 releases are unstamped and the "not fired in five run stamps" retirement trigger is uncomputable | `docs/evidence/retro.md:531`; `CHANGELOG.md:7` | the stamp table is derived from git log + tags at close-out, and a release whose tag has no stamp fails | open |

## Deferred — named, owned, and not silently dropped

These were found by the audit and are **not** in this program. Each is real; each is larger than a
row, and taking them on would turn a conformance pass into a redesign. Recorded here so that "we
covered the audit" cannot be read as "we covered everything" (M-42: `deferred` needs an owner and a
destination).

| id | M | title | why deferred | destination |
|---|---|---|---|---|
| AS-03 | M-05 M-24 | the `local` lease double-wins across machines silently — two checkouts both printed `won TASK-9`, both guards exit 0, both `status` said `other runs: none`; and one lease unlocks every guarded file, so `alice`(TASK-A) and `bob`(TASK-B) both passed `guard DECISIONS.md` | a key→path mapping changes the lease contract, and `git` backend already solves the cross-machine half; this is a design decision about what a lease means, not a defect fix | agent-sync backlog, with the `git`-backend default as the cheaper alternative |
| UM-07 | M-25 | no convergence checker anywhere in the family: `verification.md:60-63` states "no run has yet been stopped by one" while 12 subagent fan-outs are logged. **This program's own orchestration is the interim answer** — the orchestrator is the single writer and the checker | needs a planted contradiction in CI to be more than a habit, which is a mechanism of its own | umbrella backlog, M-25 |
| TP-04 | M-04 M-27 | nothing the run observed survives it — `.gitignore:3` excludes `.task-pipeline/`, which holds the graph *and* the ledger lines carrying the hook-written `gate:` rows, the pack's only independent evidence path | B-088 covers the graph half only; committing the ledger changes what a run publishes | task-pipeline B-088, widened |
| TP-05 | M-58 | no acceptance policy — no owner, no version stamped on any acceptance, and two rules contradict each other | the policy is a family-level artifact, not a task-pipeline one; writing it inside one member would create the second home this file exists to prevent | a family policy document, owner named, then stamped by every member |
| SG-01 | M-44 | the Figma seam has no mechanical divergence check — `FIGMA_BRIDGE.md:57-61` says a mismatch "is greppable" and nothing greps it | needs DTCG token emission from CSS first; B-031 already names the blocker | sheleg-design B-031 |
| MS-02 | M-26 | 83 of 135 validator rules have never been watched failing, and `npm test` runs zero plants — they live as YAML steps in CI | a coverage gate over an instrumented `fail()` with a checked-in baseline is a mechanism worth designing once for the whole family | make-skill backlog; candidate for family-wide adoption |
| ALL-46 | M-46 | the seam walk is the family's weakest practice (3/18) — 8 of 9 members audit horizontally, and the manifesto's own §6 evidence says the vertical axis is what finds absence | adding a vertical pass to N audit skills is its own program | each member's audit reference |

---

## Program state

| wave | rows | open | landed | verified |
|---|---|---|---|---|
| 1 | 2 | 2 | 0 | 0 |
| 2 | 6 | 6 | 0 | 0 |
| 3 | 3 | 3 | 0 | 0 |
| 4 | 11 | 11 | 0 | 0 |
| 5 | 3 | 3 | 0 | 0 |
| 6 | 7 | 7 | 0 | 0 |
| **active total** | **32** | **32** | **0** | **0** |
| deferred | 7 | — | — | — |

Counted, not restated — the command, so the figure can be recomputed rather than trusted:

```bash
awk '/^## Wave/{w=$3} /^## Deferred/{exit} /^\| [A-Z]{2}-[0-9]/{c[w]++; t++} \
  END{for (k in c) print "wave "k": "c[k]; print "active: "t}' \
  docs/evidence/manifesto-conformance.md | sort
```

Ran 2026-08-19 → `wave 1: 2 · wave 2: 6 · wave 3: 3 · wave 4: 11 · wave 5: 3 · wave 6: 7 ·
active: 32`. Wave 2 grew by one when PM-01's blast radius turned out to be five surfaces rather
than one, which produced PM-04.

## The closes ledger

One row per close. `landed` is the producer's commit; `verified` names what the **orchestrator**
observed independently, because the manifesto's M-41 says the producer of a claim should not be its
only judge. A row reaches `verified` only after a check run by this session, not by the agent that
wrote the code — and where the row shipped a guard, the orchestrator plants its own defect and
watches the guard refuse it.

| row | landed | verified by the orchestrator | observed at |
|---|---|---|---|
| SD-01 | `sheleg-dev@e401603` — `SECURITY.md` rewritten against measured facts about this pack; the B-47 path guard widened from one CONTRIBUTING table to every path, inline and inside fenced blocks, across the four documents whose subject is this repository, now also resolving `path:line` citations | `test/validate.py` **re-run by this session** → exit 0, `13 checks, 6 skill(s)` (was 12 checks). My own independent path sweep of `SECURITY.md`: 18 path tokens extracted and resolved, **0 dead**. **Own planted defect:** appended a line naming `scripts/does_not_exist.py` → validator exit **1**, `SECURITY.md:161 names 'scripts/does_not_exist.py', which this repository has nowhere (B-79)` — and the refusal names its remedy, which is this family's own standard for a guard. Tree clean before and after | 2026-08-19, `sheleg-dev@e401603` |
| AG-01 | `agent-stack@2b3d45e` — six-item checker contract, `unevidenced` as item 3, `missing` as an arrival count, `under-confident` demoted to a non-gating hint; both files declare the list machine-readably and `test/validate.py` compares them | `npm test` exit 0 and `test/validate.py` exit 0 **re-run by this session**; contract declarations counted in both files — `graph-engineering.md:157` and `agent-evals/SKILL.md:172` agree on six mandatory + one optional; the home's numbered list counted as 6 items. **Own planted defect:** dropped `unevidenced` from the eval-side declaration → validator exit **1**, "declare different checker contracts … a reader cannot tell which"; tree clean after revert (`git status --porcelain` → 0 before and after) | 2026-08-19, `agent-stack@2b3d45e` |

**Carried forward from AG-01, not silently absorbed** — the producer's own `NOT VERIFIED`, which this
program keeps rather than discards: nothing ran in GitHub CI (the three new plants were extracted
from `validate.yml` and run locally); the arrival count assumes a known fan-out and a layer that
grows its own branches has no such number; the mirror check compares declarations rather than
meaning, so two files could name the same six keys and describe them differently; `agent-evals`'
product hypothesis stays `unobserved` — no real graph has yet been gated on the evidence item.
`agent-orchestrator/SKILL.md` was deliberately left untouched at 4728 tokens against its own 4750
budget, because a summary there would have been a third home.

## What closes this program

1. Every active row `verified`, or moved to `deferred` with an owner and a destination.
2. Each touched member released, its version synced across `skills.json`, the submodule pointer and
   the README table, and the release observed from the registry rather than from the build (M-48).
3. The local installs on this machine refreshed by the family launcher, in the same pass.
4. `manifesto.md` and its website mirror (`index.html`, `llms.txt`) agreeing with each other and with
   the repositories they cite.
5. A closing four-field report — `DONE / PROOF / SCOPE / NOT VERIFIED` — because a program about the
   manifesto that closes with "all done" would be the first thing the manifesto refuses (M-09).
