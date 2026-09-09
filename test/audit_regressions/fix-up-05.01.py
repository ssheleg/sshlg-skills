#!/usr/bin/env python3
"""FIX-UP-05.01 — the transaction writer contract (sherlock audit, UP-05).

The finding: the runtime writer copied managed files straight into the target
one by one, so an ENOSPC on the third of ten left seven old + three new — a
half install — and with --force (which deleted the old install first) it left
nothing.

The fix under test, against lib/runtime.js through node: stage on the same
filesystem → verify each staged byte against its source → journal → snapshot
the previous generation → atomic per-file switch. A copy fault leaves the OLD
install complete; unknown user files are preserved; a clean run installs the
verified new set.

Standard library only.
"""
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
RT = os.path.join(ROOT, "lib", "runtime.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def node(body, cwd=None):
    r = subprocess.run(
        ["node", "-e", "const rt=require(process.argv[1]);" + body, RT],
        capture_output=True, text=True, timeout=60, cwd=cwd)
    assert r.returncode == 0, r.stderr[:400]
    return r.stdout.strip()


def make_pkg():
    """A fake package with hooks/ + lib/ .js files and a manifest."""
    pkg = tempfile.mkdtemp()
    os.makedirs(os.path.join(pkg, "hooks"))
    os.makedirs(os.path.join(pkg, "lib"))
    for d, n in (("hooks", "pre-tool-use.js"), ("hooks", "post-tool-use.js"),
                 ("lib", "guard.js")):
        with open(os.path.join(pkg, d, n), "w") as fh:
            fh.write(f"// new {n}\n")
    with open(os.path.join(pkg, "skills.json"), "w") as fh:
        fh.write('{"v": 2}\n')
    return pkg


def t_clean_run_installs_verified_new_set():
    pkg = make_pkg()
    rt = tempfile.mkdtemp()
    out = node(f"console.log(JSON.stringify(rt.sync({json.dumps(pkg)}, {json.dumps(rt)}, {{create:true}})));")
    res = json.loads(out)
    assert res["reason"] is None, f"a clean install failed: {res}"
    assert "skills.json" in res["copied"] and "lib/guard.js" in res["copied"]
    assert open(os.path.join(rt, "hooks", "pre-tool-use.js")).read() == "// new pre-tool-use.js\n"


def t_copy_fault_leaves_old_install_complete():
    pkg = make_pkg()
    rt = tempfile.mkdtemp()
    # seed an OLD complete install
    os.makedirs(os.path.join(rt, "hooks"))
    os.makedirs(os.path.join(rt, "lib"))
    for d, n in (("hooks", "pre-tool-use.js"), ("hooks", "post-tool-use.js"),
                 ("lib", "guard.js")):
        with open(os.path.join(rt, d, n), "w") as fh:
            fh.write(f"// OLD {n}\n")
    with open(os.path.join(rt, "skills.json"), "w") as fh:
        fh.write('{"v": 1}\n')
    # inject an ENOSPC on the 3rd staged copy, mid-transaction — exactly the
    # fixture the finding names. fs is patched BEFORE runtime.js reads it.
    script = (
        "const fs=require('fs');"
        "let n=0;const real=fs.copyFileSync;"
        "fs.copyFileSync=(a,b)=>{ if(++n===3){const e=new Error('ENOSPC');e.code='ENOSPC';throw e;} return real(a,b); };"
        "const rt=require(process.argv[1]);"
        f"console.log(JSON.stringify(rt.sync({json.dumps(pkg)}, {json.dumps(rt)}, {{create:false}})));")
    r = subprocess.run(["node", "-e", script, RT], capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:400]
    res = json.loads(r.stdout.strip())
    assert res["reason"] and "old runtime intact" in res["reason"], \
        f"a copy fault did not abort cleanly: {res}"
    # every OLD file is still exactly as it was — no half install
    for d, n in (("hooks", "pre-tool-use.js"), ("hooks", "post-tool-use.js"),
                 ("lib", "guard.js")):
        assert open(os.path.join(rt, d, n)).read() == f"// OLD {n}\n", \
            f"{d}/{n} was overwritten despite the abort — half install"
    assert open(os.path.join(rt, "skills.json")).read() == '{"v": 1}\n', \
        "the old manifest was replaced despite the abort"
    # no staging litter left behind
    assert not [x for x in os.listdir(rt) if x.startswith(".staging-")], \
        "staging directory leaked after an abort"


def t_unknown_user_files_are_preserved():
    pkg = make_pkg()
    rt = tempfile.mkdtemp()
    os.makedirs(os.path.join(rt, "hooks"))
    with open(os.path.join(rt, "hooks", "pre-tool-use.js"), "w") as fh:
        fh.write("// OLD\n")
    with open(os.path.join(rt, "user-notes.txt"), "w") as fh:
        fh.write("my notes\n")                          # unknown, unmanaged
    node(f"rt.sync({json.dumps(pkg)}, {json.dumps(rt)}, {{create:false}});")
    assert open(os.path.join(rt, "user-notes.txt")).read() == "my notes\n", \
        "an unknown user file was clobbered — the writer touched more than the managed set"


def t_previous_generation_is_kept_recoverable():
    pkg = make_pkg()
    rt = tempfile.mkdtemp()
    os.makedirs(os.path.join(rt, "hooks"))
    with open(os.path.join(rt, "hooks", "pre-tool-use.js"), "w") as fh:
        fh.write("// OLD pre-tool-use.js\n")
    node(f"rt.sync({json.dumps(pkg)}, {json.dumps(rt)}, {{create:false}});")
    prev = os.path.join(rt, ".prev-generation", "hooks", "pre-tool-use.js")
    assert os.path.isfile(prev) and open(prev).read() == "// OLD pre-tool-use.js\n", \
        "the previous generation was not snapshotted for recovery"


def main():
    case("a clean run installs the verified new set", t_clean_run_installs_verified_new_set)
    case("a copy fault leaves the old install complete", t_copy_fault_leaves_old_install_complete)
    case("unknown user files are preserved", t_unknown_user_files_are_preserved)
    case("the previous generation is kept recoverable", t_previous_generation_is_kept_recoverable)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
