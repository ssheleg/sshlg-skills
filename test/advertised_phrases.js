'use strict';
/**
 * What a family SKILL.md advertises, and which advertised phrases may stay off its route.
 *
 * One home for both readers (B-295): `test/triggers_test.js` runs the hub's completeness
 * fixture over every member, and `test/advertised_check.js` (which each member's own
 * `test/validate.py` runs) applies the same check to one member before it releases, so a
 * new `## Triggers` phrase no route reaches fails in the member, not at the hub's pin.
 * Not a suite (no `_test` suffix): `test/run.js` discovers `*_test.js` only.
 *
 * The COMPLETENESS half of the derivation proof. The soundness fixture in
 * `test/triggers_test.js` asks whether every trigger is advertised; this one asks whether
 * every advertised phrase is a trigger. On 2026-09-05 **26 of 169** description phrases were not. On 2026-10-20 the
 * trigger lists moved out of the descriptions into each SKILL.md's `## Triggers` body,
 * and this check kept reading only the description, and only the FIRST skill of each
 * route: by 2026-10-27 it held 7 skills' worth of phrases while 39 skills advertised
 * (B-265). It now reads both places in every family SKILL.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/**
 * A quoted phrase: "…", «…», or '…' whose quotes are not apostrophes. The single-quote
 * arm requires a non-letter on both outer sides, so "why doesn't ChatGPT cite us" and
 * "the pipeline's own ladder" are not cut at the apostrophe, which the first form of
 * this regex did (`[«"']…[»"']` read `"why doesn'` as a phrase and lost the pairing of
 * every quote after it).
 */
const QUOTED = /"([^"]*)"|«([^»]*)»|(?<![\p{L}\p{N}])'([^'\n]*?)'(?![\p{L}\p{N}])/gu;
const PHRASE_MAX = 80;

/**
 * The phrases a stretch of advertisement quotes, split on commas the way one pair of
 * quotes lists several («палитра, цвета»). A quote longer than a phrase is a description
 * carried verbatim into the body (task-pipeline 1.98.0 moved its old descriptions
 * there): the phrases quoted INSIDE it count, up to its "Not for", where refusals begin.
 */
function quotedPhrases(text) {
  const out = [];
  for (const m of text.matchAll(QUOTED)) {
    const inner = (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]).trim();
    if (inner.length > PHRASE_MAX) {
      const stop = inner.search(/[.;:]?\s+not for\b/i);
      out.push(...quotedPhrases(stop > 0 ? inner.slice(0, stop) : inner));
      continue;
    }
    out.push(...inner.split(/\s*,\s*/));
  }
  return out.map((x) => x.trim()).filter((x) => x.length > 2 && /[a-zа-яё]/i.test(x));
}

/** The description's `Triggers -` list, up to the sentence that starts its boundary. */
function descriptionTriggers(text) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!fm) return '';
  const d = /^description:\s*(?:[>|]-?\s*\n)?([\s\S]*?)(?=\n[a-z-]+:|(?![\s\S]))/m.exec(fm[1]);
  const s = d ? d[1].replace(/\s+/g, ' ') : '';
  const at = s.search(/Triggers\s*[-\u2013\u2014:]/i);
  if (at === -1) return '';
  const seg = s.slice(at);
  const stop = seg.search(/\.\s+(?:Not for|For defining|The boundary)/i);
  return stop > 0 ? seg.slice(0, stop) : seg;
}

/** The body's `## Triggers` section, up to the next second-level heading. */
function bodyTriggers(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  const m = /^## Triggers[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(body);
  return m ? m[1].replace(/\s+/g, ' ') : '';
}

/** Every phrase one SKILL.md advertises, each once, with where it was first read. */
function advertisedPhrases(text) {
  const seen = new Map();
  for (const p of quotedPhrases(descriptionTriggers(text))) if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), { phrase: p, where: 'description' });
  for (const p of quotedPhrases(bodyTriggers(text))) if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), { phrase: p, where: '## Triggers' });
  return [...seen.values()];
}

/**
 * One member checkout's shipped SKILL.md files as `member/skill` → path, read from
 * `<root>/plugins/<plugin>/skills/<skill>/SKILL.md`. `.cursor/` mirrors are not shipped skills.
 */
function memberSkills(member, root) {
  const out = new Map();
  const plugins = path.join(root, 'plugins');
  if (!fs.existsSync(plugins)) return out;
  for (const plugin of fs.readdirSync(plugins).sort()) {
    const dir = path.join(plugins, plugin, 'skills');
    if (!fs.existsSync(dir)) continue;
    for (const skill of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, skill, 'SKILL.md');
      if (fs.existsSync(file)) out.set(`${member}/${skill}`, file);
    }
  }
  return out;
}

/** Every family SKILL.md under the hub's `skills/<member>` submodules. */
function familySkills() {
  const out = new Map();
  const base = path.join(ROOT, 'skills');
  if (!fs.existsSync(base)) return out;
  for (const member of fs.readdirSync(base)) {
    for (const [ref, file] of memberSkills(member, path.join(base, member))) out.set(ref, file);
  }
  return out;
}

/** `member/skill` → the route whose table names it as a source. */
function routeOfSkill() {
  const owner = new Map();
  for (const [route, spec] of Object.entries(require('../lib/triggers.js').ROUTES)) {
    for (const g of spec.sources || [{ skill: spec.skill }]) if (!owner.has(g.skill)) owner.set(g.skill, route);
  }
  return owner;
}

/**
 * Skills deliberately on no route, with the reason. Their phrases are not checked.
 */
const UNROUTED = new Map([
  ['make-skill/skill-search', 'the first-step catalogue search every task runs (the '
    + 'routing protocol\'s `toolkit --find`); make-skill\'s router boundary excludes USING a '
    + 'skill, so its line would be false on «какой скилл»'],
]);

// Shared reasons, so one judgement reads once.
const GENERIC_STORE = 'a store-release word every mobile app uses; Mobile Publisher owns the '
  + 'App Store and Google Play, and xr-dev\'s boundary excludes phone apps';
const GENERIC_PROFILER = 'a general Android or GPU profiler; a phone-app or desktop profiling '
  + 'prompt would be told it builds for a Quest headset';
const ML_MODEL = 'an ML model is compressed and is too heavy in the same words (measured: «сожми '
  + 'модель квантованием» named web3d-dev); the asset forms (`compress this glb`) route';

/**
 * Advertised phrases the hook does NOT route, each with why routing it would speak where
 * silence is right. Keyed by skill, then by the phrase as the member writes it, lowercased.
 * Every entry must still be advertised and still unreached, or it fails as stale.
 */
const NOT_ROUTED = {
  'agent-stack/agent-harness': {
    'static or dynamic': 'too generic: static or dynamic typing, imports and linking say it '
      + 'about code that is not an agent',
  },
  'agent-stack/agent-interop': {
    'server.json': 'a file name many servers and tools use; routing it would name agent-stack '
      + 'on any server config edit',
    'agentgateway': 'names this machine\'s own running gateway (~/.config/agentgateway); an ops '
      + 'prompt about it would be told it builds an agent system',
  },
  'sheleg-dev/ad-tracking': {
    'retargeting': 'the English stem `retarget` also fires on "retarget Mixamo", web3d-dev\'s '
      + 'animation word (measured: both routes named)',
    'google ads': 'campaign work is asked for by the product name, and ad-tracking says "Not '
      + 'for campaigns"',
  },
  'sheleg-dev/error-tracking': {
    'release tracking': 'release tracking in a project tracker says it too (measured: "set up '
      + 'release tracking in jira" named sheleg-dev); «релизы в Sentry» routes',
    'наблюдаемость': 'an infrastructure word: route_coverage keeps «настрой мониторинг и алерты» '
      + 'silent, and observability beyond error tracking is not the pack\'s',
  },
  'sheleg-dev/frontend-performance': {
    'performance audit': 'a database or backend performance audit says it too (measured: named '
      + 'sheleg-dev); nothing names a page',
    'оптимизация скорости': 'the speed of anything, a query or a build (measured: «оптимизация '
      + 'скорости запросов к базе» named sheleg-dev)',
    'cls': 'Python\'s `cls` parameter: «переименуй cls в классметоде» would be told it wires '
      + 'money or tracking',
    'lazy loading': 'ORM lazy loading (SQLAlchemy, Hibernate) is the same phrase about a '
      + 'database, not a page',
  },
  'sheleg-dev/google-auth': {
    'service account': 'Kubernetes and every cloud have service accounts; the phrase alone '
      + 'does not name Google',
    'сервисный аккаунт': 'Kubernetes and every cloud have service accounts; the phrase alone '
      + 'does not name Google',
  },
  'super-ux/ux-foundation': {
    'джобы': 'CI and cron jobs in Russian dev speech (measured: «cron джобы падают» named '
      + 'super-ux); `jtbd` routes',
    'who is this for': 'a generic question about any artefact ("who is this PR for"), and the '
      + 'hook keeps questions silent',
  },
  'super-ux/ux-audit': {
    'run the scenarios': 'load-test scenarios (k6, Gatling) are run in the same words (measured: '
      + '"run the load test scenarios" named super-ux)',
  },
  'super-ux/ux-scenarios': {
    'новая фича': 'fires on every new feature, including internal scripts super-ux\'s boundary '
      + 'excludes; task-pipeline already names the delivery',
    'new feature': 'fires on every new feature, including internal scripts super-ux\'s boundary '
      + 'excludes; task-pipeline already names the delivery',
    'use cases': 'a code layer in clean architecture (`UseCases`) and a testing phrase as often '
      + 'as a UX request',
  },
  'super-ux/vision': {
    'видение': 'anyone\'s view of anything (measured: «у меня другое видение архитектуры» named '
      + 'super-ux); «продуктовое видение» routes',
    'vision': 'too generic: computer vision, Apple Vision Pro, a vision model',
    'what is this product about': 'a question: the trigger would carry «what is» through the '
      + 'filter that keeps questions silent',
  },
  'task-pipeline/task-pipeline': {
    'waves': 'a mode of `/task-pipeline`, named with the command; bare it is any wave (animation, '
      + 'rollout)',
    'волнами': 'a mode of `/task-pipeline`, named with the command; bare it is any wave '
      + '(«появляются волнами»)',
    'checkup': 'a mode of `/task-pipeline`, named with the command; bare it is any health check',
    'чекап': 'a mode of `/task-pipeline`, named with the command; bare it is any health check',
    'setup': 'a mode of `/task-pipeline`, named with the command; bare it is every environment '
      + 'setup',
  },
  'telegram-dev/telegram-userbots': {
    'read channel history': 'Slack and Discord channels have history too (measured: "read the '
      + 'slack channel history" named telegram-dev)',
    'user account': 'too generic: every product has user accounts; the phrase does not name '
      + 'Telegram',
  },
  'web3d-dev/web3d-assets': {
    'too heavy': 'a word quoted in the prose that explains the ML-model ambiguity (web3d-dev '
      + '0.2.5), not a trigger',
  },
  'web3d-dev/web3d-animation': {
    'ретаргетинг': 'already sheleg-dev\'s ad word (ad-tracking advertises it); a second route on '
      + 'it would name 3D on every ad prompt',
  },
  'xr-dev/quest-lifecycle': {
    'what are we missing before launch': 'a launch question about any product; nothing in it '
      + 'names a headset',
    'что нужно до релиза': 'a launch question about any product; nothing in it names a headset',
  },
  'xr-dev/quest-perf': {
    'dropped frames': 'web animation and video drop frames too; the phrase does not name a headset',
    'просадка кадров': 'web animation and video drop frames too; the phrase does not name a headset',
    'app is hot': 'compiles to fire on "the app is hot-reloaded" (a hyphen ends the word)',
    'gpu bound': 'ML training and desktop games are GPU bound too; nothing names a headset',
    'упёрлись в gpu': 'ML training and desktop games hit the GPU too; nothing names a headset',
    'perfetto trace': GENERIC_PROFILER,
    'трейс perfetto': GENERIC_PROFILER,
    'simpleperf': GENERIC_PROFILER,
    'renderdoc': GENERIC_PROFILER,
  },
  'xr-dev/quest-spatial': {
    'hybrid app': 'a hybrid mobile app (Cordova, Capacitor) is the common meaning',
    'гибридное приложение': 'a hybrid mobile app (Cordova, Capacitor) is the common meaning',
  },
  'xr-dev/quest-store': {
    'выложить в стор': GENERIC_STORE,
    'release channel': GENERIC_STORE,
    'релизный канал': GENERIC_STORE,
    'app review': GENERIC_STORE,
    'ревью приложения': GENERIC_STORE,
    'store assets': GENERIC_STORE,
    'ассеты для стора': GENERIC_STORE,
    'test user': GENERIC_STORE,
    'тестовый аккаунт': GENERIC_STORE,
    'pre-order': GENERIC_STORE,
    'предзаказ': GENERIC_STORE,
    'publish to the store': GENERIC_STORE,
  },
  'xr-dev/quest-tooling': {
    'симулятор': 'the iOS and Android simulators are the common meaning',
    'install the apk': 'every Android app installs an APK; the phrase does not name a headset',
    'developer mode': 'every phone and browser has a developer mode',
    'режим разработчика': 'every phone and browser has a developer mode',
  },
  'xr-dev/quest-webxr': {
    'bubblewrap': 'also the Linux sandbox (`bwrap`) agent harnesses run under',
    'покупки в вебе': 'web purchases in general are sheleg-dev\'s charge; nothing names a headset',
  },
};

/**
 * One skill's advertised phrases against its route: what is unreached, and which
 * allow-list entries no longer hold. Pure over `text`, so a plant can be fed to it.
 */
function completeness(ref, route, text) {
  const allowed = NOT_ROUTED[ref] || {};
  // Required here, not at the top: `quotedPhrases` and the allow-lists need no matcher.
  const T = require('../lib/triggers.js');
  const phrases = advertisedPhrases(text);
  const unreached = [];
  const excused = [];
  const reached = [];
  for (const { phrase, where } of phrases) {
    const reaches = T.match(phrase).includes(route);
    const why = allowed[phrase.toLowerCase()];
    if (reaches) { reached.push(phrase); continue; }
    if (why) { excused.push(phrase); continue; }
    unreached.push(`${route}: "${phrase}" (${ref}, ${where})`);
  }
  const advertised = new Set(phrases.map((p) => p.phrase.toLowerCase()));
  const stale = Object.keys(allowed)
    .filter((p) => !advertised.has(p) || reached.some((r) => r.toLowerCase() === p))
    .map((p) => `${ref}: "${p}" is ${advertised.has(p) ? 'reached now' : 'no longer advertised'}`);
  return { total: phrases.length, unreached, excused, stale };
}

module.exports = {
  QUOTED, quotedPhrases, descriptionTriggers, bodyTriggers, advertisedPhrases,
  memberSkills, familySkills, routeOfSkill, UNROUTED, NOT_ROUTED, completeness,
};
