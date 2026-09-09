#!/usr/bin/env python3
"""FIX-UP-04.01 — the verified-replacement gate (sherlock audit, UP-04).

The finding: `plugins={"super-ux@super-ux":[]}` — a registry spec with an
empty installPath array and no cache payload — authorised deleting the sole
plain copy of every member skill. Registry alone was treated as proof of a
replacement.

The fix under test (lib/plan.js providerVerified + shadowsToPrune, and the bin
wiring):
* a copy is pruned only behind an applicable/enabled EXACT provider spec whose
  payload exists (probed);
* absent / corrupt / stale (empty array) / disabled / wrong-record registries
  prune NOTHING — the sole plain copy survives;
* a genuinely verified provider still prunes its shadow.

Standard library + node only.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PLAN = os.path.join(ROOT, "lib", "plan.js")
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


MEMBERS = [{"name": "super-ux", "marketplace": "super-ux", "skillNames": ["vision"]}]


def prune(installed, copies, real_paths):
    """Run shadowsToPrune with a payload probe that accepts only real_paths."""
    js = (
        "const p=require(process.argv[1]);"
        "const real=new Set(JSON.parse(process.argv[5]));"
        "const probe=(x)=>real.has(x);"
        "console.log(JSON.stringify(p.shadowsToPrune("
        "JSON.parse(process.argv[2]), JSON.parse(process.argv[3]),"
        "JSON.parse(process.argv[4]), probe)));"
    )
    r = subprocess.run(["node", "-e", js, PLAN, json.dumps(MEMBERS),
                        json.dumps(installed), json.dumps(copies),
                        json.dumps(real_paths)],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def t_stale_empty_array_prunes_nothing():
    # the exact finding: empty installPath array
    assert prune({"super-ux": []}, ["vision"], []) == [], \
        "a stale registry (empty array) deleted the sole copy — the finding"


def t_absent_registry_prunes_nothing():
    assert prune({}, ["vision"], []) == []


def t_missing_payload_prunes_nothing():
    assert prune({"super-ux": [{"installPath": "/gone", "scope": "user"}]},
                 ["vision"], []) == [], "a registry pointing at an absent payload pruned"


def t_disabled_prunes_nothing():
    assert prune({"super-ux": [{"installPath": "/real", "enabled": False}]},
                 ["vision"], ["/real"]) == [], "a disabled plugin pruned the copy"


def t_verified_provider_prunes_shadow():
    assert prune({"super-ux": [{"installPath": "/real", "scope": "user"}]},
                 ["vision"], ["/real"]) == ["vision"], \
        "a genuinely verified provider failed to prune its shadow"


def t_provider_verified_unit():
    js = ("const p=require(process.argv[1]);"
          "const probe=(x)=>x==='/real';"
          "console.log(JSON.stringify({"
          "empty: p.providerVerified([], probe),"
          "stale: p.providerVerified([{installPath:'/gone'}], probe),"
          "disabled: p.providerVerified([{installPath:'/real', enabled:false}], probe),"
          "good: p.providerVerified([{installPath:'/real'}], probe)}))")
    r = subprocess.run(["node", "-e", js, PLAN],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    v = json.loads(r.stdout.strip().splitlines()[-1])
    assert v == {"empty": False, "stale": False, "disabled": False, "good": True}, v


def t_bin_wires_probe():
    with open(BIN, encoding="utf-8") as fh:
        s = fh.read()
    assert "payloadExists" in s and "installedRecords" in s
    assert "plan.shadowsToPrune(members, installedRecords(), ls(base), payloadExists)" in s
    assert "SKILL.md" in s, "the payload probe does not check for a SKILL.md payload"


def main():
    case("a stale registry (empty installPath array) prunes nothing",
         t_stale_empty_array_prunes_nothing)
    case("an absent/corrupt registry prunes nothing", t_absent_registry_prunes_nothing)
    case("a registry pointing at a missing payload prunes nothing",
         t_missing_payload_prunes_nothing)
    case("a disabled plugin prunes nothing", t_disabled_prunes_nothing)
    case("a genuinely verified provider still prunes its shadow",
         t_verified_provider_prunes_shadow)
    case("providerVerified gates empty/stale/disabled, accepts a real payload",
         t_provider_verified_unit)
    case("the bin wires the records + payload probe", t_bin_wires_probe)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
