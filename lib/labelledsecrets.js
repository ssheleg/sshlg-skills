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
 * symbols; one under 12 characters (`p4ssw0rd` in a doc URL) is not. A push registration
 * token (`deviceToken`, an FCM/APNs registration token) addresses a device and is not
 * reported; a session's `resumeToken` is. A local proxy's token: `<P>_AUTH_TOKEN` /
 * `<P>_API_KEY` beside an active loopback `<P>_BASE_URL` in the same file, by the narrow
 * rule at BASE_URL_LINE (Switchboard's managed sessions, SB-118).
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
 * 2. The VALUE must look generated: 16 to 4,096 characters of the token alphabet (a JWT, an
 *    RS256 bearer or `id_token`, an `aws_session_token` included), a letter
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
 * also when it found nothing — or when the caller's time budget ran out (`why: 'time'`).
 * Labels and values are captured atomically (no backtracking), a label never starts right
 * after `-`, and the file-scope reader is linear (`grepPrefix`). Not every quantifier is
 * bounded — a value's lookahead runs to the end of its token run — but each is consumed in
 * one step. A cheap pre-filter skips the regexes when no credential word occurs at all.
 *
 * Pure: strings in, a verdict out. The hook (hooks/post-tool-use.js) moves the bytes and
 * fails silent; this module returns null rather than throw on anything it does not know.
 */

const { LITERALS, USE_SECRET, NOT_ON_PATH } = require('./secrets.js');

const HEAD = 768 * 1024;
const TAIL = 256 * 1024;
const MIN_LEN = 16;
/**
 * The longest value read: an RS256 bearer or `id_token` runs 600–2,500 characters and an
 * `aws_session_token` about 800, and the first cut's 512 dropped all of them (round 3).
 */
const MAX_LEN = 4096;
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
/**
 * The same label, captured atomically: the whole run of label characters or nothing. With a
 * plain capture a run like `-a-a-a…` was tried at every length before the separator failed
 * (≈ 160 ms a MiB); a label is always the whole run before its separator anyway.
 */
const LABEL_AT = (n) => String.raw`(?=(${LABEL}))` + '\\' + n + String.raw`(?![A-Za-z0-9_.-])`;
/** A quote, or an escaped one (`\"password\":\"…\"` inside a JSON string). */
const Q = String.raw`(?:\\?["'])`;
/**
 * `label: value`, `label=value`, `"label": "value"`, `label => value`, `\"label\":\"value\"`,
 * and Laravel's `APP_KEY=base64:…`. Groups: 1 quote, 2 label, 3 separator, 4 quote, 5 value.
 * A label never starts right after `-`: inside a run like `-a-a-a…` every letter was a label
 * start, each one read 64 characters ahead (≈ 60 ms a MiB, round 3). `--label=value` is a FLAG.
 */
const ASSIGN = new RegExp(
  String.raw`(?:^|[^A-Za-z0-9_.-])(${Q}?)` + LABEL_AT(2) + String.raw`\1([ \t]*(?::|=>|=)[ \t]*)(${Q}?)(?:base64:)?`
  + VALUE(5), 'g');
/** `--label value` and `--label=value`, the shapes a process listing prints. */
const FLAG = new RegExp(String.raw`(?:^|[\s"'])--` + LABEL_AT(1) + String.raw`(?:[ \t]+|=)(["']?)` + VALUE(3), 'g');
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
  String.raw`(?:(?:^|[^A-Za-z0-9_.])\\?["']?` + LABEL_AT(1) + String.raw`\\?["']?[ \t]*(?::|=>|=)[ \t]*\\?["']?)?`
  + String.raw`\b([A-Za-z][A-Za-z0-9+.-]{1,20})://[^\s:/@"'<>]{0,128}:([^\s/@"'<>]{1,256})@(?=[A-Za-z0-9\[])`,
  'g');
/**
 * A local proxy's token: `<P>_BASE_URL` on loopback beside `<P>_AUTH_TOKEN` / `<P>_API_KEY`.
 * Switchboard's managed sessions (SB-118) put `ANTHROPIC_AUTH_TOKEN` in every project's
 * `.claude/settings.local.json` with `ANTHROPIC_BASE_URL=http://127.0.0.1:…`: the value
 * opens the local proxy only, and telling an agent to rotate it is noise that teaches it to
 * ignore the note.
 *
 * The skip is narrow, because a skip that is wrong hides a real remote key (rounds 2 and 3):
 * - a key on a comment line (`#` or `//`) is never skipped, and every key line counts;
 * - the base URL is read only on an active line;
 * - the base URL is read to the first whitespace; after quotes, commas and braces at its end
 *   are set aside, it must be exactly `http(s)://` + 127.x / `localhost` / `[::1]`, an
 *   optional port and an optional path free of `@`, `\`, quotes, `,` and `}` — so
 *   `http://localhost@evil.com`, `http://localhost"@evil.com"` and `…/v1@evil` are not loopback;
 * - no other `<P>_BASE_URL` of that prefix appears anywhere in the same file, commented or
 *   not, and there are no more such keys than loopback base URLs in it;
 * - the key is within 20 lines of one of those loopback base URLs (a JSON `env` object, one
 *   `.env` section). LIMIT, disclosed: output that concatenates files with no marker between
 *   them (`cat a b`) is one file to this rule; the count and distance rules are what keep a
 *   second file's key reported there;
 * - a file is: a Grep line's `path:line:` prefix, a `grep --heading` path line, a
 *   `==> path <==` header of `head`/`tail`, or a heredoc body (and what follows it).
 */
const BASE_URL_LINE = new RegExp(
  String.raw`(?:^|[^A-Za-z0-9_.])\\?["']?([A-Za-z_][A-Za-z0-9_]{0,63})_BASE_URL\\?["']?[ \t]*(?::|=)[ \t]*\\?(["']?)(\S*)`,
  'gi');
const LOOPBACK_URL =
  /^https?:\/\/(?:127(?:\.\d{1,3}){3}|localhost|\[::1\])(?::\d{1,5})?(?:\/[^@\\"',}\s]*)?$/i;
const KEY_LINE = /(?:^|[^A-Za-z0-9_.])\\?["']?([A-Za-z_][A-Za-z0-9_]{0,63})_(?:AUTH_TOKEN|API_KEY)\\?["']?[ \t]*(?::|=)/gi;
const COMMENT_LINE = /^[ \t]*(?:#|\/\/)/;
const PROXIMITY_LINES = 20;
const HEADER = /^==> (.+) <==$/;

/**
 * Is this base URL loopback? Unquoted, it is read to the first whitespace and must be a clean
 * loopback URL as a whole. Quoted, it ends at the matching quote (an escaped `\"` too), and
 * what follows that quote must close the value — a `,`, `}`, `]`, `;`, whitespace or the end.
 * `'http://localhost'@evil.com` is not loopback.
 */
function baseIsLoopback(quote, raw) {
  if (!quote) return LOOPBACK_URL.test(raw);
  const end = raw.indexOf(quote);
  if (end === -1) return false;
  const url = raw.slice(0, end).replace(/\\$/, '');
  if (!/^(?:[,}\];\s]|$)/.test(raw.slice(end + 1))) return false;
  return LOOPBACK_URL.test(url);
}

/**
 * The file a Grep result line names: `path:12:…`, `path-12-…`, or `path:…` when the path has
 * a `/` or is a dot-name. LINEAR: one indexOf for the first `:` within the first 4 KiB, then
 * plain tests of that token — the regex it replaces backtracked on a colon-free line dense
 * with `/` (1 MiB: 101 s, round 3).
 */
function grepPrefix(line) {
  const head = line.length > 4096 ? line.slice(0, 4096) : line;
  const colon = head.indexOf(':');
  if (colon <= 0) return null;
  const token = head.slice(0, colon);
  if (/\s/.test(token)) return null;
  const pathish = token.includes('/') || (token[0] === '.' && token.length > 1)
    || /^[^/]+\.[A-Za-z0-9]{1,8}$/.test(token);
  if (!pathish) return null;
  const rest = /^\d+[:-]/.exec(head.slice(colon + 1));
  return { path: token, length: colon + 1 + (rest ? rest[0].length : 0) };
}

/** A `grep --heading` file line: one path-like token alone on its line. */
function headingPath(line) {
  if (line.length > 1024 || /[\s:=]/.test(line)) return null;
  return line.includes('/') || /^\.[^/]+$/.test(line) || /^[^/]+\.[A-Za-z0-9]{1,8}$/.test(line)
    ? line : null;
}

const PROXY_LABEL = /^(.+)_(?:AUTH_TOKEN|API_KEY)$/i;

/** No credential word and no URL userinfo anywhere → nothing to do. */
const PREFILTER = /key|token|secret|pass|pwd|auth|cred|bearer|jwt|:\/\/[^\s\/@]{0,128}:[^\s\/@]{1,256}@/i;

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
  'revision', 'head', 'ref',
  // a push registration (`deviceToken`, an FCM/APNs registration token) addresses a device;
  // it does not authenticate anyone. `resumeToken`, a session's, IS reported.
  'device', 'registration', 'push', 'fcm', 'apns']);
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

// From this length a value is a generated token (a JWT, a session token), and random
// base64 spells a placeholder word often enough to drop a real one: 36 of 20,000 random
// 600-character JWTs (B-250). `-` and `_` are base64url letters too, so there a word counts
// only with a boundary on both sides (`….REDACTED`, `<YOUR_TOKEN>`), and an ascending run
// must reach 10. Shorter values keep the substring rule (`...EXAMPLEKEY` in docs) and 6.
const LONG_VALUE = 100;
const PLACEHOLDER_WORD = /(?:^|[^A-Za-z0-9])(?:redacted|placeholder|example|changeme|change_me|xxxx|dummy|fake|sample|replace|todo)(?=$|[^A-Za-z0-9])|(?:^|[^A-Za-z0-9])your[_-]|\*\*\*|\.\.\./i;
const ascendingLimit = (v) => (v.length >= LONG_VALUE ? 10 : 6);
function isPlaceholder(v) {
  const s = String(v);
  return s.length >= LONG_VALUE ? PLACEHOLDER_WORD.test(s) : PLACEHOLDER.test(s);
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
 * It needs a REAL case transition — a lower-case letter directly followed by an upper-case
 * one (`nM`, `lS`) — three to six segments, words of four or more letters covering most of
 * it, and few digits. All-lower or all-upper runs split by digits (`abcd3efgh5ijkl`, base32)
 * and word-digit-word passwords (`Sunshine7Butterfly`) have no such transition and are never
 * skipped (round 2: they were, 2.5–100% of the time).
 */
function looksLikeIdentifier(v) {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(v)) return false;
  if (!/[a-z][A-Z]/.test(v)) return false;
  if ((v.match(/\d/g) || []).length > 3) return false;
  const segs = v.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+/g) || [];
  if (segs.length > 6) return false;
  const alpha = segs.filter((x) => /^[A-Za-z]+$/.test(x));
  if (alpha.length < 3) return false;
  const long = alpha.filter((x) => x.length >= 4).reduce((n, x) => n + x.length, 0);
  return long / v.length >= 0.7;
}

/**
 * A Helm/Kubernetes object name: `s3-backup-credentials-prod`, `postgresql-k8s-auth`,
 * `oauth2-proxy-cookie-secret`. Lower case, three or more short hyphenated segments, few
 * digits, and not all hex (a UUID is all hex and may be a key).
 */
function looksLikeSlug(v) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+){2,}$/.test(v)) return false;
  const segs = v.split('-');
  if (segs.some((x) => x.length > 14)) return false;
  if ((v.match(/\d/g) || []).length > 4) return false;
  return segs.filter((x) => /[g-z]/.test(x)).length * 2 >= segs.length;
}

/** A password in URL userinfo: shorter and freer than a token, never a placeholder. */
function userinfoLooksSecret(raw) {
  let v = raw;
  try { v = decodeURIComponent(raw); } catch (e) { /* keep it encoded */ }
  if (v.length < 12 || v.length > 256) return false;
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return false;
  if (/^[$%{<*]/.test(v) || /\$\{|\{\{/.test(v)) return false;
  if (isPlaceholder(v) || /^(?:pass(?:word)?|secret|token)\d*$/i.test(v)) return false;
  if (ascendingRun(v) >= ascendingLimit(v)) return false;
  if (/^(?:[a-z]+|[A-Z][a-z]*|[A-Z]+)(?:[_-](?:[a-z]+|[A-Z][a-z]*|[A-Z]+))*[_-]?\d{0,4}$/.test(v)) {
    return false;                                                        // WORDS_LIKE_THIS_2026
  }
  return entropy(v) >= MIN_BITS;
}

/**
 * A generated value with no digit in it: about one Stripe `sk_live_` key in 70 has none, and
 * the letter-and-digit rule dropped them (round 2). Accepted when, after a short vendor
 * prefix (`sk_live_`, `gsk_`), it is at least 20 letters of both cases that break into
 * short case runs — three letters a run on average, where names run to words
 * (`getOwnPropertySymbols` averages seven) — at 3.5 bits per character or more. Measured on
 * 26,353 real mixed-case identifiers of 20+ letters: 2% pass (most of them base64 fragments,
 * the rest acronym-dense names like `getAllJSDocTagsOfKind`); 86% of digit-free random keys do.
 */
function digitFreeKey(v) {
  const body = v.replace(/^[a-z]{1,4}[_-](?:[a-z]{1,8}[_-])?/, '').replace(/[_-]/g, '');
  if (body.length < 20 || !/[a-z]/.test(body) || !/[A-Z]/.test(body)) return false;
  const runs = body.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g) || [];
  return body.length / runs.length <= 3 && entropy(body) >= 3.5;
}

/** Shape alone: does this value look generated? */
function valueLooksSecret(v) {
  if (typeof v !== 'string' || v.length < MIN_LEN || v.length > MAX_LEN) return false;
  if (!/[A-Za-z]/.test(v)) return false;                                 // numbers
  if (!/\d/.test(v) && !digitFreeKey(v)) return false;                  // words
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
  if (ascendingRun(v) >= ascendingLimit(v)) return false;                                // `…123456`, `abcdef…`
  if (looksLikeSlug(v)) return false;                                    // a k8s object name
  if (/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(v)) return false;          // an ENV_VAR_NAME_2
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

/** Thrown when the caller's time budget runs out; `scanLabelled` turns it into `why: 'time'`. */
const TIME_UP = Symbol('labelled scan time budget');
function tick(clock) {
  if (clock && Date.now() > clock.deadline) throw TIME_UP;
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
function scanLabelled(output, options) {
  const list = typeof output === 'string' ? [output]
    : Array.isArray(output) ? output.filter((x) => typeof x === 'string') : [];
  const opts = options && typeof options === 'object' ? options : {};
  const ms = Number.isFinite(opts.timeBudgetMs) && opts.timeBudgetMs > 0 ? opts.timeBudgetMs : Infinity;
  const clock = { deadline: Date.now() + ms };
  const byLabel = new Map();
  let windowed = false;       // a field over 1 MiB: its middle was not read
  let budgeted = false;       // the 4 MiB budget ran out: later fields, or their ends, were not read
  let timed = false;          // the time budget ran out: the rest was not read
  let budget = BUDGET;
  try {
    for (const part of list) {
      if (!part) continue;
      if (budget <= 0) { budgeted = true; break; }
      tick(clock);
      const w = window(part);
      let text = w.text;
      if (text.length > budget) { text = text.slice(0, budget); budgeted = true; }
      budget -= text.length;
      if (w.partial) windowed = true;
      scanText(text, byLabel, clock);
    }
  } catch (e) {
    if (e !== TIME_UP) throw e;
    timed = true;
  }
  const partial = windowed || budgeted || timed;
  const out = { found: [...byLabel.values()], partial };
  if (partial) out.why = timed ? 'time' : budgeted ? (windowed ? 'both' : 'budget') : 'field';
  if (!byLabel.size) return partial ? out : null;
  return out;
}

/**
 * The label a URL password is reported under: the assignment's own name when it names a
 * credential or a connection (`DATABASE_URL`, `REDIS_URI`, `SENTRY_DSN`, `DB_PASSWORD`),
 * else `<scheme>-url-password` — whatever word preceded the URL is not echoed unchecked.
 */
function userinfoLabel(label, scheme) {
  const sc = String(scheme).toLowerCase();
  const fallback = SCHEMES.has(sc) ? `${sc}-url-password` : 'url-password';
  if (!label) return fallback;
  if (labelIsSecret(label)) return label;
  const w = words(label);
  const noun = w[w.length - 1];
  if (['url', 'uri', 'dsn'].includes(noun)) return label;
  if (noun === 'string' && w.includes('connection')) return label;
  return fallback;
}

/** URL schemes echoed by name; anything else is reported as plain `url-password`. */
const SCHEMES = new Set(['http', 'https', 'postgres', 'postgresql', 'mysql', 'mariadb', 'mongodb',
  'mongodb+srv', 'redis', 'rediss', 'amqp', 'amqps', 'ftp', 'ftps', 'sftp', 'ssh', 'git', 'smtp',
  'smtps', 'imap', 'imaps', 'ldap', 'ldaps', 'mssql', 'sqlserver', 'jdbc', 's3', 'nats', 'kafka',
  'clickhouse', 'cockroachdb', 'snowflake', 'svn', 'ws', 'wss']);

/**
 * Words a label segment of eight or more characters may be made of and still be printed
 * whole: credential vocabulary and the provider and service names labels are built from.
 */
const LABEL_WORDS = new Set([...NOUNS, ...KEY_QUALIFIERS, ...NEUTRAL_QUALIFIERS, ...TRAILING,
  'key', 'keys', 'url', 'uri', 'dsn', 'access', 'application', 'client', 'server', 'service',
  'internal', 'external', 'private', 'webhook', 'session', 'refresh', 'account', 'admin',
  'master', 'database', 'postgres', 'postgresql', 'mysql', 'redis', 'mongo', 'mongodb', 'stripe',
  'github', 'gitlab', 'google', 'openai', 'anthropic', 'openrouter', 'cloudflare',
  'digitalocean', 'aws', 'azure', 'slack', 'linear', 'sentry', 'twilio', 'sendgrid', 'mailgun',
  'telegram', 'firebase', 'supabase', 'vercel', 'heroku', 'netlify', 'notion',
  'figma', 'discord', 'shopify', 'paypal', 'deepseek', 'groq', 'mistral', 'cohere',
  'huggingface', 'replicate', 'elevenlabs', 'pinecone', 'qdrant', 'algolia', 'mixpanel',
  'amplitude', 'datadog', 'newrelic', 'pagerduty', 'okta', 'auth0', 'clerk', 'apple', 'android',
  'mapbox', 'miniflare', 'wrangler', 'docker', 'registry', 'npm', 'pypi', 'connection',
  'string', 'encryption', 'signing', 'subscription', 'license', 'consumer', 'integration',
  'installation', 'personal', 'legacy', 'oauth', 'oauth2', 'hmac', 'cookie', 'basic', 'digest',
  'storage', 'bucket', 'cluster', 'gateway', 'provider', 'platform', 'production', 'development',
  'staging', 'secrets', 'tokens', 'passwords', 'bot', 'app', 'id', 'aws', 'gcp', 'r2', 's3',
  // ordinary words labels are built from
  'resume', 'upload', 'download', 'signup', 'signin', 'login', 'logout', 'verify', 'verification',
  'reset', 'invite', 'confirm', 'magic', 'link', 'identity', 'user', 'users', 'member', 'team',
  'organization', 'project', 'workspace', 'tenant', 'partner', 'merchant', 'customer', 'payment',
  'payments', 'billing', 'invoice', 'checkout', 'order', 'product', 'store', 'shop', 'market',
  'marketing', 'analytics', 'tracking', 'report', 'reports', 'metrics', 'monitor', 'monitoring',
  'logging', 'mail', 'email', 'notification', 'notifications', 'message', 'messages', 'chat',
  'voice', 'video', 'image', 'media', 'assets', 'files', 'file', 'origin', 'proxy', 'router',
  'tunnel', 'domain', 'website', 'frontend', 'backend', 'worker', 'workers', 'scheduler', 'queue',
  'stream', 'events', 'event', 'hook', 'hooks', 'deploy', 'deployment', 'release', 'build',
  'pipeline', 'runner', 'actions', 'install', 'instance', 'environment', 'configuration',
  'config', 'settings', 'global', 'local', 'remote', 'shared', 'common', 'system', 'machine',
  'device', 'mobile', 'desktop', 'browser', 'extension', 'plugin', 'agent', 'agents', 'model',
  'models', 'embedding', 'embeddings', 'search', 'index', 'vector', 'cache', 'backup', 'archive',
  'export', 'import', 'migration', 'firestore', 'realtime', 'messaging', 'analytics', 'ingest',
  'ingestion', 'telemetry', 'observability', 'observatory', 'fabric', 'switchboard',
  'publisher', 'growth', 'research', 'temporary', 'readonly', 'readwrite',
  'write', 'read', 'owner', 'operator', 'support', 'sandbox', 'livemode', 'endpoint', 'endpoints']);

/**
 * A label as the note may print it. A label can be glued to its value (round 3:
 * `<value>_token: …`, `x-<value>-key`), so a segment of eight or more characters is printed
 * whole only when every word in it is in LABEL_WORDS; otherwise only its first three
 * characters and `*`. Nothing longer than seven characters of an unknown word is ever printed.
 */
function safeLabel(label) {
  return cleanLabel(label).split(/([_.:\-]+)/).map((seg, i) => {
    if (i % 2 === 1 || seg.length < 8) return seg;
    const ws = seg.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+/g) || [];
    const known = ws.join('').length === seg.length
      && ws.every((w) => /^\d{1,2}$/.test(w) || LABEL_WORDS.has(w.toLowerCase()));
    return known ? seg : `${seg.slice(0, 3)}*`;
  }).join('');
}

/**
 * `(label, offset) → true` when that label at that offset is a local proxy's token (see
 * BASE_URL_LINE for the rule). Computed per call, line by line, only when a `_BASE_URL` is
 * in the text at all.
 */
function proxyScope(text, clock) {
  if (typeof text !== 'string' || !/_BASE_URL/i.test(text)) return () => false;
  const starts = [];
  const scopes = [];
  const comments = [];
  const stats = new Map();
  const at = (scope, prefix) => {
    const k = `${scope}\u0000${prefix.toLowerCase()}`;
    let st = stats.get(k);
    if (!st) { st = { loopLines: [], other: 0, keys: 0 }; stats.set(k, st); }
    return st;
  };
  let scope = '';
  let heredoc = null;
  let pos = 0;
  let n = 0;
  while (pos <= text.length) {
    if ((n += 1) % 4096 === 0) tick(clock);
    let nl = text.indexOf('\n', pos);
    if (nl === -1) nl = text.length;
    const line = text.slice(pos, nl);
    const idx = starts.length;
    const h = line.length < 4096 && line.startsWith('==> ') ? HEADER.exec(line) : null;
    const hp = h ? null : headingPath(line);
    if (h) scope = `file:${h[1]}`;
    else if (hp) scope = `file:${hp}`;
    // A heredoc's body is another file (`cat > dev.env <<EOF … EOF`), and so is what follows it.
    if (heredoc && line.trim() === heredoc) { heredoc = null; scope = `after-heredoc:${idx}`; }
    else if (!heredoc && line.length < 4096) {
      const hd = /<<-?[ \t]*["']?([A-Za-z_][A-Za-z0-9_]*)["']?/.exec(line);
      if (hd) { heredoc = hd[1]; scope = `heredoc:${idx}`; }
    }
    const g = h || hp ? null : grepPrefix(line);
    const lscope = g ? `file:${g.path}` : scope;
    const body = g ? line.slice(g.length) : line;
    const comment = COMMENT_LINE.test(body);
    starts.push(pos);
    scopes.push(lscope);
    comments.push(comment);
    if (!h && !hp && /_BASE_URL|_AUTH_TOKEN|_API_KEY/i.test(body)) {
      BASE_URL_LINE.lastIndex = 0;
      let m;
      while ((m = BASE_URL_LINE.exec(body)) !== null) {
        if (baseIsLoopback(m[2], m[3])) { if (!comment) at(lscope, m[1]).loopLines.push(idx); }
        else if (m[3]) at(lscope, m[1]).other += 1;    // remote, or not a URL: never skip
      }
      KEY_LINE.lastIndex = 0;
      while ((m = KEY_LINE.exec(body)) !== null) at(lscope, m[1]).keys += 1;   // commented too
    }
    pos = nl + 1;
  }
  return (label, offset) => {
    const p = PROXY_LABEL.exec(String(label));
    if (!p) return false;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {                          // the last line starting at or before offset
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    if (comments[lo]) return false;            // a commented key always reports
    const st = stats.get(`${scopes[lo]}\u0000${p[1].replace(/^_+/, '').toLowerCase()}`)
      || stats.get(`${scopes[lo]}\u0000${p[1].toLowerCase()}`);
    if (!st || !st.loopLines.length || st.other !== 0 || st.keys > st.loopLines.length) return false;
    return st.loopLines.some((b) => Math.abs(b - lo) <= PROXIMITY_LINES);
  };
}

function scanText(text, byLabel, clock) {
  if (!PREFILTER.test(text)) return;

  const seen = new Set();                    // value offsets already attributed
  const add = (label, value, at) => {
    if (seen.has(at)) return;
    seen.add(at);
    if (vendorLiteral(value)) return;        // secrets.scan names it, by vendor
    const key = label.toLowerCase();
    const row = byLabel.get(key);
    if (row) row.count += 1;
    else byLabel.set(key, { label: safeLabel(label), count: 1 });
  };
  const run = (rx, onMatch) => {
    rx.lastIndex = 0;
    let m;
    let k = 0;
    while ((m = rx.exec(text)) !== null) {
      if ((k += 1) % 256 === 0) tick(clock);
      onMatch(m);
      if (m[0].length === 0) rx.lastIndex += 1;
    }
  };
  const end = (m) => m.index + m[0].length;

  // A local proxy's AUTH_TOKEN / API_KEY, by the narrow rule at BASE_URL_LINE.
  const proxied = proxyScope(text, clock);

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
    if (!labelIsSecret(label) || !valueLooksSecret(v) || proxied(label, m.index + m[0].indexOf(label))) return;
    if (looksLikeCode(v, text[end(m)])) return;
    if (!m[4] && looksLikeIdentifier(v)) return;
    add(label, v, end(m) - v.length);
  });
  run(FLAG, (m) => {
    const label = m[1];
    const v = m[3];
    if (!labelIsSecret(label) || !valueLooksSecret(v) || proxied(label, m.index + m[0].indexOf(label))) return;
    if (looksLikeCode(v, text[end(m)])) return;
    if (!m[2] && looksLikeIdentifier(v)) return;           // quoted: a value, not a name
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
      add(userinfoLabel(m[1], m[2]), v, end(m) - v.length);
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

/** What a partial scan left unread, in the reader's terms. */
function partialWhat(why) {
  const field = 'a field over 1 MiB is read as its first 768 KiB and last 256 KiB, so its middle '
    + 'was not read.';
  const budget = 'at most 4 MiB is read across all fields, so later fields (or their ends) were '
    + 'not read.';
  if (why === 'time') return 'the scan ran out of its time budget, so the rest of the output was not read.';
  if (why === 'budget') return budget;
  if (why === 'both') return `${field} And ${budget}`;
  return field;
}

/** The note the hook prints. Empty when there is nothing to say. */
function describe(result, at) {
  if (!result || !Array.isArray(result.found)) return '';
  const a = at && typeof at === 'object' ? at : {};
  const tool = a.tool || 'a tool';
  if (!result.found.length) {
    if (!result.partial) return '';
    return '[sshlg-skills] Labelled-credential scan PARTIAL: ' + tool
      + (a.where ? ` (${a.where})` : '')
      + ` printed more than this scan reads; ${partialWhat(result.why)} Nothing was found in what `
      + 'was read. If the rest may hold configuration, read it in a value-free form.';
  }
  const names = result.found
    .map((f) => `${f.label}${f.count > 1 ? ` ×${f.count}` : ''}`).join(', ');
  return '[sshlg-skills] LABELLED CREDENTIAL IN OUTPUT: ' + tool
    + (a.where ? ` (${a.where})` : '')
    + ` printed a generated-looking value under ${names}. The value is not repeated here; it `
    + 'is in the transcript now and cannot be taken back.'
    + (result.partial ? ` (A long output: ${partialWhat(result.why)})` : '')
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
  isPlaceholder, entropy, words, looksLikeIdentifier, looksLikeSlug, programOf, proxyScope,
  safeLabel, grepPrefix, MAX_LEN, PATTERNS: { ASSIGN, FLAG, USERINFO },
};
