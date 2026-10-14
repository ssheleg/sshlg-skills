# R27 paired routing-reader experiment

Status: PROPOSED_NOT_RUN. Completes the narrow repeated current/no-among
comparison originally proposed in test/evals/RESULTS.md. It is a model reading
router text, not native skill loading or execution of the requested work.

The exact registry and arm generator are frozen in source.json; arms.json
contains the emitted router paragraphs only, not the complete managed instruction
block. Cases retain p01/p02/p07 original prompt text. Each of18 arm/case/repetition
cells gets a fresh project/session, with two tool-free readiness cells preceding.
The only prompt material is a neutral output instruction, one arm and one original
query. Case IDs, arm labels, expected routes and this packet are not supplied.
No tools, MCP, hooks, memory or slash commands are allowed; no repository/provider
actions occur. Readiness requires exactly READY.

B144 expectation decision: current operator doctrine explicitly routes all product
and interface work through super-ux. The login-form query therefore requires
super-ux; the old silence label is historical, not a defect to preserve. This is
a source-based interpretation before execution, not a post-result relabel. p02
has underspecified monitoring scope; compare route sets without a fixed behavioral
PASS label. p07 retains legacy make-skill recall while reporting additional routes.
Old routing.json and RESULTS.md are unchanged.

Budget proposal:20 new CLI calls, one model request per call,12000 input-token
ceiling,600 output-token environment cap,180seconds,USD0.10 per-call reserve.
The remaining USD1.5379384 follows native A+B+C's observedUSD2.4620616, keeping
the combined R27 envelopeUSD4 and maximum84 CLI invocations. This is subscription
list metadata, not an invoice. Earlier other pilots stay separately recorded.
Stop on trace/auth/cost/protocol/output-format errors, preserve partial data, no retry.
Task output must be exactly two lines, `ROUTE: names` and `WHY: sentence`. Unknown
router names remain behavioral observations; malformed syntax stops the protocol.

The runner must freeze source/corpus/arms/dependencies and admission before and
after every call, confine raw data outside Git, reject overwrite, preserve full
visible artifacts and compute paired route-set differences without treating
repetitions as independent intents. Independent runner review and a new explicit
admission are required before any model calls. No compression adoption follows
this small exploratory comparison; final whole-family quality remains separate.
