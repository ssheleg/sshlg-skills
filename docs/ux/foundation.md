# UX Foundation

<!-- Managed with super-ux (ux-contract v5). The WHY layer: personas, actors, jobs, journeys, stories.
Scope: the launcher CLI and its hooks. The public website keeps its scenarios in scenarios.md. -->

## Personas

### P-01: Operator
Runs a machine with several coding agents (Claude Code, Codex and others) and wants the same skill
family, routing and hooks on every host without touching them by hand.
- **Agent use:** most (operator rules in `~/.claude/CLAUDE.md`, 2026-11-07: "The operator presses nothing"; every command is run by an agent)

### P-02: Builder
A developer outside the operator's estate who installs the family through `npx sshlg-skills install`
to give their own agents the same routes.
- **Agent use:** some (hypothesis: README's install section addresses a person and their agent alike; not observed)

## Actors

### A-01: Coding agent
- **Kind:** agent
- **Acts for:** P-01
- **Grant:** the operator's user account on this machine; writes only through `lib/apply.js` `protect()` with a backup first

### A-02: Nightly update job
- **Kind:** system
- **Acts for:** P-01
- **Grant:** the LaunchAgent `me.sshlg.skills.update`, which runs `update` only when a newer set is published (B-323)

### A-03: Routing hook
- **Kind:** system
- **Acts for:** P-01
- **Grant:** read-only on the prompt; prints routes, writes nothing

## Jobs to Be Done

### JTBD-01: Keep every agent on the same skill set
- **Statement:** When a member of the family ships, I want every agent on my machine to run it, so I can rely on one behaviour everywhere.
- **Personas:** P-01, P-02
- **Type:** functional
- **Forces:** push: hosts drift apart; pull: one command; anxiety: a write that breaks a host; habit: updating by hand
- **Success metric:** after a release, `update` on a machine leaves every enabled host on the pinned versions

### JTBD-02: Find the skill a task needs
- **Statement:** When a task starts, I want the agent to find the skill that should drive it, so I can trust the route without naming it.
- **Personas:** P-01
- **Type:** functional
- **Forces:** push: most skills are hidden from the listing; pull: one search; anxiety: a wrong route; habit: guessing
- **Success metric:** the first step of a task names the skill it used

## Customer journeys

### JRN-01: Operator, a release reaches the machine (JTBD-01)
- **Owner:** unknown
| # | Stage | User action | Performed by | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|-------|------------|--------------|------------|---------------|------|-------------|
| 1 | Release | a member is pinned | A-01 | hub PR | 3 | pins wait on npm | none |
| 2 | Update | the set is installed | A-02, A-01 | `update` | 3 | a host is busy | a receipt an agent can parse |
| 3 | Check | the result is read back | A-01 | `list`, `context` | 2 | text only | `--json` on every read |

## User stories

### ST-001: Update the family
- **Story:** As P-01, I want the family updated on every host, so that every agent runs the pinned set.
- **Traces:** JTBD-01, JRN-01/#2
- **Acceptance criteria:**
  - Given a newer published set, when `update` runs, then every enabled host reads back the pinned versions.
- **Priority:** must
- **Status:** validated

### ST-002: Read what is installed
- **Story:** As P-01, I want my agent to read which member versions the package pins, so that it can compare them with what a host reports after an update.
- **Traces:** JTBD-01, JRN-01/#3
- **Acceptance criteria:**
  - Given the package, when `list --json` runs, then it returns each member and its pinned version as one JSON document.
- **Priority:** must
- **Status:** validated

### ST-003: Find a skill for a task
- **Story:** As P-01, I want my agent to search every installed skill by concept, so that it picks the one that should drive the task.
- **Traces:** JTBD-02
- **Acceptance criteria:**
  - Given a task's concepts, when `toolkit --find` runs, then it returns the matching skills with the path of each SKILL.md.
- **Priority:** must
- **Status:** validated

### ST-004: Measure what each host loads
- **Story:** As P-01, I want my agent to measure the instruction files each host loads, so that a cap is caught before a session drops text.
- **Traces:** JTBD-01
- **Acceptance criteria:**
  - Given this machine, when `context --json` runs, then it prints one JSON report and exits 1 only on an error finding.
- **Priority:** should
- **Status:** validated
