#!/usr/bin/env python3
"""FIX-RT-03.01 — host availability is what is CALLABLE, not the Claude
inventory count (sherlock audit, RT-03).

The finding: readSkills read only the Claude inventory and counted directories
and symlinks without a live SKILL.md; family declaration keyed on id, not
provenance — so a broken symlink or a same-named foreign skill read as
available, and version choice could be wrong.

The fix under test (lib/conflicts.js readSkills + lib/toolkit.js classify/report,
driven through node against synthetic host homes):
* every entry carries callable / provenance / namespace / content digest;
* a broken symlink and a bare directory are discovered-but-NOT-callable;
* the active-host roster contains only actually-resolvable entries; uncallable
  ones are shown as inventory, never as availability;
* identity is namespace+provenance+digest, not a bare id.

Standard library + node only.
"""
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def synth_home():
    """A synthetic host home: a callable plain skill, a broken symlink, a
    same-named foreign target with no SKILL.md, and a bare directory."""
    home = tempfile.mkdtemp()
    plain = os.path.join(home, ".claude", "skills")
    os.makedirs(plain)
    # callable: real dir with SKILL.md
    good = os.path.join(plain, "vision")
    os.makedirs(good)
    with open(os.path.join(good, "SKILL.md"), "w") as fh:
        fh.write("---\nname: vision\ndescription: real\n---\n")
    # broken symlink
    os.symlink(os.path.join(home, "does-not-exist"), os.path.join(plain, "ghost"))
    # same-named foreign target with no SKILL.md
    foreign = os.path.join(home, "foreign-lib")
    os.makedirs(foreign)
    os.symlink(foreign, os.path.join(plain, "impostor"))
    # bare directory, no SKILL.md
    os.makedirs(os.path.join(plain, "empty"))
    return home


def read(home):
    js = ("const c=require(process.argv[1]);"
          "console.log(JSON.stringify(c.readSkills(process.argv[2])))")
    r = subprocess.run(["node", "-e", js, os.path.join(ROOT, "lib", "conflicts.js"), home],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def t_entries_carry_the_fields():
    home = synth_home()
    skills = {s["id"]: s for s in read(home)}
    v = skills["vision"]
    for f in ("callable", "provenance", "namespace", "digest"):
        assert f in v, f"entry lacks {f}"
    assert v["callable"] is True and v["digest"], "the callable skill has no digest"
    assert v["provenance"].startswith("plain:") and v["namespace"] == "claude:plain"


def t_broken_symlink_not_callable():
    home = synth_home()
    skills = {s["id"]: s for s in read(home)}
    assert skills["ghost"]["callable"] is False, "a broken symlink read as callable"
    assert skills["ghost"]["digest"] is None


def t_foreign_target_and_bare_dir_not_callable():
    home = synth_home()
    skills = {s["id"]: s for s in read(home)}
    assert skills["impostor"]["callable"] is False, \
        "a same-named foreign target with no SKILL.md read as callable"
    assert skills["empty"]["callable"] is False, "a bare directory read as callable"


def t_roster_is_callable_only():
    home = synth_home()
    skills = read(home)
    js = ("const t=require(process.argv[1]);"
          "const {family, foreign, total, uncallable}=t.classify(JSON.parse(process.argv[2]), []);"
          "console.log(JSON.stringify({total, uncallable: uncallable.map(u=>u.id).sort(),"
          " foreignIds: foreign.flatMap(g=>g.skills.map(s=>s.id)).sort()}))")
    r = subprocess.run(["node", "-e", js, os.path.join(ROOT, "lib", "toolkit.js"),
                        json.dumps(skills)], capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    out = json.loads(r.stdout.strip().splitlines()[-1])
    assert "vision" in out["foreignIds"], "the callable skill is missing from the roster"
    assert out["uncallable"] == ["empty", "ghost", "impostor"], \
        f"uncallable set wrong: {out['uncallable']}"
    assert "ghost" not in out["foreignIds"] and "impostor" not in out["foreignIds"], \
        "an uncallable entry leaked into the available roster"
    # total counts only callable
    assert out["total"] == 1, f"total counts non-callable entries: {out['total']}"


def t_report_names_host_and_uncallable():
    home = synth_home()
    skills = read(home)
    js = ("const t=require(process.argv[1]);"
          "process.stdout.write(t.report(JSON.parse(process.argv[2]), [], {host:'codex'}))")
    r = subprocess.run(["node", "-e", js, os.path.join(ROOT, "lib", "toolkit.js"),
                        json.dumps(skills)], capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    out = r.stdout
    assert "CALLABLE on the active host (codex)" in out, "the report does not name the host"
    assert "discovered but NOT callable on codex" in out, "uncallable section missing"
    assert "inventory, not availability" in out


def main():
    case("every entry carries callable/provenance/namespace/digest",
         t_entries_carry_the_fields)
    case("a broken symlink is not callable", t_broken_symlink_not_callable)
    case("a foreign target and a bare dir are not callable",
         t_foreign_target_and_bare_dir_not_callable)
    case("the roster is callable-only; uncallable counted apart",
         t_roster_is_callable_only)
    case("the report names the host and lists uncallable as inventory",
         t_report_names_host_and_uncallable)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
