#!/usr/bin/env python3
"""An extraLink that advertises a count must derive it, never write it.

`skills.json` carried `"Browse all 34 style packs"`. It was true the day it was
written and would have been wrong the day a thirty-fifth pack shipped, on the
family's most-read page, with nothing anywhere to catch it — the same dead-address
class this repository gates everywhere else, arriving through a field nothing read.

So a label may say `{n}` and name what to count; `scripts/site.js` counts the files
in that member's own submodule at build time. This test refuses the other spelling.

    python3 test/extralinks_test.py
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
# A version-shaped number is not a tally: "v2 API" or "Base UI 1.0" name a thing.
TALLY = re.compile(r"(?<![\w.])\d{1,4}(?![\w.])")

def main() -> int:
    data = json.loads((ROOT / "skills.json").read_text())
    checks = 0
    bad: list[str] = []
    skips: list[str] = []
    for m in data.get("skills", []):
        for link in m.get("extraLinks") or []:
            checks += 1
            label = link.get("label", "")
            derived = "{n}" in label
            if derived:
                if not link.get("countGlob"):
                    bad.append(f"{m['name']}: label uses {{n}} and sets no countGlob — "
                               f"the build cannot resolve it")
                    continue
                target = ROOT / m["dir"] / pathlib.Path(link["countGlob"]).parent
                if not target.is_dir():
                    # A non-recursive clone has no submodule tree, and a gate that
                    # fails there stops being runnable in the one place this
                    # repository promises it runs. Disclosed, not swallowed: the
                    # BUILD refuses the same state, where refusing is correct.
                    skips.append(f"{m['name']}: {link['countGlob']} — submodule not "
                                 f"checked out, so the count was not verified here "
                                 f"(scripts/site.js refuses to build from this state)")
                    continue
                checks += 1
                ext = pathlib.Path(link["countGlob"]).name
                if not ext.startswith("*"):
                    bad.append(f"{m['name']}: countGlob must end in *<ext>, got {ext}")
                    continue
                n = len(list(target.glob(ext)))
                if n == 0:
                    bad.append(f"{m['name']}: countGlob {link['countGlob']} matches "
                               f"nothing — the label would advertise a zero")
            elif TALLY.search(label):
                n = TALLY.search(label).group(0)
                bad.append(f"{m['name']}: label {label!r} writes the count {n} by hand. "
                           f"Use '{{n}}' with a countGlob so the build derives it, or drop "
                           f"the number — a count on a published page goes stale silently")
    if bad:
        print("FAIL: extraLinks")
        for b in bad:
            print(f"  - {b}")
        return 1
    for s in skips:
        print(f"  unlooked: {s}")
    print(f"OK ({checks} checks — every advertised count is derived)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
