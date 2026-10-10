#!/usr/bin/env python3
"""Exercise the verifier with disposable, locally created Git repositories."""
import copy
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HELPER = Path(__file__).with_name("verify-equivalence.py")
CENSUS = "docs/evidence/host-compat/post-fix/census.json"
PREFIX = "plugins/demo/skills/demo"


def require(ok, message):
    if not ok:
        raise RuntimeError(message)


def git(repo, *args):
    return subprocess.check_output(["git", *args], cwd=repo, stderr=subprocess.PIPE).decode().strip()


def init(repo):
    repo.mkdir(parents=True)
    git(repo, "init", "-q")
    git(repo, "config", "user.name", "Disposable Fixture")
    git(repo, "config", "user.email", "fixture@example.invalid")
    git(repo, "config", "commit.gpgsign", "false")
    git(repo, "config", "core.hooksPath", "/dev/null")
    git(repo, "config", "core.fileMode", "true")


def commit(repo):
    git(repo, "commit", "-qm", "fixture")
    return git(repo, "rev-parse", "HEAD")


def fixture(root):
    hub, member = root / "hub", root / "hub/skills/demo"
    init(hub)
    init(member)
    skill = member / PREFIX
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text("---\nname: demo\ndescription: Fixture.\n---\nFixture\n")
    (skill / "reference.md").write_text("Baseline reference\n")
    git(member, "add", ".")
    member_sha = commit(member)
    manifest = {"skills": [{"name": "demo", "dir": "skills/demo", "skillNames": ["demo"]}]}
    (hub / "skills.json").write_text(json.dumps(manifest))
    git(hub, "add", "skills.json")
    git(hub, "update-index", "--add", "--cacheinfo", "160000," + member_sha + ",skills/demo")
    old_hub = commit(hub)
    files = [{"path": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "bytes": p.stat().st_size}
             for p in sorted(skill.iterdir())]
    census = {"hub_commit": old_hub, "members": 1, "skills": 1, "file_count": 2,
              "rows": [{"member": "demo", "commit": member_sha, "skill": "demo", "skill_path": PREFIX,
                        "audit_exit": 0, "escaping_symlinks": [], "files": files}]}
    return hub, member, skill, manifest, census


def run_case(label, mutation, expected):
    with tempfile.TemporaryDirectory(prefix="hc-equivalence-fixture-") as tmp:
        hub, member, skill, manifest, census = fixture(Path(tmp))
        if mutation:
            mutation(hub, member, skill, manifest, census)
        census_path = hub / CENSUS
        census_path.parent.mkdir(parents=True)
        census_path.write_text(json.dumps(census))
        (hub / "skills.json").write_text(json.dumps(manifest))
        git(hub, "add", CENSUS, "skills.json")
        baseline = commit(hub)
        # Updated member payload is pinned AFTER the old census artifact is saved.
        if git(member, "status", "--porcelain"):
            git(member, "add", "-A")
            current_member = commit(member)
            git(hub, "update-index", "--cacheinfo", "160000," + current_member + ",skills/demo")
            commit(hub)
        if label == "missing object":
            git(hub, "update-index", "--cacheinfo", "160000," + "f" * 40 + ",skills/demo")
            commit(hub)
        for optimized in (False, True):
            output = Path(tmp) / "receipt.json"
            output.write_text("existing receipt\n")
            argv = [sys.executable] + (["-O"] if optimized else []) + [str(HELPER), "--hub", str(hub),
                    "--repositories", str(hub), "--baseline", baseline, "--output", str(output)]
            result = subprocess.run(argv, capture_output=True, text=True)
            if expected:
                require(result.returncode == 1 and expected in result.stderr,
                        label + ": wrong failure under optimized=" + str(optimized) + ": " + result.stderr)
                require(output.read_text() == "existing receipt\n", label + ": failed verification changed receipt")
            else:
                require(result.returncode == 0, label + ": " + result.stderr)
                receipt = json.loads(output.read_text())
                require(receipt["file_count"] == 2 and receipt["members"] == 1 and receipt["skills"] == 1
                        and receipt["audit_not_rerun"] is True and receipt["complete_payload_equivalence"] is True,
                        "Incorrect success receipt")
        print("PASS: " + label + " (normal + -O)")


def main():
    cases = [
        ("identical payload", None, None),
        ("added file", lambda h, m, s, d, c: (s / "added.md").write_text("new"), "Payload paths differ"),
        ("deleted file", lambda h, m, s, d, c: (s / "reference.md").unlink(), "Payload paths differ"),
        ("changed bytes", lambda h, m, s, d, c: (s / "reference.md").write_text("changed"), "Payload bytes/size/mode differ"),
        ("changed mode", lambda h, m, s, d, c: os.chmod(s / "reference.md", 0o755), "Payload bytes/size/mode differ"),
        ("symlink", lambda h, m, s, d, c: (s / "link").symlink_to("reference.md"), "Symlink/non-regular payload entry"),
        ("missing object", None, "Missing/unreadable Git object"),
        ("empty census", lambda h, m, s, d, c: c.update(rows=[]), "Empty baseline census rows"),
        ("empty file list", lambda h, m, s, d, c: c["rows"][0].update(files=[]), "Empty baseline file list"),
        ("duplicate row", lambda h, m, s, d, c: c["rows"].append(copy.deepcopy(c["rows"][0])), "Duplicate baseline skill row"),
        ("duplicate file", lambda h, m, s, d, c: c["rows"][0]["files"].append(copy.deepcopy(c["rows"][0]["files"][0])), "Duplicate baseline file"),
        ("missing member", lambda h, m, s, d, c: d.update(skills=[]), "Empty member inventory"),
        ("duplicate member", lambda h, m, s, d, c: d["skills"].append(copy.deepcopy(d["skills"][0])), "Missing/duplicate member identity"),
        ("incomplete baseline paths", lambda h, m, s, d, c: c["rows"][0]["files"].pop(), "Baseline census does not cover exact Git payload"),
        ("baseline hash changed", lambda h, m, s, d, c: c["rows"][0]["files"][0].update(sha256="0" * 64), "Baseline census does not cover exact Git payload"),
    ]
    for args in cases:
        run_case(*args)
    print("PASS: " + str(len(cases)) + " fixtures in normal and optimized Python; owned temporary repositories removed")


if __name__ == "__main__":
    main()
