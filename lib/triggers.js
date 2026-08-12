'use strict';
/**
 * Which route a prompt asks for — the decision the `UserPromptSubmit` hook makes.
 *
 * The family's routing block already says WHEN to take each route. It loads in
 * every session and is still routed around, because prose in a long file loses
 * to whatever spoke last. This module is the part that speaks first, and it
 * exists only to name the route the block already describes — never to restate
 * its content.
 *
 * **Conservative by construction, and the reason is the doctrine's own.** Every
 * router carries a boundary that cuts both ways: "Running ten stages for a
 * single character is the fastest way to teach an agent to route around it."
 * A hook that fires on a question does exactly that damage, so:
 *
 * - a NEGATIVE signal beats any positive one (a question stays a question);
 * - a refusal phrase silences the hook completely, because the operator saying
 *   «без пайплайна» has already made the decision this module would make;
 * - no signal at all emits nothing, which costs zero tokens on the turns that
 *   are most of them.
 *
 * **The triggers are not invented here.** Each one is a word the corresponding
 * skill's own `description` already advertises, and `test/triggers_test.js`
 * asserts that — reading the shipped SKILL.md and failing on any trigger the
 * skill does not claim. That check is what stops this file from quietly growing
 * a routing policy of its own.
 *
 * Pure: no filesystem, no environment. The hook passes the prompt in and prints
 * what comes back.
 */

/**
 * Words that mean "a question is being asked", in both languages the family
 * works in. Checked FIRST and unconditionally.
 *
 * `почему`/`why` and friends are not merely weak positives — they are the
 * boundary itself. An explanation that gets routed through ten gates teaches
 * the operator to stop reading the injection.
 */
const QUESTION = [
  'что делает', 'что такое', 'как работает', 'почему', 'зачем', 'объясни',
  'расскажи', 'покажи', 'где находится', 'в чём разница', 'можно ли',
  'what does', 'what is', 'how does', 'why is', 'why does', 'explain',
  'show me', 'where is', 'what happens', 'is it possible', 'can you explain',
];

/** Saying the refusal phrase is the decision. The hook does not argue with it. */
const REFUSALS = [
  'без пайплайна', 'без сценариев', 'без бренда', 'без дизайна', 'без seo',
  'без доков', 'без make-skill', 'без координации', 'как есть', 'черновиком',
  'на словах', 'quick',
];

/**
 * `route -> {triggers, skill, line}`.
 *
 * `skill` names the SKILL.md whose `description` must contain every trigger, so
 * the fixture can prove this table is derived rather than authored. `line` is
 * what gets injected — one sentence, naming the route and its opt-out, never
 * repeating what the route means.
 */
const ROUTES = {
  'task-pipeline': {
    skill: 'task-pipeline/task-pipeline',
    triggers: [
      'фича', 'фикс', 'рефактор', 'миграция', 'интеграция', 'доработать',
      'починить', 'внедрить', 'перевести', 'аудит', 'проверь ошибки',
      'проверь прод', 'ревью pr', 'полный цикл', 'прогони по конвейеру',
      'feature', 'refactor', 'migration', 'integration', 'rewrite', 'adoption',
      'hardening', 'audit', 'bug hunt', 'production check', 'pr review',
      'the full cycle', 'run this through the pipeline',
    ],
    line: 'changes the repository → `/task-pipeline` owns the route, and brainstorm, ' +
          'spec and plan are its stages 2–4 rather than a cycle beside it',
  },
  // Whole phrases, never bare words, and for two reasons that both bit. A bare
  // `дизайн` is a substring of the refusal «без дизайна», so saying the phrase
  // that declines the route would also trip it; and a bare `skill` sits inside
  // «без make-skill». Phrases also match intent rather than vocabulary — `фигма`
  // appears in a question as often as in an instruction.
  'super-ux': {
    skill: 'super-ux/ux-flows',
    triggers: [
      'user flow', 'юзер флоу', 'screen flow', 'флоу экранов', 'user path',
      'поток пользователя', 'improve ux', 'улучши ux', 'fix ux', 'почини ux',
      'wireframe', 'вайрфрейм', 'mockup', 'мокап', 'design a screen',
      'нарисуй дизайн', 'task analysis', 'redesign flow',
    ],
    line: 'has a user and a path → `/ux` decides what the interface must do, before it is built',
  },
  'sheleg-design': {
    skill: 'sheleg-design/sheleg-design',
    triggers: [
      'cinematic landing', 'кинематографичный лендинг', 'design tokens',
      'дизайн-токены', 'dashboard style', 'стиль дашборда', 'light/dark theme',
      'светлая/тёмная тема', 'scroll animation', 'скролл-анимация',
      'mobile screen', 'мобильный экран', 'figma variables', 'переменные фигмы',
      'фигма в код',
    ],
    line: 'decides how it looks or moves → `/sheleg-design` owns the visual layer',
  },
  'make-skill': {
    skill: 'make-skill/make-skill',
    triggers: [
      'make a skill', 'сделай скилл', 'wrap it in a plugin', 'заверни в плагин',
      'publish a skill', 'опубликуй скилл', 'retrofit a skill to the standard',
      'приведи скилл к стандарту',
    ],
    line: 'changes the construction of a skill or plugin → `/skill-audit` answers whether it meets the standard',
  },
};

/** Lowercased, so every comparison below is case-insensitive exactly once. */
function normalise(prompt) {
  return String(prompt || '').toLowerCase();
}

/** Does the prompt read as a question rather than an instruction? */
function isQuestion(prompt) {
  const p = normalise(prompt);
  return QUESTION.some((q) => p.includes(q));
}

/** Has the operator already opted out, in any of the family's refusal phrases? */
function optedOut(prompt) {
  const p = normalise(prompt);
  return REFUSALS.some((r) => p.includes(r));
}

/**
 * The routes a prompt asks for, in registry order.
 *
 * Empty on a question, on an opt-out, and on a prompt with no trigger at all —
 * three different reasons that must all produce silence rather than a guess.
 */
function match(prompt) {
  if (!prompt || optedOut(prompt) || isQuestion(prompt)) return [];
  const p = normalise(prompt);
  return Object.keys(ROUTES).filter((name) =>
    ROUTES[name].triggers.some((t) => p.includes(t))
  );
}

/**
 * What the hook prints, or `''` for nothing.
 *
 * One block, prefixed so the operator can see where it came from and the agent
 * can tell it from the user's own words. It points AT the routing block rather
 * than quoting it: the block is the single home, and a second copy in a hook is
 * the copy that goes stale.
 */
function render(prompt) {
  const routes = match(prompt);
  if (!routes.length) return '';
  const lines = routes.map((r) => `- this ${ROUTES[r].line}.`);
  return [
    '[sshlg-routing] The ssheleg family is installed and its routing block is in',
    'your global instructions. For this request:',
    ...lines,
    'Read that block\'s table before choosing a route. To decline a route, the',
    'operator says its refusal phrase — this note never overrides them.',
  ].join('\n');
}

/**
 * The once-per-session note. Deliberately a POINTER, ~90 tokens.
 *
 * A pack that prints its whole doctrine into every session is the cost this
 * family measured at 854 tokens and removed. The block already carries the
 * content and loads in the same session; what it lacks is the salience of
 * arriving last. That is all this supplies.
 */
function sessionNote() {
  return [
    '[sshlg-skills] The ssheleg family is installed. Its routing block in your',
    'global instructions is not advisory: work that changes the repository goes',
    'through `/task-pipeline` — brainstorm, spec and plan are its stages 2–4, not a',
    'separate cycle beside it. User-facing behaviour goes through `/ux` first, the',
    'visual layer through `/sheleg-design`. Consult that block\'s table before',
    'choosing a route; each route names the phrase that declines it.',
  ].join('\n');
}

module.exports = { match, render, sessionNote, isQuestion, optedOut, ROUTES, QUESTION, REFUSALS };
