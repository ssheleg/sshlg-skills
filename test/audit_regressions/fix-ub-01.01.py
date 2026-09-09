#!/usr/bin/env python3
"""FIX-UB-01.01 — the bundle audit stops selling a static catalog count as a
per-session price (sherlock audit, UB-01).

The finding: the sum of static descriptions + command descriptions + routing
block was printed as "paid in every session of every project" — but the sum
cannot know the active host, listing truncation, on-demand loading or
post-compaction reuse. The instrument claimed a completeness it does not have.

The fix under test:
* the static metric is named raw_catalog_cl100k and printed as "a static
  count, not a session price"; the every-session claim is gone;
* measured_prompt_cost exists as a SEPARATE metric, fed only by a runtime
  trace (SSHLG_PROMPT_TRACE: host, host_version, exposed_listing), printed
  beside its host and version, with the catalog-vs-exposed delta;
* a missing runtime sample prints the word `unknown`, never the static count
  wearing a new name — and the two metrics never share a field or label.

Runs the real script when tiktoken is importable; otherwise the run-level
checks report NOT_RUN (never PASS) and the source-level checks still bind.
"""
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SCRIPT = os.path.join(ROOT, "test", "audit_bundle.py")

failures = []
not_run = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def src():
    with open(SCRIPT, encoding="utf-8") as fh:
        return fh.read()


def have_tiktoken():
    try:
        import tiktoken  # noqa: F401
        return True
    except ImportError:
        return False


def run_bundle(env_extra=None):
    env = dict(os.environ)
    env.setdefault("TIKTOKEN_CACHE_DIR",
                   os.path.expanduser("~/.cache/make-skill/tiktoken"))
    env.update(env_extra or {})
    return subprocess.run([sys.executable, SCRIPT], capture_output=True,
                          text=True, timeout=300, env=env, cwd=ROOT)


def t_every_session_claim_is_gone():
    s = src()
    assert "every session of every project" not in s, \
        "the every-session completeness claim survived — the finding itself"
    assert "raw_catalog_cl100k" in s, "the static metric is not named for what it is"
    assert "measured_prompt_cost" in s, "no separate runtime metric exists"
    assert "a budget, not a\n            quality verdict" in s or \
           "a budget, not a quality verdict" in " ".join(s.split()), \
        "catalog size is judged as quality again"


def t_metrics_never_share_a_label():
    s = src()
    # the static label line and the measured label line are distinct prints
    assert "RAW-CATALOG" in s and "MEASURED" in s
    assert "static count, not a session price" in s
    assert "the static count above is NOT it" in s, \
        "a missing sample no longer refuses to substitute the static count"


def t_missing_sample_prints_unknown():
    if not have_tiktoken():
        not_run.append("tiktoken absent — live run NOT_RUN (never PASS)")
        return
    r = run_bundle({"SSHLG_PROMPT_TRACE": ""})
    out = r.stdout
    assert "raw_catalog_cl100k =" in out and "not a session price" in out
    assert "measured_prompt_cost = unknown" in out, \
        f"no unknown for the missing sample:\n{out[-500:]}"
    assert "every session of every project" not in out


def t_trace_yields_measured_cost_with_host():
    if not have_tiktoken():
        not_run.append("tiktoken absent — trace run NOT_RUN (never PASS)")
        return
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
        json.dump({"host": "claude-code", "host_version": "3.2.1",
                   "exposed_listing": "vision: writes the product vision.\n"
                                      "task-pipeline: carries a change."}, fh)
        path = fh.name
    try:
        r = run_bundle({"SSHLG_PROMPT_TRACE": path})
        out = r.stdout
        assert "measured_prompt_cost =" in out and "unknown" not in \
            out.split("MEASURED")[1].split("\n")[0], "the trace did not yield a number"
        assert "claude-code 3.2.1" in out, "the host and version are not printed beside it"
        assert "delta" in out, "the catalog-vs-exposed delta is not printed"
        raw = [l for l in out.splitlines() if "raw_catalog_cl100k =" in l]
        mea = [l for l in out.splitlines() if "measured_prompt_cost =" in l]
        assert raw and mea and raw[0] != mea[0], "the two metrics share one line/label"
    finally:
        os.unlink(path)


def main():
    case("the every-session claim is gone; both metrics are named",
         t_every_session_claim_is_gone)
    case("the static and measured metrics never share a label",
         t_metrics_never_share_a_label)
    case("a missing runtime sample prints unknown", t_missing_sample_prints_unknown)
    case("a runtime trace yields measured cost beside its host",
         t_trace_yields_measured_cost_with_host)
    for n in not_run:
        print(f"  NOT_RUN  {n}")
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
