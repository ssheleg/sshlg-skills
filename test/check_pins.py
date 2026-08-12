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

**Two different questions, and only one of them is about this commit.**

A pin is INVALID when the version it names was never published: a checkout then
installs something that does not exist, and no later release can repair that
commit. A pin is merely BEHIND when the version exists and a newer one also
does -- which says the world moved, not that this commit is wrong. Conflating
them made five CI runs red in one day for releases other agents cut while this
repository's own release was in flight, and every one of those fixes was a pin
bump that had nothing to do with the change under test (B-13).

    python3 test/check_pins.py            # report both, exit code says which
    python3 test/check_pins.py --strict   # a network failure is also an error

Exit codes, so a caller can block on one and warn on the other:

    0  every pin names the latest published release
    1  a pin names a version that was never published -- the commit is wrong
    2  every pin is real, some are not the newest -- the world moved
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


#: What a pin can be. `MISSING` is the only one that makes a commit wrong.
OK, BEHIND, MISSING = "ok", "behind", "missing"


def classify(pinned: str, newest: str | None, known: set[str]) -> str:
    """Which of the three a pin is, given what the world publishes.

    Pure, and separated from every network call, because the whole point of
    B-13 is that this decision must be provable without the registry being in a
    particular mood. `known` is every published version; `newest` is the one a
    fresh install would get.

    A pin whose version is nowhere in `known` is MISSING even when `known` is
    empty -- that is the case where nothing was ever published under the name,
    and it is exactly as broken as a typo in the version.

    When nothing is known at all (`newest is None` and `known` empty) the caller
    has no evidence either way and must not call it; `skip` is its job, not
    this function's.
    """
    if pinned in known:
        return OK if (newest is None or pinned == newest) else BEHIND
    return MISSING


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


def npm_info(package: str, repo: str) -> tuple[str | None, set[str]]:
    """`(latest, every published version)` -- but only if the package is ours.

    One request to the packument rather than two to `/latest` and `/versions`:
    a pin can be BEHIND or MISSING, and answering both from the same response
    means the two answers cannot disagree because the registry changed between
    them.

    The ownership check is unchanged and load-bearing: `task-pipeline` on npm is
    someone else's 0.1.0, and calling that drift would be worse than not
    checking at all.
    """
    url = f"{REGISTRY}/{urllib.parse.quote(package, safe='')}"
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            data = json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None, set()
        raise
    declared = data.get("repository")
    if isinstance(declared, dict):
        declared = declared.get("url", "")
    if repo.lower() not in str(declared or "").lower():
        return None, set()
    return data.get("dist-tags", {}).get("latest"), set(data.get("versions") or {})


def repo_tags(repo: str) -> tuple[str | None, set[str]]:
    """`(highest vX.Y.Z tag, every vX.Y.Z tag)` on the member's GitHub repo.

    Four of eight members publish to npm at all, so for the rest the registry
    is silent by construction and this is the only evidence there is.
    """
    try:
        out = subprocess.run(
            ["git", "ls-remote", "--tags", "--refs", f"https://github.com/{repo}.git"],
            capture_output=True, text=True, timeout=TIMEOUT, check=True,
        ).stdout
    except (subprocess.SubprocessError, OSError):
        return None, set()
    triples = []
    for line in out.splitlines():
        found = re.search(r"refs/tags/v?(\d+)\.(\d+)\.(\d+)$", line.strip())
        if found:
            triples.append(tuple(int(g) for g in found.groups()))
    if not triples:
        return None, set()
    fmt = lambda t: ".".join(str(n) for n in t)
    return fmt(max(triples)), {fmt(t) for t in triples}


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


def self_test() -> int:
    """Exercise `classify` with no network, and prove the cases differ.

    The last assertion is the one that matters: a check whose every input
    produces the same verdict is not a check. This repository has already
    shipped one -- five exit-code measurements that all returned 2, including
    the success case, because the shell was not splitting the arguments
    (standing instruction #4). So the distinct-verdict count is asserted, not
    eyeballed.
    """
    cases = [
        # (label, pinned, newest, known, expected)
        ("pin is the newest",            "1.2.3", "1.2.3", {"1.2.2", "1.2.3"}, OK),
        ("world moved past the pin",     "1.2.2", "1.2.3", {"1.2.2", "1.2.3"}, BEHIND),
        ("pin was never published",      "1.2.9", "1.2.3", {"1.2.2", "1.2.3"}, MISSING),
        ("nothing published under name", "1.2.3", None,    set(),              MISSING),
        # A newest we cannot see does not make a real pin invalid: the version is
        # in `known`, so a checkout installs something. Reporting MISSING here
        # would fail commits for a registry that answered slowly.
        ("newest unknown, pin exists",   "1.2.3", None,    {"1.2.3"},          OK),
    ]
    failures = []
    for label, pinned, newest, known, expected in cases:
        got = classify(pinned, newest, known)
        mark = "ok  " if got == expected else "FAIL"
        print(f"  {mark} {label:<30} -> {got}")
        if got != expected:
            failures.append(f"{label}: expected {expected}, got {got}")

    verdicts = {classify(p, n, k) for _, p, n, k, _ in cases}
    if len(verdicts) < 3:
        failures.append(
            f"classify returned only {sorted(verdicts)} across every case — a "
            f"measurement that cannot distinguish its inputs is not a measurement"
        )

    for line in failures:
        print(f"  FAIL: {line}")
    if failures:
        print(f"\nself-test: {len(failures)} failure(s)")
        return 1
    print(f"\nself-test: {len(cases)} cases, {len(verdicts)} distinct verdicts, no network")
    return 0


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        return self_test()
    strict = "--strict" in argv
    with open(os.path.join(ROOT, "skills.json"), encoding="utf-8") as handle:
        skills = json.load(handle)["skills"]

    behind, missing, unknown, unreachable = [], [], [], []
    for entry in skills:
        pinned = entry.get("version")
        if not pinned:
            continue
        repo = entry.get("repo", "")
        newest, known, used = None, set(), None
        try:
            for name in candidates(entry):
                newest, known = npm_info(name, repo)
                if known:
                    used = name
                    break
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            unreachable.append(f"{entry['name']}: {exc}")
            continue

        tag_newest, tag_known = repo_tags(repo)
        # Tags cover every member; npm covers half. A version published in
        # either place is a version a checkout can install, so the evidence is
        # the union -- and the newest is the newest of whichever sources exist.
        if not known and not tag_known:
            unknown.append(entry["name"])
            continue
        source = used if known else "git tag"
        all_known = known | tag_known
        newest_overall = max(
            [v for v in (newest, tag_newest) if v],
            key=lambda v: tuple(int(n) for n in v.split(".")),
            default=None,
        )
        verdict = classify(pinned, newest_overall, all_known)
        if verdict == MISSING:
            missing.append((entry["name"], pinned, source, newest_overall))
        elif verdict == BEHIND:
            behind.append((entry["name"], pinned, newest_overall, source))
        else:
            suffix = "" if known else " (tag; not on npm)"
            print(f"ok       {entry['name']:<16} {pinned}{suffix}")

    for name in unknown:
        print(
            f"skip     {name:<16} no npm package published from its repo "
            f"(GitHub-only member, or a name owned by someone else)"
        )
    for line in unreachable:
        print(f"skip     {line}")

    for name, pinned, source, newest_overall in missing:
        print(
            f"MISSING  {name:<16} pinned {pinned}, which {source} never published"
            f" (newest is {newest_overall or 'unknown'})"
            f" -- a checkout of this commit installs a version that does not exist"
        )
    for name, pinned, published, source in behind:
        print(
            f"BEHIND   {name:<16} pinned {pinned}, {source} has {published}"
            f" -- `list` and `update` are reporting {pinned}"
        )

    # Order matters: MISSING is about this commit and outranks a world that moved.
    if missing:
        print(
            f"\n{len(missing)} pin(s) name a version that was never published. This "
            f"commit is wrong on its own terms and no later release repairs it: fix "
            f"the version in skills.json, the submodule pointer and the README row."
        )
        return 1
    if unreachable and strict:
        print("\nregistry unreachable and --strict was set")
        return 1
    if behind:
        print(
            f"\n{len(behind)} pin(s) behind their newest release — every one exists, so "
            f"this commit installs what it advertises. Usually a member released while "
            f"this was in flight. Bump them in skills.json, move the submodule to the "
            f"matching tag, and update the README table together."
        )
        return 2
    print("\nevery pin matches its release (npm where published, git tag everywhere)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
