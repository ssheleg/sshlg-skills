# Member patch publication and byte readback, 2026-10-13

This is a source/tag/registry receipt. Family pins, global installation and native
agent behavior remain separate acceptance steps owned by the hub coordinator.

| Member | Version | Tagged merged source | Successful release run | Byte-equal packaged files |
|---|---|---|---|---|
| telegram-dev | `0.2.4` | `35bb98527884df798c4120957452ba37bae01e90` | [38340360324](https://github.com/ssheleg/telegram-dev/actions/runs/38340360324) | 22 |
| xr-dev | `0.3.4` | `4bd9e978ca6f73b73e91f26cd58b67323383c5f4` | [38340370423](https://github.com/ssheleg/xr-dev/actions/runs/38340370423) | 39 |
| web3d-dev | `0.1.4` | `b364213ad3705449b3ffcb6c8f65c090310ceca2` | [38340380810](https://github.com/ssheleg/web3d-dev/actions/runs/38340380810) | 20 |
| agent-sync | `1.22.2` | `3dbafd82eb635d8e79b65ddc0c3d1fd8205936db` | [38344534692](https://github.com/ssheleg/agent-sync/actions/runs/38344534692) | 30 |

Each candidate passed its required local owner gates and independent metadata
review, was promoted from draft once, passed genuine pull-request checks, and
landed by ordinary exact-head squash merge. Each new tag is annotated; remote
peeled tag SHA equals the source above. No old tag was rewritten.

The [machine receipt](member-release-readback.json) carries run identity, GitHub
release URL, npm integrity, tarball hash, and per-file SHA-256/size. Every file in
the downloaded exact-version npm tarball was compared byte-for-byte with its
committed tagged source; the payload path set matched the pre-release pack
preview. All **111** files across these four packages matched.

For each exact registry version, `npm exec --yes --package=@ssheleg/<member>@<version> -- <member> --help`
ran from a non-repository temporary directory with isolated HOME and npm cache:
exit 0, usage output observed, no `.claude/skills` installation. Those owned
temporary directories were removed. This is executable help/payload evidence,
not a native host activation or task-quality verdict.

Agent-sync 1.22.2 was published only after its source PR35 and release PR36
passed genuine eligible validation and merged normally. The new annotated tag,
release/publish jobs, exact npm version, package bytes and isolated executable
help are all observed in the machine receipt; global installation remains separate.

Exact next task: coordinator integrates these receipts, moves family pins only to
verified releases, then performs the separate global installation/readback pass.
Skills: make-skill (release construction), task-pipeline (normal delivery),
agent-sync (ownership), evidence-docs (exact artifact and scope receipts).


## Repository-only shared-gate successors

The hub's existing copied-mechanism guard found missing declarations on the
identical `member_gates.py` and `member_gates_test.py` copies. Each owner added
comment-only `shared-mechanism`/`diverges: none` headers and an evidence packet.
Independent AST comparison confirmed unchanged Python behavior; every owner
passed `npm test` and 42 process controls. The isolated real hub guard changed
from six missing-header failures to zero and still rejected an undeclared
constant plant. No guard exemption or threshold relaxation was introduced.

| Member | Merged successor source | PR | Eligible successful candidate run |
|---|---|---|---|
| telegram-dev | `711576f89d06525ee94ad4aac0f779a5baeefdd5` | [PR14](https://github.com/ssheleg/telegram-dev/pull/14) | [38344014201](https://github.com/ssheleg/telegram-dev/actions/runs/38344014201) |
| xr-dev | `d36912f4a69be90b920ff7c15a890c805761b35c` | [PR7](https://github.com/ssheleg/xr-dev/pull/7) | [38344016163](https://github.com/ssheleg/xr-dev/actions/runs/38344016163) |
| web3d-dev | `b993d2517545a0d3f4fb6358f4942c7025fc2fdf` | [PR8](https://github.com/ssheleg/web3d-dev/pull/8) | [38344018019](https://github.com/ssheleg/web3d-dev/actions/runs/38344018019) |

Each merged tree equals its reviewed candidate. All 81 published npm-file hashes
were then rechecked against these exact merged commits and matched the release
receipt above. Thus the coordinator can pin these source successors without a
new package version or historical tag rewrite. The machine receipt separates
the tagged release source from this later repository-only successor.
