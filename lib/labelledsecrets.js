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
 * Also read: escaped-quote JSON inside a string (`\"password\":\"…\"`, an
 * `aws secretsmanager` SecretString), `.netrc` (`machine … login … password …`), URL
 * userinfo (`scheme://user:PASSWORD@host`, alone or as `DATABASE_URL=…`), labels starting
 * with `_` (`.npmrc`'s `:_authToken=`), base64 values starting with `/`, and Laravel's
 * `APP_KEY=base64:…`.
 *
 * WHAT IT LEAVES OUT, on purpose. A short password with symbols (`p@ss!w0rd#1`) under a
 * label: the token alphabet stops at the first symbol, and widening it would read prose
 * and code as values. A URL userinfo password of 12 characters or more is read with
 * symbols. A local proxy's token: `<P>_AUTH_TOKEN` / `<P>_API_KEY` beside a loopback
 * `<P>_BASE_URL` in the same output (Switchboard's managed sessions, SB-118) — a vendor
 * key there is still `secrets.scan`'s.
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
 * BOUNDED. Each string of a response is read whole up to 1 MiB, else its first 768 KiB
 * and last 256 KiB; at most 4 MiB in all, and a result read that way says `partial` —
 * also when it found nothing. Values are captured without backtracking. Every quantifier is bounded; a cheap pre-filter skips the
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

/** The token alphabet a generated value is written in. */
const CLS = String.raw`[A-Za-z0-9_\-.+/=~]`;
/**
 * A value, captured WITHOUT backtracking: a lookahead takes the whole run of the token
 * alphabet (lookarounds are atomic in JavaScript), and the back-reference consumes exactly
 * that. `[…]{16,512}(?![…])` backtracked through every length on a long run — 2.1 s on a
 * MiB of `=a=a…` — because the negative lookahead failed at each one. The upper bound is
 * checked in code (`valueLooksSecret`), where it costs nothing.
 */
const VALUE = (n) => String.raw`(?=(${CLS}{${MIN_LEN},}))` + '\\' + n;
/** A label may start with `_` (`.npmrc`'s `:_authToken=`, `_SECRET_TOKEN=`). */
const LABEL = String.raw`[A-Za-z_][A-Za-z0-9_.-]{0,63}`;
/** A quote, or an escaped one (`\"password\":\"…\"` inside a JSON string). */
const Q = String.raw`(?:\\?["'])`;
/**
 * `label: value`, `label=value`, `"label": "value"`, `label => value`, `\"label\":\"value\"`,
 * and Laravel's `APP_KEY=base64:…`. Groups: 1 quote, 2 label, 3 separator, 4 quote, 5 value.
 */
const ASSIGN = new RegExp(
  String.raw`(?:^|[^A-Za-z0-9_.])(${Q}?)(${LABEL})\1([ \t]*(?::|=>|=)[ \t]*)(${Q}?)(?:base64:)?`
  + VALUE(5), 'g');
/** `--label value`, the shape a process listing prints. `--label=value` is an ASSIGN. */
const FLAG = new RegExp(String.raw`(?:^|[\s"'])--(${LABEL})[ \t]+["']?` + VALUE(2), 'g');
/** `Authorization: Bearer …`, `authorization: Basic …`, `Authorization: <token>`. */
const AUTHZ = new RegExp(
  String.raw`(?:^|[^A-Za-z0-9_-])((?:proxy-)?authorization)\\?["']?[ \t]*[:=][ \t]*\\?["']?`
  + String.raw`(?:(?:bearer|basic|token|bot|digest)[ \t]+)?` + VALUE(2), 'gi');
/** A bare `Bearer …` in a log line. */
const BEARER = new RegExp(String.raw`(?:^|[^A-Za-z0-9_-])(Bearer)[ \t]+` + VALUE(2), 'g');
/**
 * `.netrc`: `machine HOST login USER password VALUE`, on one line or one field per line.
 * The label is `password` only after `login`/`machine` on its line, or alone at a line's
 * start — prose that says "password changed" never gets that far.
 */
const NETRC = new RegExp(
  String.raw`(?:^|\n)[ \t]*(?:(?:machine|default|login|account)[ \t]+[^\s]{1,200}[ \t]+)*`
  + String.raw`(password|passwd)[ \t]+` + VALUE(2), 'gi');
/**
 * URL userinfo: `scheme://user:PASSWORD@host`, alone or under a label (`DATABASE_URL=…`).
 * Groups: 1 the label before it, if any; 2 scheme; 3 password.
 */
const USERINFO = new RegExp(
  String.raw`(?:(?:^|[^A-Za-z0-9_.])\\?["']?(${LABEL})\\?["']?[ \t]*(?::|=>|=)[ \t]*\\?["']?)?`
  + String.raw`\b([A-Za-z][A-Za-z0-9+.-]{1,20})://[^\s:/@"'<>]{0,128}:([^\s/@"'<>]{1,256})@(?=[A-Za-z0-9\[])`,
  'g');
/**
 * A local proxy's token: `<P>_BASE_URL` on loopback beside `<P>_AUTH_TOKEN` / `<P>_API_KEY`.
 * Switchboard's managed sessions (SB-118) put `ANTHROPIC_AUTH_TOKEN` in every project's
 * `.claude/settings.local.json` with `ANTHROPIC_BASE_URL=http://127.0.0.1:…`: the value
 * opens the local proxy only, and telling an agent to rotate it is noise that teaches it to
 * ignore the note. A real vendor key there is still a vendor literal, which `secrets.scan`
 * reports by shape.
 */
const LOOPBACK_BASE = new RegExp(
  String.raw`(?:^|[^A-Za-z0-9_.])\\?["']?([A-Za-z_][A-Za-z0-9_]{0,63})_BASE_URL\\?["']?[ \t]*(?::|=)[ \t]*\\?["']?`
  + String.raw`https?://(?:127(?:\.\d{1,3}){3}|localhost|\[::1\])(?![A-Za-z0-9.-])`, 'gi');
const PROXY_LABEL = /^(.+)_(?:AUTH_TOKEN|API_KEY)$/i;

/** No credential word and no URL userinfo anywhere → nothing to do. */
const PREFILTER = /key|token|secret|pass|pwd|auth|cred|bearer|:\/\/[^\s\/@]{0,128}:[^\s\/@]{1,256}@/i;

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

/**
 * A rooted path, not base64 that happens to start with `/` (`/9j4AAQ…` is an encoded JPEG
 * header; base64 keys start with `/` one time in 64). A path has a second separator and no
 * `+` or `=`.
 */
function looksLikePath(v) {
  return v[0] === '/' && v.indexOf('/', 1) !== -1 && !/[+=]/.test(v);
}

/**
 * One identifier made of words: `AuthenticationMD5Password`, `experimentalS3Credentials`.
 * Three to six segments, at least three of them alphabetic, words of four or more letters
 * covering most of it, and few digits. A generated value has short, broken runs and fails all three.
 */
function looksLikeIdentifier(v) {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(v)) return false;
  if ((v.match(/\d/g) || []).length > 3) return false;
  const segs = v.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+/g) || [];
  // A few words, not many short runs: a random value of mixed case breaks into ten or more
  // segments (one in 3,000 random values passed the coverage test below on its own).
  if (segs.length > 6) return false;
  const alpha = segs.filter((x) => /^[A-Za-z]+$/.test(x));
  if (alpha.length < 3) return false;
  const long = alpha.filter((x) => x.length >= 4).reduce((n, x) => n + x.length, 0);
  return long / v.length >= 0.7;
}

/** A password in URL userinfo: shorter and freer than a token, never a placeholder. */
function userinfoLooksSecret(raw) {
  let v = raw;
  try { v = decodeURIComponent(raw); } catch (e) { /* keep it encoded */ }
  if (v.length < 12 || v.length > 256) return false;
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return false;
  if (/^[$%{<*]/.test(v) || /\$\{|\{\{/.test(v)) return false;
  if (isPlaceholder(v) || /^(?:pass(?:word)?|secret|token)\d*$/i.test(v)) return false;
  if (ascendingRun(v) >= 6) return false;
  if (/^(?:[a-z]+|[A-Z][a-z]*|[A-Z]+)(?:[_-](?:[a-z]+|[A-Z][a-z]*|[A-Z]+))*[_-]?\d{0,4}$/.test(v)) {
    return false;                                                        // WORDS_LIKE_THIS_2026
  }
  return entropy(v) >= MIN_BITS;
}

/** Shape alone: does this value look generated? */
function valueLooksSecret(v) {
  if (typeof v !== 'string' || v.length < MIN_LEN || v.length > MAX_LEN) return false;
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return false;               // numbers, words
  // Paths and protocol-relative URLs (`//cdn…/x`). A `//` INSIDE is base64, not a URL: the
  // token alphabet has no `:`, so a value can never hold a `scheme://`.
  if (/^[~.]/.test(v) || looksLikePath(v)) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(v) || /^v?\d+(?:\.\d+)+/.test(v)) return false; // dates, versions
  if (/^(?:sha1|sha224|sha256|sha384|sha512|md5)[-=]/i.test(v)) return false;   // digests
  // words_v2 — each word in one case (or Titlecase); random mixed case followed by one
  // digit is a generated value, not a name (it made one random fixture in 1,000 vanish).
  if (/^(?:[a-z]+|[A-Z][a-z]*|[A-Z]+)(?:[_-](?:[a-z]+|[A-Z][a-z]*|[A-Z]+))*[_-]?v?\d{1,4}$/.test(v)) {
    return false;
  }
  // publishable keys (`pk_live_…`, Mapbox `pk.…`): lower case only, as issuers write them —
  // case-blind, one random value in 30,000 started `Pk-` or `PK_` and vanished.
  if (/^(?:pk|pub|public)[_.]/.test(v)) return false;
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

/** The part of one string that is read: all of it, or its head and tail. */
function window(text) {
  if (text.length <= HEAD + TAIL) return { text, partial: false };
  return { text: text.slice(0, HEAD) + '\n' + text.slice(-TAIL), partial: true };
}

/** At most this much text is scanned in one call, across all of its parts. */
const BUDGET = 4 * (HEAD + TAIL);

/** A label as it is reported: printable, short, never more than a name. */
function cleanLabel(label) {
  return String(label).replace(/[^\x21-\x7e]/g, '').slice(0, 64);
}

/**
 * Credentials printed under a label in `output` — one string, or the strings of a tool's
 * response (`outputParts`). Each string is read whole up to 1 MiB, else its first 768 KiB
 * and last 256 KiB; at most 4 MiB in all. `partial` says some of it was not read, and is
 * returned even when nothing was found, so the caller can say so.
 *
 * @param {string|string[]} output
 * @returns {{found: {label: string, count: number}[], partial: boolean}|null}
 */
function scanLabelled(output) {
  const list = typeof output === 'string' ? [output]
    : Array.isArray(output) ? output.filter((x) => typeof x === 'string') : [];
  const byLabel = new Map();
  let partial = false;
  let budget = BUDGET;
  for (const part of list) {
    if (!part) continue;
    if (budget <= 0) { partial = true; break; }
    const w = window(part);
    let text = w.text;
    if (text.length > budget) { text = text.slice(0, budget); partial = true; }
    budget -= text.length;
    if (w.partial) partial = true;
    scanText(text, byLabel);
  }
  if (!byLabel.size) return partial ? { found: [], partial: true } : null;
  return { found: [...byLabel.values()], partial };
}

function scanText(text, byLabel) {
  if (!PREFILTER.test(text)) return;

  const seen = new Set();                    // value offsets already attributed
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
  const end = (m) => m.index + m[0].length;

  // Prefixes whose BASE_URL is loopback: their AUTH_TOKEN / API_KEY is a local proxy's.
  const local = new Set();
  if (/_BASE_URL/i.test(text)) run(LOOPBACK_BASE, (m) => local.add(m[1].toLowerCase()));
  const proxied = (label) => {
    const p = PROXY_LABEL.exec(label);
    return Boolean(p && local.has(p[1].replace(/^\\?["']?/, '').toLowerCase()));
  };

  // The scheme already says these are credentials: no label or code test.
  run(AUTHZ, (m) => {
    const v = m[2];
    if (valueLooksSecret(v)) add(m[1], v, end(m) - v.length);
  });
  run(BEARER, (m) => {
    const v = m[2];
    if (valueLooksSecret(v)) add(m[1], v, end(m) - v.length);
  });
  run(ASSIGN, (m) => {
    const label = m[2];
    const v = m[5];
    // `secret:name`, `credential:slug` — a namespaced id, written with no space and no
    // quote on either side, is how registries NAME a credential, not how one is printed.
    if (!m[1] && !m[4] && m[3] === ':') return;
    if (!labelIsSecret(label) || !valueLooksSecret(v) || proxied(label)) return;
    if (looksLikeCode(v, text[end(m)])) return;
    if (!m[4] && looksLikeIdentifier(v)) return;
    add(label, v, end(m) - v.length);
  });
  run(FLAG, (m) => {
    const label = m[1];
    const v = m[2];
    if (!labelIsSecret(label) || !valueLooksSecret(v) || proxied(label)) return;
    if (looksLikeCode(v, text[end(m)]) || looksLikeIdentifier(v)) return;
    add(label, v, end(m) - v.length);
  });
  if (/password|passwd/i.test(text)) {
    run(NETRC, (m) => {
      const v = m[2];
      if (valueLooksSecret(v) && !looksLikeIdentifier(v)) add(m[1], v, end(m) - v.length);
    });
  }
  if (text.includes('://')) {
    run(USERINFO, (m) => {
      const v = m[3];
      if (!userinfoLooksSecret(v)) return;
      // a URL whose user or host says it is an example (`fakeuser@fake.rds…`, `example.com`)
      if (isPlaceholder(m[0].slice(0, m[0].length - v.length - 1))) return;
      add(m[1] || `${m[2]}-url-password`, v, end(m) - v.length);
    });
  }
}

/**
 * Every string a tool's response carries, depth-first, bounded in depth and node count and
 * safe on cycles — but NOT in length: `secrets.scan` reads all of it, as it did before this
 * module existed (a vendor key in `stderr` after a MiB of `stdout` is still found), and
 * `scanLabelled` windows each string itself. Bash (`stdout`/`stderr`), Read
 * (`file.content`), Grep (`content`), MCP content blocks (`[{type, text}]`) and a bare
 * string all reduce to the same thing.
 */
function outputParts(response) {
  const parts = [];
  const stack = [[response, 0]];
  const visited = new Set();
  let steps = 0;
  while (stack.length && steps < 100000) {
    steps += 1;
    const [node, depth] = stack.pop();
    if (typeof node === 'string') {
      if (node) parts.push(node);
    } else if (node && typeof node === 'object' && depth < 8 && !visited.has(node)) {
      visited.add(node);
      const kids = Array.isArray(node) ? node : Object.values(node);
      for (let i = kids.length - 1; i >= 0; i -= 1) stack.push([kids[i], depth + 1]);
    }
  }
  return parts;
}

/** `outputParts`, joined: the text `secrets.scan` reads. */
function outputText(response) {
  return outputParts(response).join('\n');
}

/**
 * The program a command runs — argv[0]'s base name and nothing else. A second word was
 * once printed too, and a second word can be a short secret (`login s3cr3t…`); a name that
 * is not a plain program name (an assignment, a quote, a `$`) prints nothing.
 */
function programOf(command) {
  const tok = String(command).trim().split(/\s+/)[0] || '';
  if (!/^[A-Za-z0-9._/-]{1,200}$/.test(tok)) return '';
  const base = tok.split('/').pop();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,40}$/.test(base) || valueLooksSecret(base)) return '';
  return base;
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
  if (!result || !Array.isArray(result.found)) return '';
  const a = at && typeof at === 'object' ? at : {};
  const tool = a.tool || 'a tool';
  if (!result.found.length) {
    if (!result.partial) return '';
    return '[sshlg-skills] Labelled-credential scan PARTIAL — ' + tool
      + (a.where ? ` (${a.where})` : '')
      + ' printed more than 1 MiB in one field; only its first 768 KiB and last 256 KiB (4 MiB '
      + 'in all) were read for labelled credentials, and nothing was found there. The middle was '
      + 'not read: if it may hold configuration, read it in a value-free form.';
  }
  const names = result.found
    .map((f) => `${f.label}${f.count > 1 ? ` ×${f.count}` : ''}`).join(', ');
  return '[sshlg-skills] LABELLED CREDENTIAL IN OUTPUT — ' + tool
    + (a.where ? ` (${a.where})` : '')
    + ` printed a generated-looking value under ${names}. The value is not repeated here; it `
    + 'is in the transcript now and cannot be taken back.'
    + (result.partial ? ' (A long output: only the first 768 KiB and last 256 KiB of each field, 4 MiB in all, were read.)' : '')
    // The step that needs nothing but the provider comes first (N-5, USR-011): the hub
    // ships to people who installed the skills and nothing else.
    + '\nTreat it as exposed and rotate it: in the provider\'s console or CLI, write the new '
    + 'value to a file the consumer reads, created with mode 600 (umask 077), and never paste '
    + 'it into a command or a chat.'
    + '\nWith Observatory, through the owner\'s door: `observatory_credentials` names the project '
    + 'and slot, and the owner\'s door (`tools/<provider>.py`, or `vault.py put` on stdin) issues '
    + 'and stores the replacement; consumers then read it through '
    + USE_SECRET + ' run PROJECT NAME -- COMMAND. ' + NOT_ON_PATH
    + '\nThen change what printed it: a presence check (`[ -n "$NAME" ] && echo set`), a count '
    + '(`grep -c "^NAME=" FILE`) or a value-free format says the same without the value.'
    + '\nIf the value is a public test fixture or a documented example, this note is wrong '
    + 'about it: it reads the label and the value\'s shape, not where the value came from.';
}

module.exports = {
  scanLabelled, describe, outputText, outputParts, whereOf, labelIsSecret, valueLooksSecret,
  isPlaceholder, entropy, words, looksLikeIdentifier, programOf,
};
