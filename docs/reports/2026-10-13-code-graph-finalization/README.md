---
report:
  id: sshlg-skills/2026-10-13-code-graph-finalization
  title: "Hub source graph and documented entry points"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: draft
  valid_until: 2026-10-20
  summary: >-
    Provider-free AST cuts retain the218-file baseline and235-file candidate
    refresh after B187/W175 integration. Independent provenance checks pass;
    dangling edges and relation collapse limit runtime and reach claims.
  sources:
    - name: "Frozen hub source"
      url: "https://github.com/ssheleg/sshlg-skills/commit/9f0c0dc6a2a0c3c97c569af58b19bdbd31c8a71f"
      read_at: 2026-10-13
  produced_by:
    agent: "Codex root"
    task: "R33 final source graph and document reconciliation"
  supersedes: []
  consumers: ["sshlg-skills finalization"]
---

<sub>ssheleg skills — graphify · evidence-docs · project-reports</sub>

# Hub source graph and documented entry points

## Candidate refresh — source86477b5

The [new immutable cut](raw/final-86477b5/manifest.json) contains235 files,
2799 nodes,4238 exported edges and209 communities: +17 files,+194 nodes,
+289 edges and+16 communities from the baseline retained below. Source commit
[86477b5](https://github.com/ssheleg/sshlg-skills/commit/86477b5e5a8138742fa12dc56e8a9add80f54654)
includes native Claude source transactions and the scoped wait-rule writer.
The [independent peer](../../evidence/completion-1013/graph-final-peer.json)
rederived every Git blob, byte count, hash, node location and graph/export count;
its [verifier](../../evidence/completion-1013/graph-final-peer.py) is preserved.
No model/provider call was made.

[Diagnostics](raw/final-86477b5/diagnostics.json) still expose limitations:
5474 raw edges include726 dangling endpoints and1 self-loop;526 valid edges
share directed endpoint pairs. This is navigational evidence, not a completeness
or runtime acceptance certificate. Later documentation/gitlink-only changes do
not alter the frozen code corpus; the pending Codex updater correction will
require another cut before final acceptance.

The README now documents immutable native Claude refresh and `rules` preview/
apply; the implementation adds separate native-transaction and wait-policy
modules. Their shared plan composition is tested by the
[W175/B187 seam review](../../evidence/completion-1013/w175-merged-peer.md).
The graph does not replace that behavioral evidence.

## Baseline finding — source9f0c0dc

The [baseline manifest](raw/baseline-9f0c0dc/manifest.json) binds218 hub code
files to immutable Git blobs. Every admitted source file has at least one
extracted node. The directed export contains2605 nodes and3949 edges, grouped
into193 communities. This is static source navigation, not proof of runtime
reachability, behavioral quality or whole-family completion.

The [diagnostics](raw/baseline-9f0c0dc/diagnostics.json) retain the limitations:
5086 extracted edges include664 dangling endpoints and1 self-loop;489 edges
share directed endpoint pairs and may lose distinct relation detail during
construction. The exporter/build normalization can change endpoint counts;
therefore raw-minus-loss arithmetic is not a claimed invariant. The complete
[raw extraction](raw/baseline-9f0c0dc/extraction.json.gz) is retained alongside
[graph JSON](raw/baseline-9f0c0dc/graph.json.gz), with decompressed SHA256 values
in the manifest. Do not use absent graph edges to declare a dependency absent.

## Corpus and method

[build.py](build.py) reads immutable Git objects, never the working tree. It
includes hub JS/TS/Python/shell sources and tests, excludes docs/evidence scripts
and all member repositories. It uses installed graphifyy0.9.44, deterministic
AST extraction and directed graph construction without a visualization or
semantic/model extraction. Provider calls and provider tokens are0; local
CPU/disk use is not measured as free computation. Community names are source
filenames, not model-inferred descriptions.

Reproduce with the Python environment containing graphifyy0.9.44:

```sh
python build.py --repo <hub-checkout> --commit 9f0c0dc6a2a0c3c97c569af58b19bdbd31c8a71f --output <new-output-directory>
```

Output must be new; existing graphs are never overwritten. The first exploratory
run exposed macOS temporary-directory aliasing: graphify reduced source paths
to basenames when inputs used the lexical alias and its root resolved the real
path. The wrapper now resolves the owned root before extraction. The accepted
manifest preserves repository-relative paths and names the exact corpus.

## Document comparison

The highly connected source symbols are source-located in the manifest.
`cmdUpdate`, `cmdInstall`, `cmdDomains` and `cmdRouters` correspond to documented
commands in the [README](../../../README.md). `classify` belongs to the
prompt-routing mechanism documented in [DOCMAP](../../DOCMAP.md), while
`log`, `fail` and `main` are internal control/diagnostic entry points. A large
degree alone is not a defect or evidence of an undocumented public feature.

At the baseline cut, B187 was still being integrated. The separate candidate
refresh above covers its added source seam and W175. The original baseline and
its limitations remain unchanged. No previous ignored `graphify-out` directory
was replaced or used as current evidence.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `graphify` — bounded static code graph; foreign helper inside task-pipeline's audit work.
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — source and diagnostic boundaries.
- `project-reports` — durable report format.
