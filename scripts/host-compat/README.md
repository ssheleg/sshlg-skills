# Opt-in MCP schema compatibility

`mcp_schema_bridge.py` wraps a **POSIX stdio** MCP command for clients that reject
boolean schemas in `tools/list` output schemas. It is a maintenance utility, not
a new MCP server registration or a default launcher feature.

```sh
python3 scripts/host-compat/mcp_schema_bridge.py -- SERVER ARGUMENTS
python3 test/mcp_schema_bridge_test.py
```

The observed trigger was Kimi Code 2.2.0 parsing DigitalOcean MCP 1.5.1: five
advertised output schemas contained boolean `true` nodes and the entire tools
list was rejected. The bridge changes those schema nodes to `{}`. Both accept
all JSON values under the [JSON Schema specification](https://json-schema.org/understanding-json-schema/basics).
It retains tool names, input schemas, output constraints, pagination and protocol
negotiation. It never calls a tool itself. Defaults, examples and enum/const data
are not schema positions and remain unchanged; `false` remains `false`.

Only responses correlated to an observed `tools/list` request are transformed.
Other traffic passes through unchanged. Messages have a 16 MiB cap; EOF and
termination close the owned upstream process. Upstream nonzero exit status stays
nonzero. Credential injection belongs to the caller's existing credential door;
never put a value in an argument or in this script. Stdout carries MCP messages
only, following the [stdio transport contract](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports).
The bridge does not force that revision or emulate a newer protocol.

This is deliberately narrower than a general JSON Schema converter. Remove the
opt-in wrapper after the affected client accepts the original schemas in a fresh
connection. Do not install it globally on every MCP connection or remove output
schemas wholesale. Native before/after evidence and remaining limitations are in
[the acceptance handoff](../../docs/evidence/harness-acceptance-20261017.md).
