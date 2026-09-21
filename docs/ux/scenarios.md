# UX Scenarios

<!-- Managed with super-ux (ux-contract v4). -->

Scope: the public family website's harness introduction and member relationship. Existing launcher behavior is unchanged. Approved for autonomous implementation by the operator's 2026-09-21 request; product outcomes remain unobserved.

## Index

| ID | Title | Feature | Persona | Traces | Status | Last audit |
|----|-------|---------|---------|--------|--------|------------|
| SCN-001 | Understand the harness | Public website | builder | — | validated | 2026-09-21: browser + site suite |
| SCN-002 | Locate a pack's role | Member page | builder | — | validated | 2026-09-21: browser + site suite |
| SCN-003 | Choose Observatory separately | Harness page | maintainer | — | validated | 2026-09-21: browser + site suite |
| SCN-004 | Find the Quest lifecycle workflow | XR member page | builder | — | validated | 2026-09-21: desktop/mobile browser + site suite |

## Personas

- **builder:** uses an existing coding agent and needs to know what installing the family changes.
- **maintainer:** manages several repositories and needs project observations without publishing project data or credentials.

## Public website

### SCN-001: Understand the harness
- **Persona:** builder
- **Feature:** Public website
- **Entry point:** /
- **Preconditions:** none
- **Steps:**
  1. Open the home page -> see the harness purpose and a family installation command in HTML.
  2. Follow “How the harness works” -> see each layer's owner and the host-runtime boundary.
- **Expected result:** the visitor can distinguish the harness, its skill family and optional Observatory.
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
  2. Follow the Observatory website -> read the portable edition's scope and agent-led onboarding.
- **Expected result:** the visitor understands separate installation and opt-in credentials before starting.
- **UI elements:** observation description, Observatory link, installation boundary
- **States covered:** success, empty
- **Errors & recovery:** without Observatory, all existing skill installation and documentation remain usable.
- **Status:** validated
- **Coverage:** scripts/site.js
- **Product:** unobserved

## Verification receipt

2026-09-21: local generated home and harness pages reviewed at desktop width; harness and agent-stack member page reviewed at 390×844. Document width equalled the viewport (390px). A browser-observed missing side inset on combined `.wrap.hero` / `.wrap.sec` elements was corrected by using block-axis padding in `scripts/site.js`; the member h1 then measured 16px from the viewport edge. The content and navigation are generated HTML; no script is required for the three scenario paths. `node test/site_test.js` checks every member relationship and the separate-installation boundary. This is implementation verification, not observed conversion or adoption evidence.

## XR member workflow

### SCN-004: Find the Quest lifecycle workflow
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
