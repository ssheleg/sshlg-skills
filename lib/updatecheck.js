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
function plan(installed, cache, now, intervalMs, config) {
  const c = (cache && typeof cache === 'object') ? cache : {};
  const lines = [];
  // What an unattended run already did comes FIRST: it is the only line that
  // asks for something (a restart), and it is about the past rather than a
  // standing state.
  const ran = ranLine(c);
  if (ran) lines.push(ran);
  const behind = line(installed, c.latest);
  if (behind) {
    lines.push(behind);
    // The disclosure rides WITH the notice rather than repeating every session.
    // Said every time it would be noise and get skimmed; said once ever, a
    // machine set up later would never hear it. Said exactly when a new set is
    // out, it is the moment the operator can act on either half.
    const auto = autoLine(config);
    if (auto) lines.push(auto);
  }
  return {
    line: lines.join('\n'),
    lines,
    probe: shouldProbe(c.at, now, intervalMs),
  };
}

/**
 * Whether to UPDATE, not just say so — and the timing is the whole argument.
 *
 * Skills load AT session start. An update that lands during session start
 * reaches the operator only in the NEXT session, which is exactly what the
 * notice above already achieves — so auto-updating there buys nothing and costs
 * a session start that waits on npm. The moment that pays is `idle_prompt`: the
 * operator has stepped away, nothing is waiting on the model, and the next
 * session begins already fresh.
 *
 * It is ON unless the config says `off`, matching how routers are stored — the
 * file holds deviations, not defaults. The packs are the operator's OWN,
 * published by their own pipeline, and the routing block is protected by
 * `authored` precedence and a copy-before-write, so an unattended run does not
 * rewrite anybody's words. What it must never be is silent: the session says
 * once that this is on, and says what it did.
 *
 * `at` gates the retry, not the interval: an update that just ran must not run
 * again on the next idle ping, and a machine whose update keeps failing must not
 * spend every idle moment on it.
 */
function shouldAutoUpdate(config, cache, now, intervalMs) {
  const c = (config && config.update) || {};
  if (c.auto === 'off') return { run: false, why: 'off in config' };
  const cc = (cache && typeof cache === 'object') ? cache : {};
  if (compare(cc.installed || cc.self, cc.latest) !== 'behind'
      && compare(cc.self, cc.latest) !== 'behind') {
    // Nothing to do is the common case; say so rather than run a no-op launcher.
    return { run: false, why: 'no newer set in the cache' };
  }
  const iv = typeof intervalMs === 'number' ? intervalMs : CHECK_INTERVAL_MS;
  const ranAt = Number(cc.ranAt);
  if (Number.isFinite(ranAt) && ranAt > 0 && now - ranAt < iv && ranAt <= now) {
    return { run: false, why: 'already attempted within the interval' };
  }
  return { run: true, why: `cache says ${cc.latest} is out` };
}

/** The one line disclosing that the unattended path is on. Never silent about it. */
function autoLine(config) {
  const c = (config && config.update) || {};
  if (c.auto === 'off') return '';
  return '[sshlg-skills] The set auto-updates when you go idle — nothing runs mid-work. '
    + 'Turn it off: `npx sshlg-skills config set update.auto off`.';
}

/** What an update attempt records, so the next session can report it. */
function ranRecord(from, to, ok, now) {
  return { ranAt: now, from: String(from || '') || null, to: String(to || '') || null, ok: !!ok };
}

/** The line reporting what the unattended run actually did, or `''`. */
function ranLine(cache) {
  const c = (cache && typeof cache === 'object') ? cache : {};
  const r = c.lastRun;
  if (!r || !r.ranAt) return '';
  if (r.ok && r.from && r.to && r.from !== r.to) {
    return `[sshlg-skills] The set updated while you were away: ${r.from} → ${r.to}. `
      + 'Restart Claude Code to load it — skills are read at session start.';
  }
  if (!r.ok) {
    return '[sshlg-skills] An unattended set update FAILED — run '
      + '`npx sshlg-skills@latest update` to see why.';
  }
  return '';
}

module.exports = {
  CHECK_INTERVAL_MS, parseVersion, compare, shouldProbe, line, record, plan,
  shouldAutoUpdate, autoLine, ranRecord, ranLine,
};
