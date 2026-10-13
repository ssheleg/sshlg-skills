# Native skill loading and audit quality: bounded preparation

Status: first readiness STOPPED_TEST_ERROR; zero audit task calls. The first
runner passed independent review before execution. A revised isolation attempt
requires a new review and will not overwrite or reinterpret the first receipt.

## Objective and intervention

Test whether actual native discovery and Skill loading work, and whether the
resulting audit artifact is useful. This is distinct from the preceding explicit
catalogue selection pilot, whose strict fenced-JSON error stays unchanged.

Both arms load an owned copy of the real `sheleg-dev` plugin (seven skills) from
released source `8862fae9a826263f8109626ca257f81c7c43ac86`, version 0.13.4.
[Source manifest](source.json) hashes every plugin file. Full and concise arms
change only those seven SKILL.md description fields using the recorded catalogue
candidates; the rest of each SKILL.md and every other file remain identical.
The body cut intentionally differs from the historical selection corpus:
0.13.4 includes the previously completed FW03 token-log correction. No historical
unsafe example will be reintroduced to make the arms resemble an earlier cut.

## Owned synthetic project and independent rubric

[Fixture](fixture/OPERATIONS.md) defines a server-only Cloud Run identity migration.
It contains no credentials, network call to execute, package install or real
provider requirement. Two equivalent [English/Russian tasks](tasks.json) each run
once per arm (four task calls). Their opaque IDs, language labels and the separate
[rubric](rubric.json) never enter the model prompt or accessible workspace.
Translation pairs are correlated, not independent product coverage.

Required artifact findings are the environment credential precedence/misleading
principal claim and token logging, with concrete file:line evidence and bounded
corrections/checks. Native Skill invocation, successful file reads, quality of the
artifact, false positives and schema/transport errors are separate observations.
A final answer naming a skill does not prove it loaded; a correct audit without
Skill invocation does not prove native triggering. Semantic quality requires
independent review of each artifact against the frozen rubric, not keyword counts.

## Isolation and bounded execution contract

The reviewed runner will use normal claude.ai OAuth with `--restricted`, an owned
working directory, session-only `--plugin-dir`, exact `--tools Read,Skill,Glob,Grep`
and matching permission allowlist, `--strict-mcp-config` with an empty MCP map,
explicit disabled hooks/memory/connectors, and no session persistence. No Bash,
network, write or foreign credential tool is available. Do not use `--bare`: the
installed 2.1.296 help says it does not read OAuth/keychain. Do not use
`--disable-slash-commands`, which would prevent the behavior being measured.

Readiness is a separate phase, one nominal call per arm, before task admission.
Require the seven namespaced source skills in native init; unexpected skills,
MCP or executable tools, missing source skills, wrong provider/auth, or an
excessive first input stop the run. Startup registration is not loading evidence.
The readiness input limit is 24,000 tokens. Task observations may span multiple
turns; bound each reported assistant request to 32,000 input tokens and six turns,
with a separate aggregate accounting. Limits are post-request observations, not a
claim that a contaminated first request could not be billed.

At most six calls total (two readiness, four tasks), sequential. Nominal per-call
list-price reservation USD0.50; overall reported-list ceiling USD4, with no retry,
no resume and no hidden continuation after errors. The CLI budget flag cannot
prove a hard first-request billing cap. Seeded arm order, fresh contexts and
unchanged fixture/source hashes make the comparison inspectable. Readiness and
task costs are reported separately; list metadata is not subscription billing.

Raw streams/prompts/artifacts remain outside Git in new 0700 directories and 0600
files. Public receipts contain bounded IDs, tool/path observations, hashes, numeric
usage/cost and enum errors. Do not copy arbitrary tool output or auth identity into
committed evidence. Record any managed-policy/plugin context that remains visible.
A contaminated readiness stop requires diagnosis and a newly reviewed attempt.

## Plan and verification before calls

1. Implement source materialization from the exact commit, reject symlinks and
   unexpected file modes, validate source hashes, replace description fields only,
   and prove all body/non-SKILL bytes and fixture bytes unchanged.
2. Build dry-run-first runner and a fake-CLI process suite covering auth rejection,
   readiness contamination/missing skill, input limits, unallowed tool attempts,
   denied/outside-workspace reads, strict error stops, budgets and private retention.
3. Independently review final runner SHA and the fixture/rubric. Do not execute
   any model call merely because this preparation packet exists.
4. Run readiness only; admit the four audit calls only on observed readiness.
   Preserve every stop and unknown effect. Independently score artifacts, then
   report small-sample native observations and limits without claiming adoption.

## Current documentation checked

Read 2026-10-13: [Claude CLI reference](https://code.claude.com/docs/en/cli-reference)
describes restricted file/tool access and session plugin loading; local 2.1.296
`claude --help` confirms the installed flags and OAuth-incompatible bare mode.
[Claude skills documentation](https://code.claude.com/docs/en/skills) distinguishes
listing descriptions from loading skill bodies. These documented semantics are
inputs to readiness checks, not evidence that this host passed them.

Skills used: agent-evals (frozen rubric and errors), agent-harness (native context
boundaries), task-pipeline (delivery), agent-sync (ownership), evidence-docs
(source and acceptance distinctions). Exact next task: materializer and offline
runner controls, followed by independent review; no provider calls yet.


## Runner prepared: pre-execution checkpoint

[Materializer](materialize.py) verifies all 62 source plugin files plus the three
fixture files. Both arms contain 65 files; bodies/non-SKILL bytes match and only
seven description fields differ. Hooks remain source-identical but are disabled
through explicit CLI settings. The fixture has no symlinks or credential contents.

[Runner](run.py) defaults to a no-call plan. `--execute` requires an explicit source
repository, new private directory outside Git, and new sanitized output path.
It checks the normal subscription route and exact local CLI version, runs two
no-tool readiness calls first, and only then admits four task calls. Missing or
unexpected native skill/tool inventories stop the run. Tool request/result IDs,
read confinement and per-request/aggregate input bounds are checked separately.
Every attempted call has a write-ahead record; unknown effect/cost stays unknown.
Artifacts are hashed and privately retained; no automated semantic PASS is emitted.

Offline command: `python3 docs/evidence/completion-1013/native-quality-v1/check.py`.
Set `NATIVE_SOURCE_REPO` to a clone containing the frozen source commit if it is
not at the local default. The checks use a fake `claude` process only. They cover
source corruption, body parity, foreign-auth rejection before CLI launch, missing/
foreign skills, unexpected tools, input/turn limits, outside-root reads, denied
tools, readiness tool use, and six process runs (completion, contamination,
unknown cost, reservation stop, reported overshoot, timeout). Raw files stay 0600,
private directories 0700; the sentinel auth/output string never reaches receipts.
No model or provider was called. Await independent final runner review.


## First observed readiness: preserved stop

Runner `0a89d0d9eacbfb0f0262d5b06669ba6df1fee432` passed independent review
and fake-process replay. [Attempt A](observed-20261013.json) made one concise-arm
readiness call and stopped on `unexpected_skill_inventory`: all seven expected
skills were visible, alongside 19 bundled skills. Tools were exactly Read, Skill,
Glob, Grep; MCP count zero; the reply was READY with no tool call. Input was 8,304
tokens; reported list metadata USD0.0373944. Full readiness and all audit tasks are
NOT_RUN. No retry occurred, and the stop remains TEST_ERROR, not native acceptance.

[Local diagnosis](readiness-diagnosis-20261013.json) binds the observed inventory
to the private raw-stream hash. Four additional registered plugins were builtin
sources. The extras were unqualified bundled command skills, not observed
personal marketplace skills. The official [bundled-skills guidance](https://code.claude.com/docs/en/skills#bundled-skills)
documents `disableBundledSkills`; doctor additionally needs a visibility override.
The proposed correction is explicit per-invocation settings, with no installed
profile mutation, OAuth copying, or removal of security plugins. Exact seven-skill
admission remains mandatory. Any future reviewed attempt must account for this
first call within the total diagnostic spending ceiling.


## Session-only isolation revision prepared

The revised `--settings` adds only `disableBundledSkills: true` and
`skillOverrides: {"doctor":"off"}`. It does not disable any registered security,
telemetry or other builtin plugin. The fake CLI now requires both settings and
rejects an `enabledPlugins` mutation; a residual doctor entry still fails native
inventory admission. Actual efficacy remains NOT_RUN until independently reviewed.

The next attempt's budget includes the preserved first call: USD0.0373944 prior
reported list cost, verified from its committed receipt, plus new known cost.
Pre-call reservation and post-call overshoot compare that combined amount to USD4.
The output includes separate prior/new totals and the prior receipt hash. Unknown
cost still sets cost_incomplete; no amount is silently treated as an actual zero.
A new output path and raw directory are required; attempt A cannot be resumed.


## Second observed readiness: preserved stop

After independent review of `78e2ce3bbb51b75bb7cd65223c743121d78f2b35`,
[attempt B](observed-b-20261013.json) made one concise readiness call and stopped.
The two extra names `design` and `plugin-authoring` remained alongside the seven
expected skills. Doctor and the other previously observed extras disappeared.
Tools remained exactly four and MCP zero; READY returned without tool calls.
Input was 6,162 tokens, new reported list cost USD0.011772, cumulative A+B
USD0.0491664. Two readiness calls have now been attempted across two distinct
reviewed protocols; zero full-arm readiness calls or audit calls have executed.

Init names four builtin-source plugins, including `cc-plugin-plugin-authoring`,
but its skills array contains names only, without per-skill provenance. Thus the
plugin-authoring source is a plausible inference, not a verified mapping, and the
design source is unresolved. Official visibility documentation supports exact-name
`skillOverrides` but explicitly excludes plugin skills. The next prepared change
can try `design: off` and `plugin-authoring: off` as session-only overrides, retaining
the exact-seven gate. If an unhideable builtin remains, a fixed, explicit builtin
co-context needs a separately reviewed scope; no contaminated attempt becomes PASS.


## Exact-name override revision prepared, not executed

Keep `disableBundledSkills: true`; expand only the CLI `skillOverrides` map to
`doctor`, `design`, `plugin-authoring`, each `off`. No installed setting or plugin
enablement changes. The fake CLI requires exactly this map, and each residual
name still has its own failing admission control. Whether these two native
entries obey the documented override is unknown until a reviewed readiness.

Accounting now explicitly includes both stopped attempts: **two prior CLI
invocations / USD0.0491664 known reported list cost**. A newly reviewed attempt
may make **at most six further CLI invocations**, giving **eight cumulative**,
not six across the whole program. The overall reported-list ceiling remains USD4.
Each readiness has at most one model turn and each task at most six, for at most
26 model turns in a six-invocation attempt (28 including prior readiness). A model
turn is not a promise about hidden transport retries; those remain unmeasured.
Both prior receipt hashes and separate prior/new/combined cost appear in output.
The strict seven-skill gate and stop-on-first-error policy remain unchanged.


## Third attempt: clean readiness, preserved parser stop

After independent review of `264ddf94dba67ba14dc237e991c1118f3621c845`,
[attempt C](observed-c-20261013.json) executed both readiness checks with exactly
the expected seven skills, four allowed tools and no MCP servers. Neither
readiness invoked tools. Concise input was 6,063 and full input 7,636. This is
native inventory evidence for this restricted fixture, not task-quality proof.

The first task (full/a1) stopped `aggregate_input_bound`; the other three tasks
are NOT_RUN. Original output remains immutable TEST_ERROR. Private stream
inspection found eight assistant events sharing four message IDs, with repeated
input usage per ID: 7,694 (twice), 7,861 (three times), 8,876 (twice), 10,543 (once).
The unique-request sum 34,974 equals the final input usage (10 + 6,014 + 28,950).
The parser had incorrectly compared stream-block count to the request limit.
No actual input limit was exceeded; this diagnosis does not retroactively
change the stored attempt verdict. No model retry occurred.

C made three CLI invocations, five cumulative including A/B; C reported list
cost was USD0.134326, cumulative USD0.1834924. All amounts were known.
The correction groups input usage by nonempty message ID and rejects conflicting
input counters for the same ID. It retains every tool block and all existing
per-request, aggregate, final-turn, budget and confinement bounds. Offline
controls cover repeated blocks, missing ID, conflicting counters, too many
distinct requests and excessive aggregate input. Any replay is separately
labelled diagnostic and makes no provider call; further execution needs review.

The [separate offline replay](observed-c-offline-diagnostic.json) rematerialized
the exact source and remapped only original workspace prefixes in tool path
arguments. It passed the corrected structural parser with four unique requests;
no provider call was made. It observed Glob plus three successful fixture Reads,
**zero Skill invocations**, and `google_auth_loaded: false`. The native inventory
was present but the specialist body was not loaded. The freeform artifact remains
private and unscored here. This replay is not a completed paired task experiment.

Next task: independent review of the ID-based parser correction and raw-stream
diagnosis; coordinator decides whether a newly budgeted protocol is warranted.
The runner is not authorized for another call by this evidence entry.


## Explicit three-cell continuation prepared

The coordinator independently confirmed the corrected request counting and
authorized preparation of a separate continuation, with independent runner
review before execution. `continue.py` binds C's immutable receipt hash and both
clean readiness calls, the exact source/materializer/tasks/rubric/catalogue hashes,
unchanged settings and command template. It runs fresh OAuth/version preflight
and rechecks exact native inventory, source parity and tool confinement on each
new task. It never repeats readiness or full/a1, and never changes C's verdict.

Only concise/a1, concise/a2, full/a2 remain, in that fixed original order and
seed. Accounting includes all five A/B/C CLI invocations and USD0.1834924 known
reported list cost. Maximum three new CLI invocations gives eight cumulative;
18 new model turns maximum; the overall reported-list ceiling remains USD4 with
USD0.50 reservation before each call. No transport/schema/unknown-cost retry.
The continuation identity and prior hashes are persisted before any new call.

Offline checks cover the three-cell plan and four fake-process modes, changed
receipt/settings/source/task/rubric rejection, no readiness/task repetition,
private retention and combined counters. No new provider call occurred while
preparing this protocol. Next: independent review, then explicit execution only
under the coordinator's approved bounded continuation.

## Delivered-artifact correction before continuation

Independent review found the full/a1 answer was delivered in two visible text
blocks: 3,506 characters followed by 892 characters after an output-limit
continuation. `result.result` held only that last tail. The earlier diagnostic's
artifact hash therefore identified a tail, not the entire delivered audit.
Its historical record stays unchanged; the [v2 offline diagnostic](observed-c-offline-diagnostic-v2.json)
supersedes that artifact interpretation and still does not alter C's TEST_ERROR.

The parser now preserves every assistant text block in stream order with request
provenance, excludes thinking and tool-result content, and hashes the joined text
separately from `final.result`. Public receipts contain only block hashes,
character counts and hashed request IDs. Successful calls also save the ordered
text and exact message IDs privately in `assistant-text.json` (0600), alongside
raw streams. For C, private `assistant-text-offline-v2.json` contains the complete
replayed artifact; no new model call was needed. Two newline characters delimit
blocks in the joined view; original block boundaries remain available.

The offline split-final control proves that the full artifact includes both
requests, that the final-result hash still identifies the tail, and that thinking
is excluded. All original and continuation fake-process controls passed again.
No prompt, rubric, model, source, limit or cost policy changed. The corrected
continuation remains NOT_RUN pending independent final review.

## Executed continuation and artifact handoff

After independent review of `98a3df5cc4f6d8cfaac796e3497239ad0ceb214a`,
[continuation D](observed-d-20261013.json) completed exactly the three remaining
cells. No readiness or stopped task was repeated. All new task inits contained
exactly the seven expected skills, four allowed tools and no MCP servers.
The total is now **eight CLI invocations**, with **USD0.4536322** cumulative known
reported list metadata; no unknown cost and no retry. This is not subscription
billing. A/B/C immutable stops remain unchanged.

| Artifact | Evidence status | Input across cache modes | Output tokens | Unique API message IDs | Reported list USD |
|---|---|---|---|---|---|
| English/full | C offline diagnostic, original TEST_ERROR | 34974 | 2292 | 4 | 0.099782 |
| English/concise | D EXECUTED | 28372 | 2107 | 4 | 0.0784908 |
| Russian/concise | D EXECUTED | 28851 | 2578 | 4 | 0.0923668 |
| Russian/full | D EXECUTED | 35130 | 2400 | 4 | 0.0992822 |

All four artifacts observed fixture Reads and **zero Skill invocations**. Thus
this experiment has native catalogue visibility and delivered audit artifacts,
but does not establish specialist-body use or unchanged quality after loading.
English/Russian are correlated translations, not independent task categories.
No installed configuration or skill was changed.

The [review manifest](artifact-review-manifest.json) freezes complete visible-text
hashes, ordered block/request-provenance hashes and separate final-tail hashes.
Private text files were verified against those hashes; raw and artifact files
remain 0600 in private 0700 directories outside Git. The coordinator received
exact private paths for independent rubric scoring. Semantic quality is
**NOT_SCORED** in this handoff; neither visibility nor successful execution is a
quality verdict. Next: independent artifact scoring against unchanged rubric,
then decide whether any broader adoption evidence is justified. No further
provider/model call is authorized by this completed bounded protocol.

## Second artifact review: no adoption

The runner author separately read all four complete private artifacts against
the unchanged rubric after receiving the coordinator's preliminary findings.
This is a second grounded review, **not blind independent replication**. The
[dimension record](artifact-second-review.json) binds rubric/manifest/artifact
hashes and preserves the preliminary coordinator result separately from this
reviewer's judgments; the coordinator owns its final scoring packet.

Both reviews agree so far: q1 (ADC precedence) and q2 (token-log removal) pass
all four artifacts. **q3 fails all four**: removing the legacy override/mount is
recommended without first checking required API/IAM access for the intended
attached identity. q4 fails the English pair because no explicit unit/regression
check is supplied; the Russian pair includes mocked ADC/caplog tests and passes
that dimension. All four negative controls pass. Three outputs also propose
`type(credentials).__name__` where a module-qualified source classification is
needed; the English concise artifact supplies both module and name.

No artifact satisfies every required dimension. Skill loading was observed in
none, so these results cannot establish native specialist use or quality after
body loading. **Do not adopt concise descriptions from this experiment.** The
next research task is source-only analysis of native invocation conditions and
the discovery contract, followed by a separately preregistered loaded-skill
quality protocol if justified. Keep spontaneous selection and explicit loading
as different experiments. No more model/provider calls belong to this protocol;
no rubric/prompt change, original-stop relabelling or installed change was made.

The root coordinator is the independent artifact reviewer; this branch author
is the explicitly nonblind second reviewer. Missing pre-switch access checks
and class-name ambiguity are findings in these outputs only. Because Skill was
never invoked, they do not establish defects in the specialist skill body.
