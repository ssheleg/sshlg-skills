#!/usr/bin/env python3
"""FIX-UP-02.01 — Central operation plan (sherlock audit, finding UP-02).

The finding: `--dry-run` was ACCEPTED by the launcher's parser for every
command, and `install`/`update` then ran their subprocesses and deleted shadow
copies anyway. An accepted flag that changes nothing is worse than a rejected
one — the operator has already relied on it.

What this file proves, against the real CLI as a process:

* `update --dry-run --all --bump-pins` makes ZERO subprocess calls (npx, claude
  and git are shimmed onto PATH and log every invocation), leaves the HOME tree
  byte-identical, prints the COMPLETE plan — submodule, every skills-CLI call,
  the prune, the router block, the runtime sync — and exits 0;
* the same command without `--dry-run` DOES reach the subprocesses (the plan
  executes), and a failing child turns the exit nonzero;
* the rendered receipt carries scopes and effects and no secret from the
  environment.

Standard library only. The unit half of the contract lives in
test/operation-result_test.js.
"""
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")

checks = 0
failures = []


def case(name, fn):
    global checks
    try:
        fn()
        checks += 1
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def make_home():
    home = tempfile.mkdtemp(prefix="up02-home-")
    skills = os.path.join(home, ".claude", "skills", "task-pipeline")
    os.makedirs(skills)
    with open(os.path.join(skills, "SKILL.md"), "w") as fh:
        fh.write("a plain copy that shadows the plugin\n")
    plugins = os.path.join(home, ".claude", "plugins")
    os.makedirs(plugins)
    with open(os.path.join(plugins, "installed_plugins.json"), "w") as fh:
        fh.write('{"plugins": {"task-pipeline@task-pipeline": [{"installPath": "/x"}]}}')
    return home


def make_shims(exit_code=0):
    d = tempfile.mkdtemp(prefix="up02-shims-")
    log = os.path.join(d, "calls.log")
    for name in ("npx", "claude", "git"):
        p = os.path.join(d, name)
        with open(p, "w") as fh:
            fh.write(f'#!/bin/sh\necho "{name} $@" >> "{log}"\nexit {exit_code}\n')
        os.chmod(p, 0o755)
    return d, log


def tree_hash(root):
    h = hashlib.sha256()
    for dirpath, dirnames, filenames in sorted(os.walk(root)):
        dirnames.sort()
        for name in sorted(filenames):
            full = os.path.join(dirpath, name)
            h.update(os.path.relpath(full, root).encode())
            with open(full, "rb") as fh:
                h.update(fh.read())
    return h.hexdigest()


def run_cli(args, home, shims, extra_env=None):
    env = {
        "HOME": home,
        "PATH": shims + os.pathsep + os.environ.get("PATH", ""),
        "NO_COLOR": "1",
    }
    env.update(extra_env or {})
    return subprocess.run(["node", BIN] + args, cwd=ROOT, env=env,
                          capture_output=True, text=True, timeout=180,
                          stdin=subprocess.DEVNULL)


def calls(log):
    try:
        with open(log) as fh:
            return [line.strip() for line in fh if line.strip()]
    except FileNotFoundError:
        return []


def t_dry_run_makes_zero_mutations():
    home = make_home()
    shims, log = make_shims()
    before = tree_hash(home)
    r = run_cli(["update", "--dry-run", "--all", "--bump-pins"], home, shims,
                extra_env={"UP02_PLANTED_SECRET": "sk-PLANTED-SECRET-VALUE"})
    assert r.returncode == 0, f"dry-run exited {r.returncode}:\n{r.stderr[-400:]}"
    assert calls(log) == [], f"dry-run made subprocess calls: {calls(log)[:5]}"
    assert tree_hash(home) == before, "dry-run changed the HOME tree"
    out = r.stdout
    for needle in ("--dry-run: the update plan", "bump submodule pins",
                   "skills update", "skills add", "prune", "router-block",
                   "runtime-sync", "0 executed", "result: dry-run"):
        assert needle in out, f"the receipt is missing {needle!r}"
    assert out.count("[home] subprocess") >= 10, "the receipt does not name the subprocess fleet"
    assert "sk-PLANTED-SECRET-VALUE" not in out, "the receipt leaked an environment secret"
    shutil.rmtree(home); shutil.rmtree(shims)


def t_dry_run_survives_a_hostile_child():
    """The flag renders — a child that WOULD fail cannot matter, because none runs."""
    home = make_home()
    shims, log = make_shims(exit_code=1)
    r = run_cli(["update", "--dry-run"], home, shims)
    assert r.returncode == 0, f"dry-run exited {r.returncode} with failing shims present"
    assert calls(log) == [], "dry-run reached a subprocess"
    shutil.rmtree(home); shutil.rmtree(shims)


def t_without_the_flag_the_plan_executes():
    home = make_home()
    shims, log = make_shims()
    r = run_cli(["update", "--no-claude"], home, shims)
    made = calls(log)
    assert any(c.startswith("npx") for c in made), \
        f"update without --dry-run never reached the skills CLI (exit {r.returncode})"
    assert any(c.startswith("git") for c in made), "the submodule step never ran"
    shutil.rmtree(home); shutil.rmtree(shims)


def t_child_failure_is_nonzero():
    home = make_home()
    shims, log = make_shims(exit_code=1)
    r = run_cli(["update", "--no-claude"], home, shims)
    assert calls(log), "the failing children were never reached"
    assert r.returncode != 0, "every child failed and the launcher still exited 0"
    shutil.rmtree(home); shutil.rmtree(shims)


def t_install_dry_run_renders_and_mutates_nothing():
    home = make_home()
    shims, log = make_shims()
    before = tree_hash(home)
    r = run_cli(["install", "--dry-run"], home, shims)
    assert r.returncode == 0, f"install --dry-run exited {r.returncode}"
    assert calls(log) == [], f"install --dry-run made calls: {calls(log)[:5]}"
    assert tree_hash(home) == before, "install --dry-run changed the HOME tree"
    out = r.stdout
    for needle in ("the install plan", "skills add", "claude plugin install",
                   "router-block", "0 executed", "result: dry-run"):
        assert needle in out, f"the install receipt is missing {needle!r}"
    # The prune action is in the receipt and its named path still exists on disk.
    shadow = os.path.join(home, ".claude", "skills", "task-pipeline")
    assert shadow in out, "the prune step does not name the shadow copy it would remove"
    assert os.path.isdir(shadow), "the dry run deleted the shadow copy"
    shutil.rmtree(home); shutil.rmtree(shims)


def main():
    case("update --dry-run: 0 calls, HOME unchanged, complete receipt, no secrets",
         t_dry_run_makes_zero_mutations)
    case("dry-run exits 0 even beside failing children (none run)",
         t_dry_run_survives_a_hostile_child)
    case("without the flag the same plan executes", t_without_the_flag_the_plan_executes)
    case("a failing child is a nonzero exit", t_child_failure_is_nonzero)
    case("install --dry-run renders the prune without performing it",
         t_install_dry_run_renders_and_mutates_nothing)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print(f"OK ({checks} checks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
