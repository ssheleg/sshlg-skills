#!/usr/bin/env python3
"""Fixtures for test/pin_source.py — including the state that turned the gate red.

The incident: on 2026-08-14 the umbrella's own `npm test` failed with

    skills.json: 'task-pipeline' pinned at 1.54.0 but the submodule contains 1.55.0

while 1.55.0 existed nowhere but an uncommitted bump in a concurrent session's working
tree. No tag carried it, npm had never served it, and a clone of that hub commit would
have installed 1.54.0 — the pinned number. The gate was reporting a state it could not
defend, and the remedy an operator would reach for (bump `skills.json` to 1.55.0) would
have advertised a version nobody had released.

The four verdicts below are the whole contract. Three of them are not failures, and the
distinction between them is the point: a check that collapses *dirty*, *blind* and
*mismatch* into one red is a check whose red nobody can act on.
"""
import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pin_source  # noqa: E402

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def repo(committed_version, working_version=None):
    """A real git repo whose HEAD carries one version and whose tree may carry another."""
    d = tempfile.mkdtemp()
    run = lambda *a: subprocess.run(["git", "-C", d, *a], capture_output=True, text=True)
    run("init", "-q")
    run("config", "user.email", "t@t"); run("config", "user.name", "t")
    with open(os.path.join(d, "package.json"), "w") as fh:
        json.dump({"version": committed_version}, fh)
    run("add", "-A"); run("commit", "-qm", "x")
    if working_version is not None:
        with open(os.path.join(d, "package.json"), "w") as fh:
            json.dump({"version": working_version}, fh)
    return d


def a_clean_match_is_a_match():
    d = repo("1.2.3")
    v, actual, _ = pin_source.resolve("1.2.3", pin_source.read_committed(d), "1.2.3")
    assert v == "match", v
    assert actual == "1.2.3"


def a_real_mismatch_still_fails():
    """The invariant this guard exists for: the pin advertises what a clone installs."""
    d = repo("1.2.3")
    v, actual, note = pin_source.resolve("1.9.9", pin_source.read_committed(d), "1.2.3")
    assert v == "mismatch", v
    assert actual == "1.2.3", "the failure names the working tree instead of the commit"
    assert "committed" in note, note


def an_uncommitted_bump_is_not_a_pin_failure():
    """THE INCIDENT. A version that exists only in a working tree is not what a
    checkout installs, so it cannot be what the pin is wrong about."""
    d = repo("1.54.0", working_version="1.55.0")
    v, actual, note = pin_source.resolve("1.54.0", pin_source.read_committed(d), "1.55.0")
    assert v == "dirty", f"an uncommitted bump was treated as {v}"
    assert actual == "1.54.0", "the resolved version is not the one a clone gets"
    assert "1.55.0" in note, "the dirty tree is not disclosed at all"
    assert "clone installs 1.54.0" in note, "the note does not say what a clone would get"


def a_dirty_tree_over_a_wrong_pin_still_fails():
    """Dirtiness must not become an excuse. If the COMMITTED version disagrees with the
    pin, the working tree's state is irrelevant and the gate is red."""
    d = repo("1.2.3", working_version="1.9.9")
    v, _, _ = pin_source.resolve("1.9.9", pin_source.read_committed(d), "1.9.9")
    assert v == "mismatch", f"a dirty tree hid a real pin mismatch: {v}"


def unreadable_git_falls_back_and_says_so():
    """A submodule copied to /tmp has a `.git` file pointing at a path that no longer
    resolves — the ordinary state inside a CI plant. Refusing there would make every
    plant unrunnable; going quiet would make the fallback invisible."""
    d = tempfile.mkdtemp()  # not a git repo at all
    assert pin_source.read_committed(d) is None, "read_committed invented a version"
    v, actual, note = pin_source.resolve("1.2.3", None, "1.2.3")
    assert v == "blind", v
    assert "working tree" in note, note
    assert actual == "1.2.3"


def unreadable_git_over_a_wrong_pin_still_fails():
    v, actual, _ = pin_source.resolve("1.2.3", None, "9.9.9")
    assert v == "mismatch", f"blindness became a pass: {v}"
    assert actual == "9.9.9"


def a_corrupt_package_json_reads_as_unreadable():
    """Not as version None, which would compare unequal to every pin and produce a
    mismatch nobody can act on."""
    d = repo("1.2.3")
    with open(os.path.join(d, "package.json"), "w") as fh:
        fh.write("{not json")
    subprocess.run(["git", "-C", d, "commit", "-qam", "break"], capture_output=True)
    assert pin_source.read_committed(d) is None, "corrupt JSON produced a version"


for n, f in [
    ("a clean match is a match", a_clean_match_is_a_match),
    ("a real mismatch still fails", a_real_mismatch_still_fails),
    ("an uncommitted bump is NOT a pin failure (the incident)", an_uncommitted_bump_is_not_a_pin_failure),
    ("a dirty tree over a wrong pin still fails", a_dirty_tree_over_a_wrong_pin_still_fails),
    ("unreadable git falls back and discloses it", unreadable_git_falls_back_and_says_so),
    ("unreadable git over a wrong pin still fails", unreadable_git_over_a_wrong_pin_still_fails),
    ("a corrupt package.json reads as unreadable", a_corrupt_package_json_reads_as_unreadable),
]:
    case(n, f)

if failures:
    print(f"\nFAIL: {len(failures)} of 7")
    sys.exit(1)
print("\nPASS: pin_source — 7 cases")
