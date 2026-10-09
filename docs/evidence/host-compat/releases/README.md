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
`29a7c450a4490e94a1f83c40813d79a47b37b0cd`.
