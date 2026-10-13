# Member patch publication and byte readback, 2026-10-13

This is a source/tag/registry receipt. Family pins, global installation and native
agent behavior remain separate acceptance steps owned by the hub coordinator.

| Member | Version | Tagged merged source | Successful release run | Byte-equal packaged files |
|---|---|---|---|---|
| telegram-dev | `0.2.4` | `35bb98527884df798c4120957452ba37bae01e90` | [38340360324](https://github.com/ssheleg/telegram-dev/actions/runs/38340360324) | 22 |
| xr-dev | `0.3.4` | `4bd9e978ca6f73b73e91f26cd58b67323383c5f4` | [38340370423](https://github.com/ssheleg/xr-dev/actions/runs/38340370423) | 39 |
| web3d-dev | `0.1.4` | `b364213ad3705449b3ffcb6c8f65c090310ceca2` | [38340380810](https://github.com/ssheleg/web3d-dev/actions/runs/38340380810) | 20 |

Each candidate passed its required local owner gates and independent metadata
review, was promoted from draft once, passed genuine pull-request checks, and
landed by ordinary exact-head squash merge. Each new tag is annotated; remote
peeled tag SHA equals the source above. No old tag was rewritten.

The [machine receipt](member-release-readback.json) carries run identity, GitHub
release URL, npm integrity, tarball hash, and per-file SHA-256/size. Every file in
the downloaded exact-version npm tarball was compared byte-for-byte with its
committed tagged source; the payload path set matched the pre-release pack
preview. All **81** files across these three packages matched.

For each exact registry version, `npm exec --yes --package=@ssheleg/<member>@<version> -- <member> --help`
ran from a non-repository temporary directory with isolated HOME and npm cache:
exit 0, usage output observed, no `.claude/skills` installation. Those owned
temporary directories were removed. This is executable help/payload evidence,
not a native host activation or task-quality verdict.

Agent-sync 1.22.2 remains in preparation on its isolated release branch, following
PR35's hosted validation. Its eventual readback will be appended only after
actual publication, never inferred from the three completed siblings.

Exact next task: coordinator integrates these receipts, moves family pins only to
verified releases, then performs the separate global installation/readback pass.
Skills: make-skill (release construction), task-pipeline (normal delivery),
agent-sync (ownership), evidence-docs (exact artifact and scope receipts).
