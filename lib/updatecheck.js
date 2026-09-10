'use strict';

/**
 * Whether a newer SET has been released, said once at session start.
 *
 * The launcher's notice used to end "Nothing checks for you: run the line above
 * when you want the next set." That sentence was true and it was a cost: the
 * operator had to REMEMBER to check. This closes that without touching the
 * reason auto-update stays off — Claude Code's `autoUpdate` flag is
 * PER-MARKETPLACE and this family ships nine of them, so turning it on moves
 * each member on its own clock and the machine drifts into a combination nobody
 * tested. A notice about the SET is the opposite: it keeps the set a set and
 * only removes the remembering.
 *
 * **Session start never waits for the network.** The hook READS a cache and
 * prints at most one line; when the cache is stale it spawns a DETACHED probe
 * that writes the cache and exits. So the notice can be one session behind,
 * which for a pack released in waves is not a cost worth a slow session start —
 * and a machine with no network, a dead registry or a proxy in the way starts
 * exactly as fast as before and says nothing, because silence is the correct
 * output of a check that could not look.
 *
 * Every decision here is pure and fixtured without a HOME or a socket. The
 * impure half is two lines in the hook: read a file, spawn a process.
 */

/** A day. Long enough that the probe is rare, short enough to matter in a week. */
const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 24;

/** Parse `X.Y.Z` into comparable parts. Anything else is `null` — UNKNOWN, never 0. */
function parseVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v || '').trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * `behind` | `current` | `ahead` | `unknown`.
 *
 * `unknown` when either side does not parse, and it is a distinct answer rather
 * than a default to `current`: a version this cannot read is not a version it
 * has compared, and reporting "up to date" from an unreadable string is the
 * false-green this family refuses everywhere else.
 */
function compare(installed, latest) {
  const a = parseVersion(installed);
  const b = parseVersion(latest);
  if (!a || !b) return 'unknown';
  for (let i = 0; i < 3; i += 1) {
    if (b[i] > a[i]) return 'behind';
    if (b[i] < a[i]) return 'ahead';
  }
  return 'current';
}

/**
 * Should the probe run? Only when the cache is older than the interval.
 *
 * A missing or unparseable stamp means "never checked", which is a reason to
 * check rather than a reason to give up.
 */
function shouldProbe(lastAt, now, intervalMs) {
  const iv = typeof intervalMs === 'number' ? intervalMs : CHECK_INTERVAL_MS;
  const at = Number(lastAt);
  if (!Number.isFinite(at) || at <= 0) return true;
  if (at > now) return true;              // a clock that moved backwards: re-check
  return now - at >= iv;
}

/**
 * The one line, or `''`.
 *
 * One line, because the SessionStart hook's whole budget is ~90 tokens and this
 * family has already measured what a pack that prints its doctrine into every
 * session costs. It names both versions, because "an update is available" makes
 * the operator go and find out what they have.
 */
function line(installed, latest) {
  if (compare(installed, latest) !== 'behind') return '';
  return `[sshlg-skills] A newer set is out: ${latest} (you have ${installed}). `
    + 'The nine packs move together — `npx sshlg-skills@latest update`.';
}

/**
 * What the probe writes. Pure so a fixture can assert the shape.
 *
 * TRIMMED, because `npm view <pkg> version` answers with a trailing newline and
 * an untrimmed string does not parse — the check would then report `unknown`
 * against a registry that answered perfectly well. A fixture caught this.
 */
function record(latest, now) {
  return { at: now, latest: String(latest == null ? '' : latest).trim() || null };
}

/**
 * The state a hook acts on, from the cache alone.
 *
 * Returns `{ line, probe }`: what to print now, and whether to kick the detached
 * probe. Both are decided here so the hook holds no policy.
 */
function plan(installed, cache, now, intervalMs) {
  const c = (cache && typeof cache === 'object') ? cache : {};
  return {
    line: line(installed, c.latest),
    probe: shouldProbe(c.at, now, intervalMs),
  };
}

module.exports = {
  CHECK_INTERVAL_MS, parseVersion, compare, shouldProbe, line, record, plan,
};
