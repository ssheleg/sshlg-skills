'use strict';
/**
 * The read-only reports: list, agents, signature, humanizers, injectors, conflicts, toolkit,
 * materialised, context, settings and pack.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const { ROOT, SKILLS, cliSpec, log, manifest } = require('./cli-core.js');

/**
 * `signature` — the header and footer a report carries.
 *
 * The links are LOOKED UP from the manifest, never typed: `evidence-docs` lives in the
 * `task-pipeline` repository, and an agent writing that URL from memory gets it wrong.
 * The only thing a caller writes is what each skill did.
 */
function cmdSignature(argv) {
  const sig = require(path.join(ROOT, 'lib', 'signature.js'));
  const val = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '';
  };
  const used = val('--used');
  if (!used) {
    log('usage: npx sshlg-skills signature --used "<skill>[=what it did],…" '
      + '[--format md|html|text] [--part header|footer|both] [--no-star]');
    return 1;
  }
  const format = val('--format') || 'md';
  const part = val('--part') || 'both';
  const opts = { format, star: !argv.includes('--no-star') };
  if (part === 'header' || part === 'both') log(sig.header(used, manifest, opts));
  if (part === 'both') log('');
  if (part === 'footer' || part === 'both') log(sig.footer(used, manifest, opts));
  return 0;
}

/**
 * `humanizers` — which anti-AI-writing skills this machine can reach.
 *
 * Same split as `toolkit` and `conflicts` for the machine half: WHICH implementation is
 * here is a fact about one machine, read when asked. The doctrine half does NOT ship in
 * the block — no router text mentions humanization, and that is deliberate: the pass
 * itself lives in `copywriting`'s own Humanize mode, which the c888696 record found
 * already stricter than either external implementation. What always ships is the caveat
 * in `lib/humanizers.js`, printed on every run of this command and not switchable off.
 * The registry is data so a third implementation joins by pull request.
 */
function cmdHumanizers(argv) {
  const hum = require(path.join(ROOT, 'lib', 'humanizers.js'));
  const conflicts = require(path.join(ROOT, 'lib', 'conflicts.js'));
  let skills = [];
  try {
    skills = conflicts.readSkills(process.env.HOME || os.homedir());
  } catch (e) {
    log(`cannot read the installed skills (${e.message}): no answer rather than a wrong one`);
    return 1;
  }
  log(hum.report(skills, { contribute: !argv.includes('--quiet') }));
  return 0;
}

/**
 * The roster, answering the two questions the README offers this command for.
 *
 * It printed name, version, repo and the full marketing paragraph — 22 lines and 5,398
 * bytes, of which ~4,900 were nine descriptions — and answered neither *"when does each
 * of these fire?"* nor *"am I current?"*. The data for the first was sitting unused in
 * the same manifest this function already reads: `entry` and `role` are on every member
 * and neither was ever printed.
 *
 * The descriptions are behind `--verbose` rather than deleted: they are what a stranger
 * reads once, and what an operator scrolls past every time.
 *
 * `role` is the same cell the routing block's map table renders, so this roster and that
 * table cannot drift — a member's role has one home.
 */
function cmdList(argv) {
  const verbose = (argv || []).includes('--verbose') || (argv || []).includes('-v');
  if ((argv || []).includes('--json')) {
    // B-331 (AI-native pilot): an agent that asks for data gets data. These are the versions
    // this package pins and would install, not a reading of what a host has installed.
    const members = SKILLS.map((s) => {
      let version = s.version || null;
      try { version = JSON.parse(fs.readFileSync(path.join(ROOT, s.dir, 'plugins', s.name, '.claude-plugin', 'plugin.json'), 'utf8')).version; } catch (_) {}
      return { name: s.name, version, entry: s.entry || null, role: s.role || null, repo: s.repo || null };
    });
    process.stdout.write(JSON.stringify({ schema: 'sshlg-list/1', of: 'pinned by this package', package: JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version, members }) + '\n');
    return;
  }
  log('ssheleg skill family:\n');
  for (const s of SKILLS) {
    let ver = s.version || '?';
    const pj = path.join(ROOT, s.dir, 'plugins', s.name, '.claude-plugin', 'plugin.json');
    try { ver = JSON.parse(fs.readFileSync(pj, 'utf8')).version; } catch (_) {}
    const entry = s.entry || '(none)';
    log(`  ${s.name.padEnd(16)} v${String(ver).padEnd(9)} ${String(entry).padEnd(16)} ${s.role || ''}`);
    if (verbose) log(`  ${' '.repeat(16)} ${s.repo}\n  ${' '.repeat(16)} ${s.desc}\n`);
  }
  if (!verbose) log('\n  --verbose adds each member\'s repository and full description.');
  log(`\nInstall:  npx sshlg-skills install       Update:  npx sshlg-skills update`);
}

function cmdAgents() {
  const targets = require('../lib/host-targets.js');
  const snapshot = targets.validateSnapshot(targets.snapshot, cliSpec());
  const rows = snapshot.agents;
  const globals = rows.filter(row => row.global).length;
  const width = Math.max(...rows.map(row => row.id.length)) + 2;
  log(`Pinned installer targets (${snapshot.skillsCli}): ${rows.length} IDs, ${globals} global, ${rows.length - globals} project-only.\n`);
  for (const row of rows) log(`  ${row.id.padEnd(width)}${row.global ? 'global' : 'project-only'}`);
  log('\nThese are installer destinations, not native runtime acceptance.');
  log('Project-only targets cannot be selected by this global-install wrapper.');
  log('Claude Code uses the plugin channel by default; --all excludes its plain skill target.');
  log('--all --no-claude includes the plain claude-code target and skips the plugin step.');
  log(`Default set: ${manifest.defaultAgents.join(', ')}  (Claude via plugin)`);
}

/**
 * `injectors` — who else speaks at `SessionStart`, in full, on demand.
 *
 * The session block carries one line and only when there is somebody; this is where the
 * file paths live. It also gives the check a place to be **watched working on a machine
 * where nothing competes**: a guard whose output nobody has ever seen is
 * indistinguishable from a guard that is broken, and the empty case prints too.
 */
function cmdInjectors() {
  const inj = require(path.join(ROOT, 'lib', 'injectors.js'));
  // `$HOME` before `os.homedir()`, the same order every other command here uses —
  // the fixtures override the environment variable.
  const home = process.env.HOME || os.homedir();
  let read;
  try {
    read = inj.readRegistry(home);
  } catch (e) {
    // The registry is the input. Saying "nothing else injects" because a file could
    // not be read would be the false-clear this module exists to refuse.
    log(`cannot read the plugin registry (${e.message}): no answer rather than a wrong one`);
    read = null;
  }
  if (read) log(inj.report(inj.injectors(...read)));
  // The second half is independent of the first: MCP declarations live in other files,
  // so a registry that could not be read must not silence what can be.
  let mcp;
  try {
    mcp = inj.readMcp(home);
  } catch (e) {
    log(`\ncannot read the MCP declarations (${e.message}): no answer rather than a wrong one`);
    return;
  }
  log('');
  log(inj.mcpReport(inj.mcpFindings(mcp.servers, mcp.delivered), { transcript: mcp.transcript }));
}

/**
 * `conflicts` — which installed skills land on ground a router owns.
 *
 * The map's arbitration paragraph is general because the block is written on every
 * operator's machine and this one's roster is not theirs. This is the other half:
 * the rule ships, the roster is read here. Same split, same reason, as `injectors`.
 *
 * Its own members are excluded — the family's skills obviously land on the family's
 * ground, and twenty rows of that would bury the four that matter.
 */
function cmdConflicts() {
  const conflicts = require(path.join(ROOT, 'lib', 'conflicts.js'));
  const registry = require(path.join(ROOT, 'lib', 'routers-registry.js'));
  const home = process.env.HOME || os.homedir();
  let skills;
  try {
    skills = conflicts.readSkills(home);
  } catch (e) {
    log(`cannot read the installed skills (${e.message}): no answer rather than a wrong one`);
    return;
  }
  const owned = manifest.skills.map((s) => s.pluginInstall).filter(Boolean);
  const installed = manifest.skills.map((s) => s.name);
  const routers = registry.scope({ installed, machine: require(path.join(ROOT, 'lib', 'machine.js')).probe({ home }) });
  // Routes the operator declared: their triggers are their ground (REQ-04, 2026-10-08).
  let external = [];
  try {
    const triggers = require(path.join(ROOT, 'lib', 'triggers.js'));
    const configLib = require(path.join(ROOT, 'lib', 'config.js'));
    external = triggers.externalRoutes(configLib.externalGet(configLib.readConfig(home)));
  } catch (e) { external = []; }
  log(conflicts.report(
    conflicts.collisions(skills, { owned, routers, external }),
    { scanned: skills.length }));
}

/**
 * `toolkit` — what this machine can reach, before a task decides what to use.
 *
 * The family's map answers "what do I have" with its packs. This answers it with the
 * number that is actually true: 490 reachable skills on the machine it was written on, of
 * which 28 are the family's. An agent choosing tools from the block alone is choosing from
 * 6% of what is installed, and the other 94% is invisible rather than rejected.
 *
 * Same split as `injectors` and `conflicts`, for the same reason: the doctrine that a task
 * should look before it reaches ships to every operator in the block; WHICH skills are here
 * is a fact about one machine and is read at the moment it is asked for.
 */
function cmdToolkit(argv) {
  const toolkit = require(path.join(ROOT, 'lib', 'toolkit.js'));
  const home = process.env.HOME || os.homedir();
  let skills;
  try {
    skills = toolkit.readSkills(home);
  } catch (e) {
    log(`cannot read the installed skills (${e.message}): no answer rather than a wrong one`);
    return;
  }
  const family = manifest.skills.reduce(
    (acc, m) => acc.concat(m.skillNames && m.skillNames.length ? m.skillNames : [m.name]), []);

  const li0 = argv.indexOf('--limit');
  const findAt = argv.indexOf('--find');
  if (findAt !== -1) {
    const query = argv[findAt + 1] && !argv[findAt + 1].startsWith('--') ? argv[findAt + 1] : '';
    if (!query) { log('usage: npx sshlg-skills toolkit --find "<concept>, <concept>, …"'); return 2; }
    // Visibility is read, never assumed: a skill the operator hid from the listing is
    // exactly the one this search exists to reach.
    let overrides = {};
    try {
      // The profile Claude Code reads: CLAUDE_CONFIG_DIR, else ~/.claude (B-272, as the hooks since B-218).
      overrides = JSON.parse(fs.readFileSync(path.join(require('../lib/enablement.js').claudeRoot(home), 'settings.json'), 'utf8')).skillOverrides || {};
    } catch (e) { overrides = {}; }
    const additional = toolkit.readShared(home, skills);
    const all = skills.concat(additional)
      .map((s) => Object.assign({}, s, { visibility: s.namespace === 'claude:plain' ? overrides[s.id] : undefined }));
    const { rows, total } = toolkit.find(all, query, li0 !== -1 ? Number(argv[li0 + 1]) || 12 : 12);
    if (argv.includes('--json')) {
      // B-331: the same rows as data, so an agent reads paths rather than parsing columns.
      const out = rows.map((r) => ({ id: r.id, plugin: r.plugin || null, path: r.path, namespace: r.namespace,
        score: r.score, hits: r.hits, visibility: r.visibility || null, description: r.description || '' }));
      process.stdout.write(JSON.stringify({ schema: 'sshlg-toolkit-find/1', query, total, rows: out,
        incomplete: (additional.warnings || []) }) + '\n');
      return 0;
    }
    log(toolkit.renderFind(rows, query, total, { showCopies: argv.includes('--copies') }));
    for (const warning of additional.warnings || []) log(`  catalogue incomplete: ${warning}`);
    return 0;
  }

  const at = argv.indexOf('--for');
  const forQuery = at !== -1 && argv[at + 1] && !argv[at + 1].startsWith('--') ? argv[at + 1] : '';
  const expand = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--expand' && argv[i + 1] && !argv[i + 1].startsWith('--')) expand.push(argv[i + 1]);
  }
  const li = argv.indexOf('--limit');
  const limit = li !== -1 && argv[li + 1] ? Number(argv[li + 1]) || 12 : 12;

  // The shortlist starts from what the prompt hook would route this task to, so the two
  // never disagree — and the words the family's own routes are built from are never
  // thrown away as too common (REQ-06, 2026-10-08).
  const triggers = require(path.join(ROOT, 'lib', 'triggers.js'));
  let external = [];
  try {
    const configLib = require(path.join(ROOT, 'lib', 'config.js'));
    external = triggers.externalRoutes(configLib.externalGet(configLib.readConfig(home)));
  } catch (e) { external = []; }
  const seeds = forQuery ? toolkit.seedsFor(triggers, forQuery, external) : [];
  const protect = toolkit.advertisedWords(triggers.ROUTES);

  log(toolkit.report(skills, family, { for: forQuery, expand, limit, seeds, protect }));
}

/**
 * `pack` — what a task can reach that this machine does NOT have.
 *
 * The third member of the same family as `injectors`, `conflicts` and `toolkit`, and the
 * only one that can answer about ABSENCE: `toolkit` enumerates what is installed and by
 * construction cannot name a skill that is not. The doctrine — a curated recommendation
 * is a tool the router may reach for, never a second entry point — ships in the block;
 * WHICH of them are already here is a fact about one machine, read when asked.
 *
 * **It prints and never installs**, by the same refusal `lib/updatemodel.js` records:
 * `settings.json` and `known_marketplaces.json` belong to the operator, and a launcher
 * that changed somebody's installed set to match its own opinion is the class of act
 * that destroyed `~/.claude/CLAUDE.md` twice here. There is no `--install`.
 */
function cmdPack(argv) {
  const packs = require(path.join(ROOT, 'lib', 'packs.js'));
  const rest = argv.slice(3);
  const name = rest.find((a) => !a.startsWith('--'));

  if (!name && !rest.includes('--check')) { log(packs.index(packs.PACKS)); return 0; }

  const pack = packs.PACKS[name || 'design'];
  if (!pack) {
    log(`unknown pack: ${name}: known: ${Object.keys(packs.PACKS).join(', ')}`);
    return 2;
  }

  if (rest.includes('--check')) {
    const summary = packs.checkReport(checkAddresses(pack));
    log(summary.text);
    // 2, never 1 — the same split `test/check_pins.py` uses and for the reason its CI
    // step records: an address that moved upstream is not this commit's defect, and a
    // gate that fails for somebody else's rename teaches people to re-run it.
    return packs.checkExit(summary);
  }

  const li = rest.indexOf('--lane');
  const lane = li !== -1 && rest[li + 1] && !rest[li + 1].startsWith('--') ? rest[li + 1] : '';
  if (lane && !pack.lanes.some((l) => l.id === lane)) {
    log(`unknown lane: ${lane}: known: ${pack.lanes.map((l) => l.id).join(', ')}`);
    return 2;
  }

  const home = process.env.HOME || os.homedir();
  let skills;
  try {
    skills = packs.readSkills(home);
  } catch (e) {
    log(`cannot read the installed skills (${e.message}): no answer rather than a wrong one`);
    return 1;
  }
  log(packs.report(pack, skills, { lane, mcp: packMcp(home) }));
  return 0;
}

/**
 * Resolve every declared address, and say which instrument answered.
 *
 * `gh` first because it is authenticated: the unauthenticated GitHub API allows 60
 * requests an hour, and when it runs out it answers **403 with a JSON body**, which a
 * naive reader turns into "repository missing" for every row at once. That happened
 * while this pack was being built — five candidates reported 404 in one sweep, and the
 * control case `anthropics/skills` reported 404 too, which is what gave it away. A
 * measurement that returns the same answer for every input is a fact about the
 * instrument (`docs/evidence/retro.md`, standing instruction #4), so a row that cannot
 * be resolved says `unreachable` and never `gone`.
 */
function checkAddresses(pack) {
  const seen = new Set();
  const targets = [];
  for (const e of pack.entries.concat(pack.declined || [])) {
    const src = e.source;
    if (!src || seen.has(src)) continue;
    seen.add(src);
    targets.push({ id: e.id, source: src, repo: /^[\w.-]+\/[\w.-]+$/.test(src) });
  }

  const hasGh = spawnSync('gh', ['--version'], { stdio: 'ignore' }).status === 0;
  return targets.map((t) => {
    if (!t.repo) return { id: t.id, source: t.source, error: 'not a repository address: nothing to resolve' };
    if (!hasGh) return { id: t.id, source: t.source, error: 'no `gh` on PATH; the unauthenticated API rate-limits to 60/hour and answers 403, which reads as "gone"' };
    const r = spawnSync('gh', ['api', `repos/${t.source}`,
      '--jq', '[.full_name, .archived, .pushed_at] | @tsv'], { encoding: 'utf8' });
    if (r.status !== 0) {
      const msg = String(r.stderr || '').split('\n')[0].slice(0, 60) || 'gh failed';
      return { id: t.id, source: t.source, error: msg };
    }
    const [full, archived, pushed] = String(r.stdout).trim().split('\t');
    return {
      id: t.id,
      source: t.source,
      movedTo: full && full.toLowerCase() !== t.source.toLowerCase() ? full : null,
      archived: archived === 'true',
      pushedAt: (pushed || '').slice(0, 10),
    };
  });
}

function cmdMaterialised(argv) {
  const M = require(path.join(ROOT, 'lib', 'materialised.js'));
  const rest = argv.slice(3);
  const at = rest.indexOf('--root');
  const root = at !== -1 && rest[at + 1] ? path.resolve(rest[at + 1]) : process.cwd();
  const file = path.join(root, M.DECL_PATH);

  if (!fs.existsSync(file)) { log(M.report([], { present: false })); return 0; }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    // A declaration that does not parse is not an absent declaration, and reporting it
    // as one would hide the very file the operator is being asked to trust.
    log(`${M.DECL_PATH} does not parse (${e.message}): a claim nobody can read is not a`);
    log('claim. Fix the JSON or delete the file; it is currently neither.');
    return 1;
  }

  const registry = require(path.join(ROOT, 'lib', 'routers-registry.js'));
  const known = Object.keys(registry.REGISTRY);
  const read = (rel) => {
    // Resolved under the project root, and refused if it escapes: a declaration is about
    // THIS repository, and `../../etc/passwd` resolving would make it about something else.
    const target = path.resolve(root, rel);
    if (target !== root && !target.startsWith(root + path.sep)) return null;
    try { return fs.readFileSync(target, 'utf8'); } catch (e) { return null; }
  };

  const rows = M.check(raw, known, read);
  log(M.report(rows, { present: true }));
  return rows.some((r) => !r.satisfied) ? 2 : 0;
}

/** Read-only: sizes of the instruction files each host loads, and documented caps. */
function cmdContext(argv) {
  const json = argv.includes('--json');
  const stray = argv.find(a => a !== '--json');
  if (stray !== undefined) { log(`context: unknown argument ${stray}`); log('usage: npx sshlg-skills context [--json]'); return 2; }
  const pathMod = require('path'), C = require('../lib/context.js'), A = require('../lib/apply.js'), home = os.homedir();
  const hosts = A.TARGETS.map(t => C.host(t.agent, pathMod.join(A.hostRoot(t, home), t.file)));
  const codex = A.TARGETS.find(t => t.agent === 'codex'), codexRoot = A.hostRoot(codex, home);
  // Codex reads AGENTS.override.md in place of AGENTS.md when it exists.
  const override = C.host('codex', pathMod.join(codexRoot, 'AGENTS.override.md'));
  if (override.text != null || override.error) { const main = hosts.find(h => h.agent === 'codex'); if (main && override.text != null) main.shadowed = true; hosts.push(override); }
  for (const name of ['sshlg-routing.mdc', 'sshlg-wait.mdc']) hosts.push(C.host('cursor', pathMod.join(home, '.cursor', 'rules', name)));
  // B-206: the other hosts' global files, installed hosts only; capped ones carry their cap,
  // Kimi's two files are summed, and a CLAUDE.md fallback is named.
  for (const d of require('../lib/instruction-targets.js').describe(home)) {
    if (!d.present) continue;
    if (d.file) {
      const h = C.host(d.agent, d.file);
      if (d.cap && (d.kind === 'compact' || d.kind === 'hermes')) h.cap = d.cap;
      if (d.agent === 'kimi' || (d.agent === 'agents' && (d.via || []).includes('kimi'))) h.kimiChain = true;
      if (d.fallback) { h.fallback = d.fallback; h.fallbackActive = d.fallbackActive; }
      hosts.push(h);
    } else if (d.fallback) {
      hosts.push({ agent: d.agent, file: null, text: null, fallback: d.fallback, fallbackActive: true });
    }
  }
  // B-212: the project files a session started here also loads; Codex caps only these.
  const cwd = process.cwd();
  for (const f of C.codexProjectFiles(cwd)) hosts.push(C.host('codex', f, 'project'));
  for (const f of C.claudeProjectFiles(cwd, hosts.map(h => h.file))) hosts.push(C.host('claude', f, 'project'));
  const config = C.read(pathMod.join(codexRoot, 'config.toml'));
  const r = C.report(hosts, config);
  if (json) { console.log(JSON.stringify(r)); return r.findings.some(f => f.severity === 'error') ? 1 : 0; }
  log('Always-loaded instruction files (' + r.estimate + '); project rows are for ' + cwd + ':');
  for (const row of r.rows) {
    if (!row.present) { log(`  ${row.agent.padEnd(7)} ${(row.scope === 'project' ? 'project' : 'global ').padEnd(7)} ${row.error ? 'unreadable (' + row.error + ')' : 'absent'}  ${row.file}`); continue; }
    log(`  ${row.agent.padEnd(7)} ${(row.scope === 'project' ? 'project' : 'global ').padEnd(7)} ${String(row.bytes).padStart(7)} B  ~${String(row.approxTokens).padStart(6)} tok  ${String(row.lines).padStart(5)} lines  hub ${row.managedBytes} B · other ${row.operatorBytes} B${row.shadowed ? '  (shadowed by AGENTS.override.md)' : row.cap ? (row.capSource === 'host documentation (characters)' ? `  cap ${row.cap} characters` : `  cap ${row.cap} combined (${row.capSource})`) : row.agent === 'codex' ? '  read in full' : ''}${row.scope === 'project' ? '  ' + row.file : ''}`);
  }
  for (const f of r.findings) log(`  ${f.severity}: ${f.message}`);
  if (!r.findings.length) log('  no host is over a documented cap');
  return r.findings.some(f => f.severity === 'error') ? 1 : 0;
}

/**
 * `settings get <key> [--file <path>]` (G2): the value-free door the credential-read
 * refusal names. Prints one allow-listed key of a Claude settings file as JSON, with
 * credential-shaped strings redacted (lib/settingsget.js decides). Default file: the
 * user-scope settings.json of the Claude profile this machine uses.
 */
function cmdSettings(rest) {
  const G = require('../lib/settingsget.js');
  const [verb, key, ...more] = rest;
  if (verb !== 'get' || !key || key.startsWith('-')) {
    const stray = [verb, key].find((x) => x && x.startsWith('-'));
    if (stray) log(`settings: unknown flag ${stray}`); // B-331: the refusal names what it refused
    log('usage: sshlg-skills settings get <key> [--file <path>]');
    log(`allowed keys: ${G.ALLOWED.join(', ')}`);
    return 2;
  }
  let file = null;
  for (let i = 0; i < more.length; i++) {
    if (more[i] === '--file' && more[i + 1]) file = more[++i];
    else if (more[i].startsWith('--file=')) file = more[i].slice(7);
    else { log(`settings get: unknown argument ${more[i]}`); return 2; }
  }
  if (!file) file = path.join(require('../lib/enablement.js').claudeRoot(os.homedir(), process.env), 'settings.json');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { log(`settings get: cannot read ${file} (${e.code || e.message})`); return 1; }
  const r = G.project(text, key);
  if (!r.ok) { log(`settings get: ${r.error}`); return r.code; }
  process.stdout.write(JSON.stringify(r.value, null, 2) + '\n');
  return 0;
}

/**
 * L2 (audit 2026-11-11): which MCP servers a pack entry may call here. chrome-devtools
 * counts only when Claude's plugin for it is enabled at user scope or a server whose name
 * carries it is configured in ~/.claude.json; names only, no value is read out.
 */
function packMcp(home) {
  const out = { 'chrome-devtools': false };
  const enablement = require('../lib/enablement.js');
  const enabled = enablement.userEnabled(home) || {};
  if (Object.keys(enabled).some((k) => /^chrome-devtools/.test(k) && enabled[k] === true)) out['chrome-devtools'] = true;
  try {
    const servers = JSON.parse(fs.readFileSync(path.join(home, '.claude.json'), 'utf8')).mcpServers || {};
    if (Object.keys(servers).some((k) => /chrome-devtools/.test(k))) out['chrome-devtools'] = true;
  } catch (e) { /* no user MCP config: nothing more is connected */ }
  return out;
}

/**
 * `digest [<member>] [--json]` (B-378): the `skill-digest/1` (fabric-agent-contract DEC-0204)
 * of each pinned member's plugin root and of each of its skills, computed from the file list
 * `claude-plugin-pins.json` pins. A device baseline names these to require "the family at this
 * release". A read: no network, no state. Exit 1 when a digest cannot be computed, 2 for an
 * unknown member.
 */
function cmdDigest(argv) {
  const D = require(path.join(ROOT, 'lib', 'skilldigest.js'));
  const rest = argv.slice(3);
  const json = rest.includes('--json');
  const names = rest.filter((a) => !a.startsWith('-'));
  let pins;
  try {
    pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'claude-plugin-pins.json'), 'utf8'));
  } catch (e) {
    log(`claude-plugin-pins.json cannot be read (${e.message}); no digest is printed rather than a guessed one.`);
    return 1;
  }
  const members = Array.isArray(pins.members) ? pins.members : [];
  const unknown = names.filter((n) => !members.some((m) => m.name === n));
  if (unknown.length) {
    log(`unknown member: ${unknown.join(', ')} (pinned: ${members.map((m) => m.name).join(', ')})`);
    return 2;
  }
  const rows = members.filter((m) => !names.length || names.includes(m.name)).map((m) => D.memberDigests(m));
  const failed = rows.some((r) => !r.plugin.digest || r.skills.some((s) => !s.digest));
  if (json) {
    const strip = (r) => (r.digest ? { digest: r.digest } : { unknown: r.unknown, ...(r.path !== undefined ? { path: r.path } : {}) });
    log(JSON.stringify({
      schema: D.SKILL_DIGEST,
      members: rows.map((r) => ({
        name: r.name, version: r.version, commit: r.commit, plugin: strip(r.plugin),
        skills: r.skills.map((s) => ({ id: s.id, ...strip(s) })),
      })),
    }, null, 2));
    return failed ? 1 : 0;
  }
  const show = (r) => r.digest || `unknown (${r.unknown}${r.path ? `: ${r.path}` : ''})`;
  log(`${D.SKILL_DIGEST} from claude-plugin-pins.json (fabric-agent-contract DEC-0204)`);
  for (const r of rows) {
    log('');
    log(`${r.name} ${r.version || '?'} @ ${(r.commit || '?').slice(0, 12)}`);
    log(`  plugin  ${show(r.plugin)}`);
    for (const s of r.skills) log(`  skill   ${s.id.padEnd(22)} ${show(s)}`);
  }
  return failed ? 1 : 0;
}

Object.assign(module.exports, {
  cmdSignature, cmdHumanizers, cmdList, cmdAgents, cmdInjectors, cmdConflicts, cmdToolkit,
  cmdPack, checkAddresses, cmdMaterialised, cmdContext, cmdSettings, packMcp, cmdDigest
});
