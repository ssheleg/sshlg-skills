# Routing-block eval

Does the block this package writes into an operator's instruction file actually
route? Nothing asked that until 2026-08-31.

## Why `route_coverage.js` is not this check

`test/route_coverage.js` calls `lib/triggers.js` — a deterministic matcher over the
**prompt**. It never reads the block. Delete a paragraph from every router and it
returns the identical number, so using it to clear a change to the block's text
produces a green that means nothing. Two different questions:

| Instrument | Reads | Answers |
|---|---|---|
| `route_coverage.js` | `lib/triggers.js` | does the hook name a route for a prompt an operator would type |
| this | the block's own text, through a model | does a reader of the block reach the right router |

## Running it

```sh
node test/routing_eval.js                 # what it is, and the arm sizes
node test/routing_eval.js --arms /tmp/arms # write block-current.md and the trims
node test/routing_eval.js --pack           # one line per (arm, probe) dispatch
```

Then hand **each pair to its own fresh agent** with this instruction: read the arm
file, read the prompt, answer `ROUTE:` / `WHY:` from that text alone. One agent per
pair, because a single agent shown every probe anchors on its own earlier answers.
Record the run as a dated section in `RESULTS.md`.

## Limits — read these before quoting a number

- **Both arms are contaminated, equally and on purpose.** The probes run on a
  machine whose own global configuration carries this block, so an agent may route
  correctly from memory rather than from the text it was given. That inflates every
  arm. It is why the **paired difference** is the result and the absolute rate is
  not, and why arms must be compared on the same probes in the same session.
- **One run per cell is a screening result.** `agent-stack`'s
  `agent-evals/references/statistics.md` asks for three to five, and gives the sign
  test that says how little four discordant pairs establish.
- **13 probes is small.** They cover each router once plus two silences; they are
  not a sample of what operators type. A route that never appears here is untested,
  not proven absent.
- **`want` is a judgement**, taken from `route_coverage.js`'s curated cases — what
  an operator would expect, not what the block promises. Where the two disagree the
  probe is the thing to argue with.
- **A probe passes when the wanted route is among those named**, so naming three
  extra routers still passes recall. That is what the *total routes named* column is
  for: over-routing is invisible to recall alone.

## Adding a probe

Append to `routing.json` with a new `id`, run the arms, dispatch, and add a dated
row. `routing_evals_test.js` runs in the gate and holds the fixtures to their shape
and `RESULTS.md`'s stated counts to the artifact — a hand-typed count that drifts is
the defect that check exists for.
