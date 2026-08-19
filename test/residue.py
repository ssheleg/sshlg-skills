#!/usr/bin/env python3
"""What did this run leave on disk? — one ledger, and it prints even when the answer is nothing.

A run produces more than a diff. Three of this repository's Python suites built temp
trees and removed none of them — `test/plant_guard_test.py:34`, `test/doc_refs_test.py`
(three calls) and `test/pin_source_test.py` (two) — and, the part that matters, nothing
said so. Measured on 2026-08-20 under this machine's `$TMPDIR`:

    find "$TMPDIR" -maxdepth 4 -type f -path '*/copy/sub/b.sh' | wc -l   # 2536
    find "$TMPDIR" -maxdepth 2 -type d -name 'tmp*' | wc -l              # 28117
    du -sh "$TMPDIR"                                                     # 7.0G

The plant-guard fixture is byte-identical in four repositories of this family
(md5 `623a086d10a04940573c31cbebb93e31`), so the 2536 trees cannot be attributed to any
one of them — which is exactly why they are reported and left in place rather than swept.
`make-skill` closed its own copy on 2026-08-19 and filed the referral (MS-02); this is
the umbrella paying it, and the module is **copied from that repository rather than
rewritten**, because two implementations of one ledger is the defect this family keeps
finding in its own history.

A `TemporaryDirectory` around each one closes the leak. It does not close the defect,
because the defect is that a completed run said nothing about what it left, so the next
leak is invisible in exactly the same way. So every temp tree in this suite is taken
through `workspace()`, and every run ends with one line naming its residue — `nothing`
included. That line is the check: the next leak shows up in the gate's own output rather
than in somebody's `du`.

**A failing case keeps its tree, deliberately.** A plant is debugged by reading the copy
it landed in, and a cleanup that runs only on the pass path deletes the evidence exactly
when it is wanted. So a case that fails — or raises anything at all, including an error
that is not an assertion — keeps its workspace; the report names the path, names the case
that owns it, and prints the `rm -rf` that ends it. A clean case's tree goes at exit.

The prefix is part of the mechanism: `sshlg-skills-test-…` makes any future residue
attributable to this suite by name. The 2536 directories measured above are plain
`tmpXXXXXXXX` and are indistinguishable from every other program's — which is why they
have to be reported and left alone rather than swept.

    import residue
    residue.open_case(name)
    d = residue.workspace("planted")      # removed iff the owning case passed
    residue.close_case(name)              # only on success — see above
    residue.report()                      # also wired to atexit, so it cannot be skipped

Zero dependencies, standard library only, like everything else here.
"""
import atexit
import os
import shutil
import sys
import tempfile

PREFIX = "sshlg-skills-test-"

_created = []        # [(path, owner)] every workspace this run made, in order
_incomplete = set()  # cases that did not finish clean; their workspaces are kept
_owner = None
_reported = False


def open_case(name):
    """Everything created from here on belongs to `name` until it closes."""
    global _owner
    _owner = name
    _incomplete.add(name)


def close_case(name, ok=True):
    """Call with ok=True only when the case passed — a kept tree is the evidence."""
    global _owner
    if ok:
        _incomplete.discard(name)
    _owner = None


def workspace(tag="tree"):
    """A temp directory this run owns and will account for at exit."""
    path = tempfile.mkdtemp(prefix=PREFIX, suffix="-" + tag)
    _created.append((path, _owner))
    return path


def _keep(owner):
    # An unowned workspace — created outside any case — is kept only when the run as a
    # whole is red, because nobody can say which case would want to read it.
    return bool(_incomplete) if owner is None else owner in _incomplete


def report(stream=None):
    """Remove what may go, keep what a failure may need, and say which — on every path.

    Returns (kept, removed) so a fixture can assert on the decision rather than on the
    wording. Idempotent: registered with `atexit` and safe to call by hand as well.
    """
    global _reported
    if _reported:
        return [], []
    _reported = True
    stream = stream or sys.stdout
    kept, removed = [], []
    for path, owner in _created:
        if _keep(owner):
            kept.append((path, owner))
            continue
        shutil.rmtree(path, ignore_errors=True)
        if os.path.exists(path):
            # Honest degradation: a tree that refused to go is residue, not a pass.
            kept.append((path, owner))
        else:
            removed.append(path)
    total = len(_created)
    if not kept:
        print("residue: this run left nothing — %d temp tree(s) created, %d removed"
              % (total, len(removed)), file=stream)
    else:
        print("residue: %d of %d temp tree(s) KEPT — the case did not pass and the copy "
              "is the evidence:" % (len(kept), total), file=stream)
        for path, owner in kept:
            print("    %s  <- %s" % (path, owner or "no case"), file=stream)
        print("  %d removed. When you are done reading them: rm -rf %s"
              % (len(removed), " ".join(p for p, _ in kept)), file=stream)
    stream.flush()
    return kept, removed


atexit.register(report)
