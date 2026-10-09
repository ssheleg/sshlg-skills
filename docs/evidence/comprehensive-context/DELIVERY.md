# Comprehensive context delivery — 2026-10-09

<sub>ssheleg skills — task-pipeline · make-skill · agent-sync · agent-harness · agent-evals · evidence-docs · project-reports</sub>

## Source and verification

- Hub implementation: [PR #178](https://github.com/ssheleg/sshlg-skills/pull/178),
  reviewed/tested head `772d2935c07732c46fff2e3f0721c7dd58d65922`, squash merge
  `259594eeee630ecdf239756a7c2ac2bc488c16ca`; annotated tag `v1.54.6`.
- Local `npm test` passed **92 suites / 1120 fixtures / 11 members** on that
  implementation head. Both automatic PR validation runs passed:
  [37940656443](https://github.com/ssheleg/sshlg-skills/actions/runs/37940656443)
  and [37940661571](https://github.com/ssheleg/sshlg-skills/actions/runs/37940661571).
- make-skill `0.29.1` is pinned to
  `2f5a1ad24c2145bcb72c601b3bd899f942a3acca`. Its
  [independent release receipts](https://github.com/ssheleg/make-skill/blob/798fe0f1e8dcd8bd0d1fe6dfd2fc6bf035867632/docs/evidence/releases/2026-10-09-make-skill-0.29.1/README.md)
  verify the canonical npm tarball (32 files) and native plugin (25 files).
  The parser's multiline plain descriptions no longer produce false missing-field findings.
- [Router review](review.md) and [release integration review](integration-review.md)
  are separate. All fourteen routes retain their scope, refusal and precedence rules.

## Measured result and limits

The complete managed router block shrank from **21218 to 15760 Unicode
characters** (5458 / 25.72%). Only prose changed; routing algorithms, markers,
authored-file precedence and restoration behavior remain intact. The fixture
checks include non-code user-facing changes and malformed managed-block boundaries.

The private report owns the machine-wide census, source URLs, restore manifests,
host catalogue changes and model traces. They are intentionally not copied into
this public repository. A mechanical census does not establish semantic quality
for every skill. Selected host tests cover fresh discovery, exact resume and real
native compaction; they do not establish GUI refresh or general quality gains.

## Package and installed acceptance

The [release workflow](https://github.com/ssheleg/sshlg-skills/actions/runs/37942062863)
completed successfully in all three jobs at the release SHA ([receipt](release.json)).
The [canonical registry readback](registry.json) verifies exact version/gitHead,
SHA-512 integrity and all **58 tarball files** against Git. The existing verifier
ran as `python3 -E` so optimization environment settings cannot disable its checks.

The official `npx --yes sshlg-skills@1.54.6 update --all` completed **71/71 steps**,
exit 0 ([install receipt](install.json)). Readback then verified:

- [54 managed runtime files](runtime-readback.json): zero mismatches.
- [38 family skills in skills-CLI and Claude plugin channels](family-payload-readback.json):
  **1074 file comparisons**, zero mismatches, versions and parent pins checked.
- [Four global managed blocks](router-preservation.json): exact released-renderer
  bytes. Outside-block text in all six inspected instruction files is unchanged.
  The hub-specific three-file instruction chain is now **39669 Unicode characters**;
  this is a different scope from earlier PersonalOS measurements.

The installer explicitly reports native Codex updates as unsupported by its own
lifecycle. The separate native lifecycle receipt owns that channel; a green
71-step updater does not establish native plugin refresh or GUI reload.
Child skills-CLI output also contains **76 unsupported global-install targets**
for Eve/PromptScript. Those targets are not accepted by the measured two-channel
payload comparison; the wrapper's green summary does not override child notices.
[Separate native readback](native-readback.json) confirms make-skill's 25 native
plugin files and 19 shared skill files match the same release source; the fresh
native roster remains 566 total / 537 enabled / zero errors with the same 29
excluded paths. No model call or configuration mutation was needed for this readback.

## Next bounded task

Design an evidence-based host visibility profile that keeps rarely used skills
discoverable. Do not blanket-delete similar third-party skills or equate metadata
token proxies with billed token savings. Preserve the independent owner queues
and original source corpus.

Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills): task-pipeline
(delivery), make-skill (construction audit), agent-sync (ownership), agent-harness
and agent-evals (context acceptance), evidence-docs (receipts). project-reports
supplies the private report and generated wiki index standard.
