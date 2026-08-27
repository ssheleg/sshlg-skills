#!/usr/bin/env node
'use strict';
/**
 * Family traffic — views, clones and referrers across every repository the family
 * ships, read from GitHub and folded into one number.
 *
 * Why a script and not a dashboard tab. GitHub reports traffic per repository, and the
 * family is ten of them: the umbrella plus the nine members. "How much traffic does the
 * family get" is a question no page in GitHub's UI answers, and answering it by opening
 * ten tabs and adding them up is how a number gets quoted once and then repeated for a
 * month after it stopped being true.
 *
 * Why it snapshots. **The traffic API keeps fourteen days and nothing older.** A figure
 * read today is unrecoverable next month, so `--snapshot` folds each day's rows into an
 * NDJSON ledger keyed by `repo` and `date`. Re-running merges rather than appends: the
 * fourteen-day window overlaps itself every run, and a ledger that grew a duplicate row
 * per run would double every count it was built to preserve. Run it at least fortnightly
 * or the gap is permanent — no backfill exists, because the data is gone from the source.
 *
 * The repository list is DERIVED from `skills.json`, never typed here. A member added to
 * the family and missed by a hand-kept list in this file reports a family total that is
 * quietly short, which is the failure mode this whole repository keeps finding.
 *
 * Auth is whatever `gh` already has. Traffic is admin-only data, so a token that can read
 * the repository publicly still gets 403 — the script says which repository refused
 * rather than reporting it as zero, because a silent zero is indistinguishable from a
 * quiet week.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const data = require(path.join(ROOT, 'skills.json'));

const UMBRELLA = `${data.owner}/sshlg-skills`;
const REPOS = [UMBRELLA, ...data.skills.map((s) => s.repo)];

function api(route) {
  const r = spawnSync('gh', ['api', route], { encoding: 'utf8' });
  if (r.status !== 0) {
    const msg = (r.stderr || '').trim().split('\n').pop() || `exit ${r.status}`;
    return { error: msg };
  }
  try {
    return { value: JSON.parse(r.stdout) };
  } catch (e) {
    return { error: `unparseable response: ${e.message}` };
  }
}

/** One repository's fourteen-day window, or the reason it could not be read. */
function readRepo(repo) {
  const views = api(`repos/${repo}/traffic/views`);
  const clones = api(`repos/${repo}/traffic/clones`);
  const refs = api(`repos/${repo}/traffic/popular/referrers`);
  const paths = api(`repos/${repo}/traffic/popular/paths`);
  const denied = [views, clones, refs, paths].find((x) => x.error);
  if (denied) return { repo, error: denied.error };
  return {
    repo,
    views: views.value.count,
    viewUniques: views.value.uniques,
    clones: clones.value.count,
    cloneUniques: clones.value.uniques,
    days: { views: views.value.views || [], clones: clones.value.clones || [] },
    referrers: refs.value || [],
    paths: paths.value || [],
  };
}

/** Daily rows, one per repo/date — the grain the ledger keeps. */
function daily(rows) {
  const out = new Map();
  for (const r of rows) {
    if (r.error) continue;
    const put = (ts, key, count, uniques) => {
      const date = String(ts).slice(0, 10);
      const id = `${r.repo} ${date}`;
      const rec = out.get(id) || {
        repo: r.repo, date, views: 0, viewUniques: 0, clones: 0, cloneUniques: 0,
      };
      rec[key] = count;
      rec[key === 'views' ? 'viewUniques' : 'cloneUniques'] = uniques;
      out.set(id, rec);
    };
    for (const d of r.days.views) put(d.timestamp, 'views', d.count, d.uniques);
    for (const d of r.days.clones) put(d.timestamp, 'clones', d.count, d.uniques);
  }
  return [...out.values()].sort((a, b) => (a.date === b.date
    ? a.repo.localeCompare(b.repo) : a.date.localeCompare(b.date)));
}

/**
 * Merge today's window into the ledger on (repo, date).
 * Later readings of the same day WIN: GitHub's most recent figure for a date is its
 * corrected one, and keeping the first reading would freeze a partial day forever.
 */
function merge(ledgerPath, rows) {
  const seen = new Map();
  if (fs.existsSync(ledgerPath)) {
    for (const line of fs.readFileSync(ledgerPath, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        seen.set(`${r.repo} ${r.date}`, r);
      } catch {
        /* a corrupt line is skipped, never silently rewritten */
      }
    }
  }
  let added = 0;
  let updated = 0;
  for (const r of rows) {
    const id = `${r.repo} ${r.date}`;
    if (!seen.has(id)) added += 1;
    else if (JSON.stringify(seen.get(id)) !== JSON.stringify(r)) updated += 1;
    seen.set(id, r);
  }
  const all = [...seen.values()].sort((a, b) => (a.date === b.date
    ? a.repo.localeCompare(b.repo) : a.date.localeCompare(b.date)));
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, `${all.map((r) => JSON.stringify(r)).join('\n')}\n`);
  return { added, updated, total: all.length };
}

function pad(s, n) { return String(s).padEnd(n); }
function num(s, n) { return String(s).padStart(n); }

function report(rows) {
  const ok = rows.filter((r) => !r.error);
  const bad = rows.filter((r) => r.error);
  const sum = (k) => ok.reduce((n, r) => n + r[k], 0);

  const lines = [];
  lines.push("Family traffic — GitHub's trailing 14 days, all repositories");
  lines.push('');
  lines.push(pad('repository', 34) + num('views', 7) + num('uniq', 7)
    + num('clones', 8) + num('uniq', 7));
  lines.push('-'.repeat(63));
  for (const r of [...ok].sort((a, b) => b.views - a.views)) {
    lines.push(pad(r.repo, 34) + num(r.views, 7) + num(r.viewUniques, 7)
      + num(r.clones, 8) + num(r.cloneUniques, 7));
  }
  lines.push('-'.repeat(63));
  lines.push(pad(`FAMILY (${ok.length} repos)`, 34) + num(sum('views'), 7)
    + num(sum('viewUniques'), 7) + num(sum('clones'), 8) + num(sum('cloneUniques'), 7));
  lines.push('');
  lines.push('Unique visitors are per repository and are NOT additive — one person reading');
  lines.push('three packs counts three times. The column is summed for scale, not identity.');

  const refs = new Map();
  for (const r of ok) {
    for (const x of r.referrers) refs.set(x.referrer, (refs.get(x.referrer) || 0) + x.count);
  }
  if (refs.size) {
    lines.push('');
    lines.push('Referrers, family-wide');
    for (const [k, v] of [...refs].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
      lines.push(`  ${pad(k, 34)}${num(v, 7)}`);
    }
  }
  if (bad.length) {
    lines.push('');
    lines.push('NOT READ — reported rather than counted as zero:');
    for (const r of bad) lines.push(`  ${pad(r.repo, 34)}${r.error}`);
  }
  return lines.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const rows = REPOS.map(readRepo);

  const si = argv.indexOf('--snapshot');
  if (si !== -1) {
    const file = argv[si + 1] && !argv[si + 1].startsWith('--')
      ? argv[si + 1] : path.join(ROOT, 'docs', 'evidence', 'traffic.ndjson');
    const { added, updated, total } = merge(file, daily(rows));
    console.log(`snapshot: +${added} new, ${updated} corrected, ${total} rows in `
      + `${path.relative(ROOT, file)}`);
  }

  if (argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
  else console.log(report(rows));

  if (rows.every((r) => r.error)) process.exit(1);
}

if (require.main === module) main();
module.exports = {
  REPOS, daily, merge, report,
};
