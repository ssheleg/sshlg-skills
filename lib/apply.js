'use strict';
/**
 * Writing the routing block to the operator's agent instruction files.
 *
 * This is the only module in the feature that touches disk, and it is
 * deliberately thin: every decision about what the text should become was
 * already made and tested in `routers.js`, without a filesystem. What is left
 * here is which files to consider, and when not to write at all.
 */

const fs = require('fs');
const path = require('path');
const R = require('./routers.js');
const cursor = require('./cursor.js');
const backup = require('./backup.js');
const atomic = require('./atomicwrite.js');

/**
 * The agents this family writes for, and the directory that proves each one
 * is installed.
 *
 * The directory's existence is the evidence. An agent's home is never created
 * — a file appearing under `~/.codex/` on a machine with no Codex is
 * confusing at best, and at worst it is the launcher inventing a config for a
 * tool the operator never chose.
 */
// Every agent with a GLOBAL markdown instruction file the block can live in.
// A target whose directory is absent reports `agent-absent` and is skipped, so
// listing one costs nothing on a machine that does not have it — which is why
// the list is the convention, not this machine's inventory.
//
// Not here, deliberately: Cursor keeps one file per rule under
// `~/.cursor/rules/*.mdc` with YAML front-matter. That is a different shape,
// not a different path, and it gets its own emitter rather than a row here.
const TARGETS = [
  // `env` is the DOCUMENTED host variable that relocates this host's config
  // root (FIX-UP-08.01). Precedence when resolving the root: an explicit root
  // the caller passed > this documented env var > the platform default
  // `~/<dir>`. The env value IS the host dir (so the file is `<root>/<file>`),
  // and it is used verbatim — spaces and all — never through a shell. A host
  // whose variable replaces HOME instead (`envIsHome`) keeps `<dir>` under it.
  { agent: 'claude', dir: '.claude', file: 'CLAUDE.md', env: 'CLAUDE_CONFIG_DIR' },
  { agent: 'codex', dir: '.codex', file: 'AGENTS.md', env: 'CODEX_HOME' },
  // Gemini CLI has no config-dir variable: GEMINI_CLI_HOME replaces HOME for it, so
  // the root is <GEMINI_CLI_HOME>/.gemini and its shared skills <GEMINI_CLI_HOME>/.agents
  // (Gemini CLI docs reference/configuration.md, B-204).
  { agent: 'gemini', dir: '.gemini', file: 'GEMINI.md', env: 'GEMINI_CLI_HOME', envIsHome: true },
  // Pi (`@earendil-works/pi-coding-agent`): its agent directory is `~/.pi/agent`, or
  // $PI_CODING_AGENT_DIR (Pi docs/configuration.md:9), and `AGENTS.md` in it is the user
  // instruction file (:18). Same writer, same protect(), same absent-means-skipped rule.
  { agent: 'pi', dir: path.join('.pi', 'agent'), file: 'AGENTS.md', env: 'PI_CODING_AGENT_DIR' },
];

/**
 * The config root for a host, by precedence (FIX-UP-08.01): an explicit root
 * for this agent > the documented host env var > `<home>/<dir>`. Host EXISTENCE
 * is a separate question the caller probes on the returned path; this only
 * resolves WHERE the root would be. `env` defaults to `process.env` and is
 * injectable so a test can set CODEX_HOME without touching the real one.
 */
// Platforms whose home-relative `~/<dir>` layout these hosts actually use.
// An UNKNOWN platform is NOT silently given the POSIX default (FIX-UP-08.03):
// writing a Linux-shaped path on a platform we cannot vouch for risks landing
// in a neighbouring profile, so it is refused with a verdict instead.
const KNOWN_PLATFORMS = new Set(['darwin', 'linux', 'win32']);

/**
 * The host root WITH an explicit capability verdict (FIX-UP-08.03).
 * Returns { root, source, supported, reason }:
 *   source: 'explicit' | 'env' | 'platform-default'
 *   supported: false when the platform is unknown and no explicit/env root was
 *   given — then `root` is null and nothing may be written.
 * Precedence (08.01) is unchanged; this adds the platform gate at the default.
 */
function hostRootVerdict(target, home, opts) {
  const o = opts || {};
  const env = o.env || process.env;
  const platform = o.platform || process.platform;
  const explicit = (o.roots || {})[target.agent];
  if (explicit) return { root: explicit, source: 'explicit', supported: true };
  const fromEnv = target.env && env[target.env];
  if (fromEnv) return { root: target.envIsHome ? path.join(fromEnv, target.dir) : fromEnv, source: 'env', supported: true };  // spaces preserved
  if (!KNOWN_PLATFORMS.has(platform))
    return {
      root: null, source: 'platform-default', supported: false,
      reason: `unknown platform '${platform}' — set ${target.env} explicitly rather ` +
        `than write a home-relative path that may land in a neighbouring profile`,
    };
  return { root: path.join(home, target.dir), source: 'platform-default', supported: true };
}

/** Back-compat: just the path (or the default) — callers wanting the verdict
 *  use hostRootVerdict. On an unknown platform this still returns the
 *  home-relative path, so new code that must NOT write there checks the verdict. */
function hostRoot(target, home, opts) {
  const v = hostRootVerdict(target, home, opts);
  return v.root != null ? v.root : path.join(home, target.dir);
}

const EMPTY_BLOCK = [
  R.OPENER,
  R.HEADING,
  '',
  '<!-- SSHLG:ROUTERS:MAP:BEGIN -->',
  '<!-- SSHLG:ROUTERS:MAP:END -->',
  '',
  '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->',
  '<!-- SSHLG:ROUTERS:TABLE:END -->',
  R.END,
  '',
].join('\n');

/**
 * Record a refusal in the file itself.
 *
 * The state file is the launcher's memory; this marker is the operator's. It
 * lives where they will see it, it survives a reinstall, a new machine's
 * restored dotfiles, and a state file nobody knew about — and unlike a
 * deleted block, it cannot be confused with a botched merge.
 */
function writeOptOut(file, opts) {
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (R.OPTOUT_RE.test(before)) return { file, action: 'opted-out' };
  const saved = protect(file, opts || {});
  if (saved.action === 'backup-failed') return { file, action: 'backup-failed', backup: saved };
  const gap = before === '' ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  atomic.write(file, before + gap + R.OPTOUT + '\n');
  return { file, action: 'opted-out-recorded', backup: saved };
}

/**
 * Take the copy that must exist before this pack modifies a file it did not
 * write. Every `atomic.write` below is preceded by exactly one of these.
 *
 * `home` is required and has no fallback. The obvious one — the file's own
 * directory — would put copies under `~/.claude/.sshlg-skills/backups/`, inside
 * the directory of the tool whose file we are protecting. That is the single
 * thing `backup.js` exists to avoid, so a missing `home` is a refusal to write
 * rather than a quieter place to put the copy.
 */
function protect(file, opts) {
  if (!opts.home && !opts.backupDir) {
    return { action: 'backup-failed', file, error: 'no home: refusing to write without somewhere to put the copy' };
  }
  return backup.guard({
    file,
    home: opts.home,
    dir: opts.backupDir,
    stamp: opts.stamp,
    keep: opts.keep,
    reference: opts.reference,
  });
}

/**
 * Replace a whole operator file only if it still holds what the caller read (B-218,
 * CLAUDE-7), with the copy `protect()` takes first.
 *
 * `opts.expected` is the text the caller planned from (`null`: the file was absent). The
 * file is compared before the copy, after the copy and just before the rename, so an edit
 * that lands in between (Claude Code writing `permissions`, another installer) is never
 * overwritten with a plan made from older bytes: the call returns `changed` and writes
 * nothing. The write goes to a temporary file beside the real target and is renamed over
 * it, keeping the target's mode; a symlinked file is written THROUGH its link, which stays.
 * The result is read back.
 *
 * Returns `{ok, action, file, backup, error}`; `action` is `written`, `changed`,
 * `backup-failed`, `no-directory` or `readback-failed`. Never throws for those.
 */
function protectedWrite(file, body, opts) {
  const o = opts || {};
  const read = () => { try { return fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  const expected = o.expected === undefined ? null : o.expected;
  if (read() !== expected) return { ok: false, action: 'changed', file };
  if (!fs.existsSync(path.dirname(file))) return { ok: false, action: 'no-directory', file };
  const saved = protect(file, o);
  if (saved.action === 'backup-failed') return { ok: false, action: 'backup-failed', file, error: saved.error };
  if (read() !== expected) return { ok: false, action: 'changed', file, backup: saved.path || null };
  // One atomic writer for every operator file (B-260): temp beside the real target, flush,
  // a last compare just before the rename, mode kept, a symlink written through.
  const CHANGED = 'protectedWrite: file changed before the rename';
  try {
    atomic.write(file, body, { mode: 0o644, beforeRename: () => { if (read() !== expected) throw new Error(CHANGED); } });
  } catch (e) {
    if (e.message === CHANGED) return { ok: false, action: 'changed', file, backup: saved.path || null };
    throw e;
  }
  if (read() !== body) return { ok: false, action: 'readback-failed', file, backup: saved.path || null };
  return { ok: true, action: 'written', file, backup: saved.path || null };
}

/**
 * `opts.sources[file]` is the text to work FROM, when the caller already has
 * a version the disk does not.
 *
 * Migration runs before this module and, on a dry run, deliberately does not
 * write. Re-reading the file then showed a preview of the block being added
 * with none of the hand-written sections being removed — +361 lines against
 * -1, where the real run removes about a hundred and thirty. A preview that
 * under-reports its own removals is worse than no preview: it is read as
 * permission.
 *
 * Passing the source in also makes the dry and the wet path compute from the
 * same bytes, rather than agreeing because the wet one happened to write
 * first.
 */
function applyOne(file, routers, opts) {
  const exists = fs.existsSync(file);
  // Two different texts, and conflating them is the bug this exists to fix.
  // `onDisk` is what the operator has right now and the only honest baseline
  // for a diff. `before` is what to compute from — the migrated text on a dry
  // run, where migration deliberately wrote nothing.
  const onDisk = exists ? fs.readFileSync(file, 'utf8') : '';
  const supplied = opts.sources && Object.prototype.hasOwnProperty.call(opts.sources, file);
  const before = supplied ? opts.sources[file] : onDisk;
  const parsed = R.parse(before);

  if (parsed.state === R.STATE.OPTED_OUT) return { file, action: 'opted-out' };
  if (parsed.state === R.STATE.MALFORMED) return { file, action: 'malformed' };

  let source = before;
  if (parsed.state === R.STATE.ABSENT) {
    // `update` refreshes what exists; it never introduces the block. A user
    // who has not got one has not agreed to one, and an update is not the
    // moment to ask.
    //
    // Unless consent is already ON RECORD, and this is simply a target the
    // pack did not have last time. Consent was given to "the pack maintains a
    // routing block", not to one particular file: when Gemini was added as a
    // target, every existing machine would otherwise have refreshed three
    // files forever and never received the fourth — a channel shipped to
    // nobody, reported as delivered.
    // `exists` is not required: apply() reaches here only for a host whose directory
    // exists, and a new target is usually a file that is not there yet. Requiring it
    // made 1.57.0's ~/.pi/agent/AGENTS.md arrive on no machine through `update` — the
    // same channel-ships-to-nobody failure the Cursor branch below already avoids.
    const newTargetUnderConsent = opts.consentRecorded === 'yes';
    if (opts.mode !== 'install' && !newTargetUnderConsent) {
      return { file, action: exists ? 'no-block' : 'absent' };
    }
    if (opts.consent === 'no') {
      return opts.dryRun ? { file, action: 'would-opt-out' } : writeOptOut(file, opts);
    }
    if (opts.consent !== 'yes') return { file, action: 'no-consent' };
    const gap = !exists || before === '' ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    source = before + gap + EMPTY_BLOCK;
  }

  const result = R.upsert(source, routers, {
    // The roster the map is rendered from. Absent for a lone member's
    // installer, which must not invent a family it cannot see.
    members: opts.members || [],
    remove: opts.remove || [],
    preserve: opts.preserve || [],
    // B-202: the hub's record of what it last wrote here; hand edits are kept.
    rendered: opts.rendered ? (opts.rendered[file] || {}) : undefined,
    star: opts.star === true,
  });
  const next = result.text;
  const removed = result.removed || {};
  const kept = result.kept || [];
  const rendered = result.rendered;
  if (next === onDisk) return { file, action: 'unchanged', removed, kept, rendered };

  if (opts.dryRun) {
    return { file, action: 'would-write', diff: R.diff(onDisk, next), removed, kept };
  }

  // Only now, with the write decided and the bytes known to differ. Backing up
  // earlier would fill the directory with copies of runs that changed nothing —
  // and `update` is mostly such runs.
  const saved = protect(file, opts);
  if (saved.action === 'backup-failed') {
    return { file, action: 'backup-failed', backup: saved, removed, kept };
  }

  // B-260: temp file, flush, rename. A crash here leaves the old file, not half of the new.
  atomic.write(file, next);
  return { file, action: exists ? 'updated' : 'created', removed, backup: saved, kept, rendered };
}

/**
 * Apply the routers to every agent instruction file that exists on this
 * machine. Returns one record per considered target; writes nothing that the
 * record does not report.
 */
function apply(opts) {
  const home = opts.home;
  const log = opts.log || ((m) => console.log(m));
  const targets = [];

  // Obey the resolved scope (FIX-UP-03.02): only the selected host files are
  // written. An unselected CLAUDE.md / AGENTS.md / GEMINI.md is NEVER opened,
  // so it stays byte-identical — the emitter honours the same selection the
  // resolver computed, instead of iterating every TARGET regardless. Absent
  // `hostTargets`, the default is all three (an unscoped run).
  const hosts = Array.isArray(opts.hostTargets) ? opts.hostTargets : TARGETS;

  for (const t of hosts) {
    const v = hostRootVerdict(t, home, opts);
    if (!v.supported) {
      // An unknown platform: refuse rather than write a home-relative path that
      // could be a neighbouring profile (FIX-UP-08.03). Named, never silent.
      targets.push({ file: `${t.file} (${t.agent})`, action: 'platform-unsupported',
                     reason: v.reason });
      continue;
    }
    const dir = v.root;
    if (!fs.existsSync(dir)) {
      targets.push({ file: path.join(dir, t.file), action: 'agent-absent' });
      continue;
    }
    const record = applyOne(path.join(dir, t.file), opts.routers || {}, opts);
    record.agent = t.agent;
    targets.push(record);

    if (record.action === 'malformed') {
      log(
        `${record.file}: блок роутинга повреждён (несбалансированные ` +
        `маркеры) — ничего не записано. Почини вручную или удали блок целиком.`
      );
    }
  }

  // B-206: the other hosts with a global instruction file. Only when the caller hands
  // the selection in (the CLI does, from the same scope as `hostTargets`): a direct
  // `apply()` call keeps the TARGETS-only behaviour every older fixture relies on.
  if (Array.isArray(opts.extraTargets)) {
    for (const t of opts.extraTargets) targets.push(applyExtra(t, opts));
  }

  // Cursor is its own agent, not in TARGETS, so it carries its own switch. It
  // is written only when the scope includes it — default true (unscoped), off
  // for --claude-only or an --agent list that does not name cursor.
  if (opts.includeCursor !== false) {
    const rule = applyCursor(opts);
    if (rule) targets.push(rule);
  }

  return { targets };
}

/**
 * Cursor, whose rules are one file each rather than a block inside a file.
 *
 * The body is assembled by running the ordinary `upsert`, so the map, the
 * router sections and the table come from exactly the same code that writes the
 * other three targets — a second renderer would be a second truth about what
 * the block says.
 *
 * It upserts into the body ALREADY THERE, never into the empty template. The
 * distinction is the whole file: `opts.routers` holds one member's routers on a
 * `--member` run, so building from the constant emits a file containing only
 * that member and silently deletes the rest. Measured 2026-08-16 on a live
 * machine — `npx super-ux --cursor` took `~/.cursor/rules/sshlg-routing.mdc`
 * from nine router blocks and 13743 bytes to two and 3233, and the only
 * surviving copy was the backup taken twenty lines below. The three markdown
 * targets never had the bug because `applyOne` upserts into `before`.
 *
 * Skipped entirely where `~/.cursor/rules` does not exist: the directory is
 * how Cursor says it is installed, and creating it would be this pack deciding
 * that a tool the operator does not use should now have rules.
 */
function applyCursor(opts) {
  const home = opts.home;
  const dir = path.join(home, '.cursor', 'rules');
  const file = path.join(dir, cursor.FILENAME);
  if (!fs.existsSync(dir)) return { file, action: 'agent-absent', agent: 'cursor' };

  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (!cursor.mayWrite(existing, R.BEGIN)) {
    return { file, action: 'foreign-file', agent: 'cursor' };
  }

  // The same three guards `applyOne` runs, and for the same reasons — this
  // function had none of them, so `update` created a 22 KB `alwaysApply: true`
  // rule on a machine whose recorded answer was `no`. Measured 2026-09-01
  // against a scratch HOME with `state.json` = {"routers":"no"}: CLAUDE.md
  // correctly `no-block`, and `sshlg-routing.mdc` **created**. The suite was
  // green over it because every `applyCursor` fixture passes `consent: 'yes'` —
  // nothing had ever asked what a refusal does.
  //
  // They apply only where our rule is not there yet. A file that already
  // carries it is refreshed without re-asking, exactly as a markdown target
  // whose block is present is refreshed — consent is asked once, and re-asking
  // on every run is how a recorded answer stops meaning anything.
  if (existing === null) {
    // Consent was given to "the pack maintains a routing block", not to one
    // particular file, so a target the pack did not have last time still
    // arrives — the reason `applyOne` carries this exception. `~/.cursor/rules`
    // existing is already established above, so the directory is the whole of
    // the "is this agent installed" question.
    const newTargetUnderConsent = opts.consentRecorded === 'yes';
    if (opts.mode !== 'install' && !newTargetUnderConsent) {
      return { file, action: 'absent', agent: 'cursor' };
    }
    // No sentinel is written here, and that is deliberate. `writeOptOut`
    // appends a comment to a file that already exists; for Cursor the file IS
    // the rule, so creating one to say "declined" would put a rule file in the
    // rules directory of a tool whose rules were just declined — the same
    // overreach in a quieter form. The refusal is already recorded in the
    // pack's own state, which is what stops the next run from re-asking.
    if (opts.consent !== 'yes') return { file, action: 'no-consent', agent: 'cursor' };
  }

  const body = existing === null ? EMPTY_BLOCK : cursor.bodyOf(existing);
  const built = R.upsert(body, opts.routers || {}, {
    members: opts.members || [],
    remove: opts.remove || [],
    preserve: opts.preserve || [],
    rendered: opts.rendered ? (opts.rendered[file] || {}) : undefined,
    star: opts.star === true,
    // Kept lines are named in the rule file's own numbering, frontmatter included.
    lineOffset: existing === null ? 0 : existing.slice(0, existing.length - body.length).split('\n').length - 1,
  });
  const removed = built.removed || {};
  const kept = built.kept || [];

  const next = cursor.renderRule(built.text);
  if (existing === next) return { file, action: 'unchanged', agent: 'cursor', removed, kept, rendered: built.rendered };
  if (opts.dryRun) {
    return { file, action: 'would-write', agent: 'cursor', diff: R.diff(existing || '', next), removed, kept };
  }
  const saved = protect(file, opts);
  if (saved.action === 'backup-failed') {
    return { file, action: 'backup-failed', agent: 'cursor', backup: saved, removed, kept };
  }

  fs.mkdirSync(dir, { recursive: true });
  atomic.write(file, next);
  // `removed` travels with the record so the caller parks what left the block.
  // Without it a section deleted here was gone for good, while the same section
  // deleted from CLAUDE.md was stashed and restorable.
  return { file, action: existing === null ? 'created' : 'updated', agent: 'cursor', removed, backup: saved, kept, rendered: built.rendered };
}

/**
 * B-206: one row of `instruction-targets.EXTRA_TARGETS`. Absent hosts are reported and
 * nothing is created; the shared `~/.agents/AGENTS.md` is never written through a
 * symlink (the operator's stopgap since 2026-10-16 pointed it at the Pi file); a full
 * row is `applyOne` itself; a compact row goes through `applyCompact`.
 */
function applyExtra(t, opts) {
  const IT = require('./instruction-targets.js');
  const home = opts.home;
  const file = IT.fileOf(t, home, opts);
  const base = { file, agent: t.agent };
  const p = IT.targetPresence(t, home, opts);
  if (!p.present) return { ...base, action: 'agent-absent', reason: p.why };
  if (t.shared) {
    let st = null;
    try { st = fs.lstatSync(file); } catch (e) { if (e.code !== 'ENOENT') return { ...base, action: 'unreadable', reason: e.code }; }
    if (st && st.isSymbolicLink()) {
      let real = null;
      try { real = fs.realpathSync(file); } catch (e) { /* dangling */ }
      const managed = managedFiles(home, opts);
      if (real && managed.includes(real)) {
        return { ...base, action: 'served-via-symlink', target: real,
          reason: `already served via symlink to ${real}, which the hub manages` };
      }
      return { ...base, action: 'foreign-symlink', target: real || fs.readlinkSync(file),
        reason: `${file} is a symlink to ${real || fs.readlinkSync(file) + ' (dangling)'}, a file the hub does not manage; `
          + 'nothing written. To let the hub manage it, replace the link with a regular file (copy what it points to), then run: npx sshlg-skills routers --update' };
    }
  }
  const record = t.render === 'compact'
    ? applyCompact(file, opts.routers || {}, t.cap, opts)
    : applyOne(file, opts.routers || {}, opts);
  record.agent = t.agent;
  if (t.shared) record.serves = p.via;
  return record;
}

/** Real paths of the instruction files the hub writes on this machine (TARGETS + extras). */
function managedFiles(home, opts) {
  const IT = require('./instruction-targets.js');
  const out = [];
  const real = (f) => { try { return fs.realpathSync(f); } catch (e) { return null; } };
  for (const t of TARGETS) {
    const v = hostRootVerdict(t, home, opts);
    if (v.supported) out.push(real(path.join(v.root, t.file)));
  }
  for (const t of IT.EXTRA_TARGETS) if (!t.shared) out.push(real(IT.fileOf(t, home, opts)));
  return out.filter(Boolean);
}

const COMPACT_BEGIN = R.BEGIN + ' (compact) managed by sshlg-skills. To opt out: replace this whole block\n     with a single SSHLG:ROUTERS:OPTOUT comment line. -->';
const COMPACT_NOTE = "Compact form: this host caps its global rules file, so each router's own section "
  + '(boundary, refusal phrase) is left out; that router\'s SKILL.md holds it.';

function region(text, begin, end) {
  const a = text.indexOf(begin);
  const b = text.indexOf(end, a);
  return a === -1 || b === -1 ? '' : text.slice(a, b + end.length);
}

/**
 * The block for a host with a size cap (B-206): heading, map, protocol and the router
 * table, without the router sections. The regions are cut out of the ordinary
 * `R.upsert` render, so the compact form says exactly what the full block says about
 * them; there is no second renderer to drift.
 */
function renderCompact(routers, opts) {
  const o = opts || {};
  const full = R.upsert(EMPTY_BLOCK, routers || {}, { members: o.members || [], star: o.star === true }).text;
  return [
    COMPACT_BEGIN,
    R.HEADING,
    COMPACT_NOTE,
    '',
    region(full, '<!-- SSHLG:ROUTERS:MAP:BEGIN -->', '<!-- SSHLG:ROUTERS:MAP:END -->'),
    '',
    region(full, '<!-- SSHLG:ROUTERS:PROTOCOL:BEGIN -->', '<!-- SSHLG:ROUTERS:PROTOCOL:END -->'),
    '',
    region(full, '<!-- SSHLG:ROUTERS:TABLE:BEGIN -->', '<!-- SSHLG:ROUTERS:TABLE:END -->'),
    R.END,
  ].join('\n');
}

const sha256 = (s) => require('crypto').createHash('sha256').update(String(s)).digest('hex');

/**
 * Write the compact block into a capped file. Same consent, opt-out, backup and atomic
 * write as `applyOne`; three refusals of its own, each leaving the file untouched:
 *  - `over-cap`: the block alone, or the file with it, is longer than the host reads.
 *    Never truncated: a cut block is a routing table missing its last rows.
 *  - `kept`: the block on disk is not what the hub last wrote here (no B-202 record
 *    matches), so it holds somebody's words; named, not overwritten.
 */
function applyCompact(file, routers, cap, opts) {
  const exists = fs.existsSync(file);
  const onDisk = exists ? fs.readFileSync(file, 'utf8') : '';
  const parsed = R.parse(onDisk);
  if (parsed.state === R.STATE.OPTED_OUT) return { file, action: 'opted-out' };
  if (parsed.state === R.STATE.MALFORMED) return { file, action: 'malformed' };
  const block = renderCompact(routers, opts);
  const rendered = { compact: sha256(block) };
  if (block.length > cap) {
    return { file, action: 'over-cap', reason: `the compact block is ${block.length} characters, over this host's ${cap}; nothing written` };
  }
  let next;
  if (parsed.state === R.STATE.ABSENT) {
    const newTargetUnderConsent = opts.consentRecorded === 'yes';
    if (opts.mode !== 'install' && !newTargetUnderConsent) return { file, action: exists ? 'no-block' : 'absent' };
    if (opts.consent === 'no') return opts.dryRun ? { file, action: 'would-opt-out' } : writeOptOut(file, opts);
    if (opts.consent !== 'yes') return { file, action: 'no-consent' };
    const gap = onDisk === '' ? '' : onDisk.endsWith('\n') ? '\n' : '\n\n';
    next = onDisk + gap + block + '\n';
  } else {
    const current = parsed.block.endsWith('\n') ? parsed.block.slice(0, -1) : parsed.block;
    if (current === block) return { file, action: 'unchanged', rendered };
    const last = opts.rendered && opts.rendered[file] && opts.rendered[file].compact;
    if (sha256(current) !== last) {
      return { file, action: 'kept', rendered: undefined,
        reason: `${file} holds a routing block the hub did not last write; left as it is. Move your lines outside the block `
          + '(or delete the block), then run: npx sshlg-skills routers --update' };
    }
    next = parsed.before + block + '\n' + parsed.after;
  }
  if (next.length > cap) {
    return { file, action: 'over-cap', reason: `${file} would be ${next.length} characters with the block, over this host's ${cap} `
      + `(the block is ${block.length}); nothing written. Shorten the rest of the file to ${cap - block.length - 2} characters or fewer.` };
  }
  if (next === onDisk) return { file, action: 'unchanged', rendered };
  if (opts.dryRun) return { file, action: 'would-write', diff: R.diff(onDisk, next), removed: {}, kept: [] };
  const saved = protect(file, opts);
  if (saved.action === 'backup-failed') return { file, action: 'backup-failed', backup: saved };
  atomic.write(file, next);
  return { file, action: exists ? 'updated' : 'created', backup: saved, removed: {}, kept: [], rendered };
}

// `protect` is exported so that new code writing to an operator-owned file uses
// THIS path rather than growing a second one. The house rule names it by name:
// there is no second write path, and adding one is the regression to watch for.
module.exports = { apply, applyOne, applyCursor, applyExtra, applyCompact, renderCompact, managedFiles, writeOptOut, protect, protectedWrite, atomicWrite: atomic.write, hostRoot, hostRootVerdict, TARGETS, EMPTY_BLOCK };
