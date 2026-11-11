'use strict';
/**
 * `sshlg-skills settings get <key>`: a value-free projection of a Claude settings file.
 *
 * WHY (G2, audit 2026-11-11). The credential-read guard refuses `jq .enabledPlugins
 * ~/.claude/settings.json`, rightly: a reader cannot know which part of the file it will
 * print, and `env` or a hook command can carry a token. But agents need the harmless
 * parts (which plugins are on, which hooks are wired) and had no door. This is the door
 * the refusal names: only an allow-listed top-level key leaves, and every string inside
 * it that looks like a credential is replaced before it is printed.
 *
 * Pure: `project(text, key)` decides from the file's text; the launcher reads the file.
 */

const ALLOWED = ['enabledPlugins', 'hooks', 'permissions', 'skillOverrides', 'extraKnownMarketplaces'];
const REDACTED = '<redacted>';

/** True when a string, or a key naming it, looks like it carries a credential. */
function redactString(value) {
  const { LITERALS, secretName } = require('./secrets.js');
  let s = String(value);
  if (LITERALS.some(([rx]) => rx.test(s))) return REDACTED;
  // NAME=value where NAME names a credential (an inline env in a hook command).
  s = s.replace(/\b([A-Za-z_][A-Za-z0-9_]*)=("[^"]*"|'[^']*'|[^\s;&|)]+)/g,
    (m, name) => (secretName(name.toUpperCase()) ? `${name}=${REDACTED}` : m));
  // Bearer/Basic tokens, URL userinfo and token-bearing query parameters.
  s = s.replace(/\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{8,}/gi, `$1 ${REDACTED}`);
  s = s.replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^/\s:@]+:[^/\s@]+@/gi, `$1${REDACTED}@`);
  s = s.replace(/([?&](?:access_)?(?:token|key|api_key|apikey|secret|password|auth)=)[^&\s#]+/gi, `$1${REDACTED}`);
  return s;
}

function redact(value, keyName) {
  const { secretName } = require('./secrets.js');
  if (typeof value === 'string') {
    if (keyName && secretName(String(keyName).toUpperCase().replace(/[^A-Z0-9_]/g, '_'))) return REDACTED;
    return redactString(value);
  }
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = redact(v, k);
    return out;
  }
  return value;
}

/**
 * @param {string} text the settings file's JSON
 * @param {string} key  an allow-listed top-level key, optionally with a dotted sub-path
 * @returns {{ok: true, value: *}|{ok: false, code: number, error: string}}
 */
function project(text, key) {
  const top = String(key || '').split('.')[0];
  if (!ALLOWED.includes(top)) {
    return { ok: false, code: 2, error: `key "${key || ''}" is not one this command prints; allowed: ${ALLOWED.join(', ')}` };
  }
  let data;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, code: 1, error: 'the file is not valid JSON' }; }
  let value = data;
  for (const part of String(key).split('.')) {
    value = value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, part) ? value[part] : undefined;
  }
  return { ok: true, value: value === undefined ? null : redact(value) };
}

module.exports = { ALLOWED, REDACTED, project, redact, redactString };
