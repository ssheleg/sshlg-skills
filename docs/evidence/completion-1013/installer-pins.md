<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# B-186 — production installer immutable-source contract

## Finding and authority

At hub `ae1b415bc79a3d89ca97199299e0e00a2a5e7674`, production `bin/sshlg-skills.js`
uses `plan.installPlan` and `plan.updatePlan`. Those builders in `lib/plan.js` use
floating repository sources. `installPlanLocked` and `resolvePayloads` exist but are
not production admission checks. Worse, `addArgsPinned` emits `repo@sha` while the
installed skills@1.7.2 `parseSource` treats that suffix as `skillFilter`; its fragment
syntax carries `ref`. This is source inspection, pending a real CLI counterexample.
The historical pure fixture asserts the mistaken spelling and cannot validate the
external contract.

The operator authorized autonomous completion, integration, release and local refresh.
Do not run the full plain-host update until this contract has a passing correction.
Claude-only v1.62.0 refresh completed separately; that observation does not prove
immutable native-plugin payload selection.

## Execution packet

1. Reproduce old/new source interpretation against the actual pinned CLI without
   altering real host skills. Keep an owned fixture and source version/hash evidence.
2. Inspect the existing release-set model before introducing another lock. Resolve
   every selected member to a reviewed immutable SHA; published npm packages must
   carry enough source information even without Git metadata/submodules.
3. Wire that source into real install/update and their preview through one builder.
   Do not run a floating `skills update` first. Refuse missing/malformed pins before
   mutation. Preserve named agent targeting, shared-store disclosure, shadow rules,
   and Continue real-directory copies, including previously installed Continue copies.
4. Check the packaged artifact against committed Git links and the external CLI.
   Negative cases include unsupported/missing pin, wrong member, floating fallback,
   partial selection, and failed source fetch. Installed bytes require independent
   readback; argv tests alone are not acceptance.
5. Update operating docs in the same change, independent review, focused then full
   gates, frozen candidate PR, normal merge, exact-merge release, published-package
   local update and readback. Native-plugin channels retain their separate bounds.

Owner: parent coordinator plus delegated installer implementer. No foreign root or
provider key use. No release tag rewrite, automatic main reset or unrelated config
cleanup. Deliver a pushed branch and exact SHA to the coordinator before integration.

## Coordination

The parent holds `COMPLETION-1013`. `agent-sync reserve backlog` reports that this
repository declares no such ID register (`idRegisters` is empty). B-186 was allocated
under the parent's exclusive board ownership after checking absence; no fabricated
reservation receipt is claimed.

## Acceptance still open

Reproduction, implementation, independent review and real-host payload comparison
are pending. A source-correct argument is necessary but does not alone prove that
all loaders consume the intended payload.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**
- task-pipeline — bounded implementation and release wave
- evidence-docs — external-contract evidence and acceptance limits

## Independent implementation review

Coordinator read source9ef4238 and independently reran the six grouped process
controls plus the actual installed skills@1.7.2 probe. All passed: `@` is a skill
filter, `#` carries the ref; the synthetic Git default moved A→B while the pinned
sequence installed A→B→A→A→A with exact file equality and real Continue directories.
The CLI bundle hash is72f1805ea4f6c62b0532cb77a9f021e7930bb7ca962f87a3fbf985d1ada5d56d.
No real host skill or provider was used by that probe. The source is integrated in
the parent branch; malformed repository-source follow-up, aggregate gate and actual
published install/readback remain pending. Claude's working native lifecycle is
retained and explicitly labelled version-following / immutable source NOT_VERIFIED;
it is not destructively removed merely to assert a stronger contract.
