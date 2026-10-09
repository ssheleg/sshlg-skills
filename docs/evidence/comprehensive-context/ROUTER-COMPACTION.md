<sub>ssheleg skills — task-pipeline</sub>

# SC3 — managed router compaction

## Frozen implementation contract (2026-10-09, before source edits)

Implements SC3 from [PLAN.md](PLAN.md). Baseline: hub
`97e9351b850695b1410dc168c1d091a9a0aa0fad`; whole-family rendered block
21,218 Unicode characters. Target: at least 25% reduction, aiming for 30%,
without losing routing decisions. Character counts are not model token counts.

Only literal doctrine in `lib/routers.js` and `lib/routers-registry.js` changes.
No resolver, installer, consent, backup, authored precedence, marker, map/table
membership, inventory, refusal parser, or member-pin behavior changes. Existing
contract tests remain intact. Operator files and installed caches are not edited
by this implementation task.

| Surface | Required meaning retained |
|---|---|
| Protocol | Measure toolkit per substantial task; print ordered skill/purpose plan then proceed without approval; shortlist is advisory term overlap; repository routes name source files; materialised command verifies declarations; actual used list includes foreign skills and wrong routes; signature-generated header/footer; bounded star ask; session-persistent route-specific refusal with per-prompt note retained; trivial/read-only exclusions; both tooling refusal aliases |
| Map | Runtime owns descriptions; UX precedes design and copy, shared scenarios and comparison before shipping; pipeline delivers; foreign always-on/SessionStart mandates cannot override map; planning stages 2–4; conflict candidates and injector inspection |
| super-ux | Installed condition; all product paths, scenarios source, missing-file offer before UI, same-change updates, audit with file:line; internal/script/migration/data/infra exclusions; what/look/sound ownership |
| sheleg-design | Installed condition; visual tokens/type/rhythm/motion/calm/brand/Figma variables, all surfaces; pack design before design/layout/frontend/mobile, reports never installs, accessibility unowned, tools not entrypoints; structure/text/backend/scripts exclusions; wireframe vs visual |
| copywriting | super-ux condition; all shipped product text examples; brand files first, brand-init if absent; commit/PR/comments/developer README/internal/chat excluded; opted-out pack disclosure; parallel design and copy share scenarios/compare; landing vs social composition |
| sheleg-dev | Installed condition; seven named integrations; webhook vs redirect and shared event_id; wiring vs behavior/tiers/look/words/price; refusal must not use integration trigger; payment ownership |
| agent-stack | Installed condition; loops/workgraphs/prompts/tools/workflows/evals/MCP/A2A/registry/gateway/wallet; single calls/prompts/person-facing UI/charging/edit coordination excluded; charge vs meter and built system vs file claims |
| telegram-dev | Installed condition; Bot API/MTProto/Mini Apps; update_id, revocable/bannable session risks; platform vs alert transport, UX/design/card exclusions; Stars/token/account ownership |
| xr-dev | Installed condition; OpenXR/Spatial/WebXR, refresh frame budget, toolchain/headset/store/monetization/launch/operation; lifecycle owner/evidence/next; browser/phone/desktop/engine/delivery exclusions; Quest Browser takes XR and web3d |
| web3d-dev | Installed condition; three.js/R3F runtime/assets/animation named scopes, written budget/licences/release pin; scroll/heroes/video/headset/engines excluded; page vs embedded scene |
| seo-llmo | Unconditional design-time public human/machine reading; URLs/hierarchy/question/JS-free answer/markup/entities/single facts/links; audit checks not designs, rule has no pack; logged-in/admin/internal/CLI/script exclusions; copy/SEO composition |
| evidence-docs | Unconditional receipt for each fact, computed numbers, resolvable names, exit-code sync, docs with code; drafts/thinking/chat/commits/comments excluded; unsupported disclosure on refusal; proof vs delivery |
| task-pipeline | Installed condition; every substantial repository change; planning inside stages 2–4; questions/explanations/read-only/typo/one-line/rename/recon excluded; borderline route stated; UX content vs delivery |
| project-audit | task-pipeline condition; whole-project truth incl cold start/no brief/production evidence; HTML+JSON, read-only findings proposed rows; run deliverable/diff/PR/skill/scenario exclusions; refusal avoids audit trigger; diagnosis vs delivery |
| make-skill | Installed condition; create/retrofit/conformance/plugin/version/validator/CI/publish, frontmatter/strict validation/plain shadow; use/ordinary code/conformant doctrine exclusions; construction vs delivery |
| agent-sync | Installed AND config condition; shared decisions/questions/roadmap/workstreams/deps claim BEFORE edit, race-free IDs and journal; no config/ordinary code/solo exclusions; coordination vs delivery |

All 14 English/Russian refusal declarations remain byte-equivalent in meaning.
The sole intended doctrine correction is Telegram authentication: validate raw
`initData` on the backend; never trust `initDataUnsafe`. The previous wording
conflated parsed untrusted data with signed input. Primary source checked on
2026-10-09: [Telegram Mini Apps, initializing fields](https://core.telegram.org/bots/webapps#initializing-mini-apps),
`initData` and `initDataUnsafe` rows; [validation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).

## Verification plan

- Freeze this spec, then watch added size/auth assertions fail on baseline.
- Retain existing router, protocol, installation, drift and trigger tests.
- Parse rendered sections/map/table; assert complete membership and size budget.
- Negative controls structurally replace Telegram section content and remove a
  parsed section; assert the checker rejects both and its input truly changed.
- Real CLI updates a real temporary HOME three times, compares hashes, preserves
  outside bytes and authored text, and verifies backups (existing install test).
- Independent reviewer checks preservation matrix; root owns broader suite,
  integration, release and installed-byte acceptance.

## Results

Implemented locally; independent review, integration, publication and installed
readback belong to the parent run and are not claimed here.

Rendered whole-family block: **21,218 → 15,760 Unicode characters**, saving
**5,458 (25.72%)**. The lower bound of the frozen target is met; the aspirational
30% is not. Keep the remaining text rather than remove route scope for that goal.
All 14 parsed sections and all member/map and router/table rows remain present.
The new test computes the current figure and enforces the 25% ceiling.

The first new-test probe exposed a fixture error: `upsert` correctly refuses to
create an absent block. The fixture was corrected to seed `apply.EMPTY_BLOCK`.
The corrected baseline then failed exactly the intended two assertions:
`21218 chars exceed 25% reduction budget` and
`raw initData must be validated server-side`. Post-change it passes, with four
negative controls: unsafe-only authentication, missing unsafe-data prohibition,
a structurally removed route,
and a code-only scenario-update obligation. Each control asserts the changed parsed input
before asserting rejection.

Review correction: the first compact draft accidentally narrowed scenario
updates to user-facing *code*. The reviewer caught this; the follow-up restores
"the SAME user-facing change", including product decisions without code. Its
new positive check was observed failing before correction; a structural
code-only negative control also rejects the narrowed wording.

Focused checks at `9c4f12c`, each exit 0:

| Command | Result |
|---|---|
| `node test/router_compaction_test.js` | OK (8 checks) |
| `node test/router_texts_test.js` | OK (90 checks) |
| `node test/protocol_test.js` | OK (13 checks) |
| `node test/routers_test.js` | OK (38 checks) |
| `node test/install_routers_test.js` | OK (17 checks) |
| `node test/drift_test.js` | OK (27 checks) |
| `node test/triggers_test.js` | OK (61 checks) |
| `node test/hooks_e2e_test.js` | OK (42 checks) |

The parent integration suite subsequently caught an omitted existing literal
contract in `inventory_test.js`: the map must say "does not outrank this map".
A direct rerun reproduced its one failure before correction. The replacement
retains that wording without changing its precedence meaning or block size.
Follow-up checks on the corrected source: `node test/inventory_test.js` →
OK (12 checks), `node test/router_compaction_test.js` → OK (8 checks),
`node test/protocol_test.js` → OK (13 checks), all exit 0. Existing tests remain
unchanged. The parent owns the final full-suite check and official installation;
the earlier local application receipt describes its own dated source cut.

The installation suite runs the real `routers --update` CLI three times in a
real temporary HOME, compares file hashes, and verifies authored wording,
outside-block prose and backups. This is filesystem evidence for the actual
write path; it is not an installed-host acceptance claim. Existing tests were
not relaxed or edited.

Self-review against the preservation matrix: the only intended policy change
is the documented Telegram correction. Repeated rhetoric, duplicate positive
boundary headings and illustrative repetitions were shortened. The negative
boundaries, aliases, source-file naming, refusal duration, claims and proof
requirements remain. This semantic conclusion is implementer judgment; the
independent reviewer must verify it.

**Next:** review this source diff against the matrix, run the parent integration
gates, then release/install and compare the resulting managed blocks. No live
operator files, skill caches, member pins or release versions were changed here.

**Used:** task-pipeline for bounded implementation, TDD and the review handoff;
repository routing was read from `CLAUDE.md` and `docs/HANDOFF.md`. Telegram's
primary documentation supplied the authentication correction.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded router compaction and verification


Source fingerprints after the inventory-contract correction (SHA-256):

- `lib/routers.js`: `7f9e3ddf6b3fc857aa3d64d0328ea1992e2ec2f050bb6127325db49af8eb81ea`
- `lib/routers-registry.js`: `7b867ac354c1bd8bf33a27b991def30b31e1408d4dd2b226e1994bd6c3c8c032`
- `test/router_compaction_test.js`: `4ac8de1f608513f37736e24007f7a9b8f6beb166a4226b49d1d81800a128f13b`
