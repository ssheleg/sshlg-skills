#!/usr/bin/env python3
"""Fixtures for test/residue.py — and the assertion the leak needed: the path is gone.

Every case here runs the ledger, or a real suite, as a **process**, because the whole
behaviour under test happens at interpreter exit. Asserting it in-process would test a
function call and miss `atexit`, which is the half that makes the report unskippable.

The four paths that matter, each watched: a case that passes loses its tree; a case that
fails keeps it; a case that raises something that is not an assertion also keeps it, and
still reports; and a run that made no tree at all still says so out loud.
"""
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import residue  # noqa: E402

failures = []
cases = 0


def case(name, fn):
    global cases
    cases += 1
    residue.open_case(name)
    try:
        fn()
    except AssertionError as e:
        failures.append("%s: %s" % (name, e))
        print("  FAIL  %s: %s" % (name, e))
    else:
        print("  ok  %s" % name)
        residue.close_case(name)


def drive(body, tmpdir=None):
    """Run `body` in a fresh interpreter that imports the ledger, and read its report."""
    env = dict(os.environ, PYTHONPATH=HERE + os.pathsep + os.environ.get("PYTHONPATH", ""))
    if tmpdir:
        env["TMPDIR"] = tmpdir
    proc = subprocess.run([sys.executable, "-c", body], capture_output=True, text=True, env=env)
    paths = [ln[5:] for ln in proc.stdout.splitlines() if ln.startswith("PATH:")]
    return proc, paths


PASSING = (
    "import residue\n"
    "residue.open_case('green')\n"
    "d = residue.workspace('fixture')\n"
    "open(d + '/f', 'w').write('x')\n"
    "print('PATH:' + d)\n"
    "residue.close_case('green')\n"
)

FAILING = (
    "import residue\n"
    "residue.open_case('red')\n"
    "d = residue.workspace('fixture')\n"
    "open(d + '/f', 'w').write('x')\n"
    "print('PATH:' + d)\n"
    "residue.close_case('red', ok=False)\n"
)

CRASHING = (
    "import residue\n"
    "residue.open_case('boom')\n"
    "print('PATH:' + residue.workspace('fixture'))\n"
    "raise RuntimeError('not an assertion')\n"
)


def a_passing_case_leaves_nothing():
    """THE LEAK. `test/plant_guard_test.py:34` never removed the tree it built."""
    proc, paths = drive(PASSING)
    assert proc.returncode == 0, proc.stderr
    assert len(paths) == 1, proc.stdout
    assert not os.path.exists(paths[0]), "the workspace outlived a passing run: %s" % paths[0]
    assert "this run left nothing" in proc.stdout, proc.stdout


def a_clean_run_still_says_so():
    """A clean run that stays silent is how the next leak becomes invisible again."""
    proc, _ = drive("import residue\n")
    assert proc.returncode == 0, proc.stderr
    assert "residue: this run left nothing — 0 temp tree(s) created" in proc.stdout, proc.stdout


def a_failing_case_keeps_its_tree():
    """Cleanup on the pass path only removes the evidence exactly when it is wanted."""
    proc, paths = drive(FAILING)
    assert len(paths) == 1, proc.stdout
    try:
        assert os.path.isdir(paths[0]), "a failing case lost its tree: %s" % paths[0]
        assert "KEPT" in proc.stdout, proc.stdout
        assert paths[0] in proc.stdout, "the report does not name the path it kept"
        assert "red" in proc.stdout, "the report does not name the case that owns it"
        assert "rm -rf" in proc.stdout, "a kept tree with no stated remedy is a leak"
    finally:
        shutil.rmtree(paths[0], ignore_errors=True)


def a_crash_reports_and_keeps():
    """`case()` catches AssertionError only; anything else propagates. atexit still runs."""
    proc, paths = drive(CRASHING)
    assert proc.returncode != 0, "a raised RuntimeError exited 0"
    assert len(paths) == 1, proc.stdout
    try:
        assert os.path.isdir(paths[0]), "a crashed case lost its tree: %s" % paths[0]
        assert "KEPT" in proc.stdout, proc.stdout
    finally:
        shutil.rmtree(paths[0], ignore_errors=True)


def the_prefix_makes_residue_attributable():
    """The 1856 directories this closed are plain `tmpXXXXXXXX` — nameless, so unswept."""
    proc, paths = drive(FAILING)
    try:
        assert len(paths) == 1, proc.stdout
        assert os.path.basename(paths[0]).startswith(residue.PREFIX), paths[0]
    finally:
        if paths:
            shutil.rmtree(paths[0], ignore_errors=True)


def the_real_plant_guard_suite_leaves_nothing():
    """End to end, in its own TMPDIR, so the assertion is about the suite and not the box."""
    box = residue.workspace("plant-guard-e2e")
    proc = subprocess.run([sys.executable, os.path.join(HERE, "plant_guard_test.py")],
                          capture_output=True, text=True, env=dict(os.environ, TMPDIR=box))
    assert proc.returncode == 0, proc.stdout + proc.stderr
    left = sorted(os.listdir(box))
    assert left == [], "plant_guard_test left %d entr(y|ies) in its TMPDIR: %s" % (len(left), left[:5])
    assert "this run left nothing" in proc.stdout, proc.stdout


def the_three_leaking_suites_leave_nothing():
    """The three suites the 2026-08-20 measurement named, run for real in a private TMPDIR.

    `plant_guard_test.py` built a tree per case, `doc_refs_test.py` three and
    `pin_source_test.py` two, and none of them removed anything — 2536 trees of the shared
    plant-guard shape were on this machine when the count was taken. Each is run here in a
    box of its own and the box must be empty afterwards, which is a stronger claim than
    "the ledger says nothing was left": the ledger is what is under test.
    """
    for suite, cases in (("plant_guard_test.py", 9),
                         ("doc_refs_test.py", 17),
                         ("pin_source_test.py", 7)):
        box = residue.workspace("e2e-" + suite.split("_")[0])
        proc = subprocess.run([sys.executable, os.path.join(HERE, suite)],
                              capture_output=True, text=True, env=dict(os.environ, TMPDIR=box))
        assert proc.returncode == 0, suite + ": " + proc.stdout[-2000:] + proc.stderr[-2000:]
        left = sorted(os.listdir(box))
        assert left == [], "%s left %d entr(y|ies) in its TMPDIR: %s" % (suite, len(left), left[:5])
        assert "this run left nothing" in proc.stdout, suite + " printed no residue line:\n" + proc.stdout
        assert ("%d cases" % cases) in proc.stdout, suite + " did not run its cases"


def this_gate_run_left_nothing_behind():
    """Reads the TMPDIR the whole gate shares, after the two suites above have run in it.

    `npm test` runs this file last, in one shell, so every earlier suite used this
    `$TMPDIR`. A hit here means a suite in this repository is leaking again — or that a
    second gate run is in flight in the same session, which the message names because a
    check must not report a cause it did not establish.
    """
    box = os.environ.get("TMPDIR") or "/tmp"
    strays = [n for n in os.listdir(box) if n.startswith(residue.PREFIX)]
    mine = {os.path.basename(p) for p, _ in residue._created}
    strays = [n for n in strays if n not in mine]
    assert not strays, ("%d ledger-prefixed tree(s) left in the shared TMPDIR — a suite "
                        "here is leaking, or a concurrent gate run is in flight: %s"
                        % (len(strays), strays[:5]))


for n, f in [
    ("a passing case leaves nothing, and the path is gone", a_passing_case_leaves_nothing),
    ("a clean run still says what it left", a_clean_run_still_says_so),
    ("a FAILING case keeps its tree, by name, with a remedy", a_failing_case_keeps_its_tree),
    ("a crash keeps its tree and still reports", a_crash_reports_and_keeps),
    ("residue is attributable by prefix", the_prefix_makes_residue_attributable),
    ("plant_guard_test leaves an empty TMPDIR", the_real_plant_guard_suite_leaves_nothing),
    ("the three named suites leave an empty TMPDIR", the_three_leaking_suites_leave_nothing),
    ("this gate run left nothing in the shared TMPDIR", this_gate_run_left_nothing_behind),
]:
    case(n, f)

if failures:
    print("\nFAIL: %d of %d" % (len(failures), cases))
    sys.exit(1)
print("PASS: residue — %d cases" % cases)
