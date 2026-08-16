# Audit — make-skill 0.19.1 (HEAD cbb8851, 1 commit past tag v0.19.1)
Gate green (`npm test` exit 0), `claude plugin validate --strict` green on both manifests, versions synchronised across all eight surfaces; the defects below are in the checker, its self-tests, and the documents that describe them.

## F-make-skill-01 — Both checkers drop the continuation lines of a multi-line YAML description, so a 1435-char description is reported as 200 and passes
- **Dimension:** budget
- **Severity:** blocker
- **Evidence:** `plugins/make-skill/skills/make-skill/scripts/audit_skill.py:99-122` (`parse_frontmatter` handles `block` and `map` continuations only; an indented line while `mode is None` falls through and is discarded) and the identical omission in `test/validate.py:203-224`. Planted a description as a legal multi-line plain YAML scalar:
  ```
  $ python3 plugins/make-skill/skills/make-skill/scripts/audit_skill.py /tmp/.../aud/multiline --house
  PASS DESC_LENGTH        multiline/SKILL.md:3         description is 200/1024 chars
  PASS DESC_HEADROOM      multiline/SKILL.md:3         description is 200/970 chars, inside the working limit
  0 GAP, 12 PASS
  $ python3 -c "import yaml,re; ... print(len(fm['description']))"
  multiline: real description length = 1435 (spec max 1024)
  ```
  Same defect in the repo's own gate — a copy of this repo with the SKILL.md description extended to a real length of 1769 chars:
  ```
  $ python3 test/validate.py
  PASS: make-skill structure valid (1 cursor rule(s))
  ```
  Anthropic's rule confirmed live 2026-08-16 at https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview — "`description`: Must be non-empty / Maximum 1024 characters".
- **Why it matters:** the family's standard-keeper hands a clean bill to a skill the Skills API rejects on upload, and the failure surfaces on someone else's machine. Every `/skill-audit` verdict on every skill in and outside the family inherits it; `make-skill`'s own gate cannot catch it either.
- **Fix:** in both `parse_frontmatter` implementations, append an indented line to the current scalar when `mode is None` and the key holds a string (plain multi-line scalar), or refuse a frontmatter shape the subset parser cannot represent rather than measuring a truncation. Files: `plugins/make-skill/skills/make-skill/scripts/audit_skill.py`, `test/validate.py`. Add the plant to `.github/workflows/validate.yml` and to the auditor step.
- **Blast:** 3
- **Effort:** 1

## F-make-skill-02 — `allowed-tools: [Read, Write]` is read as a string, so the TOOLS_TYPE check never fires on the list form it exists to catch
- **Dimension:** budget
- **Severity:** major
- **Evidence:** `plugins/make-skill/skills/make-skill/scripts/audit_skill.py:249-251` gaps only when `allowed-tools` is not a `str`; `parse_frontmatter` returns the inline flow sequence as the literal string `"[Read, Write]"`. Same in `test/validate.py:314-317`.
  ```
  $ python3 .../audit_skill.py /tmp/.../aud/flowtools --house
  0 GAP, 12 PASS      # frontmatter: allowed-tools: [Read, Write]
  $ python3 -c "import yaml,...: print(type(fm['allowed-tools']).__name__, fm['allowed-tools'])"
  flowtools: allowed-tools type = list value = ['Read', 'Write']
  $ cd <copy of repo with allowed-tools: [Read, Write] added to SKILL.md>; python3 test/validate.py
  PASS: make-skill structure valid (1 cursor rule(s))
  ```
  The rule the check is written for is stated at `references/agent-skills-spec.md:79-81`: "`allowed-tools` is a single space-separated **string**, not a YAML list."
- **Why it matters:** the inline flow sequence is the most common way authors write a tool list, and it is exactly the portability defect the rule exists to catch — the skill works in Claude Code and silently loses its tool grant on every other host. The check reports PASS instead.
- **Fix:** detect an inline flow sequence (`^\[.*\]$` after unquoting) and a block sequence in both `parse_frontmatter`s and return a list, so the existing `isinstance(..., str)` gap fires. Files: `plugins/make-skill/skills/make-skill/scripts/audit_skill.py`, `test/validate.py`; add a plant.
- **Blast:** 3
- **Effort:** 1

## F-make-skill-03 — The shipped auditor never applies the 4750-token body working limit, even under `--house`, while the canon states it as a rule for every skill
- **Dimension:** budget
- **Severity:** major
- **Evidence:** `test/validate.py:185` defines `BODY_TARGET_TOKENS = 4750` and `:348-356` fails past it. `plugins/make-skill/skills/make-skill/scripts/audit_skill.py:274-290` (`_check_body_budget`) has no equivalent constant or branch — grep for `4750` in the auditor returns nothing; the file's only working limit is `DESC_TARGET = 970` (:36, applied at :231-238 under `--house`). The canon states both headrooms as one rule: `plugins/make-skill/skills/make-skill/SKILL.md:80-81` "Body **< 500 lines and < 5000 tokens**, and hold **5% headroom**", and `:105-106` "Hold **5% headroom here too** (≤970 of 1024)". So `--house` applies one of the two.
  Secondary: the flag's own documentation is wrong in the other direction — `audit_skill.py:17-18` and `:453-454` say `--house` adds "Use-when opener, EN+RU triggers" and never mention `DESC_HEADROOM`, which it does apply.
- **Why it matters:** `SKILL.md:210-214` tells every agent to run this auditor first for the mechanical half of a retrofit. A member skill at 4999 tokens gets `0 GAP` from the family's auditor and would be refused by `make-skill`'s own gate — two verdicts on one rule, and the one users get is the permissive one.
- **Fix:** add `BODY_TARGET_TOKENS = 4750` to `audit_skill.py` with a `--house`-gated `BODY_HEADROOM` gap mirroring `DESC_HEADROOM`; correct the docstring and `--help` text for `--house`. File: `plugins/make-skill/skills/make-skill/scripts/audit_skill.py`; add the plant to the auditor step in `.github/workflows/validate.yml`.
- **Blast:** 3
- **Effort:** 1

## F-make-skill-04 — The guard that stops the two checkers drifting compares exactly one of the eleven rules they duplicate
- **Dimension:** budget
- **Severity:** minor
- **Evidence:** `test/validate.py:879-888` extracts `XML_TAG_RE` from `audit_skill.py` and fails on a mismatch — the only cross-check. The two files independently duplicate: `NAME_MAX/64`, `DESC_MAX/1024`, `DESC_TARGET(_CHARS)/970`, `COMPAT_MAX/500`, `BODY_MAX_LINES/500`, `BODY_MAX_TOKENS/5000`, `CHARS_PER_TOKEN/3.9`, `TOC_MIN_LINES`/`REF_TOC_MIN_LINES`/100, `SPEC_KEYS`, `HOST_KEYS`/`CC_SKILL_KEYS`, `PERSON_RE` — none compared. They agree today on all eleven; F-make-skill-03 is a twelfth rule on which they already disagree, and nothing reported it.
- **Why it matters:** the stated invariant is "one rule, one implementation" (`test/validate.py:879-880`); a guard covering 1 of 12 lets the next divergence ship the same way the body-headroom one did.
- **Fix:** extend the comparison in `test/validate.py` to parse every shared constant and regex out of `audit_skill.py` and diff the set, or move the shared constants into a single module the auditor imports with a stdlib fallback. Files: `test/validate.py`, `plugins/make-skill/skills/make-skill/scripts/audit_skill.py`.
- **Blast:** 1
- **Effort:** 1

## F-make-skill-05 — `CHARS_PER_TOKEN = 3.9` is labelled "measured, not assumed", but the repo holds no measurement, no script and no data, and the cited measurement is against cl100k rather than the tokenizer Claude uses
- **Dimension:** budget
- **Severity:** major
- **Evidence:** `test/validate.py:187` `CHARS_PER_TOKEN = 3.9  # measured, not assumed — see the comment at the budget check`; `:331-336` "tokenizing this bundle (2026-08-03, cl100k) gives 3.78-4.47 chars/token, 3.9 for SKILL.md itself"; `plugins/make-skill/skills/make-skill/scripts/audit_skill.py:40-43` repeats it. A repo-wide search for any artifact that could reproduce it returns only those comments:
  ```
  $ grep -rn -i --include='*.py' --include='*.js' --include='*.sh' --include='*.yml' --include='*.json' \
      -e tiktoken -e cl100k -e count_tokens -e chars_per_token .
  test/validate.py:187,332,333   plugins/.../audit_skill.py:43,276,286
  ```
  No tokenizer is a dependency here (`package.json` has none; the validator is stdlib-only by rule, `CONTRIBUTING.md:33`), so nobody can re-run it. cl100k is OpenAI's BPE; `SKILL.md:295-298` calls it "a real tokenizer" and treats `claude plugin details` (~2.8 chars/token, i.e. ~1.39× more tokens) as merely pessimistic. Anthropic states the budget as "Under 5k tokens" (https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview, read 2026-08-16) without naming a tokenizer, and offers a free authoritative count endpoint that the repo never mentions.
- **Why it matters:** every budget verdict this family issues — `0 GAP` on `make-skill` itself at "~4742 tokens", the 4750 working limit, every `/skill-audit` on every other skill — is a division by a constant whose provenance is a sentence. If the real ratio for a given body is 3.0, a skill passing at 4900 estimated is ~6400 actual and over budget; the repo's own doctrine ("a number you typed by hand is an assertion", `SKILL.md:299-302`) applies to this number and is not applied to it.
- **Fix:** record the measurement as an artifact — a script under `test/` (optional dependency, skipped when absent) that tokenizes the shipped bundle and prints the ratio, plus a dated row in `docs/evidence/verification.md`; and state in `SKILL.md`/`references/agent-skills-spec.md` which tokenizer the 5000 is being counted against, naming Anthropic's `count_tokens` endpoint as the authority for a Claude-surface budget. Files: `test/validate.py`, `plugins/make-skill/skills/make-skill/scripts/audit_skill.py`, `plugins/make-skill/skills/make-skill/SKILL.md`, `plugins/make-skill/skills/make-skill/references/agent-skills-spec.md`, `docs/evidence/verification.md`.
- **Blast:** 3
- **Effort:** 2

## F-make-skill-06 — Twenty-plus validator rules have never been watched failing, including the stray-`SKILL.md` rule and the release-gate guard, against this repo's own written requirement
- **Dimension:** gate
- **Severity:** major
- **Evidence:** `CONTRIBUTING.md:135-139`: "Any new rule needs a **negative test** … A validator nobody has watched fail proves nothing — this repo shipped a vacuous self-test for three releases." The nine `Negative self-test` steps in `.github/workflows/validate.yml` plant 33 defects; the following `fail()` branches in `test/validate.py` are not among them. I planted eight of them by hand and confirmed each fires — so they work, and nothing in CI would notice if they stopped:
  ```
  lines        rc=1  - SKILL.md body is 714 lines, spec recommends < 500 …      (validate.py:339-341; the `tokens` plant at .github/workflows/validate.yml:143 appends ONE long line, so BODY_MAX_LINES is untested)
  stray        rc=1  - stray SKILL.md at docs/SKILL.md …                        (validate.py:699-709)
  files        rc=1  - package.json: files[] must whitelist 'plugins'           (validate.py:593-596)
  arghint      rc=1  - argument-hint must be quoted …                           (validate.py:497-500)
  relgate      rc=1  - release.yml: no job declares `needs: validate` …         (validate.py:444-447)
  mdclink      rc=1  - cursor/rules/make-skill.mdc: relative link …             (validate.py:615-617)
  hooktimeout  rc=1  - hooks/hooks.json (PostToolUse): no timeout               (validate.py:556-557)
  scriptexec   rc=1  - scripts/audit_skill.py: not executable (chmod +x)        (validate.py:534-535)
  ```
  Also with no plant: reserved marketplace name (`:88-90`), `owner.name` required (`:91-93`), empty `plugins[]` (`:96-97`), marketplace-entry unknown fields (`:100-102`), `check_paths` (`:63-76`), source dir ≠ plugin name (`:120-122`), an extra *file* in `.claude-plugin/` (`:145-146`), the three-way name-sync check (`:401-403`), `name` > 64 chars (`:254-255`), missing/oversize `compatibility` (`:302-311`), `license`/`allowed-tools`/`metadata` types (`:312-327`), link-escape from `SKILL.md` (`:393-398`), missing CHANGELOG heading (`:460-462`), command frontmatter/description (`:492-496`), script compile + shebang (`:527-533`), hooks description/quoting/missing script (`:541-566`), agent frontmatter/name/description (`:574-580`), `package.json bin` (`:587-592`), cursor `.mdc` description/`alwaysApply` (`:610-613`), manifest-skeleton JSON/`$schema`/fields (`:664-694`), broken relative links repo-wide (`:898-915`), and the routed-trigger check (`:922-953`).
- **Why it matters:** the repository that tells the rest of the family "a validator that can't fail is decoration" (`README.md:106-112`) ships most of its own rules undemonstrated. The `relgate` guard is the one added after a sibling published over a red suite; it is protected by nothing.
- **Fix:** extend `.github/workflows/validate.yml` with plants for the rules above, prioritising `BODY_MAX_LINES`, the stray-`SKILL.md` rule, the release-gate triple and `package.json files[]`; each with a `grep -qi` on the expected message, as the existing groups do. File: `.github/workflows/validate.yml`.
- **Blast:** 1
- **Effort:** 2

## F-make-skill-07 — Thirteen of the shipped auditor's checks have never been watched failing, including both body-budget checks
- **Dimension:** gate
- **Severity:** major
- **Evidence:** the only assertions on `audit_skill.py` are `.github/workflows/validate.yml:374-411`: nine ids on the fixture (`NAME_RESERVED NAME_DIR DESC_PERSON DESC_XML FM_UNKNOWN_KEY REF_NO_TRIGGER LINK_ESCAPE WIN_PATH TIME_BRANCH`) plus `DESC_HEADROOM`. Never planted: `BODY_LINES`, `BODY_TOKENS`, `REF_NO_TOC`, `BUNDLE_NESTED`, `BUNDLE_UNREACHABLE`, `LINK_BROKEN`, `NAME_MISSING`, `NAME_LENGTH`, `NAME_CHARSET`, `NAME_XML`, `DESC_MISSING`, `DESC_LENGTH`, `DESC_USEWHEN`, `DESC_RU`, `COMPAT_TYPE`, `COMPAT_LENGTH`, `TOOLS_TYPE`, `META_TYPE`. I planted four of them by hand — `BODY_LINES` ("body is 603 lines, the budget is < 500"), `BODY_TOKENS` ("body is ~5744 tokens (22405 chars / 3.9)"), `DESC_LENGTH` ("description is 1123 chars, the maximum is 1024") fire; `TOOLS_TYPE` and `DESC_LENGTH`-via-multiline do not (F-make-skill-02, F-make-skill-01).
- **Why it matters:** the two false negatives this audit found (F-01, F-02) are both in the untested set. This is the artifact that travels to every agent and issues the family's verdicts, and its budget checks — the subject of the whole skill — are asserted nowhere.
- **Fix:** add a fixture-per-check loop to the "Bundled auditor" step in `.github/workflows/validate.yml` that materialises a minimal skill dir per check id and requires that id in `--json` output. File: `.github/workflows/validate.yml`.
- **Blast:** 3
- **Effort:** 2

## F-make-skill-08 — `SKILL-CARD.md` and `RESULTS.md` both say "20 trigger queries" where `triggers.json` holds 22, and the counted-claims guard does not cover that number
- **Dimension:** docs
- **Severity:** major
- **Evidence:**
  ```
  $ python3 -c "import json; print(len(json.load(open('test/evals/triggers.json'))['queries']))"
  22
  ```
  `SKILL-CARD.md:17` — "Suite authored — 20 trigger queries, 4 behavioural scenarios."; `test/evals/RESULTS.md:5` — "`triggers.json` (20 queries) and `scenarios.json` (4 behavioural scenarios)". Scenario count (4) is correct. `test/validate.py:805-814` (`COUNTED_CLAIMS`) compares only "N-item checklist", "the N files under references/", and "N groups of negative self-tests" — the trigger-query count is not in the list, and `RESULTS.md` sits under `test/evals/`, which `tracked_docs()` does scan, so adding the pattern would have caught both.
- **Why it matters:** `SKILL-CARD.md` is the one page a reviewer reads before installing, and its evaluation-status row is a number typed by hand — precisely the defect class `COUNTED_CLAIMS` was built for and the one `SKILL.md:299-302` warns about by name.
- **Fix:** correct both strings to 22 and add `(re.compile(r"(\d+) trigger quer(?:y|ies)"), len(queries), …)` and `(re.compile(r"triggers\.json` \((\d+) queries\)"), …)` to `COUNTED_CLAIMS`, with a plant. Files: `SKILL-CARD.md`, `test/evals/RESULTS.md`, `test/validate.py`, `.github/workflows/validate.yml`.
- **Blast:** 2
- **Effort:** 1

## F-make-skill-09 — The verification ledger is pinned to v0.18.1, two releases behind what shipped, and no document links to it
- **Dimension:** docs
- **Severity:** major
- **Evidence:** `docs/evidence/verification.md:18` "## Shipped state — v0.18.1, `main` at `ba01f8f`"; `:12-14` "Every row below was confirmed against v0.18.1 as it stands on `main` and on npm". Shipped state today is 0.19.1 (`package.json`, `plugin.json`, `marketplace.json`, `CHANGELOG.md` top, `git tag --sort=-v:refname | head -1` → `v0.19.1`, `npm view @ssheleg/make-skill version` → `0.19.1`). Rows now false as written: `:29` "all four → `0.18.1`", `:32` "`make-skill installer v0.18.1`" (actual: `node bin/make-skill.js --version` → `0.19.1`), `:33` "npm serves exactly the version this tree claims → `0.18.1`", `:34` "newest tag matches the shipped version → `v0.18.1`". Row `:28` also restates `0 GAP, 10 PASS` for a command whose `--house` form (the one CI runs and `SKILL.md:214` prescribes) prints `0 GAP, 13 PASS`.
  Reachability: no markdown link to it exists anywhere. Its only inbound mention is the guarded-files list in the generated `docs/AGENT_SYNC.md:34`; `README.md:267` describes the directory as `docs/evidence/{specs,plans}/  # historical design records`, omitting it, and `SKILL-CARD.md:35-48` ("What to check before you trust it") never names it.
- **Why it matters:** the file's own opening (`:4-5`) says a row sits at `never` until watched passing on the **shipped** artifact. Two releases shipped with zero rows verified, and the file reads as a green ledger. A reviewer cannot find it to notice.
- **Fix:** re-run the ten rows against 0.19.1 and update the heading, commit and per-row results; add the `--house` invocation to REQ-004; link it from `SKILL-CARD.md`'s check-list and from `README.md`'s layout block. Files: `docs/evidence/verification.md`, `SKILL-CARD.md`, `README.md`.
- **Blast:** 2
- **Effort:** 1

## F-make-skill-10 — README's family roster lists six members; the family has eight
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `README.md:284` — "`super-ux`, `task-pipeline`, `agent-sync`, `make-skill`, `sheleg-design`, `seo-aeo-audit`."
  ```
  $ python3 -c "import json;print([s['name'] for s in json.load(open('skills.json'))['skills']])"   # umbrella
  ['super-ux','task-pipeline','agent-sync','make-skill','sheleg-design','seo-aeo-audit','sheleg-dev','agent-stack']
  ```
  `sheleg-dev` and `agent-stack` are missing, and the same README already links `ssheleg/agent-stack` at `:155-156` as the home of the protocol references — so the page names a member in one place and omits it from the roster in another.
- **Why it matters:** the paragraph's own point is that "the family installs and updates as one package"; a roster short by two tells a reader the bundle is smaller than what `npx sshlg-skills install` puts on their machine.
- **Fix:** update the list at `README.md:284` and have `test/validate.py` compare it against the umbrella's `skills.json` when one is above the checkout, using the same disclose-when-absent pattern as `check_routed_triggers_still_advertised()`. Files: `README.md`, `test/validate.py`.
- **Blast:** 2
- **Effort:** 1

## F-make-skill-11 — CONTRIBUTING promises a snippet that runs "the entire CI suite locally exactly as GitHub does"; it skips an entire job, including both `claude plugin validate --strict` gates
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `CONTRIBUTING.md:41-56` — "To run the entire CI suite locally exactly as GitHub does — validator, 9 negative self-test groups, installer functional tests against a throwaway `HOME`, and YAML parsing" — and the snippet iterates `d['jobs']['validate']['steps']` only.
  ```
  $ python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/validate.yml')); print(list(d['jobs'].keys()))"
  ['validate', 'claude-plugin-validate']
  ```
  The skipped job (`.github/workflows/validate.yml:492-509`) is the one that runs `claude plugin validate ./plugins/make-skill --strict` and `claude plugin validate . --strict` — the two gates `CONTRIBUTING.md:82-85` and `SKILL.md:185` call non-negotiable.
- **Why it matters:** a contributor who runs the snippet and sees every step PASS believes both upstream gates ran. That is the failure mode this repo named in v0.19.1 — "a check that cannot look must never read as one that looked".
- **Fix:** iterate every job in the snippet, or state plainly that the `claude-plugin-validate` job needs the `claude` CLI and give its two commands separately. File: `CONTRIBUTING.md`.
- **Blast:** 1
- **Effort:** 1

## F-make-skill-12 — No contributor-facing document names `npm test`, the plant guard, or the routed-trigger check the gate has run since v0.19.0/v0.19.1
- **Dimension:** docs
- **Severity:** minor
- **Evidence:**
  ```
  $ grep -n "npm test\|plant_guard\|advertised\|routed trigger" CONTRIBUTING.md README.md SKILL-CARD.md
  (no output)
  ```
  The actual gate is `package.json:48` — `"test": "python3 test/validate.py && python3 test/plant_guard_test.py"`. `CONTRIBUTING.md:31-39` ("Running the checks") names only `python3 test/validate.py`; its enumerated "Rules the validator enforces" (`:60-119`) predates and omits the routed-trigger rule added at `test/validate.py:922-953`, which also introduces an undeclared `node` dependency and a new "unlooked:" disclosure line a reader will see and cannot look up. `SKILL-CARD.md:26` inventories the repo's executable code and lists `test/validate.py` but not `test/plant_guard.py` / `test/plant_guard_test.py`, added in v0.19.0; `SKILL-CARD.md:43` still tells a reviewer to "Run `python3 test/validate.py`".
- **Why it matters:** the documented way to verify a change is now a subset of the real gate, and the reviewer-facing code inventory — the basis of the risk-tier disclosure — is missing two shipped scripts.
- **Fix:** name `npm test` as the gate in `CONTRIBUTING.md` and `SKILL-CARD.md`, add the routed-trigger rule and its `node` requirement plus the disclosure behaviour to the enforced-rules list, and add the plant-guard scripts to the `SKILL-CARD.md` code-execution row. Files: `CONTRIBUTING.md`, `SKILL-CARD.md`.
- **Blast:** 1
- **Effort:** 1

## F-make-skill-13 — `GRAPH_REPORT.md` was not regenerated with `graph.json`, so the freshness line it tells the reader to trust names a commit three behind while the graph is one behind
- **Dimension:** graph
- **Severity:** minor
- **Evidence:**
  ```
  $ python3 -c "import json;print(json.load(open('graphify-out/graph.json'))['built_at_commit'])"
  5e5d1fd485a554c0558e22acafd8afe9aa8fa368
  $ grep -n "Built from commit" graphify-out/GRAPH_REPORT.md
  13:- Built from commit: `432a0dd1`
  $ git rev-parse HEAD
  cbb88511a82f7c540fcacd0bf46c7c7e765d66f5
  $ git rev-list --count 5e5d1fd..HEAD; git rev-list --count 432a0dd..HEAD
  1
  3
  $ ls -la graphify-out/GRAPH_REPORT.md graphify-out/graph.json
  ... Aug 15 16:41 GRAPH_REPORT.md
  ... Aug 16 20:44 graph.json
  ```
  `graphify-out/GRAPH_REPORT.md:1` is also headed "(2026-08-15)" and `:14` instructs "Run `git rev-parse HEAD` and compare to check if the graph is stale." The dated snapshot `graphify-out/2026-08-16/GRAPH_REPORT.md` carries the same 2026-08-15 header and the same `432a0dd1`. `graphify-out/` is gitignored (`.gitignore:4`), untracked (`git ls-files graphify-out` → 0 files).
- **Why it matters:** the umbrella's v0.79.0 note claims every graph is at HEAD; the machine record says 1 commit behind (an unreleased chore commit), but the only human-readable freshness statement says 3, and it is the one a reader is told to compare against. Two build records in one directory, and the wrong one is the readable one.
- **Fix:** regenerate `GRAPH_REPORT.md` in the same run that writes `graph.json`, or have the report read `built_at_commit` from `graph.json` instead of embedding its own copy. Also correct the date header in the `2026-08-16/` snapshot.
- **Blast:** 2
- **Effort:** 1

## F-make-skill-14 — SKILL.md's release step cites the global operator instruction as its authority and then prescribes the per-member command that instruction forbids
- **Dimension:** docs
- **Severity:** minor
- **Evidence:** `plugins/make-skill/skills/make-skill/SKILL.md:312-315` — "**refresh THIS machine's global installs as Definition of Done** (per global `~/.claude/CLAUDE.md`): `claude plugin marketplace update <name>` → `claude plugin update <name>@<name>` → `npx skills update <name> --global --yes && rm -f ~/.claude/skills/<name>`". The cited file says the opposite: `~/.claude/CLAUDE.md` — "**Никогда не запускай голый `npx skills update <name>` для скила, который стоит плагином**" and "`npx --yes sshlg-skills@latest update` … Аргумент участника она не принимает намеренно: обновлённый в одиночку член оставляет набор в комбинации, которую никто не тестировал." This member's own `README.md:206-217` leads with the launcher and marks the per-channel table "when you are updating this one member only"; `SKILL.md` names the launcher nowhere in the release step.
- **Why it matters:** the release step is the one an agent executes at the end of every release of a family member, and it is the only place in the canon that quotes an authority it contradicts. The `rm -f` covers the shadow-copy half of the reason; the untested-combination half is not covered at all.
- **Fix:** in `SKILL.md`'s Release section, make `npx --yes sshlg-skills@latest update` the path for a family member and keep the per-channel commands for a standalone skill, matching `README.md:206-232`. File: `plugins/make-skill/skills/make-skill/SKILL.md`.
- **Blast:** 2
- **Effort:** 1

TOTAL: 14 findings (1 blocker, 7 major, 6 minor)
