<sub>ssheleg skills — task-pipeline · evidence-docs · make-skill · agent-sync</sub>

# FW01, FW03 and FW05 publication readback — 2026-10-13

This record distinguishes accepted source, publication, installed state and runtime behavior. These four owner releases package the bounded source changes reviewed in the linked owner receipts. They do not close every historical family row.

## Accepted source and release path

| Member | Source receipt | Packaging PR | Checked packaging candidate | Accepted main / annotated tag |
|---|---|---|---|---|
| sheleg-design | [FW05](https://github.com/ssheleg/sheleg-design-skill/blob/ab7d82e97dc33e22d22de69b8b09c380c68a3ec2/docs/evidence/runs/2026-10-13-fw05-design-facts.md) | [44](https://github.com/ssheleg/sheleg-design-skill/pull/44) | `2819f3c70e590a0b4564a768e2659b9d4fbcd947` | `9caedc1c46d78d2a37f60f92c697beb8bb3dfcf9` / `v1.64.2` |
| make-skill | [FW01](https://github.com/ssheleg/make-skill/blob/712d960b0bad66347570dc00650b1ea12bf94664/docs/evidence/runs/2026-10-13-fw01-temp-guard.md) | [36](https://github.com/ssheleg/make-skill/pull/36) | `8b69a7a4a0da8cce828877ee6ee1bf110c2a588f` | `78d67651611f50e2af531ab04916e680c2a2680d` / `v0.31.2` |
| sheleg-dev | [FW03](https://github.com/ssheleg/sheleg-dev/blob/9703d5ece1b1f135f0c7cc50c50c78563b894bbf/docs/evidence/runs/2026-10-13-fw03-credentials.md) | [26](https://github.com/ssheleg/sheleg-dev/pull/26) | `7302ec057fd1236d651f900aa7207f82259de4c3` | `8862fae9a826263f8109626ca257f81c7c43ac86` / `v0.13.4` |
| super-ux | [FW05](https://github.com/ssheleg/super-ux/blob/c331b052c473adbd125cd3611ca28f73cfae1bc8/docs/evidence/runs/2026-10-13-fw05-journey-copy.md) | [43](https://github.com/ssheleg/super-ux/pull/43) | `5db89a285a2bf449b26bea34a2659ecfd3ea513f` | `f0261f68c1a7222508bd984dc7bac63805dbb76b` / `v0.59.3` |

Each packaging PR merged normally after its frozen candidate received genuine required checks from a deliberate `ready_for_review` event. Candidate-to-accepted-main `git diff --exit-code` returned 0 for all four pairs. Fresh `git fetch origin` and main reachability checks preceded annotation and tag push. No force, admin merge, fabricated status or direct npm publication was used. Repository release and publication variables were already enabled; no release reviewer environment was configured in these workflows. Super-ux's own `python3 test/release_preflight.py` passed on the accepted main commit before tagging.

Independent packaging review inspected all changed files and found no executable or workflow changes. Local structural gates passed: design 6651, super-ux 5476, sheleg-dev 28; make-skill printed `PASS: make-skill structure valid (2 cursor rule(s))`. Full source gates and independent negative controls remain in the source receipts. Packaging required runs: [design 38340064592](https://github.com/ssheleg/sheleg-design-skill/actions/runs/38340064592), [make-skill 38340378688](https://github.com/ssheleg/make-skill/actions/runs/38340378688), [sheleg-dev 38340379534](https://github.com/ssheleg/sheleg-dev/actions/runs/38340379534), [super-ux 38341330032](https://github.com/ssheleg/super-ux/actions/runs/38341330032); each completed successfully at the candidate SHA in the table.

## Registry artifact readback

The existing [verify_registry.py](../../host-compat/releases/verify_registry.py) was executed once per published package with `--repo <owner-worktree> --package <registry-name> --version <version> --source <accepted-main-SHA> --release-run <run-id> --output <receipt.json>`. It fetched canonical npm metadata and tarball without extraction or execution; checked exact package/version/gitHead, SHA-512 integrity and SHA-1 shasum; then compared every regular published file byte-for-byte with `git show <source>:<path>`. Each JSON retains its observation time and per-file SHA-256 manifest. The script's release-run argument is only a label: workflow head, conclusion and individual jobs were separately read through `gh run view` and persisted as `release_workflow_conclusion`, `release_workflow_url` and `release_jobs`.

| Package | Published version | Exact files compared | Release run | Receipt |
|---|---|---|---|---|
| `sheleg-design-skill` | `1.64.2` | 1238 | [PASS 38340955417](https://github.com/ssheleg/sheleg-design-skill/actions/runs/38340955417) | [design-1.64.2.json](design-1.64.2.json) |
| `@ssheleg/make-skill` | `0.31.2` | 34 | [PASS 38340963937](https://github.com/ssheleg/make-skill/actions/runs/38340963937) | [make-skill-0.31.2.json](make-skill-0.31.2.json) |
| `@ssheleg/sheleg-dev` | `0.13.4` | 68 | [PASS 38340972121](https://github.com/ssheleg/sheleg-dev/actions/runs/38340972121) | [sheleg-dev-0.13.4.json](sheleg-dev-0.13.4.json) |
| `super-ux` | `0.59.3` | 33 | [PASS 38341429185](https://github.com/ssheleg/super-ux/actions/runs/38341429185) | [super-ux-0.59.3.json](super-ux-0.59.3.json) |

## Bounds and exact next task

Published artifact equality is not installed-host or model/provider acceptance. This packet did not change the operator's home configuration, install skills, run provider calls or certify rendered output. `runtime_acceptance: NOT_RUN` remains explicit in every artifact receipt. The hub integrator owns reviewed member pins, released hub update, installed payload/readback and native-host observations. Next: cherry-pick this evidence commit with the corresponding accepted release pins, then record installation separately.

Residuals retain their source meanings: design's historical four table exceptions remain presence-only and live Figma/render observations remain open; make-skill's temporary-tree scan is bounded lexical analysis; sheleg-dev's Meta credential contract, copied-channel hooks and native evidence remain open; super-ux allows explicit unknown owners/metrics and checks brief structure without certifying factual truth. Source receipts preserve additional scope limits.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — release delivery
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — exact source and registry proof
- [`make-skill`](https://github.com/ssheleg/make-skill) — package conformance
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — owner leases
