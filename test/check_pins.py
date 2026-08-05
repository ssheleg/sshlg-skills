#!/usr/bin/env python3
"""Compare every pin in skills.json against the npm registry (stdlib only).

`validate.py` checks this repo against itself: the pin, the submodule and the
README table must agree. All three can agree perfectly and all three be wrong,
because none of them knows what was actually published. That is how the
super-ux pin sat at 0.26.5 for four releases while npm carried 0.29.0 --
`list` reported and `update` installed a version nobody was shipping, and
nothing anywhere went red.

This is the check that closes it. Kept out of `validate.py` on purpose:
that one must run offline, and a validator that dies without a network is a
validator people learn to bypass.

    python3 test/check_pins.py            # report drift
    python3 test/check_pins.py --strict   # a network failure is also an error

Exit 0 when every pin matches (or the registry was unreachable without
--strict), 1 when any pin is behind.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = "https://registry.npmjs.org"
TIMEOUT = 10


def latest(package: str, repo: str) -> str | None:
    """The registry's `latest` version -- but only if the package is ours.

    A name that exists is not a name that belongs to us: `task-pipeline` on
    npm is someone else's 0.1.0. Reporting that as drift would be worse than
    not checking, so the package's own `repository` field has to point at the
    repo skills.json names before its version means anything here.
    """
    url = f"{REGISTRY}/{urllib.parse.quote(package, safe='')}/latest"
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            data = json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise
    declared = data.get("repository")
    if isinstance(declared, dict):
        declared = declared.get("url", "")
    if repo.lower() not in str(declared or "").lower():
        return None
    return data.get("version")


def latest_tag(repo: str) -> str | None:
    """The highest `vX.Y.Z` tag on the member's own GitHub repo.

    npm is not enough: four of six members are not published there at all, so
    for them the registry comparison is silent by construction. That silence
    is not safety -- task-pipeline sat at 1.11.0 in this catalogue while
    1.12.0 and 1.13.0 were tagged and published, and nothing said so for two
    days. A tag exists for every member, which makes this the check that
    covers all of them.
    """
    try:
        out = subprocess.run(
            ["git", "ls-remote", "--tags", "--refs", f"https://github.com/{repo}.git"],
            capture_output=True, text=True, timeout=TIMEOUT, check=True,
        ).stdout
    except (subprocess.SubprocessError, OSError):
        return None
    versions = []
    for line in out.splitlines():
        found = re.search(r"refs/tags/v?(\d+)\.(\d+)\.(\d+)$", line.strip())
        if found:
            versions.append(tuple(int(g) for g in found.groups()))
    if not versions:
        return None
    return ".".join(str(n) for n in max(versions))


def candidates(entry: dict) -> list[str]:
    """Package names to try, in order.

    A member's npm name is usually its skill name, but not always -- the
    sheleg-design skill publishes as sheleg-design-skill, which is the repo
    basename. Trying both beats hard-coding either.
    """
    names = []
    for name in (entry.get("npm"), entry.get("name")):
        if name and name not in names:
            names.append(name)
    repo = entry.get("repo", "")
    if "/" in repo:
        basename = repo.split("/")[-1]
        if basename not in names:
            names.append(basename)
    return names


def main(argv: list[str]) -> int:
    strict = "--strict" in argv
    with open(os.path.join(ROOT, "skills.json"), encoding="utf-8") as handle:
        skills = json.load(handle)["skills"]

    behind, unknown, unreachable = [], [], []
    for entry in skills:
        pinned = entry.get("version")
        if not pinned:
            continue
        published, used = None, None
        try:
            for name in candidates(entry):
                published = latest(name, entry.get("repo", ""))
                if published:
                    used = name
                    break
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            unreachable.append(f"{entry['name']}: {exc}")
            continue

        tag = latest_tag(entry.get("repo", ""))
        if tag and tag != pinned:
            behind.append((entry["name"], pinned, tag, "git tag"))
        elif published is None:
            if tag:
                print(f"ok       {entry['name']:<16} {pinned} (tag; not on npm)")
            else:
                unknown.append(entry["name"])
        elif published != pinned:
            behind.append((entry["name"], pinned, published, used))
        else:
            print(f"ok       {entry['name']:<16} {pinned}")

    for name in unknown:
        print(
            f"skip     {name:<16} no npm package published from its repo "
            f"(GitHub-only member, or a name owned by someone else)"
        )
    for line in unreachable:
        print(f"skip     {line}")

    for name, pinned, published, used in behind:
        print(
            f"BEHIND   {name:<16} pinned {pinned}, {used} has {published}"
            f" -- `list` and `update` are reporting {pinned}"
        )

    if behind:
        print(
            f"\n{len(behind)} pin(s) behind their own release. Bump them in "
            f"skills.json, move the submodule to the matching tag, and update "
            f"the README table -- validate.py checks that all three agree."
        )
        return 1
    if unreachable and strict:
        print("\nregistry unreachable and --strict was set")
        return 1
    print("\nevery pin matches its release (npm where published, git tag everywhere)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
