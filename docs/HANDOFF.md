# Start here — sshlg-skills

Snapshot: 2026-10-12. This page selects evidence and the next bounded action;
[skills.json](../skills.json) owns the current member inventory and pins.
Read [CLAUDE.md](../CLAUDE.md), [coordination](AGENT_SYNC.md), the
[standing retrospective instructions](evidence/retro.md) and the
[repository handoff rule](working-rules/repository-handoff.md) before editing.

## In flight — integration waves (2026-10-11, lease `WAVES-1011`)

`/task-pipeline waves` over the whole board, with the operator's emphasis on
optimization and the family working with Fabric, Observatory and every coding agent.
[Brief + REQ table](evidence/briefs/2026-10-11-integration-waves.md) ·
[canvas](evidence/specs/2026-10-11-integration-waves-canvas.md) ·
[plan + task packets](evidence/plans/2026-10-11-integration-waves.md) ·
[inventory](evidence/specs/2026-10-11-integration-waves-inventory.json) (238 items:
81 in waves 1–5, 3 operator, 154 program — counted from the committed JSON's `wave` field;
regenerate with `python3 docs/evidence/specs/2026-10-11-integration-waves-assign.py`).
Branch `waves/2026-10-11-integration`. New hub rows B-155…B-163.

**Waves 2–4 released and pinned in 1.57.0 (branch `w5/hub-close`).** Each member PR passed
three blind readings (unit, seam, product) before merge; remaining risks are on each member's
board. task-pipeline **1.93.2** (#109 → `8260042`; v1.93.0/v1.93.1 refused by its own release
gates, #110, #111), agent-sync **1.22.0** (#32 → `517b4b6`), agent-stack **0.27.0** (#44 →
`96ed0f8`), make-skill **0.31.0** (#33 → `5556e88`). Wave 5 hub part (R30 board plant, R32
description total, R37 Pi host) is in the 1.57.0 CHANGELOG.

**Next, in order:** release 1.57.0 and install it here (`routers --dry-run` first — it previews
`~/.pi/agent/AGENTS.md`); the compatibility cut per host (R31; Gemini after the operator signs
in to `gemini` 0.63.0); W4-C model evals for `skill-search` and the paired routing arms (B-147,
B-144); graph refresh (B-161); asks to Observatory and Fabric (R34); stage 9–10 close-out and the
observer's verdict.

**Wave 1 (hub skeleton, R01–R06) is built and has had two fix rounds on PR #192** (branch
`w1/hub-skeleton`): W1-A…W1-F delivered; the first round's twelve findings and thirteen risks,
and the second blind reading's six breaks and seven risks (A–M), are mapped to commits and tests
in the [wave-1 receipt](evidence/runs/2026-10-12-wave1.md), sections *Fix round* and
*Fix round 2*. A third blind reading passed all three tiers at `244d67a`; the remaining risks
were closed without another review round in the receipt's *Final polish* section (nine items:
the lock refusal exits 75, the store lock never spins, `config.json` merges under its lock, a
stale parked displacement is cleared, one session-id key, `hooks remove` keeps foreign hooks,
the `hooks install` caveat, the documents, and `--agent` skipping the Claude plugin step).

**Wave 1 delivered (2026-10-12).** Certified by three blind readings after two fix rounds and
a final polish (receipt `evidence/runs/2026-10-12-wave1.md`), merged as #192, released as
**1.56.0** (#193; tag `v1.56.0`, release run 38215090806: validate, release, publish success;
npm `latest` = 1.56.0). Installed here with `npx sshlg-skills@latest update`: 83 of 83 steps
green; `Hook wiring: PreToolUse: matcher — re-wired`; `routers --dry-run` unchanged in all four
instruction files; `hooks: всё на месте и совпадает` — B-157 closed on this machine. B-163 closed
by Fabric Dashboards `be8b2cf` (exit 75 is busy).

**Wave 5, hub part (branch `w5/hub-close`, 2026-10-12; developer agent, lease `WAVES-1011`).**
R30: the board guard was watched refusing a planted pipe-shifted row in `skills/make-skill`'s board
(`test/family_plants_test.py`); B-108/B-109 now state what the hub proves and which member repositories
still owe an own-gate check; the hub reads 8 boards of 11 (`telegram-dev`, `xr-dev`, `web3d-dev` have none).
R32: `check_the_family_description_total_only_falls` with the floor in `docs/DOCMAP.md`
(`description-total`: 32635 before the re-pins, 32501 at the 1.57.0 pins; a fall prints the figure to record). R37: Pi is a host —
`lib/pi.js`, `hosts` command, `~/.pi/agent/AGENTS.md` through `lib/apply.js` `TARGETS` and the write guard;
`test/pi_test.js`. B-146 install half recorded, B-164 filed. The submodule pins, `skills.json`, the README member
table and the lowered `description-total` (32501) followed in the same branch (`796ed2a`). Not done
yet: the real install against the operator's HOME (run `npx sshlg-skills routers --dry-run` first: it
will now preview `~/.pi/agent/AGENTS.md`).

**Exact next bounded tasks (orchestrator):**
1. Superseded by "Next, in order" above (waves 2–4 released and pinned; B-160 closed).

**W1-G (plugins scoped, operator decision 2026-10-12):** `figma`, `stripe` and `cloudflare` are
off at user scope and on in these repositories' git-ignored `.claude/settings.local.json` —
figma: longevity-app, nicegram-business, ai-girlfriend-app, sshlg-skills, fabric,
mobile-publisher-agent, heygen-hyperframes-vr; stripe: screen-record-studio; cloudflare:
fabric-inbox, screen-record-studio, nicegram-business, project-observatory,
nicegram-ad-manager-bot, sshlg-analytics, sms-activate-app-website. To enable one elsewhere,
merge `"enabledPlugins": {"figma@claude-plugins-official": true}` (or
`stripe@claude-plugins-official`, `cloudflare@cloudflare`) into that repository's
`.claude/settings.local.json` and read the file back — `claude plugin enable --scope local`
reports success and writes nothing (B-162).

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
