#!/usr/bin/env python3
"""FIX-RT-04.01 — the route gate takes a receipt of the CHOSEN route, not the
existence of someone else's run.md (sherlock audit, RT-04).

The finding: `decide()` asked one boolean — "is a .task-pipeline/run.md open?"
— so an open run silenced EVERY route at once (a stale run licensed a new,
unrelated publication), while a legitimate stand-alone make-skill/UX audit,
which never opens a pipeline run, was told "nothing has taken that route yet".
The fact of a pipeline run and the fact of work on a subject skill are
different events. And the gate is advisory enforcement, not a security
boundary — its degraded surfaces must be enumerated, not discovered.

The fix under test, exercised by running the real module under node:
* a receipt is `{route, taskId, skillDigest, effects}` and covers exactly its
  own route for its own effects — an audit route with its receipt asks for no
  pipeline; a pipeline receipt does not silence a different route; an old
  receipt cannot license an effect outside its list;
* a rumour (missing taskId / skillDigest / effects) never covers;
* every bypass/degraded surface is enumerated in `SURFACES`;
* no new confirmation of reversible actions: once-per-turn, opt-out,
  bypassPermissions and no-route silences all still hold.

Node is required by this repository already (the launcher is Node); no new
mandatory package.
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


def run_node(expr):
    js = (
        "const R = require(process.argv[1]);"
        "const c = JSON.parse(process.argv[2]);"
        "const out = c.map((k) => R.decide(k.payload, k.state, k.opts));"
        "console.log(JSON.stringify({verdicts: out.map(v => v && v.reason || null),"
        " surfaces: R.SURFACES}));"
    )
    r = subprocess.run(
        ["node", "-e", js, os.path.join(ROOT, "lib", "routegate.js"), json.dumps(expr)],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:400]}"
    return json.loads(r.stdout)


EDIT = {"tool_name": "Edit", "prompt_id": "p1",
        "tool_input": {"file_path": "/repo/src.js"}, "cwd": "/repo"}
STATE = {"promptId": "p1", "routes": ["task-pipeline"], "optedOut": False, "asked": False}
PIPE_RECEIPT = {"route": "task-pipeline", "taskId": "T-1", "skillDigest": "a" * 64,
                "effects": ["Edit", "Write", "MultiEdit", "NotebookEdit"]}
LINES = {"task-pipeline": "changes the repository", "make-skill": "changes a skill's construction"}


def t_audit_with_receipt_needs_no_pipeline():
    audit_state = dict(STATE, routes=["make-skill"])
    audit_receipt = {"route": "make-skill", "taskId": "AUD-7",
                     "skillDigest": "b" * 64, "effects": ["Edit", "Write"]}
    out = run_node([{"payload": EDIT, "state": audit_state,
                     "opts": {"receipts": [audit_receipt], "lines": LINES}}])
    assert out["verdicts"][0] is None, \
        "a stand-alone audit with its own receipt was told to open a pipeline"


def t_pipeline_run_does_not_license_other_routes():
    audit_state = dict(STATE, routes=["make-skill"])
    out = run_node([{"payload": EDIT, "state": audit_state,
                     "opts": {"receipts": [PIPE_RECEIPT], "lines": LINES}}])
    v = out["verdicts"][0]
    assert v is not None, "an open pipeline run silenced an unrelated route — the finding"
    assert "changes a skill's construction" in v, "the uncovered route is not named"
    assert "changes the repository" not in v, "the covered route was rendered as uncovered"


def t_old_run_cannot_license_unrelated_effect():
    narrow = dict(PIPE_RECEIPT, effects=["NotebookEdit"])
    out = run_node([
        {"payload": EDIT, "state": STATE,
         "opts": {"receipts": [narrow], "effect": "Write", "lines": LINES}},
        {"payload": EDIT, "state": STATE,
         "opts": {"receipts": [narrow], "effect": "NotebookEdit", "lines": LINES}},
    ])
    assert out["verdicts"][0] is not None, \
        "an old receipt licensed an effect outside its list — the unrelated publication"
    assert out["verdicts"][1] is None, "the effect the receipt DOES permit was escalated"


def t_rumour_is_not_a_receipt():
    broken = [
        {"route": "task-pipeline", "skillDigest": "c" * 64, "effects": ["Edit"]},
        {"route": "task-pipeline", "taskId": "t", "effects": ["Edit"]},
        {"route": "task-pipeline", "taskId": "t", "skillDigest": "c" * 64, "effects": []},
    ]
    out = run_node([{"payload": EDIT, "state": STATE,
                     "opts": {"receipts": [b], "lines": LINES}} for b in broken])
    for i, v in enumerate(out["verdicts"]):
        assert v is not None, f"malformed receipt #{i} silenced the gate"


def t_surfaces_enumerated():
    out = run_node([])
    surfaces = out["surfaces"]
    assert isinstance(surfaces, list) and len(surfaces) >= 8, \
        "the bypass/degraded surfaces are not enumerated"
    joined = " || ".join(surfaces)
    for must in ("Bash", "bypassPermissions", "refusal phrase", "per turn",
                 "outside the project", "earlier prompt", "receipt", "fails open"):
        assert must in joined, f"no enumerated surface names: {must}"


def t_no_new_confirmations():
    cases = [
        {"payload": dict(EDIT, permission_mode="bypassPermissions"), "state": STATE,
         "opts": {"receipts": [], "lines": LINES}},
        {"payload": EDIT, "state": dict(STATE, asked=True),
         "opts": {"receipts": [], "lines": LINES}},
        {"payload": EDIT, "state": dict(STATE, optedOut=True),
         "opts": {"receipts": [], "lines": LINES}},
        {"payload": EDIT, "state": dict(STATE, routes=[]),
         "opts": {"receipts": [], "lines": LINES}},
    ]
    out = run_node(cases)
    names = ["bypassPermissions", "asked-once", "opt-out", "no-route"]
    for n, v in zip(names, out["verdicts"]):
        assert v is None, f"the {n} silence was lost — a new confirmation appeared"


def main():
    case("an audit route with its own receipt asks for no pipeline",
         t_audit_with_receipt_needs_no_pipeline)
    case("a pipeline run does not license other routes",
         t_pipeline_run_does_not_license_other_routes)
    case("an old run cannot license an effect outside its receipt",
         t_old_run_cannot_license_unrelated_effect)
    case("a rumour is not a receipt", t_rumour_is_not_a_receipt)
    case("every bypass/degraded surface is enumerated", t_surfaces_enumerated)
    case("no reversible action gained a new confirmation", t_no_new_confirmations)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
