#!/usr/bin/env python3
"""FIX-RT-01.02 — composition and negations (sherlock audit, parent FIX-RT-01,
on FIX-RT-01.01's typed intent contract).

The rules under test, as behaviour against lib/triggers.js classify():

* a MAPPED refusal declines its ONE route — «сделай лендинг, но без дизайна»
  keeps every other clause's candidates; a GENERIC refusal («как есть») still
  silences the whole prompt, and the hook-level optedOut() is untouched;
* USING an agent is not BUILDING an agent system: «запусти суб-агента для
  поиска» drops agent-stack, «построй оркестратор» keeps it;
* an explicit entry request (/ux, «используй task-pipeline») is preserved
  through the question filter and the agent-use guard — but a refusal of the
  SAME route still wins, because saying the phrase is the decision.

Standard library only; drives the real module through node.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def call(expr, arg=""):
    r = subprocess.run(
        ["node", "-e",
         "const t=require(process.argv[1]);"
         f"console.log(JSON.stringify({expr}))",
         os.path.join(ROOT, "lib", "triggers.js"), arg],
        capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:300]
    return json.loads(r.stdout)


def classify(prompt):
    return call("t.classify(process.argv[2])", prompt)


def t_negating_one_clause_keeps_the_others():
    v = classify("сделай лендинг с воронкой, а также оплату картой, но без дизайна")
    assert "sheleg-design" not in v["facets"], "the declined route survived"
    assert v["declined"] == ["sheleg-design"], f"declined: {v['declined']}"
    assert "super-ux" in v["facets"], \
        "negating the design clause erased the funnel clause — the finding itself"
    assert v["effects"]["write"] is True, "the change intent was lost with the refusal"


def t_generic_refusal_still_silences_everything():
    for prompt in ("всё как есть, добавь paywall", "no tooling — добавь воронку"):
        v = classify(prompt)
        assert v["intent"] == "none" and v["facets"] == [], \
            f"a generic opt-out narrowed instead of silencing: {prompt!r} → {v}"
    hook = call("t.optedOut(process.argv[2])", "сделай лендинг, но без дизайна")
    assert hook is True, \
        "hook-level optedOut changed semantics — that boolean belongs to the hook"


def t_subagent_use_is_not_agent_system_build():
    v = classify("запусти суб-агента для поиска по репозиторию")
    assert "agent-stack" not in v["facets"], \
        "a delegation routed to the builder's doctrine — the finding itself"
    v2 = classify("построй оркестратор с суб-агентами")
    assert "agent-stack" in v2["facets"], "a genuine build lost its route"
    v3 = classify("spawn a subagent to build an agent system with a token wallet")
    assert "agent-stack" in v3["facets"], \
        "a build marker did not outweigh the use phrase"


def t_explicit_requests_are_preserved():
    v = classify("как работает /ux и что он делает?")
    assert "super-ux" in v["facets"], \
        "the question filter unchose an explicitly named entry"
    v2 = classify("используй task-pipeline для этого рефактора")
    assert "task-pipeline" in v2["facets"], "a named route was not preserved"
    v3 = classify("сделай через /sheleg-design лендинг, но без дизайна")
    assert "sheleg-design" not in v3["facets"], \
        "an explicit request overrode the operator's refusal of the same route"


def t_prior_contract_intact():
    v = classify("без пайплайна — просто посмотри логи")
    assert v["effects"]["write"] is False and v["facets"] == [], \
        "the FIX-RT-01.01 silent path regressed"
    v2 = classify("объясни как работает гейт и почини в нём баг")
    assert v2["effects"]["write"] is True, "explain+fix lost its action clause"


def main():
    case("negating one clause keeps the others", t_negating_one_clause_keeps_the_others)
    case("a generic refusal still silences everything; optedOut untouched",
         t_generic_refusal_still_silences_everything)
    case("subagent use is not agent-system build", t_subagent_use_is_not_agent_system_build)
    case("explicit entry requests are preserved; a same-route refusal wins",
         t_explicit_requests_are_preserved)
    case("the FIX-RT-01.01 contract is intact", t_prior_contract_intact)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
