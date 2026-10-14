---
report:
  id: sshlg-skills/2026-10-14-code-graph-hub-candidate
  title: "Hub static graph at the 1.63.0 candidate"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-14
  status: active
  valid_until: 2026-10-21
  summary: >-
    The 1.63.0 candidate source contains 252 tracked code files. Its static export
    has 3053 nodes, 4643 edges and 218 communities. Git-blob, line-range and
    raw/export reconciliation and an independent peer check both pass bounded.
    These navigation data do not establish runtime quality.
  sources:
    - name: "1.63.0 candidate after member pins and runtime recovery"
      url: "https://github.com/ssheleg/sshlg-skills/commit/b8656355f08bc6791b834b13ee51ceab3923e2d6"
      read_at: 2026-10-14
  produced_by:
    agent: "Claude Code"
    task: "Graph refresh after B190 runtime recovery and the task-pipeline 1.95.0 pin"
  supersedes: ["sshlg-skills/2026-10-13-code-graph-runtime-recovery"]
  consumers: ["sshlg-skills finalization"]
---

<sub>ssheleg skills — graphify · evidence-docs · project-reports</sub>

# Hub static graph at the 1.63.0 candidate

The [manifest](raw/final-b865635/manifest.json) binds the graph to
`b8656355f08bc6791b834b13ee51ceab3923e2d6`. It supersedes the current-source role of
[the runtime-recovery graph](../2026-10-13-code-graph-runtime-recovery/README.md);
that report's raw artifacts stay unchanged.

| Measure | Prior source `56ca9ea` | Current source `b865635` | Delta |
|---|---:|---:|---:|
| Tracked code files | 250 | 252 | +2 |
| Nodes | 3018 | 3053 | +35 |
| Exported directed edges | 4589 | 4643 | +54 |
| Communities | 229 | 218 | -11 |
| Raw edges | 5930 | 5997 | +67 |
| Raw edges with missing endpoints | 793 | 802 | +9 |

The [corpus delta](raw/corpus-delta.json) adds `lib/runtime-recovery.js` and
`test/runtime_recovery_test.js` (B190 supported recovery), changes 43 files and removes
none. Most changes are the summary-count normalization of test runners and the wait-rule
and runtime controls; `bin/sshlg-skills.js` and `lib/runtime.js` carry the recovery CLI.
Fewer communities with more edges reflect the new recovery module joining the runtime
cluster; counts do not demonstrate better modularity or task quality.

## Construction and reconciliation

The unchanged [builder](../2026-10-13-code-graph-finalization/build.py) read exact Git
objects into an owned temporary directory: [receipt](raw/build.json), exit0,
[output](raw/build.txt), zero provider calls. [Engine](raw/engine.json): graphifyy 0.9.44,
extractor hash equal to the prior slice's.

[Reconciliation](raw/reconciliation.json) and the [independent peer check](raw/root-peer.json)
(copies of the prior slice's scripts with the snapshot pair updated:
[reconcile.py](raw/reconcile.py), [root-peer.py](raw/root-peer.py)) both report
`PASS_BOUNDED` for both slices: every admitted file's blob, byte length and SHA-256 match
the manifest, node and edge counts match the export, and raw pairs missing from the
export are zero. Dangling raw edges remain explicit, not repaired.

## Limits

Member repositories, prose and historical evidence scripts are outside the corpus. A
static AST graph names structure; it says nothing about runtime behaviour, installed
state or answer quality.
