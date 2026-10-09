# Context research delivery — 2026-10-09

Source PR 176 merged as `d8fae7c45f1f18d7cec511231ad2688f840872e7`.
Tag `v1.54.5` names that commit; [release 37911169723](https://github.com/ssheleg/sshlg-skills/actions/runs/37911169723)
completed successfully. [Registry readback](release-readback.json) checks gitHead,
SHA512 tarball integrity and all 58 published files against the exact Git source.
The initial pre-propagation read returned 404; readback was accepted only after
registry propagation, without republishing.

Only agent-stack changed in the parent manifest: 0.25.4 → 0.25.5 at
`b512cb4d67c1acbfd36fde94935cc993e1fc91b7`. Its
[member handoff](https://github.com/ssheleg/agent-stack/blob/9c00c797c126bba0ddbfb4d03d6cfe65c55c39aa/docs/evidence/context-lifecycle/handoff.md)
separates release payload from the later receipt commit. Other 10 member pins are unchanged.

## Review and checks

[Root review](review.md) accepted the bounded source; [independent integration review](integration-review.md)
accepted the pin, version and receipt delta. `npm test` on the exact release SHA
passed 91 suites / 1112 fixtures across 11 pinned members: [hosted readback](release-ci-readback.json).
The earlier local integration log digest remains in [delivery.json](delivery.json);
it is not transferred to a later commit. Hosted source PR checks, exact-release
checks and Pages workflow succeeded. No full hosted suite
was manually dispatched.

The dated [CR3 measurements](measurements.json) remain unchanged. Later parent
entry hashes live in [entry-readback.json](entry-readback.json). Old handoff content
and standing retrospective rules remain byte-identical; navigation fixtures are
not proof of instruction semantics. The new lifecycle reference is a manual
procedure; no model quality or cost improvement is claimed.

## Installation

The official `npx --yes sshlg-skills@1.54.5 update --all` completed all 71 runner
steps from `/tmp`, exit 0: [installer receipt](installed-readback.json).
The [family readback](family-payload-readback.json) compares all 38 skill payloads
in skills-CLI and Claude-plugin channels: 1074 file comparisons, zero mismatches.
The [runtime readback](runtime-readback.json) compares all 54 wired files to the
release source: zero mismatches. Five public-path instruction baselines retain
their outside-router hashes. Full local-only instruction and retirement receipts
remain in the private central handoff.

The installer reports 76 unsupported global-install rows: 38 skills each for Eve
and PromptScript. These hosts are not accepted by the runner's green summary.
Native Codex agent-stack 0.25.5 has its own member receipt; this does not imply
native installation or live loading of every plugin in every host.

[Website readback](site-readback.json) returned 200 and both 1.54.5 / 0.25.5 strings.
This was an HTTP read, not browser visual or interactive acceptance.

## Reproduce the byte checks

From the repository root, with the source and pinned submodule commits available:

```sh
python3 docs/evidence/context-research/verify-registry.py . sshlg-skills 1.54.5 d8fae7c45f1f18d7cec511231ad2688f840872e7 docs/evidence/context-research/release-readback.json
python3 docs/evidence/context-research/verify-installed.py
python3 docs/evidence/context-research/verify-runtime.py
```

These receipts are dated observations of this operator's installed channels.
A fresh supported host loading the instructions and behavioral resume/admission
replay remain NOT_RUN. That acceptance is the next step, not another publication.
Private corpus, local-only cleanup manifests and owner queues stay in their
own private repositories; no source chat was copied into this public package.
