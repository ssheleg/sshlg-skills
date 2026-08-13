'use strict';
/**
 * The terminal sequence a `Notification` hook returns.
 *
 * This event is the one place where `terminalSequence` is not a nicety but the
 * only channel: the reference states that Claude Code discards a Notification
 * hook's `systemMessage` and `continue`, and the event is absent from the list of
 * events that deliver `additionalContext`. Emit the sequence or say nothing.
 *
 * **The allowlist is enforced here rather than trusted.** Claude Code accepts OSC
 * 0, 1, 2, 9, 99, 777 and a bare BEL, and silently **ignores** the field when it
 * carries anything else. A module that built a sequence outside that set would
 * ship a feature that is dropped without an error anywhere — so `sequence()`
 * returns `''` rather than something that will be discarded, and the fixture
 * asserts the refusal.
 *
 * Every control byte is written as an escape, never as itself: a literal ESC in a
 * source file survives exactly as long as nothing reformats it.
 *
 * Pure: a payload in, a string out.
 */

/** The notification types worth a desktop ping during an autonomous run. */
const TYPES = ['idle_prompt', 'agent_completed'];

/** OSC codes Claude Code will actually emit. Anything else it drops. */
const ALLOWED_OSC = [0, 1, 2, 9, 99, 777];

const ESC = '\u001b';
const BEL = '\u0007';

/**
 * Text safe to place inside an OSC payload.
 *
 * Semicolons separate an OSC 777 sequence's own fields, and a control byte can
 * end the sequence early — either turns a notification into terminal garbage, and
 * the second is an injection: the message is text this pack did not write.
 */
function sanitise(text, limit) {
  return String(text || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/;/g, ',')
    .trim()
    .slice(0, limit || 120);
}

/**
 * Is this string entirely inside the documented allowlist?
 *
 * **Every** sequence in it, not the first. The reference says the field accepts
 * "a string of one or more allowlisted escape sequences", and a caller that
 * concatenates — taskbar progress plus a notification, which is exactly what the
 * ledger hook does — would otherwise have its second sequence validated by nobody
 * and silently dropped by Claude Code along with the first.
 */
function isAllowed(seq) {
  let rest = String(seq == null ? '' : seq);
  if (!rest) return false;
  while (rest.length) {
    if (rest[0] === BEL) { rest = rest.slice(1); continue; }
    const m = new RegExp(`^${ESC}\\](\\d+);[^${ESC}${BEL}]*${BEL}`).exec(rest);
    if (!m || !ALLOWED_OSC.includes(Number(m[1]))) return false;
    rest = rest.slice(m[0].length);
  }
  return true;
}

/**
 * The sequence for a notification payload, or `''` when there is nothing to emit.
 *
 * `''` covers three different cases on purpose — a type we do not notify on, a
 * payload with no text, and a sequence that would be rejected — because all three
 * mean the same thing to the caller: print no JSON at all.
 */
function sequence(payload) {
  const p = payload || {};
  if (!TYPES.includes(p.notification_type)) return '';

  const body = sanitise(p.message);
  if (!body) return '';
  const title = sanitise(p.title || 'Claude Code', 60);

  const seq = `${ESC}]777;notify;${title};${body}${BEL}`;
  return isAllowed(seq) ? seq : '';
}

module.exports = { sequence, isAllowed, sanitise, TYPES, ALLOWED_OSC, ESC, BEL };
