# Harness and Project Observatory publication

Status: in progress. Owner: this repository coordinates; each implementation lives in its owning repository.

## Brief and authority

The operator requested an autonomous end-to-end change: study ECC, adopt useful mechanisms, describe the family as part of an agent harness, prepare Project Observatory for safe open-source distribution, provide agent-led onboarding and a dedicated website, and update the family and personal sites. Publication and deployment are authorized after verification. Existing private data and unrelated working-tree edits are outside scope. The current model is inherited throughout; no model switch is needed.

## Source ledger

- ECC: https://github.com/affaan-m/ECC, pinned research and adoption matrix owned by `ssheleg/agent-stack`.
- Family: `skills.json`, `CLAUDE.md`, `docs/DOCMAP.md`, `docs/HANDOFF.md`, `scripts/site.js`, `docs/brand/`.
- Delivery: `skills/task-pipeline/plugins/task-pipeline/skills/task-pipeline/SKILL.md`.
- UX and copy: `skills/super-ux/plugins/super-ux/skills/ux-scenarios/SKILL.md` and `copywriting/SKILL.md`.
- Visual system: `skills/sheleg-design/plugins/sheleg-design/skills/sheleg-design/SKILL.md`; preserve the existing family and personal site systems.
- Observatory: private source audited locally; no raw observations, tracked state, credentials, histories or private project identifiers may enter this public record.
- Personal site: `ssheleg/sshlg-me`, with its canonical person/voice inputs kept at their existing owner.

Contradictions: the family README and brand facts still state historical pack totals while the manifest has changed. Derive current totals from the manifest. The existing Observatory checkout is an operational installation, not a distributable source release. Publishing its existing Git history is rejected; use a separately reviewed clean source export.

## Requirements and verification

| ID | Deliverable | Acceptance |
|---|---|---|
| H01 | ECC analysis and selective improvements | Pinned source matrix, adopted/rejected rationale, member validator and regression checks |
| H02 | Honest harness architecture | Define routing, delivery, coordination, specialist skills and optional observation; host retains runtime and permission boundary |
| H03 | Family site and member pages | Generated pages include harness relationship, links resolve, site suite and browser verification |
| O01 | Privacy-safe Observatory distribution | Explicit file allowlist, no inherited Git history, content/privacy gate plus negative probes, clean checkout |
| O02 | Agent-led setup | Runnable installation and demo, explicit data roots, optional credentials entered locally, missing-access recovery |
| O03 | Public feature and security documentation | Capabilities grounded in portable code; limitations and excluded integrations stated; no unverified incident counts |
| O04 | Dedicated Observatory site | Static explanation, synthetic before/after examples, onboarding CTA, mobile and desktop browser check, deployment verification |
| O05 | Product UI/UX improvement plan | Prioritized tasks with scenarios, dependencies, done conditions and evidence |
| P01 | Personal site | Harness and Observatory relationship, build/brand/UX gates, deployed page |
| R01 | Reproducible delivery | Task changes committed/pushed, fresh-checkout access, one central handoff index, explicit pending work |

## Modules and dependencies

| Module | Owner | Reads | Output | State |
|---|---|---|---|---|
| ECC adaptation | agent-stack | pinned ECC, existing contracts | reference changes + research matrix | running |
| Observatory privacy and portability | new clean source export | private source locally only | generic runtime, onboarding, tests, privacy report | running |
| Harness narrative and site | sshlg-skills | ECC conclusions + portable Observatory contract | architecture, generated family/member pages | running |
| Personal site | sshlg-me | harness vocabulary + Observatory public URL | existing site update | running |
| Observatory marketing site | clean export `site/` | portable feature contract | independent static site, synthetic examples | pending contract |
| Convergence and release | this repository | all above + checks | deployment, installed skills, final handoff | pending |

The public feature contract, not the private installation's breadth, is the dependency shared by the three websites. Publication requires the privacy gate before any public remote, artifact or deployment. No private source report is copied into the family repository.

## Decisions

1. The harness is an operating layer around existing coding agents. It does not claim to replace their model runtime, sandbox or permission system.
2. Skill packs remain independently usable. Observatory is a separately installed optional component, never silently installed with the skill launcher.
3. Preserve existing public URLs and install identifiers. Use a separate clean-history Observatory repository when the existing repository contains operational state.
4. Retain the established site design where it already exists. The new Observatory site uses a quiet technical visual system with concrete synthetic examples.
5. Any unexecuted check remains NOT_RUN. No simulated data will be described as an observed incident, and no historical incident will be attributed to a tool vendor without evidence.

## Resume

Read this file, then `docs/harness/README.md` when created, and the final publication index in this directory. The exact next task is the first unfinished module above; never make the private Observatory repository public as a shortcut.
