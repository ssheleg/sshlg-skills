'use strict';
/**
 * A credential noticed by its LABEL in what a tool printed (I-6 remainder, OPS-002).
 *
 * WHY A SECOND READER OF THE OUTPUT. `secrets.scan` (lib/secrets.js) knows vendor
 * prefixes — `sk-or-v1-`, `ghp_`, `AKIA` — and a key with no prefix went past it. Most
 * keys have none: a provider's 40-character hex token, a webhook secret, a database
 * password, a JWT. What they DO have, when a tool prints them, is a name beside them:
 * `x-api-key: …` in curl's verbose output, `FOO_API_KEY=…` in an env dump or a `docker
 * inspect`, `Authorization: Bearer …` in a request log, `"apiKey": "…"` in a config file
 * read whole. The name says what the value is; the value's shape says whether it is one.
 *
 * WHAT IT REPORTS. The label, how many times, the tool and the file or program — never
 * the value, nor any slice of it. A warning that quoted the secret would leak it a second
 * time into the context the first copy already sits in.
 *
 * HOW IT KEEPS QUIET (the half that decides whether it stays switched on).
 * 1. The LABEL must name a credential. It is split into words (`X-Api-Key` → x, api, key;
 *    `clientSecret` → client, secret) and its NOUN — the last word, after trailing
 *    qualifiers such as `_LIVE` or `_2` — must be token/secret/password/… , or `key` with a
 *    credential qualifier (api, access, secret, private, client, x- header …). A noun of
 *    id, hash, fingerprint, url, path, count, name … is neutral, and so is a qualifier of
 *    public, page, csrf, cache, idempotency …: `key_id`, `public_key`, `nextPageToken`,
 *    `cache_key`, `Idempotency-Key` all pass.
 * 2. The VALUE must look generated: 16 to 512 characters of the token alphabet, a letter
 *    AND a digit, Shannon entropy of at least 3 bits per character; not a placeholder
 *    (`<…>`, `$VAR`, `example`, `REDACTED`, masked `****`, a run like `123456`), not a
 *    path, URL, number or timestamp, not a publishable `pk_`/`pub_` key, not words with a
 *    version suffix (`oauth_device_flow_v2`), a snake_case name or a slot name
 *    (`project/env/NAME`). A bare `secret:name` — no space, no quotes — is a namespaced id
 *    and is not read as `label: value`. For a plain
 *    assignment it must also not be code: a call (`loadKey2(`) or a dotted identifier
 *    (`settings.SECRET_KEY_V2`). After `Authorization:` or `Bearer` the scheme already
 *    says it is a credential, so the code rules do not apply there.
 * 3. A value `secrets.scan` already recognises by its vendor prefix is left to it, so one
 *    leak is reported once.
 *
 * BOUNDED. Only the first 768 KiB and last 256 KiB of an output are read, and a result
 * read that way says `partial`. Every quantifier is bounded; a cheap pre-filter skips the
 * regexes when no credential word occurs at all.
 *
 * Pure: strings in, a verdict out. The hook (hooks/post-tool-use.js) moves the bytes and
 * fails silent; this module returns null rather than throw on anything it does not know.
 */

const { LITERALS, USE_SECRET, NOT_ON_PATH } = require('./secrets.js');

const HEAD = 768 * 1024;
const TAIL = 256 * 1024;
const MIN_LEN = 16;
const MAX_LEN = 512;
const MIN_BITS = 3.0;

const VALUE = String.raw`[A-Za-z0-9_\-.+/=~]{${MIN_LEN},${MAX_LEN}}(?![A-Za-z0-9_\-.+/=~])`;
const LABEL = String.raw`[A-Za-z][A-Za-z0-9_.-]{0,63}`;
/** `label: value`, `label=value`, `"label": "value"`, `label => value`. */
const ASSIGN = new RegExp(
  String.raw`(?:^|[^A-Za-z0-9_.])(["']?)(${LABEL})\1([ \t]*(?::|=>|=)[ \t]*)(["']?)(${VALUE})`, 'g');
/** `--label value`, the shape a process listing prints. `--label=value` is an ASSIGN. */
const FLAG = new RegExp(String.raw`(?:^|[\s"'])--(${LABEL})[ \t]+["']?(${VALUE})`, 'g');
/** `Authorization: Bearer …`, `authorization: Basic …`, `Authorization: <token>`. */
const AUTHZ = new RegExp(
  String.raw`(?:^|[^A-Za-z0-9_-])((?:proxy-)?authorization)["']?[ \t]*[:=][ \t]*["']?`
  + String.raw`(?:(?:bearer|basic|token|bot|digest)[ \t]+)?(${VALUE})`, 'gi');
/** A bare `Bearer …` in a log line. */
const BEARER = new RegExp(String.raw`(?:^|[^A-Za-z0-9_-])(Bearer)[ \t]+(${VALUE})`, 'g');

/** No credential word anywhere → nothing to do. */
const PREFILTER = /key|token|secret|pass|pwd|auth|cred|bearer/i;

/** Nouns a credential label ends in. */
const NOUNS = new Set(['token', 'secret', 'password', 'passwd', 'pwd', 'pass', 'passphrase',
  'credential', 'credentials', 'apikey', 'accesskey', 'secretkey', 'privatekey', 'authorization',
  'auth', 'bearer', 'jwt']);
/** `key` is a credential only with one of these beside it. */
const KEY_QUALIFIERS = new Set(['api', 'access', 'secret', 'private', 'client', 'service',
  'master', 'signing', 'session', 'license', 'licence', 'subscription', 'encryption', 'auth',
  'app', 'admin', 'account', 'x', 'webhook', 'shared', 'consumer', 'deploy']);
/** A qualifier that makes the label name something public, or not a credential at all. */
const NEUTRAL_QUALIFIERS = new Set(['public', 'pub', 'page', 'next', 'prev', 'previous',
  'continuation', 'cursor', 'csrf', 'xsrf', 'sync', 'max', 'min', 'cache', 'primary', 'sort',
  'foreign', 'partition', 'idempotency', 'ssh', 'host', 'known', 'has', 'is', 'no', 'use',
  'num', 'total', 'input', 'output', 'completion', 'prompt', 'commit', 'sha', 'git', 'rev',
  'revision', 'head', 'ref']);
/** Trailing words that qualify the noun without replacing it (`STRIPE_SECRET_KEY_LIVE`). */
const TRAILING = new Set(['live', 'prod', 'production', 'dev', 'development', 'staging', 'stage',
  'test', 'sandbox', 'old', 'new', 'next', 'current', 'primary', 'secondary', 'backup', 'value',
  'b64', 'base64', 'raw', 'default', 'main', 'rw', 'ro']);

/** Words of a label: `X-Api-Key` → x, api, key; `clientSecret` → client, secret. */
function words(label) {
  return String(label)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    .split(/[_.\-]+/)
    .filter(Boolean);
}

/** Does this label name a credential? */
function labelIsSecret(label) {
  let w = words(label);
  while (w.length > 1 && (TRAILING.has(w[w.length - 1]) || /^v?\d+$/.test(w[w.length - 1]))) {
    w = w.slice(0, -1);
  }
  if (!w.length) return false;
  const noun = w[w.length - 1];
  const qualifiers = w.slice(0, -1);
  if (qualifiers.some((q) => NEUTRAL_QUALIFIERS.has(q))) return false;
  if (NOUNS.has(noun)) return true;
  if (noun === 'key') return qualifiers.some((q) => KEY_QUALIFIERS.has(q));
  // One run of capitals with no separator: `GHTOKEN`, `MYAPIKEY`.
  if (w.length === 1 && noun.length > 6
    && /(?:token|apikey|secret|password)$/.test(noun) && !/tokens$/.test(noun)) return true;
  return false;
}

const PLACEHOLDER = /redacted|placeholder|example|changeme|change_me|your[_-]|xxxx|dummy|fake|sample|replace|todo|\*\*\*|\.\.\./i;

function isPlaceholder(v) {
  return PLACEHOLDER.test(String(v));
}

/** The longest run of consecutive ascending characters (`3456`, `cdef`): an example, typed. */
function ascendingRun(v) {
  let best = 1;
  let run = 1;
  for (let i = 1; i < v.length; i += 1) {
    const a = v.charCodeAt(i - 1);
    const b = v.charCodeAt(i);
    run = (b === a + 1 && /[0-9a-zA-Z]/.test(v[i]) && /[0-9a-zA-Z]/.test(v[i - 1])) ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

/** Shannon entropy in bits per character. */
function entropy(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  let bits = 0;
  for (const n of counts.values()) {
    const p = n / s.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}

/** Shape alone: does this value look generated? */
function valueLooksSecret(v) {
  if (typeof v !== 'string' || v.length < MIN_LEN || v.length > MAX_LEN) return false;
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return false;               // numbers, words
  if (/^[~./]/.test(v) || v.includes('//')) return false;                // paths, URLs
  if (/^\d{4}-\d{2}-\d{2}/.test(v) || /^v?\d+(?:\.\d+)+/.test(v)) return false; // dates, versions
  if (/^(?:sha1|sha224|sha256|sha384|sha512|md5)[-=]/i.test(v)) return false;   // digests
  if (/^[A-Za-z]+(?:[_-][A-Za-z]+)*[_-]?v?\d{1,4}$/.test(v)) return false;      // words_v2
  if (/^(?:pk|pub|public)[_-]/i.test(v)) return false;                  // publishable keys
  if (/^[a-z][a-z0-9]{0,15}(?:_[a-z][a-z0-9]{0,15})+$/.test(v)
    && (v.match(/\d/g) || []).length <= 3) return false;               // a snake_case name
  if (ascendingRun(v) >= 6) return false;                                // `…123456`, `abcdef…`
  if (v.includes('/') && v.split('/').every((seg) => /^[A-Za-z][A-Za-z_-]*\d{0,3}$/.test(seg))) {
    return false;                                                        // `project/env/NAME`
  }
  if (isPlaceholder(v)) return false;
  return entropy(v) >= MIN_BITS;
}

/** A plain assignment whose value is code, not data. */
function looksLikeCode(v, next) {
  if (next === '(' || next === '[') return true;                         // a call or index
  const segs = v.split('.');
  return segs.length > 1
    && segs.every((s) => s.length <= 32 && /^[A-Za-z_$][A-Za-z_$]*\d{0,3}$/.test(s));
}

function vendorLiteral(v) {
  return LITERALS.some(([rx]) => rx.test(v));
}

/** The part of a long output that is read: all of it, or its head and tail. */
function window(text) {
  if (text.length <= HEAD + TAIL) return { text, partial: false };
  return { text: text.slice(0, HEAD) + '\n' + text.slice(-TAIL), partial: true };
}

/** A label as it is reported: printable, short, never more than a name. */
function cleanLabel(label) {
  return String(label).replace(/[^\x21-\x7e]/g, '').slice(0, 64);
}

/**
 * Credentials printed under a label in `output`.
 *
 * @param {string} output
 * @returns {{found: {label: string, count: number}[], partial: boolean}|null}
 */
function scanLabelled(output) {
  if (typeof output !== 'string' || !output) return null;
  const { text, partial } = window(output);
  if (!PREFILTER.test(text)) return null;

  const seen = new Set();                    // value offsets already attributed
  const byLabel = new Map();                 // lower-case label → {label, count}
  const add = (label, value, at) => {
    if (seen.has(at)) return;
    seen.add(at);
    if (vendorLiteral(value)) return;        // secrets.scan names it, by vendor
    const key = label.toLowerCase();
    const row = byLabel.get(key);
    if (row) row.count += 1;
    else byLabel.set(key, { label: cleanLabel(label), count: 1 });
  };
  const run = (rx, onMatch) => {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(text)) !== null) {
      onMatch(m);
      if (m[0].length === 0) rx.lastIndex += 1;
    }
  };

  // The scheme already says these are credentials: no label or code test.
  run(AUTHZ, (m) => {
    const v = m[2];
    const at = m.index + m[0].length - v.length;
    if (valueLooksSecret(v)) add(m[1], v, at);
  });
  run(BEARER, (m) => {
    const v = m[2];
    const at = m.index + m[0].length - v.length;
    if (valueLooksSecret(v)) add(m[1], v, at);
  });
  run(ASSIGN, (m) => {
    const label = m[2];
    const v = m[5];
    const at = m.index + m[0].length - v.length;
    // `secret:name`, `credential:slug` — a namespaced id, written with no space and no
    // quote on either side, is how registries NAME a credential, not how one is printed.
    if (!m[1] && !m[4] && m[3] === ':') return;
    if (!labelIsSecret(label) || !valueLooksSecret(v)) return;
    if (looksLikeCode(v, text[m.index + m[0].length])) return;
    add(label, v, at);
  });
  run(FLAG, (m) => {
    const label = m[1];
    const v = m[2];
    const at = m.index + m[0].length - v.length;
    if (!labelIsSecret(label) || !valueLooksSecret(v)) return;
    if (looksLikeCode(v, text[m.index + m[0].length])) return;
    add(label, v, at);
  });

  if (!byLabel.size) return null;
  return { found: [...byLabel.values()], partial };
}

/**
 * The text a tool's response carries: every string in it, depth-first, bounded in depth,
 * count and total length, and safe on cycles. Bash (`stdout`/`stderr`), Read
 * (`file.content`), Grep (`content`), MCP content blocks (`[{type, text}]`) and a bare
 * string all reduce to the same thing.
 */
function outputText(response) {
  const parts = [];
  let total = 0;
  const limit = HEAD + TAIL + 1024;
  const stack = [[response, 0]];
  const visited = new Set();
  let steps = 0;
  while (stack.length && total < limit && steps < 100000) {
    steps += 1;
    const [node, depth] = stack.pop();
    if (typeof node === 'string') {
      parts.push(node);
      total += node.length;
    } else if (node && typeof node === 'object' && depth < 8 && !visited.has(node)) {
      visited.add(node);
      const kids = Array.isArray(node) ? node : Object.values(node);
      for (let i = kids.length - 1; i >= 0; i -= 1) stack.push([kids[i], depth + 1]);
    }
  }
  return parts.join('\n');
}

/** The program a command runs, without anything that could be a value. */
function programOf(command) {
  const out = [];
  for (const tok of String(command).trim().split(/\s+/)) {
    if (out.length >= 2) break;
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,40}$/.test(tok)) break;      // flags, quotes, `$`
    if (valueLooksSecret(tok)) break;
    out.push(out.length ? tok : tok.split('/').pop());
  }
  return out.join(' ');
}

/** Which tool printed it, and the file or program — for the report. */
function whereOf(data) {
  const d = data && typeof data === 'object' ? data : {};
  const tool = typeof d.tool_name === 'string' && d.tool_name ? d.tool_name : 'a tool';
  const input = d.tool_input && typeof d.tool_input === 'object' ? d.tool_input : {};
  let where = '';
  if (typeof input.command === 'string') where = programOf(input.command);
  else if (typeof input.file_path === 'string') where = input.file_path;
  else if (typeof input.path === 'string') where = input.path;
  else if (typeof input.notebook_path === 'string') where = input.notebook_path;
  return { tool, where: cleanPath(where) };
}

function cleanPath(p) {
  return String(p).replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200);
}

/** The note the hook prints. Empty when there is nothing to say. */
function describe(result, at) {
  if (!result || !Array.isArray(result.found) || !result.found.length) return '';
  const a = at && typeof at === 'object' ? at : {};
  const tool = a.tool || 'a tool';
  const names = result.found
    .map((f) => `${f.label}${f.count > 1 ? ` ×${f.count}` : ''}`).join(', ');
  return '[sshlg-skills] LABELLED CREDENTIAL IN OUTPUT — ' + tool
    + (a.where ? ` (${a.where})` : '')
    + ` printed a generated-looking value under ${names}. The value is not repeated here; it `
    + 'is in the transcript now and cannot be taken back.'
    + (result.partial ? ' (A long output: only its first 768 KiB and last 256 KiB were read.)' : '')
    + '\nTreat it as exposed and rotate it through the owner\'s door: `observatory_credentials` '
    + 'names the project and slot, and the owner\'s door (`tools/<provider>.py`, or `vault.py put` '
    + 'on stdin) issues and stores the replacement; consumers then read it through '
    + USE_SECRET + ' run PROJECT NAME -- COMMAND. ' + NOT_ON_PATH
    + '\nWithout Observatory: rotate it in the provider\'s console or CLI, write the new value to '
    + 'a file the consumer reads, created with mode 600 (umask 077), and never paste it into a '
    + 'command or a chat.'
    + '\nThen change what printed it: a presence check (`[ -n "$NAME" ] && echo set`), a count '
    + '(`grep -c "^NAME=" FILE`) or a value-free format says the same without the value.'
    + '\nIf the value is a public test fixture or a documented example, this note is wrong '
    + 'about it: it reads the label and the value\'s shape, not where the value came from.';
}

module.exports = {
  scanLabelled, describe, outputText, whereOf, labelIsSecret, valueLooksSecret,
  isPlaceholder, entropy, words,
};
