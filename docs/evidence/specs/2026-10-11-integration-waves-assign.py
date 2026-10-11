#!/usr/bin/env python3
"""Build the integration-waves inventory from the wave-0 survey, deterministically.

Reads the raw survey (docs/evidence/specs/2026-10-11-integration-waves-raw/*.jsonl) and
the NODE/WAVE tables below, writes 2026-10-11-integration-waves-inventory.json and prints
the counts per wave and per node. A re-cut is a diff to the tables and a re-run, never a
hand edit of the JSON (task-pipeline references/waves.md, "Assign nodes and waves with a
committed script").

    python3 docs/evidence/specs/2026-10-11-integration-waves-assign.py           # write
    python3 docs/evidence/specs/2026-10-11-integration-waves-assign.py --check   # exit 1 on drift
"""
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE / "2026-10-11-integration-waves-raw"
OUT = HERE / "2026-10-11-integration-waves-inventory.json"

# Canvas nodes (docs/evidence/specs/2026-10-11-integration-waves-canvas.md owns their target state).
NODES = {
    "N01": "context budget — per-prompt note, SessionStart, routing block, description share",
    "N02": "hook and credential integrity — matcher drift, secret remedy path, update lock, state.json interface",
    "N03": "continuity layering — handoff map, Observatory checkpoint/handoff, session-handoff/1, backlog-sources, release approval mode, Fabric contract fixture",
    "N04": "coordination — agent-sync run identity, lease residue, long leases, vault token, coordination.md conformance",
    "N05": "delegation and interop doctrine — trust tiers, fabric-interop jobs, Fabric adapter back-links",
    "N06": "task-pipeline hygiene — temp residue, CI size and time, description budget, ledgers",
    "N07": "hosts and evals — skill-search evals, routing eval, compatibility cut",
    "N08": "family gates — board parse, tag reachability, package contents, member handoffs",
    "N09": "estate and cross-product asks — wiki estate map, Fabric/Observatory owners",
    "N10": "operator decisions — plugins, sign-ins, link prune, marks, confirmations, disk",
}

# Waves of this release. "program" = carried on the canvas to the next release.
WAVES = {
    1: "hub skeleton: N01 + N02 (hub code, hooks reinstalled, hub release)",
    2: "task-pipeline: N06 + N03 (one member release)",
    3: "agent-sync: N04 (one member release)",
    4: "agent-stack + make-skill: N05 + N07 + residue checks (member releases)",
    5: "hub close: N08 + compatibility cut + N09 asks + pins + hub release + graph",
}

# Explicit placements by (owner, id). Owner is the member name or "hub".
EXPLICIT = {
    # hub board
    ("hub", "B-29"): ("N10", "operator"),
    ("hub", "B-84"): ("N01", 5),
    ("hub", "B-108"): ("N08", 5),
    ("hub", "B-109"): ("N08", 5),
    ("hub", "B-143"): ("N10", "operator"),
    ("hub", "B-144"): ("N07", 4),
    ("hub", "B-145"): ("N10", "operator"),
    ("hub", "B-146"): ("N10", "operator"),
    ("hub", "B-147"): ("N07", 4),
    ("hub", "B-148"): ("N07", 5),
    ("hub", "B-154"): ("N06", 2),
    ("hub", "HK-05"): ("N06", 2),
    ("hub", "HK-13"): ("N10", "operator"),
    # task-pipeline board rows inside this release
    ("task-pipeline", "B-154"): ("N06", 2),
    ("task-pipeline", "HK-05"): ("N06", 2),
    ("task-pipeline", "B-100"): ("N06", 2),
    ("task-pipeline", "B-120"): ("N06", 2),
    # agent-sync: the whole board closes in its wave
    ("agent-sync", "AS-07"): ("N04", 3),
    ("agent-sync", "AS-08"): ("N04", 3),
    ("agent-sync", "AS-09"): ("N04", 3),
    ("agent-sync", "AS-10"): ("N04", 3),
    ("agent-sync", "AS-11"): ("N04", 3),
    ("agent-sync", "AS-14"): ("N04", 3),
    # make-skill / agent-stack residue checks share the residue seam with N06
    ("make-skill", "MS-05"): ("N06", 4),
    ("make-skill", "B-147"): ("N07", 4),
    ("make-skill", "B-148"): ("N07", 5),
    ("agent-stack", "AG-06a"): ("N06", 4),
    ("agent-stack", "AG-06b"): ("N06", 4),
}

# NEW findings: first matching (owner-regex, summary-regex) wins.
RULES = [
    (r"^multi", r".", ("N01", 1)),
    (r"agent-sync", r".", ("N04", 3)),
    (r"agent-stack", r"tier|fabric-interop|degraded|adapter|creating-fabric|delegation|Fabric", ("N05", 4)),
    (r"agent-stack", r"description", ("N05", 4)),
    (r"make-skill", r"HANDOFF|v0\.30", ("N08", 4)),
    (r"make-skill", r".", ("N07", 4)),
    (r"task-pipeline", r"checkpoint|handoff_|session-handoff|execution-packet|backlog-sources|approval|taskPipeline|Observatory", ("N03", 2)),
    (r"task-pipeline", r"mkdtemp|tp-b80|tp-stage|task-pipeline-test", ("N06", 2)),
    (r"task-pipeline", r"Confirmed=never|stale remote|HANDOFF|branches", ("N06", 2)),
    (r"fabric-agent-contract", r"execution-packet", ("N03", 2)),
    (r"fabric-agent-contract", r"coordination", ("N04", 3)),
    (r"passioncode-ai/fabric$", r".", ("N03", 2)),
    (r"fabric-workspace", r".", ("N09", 5)),
    (r"fabric-dashboards", r".", ("N02", 1)),
    (r"project-observatory", r".", ("N09", 5)),
    (r"obsidian|wiki", r".", ("N09", 5)),
    (r"sshlg-skills", r"handoff mechanisms|Four handoff", ("N03", 2)),
    (r"sshlg-skills", r"routing note|SessionStart|Skill-listing|listing budget", ("N01", 1)),
    (r"sshlg-skills", r"use_secret|secrets\.js|remedy", ("N02", 1)),
    (r"sshlg-skills|hub", r"graph|stale", ("N08", 5)),
    (r"sshlg-skills|hub", r"__pycache__|untagged|CHANGELOG|drift|behind origin", ("N08", 5)),
    (r"sshlg-skills|hub", r"triggers|hooks?\b|ps -Ao|matcher", ("N02", 1)),
    (r"sshlg-skills|hub", r"validate\.py|sshlg-skills\.js|split", ("N08", 5)),
    (r"sshlg-skills|hub", r"paste|untracked", ("N10", "operator")),
    (r"host:claude", r"matcher", ("N02", 1)),
    (r"host:claude", r"SessionStart", ("N01", 1)),
    (r"host:claude", r"listing|skillOverrides|plugin", ("N10", "operator")),
    (r"host:(gemini|pi)", r".", ("N10", "operator")),
    (r"host:(opencode|codex)", r".", ("N07", 5)),
]


def load(name):
    return [json.loads(l) for l in (RAW / name).read_text().splitlines() if l.strip()]


def owner_of(row, kind):
    if kind == "members":
        return row["member"]
    if kind == "hub":
        return "hub"
    if kind == "hosts":
        return "host:" + row["host"]
    repo = row.get("owner_repo", "")
    return repo.split("/", 1)[-1] if repo.startswith("ssheleg/") else repo


FOCUS_MEMBERS = {"task-pipeline", "agent-sync", "agent-stack", "make-skill"}


def place(owner, row):
    key = (owner.replace("sshlg-skills", "hub"), row["id"])
    if key in EXPLICIT:
        return EXPLICIT[key]
    is_new = row["id"] == "NEW" or row["id"].startswith("D-")
    if not is_new and owner in FOCUS_MEMBERS | {"seo-aeo-audit", "sheleg-design", "sheleg-dev", "super-ux"}:
        return ("P-" + owner, "program")  # a member board row joins this release only by EXPLICIT
    if is_new and owner in {"seo-aeo-audit", "sheleg-design", "sheleg-dev", "super-ux"}:
        return ("P-" + owner, "program")
    text = " ".join(str(row.get(k, "")) for k in ("summary", "area", "kind", "proposed_target"))
    for o_re, s_re, target in RULES:
        if re.search(o_re, owner) and re.search(s_re, text, re.I):
            return target
    if not is_new:
        return ("P-" + owner, "program")
    return ("N09", 5)


def build():
    sources = [("survey-hub.jsonl", "hub"), ("survey-members.jsonl", "members"),
               ("survey-fabric-observatory.jsonl", "estate"), ("survey-hosts.jsonl", "hosts"),
               ("peer-asks.jsonl", "estate")]
    items, seq = [], 0
    for name, kind in sources:
        for row in load(name):
            owner = owner_of(row, kind)
            # super-ux's over-count note is a survey correction, not open work
            if owner == "super-ux" and row["id"] == "NEW" and "over-counted" in row.get("summary", ""):
                continue
            seq += 1
            node, wave = place(owner, row)
            needs_op = bool(row.get("needs_operator")) or wave == "operator"
            items.append({
                "key": f"INV-{seq:03d}",
                "id": row["id"],
                "owner": owner,
                "source": row.get("source", ""),
                "status": row.get("status", row.get("kind", "open")),
                "area": row.get("area", row.get("kind", "")),
                "node": node,
                "wave": wave,
                "release": "1.56" if isinstance(wave, int) else ("operator" if wave == "operator" else "program"),
                "closable_in_one_pass": bool(row.get("closable_in_one_pass", isinstance(wave, int))),
                "needs_operator": needs_op,
                "summary": row.get("summary", "")[:300],
                "survey": name,
            })
    return items


def main():
    items = build()
    doc = {"generated_by": "docs/evidence/specs/2026-10-11-integration-waves-assign.py",
           "nodes": NODES, "waves": {str(k): v for k, v in WAVES.items()}, "items": items}
    text = json.dumps(doc, ensure_ascii=False, indent=1) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text() != text:
            print("inventory drift: re-run the assign script", file=sys.stderr)
            return 1
    else:
        OUT.write_text(text)
    from collections import Counter
    print("items:", len(items))
    print("per wave:", dict(sorted(Counter(str(i["wave"]) for i in items).items())))
    print("per node:", dict(sorted(Counter(i["node"] for i in items).items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
