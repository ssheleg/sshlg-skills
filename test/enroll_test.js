#!/usr/bin/env node
'use strict';
// Fixtures for lib/enroll.js and `npx sshlg-skills enroll`, one per bullet of the
// spec's Tests section (docs/evidence/specs/2026-10-19-enroll.md).
//
// The property under test is that enroll writes two things and only two: one managed
// block `SSHLG:PROJECT` in the project's instruction files, and `.claude/routers.json`
// entries for routers whose material already exists. Every byte outside the block is
// the operator's; an opt-out, a malformed file, a symlink and a root outside Git are
// refusals; three runs over one tree leave one hash.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const E = require('../lib/enroll.js');
const B = require('../lib/blocks.js');
const M = require('../lib/materialised.js');
const REG = require('../lib/routers-registry.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

/** An in-memory tree: the module is handed this and never a disk of its own. */
function tree(files, links) {
  // `links` is a list of symlinked paths (target unknown) or a map path -> target.
  const map = Array.isArray(links) || !links ? {} : links;
  const l = new Set(Array.isArray(links) ? links : Object.keys(map));
  const has = (p) => Object.prototype.hasOwnProperty.call(files, p);
  return {
    paths: Object.keys(files).filter((p) => !l.has(p)),
    read: (p) => (has(p) && !l.has(p) ? files[p] : null),
    kind: (p) => (l.has(p) ? 'symlink' : has(p) ? 'file' : 'absent'),
    alias: (p) => map[p] || null,
  };
}
const pkg = (deps, dev) => JSON.stringify({ name: 'x', dependencies: deps || {}, devDependencies: dev || {} });
const write = (plan, file) => plan.writes.find((w) => w.file === file);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

/* -- detection, per class ------------------------------------------------- */

const WEB = [
  ['next in dependencies', { 'package.json': pkg({ next: '15' }) }],
  ['astro in devDependencies', { 'package.json': pkg({}, { astro: '5' }) }],
  ['a @remix-run/* package', { 'package.json': pkg({ '@remix-run/node': '2' }) }],
  ['@sveltejs/kit', { 'package.json': pkg({}, { '@sveltejs/kit': '2' }) }],
  ['vite with an index.html beside it', { 'web/package.json': pkg({}, { vite: '6' }), 'web/index.html': '<html>' }],
  ['a Hugo config', { 'hugo.toml': 'title = "x"' }],
  ['a Jekyll config', { '_config.yml': 'title: x' }],
  ['public/index.html', { 'public/index.html': '<html>' }],
  ['robots.txt', { 'static/robots.txt': 'User-agent: *' }],
  ['a sitemap', { 'sitemap.xml': '<urlset/>' }],
];
for (const [name, files] of WEB) {
  it(`public-web is detected from ${name}`, () => {
    const d = E.detect(tree(files));
    assert.strictEqual(d.surface, 'public-web', JSON.stringify(d));
    assert.ok(d.signals['public-web'].length > 0, 'no signal recorded behind the class');
  });
}

it('vite without an index.html is not a website on its own', () => {
  const d = E.detect(tree({ 'package.json': pkg({}, { vite: '6' }) }));
  assert.strictEqual(d.surface, 'internal', JSON.stringify(d.signals));
});

const APP = [
  ['fastlane metadata', { 'ios/fastlane/metadata/en-US/name.txt': 'X' }],
  ['a root store/ folder', { 'store/app.json': '{}' }],
  ['a telegraf dependency', { 'package.json': pkg({ telegraf: '4' }) }],
  ['aiogram in requirements.txt', { 'requirements.txt': 'aiogram==3.4\n' }],
  ['python-telegram-bot in pyproject.toml', { 'pyproject.toml': '[project]\ndependencies = ["python-telegram-bot>=21"]\n' }],
  ['an android/ project', { 'android/app/build.gradle': '' }],
  ['an .xcodeproj', { 'App.xcodeproj/project.pbxproj': '' }],
  ['pubspec.yaml', { 'pubspec.yaml': 'name: x' }],
  ['a string catalogue', { 'Sources/App/Localizable.xcstrings': '{}' }],
];
for (const [name, files] of APP) {
  it(`app-text is detected from ${name}`, () => {
    const d = E.detect(tree(files));
    assert.strictEqual(d.surface, 'app-text', JSON.stringify(d));
    assert.ok(d.signals['app-text'].length > 0);
  });
}

it('a redux src/store/ folder is not store metadata (known-clean case)', () => {
  const d = E.detect(tree({ 'src/store/index.ts': '', 'package.json': pkg({ express: '4' }) }));
  assert.strictEqual(d.surface, 'internal', JSON.stringify(d.signals));
});

it('a tree with no signal is internal, and says it found none', () => {
  const d = E.detect(tree({ 'package.json': pkg({ express: '4' }), 'src/index.js': '' }));
  assert.strictEqual(d.surface, 'internal');
  assert.deepStrictEqual(d.signals['public-web'], []);
  assert.deepStrictEqual(d.signals['app-text'], []);
});

it('a website with app signals too is public-web (its routes include app-text\'s)', () => {
  const d = E.detect(tree({ 'package.json': pkg({ next: '15', grammy: '1' }) }));
  assert.strictEqual(d.surface, 'public-web');
  assert.ok(d.signals['app-text'].length > 0, 'the app-text signal is still recorded');
});

/* -- detection, per extra route ------------------------------------------- */

const EXTRA = [
  ['web3d-dev', 'three', { 'package.json': pkg({ three: '0.180' }) }],
  ['web3d-dev', '@react-three/*', { 'package.json': pkg({ '@react-three/fiber': '9' }) }],
  ['telegram-dev', 'grammy', { 'package.json': pkg({ grammy: '1' }) }],
  ['telegram-dev', '@telegram-apps/*', { 'package.json': pkg({ '@telegram-apps/sdk': '3' }) }],
  ['sheleg-dev', 'stripe', { 'package.json': pkg({ stripe: '18' }) }],
  ['sheleg-dev', 'sentry', { 'package.json': pkg({ '@sentry/node': '9' }) }],
  ['sheleg-dev', 'google sign-in', { 'package.json': pkg({ '@react-oauth/google': '0.12' }) }],
  ['sheleg-dev', 'an ad pixel', { 'package.json': pkg({ 'react-ga4': '2' }) }],
  ['sheleg-dev', 'sentry-sdk in python', { 'requirements.txt': 'sentry-sdk[flask]==2\n' }],
  ['xr-dev', 'WebXR', { 'package.json': pkg({ '@react-three/xr': '6' }) }],
  ['xr-dev', 'the Meta XR SDK in Unity', { 'Packages/manifest.json': '{"dependencies":{"com.meta.xr.sdk.core":"74.0.0"}}' }],
];
for (const [router, name, files] of EXTRA) {
  it(`${router} is added by ${name}`, () => {
    const d = E.detect(tree(files));
    assert.ok(d.extras[router] && d.extras[router].length, `${router} missing: ${JSON.stringify(d.extras)}`);
    const p = E.plan(tree(files));
    assert.ok(p.routes.some((r) => r.router === router && r.extra), `${router} is not a route in the plan`);
  });
}

it('an internal tree carries no extra route (known-clean case)', () => {
  const d = E.detect(tree({ 'package.json': pkg({ express: '4', threejs_unrelated: '1', 'stripe-ish': '1' }) }));
  assert.deepStrictEqual(d.extras, {});
});

/* -- the plan names registry routers only --------------------------------- */

const ORDER = REG.order();
const expectRoutes = (list) => ORDER.filter((n) => list.includes(n));
const SPEC = {
  'public-web': ['task-pipeline', 'super-ux', 'copywriting', 'sheleg-design', 'seo-llmo', 'evidence-docs'],
  'app-text': ['task-pipeline', 'super-ux', 'copywriting', 'sheleg-design', 'evidence-docs'],
  internal: ['task-pipeline', 'evidence-docs'],
};
for (const surface of Object.keys(SPEC)) {
  it(`${surface} plans exactly the spec's routers, in registry order`, () => {
    const p = E.plan(tree({}), { surface });
    assert.ok(p.ok, JSON.stringify(p.refusals));
    assert.deepStrictEqual(p.routes.map((r) => r.router), expectRoutes(SPEC[surface]));
    for (const r of p.routes) assert.strictEqual(r.answers, REG.REGISTRY[r.router].answers);
  });
}

it('a planted unknown router is refused, not written', () => {
  const classes = Object.assign({}, E.CLASS_ROUTES, { internal: ['task-pipeline', 'evidence-docs', 'not-a-router'] });
  const p = E.plan(tree({}), { surface: 'internal', classes });
  assert.strictEqual(p.ok, false);
  assert.ok(p.refusals.some((r) => r.code === 'UNKNOWN_ROUTER' && /not-a-router/.test(r.reason)), JSON.stringify(p.refusals));
  assert.deepStrictEqual(p.writes, [], 'a refused plan writes nothing');
});

it('a router missing from the registry is refused too (the registry is the only list)', () => {
  const registry = Object.assign({}, REG.REGISTRY);
  delete registry['seo-llmo'];
  const p = E.plan(tree({ 'robots.txt': '' }), { registry });
  assert.strictEqual(p.ok, false);
  assert.ok(p.refusals.some((r) => r.code === 'UNKNOWN_ROUTER' && /seo-llmo/.test(r.reason)));
});

it('--surface overrides the class and the block says it is an override', () => {
  const p = E.plan(tree({ 'package.json': pkg({ next: '15' }) }), { surface: 'internal' });
  assert.strictEqual(p.surface, 'internal');
  assert.strictEqual(p.detected, 'public-web');
  assert.strictEqual(p.override, true);
  assert.match(p.block, /override: `--surface internal`; detected `public-web`/);
});

it('setup state is read from the tree, with the exact seed command for what is missing', () => {
  const p = E.plan(tree({ 'robots.txt': '', 'docs/DOCMAP.md': '#', 'docs/brand/voice.md': 'v' }));
  const by = Object.fromEntries(p.routes.map((r) => [r.router, r]));
  assert.strictEqual(by['task-pipeline'].setup.state, 'present');
  assert.strictEqual(by.copywriting.setup.state, 'partial');
  assert.deepStrictEqual(by.copywriting.setup.missing, ['docs/brand/terminology.md', 'docs/brand/facts.md']);
  assert.strictEqual(by['super-ux'].setup.state, 'missing');
  assert.strictEqual(by['seo-llmo'].setup.state, 'missing');
  const seeds = p.remaining.map((r) => r.seed);
  assert.deepStrictEqual(seeds, ['/ux-init', '/brand-init', '/seo-aeo-audit brief']);
  assert.ok(p.block.includes('missing one of `docs/seo/brief-*.md` or `docs/seo/audit-*.md`'), 'the SEO pattern is mangled in the block');
  assert.ok(!/\?/.test(p.block.split('Remaining setup:')[1]), 'a sanitiser mangled the remaining-setup lines');
  const withBrief = E.plan(tree({ 'robots.txt': '', 'docs/seo/audit-2026-10-01.md': '#' }));
  assert.strictEqual(withBrief.routes.find((r) => r.router === 'seo-llmo').setup.state, 'present');
});

it('the block carries no em dash for any class (text for people)', () => {
  for (const surface of Object.keys(SPEC)) {
    const p = E.plan(tree({ 'package.json': pkg({ three: '1', stripe: '1', grammy: '1', '@react-three/xr': '1' }) }), { surface });
    assert.ok(!p.block.includes('\u2014'), `${surface} block carries U+2014`);
  }
});

/* -- the block: round trip, opt-out, malformed, symlink ------------------- */

const ABOVE = '# House rules\n\nForeign text the operator wrote.\n<!-- OTHER:TOOL:BEGIN -->\nnot ours\n<!-- OTHER:TOOL:END -->\n';
const BELOW = '\n## After\n\ntrailing foreign text, no final newline';

it('a new block is appended and every original byte stays in place', () => {
  const p = E.plan(tree({ 'CLAUDE.md': ABOVE }));
  assert.ok(p.ok, JSON.stringify(p.refusals));
  const w = write(p, 'CLAUDE.md');
  assert.strictEqual(w.action, 'insert');
  assert.ok(w.after.startsWith(ABOVE), 'bytes before the block moved');
  const parsed = B.parse(w.after);
  assert.ok(parsed.ok);
  assert.ok(parsed.blocks.some((b) => b.markerId === 'SSHLG:PROJECT' && b.syntaxState === 'PAIRED'));
});

it('an existing block is replaced with foreign text above and below preserved byte for byte', () => {
  const stale = '<!-- SSHLG:PROJECT:BEGIN old -->\nstale routes\n<!-- SSHLG:PROJECT:END -->';
  const before = ABOVE + stale + BELOW;
  const p = E.plan(tree({ 'CLAUDE.md': before, 'AGENTS.md': stale + '\n' }));
  assert.ok(p.ok, JSON.stringify(p.refusals));
  const w = write(p, 'CLAUDE.md');
  assert.strictEqual(w.action, 'replace');
  assert.ok(w.after.startsWith(ABOVE), 'text above changed');
  assert.ok(w.after.endsWith(BELOW), 'text below changed');
  assert.strictEqual(w.after.slice(ABOVE.length, w.after.length - BELOW.length), p.block);
  assert.strictEqual(write(p, 'AGENTS.md').after, p.block + '\n', 'AGENTS.md is written where it exists');
  // Round trip: planning over the written result changes nothing.
  const again = E.plan(tree({ 'CLAUDE.md': w.after, 'AGENTS.md': write(p, 'AGENTS.md').after }));
  assert.deepStrictEqual(again.writes.map((x) => x.action), ['unchanged', 'unchanged']);
});

it('a CRLF file gets a CRLF block', () => {
  const p = E.plan(tree({ 'CLAUDE.md': 'one\r\ntwo\r\n' }));
  const w = write(p, 'CLAUDE.md');
  assert.ok(w.after.startsWith('one\r\ntwo\r\n'));
  assert.ok(!/(^|[^\r])\n/.test(w.after), 'a bare LF landed in a CRLF file');
});

it('with neither file, CLAUDE.md is created holding only the block', () => {
  const p = E.plan(tree({}));
  assert.deepStrictEqual(p.writes.map((w) => [w.file, w.action]), [['CLAUDE.md', 'create']]);
  assert.strictEqual(p.writes[0].after, p.block + '\n');
});

it('an operator opt-out is honoured: refused, nothing written', () => {
  const p = E.plan(tree({ 'CLAUDE.md': '# rules\n<!-- SSHLG:PROJECT:OPTOUT -->\n', 'AGENTS.md': '# agents\n' }));
  assert.strictEqual(p.ok, false);
  assert.ok(p.refusals.some((r) => r.code === 'OPTED_OUT' && r.file === 'CLAUDE.md'), JSON.stringify(p.refusals));
  assert.deepStrictEqual(p.writes, []);
});

it('a malformed file is refused with its reason', () => {
  for (const bad of [
    '<!-- SSHLG:PROJECT:BEGIN -->\nunclosed\n',
    '<!-- SSHLG:PROJECT:BEGIN -->\n<!-- SSHLG:PROJECT:END -->\n<!-- SSHLG:PROJECT:BEGIN -->\n<!-- SSHLG:PROJECT:END -->\n',
    '<!-- OTHER:TOOL:END -->\n',
  ]) {
    const p = E.plan(tree({ 'CLAUDE.md': bad }));
    assert.strictEqual(p.ok, false, bad);
    assert.ok(p.refusals.some((r) => r.code === 'MALFORMED' && r.file === 'CLAUDE.md'), JSON.stringify(p.refusals));
    assert.deepStrictEqual(p.writes, []);
  }
});

it('a symlinked instruction file is refused', () => {
  const p = E.plan(tree({ 'CLAUDE.md': '# rules\n', 'AGENTS.md': '# rules\n' }, ['AGENTS.md']));
  assert.strictEqual(p.ok, false);
  assert.ok(p.refusals.some((r) => r.code === 'SYMLINK' && r.file === 'AGENTS.md'), JSON.stringify(p.refusals));
  assert.deepStrictEqual(p.writes, []);
});

it('AGENTS.md linked to CLAUDE.md is one file: the block is written once, the link untouched', () => {
  const p = E.plan(tree({ 'CLAUDE.md': '# rules\n' }, { 'AGENTS.md': 'CLAUDE.md' }));
  assert.strictEqual(p.ok, true, JSON.stringify(p.refusals));
  assert.ok(write(p, 'CLAUDE.md'), 'CLAUDE.md is written');
  assert.strictEqual(write(p, 'AGENTS.md'), undefined, 'the link itself is never written');
});

it('a link to an absent instruction file is refused', () => {
  const p = E.plan(tree({}, { 'AGENTS.md': 'CLAUDE.md' }));
  assert.strictEqual(p.ok, false);
  assert.ok(p.refusals.some((r) => r.code === 'SYMLINK' && r.file === 'AGENTS.md'), JSON.stringify(p.refusals));
});

it('a link to a file that is not an instruction file is refused', () => {
  const p = E.plan(tree({ 'CLAUDE.md': '# rules\n', 'docs/x.md': 'x' }, { 'AGENTS.md': 'docs/x.md' }));
  assert.strictEqual(p.ok, false);
  assert.ok(p.refusals.some((r) => r.code === 'SYMLINK' && r.file === 'AGENTS.md'), JSON.stringify(p.refusals));
});

it('an unterminated comment that would swallow the block is refused', () => {
  const p = E.plan(tree({ 'CLAUDE.md': '# rules\n<!-- an open comment\n' }));
  assert.strictEqual(p.ok, false);
  assert.ok(p.refusals.some((r) => r.code === 'RESULT_WOULD_NOT_PARSE'), JSON.stringify(p.refusals));
});

/* -- routers.json ---------------------------------------------------------- */

const PACK = {
  'docs/brand/voice.md': 'v', 'docs/brand/terminology.md': 't', 'docs/brand/facts.md': 'f',
  'docs/ux/scenarios.md': 's', 'docs/ux/lint.py': 'l', 'docs/DOCMAP.md': 'd', 'robots.txt': '',
};

it('routers.json entries are declared only for material that exists, and materialised resolves them all', () => {
  const p = E.plan(tree(PACK));
  const w = write(p, M.DECL_PATH);
  assert.strictEqual(w.action, 'create');
  const decl = JSON.parse(w.after);
  assert.deepStrictEqual(Object.keys(decl), ['super-ux', 'copywriting', 'task-pipeline']);
  assert.deepStrictEqual(decl['super-ux'], { materialised: ['docs/ux/scenarios.md'], guards: ['docs/ux/lint.py'] });
  const rows = M.check(decl, REG.order(), tree(PACK).read);
  assert.ok(rows.every((r) => r.satisfied), JSON.stringify(rows));
});

it('a planted missing file gets no declaration', () => {
  const files = Object.assign({}, PACK);
  delete files['docs/brand/facts.md'];
  delete files['docs/ux/lint.py'];
  const p = E.plan(tree(files));
  const decl = JSON.parse(write(p, M.DECL_PATH).after);
  assert.ok(!decl.copywriting, 'a partial brand pack was declared');
  assert.ok(!decl['super-ux'], 'scenarios without their linter were declared');
  assert.ok(!JSON.stringify(decl).includes('facts.md'), 'a missing file is named');
  assert.ok(M.check(decl, REG.order(), tree(files).read).every((r) => r.satisfied));
});

it('nothing to declare writes no routers.json at all', () => {
  const p = E.plan(tree({ 'docs/brand/voice.md': 'v' }));
  assert.strictEqual(write(p, M.DECL_PATH), undefined);
});

it('the routers.json merge keeps a foreign key, its bytes and its order', () => {
  const foreign = '{\n  "zeta": {"materialised": ["x.md"]},\n  "task-pipeline": { "materialised": ["docs/OTHER.md"] },\n  "alpha": 1\n}\n';
  const p = E.plan(tree(Object.assign({ [M.DECL_PATH]: foreign }, PACK)));
  const after = write(p, M.DECL_PATH).after;
  assert.ok(after.startsWith('{\n  "zeta": {"materialised": ["x.md"]},\n  "task-pipeline": { "materialised": ["docs/OTHER.md"] },\n  "alpha": 1'), after);
  const decl = JSON.parse(after);
  assert.deepStrictEqual(Object.keys(decl), ['zeta', 'task-pipeline', 'alpha', 'super-ux', 'copywriting']);
  assert.deepStrictEqual(decl['task-pipeline'], { materialised: ['docs/OTHER.md'] }, 'an entry enroll did not add was rewritten');
});

it('a routers.json that does not parse, or is not an object, is refused', () => {
  for (const bad of ['{ nope', '[]', '{"a":1,"a":2}']) {
    const p = E.plan(tree(Object.assign({ [M.DECL_PATH]: bad }, PACK)));
    assert.strictEqual(p.ok, false, bad);
    assert.ok(p.refusals.some((r) => r.code === 'MALFORMED' && r.file === M.DECL_PATH), JSON.stringify(p.refusals));
  }
});

/* -- purity and registration ----------------------------------------------- */

it('the module never reaches the filesystem: it is handed a reader', () => {
  const src = fs.readFileSync(path.join(ROOT, 'lib', 'enroll.js'), 'utf8');
  const code = src.split('\n').filter((l) => !/^\s*(\*|\/\/)/.test(l)).join('\n');
  assert.ok(!/require\(['"](fs|child_process|os)['"]\)/.test(code), 'enroll.js requires fs, os or child_process');
  const names = ['readFileSync', 'existsSync', 'statSync', 'lstatSync', 'readdirSync', 'writeFileSync', 'openSync', 'realpathSync', 'mkdirSync', 'renameSync'];
  const saved = names.map((n) => fs[n]);
  const touched = [];
  names.forEach((n) => { fs[n] = (...a) => { touched.push(`${n}(${a[0]})`); throw new Error('filesystem reached'); }; });
  try { E.plan(tree(Object.assign({ 'CLAUDE.md': ABOVE, 'package.json': pkg({ next: '1', three: '1' }) }, PACK))); }
  finally { names.forEach((n, i) => { fs[n] = saved[i]; }); }
  assert.deepStrictEqual(touched, []);
});

it('SSHLG:PROJECT is registered as dedicated, written by enroll, and refused by blocks install', () => {
  const r = B.REGISTRY['SSHLG:PROJECT'];
  assert.ok(r && r.dedicated && r.owner === 'sshlg-skills', JSON.stringify(r));
  assert.match(r.writer, /npx sshlg-skills enroll/);
  assert.throws(() => require('../lib/blockwriter.js').admit('SSHLG:PROJECT', 'SSHLG'), /DEDICATED_WRITER/);
  const page = fs.readFileSync(path.join(ROOT, 'docs', 'working-rules', 'managed-blocks.md'), 'utf8');
  assert.match(page, /^\| `SSHLG:PROJECT` \| sshlg-skills \| `npx sshlg-skills enroll` /m);
});

/* -- the real command ------------------------------------------------------- */

const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'enroll-test-'));
const HOME = path.join(tmp, 'home');
fs.mkdirSync(HOME);
function cli(args) {
  const r = spawnSync(process.execPath, [BIN, 'enroll', ...args], {
    encoding: 'utf8', env: Object.assign({}, process.env, { HOME, USERPROFILE: HOME }),
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}
function repo(name, files) {
  const dir = path.join(tmp, name);
  fs.mkdirSync(dir);
  const g = spawnSync('git', ['init', '-q', dir], { encoding: 'utf8' });
  if (g.status !== 0) throw new Error(`git init failed: ${g.stderr}`);
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}
/** Every file under dir except .git, with its hash: what "wrote nothing" is measured by. */
function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { out[path.relative(dir, p) + '/'] = 'dir'; walk(p); }
      else out[path.relative(dir, p)] = sha(fs.readFileSync(p));
    }
  };
  walk(dir);
  return out;
}

it('three runs of the real command on a Git repository leave one hash', () => {
  const dir = repo('three', { 'CLAUDE.md': ABOVE, 'docs/brand/voice.md': 'v\n', 'package.json': pkg({ astro: '5' }) });
  const hashes = [];
  const outs = [];
  for (let i = 0; i < 3; i += 1) {
    const r = cli(['--root', dir]);
    assert.strictEqual(r.status, 0, r.out);
    outs.push(r.out);
    hashes.push(sha(fs.readFileSync(path.join(dir, 'CLAUDE.md'))));
  }
  assert.ok(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8').startsWith(ABOVE));
  assert.strictEqual(hashes[0], hashes[1]);
  assert.strictEqual(hashes[1], hashes[2]);
  assert.match(outs[1], /^enroll: unchanged$/m);
  assert.match(outs[2], /^enroll: unchanged$/m);
  assert.ok(!fs.existsSync(path.join(dir, M.DECL_PATH)), 'a partial brand pack produced a declaration');
});

it('the first write takes a backup through apply.protect() first', () => {
  const dir = repo('backup', { 'CLAUDE.md': '# mine\n' });
  const r = cli(['--root', dir]);
  assert.strictEqual(r.status, 0, r.out);
  const backups = fs.readdirSync(path.join(HOME, '.sshlg-skills', 'backups')).filter((n) => n.startsWith('CLAUDE.md--v2-'));
  assert.ok(backups.length >= 1, 'no backup of CLAUDE.md');
  const copies = backups.map((n) => fs.readFileSync(path.join(HOME, '.sshlg-skills', 'backups', n), 'utf8'));
  assert.ok(copies.includes('# mine\n'), 'the backup does not hold the bytes before the write');
});

it('--dry-run writes nothing and prints the full diff, removals included', () => {
  const stale = '<!-- SSHLG:PROJECT:BEGIN -->\nstale line\n<!-- SSHLG:PROJECT:END -->\n';
  const dir = repo('dry', Object.assign({ 'CLAUDE.md': ABOVE + stale }, PACK));
  const before = snapshot(dir);
  const backupsBefore = fs.existsSync(path.join(HOME, '.sshlg-skills')) ? snapshot(path.join(HOME, '.sshlg-skills')) : null;
  const r = cli(['--root', dir, '--dry-run']);
  assert.strictEqual(r.status, 0, r.out);
  assert.deepStrictEqual(snapshot(dir), before, 'the tree changed');
  const backupsAfter = fs.existsSync(path.join(HOME, '.sshlg-skills')) ? snapshot(path.join(HOME, '.sshlg-skills')) : null;
  assert.deepStrictEqual(backupsAfter, backupsBefore, 'a dry run took a backup');
  assert.match(r.out, /^-stale line$/m, 'the removal is not shown');
  assert.match(r.out, /^\+## Family routes in this project$/m, 'the addition is not shown');
  assert.match(r.out, /\.claude\/routers\.json/);
  assert.match(r.out, /nothing written/);
});

it('a root outside a Git work tree is refused with exit 1', () => {
  const dir = path.join(tmp, 'not-git');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# x\n');
  const r = cli(['--root', dir]);
  assert.strictEqual(r.status, 1, r.out);
  assert.match(r.out, /not inside a Git work tree/);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8'), '# x\n');
});

it('a refusal exits 1 and names its reason; --json carries the code', () => {
  const dir = repo('optout', { 'CLAUDE.md': '<!-- SSHLG:PROJECT:OPTOUT -->\n' });
  const r = cli(['--root', dir, '--json']);
  assert.strictEqual(r.status, 1, r.out);
  const j = JSON.parse(r.out);
  assert.strictEqual(j.state, 'REFUSED');
  assert.ok(j.refusals.some((x) => x.code === 'OPTED_OUT'));
});

it('usage errors exit 2', () => {
  assert.strictEqual(cli(['--surface', 'website']).status, 2);
  assert.strictEqual(cli(['--nope']).status, 2);
  assert.strictEqual(cli(['--root']).status, 2);
});

it('--surface prints the override, and the usage text names the command', () => {
  const dir = repo('override', { 'package.json': pkg({ next: '15' }) });
  const r = cli(['--root', dir, '--surface', 'internal', '--dry-run']);
  assert.strictEqual(r.status, 0, r.out);
  assert.match(r.out, /surface: internal \(override; detected public-web\)/);
  const help = spawnSync(process.execPath, [BIN, '--help'], { encoding: 'utf8' });
  assert.match(help.stdout, /npx sshlg-skills enroll \[--root DIR\] \[--dry-run\] \[--json\] \[--surface public-web\|app-text\|internal\]/);
});

fs.rmSync(tmp, { recursive: true, force: true });

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
