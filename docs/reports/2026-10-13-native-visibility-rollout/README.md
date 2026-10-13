---
report:
  id: sshlg-skills/2026-10-13-native-visibility-rollout
  title: "Native skill visibility rollout and loading measurements"
  kind: benchmark
  project: sshlg-skills
  domains: [ai-agent, automation]
  as_of: 2026-10-13
  status: active
  valid_until: 2026-10-20
  summary: >-
    The released launcher applied reversible skill visibility to six hosts.
    Pi's native loader retained all 39 family skills while its skill prompt text
    fell from 308638 to 144221 UTF-16 characters in a controlled comparison.
    This measures listing text, not model quality, token billing or task success.
  sources:
    - name: "Sanitized native readback"
      path: "raw/readback.json"
      read_at: 2026-10-13
    - name: "Released launcher source"
      url: "https://github.com/ssheleg/sshlg-skills/commit/c035801021a046a1bc8fcae41ea8a6a4c060bd2d"
      read_at: 2026-10-13
    - name: "OpenCode skill permissions"
      url: "https://docs.opencode.ai/docs/skills/"
      read_at: 2026-10-13
  produced_by:
    agent: codex
    task: COMPLETION-1013
  supersedes: []
  consumers: [sshlg-skills]
---

<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# Native skill visibility rollout and loading measurements

## Result

The published `sshlg-skills@1.62.0` launcher applied the operator-authorized pack
selection and read back settings for Claude, Codex, Gemini, Pi, OpenCode and Hermes.
The machine's pack marks revision 1 contains 54 packs: 34 hidden and 20 listed.
Hidden skills remain installed and searchable. The query `discounted cash flow,
financial model` returned hidden `dcf-model` first. This is one discovery witness,
not an exhaustive search-recall evaluation. [Sanitized evidence](raw/readback.json)
records the observations and private source-log hashes.

| Surface | Observed result | Boundary |
|---|---|---|
| Pi native loader | 499 → 178 skills; all 39 family skills retained | Controlled loader experiment; no model call |
| Gemini native list | 179 enabled, 320 disabled; all 39 family skills enabled | One requested disabled name, `ui-toolkit/web`, absent from native inventory |
| Hermes native list | 228 enabled, 321 disabled; 57 builtin and 492 local entries | Native list, not provider execution; truncated table names do not prove family identity |
| OpenCode 1.18.10 | 321 `permission.skill` denies, zero family denies | `debug skill` still lists 536 inventory entries; inventory is not active prompt |
| Claude and Codex | Settings written and read back | Fresh model-session discovery/selection NOT_RUN |
| Cursor and Kimi | No visibility write | Current adapters cannot remove a skill from their native listing |

Gemini's command also reported duplicate overrides and untrusted-project omission.
Those warnings remain limitations of the observed inventory. The launcher protected
16 new backup files with mode 0600 in a 0700 backup directory. No skill files were
deleted or moved. `sheleg-dev` remained globally enabled.

## Pi measurement and method

[Paired measurements](raw/pi-comparison.json) use the installed Pi
`DefaultResourceLoader` and `SettingsManager` with the same effective settings in
memory. The baseline removes only the 640 exact path exclusions owned by this
visibility receipt; the applied arm retains them. Extensions, themes, prompts and
context files were disabled in both arms. No settings files were changed by the
experiment and no provider was called. Alias paths explain why 321 hidden skill
names require 640 exclusions.

The native `formatSkillsForPrompt` text contains 308638 UTF-16 characters in the
baseline and 144221 after exclusions: `(308638 - 144221) / 308638 = 53.2718%` less
text. Diagnostics changed from 2 to 1. A separate read with actual on-disk settings
also loaded 178 skills and all 39 family skills. These counts describe this machine
and host version, not every user installation. The earlier exploratory helper used
the wrong manifest property for expected family names; it was corrected to
`skillNames` before the accepted measurement. No zero-sized family expectation is
used as acceptance.

## Meaning for context and quality

The result supports reducing unnecessary startup listing text while retaining the
family entry points. It does **not** establish token savings, monetary savings,
unchanged routing quality or successful downstream tasks. Description shortening
remains gated by a separate behavioral evaluation, whose provider-error boundary is
recorded in the [completion plan](../../evidence/plans/2026-10-13-completion.md).

Claude's launcher estimate only changed from 67441 to 67153 listing characters;
its context-budget problem is therefore still open. Pack marks do not replace the
Claude/Codex core policy. OpenCode's [official skill documentation](https://docs.opencode.ai/docs/skills/)
says deny hides a skill and rejects loading, but per-agent permissions may override
it. The observed native config agrees with the intended deny entries; no model
prompt trace was captured, so that stronger claim remains NOT_RUN.

## Reproduction and retained evidence

The production commands were `visibility marks --init --show <authorized packs>
--apply`, then `visibility --apply`, through the explicit published launcher.
Native checks were `gemini skills list`, `hermes skills list`, `opencode debug skill`
and `opencode debug config`; all exited 0. The Pi experiment imports the installed
`@earendil-works/pi-coding-agent` resource loader rather than recreating its filter.
The machine-specific source logs and effective configurations remain local because
they include unrelated installed tools and paths. Their hashes are in the sanitized
receipt; no credentials or private configuration is committed.

This cut supplements the earlier compatibility and discovery research. It does not
rewrite those snapshots, certify the pending immutable installer correction B-186,
or claim that merged member fixes have already been released and installed.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- task-pipeline — released visibility rollout and native readback
- evidence-docs — measured text reduction and explicit acceptance limits
