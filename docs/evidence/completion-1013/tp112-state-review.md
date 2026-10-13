<sub>ssheleg skills — task-pipeline · evidence-docs</sub>

# Independent TP112 state-conservation correction review

Reviewed `4fdbbca8f24378ff2719007d6b585c87705406ee` and follow-up
`0fec61250e8e4314a96edc15887834e0e978f26d` in the task-pipeline owner.
The initial fix conserves the lesson index on incomplete discovery, rejects
ambiguous plan IDs/graph targets, and refuses incomplete graph/assignment writes
before mutation. The reviewer found two further data-loss cases: explicitly
configured missing artifacts and dangling retro input were still silently skipped.
The author reproduced both before adding explicit lstat/stat admission.

Coordinator read both script diffs, all new controls and matching doctrine;
independently reran `python3 test/lessons_test.py` (111 cases) and
`python3 test/waves_test.py` (85 cases), both exit0. The unavailable
OBSERVATORY_ENGINE_DIR redactor integration was explicitly skipped.
Six separate source-stat probes passed: nested missing path, nondirectory parent,
self-referential link, dangling direct link, dangling ancestor and valid link.
Owned temporary fixtures were removed. No operator index was touched.

Verdict: bounded source review PASS. The complete owner gate and genuine frozen
candidate checks remain separate. PR116 targets the existing iteration feature
branch, not canonical main. Original TP112/TP114 acceptance and outstanding
L3 doctrine/schema requests must not be inferred closed from this correction.

TP114 at `6875e04b1a5d4ec2c3ca599d8bbb61e480b401f3` was independently read
as a complete diff; checkpoint72, nudge40 and installer48 controls passed.
[Machine receipt](tp114-review.json) preserves log hashes. The run marker is
bound to topic/start-date/ledger identity; it is not merely a global off switch.
Installer behavior is individually transactional, not group-atomic across skills.
Normal integration, exact-main release and installed acceptance remain pending.

---
**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**
- task-pipeline — bounded delivery and review
- evidence-docs — source identity and verification limits
