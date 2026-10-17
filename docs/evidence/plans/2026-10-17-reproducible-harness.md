<sub>ssheleg skills — make-skill · task-pipeline</sub>

# Reproducible harness installation

Status: proposed implementation plan, 2026-10-17. No installer, package version,
host configuration or production pin is changed by this planning handoff.

## Objective and scope

Turn the repairs in [native acceptance](../harness-acceptance-20261017.md)
into versioned installation and migration behavior. A second machine must obtain
the same selected capabilities from released artifacts, without copying the
first machine's configuration or depending on this conversation.

**Operator clarification, 2026-10-17:** Fabric alone must provide a working
supported agent harness without sshlg-skills or any family skill installed.
Skills are an optional extension, never a runtime prerequisite. This requirement
supersedes the initial hub-first proposal; it is a target requirement,
not a claim that standalone acceptance has already passed.

The operator asked how to make the repairs reproducible when installing their
skills or software. This unit delivers the ownership, migration contract and
implementation sequence. Implementation and releases remain pending. The
current model is inherited; no extra model calls or delegated work are required.
The planning profile is inspect, specify, verify and persist; its finish line is
a source-grounded plan with explicit pending work and a fresh-checkout handoff.

## Source ledger and verified gap

- Baseline: [6fe610d](https://github.com/ssheleg/sshlg-skills/tree/6fe610d9705530f946643c21eef5e821e0c57501).
  The acceptance handoff records the local repairs and their limitations.
- [Package manifest](../../../package.json) and `npm pack --dry-run --json --ignore-scripts`:
  version 1.65.0, 98 files; the schema bridge is absent, while
  [host targets](../../../lib/host-targets.js) is included. This proves a delivery
  gap in this candidate tree, not a fresh registry-package inspection.
- [Installer](../../../bin/sshlg-skills.js) already has install/update plans,
  native pinned-plugin transactions and refresh of previously wired family hooks.
  Extend those mechanisms rather than introduce a parallel configuration writer.
- [Protected writes](../../../lib/apply.js),
  [managed blocks](../../working-rules/managed-blocks.md) and
  [host visibility](../../../lib/hostvis.js) provide existing boundaries.
- [npm files contract](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#files)
  controls archive inclusion. The [Agent Skills specification](https://agentskills.io/specification)
  permits scripts and references in the skill directory; that alone does not
  register a native hook, configure a credential source or enroll a Fabric project.

Contradictions: a locally repaired host is not reproducible installation; a
tracked utility is not automatically a distributed utility. The installed-target
table explicitly does not establish native hooks/runtime compatibility.

## Ownership and installation modes

Fabric's installer must compose its own runtime dependencies; the skills
installer may add optional skills independently. One owner writes each
managed configuration fragment. This is a proposed allocation, not an accepted
cross-project contract or a claim that the other installers already implement it.

| Owner | Deliverable | Must stay outside its public package |
|---|---|---|
| Fabric | Standalone runtime installation, dependency closure, project context, MCP connection/admission flow, baseline routing and aggregate native diagnostics | Private project identities, account sessions and credentials |
| sshlg-skills | Optional skill inventory, pinned distribution, family routing, family instruction budgets and duplicate prevention | Operator rules, private endpoints, credentials |
| fabric-agent-adapter | Versioned native hook/plugin adapters, host-specific event payloads, timeouts and degradation contracts | Project admission, private project identities |
| Observatory | Supported credential-source adapters, per-host slot bindings and readiness checks | Secret values, copied account sessions, grants from another agent |
| Switchboard | Launcher resolution, supported launch contexts, bounded suggestion hooks, reload diagnostics | Shell snapshots, assumptions about this machine's PATH |

Support three independent installation modes: Fabric only, skills only, and
Fabric plus skills. A private operator profile is an optional overlay on those
modes, not a fourth mandatory runtime dependency. Installing a skill alone must
not silently install services or bind provider accounts. Fabric must ship or
install its required adapter code through its own versioned distribution;
neither a skills-directory copy nor an npx sshlg-skills command may be required.

Observatory and Switchboard remain optional companion products. Their reusable
mechanics may be packaged as explicit runtime components, but Fabric's baseline
must have a supported launch and credential path without either full companion
application. Native host authentication or a Fabric-owned credential interface
must cover that baseline; lack of account consent remains an authentication
prerequisite, not a reason to require the skills family. No borrowed keys or
implicit transfer of personal service configuration is permitted.

Fabric owns its baseline context/routing and instruction budget. The family adds
only its own optional routes. Installing, updating or removing either must leave
the other's managed configuration intact. Missing skills must not cause repeated
install prompts, missing-command failures, or broken hooks and MCP connections.
The private profile contains preferences and named secret references, never
secret values; its approved storage remains private. No new private repository
or storage location is created by this plan.

## Shared migration contract

Each recipe declares: stable id, owner, recipe version, host/version/OS selector,
capability prerequisites, affected config fields/files, packaged payload digests,
before/after probes, rollback policy, and removal condition for a workaround.
Resolve the home directory and supported host overrides at runtime. Unknown
versions are unverified, not silently included in a tested version range.

Use an independently packaged runtime migration engine, with no dependency on
sshlg-skills. Existing hub protected-write code is a design/reference source,
not an allowed standalone runtime dependency. The hub may consume the released
component through a supported interface rather than copy its mutable state.
Use one inspect -> plan -> protected apply -> native verify contract for install,
update and repair. A proposed read-only diagnostic mode consumes the same recipes;
no new command spelling is promised by this document.

1. Detect selected hosts, versions, actual executables and supported capabilities.
2. Resolve immutable component versions into a lock record. A fresh setup may
   select current releases; replay uses the recorded versions and payload hashes.
3. Show a scoped diff. Back up through the owning installer's protected-write boundary;
   a failed backup cancels mutation. Check the preimage immediately before write.
4. Preserve unrelated fields and operator edits. Keep managed code outside
   vendor-generated launchers. Journal interrupted operations for safe resumption.
5. Probe fresh native processes, with explicit deadlines and owned-child cleanup.
   Readback distinguishes installed, loaded, connected, admitted and behavior-tested.
6. Roll back only the fields/bytes still matching this operation's postimage;
   concurrent edits require a new plan, never restoration of an entire old config.
7. Persist a local receipt with versions, recipe ids, payload hashes, statuses and
   check times. Do not retain tokens, credential URLs or raw configuration dumps.

Missing optional hosts are skipped. Unsupported platforms, missing dependencies,
authentication prerequisites and failed required probes have distinct statuses;
an aggregate must not label these all successful. Model/provider evals are a
separate, budgeted gate; connectivity tests do not spend on model turns.

## Bounded implementation packets

| Packet | Scope and dependency | Exit check |
|---|---|---|
| RH-00: standalone closure | Fabric owns the runtime manifest and baseline contract; establish its install/update/repair path without family packages. Precedes RH-01 and RH-04 | A clean profile without family directories, commands or caches launches a supported agent and completes baseline hook/context/MCP probes. No standalone Observatory or Switchboard application required |
| RH-01: delivery closure | Fabric adapter runtime; port/package the existing bridge with one stable installed location and an opt-in recipe. Depends on RH-00 and the shared recipe contract | Extract the actual runtime artifact into a clean directory, run bridge tests without the hub checkout, and verify its digest. No default global MCP wrapping |
| RH-02: native credentials | Fabric owns the standalone credential interface; Observatory owns its optional backend. Generalize the Hermes native secret-source helper and OpenCode injection behind that interface | Fake credentials prove allowlisting, missing-value failure, newline rejection and inherited-key isolation. Test native baseline and optional vault backend separately; host self-update preserves both |
| RH-03: hook contracts | Fabric adapter and Switchboard each own their side; use existing native fixtures and fix the observed suggestion timeout | Malformed events and stalled IPC return within the host budget; the Codex plaintext negative case fails and valid JSON passes. Repeat through an installed artifact |
| RH-04: host-aware reconciliation | Fabric composes released runtime recipes from RH-00/01/02/03; hub adds only optional family integration | Three actual install/update runs converge with identical hashes; foreign edits survive; interrupted writes resume; modified-postimage rollback refuses safely |
| RH-05: platform acceptance | Each owner tests its package; Fabric aggregates baseline results and hub tests optional composition | Clean-machine install, previous-release upgrade, vendor self-update and uninstall on every claimed OS; shell and desktop launch tested separately; Fabric-only, skills-only and combined modes have separate receipts |

For RH-01 the observed selector is Kimi Code 2.2.0 with DigitalOcean MCP 1.5.1.
Retain the [bridge's narrow contract](../../../scripts/host-compat/README.md).
Do not infer support for other versions, HTTP transports or Windows from the
current POSIX implementation. Remove the wrapper when a fresh unmodified native
connection demonstrates the upstream fix.

For instruction budgets, measure the effective inherited instruction chain per
host, not just a single AGENTS file. Keep required entry rules short and move
procedures to packaged on-demand references. Preserve private operator content;
raising a cap is not the default repair. Include discovery and routing fixtures,
then run separate behavior evals before claiming that models follow the routes.

## Release and acceptance

The release gate must test the package people download, not only a source tree.
Standalone Fabric is a mandatory release case: run in a clean environment without
family skills, their CLI, plugin caches or inherited shell setup. Required hooks,
context delivery, baseline routing and intended MCP connections must work through
Fabric's supported host adapters. Test adding the family, removing it again and
repeating the same Fabric probes. Fail the gate if uninstalling optional skills
breaks a required runtime capability. Missing optional skills are not failures.
The clean test must not inherit credentials or paths from the developer machine.
Use clean profiles with synthetic secrets for CI. Native tests run only on hosts
actually installed; absent hosts remain NOT_RUN. macOS, Linux and Windows need
their own support receipts; no global cross-platform claim follows from a Mac run.

A complete release needs owner checks, normal integration, published artifact
readback, installation on a second clean environment, and a fresh-session probe.
Pins advance only to accepted released artifacts. Existing sessions and desktop
processes may require reload; installation receipts cannot claim they reloaded.
Respect the existing nightly CI policy; this plan does not add per-push full runs.

## Handoff and pending owners

Central planning record: sshlg-skills, remote `ssheleg/sshlg-skills`, branch
`codex/harness-acceptance-20261017`; this document is the continuation entry.
Baseline source commit is linked above; the planning commit is the commit that
adds this file. No other owner repository was edited, no member pin was changed,
and no implementation branch for RH-00 through RH-05 is claimed. Fabric owns the
standalone implementation and release gate; the location of this planning record
does not make the hub a runtime prerequisite.

Fabric returned `no-project` in this session, so project-board status/list/work
claims and cross-project submissions are unavailable. No task has been assigned
to Observatory, Switchboard or Fabric adapter by this plan. Their remote/branch/
commit identities must be resolved in their admitted projects before dispatch;
historical native fixture commits are evidence, not current owner task branches.

Exact next task: RH-00 in the admitted Fabric project, starting with a failing
Fabric-only installed-artifact test and the standalone runtime manifest. Then
RH-01 moves the portable bridge into the owning runtime distribution; do not
solve it only by adding a dependency on the hub package. Owner packets can be
submitted once the project's Fabric board is reachable. Watcher: none; no background job
or automatic continuation was installed. The person's Fabric project admission
is the prerequisite for board dispatch, not for reading this plan.

Checks for this planning unit are recorded in the delivery reply: package dry-run,
relative-link validation, repository document validator, and pushed-commit
readback from a fresh checkout. These do not establish implementation acceptance.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`make-skill`](https://github.com/ssheleg/make-skill) — distribution ownership
- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded planning and handoff
