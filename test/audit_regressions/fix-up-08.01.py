#!/usr/bin/env python3
"""FIX-UP-08.01 — HostContext root precedence (sherlock audit, UP-08).

The finding: the host config root was always ~/<dir>, ignoring the documented
host env vars (CODEX_HOME, CLAUDE_CONFIG_DIR), so `update --agent codex` with a
custom CODEX_HOME still rewrote the default ~/.codex/AGENTS.md; and the Claude
guards hardcoded .claude.

The fix under test (lib/apply.js hostRoot + bin claudeRoot, driven through node):
* precedence: an explicit root > the documented host env var > ~/<dir>;
* the env value is used verbatim — spaces preserved, no shell;
* CODEX_HOME relocates ONLY the codex root; the claude/gemini defaults are
  untouched;
* host EXISTENCE is a separate probe (hostRoot resolves WHERE, not WHETHER);
* the bin's claudeRoot honours CLAUDE_CONFIG_DIR.

Standard library + node only.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
APPLY = os.path.join(ROOT, "lib", "apply.js")
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def host_root(agent, home, env, roots=None):
    js = ("const a=require(process.argv[1]);"
          "const T=a.TARGETS.find(t=>t.agent===process.argv[2]);"
          "console.log(JSON.stringify(a.hostRoot(T, process.argv[3],"
          "{env: JSON.parse(process.argv[4]), roots: JSON.parse(process.argv[5])})))")
    r = subprocess.run(["node", "-e", js, APPLY, agent, home,
                        json.dumps(env), json.dumps(roots or {})],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def t_default_platform_root():
    assert host_root("codex", "/home/u", {}) == "/home/u/.codex"
    assert host_root("claude", "/home/u", {}) == "/home/u/.claude"


def t_documented_env_wins_over_default():
    assert host_root("codex", "/home/u", {"CODEX_HOME": "/srv/codex"}) == "/srv/codex"
    assert host_root("claude", "/home/u", {"CLAUDE_CONFIG_DIR": "/srv/cc"}) == "/srv/cc"


def t_explicit_wins_over_env():
    r = host_root("codex", "/home/u", {"CODEX_HOME": "/env"}, roots={"codex": "/explicit"})
    assert r == "/explicit", "an explicit root did not beat the env var"


def t_spaces_preserved():
    assert host_root("codex", "/home/u", {"CODEX_HOME": "/tmp/my codex home"}) == \
        "/tmp/my codex home", "spaces in the env root were mangled"


def t_codex_env_does_not_move_claude():
    env = {"CODEX_HOME": "/srv/codex"}
    assert host_root("codex", "/home/u", env) == "/srv/codex"
    assert host_root("claude", "/home/u", env) == "/home/u/.claude", \
        "CODEX_HOME leaked into the claude root"
    assert host_root("gemini", "/home/u", env) == "/home/u/.gemini"


def t_existence_is_separate():
    # hostRoot resolves a path whether or not it exists — resolution != existence
    r = host_root("codex", "/home/u", {"CODEX_HOME": "/does/not/exist"})
    assert r == "/does/not/exist", "hostRoot conflated existence with resolution"


def t_bin_claude_root_honours_env():
    with open(BIN, encoding="utf-8") as fh:
        s = fh.read()
    assert "function claudeRoot()" in s
    assert "process.env.CLAUDE_CONFIG_DIR" in s
    assert "path.join(claudeRoot(), 'skills')" in s, \
        "the shadow base does not use claudeRoot()"
    # no stray hardcoded ~/.claude/skills path remains
    assert "os.homedir(), '.claude', 'skills'" not in s, \
        "a hardcoded .claude/skills path survived"


def main():
    case("the default is the platform root ~/<dir>", t_default_platform_root)
    case("a documented host env var beats the default", t_documented_env_wins_over_default)
    case("an explicit root beats the env var", t_explicit_wins_over_env)
    case("spaces in an env root are preserved", t_spaces_preserved)
    case("CODEX_HOME moves only codex, not claude/gemini", t_codex_env_does_not_move_claude)
    case("host existence is a separate probe from resolution", t_existence_is_separate)
    case("the bin's claudeRoot honours CLAUDE_CONFIG_DIR", t_bin_claude_root_honours_env)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
