---
report:
  id: sshlg-skills/2026-10-13-coding-agent-compatibility
  title: "Coding-agent compatibility and context surfaces, 2026-10-13"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: superseded
  superseded_by: sshlg-skills/2026-10-16-coding-agent-compatibility
  valid_until: 2026-11-13
  supersedes: [sshlg-skills/2026-10-12-coding-agent-compatibility]
  summary: >-
    Family files and native lists are measured separately across nine local hosts.
    The full family is readable; Gemini, OpenCode and Hermes enumerate 39 of 39.
    Native model quality, effective prompt size and billed savings remain unverified.
  sources:
    - name: "Frozen sanitized host measurements"
      path: raw/host-measurements.json
      read_at: 2026-10-13
    - name: "Measurement analysis and boundaries"
      path: ../../evidence/completion-1013/host-measurements.md
      read_at: 2026-10-13
---

<sub>ssheleg skills — project-reports · evidence-docs · make-skill · openai-docs</sub>

# Coding-agent compatibility and context surfaces — 2026-10-13

All 39 family skills are readable in the shared installation. Native list commands enumerate all 39 for Gemini, OpenCode and Hermes. Claude reports 11 enabled family plugins and Codex 9; their versions match the recorded source pins. This snapshot does not establish successful model invocation or lower billed cost.

The [full measurement analysis](../../evidence/completion-1013/host-measurements.md) separates native lists, filesystem inventory, controlled Pi formatting, configuration and unrun behavioral checks. Its frozen command/version/count/hash receipts are archived in [raw/host-measurements.json](raw/host-measurements.json). These are measurements of the machine before this completion wave's installation, not a new release receipt.

| Surface | Observation | Limit |
|---|---|---|
| Shared metadata | 499 skills, 216415 name/description characters | UTF-16 lengths, not tokens or active prompt |
| Native Gemini / OpenCode / Hermes | family 39/39 in each complete list | no model task executed |
| Controlled Pi formatter | 499 input skills, 308638 characters | not a full session or DefaultResourceLoader |
| Native Claude / Codex plugin inventory | 11 / 9 family plugins, reported versions match pins | cached/installed state does not prove this session loaded them |
| Five global routing blocks | identical 17477-character blocks in five different host files | no evidence one session gets five copies; project entries have no duplicate block |
| OpenCode debug stdout | 5631149 characters | includes skill bodies; never return it wholesale for a count audit |

This supersedes the prior compatibility snapshot for measured versions, current files, native list receipts and Pi instruction presence. It preserves its unresolved native/model acceptance boundaries. The installed Hermes binary is 0.21.4; no newer runtime behavior is inferred.

A bounded Claude readiness probe recorded elsewhere consumed 187709 cache-creation input tokens and ended in error_max_budget_usd. The reported USD1.50376 is the CLI's list-price estimate, not verified subscription billing. Its nominal USD0.10 argument did not provide a pre-request ceiling. There is no prompt-section trace assigning those tokens to skills versus MCP, instructions or hooks. See [probe receipt](../../evidence/completion-1013/provider-probe.json).

A separate [controlled readiness probe](../../evidence/completion-1013/controlled-probe.json) returned the expected JSON with 2237 input tokens including cache creation and USD0.018068 list-price usage. This proves a smaller isolated startup is possible, not quality preservation in normal work. Two explicit-corpus selection attempts returned provider errors before any measured inference; their task scores remain null. The [evaluation receipt](../../evidence/completion-1013/README.md#controlled-context-and-description-screening) records this limit.

The optimization strategy is to preserve complete discovery, reduce irrelevant context, and compare actual task artifacts and total parent/child usage in controlled arms. Fewer characters, a shorter skill list and passing parser fixtures cannot establish unchanged quality. The [official-source research](../2026-10-13-skill-discovery-efficiency/README.md) owns the upstream contracts and evaluation design.

Validation: source JSON parsed; source-pin comparisons, family ID cardinalities, table values and relative links checked. Native stdout was captured to owned regular files after pipe capture proved truncated despite exit0. Raw private instruction and skill bodies are not published. B-148's compatibility-report work can close independently of B-144/B-147's unrun behavioral evaluation.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `project-reports` — measured compatibility snapshot — not a skill this family ships
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — separated file and native evidence
- [`make-skill`](https://github.com/ssheleg/make-skill) — host skill contracts
- `openai-docs` — Codex contract research — not a skill this family ships
