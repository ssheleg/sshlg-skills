#!/usr/bin/env python3
"""Fixtures for test/plant_guard.py — including the case that caught its absence.

Five inline variants of this guard shipped five different bugs. The one that reached a
pull request compared content only, against a plant whose entire effect is `chmod` — so
the mode case below is not an edge case, it is the incident.
"""
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
GUARD = os.path.join(HERE, "plant_guard.py")

failures = []


def run(*args):
    return subprocess.run([sys.executable, GUARD, *args], capture_output=True, text=True)


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def tree():
    d = tempfile.mkdtemp()
    root = os.path.join(d, "copy")
    os.makedirs(os.path.join(root, "sub"))
    with open(os.path.join(root, "a.txt"), "w") as fh:
        fh.write("hello\n")
    with open(os.path.join(root, "sub", "b.sh"), "w") as fh:
        fh.write("#!/bin/sh\necho hi\n")
    os.chmod(os.path.join(root, "sub", "b.sh"), 0o755)
    return root


def content_change_is_seen():
    r = tree()
    assert run("snap", r).returncode == 0, "snap failed"
    with open(os.path.join(r, "a.txt"), "a") as fh:
        fh.write("planted\n")
    out = run("verify", r, "a content edit")
    assert out.returncode == 0, f"a real content change was reported as not landed: {out.stdout}"


def a_mode_only_change_is_seen():
    """THE INCIDENT. `diff -rq` compares bytes; this plant only drops the exec bit."""
    r = tree()
    assert run("snap", r).returncode == 0
    os.chmod(os.path.join(r, "sub", "b.sh"), 0o644)
    out = run("verify", r, "the hook script without its executable bit")
    assert out.returncode == 0, (
        "a chmod-only plant was reported as not landed — this is the bug that shipped")


def no_change_is_refused():
    r = tree()
    assert run("snap", r).returncode == 0
    out = run("verify", r, "a plant whose anchor moved")
    assert out.returncode == 1, "an unchanged tree was accepted"
    assert "PLANT DID NOT LAND" in out.stdout, "the refusal does not name itself"
    assert "a plant whose anchor moved" in out.stdout, "the refusal does not name the plant"


def a_new_file_is_seen():
    r = tree()
    assert run("snap", r).returncode == 0
    with open(os.path.join(r, "orphan.md"), "w") as fh:
        fh.write("# orphan\n")
    assert run("verify", r, "an unreachable file").returncode == 0, "a new file was missed"


def a_deleted_file_is_seen():
    r = tree()
    assert run("snap", r).returncode == 0
    os.remove(os.path.join(r, "a.txt"))
    assert run("verify", r, "a deletion").returncode == 0, "a deletion was missed"


def git_churn_is_ignored():
    """`cp -R` carries .git, whose index moves on its own. Counting it would make every
    plant look landed, which is the opposite failure and just as useless."""
    r = tree()
    os.makedirs(os.path.join(r, ".git"))
    with open(os.path.join(r, ".git", "index"), "w") as fh:
        fh.write("before\n")
    assert run("snap", r).returncode == 0
    with open(os.path.join(r, ".git", "index"), "w") as fh:
        fh.write("after\n")
    out = run("verify", r, "a plant that did nothing while git churned")
    assert out.returncode == 1, "git churn was mistaken for a landed plant"


def a_missing_tree_refuses_rather_than_approves():
    """Standing instruction #1: no input means refuse, not approve."""
    out = run("verify", "/tmp/does-not-exist-plant-guard", "x")
    assert out.returncode == 2, f"expected 2, got {out.returncode}"
    assert "CANNOT RUN" in out.stderr


def a_missing_snapshot_refuses():
    r = tree()
    out = run("verify", r, "x")
    assert out.returncode == 2, "verify without snap should refuse, not pass"
    assert "CANNOT RUN" in out.stderr


def the_manifest_lives_outside_the_tree():
    """A manifest written INSIDE the tree would itself be a change, so every plant
    would look landed — the guard would approve everything."""
    r = tree()
    run("snap", r)
    inside = [f for _, _, fs in os.walk(r) for f in fs]
    assert not any("plant-manifest" in f for f in inside), \
        "the manifest is inside the tree it measures"
    out = run("verify", r, "a plant that did nothing")
    assert out.returncode == 1, "the manifest made an unchanged tree look changed"


for n, f in [
    ("a content change is seen", content_change_is_seen),
    ("a MODE-ONLY change is seen (the incident)", a_mode_only_change_is_seen),
    ("no change at all is refused, by name", no_change_is_refused),
    ("a new file is seen", a_new_file_is_seen),
    ("a deleted file is seen", a_deleted_file_is_seen),
    (".git churn is not mistaken for a plant", git_churn_is_ignored),
    ("a missing tree refuses rather than approves", a_missing_tree_refuses_rather_than_approves),
    ("verify without snap refuses", a_missing_snapshot_refuses),
    ("the manifest lives outside the tree", the_manifest_lives_outside_the_tree),
]:
    case(n, f)

if failures:
    print(f"\nFAIL: {len(failures)} of 9")
    sys.exit(1)
print("\nPASS: plant_guard — 9 cases")
