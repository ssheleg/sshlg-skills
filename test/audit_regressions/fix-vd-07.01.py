#!/usr/bin/env python3
"""FIX-VD-07.01 — the design catalog verifies a claim against the reached skill,
not the source string (sherlock audit, VD-07).

The finding: the design pack's frontend-design entry asserted "bans
Inter/Roboto/Arial" as fact, but the reachable ~/.agents/skills/frontend-design
/SKILL.md on this machine carries no such ban. A catalog that ascribes a rule
the reached file does not contain briefs a cast on a capability that is not
there.

The fix under test:
* lib/packs.js — the generic `why` no longer states the ban; the specific is a
  `claims` assertion resolved against the reached SKILL.md. resolveEntry lists
  BOTH providers when one name has two implementations, picks the actually
  resolved file, records its sha256 digest (a route trace of the version read),
  and splits claims into confirmed / unverified — an absent ban is never
  printed as fact;
* sheleg-design CREATIVE_DIRECTOR.md — each cast is briefed with a SCOPED input
  (fixed / open / deliverable), frontend-design is for concept hypotheses and
  critique within bounds not a second router, and a claim is verified against
  the reached descriptor.

Node is already required by this repo. Standard library + node only.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PACKS = os.path.join(ROOT, "lib", "packs.js")
CD = os.path.expanduser(
    "~/DATA/sheleg-design-skill/plugins/sheleg-design/skills/sheleg-design/CREATIVE_DIRECTOR.md")

failures = []
not_run = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def node(js):
    r = subprocess.run(["node", "-e", js, PACKS], capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, f"node failed: {r.stderr[:400]}"
    return json.loads(r.stdout)


def t_generic_why_states_no_specific_ban():
    out = node(
        "const p=require(process.argv[1]);"
        "const fd=p.PACKS.design.entries.find(e=>e.id==='frontend-design');"
        "console.log(JSON.stringify({why:fd.why, claims:fd.claims||[]}));")
    assert not any(f in out["why"] for f in ("Inter", "Roboto", "Arial")), \
        "the generic why still states the ban as fact — the finding itself"
    assert out["claims"], "the ban is not carried as a verifiable claim"


def t_two_implementations_both_shown_resolved_chosen():
    out = node(
        "const p=require(process.argv[1]);"
        "const fd=p.PACKS.design.entries.find(e=>e.id==='frontend-design');"
        "const noBan={id:'frontend-design',path:'/hub/B/SKILL.md',source:'other/fork',"
        "  text:'a frontend design skill, no font bans'};"
        "const withBan={id:'frontend-design',path:'/hub/A/SKILL.md',source:'anthropics/skills',"
        "  text:'this skill bans Inter, Roboto and Arial'};"
        "console.log(JSON.stringify(p.resolveEntry(fd,[noBan,withBan])));")
    assert len(out["providers"]) == 2, "two implementations of one name were not both shown"
    assert out["resolved"]["path"] == "/hub/B/SKILL.md", "the resolved file was not the first reachable"
    assert len(out["resolved"]["digest"]) == 64, "no digest of the read version (route trace)"
    assert len(out["unverified"]) == 1 and not out["confirmed"], \
        "the ban was printed as fact against a file that does not contain it"


def t_confirmed_when_reached_file_has_it():
    out = node(
        "const p=require(process.argv[1]);"
        "const fd=p.PACKS.design.entries.find(e=>e.id==='frontend-design');"
        "const withBan={id:'frontend-design',path:'/hub/A/SKILL.md',source:'anthropics/skills',"
        "  text:'this skill bans Inter, Roboto and Arial'};"
        "console.log(JSON.stringify(p.resolveEntry(fd,[withBan])));")
    assert len(out["confirmed"]) == 1 and not out["unverified"], \
        "a ban the reached file DOES contain was not confirmed"


def t_none_reachable_is_generic():
    out = node(
        "const p=require(process.argv[1]);"
        "const fd=p.PACKS.design.entries.find(e=>e.id==='frontend-design');"
        "console.log(JSON.stringify(p.resolveEntry(fd,[])));")
    assert out["generic"] is True and out["resolved"] is None
    assert len(out["unverified"]) == 1, "with nothing reached the ban must be unverified"


def t_creative_director_scopes_the_cast():
    if not os.path.isfile(CD):
        not_run.append("sheleg-design CREATIVE_DIRECTOR.md not reachable — cross-repo check NOT_RUN")
        return
    with open(CD, encoding="utf-8") as fh:
        d = " ".join(fh.read().split())
    for needle in ("Cast with a SCOPED brief, not a bare name",
                   "what is FIXED", "what is OPEN", "DELIVERABLE",
                   "preserve-brand", "exact-Figma reproduction",
                   "aesthetic risk is\nturned OFF".replace("\n", " "),
                   "concept hypotheses and visual critique within those bounds",
                   "verified against the tool's REACHED descriptor",
                   "records the digest it read"):
        assert needle in d, f"CREATIVE_DIRECTOR.md no longer states {needle!r}"


def main():
    case("the generic why states no specific ban as fact", t_generic_why_states_no_specific_ban)
    case("two implementations both shown, resolved chosen, digest recorded",
         t_two_implementations_both_shown_resolved_chosen)
    case("a ban the reached file contains is confirmed", t_confirmed_when_reached_file_has_it)
    case("nothing reachable is a generic upstream description", t_none_reachable_is_generic)
    case("CREATIVE_DIRECTOR.md briefs each cast with a scoped input",
         t_creative_director_scopes_the_cast)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    for n in not_run:
        print(f"  NOT_RUN  {n}")
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
