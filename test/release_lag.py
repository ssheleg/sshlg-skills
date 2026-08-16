#!/usr/bin/env python3
"""Has a member's `main` moved past the commit this hub pins?

The pin is a **tag**; the skills-CLI channels install from the **branch**. Those are two
different promises about the same skill, and until 2026-08-16 nothing compared them.

What that cost, measured that morning: `seo-aeo-audit`'s `main` carried `b063131`, a fix
for a `KeyError` that killed the default markdown output on any page without FAQ schema —
most pages. It was never tagged. So `skills.json` advertised 0.20.0, the version that
crashes, while the hub copy every non-Claude-Code agent reads already had the repair. Both
channels were internally consistent and they disagreed with each other. `check_pins.py` was
green throughout, correctly: the pin *did* match the latest release. The latest release was
the problem.

**This discloses, it does not fail, and that is deliberate.** The state it reports is
legitimate and transient every single time a member is released: for the minutes between a
member's tag and the umbrella's re-pin, `main` is ahead by design. A gate that goes red
there is the racy-gate class this repository already wrote down — *a gate that reads
repositories you do not control is racy* — and the fix for the seo incident was never
"stop the build", it was "say something". Nobody was going to notice one commit sitting on
one branch, and nothing said a word for six hours.

Pure: `resolve` touches nothing. The caller does the git and hands the answers over.
"""


def resolve(has_ref, ahead, tip_subject):
    """`(state, message)` for one member, from three facts the caller measured.

    - `has_ref`  — is there a local `origin/main` to compare against at all? A shallow or
      mirror-less checkout has none, and that is *blind*, never *current*. Reporting
      "nothing unreleased" from a ref that does not exist is the uniform-answer failure
      this repository keeps catching: every member would read the same, and the reading
      would mean nothing.
    - `ahead`    — commits reachable from `origin/main` and not from the pinned commit.
    - `tip_subject` — the newest of them, so the disclosure names what is waiting rather
      than only counting it. A bare number gets skimmed; a sentence gets read.

    States: `blind` (cannot look), `current` (nothing waiting), `lag` (something is).
    """
    if not has_ref:
        return "blind", "no local origin/main to compare the pin against"
    try:
        n = int(ahead)
    except (TypeError, ValueError):
        return "blind", "git could not count commits between the pin and origin/main"
    if n < 0:
        return "blind", "negative commit count — git said something unusable"
    if n == 0:
        return "current", "the pin is the tip of main"
    subject = (tip_subject or "").strip() or "(no subject)"
    plural = "commit" if n == 1 else "commits"
    return "lag", (f"{n} unreleased {plural} on main, newest {subject!r} — the branch "
                   f"channels serve them and the pinned tag does not")
