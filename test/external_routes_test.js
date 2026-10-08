#!/usr/bin/env node
'use strict';
// Routes the operator declares for skills OUTSIDE the family (REQ-04, 2026-10-08).
//
// The audit found media with no route at all: no hook line, no conflicts lexicon, no
// toolkit priority — so a foreign skill that called itself the "mandatory entry point"
// won "make a promo video" by default. The family cannot ship the operator's media
// route: naming a skill one machine carries in a PUBLIC package ships a fact about one
// laptop as doctrine. So the mechanism ships, with the neutral `example-media`, and the
// roster lives in `~/.sshlg-skills/config.json`.
//
// Every fixture points HOME at a temp directory and removes it. One that could reach the
// real ~/.sshlg-skills would edit the machine it runs on.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'sshlg-skills.js');
const HOOK = path.join(ROOT, 'hooks', 'user-prompt-submit.js');
const T = require('../lib/triggers.js');
const C = require('../lib/conflicts.js');
const K = require('../lib/toolkit.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const homes = [];
function tmpHome() {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-ext-'));
  homes.push(h);
  return h;
}
function run(home, args, input) {
  const r = spawnSync(process.execPath, args, {
    encoding: 'utf8', input,
    env: Object.assign({}, process.env, { HOME: home }),
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const cli = (home, ...args) => run(home, [BIN].concat(args));
const configOf = (home) => JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'config.json'), 'utf8'));

const MEDIA = 'ролик, видео, иконка, озвучка, promo video, ad video, icon, voice-over';

// --- the CLI -------------------------------------------------------------------------

it('`config set routes.external.<name>.triggers` writes a declaration and says where', () => {
  const home = tmpHome();
  const r = cli(home, 'config', 'set', 'routes.external.example-media.triggers', MEDIA);
  assert.strictEqual(r.code, 0, r.out);
  const file = path.join(home, '.sshlg-skills', 'config.json');
  assert.ok(r.out.includes(file), `the command did not name the file it wrote:\n${r.out}`);
  const decl = configOf(home).routes.external['example-media'];
  assert.deepStrictEqual(decl.triggers, MEDIA.split(', '));
  assert.strictEqual(fs.statSync(file).mode & 0o777, 0o600, 'the settings file is not 0600');
});

it('an unquoted list arrives whole — every word after the key is the value', () => {
  const home = tmpHome();
  const r = cli(home, 'config', 'set', 'routes.external.example-media.triggers', 'promo', 'video,', 'icon');
  assert.strictEqual(r.code, 0, r.out);
  assert.deepStrictEqual(configOf(home).routes.external['example-media'].triggers, ['promo video', 'icon']);
});

it('`.skill` and `off` round-trip, and `config` lists the declaration', () => {
  const home = tmpHome();
  cli(home, 'config', 'set', 'routes.external.example-media.triggers', MEDIA);
  assert.strictEqual(cli(home, 'config', 'set', 'routes.external.example-media.skill', 'example-media-skill').code, 0);
  const listed = cli(home, 'config');
  assert.ok(/routes\.external\.example-media\s+→ example-media-skill/.test(listed.out), listed.out);
  const off = cli(home, 'config', 'set', 'routes.external.example-media', 'off');
  assert.strictEqual(off.code, 0, off.out);
  assert.strictEqual((configOf(home).routes || {}).external, undefined, 'off left the declaration behind');
  assert.ok(/Объявленных маршрутов нет/.test(cli(home, 'config').out));
});

it('a declaration that cannot work is REFUSED, with the reason, and nothing is written', () => {
  const home = tmpHome();
  const cases = [
    [['routes.external.task-pipeline.triggers', 'ролик'], /family router/],
    [['routes.external.Bad_Name.triggers', 'ролик'], /lowercase/],
    // a trigger inside a refusal phrase would make the refusal summon the route
    [['routes.external.example-media.triggers', 'без пайплайна'], /refusal/],
    [['routes.external.example-media.triggers', 'что такое'], /question/],
    [['routes.external.example-media.skill', 'not a skill!'], /not a skill id/],
    [['routes.external.example-media', 'on'], /только off/],
  ];
  for (const [args, why] of cases) {
    const r = cli(home, 'config', 'set', ...args);
    assert.strictEqual(r.code, 2, `${args.join(' ')} → ${r.code}\n${r.out}`);
    assert.ok(why.test(r.out), `${args.join(' ')}: the refusal does not say why\n${r.out}`);
  }
  assert.ok(!fs.existsSync(path.join(home, '.sshlg-skills', 'config.json')),
    'a refused declaration still wrote the settings file');
});

it('the other settings in the file survive a declaration', () => {
  const home = tmpHome();
  cli(home, 'config', 'set', 'routers.seo-llmo', 'off');
  cli(home, 'config', 'set', 'routes.external.example-media.triggers', MEDIA);
  const c = configOf(home);
  assert.strictEqual(c.routers['seo-llmo'], 'off', 'declaring a route lost a router setting');
  assert.ok(c.routes.external['example-media']);
});

// --- the hook, as a process -------------------------------------------------------------

it('the prompt hook prints the declared route — and only once it is declared', () => {
  const home = tmpHome();
  const payload = JSON.stringify({ prompt: 'сделай рекламный ролик для приложения', session_id: 's1' });
  assert.strictEqual(run(home, [HOOK], payload).out, '', 'an undeclared route fired');
  cli(home, 'config', 'set', 'routes.external.example-media.triggers', MEDIA);
  const out = run(home, [HOOK], payload).out;
  assert.ok(out.includes('example-media'), `the declared route was not named:\n${out}`);
  // …and recorded it for the PreToolUse escalation of the same turn
  const turns = path.join(home, '.sshlg-skills', 'turns');
  const state = JSON.parse(fs.readFileSync(path.join(turns, fs.readdirSync(turns)[0]), 'utf8'));
  assert.ok((state.routes || []).includes('example-media'), JSON.stringify(state));
});

it('a corrupt settings file costs the declared route and nothing else', () => {
  const home = tmpHome();
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  fs.writeFileSync(path.join(home, '.sshlg-skills', 'config.json'), '{ not json');
  const out = run(home, [HOOK], JSON.stringify({ prompt: 'добавь Telegram-бота' })).out;
  assert.ok(out.includes('telegram-dev'), `a family route went quiet with the bad file:\n${out}`);
});

it('the escalation can NAME a declared route rather than print a bare id', () => {
  const lines = T.routeLines(T.externalRoutes({ 'example-media': { triggers: ['icon'] } }));
  assert.ok(/example-media/.test(lines['example-media']) && /declared/.test(lines['example-media']));
  assert.strictEqual(lines['task-pipeline'], T.ROUTES['task-pipeline'].line);
});

// --- conflicts and toolkit ------------------------------------------------------------

const ext = T.externalRoutes({ 'example-media': { triggers: MEDIA, skill: 'example-media' } });
const ROSTER = [
  { plugin: 'video@vendor', id: 'product-launch-video', description: 'Turn a URL into a promo video for a launch.' },
  { plugin: 'video@vendor', id: 'general-video', description: 'Mandatory entry point for any ad video work.' },
  { plugin: 'media@mine', id: 'example-media', description: 'Any media: promo video, icon, voice-over.' },
  { plugin: 'other@vendor', id: 'pdf', description: 'Read and write PDF files.' },
];

it('`conflicts` flags foreign skills on declared ground, and never the declared skill', () => {
  const rows = C.collisions(ROSTER, { external: ext, routers: [] });
  const ids = rows.map((r) => `${r.id}→${r.router}`).sort();
  assert.deepStrictEqual(ids, ['general-video→example-media', 'product-launch-video→example-media']);
  assert.ok(rows.every((r) => r.declared), 'a declared-route row is not marked as such');
  assert.ok(/declared route/.test(C.report(rows)), 'the report does not say where the ground came from');
  // and without a declaration the same roster lands nowhere — the ground is the operator's
  assert.deepStrictEqual(C.collisions(ROSTER, { routers: [] }), []);
});

it('`toolkit --for` puts the declared skill FIRST on its terms', () => {
  const seeds = K.seedsFor(T, 'make a promo video for the app', ext);
  assert.deepStrictEqual(seeds.map((s) => s.id), ['example-media']);
  const { rows } = K.rank(ROSTER, 'make a promo video for the app', 5, [], { seeds });
  assert.strictEqual(rows[0].id, 'example-media', rows.map((r) => r.id).join(','));
  assert.ok(rows[0].declared);
});

// --- the public repository names none of the operator's own agents ---------------------

it('the mechanism ships with the neutral example and names no personal agent', () => {
  // The names come from the operator's standing rule; they are assembled here from parts
  // so that THIS file does not become the place that publishes them.
  const banned = [['asset', 'foundry'], ['frame', 'agent'], ['copy', 'lot'], ['mobile', 'publisher'],
                  ['brand', 'board'], ['web', 'pilot']].map(([a, b]) => new RegExp(`${a}[\\s-]?${b}`, 'i'));
  const files = ['lib/triggers.js', 'lib/config.js', 'lib/conflicts.js', 'lib/toolkit.js', 'lib/injectors.js',
                 'hooks/user-prompt-submit.js', 'hooks/pre-tool-use.js', 'test/evals/hook-routing.json',
                 'test/hook_routing_eval_test.js', 'test/external_routes_test.js'];
  const hits = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const re of banned) if (re.test(text)) hits.push(`${f}: ${re}`);
  }
  assert.deepStrictEqual(hits, []);
  assert.ok(/example-media/.test(fs.readFileSync(path.join(ROOT, 'test/evals/hook-routing.json'), 'utf8')));
});

for (const h of homes) fs.rmSync(h, { recursive: true, force: true });

if (failures.length) {
  failures.forEach((f) => console.log(`FAIL: ${f}`));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
