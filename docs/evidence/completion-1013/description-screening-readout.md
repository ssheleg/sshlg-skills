<sub>ssheleg skills — agent-evals · evidence-docs</sub>

# Explicit catalogue description screening — 2026-10-13 follow-up

## Observed result

The full and concise synthetic catalogues each selected the expected specialist set
in 13/13 cases on Claude Code 2.1.296, `claude-opus-5-5`, low effort, no enabled tools,
MCP servers or skill loading. This is one batch completion per arm, not 13 independent
model trials. [Full receipt](description-screening-full-diagnostic.json),
[concise receipt](description-screening-concise.json), and
[frozen fixture](description-screening-fixture.json) retain the input hashes and
case-level outputs. `controlled-probe.json` records the shared startup argv/config.
No installed description was changed.

The two earlier full-arm calls remain TEST_ERROR with zero reported usage and an
unclassified cause. Their sanitizer discarded useful error text. A separately
instrumented diagnostic retained raw stdout/stderr locally under mode0600 in a
mode0700 owned directory; it made exactly one explicit call with the same prompt hash,
`7c7f2e9e9b465eb539197426990b6e9619b470da88ab2acddc10784039a48383`, and succeeded.
It did not reproduce the earlier error, so no root cause is inferred. The first
concise-arm call then succeeded. Neither old receipt was overwritten.

## Later independent limitation: answer-bearing case IDs

The original prompt included semantic case IDs such as `auth`, `signin`,
`construction` and `evals`. Those labels can hint at the expected specialist,
so the13/13 result is diagnostic and is not clean evidence of unaided selection
quality. Receipts remain intact. The [v2 paired pilot](description-corpus-v2.md#executed-pilot-2026-10-13)
removed all case IDs, labels and source paths from model payloads; its own strict
schema stop is retained rather than repaired into a pass.

## Cost boundary

The full call reports 2 input +16724 cache-creation input tokens and 267 output tokens,
with list-price estimate USD0.13914. The concise call's actual usage is retained in
its receipt; cache mode and startup context must be read with those numbers. These
are CLI usage/list-price fields, not measured subscription charges. The model still
received the entire explicit catalogue. Native discovery, lazy loading, tool choice,
artifact quality, repeated-run variance and end-to-end task cost were not tested.

## Next acceptance work

This answer-hinted screen records that both catalogues produced the expected
13 outputs; it cannot isolate the descriptions as the cause. It does not cover every one of the 39 skills or
adversarial neighboring intents, and it is not sufficient to shorten all installed
skill descriptions. Expand the bilingual corpus, independently review the intended
routes and negative cases, then evaluate actual cold native sessions and resulting
tasks before adopting metadata changes. Keep descriptions and semantic search terms
separate so less startup text does not silently reduce whole-catalogue retrieval.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**
- agent-evals — paired synthetic selection screen and scope limits
- evidence-docs — usage receipts and retained error history
