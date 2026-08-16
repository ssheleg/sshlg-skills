#!/usr/bin/env python3
"""How far behind the code is each knowledge graph, and can it still be refreshed?

`references/knowledge-graph.md` already names `built_at_commit` and the three commands
that turn it into a number — *which state applies*, *commits behind*, *days behind*. What
it does not have is anything that RUNS them, so the number existed only when somebody
thought to ask. Measured 2026-08-16: the umbrella's graph was **31 commits behind** its own
HEAD, `super-ux` 33, `seo-aeo-audit` 19, while four others were at 2. Nothing said so.

That matters more than ordinary staleness because of what a graph is for. The doctrine's
own sentence: *a stale graph is a false premise carrying the authority of a machine — a
wrong doc gets argued with, a wrong graph gets believed.* Stage 0 queries it for reach and
stage 9 checks it against the docs; both read whatever is on disk.

**A disclosure, never a gate.** A graph is behind the moment the next commit lands, so a
threshold here would go red on every repository every day and be switched off within a
week. And on this machine the refresh cannot run at all — `graphify . --update` exits 1
with *no LLM API key found (40 doc/paper/image files need semantic extraction)*, which is
B-51 and an operator's decision, not a build failure. What this can do is stop the cost
being invisible while that decision waits.

Pure: `resolve` touches nothing. The caller does the git and the file reading.
"""


def resolve(built_at, resolves, behind, refreshable):
    """`(state, message)` for one graph, from four facts the caller measured.

    - `built_at`    — the `built_at_commit` field, or None/'' when the graph has none.
    - `resolves`    — does that commit exist in this checkout? A shallow clone or a
      rewritten history makes the field unusable, and unusable is **not** current.
    - `behind`      — commits from that commit to HEAD.
    - `refreshable` — can `graphify --update` run here at all? False turns a report about
      distance into a report about a decision nobody has taken.

    States: `blind` (cannot say), `current` (at HEAD), `behind` (a number), `absent`.
    """
    if built_at is None:
        return "absent", "no graph in this repository"
    if not built_at:
        return "blind", "graph.json carries no `built_at_commit` — its distance from the code is unknowable"
    if not resolves:
        return "blind", (f"graph built at {built_at[:8]}, which does not resolve here — a shallow "
                         "clone or a rewritten history, and either way not a current graph")
    try:
        n = int(behind)
    except (TypeError, ValueError):
        return "blind", f"graph built at {built_at[:8]}; git could not count the distance to HEAD"
    if n < 0:
        return "blind", f"graph built at {built_at[:8]}; negative distance — git said something unusable"
    # Names the remedy, not just the lack. Since 2026-08-16 this machine has a key
    # in ~/.config/graphify/env, sourced by ~/.zshrc — so a shell that reports this
    # is a non-interactive one (or CI, which never has it), and the fix is one
    # `source` away rather than a decision nobody has taken.
    tail = ("" if refreshable else
            " and no LLM key is set in THIS shell, so `graphify extract` cannot run"
            " (set one of GEMINI_/GOOGLE_/OPENAI_/ANTHROPIC_/DEEPSEEK_/MOONSHOT_API_KEY)")
    if n == 0:
        return "current", f"graph is at HEAD{tail}"
    plural = "commit" if n == 1 else "commits"
    return "behind", (f"graph is {n} {plural} behind HEAD (built at {built_at[:8]}){tail} — "
                      "stage 0 queries it for reach and stage 9 checks it against the docs")
