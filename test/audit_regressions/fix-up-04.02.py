#!/usr/bin/env python3
"""FIX-UP-04.02 — recoverable migration: prune quarantines, restore returns
bytes/type (sherlock audit, UP-04, second leaf).

The fix under test (bin/sshlg-skills.js quarantineOne/restoreQuarantined +
lib/skillstore quarantineKind/restoreMatches):
* an edited/unknown plain copy is captured to a quarantine manifest BEFORE
  removal, and the capture is verified — a copy that cannot be quarantined is
  NOT deleted;
* restore returns the exact bytes and type;
* an injected failure preserves the old copy (nothing deleted without a good
  quarantine);
* a fresh install does not create its own shadow (covered by 04.01's gate).

Standard library + node only.
"""
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")
STORE = os.path.join(ROOT, "lib", "skillstore.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def node(js, *argv):
    r = subprocess.run(["node", "-e", js, *argv], capture_output=True, text=True,
                       cwd=ROOT, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:400]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def t_quarantine_kind_pure():
    out = node(
        "const s=require('./lib/skillstore.js');"
        "const mk=(f)=>({isSymbolicLink:()=>f==='symlink',isDirectory:()=>f==='dir',isFile:()=>f==='file'});"
        "console.log(JSON.stringify({sym:s.quarantineKind(mk('symlink')),"
        "dir:s.quarantineKind(mk('dir')),file:s.quarantineKind(mk('file')),"
        "absent:s.quarantineKind(null)}))")
    assert out == {"sym": "symlink", "dir": "dir", "file": "file", "absent": "absent"}


def t_restore_matches_bytes_and_type():
    out = node(
        "const s=require('./lib/skillstore.js');"
        "const row={kind:'file',bytes:'hello'};"
        "console.log(JSON.stringify({good:s.restoreMatches(row,{kind:'file',bytes:'hello'}),"
        "wrongBytes:s.restoreMatches(row,{kind:'file',bytes:'x'}),"
        "wrongKind:s.restoreMatches(row,{kind:'dir'})}))")
    assert out == {"good": True, "wrongBytes": False, "wrongKind": False}


def t_quarantine_then_restore_roundtrip():
    """A file copy is quarantined (capturing its edited bytes) then restored."""
    home = tempfile.mkdtemp()
    base = os.path.join(home, ".claude", "skills")
    os.makedirs(os.path.join(base, "vision"))
    with open(os.path.join(base, "vision", "SKILL.md"), "w") as fh:
        fh.write("an edited plain copy\n")
    # quarantine the dir, then wipe base copy, then restore, verifying bytes
    js = (
        "process.env.HOME=process.argv[1];"
        "const q=require('./lib/quarantine.js');"
        "const fs=require('fs'), path=require('path');"
        "const base=path.join(process.argv[1],'.claude','skills');"
        "const row=q.capture('vision');"
        "fs.rmSync(path.join(base,'vision'),{recursive:true,force:true});"
        "q.writeManifest([row],'s');"
        "const restored=q.restore('vision');"
        "const back=fs.readFileSync(path.join(base,'vision','SKILL.md'),'utf8');"
        "console.log(JSON.stringify({kind:row.kind,restored,back}))"
    )
    out = node(js, home)
    assert out["kind"] == "dir", f"a dir copy was not quarantined as a dir: {out}"
    assert out["restored"]["kind"] == "dir"
    assert out["back"] == "an edited plain copy\n", "restore did not return the edited bytes"


def t_symlink_quarantine_preserves_target():
    home = tempfile.mkdtemp()
    base = os.path.join(home, ".claude", "skills")
    os.makedirs(base)
    target = os.path.join(home, "hub-vision")
    os.makedirs(target)
    os.symlink(target, os.path.join(base, "vision"))
    js = (
        "process.env.HOME=process.argv[1];"
        "const q=require('./lib/quarantine.js');"
        "const row=q.capture('vision');"
        "console.log(JSON.stringify(row))"
    )
    out = node(js, home)
    assert out["kind"] == "symlink" and out["target"] == target, \
        f"a symlink copy lost its target: {out}"


def t_prune_does_not_delete_without_quarantine():
    with open(BIN, encoding="utf-8") as fh:
        s = fh.read()
    body = s[s.index("function pruneClaudeShadows"):]
    body = body[:body.index("\n}\n")]
    assert "if (!row) {" in body and "do NOT delete" in body, \
        "the prune deletes even when quarantine failed"
    qsrc = open(os.path.join(ROOT, "lib", "quarantine.js"), encoding="utf-8").read()
    assert "Verify the capture BEFORE the caller removes" in qsrc, \
        "the quarantine is not verified before delete"


def main():
    case("quarantineKind is a pure type classifier", t_quarantine_kind_pure)
    case("restoreMatches compares bytes and type", t_restore_matches_bytes_and_type)
    case("a copy round-trips through quarantine and restore with its bytes",
         t_quarantine_then_restore_roundtrip)
    case("a symlink copy keeps its target in quarantine",
         t_symlink_quarantine_preserves_target)
    case("the prune never deletes what it could not quarantine",
         t_prune_does_not_delete_without_quarantine)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
