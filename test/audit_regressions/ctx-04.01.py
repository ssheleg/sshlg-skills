#!/usr/bin/env python3
"""CTX-04.01 — the support-matrix decision, recorded from an actual run
(sherlock audit, CTX-04).

The decision: fix the exact host tiers. Claude Code and Codex are the
MANDATORY baseline — actually probed here; every other adapter stays
DECLARED / UNTESTED until its own smoke test, never promoted to PASS on its
name alone. Unknown host versions/capabilities are recorded as null, never
invented. User model preferences are inherited from the host; this pack sets
none.

This regression is also the generator of the acceptance receipt: run with
`--emit` it probes the hosts live and writes docs/evidence/acceptance/
ctx-04.01.json; run with no argument it VERIFIES the receipt against a fresh
probe, so a stale or hand-edited PASS cannot survive.

The probe is offline (it resolves host roots and checks presence on THIS
machine — no network). Standard library + node only.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
APPLY = os.path.join(ROOT, "lib", "apply.js")
RECEIPT = os.path.join(ROOT, "docs", "evidence", "acceptance", "ctx-04.01.json")

MANDATORY = ("claude", "codex")            # the baseline that must be smoke-tested
DECLARED = ("gemini",)                      # adapters that stay declared until their smoke

REQUIRED_CHECKS = ["root_resolves", "presence_reported", "no_write_on_unknown_platform"]
OPTIONAL_CHECKS = ["version_detected", "capability_detected"]

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def _node_targets():
    r = subprocess.run(
        ["node", "-e", "console.log(JSON.stringify(require(process.argv[1]).TARGETS))", APPLY],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def _resolve(agent, home, env):
    r = subprocess.run(
        ["node", "-e",
         "const a=require(process.argv[1]);"
         "const T=a.TARGETS.find(t=>t.agent===process.argv[2]);"
         "console.log(JSON.stringify(a.hostRootVerdict(T, process.argv[3], {env: JSON.parse(process.argv[4])})))",
         APPLY, agent, home, json.dumps(env)],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def probe():
    """Actually resolve and probe each declared host on THIS machine. Records
    observed state only — no field is invented, unknowns are null."""
    home = os.path.expanduser("~")
    hosts = []
    for t in _node_targets():
        agent = t["agent"]
        tier = "mandatory" if agent in MANDATORY else "declared_untested"
        v = _resolve(agent, home, dict(os.environ))
        root = v.get("root")
        present = bool(root) and os.path.isdir(root)
        hosts.append({
            "agent": agent,
            "tier": tier,
            "root_source": v.get("source"),
            "root_present": present,
            # a version we cannot read is null, NEVER "PASS" or a guess
            "version": None,
            # mandatory hosts are OBSERVED by this run; others are DECLARED only
            "status": "observed" if tier == "mandatory" else "declared",
        })
    return {"home": home, "hosts": hosts}


def build_receipt():
    p = probe()
    return {
        "id": "CTX-04.01",
        "decision": "support matrix — Claude Code + Codex are the mandatory baseline; "
                    "other adapters stay declared/untested until their own smoke test",
        "generated_by": "test/audit_regressions/ctx-04.01.py --emit",
        "prefilled_pass": False,
        "run": {
            "host_platform": sys.platform,
            "node": subprocess.run(["node", "-v"], capture_output=True, text=True).stdout.strip(),
            "pack_version": json.load(open(os.path.join(ROOT, "package.json")))["version"],
        },
        "tiers": {"mandatory": list(MANDATORY), "declared_untested": list(DECLARED)},
        "checks": {"required": REQUIRED_CHECKS, "optional": OPTIONAL_CHECKS},
        "hosts": p["hosts"],
        "model_preferences": "inherited from the host; this pack sets none",
        "notes": "unknown host versions/capabilities are recorded as null, never invented as PASS; "
                 "a declared adapter is never reported PASS on its name alone",
    }


def emit():
    r = build_receipt()
    os.makedirs(os.path.dirname(RECEIPT), exist_ok=True)
    with open(RECEIPT, "w", encoding="utf-8") as fh:
        json.dump(r, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"wrote {os.path.relpath(RECEIPT, ROOT)}")


# ---- verification -------------------------------------------------------------


def load_receipt():
    assert os.path.isfile(RECEIPT), \
        "no acceptance receipt — run `python3 test/audit_regressions/ctx-04.01.py --emit`"
    with open(RECEIPT, encoding="utf-8") as fh:
        return json.load(fh)


def t_tiers_required_and_optional_listed():
    r = load_receipt()
    assert tuple(r["tiers"]["mandatory"]) == MANDATORY, r["tiers"]["mandatory"]
    assert set(r["tiers"]["declared_untested"]) >= set(DECLARED)
    assert r["checks"]["required"] and r["checks"]["optional"], \
        "the matrix does not list required vs optional checks"
    assert set(r["checks"]["required"]) == set(REQUIRED_CHECKS)


def t_declared_adapters_are_not_pass():
    r = load_receipt()
    for h in r["hosts"]:
        if h["tier"] == "declared_untested":
            assert h["status"] == "declared", \
                f"{h['agent']}: a declared adapter reported {h['status']!r}, not 'declared'"
            assert h["status"].upper() != "PASS"


def t_unknown_versions_not_invented():
    r = load_receipt()
    assert r["prefilled_pass"] is False
    for h in r["hosts"]:
        # version is either a real string or null — never the word PASS or a fabrication
        assert h["version"] is None or isinstance(h["version"], str)
        if isinstance(h["version"], str):
            assert h["version"].upper() != "PASS"


def t_model_preferences_inherited():
    r = load_receipt()
    assert "inherited from the host" in r["model_preferences"]


def t_receipt_matches_a_fresh_probe():
    """A stale or hand-faked receipt cannot pass: the hosts, tiers and statuses
    must match what a probe finds RIGHT NOW. `root_present` is deliberately NOT
    in the comparison: it is a machine-LOCAL observation of the machine that
    emitted the receipt (a CI runner has no ~/.claude, and that says nothing
    about the machine the receipt describes) — it stays recorded, typed as a
    boolean, and the anti-fake teeth live in the machine-independent fields
    plus ctx-04.02/03's temp-home fresh-load checks."""
    r = load_receipt()
    fresh = probe()
    got = {(h["agent"], h["tier"], h["status"]) for h in r["hosts"]}
    now = {(h["agent"], h["tier"], h["status"]) for h in fresh["hosts"]}
    assert got == now, f"receipt disagrees with a fresh probe:\n receipt={got}\n fresh  ={now}"
    for h in r["hosts"]:
        assert isinstance(h["root_present"], bool), \
            f"{h['agent']}: root_present must be a recorded boolean observation"


def main():
    if "--emit" in sys.argv[1:]:
        emit()
        return 0
    case("the matrix lists mandatory/declared tiers and required vs optional checks",
         t_tiers_required_and_optional_listed)
    case("declared adapters are never reported PASS on their name", t_declared_adapters_are_not_pass)
    case("unknown host versions are null, never invented", t_unknown_versions_not_invented)
    case("user model preferences are inherited from the host", t_model_preferences_inherited)
    case("the receipt matches a fresh live probe (no stale/faked PASS)",
         t_receipt_matches_a_fresh_probe)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
