'use strict';

/**
 * Inbound work: what another agent left for THIS repository, surfaced to the
 * agent that starts in it.
 *
 * **The gap this closes, measured rather than argued.** The write side was
 * already built — `retro.publish` turns a lesson bigger than one project into an
 * issue on the skill that owns the rule, `docs/working-rules/repository-handoff.md`
 * says what a durable handoff must contain, and the doctrine states that issues
 * are resolved and never deleted because "the pile is the queue". Every one of
 * those sentences is addressed to the agent that WRITES. Nothing was addressed to
 * the agent that receives, and "picked up in the next cycle" is a hope, not a
 * mechanism.
 *
 * On 2026-09-10 the cost was counted: four pull requests, each titled
 * "cross-agent handoff", sat open for THREE DAYS across four member repositories.
 * They were found only because a different task happened to enumerate open PRs.
 * A fifth item — an issue proposing a rules change — sat a day. None of them was
 * lost; none of them was read either, and a queue nobody is told about is a queue
 * that grows.
 *
 * **What this decides, and what it deliberately does not.** It decides whether
 * there is inbound work and how to say so in one line. It does not decide what to
 * do about it: that is the receiving agent's job, through whatever route the work
 * needs. A surface that started triaging would be a second planner beside
 * `task-pipeline`.
 *
 * Every function here is pure. The impure half — one `gh` call — lives in
 * `lib/handoffprobe.js` and runs detached, for the reason spelled out in
 * `lib/updatecheck.js`: a session start that waits on a network is a session
 * start that is slower for everyone and hangs for somebody.
 */

/** A day: the same cadence as the set-update probe, for the same reason. */
const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 24;

/**
 * The mark that makes an item a HANDOFF rather than ordinary open work.
 *
 * A label, because it is the one attribute both `gh issue list --label` and a
 * human reading the web page can filter on, and because a title convention rots
 * the first time somebody writes a good title. Absence is not an error: an
 * unmarked issue is still reported as open work, it is simply not claimed to be
 * addressed to anybody.
 */
const HANDOFF_LABEL = 'handoff';

/**
 * Split what the probe found.
 *
 * `items` is `[{ kind, number, title, labels }]` — kind is `issue` or `pr`.
 * Anything unparseable is DROPPED rather than guessed at: a malformed row is not
 * evidence of work, and inventing one would make the count lie.
 */
function classify(items) {
  const rows = Array.isArray(items) ? items : [];
  const handoffs = [];
  const other = [];
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const num = Number(r.number);
    if (!Number.isFinite(num) || num <= 0) continue;
    const kind = r.kind === 'pr' ? 'pr' : (r.kind === 'issue' ? 'issue' : null);
    if (!kind) continue;
    const labels = Array.isArray(r.labels)
      ? r.labels.map((l) => String((l && l.name) || l || '').toLowerCase())
      : [];
    const row = { kind, number: num, title: String(r.title || '').trim(), labels };
    (labels.includes(HANDOFF_LABEL) ? handoffs : other).push(row);
  }
  return { handoffs, other };
}

/** `#12` for an issue, `!12` for a pull request — one glance tells them apart. */
function ref(row) {
  return (row.kind === 'pr' ? '!' : '#') + row.number;
}

/**
 * The one line, or `''`.
 *
 * Marked handoffs are NAMED, because a count is not actionable and the agent
 * would have to go and look anyway. Unmarked open work is counted only: it may
 * be anybody's, and claiming it is addressed to this agent would be a guess.
 */
function line(found) {
  const f = (found && typeof found === 'object') ? found : {};
  const handoffs = Array.isArray(f.handoffs) ? f.handoffs : [];
  const other = Array.isArray(f.other) ? f.other : [];
  if (!handoffs.length && !other.length) return '';
  const parts = [];
  if (handoffs.length) {
    const named = handoffs.slice(0, 3).map((r) => `${ref(r)} ${r.title}`.trim());
    const more = handoffs.length > 3 ? ` (+${handoffs.length - 3} more)` : '';
    parts.push(`${handoffs.length} handoff${handoffs.length === 1 ? '' : 's'} waiting here: `
      + named.join('; ') + more);
  }
  if (other.length) {
    parts.push(`${other.length} other open item${other.length === 1 ? '' : 's'}`);
  }
  return `[sshlg-skills] ${parts.join(' · ')}. `
    + 'Read one before changing what it is about — a queue nobody is told about grows.';
}

/** What the probe writes: the rows, the repository they came from, and when. */
function record(repo, items, now) {
  const { handoffs, other } = classify(items);
  return {
    at: now,
    repo: String(repo || '') || null,
    handoffs,
    other: other.length,          // only the count: the titles are not this surface's business
  };
}

/** Should the probe run for THIS repository? */
function shouldProbe(cache, repo, now, intervalMs) {
  const c = (cache && typeof cache === 'object') ? cache : {};
  const iv = typeof intervalMs === 'number' ? intervalMs : CHECK_INTERVAL_MS;
  // A cache for a DIFFERENT repository answers a different question, so it is
  // not a reason to stay quiet — this is the bug a single global stamp would
  // have: work in nine repositories, one of them checked.
  if (String(c.repo || '') !== String(repo || '')) return true;
  const at = Number(c.at);
  if (!Number.isFinite(at) || at <= 0) return true;
  if (at > now) return true;
  return now - at >= iv;
}

/** What to print now and whether to probe — the hook holds no policy. */
function plan(cache, repo, now, intervalMs) {
  const c = (cache && typeof cache === 'object') ? cache : {};
  const sameRepo = String(c.repo || '') === String(repo || '');
  return {
    line: sameRepo ? line({ handoffs: c.handoffs, other: new Array(Number(c.other) || 0) }) : '',
    probe: shouldProbe(c, repo, now, intervalMs),
  };
}

/**
 * The `owner/name` this checkout belongs to, from a git remote URL.
 *
 * Both spellings git uses are accepted — `git@host:owner/name.git` and
 * `https://host/owner/name` — and anything else returns `null` rather than a
 * guess: a surface that probed the wrong repository would report somebody
 * else's queue as this one's, which is worse than reporting nothing.
 */
function slug(remoteUrl) {
  const u = String(remoteUrl || '').trim();
  if (!u) return null;
  // It has to LOOK like a remote first. A bare filesystem path matched the
  // owner/name shape happily — `/local/path` came out as `local/path`, which
  // would have sent the probe at a repository that does not exist. A remote
  // carries either a scheme or the `user@host:` form; a path carries neither.
  const isRemote = /^[a-z][a-z0-9+.-]*:\/\//i.test(u) || /^[^/\s]+@[^/\s]+:/.test(u);
  if (!isRemote) return null;
  const m = /(?:[:/])([^/:]+)\/([^/]+?)(?:\.git)?\/?$/.exec(u);
  if (!m) return null;
  const owner = m[1];
  const name = m[2];
  if (!owner || !name) return null;
  return `${owner}/${name}`;
}

module.exports = {
  CHECK_INTERVAL_MS, HANDOFF_LABEL, classify, ref, line, record, shouldProbe, plan, slug,
};
