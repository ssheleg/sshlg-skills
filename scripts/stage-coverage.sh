#!/usr/bin/env bash
# Stage 10: does the ledger account for every stage the flow declares?
#
# A run can reach acceptance with stages that never happened and never said so. On
# 2026-08-13 one closed with 0,1,2,5,6,7,8,9,10 recorded and **3 (spec) and 4 (plan)
# never stamped** — the artifacts existed, folded into the brief, but their verdicts did
# not. The status line printed `3· 4·` and 73% and was right; nothing read it. Stage 7's
# release gate could not have caught this: it fires before 8, 9 and 10 exist, and it asks
# only for the tests stage.
#
# So this is the check stage 10 owes: every declared stage carries a verdict, or the flow
# stops declaring a stage it merges. Both are legitimate — a project whose spec and plan
# genuinely live inside the brief should say so in `pipeline.json` rather than record a
# verdict nobody produced. What is not legitimate is a flow that declares eleven stages
# and a ledger that accounts for nine.
#
#     bash scripts/stage-coverage.sh            # the project's own flow and ledger
#     bash scripts/stage-coverage.sh --ledger X --config Y
#
# Exit 0 = every declared stage has a verdict. Exit 1 = it does not, and each missing one
# is named. Exit 2 = it could not look (no config, no ledger) — which is NOT a pass:
# a check that cannot run must say so rather than agree.
set -euo pipefail

LEDGER=".task-pipeline/run.md"
CONFIG="pipeline.json"
while [ $# -gt 0 ]; do
  case "$1" in
    --ledger) LEDGER="$2"; shift 2 ;;
    --config) CONFIG="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ -f "$CONFIG" ] || { echo "STAGE COVERAGE CANNOT RUN: no $CONFIG — the flow does not say what it declares" >&2; exit 2; }
[ -f "$LEDGER" ] || { echo "STAGE COVERAGE CANNOT RUN: no $LEDGER — there is no run to account for" >&2; exit 2; }

python3 - "$CONFIG" "$LEDGER" <<'PY'
import json, re, sys

cfg_p, led_p = sys.argv[1], sys.argv[2]
cfg = json.load(open(cfg_p, encoding="utf-8"))
declared = [s["id"] for s in cfg.get("stages", []) if "id" in s]
names = {s["id"]: s.get("name", "") for s in cfg.get("stages", [])}
if not declared:
    print(f"STAGE COVERAGE CANNOT RUN: {cfg_p} declares no stages", file=sys.stderr)
    raise SystemExit(2)

led = open(led_p, encoding="utf-8").read()
# `stage: <id> <name> — gate <type> — verdict <v> — <when>`; the LAST verdict for an id
# wins, because a stage re-entered after a fix is the stage's real outcome.
seen = {}
for m in re.finditer(r"^stage:\s*(\d+)\b[^\n]*?verdict\s+(\w+)", led, re.M):
    seen[int(m.group(1))] = m.group(2)

missing = [i for i in declared if i not in seen]
unpassed = [(i, v) for i, v in sorted(seen.items()) if v not in ("pass", "skip")]

for i in missing:
    print(f"  stage {i} ({names.get(i,'')}) — DECLARED BY {cfg_p}, NO VERDICT IN THE LEDGER")
for i, v in unpassed:
    print(f"  stage {i} ({names.get(i,'')}) — last verdict is '{v}'")

covered = len(declared) - len(missing)
print(f"\nstages declared {len(declared)} · accounted for {covered} · "
      f"{round(100*covered/len(declared))}%")

if missing:
    print("\nA run that reaches acceptance with a stage unaccounted for is a run whose own\n"
          "record disagrees with its flow. Either stamp what actually happened — a merged\n"
          "stage still has an outcome — or stop declaring a stage this project folds into\n"
          "another, in pipeline.json, where the flow describes itself.")
    raise SystemExit(1)
if unpassed:
    raise SystemExit(1)
print("every declared stage carries a verdict")
PY
