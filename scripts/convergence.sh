#!/usr/bin/env bash
# check-convergence.sh — release acceptance across components, for <project>.
#
# Seeded by task-pipeline (references/acceptance.md → *Release acceptance happens at
# convergence*) into sshlg-skills on 2026-09-03, closing board row B-91.
#
# WHY HERE, LATE. `docs/evidence/convergence.md` has stated this rule since it was
# written and named a `scripts/` script as enforcing it that had never existed in this
# tree (B-90 made the address true; this makes the mechanism real). Nine submodules live
# here and this is the one place a cross-pointer break can surface, so the record was
# being written by hand — and the failure mode of a hand-written record is silence: a
# range with no record looks exactly like a range with no seam.
#
# IT IS OURS NOW: extend it here, section by section.
#
# WHY IT EXISTS. Stage 10 already required `git submodule status` with no `+` and every
#   repository clean and pushed. That is a statement about COMMITS: the parent points at
#   the child's newest one. It does not prove anything works at those two versions
#   together. A parent can point at a green submodule whose contract the parent calls
#   with the previous signature, and every check passes — the submodule's suite ran
#   against the submodule, the parent's against the parent, and no check ran across the
#   pointer. Neither repository looks wrong alone.
#
# SCOPE: it checks the POINTERS mechanically and the SEAM by record. It does NOT run your
#   cross-component test — it cannot know what that is — it requires that one was run and
#   that its record names the exact versions it observed. Read this before quoting a green
#   from here as evidence of a working composition.
#
# EXIT CODE IS THE OUTPUT: non-zero on any failure. Nothing runs after the VERDICT block.
#
# PORTABLE to macOS bash 3.2: no grep -P, no readarray, no mapfile, no sed -i.
#
# PROGRESSIVE ARMING: a section whose input does not exist prints `dormant:` and does NOT
#   fail. A project with no components, or a range in which no component pointer moved,
#   has no seam to prove — and a gate that starts red teaches its project on day one that
#   the gate is noise.
#
# USAGE: check-convergence.sh [<base-ref>]      # default: origin/HEAD, else the root commit
set -u

BASE="${1:-}"
FAILED=0
LIVE=0
say()  { printf '%s\n' "$*"; }
ok()   { LIVE=$((LIVE+1)); say "ok: $*"; }
bad()  { FAILED=$((FAILED+1)); say "FAIL: $*"; }
dorm() { say "dormant: $*"; }

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  dorm "not a git checkout — nothing to converge"
  say ""; say "VERDICT: PASS (dormant) — components 0 · live checks 0"
  exit 0
fi

if [ -z "$BASE" ]; then
  if git rev-parse --verify -q origin/HEAD >/dev/null 2>&1; then
    BASE="origin/HEAD"
  elif git rev-parse --verify -q origin/main >/dev/null 2>&1; then
    BASE="origin/main"
  else
    BASE="$(git rev-list --max-parents=0 HEAD 2>/dev/null | tail -1)"
  fi
fi
say "range: ${BASE}..HEAD"

# --- 1. the components this repository pins -----------------------------------------
if [ ! -f .gitmodules ]; then
  dorm "no .gitmodules — this repository pins no components"
  say ""; say "VERDICT: PASS (dormant) — components 0 · live checks 0"
  exit 0
fi

COMPONENTS="$(git config -f .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null \
              | awk '{print $2}')"
N=0
for c in $COMPONENTS; do N=$((N+1)); done
say "components: $N"

# --- 2. the pointer, mechanically ----------------------------------------------------
# A '+' means the parent points at something other than the child's checked-out commit,
# so a clone of the parent gets a different tree than the one that was tested.
DIRTY="$(git submodule status 2>/dev/null | grep '^+' | awk '{print $2}')"
if [ -n "$DIRTY" ]; then
  for d in $DIRTY; do bad "$d: the parent's pointer and the child's HEAD disagree — a clone gets a different tree than the one tested"; done
else
  ok "every pointer matches the child's HEAD"
fi

# --- 3. the pin must exist on the child's REMOTE -------------------------------------
# Measured here, 2026-08-16: a release tag failed CI at checkout because the parent
# pinned a commit that existed only on one machine. `git submodule status` showed no '+',
# because the pointer matched the LOCAL head. This is the check that was missing.
# The PARENT'S POINTER, not the child's HEAD. Those are the same fact only while they
# agree, and they disagree in exactly the case this section exists for. The first draft
# read `git -C <c> rev-parse HEAD` and, on its first live run against a real parent,
# reported about a commit the parent does not pin.
for c in $COMPONENTS; do
  PIN="$(git rev-parse "HEAD:$c" 2>/dev/null)"
  [ -n "$PIN" ] || { dorm "$c: the parent's tree records no pointer for it"; continue; }
  SHORT="$(printf '%.7s' "$PIN")"
  if [ ! -d "$c/.git" ] && [ ! -f "$c/.git" ]; then
    dorm "$c: pinned at $SHORT but not checked out — cannot ask its remote whether that commit is published"
    continue
  fi
  if git -C "$c" branch -r --contains "$PIN" 2>/dev/null | grep -q .; then
    ok "$c: pinned at $SHORT and that commit is published"
  else
    bad "$c: pinned at $SHORT, which no remote branch of the component contains — every clone of the parent fails at checkout while this machine stays green"
  fi
done

# --- 4. the seam, by record -----------------------------------------------------------
# Required only for a component whose pointer MOVED in this range: a range that crossed
# no component boundary has no seam to prove, and demanding a record for it is how a
# gate becomes noise.
MOVED=""
for c in $COMPONENTS; do
  if git diff --quiet "$BASE" HEAD -- "$c" 2>/dev/null; then :; else MOVED="$MOVED $c"; fi
done

if [ -z "$MOVED" ]; then
  dorm "no component pointer moved in this range — no seam was crossed"
else
  RECORD=""
  for f in docs/evidence/convergence.md docs/superpowers/convergence.md CONVERGENCE.md; do
    [ -f "$f" ] && RECORD="$f" && break
  done
  if [ -z "$RECORD" ]; then
    for c in $MOVED; do
      bad "$c: its pointer moved and no convergence record exists (docs/evidence/convergence.md) — the composition at these versions was never observed"
    done
  else
    ok "convergence record: $RECORD"
    for c in $MOVED; do
      # Again the parent's pointer: the record must name the version the parent will
      # SHIP, which is what a clone gets, not whatever is checked out here.
      PIN="$(git rev-parse "HEAD:$c" 2>/dev/null)"
      SHORT="$(printf '%.7s' "${PIN:-}")"
      if [ -n "$SHORT" ] && grep -q "$SHORT" "$RECORD"; then
        ok "$c: the record names the exact version it observed ($SHORT)"
      else
        bad "$c: pinned at ${SHORT:-?} and $RECORD does not name that version — a record citing no version cannot say which composition it observed"
      fi
    done
  fi
fi

# --- VERDICT — nothing runs after this ------------------------------------------------
say ""
if [ "$FAILED" -gt 0 ]; then
  say "VERDICT: FAIL — components $N · live checks $LIVE · failures $FAILED"
  exit 1
fi
say "VERDICT: PASS — components $N · live checks $LIVE"
exit 0
