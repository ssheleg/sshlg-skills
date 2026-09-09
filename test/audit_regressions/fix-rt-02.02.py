#!/usr/bin/env python3
"""FIX-RT-02.02 — the waiver lifecycle (sherlock audit, closing leaf of
RT-02, on FIX-RT-02.01's route-scoped state).

The rules under test, against lib/triggers.js applyTurn() as behaviour:

* a refusal said on turn 1 narrows turn 2 — the session waiver survives the
  next turn, scoped to its one route (other routes keep their candidacy);
* «верни маршрут <route>» / "restore route <route>" revokes ONLY the named
  route — a second waived route stays waived;
* a QUOTED refusal neither declines the turn nor records a waiver — one
  isQuoted implementation serves classify and the lifecycle;
* the whole-session opt-out stays a separate deliberate act: it filters
  everything and no route-revoke clears it;
* a system turn changes no state.

Standard library only; drives the real modules through node.
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


def turns(*prompts, state=None):
    script = (
        "const t=require(process.argv[1]);"
        "let s=" + json.dumps(state or {}) + ";const out=[];"
        "for (const p of JSON.parse(process.argv[2])) {"
        "  const r=t.applyTurn(s,p); s=r.state;"
        "  out.push({facets:r.classification.facets,"
        "            declined:r.classification.declined,"
        "            waivers:Object.keys(s.waivers||{}),"
        "            optedOut:!!s.optedOut});"
        "}"
        "console.log(JSON.stringify(out));")
    r = subprocess.run(
        ["node", "-e", script, os.path.join(ROOT, "lib", "triggers.js"),
         json.dumps(list(prompts))],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:300]
    return json.loads(r.stdout)


def t_waiver_survives_the_next_turn_scoped():
    v = turns("сделай лендинг, но без дизайна",
              "подбери палитру и токены темы, и добавь воронку")
    assert v[0]["waivers"] == ["sheleg-design"]
    assert "sheleg-design" not in v[1]["facets"], \
        "the waiver did not survive the next turn"
    assert "super-ux" in v[1]["facets"], \
        "the waiver erased an unrelated route's candidacy — scope broke"


def t_revoke_restores_only_the_named_route():
    v = turns("сделай лендинг без дизайна, а рефактор без пайплайна",
              "верни маршрут sheleg-design — подбери палитру и сделай рефактор")
    assert set(v[0]["waivers"]) == {"sheleg-design", "task-pipeline"}
    assert v[1]["waivers"] == ["task-pipeline"], \
        f"the revoke touched more than its route: {v[1]['waivers']}"
    assert "sheleg-design" in v[1]["facets"], "the revoked route did not return"
    assert "task-pipeline" not in v[1]["facets"], \
        "an un-revoked waiver stopped waiving"


def t_quoted_refusal_records_and_declines_nothing():
    v = turns("обсуди фразу `без дизайна` подробно, и подбери палитру")
    assert v[0]["waivers"] == [], "a quoted refusal recorded a waiver"
    assert v[0]["declined"] == [], "a quoted refusal declined the turn"
    assert "sheleg-design" in v[0]["facets"], \
        "a quoted refusal silenced the route it merely mentions"


def t_opt_out_is_separate_and_unclearable_by_revoke():
    v = turns("верни маршрут sheleg-design — подбери палитру",
              state={"optedOut": True})
    assert v[0]["optedOut"] is True, "a route revoke cleared the session opt-out"
    assert v[0]["facets"] == [], "the deliberate opt-out stopped filtering"


def t_system_turn_changes_no_state():
    v = turns("[SYSTEM NOTIFICATION - NOT USER INPUT] без дизайна no pipeline")
    assert v[0]["waivers"] == [] and v[0]["facets"] == [], \
        "a system turn recorded somebody's decision"


def main():
    case("a waiver survives the next turn, scoped to its route",
         t_waiver_survives_the_next_turn_scoped)
    case("a revoke restores only the named route",
         t_revoke_restores_only_the_named_route)
    case("a quoted refusal records and declines nothing",
         t_quoted_refusal_records_and_declines_nothing)
    case("the session opt-out is separate and no revoke clears it",
         t_opt_out_is_separate_and_unclearable_by_revoke)
    case("a system turn changes no state", t_system_turn_changes_no_state)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
