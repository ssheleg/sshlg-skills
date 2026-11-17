'use strict';
/**
 * `domains`: domain members loaded only in the projects that call for them.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const { ROOT, SKILLS, atomic, log } = require('./cli-core.js');

/**
 * `domains` — domain members load only in the projects that call for them (plan
 * 2026-10-13 § L5). The decisions live in `lib/domains.js`; this reads the inputs, backs
 * every existing file up through `protect()` before writing it, reads every write back,
 * and records what it wrote in `~/.sshlg-skills/domains.json` so `--revert` removes
 * exactly that. Without `--apply`, `--revert`, `--enable`, `--disable` or `--update-step`
 * it writes nothing.
 *
 * Order is the point: every project entry is written AND read back before a member is
 * turned off at user scope, so no project with evidence loses its member, even for one
 * session. A project that cannot be written keeps its member on machine-wide; a project
 * read only in part keeps on every member it could not rule out. Only an interactive
 * `--apply` turns a member off: the unattended `update` step only adds.
 */
const DOMAINS_LOCAL = path.join('.claude', 'settings.local.json');

/** A symlink alias is the same profile; changing its target is a different profile. */
function domainsProfilePath(file) {
  try { return fs.realpathSync(file); } catch (e) {
    try { return path.join(fs.realpathSync(path.dirname(file)), path.basename(file)); }
    catch (_) { return path.resolve(file); }
  }
}

function domainsInputs(argv, home) {
  const D = require(path.join(ROOT, 'lib', 'domains.js'));
  const E = require(path.join(ROOT, 'lib', 'enablement.js'));
  const settingsPath = path.join(E.claudeRoot(home), 'settings.json');
  const profile = domainsProfilePath(settingsPath);
  const settingsLabel = path.resolve(E.claudeRoot(home)) === path.join(home, '.claude') ? '~/.claude/settings.json' : settingsPath;
  const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } };
  // Only a missing file is "absent"; any other read error is reported, never taken for absence.
  const readLocal = (p) => {
    try { return { text: fs.readFileSync(p, 'utf8') }; } catch (e) { return e.code === 'ENOENT' ? { text: null } : { text: null, error: e.code || e.message }; }
  };
  const value = (name) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  const recordPath = path.join(home, '.sshlg-skills', 'domains.json');
  const rr = readLocal(recordPath);
  const recordText = rr.text;
  // A record that does not parse, or has another shape, is NOT "no record": members may be off
  // by this command's hand. It is named, and the writers refuse to act on it.
  let owned = null;
  let recordError = rr.error ? `cannot be read (${rr.error})` : null;
  if (recordText !== null) {
    try { owned = JSON.parse(recordText); } catch (e) { recordError = `does not parse (${e.message})`; }
    if (!recordError) recordError = D.validRecord(owned);
    if (recordError) owned = null;
  }
  const ownedProfile = owned && domainsProfilePath(owned.profile || path.join(home, '.claude', 'settings.json'));
  const profileError = owned && ownedProfile !== profile
    ? `ownership belongs to Claude profile ${ownedProfile}; selected profile is ${profile}. Restore CLAUDE_CONFIG_DIR to the owning profile before applying or reverting` : null;
  const rootArg = value('--root') || process.env.SSHLG_PROJECTS_ROOT || null;
  const roots = (rootArg ? rootArg.split(path.delimiter) : (owned && owned.roots && owned.roots.length ? owned.roots : null) || [path.join(home, 'DATA')])
    .filter(Boolean).map((r) => path.resolve(r.replace(/^~(?=$|\/)/, home)));
  // Every git repository directly under a root. A symlink to a directory is followed and
  // keyed by the LINK path (the one Claude Code opens); two names for one repository are
  // one project, the first by name.
  const dirs = [];
  const rootErrors = [];
  const seen = new Set();
  const addDir = (dir) => {
    let real;
    try { real = fs.realpathSync(dir); } catch (e) { return false; }
    if (seen.has(real)) return false;
    seen.add(real);
    dirs.push(dir);
    return true;
  };
  for (const r of roots) {
    let entries;
    try { entries = fs.readdirSync(r, { withFileTypes: true }); } catch (e) { rootErrors.push(`${r}: ${e.code || e.message}`); continue; }
    const names = entries.filter((d) => !d.name.startsWith('.')).filter((d) => {
      if (d.isDirectory()) return true;
      if (!d.isSymbolicLink()) return false;
      try { return fs.statSync(path.join(r, d.name)).isDirectory(); } catch (e) { return false; }
    }).map((d) => d.name).sort();
    for (const n of names) if (fs.existsSync(path.join(r, n, '.git'))) addDir(path.join(r, n));
  }
  const rootRepos = dirs.length;
  // Projects the operator chose with --enable are projects wherever they live.
  for (const dir of Object.keys((owned && owned.manual) || {})) if (fs.existsSync(dir)) addDir(dir);
  // Usage: the newest 60-day table, unless --no-usage. Private (mode 600); only counts are read.
  let usage = new Map();
  let usageFile = null;
  if (!argv.includes('--no-usage')) {
    const udir = path.join(home, '.sshlg-skills', 'usage');
    let tables = [];
    // The operator's own measurement (no hub command produces it); one past its window is ignored.
    try { tables = fs.readdirSync(udir).filter((n) => D.usageFresh(n)).sort(); } catch (e) { tables = []; }
    if (tables.length) {
      usageFile = path.join(udir, tables[tables.length - 1]);
      usage = D.parseUsage(read(usageFile) || '', SKILLS.filter((s) => D.DOMAIN_MEMBERS.includes(s.name)));
    }
  }
  const plugins = {};
  for (const s of SKILLS) if (D.DOMAIN_MEMBERS.includes(s.name)) plugins[s.name] = s.pluginInstall;
  // A member whose plugin ships hooks is never scoped (its gate must run in every session).
  // Read from the installed plugin's own directory, or this checkout's pin when not installed.
  const installedAt = E.installed(home);
  const keepOn = { 'sheleg-dev': D.KEEP_ON_HOOKS };
  for (const m of D.DOMAIN_MEMBERS) {
    const dirs = [installedAt[plugins[m]], path.join(ROOT, 'skills', m, 'plugins', m)].filter(Boolean);
    if (dirs.some((d) => fs.existsSync(path.join(d, 'hooks', 'hooks.json')))) keepOn[m] = D.KEEP_ON_HOOKS;
  }
  const localPath = (dir) => path.join(dir, DOMAINS_LOCAL);
  const enabledOf = (text) => { try { const d = JSON.parse(text); return (d && d.enabledPlugins) || {}; } catch (e) { return {}; } };
  const kinds = {};
  // Evidence from a child that asks git, several repositories at a time (lib/domainscan.js).
  // A child that fails leaves every project to the in-process walk: slower, and partial.
  let scanned = {};
  const child = dirs.length ? spawnSync(process.execPath, [path.join(ROOT, 'lib', 'domainscan.js')],
    { input: JSON.stringify(dirs), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }) : { status: 0, stdout: '{}' };
  try { scanned = child.status === 0 ? JSON.parse(child.stdout || '{}') : {}; } catch (e) { scanned = {}; }
  const projects = dirs.map((dir) => {
    let s = scanned[dir];
    if (!s) {
      const w = D.scan(dir, fs, path);
      s = { evidence: w.evidence, via: w.truncated ? 'walk (stopped early)' : 'walk', partial: D.DOMAIN_MEMBERS.slice() };
    }
    const evidence = s.evidence;
    const used = usage.get(D.encodeDir(dir)) || {};
    for (const [member, calls] of Object.entries(used)) (evidence[member] || (evidence[member] = [])).push(`used 60d: ${calls} call(s)`);
    for (const member of ((owned && owned.manual) || {})[dir] || []) (evidence[member] || (evidence[member] = [])).push('manual: chosen with --enable');
    for (const list of Object.values(evidence)) for (const why of list) {
      const k = why.startsWith('used 60d') ? 'usage' : why.startsWith('manual:') ? 'manual' : (D.kindOf(why.split(': ')[0]) || 'other');
      kinds[k] = (kinds[k] || 0) + 1;
    }
    const lr = readLocal(localPath(dir));
    const sr = readLocal(path.join(dir, '.claude', 'settings.json'));
    // Read semantic choices independently of the narrower lossless-write format.
    // A project settings file may be valid JSON without having been printed by us.
    const shared = sr.error ? { ok: false, reason: 'unreadable file' } : D.readEnabled(sr.text);
    const local = lr.error ? { ok: false, reason: 'unreadable file' } : D.readEnabled(lr.text);
    const sharedOK = shared.ok;
    const localOK = local.ok;
    const settingsOK = sharedOK && localOK;
    let verdict;
    // Shared project choices precede local ones; user scope must not masquerade as
    // a project entry. Unknown shared settings cannot authorize a local override.
    const writable = () => verdict || (verdict = settingsOK ? domainsWritable(dir, lr, D)
      : { ok: false, why: `cannot read valid .claude/${sharedOK ? 'settings.local.json' : 'settings.json'}` });
    const settingsReasons = [[shared, '.claude/settings.json'], [local, '.claude/settings.local.json']]
      .filter(([result]) => !result.ok).map(([result, file]) => `${file}: ${result.reason}`);
    return { dir, evidence, via: [s.via, ...settingsReasons].join('; '),
      partial: settingsOK ? (s.partial || []) : D.DOMAIN_MEMBERS.slice(),
      local: settingsOK ? Object.assign({}, shared.enabled, local.enabled) : {}, ignored: writable };
  });
  const ur = readLocal(settingsPath);
  return { D, read, readLocal, roots, rootErrors, rootRepos, dirs, projects, usageFile, kinds, plugins, owned, recordError,
    recordPath, recordText, profile, profileError, settingsPath, settingsLabel, userText: ur.text, userError: ur.error, user: enabledOf(ur.text), localPath, enabledOf, value, keepOn };
}

/** May this project's settings.local.json be written? Readable, Claude Code's format, git-ignored. */
function domainsWritable(dir, lr, D) {
  if (lr.error) return { ok: false, why: `cannot read .claude/settings.local.json (${lr.error})` };
  if (lr.text !== null) {
    const probe = D.editEnabled(lr.text, { set: { 'probe@probe': true } });
    if (!probe.ok) return { ok: false, why: `the file ${probe.reason}` };
  }
  // -q decides: with -v, git also exits 0 when the last matching rule is a negation
  // (`!.claude/settings.local.json`), which leaves the file committable. Any ignore source
  // counts (.gitignore, info/exclude, the global excludes file): it is git's own rule, and
  // the file is never committed from this machine either way (operator decision 2026-10-13).
  const q = spawnSync('git', ['-C', dir, 'check-ignore', '-q', DOMAINS_LOCAL], { encoding: 'utf8' });
  if (q.status === 1) return { ok: false, why: 'git does not ignore .claude/settings.local.json (or it is tracked): add it to .gitignore, then run again' };
  if (q.status !== 0) return { ok: false, why: `git check-ignore failed: ${String(q.stderr || (q.error && q.error.message) || '').trim()}` };
  const v = spawnSync('git', ['-C', dir, 'check-ignore', '-v', DOMAINS_LOCAL], { encoding: 'utf8' });
  return { ok: true, why: `ignored by ${String(v.stdout).trim().split('\t')[0] || 'git'}` };
}

/** Back up (an existing file), write, and say so; false when the backup failed. */
function domainsWriteFile(apply, home, file, before, after, label) {
  if (before !== null) {
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') { log(`  ${label}: NOT written: backup failed (${saved.error})`); return false; }
  }
  try { atomic.write(file, after, { mode: 0o600 }); return true; }
  catch (e) { log(`  ${label}: NOT written: ${e.code || e.message}`); return false; }
}

/** The Fabric line, only where Fabric is installed — and with no board id. */
function domainsFabricLine(home, say) {
  try {
    const machine = require(path.join(ROOT, 'lib', 'machine.js'));
    if (machine.holds('fabric', machine.probe({ home }))) {
      say('  Fabric is installed here. Fabric plans to choose skill layers per agent in the sessions it');
      say('  starts; until that ships, this command is the setting for every session on this machine.');
    }
  } catch (e) { /* no machine probe: no Fabric line */ }
}

function runDomainsLocked(argv) {
  const writes = ['--apply', '--revert', '--enable', '--disable', '--update-step'].some((f) => argv.includes(f));
  if (!writes) return cmdDomains(argv);
  const lock = require('../lib/updatelock.js');
  const home = process.env.HOME || os.homedir();
  const got = lock.acquire(home);
  if (!got.ok || got.degraded) {
    log(`domains: refused: ${got.message || got.degraded}; configuration not written`);
    return got.ok ? 1 : lock.BUSY_EXIT;
  }
  const free = () => lock.release(home, got.token);
  process.on('exit', free);
  try { return cmdDomains(argv); }
  finally { free(); process.removeListener('exit', free); }
}

function cmdDomains(argv) {
  const apply = require(path.join(ROOT, 'lib', 'apply.js'));
  const home = process.env.HOME || os.homedir();
  const doApply = argv.includes('--apply');
  const doRevert = argv.includes('--revert');
  const updateStep = argv.includes('--update-step');
  const enableArg = argv.includes('--enable');
  const disableArg = argv.includes('--disable');
  if ([doApply, doRevert, updateStep, enableArg, disableArg].filter(Boolean).length > 1) {
    log('domains: pick one of --apply, --revert, --enable, --disable'); return 2;
  }
  const I = domainsInputs(argv, home);
  const { D } = I;
  const name = (dir) => path.basename(dir);
  if (I.recordError) {
    log(`domains: ~/.sshlg-skills/domains.json ${I.recordError}: it decides what --revert undoes, so nothing acts on it.`);
    log('  Restore it from ~/.sshlg-skills/backups/ (newest sshlg-skills_domains.json.*) or move it aside, then run again.');
    if (doApply || doRevert || updateStep || enableArg || disableArg) return 1;
  }
  if (I.profileError) {
    log(`domains: refused: ${I.profileError}; nothing written`);
    return doApply || doRevert || updateStep || enableArg || disableArg ? 1 : 0;
  }
  if (enableArg || disableArg) return domainsManual(I, apply, home, enableArg ? 'enable' : 'disable');
  if (doRevert) return domainsRevert(I, apply, home);

  const applied = !!(I.owned && I.owned.applied === true);
  // `update` on a machine where `domains --apply` never ran: one line, nothing written.
  if (updateStep && !applied) {
    const P0 = D.plan({ projects: I.projects, user: I.user, owned: I.owned, plugins: I.plugins, keepOn: I.keepOn, onlyAdd: true });
    const n = P0.adds.length + P0.refused.length;
    if (n) {
      log(`\n== Domain members ==\n  ${n} project(s) call for a domain member that is on machine-wide here; `
        + '`npx sshlg-skills domains` previews loading them per project, `--apply` does it.');
    }
    return 0;
  }
  // A root that cannot be read, or roots holding no repository, make "no evidence" mean
  // "not looked": nothing may be turned off, or recorded, on that basis.
  const rootProblem = I.rootErrors.length ? `cannot read ${I.rootErrors.join('; ')}`
    : !I.rootRepos ? `no git repositories under ${I.roots.join(path.delimiter)}` : null;
  if (rootProblem && (doApply || updateStep)) {
    log(`domains: refused: ${rootProblem}. Point --root (or $SSHLG_PROJECTS_ROOT) at your projects directory.`);
    return 1;
  }
  const P = D.plan({ projects: I.projects, user: I.user, owned: I.owned, plugins: I.plugins, keepOn: I.keepOn, onlyAdd: updateStep });
  const withEvidence = I.projects.filter((p) => Object.keys(p.evidence).length);
  const partial = I.projects.filter((p) => p.partial.length);
  const quiet = updateStep;
  const say = quiet ? () => {} : log;
  if (quiet) {
    log('\n== Domain members ==');
    for (const r of P.refused) log(`  ! ${name(r.dir)}: ${r.keys.join(', ')} refused: ${r.why}`);
    if (P.wouldOff.length) log(`  ${P.wouldOff.join(', ')} could go off at user scope; \`update\` never turns a member off: run \`npx sshlg-skills domains --apply\` to do it`);
    if (!P.adds.length && !P.userOn.length) {
      log(P.refused.length ? '  nothing written; the projects above are refused' : '  every project with evidence has its member; nothing written');
      return 0;
    }
  }
  say(`Domain members by project in Claude Code: core and hook-bearing members stay on everywhere; domain members load where a project calls for them`);
  say(`  projects root: ${I.roots.join(path.delimiter)} (${I.rootRepos} git repositories${partial.length ? `; ${partial.length} not read in full` : ''})`);
  if (rootProblem) say(`  ! ${rootProblem}: --apply refuses until the root is right`);
  say(`  usage: ${I.usageFile ? `${path.basename(I.usageFile)} (a 60-day call counts as evidence)` : 'none read'}`);
  say(`  ${withEvidence.length} project(s) with evidence`);
  for (const p of partial) say(`  ? ${name(p.dir)}: not read in full (${p.via}): ${p.partial.filter((m) => !p.evidence[m]).join(', ') || 'nothing'} not ruled out, so not turned off`);
  const byDir = new Map(I.projects.map((p) => [p.dir, p]));
  const evOf = (dir, member) => (byDir.get(dir).evidence[member] || []).join('; ');
  for (const member of D.DOMAIN_MEMBERS) {
    const key = I.plugins[member];
    const skip = P.skipped.find((s) => s.member === member);
    const projectsFor = withEvidence.filter((p) => p.evidence[member]);
    say(`\n  ${member} (${key}): evidence in ${projectsFor.length} project(s)${skip ? `; not managed: ${skip.why}` : ''}`);
    if (skip) {
      if (P.userOn.includes(key)) say(`    + ${key}: restore the safety hooks at user scope`);
      continue;
    }
    const gi = (dir) => byDir.get(dir).ignored().why.replace(home, '~');
    for (const a of P.adds) if (a.keys.includes(key)) say(`    + ${name(a.dir)}: enabledPlugins["${key}"] = true: ${evOf(a.dir, member)} [${gi(a.dir)}]`);
    for (const x of P.present) if (x.key === key) say(`    = ${name(x.dir)}: already on in the project: ${evOf(x.dir, member)}`);
    for (const x of P.respected) if (x.key === key) say(`    = ${name(x.dir)}: set false in the project by you; left alone`);
    for (const r of P.refused) if (r.keys.includes(key)) say(`    ! ${name(r.dir)}: refused: ${r.why}`);
    const b = P.blocked.find((x) => x.key === key);
    const u = P.uncertain.find((x) => x.key === key);
    if (P.userOff.includes(key)) say(`    - ${I.settingsLabel} enabledPlugins["${key}"]: true → false`);
    else if (P.userOn.includes(key)) say(`    + ${I.settingsLabel} enabledPlugins["${key}"]: false → true: ${(b || u).dirs.length} project(s) could not be covered (${(b || u).dirs.map(name).join(', ')})`);
    else if (P.managed[member] && P.managed[member].off) say(`    = ${I.settingsLabel} enabledPlugins["${key}"]: already false (by domains)`);
    else if (b) say(`    = ${key} stays on at user scope: ${b.dirs.length} project(s) could not get their entry (${b.dirs.map(name).join(', ')})`);
    else if (u) say(`    = ${key} stays on at user scope: ${u.dirs.length} project(s) not read in full (${u.dirs.map(name).join(', ')})`);
  }
  say(`\n  Evidence kinds: ${Object.entries(I.kinds).sort().map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`);
  domainsFabricLine(home, say);
  say('  A member back in one project: `npx sshlg-skills domains --enable <member>` there, then restart');
  say('  the session; `--disable` takes it out again; `--revert` undoes everything this command wrote.');
  if (!doApply && !updateStep) {
    say('\n  Nothing written. `--apply` writes the project entries first, reads them back, and only then');
    say('  turns a member off at user scope; `--revert` undoes only what this command wrote.');
    return 0;
  }

  // ── projects first ──
  let failed = false;
  const owned = domainsOwnedCopy(I);
  if (doApply) owned.applied = true;
  const newlyBlocked = new Set();
  for (const a of P.adds) {
    const r = domainsWriteProject(I, apply, home, owned, a.dir, a.keys);
    if (!r.ok) { failed = true; r.keys.forEach((k) => newlyBlocked.add(k)); }
  }
  // ── then user scope ──
  // Off only for members whose every project write held; back on for a member already off by
  // this command whose project could not get its entry — now or in a write above.
  const off = P.userOff.filter((k) => !newlyBlocked.has(k));
  const offByUs = new Set(Object.values(P.managed).filter((m) => m.off).map((m) => m.key));
  const on = [...new Set(P.userOn.concat([...newlyBlocked].filter((k) => offByUs.has(k))))];
  for (const k of newlyBlocked) if (P.userOff.includes(k)) log(`  ${k} stays on at user scope: a project write above failed`);
  // Read again now, not at the start: the project writes took time, and the file may have moved.
  const userNow = I.read(I.settingsPath);
  if ((off.length || on.length) && userNow === null) {
    log(`  ${I.settingsLabel}: cannot read the current file: no global changes written`);
    failed = true;
  }
  if ((off.length || on.length) && userNow !== null) {
    const set = Object.fromEntries(off.map((k) => [k, false]).concat(on.map((k) => [k, true])));
    const r = D.editEnabled(userNow, { set });
    if (!r.ok) { log(`  ${I.settingsLabel}: NOT written: the file ${r.reason}`); failed = true; }
    else if (!domainsRecordUserIntent(I, owned, off, apply, home)) {
      log('  global settings NOT written: ownership intent could not be persisted'); failed = true;
    } else if (r.text === userNow || domainsWriteFile(apply, home, I.settingsPath, userNow, r.text, I.settingsLabel)) {
      const back = I.enabledOf(I.read(I.settingsPath) || '');
      for (const k of off) {
        if (back[k] === false) { owned.user[k] = false; delete owned.pendingUser[k]; log(`  ${I.settingsLabel}: ${k} off at user scope (read back)`); }
        else { log(`  ${I.settingsLabel}: ${k} did not read back false`); failed = true; }
      }
      for (const k of on) {
        if (back[k] === true) { delete owned.user[k]; delete owned.pendingUser[k]; log(`  ${I.settingsLabel}: ${k} back on at user scope: preserve hooks or coverage for an unverified project (read back)`); }
        else { log(`  ${I.settingsLabel}: ${k} did not read back true`); failed = true; }
      }
    } else failed = true;
  }
  domainsDropStale(I, owned);
  if (!domainsSyncRouters(I, apply, home, owned)) failed = true;
  if (!writeRecord(I, owned, apply, home)) return 1;
  if (!quiet) log('  Restart Claude Code sessions to load the new plugin set.');
  return failed ? 1 : 0;
}

function domainsRecordUserIntent(I, owned, off, apply, home) {
  const prior = Object.assign({}, owned.user);
  const priorPending = Object.assign({}, owned.pendingUser);
  for (const k of off) { owned.user[k] = false; owned.pendingUser[k] = true; }
  if (writeRecord(I, owned, apply, home)) return true;
  owned.user = prior;
  owned.pendingUser = priorPending;
  return false;
}

function domainsOwnedCopy(I) {
  const o = I.owned || {};
  return {
    roots: I.roots, profile: I.profile, applied: o.applied === true,
    user: Object.assign({}, o.user || {}),
    // A previous process may have exited after writing false but before clearing intent.
    pendingUser: Object.fromEntries(Object.entries(o.pendingUser || {}).filter(([k]) => I.user[k] !== false)),
    projects: JSON.parse(JSON.stringify(o.projects || {})),
    manual: JSON.parse(JSON.stringify(o.manual || {})),
    routers: Object.assign({}, o.routers || {}),
  };
}

/** Read failure or malformed JSON cannot erase recovery ownership. */
function domainsKnownPlugins(I, file) {
  const lr = I.readLocal(file);
  if (lr.error) return { known: false };
  if (lr.text === null) return { known: true, plugins: {} };
  try {
    const parsed = JSON.parse(lr.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { known: false };
    const ep = parsed.enabledPlugins;
    if (ep !== undefined && (!ep || typeof ep !== 'object' || Array.isArray(ep)
      || Object.values(ep).some((v) => typeof v !== 'boolean'))) return { known: false };
    return { known: true, plugins: ep || {} };
  } catch (e) { return { known: false }; }
}

/** Ownership of project entries the operator has since removed or flipped is dropped. */
function domainsDropStale(I, owned) {
  for (const dir of Object.keys(owned.projects)) {
    const local = domainsKnownPlugins(I, I.localPath(dir));
    if (!local.known) continue; // unknown is not proof that our entry disappeared
    const lv = local.plugins;
    owned.projects[dir].plugins = owned.projects[dir].plugins.filter((k) => lv[k] === true);
    if (!owned.projects[dir].plugins.length) delete owned.projects[dir];
  }
}

/**
 * Write `keys` true into one project's settings.local.json: writability judged first, backup
 * of an existing file, read back. One project's I/O error is that project's refusal, and
 * ownership intent is persisted before bytes land, so a later failure leaves --revert able
 * to undo it. Returns {ok, keys}.
 */
function domainsWriteProject(I, apply, home, owned, dir, keys) {
  const { D } = I;
  const file = I.localPath(dir);
  const label = `${path.basename(dir)}/.claude/settings.local.json`;
  const no = (why) => { log(`  ${label}: NOT written: ${why}`); return { ok: false, keys }; };
  try {
    const lr = I.readLocal(file);
    const w = domainsWritable(dir, lr, D);
    if (!w.ok) return no(w.why);
    const before = lr.text;
    const r = D.editEnabled(before, { set: Object.fromEntries(keys.map((k) => [k, true])) });
    if (!r.ok) return no(`the file ${r.reason}`);
    let had = false;
    try { had = before !== null && Object.prototype.hasOwnProperty.call(JSON.parse(before), 'enabledPlugins'); } catch (e) { had = false; }
    const prev = owned.projects[dir] || { created: before === null, createdDir: !fs.existsSync(path.dirname(file)), hadEnabledPlugins: had, plugins: [] };
    const mine = keys.filter((k) => r.changed.includes(k));
    if (mine.length) {
      // Durable intent BEFORE the configuration write: an interrupted or failed apply can
      // still be reverted. Entries already true never become ours.
      const saved = JSON.parse(JSON.stringify(owned.projects));
      prev.priorValues = Object.assign({}, prev.priorValues || {});
      const original = I.enabledOf(before || '');
      for (const k of mine) {
        if (original[k] === false) prev.priorValues[k] = false;
        else delete prev.priorValues[k];
      }
      prev.plugins = [...new Set(prev.plugins.concat(mine))].sort();
      owned.projects[dir] = prev;
      if (!writeRecord(I, owned, apply, home)) {
        owned.projects = saved;
        return no('ownership intent could not be persisted');
      }
    }
    if (r.text !== before) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (!domainsWriteFile(apply, home, file, before, r.text, label)) return { ok: false, keys };
    }
    const back = I.enabledOf(I.read(file) || '');
    const bad = keys.filter((k) => back[k] !== true);
    if (bad.length) { log(`  ${label}: read back without ${bad.join(', ')}: not counted`); return { ok: false, keys: bad }; }
    log(`  ${label}: ${keys.join(', ')} on (read back)`);
    return { ok: true, keys };
  } catch (e) { return no(e.code || e.message); }
}

/** `--enable <member>` / `--disable <member>` in one project: the bootstrap and its undo. */
function domainsManual(I, apply, home, mode) {
  const { D } = I;
  const member = I.value(mode === 'enable' ? '--enable' : '--disable');
  if (!member || !D.DOMAIN_MEMBERS.includes(member)) {
    log(`domains --${mode} <member>: one of ${D.DOMAIN_MEMBERS.join(', ')}`); return 2;
  }
  let dir = I.value('--project');
  if (dir) dir = path.resolve(dir.replace(/^~(?=$|\/)/, home));
  else {
    const g = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
    if (g.status !== 0) { log(`domains --${mode}: not inside a git repository: pass --project <dir>`); return 2; }
    dir = String(g.stdout).trim();
  }
  if (!fs.existsSync(dir)) { log(`domains --${mode}: ${dir} does not exist`); return 2; }
  const key = I.plugins[member];
  const owned = domainsOwnedCopy(I);
  const label = `${path.basename(dir)}/.claude/settings.local.json`;
  if (mode === 'enable') {
    const r = domainsWriteProject(I, apply, home, owned, dir, [key]);
    if (!r.ok) { domainsDropStale(I, owned); writeRecord(I, owned, apply, home); return 1; }
    owned.manual[dir] = [...new Set((owned.manual[dir] || []).concat(member))].sort();
    const routersOk = domainsSyncRouters(I, apply, home, owned);
    if (!writeRecord(I, owned, apply, home)) return 1;
    if (!routersOk) return 1;
    log(`  ${member} is on in ${path.basename(dir)}; later runs keep it (recorded as your choice).`);
    log('  Restart the Claude Code session in that project (or reconnect) to load it.');
    return 0;
  }
  // --disable: forget the choice; remove the entry only if this command wrote it.
  owned.manual[dir] = (owned.manual[dir] || []).filter((m) => m !== member);
  if (!owned.manual[dir].length) delete owned.manual[dir];
  const rec = owned.projects[dir];
  let failed = false;
  const cleanup = [];
  if (!domainsSyncRouters(I, apply, home, owned, { [dir]: [key] }, cleanup)) failed = true;
  if (rec && rec.plugins.includes(key)) {
    const res = domainsUnsetProject(I, apply, home, dir, rec, [key]);
    if (res.ok) { rec.plugins = rec.plugins.filter((k) => k !== key); if (!rec.plugins.length) delete owned.projects[dir]; }
    else failed = true;
  } else log(`  ${label}: no entry of ours for ${member}; nothing removed`);
  domainsTidy(cleanup);
  if (!writeRecord(I, owned, apply, home)) return 1;
  log(`  If ${path.basename(dir)} still has evidence for ${member}, the next --apply adds it back; set it to false there to keep it off.`);
  return failed ? 1 : 0;
}

/** Remove `keys` from a project file this command wrote them into; created files go. */
function domainsUnsetProject(I, apply, home, dir, rec, keys) {
  const { D } = I;
  const file = I.localPath(dir);
  const label = `${path.basename(dir)}/.claude/settings.local.json`;
  try {
    const lr = I.readLocal(file);
    if (lr.error) { log(`  ${label}: NOT written: cannot read it (${lr.error})`); return { ok: false }; }
    const current = I.enabledOf(lr.text || '');
    const restore = keys.filter((k) => current[k] === true && (rec.priorValues || {})[k] === false);
    const r = D.editEnabled(lr.text, {
      set: Object.fromEntries(restore.map((k) => [k, false])),
      unset: Object.fromEntries(keys.filter((k) => !restore.includes(k)).map((k) => [k, true])),
      keepEmpty: !!rec.hadEnabledPlugins,
    });
    if (!r.ok) { log(`  ${label}: NOT written: the file ${r.reason}`); return { ok: false }; }
    if (r.text === lr.text) return { ok: true };
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') { log(`  ${label}: NOT written: backup failed (${saved.error})`); return { ok: false }; }
    // A file this command created and left holding nothing else goes, with its directory.
    if (rec.created && JSON.stringify(JSON.parse(r.text)) === '{}') {
      fs.rmSync(file);
      if (rec.createdDir) { try { fs.rmdirSync(path.dirname(file)); } catch (e) { /* not empty: something else lives there */ } }
      log(`  ${label}: removed (this command created it)`);
    } else {
      atomic.write(file, r.text);
      log(`  ${label}: ${keys.join(', ')} removed`);
    }
    return { ok: true };
  } catch (e) { log(`  ${label}: NOT written: ${e.code || e.message}`); return { ok: false }; }
}

/**
 * Add or remove the router file's line in this clone's `info/exclude` (`git rev-parse
 * --git-path`, so a worktree finds its common one). Backed up before a change; a line the
 * person wrote is never removed, only the marked one this command added.
 */
const EXCLUDE_MARK = '# sshlg-skills domains (B-345): personal router text, never committed';
function domainsExclude(dir, apply, home, mode) {
  const DR = require(path.join(ROOT, 'lib', 'domainrouters.js'));
  const r = spawnSync('git', ['-C', dir, 'rev-parse', '--git-path', 'info/exclude'], { encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, why: 'its git directory could not be found' };
  const file = path.resolve(dir, String(r.stdout).trim());
  const line = `/${DR.FILE.split(path.sep).join('/')}`;
  let text = null;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') return { ok: false, why: `info/exclude cannot be read (${e.code})` }; }
  const lines = text === null ? [] : text.split('\n');
  const at = lines.findIndex((l, i) => l === line && lines[i - 1] === EXCLUDE_MARK);
  let next;
  if (mode === 'add') {
    if (at !== -1) return { ok: true };
    next = (text === null || text === '' ? '' : text.endsWith('\n') ? text : text + '\n') + `${EXCLUDE_MARK}\n${line}\n`;
  } else {
    if (at === -1) return { ok: true };
    lines.splice(at - 1, 2);
    next = lines.join('\n');
  }
  if (text !== null) {
    const saved = apply.protect(file, { home });
    if (saved.action === 'backup-failed') return { ok: false, why: `info/exclude backup failed (${saved.error})` };
  }
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); atomic.write(file, next); return { ok: true }; }
  catch (e) { return { ok: false, why: `info/exclude not written (${e.code || e.message})` }; }
}

/**
 * B-345: the router text of the domain members on in a recorded project and off at user
 * scope, in the one file `lib/domainrouters.js` names, for every project this command
 * recorded (and every project whose file it wrote before). Run after the settings writes, so
 * user scope is read as it now is. A file not written by this command, or edited since, is
 * left alone; one git does not ignore is not written. False when a write or removal failed.
 */
function domainsSyncRouters(I, apply, home, owned, dropping, cleanup) {
  const DR = require(path.join(ROOT, 'lib', 'domainrouters.js'));
  const configLib = require(path.join(ROOT, 'lib', 'config.js'));
  const { REGISTRY } = require(path.join(ROOT, 'lib', 'routers-registry.js'));
  const config = configLib.readConfig(home);
  const user = I.enabledOf(I.read(I.settingsPath) || '');
  owned.routers = owned.routers || {};
  const dirs = [...new Set(Object.keys(owned.projects).concat(Object.keys(owned.manual || {}), Object.keys(owned.routers)))].sort();
  let ok = true;
  for (const dir of dirs) {
    const label = `${path.basename(dir)}/${DR.FILE}`;
    const file = path.join(dir, DR.FILE);
    if (!fs.existsSync(dir)) { log(`  ${label}: project folder gone; its record is dropped`); delete owned.routers[dir]; continue; }
    const local = domainsKnownPlugins(I, I.localPath(dir));
    if (!local.known) { log(`  ${label}: not checked: .claude/settings.local.json cannot be read as plugin settings`); continue; }
    // Keys about to be removed from this project count as off already, so the router file goes
    // first and the unset after it can still remove a .claude directory it created.
    const project = Object.assign({}, local.plugins);
    for (const k of ((dropping || {})[dir] || [])) delete project[k];
    const rec = owned.routers[dir];
    const members = DR.membersFor({ members: I.D.DOMAIN_MEMBERS, plugins: I.plugins, project, user,
      isEnabled: (n) => configLib.isEnabled(config, n) });
    const want = DR.render({ members, registry: REGISTRY, authored: (n) => configLib.authoredGet(config, n) });
    const cur = I.readLocal(file);
    if (cur.error) { log(`  ${label}: NOT written: cannot read it (${cur.error})`); ok = false; continue; }
    const d = DR.decide({ want, current: cur.text, recorded: rec && rec.sha256 });
    try {
      if (d.action === 'leave') { log(`  ${label}: left alone: ${d.why}`); continue; }
      if (d.action === 'keep') { if (want === null) delete owned.routers[dir]; else owned.routers[dir] = { sha256: DR.sha256(want), created: (rec && rec.created) || [] }; continue; }
      if (d.action === 'remove') {
        const saved = apply.protect(file, { home });
        if (saved.action === 'backup-failed') { log(`  ${label}: NOT removed: backup failed (${saved.error})`); ok = false; continue; }
        fs.rmSync(file);
        // Only the directories the file's write created, deepest first, and only when empty.
        for (const d of ((rec && rec.created) || []).slice().reverse()) {
          try { fs.rmdirSync(path.join(dir, d)); } catch (e) { if (cleanup) cleanup.push(path.join(dir, d)); }
        }
        domainsExclude(dir, apply, home, 'remove');
        delete owned.routers[dir];
        log(`  ${label}: removed (no member of its own is on only here now)`);
        continue;
      }
      const ignored = () => spawnSync('git', ['-C', dir, 'check-ignore', '-q', DR.FILE], { encoding: 'utf8' }).status === 0;
      if (!ignored()) {
        // Personal like settings.local.json: ignored through this clone's own info/exclude,
        // which no commit carries (any ignore source counts, operator decision 2026-10-13).
        const ex = domainsExclude(dir, apply, home, 'add');
        if (!ex.ok || !ignored()) { log(`  ${label}: NOT written: git does not ignore it and ${ex.ok ? 'info/exclude did not take' : ex.why}`); ok = false; continue; }
      }
      const created = (rec && rec.created) || ['.claude', path.join('.claude', 'rules')].filter((d) => !fs.existsSync(path.join(dir, d)));
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (!domainsWriteFile(apply, home, file, cur.text, want, label)) { ok = false; continue; }
      owned.routers[dir] = { sha256: DR.sha256(want), created };
      log(`  ${label}: router text for ${members.join(', ')} (Claude reads .claude/rules/ in this project)`);
    } catch (e) { log(`  ${label}: NOT written: ${e.code || e.message}`); ok = false; }
  }
  return ok;
}

/** Directories the router file created that held something else then: tried again, emptiest last. */
function domainsTidy(cleanup) {
  for (const d of cleanup.sort((a, b) => b.length - a.length)) {
    try { fs.rmdirSync(d); } catch (e) { /* still not empty: someone else's */ }
  }
}

/** The ownership record, written only when it changed — three runs leave the same bytes. */
function writeRecord(I, owned, apply, home) {
  const manual = owned.manual || {};
  const routers = owned.routers || {};
  const empty = !Object.keys(owned.user).length && !Object.keys(owned.projects).length && !Object.keys(manual).length
    && !Object.keys(routers).length;
  const text = empty ? null : JSON.stringify({
    note: 'Written by `npx sshlg-skills domains`; --revert undoes exactly these values while they still hold.',
    roots: owned.roots, profile: owned.profile || I.profile, applied: owned.applied === true, user: owned.user, pendingUser: owned.pendingUser || {}, projects: owned.projects, manual, routers,
  }, null, 2) + '\n';
  // Keep the old valid record if disk-full/permissions/interruption prevents a new one.
  // Update the in-memory text after EACH intent, not only after the whole command.
  try {
    const current = I.readLocal(I.recordPath);
    if (current.error) throw new Error(`cannot read ownership record (${current.error})`);
    if (text === current.text) { I.recordText = text; return true; }
    if (current.text !== null) {
      const saved = apply.protect(I.recordPath, { home });
      if (saved.action === 'backup-failed') throw new Error(`backup failed (${saved.error})`);
    }
    if (text === null) fs.rmSync(I.recordPath, { force: true });
    else {
      fs.mkdirSync(path.dirname(I.recordPath), { recursive: true });
      atomic.write(I.recordPath, text, { mode: 0o600, tmpName: `${path.basename(I.recordPath)}.${process.pid}.tmp` });
    }
    I.recordText = text;
    return true;
  } catch (e) {
    log(`  ownership record NOT updated: ${e.code || e.message}; existing recovery record kept`);
    return false;
  }
}

function domainsRevert(I, apply, home) {
  const { D } = I;
  if (!I.owned) { log('domains --revert: no ~/.sshlg-skills/domains.json: nothing of ours to undo.'); return 0; }
  const ownedUser = Object.keys(I.owned.user || {});
  // User scope comes back on FIRST. If settings.json cannot be read, nothing is undone:
  // removing project entries now would leave those projects without their member.
  const userKnown = domainsKnownPlugins(I, I.settingsPath).known;
  if (ownedUser.length && (I.userError || I.userText === null || !userKnown)) {
    log(`  ${I.settingsLabel}: ${I.userError ? `cannot read it (${I.userError})` : I.userText === null ? 'missing' : 'not valid plugin settings'}: nothing undone; the record is kept`);
    return 1;
  }
  const locals = {};
  const unreadable = [];
  for (const dir of Object.keys(I.owned.projects || {})) {
    const local = domainsKnownPlugins(I, I.localPath(dir));
    if (local.known) locals[dir] = local.plugins;
    else unreadable.push(dir);
  }
  const R = D.revertPlan({ owned: I.owned, user: I.user, locals });
  let failed = unreadable.length > 0;
  const owned = { roots: I.owned.roots, profile: I.profile, applied: false, user: {}, projects: {}, manual: {},
    routers: Object.assign({}, I.owned.routers || {}) };
  for (const dir of unreadable) {
    owned.projects[dir] = I.owned.projects[dir];
    log(`  ${path.basename(dir)}/.claude/settings.local.json: cannot read valid settings: recovery ownership kept`);
  }
  if (R.userOn.length) {
    const r = D.editEnabled(I.userText, { set: Object.fromEntries(R.userOn.map((k) => [k, true])) });
    if (!r.ok) {
      log(`  ${I.settingsLabel}: NOT written: the file ${r.reason}`);
      return 1;
    }
    if (!domainsWriteFile(apply, home, I.settingsPath, I.userText, r.text, I.settingsLabel)) {
      log('  project entries kept: removing them now would leave those projects without their member');
      return 1;
    }
    const back = I.enabledOf(I.read(I.settingsPath) || '');
    for (const k of R.userOn) {
      if (back[k] === true) log(`  ${I.settingsLabel}: ${k} back on at user scope`);
      else { owned.user[k] = false; failed = true; log(`  ${I.settingsLabel}: ${k} did not read back true`); }
    }
  }
  if (failed) {
    log('  project entries kept until user scope reads back on');
    Object.assign(owned, { applied: I.owned.applied === true, projects: I.owned.projects, manual: I.owned.manual || {} });
    writeRecord(I, owned, apply, home);
    return 1;
  }
  const cleanup = [];
  if (!domainsSyncRouters(I, apply, home, owned, Object.fromEntries(R.unset.map((u) => [u.dir, u.keys])), cleanup)) failed = true;
  for (const u of R.unset) {
    const rec = I.owned.projects[u.dir];
    const res = domainsUnsetProject(I, apply, home, u.dir, rec, u.keys);
    if (!res.ok) { owned.projects[u.dir] = rec; failed = true; }
  }
  domainsTidy(cleanup);
  if (!writeRecord(I, owned, apply, home)) return 1;
  log('  Restart Claude Code sessions to load the restored plugin set.');
  return failed ? 1 : 0;
}

/** `hosts`: the per-project picture as counts — never a project's name. */
function domainsSummary(home) {
  const I = domainsInputs([], home);
  const { D } = I;
  const ownedUser = (I.owned && I.owned.user) || {};
  if (I.profileError) { log(`Domain members: ${I.profileError}`); return; }
  log(`\nDomain members per project in Claude Code (${I.rootRepos} git repositories under ${I.roots.length} root(s); \`domains\` previews):`);
  if (I.rootErrors.length) log(`  ! ${I.rootErrors.length} root(s) cannot be read; \`domains --apply\` refuses until they can`);
  if (I.recordError) log(`  ~/.sshlg-skills/domains.json ${I.recordError}; \`domains\` says how to recover it.`);
  for (const member of D.DOMAIN_MEMBERS) {
    const key = I.plugins[member];
    const v = I.user[key];
    const state = v === true ? 'on' : v === false ? (ownedUser[key] === false ? 'off (by domains)' : 'off (by you)') : 'absent';
    const withEv = I.projects.filter((p) => p.evidence[member]);
    const on = withEv.filter((p) => p.local[key] === true).length;
    log(`  ${member.padEnd(13)} user scope ${state}; evidence in ${withEv.length} project(s), enabled in ${on}`);
  }
  const partial = I.projects.filter((p) => p.partial.length).length;
  if (partial) log(`  ${partial} project(s) not read in full keep the members they could not rule out on`);
  domainsFabricLine(home, log);
}

Object.assign(module.exports, {
  domainsSyncRouters,
  DOMAINS_LOCAL, domainsProfilePath, domainsInputs, domainsWritable, domainsWriteFile,
  domainsFabricLine, runDomainsLocked, cmdDomains, domainsRecordUserIntent, domainsOwnedCopy,
  domainsKnownPlugins, domainsDropStale, domainsWriteProject, domainsManual, domainsUnsetProject,
  writeRecord, domainsRevert, domainsSummary
});
