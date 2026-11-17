'use strict';
/**
 * `visibility`: which skills each host lists, hides or shows by name only.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const { ROOT, atomic, claudeRoot, log, manifest, plan } = require('./cli-core.js');

/**
 * `visibility` — which skills a host's model listing keeps, and hiding the rest.
 *
 * The decisions live in `lib/visibility.js`; this reads the inputs, backs every file up
 * through `protect()` before writing it, and records what it wrote so `--revert` removes
 * exactly that. Without `--apply` or `--revert` it writes nothing.
 */
function cmdVisibility(argv) {
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  const flag = (name) => argv.includes(name);
  const value = (name) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  if (argv[3] === 'marks') return cmdVisibilityMarks(argv);
  if (flag('--apply') && flag('--revert')) { log('visibility: --apply and --revert contradict each other'); return 2; }
  return runVisibility({
    mode: flag('--revert') ? 'revert' : flag('--apply') ? 'apply' : 'preview',
    days: Number(value('--days')) || V.DEFAULT_DAYS,
    keep: (value('--keep') || '').split(',').map((s) => s.trim()).filter(Boolean),
    fullDays: fullDaysArg(value('--full-days'), V.DEFAULT_FULL_DAYS),
    measure: flag('--measure'),
  });
}

/** `--full-days N` (a whole number of days), `--full-days off` (no name-only tier), or the default. */
function fullDaysArg(raw, dflt) {
  if (raw === null) return dflt;
  if (raw === 'off') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) { log(`visibility: --full-days takes a whole number of days or "off", got "${raw}"; using ${dflt}`); return dflt; }
  return n;
}

/**
 * The work of `visibility`, callable from `update` (which re-applies it on a machine whose
 * record shows the operator ran `--apply`). `opts.only` limits the run to a set of host
 * ids; a host outside it keeps its record untouched.
 */
function runVisibility(opts) {
  // Direct visibility and update share one machine mutation lock. Re-apply is already
  // inside runUpdateLocked; read-only previews deliberately do not acquire it.
  if (opts.mode === 'preview' || opts.reapply) return runVisibilityUnlocked(opts);
  const lock = require('../lib/updatelock.js');
  const home = process.env.HOME || os.homedir();
  const got = lock.acquire(home);
  if (!got.ok || got.degraded) {
    log(`visibility: refused: ${got.message || got.degraded}`);
    return got.ok ? 1 : lock.BUSY_EXIT;
  }
  if (got.tookOver) log(`visibility: took over update.lock: ${got.tookOver}`);
  try { return runVisibilityUnlocked(opts); }
  finally { lock.release(home, got.token); }
}

/**
 * Claude Code's own last listing count, read from its debug logs (newest first). Only the
 * one warning line is parsed; nothing else in a log is read into the output.
 */
function lastListingMeasure(claudeRoot) {
  const dir = path.join(claudeRoot, 'debug');
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((n) => n.endsWith('.txt'))
      .map((n) => ({ n, m: fs.statSync(path.join(dir, n)).mtimeMs })).sort((a, b) => b.m - a.m).slice(0, 40);
  } catch (e) { return null; }
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(path.join(dir, f.n), 'utf8'); } catch (e) { continue; }
    const got = V.parseListingLog(text);
    if (got.over) return Object.assign({}, got.over, { bundled: got.bundled, builtinPlugin: got.builtinPlugin });
  }
  return null;
}

/**
 * `visibility --measure` (B-337): Claude Code's own count, taken now. Runs
 * `claude -p ok --no-session-persistence --strict-mcp-config --settings '{"disableAllHooks":true}'
 * --debug-file <file>` once from a new empty folder (so no project's plugins or skills count),
 * reads the two listing lines of that log and removes the folder. One small model call; no
 * transcript is kept. No MCP server starts: a Fabric MCP server registers every folder it starts
 * in as a board project (measured 2026-11-11), and the listing count is the same without it
 * (105 entries, 34,758 characters both ways); no hook runs either. `SSHLG_SKILLS_CLAUDE`
 * names another executable (tests). Returns `{ ok, over, bundled, builtinPlugin }` or
 * `{ ok: false, error }`.
 */
function measureListing() {
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  const bin = process.env.SSHLG_SKILLS_CLAUDE || 'claude';
  let dir;
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-listing-measure-'));
    const file = path.join(dir, 'debug.txt');
    const r = spawnSync(bin, ['-p', 'ok', '--no-session-persistence', '--strict-mcp-config',
      '--settings', JSON.stringify({ disableAllHooks: true }), '--debug-file', file], {
      cwd: dir, stdio: ['ignore', 'ignore', 'ignore'], timeout: 180000,
    });
    if (r.error) return { ok: false, error: r.error.code === 'ENOENT' ? `\`${bin}\` is not on PATH` : r.error.message };
    if (r.status !== 0) return { ok: false, error: `\`${bin} -p ok\` exited ${r.status === null ? `on ${r.signal}` : r.status}` };
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return { ok: false, error: 'it wrote no debug log' }; }
    const got = V.parseListingLog(text);
    if (got.bundled === null && !got.over) return { ok: false, error: 'its debug log names no skill listing' };
    return Object.assign({ ok: true }, got);
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    if (dir) try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* a temp folder left behind harms nothing */ }
  }
}

/**
 * B-337: the listing entries a skill walk misses. Plugin commands (`<plugin>/commands/*.md`,
 * listed as `plugin:command`) of every enabled plugin, from the install path the registry
 * records (Homebrew, PassionCode and cache roots alike); skills and commands whose front
 * matter sets `disable-model-invocation: true` (never in the listing); and plugins whose
 * marketplace has no install location on disk (Claude Code logs "marketplace-load-failed"
 * and loads none of their skills). Read-only; any read that fails contributes nothing.
 */
function listingExtras(claudeRoot, home, skills) {
  const out = { commands: [], unloadable: new Set(), noModel: new Set() };
  const meta = require(path.join(ROOT, 'lib', 'skillmeta.js'));
  const frontMatter = (text) => { const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text); return m ? m[1] : ''; };
  const noModel = (text) => /^disable-model-invocation:\s*true\s*$/m.test(frontMatter(text));
  for (const s of skills) {
    try { if (s.path && noModel(fs.readFileSync(s.path, 'utf8'))) out.noModel.add(s.path); } catch (e) { /* unreadable: counted as listed */ }
  }
  let known = {};
  try { known = JSON.parse(fs.readFileSync(path.join(claudeRoot, 'plugins', 'known_marketplaces.json'), 'utf8')) || {}; } catch (e) { known = {}; }
  let registry = {};
  try { registry = JSON.parse(fs.readFileSync(path.join(claudeRoot, 'plugins', 'installed_plugins.json'), 'utf8')).plugins || {}; } catch (e) { registry = {}; }
  const enabled = require(path.join(ROOT, 'lib', 'enablement.js')).effective(home, process.cwd(), undefined, claudeRoot);
  for (const [spec, rows] of Object.entries(registry)) {
    if (enabled[spec] !== true || !Array.isArray(rows) || !rows[0] || !rows[0].installPath) continue;
    const market = known[spec.split('@')[1]];
    if (market && market.installLocation && !fs.existsSync(market.installLocation)) { out.unloadable.add(spec); continue; }
    const dir = path.join(rows[0].installPath, 'commands');
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { continue; }
    for (const f of files) {
      let text = '';
      try { text = fs.readFileSync(path.join(dir, f), 'utf8'); } catch (e) { continue; }
      if (noModel(text)) continue;
      out.commands.push({ name: `${spec.split('@')[0]}:${f.replace(/\.md$/, '')}`, description: meta.metadata(text).description || '' });
    }
  }
  return out;
}

function runVisibilityUnlocked(opts) {
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  const HV = require(path.join(ROOT, 'lib', 'hostvis.js'));
  const toolkit = require(path.join(ROOT, 'lib', 'toolkit.js'));
  const apply = require(path.join(ROOT, 'lib', 'apply.js'));
  const configLib = require(path.join(ROOT, 'lib', 'config.js'));
  const home = process.env.HOME || os.homedir();
  const S = require(path.join(ROOT, 'lib', 'visibility-state.js'));
  const readErrors = new Map();
  const read = (p) => { try { return S.read(p); } catch (e) { readErrors.set(p, e.code || 'cannot read'); return null; } };
  const claudeRoot = apply.hostRoot(HV.target('claude'), home, { env: process.env });
  const codexRoot = apply.hostRoot(HV.target('codex'), home, { env: process.env });
  const doApply = opts.mode === 'apply';
  const doRevert = opts.mode === 'revert';
  const days = opts.days || V.DEFAULT_DAYS;
  const keep = opts.keep || [];
  // null: no name-only tier (a re-apply of a record that predates it, or `--full-days off`).
  const fullDays = typeof opts.fullDays === 'number' ? opts.fullDays : null;
  const inScope = (id) => !opts.only || opts.only.has(id);

  const recordPath = path.join(home, '.sshlg-skills', 'visibility.json');
  let owned = { claude: [], codex: [], gemini: [], pi: [], opencode: [], hermes: [], piCreated: false, created: {}, hosts: [] };
  try {
    const stored = S.validate(JSON.parse(S.read(recordPath) || '{}'));
    const recovered = S.recover(stored, process.env);
    if (stored.pending) log(`  recovered pending ${stored.pending.host} write from its fingerprint${!doApply && !doRevert ? ' (preview only)' : ''}`);
    owned = Object.assign(owned, recovered);
  } catch (e) { log(`visibility: ownership record not usable: ${e.message}; nothing written`); return 1; }
  const createdOf = (id) => (owned.created && Array.isArray(owned.created[id]) ? owned.created[id] : []);

  const policyErrors = [];
  let skills = [];
  if (!doRevert) {
    try { skills = toolkit.readSkills(home, { claudeRoot, strict: true }).filter((s) => s.callable !== false); }
    catch (e) { policyErrors.push(`Claude inventory: ${e.code || 'invalid registry/skill'}`); }
  }
  const personal = skills.filter((s) => s.namespace === 'claude:plain').map((s) => s.id);
  const family = manifest.skills.reduce((acc, m) => acc.concat(m.skillNames && m.skillNames.length ? m.skillNames : [m.name]), []);
  let usage = {};
  if (!doRevert) {
    const usagePath = path.join(process.env.CLAUDE_CONFIG_DIR ? claudeRoot : home, '.claude.json');
    try {
      const u = (S.object(usagePath) || {}).skillUsage;
      if (u !== undefined && (!u || typeof u !== 'object' || Array.isArray(u)
        || Object.values(u).some((v) => !v || typeof v !== 'object' || Array.isArray(v)
          || (v.lastUsedAt !== undefined && (typeof v.lastUsedAt !== 'number' || !Number.isFinite(v.lastUsedAt))))))
        throw new Error('invalid skillUsage');
      usage = u || {};
    }
    catch (e) { policyErrors.push(`usage: ${e.code || e.message}`); }
  }
  const instructionsPath = path.join(claudeRoot, 'CLAUDE.md');
  const instructions = doRevert ? '' : read(instructionsPath) || '';
  if (readErrors.has(instructionsPath)) policyErrors.push(`instructions: ${readErrors.get(instructionsPath)}`);
  const now = Date.now();
  const coreSet = V.core({ personal, family, usage, now, days, instructions });
  for (const k of keep) coreSet.add(k);

  // ── Claude ──
  const settingsPath = path.join(claudeRoot, 'settings.json');
  const settingsText = read(settingsPath);
  let settingsData = {};
  try { settingsData = JSON.parse(settingsText || '{}'); } catch (e) { settingsData = {}; }
  const overrides = settingsData.skillOverrides || {};
  const mine = new Set(owned.claude.filter((n) => overrides[n] === V.HIDE));
  const ownedNameOnly = Array.isArray(owned.claudeNameOnly) ? owned.claudeNameOnly : [];
  const mineNameOnly = new Set(ownedNameOnly.filter((n) => overrides[n] === V.NAME_ONLY));
  const foreign = {};
  for (const [k, v] of Object.entries(overrides)) if (!mine.has(k) && !mineNameOnly.has(k)) foreign[k] = v;
  const full = doRevert || fullDays === null ? null
    : V.fullSet({ personal, usage, now, fullDays, instructions });
  const plan = doRevert ? { hide: [], nameOnly: [], respected: [] }
    : V.claudePlan({ personal, core: coreSet, full, overrides: foreign, keep });
  // Values this run writes, and values it removes (only while they still hold what it wrote).
  const claudeSetMap = {};
  for (const n of plan.hide) if (overrides[n] !== V.HIDE) claudeSetMap[n] = V.HIDE;
  for (const n of plan.nameOnly) if (overrides[n] !== V.NAME_ONLY) claudeSetMap[n] = V.NAME_ONLY;
  const planned = new Set(plan.hide.concat(plan.nameOnly));
  const claudeUnsetMap = {};
  for (const n of mine) if (!planned.has(n)) claudeUnsetMap[n] = V.HIDE;
  for (const n of mineNameOnly) if (!planned.has(n)) claudeUnsetMap[n] = V.NAME_ONLY;
  const claudeSet = Object.keys(claudeSetMap);
  const claudeUnset = Object.keys(claudeUnsetMap);
  const stateOf = (s, ov) => {
    if (s.loaded === false) return 'hidden';  // installed, not loaded here (B-185): not in the listing
    if (s.namespace !== 'claude:plain') return 'on';
    const v = ov[s.id];
    if (v === 'off' || v === V.HIDE) return 'hidden';
    return v === 'name-only' ? 'name-only' : 'on';
  };
  const after = Object.assign({}, overrides);
  for (const n of claudeSet) after[n] = claudeSetMap[n];
  for (const n of claudeUnset) delete after[n];
  // B-337: what Claude Code lists beyond the skill directories (plugin commands), and what
  // it leaves out (model-invocation disabled, plugins whose marketplace cannot load).
  const extras = doRevert ? { commands: [], unloadable: new Set(), noModel: new Set() } : listingExtras(claudeRoot, home, skills);
  const rowsFor = (ov) => V.listingRows(skills.map((s) => ({
    name: s.plugin && s.namespace === 'claude:plugin' ? `${s.plugin.split('@')[0]}:${s.id}` : s.id,
    description: s.description,
    state: extras.noModel.has(s.path) || (s.namespace === 'claude:plugin' && extras.unloadable.has(s.plugin)) ? 'hidden' : stateOf(s, ov),
  })).concat(extras.commands.map((c) => Object.assign({ state: 'on' }, c))));
  const charsBefore = V.listingChars(rowsFor(overrides));
  const charsAfter = V.listingChars(rowsFor(after));
  const entriesBefore = V.listingEntries(rowsFor(overrides));
  const entriesAfter = V.listingEntries(rowsFor(after));

  // ── Codex ──
  const codexPath = path.join(codexRoot, 'config.toml');
  const codexText = read(codexPath);
  const sharedRoot = path.join(home, '.agents', 'skills');
  let shared = [];
  if (!doRevert) {
    try { shared = HV.readRoot(sharedRoot, { strict: true }).map((s) => s.base); }
    catch (e) { policyErrors.push(`shared inventory: ${e.code || 'cannot read'}`); }
  }
  const familySet = new Set(family);
  const codexWant = doRevert ? [] : shared.filter((n) => !familySet.has(n) && !coreSet.has(n)).map((n) => path.join(sharedRoot, n, 'SKILL.md'));
  const codexAdd = codexWant.filter((p) => !owned.codex.includes(p));
  const codexDrop = owned.codex.filter((p) => !codexWant.includes(p));

  // ── The operator's pack marks: a machine file, never the package's (L1 fix round) ──
  const marksPath = path.join(home, '.sshlg-skills', 'pack-marks.json');
  const marksText = doRevert ? null : read(marksPath);
  if (readErrors.has(marksPath)) policyErrors.push(`pack marks: ${readErrors.get(marksPath)}`);
  let marksData = null;
  let markProblems = [];
  if (marksText !== null) {
    try { marksData = JSON.parse(marksText); markProblems = V.marksProblems(marksData); } catch (e) { markProblems = [`does not parse (${e.message})`]; }
  }
  const marks = V.marksIndex(marksData);
  let config = {}, lock = new Map();
  if (!doRevert) {
    if (markProblems.length) policyErrors.push('pack marks: invalid pack-marks/1');
    try {
      config = S.object(configLib.configPath(home)) || {};
      const v = config.visibility;
      if (v !== undefined && (!v || typeof v !== 'object' || Array.isArray(v)
        || ['hidePacks', 'showPacks'].some((k) => v[k] !== undefined && (!Array.isArray(v[k]) || v[k].some((x) => typeof x !== 'string')))))
        throw new Error('invalid visibility overrides');
    } catch (e) { policyErrors.push(`config: ${e.code || e.message}`); }
    try { lock = HV.readLock(home, { strict: true }); } catch (e) { policyErrors.push(e.message); }
  }
  if (policyErrors.length) {
    log(`visibility: policy not usable: ${policyErrors.join('; ')}; settings and ownership unchanged`); return 1;
  }
  const hostList = HV.hosts(home, process.env);
  let files;
  try {
    files = Object.fromEntries([['claude', settingsPath], ['codex', codexPath]]
      .concat(hostList.filter((h) => h.file && !h.cannot).map((h) => [h.id, h.file]))
      .map(([id, file]) => [id, S.profilePath(file)]));
  } catch (e) { log(`visibility: profile identity not usable (${e.code || e.message}); nothing written`); return 1; }
  // Old Claude/Codex receipts could only target their hard-coded defaults. New ones
  // bind every host, so consent and owned entries cannot migrate to another profile.
  for (const [id, file] of Object.entries(files)) {
    if (!inScope(id)) continue;
    const prior = (owned.files || {})[id] || (id === 'claude' ? S.profilePath(path.join(home, '.claude/settings.json'))
      : id === 'codex' ? S.profilePath(path.join(home, '.codex/config.toml')) : null);
    const carriesState = (owned[id] || []).length || createdOf(id).length || (opts.reapply && (owned.hosts || []).includes(id));
    if (!prior && carriesState) {
      log(`visibility: legacy ${id} ownership is not bound to a profile; preserve ${recordPath} and backups, restore a verified files.${id} binding from the original apply before retrying; nothing written`); return 1;
    }
    if (prior && path.resolve(prior) !== file && carriesState) {
      log(`visibility: ${id} profile differs from ownership at ${prior}; select that profile and revert first; nothing written`); return 1;
    }
  }
  const inv = {};
  const seen = new Set(personal);
  for (const h of hostList) if (h.present && !h.cannot) {
    try { inv[h.id] = doRevert ? [] : HV.inventory(h, lock, { strict: true }); }
    catch (e) { log(`visibility: ${h.id} inventory not usable (${e.code || 'cannot read'}); settings and ownership unchanged`); return 1; }
    inv[h.id].forEach((s) => seen.add(s.name));
  }
  // The core over every name a host reads, not only Claude's personal skills: a skill
  // used in the window (by Claude Code usage) stays listed on every host, whatever its mark.
  const coreAll = V.core({ personal: [...seen], family, usage, now, days, instructions });
  for (const k of keep) coreAll.add(k);
  const installedPacks = new Set(lock.values());
  const hiddenPacks = [...installedPacks].filter((p) => V.packHidden(p, '*', { marks, config }));
  const ov = config.visibility || {};

  log('Host-wide fallback for sessions Fabric does not start. Fabric\'s RM-23 (open) is to read ~/.sshlg-skills/pack-marks.json and own visibility in the sessions it starts.');
  log(`Skill visibility: core = family + used within ${days} days (by Claude Code usage) + named in ${instructionsPath}${keep.length ? ' + --keep' : ''}`);
  log(`  core: ${coreSet.size} skills (Claude, Codex); ${coreAll.size} across every host's roots`);
  if (doRevert) {
    log('  pack marks: not needed for revert (undo uses the ownership record)');
  } else if (marksText === null) {
    log('  pack marks: no pack marks on this machine (~/.sshlg-skills/pack-marks.json): no pack is hidden by mark.');
    log('    Write them: `npx sshlg-skills visibility marks --init --show <owner/repo,…>` (preview), then add --apply.');
  } else if (markProblems.length) {
    log(`  pack marks: ~/.sshlg-skills/pack-marks.json NOT read: ${markProblems[0]}; no pack is hidden by mark`);
  } else {
    log(`  pack marks: ~/.sshlg-skills/pack-marks.json revision ${marksData.revision}; ${hiddenPacks.length} of ${installedPacks.size} installed packs hidden`);
  }
  if ((ov.hidePacks || []).length || (ov.showPacks || []).length) {
    log(`  overrides (config.json): hidePacks ${(ov.hidePacks || []).length}, showPacks ${(ov.showPacks || []).length}: Gemini, Pi, OpenCode and Hermes only`);
  }
  if (inScope('claude')) {
    const newHides = claudeSet.filter((n) => claudeSetMap[n] === V.HIDE).length;
    log(`  Claude: ${personal.length} personal skills; hide ${newHides} more, name-only ${claudeSet.length - newHides} more, restore ${claudeUnset.length}; ` +
        `${Object.keys(foreign).length} operator-set override(s) left alone`);
    log(fullDays === null
      ? '    name-only tier: off (`--full-days N` turns it on: core skills unused for N days keep their name, lose their description)'
      : `    name-only tier: core skills not used within ${fullDays} days and not named in the instructions are listed by name only (${plan.nameOnly.length})`);
    log(`  Claude listing, launcher's estimate ≈ ${charsBefore} → ${charsAfter} characters (${entriesBefore} → ${entriesAfter} entries)`);
    log(`    (personal and plugin skills from every recorded install path, ${extras.commands.length} plugin command(s), in Claude's`);
    log('    `- name: description` form; model-invocation-disabled entries and plugins whose marketplace');
    log('    cannot load are left out; a plugin command and skill of one name are one entry. Claude Code\'s');
    log('    bundled and built-in plugin skills are not on disk and are not counted).');
    const notOnDisk = (b, p) => (b === null ? '' : ` ${b} bundled and ${p} built-in plugin skill(s) are not on disk;`);
    if (opts.measure) {
      const m = measureListing();
      if (!m.ok) log(`    Claude Code's own count: not measured: ${m.error}.`);
      else if (!m.over) log(`    Claude Code's own count (measured now, from an empty folder): within its budget (it logs a count only when over);${notOnDisk(m.bundled, m.builtinPlugin)} the estimate is the rest.`);
      else {
        log(`    Claude Code's own count (measured now, from an empty folder): ${m.over.skills} entries, ${m.over.chars} characters > ${m.over.budget} budget;${notOnDisk(m.bundled, m.builtinPlugin)}`);
        log(`    entries the estimate does not see: ${m.over.skills - entriesBefore}, characters: ${m.over.chars - charsBefore}.`);
      }
    } else {
      const measured = lastListingMeasure(claudeRoot);
      log(measured
        ? `    Claude Code's own count (debug log ${measured.at}): ${measured.skills} entries, ${measured.chars} characters > ${measured.budget} budget.`
        : '    Claude Code\'s own count: none in its debug logs. Measure it now: `npx sshlg-skills visibility --measure`');
      if (!measured) log('    (one `claude -p ok` call from an empty folder, no transcript kept).');
    }
    log('    Over budget, Claude Code 2.1.299 keeps bundled skills whole, gives the others their description');
    log('    most-used first and lists the rest by name only.');
  }
  if (inScope('codex')) {
    log(`  Codex: ${shared.length} shared skills; disable up to ${codexAdd.length} more (entries already present are left as they are), re-enable ${codexDrop.length}` +
        (codexText === null ? ` (${codexPath}: ${readErrors.get(codexPath) || 'absent'}: skipped)` : ''));
  }
  log('  Claude and Codex hide everything outside the core (pack marks and overrides do not change them; --keep does).');

  // Plan every other host. `edit` is pure, so the preview reports what --apply would add.
  const hostPlans = [];
  for (const h of hostList) {
    if (!inScope(h.id)) continue;
    if (!h.present) { log(`  ${h.id}: not installed here: skipped`); continue; }
    if (h.cannot) { log(`  ${h.id}: cannot hide on ${h.id} (${h.cannot})`); continue; }
    const list = inv[h.id];
    const names = doRevert ? [] : V.hostHide({ skills: list, host: h.id, marks, config, core: coreAll });
    const marked = list.filter((s) => s.pack && V.packHidden(s.pack, h.id, { marks, config })).length;
    const want = HV.items(h, list, names);
    const ownedHere = owned[h.id] || [];
    // Nothing planned and nothing owned: the host is not touched — not even read through
    // its CLI — so a host that cannot be written cannot fail a run that asks nothing of it.
    if (!want.length && !ownedHere.length && !createdOf(h.id).length) {
      log(`  ${h.id}: nothing to hide${marked ? ` (${marked} in hidden packs, all kept by the core)` : ''}`);
      continue;
    }
    const add = want.filter((x) => !ownedHere.includes(x));
    const drop = ownedHere.filter((x) => !want.includes(x));
    const p = { h, names, want, add, drop, ownedHere };
    if (h.refuse) { p.reason = h.refuse; }
    else if (h.kind === 'hermes-cli') {
      const cur = HV.hermesRead(process.env);
      if (cur.reason) p.reason = cur.reason;
      else {
        p.current = cur.list;
        p.next = cur.list.filter((x) => !drop.includes(x)).concat(add.filter((x) => !cur.list.includes(x)));
        p.added = add.filter((x) => !cur.list.includes(x));
        p.changed = p.next.length !== cur.list.length || p.added.length > 0;
      }
    } else {
      p.text = read(h.file);
      if (readErrors.has(h.file)) {
        p.reason = `${h.file}: ${readErrors.get(h.file)}`; hostPlans.push(p); continue;
      }
      const prunable = createdOf(h.id);
      const edit = h.kind === 'json-list'
        ? V.editJsonList(p.text, { keys: h.keys, add, remove: drop, create: h.create, newline: h.newline, prunable })
        : V.editJsonMap(p.text, { keys: h.keys, set: add, value: h.value, unset: drop, prunable });
      if (!edit.ok) p.reason = `${h.file} ${edit.reason}`;
      else if (edit.skipped && want.length) p.reason = `no ${path.basename(h.file)}: create it, or run the host once`;
      else { p.edit = edit; p.added = edit.added; p.changed = edit.text !== p.text; }
    }
    log(`  ${h.id}: ${list.length} skills in its roots, ${marked} in hidden packs` +
        `${doRevert ? '' : ` (${marked - names.length} kept by the core)`}; hide ${names.length}; ` +
        (p.reason ? `DEGRADED: ${p.reason}`
          : `write ${p.added.length} new entr${p.added.length === 1 ? 'y' : 'ies'}, remove ${drop.length} (${h.label})`));
    hostPlans.push(p);
  }
  log('  A hidden skill stays installed: no file is deleted or moved, the SKILL.md is still readable,');
  log('  and `npx sshlg-skills toolkit --find "<concepts>"` finds it by meaning.');
  if (!doApply && !doRevert) { log('\n  Nothing written. `--apply` hides, `--revert` undoes only what this command wrote.'); return 0; }

  const degraded = [];
  let record = Object.assign({}, owned, {
    note: 'Written by `npx sshlg-skills visibility`; --revert removes these entries. Pending holds a write-ahead receipt; applied is consent for update on hosts only.',
    days, keep, fullDays, marksRevision: marksData && !markProblems.length ? marksData.revision : null,
    updatedAt: new Date().toISOString(), created: Object.assign({}, owned.created || {}),
    files: Object.assign({}, owned.files || {}, Object.fromEntries(Object.entries(files).filter(([id]) => inScope(id)))),
  });
  if (doApply && !opts.reapply) {
    record.applied = true;
    record.hosts = [];
    if (settingsText !== null) record.hosts.push('claude');
    if (codexText !== null) record.hosts.push('codex');
    for (const h of hostList) if (h.present && !h.cannot) record.hosts.push(h.id);
    if (opts.only) record.hosts = record.hosts.filter((x) => opts.only.has(x)).concat((owned.hosts || []).filter((x) => !opts.only.has(x)));
  } else if (doRevert) {
    // Withdraw before the first undo, so an interruption cannot re-arm an update.
    record.applied = false;
    record.hosts = [];
  }
  const journal = S.journal(recordPath, home, record, process.env);
  const clone = () => JSON.parse(JSON.stringify(journal.current));
  const degrade = (id, reason) => { log(`  ${id}: DEGRADED, not written: ${reason}`); degraded.push(id); };
  const transact = (id, file, before, after, next, action, kind = 'file') => {
    const result = journal.transact({ host: id, file: files[id] || file, kind, before: S.hash(before), after: S.hash(after) }, next, action);
    if (!result.landed) { degrade(id, result.error ? result.error.message : 'write did not take effect'); return; }
    log(`  ${id}: written and read back${result.error ? ' (the write reported an error but its result was confirmed)' : ''}`);
  };
  // Receipt failure is fatal, unlike one unavailable host: no unjournalled host write is allowed.
  try {
    journal.save(record);
    const writeSimple = (id, file, before, edit, entries) => {
      if (!inScope(id)) return;
      if (readErrors.has(file)) { degrade(id, readErrors.get(file)); return; }
      if (before === null) return;
      const r = edit(before);
      if (!r.ok) { degrade(id, r.reason); return; }
      const next = clone();
      next[id] = entries(r);
      if (id === 'claude') {
        if (claudeSet.length && !('skillOverrides' in settingsData)) next.created.claude = ['skillOverrides'];
        if (doRevert) delete next.created.claude;
        next.claudeNameOnly = plan.nameOnly.slice().sort();
      }
      if (r.text === before) { journal.save(next); log(`  ${id}: already as planned`); return; }
      transact(id, file, before, r.text, next, () => S.write(file, r.text, home));
    };
    const claudeCreated = createdOf('claude').includes('skillOverrides') || !Object.prototype.hasOwnProperty.call(owned, 'applied');
    writeSimple('claude', settingsPath, settingsText,
      (t) => V.editClaudeSettings(t, { set: claudeSetMap, unset: claudeUnsetMap, prune: claudeCreated }), () => plan.hide.slice().sort());
    writeSimple('codex', codexPath, codexText,
      (t) => V.editCodexConfig(t, { disable: codexAdd, enable: codexDrop }),
      (r) => [...new Set(owned.codex.filter((p) => codexWant.includes(p)).concat(r.added || []))].sort());

    for (const p of hostPlans) {
      const { h } = p;
      if (p.reason) { degrade(h.id, p.reason); continue; }
      const next = clone();
      next[h.id] = [...new Set(p.ownedHere.filter((x) => p.want.includes(x)).concat(p.added))].sort();
      if (!p.changed) { journal.save(next); log(`  ${h.id}: already as planned`); continue; }
      if (h.kind === 'hermes-cli') {
        transact(h.id, h.file, JSON.stringify(p.current), JSON.stringify(p.next), next, () => {
          const saved = apply.protect(h.file, { home });
          if (saved.action === 'backup-failed') throw new Error(`backup failed: ${saved.error}`);
          const w = HV.hermesWrite(p.next, process.env);
          if (w.reason) throw new Error(w.reason);
        }, 'hermes');
        continue;
      }
      const text = p.edit.text;
      const removePi = h.id === 'pi' && owned.piCreated && text === '{}';
      if (removePi) {
        next.piCreated = false; next.pi = []; delete next.created.pi;
      } else {
        if (h.id === 'pi' && p.edit.created) next.piCreated = true;
        const at = V.jsonAt(text || '', h.keys);
        const cp = new Set(createdOf(h.id).concat(p.edit.createdPaths || []));
        if (at === undefined) cp.clear();
        if (cp.size) next.created[h.id] = [...cp].sort(); else delete next.created[h.id];
      }
      transact(h.id, h.file, p.text, removePi ? null : text, next, () => {
        if (removePi) {
          const saved = apply.protect(h.file, { home });
          if (saved.action === 'backup-failed') throw new Error(`backup failed: ${saved.error}`);
          fs.unlinkSync(h.file);
        } else S.write(h.file, text, home);
      });
    }
  } catch (e) {
    log(`  visibility stopped: ${e.message}. The ownership receipt is preserved; retry visibility --revert after resolving the error.`);
    return 1;
  }
  if (degraded.length) log(`  degraded (not written, the run continues): ${degraded.join(', ')}`);
  log('  Restart the host session to load the new listing.');
  return 0;
}

/**
 * `visibility marks` — the operator's pack marks, a MACHINE file
 * (`~/.sshlg-skills/pack-marks.json`, pack-marks/1). The public package ships no marks:
 * shipping one operator's marks as defaults would hide them for everyone who applied.
 * `--init --show <owner/repo,…>` writes one row per installed pack (the family and the
 * shown packs listed, the rest hidden); without `--apply` it previews; an existing file is
 * replaced only with `--replace`, after a backup.
 */
function cmdVisibilityMarks(argv) {
  const V = require(path.join(ROOT, 'lib', 'visibility.js'));
  const HV = require(path.join(ROOT, 'lib', 'hostvis.js'));
  const apply = require(path.join(ROOT, 'lib', 'apply.js'));
  const home = process.env.HOME || os.homedir();
  const file = path.join(home, '.sshlg-skills', 'pack-marks.json');
  const flag = (name) => argv.includes(name);
  const value = (name) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
  let text = null;
  try { text = require('../lib/visibility-state.js').read(file); }
  catch (e) { log(`visibility marks: cannot read ${file} (${e.code || 'read error'}); nothing written`); return 1; }
  let cur = null;
  try { cur = text === null ? null : JSON.parse(text); } catch (e) { cur = null; }
  if (!flag('--init')) {
    if (text === null) { log(`No pack marks on this machine (${file}).`); log('Write them: npx sshlg-skills visibility marks --init --show <owner/repo,…> [--apply]'); return 0; }
    const problems = cur ? V.marksProblems(cur) : ['does not parse'];
    if (problems.length) { log(`${file}: NOT valid pack-marks/1: ${problems.join('; ')}`); return 1; }
    log(`${file}: revision ${cur.revision}; ${cur.packs.length} packs, ${cur.packs.filter((m) => m.hidden).length} hidden`);
    for (const m of cur.packs) log(`  ${m.hidden ? 'hide' : 'show'}  ${m.pack}${m.host.includes('*') ? '' : ` (${m.host.join(', ')})`}`);
    return 0;
  }
  const show = (value('--show') || '').split(',').map((x) => x.trim()).filter(Boolean);
  let packs;
  try { packs = [...new Set(HV.readLock(home, { strict: true }).values())]; }
  catch (e) { log(`visibility marks: ${e.message}; nothing written`); return 1; }
  if (!packs.length) { log(`visibility marks: no installed packs (${require('../lib/skillstore.js').skillLockPath(home, process.env)}): nothing to mark`); return 2; }
  const known = new Set(packs.map((p) => p.toLowerCase()));
  for (const p of show) if (!known.has(p.toLowerCase())) log(`  note: ${p} is not installed here; marked listed anyway`);
  if (text !== null && !flag('--replace')) {
    log(`visibility marks: ${file} exists: pass --replace to write a new revision (a backup is taken first)`);
    return 2;
  }
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const revision = cur && Number.isInteger(cur.revision) ? cur.revision + 1 : 1;
  const allPacks = packs.concat(show.filter((p) => !known.has(p.toLowerCase())));
  const data = V.marksFromLock({ packs: allPacks, show, date, revision });
  const hidden = data.packs.filter((m) => m.hidden);
  log(`Pack marks for this machine → ${file} (revision ${revision})`);
  log(`  ${data.packs.length} packs: ${hidden.length} hidden, ${data.packs.length - hidden.length} listed (family and --show)`);
  for (const m of hidden) log(`  hide  ${m.pack}`);
  if (!flag('--apply')) { log('\n  Nothing written. Add --apply to write it (a backup is taken first).'); return 0; }
  const saved = apply.protect(file, { home });
  if (saved.action === 'backup-failed') { log(`  NOT written: backup failed (${saved.error})`); return 1; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  atomic.write(file, JSON.stringify(data, null, 2) + '\n');
  log(`  written${saved.path ? ` (backup ${saved.path})` : ''}. Preview the hosts: npx sshlg-skills visibility`);
  return 0;
}

Object.assign(module.exports, {
  cmdVisibility, fullDaysArg, runVisibility, lastListingMeasure, measureListing, listingExtras,
  runVisibilityUnlocked, cmdVisibilityMarks
});
