#!/usr/bin/env python3
"""Which version of a submodule does the pin get compared against?

The invariant is *the pin is the promise*: a checkout of any hub commit must install
exactly the versions `skills.json` advertises. A **checkout** — so the version that
matters is the one committed at the submodule's gitlink, not whatever a local working
tree happens to hold.

Reading the working tree turned this repository's gate red on 2026-08-14 for
`task-pipeline` 1.55.0: a number that existed only as an uncommitted bump in a concurrent
session's tree, that no clone could install, and that no tag had ever carried. The gate
was reporting a state it could not defend.

The dirty tree is still **disclosed**, because a check that quietly ignores an edit is how
the edit ships. It is simply not a *pin* failure — the pin is not what it disagrees with.
"""
import json
import subprocess


def read_committed(subdir):
    """`package.json` version at the submodule's HEAD, or None if git cannot say.

    None is not an error and not a pass: the caller discloses it and falls back, because
    a submodule copied to /tmp without a resolving `.git` is the ordinary state inside a
    CI plant and refusing there would make every plant unrunnable.
    """
    try:
        out = subprocess.run(["git", "-C", subdir, "show", "HEAD:package.json"],
                             capture_output=True, text=True, timeout=15)
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode != 0:
        return None
    try:
        return json.loads(out.stdout).get("version")
    except ValueError:
        return None


def resolve(declared, committed, on_disk):
    """Return (verdict, actual, note).

    verdict is one of:
      `match`     — the pin agrees with what a clone would install
      `mismatch`  — it does not; this is the failure the invariant exists for
      `dirty`     — the pin is right and the working tree has an unreleased bump
      `blind`     — git could not be read, so the working tree was used instead
    """
    if committed is None:
        actual = on_disk
        if actual != declared:
            return "mismatch", actual, "checked against the working tree — git was unreadable"
        return "blind", actual, "checked against the working tree — git was unreadable"
    if committed != declared:
        return "mismatch", committed, "the submodule's committed package.json"
    if on_disk != committed:
        return "dirty", committed, (f"working tree says {on_disk} — an uncommitted bump nobody "
                                    f"has released; a clone installs {committed}")
    return "match", committed, ""
