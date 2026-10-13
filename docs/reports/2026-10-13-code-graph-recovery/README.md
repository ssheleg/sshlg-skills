---
report:
  id: sshlg-skills/2026-10-13-code-graph-recovery
  title: "Hub source graph after recovery composition"
  kind: audit
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: draft
  valid_until: 2026-10-20
  summary: >-
    The recovery candidate adds eight tracked code files to the previous graph cut.
    The new static graph contains 249 files, 2989 nodes and 4522 edges.
    Source hashes and extraction diagnostics are retained; independent review is pending.
    These are navigation data, not runtime or quality acceptance.
  sources:
    - name: "Frozen recovery candidate"
      url: "https://github.com/ssheleg/sshlg-skills/commit/00a6b2c6dcd84ecd62547157824d78a4e2500e87"
      read_at: 2026-10-13
  produced_by:
    agent: "Codex root"
    task: "R33 source map after MB02 composition"
  supersedes: ["sshlg-skills/2026-10-13-code-graph-finalization"]
  consumers: ["sshlg-skills finalization"]
---

<sub>ssheleg skills — graphify · evidence-docs · project-reports</sub>

# Hub source graph after recovery composition

The [manifest](raw/final-00a6b2c/manifest.json) binds every code file to an immutable
Git blob, byte length and SHA256. The cut includes backup retention, wait recovery
and the metadata-only recovery CLI in the hub candidate. The [earlier report](../2026-10-13-code-graph-finalization/README.md)
retains all previous cuts. This new report supersedes their current-source role;
it does not overwrite their observations.

| Measure | Prior source5d19e74 | Recovery source00a6b2c |
|---|---:|---:|
| Tracked code files | 241 | 249 |
| Nodes | 2876 | 2989 |
| Exported directed edges | 4341 | 4522 |
| Communities | 216 | 225 |

These counts come from the two manifests. Larger counts do not establish better
modularity or quality. The new [diagnostics](raw/final-00a6b2c/diagnostics.json)
record5856 raw edges,786 dangling endpoints,1 self-loop and564 collapsed relations
sharing directed endpoints. Independent endpoint comparison is still pending.
The compressed [raw extraction](raw/final-00a6b2c/extraction.json.gz) and
[export](raw/final-00a6b2c/graph.json.gz) are retained for that check.

## Method and boundaries

The unchanged [builder](../2026-10-13-code-graph-finalization/build.py) reads Git
objects at00a6b2c6dcd84ecd62547157824d78a4e2500e87 using graphifyy0.9.44. It extracts
tracked JS/TS/Python/shell code, excludes docs and member repositories, and disables
parallel extraction, model extraction and visualization. Declared provider calls
and tokens are zero; this is code-path and counter evidence, not network telemetry.

Reproduce with the interpreter containing that pinned package, using a new output
path; the builder refuses an existing destination:

```sh
python docs/reports/2026-10-13-code-graph-finalization/build.py --repo . --commit 00a6b2c6dcd84ecd62547157824d78a4e2500e87 --output <new-output-directory>
```

Dynamic imports/dispatch and semantic contracts are incompletely represented.
Missing edges cannot prove missing dependencies. Community names derive from
source filenames. Package publication, host installation, real hooks and model task
quality each need their own evidence. Later docs-only or gitlink changes do not
change this code corpus; a later implementation does require another cut.

Next: independent Git/blob, line-range and graph/endpoint verification; then
complete the final hub aggregate and update the generated wiki report index.
No graph result substitutes for those gates.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `graphify` — provider-free source graph — not a skill this family ships
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — immutable source boundaries
- `project-reports` — report metadata — not a skill this family ships
