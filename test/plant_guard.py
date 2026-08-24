#!/usr/bin/env python3
"""Did the plant actually land? — one implementation, called by every plant.

A negative self-test copies the repo, damages the copy, and requires the checker to
reject it. When the damage does not happen — the anchor moved, the pattern was
reworded, `sed -i` is a no-op on BSD — the checker honestly passes and **the step then
reports a guard it never disarmed as broken**. That is standing instruction #6 of the
family's retro and its corollary: verify the file actually changed before believing the
result.

This file exists because the guard was written inline, once per step, and produced a
different defect in each copy: `cmp -s A B && …` terminating the step under `set -eu`
when the files DIFFER; a path interpolated without quotes; a raw triple-quoted string
closed by the pattern's own leading quote; a heredoc passed where a function expected an
argv; and — the one that shipped into a pull request — a content-only comparison against
a plant whose whole effect is `chmod`. Five variants of one idea, five bugs. A finding
class seen twice becomes a script rather than a third careful copy.

(The sixth was in this very paragraph: naming that raw-string bug with the literal three
quote characters closed this docstring. Left as a note because it is the same lesson —
prose about a delimiter is not safe from the delimiter.)

    python3 test/plant_guard.py snap   /tmp/x
    …whatever the step already does to /tmp/x…
    python3 test/plant_guard.py verify /tmp/x "what this plant was supposed to do"

`snap` writes a manifest beside the tree; `verify` recomputes it and exits 1 with
`PLANT DID NOT LAND: <desc>` when nothing changed. Two lines around the existing edit,
whatever shape it has — heredoc, `sed -i`, `chmod`, `json.dump`.

**Content AND mode**, because a plant that only flips the executable bit is invisible to
any comparison of bytes, and that is exactly the plant that caught this file's absence.

Zero dependencies, and it never writes inside the tree it measures: the manifest lives
next to it, so the snapshot cannot be mistaken for the plant's own change.
"""
# shared-mechanism: plant_guard.py — 4 copies in this family, kept as one file
#   rather than 4 dialects. The umbrella's gate computes which module-level
#   constants actually differ between the copies and refuses a difference this line
#   does not name: on 2026-08-24 an undeclared success-vocabulary constant made a
#   ported runner report twenty healthy guards as broken, and nothing could see it.
# diverges: none
import hashlib
import json
import os
import sys


def snapshot(root):
    """Every file's path, permission bits and content hash, sorted.

    `.git` is skipped: a copy made with `cp -R` carries index and log churn that has
    nothing to do with the plant, and including it would make every plant look landed.
    """
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d != ".git"]
        for name in filenames:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root)
            try:
                st = os.stat(full)
                with open(full, "rb") as fh:
                    digest = hashlib.sha256(fh.read()).hexdigest()
            except OSError:
                # A file that cannot be read is recorded as such rather than skipped:
                # a plant that makes a file unreadable HAS changed the tree.
                out.append([rel, "unreadable", ""])
                continue
            out.append([rel, oct(st.st_mode & 0o777), digest])
    out.sort()
    return out


def manifest_path(root):
    return os.path.normpath(root.rstrip("/")) + ".plant-manifest.json"


def main(argv):
    if len(argv) < 2:
        print("usage: plant_guard.py snap|verify <tree> [description]", file=sys.stderr)
        return 2
    verb, root = argv[0], argv[1]
    if not os.path.isdir(root):
        # Standing instruction #1: a component that never received its input must refuse
        # rather than approve. An absent tree is not a landed plant.
        print(f"PLANT GUARD CANNOT RUN: {root} is not a directory", file=sys.stderr)
        return 2

    if verb == "snap":
        with open(manifest_path(root), "w", encoding="utf-8") as fh:
            json.dump(snapshot(root), fh)
        return 0

    if verb == "verify":
        desc = argv[2] if len(argv) > 2 else root
        try:
            with open(manifest_path(root), encoding="utf-8") as fh:
                before = json.load(fh)
        except (OSError, ValueError):
            print(f"PLANT GUARD CANNOT RUN: no snapshot for {root} — call `snap` first",
                  file=sys.stderr)
            return 2
        after = snapshot(root)
        if before == after:
            print(f"PLANT DID NOT LAND: {desc}")
            print(f"  {root} is byte-for-byte and mode-for-mode identical to the "
                  f"snapshot taken before the plant ran.")
            return 1
        return 0

    print(f"unknown verb: {verb}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
