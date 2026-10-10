# Published package readback

Each JSON receipt records canonical npm metadata, archive integrity and every
published regular file compared with the exact Git source commit. The durable
[verifier](verify_registry.py) uses explicit failures, including under Python
`-O`; it rejects empty archives, unsafe paths, duplicate entries and non-regular
files. It does not extract archives, install packages or write host configuration.

```sh
python3 verify_registry.py --repo /path/to/member-repository \
  --package @ssheleg/make-skill --version 0.29.2 \
  --source c0fe080a46dd2a98fa78d7cd1aee26fb0261d25c \
  --release-run 37997168633 --output /path/to/new-receipt.json
```

Use each receipt's exact package name, version, gitHead and release_run; member
repository names and npm package names are not interchangeable. The local clone
must contain that Git commit. Only the explicit output file is written.

The release-run value is a caller-supplied label. Workflow success, tag resolution,
source integration and local installation are verified separately in the central
[delivery record](../delivery.json); package byte equality does not prove a native
agent or model scenario.

Verification of this tool: a fresh `python3 -O` readback of make-skill 0.29.2
matched all 32 published files and all prior receipt fields except its new as_of
instant. Negative checks rejected mismatched version/source, corrupt bytes, empty
archive, traversal, symlink, differing Git bytes, duplicate entry and a
noncanonical registry URL. Implementation commit:
`29a7c450a4490e94a1f83c40813d79a47b37b0cd`, integrated as
`85ddf41cd9d9eacdac98f288d97305e3964ac6f7` in this delivery branch.

## Completed publication receipts

- [Hub 1.54.7](hub.json): 60 published files match source `5a12a70d2d6c44a73b23a474072b6c3681a56b6e`; [release run](https://github.com/ssheleg/sshlg-skills/actions/runs/38017671346) succeeded.
- [task-pipeline 1.90.2](task-pipeline.json): 132 published files; [payload completeness](task-pipeline-payload.json) covers all 109 plugin files. [Release run](https://github.com/ssheleg/task-pipeline/actions/runs/38015659338) succeeded. Failed unpublished 1.90.1 remains in the central release history.
- [agent-sync 1.21.5](agent-sync.json) and [payload completeness](agent-sync-payload.json).
- [make-skill 0.29.2](make-skill.json), [super-ux 0.59.1](super-ux.json), [sheleg-dev 0.13.2](sheleg-dev.json).

Local native Codex task-pipeline registration and preserved previous cache paths
are recorded separately in [native-task-pipeline.json](../local/native-task-pipeline.json).
