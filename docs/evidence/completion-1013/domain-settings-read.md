# C05 follow-up: settings reading versus editing

<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

As of 2026-10-13. Implementation evidence, not installed propagation or model-quality
acceptance. Baseline `2c4f099958269900cacc6a436c18e4b05b35ff12`; branch
`fix/domain-settings-read-1013`. This receipt intentionally contains no private
project names, settings contents or machine path inventory.

## Reproduced cause

The read-only domain preview reported 190 repositories, six incomplete. Independent
source/manifest scanning of those six found two Git failures (exit 128), while four
had successful Git listing, successful-or-no-match source grep, and no manifest
read/parse failures. The latter four had valid JSON project settings in a different
serialization from the editor's canonical two-space form.

`domainsInputs` in `bin/sshlg-skills.js` had used `D.editEnabled(text, {set: {}})`
to decide whether settings could be read. That function intentionally refuses
noncanonical formatting to avoid rewriting unrelated operator bytes. Applying the
write restriction to reading incorrectly converted complete source scans into
unknown coverage, even for shared settings which this command never edits.

## Delivered contract

`readEnabled` in `lib/domains.js` validates the JSON object and boolean
`enabledPlugins` map independently of whitespace. Absent settings/maps mean no
project choices; malformed JSON, non-object roots/maps and non-boolean choices stay
unknown. `domainsInputs` merges valid shared and local choices in the existing
precedence, and names the settings layer when it is unreadable or invalid.

The existing editor and write-format gate are unchanged. When a needed domain
requires a new local entry but its file cannot be edited losslessly, that member
remains global. Existing explicit true/false choices do not need a rewrite. Invalid
settings refuse writes as well as retaining uncertainty. No repositories are
excluded, and the two genuinely incomplete Git roots remain conservative blockers.

## Checks actually run

- New pure reader tests failed twice on the baseline because the reader did not
  exist; four process regressions failed on the baseline due to false uncertainty
  or missing settings diagnostics. A fifth process control checks that a canonical
  file with unknown non-boolean choices is preserved rather than overwritten.
- `node test/domains_test.js`: 36 checks pass.
- `node test/domains_profile_test.js`: 14 checks pass, including noncanonical
  shared choices, local false, required-write refusal and invalid-choice controls.
- `node test/domains_e2e_test.js`: 46 checks pass on final implementation. This
  retains the existing incomplete Git/manifest and ownership/revert controls.
- `node --check bin/sshlg-skills.js` and `git diff --check`: exit 0.
- Real read-only preview replay, same 190 repositories: baseline six partial,
  candidate two partial. Both print two managed-domain rows kept global for unknown
  coverage; the one write-format refusal remains. Neither run used `--apply`.

No foreign project/config repair, settings rewrite, provider call or complete suite
was performed. The implementation adds seven checks to existing suites, no new suite.
The real scan is a dated snapshot; counts can change as repositories change.

## Next task and residual work

Independently review the read/write separation, integrate under the current candidate
policy, and rerun the read-only preview from the delivered launcher. The two invalid
Git roots require an ownership-aware decision in their respective projects before
they can be repaired or deliberately removed from coverage. Unsupported settings
format remains a write blocker; this fix does not authorize reformatting it. Do not
disable domains globally while those sources remain unknown. Parent owns board,
DOCMAP count updates, release and installed propagation.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded fix and focused verification
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — measured implementation receipt
