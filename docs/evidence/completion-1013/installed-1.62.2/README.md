# Published 1.62.2 installed readback

The published update exited 0, but exact-set acceptance is **PARTIAL**. Plain skill payloads and all nine installed Codex plugins match the 1.62.2 pins. Claude's floating marketplace update installed two different source cuts. [Command observation](update.json) and [native payload comparison](native-readback.json) preserve this distinction.

## Plain destinations

All 39 skills / 550 expected source files match at the measured destinations. Continue has 39 real directories; Hermes, OpenClaw, Windsurf, Kiro and Goose each have 39 directory symlinks. Cursor, OpenCode, Kilo, Gemini, Codex, Kimi and Zed use the shared canonical store under the pinned skills CLI's universal-agent dispatch. Shared-store equality is not evidence that every host loaded or invoked each skill.

The first readback incorrectly used four agents' `globalSkillsDir` fields directly. It reported missing Cursor/OpenCode/Kilo/Gemini directories and is retained as [an invalid destination assumption](plain-initial-assumption.json), not an installation defect. Inspection of skills@1.7.2 `dist/cli.mjs` found `isUniversalAgent` at line2182, `getAgentBaseDir` at2216 and the global universal early return at2337; these select the canonical shared store for those agents. Inspected CLI SHA256: `72f1805ea4f6c62b0532cb77a9f021e7930bb7ca962f87a3fbf985d1ada5d56d`. [Corrected result](plain-readback.json), reproducible with `python3 docs/evidence/completion-1013/installed-1.62.2/verify-plain.py` in this checkout, compares every expected file from the immutable 1.62.2 member commits. Extra destination files are outside this comparison.

## Native drift found, not masked

Codex reports nine installed family plugins at the expected versions; every expected plugin file matches its pin. Claude has eleven family plugins, with two exceptions:

- SEO reports version0.26.5, but its installed registry records source `dd5319a8935d60d0db7b3649b528d31d0b9ac45f`, ahead of pinned `bccb630e79730e2a7058b74a2130ddfe4f4662aa`; eight plugin files differ.
- Agent-stack reports0.27.2 at source `792e3f6cb2e46517f0187066db55edc63ae7d12c`, while the hub pins0.27.1 at `cb8f6993a61473f3974bc3af67925439ed4abb75`; its plugin manifest differs.

This is B-187. Re-pinning the hub alone could hide today's mismatch without fixing the floating update path. A separate owner task investigates the host-supported immutable source and readback mechanism in an isolated configuration. No direct cache edit or operator reinstall occurred during this diagnosis.

## Runtime and preservation

The [runtime comparison](runtime.json) has no missing/differing files; the 75-file wired runtime is1.62.2. `node bin/sshlg-skills.js hooks status` exited0 and reported all hooks matching.

[Preservation](preservation.json) proves byte identity for Claude/Gemini/Pi/OpenCode/Hermes settings, machine state/pack marks and four instruction files. Claude's nonfamily plugin registry entries are unchanged. Codex's native CLI changed only seven family marketplace refs; [parsed key-path comparison](codex-config-preservation.json) verifies that bound. Raw settings backups remain private with0600 files in a0700 directory; no raw configuration is tracked here.

[Domain readback](domains.json): 35 owned project entries match, zero mismatches, no pending user writes. The previously unsupported noncanonical JSON file is now accepted; [foreign property bytes and keys](domain-foreign-preservation.json) remain unchanged. Three subsequent real apply runs compare all37 settings/ownership files by hash in [the idempotence receipt](domains-idempotence.json). Two invalid Git roots still preserve global domain enablement, and hook-bearing sheleg-dev stays global. No unknown-root exclusion or unverified global disable is claimed.

## Next task

Complete B-187, then compose accepted owner releases into a new hub cut and repeat publication/installed readback. Native task quality remains separately NO_ADOPTION in [the pilot](../native-quality-v1/README.md); file equality cannot close that question.
