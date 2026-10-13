<sub>ssheleg skills — evidence-docs</sub>

# Agent-stack 0.28.1 independent source and publication review

2026-10-13. Publication provenance: **PASS_BOUNDED**. New restart doctrine: **NEEDS_CORRECTION before hub adoption**. Review source is `cd6421b8ca7d9440bc87e366ebd8a96bb38b69b8`, compared with hub member `e2120c272c884ab4351c610148bbc0a4526c4067` (0.27.2). No owner checkout, tag or installed configuration changed.

## Publication and source scope

The complete eight-file diff contains four version homes, changelog, verification receipt, agent-orchestrator SKILL.md and runtime reference. No script, installer, validator or workflow changed. The four metadata homes agree on0.28.1. Annotated tag `v0.28.1` peels to the reviewed commit. The existing mistaken `v0.28.0` peels to `cb8f6993a61473f3974bc3af67925439ed4abb75`; it was not changed.

[Release38355706771](https://github.com/ssheleg/agent-stack/actions/runs/38355706771) is completed/success on the exact source: validate/validate, House skill audit, release and publish all succeeded. [The bounded job receipt](agent-stack-0281-release.json) records their URLs. No broad local suite was repeated.

`npm view @ssheleg/agent-stack@0.28.1 version gitHead dist --json` returned the exact Git commit. The registry tarball passed its SHA512 integrity and SHA1 checksum. All44 regular files match immutable Git bytes; the published set exactly equals tracked bin/plugins plus package.json and the declared root publication files. [Payload receipt](agent-stack-0281-payload.json) includes each path/hash. This is whole-payload byte provenance, not independent cryptographic verification of npm attestation signatures or model behavior.

## Findings requiring owner correction

1. **Restart isolation is unspecified.** [runtime.md:68](https://github.com/ssheleg/agent-stack/blob/cd6421b8ca7d9440bc87e366ebd8a96bb38b69b8/plugins/agent-stack/skills/agent-orchestrator/references/runtime.md#L68) directs an agent to stop the workflow when one lane stops. A minimal counterexample has lane A report a quota stop while lane B has an uncheckpointed outward request in flight. The clause at lines60–62 checks the silent worker's own command, not every sibling. Stopping the workflow can lose B's result; same run ID/arguments do not establish safe replay of its uncertain effect. Existing general checkpoint doctrine is useful but does not prove every host implements it. Acceptance: resume only the owned stopped unit through supported host semantics; whole-workflow interruption requires explicit sibling/checkpoint/in-flight admission, and uncertain outward effects are reconciled before retry. A two-lane negative scenario must refuse global stop while B remains active.
2. **Repeated retries have no explicit terminal bound in the new mechanics.** [runtime.md:74](https://github.com/ssheleg/agent-stack/blob/cd6421b8ca7d9440bc87e366ebd8a96bb38b69b8/plugins/agent-stack/skills/agent-orchestrator/references/runtime.md#L74) says2,5,10 then every15 minutes, while [SKILL.md:135](https://github.com/ssheleg/agent-stack/blob/cd6421b8ca7d9440bc87e366ebd8a96bb38b69b8/plugins/agent-stack/skills/agent-orchestrator/SKILL.md#L135) says cap attempts and return the best partial. An unchanged hard quota without a rotator follows the new mechanics indefinitely. Billing refusal is not a cap on nonbilling usage/rate failures. Acceptance: bind retry eligibility to the existing attempt/deadline/resource budget, preserve provider retry-after/known reset constraints, recheck current task authority, and switch to a durable watcher/partial state when exhausted. Include a fixed-quota repeated-stop case and revoked-task case, without adding a new human permission gate for already authorized work.
3. **Host-specific behavior is presented as a general guarantee.** The table at line68 promises finished agents replay from cache and line72 says changed arguments repay the whole run. These depend on host cache/checkpoint contracts, yet no host/API is named. Lines49–52 assert restarts usually work; the changelog's six-lane anecdote has no linked run receipt. Acceptance: qualify mechanics by a verified named host capability, otherwise state unknown; source the observation or label it bounded anecdotal evidence. This is a documentation scope defect, not proof that the anecdote is false.

Positive boundaries remain: no-running-command check before treating silence as a stall; no-loop handling for spend/credit/billing failures; restart journal; inherited typed fatal/retryable distinction and checkpoint guidance. Preserve them. The issue is the new unconditional instruction overriding those bounds, not an objection to prompt autonomous continuation.

## Next task

Owner agent-stack should make a bounded doctrine correction with explicit negative scenarios above and a new patch release under its policy; no retagging of0.28.0 or0.28.1. Parent decides hub pin integration after that evidence. This review does not claim a runtime defect was executed: counterexamples are semantic instruction paths in doctrine-only changes, not a production crash reproduction. No provider/model calls or local broad tests were made.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**: evidence-docs for source and publication claims.
