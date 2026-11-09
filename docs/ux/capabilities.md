# Capabilities

<!-- Managed with super-ux (ux-contract v5). What people and agents can do with the launcher: one CAP-NN per effect set.
The agent surface is the CLI itself (`npx sshlg-skills <command>`); a capability is exposed when an agent can call it
non-interactively and read its result as data. -->

## Index

| ID | Capability | Actors | Gate | Status |
|----|------------|--------|------|--------|
| CAP-01 | Update the family on every host | human, agent, automation | none | exposed |
| CAP-02 | Read the installed set | human, agent | none | specified |
| CAP-03 | Find a skill by concept | human, agent | none | specified |
| CAP-04 | Measure what each host loads | human, agent | none | exposed |

## Capabilities

### CAP-01: Update the family on every host
- **Traces:** ST-001
- **Actors:** human, agent, automation
- **Agent excluded:** none
- **Roles:** the machine's user account
- **Gate:** none
- **Tools:** `sshlg-skills update` (`--dry-run` for a plan with zero mutations; exit 75 when another update holds the lock, 2 on a usage error)
- **Emits:** none
- **Data:** internal
- **Automation:** nightly job A-02 at 04:MM local when a newer set is published; kill switch `sshlg-skills config set update.mode off`
- **Human surface:** none
- **Since:** v1.86.0
- **Status:** exposed

### CAP-02: Read the installed set
- **Traces:** ST-002
- **Actors:** human, agent
- **Agent excluded:** none
- **Roles:** the machine's user account
- **Gate:** none
- **Tools:** `sshlg-skills list` (text only: `--json` is accepted and ignored, measured 2026-11-09; B-331)
- **Emits:** none
- **Data:** internal
- **Automation:** none
- **Human surface:** none
- **Since:** v1.0.0
- **Status:** specified

### CAP-03: Find a skill by concept
- **Traces:** ST-003
- **Actors:** human, agent
- **Agent excluded:** none
- **Roles:** the machine's user account
- **Gate:** none
- **Tools:** `sshlg-skills toolkit --find "<concept>, …"` (text only: `--json` is accepted and ignored, measured 2026-11-09; B-331)
- **Emits:** none
- **Data:** internal
- **Automation:** none
- **Human surface:** none
- **Since:** v1.55.0
- **Status:** specified

### CAP-04: Measure what each host loads
- **Traces:** ST-004
- **Actors:** human, agent
- **Agent excluded:** none
- **Roles:** the machine's user account
- **Gate:** none
- **Tools:** `sshlg-skills context --json` (one JSON report; exit 1 only on an error finding; threw a TypeError on a fallback host until 1.87.0)
- **Emits:** none
- **Data:** internal
- **Automation:** none
- **Human surface:** none
- **Since:** v1.87.0
- **Status:** exposed
