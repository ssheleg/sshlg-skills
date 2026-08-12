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
  { agent: 'claude', dir: '.claude', file: 'CLAUDE.md' },
  { agent: 'codex', dir: '.codex', file: 'AGENTS.md' },
  { agent: 'gemini', dir: '.gemini', file: 'GEMINI.md' },
];

const EMPTY_BLOCK = [
  R.BEGIN + ' — managed by sshlg-skills. To opt out: replace this whole block\n     with a single SSHLG:ROUTERS:OPTOUT comment line. -->',
  '## Роутинг работы — семья ssheleg',
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
  fs.writeFileSync(file, before + gap + R.OPTOUT + '\n', 'utf8');
  return { file, action: 'opted-out-recorded', backup: saved };
}

/**
 * Take the copy that must exist before this pack modifies a file it did not
 * write. Every `writeFileSync` below is preceded by exactly one of these.
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
  });
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
    const newTargetUnderConsent = opts.consentRecorded === 'yes' && exists;
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
  });
  const next = result.text;
  const removed = result.removed || {};
  if (next === onDisk) return { file, action: 'unchanged', removed };

  if (opts.dryRun) {
    return { file, action: 'would-write', diff: R.diff(onDisk, next), removed };
  }

  // Only now, with the write decided and the bytes known to differ. Backing up
  // earlier would fill the directory with copies of runs that changed nothing —
  // and `update` is mostly such runs.
  const saved = protect(file, opts);
  if (saved.action === 'backup-failed') {
    return { file, action: 'backup-failed', backup: saved, removed };
  }

  fs.writeFileSync(file, next, 'utf8');
  return { file, action: exists ? 'updated' : 'created', removed, backup: saved };
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

  for (const t of TARGETS) {
    const dir = path.join(home, t.dir);
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

  const rule = applyCursor(opts);
  if (rule) targets.push(rule);

  return { targets };
}

/**
 * Cursor, whose rules are one file each rather than a block inside a file.
 *
 * The body is assembled by running the ordinary `upsert` over the empty block
 * template, so the map, the router sections and the table come from exactly
 * the same code that writes the other three targets — a second renderer would
 * be a second truth about what the block says.
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

  const built = R.upsert(EMPTY_BLOCK, opts.routers || {}, {
    members: opts.members || [],
    remove: opts.remove || [],
    preserve: opts.preserve || [],
  });

  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (!cursor.mayWrite(existing, R.BEGIN)) {
    return { file, action: 'foreign-file', agent: 'cursor' };
  }

  const next = cursor.renderRule(built.text);
  if (existing === next) return { file, action: 'unchanged', agent: 'cursor' };
  if (opts.dryRun) {
    return { file, action: 'would-write', agent: 'cursor', diff: R.diff(existing || '', next) };
  }
  const saved = protect(file, opts);
  if (saved.action === 'backup-failed') {
    return { file, action: 'backup-failed', agent: 'cursor', backup: saved };
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, next, 'utf8');
  return { file, action: existing === null ? 'created' : 'updated', agent: 'cursor', backup: saved };
}

module.exports = { apply, applyOne, applyCursor, writeOptOut, TARGETS, EMPTY_BLOCK };
