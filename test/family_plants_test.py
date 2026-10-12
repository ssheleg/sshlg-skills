#!/usr/bin/env python3
"""Plants for two umbrella guards that read the MEMBERS, run against a copy of the tree.

R30: `check_board_is_parseable` reads every member's board, and a guard is only believed
once it has been watched refusing its own defect. R32: the family description total may
fall and never rise. Both are asserted on the PARSED value in the failure (which member,
which row, which totals), not on an exit code: a gate that goes red for the wrong reason
is a gate that was not watched.

The copy is of the working tree without `.git`, so the baseline already carries failures
that belong to a tree without history (run stamps, uncommitted sync config). A plant is
therefore judged by the failure lines it ADDS to that baseline, never by the exit code.
Needs the members checked out (`git submodule update --init`); without them it reports
that it could not look and passes nothing silently.
"""
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import residue  # noqa: E402

failures = []
checks = 0


def case(name, fn):
    global checks
    checks += 1
    residue.open_case(name)
    try:
        fn()
        residue.close_case(name)
        print(f"  ok  {name}")
    except AssertionError as e:
        residue.close_case(name, ok=False)
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def validate(root):
    r = subprocess.run([sys.executable, os.path.join(root, "test", "validate.py")],
                       capture_output=True, text=True, cwd=root)
    out = r.stdout + r.stderr
    fails = [l[3:] for l in out.splitlines() if l.startswith(" - ")]
    return out, fails


def read(p):
    with open(p, encoding="utf-8") as fh:
        return fh.read()


def write(p, t):
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(t)


members = os.path.join(ROOT, "skills", "make-skill", "docs", "evidence", "backlog.md")
if not os.path.isfile(members):
    print("OK (0 checks) -- members are not checked out, the plants could not run")
    sys.exit(0)

holder = {}


def copy():
    if "root" not in holder:
        d = residue.workspace("tree")
        root = os.path.join(d, "copy")
        shutil.copytree(ROOT, root, symlinks=True,
                        ignore=shutil.ignore_patterns(".git", "node_modules"))
        out, fails = validate(root)
        holder["root"], holder["base_out"], holder["base"] = root, out, fails
    return holder["root"], holder["base"]


def planted(root, rel, mutate):
    """Apply `mutate` to a file in the copy, run the gate, restore, return the NEW failures."""
    p = os.path.join(root, rel)
    original = read(p)
    try:
        write(p, mutate(original))
        out, fails = validate(root)
    finally:
        write(p, original)
    return out, [f for f in fails if f not in holder["base"]]


def board_plant_is_refused_naming_member_and_row():
    root, _ = copy()
    rel = "skills/make-skill/docs/evidence/backlog.md"
    lines = read(os.path.join(root, rel)).splitlines()
    idx = next(i for i, l in enumerate(lines)
               if re.match(r"^\|\s*B-\d+\s*\|", l) and l.count("|") >= 6)
    row_id = re.match(r"^\|\s*(B-\d+)\s*\|", lines[idx]).group(1)
    first_cell_end = lines[idx].index("|", 1)

    def shift(text):
        ls = text.splitlines()
        # an unescaped pipe inside the second cell: the B-33 defect, one extra cell
        second = ls[idx].index("|", first_cell_end + 1)
        ls[idx] = ls[idx][:second] + " a | b " + ls[idx][second:]
        return "\n".join(ls) + "\n"

    _, new = planted(root, rel, shift)
    hits = [f for f in new if f.startswith(f"{rel}:{idx + 1}: row {row_id} has ")]
    assert len(hits) == 1, f"expected one new failure for {rel}:{idx + 1} row {row_id}, got {new}"
    m = re.search(r"has (\d+) cells against the (\d+) its own header declares", hits[0])
    assert m and int(m.group(1)) == int(m.group(2)) + 1, hits[0]
    assert len(new) == 1, f"the plant produced more than its own failure: {new}"


def board_plant_in_the_hub_own_board_is_also_refused():
    root, _ = copy()
    rel = "docs/evidence/backlog.md"
    text = read(os.path.join(root, rel)).splitlines()
    idx = next(i for i, l in enumerate(text) if re.match(r"^\|\s*B-1\d\d\s*\|", l))
    def shift(t):
        ls = t.splitlines()
        second = ls[idx].index("|", ls[idx].index("|", 1) + 1)
        ls[idx] = ls[idx][:second] + " a | b " + ls[idx][second:]
        return "\n".join(ls) + "\n"

    _, new = planted(root, rel, shift)
    assert any(f.startswith(f"{rel}:{idx + 1}: row B-1") for f in new), new


def description_total():
    root, _ = copy()
    m = re.search(r"<!--\s*description-total:\s*(\d+)\s*-->", read(os.path.join(root, "docs/DOCMAP.md")))
    assert m, "no description-total marker in DOCMAP"
    return root, int(m.group(1))


def single_line_description(root):
    import glob
    for f in sorted(glob.glob(os.path.join(root, "skills", "*", "plugins", "*", "skills", "*", "SKILL.md"))):
        # unquoted only: a character appended after a closing quote is invalid YAML, which
        # would put a second, unrelated failure into the plant
        if re.search(r"^description: [^>|\"'\n].*[^\"'\s]$", read(f), re.M):
            return os.path.relpath(f, root)
    raise AssertionError("no single-line description to plant in")


def grow_by_one_is_refused():
    root, floor = description_total()
    rel = single_line_description(root)
    out, new = planted(root, rel, lambda t: re.sub(r"^(description: .*?)\s*$", r"\1x", t, count=1, flags=re.M))
    want = [f for f in new if "the family's descriptions total" in f]
    assert len(want) == 1 and len(new) == 1, new
    m = re.search(r"total (\d+) characters over (\d+) skills and the recorded ceiling is (\d+).*?: \+(\d+)", want[0])
    assert m, want[0]
    assert int(m.group(1)) == floor + 1 and int(m.group(3)) == floor and int(m.group(4)) == 1, want[0]


def a_trim_is_accepted_and_names_the_new_floor():
    root, floor = description_total()
    rel = single_line_description(root)
    out, new = planted(root, rel, lambda t: re.sub(r"^(description: .*?)\S\s*$", r"\1", t, count=1, flags=re.M))
    assert not new, new
    assert f"ratchet: description total {floor - 1} characters" in out, out[-600:]
    assert f"record {floor - 1} as the new" in out, out[-600:]


def an_unchanged_tree_is_at_the_ceiling_without_complaint():
    root, floor = description_total()
    assert not [f for f in holder["base"] if "descriptions total" in f or "description-total" in f], holder["base"]
    assert "ratchet: description total" not in holder["base_out"]


def a_missing_marker_is_refused():
    root, _ = description_total()
    _, new = planted(root, "docs/DOCMAP.md",
                     lambda t: re.sub(r"<!--\s*description-total:\s*\d+\s*-->", "", t))
    assert any("no `<!-- description-total: N -->` marker" in f for f in new), new


case("board: a pipe-shifted row in a member board fails the hub gate, naming member, line and row id",
     board_plant_is_refused_naming_member_and_row)
case("board: the same defect in the hub's own board is refused", board_plant_in_the_hub_own_board_is_also_refused)
case("total: +1 character in one description fails, naming the total, the ceiling and the excess",
     grow_by_one_is_refused)
case("total: -1 character passes and prints the new floor to record", a_trim_is_accepted_and_names_the_new_floor)
case("total: the unchanged tree sits at the ceiling with no complaint", an_unchanged_tree_is_at_the_ceiling_without_complaint)
case("total: a DOCMAP without the marker is refused, not skipped", a_missing_marker_is_refused)

residue.report()
if failures:
    print(f"FAIL: {len(failures)} of {checks} checks")
    sys.exit(1)
print(f"OK ({checks} checks)")
