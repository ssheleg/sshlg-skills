# Active-session hook recovery — 2026-10-13

The operator reported repeating exits127 and1. Native app-server `hook/completed`
notifications from the running thread bind those failures to agent-sync1.22.1
and sheleg-dev0.13.3 respectively ([before](before.json)). The current native
inventory already selected their successors, while these prior version paths
were absent. Direct shell reproduction gave the same127/1; successor paths
returned0. A fresh `hooks/list` reports successor paths, but the existing
thread continued invoking the old paths. A list response is therefore not
proof of an active thread's hook generation.

The hub updater's native marketplace remove/add sequence removed prior payloads
still referenced by running sessions. Emergency recovery restored exact Git
plugin trees from v1.22.1, v0.13.3 and make-skill v0.31.1 to those previously
absent version directories. [Recovery manifest](recovery.json) binds every byte
and executable mode to its immutable source. This is an explicit recovery
exception to ordinary native-API-only installation; it does not claim a new
installation or change which version the host selects. No configuration,
registry, trust setting or existing payload was overwritten. Unknown paths and
symlinks were refused. Full private receipt remains local-only.

Afterward the same running thread completed both formerly failing pre-tool
hooks. [After](after.json) contains9 observed events, all completed. This proves
the observed pair is repaired without restarting agents; it does not certify
all events, hosts or third-party hooks. Make-skill's prior payload was recovered
proactively for the same already-loaded generation, without claiming a native
make-skill invocation in this observation window.

Next: replace the destructive refresh mechanism with a supported native path
that preserves running generations, prove it in an isolated real Codex profile,
and retain failure/rollback/foreign-source controls. Until accepted, do not run
another real native update that could remove these recovered paths.

Protocol: Codex0.162.1 generated TypeScript schemas; same-user Unix WebSocket
connection, initialize and rejoin the existing running thread without settings
overrides, then observe hook events. No model request or secret/token access.
The first raw-stdio proxy attempt produced no events and is not evidence.
Official reference: [Codex hooks](https://learn.chatgpt.com/docs/hooks).

A later [50-second observation](followup-0934.json) of the same running thread
recorded one completed PostToolUse event. It adds a bounded follow-up observation;
it does not expand the earlier nine-event coverage to unobserved hook types.
