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

/**
 * The agents this family writes for, and the directory that proves each one
 * is installed.
 *
 * The directory's existence is the evidence. An agent's home is never created
 * — a file appearing under `~/.codex/` on a machine with no Codex is
 * confusing at best, and at worst it is the launcher inventing a config for a
 * tool the operator never chose.
 */
const TARGETS = [
  { agent: 'claude', dir: '.claude', file: 'CLAUDE.md' },
  { agent: 'codex', dir: '.codex', file: 'AGENTS.md' },
];

const EMPTY_BLOCK = [
  R.BEGIN + ' — managed by sshlg-skills. To opt out: replace this whole block\n     with a single SSHLG:ROUTERS:OPTOUT comment line. -->',
  '## Роутинг работы — семья ssheleg',
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
function writeOptOut(file) {
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (R.OPTOUT_RE.test(before)) return { file, action: 'opted-out' };
  const gap = before === '' ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  fs.writeFileSync(file, before + gap + R.OPTOUT + '\n', 'utf8');
  return { file, action: 'opted-out-recorded' };
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
    if (opts.mode !== 'install') return { file, action: exists ? 'no-block' : 'absent' };
    if (opts.consent === 'no') {
      return opts.dryRun ? { file, action: 'would-opt-out' } : writeOptOut(file);
    }
    if (opts.consent !== 'yes') return { file, action: 'no-consent' };
    const gap = !exists || before === '' ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    source = before + gap + EMPTY_BLOCK;
  }

  const result = R.upsert(source, routers, { remove: opts.remove || [] });
  const next = result.text;
  const removed = result.removed || {};
  if (next === onDisk) return { file, action: 'unchanged', removed };

  if (opts.dryRun) {
    return { file, action: 'would-write', diff: R.diff(onDisk, next), removed };
  }

  fs.writeFileSync(file, next, 'utf8');
  return { file, action: exists ? 'updated' : 'created', removed };
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

  return { targets };
}

module.exports = { apply, applyOne, writeOptOut, TARGETS, EMPTY_BLOCK };
