# Verification and research limits

Executed on 2026-09-21. Subject revisions are fixed in [BRIEF](BRIEF.md), [upstream snapshots](upstream-snapshots.json) and [xr-dev inventory](xr-inventory.json). This research branch changes documentation and evidence only; it does not change engine code, provider adapters, installed skills or family submodule pins.

## Current xr-dev checks

Executed from xr-dev at `7954ba2a884f5a71d7487981b4335c0ecdbc25d4`:

| Command | Observed result |
|---|---|
| `python3 test/validate.py` | exit 0; 11 checks, 6 skills, 10 references |
| `claude plugin validate . --strict` | exit 0 |
| `claude plugin validate plugins/xr-dev --strict` | exit 0 |
| `python3 test/validate.py --self-test` | exit 0; 8 planted defects caught |
| `python3 test/evals_validate.py` | exit 0; 18 trigger cases and 6 scenarios validated |
| `python3 test/evals_validate.py --self-test` | exit 0; planted invalid trigger boolean caught |
| `node test/installer_test.js` | exit 0; 11 cases passed; temporary homes removed |

The bundled house auditor was also run on the six xr-dev skills, installed asset-foundry and installed metavr-cli. [Raw normalized results](mechanical-audit.json) preserve each check: six xr-dev skills and Foundry each have 0 GAP / 19 PASS; metavr-cli has 5 GAP / 16 PASS. This includes house conventions and parser portability, not just host validity. No skill edits were made to obtain these results.

These are **structural and fixture-validation results**. xr-dev's source RESULTS explicitly records no executed model behavior evaluation. This turn did not run engines, compile Godot, deploy an APK, exercise a headset, invoke Blender, render a video or conduct a Store submission. None of those is marked passed.

## Source research

- Primary documentation was read through web tools and, where needed, the provider's machine-readable Markdown route. The Meta HTML route sometimes returned navigation while its `.md` route returned the article. A failed HTML fetch is not evidence the SDK lacks a feature.
- GitHub metadata, commit/tree objects and selected source files were inspected without executing third-party scripts. [Source evidence](source-evidence.json) records selected-file hashes/line counts and saved HTTP receipts. Full third-party documents and dependency trees are not vendored here.
- URLs in the narrative are dated research entry points; branch snapshots are commit-pinned. Stable documentation URLs can still change later. Recheck versions, availability, licensing, pricing and Store rules during implementation/submission.
- An unauthenticated Higgsfield MCP probe returned 401 with OAuth protected-resource metadata. HeyGen returned 403 without that challenge; its OAuth classification comes from official docs, not the probe. No login, key submission or media upload occurred.
- The active host tool list exposed Meta VR tools, but no Foundry/Higgsfield/HeyGen/Blender MCP. Installed skill inventory is a separate observation and does not prove connection availability. No claim is made about every installed desktop application.
- The existing Foundry offline suite exited 0; a fresh wheel installation reproduced the missing-registry failure. Exact private source/check receipts are in its owning repository through [HANDOFF](HANDOFF.md). This does not establish live provider readiness or a completed public-safety review.

## Report integrity

Run from the umbrella root:

```bash
python3 docs/evidence/research/2026-09-21-xr-creative/verify_report.py
git diff --check
```

The report check passed both in the worktree and a fresh remote clone (13 required files, 52 local links at report commit; see [delivery receipt](delivery.json)). The script checks JSON parseability, required report files, internal Markdown link targets/anchors, unique P01–P15 packet IDs, requirement references, and absence of machine-specific temporary/home paths in the public report. It does not certify external service uptime or semantic correctness. [HANDOFF](HANDOFF.md) records remote/fresh-checkout verification separately.

## Remaining verification belongs to implementation

Run baseline/candidate routing and behavior with the actual neighboring skill set; clean package/install/uninstall and public extraction checks; original engine/Blender/media fixtures; version-compatible API contract tests; budgeted live provider probes; on-device performance/comfort/permissions; Store dashboard review; optional Observatory redaction/enrollment tests. Every packet identifies its relevant subset. Do not turn this list into mandatory work for unrelated one-line changes.
