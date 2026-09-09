#!/usr/bin/env python3
"""FIX-UP-01.03 — update observation states (sherlock audit, UP-01 leaf 3, on
FIX-UP-01.01).

The finding: a read=false auto-update observation rendered as "Auto-update is
OFF" — conflating "we could not check" with "checked, and it is off". And the
member status had no enabled/disabled/unknown axis or checked_at/source.

The fix under test, against lib/updatemodel.js through node: a read/parse
failure is UNKNOWN / CHECK_ERROR, never off; an observed member carries
enablement (enabled/disabled/unknown) with checked_at and source, and an
unknown enablement can never read as up to date.

Standard library only.
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


def node(body):
    r = subprocess.run(
        ["node", "-e", "const u=require(process.argv[1]);" + body,
         os.path.join(ROOT, "lib", "updatemodel.js")],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:400]
    return json.loads(r.stdout)


def t_read_failure_is_unknown_not_off():
    v = node("console.log(JSON.stringify(u.observeAutoUpdate("
             "{read:false, source:'/x/known_marketplaces.json', error:'ENOENT'})));")
    assert v["status"] == "UNKNOWN" and v["reason"] == "CHECK_ERROR", \
        f"a read failure did not become UNKNOWN/CHECK_ERROR: {v}"
    assert "off" not in v["detail"].lower(), \
        "a failed check still rendered as off — the finding itself"
    assert v["source"].endswith("known_marketplaces.json")


def t_off_and_drift_are_distinct_from_unknown():
    off = node("console.log(JSON.stringify(u.observeAutoUpdate({read:true, on:[], source:'/x'})));")
    assert off["status"] == "off" and "as designed" in off["detail"]
    drift = node("console.log(JSON.stringify(u.observeAutoUpdate({read:true, on:['a','b'], source:'/x'})));")
    assert drift["status"] == "drift" and "enabled on 2" in drift["detail"]


def t_autoupdatestate_carries_source():
    # a nonexistent HOME → read:false with a source and an error, never a bare {on:[],read:false}
    v = node("console.log(JSON.stringify(u.autoUpdateState('/no/such/home', ['a'])));")
    assert v["read"] is False and v["source"] and v.get("error"), \
        f"autoUpdateState lost its source/error on failure: {v}"


def t_member_enablement_axis():
    unknown = node("console.log(JSON.stringify(u.memberStatus({desired:'1.0'},"
                   "{latest:'1.0',installed:'1.0',active:'1.0'})));")
    assert unknown["enablement"] == "unknown", "a missing enabled flag was not unknown"
    assert unknown["upToDate"] is False, \
        "an unknown enablement read as up to date — the finding itself"
    enabled = node("console.log(JSON.stringify(u.memberStatus({desired:'1.0'},"
                   "{latest:'1.0',installed:'1.0',active:'1.0',enabled:true,"
                   "checked_at:'2026-09-09',source:'settings.json'})));")
    assert enabled["enablement"] == "enabled" and enabled["upToDate"] is True
    assert enabled["checked_at"] == "2026-09-09" and enabled["source"] == "settings.json", \
        "checked_at/source did not travel with the observation"
    disabled = node("console.log(JSON.stringify(u.memberStatus({desired:'1.0'},"
                    "{latest:'1.0',installed:'1.0',active:'1.0',enabled:false})));")
    assert disabled["enablement"] == "disabled" and disabled["upToDate"] is False


def main():
    case("a read failure is UNKNOWN/CHECK_ERROR, never off",
         t_read_failure_is_unknown_not_off)
    case("off and drift are distinct from unknown", t_off_and_drift_are_distinct_from_unknown)
    case("autoUpdateState carries its source and error on failure",
         t_autoupdatestate_carries_source)
    case("the member status has an enabled/disabled/unknown axis with checked_at/source",
         t_member_enablement_axis)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
