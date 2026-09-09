#!/usr/bin/env python3
"""FIX-EV-01.01 — the outcome harness contract (sherlock audit, parent FIX-EV-01).

The finding: the family's routing evals check that the right skill NAME was
picked, which proves nothing about whether running the skill helped. The
harness (test/outcome_harness.py) and the case contract
(schemas/outcome-case.schema.json) this file pins are what the per-member
outcome corpora consume.

Acceptance, run as behaviour against the harness with injected executors:

* a failed process cannot PASS — a crashed arm and a nonzero exit are ERROR
  on the outcome axis, whatever the artifacts hold;
* a wrong artifact remains FAIL even with a perfect load trace — the right
  skill name is not the product;
* expectations never reach the arm; probes that fail make the case NOT_RUN;
  the manifest keeps the three axes apart.

Standard library only.
"""
import hashlib
import importlib.util
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
HARNESS = os.path.join(ROOT, "test", "outcome_harness.py")
SCHEMA = os.path.join(ROOT, "schemas", "outcome-case.schema.json")

_spec = importlib.util.spec_from_file_location("outcome_harness", HARNESS)
H = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(H)

checks = 0
failures = []


def case(name, fn):
    global checks
    try:
        fn()
        checks += 1
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


GOOD_BYTES = b"# the artifact the skill should produce\n"
GOOD_DIGEST = hashlib.sha256(GOOD_BYTES).hexdigest()


def make_case():
    return {
        "schema_version": "outcome-case/1",
        "id": "EV-CASE-001",
        "skill": "task-pipeline",
        "prompt": {"text": "run the pipeline on the frozen fixture"},
        "environment": {"model": "inherit", "host": "any",
                        "case_digest": hashlib.sha256(b"frozen").hexdigest()},
        "checks": {
            "tool": [{"name": "python present", "command": "true"}],
            "load_trace": {"expect_loaded": ["task-pipeline"],
                           "expect_not_loaded": ["agent-stack"]},
            "outcome": [{"name": "artifact bytes", "kind": "artifact-digest",
                         "target": "out.md", "expect": GOOD_DIGEST}],
        },
    }


def executor_ok(arm):
    return {"artifacts": {"out.md": GOOD_BYTES},
            "load_trace": ["task-pipeline"], "exit": 0}


def t_schema_and_validator_agree():
    schema = json.load(open(SCHEMA, encoding="utf-8"))
    for field in ("schema_version", "id", "skill", "prompt", "environment", "checks"):
        assert field in schema["required"], f"schema no longer requires {field}"
    assert H.case_problems(make_case()) == [], \
        f"a valid case was rejected: {H.case_problems(make_case())}"
    bad = make_case()
    bad["checks"]["outcome"] = []
    assert any("name-picking eval" in p for p in H.case_problems(bad)), \
        "a case with no outcome checks was accepted — the finding itself"
    r = subprocess.run([sys.executable, HARNESS, "/nonexistent.json"],
                       capture_output=True, text=True)
    assert r.returncode == 1, "the CLI accepted an unreadable case"


def t_failed_process_cannot_pass():
    def crasher(arm):
        raise RuntimeError("the arm died")
    v = H.run_case(make_case(), crasher)
    assert v["outcome"][0] == "ERROR", f"a crashed arm scored {v['outcome']}"
    assert "cannot PASS" in v["outcome"][1]

    def nonzero(arm):
        return {"artifacts": {"out.md": GOOD_BYTES},
                "load_trace": ["task-pipeline"], "exit": 3}
    v2 = H.run_case(make_case(), nonzero)
    assert v2["outcome"][0] == "ERROR", \
        f"a nonzero exit scored {v2['outcome']} despite correct artifacts"


def t_wrong_artifact_fails_despite_correct_name():
    def right_name_wrong_product(arm):
        return {"artifacts": {"out.md": b"something else entirely"},
                "load_trace": ["task-pipeline"], "exit": 0}
    v = H.run_case(make_case(), right_name_wrong_product)
    assert v["load"][0] == "PASS", f"the load trace was judged wrong: {v['load']}"
    assert v["outcome"][0] == "FAIL", \
        f"a wrong artifact scored {v['outcome']} because the skill name was right"

    def missing_artifact(arm):
        return {"artifacts": {}, "load_trace": ["task-pipeline"], "exit": 0}
    v2 = H.run_case(make_case(), missing_artifact)
    assert v2["outcome"][0] == "FAIL" and "never produced" in v2["outcome"][1]


def t_expectations_never_reach_the_arm():
    seen = {}

    def spy(arm):
        seen.update(arm)
        return executor_ok(arm)
    H.run_case(make_case(), spy)
    flat = json.dumps(seen)
    assert "checks" not in seen, "the checks block leaked into the arm"
    assert GOOD_DIGEST not in flat, "the expected digest leaked into the arm"
    assert "expect_loaded" not in flat, "the load expectations leaked into the arm"


def t_absent_tool_is_not_run():
    c = make_case()
    c["checks"]["tool"] = [{"name": "impossible", "command": "false"}]
    v = H.run_case(c, executor_ok)
    assert v["tool"][0] == "NOT_RUN" and v["outcome"][0] == "NOT_RUN", \
        f"a failing probe did not gate the case: {v}"


def t_manifest_keeps_axes_apart():
    results = [H.run_case(make_case(), executor_ok)]

    def wrong(arm):
        return {"artifacts": {"out.md": b"nope"}, "load_trace": ["task-pipeline"], "exit": 0}
    results.append(H.run_case(dict(make_case(), id="EV-CASE-002"), wrong))
    m = H.manifest(results)
    assert m["cases"][0]["outcome"] == "PASS" and m["cases"][1]["outcome"] == "FAIL"
    assert m["cases"][1]["load"] == "PASS", "the manifest blended load into outcome"
    assert not m["all_green"], "a manifest with a FAIL reported all green"


def main():
    case("the schema and the validator agree, and name-picking is refused",
         t_schema_and_validator_agree)
    case("a failed process cannot PASS", t_failed_process_cannot_pass)
    case("a wrong artifact remains FAIL despite the correct skill name",
         t_wrong_artifact_fails_despite_correct_name)
    case("expectations never reach the arm", t_expectations_never_reach_the_arm)
    case("an absent tool makes the case NOT_RUN", t_absent_tool_is_not_run)
    case("the manifest keeps the three axes apart", t_manifest_keeps_axes_apart)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print(f"OK ({checks} checks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
