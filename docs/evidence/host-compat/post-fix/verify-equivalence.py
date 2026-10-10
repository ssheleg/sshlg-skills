#!/usr/bin/env python3
"""Compare current pinned skill payloads with an immutable historical census.

Reads Git objects only; no checkout, fetch, installation, auditor execution or
host writes. Only --output is written, after every comparison succeeds.
"""
import argparse
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

CENSUS = "docs/evidence/host-compat/post-fix/census.json"


def require(ok, message):
    if not ok:
        raise ValueError(message)


def git(repo, *args):
    result = subprocess.run(["git", "--no-replace-objects", "--no-lazy-fetch", *args], cwd=repo, capture_output=True)
    require(result.returncode == 0, "Missing/unreadable Git object: " + " ".join(args))
    return result.stdout


def sha(value):
    require(isinstance(value, str) and re.fullmatch(r"[0-9a-f]{40}", value), "Expected full 40-character commit SHA")
    return value


def path(value):
    require(isinstance(value, str) and value and "\\" not in value
            and all(p not in ("", ".", "..") for p in value.split("/"))
            and not any(ord(c) < 32 or ord(c) == 127 for c in value), "Unsafe relative path: " + repr(value))
    return value


def tree(repo, commit):
    require(git(repo, "cat-file", "-t", sha(commit)).strip() == b"commit", "Not a commit: " + commit)
    entries = {}
    for record in git(repo, "ls-tree", "-r", "-z", commit).split(b"\0"):
        if not record:
            continue
        metadata, name = record.split(b"\t", 1)
        mode, kind, oid = metadata.decode().split()
        name = path(name.decode())
        require(name not in entries, "Duplicate tree entry: " + name)
        entries[name] = (mode, kind, oid)
    require(entries, "Empty Git tree: " + commit)
    return entries


def inventory(hub, commit):
    entries = tree(hub, commit)
    manifest = json.loads(git(hub, "show", commit + ":skills.json"))
    members, names, dirs = {}, set(), set()
    for member in manifest["skills"]:
        name, directory = member["name"], path(member["dir"])
        require(isinstance(name, str) and name and name not in members, "Missing/duplicate member identity")
        require(directory not in dirs, "Duplicate member directory: " + directory)
        ids = member["skillNames"]
        require(isinstance(ids, list) and ids, "Empty member skill list: " + name)
        for skill in ids:
            require(path(skill) == skill and "/" not in skill and skill not in names, "Duplicate/invalid skill: " + skill)
            names.add(skill)
        entry = entries.get(directory)
        require(entry and entry[:2] == ("160000", "commit"), "Missing member gitlink: " + name)
        members[name] = {"dir": directory, "skills": set(ids), "commit": entry[2]}
        dirs.add(directory)
    require(members and names, "Empty member inventory")
    return members


def payload(repo, entries, prefix, cache):
    result = {}
    for name, (mode, kind, oid) in entries.items():
        if not name.startswith(prefix + "/"):
            continue
        require(kind == "blob" and mode in ("100644", "100755"), "Symlink/non-regular payload entry: " + name)
        if oid not in cache:
            raw = git(repo, "cat-file", "blob", oid)
            cache[oid] = (hashlib.sha256(raw).hexdigest(), len(raw))
        digest, size = cache[oid]
        result[name[len(prefix) + 1:]] = {"sha256": digest, "bytes": size, "mode": mode}
    require(result and "SKILL.md" in result, "Empty/missing skill payload: " + prefix)
    return result


def verify(hub, repositories, baseline):
    sha(baseline)
    current = sha(git(hub, "rev-parse", "HEAD").decode().strip())
    require(git(hub, "cat-file", "-t", baseline).strip() == b"commit", "Baseline is not a commit")
    raw = git(hub, "show", baseline + ":" + CENSUS)
    census = json.loads(raw)
    old_hub = sha(census["hub_commit"])
    old, now = inventory(hub, old_hub), inventory(hub, current)
    require(old.keys() == now.keys(), "Added/deleted member set")
    expected = {(m, s) for m, value in old.items() for s in value["skills"]}
    require(expected == {(m, s) for m, value in now.items() for s in value["skills"]}, "Added/deleted advertised skill set")
    rows = census["rows"]
    require(isinstance(rows, list) and rows, "Empty baseline census rows")
    indexed = {}
    for row in rows:
        key = (row["member"], row["skill"])
        require(key not in indexed, "Duplicate baseline skill row: " + repr(key))
        indexed[key] = row
    require(set(indexed) == expected, "Missing/extra baseline members or skills")
    require(census["members"] == len(old) and census["skills"] == len(rows), "Baseline census count mismatch")
    output, file_count = [], 0
    for member, info in sorted(old.items()):
        require(info["dir"] == now[member]["dir"], "Changed member repository path: " + member)
        repo = repositories / info["dir"]
        require(repo.is_dir(), "Missing member repository: " + member)
        before_tree = tree(repo, info["commit"])
        after_tree = tree(repo, now[member]["commit"])
        cache = {}
        for skill in sorted(info["skills"]):
            row = indexed[(member, skill)]
            prefix = path(row["skill_path"])
            require(row["commit"] == info["commit"], "Census source does not match baseline gitlink: " + skill)
            require(row["audit_exit"] == 0 and row["escaping_symlinks"] == [], "Baseline audit/symlink evidence not clean: " + skill)
            for entries in (before_tree, after_tree):
                found = [p.rsplit("/", 1)[0] for p in entries
                         if re.fullmatch(r"plugins/[^/]+/skills/" + re.escape(skill) + r"/SKILL\.md", p)]
                require(found == [prefix], "Missing/duplicate/moved advertised skill path: " + skill)
            recorded = {}
            require(isinstance(row["files"], list) and row["files"], "Empty baseline file list: " + skill)
            for file in row["files"]:
                rel = path(file["path"])
                require(rel not in recorded, "Duplicate baseline file: " + skill + "/" + rel)
                require(re.fullmatch(r"[0-9a-f]{64}", file["sha256"])
                        and type(file["bytes"]) is int and file["bytes"] >= 0, "Invalid baseline digest/size")
                recorded[rel] = {"sha256": file["sha256"], "bytes": file["bytes"]}
            before = payload(repo, before_tree, prefix, cache)
            after = payload(repo, after_tree, prefix, cache)
            require(recorded == {p: {k: v for k, v in f.items() if k != "mode"} for p, f in before.items()},
                    "Baseline census does not cover exact Git payload: " + skill)
            added, deleted = sorted(after.keys() - before.keys()), sorted(before.keys() - after.keys())
            require(not added and not deleted, "Payload paths differ for " + skill + ": added=" + repr(added) + ", deleted=" + repr(deleted))
            changed = sorted(p for p in before if before[p] != after[p])
            require(not changed, "Payload bytes/size/mode differ for " + skill + ": " + repr(changed))
            file_count += len(after)
            output.append({"member": member, "skill": skill, "skill_path": prefix,
                           "baseline_member_commit": info["commit"], "current_member_commit": now[member]["commit"],
                           "files": [{"path": p, **f} for p, f in sorted(after.items())]})
    require(file_count > 0 and census["file_count"] == file_count, "Baseline total file count mismatch")
    return {"as_of": datetime.now(timezone.utc).isoformat(), "baseline_artifact_commit": baseline,
            "baseline_census_path": CENSUS, "baseline_census_sha256": hashlib.sha256(raw).hexdigest(),
            "baseline_hub_commit": old_hub, "current_hub_commit": current,
            "members": len(old), "skills": len(output), "file_count": file_count,
            "complete_payload_equivalence": True, "audit_not_rerun": True,
            "runtime_acceptance": "NOT_RUN", "rows": output}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hub", required=True, type=Path)
    parser.add_argument("--repositories", required=True, type=Path)
    parser.add_argument("--baseline", required=True, help="Full SHA containing the immutable census Git blob")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        receipt = verify(args.hub, args.repositories, args.baseline)
        args.output.write_text(json.dumps(receipt, indent=2) + "\n")
    except (ValueError, KeyError, TypeError, OSError) as exc:
        parser.exit(1, "FAIL: " + str(exc) + "\n")
    print(json.dumps({k: v for k, v in receipt.items() if k != "rows"}, indent=2))


if __name__ == "__main__":
    main()
