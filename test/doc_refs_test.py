#!/usr/bin/env python3
"""Fixtures for test/doc_refs.py — the extractor behind the claimed-address guard.

The guard it feeds is a gate, so a false positive here is worse than a miss: a document
reddened for a reference that was never an address is how an operator learns to switch a
check off. Three ways that happens, each asserted on its own:

- **a link's LABEL is not its address.** `README.md:69` labels a link `scripts/graph.py`
  and points it at the member file that exists. A reader who clicks lands on the right
  file; the first draft of this extractor reported that row as dead.
- **a placeholder is not an address.** `hooks/<name>.js`, `docs/evidence/briefs/…` and
  `~/.claude/skills/<id>` are patterns. Resolving one is a category error.
- **another repository's path is not ours.** `references/acceptance.md` carries no local
  prefix and belongs to `task-pipeline`; `docs/ux/` is what a member creates in the
  product that installs it, which is why the exception set carries a reason per entry.

And the miss that matters: an address that resolves to a file but names a line past its
end. The file opens, the claim points at nothing, and `test -e` calls it fine.
"""
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import doc_refs  # noqa: E402

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


PREFIXES = {"docs/", "lib/", "test/", "scripts/", "skills/", ".github/",
            "README.md", "package.json"}
ELSEWHERE = {"docs/ux/": "a member's output in a consuming product"}


def found(text):
    """(kind, token) pairs, order preserved — what one document claims."""
    return [(k, t) for k, _, t in doc_refs.addresses(text, PREFIXES, ELSEWHERE)]


def tokens(text):
    return [t for _, t in found(text)]


# --- what counts as an address --------------------------------------------------------

def a_backticked_local_path_is_an_address():
    assert tokens("see `lib/apply.js` for the write path") == ["lib/apply.js"]


def a_path_with_no_local_prefix_is_not_ours():
    # `references/acceptance.md` is task-pipeline's doctrine, cited bare. Not an address
    # here, and a guard that claimed it was would demand this repo create the file.
    assert tokens("Doctrine: `references/acceptance.md` -> the pointer") == []


def an_exception_entry_is_skipped():
    assert tokens("a design chain in `docs/ux/` per member") == []
    # The same prefix without the exception is still read, so the escape is narrow.
    assert tokens("the board at `docs/evidence/backlog.md`") == ["docs/evidence/backlog.md"]


def a_placeholder_is_not_an_address():
    for t in ("`hooks/<name>.js`", "`docs/evidence/briefs/...`",
              "`docs/evidence/briefs/…-carryover.md`", "`skills/*/…`",
              "`~/.claude/skills/<id>`", "`/etc/hosts`", "`https://x/docs/a.md`"):
        assert tokens(f"row {t} here") == [], f"{t} was read as an address"


def a_line_number_rides_along():
    assert tokens("`test/validate.py:1019` requires it") == ["test/validate.py:1019"]
    assert tokens("`CLAUDE.md:75-76` asserted it") == []       # not a local prefix here
    assert tokens("`README.md:66` claims") == ["README.md:66"]


# --- links: the target, never the label ----------------------------------------------

def a_link_is_read_by_its_target():
    row = "[`scripts/graph.py`](skills/task-pipeline/scripts/graph.py) — the frontier"
    assert tokens(row) == ["skills/task-pipeline/scripts/graph.py"], tokens(row)


def a_link_with_a_dead_target_is_still_reported():
    assert tokens("[the plant](test/plant_guard.py) fails") == ["test/plant_guard.py"]


def a_bare_label_outside_a_link_is_still_read():
    # Removing the link span must not swallow backticks that belong to prose beside it.
    row = "[`a`](docs/a.md) and `lib/b.js` too"
    assert tokens(row) == ["docs/a.md", "lib/b.js"], tokens(row)


def a_relative_link_is_resolved_against_its_own_document():
    """`docs/evidence/convergence.md` links a member file as `../../skills/…`, which renders
    correctly and carried no local prefix, so the first version of this extractor skipped it
    silently — an address class introduced by the very change that added the guard."""
    row = "see [`convergence.sh`](../../skills/task-pipeline/templates/convergence.sh) for it"
    got = [t for _, _, t in doc_refs.addresses(row, PREFIXES, ELSEWHERE,
                                               docdir="docs/evidence")]
    assert got == ["skills/task-pipeline/templates/convergence.sh"], got
    # Without a docdir there is nothing to resolve against, and inventing one is worse
    # than declining: a `../` token must not be measured against the wrong root.
    assert [t for _, _, t in doc_refs.addresses(row, PREFIXES, ELSEWHERE)] == []
    # And a walk that escapes the repository is not an address in it.
    esc = "[x](../../../elsewhere/a.md)"
    assert [t for _, _, t in doc_refs.addresses(esc, PREFIXES, ELSEWHERE,
                                                docdir="docs/evidence")] == []


def an_external_link_target_is_ignored():
    assert tokens("[spec](https://agentskills.io/specification)") == []


# --- the command classes --------------------------------------------------------------

def an_npm_run_claim_is_its_own_kind():
    assert found("run `npm run test:negatives` to see") == [("npm", "test:negatives")]
    # `npm test` is not `npm run <script>`: the builtin needs no scripts entry to exist.
    assert found("`npm test` is the gate") == []


def an_unbackticked_script_name_is_still_a_claim():
    # convergence.md named its script in prose. A guard reading only backticks would have
    # passed the same sentence with the quotes removed.
    assert found("scripts/check-convergence.sh demands a record") == [
        ("script", "scripts/check-convergence.sh")]


def a_script_inside_a_path_is_not_double_counted():
    got = found("`scripts/stage-coverage.sh` is wired")
    assert got == [("path", "scripts/stage-coverage.sh")], got


def every_occurrence_is_yielded_with_its_line():
    text = "`lib/a.js`\n\n`lib/a.js` again\n"
    lines = [ln for _, ln, _ in doc_refs.addresses(text, PREFIXES, ELSEWHERE)]
    assert lines == [1, 3], lines


# --- resolution -----------------------------------------------------------------------

def resolution_reads_the_tree_and_the_line_count():
    root = tempfile.mkdtemp()
    try:
        os.makedirs(os.path.join(root, "lib"))
        with open(os.path.join(root, "lib", "a.js"), "w") as fh:
            fh.write("one\ntwo\nthree\n")
        assert doc_refs.resolve(root, "lib/a.js") == (True, "")
        assert doc_refs.resolve(root, "lib/a.js:3") == (True, "")
        ok, detail = doc_refs.resolve(root, "lib/a.js:4")
        assert ok is False and "file has 3" in detail, (ok, detail)
        ok, detail = doc_refs.resolve(root, "lib/gone.js")
        assert ok is False and detail == "no such path", (ok, detail)
    finally:
        shutil.rmtree(root)


def an_uncheckedout_submodule_is_unknown_never_dead():
    """None, not False. A sweep that reports a missing submodule as a broken reference
    turns a fresh clone into a red gate, which is the fastest way to a switched-off gate."""
    root = tempfile.mkdtemp()
    try:
        os.makedirs(os.path.join(root, "skills", "task-pipeline"))
        ok, detail = doc_refs.resolve(root, "skills/task-pipeline/references/a.md")
        assert ok is None and "not checked out" in detail, (ok, detail)
        os.makedirs(os.path.join(root, "skills", "task-pipeline", ".git"))
        ok, _ = doc_refs.resolve(root, "skills/task-pipeline/references/a.md")
        assert ok is False, "a checked-out submodule missing the file is dead, not unknown"
    finally:
        shutil.rmtree(root)


def prefixes_are_discovered_from_the_tree():
    """A hand-kept prefix list goes stale the moment a directory is added, and the
    staleness reads as a passing check."""
    root = tempfile.mkdtemp()
    try:
        os.makedirs(os.path.join(root, "lib"))
        os.makedirs(os.path.join(root, "node_modules"))
        os.makedirs(os.path.join(root, ".git"))
        os.makedirs(os.path.join(root, ".github"))
        open(os.path.join(root, "README.md"), "w").close()
        got = doc_refs.local_prefixes(root)
        assert "lib/" in got and "README.md" in got and ".github/" in got, got
        assert "node_modules/" not in got and ".git/" not in got, got
    finally:
        shutil.rmtree(root)


for n, f in [
    ("a backticked local path is an address", a_backticked_local_path_is_an_address),
    ("a path with no local prefix is not ours", a_path_with_no_local_prefix_is_not_ours),
    ("an exception entry is skipped, narrowly", an_exception_entry_is_skipped),
    ("a placeholder is not an address", a_placeholder_is_not_an_address),
    ("a line number rides along", a_line_number_rides_along),
    ("a link is read by its target", a_link_is_read_by_its_target),
    ("a dead link target is reported", a_link_with_a_dead_target_is_still_reported),
    ("prose beside a link is still read", a_bare_label_outside_a_link_is_still_read),
    ("a relative link resolves against its document", a_relative_link_is_resolved_against_its_own_document),
    ("an external link target is ignored", an_external_link_target_is_ignored),
    ("`npm run` is its own kind", an_npm_run_claim_is_its_own_kind),
    ("an unbackticked script name is a claim", an_unbackticked_script_name_is_still_a_claim),
    ("a backticked script is not double counted", a_script_inside_a_path_is_not_double_counted),
    ("every occurrence carries its line", every_occurrence_is_yielded_with_its_line),
    ("resolution reads the tree and the line count", resolution_reads_the_tree_and_the_line_count),
    ("an absent submodule is unknown, never dead", an_uncheckedout_submodule_is_unknown_never_dead),
    ("prefixes are discovered, not listed", prefixes_are_discovered_from_the_tree),
]:
    case(n, f)

if failures:
    print(f"\nFAIL: {len(failures)} of 17")
    sys.exit(1)
print("\nPASS: doc_refs — 17 cases")
