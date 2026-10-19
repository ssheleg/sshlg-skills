'use strict';
/**
 * `npx sshlg-skills enroll`: which family routes apply to THIS repository, what is
 * still missing for them, and the two writes that record it. The contract is
 * docs/evidence/specs/2026-10-19-enroll.md; read it before changing anything here.
 *
 * Why it exists. The global routing block says what each router owns in general. It
 * cannot say "this repository has a public website, so seo-llmo and copywriting apply
 * here, and its brand pack is still missing". Each member seeds its own layer through
 * an interactive command, `.claude/routers.json` was written by hand, and nothing told
 * an agent opening a project which routes applied to it.
 *
 * What it writes, and nothing else:
 *   1. one managed block `SSHLG:PROJECT` (managed-blocks/1) in the project's CLAUDE.md
 *      and AGENTS.md where each exists, or a new CLAUDE.md holding only the block;
 *   2. `.claude/routers.json` entries for routers whose material already exists, added
 *      beside whatever is there. An existing entry is never removed or rewritten, and a
 *      file that does not exist is never declared, so `materialised` reports them true.
 *
 * Pure, like `materialised.js`: it is handed a reader (`paths`, `read`, `kind`) and
 * returns the plan. The command in bin/sshlg-skills.js lists the tree, takes the
 * backup through `apply.protect()` and writes; a fixture asserts this module never
 * reaches the filesystem itself.
 */

const B = require('./blocks.js');
const J = require('./json-spans.js');
const R = require('./routers.js');
const W = require('./blockwriter.js');
const REG = require('./routers-registry.js');
const { DECL_PATH } = require('./materialised.js');

const BLOCK_ID = 'SSHLG:PROJECT';
const INSTRUCTION_FILES = ['CLAUDE.md', 'AGENTS.md'];
const SURFACES = ['public-web', 'app-text', 'internal'];

/**
 * The routers each surface class takes. Names only: what a router answers, its order
 * and whether it exists at all come from lib/routers-registry.js, and a name the
 * registry does not hold is a refusal, never a row.
 */
const CLASS_ROUTES = {
  'public-web': ['task-pipeline', 'super-ux', 'copywriting', 'sheleg-design', 'seo-llmo', 'evidence-docs'],
  'app-text': ['task-pipeline', 'super-ux', 'copywriting', 'sheleg-design', 'evidence-docs'],
  internal: ['task-pipeline', 'evidence-docs'],
};

/**
 * The material each router's setup leaves in a project, and the command that seeds it.
 * `files` must all exist for the setup to count as present; `declare` names which of
 * them become the routers.json entry (`materialised`, `guards`), and `optionalGuards`
 * join the entry only when they exist.
 */
const SETUP = {
  copywriting: {
    what: 'brand pack',
    files: ['docs/brand/voice.md', 'docs/brand/terminology.md', 'docs/brand/facts.md'],
    seed: '/brand-init',
    declare: { materialised: ['docs/brand/voice.md', 'docs/brand/terminology.md', 'docs/brand/facts.md'], guards: [] },
    optionalGuards: ['docs/brand/lint.py'],
  },
  'super-ux': {
    what: 'scenarios and their linter',
    files: ['docs/ux/scenarios.md', 'docs/ux/lint.py'],
    seed: '/ux-init',
    declare: { materialised: ['docs/ux/scenarios.md'], guards: ['docs/ux/lint.py'] },
  },
  'task-pipeline': {
    what: 'DOCMAP',
    files: ['docs/DOCMAP.md'],
    seed: '/task-pipeline setup',
    declare: { materialised: ['docs/DOCMAP.md'], guards: [] },
  },
  'seo-llmo': {
    what: 'SEO brief or audit',
    any: [/^docs\/seo\/brief-[^/]+\.md$/, /^docs\/seo\/audit-[^/]+\.md$/],
    anyLabel: ['docs/seo/brief-*.md', 'docs/seo/audit-*.md'],
    seed: '/seo-aeo-audit brief',
    seedNote: 'or `/seo-aeo-audit` for a full audit',
  },
};

/* -- detection ------------------------------------------------------------- */

const WEB_DEPS = ['next', 'astro', 'nuxt', '@remix-run/*', '@sveltejs/kit', 'gatsby', '@11ty/eleventy'];
const TELEGRAM_DEPS = ['telegraf', 'grammy', '@telegram-apps/*'];
const TELEGRAM_PY = ['aiogram', 'python-telegram-bot'];
const EXTRA_DEPS = {
  'web3d-dev': ['three', '@react-three/*'],
  'telegram-dev': TELEGRAM_DEPS,
  'sheleg-dev': ['stripe', '@stripe/*', '@sentry/*', '@react-oauth/google', 'google-auth-library',
    'react-ga4', 'react-gtm-module', '@next/third-parties', 'react-facebook-pixel', '@types/gtag.js',
    '@types/facebook-pixel'],
  'xr-dev': ['@react-three/xr', '@types/webxr', 'webxr-polyfill', '@webxr-input-profiles/*', 'iwer',
    '@iwer/*', '@meta-quest/*'],
};
const EXTRA_PY = {
  'telegram-dev': TELEGRAM_PY,
  'sheleg-dev': ['stripe', 'sentry-sdk', 'google-auth'],
};
/** Native XR SDKs, named in a Unity manifest or a Gradle build rather than in npm. */
const XR_NATIVE = [
  { file: /(^|\/)Packages\/manifest\.json$/, text: /"(com\.meta\.xr[^"]*|com\.oculus[^"]*|com\.unity\.xr\.openxr)"/ },
  { file: /(^|\/)build\.gradle(\.kts)?$/, text: /(org\.khronos\.openxr|com\.meta\.spatial)/ },
];
const PY_MANIFEST = /(^|\/)(requirements[^/]*\.txt|pyproject\.toml|Pipfile|setup\.cfg|setup\.py)$/;

const base = (p) => p.slice(p.lastIndexOf('/') + 1);
const dir = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '');
const matches = (name, pattern) => (pattern.endsWith('/*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A path or label as it may appear in the block: no backtick, pipe, newline or comment marker. */
const clean = (s) => String(s).replace(/[^\w@./+*-]/g, '?');

/** File signals for each class: a label and a test on the repository-relative path. */
const WEB_FILES = [
  ['Hugo config', (p) => /^hugo\.(toml|ya?ml|json)$/.test(base(p))],
  ['Jekyll config', (p) => base(p) === '_config.yml'],
  ['public/index.html', (p) => p === 'public/index.html' || p.endsWith('/public/index.html')],
  ['robots.txt', (p) => /^robots\.(txt|ts|js)$/.test(base(p))],
  ['sitemap', (p) => /^sitemap[\w.-]*\.(xml|xml\.gz|txt|ts|tsx|js|mjs)$/i.test(base(p))],
];
const APP_FILES = [
  ['store metadata', (p) => p.startsWith('store/') || /(^|\/)fastlane\/metadata\//.test(p)],
  ['mobile project', (p) => p.startsWith('ios/') || p.startsWith('android/') || /(^|\/)[^/]+\.xcodeproj(\/|$)/.test(p) || base(p) === 'pubspec.yaml'],
  ['string catalogue', (p) => /\.(xcstrings|strings|stringsdict|arb|po)$/.test(base(p))
    || /(^|\/)res\/values[^/]*\/strings\.xml$/.test(p)
    || /(^|\/)(locales?|i18n)\/.+\.(json|ya?ml)$/.test(p)],
];

/** The dependency names a package.json declares, in any of its four maps. */
function npmDeps(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return []; }
  if (!data || typeof data !== 'object') return [];
  const out = new Set();
  for (const k of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    if (data[k] && typeof data[k] === 'object' && !Array.isArray(data[k])) Object.keys(data[k]).forEach((n) => out.add(n));
  }
  return [...out];
}

/** Whether a Python manifest names `name` as a requirement (case-insensitive, extras allowed). */
function pyHas(text, name) {
  return new RegExp(`(^|[\\s"',\\[])${esc(name)}(?=[\\s"'<>=~!\\[;,\\]]|$)`, 'mi').test(text);
}

/**
 * Detect the surface class and the signals behind it.
 * `io.paths` is the repository-relative file list; `io.read(rel)` returns text or null.
 * Returns { surface, signals: {public-web: [...], app-text: [...]}, extras: {router: [...]} },
 * each signal `{ label, files }`, sorted so two runs over one tree agree.
 */
function detect(io) {
  const paths = [...(io.paths || [])].filter((p) => !/(^|\/)node_modules\//.test(p)).sort();
  const pathSet = new Set(paths);
  const acc = { 'public-web': new Map(), 'app-text': new Map() };
  const extras = {};
  const add = (map, label, file) => { if (!map.has(label)) map.set(label, new Set()); map.get(label).add(file); };
  const addExtra = (router, label, file) => { extras[router] = extras[router] || new Map(); add(extras[router], label, file); };

  for (const p of paths) {
    for (const [label, test] of WEB_FILES) if (test(p)) add(acc['public-web'], label, p);
    for (const [label, test] of APP_FILES) if (test(p)) add(acc['app-text'], label, p);

    if (base(p) === 'package.json') {
      const text = io.read(p);
      if (typeof text !== 'string') continue;
      for (const name of npmDeps(text)) {
        if (WEB_DEPS.some((w) => matches(name, w))) add(acc['public-web'], `dependency \`${clean(name)}\``, p);
        if (name === 'vite' && pathSet.has(dir(p) + 'index.html')) add(acc['public-web'], 'dependency `vite` with an index.html', p);
        if (TELEGRAM_DEPS.some((w) => matches(name, w))) add(acc['app-text'], `dependency \`${clean(name)}\``, p);
        for (const [router, list] of Object.entries(EXTRA_DEPS)) {
          if (list.some((w) => matches(name, w))) addExtra(router, `dependency \`${clean(name)}\``, p);
        }
      }
    }
    if (PY_MANIFEST.test(p)) {
      const text = io.read(p);
      if (typeof text !== 'string') continue;
      for (const name of TELEGRAM_PY) if (pyHas(text, name)) add(acc['app-text'], `dependency \`${clean(name)}\``, p);
      for (const [router, list] of Object.entries(EXTRA_PY)) {
        for (const name of list) if (pyHas(text, name)) addExtra(router, `dependency \`${clean(name)}\``, p);
      }
    }
    for (const x of XR_NATIVE) {
      if (!x.file.test(p)) continue;
      const text = io.read(p);
      const m = typeof text === 'string' && x.text.exec(text);
      if (m) addExtra('xr-dev', `XR SDK \`${m[1]}\``, p);
    }
  }

  const list = (map) => [...map.keys()].sort().map((label) => ({ label, files: [...map.get(label)].sort() }));
  const signals = { 'public-web': list(acc['public-web']), 'app-text': list(acc['app-text']) };
  const surface = signals['public-web'].length ? 'public-web' : signals['app-text'].length ? 'app-text' : 'internal';
  const ex = {};
  for (const router of Object.keys(extras).sort()) ex[router] = list(extras[router]);
  return { surface, signals, extras: ex };
}

/* -- setup state ------------------------------------------------------------ */

function setupState(router, io) {
  const s = SETUP[router];
  if (!s) return null;
  const has = (p) => typeof io.read(p) === 'string';
  if (s.any) {
    const found = (io.paths || []).filter((p) => s.any.some((re) => re.test(p))).sort();
    return { what: s.what, seed: s.seed, seedNote: s.seedNote || null, state: found.length ? 'present' : 'missing', missing: found.length ? [] : s.anyLabel.slice(), anyOf: true, declare: null };
  }
  const missing = s.files.filter((f) => !has(f));
  const state = missing.length === 0 ? 'present' : missing.length === s.files.length ? 'missing' : 'partial';
  let declare = null;
  if (state === 'present' && s.declare) {
    const guards = s.declare.guards.concat((s.optionalGuards || []).filter(has));
    declare = guards.length ? { materialised: s.declare.materialised.slice(), guards } : { materialised: s.declare.materialised.slice() };
  }
  return { what: s.what, seed: s.seed, seedNote: s.seedNote || null, state, missing, declare };
}

/* -- the block --------------------------------------------------------------- */


function signalLines(signals) {
  return signals.map((s) => {
    const shown = s.files.slice(0, 3).map((f) => `\`${clean(f)}\``).join(', ');
    const more = s.files.length > 3 ? ` and ${s.files.length - 3} more` : '';
    return `- ${s.label}: ${shown}${more}`;
  });
}

function setupCell(r) {
  if (r.setup) {
    if (r.setup.state === 'present') return `${r.setup.what}: present`;
    return `${r.setup.what}: ${r.setup.state} (\`${r.setup.seed}\`)`;
  }
  if (r.extra) return `added by ${r.signals.map((s) => s.label).join(', ')}`;
  return 'nothing to seed';
}

function renderBlock(p) {
  const lines = [
    `<!-- ${BLOCK_ID}:BEGIN managed by npx sshlg-skills enroll. To opt out, replace the whole block with one ${BLOCK_ID}:OPTOUT comment line. -->`,
    '## Family routes in this project',
    '',
    p.override
      ? `Surface: \`${p.surface}\` (override: \`--surface ${p.surface}\`; detected \`${p.detected}\`).`
      : `Surface: \`${p.surface}\` (detected).`,
  ];
  const sig = p.signals['public-web'].concat(p.signals['app-text']);
  if (sig.length) lines.push('Signals:', ...signalLines(sig));
  else lines.push('Signals: none. No website or app-text signal in the tree.');
  lines.push('', 'Routes that apply here (the global routing block says what each one owns):', '',
    '| Router | Answers | Setup here |', '|---|---|---|');
  for (const r of p.routes) lines.push(`| \`${r.router}\` | ${r.answers} | ${setupCell(r)} |`);
  lines.push('');
  if (p.remaining.length) {
    lines.push('Remaining setup:');
    for (const x of p.remaining) {
      lines.push(`- \`${x.seed}\`${x.seedNote ? ` (${x.seedNote})` : ''}: ${x.what} for \`${x.router}\`, missing ${x.anyOf ? 'one of ' : ''}${x.missing.map((m) => `\`${clean(m)}\``).join(x.anyOf ? ' or ' : ', ')}`);
    }
  } else {
    lines.push('Remaining setup: none.');
  }
  lines.push(`<!-- ${BLOCK_ID}:END -->`);
  return lines.join('\n');
}

/* -- placement --------------------------------------------------------------- */

const ids = (blocks) => blocks.filter((b) => b.markerId !== BLOCK_ID).map((b) => `${b.markerId}:${b.syntaxState}`);

/** The block placed in one instruction file's text, or the refusal that stops it. */
function place(file, text, block) {
  const parsed = B.parse(text);
  if (!parsed.ok) {
    return { refusal: { code: 'MALFORMED', file, reason: `markers are not cleanly paired (${parsed.issues.map((i) => `${i.code} line ${i.line}`).join(', ')}); fix by hand first` } };
  }
  const cur = parsed.blocks.find((b) => b.markerId === BLOCK_ID);
  if (cur && cur.syntaxState === 'OPTOUT') {
    return { refusal: { code: 'OPTED_OUT', file, reason: `carries ${BLOCK_ID}:OPTOUT; the operator declined this block` } };
  }
  if (cur && cur.syntaxState !== 'PAIRED') {
    return { refusal: { code: 'MALFORMED', file, reason: `${BLOCK_ID} is ${cur.syntaxState}` } };
  }
  const eol = W.eolOf(text);
  const seg = W.inEol(block, eol);
  let after, action;
  if (cur) {
    after = text.slice(0, cur.offset.start) + seg + text.slice(cur.offset.end);
    action = after === text ? 'unchanged' : 'replace';
  } else {
    after = W.appended(text, seg, eol);
    action = 'insert';
  }
  if (action !== 'unchanged') {
    // Same markers as before plus exactly one paired block: an unterminated `<!--`
    // earlier in the file would otherwise swallow the appended block.
    const next = B.parse(after);
    const mine = next.blocks.filter((b) => b.markerId === BLOCK_ID);
    if (!next.ok || JSON.stringify(ids(next.blocks)) !== JSON.stringify(ids(parsed.blocks))
      || mine.length !== 1 || mine[0].syntaxState !== 'PAIRED') {
      return { refusal: { code: 'RESULT_WOULD_NOT_PARSE', file, reason: `with the block, the file would not read as the same markers plus one paired ${BLOCK_ID}; look for an unterminated <!-- comment` } };
    }
  }
  return { write: { file, action, before: text, after, diff: action === 'unchanged' ? '' : R.diff(text, after) } };
}

/** The routers.json write: entries added beside what is there, or the refusal. */
function declare(io, entries) {
  const names = Object.keys(entries);
  if (!names.length) return {};
  const dirKind = io.kind('.claude');
  if (dirKind === 'symlink') return { refusal: { code: 'SYMLINK', file: '.claude', reason: 'is a symbolic link; enroll writes only regular files inside the work tree' } };
  if (dirKind !== 'absent' && dirKind !== 'dir') return { refusal: { code: 'NOT_REGULAR', file: '.claude', reason: `is ${dirKind}, not a directory` } };
  const kind = io.kind(DECL_PATH);
  if (kind === 'symlink') return { refusal: { code: 'SYMLINK', file: DECL_PATH, reason: 'is a symbolic link; enroll writes only regular files' } };
  if (kind === 'absent') {
    const after = JSON.stringify(entries, null, 2) + '\n';
    return { write: { file: DECL_PATH, action: 'create', before: null, after, diff: R.diff('', after) } };
  }
  if (kind !== 'file') return { refusal: { code: 'NOT_REGULAR', file: DECL_PATH, reason: `is ${kind}, not a readable regular file` } };
  const text = io.read(DECL_PATH);
  let doc;
  try { doc = J.parse(text); } catch (e) {
    return { refusal: { code: 'MALFORMED', file: DECL_PATH, reason: `does not parse (${e.message}); fix the JSON by hand first` } };
  }
  if (!doc.data || typeof doc.data !== 'object' || Array.isArray(doc.data) || !doc.root.props) {
    return { refusal: { code: 'MALFORMED', file: DECL_PATH, reason: 'is not a JSON object of router entries' } };
  }
  const add = names.filter((n) => !Object.prototype.hasOwnProperty.call(doc.data, n));
  if (!add.length) return { write: { file: DECL_PATH, action: 'unchanged', before: text, after: text, diff: '' } };
  let after = text;
  for (const n of add) after = J.edit(after, J.parse(after).root, n, entries[n]);
  // Every entry that was there is still there, unchanged and in its place.
  const check = JSON.parse(after);
  const keys = Object.keys(doc.data);
  if (JSON.stringify(Object.keys(check).slice(0, keys.length)) !== JSON.stringify(keys)
    || keys.some((k) => JSON.stringify(check[k]) !== JSON.stringify(doc.data[k]))) {
    return { refusal: { code: 'RESULT_WOULD_NOT_PARSE', file: DECL_PATH, reason: 'adding entries would change an existing one' } };
  }
  return { write: { file: DECL_PATH, action: 'update', before: text, after, diff: R.diff(text, after) } };
}

/* -- the plan ------------------------------------------------------------------ */

/**
 * The whole plan. `io` = { paths, read(rel) -> text|null, kind(rel) -> 'file' | 'dir' |
 * 'symlink' | 'absent' | 'other' | 'invalid-utf8' | 'unreadable' }.
 * `opts.surface` overrides the detected class; `opts.registry` and `opts.classes` are
 * injectable so a fixture can plant an unknown router. A plan with any refusal carries
 * no writes: enroll writes all of its files or none of them.
 */
function plan(io, opts) {
  const o = opts || {};
  const registry = o.registry || REG.REGISTRY;
  const classes = o.classes || CLASS_ROUTES;
  const d = detect(io);
  if (o.surface && !SURFACES.includes(o.surface)) throw new Error(`unknown surface: ${o.surface} (${SURFACES.join('|')})`);
  const surface = o.surface || d.surface;
  const refusals = [];

  const classList = classes[surface] || [];
  const wanted = new Set(classList.concat(Object.keys(d.extras)));
  for (const n of [...wanted].sort()) {
    if (!Object.prototype.hasOwnProperty.call(registry, n)) {
      refusals.push({ code: 'UNKNOWN_ROUTER', file: null, reason: `\`${n}\` is not a router in lib/routers-registry.js; enroll names registry routers only` });
    }
  }
  const routes = Object.keys(registry).filter((n) => wanted.has(n)).map((n) => ({
    router: n,
    answers: registry[n].answers,
    extra: !classList.includes(n),
    signals: d.extras[n] || [],
    setup: setupState(n, io),
  }));
  const remaining = routes.filter((r) => r.setup && r.setup.state !== 'present').map((r) => ({
    router: r.router, what: r.setup.what, seed: r.setup.seed, seedNote: r.setup.seedNote, missing: r.setup.missing, anyOf: !!r.setup.anyOf,
  }));
  // An explicit --surface is printed as an override even when it agrees with detection.
  const p = { surface, detected: d.surface, override: !!o.surface, signals: d.signals, extras: d.extras, routes, remaining };
  p.block = renderBlock(p);

  const writes = [];
  const kinds = {};
  for (const f of INSTRUCTION_FILES) {
    const k = io.kind(f);
    kinds[f] = k;
    if (k === 'symlink') refusals.push({ code: 'SYMLINK', file: f, reason: 'is a symbolic link; enroll writes only a regular instruction file' });
    else if (k === 'invalid-utf8') refusals.push({ code: 'MALFORMED', file: f, reason: 'is not valid UTF-8' });
    else if (k !== 'file' && k !== 'absent') refusals.push({ code: 'NOT_REGULAR', file: f, reason: `is ${k}, not a readable regular file` });
  }
  if (INSTRUCTION_FILES.every((f) => kinds[f] === 'absent')) {
    writes.push({ file: 'CLAUDE.md', action: 'create', before: null, after: p.block + '\n', diff: R.diff('', p.block + '\n') });
  }
  for (const f of INSTRUCTION_FILES) {
    if (kinds[f] !== 'file') continue;
    const r = place(f, io.read(f), p.block);
    if (r.refusal) refusals.push(r.refusal); else writes.push(r.write);
  }

  const entries = {};
  for (const r of routes) if (r.setup && r.setup.declare) entries[r.router] = r.setup.declare;
  // Never declare a file that does not exist: checked here once more, against the reader.
  for (const [n, e] of Object.entries(entries)) {
    for (const f of e.materialised.concat(e.guards || [])) {
      if (typeof io.read(f) !== 'string') refusals.push({ code: 'MISSING_MATERIAL', file: f, reason: `${n} would declare a file that does not exist` });
    }
  }
  const dr = declare(io, entries);
  if (dr.refusal) refusals.push(dr.refusal);
  if (dr.write) writes.push(dr.write);

  p.ok = refusals.length === 0;
  p.refusals = refusals;
  p.writes = p.ok ? writes : [];
  p.entries = entries;
  return p;
}

module.exports = { BLOCK_ID, INSTRUCTION_FILES, SURFACES, CLASS_ROUTES, SETUP, detect, plan };
