#!/usr/bin/env python3
"""FIX-UP-07.01 — read-only provider inventory separates active from historical
(sherlock audit, UP-07).

The finding: a narrow filesystem sweep read 336 SKILL.md candidates across the
hub and the Claude/Codex plugin caches and counted historical cache versions as
if each were an active provider. host/scope/namespace/realpath/digest and the
installed/enabled/applicable/loaded states were not separated, so an old cache
plus one enabled version read as a duplicate.

The fix under test:
* skills.json's Codex entry records that Codex keeps a native plugin cache
  whose historical copies are NOT the active provider, and that native install/
  update is UNSUPPORTED without a host API;
* bin/sshlg-skills.js resolveProviders() groups candidates by (host,scope,
  skillId), picks the single installed+enabled+applicable one as active, files
  the rest as historical (so old cache + one enabled = ONE skill), and reports
  UNKNOWN precedence when more than one is enabled.

Node is already required by this repo. Standard library + node only.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BIN = os.path.join(ROOT, "bin", "sshlg-skills.js")
SKILLS = os.path.join(ROOT, "skills.json")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def resolve(candidates):
    js = ("const p=require(process.argv[1]);"
          "console.log(JSON.stringify(p.resolveProviders(JSON.parse(process.argv[2]))));")
    r = subprocess.run(["node", "-e", js, BIN, json.dumps(candidates)],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout)


def t_old_cache_plus_enabled_is_one_skill():
    out = resolve([
        {"skillId": "vision", "host": "codex", "scope": "user", "realpath": "/cache/v28/vision",
         "digest": "a", "version": "0.28.0", "installed": True, "enabled": False, "applicable": True},
        {"skillId": "vision", "host": "codex", "scope": "user", "realpath": "/hub/vision",
         "digest": "b", "version": "0.29.0", "installed": True, "enabled": True, "applicable": True,
         "loaded": True},
    ])
    assert len(out) == 1, f"an old cache + one enabled version resolved to {len(out)} skills, not 1"
    g = out[0]
    assert g["state"] == "active" and g["active"]["version"] == "0.29.0", \
        "the enabled version is not the active provider"
    assert len(g["historical"]) == 1 and g["candidateCount"] == 2, \
        "the historical cache was not filed as historical"


def t_unknown_precedence_is_reported_not_guessed():
    out = resolve([
        {"skillId": "x", "host": "h", "scope": "user", "realpath": "/a", "digest": "a",
         "installed": True, "enabled": True, "applicable": True},
        {"skillId": "x", "host": "h", "scope": "user", "realpath": "/b", "digest": "b",
         "installed": True, "enabled": True, "applicable": True},
    ])
    assert out[0]["precedence"] == "UNKNOWN", "two enabled providers were silently deduped"
    assert out[0]["active"] is None, "an active provider was guessed under UNKNOWN precedence"


def t_states_are_separated():
    out = resolve([
        {"skillId": "y", "host": "h", "scope": "user", "realpath": "/y", "digest": "y",
         "installed": True, "enabled": False, "applicable": True},
    ])
    assert out[0]["state"] == "installed-not-enabled", "installed and enabled are conflated"
    none = resolve([
        {"skillId": "z", "host": "h", "scope": "user", "realpath": "/z", "digest": "z",
         "installed": False, "enabled": False, "applicable": False},
    ])
    assert none[0]["state"] == "none", "a not-installed candidate was treated as present"


def t_different_hosts_do_not_merge():
    out = resolve([
        {"skillId": "v", "host": "codex", "scope": "user", "realpath": "/c/v", "digest": "c",
         "installed": True, "enabled": True, "applicable": True},
        {"skillId": "v", "host": "claude", "scope": "user", "realpath": "/cl/v", "digest": "d",
         "installed": True, "enabled": True, "applicable": True},
    ])
    assert len(out) == 2, "two hosts' providers of one skill were merged into one"


def t_skills_json_records_codex_cache():
    d = json.loads(open(SKILLS, encoding="utf-8").read())
    codex = next(a for a in d["agents"] if a["id"] == "codex")
    note = codex["note"]
    assert "native plugin cache" in note, "the Codex native plugin cache is not recorded"
    assert "NOT the active provider" in note, "historical cache ≠ active is not stated"
    assert "UNSUPPORTED" in note, "the no-host-API UNSUPPORTED rule is missing"


def main():
    case("an old cache + one enabled version resolves to one skill",
         t_old_cache_plus_enabled_is_one_skill)
    case("an undecidable precedence is reported UNKNOWN, not guessed",
         t_unknown_precedence_is_reported_not_guessed)
    case("installed / enabled / none states are separated", t_states_are_separated)
    case("providers on different hosts do not merge", t_different_hosts_do_not_merge)
    case("skills.json records the Codex native cache and UNSUPPORTED rule",
         t_skills_json_records_codex_cache)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
