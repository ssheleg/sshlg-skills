'use strict';
/**
 * Global install support in the pinned upstream CLI. The snapshot describes
 * installer destinations, not a host's plugin/hooks/runtime compatibility.
 * Keep it inside lib so npm's existing package/runtime closure includes it.
 */
const snapshot = require('./host-targets.snapshot.js');

function validateSnapshot(data, spec) {
  if (!data || data.schema !== 1 || data.skillsCli !== spec) {
    throw new Error(`Host target snapshot does not match ${spec}; refresh lib/host-targets.snapshot.js before installing`);
  }
  if (!Array.isArray(data.agents) || !data.agents.length) throw new Error('Host target snapshot is empty');
  const seen = new Set();
  for (const row of data.agents) {
    if (!row || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id) || typeof row.global !== 'boolean' || seen.has(row.id)) {
      throw new Error('Invalid or duplicate host target snapshot row');
    }
    seen.add(row.id);
  }
  return data;
}

function resolve(defaults, flags, spec = require('../package.json').skillsCli, data = snapshot) {
  validateSnapshot(data, spec);
  const f = flags || {};
  const known = new Map(data.agents.map(row => [row.id, row]));
  const requested = f.agents && f.agents.length ? f.agents : defaults || [];
  // Validate explicit requests even when --all/--claude-only would hide them.
  // Defaults do not restrict --all, but must be valid when actually selected.
  const validate = f.agents && f.agents.length ? f.agents : f.all ? [] : requested;
  for (const id of validate) {
    if (id === '*') throw new Error('The --agent wildcard is unsupported; use --all for supported global targets');
    if (!known.has(id)) throw new Error(`Unknown global install agent: ${id} (${spec})`);
    if (!known.get(id).global) throw new Error(`Agent ${id} does not support global installation in ${spec}; use its project-local installer`);
  }
  const chosen = f.all ? data.agents.filter(row => row.global).map(row => row.id) : requested;
  return [...new Set(chosen)].filter(id => f.claude === false || id !== 'claude-code');
}

function excludedGlobal(spec = require('../package.json').skillsCli) {
  return validateSnapshot(snapshot, spec).agents.filter(row => !row.global).map(row => row.id);
}

/** Verify the recorded published bundle without executing third-party code. */
function verifySource(bytes, data = snapshot) {
  const crypto = require('crypto');
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== data.sourceSha256) {
    throw new Error('Upstream source digest differs from the recorded snapshot');
  }
  const text = bytes.toString('utf8');
  const start = text.indexOf('const agents = {');
  const end = text.indexOf('\n};', start);
  if (start < 0 || end < 0) throw new Error('Upstream agent table boundary not found');
  const table = text.slice(start, end);
  const rows = [...table.matchAll(/\n\t(?:"[^"\n]+"|[\w-]+): \{\n\t\tname: "([^"\n]+)",.*?\n\t\tglobalSkillsDir: ([^\n]+),/gs)]
    .map(m => ({ id: m[1], global: m[2].trim() !== 'void 0' }))
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const names = table.match(/\n\t\tname: /g) || [];
  if (!rows.length || rows.length !== names.length || JSON.stringify(rows) !== JSON.stringify(data.agents)) {
    throw new Error('Upstream agent table differs from the snapshot');
  }
  return rows.length;
}

if (require.main === module) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--verify-source') {
      throw new Error('Usage: node lib/host-targets.js --verify-source <skills-package/dist/cli.mjs>');
    }
    validateSnapshot(snapshot, require('../package.json').skillsCli);
    const count = verifySource(require('fs').readFileSync(process.argv[3]));
    process.stdout.write(`Verified ${snapshot.skillsCli}: ${count} host targets, source digest and table match\n`);
  } catch (e) { process.stderr.write(e.message + '\n'); process.exitCode = 1; }
}
module.exports = { snapshot, validateSnapshot, resolve, excludedGlobal, verifySource };
