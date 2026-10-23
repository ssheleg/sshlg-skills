#!/usr/bin/env python3
"""Every member that carries `test/family_gate.py` carries the hub's canonical bytes (B-108, B-109).

The canonical file is `member-gate/family_gate.py`. A member edits its copy only by taking a
new canonical copy; eleven near-identical checks written one by one are how a family ends up
with eleven slightly different ones. A pinned member without the file yet is listed as not
looked at, never as passing; its next release brings the copy. Standard library only.
"""
import hashlib
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANON = os.path.join(ROOT, "member-gate", "family_gate.py")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main():
    failures, unlooked, same = [], [], []
    canon = open(CANON, "rb").read()
    for m in json.load(open(os.path.join(ROOT, "skills.json"), encoding="utf-8"))["skills"]:
        copy = os.path.join(ROOT, m["dir"], "test", "family_gate.py")
        if not os.path.isdir(os.path.join(ROOT, m["dir"])) or not os.listdir(os.path.join(ROOT, m["dir"])):
            unlooked.append("%s (submodule not checked out)" % m["name"])
        elif not os.path.exists(copy):
            unlooked.append("%s (pinned %s carries no copy yet)" % (m["name"], m["version"]))
        elif sha(open(copy, "rb").read()) != sha(canon):
            failures.append("%s: test/family_gate.py differs from member-gate/family_gate.py" % m["name"])
        else:
            same.append(m["name"])
    # The canonical file runs and its own plants fail, here as in every member.
    r = subprocess.run([sys.executable, CANON, "--self-test"], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        failures.append("member-gate/family_gate.py --self-test exit %d: %s" % (r.returncode, r.stdout[-300:]))
    # A copy that drifted by one line is caught (planted in memory, no file written).
    if sha(canon + b"\n# drift\n") == sha(canon):
        failures.append("a drifted copy hashes like the canonical file")
    for f in failures:
        print("FAIL  " + f)
    print("member gate copies: %d identical (%s); not looked at: %s" % (
        len(same), ", ".join(same) or "none", "; ".join(unlooked) or "none"))
    if failures:
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
