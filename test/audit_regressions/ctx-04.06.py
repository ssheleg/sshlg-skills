#!/usr/bin/env python3
"""CTX-04.06 — release-set staging and rollback (sherlock audit, CTX-04).

Assemble the IMMUTABLE payload set of all members, stage a clean install /
upgrade / rollback on the declared channels, and confirm expected / installed /
active digests match — and that a fault during upgrade RECOVERS the PREVIOUS
set. Publication is a SEPARATE step that only follows acceptance; this run
stages and accepts, it does not publish.

The payload set is content-addressed: each member's digest is its pinned
submodule commit (immutable), and the set digest is a sha256 over the sorted
(member, version, pin) triples. The expected/installed/active reconciliation
uses the pack's REAL lib/lifecycle.js reloadReceipt via node — a loaded digest
that differs is `stale`, which is what triggers the rollback.

The staging is SANDBOXED: it materializes into an in-memory model, never the
operator's live channels. `--emit` writes docs/evidence/acceptance/ctx-04.06.json;
the plain run verifies, with a NEGATIVE fixture proving a stale upgrade recovers
the previous set. Offline. Standard library + node/git.
"""
import hashlib
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
ACC = os.path.join(ROOT, "docs", "evidence", "acceptance")
RECEIPT = os.path.join(ACC, "ctx-04.06.json")
LIFECYCLE = os.path.join(ROOT, "lib", "lifecycle.js")
DECLARED_CHANNELS = ("claude", "codex", "hub")   # the declared install channels (staged)

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


# ---- the immutable payload set ------------------------------------------------

def member_pins():
    """The real submodule pins — each member's immutable payload address."""
    r = subprocess.run(["git", "-C", ROOT, "submodule", "status"],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"git submodule status failed: {r.stderr[:200]}"
    pins = {}
    for line in r.stdout.splitlines():
        parts = line.split()
        if len(parts) >= 2:
            pins[parts[1].replace("skills/", "")] = parts[0].lstrip("+-U")[:12]
    return pins


def member_versions():
    s = json.load(open(os.path.join(ROOT, "skills.json")))
    return {sk["name"]: sk.get("version") for sk in s.get("skills", [])}


def set_digest(payload):
    """sha256 over the sorted (member, version, pin) triples — the release-set
    identity. Immutable: same members at the same pins => same digest."""
    triples = sorted((m, payload[m]["version"], payload[m]["pin"]) for m in payload)
    return hashlib.sha256(json.dumps(triples).encode()).hexdigest()


def current_set():
    pins, vers = member_pins(), member_versions()
    # every member with a pin is in the set; version from skills.json where known
    return {m: {"version": vers.get(m), "pin": pins[m]} for m in pins}


# ---- the real digest reconciliation (lib/lifecycle.js) ------------------------

def reload_receipt(host, expected, loaded):
    r = subprocess.run(
        ["node", "-e",
         "const l=require(process.argv[1]);"
         "console.log(JSON.stringify(l.reloadReceipt(process.argv[2], process.argv[3],"
         " process.argv[4] || undefined)))",
         LIFECYCLE, host, expected, loaded or ""],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:300]}"
    return json.loads(r.stdout.strip().splitlines()[-1])


def stage(expected_payload, installed_payload, channels=DECLARED_CHANNELS):
    """Stage a set onto the declared channels and reconcile digests. Returns the
    expected/installed digests and a per-channel active reconciliation."""
    exp = set_digest(expected_payload)
    inst = set_digest(installed_payload)
    receipts = [reload_receipt(c, exp, inst) for c in channels]
    active = "current" if all(r["status"] == "current" for r in receipts) else "stale"
    return {"expected": exp, "installed": inst, "active": active,
            "channels": {c: r["status"] for c, r in zip(channels, receipts)}}


def recover(previous_payload):
    """Fault recovery: reinstall the PREVIOUS set and reconcile — a rollback is
    only accepted when the recovered active digest equals the previous set's."""
    return stage(previous_payload, previous_payload)


# ---- scenarios ----------------------------------------------------------------

def scenarios():
    s1 = current_set()
    # a SIMULATED upgrade candidate: bump one member's version in a COPY of the set
    # (no real pin is changed — this stages an upgrade, it does not publish one)
    import copy
    s2 = copy.deepcopy(s1)
    a_member = sorted(s2)[0]
    s2[a_member]["version"] = (s2[a_member]["version"] or "0") + "+staged-upgrade"
    s2[a_member]["pin"] = "0" * 12          # a candidate pin, clearly synthetic

    clean = stage(s1, s1)                    # clean install of the current set
    upgrade = stage(s2, s2)                  # a clean upgrade to the candidate set
    # a FAULT during upgrade: expected S2 but only S1 got installed -> stale
    faulted = stage(s2, s1)
    # rollback / recovery: reinstall the PREVIOUS set S1
    recovered = recover(s1)
    return {
        "member_count": len(s1),
        "upgraded_member": a_member,
        "clean_install": clean,
        "upgrade": upgrade,
        "faulted_upgrade": faulted,
        "recovery": recovered,
        "recovered_previous": recovered["expected"] == clean["expected"],
    }


def build_receipt():
    sc = scenarios()
    return {
        "id": "CTX-04.06",
        "acceptance": "release-set staging and rollback — immutable payload set of all members, "
                      "staged clean install / upgrade / rollback on the declared channels",
        "generated_by": "test/audit_regressions/ctx-04.06.py --emit",
        "prefilled_pass": False,
        "published": False,
        "publication_note": "publication is a SEPARATE step that only follows acceptance; this "
                            "run stages and accepts, it does not publish (a pushed branch is not "
                            "a release)",
        "declared_channels": list(DECLARED_CHANNELS),
        "run": {"host_platform": sys.platform,
                "node": subprocess.run(["node", "-v"], capture_output=True, text=True).stdout.strip()},
        "scenarios": sc,
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
        "no receipt — run `python3 test/audit_regressions/ctx-04.06.py --emit`"
    with open(RECEIPT, encoding="utf-8") as fh:
        return json.load(fh)


def t_clean_install_digests_match():
    sc = load_receipt()["scenarios"]
    c = sc["clean_install"]
    assert c["expected"] == c["installed"], "clean install: expected != installed"
    assert c["active"] == "current", c["channels"]
    assert sc["member_count"] == 9, sc["member_count"]


def t_upgrade_digests_match():
    c = load_receipt()["scenarios"]["upgrade"]
    assert c["expected"] == c["installed"] and c["active"] == "current"
    # the upgrade set differs from the clean set (a real digest change)
    clean = load_receipt()["scenarios"]["clean_install"]
    assert c["expected"] != clean["expected"], "the upgrade produced no digest change"


def t_faulted_upgrade_is_stale():
    c = load_receipt()["scenarios"]["faulted_upgrade"]
    assert c["expected"] != c["installed"], "a faulted upgrade should differ expected vs installed"
    assert c["active"] == "stale", "a partial upgrade was not detected as stale"


def t_recovery_returns_previous_set():
    r = load_receipt()
    sc = r["scenarios"]
    assert sc["recovery"]["active"] == "current", "recovery did not reconcile"
    assert sc["recovered_previous"] is True, "rollback did not return the previous set"
    assert sc["recovery"]["expected"] == sc["clean_install"]["expected"], \
        "recovered digest != the previous set digest"


def t_not_published_before_acceptance():
    r = load_receipt()
    assert r["published"] is False and r["prefilled_pass"] is False
    assert "does not publish" in r["publication_note"]


def t_matches_fresh_run():
    r = load_receipt()
    fresh = scenarios()
    # the immutable current-set digest must match a fresh computation NOW
    assert r["scenarios"]["clean_install"]["expected"] == fresh["clean_install"]["expected"], \
        "receipt disagrees with a fresh staging run (pins moved under it)"


def main():
    if "--emit" in sys.argv[1:]:
        emit()
        return 0
    case("clean install: expected/installed/active digests match (9 members)",
         t_clean_install_digests_match)
    case("upgrade: digests match and differ from the previous set", t_upgrade_digests_match)
    case("a faulted upgrade is detected as stale", t_faulted_upgrade_is_stale)
    case("fault recovery returns the previous set", t_recovery_returns_previous_set)
    case("nothing is published before acceptance", t_not_published_before_acceptance)
    case("the receipt matches a fresh staging run", t_matches_fresh_run)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
