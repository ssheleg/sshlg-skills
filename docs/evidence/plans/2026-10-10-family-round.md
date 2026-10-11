# Plan — family improvement round (2026-10-10)

Brief: [2026-10-10-family-round.md](../briefs/2026-10-10-family-round.md). Lease `FAMILY-ROUND-1010`.
Hub branch `feat/family-round-1010`. Members each on their own branch, one PR each.

## REQ-7 — member audit findings admitted (2026-10-10)

| Row | Finding (evidence) | Disposition |
|---|---|---|
| REQ-7a | 4 pinned tags lightweight: super-ux v0.59.1, make-skill v0.29.2, seo-aeo-audit v0.26.3, sheleg-dev v0.13.2 (`git cat-file -t` → `commit`) | fixed going forward by REQ-6; the next annotated tag corrects `git submodule status`; published tags are not rewritten |
| REQ-7b | agent-sync default `npm test` runs `validate.py --self-test` (>58 min locally); siblings keep it in `test:negatives` | agent-sync: default gate without the self-test; self-test stays in CI and release |
| REQ-7c | super-ux brand-lint `B022 bin/super-ux.js:0` — string is at line 303 | super-ux: report the real line |
| REQ-7d | task-pipeline `test/project_audit_test.py:285,502,528,612` leak file handles (ResourceWarning) | task-pipeline: close them |
| REQ-7e | task-pipeline #91 / HK-05: validate 105 min, `validate.yml` 506,187 of 512,000 bytes | NOT this round — HK-05 keeps its own packet; carry-over |
| REQ-7f | 89 merged remote branches; agent-sync `fix/guard-allows-uncoordinated-repository` unmerged and superseded by 1.21.2 | carry-over: branch deletion is the operator's call |

## Tasks

| Task | Repo | Implements | Check |
|---|---|---|---|
| T1 `toolkit --find`, SKILL.md paths, shared root | hub | REQ-2 | `test/toolkit_test.js` (6 new) |
| T2 `visibility` command + `lib/visibility.js` | hub | REQ-1 | `test/visibility_test.js` (12), `test/visibility_e2e_test.js` (9, three runs + revert), plants watched failing |
| T3 protocol section: first step = meaning → `--find` | hub | REQ-3 | `router_texts_test`, `router_compaction_test` |
| T4 `skills@1.7.2` pin + snapshot | hub | REQ-8 | `node lib/host-targets.js --verify-source` (79 targets) |
| T5 tag gate step in `release.yml` | all 11 members | REQ-6 | step present; YAML parses; member gate |
| T6 «баг» in description; file handles | task-pipeline | REQ-5, REQ-7d | member gate; hub triggers soundness after re-pin |
| T7 `skill-search` skill; plugin reference to 2.1.296; `/skill-audit` empty argument | make-skill | REQ-4, REQ-9 | member gate; `--house` audit |
| T8 default gate without self-test | agent-sync | REQ-7b | `npm test` time + CI |
| T9 B022 line number | super-ux | REQ-7c | member gate |
| T10 close #154, #102 | GitHub | REQ-10 | issue/PR state |
| T11 releases, re-pin, hub release, update, installed bytes | all | REQ-11 | `check_pins.py`, registry, payload compare |
| T12 handoff, wiki, graph | hub | REQ-12 | files, push |

Set comparison: REQ-1..12 each appear in `Implements:` above (REQ-7e/7f as carry-over).

## T5 — the step (identical in every member)

Inserted after the `actions/checkout` step of the `release` job, before any validator:

```yaml
      - name: The tag must be annotated (a lightweight tag hides the release)
        run: |
          set -eu
          # `git describe` and `git submodule status` see annotated tags only; the
          # 2026-10-09 wave cut four lightweight tags and the hub read each member
          # as its previous release. Refuse here, before anything is published.
          TAG="${{ steps.t.outputs.tag }}"
          KIND=$(git cat-file -t "$TAG")
          if [ "$KIND" != "tag" ]; then
            echo "::error::$TAG is a $KIND, not an annotated tag object. Remedy: git tag -a $TAG -m '<release>' at the same commit."
            exit 1
          fi
          echo "$TAG is annotated"
```

The hub's own `release.yml:57` has run this check since B-93; every 1.54.x release passed it.

## Release order

Members first (each: PR → green CI → squash-merge → annotated tag on the merge commit,
read the tip subject for the PR number first → release run selected BY TAG → registry
read). Then the hub: bump pins in one sweep (`check_pins.py` re-run whole), README table,
`skills.json`, version 1.55.0, PR, merge, `scripts/tag.sh`, release, registry. Then
`npx --yes sshlg-skills@latest update`, installed payload comparison, `visibility --apply`
with the released launcher, `claude -p --debug` listing readback.
