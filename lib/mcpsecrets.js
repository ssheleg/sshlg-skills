'use strict';
/**
 * The refusal that stands where an MCP tool would put a credential in the transcript.
 *
 * WHY. `lib/secrets.js` reads a Bash command before it runs; an MCP tool call has no
 * command to read, and its RESULT lands in the transcript whole. On 2026-10-10 one
 * call of the DigitalOcean MCP tool `db-cluster-list` — asked only for cluster names
 * — returned the plaintext `doadmin` and application passwords of every database in
 * the team: five clusters, four projects, none of them the one being worked on. All
 * of them had to be reset and their apps redeployed; one site was down five minutes
 * on the way. Nothing in the call looked dangerous; the tool's shape is the leak.
 *
 * WHAT IT DOES. A registry of tools whose answer carries a secret by design, per
 * provider, and a refusal that names the safe route for the same need: the provider
 * CLI inside a program that sends the value straight to the vault on stdin, and the
 * value-free spelling of the same listing. Unknown tools pass — this is a registry
 * of known shapes, not a guess about names, because a guard that refuses ordinary
 * reads gets switched off.
 *
 * WHAT IT DOES NOT DO. It does not refuse a tool that only NAMES credentials
 * (`observatory_credentials`) or returns a public certificate (`db-cluster-get-ca`).
 */

/** server → { tool: what its answer carries }. Tool names as the server spells them. */
const REGISTRY = {
  digitalocean: {
    'db-cluster-list': 'every cluster\'s connection string with the admin password, and each user\'s password',
    'db-cluster-get': 'the cluster\'s connection string with the admin password',
    'db-cluster-create': 'the new cluster\'s admin password',
    'db-cluster-list-users': 'each database user\'s password',
    'db-cluster-get-user': 'the database user\'s password',
    'db-cluster-create-user': 'the new database user\'s password',
    'db-cluster-update-user': 'the database user\'s password',
    'docr-docker-credentials': 'a registry login token',
    'doks-get-kubeconfig': 'a cluster admin kubeconfig with its token',
    'doks-get-credentials': 'a cluster token',
    'spaces-key-create': 'a Spaces secret access key',
    'functions-create-access-key': 'a Functions access key secret',
    'vector-db-get-credentials': 'the vector database credentials',
  },
};

/** The remedy, per server: the same need, with the value going to the vault. */
const REMEDY = {
  digitalocean:
    'To LIST without values: `doctl databases list --format ID,Name,Engine,Region,Status` '
    + '(the table has no connection column). To GET a credential: run `doctl … --output json` '
    + 'inside a program that pipes the one value to `vault.py put PROJECT ENV NAME` on stdin and '
    + 'prints only names — or Observatory\'s DigitalOcean door when it is installed. '
    + 'To ROTATE: `doctl databases user reset` the same way, then redeploy every consumer.',
};

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The PreToolUse matcher for these tools — one regex, so no other MCP call pays a spawn. */
const MATCHER = Object.entries(REGISTRY)
  .map(([server, tools]) => `mcp__(?:[A-Za-z0-9_-]*_)?${escape(server)}__(?:${Object.keys(tools).map(escape).join('|')})`)
  .join('|');

/**
 * `mcp__<server>__<tool>` → { rule, why } for a registered tool, else null.
 * Server names are matched case-insensitively; a plugin-scoped server
 * (`mcp__plugin_<plugin>_<server>__tool`) is matched by its last segment.
 */
function inspectTool(toolName) {
  const m = /^mcp__(.+?)__(.+)$/.exec(String(toolName || ''));
  if (!m) return null;
  const serverRaw = m[1].toLowerCase();
  const tool = m[2];
  const server = Object.keys(REGISTRY).find(
    (s) => serverRaw === s || serverRaw.endsWith(`_${s}`));
  if (!server || !(tool in REGISTRY[server])) return null;
  return {
    rule: 'mcp-credential-result',
    why: `The answer of ${toolName} carries ${REGISTRY[server][tool]}, and the transcript keeps `
      + `every tool result whole — it cannot be redacted afterwards. ${REMEDY[server]} `
      + 'If you only needed names or ids, the provider CLI with an explicit --format gives them '
      + 'without the secret.',
  };
}

module.exports = { inspectTool, REGISTRY, MATCHER };
