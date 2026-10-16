# UX Scenarios

<!-- Managed with super-ux (ux-contract v4). -->

Scope: the public Skills website, its separate Harness section and member relationships. The bounded wait-rule CLI below is covered separately; other launcher behavior is outside this scenario addition. Approved for autonomous implementation by the operator's 2026-09-21 request; product outcomes remain unobserved.

## Index

| ID | Title | Feature | Persona | Traces | Status | Last audit |
|----|-------|---------|---------|--------|--------|------------|
| SCN-001 | Find skills, then understand the harness | Public website | builder | — | validated | 2026-09-21: browser + site suite |
| SCN-002 | Locate a pack's role | Member page | builder | — | validated | 2026-09-21: browser + site suite |
| SCN-003 | Choose Observatory separately | Harness page | maintainer | — | validated | 2026-09-21: browser + site suite |
| SCN-004 | Understand Foundry availability | Harness page | builder | — | validated | 2026-09-21: browser + site suite |
| SCN-005 | Find the Quest lifecycle workflow | XR member page | builder | — | validated | 2026-09-21: desktop/mobile browser + site suite |
| SCN-006 | Start a domain project before dependencies exist | domains CLI and skill search | builder and coding agent | — | implemented | 2026-10-13: domain focused checks |
| SCN-007 | Opt into a scoped wait rule | Working-rule CLI | maintainer | — | validated | 2026-10-13: accepted W175 packet; focused CLI5 |
| SCN-008 | Refresh or remove owned wait text | Working-rule CLI | maintainer | — | validated | 2026-10-13: accepted W175 packet; focused CLI5 |
| SCN-009 | Recover a refused instruction write | Working-rule CLI | maintainer | — | validated | 2026-10-13: accepted W175 packet; focused CLI5 |
| SCN-010 | Inspect and finalize recovery metadata | Working-rule CLI | maintainer | — | implemented | 2026-10-13: MB02c focused CLI; independent peer pending |
| SCN-011 | Recover an interrupted hook-runtime write | Hooks recovery CLI | maintainer | — | implemented | 2026-10-13: B190 isolated implementation |

## Personas

- **builder:** uses an existing coding agent and needs to know what installing the family changes.
- **maintainer:** manages several repositories and needs project observations without publishing project data or credentials.

## Public website

### SCN-011: Recover an interrupted hook-runtime write
- **Persona:** maintainer
- **Feature:** Hooks recovery CLI
- **Entry point:** `npx sshlg-skills hooks recovery inspect --json`
- **Preconditions:** an existing runtime in the current home; no host settings edit requested.
- **Steps:**
  1. Inspect -> see only runtime identity, lock fingerprint and a NO_LOCK, PENDING_JOURNAL, BUSY (with the holder pid), DEAD, UNKNOWN or NOT_INSTALLED state with its reason; inspection writes nothing. A home reached through a symlink inspects the same runtime its writers bound.
  2. Supply the observed fingerprint to `hooks recovery recover --expect <digest> --json` -> same-boot dead holder may be retired under kernel exclusion, then the existing runtime journal decides rollback.
  3. Inspect again after refusal or interruption -> live/unknown/changed holders remain untouched; a dead recovery worker can be recovered by the same supported command.
- **Expected result:** verified rollback or explicit unresolved state; no inference that a missing journal proves the interrupted transaction succeeded. Every recover result says whether the dead lock was retired (`retired`), `null` when an interrupted worker did not report it.
- **UI elements:** JSON state, expected fingerprint, failure reason, process exit code
- **States covered:** success, error, empty
- **Errors & recovery:** each refusal names its next step — a live holder (wait for that pid), a stale fingerprint (inspect again), a root writable by others (`chmod go-w`), no runtime (`hooks install`), missing `/usr/bin/python3` or only the Command Line Tools stub (`xcode-select --install`). A worker refusal after it retired the dead lock keeps the worker's own reason. Refusals exit 1, usage errors exit 2 and print JSON only with `--json`; legacy locks remain UNKNOWN. The command never takes a user-supplied runtime path or rewires host settings.
- **Status:** implemented
- **Coverage:** test/runtime_recovery_test.js
- **Product:** unobserved

### SCN-001: Find skills, then understand the harness
- **Persona:** builder
- **Feature:** Public website
- **Entry point:** /
- **Preconditions:** none
- **Steps:**
  1. Open the home page -> see skills as the main offer, a pack catalogue and a family installation command in HTML.
  2. Follow “Browse the skills” or the visible Skills navigation link -> reach the pack catalogue, including on a narrow screen.
  3. Follow “How the harness works” -> reach the separate Harness page and see each layer's owner and the host-runtime boundary.
- **Expected result:** the visitor can choose skills first, then distinguish the wider harness and its separately installed tools.
- **UI elements:** hero, install command, harness link, navigation, architecture table
- **States covered:** success, error
- **Errors & recovery:** JavaScript unavailable -> explanation and links still work; missing route -> 404 offers home and routing.
- **Status:** validated
- **Coverage:** scripts/site.js
- **Product:** unobserved

### SCN-002: Locate a pack's role
- **Persona:** builder
- **Feature:** Member page
- **Entry point:** /skills/<member>/
- **Preconditions:** member exists in skills.json
- **Steps:**
  1. Open a member page -> read its role and relationship to the harness.
  2. Follow its standalone installation -> use the existing package and plugin identifiers.
  3. Follow the harness overview -> return to the shared architecture.
- **Expected result:** adopting one pack does not imply installing another component.
- **UI elements:** member heading, role, harness link, installation commands
- **States covered:** success
- **Errors & recovery:** missing member fails the site build instead of generating a fabricated page.
- **Status:** validated
- **Coverage:** scripts/site.js; test/site_test.js
- **Product:** unobserved

### SCN-003: Choose Observatory separately
- **Persona:** maintainer
- **Feature:** Harness page
- **Entry point:** /harness/
- **Preconditions:** none
- **Steps:**
  1. Read the observation layer -> see what Observatory inspects and its local-data boundary.
  2. Follow the Observatory website -> read the published scope and agent-led onboarding.
- **Expected result:** the visitor understands separate installation and opt-in credentials before starting.
- **UI elements:** observation description, Observatory link, installation boundary
- **States covered:** success, empty
- **Errors & recovery:** without Observatory, all existing skill installation and documentation remain usable.
- **Status:** validated
- **Coverage:** scripts/site.js
- **Product:** unobserved

### SCN-004: Understand Foundry availability
- **Persona:** builder
- **Feature:** Harness page
- **Entry point:** /harness/#asset-foundry
- **Preconditions:** none
- **Steps:**
  1. Open the asset creation layer -> see Asset Foundry's role in 3D, image and audio workflows.
  2. Read its availability -> see “In development” and understand it has separate availability from the skill packs.
- **Expected result:** the visitor understands the planned role without mistaking it for an available installation or following a private repository link.
- **UI elements:** architecture table, Asset Foundry section, development state
- **States covered:** success, empty
- **Errors & recovery:** no public release -> an explicit development state replaces an install or source link.
- **Status:** validated
- **Coverage:** scripts/site.js; test/site_test.js
- **Product:** unobserved

## Verification receipt

2026-09-21: local generated home and harness pages reviewed at desktop width; harness and agent-stack member page reviewed at 390×844. Document width equalled the viewport (390px). A browser-observed missing side inset on combined `.wrap.hero` / `.wrap.sec` elements was corrected by using block-axis padding in `scripts/site.js`; the member h1 then measured 16px from the viewport edge. The content and navigation are generated HTML; no script is required for the three scenario paths. `node test/site_test.js` checks every member relationship and the separate-installation boundary. This is implementation verification, not observed conversion or adoption evidence.

2026-09-21 Skills-first correction: home and Harness reviewed at 1440×900;
home navigation and catalogue at 320×740 and 390×844; all ten member pages at
320×740. Skills and Harness remained visible. Every measured page's document
width equalled its viewport. The catalogue previously produced 336px of document
width at 320px; its grid minimum now respects available width (288px cards inside
16px side insets). Member affiliation now preserves acronym case. Foundry's
section states “In development” and separate availability. Browser console
reported no errors. The generated-site suite passes 44 checks over 15 pages;
these are implementation checks, not user research or production verification.

## XR member workflow

### SCN-005: Find the Quest lifecycle workflow
- **Persona:** builder
- **Feature:** XR member page
- **Entry point:** /skills/xr-dev/
- **Preconditions:** xr-dev is present in the family manifest
- **Steps:**
  1. Open the XR member page -> see the product lifecycle role and current package version.
  2. Read the skill list -> distinguish the lifecycle entry from native, Spatial, performance, tooling, Store and WebXR owners.
  3. Follow the lifecycle guide -> reach the shipped skill and its stage/engine/design references.
  4. Choose installation -> see the existing family and standalone channels; an unpublished npm package is labelled pending and has no dead registry link.
- **Expected result:** the visitor can start a whole-product Quest plan or choose one specialist without assuming tools, engines or hardware are installed.
- **UI elements:** member role, version, skill list, lifecycle guide, installation commands
- **States covered:** success, error
- **Errors & recovery:** missing shipped skill fails site generation; without JavaScript, the lifecycle link and descriptions remain accessible in HTML.
- **Status:** validated
- **Coverage:** skills.json; scripts/site.js; test/site_test.js
- **Product:** unobserved

XR verification, 2026-09-21: the local generated member page displayed v0.3.0, all seven skill descriptions and the lifecycle guide. Desktop and 390×844 previews were inspected; document width was 390px at the mobile viewport. Registry publication is a separate check recorded in the release handoff.

## Search and reading refinement (2026-09-21)

SCN-001/002: a visitor arriving from search reads the pack's purpose before the
harness relationship. The header keeps task navigation; following the author
remains available in the footer. Search/social metadata describes a software pack
as a website and points the author entity to the public personal profile.
SCN-003: the Harness observation section links directly to the Observatory origin
story; that link is labelled with its subject rather than a generic “read more”.
The existing no-JS, standalone installation and private-data boundaries hold.


## Domain scoping recovery (2026-10-13)

### SCN-006: Start a domain project before dependencies exist
- **Persona:** builder and coding agent
- **Feature:** domains CLI and skill search
- **Entry point:** `toolkit --find` or `domains --enable xr-dev` in a new git repository
- **Preconditions:** domain plugin installed; project settings are git-ignored
- **Steps:**
  1. Search for a domain skill while its global plugin is disabled -> see its path and enable command.
  2. Enable the member in the project -> read back its local entry and restart the session.
  3. Run update -> keep the explicit choice without manufacturing dependency evidence.
  4. Disable the explicit choice or revert -> remove only entries the command owns.
- **Expected result:** the first platform decision can use its skill before any SDK is installed.
- **UI elements:** search result, enable hint, refusal and readback lines
- **States covered:** success, empty, error
- **Errors & recovery:** missing root or unignored settings refuse writes; incomplete evidence keeps global coverage; hook-bearing plugins stay global.
- **Status:** implemented
- **Coverage:** test/domains_e2e_test.js; test/domains_test.js; test/toolkit_test.js; test/hooks_e2e_test.js
- **Product:** unobserved

## Working-rule CLI

These scenarios restate the accepted B175 packet and current standing operator
scope. They do not assert that an installed agent follows the text or that any
watcher has been started. The existing maintainer persona applies to host settings.

### SCN-007: Opt into a scoped wait rule
- **Persona:** maintainer
- **Feature:** Working-rule CLI
- **Entry point:** `npx sshlg-skills config set rules.wait on`
- **Preconditions:** existing supported host profile; no prior wait-rule opt-in required
- **Steps:**
  1. List settings -> absent wait policy displays off; unknown policy is reported as unknown.
  2. Set rules.wait on -> record policy without editing host instructions or launching jobs.
  3. Run rules with a host scope -> preview target paths and added/removed owned text, with no writes.
  4. Run rules --apply with that scope -> back up and write only the selected existing profiles; report each result.
  5. Repeat the same apply -> report unchanged and retain exact bytes.
- **Expected result:** the maintainer can deliberately install the correct host variant without changing foreign text or unrelated profiles.
- **UI elements:** config state, host scope flags, preview, apply result
- **States covered:** empty, success, error
- **Errors & recovery:** unknown arguments or hosts refuse before writes; absent host profiles are skipped; no invented installation or watcher.
- **Status:** validated
- **Coverage:** test/wait_rule_policy_test.js; test/wait_rules_cli_test.js
- **Product:** unobserved

### SCN-008: Refresh or remove owned wait text
- **Persona:** maintainer
- **Feature:** Working-rule CLI
- **Entry point:** `npx sshlg-skills rules`
- **Preconditions:** an ownership receipt from a successful explicit apply
- **Steps:**
  1. Update the family -> refresh only already-applied profiles selected by the run; new profiles remain untouched.
  2. Set rules.wait off -> record intent; host instructions remain unchanged until apply or update.
  3. Preview and apply -> remove only the known owned segment, preserving surrounding text and backing up each changed target.
  4. Uninstall the family -> remove selected owned wait text; member-only installation never applies the family rule.
- **Expected result:** repeated maintenance does not broaden opt-in, and disabling the rule preserves the maintainer's own instructions.
- **UI elements:** policy state, update plan, removal preview, ownership receipt
- **States covered:** success, empty, error
- **Errors & recovery:** a retargeted profile or edited region refuses; restore the original binding or review ownership before retrying. During install/update/uninstall the refusal is that host's only: the run names `file:line` and the remedy (move the text outside the markers), runs every other step and exits 1. With the rule on, a host that has no receipt is named with the command that applies it there; update never writes it.
- **Status:** validated
- **Coverage:** test/wait_rules_test.js; test/wait_rules_cli_test.js
- **Product:** unobserved

### SCN-009: Recover a refused instruction write
- **Persona:** maintainer
- **Feature:** Working-rule CLI
- **Entry point:** `npx sshlg-skills rules --apply`
- **Preconditions:** malformed policy, unknown/edited markers, foreign Cursor file, failed backup, concurrent change or an unfinished receipt
- **Steps:**
  1. Preview or apply -> receive a specific refusal instead of replacement of ambiguous input.
  2. Inspect the named receipt and backups -> identify the last attempted target and expected before/after hashes.
  3. Resolve the observed condition -> retry only after ownership and current bytes are known; no automatic destructive recovery.
- **Expected result:** uncertain or partial work remains explicit, with earlier successful targets distinguished from the failed one.
- **UI elements:** refusal diagnostic, per-host action, recovery receipt
- **States covered:** error, partial
- **Errors & recovery:** backup failure leaves the target untouched; an unfinished operation blocks blind replay; independently completed targets remain reported.
- **Status:** validated
- **Coverage:** test/wait_rules_test.js
- **Product:** unobserved

### SCN-010: Inspect and finalize recovery metadata
- **Persona:** maintainer
- **Feature:** Working-rule CLI
- **Entry point:** `npx sshlg-skills rules recovery inspect --json`
- **Preconditions:** none for inspection; an admitted wait-owner operation for finalization
- **Steps:**
  1. Inspect recovery -> see empty, pending, terminal or unresolved state without writes or private file contents.
  2. Preview finalize with the reported operation identifier -> see whether metadata can be finalized under current evidence.
  3. Add --apply -> finalize only ownership/retention metadata; host instructions remain unchanged.
  4. Repeat the completed request -> report already finalized without changing any bytes.
- **Expected result:** the maintainer can distinguish an observed file state from admitted metadata completion and avoid guessing recovery actions.
- **UI elements:** inspect/finalize commands, operation identifier, JSON result, fixed reason and next-step messages
- **States covered:** empty, success, error
- **Errors & recovery:** stale identifier, legacy or malformed evidence, changed profile/policy, unknown target bytes or held locks refuse with nonzero status; preserve the receipt and retained copies for review. No command clears locks or restores host files.
- **Status:** implemented
- **Coverage:** test/wait_recovery_cli_test.js; test/wait_recovery_test.js
- **Product:** unobserved
