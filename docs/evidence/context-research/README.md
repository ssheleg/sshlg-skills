<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# CR-3 active context repair

Status: implementation complete; independent parent review and integrated delivery
pending. Entry: [active handoff](../../HANDOFF.md). Scope and requirements:
[PLAN.md](PLAN.md), committed before implementation at `bc7d8d1`.
The parent owns the member integration, final full gate, push, release and installation;
this task changes no package version, pin, runtime or private/global instruction file.

## Source and findings

Base: [a4c65581787b5ddcb3df1e36a8cae1c89c066479](https://github.com/ssheleg/sshlg-skills/tree/a4c65581787b5ddcb3df1e36a8cae1c89c066479).
The old handoff mixed recent receipts with instructions to begin FIX-SY-01.01 and
prepared September branches. At that base, the Sherlock queue computes 255 done of
255 and the debt queue 30 of 30; neither count proves deployment. The family-hooks
snapshot still says HK-05 planned and HK-13 open-for-the-operator: this repair does
not claim they are complete or that their current owner state was checked.

The supplied task described an eight-member root instruction. That wording is
already absent from this base's CLAUDE.md. The parent separately reported the
operator's original checkout at `4d833fc6b899850eddfdf0fad5ddb26575144173`, behind
this base; that is checkout drift, not a defect reproduced at this branch's base. No correction of that count is claimed. The member inventory
now has a direct link to its source instead of introducing another hardcoded count.

The old handoff is [archived verbatim](../../HANDOFF-2026-10-09-archive.md) at the
same directory depth. [navigation.json](navigation.json) records its source path,
commit and SHA-256. The active entry explicitly marks the archive non-operational.
The historical root narratives remain in [the original CLAUDE.md](https://github.com/ssheleg/sshlg-skills/blob/a4c65581787b5ddcb3df1e36a8cae1c89c066479/CLAUDE.md).
Raw reports and historical registries were not rewritten or deleted.

## Measurement and semantic coverage

[measurements.json](measurements.json) stores both source hashes and exact UTF-8
byte, splitlines and whitespace-word counts. This measures only the two active
files; it does not estimate tokens, host-loaded context, model quality or total
repository size. The archived bytes remain available on demand.

| Active file | Before bytes / lines / words | After bytes / lines / words |
|---|---|---|
| CLAUDE.md | 7612 / 125 / 1164 | 4292 / 75 / 547 |
| docs/HANDOFF.md | 12015 / 190 / 1447 | 3365 / 53 / 363 |

Semantic review is the implementer's explicit judgment, not the checker's verdict.
All line references below use the frozen base linked above and the resulting
[CLAUDE.md](../../../CLAUDE.md). The independent parent must review this mapping.

| Source lines / obligation | Result lines | Coverage decision |
|---|---|---|
| 3–17 local scope, family ownership, operator-file risk | 3–4, 16–21 | Preserved; global loading is not assumed for every host |
| 19–27 offline native gate, measured ratchets, network pin check separate | 23–32 | Preserved |
| 31–33 shadow copies removed after skills-CLI operations | 36–37 | Preserved |
| 34–46 live references gate; historical disclosure; negative and empty-corpus controls | 38–41 | Preserved; dated UM-03 narrative reachable at source |
| 47–50 HTTPS submodules and negative check | 42–43 | Preserved |
| 51–54 advertised version, gitlink and README agreement | 44–45 | Preserved |
| 55–59 authored precedence; drift; explicit per-router adoption and retained copy | 46–48 | Preserved |
| 60–67 executable payload, non-shell heredoc/comment exclusion, shell/quoted commands retained | 49–51 | Preserved; false-positive/bypass narrative reachable at source |
| 68–73 pure guards, no HOME fixture dependency, backup boundary, fail-open filter limitation | 52–55 | Preserved |
| 74–78 silent failure, actionable refusal, real process tests | 56–57 | Preserved |
| 82–96 all five operator paths; backup before every write; fail closed on backup error; restore uses protect | 61–67 | Preserved; UM-06/B-05 incident details reachable at source |
| 97–99 three real-command runs and hash equality | 68–69 | Preserved |
| 100–101 sentinel exterior byte preservation; preview removals | 70–71 | Preserved |
| 105–108 measured numbers and runnable/resolvable evidence | 29–32 | Preserved; old miscount narrative reachable at source |
| 112–125 coordination, single homes, backlog, verification, standing retro, repository handoff | 8–14 | Preserved; active entry no longer routes every task into Sherlock |

The standing retrospective is byte-identical to the base: SHA-256
`3ef10d19abf80d5790807edc2d910932096cf3a3463ead926b1af40165fd87d4`.
No five-run retirement trigger was inferred and no standing rule was retired.

## Checks and limits

- `node test/context_handoff_test.js`: PASS, six cases. The shipped files pass;
  five structural negatives reject missing entry link, dead local target, altered
  archive, empty archive list, and an archive move that changes relative links.
  Plants assert they changed the relevant parsed input. They never write the tree.
- Before the document repair, the same checker failed on the original CLAUDE.md's
  absent explicit retrospective link; the earlier missing-manifest failure is setup,
  not evidence of the original stale-status defect.
- `python3 test/validate.py`: PASS, 11 members and 11 submodules. Existing `unlooked`
  disclosures remain; they do not become acceptance for those surfaces.
- The deterministic check verifies local navigation and frozen bytes. It does not
  assert particular prose, current version, semantic equivalence, external HTTP
  availability or live task status. Dated status corrections above were read against
  their actual progress/receipt artifacts, not inferred by a keyword matcher.
- `npm test`: PASS, 91 suites, 1112 fixtures, 11 pinned members, exit 0. The
  first full run passed its suites but exited 1 on DOCMAP's old 90/1106 counters;
  those were updated from its measured result and the full rerun passed.
- Source/archive byte equality and both active-file measurement hashes passed.
  Hosted CI, publication, installed-host loading and model outcomes are NOT_RUN
  for this docs-only task. No full hosted suite was dispatched.

## Handoff

REQ-1: current entry separated from historical instructions; all old handoff bytes
and link base retained. REQ-2: compaction measured and obligations mapped, no retro
pruning. REQ-3: bounded deterministic checker plus negative controls and native
validation. REQ-4: task-local branch and evidence; independent review before push
remains the parent's next task. Final merged source can differ from this branch:
rerun the native gate after member integration and update the active handoff then.

No processes or timers are intentionally left running by this task. The coordination
lease is held by the parent; no member of this task acquires/releases that identity.
Private corpus URLs/bodies, credentials, machine settings and local updater state are
explicitly local-only and absent from this public task packet.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded repository delivery
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — source and semantic coverage receipts
