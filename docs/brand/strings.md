Contract: brand-contract v1

# Shared labels

This registry holds only family-level labels repeated across repositories.

| Key | Text (primary) | Location | Scenario | Status |
|---|---|---|---|---|
| family.install | Install | README.md | repository adoption | agreed |
| family.update | Update | README.md | installed family maintenance | agreed |
| family.verify | Verify | skills/agent-stack/README.md | release acceptance | agreed |


| harness.overview | How the harness works | scripts/site.js | SCN-001 | agreed |
| harness.install | Install the skill family | scripts/site.js | SCN-001 | agreed |
| harness.observatory | Explore Project Observatory | scripts/site.js | SCN-003 | agreed |

| site.name | ssheleg skills | scripts/site.js | SCN-001 | proposed |
| site.skills | Skills | scripts/site.js | SCN-001 | proposed |
| site.browse | Browse the skills | scripts/site.js | SCN-001 | proposed |
| foundry.status | In development | scripts/site.js | SCN-004 | proposed |

Retired label: “Where it stops” was proposed for member READMEs but has no
current source occurrence. It is not a shipped shared label.

## Working-rule CLI strings

| Key | Text (primary) | Location | Scenario | Status |
|---|---|---|---|---|
| rules.policy | persistent instruction policy recorded. | bin/sshlg-skills.js | SCN-007 | proposed |
| rules.preview | preview | bin/sshlg-skills.js | SCN-007 | proposed |
| rules.apply | apply | bin/sshlg-skills.js | SCN-007 | proposed |
| rules.refused | rules.wait: refused | bin/sshlg-skills.js | SCN-009 | proposed |

## Wait recovery CLI

| Key | Text (primary) | Location | Scenario | Status |
|---|---|---|---|---|
| rules.recovery.metadata | metadata only | lib/wait-recovery-cli.js | SCN-010 | proposed |
| rules.recovery.finalize | Finalize metadata | lib/wait-recovery-cli.js | SCN-010 | proposed |
| rules.recovery.preserve | Preserve the private wait-rule receipt and retained copies for audit. Locks are never cleared by this command. | lib/wait-recovery-cli.js | SCN-010 | proposed |
| rules.recovery.boundary | Host instructions are not restored or rewritten by recovery. | lib/wait-recovery-cli.js | SCN-010 | proposed |
| rules.recovery.evidence | source CLI; metadata only; no installed or native behavior claim | lib/wait-recovery-cli.js | SCN-010 | proposed |
| rules.recovery.arguments | Use rules recovery inspect or finalize --operation <id> [--apply]. | lib/wait-recovery-cli.js | SCN-010 | proposed |

## Runtime recovery CLI

| Key | Text (primary) | Location | Scenario | Status |
|---|---|---|---|---|
| hooks.recovery.state | runtime recovery | bin/sshlg-skills.js | SCN-011 | proposed |
| hooks.recovery.arguments | use recovery inspect, then recovery recover --expect <digest\|absent> | bin/sshlg-skills.js | SCN-011 | proposed |
| hooks.recovery.changed | expected runtime lock changed; inspect again | lib/runtime-recovery.js | SCN-011 | proposed |
| hooks.recovery.unknown | runtime holder is alive or unknown | lib/runtime-recovery.js | SCN-011 | proposed |
| hooks.recovery.interrupted | recovery capability refused or interrupted; inspect again | lib/runtime-recovery.js | SCN-011 | proposed |
