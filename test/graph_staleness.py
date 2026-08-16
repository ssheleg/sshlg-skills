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
week.

That sentence is also why **"every graph is at HEAD" must never be written as a standing
claim**, and v0.79.0's release note wrote it anyway (B-68). It was false in the tree that
published it — this module printed eight of nine one commit behind in the same checkout —
and where `graphify-out` is committed it is false *by construction*, because the commit
carrying the graph advances HEAD past the commit the graph was built at. The only durable
form is what this module already emits: a per-member lag, measured now, beside the commit
it was measured at. And on this machine the refresh cannot run at all — `graphify . --update` exits 1
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


def report_agrees(graph_commit, report_commit):
    """`(ok, message)` for the human-readable half of a graph directory.

    `graph.json` is what stage 0 queries; `GRAPH_REPORT.md` is what a person opens,
    and it prints its own `Built from commit:` line and then tells the reader to
    *"Run `git rev-parse HEAD` and compare"*. Those two commits are written by
    different commands, so a rebuild that touches only the graph leaves the report
    describing a different build — and the reader is following an instruction that
    now returns the wrong number.

    Measured 2026-08-16 across the family: **nine of nine disagreed**, by 1, 2, 3,
    6, 13, 14, 16 and 35 commits, and one report carried no commit line at all.
    `graphify cluster-only <path>` regenerates the report from the existing graph
    with no LLM call, which is what closed eight of them.

    A disclosure like everything else in this module — `graphify-out/` is gitignored
    in eight of nine repositories, so nothing stale ships; the cost is that the one
    number a human reads is the wrong one.
    """
    if not graph_commit:
        return True, ""           # nothing to compare against; `resolve` owns that case
    if report_commit is None:
        return False, ("GRAPH_REPORT.md carries no `Built from commit:` line, so the "
                       "comparison it tells the reader to make cannot be made")
    if graph_commit.startswith(report_commit) or report_commit.startswith(graph_commit):
        return True, ""
    return False, (f"GRAPH_REPORT.md says it was built from {report_commit[:8]} while "
                   f"graph.json beside it says {graph_commit[:8]} — the report is the "
                   "half a person reads, and it is describing a different build "
                   "(`graphify cluster-only .` regenerates it without an LLM call)")
