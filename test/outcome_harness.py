#!/usr/bin/env python3
"""The outcome harness — the contract every member's outcome corpus consumes.

Finding EV-01 (sherlock audit): checking that the router picked the right
skill NAME proves nothing about whether the skill's EXECUTION helped. This
runner therefore reports THREE verdicts and never blends them:

  * tool      — can this host run the case at all (probes); a failing probe is
                NOT_RUN for the whole case, never PASS, never a silent skip;
  * load      — what the ACTUAL load trace shows against the case's
                expectations: the routing judgment, and only that;
  * outcome   — the product: an artifact's existence, digest or content, or a
                command's exit code. Never the transcript's claim about them.

Two rules carry the acceptance, both watched failing in
test/audit_regressions/fix-ev-01.01.py:

  * a FAILED PROCESS cannot PASS — a crashed arm is ERROR on the outcome axis,
    whatever the artifacts happen to hold;
  * a WRONG ARTIFACT is FAIL even when the load trace is perfect — the right
    skill name is not the product.

The case is frozen (schemas/outcome-case.schema.json): prompt, files, model,
host and a case digest. The runner hands the ARM only the frozen input —
`arm_input(case)` strips every expectation, because an expectation that
reaches the prompt is an answer key taped to the exam.

The actor is injected: `run_case(case, executor, probe=...)` takes whatever
callable the host supplies (a CLI wrapper, a subagent driver, a fake in a
test). No specific runner tool is mandatory — the same no-hostlock rule the
family's outcome-evaluation doctrine states.

Stdlib only. Library first; `python3 test/outcome_harness.py <case.json>`
validates a case file against the contract without running anything.
"""
import hashlib
import json
import re
import subprocess
import sys

SHA_RE = re.compile(r"^[0-9a-f]{64}$")
OUTCOME_KINDS = {"artifact-exists", "artifact-digest", "artifact-contains", "command-exit-0"}
VERDICTS = ("PASS", "FAIL", "ERROR", "NOT_RUN")


def case_problems(case):
    """Every reason this case is not a case. Empty list = valid."""
    out = []
    if not isinstance(case, dict):
        return ["the case is not a JSON object"]
    version = str(case.get("schema_version", ""))
    m = re.match(r"^outcome-case/(\d+)$", version)
    if not m or int(m.group(1)) != 1:
        out.append(f"schema_version {version!r} is not a known outcome-case major")
    for field in ("id", "skill"):
        if not case.get(field):
            out.append(f"missing {field}")
    prompt = case.get("prompt")
    if not isinstance(prompt, dict) or not prompt.get("text"):
        out.append("prompt.text is required — a case with no frozen input measures nothing")
    else:
        for i, f in enumerate(prompt.get("files") or []):
            if not isinstance(f, dict) or not f.get("path") \
                    or not SHA_RE.match(str(f.get("sha256", ""))):
                out.append(f"prompt.files[{i}]: needs path and sha256 — frozen means content-addressed")
    env = case.get("environment")
    if not isinstance(env, dict) or not SHA_RE.match(str(env.get("case_digest", ""))):
        out.append("environment.case_digest is required — reruns against different bytes "
                   "are different cases")
    checks = case.get("checks")
    if not isinstance(checks, dict) or not isinstance(checks.get("outcome"), list) \
            or not checks.get("outcome"):
        out.append("checks.outcome must be a non-empty list — a case that checks no "
                   "artifact is the name-picking eval this contract exists to replace")
    else:
        for i, c in enumerate(checks["outcome"]):
            if not isinstance(c, dict) or c.get("kind") not in OUTCOME_KINDS \
                    or not c.get("name") or not c.get("target"):
                out.append(f"checks.outcome[{i}]: needs name, a known kind and a target")
    return out


def arm_input(case):
    """What the ARM is allowed to see: the frozen input, nothing else.

    No expectations, no load-trace hopes, no outcome targets. Leakage here is
    the quiet way an eval starts grading its own answer key.
    """
    return {
        "id": case["id"],
        "skill": case["skill"],
        "prompt": dict(case["prompt"]),
        "environment": dict(case.get("environment") or {}),
    }


def _probe_tools(case, probe):
    for t in case.get("checks", {}).get("tool") or []:
        r = probe(t["command"])
        if r != 0:
            return "NOT_RUN", f"{t['name']}: probe exited {r} — this host cannot run the case"
    return "PASS", ""


def _judge_load(case, trace):
    lt = case.get("checks", {}).get("load_trace") or {}
    loaded = set(trace or [])
    for want in lt.get("expect_loaded") or []:
        if want not in loaded:
            return "FAIL", f"{want} never loaded"
    for ban in lt.get("expect_not_loaded") or []:
        if ban in loaded:
            return "FAIL", f"{ban} loaded where it must not"
    return "PASS", ""


def _judge_outcome(case, artifacts):
    for c in case["checks"]["outcome"]:
        kind, target, expect = c["kind"], c["target"], c.get("expect", "")
        if kind == "command-exit-0":
            r = subprocess.run(target, shell=True, capture_output=True)
            if r.returncode != 0:
                return "FAIL", f"{c['name']}: {target!r} exited {r.returncode}"
            continue
        body = (artifacts or {}).get(target)
        if body is None:
            return "FAIL", f"{c['name']}: artifact {target!r} was never produced"
        data = body if isinstance(body, bytes) else str(body).encode("utf-8")
        if kind == "artifact-digest" and hashlib.sha256(data).hexdigest() != expect:
            return "FAIL", f"{c['name']}: {target!r} has the wrong bytes"
        if kind == "artifact-contains" and expect not in data.decode("utf-8", "replace"):
            return "FAIL", f"{c['name']}: {target!r} does not contain the expected marker"
    return "PASS", ""


def run_case(case, executor, probe=None):
    """One case, three verdicts. `executor(arm)` returns
    {"artifacts": {name: bytes|str}, "load_trace": [...], "exit": int} — or raises.
    """
    problems = case_problems(case)
    if problems:
        return {"case": case.get("id"), "tool": ("ERROR", problems[0]),
                "load": ("ERROR", "invalid case"), "outcome": ("ERROR", "invalid case")}
    verdicts = {"case": case["id"],
                "model": (case.get("environment") or {}).get("model", "inherit"),
                "host": (case.get("environment") or {}).get("host", ""),
                "digest": case["environment"]["case_digest"]}
    tool_v = _probe_tools(case, probe or (lambda cmd: subprocess.run(
        cmd, shell=True, capture_output=True).returncode))
    verdicts["tool"] = tool_v
    if tool_v[0] == "NOT_RUN":
        verdicts["load"] = ("NOT_RUN", "tools absent")
        verdicts["outcome"] = ("NOT_RUN", "tools absent")
        return verdicts

    arm = arm_input(case)
    assert "checks" not in arm, "expectations leaked into the arm"
    try:
        result = executor(arm)
        crashed = bool(result.get("exit"))
    except Exception as exc:  # the arm died — that is ERROR, never PASS
        verdicts["load"] = ("ERROR", f"the arm raised: {exc}")
        verdicts["outcome"] = ("ERROR", "a failed process cannot PASS")
        return verdicts
    if crashed:
        verdicts["load"] = _judge_load(case, result.get("load_trace"))
        verdicts["outcome"] = ("ERROR", f"the arm exited {result['exit']} — "
                                        "a failed process cannot PASS")
        return verdicts
    verdicts["load"] = _judge_load(case, result.get("load_trace"))
    verdicts["outcome"] = _judge_outcome(case, result.get("artifacts"))
    return verdicts


def manifest(results):
    """The run manifest: per-case verdicts on all three axes, separately —
    an aggregate that blended them would let a routing win hide a product loss."""
    rows = []
    for r in results:
        rows.append({"case": r["case"], "digest": r.get("digest", ""),
                     "tool": r["tool"][0], "load": r["load"][0],
                     "outcome": r["outcome"][0]})
    green = all(row["tool"] == row["load"] == row["outcome"] == "PASS" for row in rows)
    return {"cases": rows, "all_green": green}


def main(argv):
    if len(argv) != 2:
        print("usage: outcome_harness.py <case.json>  — validate a case against the contract")
        return 2
    try:
        with open(argv[1], encoding="utf-8") as fh:
            case = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"REJECTED: cannot read the case — {exc}")
        return 1
    found = case_problems(case)
    if found:
        for p in found:
            print(f"REJECTED: {p}")
        return 1
    print(f"ok: {case['id']} ({case['skill']}) — "
          f"{len(case['checks']['outcome'])} outcome check(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
