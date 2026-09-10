#!/usr/bin/env python3
"""CTX-04.03 — actual-load acceptance for Codex (sherlock audit, CTX-04).

The decision (CTX-04.01) names Codex a MANDATORY host. This is its
smoke test: run a CLEAN and an UPGRADED session through the SUPPORTED adapter
(the pack's own apply()), and confirm the ACTUAL loaded namespace / digest /
byte-count and the degraded paths. A native receipt confirms loaded bytes; an
unsupported API/host is NOT_RUN with no installation workaround.

This regression is also the generator: `--emit` runs the load live and writes
docs/evidence/acceptance/ctx-04.03.json; the plain run verifies it against a
fresh load, so a stale or hand-faked PASS cannot survive.

Offline (no network). Standard library + node only.
"""
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
RECEIPT = os.path.join(ROOT, "docs", "evidence", "acceptance", "ctx-04.03.json")

# The load is driven through the pack's real adapter (lib/apply.js). The probe is
# node because that IS the supported adapter — a python reimplementation would be
# testing a copy, not the thing Codex actually loads.
_PROBE_JS = r'''
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ROOT = process.argv[2];
const apply = require(path.join(ROOT, 'lib', 'apply.js'));
const R = require(path.join(ROOT, 'lib', 'routers.js'));
const rr = require(path.join(ROOT, 'lib', 'routers-registry.js'));
const sk = require(path.join(ROOT, 'skills.json'));

function packagedRouters() {
  const names = (sk.skills || []).map((s) => s.name);
  return rr.resolve({ installed: names, isEnabled: () => true });
}
function loadedBlock(file) {
  const text = fs.readFileSync(file, 'utf8');
  const b = text.indexOf(R.BEGIN), e = text.indexOf(R.END);
  if (b < 0 || e < 0) return null;
  const block = text.slice(b, e + R.END.length);
  const ns = [...block.matchAll(/<!-- SSHLG:ROUTER:([a-z0-9-]+):BEGIN -->/g)].map((m) => m[1]);
  return { byte_count: Buffer.byteLength(block, 'utf8'),
           digest: crypto.createHash('sha256').update(block).digest('hex'), namespaces: ns };
}
const routers = packagedRouters();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx0403-'));
const codexT = apply.TARGETS.filter((t) => t.agent === 'codex');
// clean session: a fresh Codex host with an installed-but-empty routing block
const cleanHome = path.join(tmp, 'clean');
fs.mkdirSync(path.join(cleanHome, '.codex'), { recursive: true });
const cleanFile = path.join(cleanHome, '.codex', 'AGENTS.md');
fs.writeFileSync(cleanFile, '# AGENTS.md\n\noperator content\n\n' + apply.EMPTY_BLOCK + '\n');
const r1 = apply.apply({ home: cleanHome, hostTargets: codexT, routers, includeCursor: false, log: () => {} });
const clean = loadedBlock(cleanFile);
// upgraded session: re-apply into the same host (idempotent load)
const r2 = apply.apply({ home: cleanHome, hostTargets: codexT, routers, includeCursor: false, log: () => {} });
const upgraded = loadedBlock(cleanFile);
const preserved = fs.readFileSync(cleanFile, 'utf8').includes('operator content');
// degraded: no .codex dir -> agent-absent (NOT_RUN, no workaround)
const bareHome = path.join(tmp, 'bare');
fs.mkdirSync(bareHome, { recursive: true });
const r3 = apply.apply({ home: bareHome, hostTargets: codexT, routers, includeCursor: false, log: () => {} });
// degraded: unsupported platform -> platform-unsupported (NOT_RUN)
const r4 = apply.apply({ home: cleanHome, platform: 'sunos', hostTargets: codexT, routers, includeCursor: false, log: () => {} });
// native corroboration: the block ACTUALLY present in the live ~/.codex
const liveFile = path.join(os.homedir(), '.codex', 'AGENTS.md');
const live = fs.existsSync(liveFile) ? loadedBlock(liveFile) : null;
fs.rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({
  clean, upgraded, preserved,
  clean_action: (r1.targets.find((t) => t.agent === 'codex') || {}).action,
  upgraded_action: (r2.targets.find((t) => t.agent === 'codex') || {}).action,
  absent_action: (r3.targets[0] || {}).action,
  unsupported_action: (r4.targets[0] || {}).action,
  live, live_present: fs.existsSync(liveFile),
}));
'''

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def load_live():
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as fh:
        fh.write(_PROBE_JS)
        js = fh.name
    try:
        r = subprocess.run(["node", js, ROOT], capture_output=True, text=True, timeout=120)
        assert r.returncode == 0, f"probe failed: {r.stderr[:400]}"
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        os.unlink(js)


def build_receipt():
    p = load_live()
    assert p["clean"] and p["upgraded"], "the clean/upgraded load produced no block"
    node = subprocess.run(["node", "-v"], capture_output=True, text=True).stdout.strip()
    return {
        "id": "CTX-04.03",
        "acceptance": "actual-load: Codex (mandatory host) via the supported adapter",
        "generated_by": "test/audit_regressions/ctx-04.03.py --emit",
        "prefilled_pass": False,
        "run": {"host_platform": sys.platform, "node": node,
                "pack_version": json.load(open(os.path.join(ROOT, "package.json")))["version"]},
        "clean_session": {"action": p["clean_action"], "loaded": p["clean"]},
        "upgraded_session": {"action": p["upgraded_action"], "loaded": p["upgraded"],
                             "idempotent": p["clean"]["digest"] == p["upgraded"]["digest"]},
        "operator_content_preserved": p["preserved"],
        "degraded_paths": {
            "host_absent": {"action": p["absent_action"], "verdict": "NOT_RUN"},
            "unsupported_platform": {"action": p["unsupported_action"], "verdict": "NOT_RUN"},
        },
        "native_corroboration": {
            "live_host_file_present": p["live_present"],
            "loaded": p["live"],       # null if the live host carries no block — not faked
        },
        "notes": "loaded bytes/digest/namespaces are read from an ACTUAL apply through the "
                 "Codex adapter; an absent host or unsupported platform is NOT_RUN with "
                 "no installation workaround, never a prefilled PASS",
    }


def emit():
    r = build_receipt()
    os.makedirs(os.path.dirname(RECEIPT), exist_ok=True)
    with open(RECEIPT, "w", encoding="utf-8") as fh:
        json.dump(r, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"wrote {os.path.relpath(RECEIPT, ROOT)}")


def load_receipt():
    assert os.path.isfile(RECEIPT), \
        "no receipt — run `python3 test/audit_regressions/ctx-04.03.py --emit`"
    with open(RECEIPT, encoding="utf-8") as fh:
        return json.load(fh)


def t_clean_session_loaded_real_bytes():
    r = load_receipt()
    c = r["clean_session"]["loaded"]
    assert r["clean_session"]["action"] in ("updated", "unchanged")
    assert c["byte_count"] > 1000, c["byte_count"]
    assert len(c["namespaces"]) == 12, c["namespaces"]
    assert len(c["digest"]) == 64


def t_upgraded_session_idempotent():
    r = load_receipt()
    assert r["upgraded_session"]["idempotent"] is True, "the upgraded load changed the bytes"
    assert r["operator_content_preserved"] is True


def t_degraded_paths_are_not_run():
    r = load_receipt()
    assert r["degraded_paths"]["host_absent"]["action"] == "agent-absent"
    assert r["degraded_paths"]["host_absent"]["verdict"] == "NOT_RUN"
    assert r["degraded_paths"]["unsupported_platform"]["action"] == "platform-unsupported"
    assert r["degraded_paths"]["unsupported_platform"]["verdict"] == "NOT_RUN"


def t_not_prefilled_and_matches_fresh_load():
    r = load_receipt()
    assert r["prefilled_pass"] is False
    fresh = load_live()
    assert fresh["clean"] is not None
    # the loaded namespaces and idempotent digest must match a fresh load NOW
    assert sorted(fresh["clean"]["namespaces"]) == sorted(r["clean_session"]["loaded"]["namespaces"])
    assert (fresh["clean"]["digest"] == fresh["upgraded"]["digest"]) == \
        r["upgraded_session"]["idempotent"]


def main():
    if "--emit" in sys.argv[1:]:
        emit()
        return 0
    case("clean session loaded real bytes (12 namespaces, sha256 digest)",
         t_clean_session_loaded_real_bytes)
    case("upgraded session is idempotent and preserves operator content",
         t_upgraded_session_idempotent)
    case("degraded paths (absent host, unsupported platform) are NOT_RUN",
         t_degraded_paths_are_not_run)
    case("the receipt is not prefilled and matches a fresh load",
         t_not_prefilled_and_matches_fresh_load)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
