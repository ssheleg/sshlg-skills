#!/usr/bin/env python3
"""Fixtures for test/release_lag.py — including the state nothing reported for six hours.

The incident: on 2026-08-16, `seo-aeo-audit`'s `main` carried a fix for a `KeyError` that
killed the default markdown output on any page without FAQ schema. It was committed at
02:25 and never tagged. `skills.json` pinned 0.20.0 — the crashing version — and
`check_pins.py` stayed green the whole time, correctly: the pin matched the latest
release, and the latest release was the problem. The hub copy, which installs from the
branch, already had the repair. Two channels, two different skills, no complaint from
anything.

The three verdicts below are the whole contract, and the split between *blind* and
*current* is the one that matters. A checkout with no `origin/main` cannot see whether
anything is waiting; reporting "nothing waiting" from there would give every member the
same clean answer for the same empty reason — the uniform-measurement failure this
repository has caught four times.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import release_lag  # noqa: E402

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def the_incident_is_reported():
    state, msg = release_lag.resolve(True, 1, "the default output mode crashed on the common case")
    assert state == "lag", state
    assert "1 unreleased commit on main" in msg, msg
    assert "the default output mode crashed" in msg, msg


def a_pin_at_the_tip_is_current():
    state, msg = release_lag.resolve(True, 0, "")
    assert state == "current", state
    assert "tip of main" in msg, msg


def no_ref_is_blind_and_never_current():
    state, msg = release_lag.resolve(False, 0, "")
    assert state == "blind", ("a checkout that cannot look must not report a clean pin — "
                              f"got {state}")
    assert "origin/main" in msg, msg


def many_commits_pluralise_and_still_name_the_newest():
    state, msg = release_lag.resolve(True, 4, "fix the thing")
    assert state == "lag", state
    assert "4 unreleased commits" in msg, msg
    assert "'fix the thing'" in msg, msg


def a_lag_with_no_subject_still_reports():
    """git can hand back an empty subject; the count is still the finding."""
    state, msg = release_lag.resolve(True, 2, "")
    assert state == "lag", state
    assert "(no subject)" in msg, msg


def an_unusable_count_is_blind_not_current():
    for bad in (None, "", "not-a-number", -3):
        state, _ = release_lag.resolve(True, bad, "x")
        assert state == "blind", f"{bad!r} read as {state}, which would hide a real lag"


for n, f in [
    ("the incident is reported, and names the commit", the_incident_is_reported),
    ("a pin at the tip is current", a_pin_at_the_tip_is_current),
    ("no origin/main is blind, never current", no_ref_is_blind_and_never_current),
    ("several commits pluralise and name the newest", many_commits_pluralise_and_still_name_the_newest),
    ("a lag with no subject still reports", a_lag_with_no_subject_still_reports),
    ("an unusable count is blind, never current", an_unusable_count_is_blind_not_current),
]:
    case(n, f)

if failures:
    print(f"\nFAIL: {len(failures)} of 6")
    sys.exit(1)
print("\nPASS: release_lag — 6 cases")
