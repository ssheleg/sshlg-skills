<sub>ssheleg skills — task-pipeline · evidence-docs · ux-scenarios · brand-voice · copywriting</sub>

# W175 working-rule implementation review slice

Status: bounded source and focused checks; independent review, aggregate, release
and machine adoption remain pending. Base `2c322e2`; prerequisite `3cac71c` received
independent root review and seven real-process controls passed. The accepted
[packet](wait-rule-packet.md) owns the scope. This is a separate future wave from
the delivered B187 installer branch.

## Contracts and code homes

- `lib/wait-rule-policy.js`: absent is off, only exact on enables. Strict JSON
  spans reject corrupt or duplicate keys and preserve unrelated raw numeric and
  escaped-string spellings. Policy edits acquire a non-stealing config lock,
  call `apply.protect()`, verify temporary bytes, and compare before replacement.
  Existing legacy config writers have weaker locks; no arbitrary-writer atomicity
  or filesystem compare-and-swap guarantee is claimed.
- `docs/working-rules/wait-is-not-a-stop.md` is canonical doctrine;
  `lib/wait-rule-text.js` carries its npm-shipped copy. Exact parity is tested.
  Claude-only capability names stay out of the other four host variants.
- `lib/wait-rules.js`: existing Claude/Codex/Gemini/Pi instruction roots and
  Cursor's existing rules directory are the only targets. Receipts bind lexical
  and canonical profile, file, exact owned segment, source revision/hash and
  previous segment. A changed profile binding, unknown/edited markers, corrupt
  receipt or foreign Cursor filename refuses. Surrounding text remains exact.
- `bin/sshlg-skills.js`: explicit `config set rules.wait on|off`; `rules` previews,
  `rules --apply` executes. Install/update plans carry a private frozen-source
  candidate and a public action summary, updating only already-applied profiles.
  Member-only operations do not apply this family rule. Uninstall plans remove
  the selected owned segments. The star router source is untouched.
- Each changed target has a backup. A pending ownership journal is persisted
  before the outward write; failure/crash leaves explicit recovery evidence and
  blocks blind retry. Earlier targets may have succeeded: no multi-host atomicity
  is claimed. Writing text creates no watcher, job, hook or new action authority.

## Focused evidence

Commands executed in the isolated worktree, synthetic homes cleaned in `finally`:

| Command | Result |
|---|---|
| `node test/wait_rule_policy_test.js` | 24 checks, exit0 |
| `node test/wait_rule_text_test.js` | 7 checks, exit0 |
| `node test/wait_rules_test.js` | 15 checks, exit0 |
| `node test/wait_rules_cli_test.js` | 5 actual CLI cases, exit0 |
| `node test/router_migration_scope_test.js` | 7 actual CLI cases, exit0 |
| `node test/operation-result_test.js` | 14 checks, exit0 |
| `node test/cli_config_test.js` | 24 checks, exit0 |
| `node test/apply_test.js` | 19 checks, exit0 |
| `node test/installer_pins_test.js` | 6 checks, exit0 |

Policy controls include exact foreign numeric preservation, malformed policy,
held lock, symlink leaf, backup failure, short temporary write, rename failure and
an actual concurrent foreign edit injected after backup. The CLI path proves
config→preview→scoped apply→three repetitions→off, dry-run zero host/receipt writes,
member refusal and corrupt ownership admission before a child process.

Retained development failures: W175-0 baseline was six red/one positive at
`4cd50db`; new policy module initially did not exist; first actual `rules --apply`
run exposed missing CLI flag admission (three of five cases failed); a new Cursor
off→on control exposed a leftover empty file and now passes. The existing protect
guard initially rejected an unnecessary PID write to a newly created lock inode;
that payload was removed, retaining exclusive inode ownership and no guard
exemption. One exploratory test filename used a hyphen instead of underscore and
exited1; the actual installer test above was then located and passed.

## Copy and scenario boundaries

SCN-007–009 in `docs/ux/scenarios.md` restate the accepted packet. The technical
CLI channel and static string labels use the existing shared brand pack; no new
voice or public performance claim was invented. Humanization: on, own manual
pass; no marker-driven rewrite, no model authorship claim.

Installed super-ux0.59.3 `scripts/ux_lint.py docs/ux` exited0 with one existing
U050 web-surfaces warning. Its `scripts/brand_lint.py docs/brand --fail-on B063`
remains nonzero: this isolated checkout has no generated `_site` output and no
materialized agent-stack README; broad existing-code advisories are retained.
No clean brand-lint claim is made. New registered static labels resolve in source;
the initial parameterized registry placeholders were corrected rather than hidden.

## Exact next tasks

Independently review policy/ownership and CLI integration seams. Complete focused
actual update/uninstall and member-only operation controls, then the serialized
owner aggregate on frozen source. After genuine integration/release, W175-4 may
apply the existing operator-authorized machine policy, with exact per-host text
readback and separate review before deduplicating handwritten machine copies.
Agent/model behavior remains unaccepted; installed text alone cannot close it.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**:
task-pipeline for delivery; evidence-docs for bounded claims; ux-scenarios for the
settings journey; brand-voice for the CLI channel; copywriting for technical labels.
