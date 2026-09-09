#!/usr/bin/env python3
"""FIX-RT-02.01 — route-scoped waiver state (sherlock audit, parent FIX-RT-02).

The finding: «без дизайна» zeroed EVERY route for the turn while `optedOut`
stuck for the whole session, and a QUOTED "no pipeline." flipped the same
boolean — a quote is nobody's decision.

The fix under test, against lib/turnstate.js as behaviour:

* a design waiver leaves billing and UX routed — one route's waiver says
  nothing about another;
* a quoted refusal records nothing (isQuoted + source='quote'), and only
  source='user' creates a waiver;
* a session waiver survives the next turn's write() merge and can be
  explicitly revoked (patch {route: null} — and revokeWaiver());
* the deliberate whole-session flag stays separate, sticky, and still
  waives everything — a recorded policy decision, not a silent rewire.

Standard library only; drives the real module through node, including the
fs round-trip with a temp HOME.
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


def node(script):
    r = subprocess.run(
        ["node", "-e",
         f"const ts=require(process.argv[1]);{script}",
         os.path.join(ROOT, "lib", "turnstate.js")],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:300]
    return json.loads(r.stdout)


def t_one_routes_waiver_is_not_anothers():
    v = node("""
      let s = ts.recordWaiver({}, 'sheleg-design', {source: 'user'});
      console.log(JSON.stringify([ts.waived(s, 'sheleg-design'),
        ts.waived(s, 'sheleg-dev'), ts.waived(s, 'super-ux')]));""")
    assert v == [True, False, False], \
        f"a design waiver leaked onto billing/UX: {v} — the finding itself"


def t_quotes_and_tools_record_nothing():
    v = node("""
      const q = ts.recordWaiver({}, 'task-pipeline', {source: 'quote'});
      const t2 = ts.recordWaiver({}, 'task-pipeline', {source: 'tool'});
      console.log(JSON.stringify([ts.waived(q, 'task-pipeline'),
        ts.waived(t2, 'task-pipeline'),
        ts.isQuoted('обсуди фразу `без дизайна` подробно', 'без дизайна'),
        ts.isQuoted('она сказала «no pipeline» вчера', 'no pipeline'),
        ts.isQuoted('сделай без дизайна', 'без дизайна')]));""")
    assert v == [False, False, True, True, False], \
        f"a quoted or tool-sourced refusal changed state: {v}"


def t_session_waiver_survives_turns_and_revokes():
    home = tempfile.mkdtemp()
    v = node(f"""
      const home = {json.dumps(home)};
      ts.write(home, 's1', {{waivers: {{'sheleg-design': {{scope: 'session', source: 'user'}}}}}});
      ts.write(home, 's1', {{lastPrompt: 'next turn'}});          // the next turn
      const after = ts.read(home, 's1');
      const survived = ts.waived(after, 'sheleg-design');
      ts.write(home, 's1', {{waivers: {{'sheleg-design': null}}}}); // explicit revoke
      const revoked = ts.waived(ts.read(home, 's1'), 'sheleg-design');
      console.log(JSON.stringify([survived, revoked]));""")
    assert v == [True, False], \
        f"the waiver did not survive the turn, or the revoke failed: {v}"


def t_whole_session_flag_stays_separate_and_sticky():
    home = tempfile.mkdtemp()
    v = node(f"""
      const home = {json.dumps(home)};
      ts.write(home, 's2', {{optedOut: true}});
      ts.write(home, 's2', {{optedOut: false}});                 // may not un-decline
      const s = ts.read(home, 's2');
      const w = ts.recordWaiver({{}}, 'sheleg-design', {{source: 'user'}});
      console.log(JSON.stringify([s.optedOut === true,
        ts.waived(s, 'anything'), w.optedOut === undefined]));""")
    assert v == [True, True, True], \
        f"the deliberate flag lost stickiness or leaked into waivers: {v}"


def main():
    case("one route's waiver is not another's", t_one_routes_waiver_is_not_anothers)
    case("quotes and tool echoes record nothing", t_quotes_and_tools_record_nothing)
    case("a session waiver survives the next turn and revokes explicitly",
         t_session_waiver_survives_turns_and_revokes)
    case("the whole-session flag stays separate and sticky",
         t_whole_session_flag_stays_separate_and_sticky)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
