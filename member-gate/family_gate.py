#!/usr/bin/env python3
# shared-mechanism: family-gate
# diverges: none
"""family_gate.py: two checks every sshlg-skills member runs in its own gate.

Canonical copy: ssheleg/sshlg-skills `member-gate/family_gate.py`. Every member carries it
byte for byte as `test/family_gate.py`; the hub checks the copies by hash. Do not edit a
member's copy: change the canonical file and copy it out.

    python3 test/family_gate.py              check this repository (the current directory)
    python3 test/family_gate.py --self-test  plant each defect in a scratch copy, watch it fail

1. The board parses (hub B-108). Every row of every table in `docs/evidence/backlog.md` has
   as many cells as its own header (a bare `|` inside a cell shifts the row), and no row id
   appears twice. A repository without a board says so and passes.
2. The release workflow refuses an unreachable tag (hub B-109). `.github/workflows/release.yml`
   checks out full history (`fetch-depth: 0`) and asks `git merge-base --is-ancestor` before it
   publishes. A repository without the workflow says so and passes.

Exit 0 green, 1 a defect, 2 a self-test whose plant was not caught. Standard library only.
"""
import os
import re
import sys

BOARD = os.path.join("docs", "evidence", "backlog.md")
RELEASE = os.path.join(".github", "workflows", "release.yml")
ROW_ID = re.compile(r"^\**([A-Z][A-Z0-9]*-\d+[a-z]?)\**$")


def cells(line):
    """Cells of a table row; an escaped `\\|` stays inside its cell."""
    body = line.strip()
    if body.startswith("|"):
        body = body[1:]
    if body.endswith("|") and not body.endswith("\\|"):
        body = body[:-1]
    return re.split(r"(?<!\\)\|", body)


def read(root, rel):
    path = os.path.join(root, rel)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def board_problems(text):
    if text is None:
        return [], "no %s; nothing to parse" % BOARD
    lines = text.split("\n")
    out, seen, width, in_fence = [], {}, None, False
    for n, line in enumerate(lines, 1):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
        if in_fence or not line.lstrip().startswith("|"):
            width = None
            continue
        c = cells(line)
        if width is None:
            width = len(c)          # the header row of this table
            continue
        if all(re.fullmatch(r"\s*:?-{3,}:?\s*", x) for x in c):
            continue                # the separator row
        if len(c) != width:
            out.append("%s:%d: a row has %d cells against the %d its header declares"
                       % (BOARD, n, len(c), width))
        m = ROW_ID.match(c[0].strip()) if c else None
        if m:
            rid = m.group(1)
            if rid in seen:
                out.append("%s:%d: row id %s appears twice (first at line %d)" % (BOARD, n, rid, seen[rid]))
            else:
                seen[rid] = n
    return out, "%d row ids read" % len(seen)


def release_problems(text):
    if text is None:
        return [], "no %s; nothing to check" % RELEASE
    text = "\n".join(l for l in text.split("\n") if not l.lstrip().startswith("#"))
    out = []
    if not re.search(r"fetch-depth:\s*0\b", text):
        out.append("%s: no `fetch-depth: 0`, so the tag's ancestry cannot be read" % RELEASE)
    if "merge-base --is-ancestor" not in text:
        out.append("%s: no `git merge-base --is-ancestor` check before publishing" % RELEASE)
    return out, "ancestry guard present" if not out else ""


def check(board, release):
    problems, notes = [], []
    for fn, text in ((board_problems, board), (release_problems, release)):
        p, note = fn(text)
        problems += p
        if note:
            notes.append(note)
    return problems, notes


def self_test(root):
    """Plant each defect in an in-memory copy of this repository's own files; no file is written."""
    board, release = read(root, BOARD) or "", read(root, RELEASE)
    good_release = release if release and not release_problems(release)[0] else (
        "jobs:\n  release:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n"
        "          fetch-depth: 0\n      - run: git merge-base --is-ancestor \"$TAG\" origin/main\n")
    plants = [
        ("a bare pipe shifts a row",
         board + "\n| id | Row | Status |\n|---|---|---|\n| PLANT-1 | a | b | open |\n", good_release),
        ("an id appears twice",
         board + "\n| id | Row | Status |\n|---|---|---|\n| PLANT-2 | a | open |\n| PLANT-2 | b | open |\n", good_release),
        ("the ancestry check is gone", board,
         "jobs:\n  release:\n    steps:\n      - uses: actions/checkout@v4\n"),
    ]
    caught = 0
    for name, b, r in plants:
        problems, _ = check(b, r)
        if problems:
            caught += 1
            print("  caught  %s: %s" % (name, problems[-1]))
        else:
            print("  MISSED  %s" % name)
    clean, _ = check(board, good_release)
    if clean:
        print("  MISSED  the unplanted board reads clean: %s" % clean[0])
    print("family_gate self-test: %d of %d plants caught" % (caught, len(plants)))
    return 0 if caught == len(plants) and not clean else 2


def main(argv):
    root = os.getcwd()
    if "--self-test" in argv:
        return self_test(root)
    problems, notes = check(read(root, BOARD), read(root, RELEASE))
    for p in problems:
        print("FAIL  " + p)
    print("family_gate: %s (%s)" % ("FAIL" if problems else "OK", "; ".join(notes)))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
