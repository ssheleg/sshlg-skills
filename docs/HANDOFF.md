# Start here — sshlg-skills

Snapshot: 2026-10-12. This page selects evidence and the next bounded action;
[skills.json](../skills.json) owns the current member inventory and pins.
Read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[standing retrospective instructions](evidence/retro.md) and the
[repository handoff rule](working-rules/repository-handoff.md) before editing.

## B-185 — domain members per project (2026-10-13, branch `feat/domain-members`, unreleased)

Plan [L5](evidence/plans/2026-10-13-load-optimization.md); operator decision "Yes, by domain".
The original head `e27a040` failed unit, seam and product certification. Its installation
preview and old passing gate are historical, not acceptance of the fixed implementation.
Preserved first fix `09d17a2` adds explicit `--enable`/`--disable`, symlinked repositories,
missing-root refusals, partial-scan protection, and additions-only unattended updates.

The recovered second fix preserves hook-bearing plugins globally (sheleg-dev always),
keeps installed disabled skills searchable, resolves project enablement for hook readers,
and refreshes existing plugins without reinstalling them. Malformed/oversized manifests
are incomplete evidence; a member already scoped goes back on when coverage is uncertain.
Independent review of `353033a` exposed interrupted-write, shared-settings and truncated
source-search defects. The follow-up saves atomic recovery intent before settings writes,
distinguishes pending global writes from later operator changes, retains unknown project
ownership and serializes mutations with the update lock. Shared project settings now
precede local settings; all matching source lines are scanned; unloaded route hints print
once per session. A further independent replay of `3c0cb53` required valid global plugin
settings before revert removes local entries; malformed global JSON/maps now retain all
recovery state. The machine's configurations have not been applied by this development task.

Implementation: `lib/domains.js`, `lib/domainscan.js`, `lib/enablement.js`, launcher and hooks.
Focused checks and bounded scenarios are recorded in
[evidence/runs/2026-10-13-domains-recovery.md](evidence/runs/2026-10-13-domains-recovery.md).

**Exact next task:** independent unit/seam/product review of the final branch head, then
integrate with L1, run the full hub gate, release, and refresh through the published launcher.
After release, preview `npx sshlg-skills domains`, apply the authorized domain choice with
`--apply`, and read back both a domain project and a fresh project outside the domains (L4).
Do not restore the old design that disabled sheleg-dev's money gate.

## Closed — integration waves (2026-10-11/12, lease `WAVES-1011`)

`/task-pipeline waves` over the whole board, with the operator's emphasis on optimisation
and on the family working with Fabric, Observatory and every coding agent.
**Read first:** [acceptance and REQ coverage](evidence/acceptance/2026-10-11-integration-waves.md)
· [brief + REQ table](evidence/briefs/2026-10-11-integration-waves.md)
· [plan](evidence/plans/2026-10-11-integration-waves.md)
· [compatibility cut](reports/2026-10-12-coding-agent-compatibility/README.md)
· retro stamp "2026-10-11/12 — integration waves".

Shipped: hub 1.56.0 → 1.59.0; task-pipeline 1.93.3, agent-sync 1.22.1, agent-stack 0.27.1,
make-skill 0.31.1. Not every member PR passed three readings before its first merge: fix
commits made after a passing reading were merged unread in four repositories; an independent
observer caught it, each was re-read, and every finding was fixed in the patch releases above.

**Exact next task:** W4-C — run the `skill-search` trigger evals (make-skill
`test/evals/skill-search/triggers.json`) and the paired routing arms (`test/evals/README.md`)
on a model once the Sonnet weekly limit resets (2026-10-16); record run ids, arms, n and cost;
decide B-144 and B-147. Then the open rows by priority (B-171/B-172 guard coverage first).

**Waiting on the operator:** Gemini sign-in (B-146); AS-14 drop or keep; whether the
R18 age sweep (`reap --long-expired`) is acceptable; the Notion tokens into the vault (R20);
B-143 pack-triage marks; who owns the `SSHLG:REPOSITORY-HANDOFF` block (B-174).

## B-169 / B-170 — the fabric rule only where Fabric is; the block headed in English (2026-10-12, unreleased)

Asked by project-observatory's release iteration 1 (audit USR-012); rows B-169 and B-170 are filed
by the waves close-out. **B-169:** routers may declare a machine predicate (`machine:` in
`lib/routers-registry.js`, predicates in `lib/machine.js`); `fabric` holds only where Fabric's
services directory exists, in the block and in the prompt hook. A 1.58.0 block on a machine
without Fabric loses the section and its row on the next update; the packaged text is not stashed,
an operator's wording is. `working-in-passioncode` left the fabric rule and its hook route.
**B-170:** the block heading is `## Work routing — the ssheleg family`; the Russian heading is an
alias, retitled on the next write; migration finds the block by sentinels, so neither heading is
taken for a hand-written rule.

Checks run: `npm test` green on db49a57 + this change — 102 suites, 1356 fixtures, 11 pinned
members (DOCMAP ratchet 1349 → 1356, suites 101 → 102 with `test/machine_predicate_test.js`); the six sandbox cases each
end in three runs with identical hashes.

**Exact next task:** after the hub release that carries this publishes, `npx --yes sshlg-skills@latest update`
on this machine (Fabric present: the fabric section stays, minus `working-in-passioncode`; every
host file retitled in English), then tell project-observatory-b1 and sshlg-skills-40.

## B-166 — Codex native plugins through Codex's CLI (2026-10-12, branch `fix/codex-native-refresh`)

Developer agent under lease `WAVES-1011`. `update` now moves family plugins that Codex holds
below the pin, using Codex's own CLI: remove the marketplace, re-add it at the pin, add the
plugin, and read it back from `codex plugin list`. Rollback uses the previous ref, read from
`config.toml` before the removal
([lib/codexplugins.js](../lib/codexplugins.js); `refreshCodexPlugins` and `planCodexSteps` in
[bin/sshlg-skills.js](../bin/sshlg-skills.js)). The pin ref is the gitlink commit in a checkout
and the tag `v<version>` from npm. The published package ships no SHA; all eleven tags peel
to their gitlinks, measured 2026-10-12. B-166 is closed in the
[backlog](evidence/backlog.md) with the evidence; the CHANGELOG entry is under *Unreleased*.

Checks run: the new e2e suite fails 10 of 11 on `ce3983b` (`origin/main`) and passes all 11
on the branch. The eleventh case is the leave-it-alone guard. Four planted defects were caught
by `test/codexplugins_test.js`. `npm test` is green with the counted ratchets. A real Codex
0.162.1 run, with a sandbox HOME and CODEX_HOME through the branch's `update --agent codex`,
moved agent-sync 1.21.7 → 1.22.0 at `517b4b6` and left web3d-dev, already at its pin,
untouched. A `--dry-run` against a copy of this machine's `config.toml` lists all nine family
marketplaces, including the `["marketplaces"."web3d-dev"]` quoting.

**Next:** review and merge the PR. The machine's Codex moves on the first `update` of a
release that carries this change. This branch was not run against the operator's HOME.

## Router addition — fabric (2026-10-12, released as 1.58.0)

Requested directly by the operator, outside the waves board: the fifteenth router.
If Fabric is installed on the machine (its services directory present), Fabric work and
local-service questions go through the Fabric tooling; the boundary refuses generic
Docker/PostgreSQL/nginx services and brand-new agents with no Fabric contract requested.
Memberless on purpose (`requires: []`, documented on the entry in
[lib/routers-registry.js](../lib/routers-registry.js)): the condition is the machine, and
the four target skills ship in the fabric-agent-adapter plugin outside `skills.json`.
The hook route fronts those skills with `foreign: true` — the first route whose skills
this repository does not ship — every trigger verbatim from the named skill's own
description. Refusal "no fabric" / «без фабрики».

Recorded moves, all in the same change: the block budget 15,913 → 17,600
(`test/router_compaction_test.js` carries the 17,501 measurement on top of 1.57.0; the room-buying trim is
B-154's); `test/validate.py`'s router extraction is `[a-z0-9-]+` — `web3d-dev`'s digit had
made the README count guard read fourteen names of fifteen; the acceptance receipts
[ctx-04.02.json](evidence/acceptance/ctx-04.02.json) and ctx-04.03 are re-emitted for the
fifteen-namespace block; the eval corpus declares `fabric` unprobed-by-model until the
next paired run (B-147). The full entry is the [CHANGELOG](../CHANGELOG.md) top section.

Checks run: `npm test` green on `origin/main` 36a5b23 + this change — 99 suites, 1295
fixtures, 11 pinned members (the DOCMAP ratchet moves 1289 → 1295 with the new corpus
cases; the description total stays at 32501, the router adds no member description);
`node test/route_coverage.js` — the twelve fabric corpus cases pass (7 route, 5 measured
silence).

**What happened on the machine.** The change was first written in the main checkout on
the stale `waves/2026-10-11-integration` base (5852c57) and applied from there with
`routers --update` at 13:13:35Z: that put the fabric block into the host files but also
reverted the 1.56.0 refusal-phrase paragraph. The 1.57.0 machine install by the release
session restored the paragraph and dropped the fabric table row. Nothing is applied from
a checkout again: after release, `npx --yes sshlg-skills@latest update` writes the block
and its row to every `apply.TARGETS` host file, Pi's `~/.pi/agent/AGENTS.md` included.

**Released and installed 2026-10-12.** #198 squash-merged as `103e25c`, tag `v1.58.0`, release run
[38272767689](https://github.com/ssheleg/sshlg-skills/actions/runs/38272767689) success (validate, release,
publish), npm 1.58.0. `npx --yes sshlg-skills@latest update` on this machine: exit 0, 83 of 83 steps green;
`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.pi/agent/AGENTS.md` and
`~/.cursor/rules/sshlg-routing.mdc` each carry `SSHLG:ROUTER:fabric`, its table row and the 1.56.0
refusal-phrase paragraph. The waves board's next bounded task stays W1-C as above.

## Previous delivery — family round 1.55.0 (2026-10-10/11)

[Brief](evidence/briefs/2026-10-10-family-round.md) · [plan](evidence/plans/2026-10-10-family-round.md) ·
[delivery receipt](evidence/family-round-1010/DELIVERY.md). Lease `FAMILY-ROUND-1010`.

The review of 1.54.7 measured what its readback could not: Claude Code's skill
listing was 274,398 characters against a 30,000 budget and Codex dropped 220 skills
(`task-pipeline` among them) from its model list. Operator decisions: a small core
stays listed, the rest is hidden and reached by a search that is now every task's
first step (`toolkit --find`, the routing protocol, make-skill's `skill-search`).
`npx sshlg-skills visibility --apply` writes Claude `skillOverrides` and Codex
`skills.config` through backups; `--revert` removes only what it added.

Eleven members released with annotated tags and a release gate that refuses a
lightweight tag; `skills@1.7.2` pinned. Installation and the post-apply listing
readback are recorded in the receipt's last section.

**1.55.1 (2026-10-11), same round:** `update` restores Continue's copies after every
refresh (`skills@1.7.2` had re-linked 13 of 38; verified on this machine 39/39 real
dirs, 137/137 installed payloads equal); the hygiene guard allows an agent-scoped
`skills add` (B-153); the MCP credential guard from #184; the XR creative research
branch merged. Members: task-pipeline 1.91.2 (gates read the current run only; a
broken python3 stops only releases — B-151, B-152), agent-sync 1.21.7 (shared-identity
`acquire` refused, worktree session stamps, direct `guard` allows an uncoordinated
repository — B-150), make-skill 0.30.1 (family members update through the launcher).
Branch cleanup: hub 10 worktrees + 24 local + 71 remote branches, members 5 worktrees +
54 local + 115 remote branches — each removed only after its PR merged or every file
it touched was present in `main`; the one unique branch (XR research) was merged and
the one unique test (`guard_uncoordinated_test.py`) was ported into agent-sync 1.21.7.

**Open, with owners:** B-145 (plugins keep Claude over budget — operator),
B-146 (Gemini CLI channel and sign-in — operator), B-147 (`skill-search` evals),
B-148 (new compatibility cut; Pi links), B-154 (task-pipeline description trim), HK-05/#91 (task-pipeline CI 105 min,
`validate.yml` 506 KB of 512 KB). Disk: other sessions' test temp directories keep
free space near 2 GB on this machine — not this repository's to delete.
**1.55.2 (2026-10-11):** fabric-90's wave mode shipped — task-pipeline 1.92.0
(`/task-pipeline waves`: the whole board closed in waves; the grill asks one batch),
the routing block names it; installed and read back (83/83, Continue 39/39,
137/137 payloads, Codex native 1.92.0). Reserve ratchet 13 → 14 until task-pipeline
trims its description (B-154). agent-stack B-155: the on-behalf-of delegation doctrine
for `gateway.md`, waiting for Fabric's ADR-0144 plan to reach Fabric main.

**1.55.3 (2026-10-11):** agent-stack 0.26.0 ships that doctrine (B-155 closed) — on-behalf-of
tokens, offline verification, the meter token, `approval/1`, one refusal vocabulary, with
Fabric `fabric-delegation/0.1` as the worked example. Installed and read back (83/83,
Continue 39/39, 137/137 payloads, Codex native 0.26.0).

**Former next task (now R27, wave 4):** B-147 — paired routing eval of the search-first
protocol and `skill-search` (arms with/without the protocol sentence, per
`test/evals/README.md`), then decide whether Codex needs its own core list.

The previous [host compatibility delivery](reports/2026-10-09-coding-agent-compatibility/README.md)
(1.54.7, [delivery.json](evidence/host-compat/delivery.json)) is now a historical receipt.

## Most recent completed delivery receipts

- [Context research 1.54.5](evidence/context-research/README.md),
  [delivery receipt](evidence/context-research/DELIVERY.md): agent-stack 0.25.5,
  source/package/installed-byte receipts. The new follow-up owns later host tests.
- [Instruction context 1.54.4](evidence/instruction-context/README.md): earlier
  compaction and installation slice; its NOT_VERIFIED labels describe that date.
- [Team evaluation and crawl evidence](runs/2026-10-09-knowledge-wave2.md): 1.54.3.
- [Channel evidence and SEO correction](runs/2026-10-09-channel-digest.md): preceding delivery.

## Historical work and unresolved follow-ups

The [Sherlock progress snapshot](evidence/audits/2026-09-07-sherlock/external-v3/progress.json)
records all its leaves done, including FIX-SY-01.01; the
[debt snapshot](evidence/audits/2026-09-10-debts/progress.json) records all its rows done.
Those implementation statuses do not independently prove present deployment or
host acceptance. Do not start their old exact-next instructions or reapply prepared
September patches. Use [the bundle entry](evidence/audits/2026-09-07-sherlock/README.md)
only when investigating that dated work.

The [family-hooks snapshot](evidence/audits/2026-09-13-family-hooks/progress.json)
still records HK-05 as planned and HK-13 as open for the operator. Their present
owner/release state has not been revalidated by this context repair. Reconcile that
state before selecting work from the [dated plan](evidence/audits/2026-09-13-family-hooks/plan.md);
neither item is a universal next instruction for every new task.

**Archive boundary:** the [previous handoff](HANDOFF-2026-10-09-archive.md) is frozen
historical evidence, not operational instructions. It is a verbatim copy of
[this source revision](https://github.com/ssheleg/sshlg-skills/blob/a4c65581787b5ddcb3df1e36a8cae1c89c066479/docs/HANDOFF.md).
Its old status claims and exact-next headings describe their own dates. The same
directory depth preserves relative links; [archive metadata](evidence/context-research/navigation.json)
records its source and hash. Earlier release and workstream links remain there.
