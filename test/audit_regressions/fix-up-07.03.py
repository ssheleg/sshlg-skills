#!/usr/bin/env python3
"""FIX-UP-07.03 — the shared resolver consumer contract (sherlock audit,
UP-07, third leaf).

The fix under test (skills.json + resolveProviders):
* skills.json declares ONE versioned providerContract — key fields, states,
  precedence, the active shape, and the mismatch signal — that every consumer
  (toolkit, make-skill, runtime, update) reads;
* resolveProviders() output conforms to that contract;
* a stale-plugin/fresh-hub digest mismatch is the same 'active' +
  precedence:'UNKNOWN' signal, so every consumer sees it identically;
* no consumer depends on a sibling's runtime — the contract lives in the
  manifest, not in one consumer's code.

Standard library + node only.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
MANIFEST = os.path.join(ROOT, "skills.json")
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def manifest():
    with open(MANIFEST, encoding="utf-8") as fh:
        return json.load(fh)


def resolve(candidates):
    js = ("const {resolveProviders}=require(process.argv[1]);"
          "console.log(JSON.stringify(resolveProviders(JSON.parse(process.argv[2]))))")
    r = subprocess.run(["node", "-e", js, BIN, json.dumps(candidates)],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def t_contract_is_versioned():
    pc = manifest().get("providerContract")
    assert pc is not None, "skills.json has no providerContract"
    assert isinstance(pc["version"], int), "the contract is not versioned"
    for field in ("keyFields", "states", "precedence", "activeShape", "mismatchSignal"):
        assert field in pc, f"the contract omits {field}"
    assert pc["keyFields"] == ["host", "scope", "skillId"]


def t_no_sibling_runtime_dependency():
    pc = manifest()["providerContract"]
    assert "not by\n importing a sibling consumer's runtime".replace("\n ", " ") in \
        " ".join(pc["note"].split()) or "not by importing a sibling consumer's runtime" in pc["note"]
    assert "reference\n implementation".replace("\n ", " ") in " ".join(pc["note"].split()) \
        or "reference implementation" in pc["note"]


def t_output_conforms_to_contract():
    pc = manifest()["providerContract"]
    out = resolve([{"host": "claude", "scope": "user", "skillId": "super-ux",
                    "installed": True, "enabled": True, "applicable": True,
                    "digest": "aaa", "version": "1.0", "realpath": "/x",
                    "namespace": "n", "loaded": True}])
    row = out[0]
    assert set(pc["keyFields"]) <= set(row.keys()), "output missing key fields"
    assert row["state"] in pc["states"], f"state {row['state']} not in contract"
    assert set(pc["activeShape"]) <= set(row["active"].keys()), \
        "active shape diverges from the contract"


def t_stale_fresh_mismatch_is_one_signal():
    # two installed+enabled candidates for one (host,scope,skill) with different
    # digests — a stale plugin beside a fresh hub copy
    out = resolve([
        {"host": "claude", "scope": "user", "skillId": "super-ux",
         "installed": True, "enabled": True, "applicable": True, "digest": "stale"},
        {"host": "claude", "scope": "user", "skillId": "super-ux",
         "installed": True, "enabled": True, "applicable": True, "digest": "fresh"},
    ])
    row = out[0]
    assert row["state"] == "active" and row["precedence"] == "UNKNOWN", \
        f"the mismatch did not surface as the contract's signal: {row}"
    assert row["candidateCount"] == 2


def t_same_input_same_signal_across_consumers():
    # the contract makes the signal a pure function of the candidate set, so any
    # consumer feeding the same candidates gets the same row — determinism check
    cands = [{"host": "codex", "scope": "user", "skillId": "make-skill",
              "installed": True, "enabled": True, "applicable": True, "digest": "d1"},
             {"host": "codex", "scope": "user", "skillId": "make-skill",
              "installed": True, "enabled": True, "applicable": True, "digest": "d2"}]
    a = resolve(cands)
    b = resolve(cands)
    assert a == b, "the same candidates produced different resolutions"


def main():
    case("skills.json declares a versioned provider contract", t_contract_is_versioned)
    case("the contract forbids a sibling-runtime dependency", t_no_sibling_runtime_dependency)
    case("resolveProviders output conforms to the contract", t_output_conforms_to_contract)
    case("a stale/fresh digest mismatch is the contract's one signal",
         t_stale_fresh_mismatch_is_one_signal)
    case("the same candidates resolve identically for any consumer",
         t_same_input_same_signal_across_consumers)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
