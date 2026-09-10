#!/usr/bin/env python3
"""FIX-UP-01.01 — the immutable release-set lock (sherlock audit, UP-01).

The finding: the family's "released and pinned as a set" promise was
documented but not enforced by the install — pins materialized a git
checkout, npx resolved whatever CLI it found, and plugin updates carried no
immutable ref. The lock closes it, and its whole contract is: one lock, on
an upstream change, allows the SAME bytes or UNSUPPORTED_PIN — never a silent
new version — and the install pins to the recorded SHA or refuses.

Run as behaviour against lib/updatemodel.js and lib/plan.js through node.

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
        ["node", "-e",
         "const u=require(process.argv[1]);const p=require(process.argv[2]);"
         + body,
         os.path.join(ROOT, "lib", "updatemodel.js"),
         os.path.join(ROOT, "lib", "plan.js")],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:400]
    return json.loads(r.stdout)


MEMBERS = ("[{name:'super-ux',version:'0.55.1'},"
           "{name:'agent-stack',version:'0.17.0'}]")
# super-ux resolves to an immutable ref; agent-stack does not
RES_PIN = ("(m)=>m.name==='super-ux'?{sha:'abc123',digest:'d1',"
           "provider:'github',hostFloor:'claude-code>=1'}:{}")


def t_lock_pins_or_records_unsupported():
    v = node(f"const l=u.buildLock({MEMBERS},'cli@1.47.1',{RES_PIN});"
             "console.log(JSON.stringify(l.members));")
    by = {m["name"]: m for m in v}
    assert by["super-ux"]["status"] == "pinned"
    assert by["super-ux"]["ref"] == "abc123" and by["super-ux"]["digest"] == "d1"
    assert by["super-ux"]["hostFloor"] == "claude-code>=1"
    assert by["agent-stack"]["status"] == "UNSUPPORTED_PIN", \
        "a member with no immutable ref was pinned to a moving one — the finding itself"


def t_check_allows_same_bytes_or_unsupported_only():
    same = node(f"const l=u.buildLock({MEMBERS},'c',{RES_PIN});"
                "console.log(JSON.stringify(u.checkLock(l,"
                "(m)=>m.name==='super-ux'?{digest:'d1'}:{})));")
    verdicts = {v["name"]: v["verdict"] for v in same}
    assert verdicts == {"super-ux": "SAME_BYTES", "agent-stack": "UNSUPPORTED_PIN"}, \
        f"an unchanged upstream did not read as same bytes: {verdicts}"


def t_moved_ref_is_drift_not_upgrade():
    moved = node(f"const l=u.buildLock({MEMBERS},'c',{RES_PIN});"
                 "console.log(JSON.stringify(u.checkLock(l,"
                 "(m)=>m.name==='super-ux'?{digest:'d2'}:{})));")
    su = next(v for v in moved if v["name"] == "super-ux")
    assert su["verdict"] == "DRIFT", \
        "a moved pinned ref was accepted as an upgrade — a SHA must not move"


def t_four_states_are_separate():
    # A complete observation (FIX-UP-01.03) also carries enablement; the four
    # version fields agreeing plus enabled is what reads up to date.
    v = node("const e={name:'x',desired:'1.0'};"
             "console.log(JSON.stringify([\n"
             "  u.memberStatus(e,{latest:'1.0',installed:'1.0',active:'1.0',enabled:true}),\n"
             "  u.memberStatus(e,{latest:'1.0',installed:'1.0',active:'0.9',enabled:true})]));")
    assert v[0]["upToDate"] is True
    assert v[1]["upToDate"] is False, \
        "installed==desired was reported up-to-date while active lagged — the "\
        "four states were collapsed"
    assert v[1]["active"] == "0.9" and v[1]["installed"] == "1.0", \
        "the states were not kept separate"


def t_install_pins_the_sha_and_refuses_unpinnable():
    v = node(f"const l=u.buildLock({MEMBERS},'c',{RES_PIN});"
             "const r=p.installPlanLocked(l,"
             "{'super-ux':{repo:'ssheleg/super-ux'},"
             "'agent-stack':{repo:'ssheleg/agent-stack'}},['cursor']);"
             "console.log(JSON.stringify(r));")
    assert v["plan"], "no install argv was produced for a pinnable member"
    argv = v["plan"][0]
    assert "ssheleg/super-ux@abc123" in argv, \
        f"the install did not pin the SHA: {argv}"
    assert [s for s in v["skipped"] if s["name"] == "agent-stack"], \
        "an UNSUPPORTED_PIN member was installed at a moving ref instead of skipped"


def t_no_agents_no_install():
    v = node(f"const l=u.buildLock({MEMBERS},'c',{RES_PIN});"
             "console.log(JSON.stringify(p.installPlanLocked(l,{},[])));")
    assert v["plan"] == [], "a lock produced install argv with no agents resolved"


def main():
    case("the lock pins an immutable ref or records UNSUPPORTED_PIN",
         t_lock_pins_or_records_unsupported)
    case("check allows same bytes or UNSUPPORTED_PIN only",
         t_check_allows_same_bytes_or_unsupported_only)
    case("a moved pinned ref is DRIFT, not an upgrade",
         t_moved_ref_is_drift_not_upgrade)
    case("desired/latest/installed/active are separate fields",
         t_four_states_are_separate)
    case("install pins the SHA and refuses an unpinnable member",
         t_install_pins_the_sha_and_refuses_unpinnable)
    case("no agents resolved means no install", t_no_agents_no_install)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
