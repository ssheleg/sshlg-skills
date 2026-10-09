#!/usr/bin/env python3
"""Verify npm publication bytes against an immutable local Git commit.

Only --output is written. No archive is extracted or installed. --release-run
is a caller-supplied receipt label, not verification of a workflow conclusion.
Example:
  python3 verify_registry.py --repo /path/to/repo --package @scope/name \
    --version 1.2.3 --source <full-commit-SHA> --release-run 123 --output receipt.json
"""
import argparse
import base64
import hashlib
import io
import json
import re
import subprocess
import tarfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def require(condition, message):
    if not condition:
        raise ValueError(message)


def registry_url(url):
    parsed = urllib.parse.urlsplit(url)
    require(parsed.scheme == "https" and parsed.netloc == "registry.npmjs.org"
            and not parsed.query and not parsed.fragment,
            "Expected canonical HTTPS npm registry URL")
    return url


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Registry request unexpectedly redirected")


def fetch(url):
    request = urllib.request.Request(registry_url(url), headers={"User-Agent": "sshlg-release-readback/1"})
    with urllib.request.build_opener(NoRedirect()).open(request, timeout=30) as response:
        return response.read()


def git(repo, *args):
    result = subprocess.run(["git", *args], cwd=repo, capture_output=True, check=False)
    require(result.returncode == 0, "Git read failed: " + " ".join(args))
    return result.stdout


def validate_metadata(meta, package, version, source):
    require(meta.get("name") == package, "Registry package name mismatch")
    require(meta.get("version") == version, "Registry version mismatch")
    require(meta.get("gitHead") == source, "Registry gitHead mismatch")
    dist = meta["dist"]
    registry_url(dist["tarball"])
    require(isinstance(dist.get("integrity"), str) and dist["integrity"].startswith("sha512-"),
            "Missing SHA-512 registry integrity")
    require(re.fullmatch(r"[0-9a-f]{40}", dist.get("shasum", "")), "Invalid registry SHA-1 shasum")


def published_files(repo, source, meta, tgz):
    dist = meta["dist"]
    integrity = "sha512-" + base64.b64encode(hashlib.sha512(tgz).digest()).decode()
    require(integrity == dist["integrity"], "Tarball SHA-512 integrity mismatch")
    require(hashlib.sha1(tgz).hexdigest() == dist["shasum"], "Tarball SHA-1 shasum mismatch")
    rows, seen, package_json = [], set(), None
    with tarfile.open(fileobj=io.BytesIO(tgz), mode="r:gz") as archive:
        for member in archive:
            name = member.name.rstrip("/") if member.isdir() else member.name
            parts = name.split("/")
            require(parts[0] == "package" and all(part not in ("", ".", "..") for part in parts)
                    and "\\" not in name and not any(ord(c) < 32 or ord(c) == 127 for c in name),
                    "Unsafe package archive path: " + repr(member.name))
            require(name not in seen, "Duplicate archive entry: " + name)
            seen.add(name)
            if member.isdir():
                continue
            require(member.isfile() and len(parts) > 1, "Non-regular package entry: " + name)
            rel = "/".join(parts[1:])
            stream = archive.extractfile(member)
            require(stream is not None, "Unreadable archive entry: " + rel)
            with stream:
                payload = stream.read()
            require(len(payload) == member.size, "Truncated archive entry: " + rel)
            require(git(repo, "show", source + ":" + rel) == payload, "Source byte mismatch: " + rel)
            rows.append({"path": rel, "sha256": hashlib.sha256(payload).hexdigest(), "bytes": len(payload)})
            if rel == "package.json":
                package_json = json.loads(payload)
    require(rows, "Archive contains no regular package files")
    require(isinstance(package_json, dict), "Archive is missing package.json")
    require(package_json.get("name") == meta["name"] and package_json.get("version") == meta["version"],
            "Published package.json identity differs from registry")
    return sorted(rows, key=lambda row: row["path"])


def verify(repo, package, version, source, release_run):
    require(re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", source), "--source must be a full commit SHA")
    require(git(repo, "cat-file", "-t", source).strip() == b"commit", "Source is not a Git commit")
    url = "https://registry.npmjs.org/" + urllib.parse.quote(package, safe="") + "/" + urllib.parse.quote(version, safe="")
    meta = json.loads(fetch(url))
    validate_metadata(meta, package, version, source)
    tgz = fetch(meta["dist"]["tarball"])
    rows = published_files(repo, source, meta, tgz)
    canonical = hashlib.sha256(json.dumps(rows, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "package": package, "version": version, "gitHead": source,
        "registry": url, "tarball": meta["dist"]["tarball"], "integrity": meta["dist"]["integrity"],
        "tarball_sha256": hashlib.sha256(tgz).hexdigest(),
        "all_published_files_equal_release_source": True,
        "published_files": len(rows), "canonical_manifest_sha256": canonical,
        "release_run": release_run, "runtime_acceptance": "NOT_RUN", "files": rows,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--package", required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--release-run", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        receipt = verify(args.repo, args.package, args.version, args.source, args.release_run)
        args.output.write_text(json.dumps(receipt, indent=2) + "\n")
    except (ValueError, KeyError, TypeError, OSError, tarfile.TarError, urllib.error.URLError) as exc:
        parser.exit(1, "FAIL: " + str(exc) + "\n")
    print(json.dumps({key: value for key, value in receipt.items() if key != "files"}, indent=2))


if __name__ == "__main__":
    main()
