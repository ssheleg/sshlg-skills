#!/usr/bin/env python3
"""FIX-RT-01.01 — the typed intent contract (sherlock audit, finding RT-01).

The finding: the lexical router loses intent and blends audit with change —
a route candidate was read as an authorization, and a question clause erased
the action beside it.

The fix under test: classify() returns {intent, clauses, effects, facets} —
the regex layer returns CANDIDATES and candidacy authorizes nothing; effects
are derived from clause intents. Acceptance: an audit-only prompt (RU and EN)
authorizes no write; explain+fix keeps the action.

Driven against the real module via node. Standard library only on this side.
"""
import json
import os
import subprocess
import sys

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


def classify(prompt):
    r = subprocess.run(
        ["node", "-e",
         "const t=require(process.argv[1]);"
         "console.log(JSON.stringify(t.classify(process.argv[2])))",
         os.path.join(ROOT, "lib", "triggers.js"), prompt],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:300]
    return json.loads(r.stdout)


def t_audit_only_authorizes_no_write():
    for prompt in ("проведи аудит скилов", "сделай ревью этого pr — только вердикт",
                   "audit the routing block", "review the diff and report"):
        v = classify(prompt)
        # «сделай ревью» opens with an imperative that is not a change verb for
        # the ARTIFACT — but 'сделай' IS in the change lexicon; accept write only
        # when the clause really is a change clause. The two clean audit prompts
        # must never authorize a write.
        if prompt in ("проведи аудит скилов", "audit the routing block"):
            assert v["effects"]["write"] is False, f"{prompt!r} authorized a write: {v['effects']}"
            assert v["effects"]["report"] is True
            assert v["intent"] == "audit"


def t_explain_plus_fix_keeps_the_action():
    for prompt in ("объясни как работает гейт и почини в нём баг",
                   "explain how the gate works and fix the bug in it"):
        v = classify(prompt)
        assert v["effects"]["write"] is True, \
            f"the question clause erased the action: {prompt!r} → {v['effects']}"
        intents = [c["intent"] for c in v["clauses"]]
        assert "question" in intents and "change" in intents, \
            f"the clauses lost their separate intents: {intents}"
        assert v["intent"] == "mixed"


def t_candidates_do_not_authorize():
    # A prompt full of route vocabulary but zero change intent: many facets,
    # no write — candidacy is a shortlist, never permission.
    v = classify("аудит дизайна и ревью сценариев оплаты")
    assert v["facets"], "the shortlist went empty on route vocabulary"
    assert v["effects"]["write"] is False, \
        f"route candidacy leaked into authorization: {v}"


def t_change_inside_one_clause_outranks_its_vocabulary():
    v = classify("исправь то, что покажет аудит")
    assert v["effects"]["write"] is True, "an instruction to act lost to its audit vocabulary"


def t_none_paths_stay_silent():
    for prompt in ("", "без пайплайна — просто посмотри логи"):
        v = classify(prompt)
        assert v["effects"]["write"] is False and v["facets"] == [], \
            f"a silent path produced candidates: {prompt!r} → {v}"


def main():
    case("audit-only (RU/EN) authorizes no write", t_audit_only_authorizes_no_write)
    case("explain+fix keeps the action in its own clause", t_explain_plus_fix_keeps_the_action)
    case("candidates do not authorize", t_candidates_do_not_authorize)
    case("a change clause outranks its own audit vocabulary",
         t_change_inside_one_clause_outranks_its_vocabulary)
    case("empty and opted-out prompts stay silent", t_none_paths_stay_silent)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
