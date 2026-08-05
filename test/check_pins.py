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

        if published is None:
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
            f"BEHIND   {name:<16} pinned {pinned}, npm has {published} "
            f"({used}) -- `list` and `update` are reporting {pinned}"
        )

    if behind:
        print(
            f"\n{len(behind)} pin(s) behind the registry. Bump them in "
            f"skills.json, move the submodule to the matching tag, and update "
            f"the README table -- validate.py checks that all three agree."
        )
        return 1
    if unreachable and strict:
        print("\nregistry unreachable and --strict was set")
        return 1
    print("\nevery pin matches the registry")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
