# B-186 — immutable plain-skills installation

<sub>ssheleg skills — task-pipeline · agent-sync · evidence-docs</sub>

Objective: make the production plain-skills installer select the exact published
member commits, without changing the operator's working native plugin lifecycle.
Base: `ae1b415bc79a3d89ca97199299e0e00a2a5e7674`; branch:
`fix/installer-immutable-pins`. Parent owns the completion board and release.

## Finding and upstream evidence

The old production launcher called floating `installPlan` / `updatePlan`.
`installPlanLocked` was a pure helper with no production caller, and emitted
`repo@SHA`. The installed `skills@1.7.2` parser treats that spelling as a skill
filter, not a commit. Its `#SHA` form selects a Git ref; full SHA checkout falls
back from branch cloning to fetching the exact object. A dry-run builder's
existence did not establish a working immutable install.

The optional probe is reproducible with an already installed upstream bundle:

```sh
node scripts/probe-skills-ref.js --cli /path/to/skills/dist/cli.mjs
```

Observed 2026-10-13, exit 0, upstream version `1.7.2`, bundle SHA-256
`72f1805ea4f6c62b0532cb77a9f021e7930bb7ca962f87a3fbf985d1ada5d56d`:

- The actual bundle parser returned `skillFilter` for `@` and `ref` for `#`.
- In an owned temporary HOME, a local synthetic repository had commit A then B.
  Installing `#A` produced A; a default-branch add produced B; another `#A` add
  restored A. Thus add overwrites an existing payload; a floating update is not
  needed before it. Three consecutive installs of A retained the same expected
  payload bytes and directory form.
- Continue's installed directory remained a real directory with `--copy`.
- Git used a local URL rewrite; JavaScript fetch and telemetry were disabled.
  No provider/model request or real-host install was made. The probe removes only
  its owned temporary directory.

This exercises actual upstream code, separate from the offline launcher stubs.
It does not establish every host's native loading behavior.

## Decision and implementation

1. `skills.json` ships a `commit` for every member, derived from the base's
   committed gitlinks. No version tag or branch substitutes for a missing SHA.
   `lib/installer-pins.js` admits the whole set before producing argv: duplicate
   names, malformed repositories, empty sets and missing/non-40-hex commits fail.
2. Production install and update call that module, which reuses the existing
   `installPlanLocked` member/ref shape. There is no second persisted lock schema.
   The historical `release-set/1` digest model remains separate; this change does
   not claim its injected digest resolver now verifies fetched bytes.
3. Plain-skills updates use pinned adds only. No blind `skills update` runs.
   Selected Continue targets and restoration of existing family copies retain
   isolated `--copy` commands at the same commits.
4. Preview constructs argv once; execution and progress count consume those
   frozen subprocess entries. Native Claude calls also consume their previewed
   actions, preserving an existing plugin's update action instead of reinstalling
   and re-enabling it. Missing pins refuse before any child or update lock.
5. The verified upstream source syntax is bound to `skills@1.7.2`; changing the CLI
   requires a new contract probe. The host-target snapshot already refuses a
   mismatched CLI; the production ref planner also names this requirement.
6. Claude's existing native lifecycle stays supported. Its final summary explicitly
   says `version-following; immutable source NOT_VERIFIED`. Plain-skills summary
   states commit selection, not installed-byte or native-runtime acceptance. There
   is no all-channel immutable verdict, new strict flag, or destructive native
   marketplace removal in this packet. Codex native management is unchanged.

The parent explicitly chose point 6 to retain compatibility. Current official
[marketplace commands](https://code.claude.com/docs/en/plugins/cli-reference)
and [marketplace source reference](https://code.claude.com/docs/en/plugins/marketplace-reference)
were read on 2026-10-13: marketplace ref selection and plugin-source SHA selection
are distinct contracts. Re-adding an existing marketplace can reuse its cache;
removing one can delete installed plugins and their saved data. Neither was used
as an unverified migration shortcut.

## Pin maintenance

Stage the intended member gitlinks, then run:

```sh
node scripts/sync-member-pins.js --write
node scripts/sync-member-pins.js --check
```

The helper reads the staged Git index, refuses a missing/unmerged gitlink, and
never fetches or advances member repositories. The discovered offline suite
`test/installer_pins_test.js` compares the shipped commit inventory with those
same gitlinks, including explicit wrong/missing-link counterexamples. Stage
`skills.json` with the gitlinks; a fresh checkout checks their committed state.
Published npm installs use the shipped inventory and do not require `.git`.
`--bump-pins` still changes a development checkout, but its current install keeps
using the published inventory; output explains the staging/sync step for the next
release. A changed checkout is not silently treated as a new published set.

## Verification

Initial new actual-contract assertion failed as intended: `repo@SHA` was emitted
where `repo#SHA` was required. After correction:

- `node test/installer_pins_test.js`: six grouped controls. Includes actual
  subprocess launcher runs from a package copy without `.git`, exact preview / run
  argv comparison, pinned Continue restoration, malformed/missing pin refusal
  before children, unsupported CLI refusal, and existing Claude plugin update
  parity with an explicit unverified immutable-source label.
- `node test/plan_test.js`: 28 checks, exit 0.
- `node test/host_targets_test.js`: 14 checks, exit 0.
- `node test/cli_config_test.js`: 24 checks, exit 0.
- `node test/codex_native_e2e_test.js`: 11 cases, exit 0.
- `node test/updatelock_test.js`: 30 checks, exit 0.
- `node test/hooks_e2e_test.js`: 70 checks, exit 0.
- `python3 -B test/audit_regressions/fix-up-01.01.py`: six controls, exit 0.
- `python3 -B test/audit_regressions/fix-up-02.01.py`: five checks, exit 0.
- The actual upstream probe above passed independently of these stubs.

One new unsupported-CLI test initially expected the later ref-contract diagnostic;
inspection showed the existing host-target admission correctly refused first.
The assertion now accepts those two explicit admission diagnostics and still
requires exit 2 and zero children. That fixture mismatch was not a bypass.

Full aggregate gate and independent review are pending parent integration. This
isolated worktree has no initialized member copies; no full suite, hosted CI,
release or real-host update is claimed here.

## Handoff

Next: independently review the frozen source and replay bounded controls; integrate
with the parent's current pins, regenerate their commit inventory, update the
central DOCMAP counts and README channel description, then run one coordinated
aggregate gate. Parent owns candidate CI, release and installed-byte/native
readback. This branch must not advance member versions merely because newer
member branches merged during its construction.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- `task-pipeline` — bounded installer correction.
- `agent-sync` — manifest ownership, task B-186.
- `evidence-docs` — measured contract and reproducible checks.
