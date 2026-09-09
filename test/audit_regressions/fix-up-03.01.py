#!/usr/bin/env python3
"""FIX-UP-03.01 — explicit scope resolution: host and shared are separate axes,
and a host-only plan does not hide a shared effect (sherlock audit, UP-03).

The finding: `update --no-claude --agent codex` rewrote ALL THREE host files
(.claude/CLAUDE.md, .codex/AGENTS.md, .gemini/GEMINI.md) — the block emitter
iterated every TARGET, ignoring the agent selection. And `skills update <name>
--global` writes the shared hub, which fans out to every symlinked channel, so
a run naming one agent still touches storage every agent reads. That is a real
shared object, not a missing flag.

The fix under test (lib/plan.js resolveScope, run under node):
* host targets are filtered by the SAME selection the CLI got — --agent codex
  --no-claude yields ONLY codex's AGENTS.md, never all three;
* the shared store and every symlink consumer are listed as a NAMED part of
  the plan whenever the shared store is written;
* an impossible isolation (touch only these agents, but the shared store fans
  out to others) is reported as explicitly unsupported, not silently granted.

Node is already required by this repo. No new mandatory package.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PLAN = os.path.join(ROOT, "lib", "plan.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


HOSTS = [
    {"agent": "claude", "dir": ".claude", "file": "CLAUDE.md"},
    {"agent": "codex", "dir": ".codex", "file": "AGENTS.md"},
    {"agent": "gemini", "dir": ".gemini", "file": "GEMINI.md"},
]


def resolve(opts):
    opts = dict(opts)
    opts.setdefault("hosts", HOSTS)
    js = (
        "const p = require(process.argv[1]);"
        "console.log(JSON.stringify(p.resolveScope(JSON.parse(process.argv[2]))));"
    )
    r = subprocess.run(["node", "-e", js, PLAN, json.dumps(opts)],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout)


def t_host_only_selection_does_not_touch_other_hosts():
    res = resolve({"agents": ["codex"], "claude": False,
                   "consumers": ["~/.cursor/skills"]})
    agents = [h["agent"] for h in res["hostTargets"]]
    assert agents == ["codex"], \
        f"--no-claude --agent codex touched {agents} — the all-three defect"


def t_claude_only_keeps_only_claude():
    res = resolve({"claudeOnly": True, "claude": True})
    agents = [h["agent"] for h in res["hostTargets"]]
    assert agents == ["claude"], f"--claude-only touched {agents}"
    assert res["shared"] is None, "--claude-only wrote the shared store"


def t_no_agent_selection_is_all_hosts():
    res = resolve({"claude": True, "consumers": []})
    agents = [h["agent"] for h in res["hostTargets"]]
    assert agents == ["claude", "codex", "gemini"], \
        f"an unscoped run should touch all hosts, got {agents}"


def t_shared_effect_is_named_not_hidden():
    res = resolve({"agents": ["codex"], "claude": False,
                   "consumers": ["~/.cursor/skills", "~/.kiro/skills"]})
    assert res["shared"] is not None, "a host-scoped run hid the shared write"
    assert res["shared"]["consumers"] == ["~/.cursor/skills", "~/.kiro/skills"], \
        "the symlink consumers were not listed before apply"
    assert "not host-scoped" in res["shared"]["reason"]


def t_impossible_isolation_is_unsupported():
    res = resolve({"agents": ["codex"], "claude": False,
                   "consumers": ["~/.cursor/skills", "~/.kiro/skills"]})
    assert res["unsupported"], "asking to isolate codex while the hub fans out was granted silently"
    u = res["unsupported"][0]
    assert "shared store fans out" in u["why"]
    assert set(u["surface"]) == {"~/.cursor/skills", "~/.kiro/skills"}
    # a full, unscoped run claims no isolation, so nothing is unsupported
    full = resolve({"claude": True, "consumers": ["~/.cursor/skills"]})
    assert not full["unsupported"], "an unscoped run reported a false unsupported"


def main():
    case("a host-only agent selection touches only that agent's host file",
         t_host_only_selection_does_not_touch_other_hosts)
    case("--claude-only keeps only claude and writes no shared store",
         t_claude_only_keeps_only_claude)
    case("an unscoped run touches all hosts", t_no_agent_selection_is_all_hosts)
    case("the shared effect is named with its consumers, not hidden",
         t_shared_effect_is_named_not_hidden)
    case("an impossible isolation is explicitly unsupported",
         t_impossible_isolation_is_unsupported)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
