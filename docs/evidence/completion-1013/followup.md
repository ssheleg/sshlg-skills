<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# Follow-up execution and release receipts — 2026-10-13

## Delivered hub candidate

[PR216](https://github.com/ssheleg/sshlg-skills/pull/216) merged to
`c035801021a046a1bc8fcae41ea8a6a4c060bd2d`. Its genuine ready-for-review run
[38335157767](https://github.com/ssheleg/sshlg-skills/actions/runs/38335157767)
satisfied the required PR checks. The earlier workflow_dispatch run passed jobs
but was ineligible for PR admission; that distinction remains in the original receipt.

A fresh canonical-submodule checkout of the merge SHA ran `npm test`: exit0,
113 suites, 1695 fixtures, 11 members. [Receipt](release-1.62.0/npm-test.json) binds
the [compressed log](release-1.62.0/npm-test.log.gz) by SHA256.
[Post-merge run38335464570](https://github.com/ssheleg/sshlg-skills/actions/runs/38335464570)
passed all three validation jobs plus Pages build/deploy at that exact SHA.
Fresh strict pin measurement returned0. The independently reviewed watcher created
and pushed annotated v1.62.0 without rewriting any ref; its
[tag readback](release-1.62.0/tag-readback.json) records object and peeled commit.
[Release run38336582938](https://github.com/ssheleg/sshlg-skills/actions/runs/38336582938)
completed successfully, including npm publication and registry readback. The coordinator
independently observed `npm view sshlg-skills@1.62.0 version` return1.62.0.
[Hosted receipt](release-1.62.0/hosted.json) records all five passing jobs.
An initial local npx lookup still returned ETARGET before the replica/cache refreshed;
the later explicit-version preview succeeded. Machine update is in progress.

## Independently reviewed follow-up

[Release continuation](release-continuation.md), source `4e0d3ea`, passed 41 focused
controls after a coordinator-discovered dirty-submodule bypass was reproduced and
fixed. A separate agent reviewed the fix and reran all41. No old tag is replaced.

[Settings read/edit separation](domain-settings-read.md), source `6bfaeae`, passed
36 pure,14 profile and46 end-to-end controls. Coordinator independently read the
semantic reader and process branches and reran pure36/profile14. Valid compact JSON
is now readable while required unsupported-format writes still refuse. Same-machine
read-only coverage changed from6 to2 incomplete repositories; no foreign config was
rewritten. These roots remain unknown, so global domain disabling is not accepted.

The follow-up adds one suite and48 fixtures to the previous gate. The aggregate
run at `c79f5383d990d936b6ec1bb0b460111e09993e62` passed114 suites /1743 fixtures /11 members.
[Receipt](followup-test.json) binds the [log](followup-test.log.gz); this is local
evidence, separate from the next PR and exact-merge release gates.

## Owner integrations; releases still pending

| Owner | PR | Merge commit | Evidence |
|---|---|---|---|
| seo-aeo-audit | [27](https://github.com/ssheleg/seo-aeo-audit/pull/27) | `fbb721b2d26b6cfe1a966b90b093d9ba6e452110` | FW01 owned temporary-tree cleanup; independent review in owner HANDOFF |
| make-skill | [35](https://github.com/ssheleg/make-skill/pull/35) | `712d960b0bad66347570dc00650b1ea12bf94664` | FW01 whole-repository lexical allocation guard; owner HANDOFF |
| telegram-dev | [12](https://github.com/ssheleg/telegram-dev/pull/12) | `85a5a5f13e2c7b24fddda5c53bb05f1634d969ed` | [merge/run receipt](fw02-telegram-dev-merge.json) |
| xr-dev | [5](https://github.com/ssheleg/xr-dev/pull/5) | `3605d10998241235778262b34d5b59188bb29248` | [merge/run receipt](fw02-xr-dev-merge.json) |
| web3d-dev | [6](https://github.com/ssheleg/web3d-dev/pull/6) | `02181194157b91f5b79159936d35d1a26ae6b433` | [merge/run receipt](fw02-web3d-dev-merge.json) |
| sheleg-dev | [25](https://github.com/ssheleg/sheleg-dev/pull/25) | `9703d5ece1b1f135f0c7cc50c50c78563b894bbf` | [eligible run38336515558](https://github.com/ssheleg/sheleg-dev/actions/runs/38336515558); owner independent receipt |

FW02 final common helper/harness were identical across the three owners. Owner
full gates and original negative plants passed; coordinator reran42 process controls
plus9 earlier independent controls. Bounded workflow grammar is explicit, not a
claim of general YAML/Bash semantic validation. FW03 peer review caught `.mjs`,
zero-line and oversized-range omissions before merge; corrected source was reviewed
again. Google client IDs remain public metadata; Meta credential-channel semantics
remain open rather than inferred from a test payload.

## Original goal remains open

FW04,FW05,FW06 are active. Remaining packet assignments stay lossless in
[family-next-wave](family-next-wave.md); they are documented obligations, not a claim
that every old row is a currently reproducible bug. Model description screening still
has provider TEST_ERROR and no concise arm; no zero-quality-loss claim is made.
Installed/native evidence and report/board reconciliation follow each delivered wave.

Fabric project admission was observed for this project, but this session's tool list
contains no com.status/list/submit. Pending requests remain durable and unsent. The
wiki index/overview change merged in [PR20](https://github.com/ssheleg/obsidian-memory-vault/pull/20)
at `cd65f5d2fa2b4db30279482267e5dcb471c6628b`;170 report IDs, zero removed,25 pre-existing
source-header problems disclosed. It is not proof of provider or installed acceptance.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — release and follow-up wave delivery
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — exact candidate receipts and bounded acceptance
