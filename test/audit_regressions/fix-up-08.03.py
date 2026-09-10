#!/usr/bin/env python3
"""FIX-UP-08.03 — platform scope fixtures with explicit capability verdicts
(sherlock audit, UP-08).

The fix under test (lib/apply.js hostRootVerdict + apply's platform gate):
* Windows/linux/darwin resolve to the home-relative root (supported);
* XDG-style explicit config via the documented env var is honoured on any
  platform;
* an UNKNOWN platform with no explicit/env root is NOT silently given the
  Linux default — it is refused with a verdict, and apply() records
  'platform-unsupported' rather than writing to a neighbouring profile;
* a missing host dir is 'agent-absent' (unchanged), distinct from
  platform-unsupported.

Standard library + node only.
"""
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
APPLY = os.path.join(ROOT, "lib", "apply.js")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def verdict(agent, home, env, platform, roots=None):
    js = ("const a=require(process.argv[1]);"
          "const T=a.TARGETS.find(t=>t.agent===process.argv[2]);"
          "console.log(JSON.stringify(a.hostRootVerdict(T, process.argv[3],"
          "{env: JSON.parse(process.argv[4]), platform: process.argv[5],"
          " roots: JSON.parse(process.argv[6])})))")
    r = subprocess.run(["node", "-e", js, APPLY, agent, home, json.dumps(env),
                        platform, json.dumps(roots or {})],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def t_known_platforms_supported():
    for plat in ("linux", "darwin", "win32"):
        v = verdict("codex", "/home/u", {}, plat)
        assert v["supported"] is True and v["root"] == "/home/u/.codex", \
            f"{plat} not supported: {v}"
        assert v["source"] == "platform-default"


def t_explicit_env_on_any_platform():
    v = verdict("codex", "/home/u", {"CODEX_HOME": "/xdg/codex"}, "sunos")
    assert v["supported"] is True and v["root"] == "/xdg/codex" and v["source"] == "env", \
        "an explicit env root was not honoured on an unknown platform"


def t_unknown_platform_refused():
    v = verdict("codex", "/home/u", {}, "sunos")
    assert v["supported"] is False and v["root"] is None, \
        "an unknown platform silently fell back to the Linux default — the finding"
    assert "unknown platform 'sunos'" in v["reason"]
    assert "CODEX_HOME" in v["reason"]


def t_explicit_root_wins_on_unknown():
    v = verdict("codex", "/home/u", {}, "sunos", roots={"codex": "/explicit"})
    assert v["supported"] is True and v["root"] == "/explicit"


def t_apply_records_platform_unsupported():
    """apply() must not write on an unknown platform — it records the verdict."""
    home = tempfile.mkdtemp()
    js = ("const a=require(process.argv[1]);"
          "const res=a.apply({home: process.argv[2], platform: 'sunos', env: {},"
          "  routers: {}, log: ()=>{}});"
          "console.log(JSON.stringify(res.targets.map(r=>({action:r.action, file:r.file}))))")
    r = subprocess.run(["node", "-e", js, APPLY, home],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:400]}"
    out = json.loads(r.stdout.strip().splitlines()[-1])
    host_rows = [x for x in out if "cursor" not in (x.get("file") or "").lower()]
    assert host_rows, "apply produced no host rows"
    assert all(x["action"] == "platform-unsupported" for x in host_rows), \
        f"apply wrote on an unknown platform: {host_rows}"
    # and nothing was written to ~/.codex etc.
    assert not os.path.exists(os.path.join(home, ".codex")), \
        "apply created a host dir on an unknown platform"


def main():
    case("known platforms (linux/darwin/win32) are supported", t_known_platforms_supported)
    case("an explicit env root is honoured on any platform", t_explicit_env_on_any_platform)
    case("an unknown platform is refused, not given the Linux default",
         t_unknown_platform_refused)
    case("an explicit root wins even on an unknown platform", t_explicit_root_wins_on_unknown)
    case("apply records platform-unsupported and writes nothing", t_apply_records_platform_unsupported)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
