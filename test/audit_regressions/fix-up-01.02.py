#!/usr/bin/env python3
"""FIX-UP-01.02 — pinned payload resolution (sherlock audit, UP-01 leaf 2, on
FIX-UP-01.01's lock).

The finding: `npx skills …` floated to whatever CLI npx resolved, and the
install applied member by member with no read-only phase — so a corrupt or
missing payload was discovered mid-mutation, after earlier members landed.

The fix under test, against bin/sshlg-skills.js through node:

* the skills CLI is PINNED — pinnedArgv() rewrites the bare `skills` token to
  the package.json `skillsCli` spec, so npx resolves the pinned version;
* resolvePayloads() is a read-only phase that verifies every member's digest
  against the lock BEFORE any apply and blocks the whole run on a corrupt,
  missing or unpinnable payload — an unpinnable member is reported, never
  treated as pinned.

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
        ["node", "-e", "const b=require(process.argv[1]);" + body,
         os.path.join(ROOT, "bin", "sshlg-skills.js")],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:400]
    return json.loads(r.stdout)


def t_cli_is_pinned_in_package_json():
    pkg = json.load(open(os.path.join(ROOT, "package.json"), encoding="utf-8"))
    spec = pkg.get("skillsCli")
    assert spec and spec.startswith("skills@"), \
        f"package.json does not pin the skills CLI: {spec!r}"


def t_pinnedargv_rewrites_the_bare_token():
    v = node("console.log(JSON.stringify(b.pinnedArgv(['--yes','skills','add','ssheleg/super-ux'])));")
    spec = json.load(open(os.path.join(ROOT, "package.json"), encoding="utf-8"))["skillsCli"]
    assert spec in v, f"pinnedArgv did not inject the pinned spec {spec!r}: {v}"
    assert "skills" not in [x for x in v if x != spec], \
        "a bare `skills` token survived the pinning"


def t_ready_when_every_digest_matches():
    v = node("const lock={members:[{name:'a',status:'pinned',ref:'s1',digest:'d1'},"
             "{name:'b',status:'pinned',ref:'s2',digest:'d2'}]};"
             "console.log(JSON.stringify(b.resolvePayloads(lock,(m)=>({digest:m.digest}))));")
    assert v["ready"] is True and v["blocked"] == [], \
        f"a fully-matching resolve was not ready: {v}"


def t_corrupt_payload_blocks_before_apply():
    v = node("const lock={members:[{name:'a',status:'pinned',ref:'s1',digest:'d1'},"
             "{name:'b',status:'pinned',ref:'s2',digest:'d2'}]};"
             "console.log(JSON.stringify(b.resolvePayloads(lock,"
             "(m)=>m.name==='a'?{digest:'d1'}:{digest:'CORRUPT'})));")
    assert v["ready"] is False, "a corrupt payload did not block the apply"
    assert any(x["name"] == "b" and x["verdict"] == "DRIFT" for x in v["blocked"]), \
        f"the corrupt member was not named: {v['blocked']}"


def t_missing_payload_blocks():
    v = node("const lock={members:[{name:'a',status:'pinned',ref:'s1',digest:'d1'}]};"
             "console.log(JSON.stringify(b.resolvePayloads(lock,(m)=>({}))));")
    assert v["ready"] is False, "a missing payload did not block"


def t_unpinnable_member_is_reported_not_pinned():
    v = node("const lock={members:[{name:'a',status:'pinned',ref:'s1',digest:'d1'},"
             "{name:'c',status:'UNSUPPORTED_PIN'}]};"
             "console.log(JSON.stringify(b.resolvePayloads(lock,(m)=>({digest:m.digest}))));")
    assert v["ready"] is False, "an unpinnable member was treated as ready"
    assert any(x["name"] == "c" and x["verdict"] == "UNSUPPORTED_PIN"
               for x in v["blocked"]), "the unpinnable member was not reported"


def main():
    case("the skills CLI is pinned in package.json", t_cli_is_pinned_in_package_json)
    case("pinnedArgv rewrites the bare `skills` token", t_pinnedargv_rewrites_the_bare_token)
    case("ready when every digest matches", t_ready_when_every_digest_matches)
    case("a corrupt payload blocks before apply, named",
         t_corrupt_payload_blocks_before_apply)
    case("a missing payload blocks", t_missing_payload_blocks)
    case("an unpinnable member is reported, never pinned",
         t_unpinnable_member_is_reported_not_pinned)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
