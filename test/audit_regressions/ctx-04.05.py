#!/usr/bin/env python3
"""CTX-04.05 — final parent proof closure (sherlock audit, CTX-04).

A parent does NOT close on a plan/leaf count. Its ORIGINAL acceptance is
re-checked on the integrated tree from the FOCUSED LEAF RECEIPTS, across
cross-module seams, and an untested (NOT_RUN) MANDATORY criterion BLOCKS the
release.

This regression reads the acceptance receipts that CTX-04's leaves actually
produced (docs/evidence/acceptance/ctx-04.0{1..4}.json), derives each
criterion's real status, and computes closure by the rule above — never by
counting. `--emit` writes docs/evidence/acceptance/ctx-04.05.json; the plain run
verifies, including NEGATIVE fixtures that prove a NOT_RUN mandatory criterion
and a count-only closure are both refused.

Offline. Standard library only.
"""
import json
import os
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
ACC = os.path.join(ROOT, "docs", "evidence", "acceptance")
RECEIPT = os.path.join(ACC, "ctx-04.05.json")

MANDATORY_TIER = ("claude", "codex")

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def _load(name):
    with open(os.path.join(ACC, name), encoding="utf-8") as fh:
        return json.load(fh)


# ---- status derivation from a real leaf receipt -------------------------------

def status_of(name):
    """Derive a criterion's status from its actual receipt. RAN only when the
    receipt shows a real run; NOT_RUN when the receipt says so; MISSING when the
    receipt is absent — never inferred as PASS."""
    path = os.path.join(ACC, name)
    if not os.path.isfile(path):
        return "MISSING"
    r = _load(name)
    if r.get("prefilled_pass") is True:
        return "PREFILLED"                      # a prefilled PASS is not a run
    if name == "ctx-04.01.json":
        return "RAN" if r.get("hosts") else "MISSING"
    if name in ("ctx-04.02.json", "ctx-04.03.json"):
        # an actual-load receipt RAN when the clean session loaded real bytes
        loaded = r.get("clean_session", {}).get("loaded")
        return "RAN" if loaded and loaded.get("byte_count", 0) > 0 else "NOT_RUN"
    if name == "ctx-04.04.json":
        # cross-session: the offline contract always holds; native is corroboration
        contract = r.get("offline_contract", {}).get("cases", {})
        return "RAN" if contract.get("normal", {}).get("accepted") is True else "NOT_RUN"
    return "MISSING"


# ---- the closure rule (no leaf counting) --------------------------------------

def close_parent(criteria):
    """criteria: list of {name, receipt, status, mandatory}. Returns
    {closes, release_allowed, why}. A mandatory criterion that is not RAN blocks
    both closure and release; counting is never consulted."""
    blockers = [c for c in criteria if c["mandatory"] and c["status"] != "RAN"]
    closes = not blockers
    return {
        "closes": closes,
        "release_allowed": closes,
        "blockers": [f"{c['name']} ({c['status']})" for c in blockers],
    }


def ctx04_criteria():
    return [
        {"name": "support matrix decided", "receipt": "ctx-04.01.json",
         "status": status_of("ctx-04.01.json"), "mandatory": True},
        {"name": "actual-load: claude", "receipt": "ctx-04.02.json",
         "status": status_of("ctx-04.02.json"), "mandatory": True},
        {"name": "actual-load: codex", "receipt": "ctx-04.03.json",
         "status": status_of("ctx-04.03.json"), "mandatory": True},
        {"name": "cross-session integration", "receipt": "ctx-04.04.json",
         "status": status_of("ctx-04.04.json"), "mandatory": True},
    ]


def seams():
    """Cross-module seam: every mandatory host named in the CTX-04.01 matrix has
    an actual-load receipt that RAN."""
    matrix = _load("ctx-04.01.json")
    mand = set(matrix["tiers"]["mandatory"])
    load_ran = {"claude": status_of("ctx-04.02.json") == "RAN",
                "codex": status_of("ctx-04.03.json") == "RAN"}
    return {h: load_ran.get(h, False) for h in mand}, all(load_ran.get(h) for h in mand)


def build_receipt():
    crit = ctx04_criteria()
    decision = close_parent(crit)
    seam_map, seam_ok = seams()
    return {
        "id": "CTX-04.05",
        "closure": "final parent proof — each parent's original acceptance re-checked on the "
                   "integrated tree from focused leaf receipts, across cross-module seams",
        "generated_by": "test/audit_regressions/ctx-04.05.py --emit",
        "prefilled_pass": False,
        "rule": "a parent does not close on plan/leaf count; an untested (NOT_RUN) mandatory "
                "criterion blocks release",
        "mandatory_tier": list(MANDATORY_TIER),
        "parents": [{"id": "CTX-04", "criteria": crit, **decision, "closed_by_count_alone": False}],
        "seams": {"matrix_mandatory_hosts_have_actual_load": seam_map, "ok": seam_ok},
        "release_allowed": decision["release_allowed"],
    }


def emit():
    r = build_receipt()
    os.makedirs(ACC, exist_ok=True)
    with open(RECEIPT, "w", encoding="utf-8") as fh:
        json.dump(r, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"wrote {os.path.relpath(RECEIPT, ROOT)}")


def load_receipt():
    assert os.path.isfile(RECEIPT), \
        "no receipt — run `python3 test/audit_regressions/ctx-04.05.py --emit`"
    with open(RECEIPT, encoding="utf-8") as fh:
        return json.load(fh)


def t_ctx04_closes_on_real_receipts():
    r = load_receipt()
    p = r["parents"][0]
    assert p["id"] == "CTX-04"
    assert all(c["status"] == "RAN" for c in p["criteria"]), \
        [f"{c['name']}={c['status']}" for c in p["criteria"]]
    assert p["closes"] is True and r["release_allowed"] is True
    assert p["closed_by_count_alone"] is False


def t_not_run_mandatory_blocks_release():
    # a mandatory criterion that is NOT_RUN blocks both closure and release
    crit = [{"name": "actual-load: codex", "receipt": "x", "status": "NOT_RUN", "mandatory": True},
            {"name": "matrix", "receipt": "y", "status": "RAN", "mandatory": True}]
    d = close_parent(crit)
    assert d["closes"] is False and d["release_allowed"] is False
    assert any("codex" in b for b in d["blockers"])


def t_missing_receipt_is_not_pass():
    crit = [{"name": "actual-load: claude", "receipt": "z", "status": "MISSING", "mandatory": True}]
    d = close_parent(crit)
    assert d["closes"] is False, "a missing mandatory receipt closed the parent"


def t_count_alone_does_not_close():
    # 100 'done' leaves but no RAN mandatory receipt -> still blocked. Closure
    # never consults a count, so a large done-count cannot substitute.
    crit = [{"name": "actual-load: claude", "receipt": "z", "status": "NOT_RUN", "mandatory": True}]
    d = close_parent(crit)
    assert d["closes"] is False
    r = load_receipt()
    assert r["parents"][0]["closed_by_count_alone"] is False


def t_seam_mandatory_hosts_have_actual_load():
    r = load_receipt()
    assert r["seams"]["ok"] is True
    for host in MANDATORY_TIER:
        assert r["seams"]["matrix_mandatory_hosts_have_actual_load"][host] is True, \
            f"{host} is in the mandatory tier but has no actual-load that RAN"


def t_receipt_matches_fresh_build():
    r = load_receipt()
    fresh = build_receipt()
    assert r["parents"][0]["closes"] == fresh["parents"][0]["closes"]
    assert r["release_allowed"] == fresh["release_allowed"]
    assert [c["status"] for c in r["parents"][0]["criteria"]] == \
        [c["status"] for c in fresh["parents"][0]["criteria"]], "receipt disagrees with a fresh build"


def main():
    if "--emit" in sys.argv[1:]:
        emit()
        return 0
    case("CTX-04 closes on real leaf receipts (all mandatory RAN)", t_ctx04_closes_on_real_receipts)
    case("a NOT_RUN mandatory criterion blocks release", t_not_run_mandatory_blocks_release)
    case("a missing mandatory receipt is never a PASS", t_missing_receipt_is_not_pass)
    case("a leaf count alone does not close a parent", t_count_alone_does_not_close)
    case("seam: every mandatory host in the matrix has an actual-load that RAN",
         t_seam_mandatory_hosts_have_actual_load)
    case("the receipt matches a fresh build", t_receipt_matches_fresh_build)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
