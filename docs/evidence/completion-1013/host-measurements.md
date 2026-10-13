# C09 / B-148: measured host compatibility and context surface snapshot

As of 2026-10-13. This is evidence for the parent wave's next compatibility report,
not a claim that native model behavior or token savings passed. All measurements
and command receipts are in [host-measurements.json](host-measurements.json).
The parent owns formal report registration, supersession, integration and release.

## Result and evidence boundary

All 39 family skills are readable in the shared installation. Gemini, OpenCode
and Hermes enumerate all 39 through their native list commands. Claude reports
11 enabled family plugins, Codex reports 9; their reported versions match the
current source pins. Listing, file readability and successful model use are
separate observations. Native task quality, full-session prompt size, cache
benefit and billed savings remain **NOT_RUN / unknown**.

This packet made no provider call, configuration apply, authentication edit,
installation or hosted test dispatch. It ran local version/list/help commands,
read metadata and instruction files, and used Pi's read-only skill loader and
formatter. Instruction text, skill bodies and credentials are not persisted in
the evidence: only allowed metadata, lengths and hashes. A host may maintain its
own ordinary command cache; no machine configuration mutation was requested.

## Native and readable layers

| Host | Actual version | This snapshot proves | What it does not prove |
|---|---|---|---|
| Claude Code | 2.1.296 | `claude plugin list --json`: 49 registered plugins; 11 family plugins enabled, versions match pins. File inventory finds 39 family skill files in installed-plugin roots and no direct family copies in `~/.claude/skills`. | Native skill list rendered into a model prompt, trigger behavior, plugin skill override support. |
| Codex CLI | 0.162.1 | `codex plugin list`: 9 family plugins installed/enabled, versions match pins; shared roots readable 39/39. Config parses, 459 disabled skill entries include 29 family paths. | Disabled shared files being natively invocable; which cached version this conversation loaded. |
| Gemini CLI | 0.63.0 | `gemini skills list`: 499 enabled, 0 disabled, family 39/39. | Auth success, model invocation, scenario completion. |
| OpenCode | 1.18.10 | `opencode debug skill`: valid JSON, 536 entries, family 39/39. | Debug content being eagerly loaded into the model prompt or semantic routing quality. |
| Hermes | 0.21.4, upstream a928a959 | `hermes skills list`, COLUMNS=240: 549 enabled, 0 disabled; full family names 39/39. | Newer Hermes behavior or execution quality. Installed binary remains 0.21.4, irrespective of newer package availability. |
| Pi | 1.1.0 | Controlled native `loadSkills` with both user roots: 499 skills, family 39/39; formatter measured below. Shared root carries all 39; legacy root has 38, missing skill-search. | Full DefaultResourceLoader/session state, package/extension resolution, model behavior. Those were deliberately not invoked. |
| Kimi Code | 2.1.1 | Binary version and shared family files 39/39. | Native listing/activation: NOT_RUN. |
| Cursor agent | 2026.09.02-c22c1a3 | Binary version, shared family files 39/39, routing rule file exists. | Cursor IDE compatibility or native listing/activation: NOT_RUN. |
| Continue | version not measured | Copied skill files in `~/.continue/skills`: 39/39. | Native host discovery or task behavior. |

The source package is 1.61.0; this is **source version**, not a new installation
receipt. Compared with [the previous report](../../reports/2026-10-12-coding-agent-compatibility/README.md),
the Pi global AGENTS.md now exists and contains the router block. Four family
plugin versions are now task-pipeline 1.93.3, agent-sync 1.22.1, make-skill 0.31.1
and agent-stack 0.27.1. The JSON records the complete pin/version comparison.
The previous report's model NOT_RUN boundary still applies; this does not close
provider/native quality acceptance.

## Measured size surfaces, not token estimates

| Measured surface | Characters | Meaning |
|---|---:|---|
| Shared installation, 499 names + descriptions | 216,415 | 7,332 name characters + 209,083 description characters parsed by the hub; filesystem metadata. |
| OpenCode native debug list names + descriptions | 229,329 | 8,031 + 221,298; 536 entries returned by the host. |
| OpenCode full debug stdout | 5,631,149 | Includes 5,191,344 characters of skill bodies. Returning this whole debug output to an agent is unnecessary for a count/version audit. It is not evidence of startup prompt size. |
| Pi native formatter, controlled 499-skill input | 308,638 | Actual `formatSkillsForPrompt` output, 313,751 UTF-8 bytes; 4 skills exclude model invocation. This is a controlled renderer measurement, not a full session capture. |
| Complete hub filesystem catalogue | 1,108 unique realpath files | Includes multiple hosts, installed plugin roots and cached versions; not 1,108 active skills in one host. |

Counts from Node use UTF-16 code units; Python native-command stdout lengths use
Unicode code points. The JSON labels their provenance. No character-to-token
conversion, percentage savings or quality equivalence is inferred. Different
metadata parsers produced slightly different description lengths for Pi and the
hub; these numbers are not interchangeable native prompt estimates.

Claude's inspected settings have 417 `user-invocable-only` skill overrides. No
explicit listing budget/max-description or tool-search environment override was
present in that file. Codex has no explicit `skills.max_context_tokens` or
`tool_output_token_limit` there. Absence in one file does not identify effective
runtime defaults or overlays. The [fresh official-source research](../../reports/2026-10-13-skill-discovery-efficiency/README.md#verified-upstream-contracts)
explains why Claude plugin skills and Codex disabled skills must not be conflated
with explicit-only skill policy.

## Always-on instruction duplication

| File | Full characters | Router block characters |
|---|---:|---:|
| Global Claude CLAUDE.md | 39,725 | 17,477 |
| Global Codex AGENTS.md | 31,672 | 17,477 |
| Global Gemini GEMINI.md | 26,460 | 17,477 |
| Global Pi AGENTS.md | 17,478 | 17,477 |
| Global Cursor rule | 17,657 | 17,477 |
| Completion worktree CLAUDE.md / AGENTS.md | 4,831 / 258 | absent / absent |
| Original checkout CLAUDE.md / AGENTS.md | 4,531 / 258 | absent / absent |

All five global router blocks have identical SHA-256. They serve different hosts;
this is **not** proof that one session receives five copies. Neither measured
project entry file has that block, so this repository provides no evidence for
duplicated global-plus-project routing blocks. Other sections may overlap in
meaning; a semantic or effective-prompt trace was not performed. Do not delete a
host's block merely because another host has the same bytes. The JSON contains
hashes and lengths only, no private instruction content.

## Measurement correction: successful CLI exit can still give an incomplete list

Initial captured pipes returned truncated native stdout: OpenCode exit 0 with
64,738 characters and invalid JSON; Gemini exit 0 with 108,645 characters and only
17 family name mentions. Repeating to an owned regular temporary file produced
complete parseable OpenCode JSON and all 39 Gemini family entries. The observed
capture-method difference is recorded; an internal CLI buffering cause has not
been traced. Hermes's default table truncated two long family names; a wider
COLUMNS setting preserved them. Counts must come from complete parsed output,
not substring hits, table ellipses or exit code alone.

## Existing expensive startup probe and safe next evaluation

The separate parent [provider-probe.json](provider-probe.json) records 187,709
cache-creation input tokens and USD 1.50376 of reported list-price usage for a nominal USD 0.10 Claude probe,
ending in `error_max_budget_usd`. This packet did not repeat that call. The model
usage object and top-level zero usage fields must not be flattened into a false
zero-cost result. This observation does not attribute cost to skills, MCP,
instructions or hooks: a prompt-section trace is missing. The CLI's budget flag
did not act as a pre-request hard ceiling for that observed first call.

The next evaluation should be a bounded experiment, not another default launch:

1. Freeze exact host/model versions, fixtures, source pins, enabled capabilities
   and per-layer context receipts. Use available local context evidence, then one deliberately small subscription
   request as an admission measurement. Exact pre-request token visibility is
   not a prerequisite or a new approval gate; record what remains unobserved.
   A nominal CLI dollar flag alone does not prove a hard per-request ceiling.
2. Use an isolated project fixture and a deliberately selected configuration
   surface. Current `claude --help` exposes `--setting-sources`, `--strict-mcp-config`,
   `--tools`, `--disable-slash-commands` and `--bare`; verify their combined effective
   context before evaluating. `--bare` changes authentication: OAuth/keychain are
   not read, so it is not a drop-in command for an existing logged-in account and
   must not borrow another project's key. Help availability is not a tested arm.
3. Compare one change at a time: controlled baseline, concise descriptions,
   core-plus-complete-search, then any retrieval change. A no-skills control can
   isolate skill overhead but is not the acceptance baseline for production
   quality. Preserve router decisions and required evidence in every candidate.
4. Use bilingual routing cases, rare hidden skills, multiple required skills,
   refusal/authority boundaries and artifact correctness checks. Require the
   intended skill to be reachable and the final artifact to satisfy its contract.
   Measure wrong selection, missed selection, rereads, tool output, retries,
   parent/child usage, cached/uncached input, output, latency and actual cost.
5. A separate verifier evaluates the frozen artifacts and original objective.
   Only an accepted paired quality/cost result justifies rollout. Until the bounded experiment runs, native quality stays NOT_RUN; metadata reduction
   alone cannot close the operator's “same quality, lower total cost” objective.

Immediate engineering opportunity already supported by measurements: local tools
should parse large native debug lists and return bounded metadata plus a durable
artifact reference. This avoids sending megabytes into an agent conversation
while preserving auditable raw hashes and completeness checks. It does not
require removing skill knowledge or claiming lower provider billing.

## Validation and handoff

JSON parses; all family list cardinalities, pin comparisons, numeric table values
and relative artifact links were checked mechanically. Exact hashes, versions,
command exit codes and time stamps are in the JSON. Raw instruction bodies and
full skill/debug outputs were intentionally not tracked. No new provider/model
acceptance result exists.

Next parent task: publish the superseding B-148 compatibility cut from this
snapshot, retain the native/runtime NOT_RUN fields, and add the bounded context
admission/evaluation arm to the completion plan. B-148's measurement/report work
can progress independently of model/provider acceptance.

Skills applied: project-reports (durable snapshot shape), evidence-docs (claim
boundaries and receipts), make-skill and openai-docs (the linked official contract
research). No new skill construction or global configuration apply occurred here.


## Addendum: minimal subscription-preserving evaluation arm

Researched 2026-10-13 after the snapshot above. **Proposed, not executed.** The
operator already authorized bounded subscription evaluation; this is a concrete
1–3-request experiment under that authority, with no new permission requirement.
The original host snapshot counts are unchanged.

A read-only `claude auth status` check returned exit 0, `loggedIn: true`,
`authMethod: claude.ai`, `subscriptionType: team`, `apiProvider: firstParty`.
No API-key/auth-token/base-URL/third-party-provider override or SIMPLE variable
was set in the child process environment. Only these allowed fields and presence
booleans were recorded; identity fields and credentials were omitted.

### Documented controls and limits

- **Preserve normal OAuth.** Do not pass `--bare` or set `CLAUDE_CODE_SIMPLE=1`:
  both explicitly skip OAuth/keychain credentials. The similarly named
  `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` only chooses shorter default prompt text and
  keeps the normal features; it is not needed when supplying a replacement prompt.
  Set `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` and a requested output ceiling with
  `CLAUDE_CODE_MAX_OUTPUT_TOKENS`. Current 5.5 models cannot disable thinking;
  `--effort low` is a bounded smoke-test choice, not a quality-preserving assertion.
  [Official environment reference](https://code.claude.com/docs/en/env-vars).
- **Use session settings.** `--setting-sources project,local` omits user settings
  from the selected file sources; `--settings` overrides the remaining ordinary
  files for this run. It does not bypass managed policy. An empty isolated fixture
  directory keeps project/local settings under our control without copying auth
  into another HOME. [Settings precedence](https://code.claude.com/docs/en/settings).
- **Suppress optional instruction sources explicitly.** `autoMemoryEnabled:false`
  and `claudeMdExcludes:["**"]` remove ordinary auto-memory and matching instruction
  files, including AGENTS fallback/imports. Exclusion patterns match absolute
  paths; managed instruction policy remains. Replacing the system prompt alone
  is not evidence that separately attached instruction files disappeared.
  [Memory and instruction controls](https://code.claude.com/docs/en/memory).
- **No ordinary hooks or MCP.** `disableAllHooks:true` supplied through `--settings`
  overrides project/local hooks; managed hooks remain governed by managed policy.
  `--strict-mcp-config` plus an explicit empty server map requests no normal MCP
  configuration. Record the actual init event rather than assume no inherited
  managed server. [Hooks reference](https://code.claude.com/docs/en/hooks),
  [MCP configuration](https://code.claude.com/docs/en/mcp).
- **No skill catalog or executable tools.** The CLI documents disabling skills,
  restricting built-in tools to an empty set, replacing its default system prompt,
  limiting agentic turns and omitting session persistence. These are separate
  controls; `--tools ''` alone does not remove MCP. All corresponding switches
  are present in local 2.1.296 help or the official reference. Their combined
  runtime effect remains the subject of request 1.
  [CLI reference](https://code.claude.com/docs/en/cli-reference).
- **Keep the authentication route observable.** In print mode an inherited API
  key takes precedence over subscription login. This process had no such key;
  preserve the existing normal config/keychain and inspect sanitized auth status
  for the evaluation process. No login, logout, token extraction or auth-file copy
  is part of this recipe. [Authentication precedence](https://code.claude.com/docs/en/authentication).

### Proposed first request

Run from a new owned fixture directory containing no project instructions or
settings. Keep the ordinary HOME/config/keychain. Supply only synthetic text.
This command is a proposal and was **not run** by C09:

```sh
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 CLAUDE_CODE_MAX_OUTPUT_TOKENS=1024 \
claude -p --model claude-opus-5-5 --effort low \
  --setting-sources project,local \
  --settings '{"disableAllHooks":true,"autoMemoryEnabled":false,"claudeMdExcludes":["**"],"disableClaudeAiConnectors":true}' \
  --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --tools '' --disable-slash-commands --no-session-persistence \
  --max-turns 1 --max-budget-usd 0.25 \
  --system-prompt 'Evaluate only the supplied synthetic fixture. Return the requested JSON. No tools, external facts or side effects.' \
  --output-format stream-json --verbose \
  'Return {"ready":true}.'
```

Capture stdout to a regular file, then locally select the init tool/skill/MCP
counts, auth/model metadata, final usage, errors, duration and result. Keep full
logs local unless checked for private context; commit sanitized metadata and
synthetic fixture hashes. Do not use resumed sessions or an automatic retry loop.
A turn limit bounds agentic rounds, not transport retries or every possible
internal request. The budget and output flags are additional bounds, not proof
that the first request cannot exceed their nominal dollar target.

Request 1 tests startup control and normal subscription authentication. If it
shows unexpected inherited tools/instructions, a wrong auth route, or more than
10,000 total input tokens (uncached + cache write + cache read), end this small
experiment after that result and fix the observed cause in the next wave. This
is a finite experiment stop rule, not a request for new approval. A missing
perfect prompt trace does not prevent the initial controlled request.

If request 1 is clean, requests 2 and 3 compare the same frozen bilingual routing
fixture with, respectively, full and concise descriptions supplied directly in
the input. Keep all required routing rules and expected IDs identical. Use one
small corpus, one completion per variant, no tools or native skill discovery.
Score expected selections, false positives, JSON validity and instruction-boundary
cases; capture total usage and list-price cost. This measures explicit-corpus
routing only. It cannot certify native skill triggering or final development
quality; those need later bounded arms with the relevant capabilities restored.

### List-price planning envelope

The current official Opus 5.5 standard rates are USD 4/MTok input, 20/MTok output,
5/MTok five-minute cache write and 8/MTok one-hour write. For a **scenario** of
5,000 input tokens and at most 1,024 output tokens, charging all input at the
higher cache-write rate yields USD 0.06048 per request, or USD 0.18144 for three.
At 10,000 input tokens the same three-request arithmetic is USD 0.30144. These
are transparent planning scenarios, not estimates inferred from character counts,
not a hard ceiling and not a subscription invoice. The measured `costBasis:list`
usage is the comparable counter; actual subscription billing/allowance behavior
must remain distinct. [Official pricing](https://platform.claude.com/docs/en/about-claude/pricing).

The previous probe's numbers also reconcile at list rates:
187,709 × 8/1,000,000 + 2 × 4/1,000,000 + 104 × 20/1,000,000 = 1.50376.
That arithmetic explains the reported amount, not which context source produced
the cache-write tokens. No causal attribution to skills, instructions or MCP is
made without evidence.
