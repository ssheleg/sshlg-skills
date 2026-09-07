# Sherlock family audit: repository bundle

Start at [the repository handoff](../../../HANDOFF.md). The current development
queue is [v3](external-v3/development-plan.md), with [254 task packets](external-v3/leaves/)
and [139 parent outcomes](external-v3/parents/). Open the [interactive report](external-v3/report-v3.html)
locally; GitHub displays HTML source. The [Markdown report](external-v3/report-v3.md)
works directly on GitHub.

## Reading order

1. [Work brief](external-v3/brief.md), [program context](extension/context/program.md),
   [architecture](architecture.md), [pipeline/Fabric extension](extension/report-v2.md).
2. [External knowledge audit](external-v3/report-v3.md) and its three source reports.
3. [Plan](external-v3/plan.json): choose one leaf and read its primary Markdown,
   parent acceptance, module contract and named dependencies. Do not load all leaves.
4. [Repository revisions](repositories.json), [published member branches](publication.json).

## Portable paths and freshness

`audit://path` resolves inside this directory. `repo://name/path` resolves in the
named checkout from `repositories.json`. Source links in prose use pinned GitHub
commits. Source digests are audit baselines: refresh them after applying prepared
branches or after upstream work changes a target. Missing or changed input blocks
dispatch; it never silently becomes permission to use stale context.

Run `python3 tools/handoff.py verify` from this directory.
Run `python3 tools/test_handoff.py` for the negative packet checks. To inspect one packet,
run `python3 tools/handoff.py show FIX-RT-01.01`. Optional `--roots roots.json`
checks source freshness using a JSON map of repository names to local checkout
roots. These commands do not install, dispatch, claim tasks or edit source files.

All audit findings, context and plan outputs are retained. Foreign repositories,
virtual environments, caches, installed-agent rosters and synthetic working trees
are excluded. Authoring/one-off probe scripts are not runtime dependencies of the
bundle. Their historical command receipts can name unavailable machine-snapshot
paths; do not run those commands as fresh instructions. Refer to pinned source
repositories when reproducing a probe. Nothing here proves future host handoff
or model-quality outcomes.

The original machine paths have been relocated. Old validators and their digests
are historical receipts, not fresh validation of these exported bytes. The active
plan's local context digests have been refreshed; the transport manifest checks
the bundle separately. Retired Nicegram observations remain historical evidence.

## Publication

The instruction changes are on the member branches recorded in publication.json.
They are committed for continuation, not merged, tagged, installed or released.
The audit's original statements about local worktrees describe its earlier phase;
publication.json is the current delivery record. Production submodule pins remain
unchanged until the implementation/release plan integrates the approved changes.
