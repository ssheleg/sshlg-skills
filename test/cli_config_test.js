#!/usr/bin/env node
'use strict';
// The `config` command, exercised as a command.
//
// These fixtures stand in for the UX scenarios this repo does not have: the
// intake waived the chain for a four-command launcher and bought exact
// expected output instead. So they assert what the operator actually sees and
// the code the shell actually gets — not that a function returned an object.
//
// Every run has HOME pointed at a temp directory. A fixture that could reach
// the real ~/.sshlg-skills would be a fixture that edits the machine it runs
// on.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'sshlg-skills.js');
const registry = require('../lib/routers-registry.js');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

function tmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-cli-'));
}

function run(home, args) {
  const r = spawnSync(process.execPath, [BIN].concat(args), {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { HOME: home }),
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

it('`config` lists every router, and defaults them all to on', () => {
  const home = tmpHome();
  const r = run(home, ['config']);
  assert.strictEqual(r.code, 0, r.out);
  for (const name of registry.order()) {
    assert.ok(
      new RegExp('routers\\.' + name + '\\s+on').test(r.out),
      `missing or not-on: ${name}\n${r.out}`
    );
  }
});

// Counted from the registry rather than typed: a hand-kept number here is a second
// place a router has to be added, and the tenth was added while this line still said
// nine. The assertion that matters is *every router the registry declares is
// switchable*, which is what this now says.
it('`config` lists every router the registry declares — no more, no fewer', () => {
  const home = tmpHome();
  const expected = require('../lib/routers-registry.js').order().length;
  const lines = run(home, ['config']).out.split('\n').filter((l) => /^\s+routers\./.test(l));
  assert.strictEqual(lines.length, expected, lines.join('\n'));
});

it('`config list` is the same thing spelled out', () => {
  const home = tmpHome();
  assert.strictEqual(run(home, ['config']).out, run(home, ['config', 'list']).out);
});

it('`config set … off` reports the transition and how to apply it', () => {
  const home = tmpHome();
  const r = run(home, ['config', 'set', 'routers.seo-llmo', 'off']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(r.out.includes('routers.seo-llmo: on → off'), r.out);
  assert.ok(r.out.includes('routers --update'), 'the operator is not told how to apply it');
});

it('the setting survives into the next invocation', () => {
  const home = tmpHome();
  run(home, ['config', 'set', 'routers.seo-llmo', 'off']);
  assert.ok(/routers\.seo-llmo\s+off/.test(run(home, ['config']).out));
});

it('setting the same value again says so and stays 0', () => {
  const home = tmpHome();
  run(home, ['config', 'set', 'routers.make-skill', 'off']);
  const r = run(home, ['config', 'set', 'routers.make-skill', 'off']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(r.out.includes('(без изменений)'), r.out);
});

it('an unknown router exits non-zero and prints the valid names', () => {
  const home = tmpHome();
  const r = run(home, ['config', 'set', 'routers.nope', 'off']);
  assert.strictEqual(r.code, 2, r.out);
  assert.ok(r.out.includes('routers.sheleg-design'), 'no list of valid names');
  assert.ok(r.out.includes('routers.evidence-docs'));
});

it('an unknown state exits non-zero rather than guessing', () => {
  const home = tmpHome();
  const r = run(home, ['config', 'set', 'routers.seo-llmo', 'maybe']);
  assert.strictEqual(r.code, 2, r.out);
  assert.ok(/on или off/.test(r.out), r.out);
});

it('a missing state is refused, not read as "off"', () => {
  const home = tmpHome();
  const r = run(home, ['config', 'set', 'routers.seo-llmo']);
  assert.strictEqual(r.code, 2, r.out);
  assert.ok(!fs.existsSync(path.join(home, '.sshlg-skills', 'config.json')), 'it wrote anyway');
});

it('a key outside routers.* is refused', () => {
  const home = tmpHome();
  const r = run(home, ['config', 'set', 'stages.build', 'off']);
  assert.strictEqual(r.code, 2, r.out);
  assert.ok(r.out.includes('routers.'), r.out);
});

it('an unknown subcommand is refused', () => {
  const home = tmpHome();
  const r = run(home, ['config', 'enable', 'routers.seo-llmo']);
  assert.strictEqual(r.code, 2, r.out);
});

it('a refused call writes nothing at all', () => {
  const home = tmpHome();
  run(home, ['config', 'set', 'routers.nope', 'off']);
  run(home, ['config', 'enable']);
  assert.ok(!fs.existsSync(path.join(home, '.sshlg-skills')), 'a rejected call created state');
});

it('--help names config, so the command is discoverable', () => {
  const home = tmpHome();
  const r = run(home, ['--help']);
  assert.strictEqual(r.code, 0);
  assert.ok(r.out.includes('config  set routers.<name> on|off'), r.out);
});

it('`routers --dry-run` writes neither the block nor the settings', () => {
  const home = tmpHome();
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), '# mine\n\nprose\n');
  const r = run(home, ['routers', '--dry-run']);
  assert.strictEqual(r.code, 0, r.out);
  assert.strictEqual(fs.readFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'utf8'), '# mine\n\nprose\n');
  assert.ok(!fs.existsSync(path.join(home, '.sshlg-skills', 'config.json')), 'a preview wrote settings');
});

// --- the round trip, end to end -----------------------------------------
//
// The property the whole setting rests on: switching a router off and back on
// must return the operator's OWN wording, not the packaged default. On a real
// machine that wording arrived through migration, and ~/.claude/CLAUDE.md has
// no version control to restore it from — so this is checked against the
// command, not against a function.

function seededHome() {
  const home = tmpHome();
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(home, '.sshlg-skills'), { recursive: true });
  // consent already given, as it would be after one interactive install
  fs.writeFileSync(
    path.join(home, '.sshlg-skills', 'state.json'),
    JSON.stringify({ routers: 'yes' }) + '\n'
  );
  return home;
}

const HANDWRITTEN_TP = [
  '## Роутинг работы — по умолчанию через task-pipeline',
  '',
  '**Моя формулировка, а не упакованная.** Прогонять десять стадий ради',
  'одного символа — самый быстрый способ научить обходить пайплайн стороной.',
].join('\n');

it('end to end: off removes the section, on brings the same bytes back', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, '# Мои правила\n\nПроза сверху.\n\n' + HANDWRITTEN_TP + '\n');

  // 1. install — migration moves the hand-written rule into the block
  let r = run(home, ['routers']);
  assert.strictEqual(r.code, 0, r.out);
  let text = fs.readFileSync(md, 'utf8');
  assert.ok(text.includes('SSHLG:ROUTER:task-pipeline:BEGIN'), 'no section written\n' + r.out);
  assert.ok(text.includes('Моя формулировка, а не упакованная.'), 'the packaged text overwrote mine');
  const withSection = text;

  // 2. off, then apply
  assert.strictEqual(run(home, ['config', 'set', 'routers.task-pipeline', 'off']).code, 0);
  r = run(home, ['routers', '--update']);
  assert.strictEqual(r.code, 0, r.out);
  text = fs.readFileSync(md, 'utf8');
  assert.ok(!text.includes('SSHLG:ROUTER:task-pipeline:BEGIN'), 'the section survived being switched off');
  assert.ok(!text.includes('Моя формулировка'), 'the body was left behind in the file');
  assert.ok(text.includes('Проза сверху.'), 'prose outside the block was touched');

  // the body is kept, not dropped
  const cfg = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'config.json'), 'utf8'));
  assert.ok(cfg.stash && cfg.stash['task-pipeline'], 'nothing was stashed — the wording is gone');
  assert.ok(cfg.stash['task-pipeline'].includes('Моя формулировка'));

  // 3. on, then apply — the same bytes come back
  assert.strictEqual(run(home, ['config', 'set', 'routers.task-pipeline', 'on']).code, 0);
  r = run(home, ['routers', '--update']);
  assert.strictEqual(r.code, 0, r.out);
  text = fs.readFileSync(md, 'utf8');
  assert.ok(text.includes('Моя формулировка, а не упакованная.'), 'the packaged default came back instead of mine');
  assert.strictEqual(text, withSection, 'the round trip was not byte-exact');
});

it('end to end: the preview reports its removals, not only its additions', () => {
  // Migration deliberately writes nothing on a dry run, so re-reading the
  // file previewed the block going in with none of the hand-written sections
  // coming out. Against the operator's real file that read +361/-1 where the
  // run removes eighty-odd lines. A preview that under-reports removals gets
  // read as permission.
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  const src = '# Мои правила\n\n' + HANDWRITTEN_TP + '\n';
  fs.writeFileSync(md, src);

  const r = run(home, ['routers', '--dry-run']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(
    r.out.includes('-## Роутинг работы — по умолчанию через task-pipeline'),
    'the preview never showed the section it would remove:\n' + r.out
  );
  assert.ok(r.out.split('\n').some((l) => l.startsWith('+<!-- SSHLG:ROUTERS:BEGIN')), 'no addition shown');
  assert.strictEqual(fs.readFileSync(md, 'utf8'), src, 'the preview wrote to the file');
});

it('end to end: your wording survives the SECOND run, not just the first', () => {
  // Migration moves a hand-written rule in and removes its heading, so from
  // the second run onward the file no longer says the section is yours. The
  // packaged default then regenerated over it — "hand-written rules win" was
  // true exactly once. Observed against the operator's real file: run two
  // replaced both migrated sections with the packaged text.
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, '# Мои правила\n\n' + HANDWRITTEN_TP + '\n');

  run(home, ['routers']);
  const afterFirst = fs.readFileSync(md, 'utf8');
  assert.ok(afterFirst.includes('Моя формулировка, а не упакованная.'), 'run 1 did not migrate');

  run(home, ['routers']);
  const afterSecond = fs.readFileSync(md, 'utf8');
  assert.ok(
    afterSecond.includes('Моя формулировка, а не упакованная.'),
    'the second run regenerated the packaged default over the operator’s words'
  );
  assert.strictEqual(afterSecond, afterFirst, 'the second run was not idempotent');

  run(home, ['routers']);
  assert.strictEqual(fs.readFileSync(md, 'utf8'), afterFirst, 'the third run drifted');
});

it('end to end: an edit made inside the block by hand is not overwritten', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, '# Мои правила\n\n' + HANDWRITTEN_TP + '\n');
  run(home, ['routers']);

  const edited = fs
    .readFileSync(md, 'utf8')
    .replace('Моя формулировка, а не упакованная.', 'Формулировка, поправленная руками уже внутри блока.');
  fs.writeFileSync(md, edited);

  run(home, ['routers']);
  assert.strictEqual(fs.readFileSync(md, 'utf8'), edited, 'a hand edit inside the block was reverted');
});

it('end to end: a router the operator never wrote still gets the packaged text', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, '# Мои правила\n\n' + HANDWRITTEN_TP + '\n');
  run(home, ['routers']);
  const text = fs.readFileSync(md, 'utf8');
  // sheleg-design has no hand-written counterpart, so it must be the default
  // The packaged text is English since v0.32.0 — the operator's own wording,
  // when they have written some, is whatever they wrote and stays theirs.
  assert.ok(text.includes('If `sheleg-design` is installed'), 'a never-written router was left out');
});

it('end to end: a switched-off router loses its table row too', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, '# Мои правила\n');
  run(home, ['routers']);
  assert.ok(fs.readFileSync(md, 'utf8').includes('| `seo-llmo` |'), 'precondition: the row is there');

  run(home, ['config', 'set', 'routers.seo-llmo', 'off']);
  run(home, ['routers', '--update']);
  const text = fs.readFileSync(md, 'utf8');
  assert.ok(!text.includes('| `seo-llmo` |'), 'the row outlived the section');
  assert.ok(text.includes('| `evidence-docs` |'), 'it took a neighbour with it');
});

it('end to end: the competing planning rule is superseded and kept', () => {
  const home = seededHome();
  const md = path.join(home, '.claude', 'CLAUDE.md');
  fs.writeFileSync(md, [
    '# Мои правила',
    '',
    '## Task planning — always the Superpowers cycle',
    '',
    'Старое правило планирования.',
    '',
    '# graphify',
    '',
    'Правило про граф, которое обязано выжить.',
    '',
  ].join('\n'));

  const r = run(home, ['routers']);
  assert.strictEqual(r.code, 0, r.out);
  const text = fs.readFileSync(md, 'utf8');
  assert.ok(!text.includes('## Task planning'), 'the competing rule survived');
  assert.ok(text.includes('# graphify'), 'the H1 below it was taken too');
  assert.ok(text.includes('Правило про граф, которое обязано выжить.'));

  const cfg = JSON.parse(fs.readFileSync(path.join(home, '.sshlg-skills', 'config.json'), 'utf8'));
  assert.ok(
    cfg.stash && cfg.stash['superseded:task-planning'].includes('Старое правило планирования.'),
    'the superseded body was deleted rather than kept'
  );
});

// `list` ANSWERS THE TWO QUESTIONS THE README OFFERS IT FOR.
//
// It printed name, version, repo and the full marketing paragraph — 22 lines, 5,398
// bytes, ~4,900 of them nine descriptions — and answered neither "when does each of
// these fire?" nor "am I current?". The data for the first was sitting unused in the
// same manifest the function already reads: `entry` and `role` are on every member and
// neither was ever printed.
it('`list` NAMES EACH MEMBER\'S ENTRY POINT AND ROLE', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'skills.json'), 'utf8'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-list-'));
  const out = run(home, ['list']).out;
  for (const m of manifest.skills) {
    assert.ok(out.includes(m.role), `list never prints ${m.name}'s role`);
    if (m.entry) {
      assert.ok(out.includes(m.entry), `list never prints ${m.name}'s entry (${m.entry})`);
    }
  }
  // A member with no entry says so rather than leaving the column blank — three of nine
  // genuinely have none, and an empty cell reads as an omission.
  const noEntry = manifest.skills.filter((m) => !m.entry);
  if (noEntry.length) assert.ok(/—/.test(out), 'a member with no entry point shows nothing at all');
});

it('`list` is a roster by default and the paragraphs are behind a flag', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sshlg-list2-'));
  const plain = run(home, ['list']).out;
  const verbose = run(home, ['list', '--verbose']).out;
  assert.ok(verbose.length > plain.length * 2,
    'the descriptions did not move behind --verbose');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'skills.json'), 'utf8'));
  assert.ok(!plain.includes(manifest.skills[0].desc),
    'the default output still carries a full description');
  assert.ok(verbose.includes(manifest.skills[0].desc),
    '--verbose dropped the description instead of adding it');
});

if (failures.length) {
  failures.forEach((f) => console.log('FAIL: ' + f));
  console.log(`${failures.length} failure(s) out of ${checks} checks`);
  process.exit(1);
}
console.log(`OK (${checks} checks)`);
