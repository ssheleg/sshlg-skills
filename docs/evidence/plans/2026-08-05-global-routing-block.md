# Managed routing block — implementation plan

**Goal:** the family's installers write one managed routing block into the
operator's global agent instructions, so the skills engage by default in every
project — without ever damaging a file they do not own.

**Architecture:** a pure module `lib/routers.js` does all parsing and
rendering and touches no disk; `bin/sshlg-skills.js` and each member's own
installer call it and own the I/O. Every rule that protects the file lives in
the pure module, where it is testable without a HOME.

**Spec:** `docs/superpowers/specs/2026-08-05-global-routing-block-design.md`
**Brief:** `docs/superpowers/briefs/2026-08-05-global-routing-block.md`

## Global constraints

- Node, no dependencies — the launcher has none and gains none.
- Tests are standalone: `node test/routers_test.js`, exit code, `OK (n)`.
- The pure module never reads or writes the filesystem. I/O lives in the CLI.
- Nothing outside the sentinels is ever modified, under any code path.
- `python3 test/validate.py` and `python3 test/check_pins.py` stay green.

## Execution order

| Group | Tasks | Runs after |
|---|---|---|
| A | 1, 2, 3 | — |
| B | 4, 5 | A |
| C | 6, 7 | B |
| D | 8, 9 | C |
| E | 10, 11 | D |

---

### Task 1: the parser, and the three ways a file says "do not touch me"

**Implements:** R-01, R-07, R-15 (partly)

**Files:** Create `lib/routers.js`, `test/routers_test.js`

**Produces:** `parse(text) -> {state, block, sections, before, after}` where
`state` is one of `"absent" | "opted-out" | "malformed" | "present"`;
`before`/`after` are the file's bytes outside the block, kept verbatim.

**DoD:** four fixtures — no block, opt-out marker, `END` before `BEGIN`, a
well-formed block with two sections — each asserting the state and, for the
well-formed one, that `before + render + after` reproduces the input byte for
byte. `node test/routers_test.js` green.

- [ ] Write the four fixtures and watch them fail (`Cannot find module`)
- [ ] Implement `parse`
- [ ] Confirm green, commit

---

### Task 2: upsert one section, leave every other byte alone

**Implements:** R-03, R-08, R-15

**Files:** Modify `lib/routers.js`, `test/routers_test.js`

**Produces:** `upsert(text, routers) -> {text, changed}` — `routers` is
`{name: body}`; sections not named are copied verbatim.

**DoD:** a fixture with user prose above and below the block, plus two
sections, upserting only one: the other section, the prose above and the prose
below are byte-identical afterwards. A second fixture proves an unknown router
name inserts before the table rather than at the end.

---

### Task 3: the generated precedence table

**Implements:** R-04

**Files:** Modify `lib/routers.js`, `test/routers_test.js`

**DoD:** one section renders a one-row table; three sections render three rows
in the fixed order `super-ux`, `copywriting`, `task-pipeline`; a section
removed drops its row on the next upsert.

---

### Task 4: idempotence and dry-run

**Implements:** R-09, R-10

**Files:** Modify `lib/routers.js`, `test/routers_test.js`

**Produces:** `upsert` returns `changed: false` when the render equals the
input; `diff(a, b) -> string` for the dry-run output.

**DoD:** upserting the same routers twice returns `changed: false` the second
time; `diff` on identical input is empty. Watched failing by planting a
trailing-newline difference first.

---

### Task 5: consent, and what silence means

**Implements:** R-05

**Files:** Modify `bin/sshlg-skills.js`, Create `test/consent_test.js`

**Produces:** `readState()/writeState()` over `~/.sshlg-skills/state.json`;
`askConsent({interactive})` returning `"yes" | "no"`.

**DoD:** non-interactive stdin returns `"no"` without prompting and prints one
line saying so; a recorded answer is never re-asked; the state file is created
with mode 0600.

---

### Task 6: `install` writes, `update` never creates

**Implements:** R-02, R-06

**Files:** Modify `bin/sshlg-skills.js`, Create `test/install_routers_test.js`

**DoD:** against a temp HOME — `update` with no block writes nothing and says
so; `install` with consent writes the block; `install` on a file already
carrying the block refreshes it and leaves the rest byte-identical.

---

### Task 7: refusal leaves a marker that survives

**Implements:** R-07

**Files:** Modify `bin/sshlg-skills.js`, `test/install_routers_test.js`

**DoD:** answering `no` appends `<!-- SSHLG:ROUTERS:OPTOUT -->` and writes no
block; a subsequent `install` and `update` both write nothing and do not
prompt; deleting the block by hand and re-running `install` prompts once more.

---

### Task 8: the three router texts

**Implements:** R-13

**Files:** Create `lib/router-texts.js`

**DoD:** `copywriting` carries the D3 boundary in both directions and the
refusal phrase «без бренда» / «черновиком»; each text names its own boundary
and its refusal phrase; `grep` proves all three present.

---

### Task 9: migration without losing the operator's wording

**Implements:** R-12

**Files:** Modify `bin/sshlg-skills.js`, `test/migrate_test.js`

**DoD:** a fixture carrying both hand-written headings with their asides
verbatim: after migration the asides appear inside the block character for
character, the original headings are gone, and a heading that is absent falls
back to the packaged default rather than inventing text.

---

### Task 10: a member's own installer writes its own section

**Implements:** R-03 (D5)

**Files:** Modify `~/DATA/super-ux/bin/super-ux.js`

**DoD:** running the super-ux installer alone against a temp HOME writes only
the `super-ux` and `copywriting` sections and a two-row table; running the
launcher afterwards adds `task-pipeline` and leaves the first two untouched.

---

### Task 11: CI, release, pin, refresh

**Implements:** R-14, R-16

**Files:** Modify `.github/workflows/validate.yml`, `package.json`,
`CHANGELOG.md`

**DoD:** CI runs all four Node test files; `python3 test/validate.py` and
`check_pins.py` green separately; preflight clean; tag pushed `--atomic`;
`npx sshlg-skills list` reports the new version.

## Self-review

- REQ coverage: 16 in brief, 16 covered, difference ∅
- Named checks: `node test/*.js`, `python3 test/validate.py`,
  `python3 test/check_pins.py`, `gh run list` — all resolve
- Placeholders: 0
- The riskiest tasks (1, 2, 15-class byte preservation) are first, before any
  code that writes to disk exists
