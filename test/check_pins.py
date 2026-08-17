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
    3  this repository's own newest tag is not on the registry

**These codes are a contract with `.github/workflows/validate.yml`**, whose step
ends in `exit "$code"` — so a code that file does not name fails the run. That is
the right default and it is also why adding one here is a two-file change: exit 3
shipped without its half, and the first release after it went red on its own tag,
skipped `publish`, and produced exactly the unshipped tag the code exists to
report.

**The third question, and it is about this repository rather than its members.**
`v0.82.0` was tagged, its CI went red on one step, `publish` was skipped behind
it, and the tag sat there for a day while `npm` served `0.81.1`. Nothing here
noticed: the members were all fine, and the umbrella was never among the things
this script checks. `release.yml` does carry a *"The registry must actually serve
it"* step -- but it runs inside `publish`, so the one case it exists for, a run
that never reaches `publish`, is the one case it cannot report.

A tag that is not on the registry is wrong the way a MISSING pin is wrong: it
advertises a release nobody can install. It is reported separately and with its
own exit code, because **a release in flight is indistinguishable from a release
that failed** -- the registry's read replica lags the write master by a minute or
two, and this script has no way to tell "publishing right now" from "published
never". The output says so; the caller decides.
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

    # The slug resolver, fixtured because its first draft returned None for the one
    # spelling this repository actually uses — and a resolver returning None made the
    # whole own-tag check print `skip` and pass. Every form npm accepts is a case.
    slugs = [
        ("npm shorthand",   "github:ssheleg/sshlg-skills",                 "ssheleg/sshlg-skills"),
        ("https + .git",    "https://github.com/ssheleg/sshlg-skills.git", "ssheleg/sshlg-skills"),
        ("git+https",       "git+https://github.com/ssheleg/sshlg-skills.git", "ssheleg/sshlg-skills"),
        ("scp-like ssh",    "git@github.com:ssheleg/sshlg-skills.git",     "ssheleg/sshlg-skills"),
        ("bare slug",       "ssheleg/sshlg-skills",                        "ssheleg/sshlg-skills"),
        ("empty",           "",                                            None),
        ("not a repo",      "not a repo at all",                           None),
        ("host without path", "https://github.com/",                       None),
    ]
    for label, field, expected in slugs:
        got = repo_slug(field)
        mark = "ok  " if got == expected else "FAIL"
        print(f"  {mark} slug: {label:<24} -> {got}")
        if got != expected:
            failures.append(f"slug {label}: expected {expected}, got {got}")

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
    # Counted, not restated: this line said "5 cases" the moment eight slug cases
    # joined it, which is the failure the board keeps re-finding in its own files.
    print(f"\nself-test: {len(cases) + len(slugs)} cases "
          f"({len(cases)} classify, {len(slugs)} slug), "
          f"{len(verdicts)} distinct verdicts, no network")
    return 0


def repo_slug(field: str) -> str | None:
    """`owner/repo` out of any form npm accepts in `repository`.

    Four spellings are legal and this repository uses the shortest: npm's
    `github:owner/repo` shorthand, which carries no hostname at all. A regex
    anchored on `github.com` matches three of the four and returns nothing for
    the one in use here -- and "returns nothing" read as "nothing to check".
    """
    if not field:
        return None
    text = field.strip()
    for prefix in ("git+", "git://", "https://", "http://", "ssh://"):
        if text.startswith(prefix):
            text = text[len(prefix):]
    text = re.sub(r"^git@", "", text)
    text = re.sub(r"^github:", "", text)
    text = re.sub(r"^github\.com[:/]", "", text)
    text = re.sub(r"\.git$", "", text)
    match = re.fullmatch(r"([\w.-]+)/([\w.-]+)", text)
    return f"{match.group(1)}/{match.group(2)}" if match else None


def check_own_tag(strict: bool) -> int | None:
    """Is THIS repository's newest tag on the registry? `None` when it is.

    Reuses `classify()` rather than inventing a second notion of published: the
    question is identical to a member's, only the subject changed. What differs
    is the reporting -- a member pin naming an unpublished version is this
    commit's fault, while an unpublished tag is usually a release that failed
    minutes ago or one that is still running.
    """
    with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as handle:
        pkg = json.load(handle)
    name = pkg.get("name")
    # `repository` is a string in some manifests and an object in others, and both
    # are legal npm. Reading only one shape is how a check quietly stops running.
    field = pkg.get("repository") or ""
    slug = repo_slug(field if isinstance(field, str) else (field.get("url") or ""))
    if not (name and slug):
        # Loud, not a quiet skip: this check reporting nothing is indistinguishable
        # from this check passing, which is the failure it exists to prevent. The
        # first draft skipped silently on `github:owner/repo` shorthand.
        print(f"\nFAIL     own tag  cannot resolve a github slug from "
              f"repository={field!r} — the check cannot run, which is not the same as passing")
        return 1

    newest_tag, tag_known = repo_tags(slug)
    if not newest_tag:
        print("\nskip     own tag  no vX.Y.Z tag on this repository yet")
        return None
    try:
        newest_npm, npm_known = npm_info(name, slug)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"\nskip     own tag  registry unreachable ({exc})")
        return 1 if strict else None

    if classify(newest_tag, newest_npm, npm_known) != MISSING:
        print(f"ok       {name:<16} {newest_tag} (newest tag, on the registry)")
        return None

    print(
        f"\nTAGGED BUT NOT SHIPPED: {name} v{newest_tag} is tagged here and the "
        f"registry serves {newest_npm or 'nothing'}.\n"
        f"  A release still running looks exactly like this, and so does one whose\n"
        f"  CI went red before `publish` — check the run before acting. If it failed,\n"
        f"  the tag advertises a version nobody can install."
    )
    return 3


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
    own = check_own_tag(strict)
    if own is not None:
        return own

    print("\nevery pin matches its release (npm where published, git tag everywhere)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
