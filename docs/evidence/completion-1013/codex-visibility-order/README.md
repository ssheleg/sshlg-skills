# Deferred Codex receipt after visibility writes

The fresh nonauthor observer found that `cmdUpdate` inspected Codex and saved its
profile-bound deferred receipt before reapplying consented skill visibility. A new
unused skill could make that later step change the same config, so the newly printed
watcher immediately returned `config-changed-rescan-required`. The guard still
refused native mutation; this was a stale observation intent, not destructive cache
replacement.

The [source/check receipt](checks.json) retains the witnessed baseline failure at
83f34a3, with the nine existing controls passing. The fix moves read-only Codex
inspection after visibility reapplication. Later domain reconciliation is scoped
to Claude, so all Codex config changes owned by this update precede the receipt.
The existing save-time byte comparison and later drift refusal remain intact.

The actual CLI regression uses an owned temporary profile, real visibility consent
and a skill arriving before update. Three update passes keep one immutable receipt,
identical final config bytes, an observable deferred status, and zero native
mutating commands. All10 native fixture controls passed. [Baseline](red.log.gz) and
[corrected](green.log.gz) logs are preserved. This is fixture acceptance; actual host
update, watcher registration, final aggregate remain pending. The [independent replay](independent.json) from an
immutable detached Git checkout passed the same10 controls in21.86 seconds,
with identical source and output hashes; its [log](independent.log.gz) and
[runner](independent-runner.py) are retained.
The earlier frozen source graph remains historical and needs a new final code cut.
