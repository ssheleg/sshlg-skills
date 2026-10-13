<sub>ssheleg skills — evidence-docs</sub>

# Independent draft consumer and reconciliation review — 2026-10-13

Reviewed script content at hub `baa9e4c`; no core edits, configuration reads,
provider calls or broad suites. The MCP fixture's 22 controls passed. Its README
correctly labels an unaccepted semantic draft, not a production owner API, writer,
apply/undo implementation or authenticated identity proof.

Three bounded P2 findings were reproduced and sent to the implementation owner:

| Finding | Evidence at reviewed commit | Required correction |
|---|---|---|
| Board hash is not the committed bytes | `reconcile-current.py:19` strips the source text, then line 37 hashes it. A raw `git show <super-ux-pin>:docs/evidence/backlog.md` SHA-256 differs from the recorded hash. Leading blank lines would also shift line addresses. | Hash raw bytes and parse untrimmed source text. |
| Unavailable source reported absent | At `reconcile-current.py:32–34`, every nonzero `cat-file` becomes `ABSENT_AT_PIN`. Replacing only the known-present super-ux `cat-file` result with exit 128 (unavailable object database) yielded that absence status. Original identities remained, but the source claim was wrong. | Verify repo/commit availability separately; distinguish missing board from failed source access or refuse to produce the snapshot. |
| Draft identity accepts blank/path/control strings | `mcp-profile-consumer/check.py:24,33` accepts project and ID `' '`. An ID containing a filesystem-looking path and newline is returned unchanged by `classify`. The fixture's main prints only counts, so no actual public leak was observed. | Reject blank/control/path-like draft identifiers or explicitly defer safe display until an owner schema defines opaque IDs. Do not treat an `owner` string as authenticated origin. |

The source rows are data, not implementation acceptance. The reconciliation's
owner-qualified keys, retained original identity set and refusal on duplicate IDs
are appropriate. Its closed-prose disposition explicitly still requires acceptance
links; the nonterminal label avoids inventing a defect count. Missing source access
must preserve that same unknown-versus-absent distinction.

Exact next task: owner fixes these small seams; independent reviewer replays the
same controlled cases against the frozen fix. Production MCP acceptance still
requires the owner contract, board answer, authorized materializer and native
observation described in the draft README.

## Corrected frozen-source replay

Independent bounded PASS at `fb5bb641cf878f02ed63c4d2cf491ca546424bb3`.
The public MCP fixture passed 25 controls. Nineteen additional independent checks
compared every READ board hash to raw `git show` bytes; replaced one known-present
member commit read with exit 128 and observed an abort; refused blank project/ID,
filesystem-looking, URL and control-containing IDs; and retained a valid reachable
case. All three findings above are repaired in this bounded scope. No production
owner schema, materializer, native host or provider acceptance was tested.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — independent semantic and source-identity review
