#!/usr/bin/env python3
"""Fixtures for test/graph_staleness.py — including the two ways it could lie quietly.

A graph's distance from the code is the kind of number that is easy to report wrongly in
the reassuring direction, and both ways are asserted here:

- a `built_at_commit` that does not resolve must read `blind`, not `current` — a shallow
  clone would otherwise report every graph as up to date for the same empty reason;
- a graph that cannot be refreshed at all must say so *even when it is at HEAD*, because
  "current today" and "current and will stay that way because nothing can rebuild it" are
  different facts, and only one of them is fine.

The instrument this replaced read `edges` from a node-link document whose key is `links`,
and reported **zero edges across all nine graphs** — 11,267 nodes and no relations, which
would have been a catastrophe had it been true. `graphify god-nodes` printed real hubs
against the same file one command later. That is why `resolve` takes measured facts rather
than reading anything itself: the reading is where it went wrong.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import graph_staleness  # noqa: E402

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def a_graph_at_head_is_current():
    state, msg = graph_staleness.resolve("abc1234def", True, 0, True)
    assert state == "current", state
    assert "at HEAD" in msg, msg


def distance_is_reported_with_the_commit_that_built_it():
    state, msg = graph_staleness.resolve("0f557c57aa", True, 31, True)
    assert state == "behind", state
    assert "31 commits behind" in msg, msg
    assert "0f557c57" in msg, "the reader needs the commit to check it themselves: " + msg


def one_commit_is_singular():
    _, msg = graph_staleness.resolve("abc1234def", True, 1, True)
    assert "1 commit behind" in msg, msg


def an_unresolvable_commit_is_blind_never_current():
    state, msg = graph_staleness.resolve("deadbeef00", False, 0, True)
    assert state == "blind", ("a graph whose build commit is gone must not read as current — "
                              f"got {state}")
    assert "does not resolve" in msg, msg


def a_missing_field_is_blind():
    state, msg = graph_staleness.resolve("", True, 0, True)
    assert state == "blind", state
    assert "built_at_commit" in msg, msg


def no_graph_is_absent_not_current():
    state, msg = graph_staleness.resolve(None, True, 0, True)
    assert state == "absent", state


def an_unusable_count_is_blind():
    for bad in (None, "", "soon", -4):
        state, _ = graph_staleness.resolve("abc1234def", True, bad, True)
        assert state == "blind", f"{bad!r} read as {state}, which would hide real distance"


def a_graph_that_cannot_be_refreshed_says_so_even_at_head():
    """Current today and current-because-nothing-can-rebuild-it are different facts."""
    state, msg = graph_staleness.resolve("abc1234def", True, 0, False)
    assert state == "current", state
    assert "cannot run here" in msg, "an unrefreshable graph must say so at HEAD too: " + msg
    assert "B-51" in msg, msg


def a_behind_graph_that_cannot_be_refreshed_carries_both_facts():
    _, msg = graph_staleness.resolve("abc1234def", True, 7, False)
    assert "7 commits behind" in msg and "cannot run here" in msg, msg


for n, f in [
    ("a graph at HEAD is current", a_graph_at_head_is_current),
    ("distance names the commit that built it", distance_is_reported_with_the_commit_that_built_it),
    ("one commit is singular", one_commit_is_singular),
    ("an unresolvable build commit is blind, never current", an_unresolvable_commit_is_blind_never_current),
    ("a missing built_at_commit is blind", a_missing_field_is_blind),
    ("no graph is absent, not current", no_graph_is_absent_not_current),
    ("an unusable count is blind", an_unusable_count_is_blind),
    ("an unrefreshable graph says so even at HEAD", a_graph_that_cannot_be_refreshed_says_so_even_at_head),
    ("behind and unrefreshable carries both facts", a_behind_graph_that_cannot_be_refreshed_carries_both_facts),
]:
    case(n, f)

if failures:
    print(f"\nFAIL: {len(failures)} of 9")
    sys.exit(1)
print("\nPASS: graph_staleness — 9 cases")
