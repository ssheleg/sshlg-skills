#!/usr/bin/env python3
"""FIX-UP-05.04 — recovery boundaries for the runtime transaction (sherlock
audit, UP-05 leaf 4, on FIX-UP-05.01).

The finding: the transaction writer had a journal and a previous-generation
snapshot but no RECOVERY — a SIGTERM mid-switch left a torn install (some files
new, some old), and nothing on restart reconciled it. Recovery must reach a
COHERENT active digest and preserve unknown extras.

The fix under test, against lib/runtime.js through node: recover() reads the
in-flight journal and rolls every managed file back to the previous generation
(a coherent old-generation digest), preserving unknown files. These fixtures supply
a validated v2 journal with no unresolved writer lock. sync() recovers that admitted
state first. A hard process crash retaining .sync.lock requires holder resolution;
it is explicitly refused, not claimed as automatic self-healing.

Standard library only.
"""
import hashlib
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


def node(body):
    r = subprocess.run(["node", "-e", "const rt=require(process.argv[1]);" + body, RT],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:400]
    return r.stdout.strip()


def crashed_runtime(switched):
    """Build a runtime dir mid-transaction: managed files hooks/h.js + lib/g.js,
    a journal in flight, a prev-generation holding the OLD bytes, and an unknown
    user file. `switched` is the subset already renamed to NEW."""
    rt = tempfile.mkdtemp()
    os.makedirs(os.path.join(rt, "lib"))
    os.makedirs(os.path.join(rt, "hooks"))
    os.makedirs(os.path.join(rt, ".prev-generation", "hooks"))
    os.makedirs(os.path.join(rt, ".prev-generation", "lib"))
    managed = {"hooks/h.js": ("# OLD skill\n", "# NEW skill\n"),
               "lib/g.js": ("// OLD g\n", "// NEW g\n")}
    for rel, (old, new) in managed.items():
        # prev-generation always holds the OLD bytes
        with open(os.path.join(rt, ".prev-generation", rel), "w") as fh:
            fh.write(old)
        # the live file is NEW if already switched, else OLD
        with open(os.path.join(rt, rel), "w") as fh:
            fh.write(new if rel in switched else old)
    with open(os.path.join(rt, "user-notes.txt"), "w") as fh:
        fh.write("mine\n")                                  # unknown extra
    with open(os.path.join(rt, ".switch-journal.json"), "w") as fh:
        files = [{"rel": rel,
                  "before": {"sha256": hashlib.sha256(old.encode()).hexdigest(), "mode": 0o644},
                  "after": {"sha256": hashlib.sha256(new.encode()).hexdigest(), "mode": 0o644}}
                 for rel, (old, new) in managed.items()]
        json.dump({"version": 2, "files": files, "staging": ".staging-fixture"}, fh)
    return rt


def old_digest(rt):
    h = hashlib.sha256()
    for rel in ("hooks/h.js", "lib/g.js"):
        h.update(open(os.path.join(rt, rel), "rb").read())
    return h.hexdigest()


COHERENT_OLD = hashlib.sha256(b"# OLD skill\n// OLD g\n").hexdigest()


def t_recover_rolls_back_a_mid_switch_crash():
    rt = crashed_runtime(switched={"hooks/h.js"})           # torn: one new, one old
    v = json.loads(node(f"console.log(JSON.stringify(rt.recover({json.dumps(rt)})));"))
    assert v["recovered"] is True and "hooks/h.js" in v["restored"]
    assert old_digest(rt) == COHERENT_OLD, \
        "recovery did not reach a coherent old-generation digest"
    assert open(os.path.join(rt, "user-notes.txt")).read() == "mine\n", \
        "an unknown user file was touched during recovery"
    assert not os.path.exists(os.path.join(rt, ".switch-journal.json")), "journal not cleared"
    assert not os.path.exists(os.path.join(rt, ".prev-generation")), "prev-generation not cleared"


def t_recover_before_switch_is_coherent():
    rt = crashed_runtime(switched=set())                   # no renames yet
    node(f"rt.recover({json.dumps(rt)});")
    assert old_digest(rt) == COHERENT_OLD


def t_recover_after_full_switch_rolls_back():
    rt = crashed_runtime(switched={"hooks/h.js", "lib/g.js"})  # all new, not committed
    node(f"rt.recover({json.dumps(rt)});")
    assert old_digest(rt) == COHERENT_OLD, \
        "a journal-present all-new state was not rolled back to coherent old"


def t_recover_is_noop_without_a_journal():
    rt = tempfile.mkdtemp()
    os.makedirs(os.path.join(rt, "hooks"))
    with open(os.path.join(rt, "hooks/h.js"), "w") as fh:
        fh.write("# committed\n")
    v = json.loads(node(f"console.log(JSON.stringify(rt.recover({json.dumps(rt)})));"))
    assert v["recovered"] is False and v["restored"] == []
    assert open(os.path.join(rt, "hooks/h.js")).read() == "# committed\n"


def t_sync_self_heals_before_installing():
    # a crashed runtime, then a sync from a package: recover first, then proceed
    pkg = tempfile.mkdtemp()
    os.makedirs(os.path.join(pkg, "hooks"))
    os.makedirs(os.path.join(pkg, "lib"))
    with open(os.path.join(pkg, "hooks", "h.js"), "w") as fh:
        fh.write("// pkg hook\n")
    with open(os.path.join(pkg, "lib", "g.js"), "w") as fh:
        fh.write("// NEW g\n")
    for name in ("skills.json", "package.json"):
        with open(os.path.join(pkg, name), "w") as fh:
            fh.write("{}\n")
    rt = crashed_runtime(switched={"hooks/h.js"})
    v = json.loads(node(
        f"console.log(JSON.stringify(rt.sync({json.dumps(pkg)}, {json.dumps(rt)}, {{create:false}})));"))
    assert v["ok"] is True, v
    # sync recovered the admitted state, then applied the package's managed set
    assert not os.path.exists(os.path.join(rt, ".switch-journal.json")), \
        "sync left a stale journal — it did not self-heal"
    assert open(os.path.join(rt, "user-notes.txt")).read() == "mine\n", \
        "self-heal touched an unknown file"


def main():
    case("recover rolls back a mid-switch crash to a coherent digest",
         t_recover_rolls_back_a_mid_switch_crash)
    case("recover before the switch is coherent", t_recover_before_switch_is_coherent)
    case("recover after a full switch (uncommitted) rolls back",
         t_recover_after_full_switch_rolls_back)
    case("recover is a no-op without a journal", t_recover_is_noop_without_a_journal)
    case("sync recovers an admitted journal before installing",
         t_sync_self_heals_before_installing)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
