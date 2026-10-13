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
    Provider-free AST snapshot of 218 tracked hub code files. The static graph
    identifies connected entry points; dangling edges and relation collapse
    limit reach claims. Final candidate refresh remains pending B187 integration.
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

## Finding

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

B187 is still being integrated; its native source transaction adds a real seam
that this baseline does not cover. Refresh the graph after accepting that code
and its final immutable member inventory, then review those added symbols and
README/DOCMAP entries before declaring R33 current. No previous ignored
`graphify-out` directory was replaced or used as current evidence.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `graphify` — bounded static code graph; foreign helper inside task-pipeline's audit work.
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — source and diagnostic boundaries.
- `project-reports` — durable report format.
