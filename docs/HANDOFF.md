## Current — 2026-10-15, hub 1.64.0 and task-pipeline 1.96.0 published and installed

**Big goal.** The ssheleg family (hub + 11 members) is coherent, published, installed on the
operator machine with readback, independently reviewed, and documented so the next agent starts
from this file, not from chat.

**Where we are.** Hub **1.64.0** (fc11487) and task-pipeline **1.96.0** (2674147) are live and
installed: [readback](evidence/completion-1013/installed-1.64.0/README.md). This iteration shipped
hub 1.63.0→1.64.0 (five releases, each fixing what the real installed update found) and
task-pipeline 1.95.0→1.96.0, plus seo-aeo-audit and sheleg-dev lock ports.

- **Finish line.** task-pipeline 1.96.0 adds `references/finish-line.md` and `waves.py finish`:
  an iteration fixes objective, exit checks, scope, budget (3 rounds, 2 releases) and base at
  intake; every finding is triaged blocking / deferred / noise; it stops after two rounds with
  nothing blocking or when the budget is spent. The family wait rule (wait-v2) carries the same
  "continuing is not polishing" rule to every host.
- **Token economy.** Operator instruction files compacted (~3.7k tokens per session across
  Claude, Codex, Gemini; procedures moved verbatim to on-demand references), Codex instruction
  cap raised, `npx sshlg-skills context` measures every always-loaded file, the routing text has
  a ratchet. Evidence: [context economy](evidence/context-economy-20261015/README.md).

**Open (deferred, with owners).** Hub board B-29, B-84, B-108, B-109, B-146, B-162, B-174,
B-180, B-184, B-185, B-187, B-188, B-189, B-190, B-195, B-198, B-199; task-pipeline B-136…B-140;
Codex: three members deferred until sessions holding the old generations end (next `update`
installs them); Fabric cross-project asks unsent (other projects' ids are not visible from this
project); the exposed enrollment poll secrets (Observatory `mem:348bac6b964e4ce5`) need the
operator to re-issue two Codex enrollment requests.
**Next:** read the final observer report (`docs/reports/2026-10-15-final-observer/`, branch
`audit/final-observer-20261015`) when it lands; take the highest-priority board row as a new iteration with its own finish line.

## Current — 2026-10-14, release iteration 1 rows N-5 and N-9 (branch `iter1/N-5-N-9`)

Not released: the family release follows after every iteration row lands.

- **N-5 done:** [`test/remedies_test.js`](../test/remedies_test.js) holds every secret-guard
  refusal (`lib/secrets.js`, `lib/mcpsecrets.js`, the hook's Read/Grep refusal) to an
  Observatory-free step before any Observatory step; a rule without a corpus case fails.
  It failed on main for the 13 DigitalOcean refusals; their remedy now leads with the
  mode-600 file. A planted Observatory-only remedy fails it. Round 2: only the remedy
  part (after the diagnosis) counts, so deleting the stdin-program free step fails it.
- **N-9 done:** [managed-blocks/1](working-rules/managed-blocks.md) and its writer
  `lib/blockwriter.js` (`blocks install|uninstall|resolve`, preview unless `--apply`,
  backup through `protect()`, hash-chained journal); `blocks` registers
  `OBSERVATORY:AGENT-UPDATES` (fixture in `test/blocks_test.js`). `SSHLG:REPOSITORY-HANDOFF`
  stays without a writer: B-174 is the operator's.
  Round 2 added tests for the pre-rename compare, backup-hash compare, journal chain,
  a new `journal.head` (cut-off records), exact round trip, symlinked host dirs and the
  error shape; each fails with its guard planted out.
  Round 3 (adversarial): exact round trip without a separator, CRLF, fenced examples,
  result-parse check, read-only refusal, backup reuse on retry, resolve sweeps temp files,
  edited-block warnings; remedies reads quoted `rule` keys, refuses shorthand, and checks the
  hook's deny sites. Cycle 2: a crash before the first journal.head is recoverable; stray
  fences around the selected block warn with the line; mid-file uninstall pinned.
- **Board:** B-175, B-179, B-181 closed with evidence; filed B-195 (I-6 labelled-value
  detector, another builder), B-196/B-197 (wait block content, M-10), B-198 (`--help`
  for every subcommand; `blocks` answers now), B-199 (journal-named backups not pinned).

**Next:** B-196/B-197 in `lib/wait-rule-text.js`, then B-198 for `rules`. Observatory decides
whether `agent_updates.py` adopts `blocks install --owner OBSERVATORY`.

## Current — 2026-10-14, hub 1.63.2 published and installed

Hub **1.63.2** is live (npm gitHead 0e5ed71) and installed here with readback:
[installed-1.63.2](evidence/completion-1013/installed-1.63.2/README.md). The two
interim releases each fixed what the real installed update found: 1.63.1 (payload-
equivalent members, bytecode caches) and 1.63.2 (settings layout). task-pipeline
**1.95.0**, seo-aeo-audit a6e471e and sheleg-dev 7ced39b are pinned and delivered.
[Requirement cut](evidence/completion-1013/requirements-current-20261014-0720.json): 37 kept.

Open, with owners: B-191 (equivalent members keep upstream marketplace source),
B-192 (multi-scope member blocks its own version change), B-193 (runtime keeps dropped
files), B-194 (tab-indented insertion). Codex: three members deferred, bounded watcher
running. Fabric cross-project asks unsent (other project ids not visible). Exposed Codex
enrollment poll secrets: Observatory `mem:348bac6b964e4ce5` — re-issue those requests.
**Next:** independent final observer over the original objective; its findings become the
next bounded wave.

## Current — 2026-10-14, hub 1.63.0 release in progress

Branch `waves/2026-10-13-finalization`, [PR219](https://github.com/ssheleg/sshlg-skills/pull/219).
Done since the 2026-10-13 stop ([continuation log](CLAUDE-CONTINUE.md)):

- B190 supported runtime recovery: two independent reviews, 41 controls, docs bridge
  ([review](evidence/completion-1013/runtime-recovery/independent-review.md)).
- IO09 scratch child lifetime: reviewed, fixed, published in task-pipeline **1.95.0**
  ([receipt](evidence/completion-1013/tp-release-1950/README.md)); ported to
  seo-aeo-audit (#41, `a6e471e`) and sheleg-dev (#29, `7ced39b`), owner gates green.
- Pins: task-pipeline 1.95.0, seo-aeo-audit and sheleg-dev at their merged commits.
  Full hub gate passes every suite ([bd3af81](evidence/completion-1013/hub-gate-bd3af81/README.md));
  DOCMAP Ratchets 133/2270/11, description total 32498.
- Static graph [refreshed](reports/2026-10-14-code-graph-hub-candidate/README.md);
  [board cut](evidence/completion-1013/board-current-20261014-0519.json) (177 ids kept) and
  [requirement cut](evidence/completion-1013/requirements-current-20261014-0530.json) (37 kept, 14 updated).

**Next:** final hub gate on the exact head, PR219 ready → hosted checks → squash merge →
annotated `v1.63.0` on main → release run → npm readback → `npx --yes sshlg-skills@latest update`
and [installed readback](evidence/completion-1013/installed-1.63.0/README.md) → wiki index →
independent final observer. Cross-project Fabric asks stay unsent (other project ids not
visible through this door). Exposed Codex enrollment poll secrets: Observatory
`mem:348bac6b964e4ce5`; the two pending requests need cancelling and re-issuing.

## Передача Claude — оператор остановил сессию 2026-10-13

**Начать с [docs/CLAUDE-CONTINUE.md](CLAUDE-CONTINUE.md).** Там актуальные ветки,
проверенные результаты, незавершённые B190/IO09, активные watchers и точный порядок
продолжения. Новые волны остановлены для передачи; система не объявлена завершённой.
Исторические записи ниже сохраняются как evidence, но не задают следующий шаг.

## Current continuation — 2026-10-13 13:54 UTC

Hub candidate **1.63.0**, branch `waves/2026-10-13-finalization`, composes immutable
Claude source updates, scoped default-off wait rules, release-iteration routing,
read-only managed-block previews, the Codex active-generation deferral and bounded
backup-identity correction. Latest published hub remains 1.62.2. Candidate aggregate,
publication and actual installed acceptance are pending. The normal delivery
candidate is [draft PR219](https://github.com/ssheleg/sshlg-skills/pull/219); it has
not been promoted for final candidate checks.

**New runner lifecycle finding:** [IO09](reports/2026-10-13-independent-observer-runtime-3898236/README.md#io-09-shared-scratch-lock-ends-before-orphan-plant-writers)
shows the new shared scratch lock can release on runner SIGKILL while its plant
child still writes. The owned-namespace reproduction touched no public scratch.
The active TP875c6e6 full run remains frozen as pre-fix evidence; a separate
correction branch must pass descendant-lifetime controls before TP/SEO/dev
integration. A healthy full run alone does not resolve this interruption defect.

**Current failed gate and next action:** the [first composed aggregate](evidence/completion-1013/hub-first-aggregate/README.md)
ran132 suites and failed3: stale own-state expectations, staging pin receipt and
old task-pipeline aliases. Narrow own-state corrections passed independent negative
controls. [Summary-count correction](evidence/completion-1013/aggregate-counting/README.md)
keeps actual cases visible without changing assertions. Runtime failure propagation
and rollback are independently accepted; B190 supported crash-lock recovery remains
in development under its [admission packet](reports/2026-10-13-runtime-recovery-admission/README.md).
Next: finish that bounded source/review, pin the actually published TP1.94.1,
regenerate the staging receipt, freeze source, refresh graph and rerun full hub gate.
The [37-requirement cut](evidence/completion-1013/requirements-current-20261013-1354.json)
retains original wording and current acceptance boundaries.

**Hook recovery:** exact old payloads were restored after Codex native plugin
updates pruned files still used by this session. [Native evidence](evidence/completion-1013/hook-recovery/README.md)
records nine completed hooks after recovery and one later completed post-tool hook.
A [second native observation](evidence/completion-1013/hook-recovery/native-followup-20261013-1048.json)
captured35 completed pre/post hooks with no failed status in its50-second window.
The [permanent guard peer](evidence/completion-1013/codex-cache-peer.json) is accepted
and composed: native version transitions defer before mutation because no supported
active-thread retirement/old-generation retention proof exists. Catalog convergence
alone cannot establish retirement. Actual deferred receipt/watcher registration
follows publication; no native version transition is authorized by a timeout.

**Exact next sequence:** TP1.94.0 at78c42124 is NOT published. Its local full
attempt stopped on disk guard; root's subsequent exact-tree admission was
[incorrect](evidence/completion-1013/tp-current-gate/admission-correction.md).
The premature public tag is preserved. Release38386280311 failed its tagged
run-stamp guard and skipped publication; npm remains1.93.3. The separate owner
1.94.1 repair passed local npm test and all genuine candidate checks; PR126
[merged normally](evidence/completion-1013/tp-current-gate/repair-normal-integration.json)
at540679ea7552f8a37e99560e287a69c23cbd3c4a. The exact accepted commit completed the full local `npm run test:all` with actual
exit0 in5576.924seconds, unchanged source/tree/tag and clean state. The
[admission](evidence/completion-1013/tp-current-gate/repair-exact-tagged-admission.md)
records all disclosures, including the lessons redactor skip and synthetic
Git-free fixtures. Two secondary test copies were proven owned and removed;
their runner defect is corrected and independently checked in future1.95 candidate875c6e6, whose complete pre-integration gate is running. R07 is still bounded.
The verified annotation89e4782133bcba4f9ea6e5d9d584dfab004b0ded was pushed with
explicit --no-follow-tags; normal [release38404300140](https://github.com/ssheleg/task-pipeline/actions/runs/38404300140)
is running. A background60-second read-only watcher will read all jobs and verify
whole-package npm bytes on success. Publication and parent pin remain pending.
Hub publication and actual installed acceptance remain pending.

Accepted whole-source discovery corrections are now pinned: make-skill df53aaa,
agent-stack fefece0 and SEO1e86edf, each normally merged after required checks.
Their published payloads remain byte-equal. The [independent sibling controls](evidence/completion-1013/fw01-sibling-peer.json)
and owner integration receipts retain the witnessed failures and corrections.
AS B159's two named SEO source gaps are now fixed; its docs-only closure
[PR55 merged](evidence/completion-1013/as-referral-closure-integration.json) atfefece0 after
independent peer, final exact-head npm test and genuine checks. It is pinned;
all29 primary rows,31 expanded IDs and44 packaged files are preserved.
The original subset-count error and correction remain in history. No broader
runtime claim is implied.
UX PR47 at7267757 remains pinned. Three new owner verification indexes passed all local and genuine hosted gates,
then normally merged and were pinned: Telegram8639e59, XRb4181b9, Web3Dc8478b4.
The [bounded source peer](evidence/completion-1013/fw00-navigation-peer.json) and
per-owner navigation-integration receipts preserve policy, exact heads and checks.
All81 published files remain equal; no version/publication changes.

**Next wave:** the [backup recovery packet](evidence/completion-1013/backup-recovery-packet/README.md)
owns operation-referenced retention and the first wait-rule adapter, developed in
an isolated branch after the accepted bounded identity fix. Its MB02b source ed02df7
and peer-doc successor 8bb7f64 passed 30 recovery plus seven real crash controls;
two root findings were corrected before acceptance. The MB02c inspection/finalization
CLI e37df18 is [accepted as bounded source](evidence/completion-1013/wait-recovery-cli-peer.json)
on `feat/wait-recovery-cli-1013`; composition is now at0c4c215; aggregate and installed acceptance remain pending.
FW07 prerequisite corrections and lossless stage extraction are frozen in TP draft
PR123 (3a8e4ac), including independently checked stage-3 prerequisite corrections;
rebase on1.94.1, moved public plants and the full gate await their slot. A separately
reproduced custom-profile checkpoint bug is corrected in draft PR124 (b4fed300);
162 controls and seven independent seam checks pass after three peer findings
were corrected. [Bounded peer](evidence/completion-1013/fw07-checkpoint-peer-final.json)
is not a full gate or installed claim.
These changes do not borrow acceptance from the immutable TP release run.
The dry-only behavioral harness is now composed atf524d22 with an independent
[68-control replay and source review](evidence/completion-1013/fw07-dry-peer.json).
It has no live transport and cannot authorize or demonstrate model quality.
A refreshed source cut and separate provider admission remain pending.

[Native P2](evidence/completion-1013/native-routing-p2/readout.md) remains
**NO_ADOPTION**: Google Auth still omits denied-before-switch testing. No installed
description compression is accepted. The [combined evaluation](reports/2026-10-13-skill-discovery-quality-results/README.md)
keeps protocol, cost and quality limits separate. The [current static graph](reports/2026-10-13-code-graph-recovery/README.md)
is independently checked at 00a6b2c: 249 files, 2989 nodes, 4522 edges, 225 communities.
Its peer reconciles raw/export endpoints explicitly; the prior cut remains intact.
It is source navigation, not runtime proof. Wiki PR22 merged at a646848, retaining
all 177 previous report IDs and adding four; source-scanner limitations remain.

UX PR47 merged at7267757 after every genuine check passed and is pinned; it
retains the missing two real board mutations. Its proposed additional
parity defect was [retracted](evidence/completion-1013/r30-ux-gfm-interpretation-correction.json)
after official GFM scanner and GitHub-rendering evidence; production parsing remains
unchanged. The three source-discovery guards above are accepted and pinned. The proposed owner-only
pretag helper has corrected the independently reproduced package-name, push-destination,
unsolicited-tag and interruption defects. The composed9b3fa1a source passed58 independent
focused controls from immutable Git blobs; its full gate and future owner release remain
pending. A shared family scratch lock is being prepared because distinct TMPDIR locks
did not protect fixed /tmp plants. The active1.94.1 release source remains frozen.

[Preliminary observer](evidence/completion-1013/observer-pre-release.md) is
PARTIAL_NOT_FINAL. Reconcile all 37 requirements and 177 original board IDs after
final pins, preserving new defects separately. Fabric com.* remains unavailable;
cross-project requests are unsent. Final acceptance requires published payload,
actual host readback and independent comparison against the original objective.

A fresh nonauthor observer is performing an interim source/evidence preflight from
[the frozen task packet](evidence/completion-1013/final-observer-task/README.md).
Final verdict still requires actual release/install receipts. It reproduced a
[Codex receipt/visibility ordering defect](evidence/completion-1013/codex-visibility-order/README.md);
root corrected it and the10 actual CLI fixture controls passed. An independent
immutable-checkout replay also passed all10; a refreshed graph is in progress. Wiki PR23 normally merged2dd9e47 with
181→182 IDs and zero loss; its source-header validator correction passed22
independent controls. Next TP composition
is a separate1.95.0 source candidate0cb1044; shared-lock SEOd6c87c3 and dev366a2d3
ports have independent30-control replay each, with aggregate/integration pending.
No next-wave gate substitutes for the active1.94.1 exact-tag run.

A second [independent source review](reports/2026-10-13-independent-observer-runtime-3898236/README.md)
found ignored runtime-copy failures in update/hooks-install and incomplete recovery
after a partial switch, including newly introduced files. An isolated correction
and focused failure controls are in progress; final graph and hub aggregate wait
for its independent acceptance. No actual host failure is inferred from this
source finding. Structural3898236 passed after refreshing two stale local remote
refs; the initial failure and corrected read are retained in
[evidence](evidence/completion-1013/structural-3898236/hub-3898236-structural-refreshed.json).

The dated entries below retain previous states and are not current instructions.

## Installed follow-up and next wave — 2026-10-13

Hub v1.62.1 is published from merge `ae1b415bc79a3d89ca97199299e0e00a2a5e7674`.
[Exact release receipts](evidence/completion-1013/release-1.62.1/hosted.json),
[installed runtime](evidence/completion-1013/installed-runtime.json),
[domain readback](evidence/completion-1013/installed-domains.json), and
[native visibility benchmark](reports/2026-10-13-native-visibility-rollout/README.md)
separate published, installed, native-loaded and still-unmeasured quality.

Current candidate: branch `waves/2026-10-13-installed`, hub 1.62.2. The
[B-186 installer fix](evidence/completion-1013/installer-pins.md) and
[B185 lossless settings fix](evidence/completion-1013/domain-lossless.md) are
implemented and independently checked; the local aggregate passes115 suites/1755 fixtures/11 members at9ad52cf;
release and installed readback remain pending. Nine published member updates
have exact-source receipts, including agent-sync1.22.2. Task-pipeline iteration
and subsequent agent-stack/SEO owner packets continue separately.

Exact next task: finish independent candidate review, integrate through genuine required
checks, publish, then perform the full plain-host update and compare installed
bytes. Reapply owned domain settings with readback; two incomplete foreign Git
roots must still preserve global coverage. Continue the contextual
[family packets](evidence/completion-1013/family-next-wave.md), including collector
coverage, task-pipeline conservation fixes and controlled selection evaluations.
No descriptions were shortened without a quality gate. Fabric com.* tools remain
unavailable; own-Git pending asks are unsent. The
[independent draft review](evidence/completion-1013/independent-draft-reconciliation-review.md)
certifies synthetic consumer and reconciliation checks only.

Earlier status sections below are dated history, not current acceptance.

## Active follow-up wave — 2026-10-13

Hub 1.62.0 was merged in [PR216](https://github.com/ssheleg/sshlg-skills/pull/216)
at `c035801021a046a1bc8fcae41ea8a6a4c060bd2d`. Exact-commit local npm test passed
113 suites / 1695 fixtures / 11 members; the exact-commit Pages workflow also passed
all three validation jobs and deployed. The immutable annotated tag was pushed;
publication and installed acceptance are tracked in the
[follow-up receipt](evidence/completion-1013/followup.md), not inferred from the tag.

The current branch `waves/2026-10-13-followup` adds the independently reviewed release
watcher and C05 settings-reading correction. Its aggregate gate and 1.62.1 release
are separate from 1.62.0 evidence. Member FW01, the three FW02 missing-owner gates,
and FW03 have merged; their versions, release receipts and hub pins still need
alignment. FW04 lease activity, FW05 design/UX claims and FW06 collector provenance
are active isolated owner work.

Exact next task: complete the follow-up aggregate gate, publish/verify each accepted
candidate, apply the authorized machine visibility choices through the launcher,
and continue owner packets. Keep global hook-bearing plugins, unknown domain roots
and independent behavioral-quality gates explicit. Fabric now admits this project,
but this session still lacks com.status/list/submit tools; pending cross-project
asks remain unsent in Git. Do not use another transport to bypass the board.

Earlier status sections below are dated history, not current acceptance.

## Completion candidate — current at 2026-10-13

The active branch is `waves/2026-10-13-completion`. Hub candidate 1.62.0 at
`5427bbbd449cf6c26bc52e84f98bdb90707d5ec6` passed **113 suites / 1695 fixtures**,
with an [independent merged-seam review](evidence/completion-1013/merged-seam-review.md).
C04 visibility profiles `27c63c9` and C05 domains profiles `b50b7e9` are integrated.
[Run ledger](evidence/completion-1013/run.md) separates the local gate from release,
installation and whole-family acceptance. [Plan](evidence/plans/2026-10-13-completion.md)
and [family packets](evidence/completion-1013/family-next-wave.md) are the execution entry.

Exact next task: finish integration/release under the nightly hosted-check policy,
then verify published artifacts and apply the operator-authorized visibility/domain
settings with backups and readback. Continue FW01/FW02 independently while hosted
checks wait. Model screening has provider TEST_ERROR, not a quality verdict; no
installed skill descriptions were shortened. Fabric board admission/tool availability
still prevents submitting the durable pending cross-project asks.

Earlier current-status paragraphs below are dated recovery history, not current gates.

# Start here — sshlg-skills

Snapshot: 2026-10-13. This page selects evidence and the next bounded action;
[skills.json](../skills.json) owns the current member inventory and pins.
Read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[standing retrospective instructions](evidence/retro.md) and the
[repository handoff rule](working-rules/repository-handoff.md) before editing.

## Current execution — completion waves, 2026-10-13

This section owns the next action. The sections below are historical component
handoffs; their old next-task and lease statements do not supersede this execution.
Entry: [completion plan and packets](evidence/plans/2026-10-13-completion.md),
[receipts](evidence/completion-1013/README.md),
[stage ledger](evidence/completion-1013/run.md),
[dated research](reports/2026-10-13-skill-discovery-efficiency/README.md).

Branch `waves/2026-10-13-completion` integrates visibility `18a2a77`, domains
`ff33a3b`, guards `72e0138`, discovery `7d49b3e` and main's CI optimization
`022356d`. Component reviews closed reproduced defects; aggregate gate/review is
running. The original checkout and its local exports remain untouched.

**Exact next action:** finish the full gate on the integration head, reconcile its
measured test counts and independent review findings, then update the release and
installed-readback receipts. Do not claim a published/installed update from this
branch. After the release gates, use the documented visibility and domains previews,
apply the already-authorized choices and verify each host. Keep sheleg-dev global.

Fabric admission returned `no-project`; pending owner requests are recorded in the
completion receipts. No alternate channel was used. Human-only sign-ins/consents
remain human. The complete family objective remains open: native task-quality evals
and the remaining owner-board rows are tracked separately from local test success.

## L1 — the marked packs hidden on every host (2026-10-13, unreleased, lease `WAVES-1011`)

Plan: [load optimisation, wave L1](evidence/plans/2026-10-13-load-optimization.md).
**Read first:** [receipt](evidence/runs/2026-10-13-visibility-hosts.md) ·
[`pack-marks.example.json`](../pack-marks.example.json) · README § "Hiding the marked packs on every host".
B-143 closed (marked; hidden, not deleted); B-148 untouched. PR #213 (branch
`feat/visibility-hosts-main`); #212 closed.

Done: `visibility` writes Gemini, Pi, Hermes and OpenCode through each host's own switch
(Cursor and Kimi: "cannot hide"); the marks are machine-local
(`~/.sshlg-skills/pack-marks.json`, `visibility marks --init`), the package ships only an
example; per-machine `visibility.showPacks`/`hidePacks` overrides; explicit consent
(`applied`, `hosts`) that `update` re-applies under; degraded hosts never fail a run;
byte-exact revert. Fix round after the unit, seam and product readings failed: consent,
scope, revert bytes, degraded hosts, RM-23 worded as planned, machine-local marks, backup
modes, uninstall note. Sandbox readbacks with the real host CLIs; the operator's machine
was only previewed (read-only).

**Exact next task (after review and release, on the operator's machine):**

1. Write the machine marks — preview, then apply (a backup is taken first):
   `npx sshlg-skills visibility marks --init --show anthropics/skills,heygen-com/hyperframes,emilkowalski/skills,vercel-labs/agent-skills,meta-quest/agentic-tools,stablyai/orca,kepano/obsidian-skills,anthropics/claude-code,conorbronsdon/avoid-ai-writing`
   then the same with `--apply`. It writes 54 rows (34 hidden) at revision 1.
2. `npx sshlg-skills visibility` (preview), then `npx sshlg-skills visibility --apply`. This
   records consent for the hosts it covers. The machine's current record is from 1.55.0 and
   carries no consent, so **no `update` hides anything on Gemini, Pi, OpenCode or Hermes
   before this step**. Afterwards `update` re-applies on the hosts the record lists.
3. Read back per host: `gemini skills list` (`[Disabled]`), Pi's loader as in the receipt,
   `opencode debug config` (`permission.skill`), `hermes skills list` (`disabled`), and append
   the counts to the receipt; then L4 measures the listing sizes.

## B-185 — domain members per project (2026-10-13, branch `feat/domain-members`, unreleased)

Plan [L5](evidence/plans/2026-10-13-load-optimization.md); operator decision "Yes, by domain".
The original head `e27a040` failed unit, seam and product certification. Its installation
preview and old passing gate are historical, not acceptance of the fixed implementation.
Preserved first fix `09d17a2` adds explicit `--enable`/`--disable`, symlinked repositories,
missing-root refusals, partial-scan protection, and additions-only unattended updates.

The recovered second fix preserves hook-bearing plugins globally (sheleg-dev always),
keeps installed disabled skills searchable, resolves project enablement for hook readers,
and refreshes existing plugins without reinstalling them. Malformed/oversized manifests
are incomplete evidence; a member already scoped goes back on when coverage is uncertain.
Independent review of `353033a` exposed interrupted-write, shared-settings and truncated
source-search defects. The follow-up saves atomic recovery intent before settings writes,
distinguishes pending global writes from later operator changes, retains unknown project
ownership and serializes mutations with the update lock. Shared project settings now
precede local settings; all matching source lines are scanned; unloaded route hints print
once per session. A further independent replay of `3c0cb53` required valid global plugin
settings before revert removes local entries; malformed global JSON/maps now retain all
recovery state. The machine's configurations have not been applied by this development task.

Implementation: `lib/domains.js`, `lib/domainscan.js`, `lib/enablement.js`, launcher and hooks.
Focused checks and bounded scenarios are recorded in
[evidence/runs/2026-10-13-domains-recovery.md](evidence/runs/2026-10-13-domains-recovery.md).

**Exact next task:** independent unit/seam/product review of the final branch head, then
integrate with L1, run the full hub gate, release, and refresh through the published launcher.
After release, preview `npx sshlg-skills domains`, apply the authorized domain choice with
`--apply`, and read back both a domain project and a fresh project outside the domains (L4).
Do not restore the old design that disabled sheleg-dev's money gate.

## Closed — integration waves (2026-10-11/12, lease `WAVES-1011`)

`/task-pipeline waves` over the whole board, with the operator's emphasis on optimisation
and on the family working with Fabric, Observatory and every coding agent.
**Read first:** [acceptance and REQ coverage](evidence/acceptance/2026-10-11-integration-waves.md)
· [brief + REQ table](evidence/briefs/2026-10-11-integration-waves.md)
· [plan](evidence/plans/2026-10-11-integration-waves.md)
· [compatibility cut](reports/2026-10-12-coding-agent-compatibility/README.md)
· retro stamp "2026-10-11/12 — integration waves".

Shipped: hub 1.56.0 → 1.59.0; task-pipeline 1.93.3, agent-sync 1.22.1, agent-stack 0.27.1,
make-skill 0.31.1. Not every member PR passed three readings before its first merge: fix
commits made after a passing reading were merged unread in four repositories; an independent
observer caught it, each was re-read, and every finding was fixed in the patch releases above.

**Exact next task:** W4-C — run the `skill-search` trigger evals (make-skill
`test/evals/skill-search/triggers.json`) and the paired routing arms (`test/evals/README.md`)
on a model once the Sonnet weekly limit resets (2026-10-16); record run ids, arms, n and cost;
decide B-144 and B-147. Then the open rows by priority (B-171/B-172 guard coverage first).

**Waiting on the operator:** Gemini sign-in (B-146); AS-14 drop or keep; whether the
R18 age sweep (`reap --long-expired`) is acceptable; the Notion tokens into the vault (R20);
who owns the `SSHLG:REPOSITORY-HANDOFF` block (B-174).

## B-169 / B-170 — the fabric rule only where Fabric is; the block headed in English (2026-10-12, unreleased)

Asked by project-observatory's release iteration 1 (audit USR-012); rows B-169 and B-170 are filed
by the waves close-out. **B-169:** routers may declare a machine predicate (`machine:` in
`lib/routers-registry.js`, predicates in `lib/machine.js`); `fabric` holds only where Fabric's
services directory exists, in the block and in the prompt hook. A 1.58.0 block on a machine
without Fabric loses the section and its row on the next update; the packaged text is not stashed,
an operator's wording is. `working-in-passioncode` left the fabric rule and its hook route.
**B-170:** the block heading is `## Work routing — the ssheleg family`; the Russian heading is an
alias, retitled on the next write; migration finds the block by sentinels, so neither heading is
taken for a hand-written rule.

Checks run: `npm test` green on db49a57 + this change — 102 suites, 1356 fixtures, 11 pinned
members (DOCMAP ratchet 1349 → 1356, suites 101 → 102 with `test/machine_predicate_test.js`); the six sandbox cases each
end in three runs with identical hashes.

**Exact next task:** after the hub release that carries this publishes, `npx --yes sshlg-skills@latest update`
on this machine (Fabric present: the fabric section stays, minus `working-in-passioncode`; every
host file retitled in English), then tell project-observatory-b1 and sshlg-skills-40.

## B-166 — Codex native plugins through Codex's CLI (2026-10-12, branch `fix/codex-native-refresh`)

Developer agent under lease `WAVES-1011`. `update` now moves family plugins that Codex holds
below the pin, using Codex's own CLI: remove the marketplace, re-add it at the pin, add the
plugin, and read it back from `codex plugin list`. Rollback uses the previous ref, read from
`config.toml` before the removal
([lib/codexplugins.js](../lib/codexplugins.js); `refreshCodexPlugins` and `planCodexSteps` in
[bin/sshlg-skills.js](../bin/sshlg-skills.js)). The pin ref is the gitlink commit in a checkout
and the tag `v<version>` from npm. The published package ships no SHA; all eleven tags peel
to their gitlinks, measured 2026-10-12. B-166 is closed in the
[backlog](evidence/backlog.md) with the evidence; the CHANGELOG entry is under *Unreleased*.

Checks run: the new e2e suite fails 10 of 11 on `ce3983b` (`origin/main`) and passes all 11
on the branch. The eleventh case is the leave-it-alone guard. Four planted defects were caught
by `test/codexplugins_test.js`. `npm test` is green with the counted ratchets. A real Codex
0.162.1 run, with a sandbox HOME and CODEX_HOME through the branch's `update --agent codex`,
moved agent-sync 1.21.7 → 1.22.0 at `517b4b6` and left web3d-dev, already at its pin,
untouched. A `--dry-run` against a copy of this machine's `config.toml` lists all nine family
marketplaces, including the `["marketplaces"."web3d-dev"]` quoting.

**Next:** review and merge the PR. The machine's Codex moves on the first `update` of a
release that carries this change. This branch was not run against the operator's HOME.

## Router addition — fabric (2026-10-12, released as 1.58.0)

Requested directly by the operator, outside the waves board: the fifteenth router.
If Fabric is installed on the machine (its services directory present), Fabric work and
local-service questions go through the Fabric tooling; the boundary refuses generic
Docker/PostgreSQL/nginx services and brand-new agents with no Fabric contract requested.
Memberless on purpose (`requires: []`, documented on the entry in
[lib/routers-registry.js](../lib/routers-registry.js)): the condition is the machine, and
the four target skills ship in the fabric-agent-adapter plugin outside `skills.json`.
The hook route fronts those skills with `foreign: true` — the first route whose skills
this repository does not ship — every trigger verbatim from the named skill's own
description. Refusal "no fabric" / «без фабрики».

Recorded moves, all in the same change: the block budget 15,913 → 17,600
(`test/router_compaction_test.js` carries the 17,501 measurement on top of 1.57.0; the room-buying trim is
B-154's); `test/validate.py`'s router extraction is `[a-z0-9-]+` — `web3d-dev`'s digit had
made the README count guard read fourteen names of fifteen; the acceptance receipts
[ctx-04.02.json](evidence/acceptance/ctx-04.02.json) and ctx-04.03 are re-emitted for the
fifteen-namespace block; the eval corpus declares `fabric` unprobed-by-model until the
next paired run (B-147). The full entry is the [CHANGELOG](../CHANGELOG.md) top section.

Checks run: `npm test` green on `origin/main` 36a5b23 + this change — 99 suites, 1295
fixtures, 11 pinned members (the DOCMAP ratchet moves 1289 → 1295 with the new corpus
cases; the description total stays at 32501, the router adds no member description);
`node test/route_coverage.js` — the twelve fabric corpus cases pass (7 route, 5 measured
silence).

**What happened on the machine.** The change was first written in the main checkout on
the stale `waves/2026-10-11-integration` base (5852c57) and applied from there with
`routers --update` at 13:13:35Z: that put the fabric block into the host files but also
reverted the 1.56.0 refusal-phrase paragraph. The 1.57.0 machine install by the release
session restored the paragraph and dropped the fabric table row. Nothing is applied from
a checkout again: after release, `npx --yes sshlg-skills@latest update` writes the block
and its row to every `apply.TARGETS` host file, Pi's `~/.pi/agent/AGENTS.md` included.

**Released and installed 2026-10-12.** #198 squash-merged as `103e25c`, tag `v1.58.0`, release run
[38272767689](https://github.com/ssheleg/sshlg-skills/actions/runs/38272767689) success (validate, release,
publish), npm 1.58.0. `npx --yes sshlg-skills@latest update` on this machine: exit 0, 83 of 83 steps green;
`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.pi/agent/AGENTS.md` and
`~/.cursor/rules/sshlg-routing.mdc` each carry `SSHLG:ROUTER:fabric`, its table row and the 1.56.0
refusal-phrase paragraph. The waves board's next bounded task stays W1-C as above.

## Previous delivery — family round 1.55.0 (2026-10-10/11)

[Brief](evidence/briefs/2026-10-10-family-round.md) · [plan](evidence/plans/2026-10-10-family-round.md) ·
[delivery receipt](evidence/family-round-1010/DELIVERY.md). Lease `FAMILY-ROUND-1010`.

The review of 1.54.7 measured what its readback could not: Claude Code's skill
listing was 274,398 characters against a 30,000 budget and Codex dropped 220 skills
(`task-pipeline` among them) from its model list. Operator decisions: a small core
stays listed, the rest is hidden and reached by a search that is now every task's
first step (`toolkit --find`, the routing protocol, make-skill's `skill-search`).
`npx sshlg-skills visibility --apply` writes Claude `skillOverrides` and Codex
`skills.config` through backups; `--revert` removes only what it added.

Eleven members released with annotated tags and a release gate that refuses a
lightweight tag; `skills@1.7.2` pinned. Installation and the post-apply listing
readback are recorded in the receipt's last section.

**1.55.1 (2026-10-11), same round:** `update` restores Continue's copies after every
refresh (`skills@1.7.2` had re-linked 13 of 38; verified on this machine 39/39 real
dirs, 137/137 installed payloads equal); the hygiene guard allows an agent-scoped
`skills add` (B-153); the MCP credential guard from #184; the XR creative research
branch merged. Members: task-pipeline 1.91.2 (gates read the current run only; a
broken python3 stops only releases — B-151, B-152), agent-sync 1.21.7 (shared-identity
`acquire` refused, worktree session stamps, direct `guard` allows an uncoordinated
repository — B-150), make-skill 0.30.1 (family members update through the launcher).
Branch cleanup: hub 10 worktrees + 24 local + 71 remote branches, members 5 worktrees +
54 local + 115 remote branches — each removed only after its PR merged or every file
it touched was present in `main`; the one unique branch (XR research) was merged and
the one unique test (`guard_uncoordinated_test.py`) was ported into agent-sync 1.21.7.

**Open, with owners:** B-145 (plugins keep Claude over budget — operator),
B-146 (Gemini CLI channel and sign-in — operator), B-147 (`skill-search` evals),
B-148 (new compatibility cut; Pi links), B-154 (task-pipeline description trim), HK-05/#91 (task-pipeline CI 105 min,
`validate.yml` 506 KB of 512 KB). Disk: other sessions' test temp directories keep
free space near 2 GB on this machine — not this repository's to delete.
**1.55.2 (2026-10-11):** fabric-90's wave mode shipped — task-pipeline 1.92.0
(`/task-pipeline waves`: the whole board closed in waves; the grill asks one batch),
the routing block names it; installed and read back (83/83, Continue 39/39,
137/137 payloads, Codex native 1.92.0). Reserve ratchet 13 → 14 until task-pipeline
trims its description (B-154). agent-stack B-155: the on-behalf-of delegation doctrine
for `gateway.md`, waiting for Fabric's ADR-0144 plan to reach Fabric main.

**1.55.3 (2026-10-11):** agent-stack 0.26.0 ships that doctrine (B-155 closed) — on-behalf-of
tokens, offline verification, the meter token, `approval/1`, one refusal vocabulary, with
Fabric `fabric-delegation/0.1` as the worked example. Installed and read back (83/83,
Continue 39/39, 137/137 payloads, Codex native 0.26.0).

**Former next task (now R27, wave 4):** B-147 — paired routing eval of the search-first
protocol and `skill-search` (arms with/without the protocol sentence, per
`test/evals/README.md`), then decide whether Codex needs its own core list.

The previous [host compatibility delivery](reports/2026-10-09-coding-agent-compatibility/README.md)
(1.54.7, [delivery.json](evidence/host-compat/delivery.json)) is now a historical receipt.

## Most recent completed delivery receipts

- [Context research 1.54.5](evidence/context-research/README.md),
  [delivery receipt](evidence/context-research/DELIVERY.md): agent-stack 0.25.5,
  source/package/installed-byte receipts. The new follow-up owns later host tests.
- [Instruction context 1.54.4](evidence/instruction-context/README.md): earlier
  compaction and installation slice; its NOT_VERIFIED labels describe that date.
- [Team evaluation and crawl evidence](runs/2026-10-09-knowledge-wave2.md): 1.54.3.
- [Channel evidence and SEO correction](runs/2026-10-09-channel-digest.md): preceding delivery.

## Historical work and unresolved follow-ups

The [Sherlock progress snapshot](evidence/audits/2026-09-07-sherlock/external-v3/progress.json)
records all its leaves done, including FIX-SY-01.01; the
[debt snapshot](evidence/audits/2026-09-10-debts/progress.json) records all its rows done.
Those implementation statuses do not independently prove present deployment or
host acceptance. Do not start their old exact-next instructions or reapply prepared
September patches. Use [the bundle entry](evidence/audits/2026-09-07-sherlock/README.md)
only when investigating that dated work.

The [family-hooks snapshot](evidence/audits/2026-09-13-family-hooks/progress.json)
still records HK-05 as planned and HK-13 as open for the operator. Their present
owner/release state has not been revalidated by this context repair. Reconcile that
state before selecting work from the [dated plan](evidence/audits/2026-09-13-family-hooks/plan.md);
neither item is a universal next instruction for every new task.

**Archive boundary:** the [previous handoff](HANDOFF-2026-10-09-archive.md) is frozen
historical evidence, not operational instructions. It is a verbatim copy of
[this source revision](https://github.com/ssheleg/sshlg-skills/blob/a4c65581787b5ddcb3df1e36a8cae1c89c066479/docs/HANDOFF.md).
Its old status claims and exact-next headings describe their own dates. The same
directory depth preserves relative links; [archive metadata](evidence/context-research/navigation.json)
records its source and hash. Earlier release and workstream links remain there.

## Runtime transaction follow-up — 2026-10-13

Bounded correction and next task: [runtime atomicity packet](evidence/completion-1013/runtime-atomic/README.md).
Failure propagation, existence-aware rollback and admission are source-implemented;
independent immutable review and full owner gate remain pending. A retained crash
lock is explicit unresolved recovery, not an automatic recovery claim.
