# Native skill loading and audit quality: bounded preparation

Status: PREPARATION ONLY. No readiness or task call has run. The coordinator must
review the frozen executable runner before the first invocation.

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
