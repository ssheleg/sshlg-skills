#!/usr/bin/env node
'use strict';
/**
 * R01/R02 — what the hooks print over a scripted day, before and after.
 *
 *   node docs/evidence/runs/2026-10-12-wave1/simulate.js [base-rev]   (default 5852c57)
 *
 * Five sessions of twelve prompts each, a `compact` after the sixth prompt of every
 * session, in a sandbox HOME with two enabled plugins that hook SessionStart. Every hook
 * is a real process (`hooks/session-start.js`, `hooks/user-prompt-submit.js`), run once
 * from the base revision and once from the working tree. Counts the routing notes, the
 * "Also speaking at SessionStart" lines, and the SessionStart context, in characters.
 * Prints one JSON line per side. Nothing outside the sandbox is read or written.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { REPO, materialise } = require('./_base.js');

const PROMPTS = [
  'сделай фичу экспорта в csv',
  'исправь баг в оплате',
  'сделай редизайн лендинга',
  'почему тесты падают?',
  'добавь Telegram-бота для уведомлений',
  'поправь текст ошибки на экране входа',
  'сделай фичу экспорта в csv',
  'подключи Sentry к сервису',
  'отрефактори модуль оплаты',
  'сделай лендинг, но без дизайна',
  'напиши пост для X про релиз',
  'исправь баг в оплате',
];
const SESSIONS = 5;

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function run(root) {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wave1-sim-')));
  for (const name of ['alpha', 'beta']) {
    write(path.join(home, '.claude', 'plugins', 'cache', 'mk', name, '1.0.0', 'hooks', 'hooks.json'),
      JSON.stringify({ hooks: { SessionStart: [] } }));
  }
  write(path.join(home, '.claude', 'settings.json'),
    JSON.stringify({ enabledPlugins: { 'alpha@mk': true, 'beta@mk': true } }));
  const env = Object.assign({}, process.env, { HOME: home, USERPROFILE: home, SSHLG_SKILLS_NO_PROBE: '1' });
  const hook = (script, payload) => spawnSync(process.execPath, [path.join(root, 'hooks', script)],
    { input: JSON.stringify(payload), encoding: 'utf8', env, cwd: home }).stdout || '';
  const out = { notes: 0, noteChars: 0, injectorLines: 0, injectorChars: 0, sessionStarts: 0, sessionChars: 0 };
  const start = (id, source) => {
    const raw = hook('session-start.js', { hook_event_name: 'SessionStart', source, session_id: id, cwd: home });
    const ctx = raw.trim() ? JSON.parse(raw).hookSpecificOutput.additionalContext || '' : '';
    out.sessionStarts += 1;
    out.sessionChars += ctx.length;
    for (const line of ctx.split('\n')) {
      if (line.includes('Also speaking at SessionStart')) { out.injectorLines += 1; out.injectorChars += line.length; }
    }
  };
  for (let s = 1; s <= SESSIONS; s += 1) {
    const id = `sim-${s}`;
    start(id, 'startup');
    PROMPTS.forEach((prompt, i) => {
      if (i === PROMPTS.length / 2) start(id, 'compact');
      const note = hook('user-prompt-submit.js', { session_id: id, prompt_id: `p${i}`, prompt }).trim();
      if (note.includes('[sshlg-routing]')) { out.notes += 1; out.noteChars += note.length; }
    });
  }
  fs.rmSync(home, { recursive: true, force: true });
  return out;
}

const base = process.argv[2] || '5852c57';
const baseRoot = materialise(base);
console.log(JSON.stringify(Object.assign({ side: `base ${base}` }, run(baseRoot))));
console.log(JSON.stringify(Object.assign({ side: 'working tree' }, run(REPO))));
fs.rmSync(baseRoot, { recursive: true, force: true });
