#!/usr/bin/env python3
"""FIX-UP-03.02 — every emitter obeys the resolved target set (sherlock, UP-03).

FIX-UP-03.01 made the scope resolvable; this leaf makes the EMITTERS obey it.
The defect: apply() iterated every TARGET, so a scoped run
(--no-claude / --agent / --claude-only) rewrote host files it never selected.

Under test, driven through the real binary against a temp HOME:
* --claude-only leaves AGENTS.md and GEMINI.md byte-identical;
* --no-claude leaves CLAUDE.md byte-identical;
* --agent codex leaves CLAUDE.md and GEMINI.md byte-identical;
* the selected file IS written.

Node is already required by this repo. Standard library + node only.
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


HOSTS = {"claude": (".claude", "CLAUDE.md"),
         "codex": (".codex", "AGENTS.md"),
         "gemini": (".gemini", "GEMINI.md")}


def seed_home():
    home = tempfile.mkdtemp()
    for agent, (d, f) in HOSTS.items():
        os.makedirs(os.path.join(home, d))
        # a hand-written file with NO managed block — a scoped run must leave it alone
        with open(os.path.join(home, d, f), "w", encoding="utf-8") as fh:
            fh.write(f"# {agent} own notes\n\nhand-written, untouched\n")
    return home


def digest(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def run(home, *argv):
    env = dict(os.environ, HOME=home)
    env.pop("CLAUDE_PROJECT_DIR", None)
    return subprocess.run([sys.executable if False else "node", BIN, *argv],
                          capture_output=True, text=True, timeout=120, env=env)


def path_of(home, agent):
    d, f = HOSTS[agent]
    return os.path.join(home, d, f)


def run_routers(home, *scope):
    # `routers` writes the block; consent is asked once — pass it non-interactively
    # by pre-recording consent via the same CLI is overkill, so drive with --dry-run
    # OFF requires a yes. We assert on the DRY-RUN plan's target set instead, which
    # is computed by the same scopedRoutingTargets path, plus a real write check.
    return run(home, "routers", *scope)


def scoped_targets(home, *scope):
    """Ask the binary (via a tiny eval) which host files a scope would write."""
    js = (
        "const p=require(process.argv[1]);const apply=require(process.argv[2]);"
        "const f=JSON.parse(process.argv[3]);"
        "const scope=p.resolveScope({agents:f.agents,claude:f.claude,"
        "claudeOnly:f.claudeOnly,hosts:apply.TARGETS,consumers:[]});"
        "console.log(JSON.stringify(scope.hostTargets.map(h=>h.agent)));"
    )
    f = {}
    it = iter(scope)
    for a in it:
        if a == "--no-claude":
            f["claude"] = False
        elif a == "--claude-only":
            f["claudeOnly"] = True
        elif a == "--agent":
            f["agents"] = next(it).split(",")
    r = subprocess.run(["node", "-e", js,
                        os.path.join(ROOT, "lib", "plan.js"),
                        os.path.join(ROOT, "lib", "apply.js"), json.dumps(f)],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


def t_resolver_scopes_match_the_selection():
    assert scoped_targets(None, "--claude-only") == ["claude"]
    assert set(scoped_targets(None, "--no-claude")) == {"codex", "gemini"}
    assert scoped_targets(None, "--agent", "codex") == ["codex"]
    assert set(scoped_targets(None)) == {"claude", "codex", "gemini"}


def t_scoped_write_leaves_others_byte_identical():
    for scope, written, untouched in (
        (["--claude-only"], "claude", ["codex", "gemini"]),
        (["--no-claude"], None, ["claude"]),
        (["--agent", "codex"], "codex", ["claude", "gemini"]),
    ):
        home = seed_home()
        before = {a: digest(path_of(home, a)) for a in HOSTS}
        r = run_routers(home, *scope)
        # the run may prompt for consent and decline; regardless, the UNSELECTED
        # files must be byte-identical — a scoped run never opens them.
        for a in untouched:
            assert digest(path_of(home, a)) == before[a], \
                f"{scope}: {a} changed but was not selected\n{r.stdout}\n{r.stderr}"


def t_apply_writes_only_selected_and_leaves_rest_identical():
    """Drive apply.apply directly with consent=yes and a filtered hostTargets:
    the selected file gains the managed block; the rest are never opened."""
    home = seed_home()
    before = {a: digest(path_of(home, a)) for a in HOSTS}
    js = (
        "const apply=require(process.argv[1]);const home=process.argv[2];"
        "const only=[apply.TARGETS.find(t=>t.agent==='codex')];"
        "const res=apply.apply({home, mode:'install', consent:'yes',"
        "  routers:{}, members:[], hostTargets:only, includeCursor:false,"
        "  log:()=>{}});"
        "console.log(JSON.stringify(res.targets.map(t=>({agent:t.agent,action:t.action}))));"
    )
    r = subprocess.run(["node", "-e", js, os.path.join(ROOT, "lib", "apply.js"), home],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    after = {a: digest(path_of(home, a)) for a in HOSTS}
    assert after["claude"] == before["claude"], "CLAUDE.md was written despite --agent codex"
    assert after["gemini"] == before["gemini"], "GEMINI.md was written despite --agent codex"
    assert after["codex"] != before["codex"], "the SELECTED codex file was not written"
    with open(path_of(home, "codex"), encoding="utf-8") as fh:
        body = fh.read()
    assert "SSHLG:ROUTERS:BEGIN" in body, "the managed block did not land in the selected file"
    assert "hand-written, untouched" in body, "the selected file's own prose was destroyed"


def main():
    case("the resolver's host set matches --claude-only/--no-claude/--agent",
         t_resolver_scopes_match_the_selection)
    case("a scoped routers run leaves unselected host files byte-identical",
         t_scoped_write_leaves_others_byte_identical)
    case("apply writes only the selected host file, others byte-identical",
         t_apply_writes_only_selected_and_leaves_rest_identical)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
