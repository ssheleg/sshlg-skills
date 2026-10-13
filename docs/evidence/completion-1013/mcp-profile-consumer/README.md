# PB159 consumer preparation: read-only draft

Status: proposed adapter requirements, not Observatory's implemented wire schema.
No configuration is read or written by this fixture. Owner agreement, materializer
acceptance and a new-session native proving call remain required.

The owner record is [MCP loading spec](../../specs/2026-10-13-mcp-loading.md),
including the recorded Observatory answer: private workspace profile, host-owned
writer, before/after manifest and undo, no secret-bearing definitions copied,
project entries verified before user entries removed, no session restart. The
read-only owner checkout at `12722eb1a1dd5d6e679e8f33be8e1b6b01b3223e` records
PB159 as iteration2 in `docs/runs/2026-10-12-release-iteration-1/questions.md`.
This is recovery evidence, not a newly delivered board answer.

## Consumer boundary

The hub needs only server identifiers and declared state, not endpoint URLs,
commands, env, headers, credentials or full host configuration. A future owner
adapter must provide these semantic inputs; the names used by the fixture below
are deliberately draft, not a proposed second writer or a promised API:

- Owner identity and contract revision, plus immutable profile revision and the
  selected project's opaque identity. Reject wrong project, unknown contract or
  missing revision; do not interpret absent input as an empty desired profile.
- Machine minimum and project states (`on`, `off`, `on-demand`) with a reason.
  A machine-required server cannot disappear through a project override. Any
  conflict stays visible and blocks a destructive plan; the hub never repairs it.
- Separately observed availability (`reachable`, `unavailable`, `unknown`). A
  declared `on` is not proof of a live capability. `off` is not proof it stopped in
  an existing session. An on-demand server is only usable through an explicitly
  available owner broker; otherwise report unsupported, never silently start it.
- Manifest identity plus expected before revision for any owner apply/undo.
  A stale read cannot authorize removal or rollback over another writer's work.
  The fixture below only classifies states and rejects bad input; it executes
  neither apply nor undo and makes no claim about their implementation.

No path or secret values should appear in public fixture output. Duplicate server
IDs and duplicate object keys are ambiguous and must be rejected before display.
Gateway/OAuth/plugin ownership stays with its existing owner; this consumer must
not infer a new routing decision from usage frequency.

## Prepared acceptance cases

`python3 docs/evidence/completion-1013/mcp-profile-consumer/check.py` exercises
healthy on/off/on-demand; missing broker; unavailable and unknown observations;
minimum conflict; wrong project; unknown contract; absent revision; duplicate
server identifiers/object keys; and unrecognized secret-bearing fields. This
is a synthetic semantic contract check, not a production host test.

Exact next task when `com.submit` is callable: submit idempotency key
`sshlg-skills:L2:observatory-PB159:v1` asking for the accepted read-only payload,
current implementation revision, machine-minimum authority and manifest/undo
contract. Validate the adapter against that owner schema, then consume it in
`hosts` without adding a writer. Real acceptance needs owner before/after receipts,
one new native client session with a required capability call, unavailable-server
recovery and rollback at an unchanged expected revision. No existing session or
service is restarted. Pending submission stays pending until a board ID exists.

Skills: agent-interop (ownership and capability boundary), task-pipeline (bounded
continuation packet), evidence-docs (source and observation separation).

## Independent review and correction

The first fixture passed22 synthetic checks. Independent review then found it
accepted whitespace/path-like IDs. The draft now permits only a deliberately
restricted opaque identifier spelling and passes25 checks. This syntax is local
to the synthetic fixture; the eventual adapter must use the owner's accepted
schema, not silently impose it on production identities. No production call ran.
