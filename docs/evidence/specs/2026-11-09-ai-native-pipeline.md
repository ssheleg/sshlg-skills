# AI-native products: the family's design order, the pipeline it changes, and thirty tasks walked through it

report: ai-native-pipeline · owner sshlg-skills · cut 2026-11-09 (v2, after the adversarial review in §11) ·
status: design, stages 2-3 of the run `2026-11-09-ai-native` · brief
[`../briefs/2026-11-09-ai-native.md`](../briefs/2026-11-09-ai-native.md) · plan
[`../plans/2026-11-09-ai-native.md`](../plans/2026-11-09-ai-native.md)

Read at: hub `f33ad12c`, task-pipeline `c4c170b` (1.103.1), super-ux `6ad8d7a` (0.66.3), agent-stack
`069e803` (0.31.4), sheleg-dev `9c219ea` (0.16.3), fabric-workspace `knowledge/principles.md`,
`knowledge/agents-first.md`. MCP revision `2026-07-28`, confirmed current on 2026-11-09 against
`modelcontextprotocol.io/specification/versioning` (stage 1). Every `file:line` below is at those heads.

## 1. What the operator asked for

Products are now **AI-native**: agents use them as people do, and **every function must be available to
agents**. People may get less, so they do not drown in information. The design order becomes **customer
journey, user stories, jobs to be done → agent capabilities, the API and the logic → only then the
interfaces**, and a human interface is designed where a person is needed; everything else may be
automation. The whole pipeline changes; the run is slow and deliberate: how the pipeline changes, which
scenarios appear, many tasks walked through it, bottlenecks found and fixed. (Verbatim words in the brief.)

## 2. What the family does today (measured)

| Finding | Evidence |
|---|---|
| Every router assumes a person is the consumer; super-ux excludes "interface-free" work, so an API- or MCP-only product sits outside the router that decides what a product must do. | hub `lib/routers-registry.js:38-48`, `:43-44`; table cells `:271-272` |
| The super-ux chain is vision → foundation (P, JTBD, JRN, ST) → flows → **screens** → scenarios; the installed hard rule says "Do NOT write interface code until … foundation → flows → screens → scenarios … mocked up in Figma". | super-ux `skills/references/scenario-format.md:41-46`; `templates/claude-rule.md:7-20`; `ux-design-principles.md:24-38` |
| No non-human actor exists in the product model; every `agent`/`bot`/`MCP` hit in super-ux is about the coding agent running the skill or about Figma tooling. | two case-insensitive greps over SKILL.md files, references, templates (recon) |
| A scenario step is "user action → observable system response" with a `UI elements` list; PASS in the audit is "every listed UI element exists and is wired". The linter reads a scenario's Expected result, Coverage and Status (U060, U063) but never requires `UI elements`, so a screenless scenario passes; only `U050` fires, even with no `screens.md`. | `scenario-format.md:613-656`, `:808-810`; `ux_lint.py:413-440`, `:1266` |
| task-pipeline asks one question, "does this touch a user-facing surface (web/mobile/CLI/TUI)?", and a yes arms the UI chain: `surface_class`, the stage-3 UX track, COPY ∥ VISUAL, the director record, design-tester, the fourth `visual` tier, browser checks at 6/8/10. | `stage-00-intake.md:151-172`; `graph.py:647-656`, `:716`; `design_gate.py:44-52` |
| No doctrine designs a surface **for agents**: no contract-first order, no error vocabulary, no delegation scopes, no parity rule, no agent-executed test. A CLI counts as a human `internal` surface. | greps `contract-first`, `agent surface`, `error vocabular`, `delegat` (recon); `stage-00-intake.md:152,164` |
| The only contract design is dossier §4 "Contracts in and out", for platform modules only, before §7 "UI / Figma". | `spec.md:194-208` |
| agent-stack is wired at stage 5 only, and only when "the thing being BUILT is an agent system". | `companion-skills.md:81`, `:276-281` |
| agent-stack owns the tool contract, the wire, delegation, `approval/1`, one refusal vocabulary, the five human gates and the audit row; it has no product-level layer (no parity, inventory, per-capability gate, agent docs, keys/quotas/sandbox for outside agents, or eval that an agent completes a user's job). | `agent-harness/references/tools.md:24-178`; `agent-interop/references/mcp.md:89-260`; `gateway.md:123-277`; `agent-orchestrator/references/governance.md:115-131` |
| agent-interop contradicts itself on who owns one server's tool design. | `agent-interop/SKILL.md:6-7` vs `:142-144` |
| PassionCode doctrine already says half of it ("Every product exposes what it does as MCP tools … The interface is for seeing and small corrections"; "Human gates stay human"), with no design order, no parity check, PassionCode products only. | fabric-workspace `principles.md:5-13`, `:77-85`; `agents-first.md:16-31` |

**Diagnosis:** the family designs a product as *screens with a backend*; the agent surface, when it exists,
is whatever the screens happened to need. The operator's order inverts it: the product is *capabilities
with a contract*, and a screen is one client of it, built where a person is needed.

## 3. The canon (AN-1 … AN-10), each rule with one owner

Each rule is **stated once, in its owner's file**; every other member cites the id and a raw-URL fallback
(the make-skill pattern for a companion that may not be installed).

| Rule | Statement | Owner (home file) |
|---|---|---|
| **AN-1 Parity by story** | Every `must`/`should` story a person can complete, an agent can complete through a documented surface (MCP preferred; a CLI with machine output or an HTTP API accepted), **acting and being notified**; the exceptions are named per capability (presence, legal, recorded debt). Parity is by story, not by endpoint: "a few thoughtful tools" (`tools.md:24-37`) still holds. | super-ux `scenario-format.md` (v5 section) |
| **AN-2 Design order** | Stories → capabilities → contract → logic → automation → human surfaces → look and words. A capability found while designing a later layer flows back up into `capabilities.md` in the same change; a function that exists only in a screen is a defect ("UI-only function"). | super-ux `system-map.md` |
| **AN-3 One contract, many clients** | The human interface calls the same contract the agents call. Mechanical proxy: the set of operations the frontend invokes is a subset of the agent surface, or each is marked `internal` with a reason (a sync transport, a render-only endpoint). | agent-stack `agent-interop/references/agent-surface.md` |
| **AN-4 Why a person, two scales** | **Gate** (blocking; the contract returns a typed refusal): `body` (sign-in, one-time code, consent screen, payment or top-up, typed secret, org-admin consent), `approval` (a decision recorded as a person's, or an effect over a policy limit; on an internal product only with a recorded operator decision), `legal` (the law requires a person: an automated decision with significant effect, KYC, e-signature). **Serving reason** (a screen beside the agent path): `oversight`, `exception-queue`, `trust`, `presence`, `audience`, `manual`, `taste` (trial mode only, per the operator's 2026-11-08 rule). Every value cites its evidence: a `JTBD-`/`ST-`/research id, a policy, a decision, or the typed error that routes to the queue. No product-level waiver exists. | super-ux `scenario-format.md` |
| **AN-5 The attention budget** | A person's surface shows decisions, exceptions and outcomes first; the payload an agent receives sits behind a details step. A screen that mirrors an agent payload is a design-review finding, including under `oversight`. | super-ux `ux-design-principles.md` |
| **AN-6 Automation by default** | A capability with no gate and no serving reason and a determinable trigger is an automation; every automation is callable, observable and stoppable by an agent and a person, and records what it did. Not where AN-4 `legal` applies. | super-ux `system-map.md` |
| **AN-7 The gate protocol** | A gated call is refused with a typed error naming the gate and carrying `human_steps` (a direct URL and the action's digest) or, for a value the caller can supply, MCP `input_required` (revision 2026-07-28 multi round-trip). The agent prepares everything, the person performs only the gate, the agent continues. `confirm: true` is a syntax guard, never an approval (`tools.md:127-133`). | agent-stack `agent-surface.md` |
| **AN-8 A safe surface** | Per-client, scoped, revocable credentials (OAuth 2.1 / MCP authorization with consent for outside agents; the Fabric T0/T1/T2 profile, `gateway.md:137-193`, is one binding); an agent's scope never exceeds its principal's role; effect classes from `gateway.md:191` declared in the contract; an idempotency key on every write; a dry-run or sandbox; an audit row with the actor chain; untrusted content marked in results; rate and spend limits naming their window; a tool is never renamed (deprecate with a sunset date and a replacement, as analytics events are). | agent-stack `agent-surface.md` |
| **AN-9 Discoverable and proven** | Findable (`AGENTS.md` with the registration command and one proving call; an `llms.txt` pointer is seo-llmo's), and proven at two levels: (1) **the gate**: a deterministic proving call through a real client (local stdio where nothing is deployed) plus contract tests per capability; (2) **the judgment**: a cold agent with only the published docs completes the agent-channel scenarios of the `must` stories, `pass^k` over k runs, gated steps closed by sandbox fixtures (an approver that signs, a payment test mode, a magic-link sink). | mechanics: agent-stack `agent-evals/references/operability.md`; in the pipeline: task-pipeline |
| **AN-10 Telemetry knows the actor** | Usage events carry `actor` (human, agent, automation), `on_behalf_of` and `client_id` as properties, never by renaming an event; agent traffic is excluded from human experiment results. | the analytics agent's catalogue guidance: ssheleg/sshlg-analytics-agent `docs/guidance/events.md`, rules 11 and 12 (commit `603d880`, taken 2026-11-12, B-333) |

**When the canon is armed.** By a **capability change** (a capability added, removed, or its behaviour,
actors or gate changed) **or a contract change** (a schema, error code, effect, tool description or error
body that agents read; a data migration that changes what a read returns). The stage-0 answer is a
**forecast**; at stage 7 a contract snapshot diff (MCP `tools/list`, an OpenAPI diff, `--help --json`)
re-decides it, and a non-empty diff on a task forecast `no` fails the stage and re-classifies the task. Not
armed: a visual or human-copy change, a refactor whose snapshot diff is empty, infrastructure.

## 4. The new chain (super-ux contract v5)

| # | Layer | Artifact | IDs | What changes |
|---|---|---|---|---|
| 1 | Vision | `docs/ux/vision.md` | §1-§9 | §4 "the person's role" and §9 "alignment test" guidance gain AN-1/AN-4 ("can an agent do this without a screen?"); section count unchanged (U030/U034/U076 keep working) |
| 2 | Foundation | `docs/ux/foundation.md` | `P-NN` (+ `Agent use: none \| some \| most`, with evidence), **`A-NN` actors** (Kind `agent \| system`, `Acts for: P-NN`, the grant it holds), `JTBD-NN` (jobs stay with people), `JRN-NN` (+ a `Performed by` column holding `P-`/`A-` ids; the journey's `Owner:` stays), `ST-NNN` | personas and actors are separate lists |
| 3 | **Capabilities** | `docs/ux/capabilities.md` | `CAP-NN` | **new**, row below |
| 4 | **Contract** | a schema-first source committed at stage 3 (tool definitions with `inputSchema`/`outputSchema`/annotations, an OpenAPI file, or a CLI spec), which the code validates against or is generated from; a generated **snapshot** (`tools/list`, OpenAPI, `--help --json`) is what lints read | tool ids | **new**; doctrine in agent-interop |
| 5 | Logic | the spec (task-pipeline stage 3) | `REQ-` | after the contract |
| 6 | Automation | `CAP-NN` `Automation:` | none | trigger, schedule, kill switch |
| 7 | Human surfaces | `flows.md`, `screens.md` for human lanes | `FLW-NN`, `SCR-NN` (+ `Fronts: CAP-…`, `Why human: <serving reason>; <evidence>`) | flows gain actor lanes |
| 8 | Scenarios | `scenarios.md` | `SCN-NNN` (+ `Channel: agent \| human \| both`) | agent steps: `A-NN → tool → observable response`; `UI elements` required only on a human channel |
| 9 | Look and words | sheleg-design; `docs/brand/`; tool descriptions in the contract | none | tool descriptions and agent-facing error bodies follow `tools.md`; `human_steps` text a person reads goes through copywriting |

The layer order is the **design** order. The stage table (§6) fills them in this order inside stages 2-3;
agent scenarios are written beside the contract at stage 3 because they are the contract's acceptance
tests.

### The `CAP-NN` row

```markdown
### CAP-07: Cancel a subscription
- **Traces:** ST-012
- **Actors:** human, agent                 <!-- human | agent | automation; agent absent → Agent excluded -->
- **Agent excluded:** none                     <!-- presence | legal | debt (BOARD-ID); with evidence -->
- **Roles:** owner, billing-admin           <!-- principal roles; an agent never exceeds its principal -->
- **Gate:** none                            <!-- none | body | approval | legal; with policy or evidence -->
- **Tools:** billing_subscription_cancel    <!-- ids resolved against the contract snapshot -->
- **Emits:** subscription.cancelled         <!-- events/notifications an agent can subscribe to, or none -->
- **Data:** payment                         <!-- public | internal | personal | payment | secret -->
- **Automation:** none                      <!-- or: trigger; schedule; kill switch -->
- **Human surface:** SCR-09; Why human: manual (JTBD-03 evidence RE-04)
- **Since:** v1                             <!-- contract version that introduced it -->
- **Status:** specified                     <!-- proposed | specified | exposed | deprecated (sunset, replacement) | retired -->
```

Effect classes, idempotency and limits are **not** repeated in the row: the contract declares them
(annotations and `_meta`), and the lint reads them from the snapshot. Refunds are a separate capability
(`CAP-08`, Gate: approval over the policy limit), because one row is one effect set. Parity debt is
`Agent excluded: debt (B-nnn)`, listed and on the board, never hidden.

## 5. Who owns what

| Question | Owner | Change |
|---|---|---|
| what the product must do, for people and for agents: personas, actors, jobs, stories, capabilities, gates, serving reasons, parity at the story level | **super-ux** | contract v5: actors, `Agent use`, `capabilities.md`, `Channel`, `Fronts`/`Why human`; lint rules (warnings under v5); doctor v5; `/ux` asks the Figma question when the first human surface is designed |
| how a product's agent surface is built: contract source and snapshot, gate protocol, safety, credentials for outside agents, discovery, CLI readiness, outbound events | **agent-stack**, inside **agent-interop** (`references/agent-surface.md`); not a new skill | agent-interop's description reworded at equal length; the tool/wire ownership contradiction fixed (tool shape: agent-harness `tools.md`; the wire and the product surface: agent-interop) |
| proving that an agent completes a story through the product's tools | **agent-stack agent-evals** (`references/operability.md`) | new reference; task-pipeline's agent-tester runs it |
| how a change reaches the repository, in which order, with which checks | **task-pipeline** | §6 |
| look, human text, discoverability, charging | sheleg-design, copywriting, seo-llmo, sheleg-dev | member doctrine notes only (§8 BN-8, BN-18); no routing text change for these four |
| PassionCode/Fabric specifics | fabric-agent-adapter | agent-surface cites `building-fabric-services` for `fabric-service/0.1`, dashboards and `onboard` |

**Why not a new skill or router** (measured, §10): a new skill adds ~250-300 characters to the family
description total, a ratchet that "may fall, never rise" (hub `test/validate.py:2631`, DOCMAP marker
11452); a new router breaks `names.length === 15` and owes a paired routing eval (DOCMAP:274), the cost that
refused the accessibility router (`lib/packs.js:104-115`). agent-interop already owns "everything the loop
reaches that is not in its process" (`agent-interop/SKILL.md:12-14`); a product's agent surface is exactly
that.

## 6. The pipeline after the change (default profile; stage numbers unchanged)

`plan_audit.py:47` hardcodes `range(11)`, `test/stage_routes.py` lists eleven stage files, `validate.py`
cross-checks them; so the change is an **order inside** stages 2-4 and new checks at 0, 6, 7, 8, 10.

| Stage | Today | After |
|---|---|---|
| 0 Intake | "does this touch a user-facing surface?" → `surface_class` | **Actor branch** (forecast): `capability_change`, `contract_change`; on either, `agent_surface: public \| internal \| library \| none` (none only when the product has no capability an agent could use, with the reason); actors; the human surfaces with their serving reasons; `surface_class` per human-surface node. Short-path answer 3 widens to "a user **or an agent** observes". A product with no agent surface yet: the **skeleton** (auth, refusal vocabulary, audit row, health, snapshot) is split out as its own R3 item ranked first (intake split §5), the feature's capability rides on it in the same run when the brief's budget allows, else ships as `debt` with the skeleton row on top of the board. The inventory of the rest of the product is a `project-audit` run proposing board rows, never this task's work. |
| 1 Docs study | contracts consumed | + the protocol revision the surface speaks, fetched (MCP versioning page; OpenAPI version) |
| 2 Brainstorm | design, UI verdict, user paths as screens | **capability map first:** REQ → stories → `CAP` rows (actors, roles, gate, emits, automation, human surface or none); agent paths as call sequences with states (pending, partial, denied, async job) and typed errors; gate adds "every `CAP` has `Tools` or `Agent excluded`" |
| 3 Spec | super-ux chain → COPY ∥ VISUAL → spec | `foundation → capabilities → contract source + agent scenarios → logic → { human flows/screens/scenarios → COPY ∥ VISUAL }`. Dossier §4 is owed by every capability or contract change; §7 only where a human lane exists. agent-tester **pass C** reads the contract source cold (does the description alone let a model choose the right tool and fill it) |
| 4 Plan | packets, SCR traces | contract and logic nodes first; a UI node is `blocked_by` the contract node it consumes and the edge names the contract version; packets carry `CAP-` traces |
| 5 Dev | TDD per task | TDD starts at the contract: a failing contract test per `CAP` (schema, typed errors, idempotent retry, scope refusal); the UI is built as a client of that contract |
| 6 Tests | suite, browser, contact sheet | + the **proving call** through a real client (stdio or the dev deployment) and the contract tests: an **auto** gate; + parity (ux-lint v5 structural, `/ux-audit` static incl. the AN-3 proxy); + agent-tester **pass B**, a **judgment** gate owed on R3 nodes and on `public` surfaces: Sonnet 5.5 (the operator's verification model) as the full-grant persona, `pass^k` with k = 3, transcripts kept as fixtures, spend cited from the brief; a cheap-model and an adversarial (injected-content) persona advisory, the adversarial one owed on `public` |
| 7 Lint + deploy | lint, suite, go | + snapshot diff re-decides the forecast; schema lint; tool-description lint; for a CLI: `--json`, exit codes, non-interactive flags |
| 8 Post-deploy | "opened, not curled" | + **"called, not curled"**: against the deployed target, discovery (`server/discover` or the OpenAPI document), the tool list equals the snapshot, one read-only call, one typed-error probe |
| 9 Docs + wiki | docs, wiki, graph | + `AGENTS.md` capability list **generated** from `capabilities.md` and the snapshot; the event catalogue only when events changed |
| 10 Acceptance | ladder, REQ table, contact sheet | + a `C→B` row (contract to behaviour) and the parity matrix: every touched `CAP` is `exposed`, or `Agent excluded` with its evidence or its board row |

**Risk.** R3 when the contract **breaks** (removal, rename, narrowed input, widened effect) or the auth or
effect ceiling changes; an **additive** change within a contract version is R2. The skeleton is R3.

**Certification.** A fifth reading, the **`agent` tier**, is owed by a node with `agent_surface: public`
or `internal`; it **executes** the proving call and the contract tests against the node's build and reads
the pass-B report where one is owed. Not folded into the seam tier, which reads static callers
(`verifier-seam.md:42-56`). `library` owes no agent tier: types, docs and doctests are its proof.

**agent-tester.** Panel in `docs/ux/agent-panel.md` (super-ux v5; the human `test-panel.md` and
`design_gate.py panel` stay untouched): a full-grant agent, a narrowly delegated agent, an automation with
no conversation, a cheap model, an adversarial agent fed injected content. Checks per step:
`discoverable`, `schema_valid`, `typed_error`, `idempotent_retry`, `auth_denied`, `gate_handoff`,
`outcome_read_back`, `notified` (an `Emits` event arrived). Report `agent-review/1`.

**When it runs, under the operator's CI policy** (complete hosted checks nightly at 23:00 Europe/Warsaw;
no full suite per push): the proving call and contract tests run locally in the stage-6 gate and in the
nightly run; the LLM pass B runs once per R3/public node in the run and nightly on `main`, never per push.
The test-tenant credential comes from an Observatory door (`use_secret.py run --vault-only`), never a file.

**What does not change:** the kernel, the REQ spine, the loop guard, the finish line, the stage numbers,
`surface_class` and its visual gates for human surfaces, the short path, the entry from super-ux (it also
adopts `capabilities.md`). The new node fields are optional; absent means nothing owed. task-pipeline
branches on the **presence** of `docs/ux/capabilities.md`, never on a contract version number.

## 7. Thirty tasks walked through it

These are **thought walks**, not executed runs; the pilot (§9, wave 2) is the first executed one. T1-T15
were written with the design; N1-N15 were the reviewer's, and each changed the design (the change is in
the last column).

| # | Task | Armed? | Actors · gate · human surfaces | Finding → design change |
|---|---|---|---|---|
| T1 | Greenfield: track a team's SaaS subscriptions | yes | owner P-01 (`Agent use: most`), A-01 owner's coding agent, A-02 mail importer; cancel gated `approval` over limit; pay `body`; human: spend overview (`oversight`), approvals inbox (`exception-queue`), onboarding (`trust`) | the Figma question at `/ux` init fires for interface tasks (`commands/ux.md:18-20`) → ask it when the first human surface is designed (BN-7) |
| T2 | CSV export in a product with no agent surface | yes | export agent-allowed | skeleton split out as R3, ranked first; inventory → project-audit (BN-2) |
| T3 | Payment webhook bug | snapshot diff decides | automation | empty diff → nothing owed; a non-empty diff re-classifies (BN-3) |
| T4 | Landing page | no (human copy and look) unless "start trial" changes | trial start `body` (consent) with `human_steps` | `llms.txt` stays seo-llmo; `AGENTS.md` is agent-surface (BN-8) |
| T5 | Telegram bot: invoice reminders and pay | yes | reminder = automation; pay `body`; chat = `manual` | product capabilities get the agent surface; the chat stays a human channel (BN-16) |
| T6 | Mobile onboarding redesign | depends on `Agent use` | consumer P-01 `Agent use: none` → full human onboarding owed; preferences still agent-reachable; camera `presence` | **B1**: audience decides the human path's size, not the canon (BN-23) |
| T7 | Quest game | yes for content, leaderboards, moderation; gameplay `Agent excluded: presence` | | waiver per capability, never per product (BN-3) |
| T8 | Refactor: split billing module | no (empty diff) | | refactor prompts must not route agent work (BN-10) |
| T9 | New agent: review analysis and replies | yes | publish reply `approval` (external product) or delegated (operator's internal agent, per "presses nothing") | three owners in order: super-ux → agent-interop → fabric adapter (BN-1) |
| T10 | Stripe paywall | yes | subscribe `body`; refund separate CAP `approval` | customer's agent vs coding agent money gates (BN-18) |
| T11 | Admin panel | yes | most functions → agent calls; panel → `oversight` + `exception-queue` | `internal` enroll class gets a capabilities-only profile (BN-19) |
| T12 | A CLI (the hub) | yes | `--json`, exit codes, non-interactive | B-07 revisited: `CAP` rows, no screens (BN-20) |
| T13 | `/task-pipeline waves` over 80 rows | per row | | actor answer derived per row, asked only where unreadable (BN-14) |
| T14 | agent-tester finds a bare 500 | yes (contract) | | additive fix R2; the gate is the contract test, the LLM run is judgment (BN-5) |
| T15 | A video ad | not a repository change | | out of scope; Asset Foundry already agent-first |
| N1 | Migration splits `address` into fields | **yes** (contract change) | | **B2** → contract-change trigger + stage-7 snapshot diff (BN-24) |
| N2 | A `viewer` role that cannot export | yes | `Roles:` field; an agent never exceeds its principal | **M6** → `Roles` in the row (BN-25) |
| N3 | Deprecate a tool | yes, R3 | | never rename; sunset + replacement; usage by `actor` before removal (AN-8) |
| N4 | Price change / new tier | yes if entitlements move | gate thresholds cite a policy, not a price literal | entitlements via `Roles`/plan; thresholds by policy id (BN-26) |
| N5 | Add German | no (human copy) | | `human_steps` localized to the principal's locale; Copylot rule applies |
| N6 | Feature flag at 10 % | yes | | tool list stays stable; a flagged-off call returns a typed `not-enabled`; agents excluded from human experiments (AN-10); the A/B picture rule gets an agent-channel trace instead of a screenshot (BN-27) |
| N7 | Push reminders | yes | automation; delivery to the person = `presence` (their device) | `send` carries audience and blast radius in the contract; `Emits` lets the person's agent receive it (M5) |
| N8 | Weekly email digest | yes | automation + `send` | attention budget applies to messages, not only screens; unsubscribe is a `legal` requirement; `Emits` for agents |
| N9 | An LLM summary feature inside the product | yes | | agent-orchestrator owns the call; the surface returns raw data and the summary; ticket bodies marked untrusted (trifecta) (BN-28) |
| N10 | Outbound webhooks for third parties | yes | | `Emits` + agent-surface's outbound events section: signing, retries, receiver idempotency, citing sheleg-dev's inbound patterns (M5) |
| N11 | Public API v1 → v2 | yes, R3 | | `Since:`; agent-tester and parity name the versions they check |
| N12 | B2B SSO + SCIM | yes | org-admin consent is `body`; agent tokens under the IdP's policy | no family owner for SSO → board row (BN-29) |
| N13 | GDPR erasure and export | yes | erasure `approval` per policy (irreversible); automated decisions with significant effect `legal` (Art. 22) | audit rows keep the actor chain pseudonymised; erasure revokes the person's agent grants (BN-30) |
| N14 | Offline-first notes | yes | | the sync transport is `internal` under AN-3; agents act through the server capabilities; the conflict policy is recorded (BN-31) |
| N15 | Open-source library, no server | yes | | `agent_surface: library`: types, docs, `llms.txt`, doctests; no `CAP` registry required, no stage 8 (BN-32) |

## 8. Bottlenecks and their resolution

| ID | Bottleneck | Resolution | Owner · wave |
|---|---|---|---|
| BN-1 | Two proposed homes for the capability registry | one home `docs/ux/capabilities.md`; agent-interop reads it; any JSON export generated | super-ux · W1 |
| BN-2 | Legacy products have no agent surface | v5 opt-in; skeleton split out as R3 and ranked first; inventory by project-audit | super-ux, task-pipeline · W1 |
| BN-3 | Over-application | armed by capability or contract change only; snapshot diff decides; per-capability waivers | task-pipeline · W1 |
| BN-4 | Routing budget (+22 net on the registry total) | routing change last (W3), measured in §10; only super-ux and agent-stack cells/texts move, paid by trims in the same texts | hub · W3 |
| BN-5 | LLM cold agent is costly and not byte-reproducible | proving call + contract tests gate; LLM run is judgment, `pass^k`, Sonnet, R3/public only, nightly otherwise | task-pipeline, agent-evals · W1 |
| BN-6 | A public surface widens the attack surface | adversarial persona owed on `public`; trifecta flags from `Data`/`Emits`; risk by contract break, not by publicity alone | agent-interop, task-pipeline · W1 |
| BN-7 | Figma question before capabilities | asked when the first human surface is designed | super-ux · W1 |
| BN-8 | Agent-facing text has no owner | tool descriptions and agent error bodies: agent-harness `tools.md`; `human_steps` text: copywriting (a note in copywriting's SKILL, no routing text) | agent-stack, super-ux · W1 |
| BN-9 | Events do not carry the actor | AN-10 request to the analytics agent's owner via the Fabric board | request · W1 |
| BN-10 | Hook routing words | agent-interop advertises surface triggers; `AGENT_BUILD` learns them; fixtures for refactor and use-an-agent prompts | hub · W3 |
| BN-11 | task-pipeline SKILL body near its token budget | doctrine in a new `references/agent-surface.md`; SKILL gets one stage-table cell change; the budget is re-measured at c4c170b in W1, not taken from a dated receipt | task-pipeline · W1 |
| BN-12 | Human test panel read by fixed lines | separate `docs/ux/agent-panel.md` | super-ux, task-pipeline · W1 |
| BN-13 | Nothing checks the attention budget | design-tester check `attention`; doctrine first, lint only if mechanical | task-pipeline · W1 |
| BN-14 | Wave grill would ask per row | derived per row | task-pipeline · W1 |
| BN-15 | In-flight hub B-326 (1.86.2) | hub change rebases after it | hub · W3 |
| BN-16 | Chat bots | product capabilities get the surface; chat is `manual` | doctrine note · W1 |
| BN-17 | Device-local capabilities | `presence` | super-ux · W1 |
| BN-18 | Money gates protect against the coding agent only | AN-7 on the product side; sheleg-dev still wires the charge | agent-interop · W1 |
| BN-19 | `internal` tools skip the capability layer | enroll's `internal` class gets a capabilities-only profile with no required traces | hub · W3 |
| BN-20 | Hub CLI waived the UX chain (B-07) | board row: `CAP` rows for the hub CLI | hub board · W1 |
| BN-21 | agent-interop ownership contradiction | fixed in the agent-stack release | agent-stack · W1 |
| BN-22 | Drift found on the way (`none` surface class; screens template lacks `blocked`; lint's no-docs message) | fixed where a release touches the file, else a board row | members · W1 |
| BN-23 | Users without agents (B1) | `Agent use` on personas; a `none` audience's `must` stories owe a full human path; serving reason `audience` | super-ux · W1 |
| BN-24 | Contract changes slip past a capability trigger (B2) | contract-change trigger; stage-7 snapshot diff | task-pipeline, agent-interop · W1 |
| BN-25 | Roles and tenancy | `Roles` field; principal ceiling (AN-8) | super-ux, agent-interop · W1 |
| BN-26 | Thresholds tied to prices | gates cite a policy id | super-ux · W1 |
| BN-27 | Flags and experiments with agents | typed `not-enabled`; agents excluded from human results; agent-channel trace in the A/B picture rule | agent-interop; growth playbook request · W1 |
| BN-28 | LLM features inside products | agent-orchestrator owns; raw and summary both exposed; untrusted marking | agent-interop note · W1 |
| BN-29 | SSO/SCIM has no family owner | board row (sheleg-dev's sign-in lane is the nearest) | hub board · W1 |
| BN-30 | Erasure vs audit trail | pseudonymised actor chain; grants revoked on erasure | agent-interop · W1 |
| BN-31 | Offline sync breaks AN-3 | sync transport marked `internal` | agent-interop · W1 |
| BN-32 | Libraries | `library` profile | task-pipeline, agent-interop · W1 |
| BN-33 | One capability change touches 6-8 documents | the row is minimal; `AGENTS.md` list generated; event catalogue only on event change; v5 lint names what is stale instead of asking for it all | super-ux · W1 |
| BN-34 | v4 and v5 doctrines coexisting forever | `/ux init` writes v5 for new projects; a v4 project migrates on its first capability task (doctor names the step); task-pipeline branches on the file's presence | super-ux · W1 |
| BN-35 | Approval cards for the operator on internal products | `approval` on an internal product only with a recorded operator decision; default is the agent's delegated act | super-ux · W1 |

## 9. Rollout (reordered after the review)

1. **W1: member doctrine, opt-in.** agent-stack: `agent-interop/references/agent-surface.md`,
   `agent-evals/references/operability.md`, the interop fix. super-ux: contract v5 (actors, `Agent use`,
   `capabilities.md`, `Channel`, `Fronts`/`Why human`, `agent-panel.md`, lint rules as warnings behind
   the v5 marker, doctor v5, templates, the reordered doctrine and hard rule). task-pipeline:
   `references/agent-surface.md`, brief fields, the actor branch, stage 2/3/4/6/7/8/10 text, optional node
   field `agent_surface`, the `agent` tier, agent-tester, the widened short path, companion rows. Each
   member released; routing unchanged. Requests filed: AN-10 to the analytics agent's owner; board rows
   BN-20, BN-29.
2. **W2: the pilot.** One operator product with a live UI and no agent surface runs one capability task
   through the new pipeline end to end, with the skeleton. What it finds becomes W3's rows.
3. **W3: routing.** The hub rewords super-ux and agent-stack within the measured budget (§10), adds
   triggers and fixtures, the `internal` capabilities-only profile, pins, and releases; runs the paired
   routing eval DOCMAP:274 requires.

## 10. Routing budget, measured

`test/context_test.js:75-85` sums every string in `REGISTRY` (texts and cells, not `PREVIOUS_LINES`); the
recorded total is 11,750 and the current sum 11,728, so the change may add **22 characters net**. The block
limit (`test/router_compaction_test.js:30-49`) leaves 317. W3 therefore changes only: super-ux's first
sentence ("product/interface work … scenarios first … any user and path" → capabilities and scenarios,
any user or agent), its two cells, agent-stack's first sentence ("an agent SYSTEM" → "an agent system or a
product's agent surface") and its `when` cell, each paid for by trimming words in the same texts, plus
`PREVIOUS_LINES`/`PREVIOUS_CELLS` entries so hosts read the old block as packaged rather than as the
operator's edit. The super-ux boundary keeps "interface-free migrations": removing it would widen routing
to all backend work. The exact strings and their counts are computed in W3 by the test, not here.

## 11. The adversarial review and what it changed

An independent reviewer read v1 against the source heads (about thirty citations resolved) and returned 4
blockers, 12 major and 8 minor findings plus fifteen new tasks (N1-N15).

| Finding | Disposition |
|---|---|
| B1 users without agents | accepted → `Agent use`, `audience`, BN-23 |
| B2 contract changes slip past the trigger | accepted → contract-change trigger, stage-7 snapshot diff, BN-24 |
| B3 routing does not fit; a new skill breaks the description ratchet | accepted → no new skill (agent-interop reference), routing last and measured (§10) |
| B4 AN-9 cannot pass as written | accepted → two-level proof, sandbox gate fixtures, Observatory credential, nightly LLM run, "must story" |
| M1 contract home and rotting `file:line` | accepted → schema-first source + generated snapshot; row reduced |
| M2 ownership contradictions; canon home | accepted → one owner per rule (§3), eval mechanics in agent-evals |
| M3 two kinds of reason; loopholes; operator-rule conflicts | accepted → two scales, evidence per value, no product waiver, `taste` trial-only, `approval` on internal needs a decision |
| M4 Fabric model generalised | accepted → OAuth 2.1 / MCP authorization generic, Fabric as a binding |
| M5 no notifications to agents | accepted → AN-1 "acting and being notified", `Emits` |
| M6 row gaps | accepted → `Roles`, `Data`, `Emits`, `Since`, deprecation; effect set; refunds split |
| M7 risk inflation | accepted → R3 on a breaking change or ceiling change; additive R2 |
| M8 §6.2 takes over small tasks | accepted → skeleton split out, inventory by project-audit |
| M9 personas vs actors | accepted → `A-NN` actors |
| M10 parity untestable | accepted → structural lint, static audit with the AN-3 proxy, runtime agent-tester |
| M11 agent-tester cost and model | accepted → Sonnet full-grant judgment, `pass^k`, advisory cheap model |
| M12 rollout order; `internal` enroll | accepted → pilot before routing; capabilities-only profile |
| Minor: wrong citations (linter reads scenario content; Figma question conditional; doctor regex `ux-contract v(\d+)`; DOCMAP:274; HANDOFF receipt; effect vocabulary) | corrected in this v2; the v5 marker follows the doctor's existing `ux-contract v5` form |
| Minor: layer vs stage order; flow-back of found capabilities; per-node `surface_class`; AN-10 fields; six `scenario-format.md` copies; T1 unsourced number; walks labelled | accepted, each reflected above; the six-copy cost is recorded as W1's sync step |
