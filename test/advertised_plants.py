#!/usr/bin/env python3
"""Does every member's OWN gate refuse a description that drops a routed trigger?

`test/triggers_test.js` proves the table is derived from what the skills advertise.
`test/advertised_check.js` makes that question askable from a member. Neither proves the
seven members actually **ask** it — delete the call from one `validate.py` and every
fixture here stays green while B-54 returns whole.

So this plants the real defect in each member in turn: one of that member's own advertised
phrases removed from the shipped `SKILL.md`, that member's own `validate.py` run, and a
non-zero exit required. The file is restored before the verdict is judged, so a failing
member cannot leave a corrupted tree behind.

**This is the only place the plant can live**, and that is a property of the check rather
than a convenience. The member-side check needs an umbrella above it and discloses without
one; a member's own CI clones it standalone, so a negative self-test there would have to
assert a refusal that cannot happen. Here the submodules exist, so here it runs.

**Deliberately not named `*_test.py`, and therefore not discovered by `npm test`.**
It runs seven member validators and costs ~21 s; `npm test` is wired to this
repository's own commit gate, whose entire honesty argument is that it costs about
three seconds — *a synchronous gate at three minutes is a gate people route around*.
Excluding it by name from the runner was the other option and was refused: that
runner discovers rather than lists, on purpose. So it has its own entry point,
`npm run test:plants`, and `validate.py` asserts that both that script and the CI
step still exist — a suite nothing calls is the shape this repository keeps catching.

Skips loudly when a submodule is not materialized: a sweep that quietly covers three of
seven reads exactly like one that covered all seven.
"""
import glob
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def groups():
    """`[{skill, triggers}]` straight from the module the hook calls.

    Read through node rather than re-parsed here: a python copy of the table would be the
    second source of truth this whole line of work exists to avoid.
    """
    js = (
        f'const T=require({json.dumps(os.path.join(ROOT, "lib", "triggers.js"))});'
        'const out=[];for(const s of Object.values(T.ROUTES))'
        'for(const g of (s.sources||[{skill:s.skill,triggers:s.triggers}]))'
        'out.push({skill:g.skill,triggers:g.triggers});console.log(JSON.stringify(out))'
    )
    proc = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"  unlooked: cannot read the routing table — {proc.stderr.strip()[:120]}")
        return None
    return json.loads(proc.stdout)


def main():
    gs = groups()
    if gs is None:
        print("SKIP: advertised plants — the routing table could not be read")
        return 0

    rows, skipped, seen = [], [], set()
    for g in gs:
        member, skill = g["skill"].split("/")
        if member in seen:
            continue
        seen.add(member)
        hits = glob.glob(f"{ROOT}/skills/{member}/plugins/*/skills/{skill}/SKILL.md")
        validator = f"{ROOT}/skills/{member}/test/validate.py"
        if not hits or not os.path.isfile(validator):
            skipped.append(f"{member}: submodule not materialized")
            continue
        path = hits[0]
        original = open(path, encoding="utf-8").read()
        # The first trigger that appears VERBATIM in the raw file. The check reads a
        # whitespace-collapsed, lowercased description, so a real trigger can still span a
        # line break — the first draft of this sweep tripped on exactly that.
        trigger = next((t for t in g["triggers"] if t in original), None)
        if trigger is None:
            skipped.append(f"{member}: no trigger appears verbatim in {os.path.basename(path)}")
            continue
        # EVERY occurrence, not the first: a phrase advertised twice survives one
        # replacement and the check then correctly reports nothing, which reads as the
        # check failing to fire.
        open(path, "w", encoding="utf-8").write(original.replace(trigger, trigger[:-1] + "ZZ"))
        try:
            proc = subprocess.run([sys.executable, "test/validate.py"],
                                  cwd=f"{ROOT}/skills/{member}",
                                  capture_output=True, text=True, timeout=600)
            out = proc.stdout + proc.stderr
            rc = proc.returncode
        finally:
            open(path, "w", encoding="utf-8").write(original)
        rows.append((member, trigger, rc, rc != 0 and "routing hook fires" in out))

    for member, trigger, rc, caught in rows:
        print(f"  {'ok  ' if caught else 'FAIL'}  {member}: dropped {trigger!r} -> exit {rc}")
    for s in skipped:
        print(f"  unlooked: {s}")

    missed = [r[0] for r in rows if not r[3]]
    if missed:
        print(f"\nFAIL: {len(missed)} member(s) did not refuse their own planted drop: "
              + ", ".join(missed))
        return 1
    if not rows:
        print("\nSKIP: advertised plants — no member was materialized, so nothing was proved")
        return 0
    print(f"\nPASS: advertised plants — {len(rows)} member(s) refuse a dropped trigger in "
          f"their own gate")
    return 0


if __name__ == "__main__":
    sys.exit(main())
