'use strict';
/**
 * `hosts`: the hosts detected here and what each carries.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  SKILLS, canonicalPath, claudeRoot, lazy, lockSources, log, plan
} = require('./cli-core.js');
const domainsSummary = lazy('./cli-domains.js', 'domainsSummary');
const observedEntries = lazy('./cli-install.js', 'observedEntries');

function cmdHosts() {
  const apply = require('../lib/apply.js');
  const piLib = require('../lib/pi.js');
  const home = os.homedir();
  log('Agent hosts with an instruction file the routing block is written to (Cursor, a separate rules file, is not listed):\n');
  for (const t of apply.TARGETS) {
    const v = apply.hostRootVerdict(t, home, {});
    const present = v.supported && fs.existsSync(v.root);
    const file = v.supported ? path.join(v.root, t.file) : '(unsupported platform)';
    log(`  ${t.agent.padEnd(8)} ${present ? 'detected' : 'absent  '}  ${file}`);
  }
  hostsInstructionTargets(home);
  // B-167: Codex will not start while its config defines one table twice.
  const codexT = apply.TARGETS.find((t) => t.agent === 'codex');
  const cv = codexT && apply.hostRootVerdict(codexT, home, {});
  const codexCfg = cv && cv.supported ? path.join(cv.root, 'config.toml') : null;
  if (codexCfg && fs.existsSync(codexCfg)) {
    const dups = require('../lib/codexconfig.js').duplicateTables(fs.readFileSync(codexCfg, 'utf8'));
    const show = require('../lib/codexconfig.js').show;
    if (dups.length) {
      log(`\nCodex config ${codexCfg}: ${dups.length} duplicate table(s), so Codex refuses to start (\`duplicate key\`):`);
      for (const d of dups) log(`  ${show(d.key)} at lines ${d.lines.join(' and ')}`);
      log('  Copy the file, then delete the later entry if both say the same; nothing here was changed.');
    } else {
      log(`\nCodex config ${codexCfg}: no duplicate tables.`);
    }
  }
  // B-177: a local MCP server that does not answer when a session starts leaves that session
  // without its tools for good. TCP connect only — no request, no header leaves this process.
  const claudeJson = path.join(home, '.claude.json');
  if (fs.existsSync(claudeJson)) {
    let cfg = null;
    try { cfg = JSON.parse(fs.readFileSync(claudeJson, 'utf8')); } catch (e) { /* unreadable: say so */ }
    if (!cfg) log(`\nClaude Code MCP: ${claudeJson} is not readable JSON; nothing probed.`);
    else {
      const reach = require('../lib/mcpreach.js');
      const res = reach.probe(reach.configured(cfg), 1500);
      if (res.length) {
        log(`\nClaude Code MCP servers on this machine (${res.length}, TCP connect only):`);
        for (const s of res) log(`  ${s.name.padEnd(24)} ${s.answers ? 'answers' : 'refused'}  ${s.host}:${s.port}  (${s.scope})${s.answers ? '' : `: ${s.why}`}`);
        if (res.some((s) => !s.answers)) {
          log('  A session started while a server refused has none of its tools until `/mcp` → reconnect');
          log('  (or a new session). Do not work around it by calling the service directly with its token.');
        }
      }
    }
  }
  // L5: which domain members load where. Counts only — a project's name stays in `domains`.
  try { domainsSummary(home); } catch (e) { log(`\nDomain members per project: not read (${e.message})`); }
  reportStaleLocalRecords();
  reportHermesLinks(home);
  const family = new Set(SKILLS.flatMap((s) => s.skillNames || []));
  const r = piLib.inspect({ home, env: process.env, cwd: process.cwd(), which: (b) => piLib.whichBin(b), family });
  log('\nPi (@earendil-works/pi-coding-agent):');
  if (!r.detected) { log('  pi      absent    no ~/.pi/agent and no `pi` on PATH'); return; }
  log(`  pi      detected  via ${r.via.join(', ')}; agent dir ${r.agentDir}`);
  log('  Pi does not load Claude Code plugins: the family reaches it as plain skill directories and through AGENTS.md.');
  // B-221: Pi 1.1 reads project roots first and keeps the first name it finds.
  log('  precedence: project roots first (.pi/skills here, then .agents/skills up to the git root), then ~/.pi/agent/skills, then ~/.agents/skills;'
    + ' the first copy of a name wins. Project roots load only in a project Pi trusts.');
  // B-263: what Pi's own trust store says about this project, and about every project in it.
  const t = r.trust;
  const where = t.entry ? `by ${t.file} entry ${t.entry}` : t.store === 'invalid' ? '' : `no entry in ${t.file}; defaultProjectTrust is ${t.default}`;
  const here = {
    'not-needed': 'not needed (no .pi resource and no project .agents/skills here); nothing to gate',
    trusted: `trusted (${where}); Pi loads this project's roots`,
    untrusted: `not trusted (${where}); Pi does not load this project's roots, so they are left out below`,
    asks: `not decided (${where}); an interactive Pi asks at start and loads the roots if you trust it, a headless run (-p) does not`,
    unknown: `unknown: ${t.reason} (Pi refuses to read it either)`,
  }[t.verdict];
  log(`  project trust here (${canonicalPath(process.cwd())}): ${here}`);
  if (t.verdict !== 'not-needed') log('  (`pi --approve` or `--no-approve`, and an extension that answers project_trust, decide per run and are not read here)');
  if (t.entries.length) {
    log(`  projects in ${t.file} (${t.entries.length}):`);
    for (const e of t.entries) log(`    ${e.path}: ${e.trusted ? 'trusted, project roots load' : 'not trusted, project roots not loaded'} (and in folders below without their own entry)`);
  }
  for (const root of r.roots) {
    const note = !root.loaded ? ' (not loaded: project not trusted)'
      : root.asks ? ' (loads after you trust the project; headless runs skip it)' : '';
    log(`  skills root (${root.kind})  ${root.path}  ${root.skills} skill(s)${note}`);
  }
  // B-293: when Pi would ask, the project copies count only after the person trusts it,
  // and a headless `pi -p` never loads them; both numbers are printed, not one.
  const pending = t.verdict === 'asks';
  log(`  family skills visible to Pi (by name): ${r.family.visible.length} of ${r.family.total}` +
      (pending ? ` after you trust this project; ${r.family.headless.length} of ${r.family.total} in a headless run (\`pi -p\` skips the project roots)` : '') +
      (pending && r.family.afterTrust.length ? `; only after trust: ${r.family.afterTrust.join(', ')}` : '') +
      (r.family.missing.length ? `; not visible: ${r.family.missing.join(', ')}` : ''));
  log(`  duplicate names across Pi's roots: ${r.duplicates.harmless} harmless (one realpath), ` +
      `${r.duplicates.conflicts.length} conflict(s) (different realpaths) of ${r.names} names`);
  for (const c of r.duplicates.conflicts) {
    const mark = r.duplicates.familyConflicts.includes(c.name) ? ' [family]' : '';
    const when = c.afterTrust ? ' (after you trust the project)' : '';
    log(`  conflict: ${c.name}${mark}: Pi keeps ${c.locations[0].path}; shadowed: ${c.locations.slice(1).map((l) => l.path).join(', ')}${when}`);
  }
}

/**
 * B-286: third-party skills Hermes reads through a link into ~/.agents/skills, where a
 * Hermes self-patch changes the copy every other host reads. Read-only: the count and the
 * per-source remedy from lib/hermeslinks.js; the hub never copies a third-party skill.
 */
function reportHermesLinks(home) {
  const HL = require('../lib/hermeslinks.js');
  const hermesHome = (process.env.HERMES_HOME && String(process.env.HERMES_HOME).trim()) || path.join(home, '.hermes');
  const dir = path.join(hermesHome, 'skills');
  if (!fs.existsSync(dir)) { log(`\nHermes (B-286): absent (no ${dir})`); return; }
  const a = HL.assess({
    entries: observedEntries(dir),
    familyIds: SKILLS.flatMap((s) => plan.skillIds(s)),
    lock: lockSources(),
    sharedRoot: path.join(home, '.agents', 'skills'),
  });
  log('\nHermes (B-286):');
  for (const line of HL.report(a, { dir })) log(line);
}

/**
 * B-243: Claude Code local install records under a project's old path (a symlink to the
 * renamed folder) beside the live record. Claude cannot address them; read-only report
 * with the exact remedy from lib/localrecords.js.
 */
function reportStaleLocalRecords() {
  const L = require('../lib/localrecords.js');
  const file = path.join(claudeRoot(), 'plugins', 'installed_plugins.json');
  let registry;
  try { registry = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
    if (e.code !== 'ENOENT') log(`\nClaude Code install records: ${file} not read (${e.code || 'invalid JSON'})`);
    return;
  }
  const real = (p) => { try { return fs.realpathSync(p); } catch (_) { return null; } };
  const found = L.staleAliases(registry, real);
  // B-264: worktree and subdirectory records, which Claude addresses at the repository root.
  const rooted = L.rootRecords(registry, real, require('../lib/claude-pinned.js').claudeAddress);
  const missing = L.missingRecords(registry, real);
  if (!found.length) log(`\nClaude Code install records (${file}): no local install record under an old project path.`);
  else {
    log(`\nClaude Code install records (${file}): ${found.length} local install record(s) under an old project path.`);
    log('  Claude matches a local scope by the physical folder, so `claude plugin update|uninstall --scope local` cannot reach them');
    log('  and `update` leaves them as recorded:');
    for (const a of found) log(`    ${a.plugin}: ${a.projectPath} (now ${a.real}, which has its own record)`);
  }
  if (rooted.length) {
    log(`  ${rooted.length} local install record(s) Claude addresses at a repository root, not at their own folder,`);
    log('  so neither Claude nor `update` ever reads or updates them:');
    for (const a of rooted) {
      log(`    ${a.plugin}: ${a.projectPath} (a ${a.kind === 'worktree' ? 'git worktree' : 'subdirectory'} of ${a.root}; `
        + `${a.rootRecord ? 'the root has its own record' : 'the root has no record, so `update` blocks this member'})`);
    }
  }
  if (missing.length) {
    log(`  ${missing.length} local install record(s) under a folder that no longer exists; Claude cannot address them`);
    log('  and `update` blocks each member that has one:');
    for (const a of missing) log(`    ${a.plugin}: ${a.projectPath}`);
  }
  // One remedy, one backup, for every record named above.
  const all = found.concat(rooted, missing);
  if (all.length) for (const line of L.remedy(file, all)) log(`  ${line}`);
}

/**
 * B-206: every other host with a global instruction file, what the routing writer does
 * for it, and why. Read-only; the same `describe()` the writer's presence rule uses.
 */
function hostsInstructionTargets(home) {
  const IT = require('../lib/instruction-targets.js');
  const rows = IT.describe(home);
  log('\nOther hosts with a global instruction file (B-206):\n');
  for (const r of rows.filter((x) => x.kind !== 'reported')) {
    const what = r.kind === 'compact' ? `compact block, cap ${r.cap} characters`
      : r.kind === 'hermes' ? 'compact block as the sshlg-routing plugin (two sections, 4,000 characters each)' : 'full block';
    const who = r.serves ? ` (serves ${r.serves.join(', ')})` : '';
    let state = r.present ? 'detected' : 'absent  ';
    try {
      if (r.present && fs.lstatSync(r.file).isSymbolicLink()) {
        const real = fs.realpathSync(r.file);
        state = require('../lib/apply.js').managedFiles(home, {}).includes(real)
          ? `symlink to ${real} (hub-managed: already served, nothing written)`
          : `symlink to ${real} (not hub-managed: left alone; replace the link with a regular file to let the hub manage it)`;
      }
    } catch (e) { /* absent or dangling: said below */ }
    log(`  ${r.agent.padEnd(8)} ${state}  ${r.file}  ${what}${who}${r.present ? '' : `; ${r.why}`}`);
    if (r.note) log(`           note: ${r.note}`);
  }
  for (const r of rows.filter((x) => x.kind === 'reported')) {
    if (!r.present) { log(`  ${r.agent.padEnd(8)} absent    not written: ${r.why}`); continue; }
    let line = `  ${r.agent.padEnd(8)} detected  not written: ${r.why}`;
    if (r.servedBy) line += ` Served through the ${r.servedBy === 'agents' ? '~/.agents/AGENTS.md' : r.servedBy} row above.`;
    log(line);
    if (r.fallback) {
      log(!r.file ? `           relies on ${r.fallback}.`
        : r.fallbackActive
        ? `           relies on ${r.fallback} as a fallback; it stops the day ${r.file} appears.`
        : `           ${r.file} exists, so ${r.fallback} is NOT read: carry the routing block there or remove the file.`);
    }
    if (r.manual) log(`           ${r.manual}`);
  }
}

Object.assign(module.exports, {
  cmdHosts, reportHermesLinks, reportStaleLocalRecords, hostsInstructionTargets
});
