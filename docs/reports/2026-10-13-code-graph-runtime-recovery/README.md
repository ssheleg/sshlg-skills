---
report:
  id: sshlg-skills/2026-10-13-code-graph-runtime-recovery
  title: "Hub static graph after runtime recovery correction"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: active
  valid_until: 2026-10-20
  summary: >-
    The frozen runtime-correction source contains 250 tracked code files.
    Its static export has 3018 nodes, 4589 edges and 229 communities.
    Git-blob, line-range and raw/export reconciliation is retained; raw dangling
    edges remain explicit. These navigation data do not establish runtime quality.
  sources:
    - name: "Immutable runtime-correction composition"
      url: "https://github.com/ssheleg/sshlg-skills/commit/56ca9ea41e40efa0b2b6240411711c480f091e8e"
      read_at: 2026-10-13
  produced_by:
    agent: "Codex fresh_research"
    task: "R33 graph refresh after accepted runtime source correction"
  supersedes: ["sshlg-skills/2026-10-13-code-graph-recovery"]
  consumers: ["sshlg-skills finalization"]
---

<sub>ssheleg skills — graphify · evidence-docs · project-reports</sub>

# Hub static graph after runtime recovery correction

The new [manifest](raw/final-56ca9ea/manifest.json) binds the source graph to
`56ca9ea41e40efa0b2b6240411711c480f091e8e`. It supersedes the current-source role of
[the prior recovery graph](../2026-10-13-code-graph-recovery/README.md), whose raw
artifacts and historical observations remain unchanged.

| Measure | Prior source `00a6b2c` | Current source `56ca9ea` | Delta |
|---|---:|---:|---:|
| Tracked code files | 249 | 250 | +1 |
| Nodes | 2989 | 3018 | +29 |
| Exported directed edges | 4522 | 4589 | +67 |
| Communities | 225 | 229 | +4 |
| Raw edges | 5856 | 5930 | +74 |
| Raw edges with missing endpoints | 786 | 793 | +7 |
| Collapsed same-endpoint relations | 564 | 564 | 0 |

The [corpus delta](raw/corpus-delta.json) records one added file,
`test/runtime_atomic_test.js`, six changed files and no removed files. The changed
set covers runtime recovery, the CLI and their controls, including the earlier
Codex visibility-order correction. This is the executable corpus only: later
report metadata and member gitlink changes do not alter this selection. Larger
counts do not demonstrate better modularity, coverage or task quality.

## Construction and exact reconciliation

The unchanged [builder](../2026-10-13-code-graph-finalization/build.py) reads exact
Git objects, materializes them in an owned temporary directory and removes that
directory through its context manager. [Build receipt](raw/build.json): exit 0,
8.293 seconds; [output](raw/build.txt) names the frozen commit and counts. The
[engine binding](raw/engine.json) records graphifyy 0.9.44 and the extractor-module
hash. No installation or engine update was performed.

The [raw extraction](raw/final-56ca9ea/extraction.json.gz) and
[export](raw/final-56ca9ea/graph.json.gz) are different artifacts. The current
[diagnostics](raw/final-56ca9ea/diagnostics.json) disclose 5930 raw edges, 793 edges
with missing endpoints, 564 collapsed relations and one self-loop. Reconstruction
finds 16 export-added endpoint pairs and no missing valid raw endpoint pairs:

`5930 - 793 - 564 + 16 = 4589`.

The [reconciliation result](raw/reconciliation.json) checks both source cuts:
exact corpus membership, Git blob identities, byte lengths and SHA256 hashes;
decompressed artifact hashes; unique/equal node identifiers; node and edge source
paths and line ranges against original blobs; exported endpoint membership;
community labels/counts and highlighted-symbol source locations. Its
[verifier](raw/reconcile.py) is separate from the builder and derives the edge
counts from raw data. This is build-author reconstruction, **not independent peer
acceptance**. The next reader can replay it without rerunning extraction.

```sh
python3 docs/reports/2026-10-13-code-graph-runtime-recovery/raw/reconcile.py . /tmp/graph-runtime-recheck.json docs/reports/2026-10-13-code-graph-recovery/raw/final-00a6b2c docs/reports/2026-10-13-code-graph-runtime-recovery/raw/final-56ca9ea
```

To rebuild, use the interpreter containing graphifyy 0.9.44 and a new destination;
the builder refuses to overwrite a cut:

```sh
python docs/reports/2026-10-13-code-graph-finalization/build.py --repo . --commit 56ca9ea41e40efa0b2b6240411711c480f091e8e --output <new-output-directory>
```

## Limits and next action

The reviewed code path is AST-only, directed, sequential and without visualization
or semantic/model extraction. Declared provider calls/tokens and raw token counters
are zero. That is source-path and counter evidence, not independent network
telemetry or an accounting total for this project.

Tracked hub JS/TS/Python/shell files form the corpus; member repositories, prose and
historical evidence scripts under `docs/` do not. Dynamic imports/dispatch and
semantic contracts remain incomplete. A missing edge does not prove a missing
dependency; the static graph does not prove runtime reachability, correct hooks,
complete crash recovery, installed payloads or model quality. In particular, the
runtime's retained-lock recovery admission remains a separately scoped design task.

Next: independent graph reconciliation, parent integration, then one source-aware
wiki index including the observer reports. The owner aggregate and release gates
remain separate. This report changes no runtime, native profile or settings.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `graphify` — provider-free static source graph — not a skill this family ships
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — Git and artifact reconciliation
- `project-reports` — dated cut and supersession — not a skill this family ships
