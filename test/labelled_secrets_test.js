#!/usr/bin/env node
'use strict';
// The PostToolUse layer that reads a credential by its LABEL (I-6 remainder, OPS-002).
//
// `secrets.scan` knows vendor prefixes (`sk-or-v1-`, `ghp_`, `AKIA` …). A key with no
// prefix printed under a name that says what it is — `x-api-key: …`, `FOO_API_KEY=…`,
// `Authorization: Bearer …` — went past it. This detector reads the label and judges the
// value by its shape, and it reports the LABEL, never the value.
//
// Every secret-looking value here is generated at run time from `crypto.randomBytes`:
// no key-shaped literal sits in this file for the repository's own scanners to trip on,
// and none is a real credential. The false-positive half matters as much as the true
// half: a detector that cries wolf on hashes, ids and code is switched off within a week.

const assert = require('assert');
const crypto = require('crypto');
const L = require('../lib/labelledsecrets.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

/** A fresh random value, never a placeholder word by accident. */
function randomValue(kind, bytes) {
  for (;;) {
    const b = crypto.randomBytes(bytes || 24);
    const v = kind === 'hex' ? b.toString('hex') : b.toString('base64url');
    // base64url of random bytes can (rarely) spell a placeholder word or lack a digit;
    // a fixture must not depend on luck in either direction.
    if (!L.isPlaceholder(v) && /\d/.test(v) && /[A-Za-z]/.test(v)) return v;
  }
}
const V = () => randomValue('b64', 24);
const HEX = () => randomValue('hex', 20);
const JWTISH = () => [randomValue('b64', 12), randomValue('b64', 30), randomValue('b64', 24)].join('.');
const BASIC = () => Buffer.from(`svc-user:${randomValue('b64', 18)}`).toString('base64');

function labels(r) { return r ? r.found.map((f) => f.label) : []; }

// ── Labelled values the detector must report ────────────────────────────────
const REPORTED = [
  ['an x-*-key header, curl -v style', () => `> X-Api-Key: ${V()}\n> Accept: */*`, ['X-Api-Key']],
  ['a lower-case x-*-key header', () => `x-goog-api-key: ${V()}`, ['x-goog-api-key']],
  ['an env file line', () => `PORT=3000\nOPENROUTER_API_KEY=${V()}\nDEBUG=1`, ['OPENROUTER_API_KEY']],
  ['an exported env line, hex value', () => `export SERVICE_TOKEN=${HEX()}`, ['SERVICE_TOKEN']],
  ['Authorization: Bearer', () => `Authorization: Bearer ${JWTISH()}`, ['Authorization']],
  ['Authorization: Basic', () => `authorization: Basic ${BASIC()}`, ['authorization']],
  ['a JSON config key', () => `{"name":"svc","apiKey":"${V()}","region":"eu"}`, ['apiKey']],
  ['a YAML key', () => `client:\n  client_secret: ${V()}\n  timeout: 30`, ['client_secret']],
  ['api-key with a colon', () => `api-key: ${V()}`, ['api-key']],
  ['a command-line flag with =', () => `node srv.js --api-key=${V()} --port 8080`, ['api-key']],
  ['a command-line flag with a space (ps output)', () => `deploy --token ${V()} --env prod`, ['token']],
  ['a database password', () => `DB_PASSWORD='${V()}'`, ['DB_PASSWORD']],
  ['an id_token is a token, not an id', () => `"id_token": "${JWTISH()}"`, ['id_token']],
  ['a refresh token', () => `refresh_token=${V()}&grant_type=refresh`, ['refresh_token']],
  ['a key with a trailing qualifier', () => `STRIPE_SECRET_KEY_LIVE=${V()}`, ['STRIPE_SECRET_KEY_LIVE']],
  ['docker inspect Env', () => `"Env": ["PATH=/usr/bin", "WEBHOOK_SECRET=${V()}"]`, ['WEBHOOK_SECRET']],
  ['a bare Bearer in a log line', () => `sending request with Bearer ${JWTISH()} to upstream`, ['Bearer']],
  ['several labels, counted', () => `A_TOKEN=${V()}\nA_TOKEN=${V()}\nx-auth-token: ${V()}`, ['A_TOKEN', 'x-auth-token']],
];

for (const [name, make, want] of REPORTED) {
  it(`reports: ${name}`, () => {
    const text = make();
    const r = L.scanLabelled(text);
    assert.ok(r, 'a labelled credential was not noticed');
    assert.deepStrictEqual(labels(r), want);
  });
}

it('counts a repeated label once with its count', () => {
  const r = L.scanLabelled(`A_TOKEN=${V()}\nA_TOKEN=${V()}`);
  assert.strictEqual(r.found.length, 1);
  assert.strictEqual(r.found[0].count, 2);
});

it('the report never carries the value — not in found, not in the note', () => {
  const values = [V(), HEX(), JWTISH(), BASIC()];
  const text = `X-Api-Key: ${values[0]}\nFOO_TOKEN=${values[1]}\n`
    + `Authorization: Bearer ${values[2]}\nauthorization: Basic ${values[3]}`;
  const r = L.scanLabelled(text);
  assert.ok(r && r.found.length === 3, `expected three labels, got ${JSON.stringify(labels(r))}`);
  const note = L.describe(r, { tool: 'Bash', where: 'curl' });
  const serialised = JSON.stringify(r) + note;
  for (const v of values) {
    assert.ok(!serialised.includes(v), 'the report repeats a value it found');
    // not even a recognisable slice of it
    assert.ok(!serialised.includes(v.slice(0, 8)) && !serialised.includes(v.slice(-6)),
      'the report repeats part of a value it found');
  }
});

it('the note names the label, the tool and where, and gives the remedy with the not-on-PATH step', () => {
  const S = require('../lib/secrets.js');
  const r = L.scanLabelled(`X-Api-Key: ${V()}`);
  const note = L.describe(r, { tool: 'Read', where: '/srv/app/config.yaml' });
  assert.match(note, /X-Api-Key/);
  assert.match(note, /Read/);
  assert.match(note, /\/srv\/app\/config\.yaml/);
  assert.match(note, /rotate/i);
  assert.ok(note.includes(S.USE_SECRET) || /observatory_credentials/.test(note),
    'the remedy does not name the owner\'s door');
  const free = note.search(/mode 600/);
  const obs = note.search(/vault\.py|use_secret\.py|project-observatory|observatory_credentials/);
  assert.ok(free !== -1, 'no step for a machine without Observatory');
  assert.ok(free < obs, 'the Observatory step comes before the step that needs nothing (N-5)');
  assert.ok(note.includes(S.NOT_ON_PATH), 'names use_secret.py without the not-on-PATH sentence');
  assert.match(note, /not repeated/i, 'the note does not say the value is withheld');
});

// ── Fix cycle 1 (round-1 adversarial review of #224) ─────────────────────────
// L2: shapes the first cut missed.
const B64SLASH = () => {
  for (;;) {
    const v = '/' + crypto.randomBytes(30).toString('base64').slice(1);
    if (/\d/.test(v) && /[+=]|^\/[^/]*$/.test(v) && !L.isPlaceholder(v)) return v;
  }
};
const REPORTED_2 = [
  ['escaped-quote JSON (a SecretString)', () => `"SecretString": "{\\"username\\":\\"svc\\",\\"password\\":\\"${V()}\\"}"`, ['password']],
  ['.netrc on one line', () => `machine api.example.com login svc password ${V()}`, ['password']],
  ['.netrc one field per line', () => `machine api.example.com\n  login svc\n  password ${V()}\n`, ['password']],
  ['URL userinfo under DATABASE_URL', () => `DATABASE_URL=postgres://app_user:${V()}@db.internal:5432/app`, ['DATABASE_URL']],
  ['URL userinfo with no label', () => `cloning https://x-access-token:${V()}@github.com/org/repo.git`, ['https-url-password']],
  ['npmrc _authToken', () => `//registry.npmjs.org/:_authToken=${V()}`, ['_authToken']],
  ['a label starting with _', () => `_SECRET_TOKEN=${V()}`, ['_SECRET_TOKEN']],
  ['a base64 value starting with /', () => `CLIENT_SECRET=${B64SLASH()}`, ['CLIENT_SECRET']],
  ['Laravel APP_KEY=base64:', () => {
    // a value with no digit is not reported (a word-only value is not a key); 1 in 1,500
    // random 32-byte keys has none, so the fixture draws one that does
    for (;;) { const b = crypto.randomBytes(32).toString('base64'); if (/\d/.test(b)) return `APP_KEY=base64:${b}`; }
  }, ['APP_KEY']],
  // M1's other half: a token beside a REMOTE base URL is still a credential.
  ['an AUTH_TOKEN beside a remote BASE_URL', () => `ANTHROPIC_BASE_URL=https://gateway.example.com\nANTHROPIC_AUTH_TOKEN=${V()}`, ['ANTHROPIC_AUTH_TOKEN']],
  ['a loopback BASE_URL silences only its own prefix', () => `OTHER_BASE_URL=http://127.0.0.1:8080\nANTHROPIC_AUTH_TOKEN=${V()}`, ['ANTHROPIC_AUTH_TOKEN']],
];
for (const [name, make, want] of REPORTED_2) {
  it(`reports (fix 1): ${name}`, () => {
    const r = L.scanLabelled(make());
    assert.ok(r && r.found.length, 'a labelled credential was not noticed');
    assert.deepStrictEqual(labels(r), want);
  });
}
const SILENT_2 = [
  // M1: Switchboard's managed sessions (SB-118) — a local proxy's token, not a vendor key.
  ['a Switchboard proxy token in settings.local.json',
   () => `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://127.0.0.1:47219",\n    "ANTHROPIC_AUTH_TOKEN": "${V()}"\n  }\n}`],
  ['the same from env | grep ANTHROPIC',
   () => `ANTHROPIC_AUTH_TOKEN=${V()}\nANTHROPIC_BASE_URL=http://localhost:47219/`],
  ['an API_KEY beside a [::1] base URL', () => `OPENAI_BASE_URL=http://[::1]:9000/v1\nOPENAI_API_KEY=${V()}`],
  // L2 negatives
  ['a URL with a placeholder password', () => 'postgres://user:password@localhost:5432/db'],
  ['a URL with an expansion for a password', () => 'DATABASE_URL=postgres://app:${DB_PASSWORD}@db:5432/app'],
  ['a URL with a user and no password', () => 'https://someone@example.com/path'],
  ['an ssh remote', () => 'git@github.com:org/repo.git'],
  // measured in a member's verification record (fix 1 corpus rerun)
  ['a URL whose user and host say it is fake', () => `postgresql://fakeuser:${V()}@fake.rds.amazonaws.com/fakedb`],
  ['a URL password made of words', () => 'postgresql://app:SENTINEL_PASSWORD_2026@db.internal/app'],
  ['prose: password changed', () => 'password changed successfully for user svc-2026'],
  ['a netrc password that is a word', () => 'machine h login u password hunter2'],
  ['a rooted path under a secret name', () => 'CLIENT_SECRET_FILE=/var/run/secrets/app-2026/token'],
  // L3: one identifier made of words
  ['an identifier: AuthenticationMD5Password', () => 'password: AuthenticationMD5Password'],
  ['an identifier: experimentalS3Credentials', () => 'credentials=experimentalS3Credentials'],
];
for (const [name, make] of SILENT_2) {
  it(`silent (fix 1): ${name}`, () => {
    const r = L.scanLabelled(make());
    assert.strictEqual(r, null, `false positive on ${JSON.stringify(labels(r))}`);
  });
}

it('a real vendor key beside a loopback BASE_URL is still secrets.scan\'s to report (M1)', () => {
  const vendor = 'sk-' + 'ant-' + randomValue('b64', 30);
  const text = `ANTHROPIC_BASE_URL=http://127.0.0.1:47219\nANTHROPIC_AUTH_TOKEN=${vendor}`;
  assert.strictEqual(L.scanLabelled(text), null);
  assert.ok(require('../lib/secrets.js').scan(text), 'secrets.scan lost the vendor key');
});

it('outputText keeps every byte for secrets.scan; scanLabelled windows each part (M2)', () => {
  const stdout = 'x'.repeat(Math.ceil(1.1 * 1024 * 1024));
  const vendor = 'gh' + 'p_' + randomValue('hex', 20);
  const text = L.outputText({ stdout, stderr: `fatal: ${vendor}` });
  assert.ok(text.includes(vendor), 'stderr after 1.1 MiB of stdout was dropped');
  assert.ok(require('../lib/secrets.js').scan(text), 'secrets.scan does not see it');
  const r = L.scanLabelled(L.outputParts({ stdout, stderr: `DEPLOY_TOKEN=${V()}` }));
  assert.ok(r && labels(r).includes('DEPLOY_TOKEN'), 'a short stderr beside a long stdout was not scanned');
});

it('a partial scan that found nothing still says so (L2)', () => {
  const r = L.scanLabelled('y'.repeat(2 * 1024 * 1024));
  assert.deepStrictEqual(r, { found: [], partial: true, why: 'field' });
  assert.match(L.describe(r, { tool: 'Bash', where: 'cat' }), /PARTIAL/);
  assert.strictEqual(L.describe(null, { tool: 'Bash' }), '');
});

it('no backtracking blow-up: a MiB of `=a=a…` and other runs stay fast (L1)', () => {
  const MiB = 1024 * 1024;
  const inputs = [
    // the pre-filter must pass, or the regexes never run: be8182f took 2.4 s on these two
    'token\n' + '=a'.repeat(MiB / 2),
    'api_key' + '=a'.repeat(MiB / 2),
    'x-api-key: ' + 'a'.repeat(MiB),
    'Authorization: Bearer ' + 'b='.repeat(MiB / 2),
    ('password ' + 'c1'.repeat(40) + '\n').repeat(10000),
    'https://' + 'u:'.repeat(MiB / 2),
    '--token ' + 'd'.repeat(MiB),
  ];
  for (const s of inputs) {
    const t0 = Date.now();
    L.scanLabelled(s);
    const ms = Date.now() - t0;
    assert.ok(ms < 1000, `${JSON.stringify(s.slice(0, 20))}… took ${ms} ms`);
  }
});

it('the program name is argv[0] only — a second word can be a secret (L4)', () => {
  const short = 's3cR' + randomValue('b64', 6).slice(0, 6);
  assert.strictEqual(L.programOf(`login ${short} --x`), 'login');
  assert.strictEqual(L.programOf('/usr/bin/curl -sS https://x'), 'curl');
  assert.strictEqual(L.programOf(`API_KEY=${short} curl https://x`), '');
  assert.strictEqual(L.programOf('"quoted" thing'), '');
  const w = L.whereOf({ tool_name: 'Bash', tool_input: { command: `mysql -u root -p${short}` } });
  assert.strictEqual(w.where, 'mysql');
  assert.ok(!JSON.stringify(w).includes(short));
});

// ── Fix cycle 2 (round-2 adversarial review of #224 at 6fb3fc2) ──────────────
// MEDIUM: the loopback skip must never hide a remote key. These key shapes have no entry in
// secrets.LITERALS, so if the labelled detector is silent, nothing reports them.
const alnum = (n) => { let o = ''; while (o.length < n) o += crypto.randomBytes(n).toString('base64').replace(/[^A-Za-z0-9]/g, ''); return o.slice(0, n); };
const REMOTE_KEYS = {
  'legacy sk-': () => 's' + 'k-' + alnum(48),
  'DeepSeek sk-<hex>': () => 's' + 'k-' + crypto.randomBytes(16).toString('hex'),
  'Groq gsk_': () => 'g' + 'sk_' + alnum(52),
  'Stripe sk_live_': () => 's' + 'k_' + 'live_' + alnum(24),
};
const LOOP = 'OPENAI_BASE_URL=http://localhost:11434/v1';
const REMOTE = 'OPENAI_BASE_URL=https://api.openai.com/v1';
const LOOPBACK_MISSES = [
  ['a commented loopback, then an active remote', (k) => `# ${LOOP}\n${REMOTE}\nOPENAI_API_KEY=${k}`],
  ['a // commented loopback', (k) => `// ${LOOP}\nOPENAI_API_KEY=${k}`],
  ['an active loopback overridden by a remote', (k) => `${LOOP}\n${REMOTE}\nOPENAI_API_KEY=${k}`],
  ['.env.development then .env.production, concatenated', (k) => `${LOOP}\nOPENAI_API_KEY=${V()}\n\nOPENAI_API_KEY=${k}`],
  ['concatenated, the production half with its own remote base', (k) => `${LOOP}\nOPENAI_API_KEY=${V()}\n${REMOTE}\nOPENAI_API_KEY=${k}`],
  ['Grep lines from two files', (k) => `apps/dev/.env:1:${LOOP}\napps/prod/.env:3:OPENAI_API_KEY=${k}`],
  ['head of two files', (k) => `==> .env.development <==\n${LOOP}\n\n==> .env.production <==\nOPENAI_API_KEY=${k}`],
  ['userinfo host: localhost@evil.com', (k) => `OPENAI_BASE_URL=http://localhost@evil.com\nOPENAI_API_KEY=${k}`],
  ['userinfo host: [::1]@evil', (k) => `OPENAI_BASE_URL=http://[::1]@evil\nOPENAI_API_KEY=${k}`],
  ['userinfo host: 127.0.0.1:443@api.evil.com', (k) => `OPENAI_BASE_URL=https://127.0.0.1:443@api.evil.com\nOPENAI_API_KEY=${k}`],
  ['a loopback-looking host name', (k) => `OPENAI_BASE_URL=http://localhost.evil.com/v1\nOPENAI_API_KEY=${k}`],
];
// Whether each vendor shape LOOKS generated is measured once, below, as a rate; the scoping
// fixtures draw a key that does, so a rare shape miss is not read as a scoping miss.
const drawKey = (gen) => { for (;;) { const k = gen(); if (L.valueLooksSecret(k)) return k; } };
for (const [kind, gen] of Object.entries(REMOTE_KEYS)) {
  it(`vendor shape ${kind} reads as generated in at least 99.5% of draws (fix 2)`, () => {
    let miss = 0;
    for (let i = 0; i < 5000; i += 1) if (!L.valueLooksSecret(gen())) miss += 1;
    assert.ok(miss <= 25, `${miss} of 5000 ${kind} keys did not read as generated`);
  });
}
for (const [shape, make] of LOOPBACK_MISSES) {
  for (const [kind, key] of Object.entries(REMOTE_KEYS)) {
    it(`reports (fix 2, M): ${shape} — ${kind}`, () => {
      const text = make(drawKey(key));
      const r = L.scanLabelled(text);
      assert.ok(r && labels(r).includes('OPENAI_API_KEY'), 'a remote key was hidden by the loopback skip');
      // and nothing else would have said it: the vendor scan has no literal for this shape
      assert.strictEqual(require('../lib/secrets.js').scan(text), null);
    });
  }
}
const LOOPBACK_KEPT = [
  ['the Switchboard settings shape, multi-line', () => `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://127.0.0.1:47219",\n    "ANTHROPIC_AUTH_TOKEN": "${V()}"\n  }\n}`],
  ['a loopback with a path', () => `${LOOP}\nOPENAI_API_KEY=${V()}`],
  ['Grep lines from ONE file', () => `p/.claude/settings.local.json:3:  "ANTHROPIC_BASE_URL": "http://127.0.0.1:47219",\np/.claude/settings.local.json:4:  "ANTHROPIC_AUTH_TOKEN": "${V()}"`],
  ['two files, each with its own loopback', () => `==> a/.env <==\n${LOOP}\nOPENAI_API_KEY=${V()}\n==> b/.env <==\n${LOOP}\nOPENAI_API_KEY=${V()}`],
];
for (const [name, make] of LOOPBACK_KEPT) {
  it(`silent (fix 2, M): ${name}`, () => {
    const r = L.scanLabelled(make());
    assert.strictEqual(r, null, `reported ${JSON.stringify(labels(r))}`);
  });
}

// LOW: the identifier skip needs a real case transition. Property tests over generated values.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base32 = (n) => Array.from(crypto.randomBytes(n), (b) => B32[b & 31]).join('');
const lowerAlnum = (n) => Array.from(crypto.randomBytes(n), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
const WORDS = ['sunshine', 'butterfly', 'mountain', 'harbor', 'violet', 'thunder', 'garden', 'silver', 'rocket', 'meadow', 'falcon', 'winter'];
const pick = () => WORDS[crypto.randomBytes(1)[0] % WORDS.length];
const cap = (w) => (crypto.randomBytes(1)[0] & 1 ? w[0].toUpperCase() + w.slice(1) : w);
const wordDigitWord = () => `${cap(pick())}${crypto.randomBytes(1)[0] % 10}${cap(pick())}${crypto.randomBytes(1)[0] % 100}`;
const d1 = () => crypto.randomBytes(1)[0] % 10;
const wordDigitWord3 = () => `${cap(pick())}${d1()}${cap(pick())}${d1()}${cap(pick())}`;
for (const [name, gen] of [
  ['base32 ×16', () => base32(16)], ['base32 ×32', () => base32(32)],
  ['lower alnum ×20', () => lowerAlnum(20)], ['lower alnum ×24', () => lowerAlnum(24)],
  ['word-digit-word', wordDigitWord], ['word-digit-word-digit-word', wordDigitWord3],
]) {
  it(`property (fix 2): ${name} is never skipped as an identifier, and is reported when it looks generated`, () => {
    for (let i = 0; i < 2000; i += 1) {
      const v = gen();
      assert.ok(!L.looksLikeIdentifier(v), `skipped as an identifier: shape ${v.replace(/[a-z]/g, 'a').replace(/[A-Z]/g, 'A').replace(/\d/g, '9')}`);
      if (L.valueLooksSecret(v)) assert.ok(L.scanLabelled(`DB_PASSWORD=${v}`), 'a generated value under a label was not reported');
    }
  });
}
it('the identifier skip still holds for camelCase and TitleCase words (fix 2)', () => {
  for (const v of ['AuthenticationMD5Password', 'experimentalS3Credentials', 'clientCredentialsFlowEnabled']) {
    assert.ok(L.looksLikeIdentifier(v), v);
  }
});
it('a quoted FLAG value is a value, even when it reads like words (fix 2)', () => {
  // composed at run time, so this file itself reads silent to the detector it tests
  const id = ['Authentication', 'MD5', 'Password'].join('');
  assert.ok(L.scanLabelled(`deploy --password "${id}"`));
  assert.strictEqual(L.scanLabelled(`deploy --password ${id}`), null);
});

// LOW: Helm / Kubernetes object names are names.
for (const slug of ['s3-backup-credentials-prod', 'postgresql-k8s-auth', 'oauth2-proxy-cookie-secret', 'grafana-admin-credentials']) {
  it(`silent (fix 2): a k8s object name ${slug}`, () => {
    assert.strictEqual(L.scanLabelled(`existingSecret: ${slug}\nsecretName: ${slug}\nCLIENT_SECRET=${slug}`), null);
  });
}
it('a UUID under a secret label is still reported — it is all hex, not a name (fix 2)', () => {
  assert.ok(L.scanLabelled(`API_KEY=${crypto.randomUUID()}`));
});

// LOW: the userinfo label is echoed only when it names a credential or a connection.
it('userinfo: a connection or credential label is kept, anything else falls back (fix 2)', () => {
  const pw = V();
  assert.deepStrictEqual(labels(L.scanLabelled(`REDIS_URI=redis://default:${pw}@cache.internal:6379`)), ['REDIS_URI']);
  assert.deepStrictEqual(labels(L.scanLabelled(`DB_PASSWORD_URL=postgres://a:${pw}@db.internal/x`)), ['DB_PASSWORD_URL']);
  assert.deepStrictEqual(labels(L.scanLabelled(`motd=postgres://a:${pw}@db.internal/x`)), ['postgres-url-password']);
  assert.deepStrictEqual(labels(L.scanLabelled(`"note": "see https://a:${pw}@db.internal/x"`)), ['https-url-password']);
});

// LOW: the linear slow path.
it('no slow path on label-shaped filler: `-a-a-a…`, per line and in one line (fix 2)', () => {
  const MiB = 1024 * 1024;
  for (const s of ['token\n' + '-a'.repeat(MiB / 2), ('token ' + '-a'.repeat(200) + '\n').repeat(2600),
                   'x a-a-a-a=' + '-a'.repeat(MiB / 2) + ' token']) {
    const t0 = Date.now();
    L.scanLabelled(s);
    const ms = Date.now() - t0;
    assert.ok(ms < 1000, `took ${ms} ms`);
  }
});

// INFO: choices, held by fixtures.
it('a push registration token is not reported; a session resume token is (fix 2, documented)', () => {
  assert.strictEqual(L.scanLabelled(`deviceToken=${HEX()}${HEX()}`), null);
  assert.strictEqual(L.scanLabelled(`"registration_token": "${V()}"`), null);
  assert.deepStrictEqual(labels(L.scanLabelled(`resumeToken=${V()}`)), ['resumeToken']);
});
it('a short doc password in a URL is not reported (under 12 characters; documented)', () => {
  assert.strictEqual(L.scanLabelled('DATABASE_URL=postgres://admin:p4ssw0rd@db.internal:5432/app'), null);
});
it('the PARTIAL note names the cause: a long field, or the 4 MiB budget across fields (fix 2)', () => {
  const field = L.scanLabelled('y'.repeat(2 * 1024 * 1024));
  assert.strictEqual(field.why, 'field');
  assert.match(L.describe(field, {}), /its middle/);
  const parts = Array.from({ length: 5 }, () => 'z'.repeat(1024 * 1024));
  const budget = L.scanLabelled(parts);
  assert.strictEqual(budget.why, 'budget');
  const note = L.describe(budget, {});
  assert.match(note, /4 MiB is read across all fields/);
  assert.ok(!/its middle/.test(note), 'the budget case is worded as a long field');
});

// ── Fix cycle 3 (round-3 adversarial review of #224 at 4535829) ──────────────
const b64u = (n) => crypto.randomBytes(n).toString('base64url');
/** An RS256-shaped JWT of exactly `len` characters (header.payload.signature). */
const jwtOf = (len) => {
  const head = 'eyJ' + b64u(27);
  const sig = b64u(256).slice(0, 342);
  const bodyLen = len - head.length - sig.length - 2;
  let body = 'eyJ';
  while (body.length < bodyLen) body += b64u(64);
  return `${head}.${body.slice(0, bodyLen)}.${sig}`;
};
const OPENAI_LOCAL = 'OPENAI_BASE_URL=http://localhost:4000';
const realKey = () => drawKey(REMOTE_KEYS['legacy sk-']);

// M1: a commented key is never a proxy's, and every key line counts.
for (const [name, make] of [
  ['loopback + local key + commented real key', () => `${OPENAI_LOCAL}\nOPENAI_API_KEY=${realKey()}\n# OPENAI_API_KEY=${realKey()}`],
  ['loopback + commented key alone', () => `${OPENAI_LOCAL}\n# OPENAI_API_KEY=${realKey()}`],
  ['loopback + // commented key alone', () => `${OPENAI_LOCAL}\n// OPENAI_API_KEY=${realKey()}`],
]) {
  it(`reports (fix 3, M1): ${name}`, () => {
    const r = L.scanLabelled(make());
    assert.ok(r && labels(r).includes('OPENAI_API_KEY'), 'a commented key was hidden by the loopback skip');
  });
}
it('every key line counts, commented ones too: two keys beside one loopback both report (fix 3, M1)', () => {
  const r = L.scanLabelled(`${OPENAI_LOCAL}\nOPENAI_API_KEY=${realKey()}\n# OPENAI_API_KEY=${realKey()}`);
  assert.strictEqual(r.found.find((f) => f.label === 'OPENAI_API_KEY').count, 2);
});

// M2: long bearer tokens, id_tokens and session tokens.
it('the value limit is long enough for an RS256 id_token (fix 3, M2)', () => {
  assert.ok(L.MAX_LEN >= 2500, `MAX_LEN ${L.MAX_LEN}`);
});
for (const len of [600, 1500]) {
  it(`reports (fix 3, M2): an RS256 JWT of ${len} characters as Authorization: Bearer`, () => {
    const t = jwtOf(len);
    assert.strictEqual(t.length, len);
    assert.deepStrictEqual(labels(L.scanLabelled(`> Authorization: Bearer ${t}\n> Accept: */*`)), ['Authorization']);
  });
  it(`reports (fix 3, M2): an RS256 JWT of ${len} characters as a JSON id_token`, () => {
    assert.deepStrictEqual(labels(L.scanLabelled(`{"access_type":"x","id_token": "${jwtOf(len)}"}`)), ['id_token']);
  });
}
it('reports (fix 3, M2): an 800-character aws_session_token', () => {
  let t = 'IQoJb3JpZ2luX2VjE';
  while (t.length < 800) t += crypto.randomBytes(48).toString('base64');
  t = t.slice(0, 800);
  assert.deepStrictEqual(labels(L.scanLabelled(`aws_session_token = ${t}`)), ['aws_session_token']);
});

// M3: the file-scope reader is linear; the hook keeps its vendor note (e2e, hooks_e2e_test).
it('a colon-free 1 MiB line dense with `/` beside a _BASE_URL stays fast (fix 3, M3)', () => {
  for (const s of ['X_BASE_URL=http://localhost:4000\nX_API_KEY=x\n' + 'a/'.repeat(512 * 1024),
                   'X_BASE_URL=x token\n.' + 'a.b/'.repeat(256 * 1024)]) {
    const t0 = Date.now();
    L.scanLabelled(s);
    const ms = Date.now() - t0;
    assert.ok(ms < 1000, `took ${ms} ms`);
  }
  const t1 = Date.now();
  assert.strictEqual(L.grepPrefix('a/'.repeat(512 * 1024)), null);
  assert.ok(Date.now() - t1 < 100, 'grepPrefix is not linear');
  assert.deepStrictEqual(L.grepPrefix('apps/x/.env:12:K=v'), { path: 'apps/x/.env', length: 15 });
});
it('a scan out of its time budget says PARTIAL (time), not silence (fix 3, M3)', () => {
  const part = 'token ' + 'a '.repeat(500 * 1024);
  const r = L.scanLabelled([part, part, part, part], { timeBudgetMs: 1 });
  assert.ok(r && r.partial && r.why === 'time', JSON.stringify(r));
  assert.match(L.describe(r, {}), /time budget/);
});

// L1: a base URL is read to its end, and anything after the host but a clean path is not loopback.
for (const url of ['http://localhost"@evil.com"', "'http://localhost'@evil.com", 'http://localhost,@evil.com',
                   'http://localhost}@evil.com', 'http://localhost\\@evil.com', 'http://localhost:4000/v1@evil.com']) {
  it(`reports (fix 3, L1, M4): base URL ${url}`, () => {
    const r = L.scanLabelled(`OPENAI_BASE_URL=${url}\nOPENAI_API_KEY=${realKey()}`);
    assert.ok(r && labels(r).includes('OPENAI_API_KEY'), 'a non-loopback host was read as loopback');
  });
}
it('silent (fix 3, L1): one-line JSON and a YAML comment still close a loopback URL cleanly', () => {
  assert.strictEqual(L.scanLabelled(`{"env":{"ANTHROPIC_BASE_URL":"http://127.0.0.1:47219","ANTHROPIC_AUTH_TOKEN":"${V()}"}}`), null);
  assert.strictEqual(L.scanLabelled(`{"env": {"ANTHROPIC_BASE_URL": "http://127.0.0.1:47219"}, "x": {"ANTHROPIC_AUTH_TOKEN": "${V()}"}}`), null);
  assert.strictEqual(L.scanLabelled(`OPENAI_BASE_URL: http://localhost:4000/v1 # local proxy\nOPENAI_API_KEY: ${V()}`), null);
});

// L2: concatenated output — distance, grep --heading, compose services, a heredoc.
const FILLER = Array.from({ length: 30 }, (_, i) => `SETTING_${i}=on`).join('\n');
for (const [name, make] of [
  ['a key 30 lines away from the loopback base', () => `${OPENAI_LOCAL}\n${FILLER}\nOPENAI_API_KEY=${realKey()}`],
  ['grep --heading from two files', () => `apps/dev/.env\n1:${OPENAI_LOCAL}\n\napps/prod/.env\n3:OPENAI_API_KEY=${realKey()}`],
  ['compose: a dev service on loopback, a prod service without a base', () => `services:\n  dev:\n    environment:\n      OPENAI_BASE_URL: http://localhost:4000\n      OPENAI_API_KEY: ${V()}\n  prod:\n    environment:\n      OPENAI_API_KEY: ${realKey()}`],
  ['a heredoc dev.env, then an export', () => `cat > dev.env <<EOF\n${OPENAI_LOCAL}\nEOF\nexport OPENAI_API_KEY=${realKey()}`],
]) {
  it(`reports (fix 3, L2): ${name}`, () => {
    const r = L.scanLabelled(make());
    assert.ok(r && labels(r).includes('OPENAI_API_KEY'), 'a key from another place was hidden');
  });
}

// L3: nothing value-shaped is echoed through a label or a scheme.
it('property (fix 3, L3): a label or scheme glued to a value never echoes 8 characters of it', () => {
  const alphabets = ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', '0123456789abcdef',
    'abcdefghijklmnopqrstuvwxyz0123456789', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const draw = (n, a) => Array.from(crypto.randomBytes(n), (b) => a[b % a.length]).join('');
  const shapes = [
    (v) => `${v}_token: ${V()}`, (v) => `${v}_URL=postgres://u:${V()}@h.internal`,
    (v) => `${v.replace(/^\d/, 'a').slice(0, 20)}://u:${V()}@h.internal`, (v) => `x-${v}-key: ${V()}`,
  ];
  let reported = 0;
  for (let i = 0; i < 1500; i += 1) {
    const a = alphabets[i % alphabets.length];
    const v = draw(10 + (i % 30), a);
    for (const sh of shapes) {
      const r = L.scanLabelled(sh(v));
      if (!r || !r.found.length) continue;
      reported += 1;
      const note = L.describe(r, { tool: 'Bash', where: 'cat' }).toLowerCase();
      for (let j = 0; j + 8 <= v.length; j += 1) {
        assert.ok(!note.includes(v.slice(j, j + 8).toLowerCase()), `echoed a slice of a ${v.length}-char value`);
      }
    }
  }
  assert.ok(reported > 1000, `only ${reported} reports: the property proves little`);
});
it('ordinary labels are echoed whole (fix 3, L3)', () => {
  for (const l of ['OPENROUTER_API_KEY', 'secretAccessKey', 'x-goog-api-key', 'TELEGRAM_INTERNAL_SECRET', 'aws_session_token', 'STRIPE_WEBHOOK_SECRET', 'applicationSecret']) {
    assert.strictEqual(L.safeLabel(l), l);
  }
  assert.deepStrictEqual(labels(L.scanLabelled(`motd=xyz123://a:${V()}@db.internal/x`)), ['url-password']);
});

// L4: an ENV_VAR_NAME is a name.
it('silent (fix 3, L4): UPPER_SNAKE env-var names with digits are names', () => {
  assert.strictEqual(L.scanLabelled('credentials: MINIFLARE_R2_S3_CREDENTIALS\napi_key_env=CLOUDFLARE_R2_TOKEN_2'), null);
});

// L5: mutants that survived round 3, pinned deterministically.
it('fixed letter-leading UUIDs under API_KEY are values, not slugs (fix 3, L5/M10)', () => {
  // The second has four digits, so only the all-hex rule — not the digit cap — keeps it a value.
  for (const u of ['fa3c9e1b-7d24-4c8a-b5e6-0f9d2a7c41e8', 'fa3cbe1d-cafe-4bed-acde-fedcba7cdbef']) {
    assert.ok(!L.looksLikeSlug(u), u);
    assert.deepStrictEqual(labels(L.scanLabelled(`API_KEY=${u}`)), ['API_KEY'], u);
  }
});
it('labels are captured atomically, and a label run costs what a linear baseline does (fix 3, L5/M13)', () => {
  for (const [name, rx] of Object.entries(L.PATTERNS)) {
    assert.ok(/\(\?=\(\[A-Za-z_\]\[A-Za-z0-9_\.-\]\{0,63\}\)\)\\\d/.test(rx.source), `${name}: the label is not captured atomically`);
  }
  const MiB = 1024 * 1024;
  const best = (s) => { let b = Infinity; for (let i = 0; i < 3; i += 1) { const t = process.hrtime.bigint(); L.scanLabelled(s); b = Math.min(b, Number(process.hrtime.bigint() - t) / 1e6); } return b; };
  const base = best('token\n' + 'a '.repeat(MiB / 2));
  const dash = best('token\n' + '-a'.repeat(MiB / 2));
  assert.ok(dash <= Math.max(4 * base, 40), `-a-a… ${dash.toFixed(1)} ms vs linear baseline ${base.toFixed(1)} ms`);
});

// ── Values the detector must NOT report ─────────────────────────────────────
// Hashes, ids and public fingerprints under neutral names; code; placeholders; the
// shapes this repository's own guard recommends.
const SILENT = [
  ['a commit sha under a neutral name', () => `commit ${HEX()}\nAuthor: someone`],
  ['an integrity hash', () => `"integrity": "sha512-${V()}${V()}"`],
  ['a checksum line', () => `SHA256 (pkg.tgz) = ${HEX()}${HEX()}`],
  ['a key fingerprint', () => `fingerprint: ${HEX()}`],
  ['an SSH host key fingerprint', () => `ED25519 key fingerprint is SHA256:${V()}.`],
  ['a public key', () => `public_key: ${V()}${V()}`],
  ['a key id', () => `key_id: ${HEX()}`],
  ['an access key id under its own name', () => `ACCESS_KEY_ID=${HEX()}`],
  ['a client id', () => `client_id=${HEX()}`],
  ['a request id', () => `x-request-id: ${HEX()}`],
  ['an idempotency key', () => `Idempotency-Key: ${V()}`],
  ['a pagination token', () => `"nextPageToken": "${V()}"`],
  ['a csrf token in a page', () => `<input name="csrf_token" value="${V()}">`],
  ['a cache key', () => `cache_key=${HEX()}`],
  ['a token count', () => `max_tokens: 4096\ntoken_count=1234567890123456`],
  ['an env reference, not a value', () => 'OPENROUTER_API_KEY=${OPENROUTER_API_KEY}'],
  ['a shell expansion in a header', () => 'Authorization: Bearer $OPENROUTER_API_KEY'],
  ['a template placeholder', () => 'api_key: <YOUR_API_KEY_HERE_PLEASE>'],
  ['a redacted value', () => 'X-Api-Key: REDACTED_REDACTED_REDACTED'],
  ['a masked value', () => 'Token: gho_************************************'],
  ['an example value', () => 'API_KEY=example-key-value-1234567890'],
  ['a key path, not a key', () => 'PRIVATE_KEY_PATH=/etc/ssl/private/server-2026.key'],
  ['a path value under a secret name', () => 'SSH_KEY=~/.ssh/id_ed25519_work_2026'],
  ['a url under a token name', () => 'TOKEN_URL=https://auth.example.com/oauth2/token'],
  ['code: a call, not a value', () => 'const apiKey = loadKeyFromVault2(config);'],
  ['code: a dotted identifier', () => 'secret_key = settings.SECRET_KEY_V2'],
  ['code: environment lookup', () => 'token: process.env.GITHUB_TOKEN_2,'],
  ['an identifier value with a version suffix', () => 'AUTH_MODE=oauth_device_flow_v2'],
  ['a word value', () => 'password: correcthorsebatterystaple'],
  ['a long number', () => 'SECRET_VERSION_NUMBER=12345678901234567890'],
  ['a timestamp', () => 'token_expires_at=2026-10-14T03:16:52.123Z'],
  ['a low-entropy value', () => 'API_KEY=aaaaaaaaaaaaaaaa1111111111'],
  ['a short value', () => 'api_key=ab12cd34'],
  ['the guard\'s own presence check', () => '[ -n "$OPENROUTER_API_KEY" ] && echo set'],
  ['a length report', () => 'OPENROUTER_API_KEY length: 73'],
  ['prose about keys', () => 'Rotate the api key handling and the token refresh before release.'],
  ['a uuid under a neutral name', () => `"requestId": "${crypto.randomUUID()}"`],
  ['ordinary output', () => '3 files changed, 42 insertions(+), 7 deletions(-)'],
  // Measured on 6,456 real files (this repository, its members, Observatory docs/tools):
  // a registry's namespaced ids and a logo CDN's publishable key were the false positives.
  ['a namespaced credential id in a registry', () => `{"id": "credential:svc-${HEX()}", "kind": "store"}`],
  ['a namespaced secret subject', () => `"subject": "secret:${V()}"`],
  ['a publishable key in an image URL', () => `img.logo.example/acme.com?token=pk_${V()}&size=128`],
  ['a vault slot name, not its value', () => '{"event": "leak", "secret": "acme-web-app/prod/OPENROUTER_API_KEY_2"}'],
  ['a snake_case function name as a value', () => '{"svc-auth": check_svc2_status_handler,'],
  ['a sequential example value', () => 'curl -H "Authorization: Bearer sk-admin-key123456abcdef"'],
  ['a commit sha under a git qualifier', () => `"commit_token": "${HEX()}"`],
  ['empty', () => ''],
];

for (const [name, make] of SILENT) {
  it(`silent: ${name}`, () => {
    const r = L.scanLabelled(make());
    assert.strictEqual(r, null, `false positive on ${JSON.stringify(labels(r))}`);
  });
}

it('a vendor-prefixed literal is left to secrets.scan, so one leak is not reported twice', () => {
  const vendor = 'gh' + 'p_' + randomValue('hex', 20);
  const r = L.scanLabelled(`GITHUB_TOKEN=${vendor}`);
  assert.strictEqual(r, null, 'the labelled detector double-reports a vendor literal');
  assert.ok(require('../lib/secrets.js').scan(`GITHUB_TOKEN=${vendor}`), 'secrets.scan no longer sees it');
});

// ── Robustness: fail open, bounded ──────────────────────────────────────────
it('a non-string decides nothing rather than throwing', () => {
  for (const bad of [undefined, null, 42, {}, [], true]) assert.strictEqual(L.scanLabelled(bad), null);
});

it('describe on nothing is empty, never a throw', () => {
  assert.strictEqual(L.describe(null, {}), '');
  assert.strictEqual(L.describe({ found: [] }, null), '');
});

it('a large output is scanned within a bounded time and reports the scan as partial', () => {
  const filler = (crypto.randomBytes(1 << 20).toString('base64') + '\n').repeat(3); // ~4.2 MB
  const head = `X-Api-Key: ${V()}\n`;
  const t0 = Date.now();
  const r = L.scanLabelled(head + filler);
  const ms = Date.now() - t0;
  assert.ok(r && labels(r).includes('X-Api-Key'), 'a value in the head of a large output was missed');
  assert.strictEqual(r.partial, true, 'a capped scan does not say it was partial');
  assert.ok(ms < 3000, `scan of a large output took ${ms} ms`);
});

it('a pathological line (one huge label-shaped run) stays bounded', () => {
  const evil = 'a_token'.repeat(200000) + '=' + 'b'.repeat(100000);
  const t0 = Date.now();
  L.scanLabelled(evil);
  const ms = Date.now() - t0;
  assert.ok(ms < 3000, `a pathological input took ${ms} ms`);
});

// ── outputText: what the hook reads from each tool's response ───────────────
it('outputText reads Bash, Read, Grep and MCP-style responses', () => {
  const v = V();
  const cases = [
    { stdout: `ok\nFOO_TOKEN=${v}`, stderr: '' },
    { type: 'text', file: { filePath: '/x/.config', content: `FOO_TOKEN=${v}` } },
    { mode: 'content', content: `app.yml:3:FOO_TOKEN=${v}`, numLines: 1 },
    [{ type: 'text', text: `FOO_TOKEN=${v}` }],
    `FOO_TOKEN=${v}`,
  ];
  for (const c of cases) {
    const text = L.outputText(c);
    assert.ok(text.includes(v), `outputText missed the text of ${JSON.stringify(Object.keys(c))}`);
    assert.ok(L.scanLabelled(text), 'the text read was not scannable');
  }
});

it('outputText is bounded on deep or cyclic input and never throws', () => {
  const cyclic = { a: 'x' };
  cyclic.self = cyclic;
  let deep = { s: 'leaf' };
  for (let i = 0; i < 1000; i += 1) deep = { d: deep };
  assert.strictEqual(typeof L.outputText(cyclic), 'string');
  assert.strictEqual(typeof L.outputText(deep), 'string');
  for (const bad of [undefined, null, 42, true]) assert.strictEqual(L.outputText(bad), '');
});

// ── where: the file or command, never the value ─────────────────────────────
it('whereOf names the program for Bash and drops anything value-shaped from it', () => {
  const v = V();
  const w = L.whereOf({ tool_name: 'Bash', tool_input: { command: `curl -sS -H "x-api-key: ${v}" https://api.example.com` } });
  assert.strictEqual(w.tool, 'Bash');
  assert.match(w.where, /^curl/);
  assert.ok(!w.where.includes(v) && !w.where.includes(v.slice(0, 8)), 'where repeats the value');
});

it('whereOf names the file for Read and the path for Grep', () => {
  assert.deepStrictEqual(L.whereOf({ tool_name: 'Read', tool_input: { file_path: '/srv/app/.config' } }),
    { tool: 'Read', where: '/srv/app/.config' });
  assert.deepStrictEqual(L.whereOf({ tool_name: 'Grep', tool_input: { pattern: 'TOKEN', path: '/srv/app' } }),
    { tool: 'Grep', where: '/srv/app' });
  assert.deepStrictEqual(L.whereOf({}), { tool: 'a tool', where: '' });
});

// ── B-250 (2026-10-23): a long token that happens to spell a placeholder word ──────────
// 36 of 20,000 random 600-character JWTs were dropped because base64 spelled `duMMY` or
// another word inside them. From 100 characters a word counts only after a separator.
const PH_WORDS = ['redacted', 'placeholder', 'example', 'changeme', 'dummy', 'fake', 'sample', 'replace', 'todo', 'xxxx'];
const mixed = (w) => w.split('').map((c, i) => (i % 2 ? c.toUpperCase() : c)).join('');
for (const w of PH_WORDS) {
  it(`B-250: a 600-character bearer token with "${mixed(w)}" inside a random run is reported`, () => {
    const t = jwtOf(600);
    const at = 300;
    const planted = t.slice(0, at) + 'Q' + mixed(w) + 'Z' + t.slice(at + w.length + 2);
    assert.strictEqual(planted.length, 600);
    assert.deepStrictEqual(labels(L.scanLabelled(`Authorization: Bearer ${planted}`)), ['Authorization']);
  });
}
it('B-250: a long value whose placeholder word follows a separator stays silent', () => {
  const v = 'sk-live-' + 'REDACTED-'.repeat(12) + 'end2026';
  assert.ok(v.length >= 100);
  assert.deepStrictEqual(labels(L.scanLabelled(`API_KEY=${v}`)), []);
  assert.deepStrictEqual(labels(L.scanLabelled(`Authorization: Bearer ${'a1B2c3D4'.repeat(12)}_example_${'z9Y8'.repeat(4)}`)), []);
});
it('B-250: a JWT whose signature was replaced by REDACTED stays silent', () => {
  const t = jwtOf(600).split('.').slice(0, 2).join('.') + '.REDACTED';
  assert.deepStrictEqual(labels(L.scanLabelled(`Authorization: Bearer ${t}`)), []);
});
it('B-250: an ascending run of 7 inside a 600-character token is noise, of 10 an example', () => {
  const t = jwtOf(600);
  assert.deepStrictEqual(labels(L.scanLabelled(`Authorization: Bearer ${t.slice(0, 300)}qrstuvw${t.slice(307)}`)), ['Authorization']);
  assert.deepStrictEqual(labels(L.scanLabelled(`Authorization: Bearer ${t.slice(0, 300)}0123456789${t.slice(310)}`)), []);
});
it('B-250: a short documented example key keeps the substring rule', () => {
  assert.deepStrictEqual(labels(L.scanLabelled('AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')), []);
});
it('B-250: 2,000 random 600-character bearer tokens are all reported', () => {
  let missed = 0;
  for (let i = 0; i < 2000; i += 1) if (!labels(L.scanLabelled(`Authorization: Bearer ${jwtOf(600)}`)).includes('Authorization')) missed += 1;
  assert.strictEqual(missed, 0);
});

if (failures.length) {
  console.error(`labelled_secrets_test: ${failures.length}/${checks} failed`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
