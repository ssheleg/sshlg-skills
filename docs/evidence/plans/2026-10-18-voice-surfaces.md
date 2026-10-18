# Portable punctuation and public voice

## Objective and authority

The operator requested a portable skill rule against decorative em dashes,
rare necessary grammatical exceptions, the appropriate Copylot voices, updated
skills and personal websites and GitHub descriptions, integration to main and
released and installed skills. Existing standing authorization covers those
actions. Preserve unrelated work. Keep the current model.

## Sources and decisions

- Hub base: `b594d043`; public copy sources are `scripts/site.js`, `skills.json`
  and `lib/routers-registry.js` (see `docs/DOCMAP.md`).
- Family voice: `docs/brand/voice.md`, `channels.md`, `terminology.md`, `facts.md`.
- Personal voice belongs to the personal brand repository and is inherited by
  the personal website. Copylot must hold separate personal and family voices.
- An existing run holds `NO-EM-DASH-1018` on branch `feat/no-em-dash-rule`.
  Its in-progress launcher/member release is a dependency, not this run's files.
- Fabric whoami succeeded. The connected tool catalogue exposes only whoami,
  so board reads and work claims are NOT_REPORTED. No alternative board channel.
- Contradictions: the personal website's local policy still permits one em dash
  per paragraph. The current operator instruction supersedes that allowance.

## Requirements and checks

| ID | Deliverable | Check |
|---|---|---|
| VOICE-1 | Portable punctuation rule with narrow grammar and literal exceptions | Released skill and installed-byte readback |
| VOICE-2 | Separate personal and family Copylot voices | Saved voice IDs and version readback |
| VOICE-3 | Skills website copy follows the rule | Rendered pages, site test, deployment |
| VOICE-4 | Personal site copy and inherited policy agree | Build, rendered copy, deployment |
| VOICE-5 | GitHub descriptions follow the appropriate voice | API readback against reviewed manifest |
| VOICE-6 | Changes integrated and delivered | Main SHAs, release and install receipts |

## Work packets and dependencies

1. Skills website: own `scripts/site.js`, `test/site_test.js`,
   `docs/brand/voice.md` and a scoped evidence note. Rewrite authored public copy
   by meaning. Preserve source quotations and router doctrine. No visual redesign.
2. Personal site and voice: inspect the current upstream first; use isolated
   branches. Remove contradictory punctuation policy and authored public dashes,
   including titles and accessible labels. Preserve historical quotations.
3. Copylot: use its supported UI or capability to save two voices from existing
   brand sources; do not manufacture biography, facts, or rhythm measurements.
4. Integration: consume the other run's released rule, review all changes, run
   focused gates and exact-artifact readback, merge and observe deployments.

The edges carry the saved voice policy into copy review, the released member
commit into the hub pin, and the final main commits into live readback.
Resume here until a completion receipt is linked.
