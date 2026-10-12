#!/usr/bin/env node
'use strict';
/**
 * A fake `codex` for the B-166 suites — the five verbs `update` drives, with the
 * behaviour measured against Codex 0.162.1 in a sandbox CODEX_HOME on 2026-10-12:
 *
 *   - `plugin marketplace add` refuses a name already configured from another
 *     source or ref ("remove it before adding this source");
 *   - `plugin marketplace remove` drops the marketplace, and `plugin list` then
 *     stops listing its plugins, while the plugin cache keeps the old version;
 *   - re-adding the marketplace alone still reports the cached version — only
 *     `plugin add` moves it.
 *
 * State lives in $FAKE_CODEX_STATE (JSON); every call is appended to its `calls`.
 * It writes $CODEX_HOME/config.toml after every mutation, the way Codex does, with
 * the `prefix` text kept verbatim above the generated tables.
 *
 * Failure injection: $FAKE_CODEX_FAIL is a command prefix (`plugin add agent-sync@agent-sync`),
 * $FAKE_CODEX_FAIL_TIMES how many matching calls fail (default 1).
 */
const fs = require('fs');
const path = require('path');

const statePath = process.env.FAKE_CODEX_STATE;
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const args = process.argv.slice(2);
const line = args.join(' ');
state.calls = state.calls || [];
state.calls.push(line);

function save() { fs.writeFileSync(statePath, JSON.stringify(state, null, 2)); }
function writeConfig() {
  const out = [state.prefix || ''];
  for (const [name, m] of Object.entries(state.marketplaces)) {
    out.push(`[marketplaces.${name}]`, `source_type = "${m.sourceType || 'git'}"`, `source = "${m.source}"`);
    if (m.ref) out.push(`ref = "${m.ref}"`);
    for (const k of m.extra || []) out.push(`${k} = ["x"]`);
    out.push('');
  }
  for (const [id, on] of Object.entries(state.enabled || {})) {
    out.push(`[plugins."${id}"]`, `enabled = ${on}`, '');
  }
  fs.writeFileSync(path.join(process.env.CODEX_HOME, 'config.toml'), out.join('\n'));
}
function die(msg) { save(); process.stderr.write(`Error: ${msg}\n`); process.exit(1); }
function repoName(src) { return String(src).replace(/\/+$/, '').replace(/\.git$/, '').split(/[/:]/).pop(); }

const fail = process.env.FAKE_CODEX_FAIL;
if (fail && line.startsWith(fail)) {
  state.failed = (state.failed || 0) + 1;
  if (state.failed <= Number(process.env.FAKE_CODEX_FAIL_TIMES || 1)) die(`injected failure on \`${fail}\``);
}

if (line === '--version') { save(); process.stdout.write('codex-cli 0.162.1\n'); process.exit(0); }

if (args[0] === 'plugin' && args[1] === 'list') {
  const installed = [];
  for (const [id, version] of Object.entries(state.cache)) {
    const mk = id.split('@')[1];
    if (!state.marketplaces[mk]) continue;
    installed.push({ pluginId: id, name: id.split('@')[0], marketplaceName: mk, version,
      installed: true, enabled: state.enabled[id] !== false });
  }
  save();
  if (args.includes('--json')) {
    if (state.noJson) { process.stderr.write("error: unexpected argument '--json' found\n"); process.exit(2); }
    process.stdout.write(JSON.stringify({ installed, available: [] }));
  } else {
    process.stdout.write('PLUGIN  STATUS  VERSION  SOURCE\n');
    for (const p of installed) {
      process.stdout.write(`${p.pluginId}  installed, ${p.enabled ? 'enabled' : 'disabled'}  ${p.version}  /x\n`);
    }
  }
  process.exit(0);
}

if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'remove') {
  const name = args[3];
  if (!state.marketplaces[name]) die(`marketplace '${name}' is not configured`);
  delete state.marketplaces[name];
  writeConfig(); save();
  process.stdout.write(`Removed marketplace \`${name}\`.\n`);
  process.exit(0);
}

if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'add') {
  const src = args[3];
  const i = args.indexOf('--ref');
  const ref = i > 0 ? args[i + 1] : null;
  const name = repoName(src);
  if (state.marketplaces[name]) {
    die(`marketplace '${name}' is already added from a different source; remove it before adding this source`);
  }
  const known = state.catalog[name];
  if (!known || (ref && !(ref in known))) die(`could not fetch ${src}${ref ? `#${ref}` : ''}`);
  state.marketplaces[name] = { source: src, ref };
  writeConfig(); save();
  process.stdout.write(`Added marketplace \`${name}\` from ${src}${ref ? `#${ref}` : ''}.\n`);
  process.exit(0);
}

if (args[0] === 'plugin' && args[1] === 'add') {
  const id = args[2];
  const mk = id.split('@')[1];
  const m = state.marketplaces[mk];
  if (!m) die(`marketplace '${mk}' is not configured`);
  const version = state.catalog[mk][m.ref || 'HEAD'];
  state.cache[id] = version;
  state.enabled[id] = true;
  writeConfig(); save();
  process.stdout.write(`Added plugin \`${id.split('@')[0]}\` from marketplace \`${mk}\`.\n`);
  process.exit(0);
}

die(`unrecognized subcommand '${line}'`);
