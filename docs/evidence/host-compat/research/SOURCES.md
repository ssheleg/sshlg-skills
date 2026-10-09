# Host compatibility source links

71 unique source URLs mapped to 27 host families. Recorded ledger dates: 2026-10-09–2026-10-10.

Generated from [sources.json](sources.json) and [additional-sources.json](additional-sources.json). Contracts and limitations live in the machine-readable [host matrix](host-matrix.json) and [additional host matrix](additional-hosts.json).

Dates and statuses below are the researchers' recorded observations; this generator does not revisit URLs. `read` means the body was consulted. `BODY_UNAVAILABLE` means the page resolved but its body was unavailable to the research tool; it is not proof of the host contract. Documentation and installer support do not establish native runtime acceptance. Host families may contain distinct IDE, CLI or regional surfaces.

## Host-to-source mapping

| Host family | Contract matrix | Source IDs |
|---|---|---|
| aider | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [aider-config](#source-aider-config), [aider-conventions](#source-aider-conventions) |
| amp | [host-matrix.json](host-matrix.json) | [amp-global](#source-amp-global), [amp-instructions](#source-amp-instructions), [amp-skills](#source-amp-skills) |
| antigravity | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [antigravity-rules](#source-antigravity-rules), [antigravity-skills](#source-antigravity-skills) |
| augment | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [augment-rules](#source-augment-rules), [augment-skills](#source-augment-skills) |
| claude-code | [host-matrix.json](host-matrix.json) | [claude-plugins](#source-claude-plugins), [claude-skills](#source-claude-skills) |
| cline | [host-matrix.json](host-matrix.json) | [cline-rules](#source-cline-rules), [cline-skills](#source-cline-skills) |
| codex | [host-matrix.json](host-matrix.json) | [codex-hooks](#source-codex-hooks), [codex-plugins](#source-codex-plugins), [codex-skills](#source-codex-skills), [codex-subagents](#source-codex-subagents) |
| continue | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [additional-installer-implementation](#source-additional-installer-implementation), [continue-cli-source](#source-continue-cli-source), [continue-core-source](#source-continue-core-source), [continue-env-source](#source-continue-env-source), [continue-rules](#source-continue-rules) |
| cursor | [host-matrix.json](host-matrix.json) | [cursor-components](#source-cursor-components), [cursor-rules](#source-cursor-rules), [cursor-rules-help](#source-cursor-rules-help), [cursor-skills](#source-cursor-skills) |
| gemini-cli | [host-matrix.json](host-matrix.json) | [gemini-context](#source-gemini-context), [gemini-skills](#source-gemini-skills) |
| github-copilot | [host-matrix.json](host-matrix.json) | [copilot-instructions](#source-copilot-instructions), [copilot-plugin](#source-copilot-plugin), [copilot-skills](#source-copilot-skills) |
| goose | [host-matrix.json](host-matrix.json) | [goose-hints](#source-goose-hints), [goose-hooks](#source-goose-hooks), [goose-skills](#source-goose-skills), [goose-source](#source-goose-source) |
| hermes | [host-matrix.json](host-matrix.json) | [hermes-context](#source-hermes-context), [hermes-hooks](#source-hermes-hooks), [hermes-skills](#source-hermes-skills) |
| junie | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [junie-guidelines](#source-junie-guidelines), [junie-skills](#source-junie-skills) |
| kilo | [host-matrix.json](host-matrix.json) | [kilo-agents](#source-kilo-agents), [kilo-rules](#source-kilo-rules), [kilo-skills](#source-kilo-skills) |
| kimi-code | [host-matrix.json](host-matrix.json) | [kimi-agents](#source-kimi-agents), [kimi-data](#source-kimi-data), [kimi-hooks](#source-kimi-hooks), [kimi-legacy-help](#source-kimi-legacy-help), [kimi-skills](#source-kimi-skills) |
| kiro | [host-matrix.json](host-matrix.json) | [kiro-skills](#source-kiro-skills), [kiro-steering](#source-kiro-steering) |
| mistral-vibe | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [mistral-agents](#source-mistral-agents), [mistral-skills](#source-mistral-skills) |
| openclaw | [host-matrix.json](host-matrix.json) | [openclaw-skills](#source-openclaw-skills), [openclaw-workspace](#source-openclaw-workspace) |
| opencode | [host-matrix.json](host-matrix.json) | [opencode-rules](#source-opencode-rules), [opencode-skills](#source-opencode-skills) |
| openhands | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [openhands-skills](#source-openhands-skills) |
| qwen-code | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [qwen-settings](#source-qwen-settings), [qwen-skills](#source-qwen-skills) |
| roo | [host-matrix.json](host-matrix.json) | [roo-instructions](#source-roo-instructions), [roo-skills](#source-roo-skills) |
| trae | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [trae-cn-rules](#source-trae-cn-rules), [trae-cn-skills](#source-trae-cn-skills), [trae-international-skills](#source-trae-international-skills) |
| warp | [additional-hosts.json](additional-hosts.json) | [additional-installer](#source-additional-installer), [warp-rules](#source-warp-rules), [warp-skills](#source-warp-skills) |
| windsurf | [host-matrix.json](host-matrix.json) | [windsurf-rules](#source-windsurf-rules), [windsurf-skills](#source-windsurf-skills) |
| zed | [host-matrix.json](host-matrix.json) | [zed-instructions](#source-zed-instructions), [zed-skills](#source-zed-skills) |

## Recorded source links

| Source ID and URL | Read / attempted date | Status | Kind | Sections inspected / limitation |
|---|---|---|---|---|
| <a id="source-additional-installer"></a>[additional-installer](https://raw.githubusercontent.com/vercel-labs/skills/v1.5.25/src/agents.ts) | 2026-10-10 | read | primary | Exact adapter IDs and globalSkillsDir; installer source only |
| <a id="source-additional-installer-implementation"></a>[additional-installer-implementation](https://raw.githubusercontent.com/vercel-labs/skills/v1.5.25/src/installer.ts) | 2026-10-10 | read | primary | Default symlink mode; universal agent exemption; copy fallback |
| <a id="source-aider-config"></a>[aider-config](https://aider.chat/docs/config/aider_conf.html) | 2026-10-10 | read | primary | Config roots and precedence |
| <a id="source-aider-conventions"></a>[aider-conventions](https://aider.chat/docs/usage/conventions.html) | 2026-10-10 | read | primary | Explicit read-only convention files |
| <a id="source-amp-global"></a>[amp-global](https://ampcode.com/docs/customize/global-plugins-and-skills) | 2026-10-09 | read | primary | Hosted vs machine-local skills |
| <a id="source-amp-instructions"></a>[amp-instructions](https://ampcode.com/docs/customize/agents-md) | 2026-10-09 | read | primary | Instruction roots and inclusion |
| <a id="source-amp-skills"></a>[amp-skills](https://ampcode.com/docs/customize/skills) | 2026-10-09 | read | primary | Sources and precedence; MCP |
| <a id="source-antigravity-rules"></a>[antigravity-rules](https://www.antigravity.google/docs/rules/) | 2026-10-10 | read | primary | Global and scoped rule locations; trigger metadata |
| <a id="source-antigravity-skills"></a>[antigravity-skills](https://www.antigravity.google/docs/skills?tab=ide) | 2026-10-10 | read | primary | 2.0, IDE and CLI skill locations |
| <a id="source-augment-rules"></a>[augment-rules](https://docs.augmentcode.com/cli/rules) | 2026-10-10 | read | primary | Custom rules, native/global rule directories, hierarchical guidance |
| <a id="source-augment-skills"></a>[augment-skills](https://docs.augmentcode.com/cli/skills) | 2026-10-10 | read | primary | Auggie native roots; exact priority; metadata |
| <a id="source-claude-plugins"></a>[claude-plugins](https://code.claude.com/docs/en/plugins-reference) | 2026-10-09 | read | primary | Plugin components; substitution versus shell environment |
| <a id="source-claude-skills"></a>[claude-skills](https://code.claude.com/docs/en/skills) | 2026-10-09 | read | primary | Locations; frontmatter; allowed-tools; account sync; string substitution |
| <a id="source-cline-rules"></a>[cline-rules](https://docs.cline.bot/customization/cline-rules) | 2026-10-09 | read | primary | Locations; global cross-tool instructions |
| <a id="source-cline-skills"></a>[cline-skills](https://docs.cline.bot/customization/skills) | 2026-10-09 | read | primary | Location and scope; global precedence |
| <a id="source-codex-hooks"></a>[codex-hooks](https://learn.chatgpt.com/docs/hooks) | 2026-10-09 | read | primary | Host-specific hooks |
| <a id="source-codex-plugins"></a>[codex-plugins](https://developers.openai.com/plugins/build/plugins) | 2026-10-09 | read | primary | Portable plugin manifests; compatibility layouts; hooks publishing restrictions |
| <a id="source-codex-skills"></a>[codex-skills](https://learn.chatgpt.com/docs/build-skills) | 2026-10-09 | read | primary | Skill discovery roots; optional openai.yaml |
| <a id="source-codex-subagents"></a>[codex-subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) | 2026-10-09 | read | primary | Native delegation |
| <a id="source-continue-cli-source"></a>[continue-cli-source](https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/util/loadMarkdownSkills.ts) | 2026-10-10 | read | primary | Directory scan, schema, slash names |
| <a id="source-continue-core-source"></a>[continue-core-source](https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/core/config/markdown/loadMarkdownSkills.ts) | 2026-10-10 | read | primary | IDE skill loader; separate from CLI |
| <a id="source-continue-env-source"></a>[continue-env-source](https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/extensions/cli/src/env.ts) | 2026-10-10 | read | primary | CONTINUE_GLOBAL_DIR default |
| <a id="source-continue-rules"></a>[continue-rules](https://docs.continue.dev/customize/deep-dives/rules) | 2026-10-10 | read | primary | Rules roots, ordering, invocation scope |
| <a id="source-copilot-instructions"></a>[copilot-instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions) | 2026-10-09 | read | primary | Locations; combined instructions |
| <a id="source-copilot-plugin"></a>[copilot-plugin](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference) | 2026-10-09 | read | primary | Loading order; Agent Plugins vs legacy |
| <a id="source-copilot-skills"></a>[copilot-skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills) | 2026-10-09 | read | primary | Locations; required metadata; script tools |
| <a id="source-cursor-components"></a>[cursor-components](https://prod.cursor.com/docs/customize-cursor) | 2026-10-09 | read | primary | Extension components |
| <a id="source-cursor-rules"></a>[cursor-rules](https://prod.cursor.com/docs/rules) | 2026-10-09 | read | primary | Project rules; AGENTS.md |
| <a id="source-cursor-rules-help"></a>[cursor-rules-help](https://prod.cursor.com/help/customization/rules) | 2026-10-09 | read | primary | User rule files; CLAUDE.md |
| <a id="source-cursor-skills"></a>[cursor-skills](https://prod.cursor.com/docs/skills) | 2026-10-09 | read | primary | Skill directories; nested and remote scope |
| <a id="source-gemini-context"></a>[gemini-context](https://geminicli.com/docs/cli/gemini-md/) | 2026-10-09 | read | primary | Context hierarchy; configurable filenames |
| <a id="source-gemini-skills"></a>[gemini-skills](https://geminicli.com/docs/cli/skills/) | 2026-10-09 | read | primary | Discovery tiers; precedence and aliases |
| <a id="source-goose-hints"></a>[goose-hints](https://github.com/aaif-goose/goose/blob/3bd852002903e016ff30947e973f76e2fcfcf90f/documentation/docs/guides/context-engineering/using-goosehints.md) | 2026-10-09 | read | primary | Global/local hints; Developer extension |
| <a id="source-goose-hooks"></a>[goose-hooks](https://github.com/aaif-goose/goose/blob/3bd852002903e016ff30947e973f76e2fcfcf90f/documentation/docs/guides/context-engineering/hooks.md) | 2026-10-09 | read | primary | Separate native hook contract |
| <a id="source-goose-skills"></a>[goose-skills](https://github.com/aaif-goose/goose/blob/3bd852002903e016ff30947e973f76e2fcfcf90f/documentation/docs/guides/context-engineering/using-skills.md) | 2026-10-09 | read | primary | Current primary repository after block/goose move |
| <a id="source-goose-source"></a>[goose-source](https://github.com/aaif-goose/goose/blob/3bd852002903e016ff30947e973f76e2fcfcf90f/crates/goose/src/skills/mod.rs) | 2026-10-09 | read | primary | global_skills_dir; skill_directories_with_config |
| <a id="source-hermes-context"></a>[hermes-context](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files/) | 2026-10-09 | read | primary | Priority system; Directory Chain; SOUL.md |
| <a id="source-hermes-hooks"></a>[hermes-hooks](https://hermes-agent.nousresearch.com/docs/user-guide/features/hooks) | 2026-10-09 | read | primary | Four hook systems; cache-safe sections |
| <a id="source-hermes-skills"></a>[hermes-skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/) | 2026-10-09 | read | primary | External Skill Directories; Project-Local Skills |
| <a id="source-junie-guidelines"></a>[junie-guidelines](https://junie.jetbrains.com/docs/guidelines-and-memory.html) | 2026-10-10 | read | primary | AGENTS precedence and legacy fallback |
| <a id="source-junie-skills"></a>[junie-skills](https://junie.jetbrains.com/docs/agent-skills.html) | 2026-10-10 | read | primary | Shared and native roots; trust; flags; metadata |
| <a id="source-kilo-agents"></a>[kilo-agents](https://kilo.ai/docs/customize/agents-md) | 2026-10-09 | read | primary | Instruction locations |
| <a id="source-kilo-rules"></a>[kilo-rules](https://kilo.ai/docs/customize/custom-rules) | 2026-10-09 | read | primary | Instruction locations |
| <a id="source-kilo-skills"></a>[kilo-skills](https://kilo.ai/docs/customize/skills) | 2026-10-09 | read | primary | Current platform .kilo roots; mode migration; trusted shell; contradictory name guidance |
| <a id="source-kimi-agents"></a>[kimi-agents](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/agents.html) | 2026-10-09 | read | primary | Instruction Files; Agent Locations; SYSTEM.md |
| <a id="source-kimi-data"></a>[kimi-data](https://www.kimi.com/code/docs/en/kimi-code-cli/configuration/data-locations.html) | 2026-10-09 | read | primary | Data root |
| <a id="source-kimi-hooks"></a>[kimi-hooks](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/hooks.html) | 2026-10-09 | read | primary | Configuration; failure behavior |
| <a id="source-kimi-legacy-help"></a>[kimi-legacy-help](https://www.kimi.com/en/help/plugins-and-skills/use-skills-in-code) | 2026-10-09 | read | primary | Conflicting general help; not selected for current CLI contract |
| <a id="source-kimi-skills"></a>[kimi-skills](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html) | 2026-10-09 | read | primary | Skill Locations; Frontmatter Fields |
| <a id="source-kiro-skills"></a>[kiro-skills](https://kiro.dev/docs/skills/) | 2026-10-09 | read | primary | Scopes; custom agent resources; surface support |
| <a id="source-kiro-steering"></a>[kiro-steering](https://kiro.dev/docs/steering/) | 2026-10-09 | read | primary | Global/project steering; AGENTS; custom agents |
| <a id="source-mistral-agents"></a>[mistral-agents](https://docs.mistral.ai/vibe/code/cli/agents) | 2026-10-10 | read | primary | AGENTS discovery, profiles and subagents |
| <a id="source-mistral-skills"></a>[mistral-skills](https://docs.mistral.ai/vibe/code/cli/skills) | 2026-10-10 | read | primary | Native roots, priority, filters, allowed-tools |
| <a id="source-openclaw-skills"></a>[openclaw-skills](https://docs.openclaw.ai/skills) | 2026-10-09 | read | primary | Loading order; state overrides; symlinks |
| <a id="source-openclaw-workspace"></a>[openclaw-workspace](https://docs.openclaw.ai/concepts/agent-workspace) | 2026-10-09 | read | primary | Workspace context files |
| <a id="source-opencode-rules"></a>[opencode-rules](https://opencode.ai/docs/rules/) | 2026-10-09 | read | primary | Types; precedence; imports |
| <a id="source-opencode-skills"></a>[opencode-skills](https://opencode.ai/docs/skills/) | 2026-10-09 | read | primary | Place files; frontmatter; permissions |
| <a id="source-openhands-skills"></a>[openhands-skills](https://docs.openhands.dev/overview/skills) | 2026-10-10 | read | primary | Current Agent Canvas/SDK/Cloud roots and precedence; legacy loaders |
| <a id="source-qwen-settings"></a>[qwen-settings](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/) | 2026-10-10 | read | primary | QWEN_HOME; hierarchical QWEN.md |
| <a id="source-qwen-skills"></a>[qwen-skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/) | 2026-10-10 | read | primary | Personal/project/extension roots; fields; invocation |
| <a id="source-roo-instructions"></a>[roo-instructions](https://roocodeinc.github.io/Roo-Code/features/custom-instructions/) | 2026-10-09 | read | primary | Global and project rules; AGENTS.md |
| <a id="source-roo-skills"></a>[roo-skills](https://roocodeinc.github.io/Roo-Code/features/skills/) | 2026-10-09 | read | primary | Exact override priority; symlink names |
| <a id="source-trae-cn-rules"></a>[trae-cn-rules](https://docs.trae.cn/ide_rules) | 2026-10-10 | read | primary | CN user rules and project rules |
| <a id="source-trae-cn-skills"></a>[trae-cn-skills](https://docs.trae.cn/ide_skills) | 2026-10-10 | read | primary | CN native skill roots and format |
| <a id="source-trae-international-skills"></a>[trae-international-skills](https://docs.trae.ai/ide/skills) | 2026-10-10 | BODY_UNAVAILABLE | primary | Official page resolves but browser returned no extractable body |
| <a id="source-warp-rules"></a>[warp-rules](https://docs.warp.dev/knowledge-and-collaboration/warp-drive/ai-objects) | 2026-10-10 | read | primary | Project and personal/team rules vs file-based skills |
| <a id="source-warp-skills"></a>[warp-skills](https://docs.warp.dev/agents/capabilities/skills) | 2026-10-10 | read | primary | Global/project roots; cloud WARP_SKILL_DIRS |
| <a id="source-windsurf-rules"></a>[windsurf-rules](https://docs.devin.ai/desktop/cascade/memories) | 2026-10-09 | read | primary | Rules scopes and discovery |
| <a id="source-windsurf-skills"></a>[windsurf-skills](https://docs.devin.ai/desktop/cascade/skills) | 2026-10-09 | read | primary | Current redirect target of Windsurf skills docs |
| <a id="source-zed-instructions"></a>[zed-instructions](https://zed.dev/docs/ai/instructions) | 2026-10-09 | read | primary | Personal/project instructions; external agents |
| <a id="source-zed-skills"></a>[zed-skills](https://zed.dev/docs/ai/skills) | 2026-10-09 | read | primary | Where Skills Live; Limits; external agents |

## Regenerate or check

From this directory:

```sh
python3 generate-source-index.py
python3 generate-source-index.py --check
```

The check is read-only and fails for stale output, duplicate IDs/URLs, unmapped sources or invalid host references.
