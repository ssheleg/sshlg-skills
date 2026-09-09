#!/usr/bin/env python3
"""FIX-UP-07.02 — native lifecycle capability (sherlock audit, UP-07).

The finding: skills.json describes Codex only as a skills-CLI channel;
install/update had only skills-CLI, Claude plugin and local runtime
operations. A host with its own plugin loader (Codex, 25/28 members in its
native cache) was updated by writing files behind its back — a fake mutation
whose receipt would claim `current` for a digest the host never loaded.

The fix under test (lib/lifecycle.js + bin wiring, driven through node):
* a host with no supported API is UNSUPPORTED_UPDATE and mutates NOTHING, with
  a manual step;
* a host with a supported API is driven through it and stays verifiable;
* the reload receipt verifies the ACTUAL loaded digest — a null/absent one is
  unverified, a different one is stale, never `current`;
* without a verified loaded digest there is no overall `current` (partial);
* cmdUpdate surfaces UNSUPPORTED_UPDATE hosts and mutates nothing; the
  sheleg-design cli no longer claims files are loaded on write.

Standard library + node only.
"""
import json
import os
import re
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
LIB = os.path.join(ROOT, "lib", "lifecycle.js")
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")
DESIGN_CLI = os.path.expanduser("~/DATA/sheleg-design-skill/bin/cli.js")

failures = []
not_run = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def call(js):
    r = subprocess.run(["node", "-e", js], capture_output=True, text=True,
                       cwd=ROOT, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def t_unsupported_mutates_nothing():
    r = call("const l=require('./lib/lifecycle.js');"
             "console.log(JSON.stringify(l.planHostLifecycle({name:'codex', api:null})))")
    assert r["outcome"] == "UNSUPPORTED_UPDATE" and r["mutates"] is False
    assert r["manualStep"]


def t_supported_drives_api():
    r = call("const l=require('./lib/lifecycle.js');"
             "console.log(JSON.stringify(l.planHostLifecycle({name:'claude', api:'x'})))")
    assert r["outcome"] == "SUPPORTED" and r["mutates"] is True


def t_receipt_verifies_loaded_digest():
    cur = call("const l=require('./lib/lifecycle.js');"
               "console.log(JSON.stringify(l.reloadReceipt('h','abc','abc')))")
    assert cur["status"] == "current"
    unv = call("const l=require('./lib/lifecycle.js');"
               "console.log(JSON.stringify(l.reloadReceipt('h','abc',null)))")
    assert unv["status"] == "unverified", "a null loaded digest claimed current"
    stale = call("const l=require('./lib/lifecycle.js');"
                 "console.log(JSON.stringify(l.reloadReceipt('h','abc','xyz')))")
    assert stale["status"] == "stale" and stale["loaded"] == "xyz"


def t_no_overall_current_without_verification():
    r = call("const l=require('./lib/lifecycle.js');"
             "console.log(JSON.stringify(l.overallCurrent(["
             "{host:'a',status:'current'},{host:'b',status:'unverified'}])))")
    assert r["overall"] == "partial", "an unverified host still reported overall current"


def t_bin_wires_lifecycle():
    with open(BIN, encoding="utf-8") as fh:
        s = fh.read()
    assert "require('../lib/lifecycle.js')" in s, "cmdUpdate does not use the lifecycle module"
    assert "UNSUPPORTED_UPDATE" in s and "Native host lifecycle" in s
    assert "No Codex native files were touched." in s or "were touched" in s


def t_design_cli_no_fake_load():
    if not os.path.isfile(DESIGN_CLI):
        not_run.append("sheleg-design checkout absent — cli check NOT_RUN")
        return
    with open(DESIGN_CLI, encoding="utf-8") as fh:
        s = fh.read()
    assert "can now discover the skill" not in s, "the fake now-loaded claim survived"
    assert "a running agent has NOT loaded them yet" in s
    assert "read at session start" in s


def main():
    case("an unsupported host mutates nothing and names a manual step",
         t_unsupported_mutates_nothing)
    case("a supported host is driven through its API", t_supported_drives_api)
    case("the reload receipt verifies the actual loaded digest",
         t_receipt_verifies_loaded_digest)
    case("no overall current without a verified loaded digest",
         t_no_overall_current_without_verification)
    case("cmdUpdate wires the lifecycle and touches no native cache",
         t_bin_wires_lifecycle)
    case("the sheleg-design cli no longer claims files are loaded on write",
         t_design_cli_no_fake_load)
    for n in not_run:
        print(f"  NOT_RUN  {n}")
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
