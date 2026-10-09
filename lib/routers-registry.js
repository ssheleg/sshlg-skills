'use strict';
/**
 * The routers — one entry per router, and the only place one is declared.
 *
 * Before this file the text lived in `router-texts.js` and the precedence row
 * in `routers.js`. Nothing compared the halves, so a router could exist in one
 * and be missing from the other with both files syntactically perfect. At
 * three routers that is survivable; at ten it is a scheduled bug. An entry
 * now carries everything a router is: what it needs installed, its two table
 * cells, and its text.
 *
 * **Key order is table order.** One place, one order, nothing to keep in sync.
 *
 * Each text carries four things, and `router_texts_test.js` checks all of
 * them: the rule, the boundary in BOTH directions, the refusal phrase, and one
 * sentence placing it against its nearest neighbours. A router without a
 * boundary swallows everything and gets routed around within a week.
 *
 * **`requires: []` means the rule is not a skill.** Two of these are rules
 * that hold whether or not anything is installed — evidence, and designing for
 * the machine that will quote you. They were the reason a router stopped being
 * a property of a member.
 *
 * The place-sentence names only NEIGHBOURS, never the full list: with ten
 * routers an enumeration in every text is ten copies of one ordering, and
 * the table already renders that ordering from the sections that survived.
 *
 * **A member in the map table is not routed, and that gap lasted five days.**
 * `agent-stack` shipped on 2026-08-06 and appeared in the operator's file only
 * in the map — which lists what is installed, not when to reach for it — so six
 * of seven realistic agent prompts reached no route at all while the pack sat
 * enabled (`test/route_coverage.js`, B-81). The tenth router closed it, and the
 * lesson is the same one `sheleg-dev` taught as the ninth: a member arriving
 * without a router is not a decision unless somebody writes the decision down.
 */

const SUPER_UX = `**If \`super-ux\` is installed, ALL product/interface work goes through its
chain, scenarios first** — decisions, funnels, onboarding, payments: any user
and path. \`docs/ux/scenarios.md\` owns truth; absent → offer \`/ux\` before UI.
Update scenarios in the SAME change as user-facing code; \`/ux-audit\` checks code with \`file:line\`.

**The boundary.** NOT through it: internal scripts,
interface-free migrations, data work, infrastructure.

**Refusal phrase: "no scenarios" or «без сценариев».**

**Among the routers:** super-ux owns what the interface does; \`sheleg-design\`
its look; \`copywriting\` its sound.`;

const SHELEG_DESIGN = `**If \`sheleg-design\` is installed, the visual layer goes through it** — all
surfaces: tokens/themes, typography/rhythm, motion and calm fallback, brand,
Figma variables and design-to-code without hand-copied values.
Before design/redesign/layout/front-end/mobile UI, run
\`npx sshlg-skills pack design\`: lane owners and exact missing-tool install commands;
reports, never installs. Accessibility has NO family owner; listed tools are
not additional entry points.

**The boundary — "HOW it looks is being decided."** NOT through it: structure
(\`super-ux\`), text (\`copywriting\`), backend, internal scripts.

**Refusal phrase: "no design" or «без дизайна».**

**Among the routers:** \`super-ux\` owns the wireframe; sheleg-design the visual
layer and motion.`;

const SHELEG_DEV = `**If \`sheleg-dev\` is installed, WIRING integrations goes through it** — cards
(\`stripe-billing\`), crypto (\`crypto-payments\`), pixels/server events
(\`ad-tracking\`), errors (\`error-tracking\`), sign-in (\`google-signin\`,
\`google-auth\`), speed (\`frontend-performance\`). The webhook proves payment;
the redirect only a browser. Share one \`event_id\` across both event channels
or count revenue twice.

**The boundary.** NOT through it: paywall
behavior/tiers (\`super-ux\`), checkout look (\`sheleg-design\`), words
(\`copywriting\`), price (a business decision, never a skill's).

**Refusal phrase: "no wiring" or «без обвязки»** — avoid «без интеграций»:
\`интеграция\` triggers \`task-pipeline\`.

**Among the routers:** \`super-ux\` owns the payment step; sheleg-dev its charge.`;

const AGENT_STACK = `**If \`agent-stack\` is installed, building an agent SYSTEM goes through it** —
loops/work-graphs, system prompts/tools, workflow vs agent, evals, MCP/A2A,
registry/gateway, and the wallet behind resold LLM access.

**The boundary.** NOT through it:
one LLM call in a script, one prompt's wording, person-facing UI (\`super-ux\`,
\`sheleg-design\`), charging money (\`sheleg-dev\`), agents editing THIS repo
(\`agent-sync\`). sheleg-dev charges; agent-stack meters LLM use.

**Refusal phrase: "no agent layer" or «без агентного слоя».**

**Among the routers:** \`agent-sync\` coordinates file ownership; agent-stack
owns the agent system being built.`;

const TELEGRAM_DEV = `**If \`telegram-dev\` is installed, Telegram surfaces go through it** — Bot API
bots, MTProto accounts, Mini Apps. \`update_id\` is an update's only idempotency
key; a session file is a logged-in person, revocable and bannable. For Mini Apps,
validate raw \`initData\` on the backend; never trust \`initDataUnsafe\`.

**The boundary — "Telegram is the platform, not the transport."** NOT through
it: a one-call bot alert to yourself, bot behavior (\`super-ux\`), Mini App look
(\`sheleg-design\`), card charges (\`sheleg-dev\`).

**Refusal phrase: "no telegram" or «без телеграма».**

**Among the routers:** \`sheleg-dev\` owns card rails; telegram-dev owns Stars,
bot tokens, accounts and their risks.`;

const XR_DEV = `**If \`xr-dev\` is installed, Meta Quest products go through it** — native
OpenXR/Spatial SDK/WebXR choice, frame budget per refresh rate, toolchain,
headset, Store submission, monetization, launch and operation. \`quest-lifecycle\` maps each
stage to an owner, evidence and next action.

**The boundary.** NOT through it: ordinary
browser 3D (\`web3d-dev\`), phone/desktop apps, Unity/Unreal internals (vendor
skills), delivery (\`task-pipeline\`).

**Refusal phrase: "no xr" or «без xr».**

**Among the routers:** \`web3d-dev\` owns web scenes; xr-dev their headset
lifecycle. A three.js scene in Quest Browser takes both.`;

const WEB3D_DEV = `**If \`web3d-dev\` is installed, realtime web 3D goes through it** — three.js/React Three Fiber
runtime (\`web3d-runtime\`: WebGPU/WebGL2 fallback, TSL, compute, frame loop),
assets within a written budget (\`web3d-assets\`: glTF, KTX2, meshopt, licences),
animation (\`web3d-animation\`: rigs, clips, blending, retargeting). Pin every fact
to one three.js release.

**The boundary.** NOT through it:
scroll motion/heroes (\`sheleg-design\`), rendered video, headset sessions
(\`xr-dev\`), Unity/Unreal.

**Refusal phrase: "no web3d" or «без web3d».**

**Among the routers:** \`sheleg-design\` owns the page's look/motion; web3d-dev
its embedded 3D scene.`;

const COPYWRITING = `**If \`super-ux\` is installed, product-facing text goes through \`copywriting\`**
— UI strings/errors/empty states, landing pages, pricing, blog, changelog,
posts, store listings, ads, email. First read \`docs/brand/voice.md\`,
\`terminology.md\`, \`facts.md\`; absent pack → \`/brand-init\` before writing.

**The boundary — "it ships to a user of the product."** NOT through it:
commit/PR descriptions, code comments, developer README, internal docs,
an answer in chat.

**Refusal phrase: "no brand" or "draft it" — «без бренда», «черновиком».** For
otherwise in-scope work, write directly and disclose the requested pack skip.

**Among the routers:** \`sheleg-design\` owns looks, copywriting words; both run
independently from shared scenarios;
compare their outputs on a shared screen before shipping. A landing page takes
both plus \`task-pipeline\`; a social post takes copywriting alone, no repo change.`;

const SEO_LLMO = `**Design every public web surface for humans AND machines, AT DESIGN TIME** —
URLs/hierarchy, one question per page, JS-free extractable answers, markup,
entities, single-home facts, explanatory internal links. \`/seo-aeo-audit\` checks
afterwards, never designs; \`seo-llmo\` is a standing rule in no pack.

**The boundary.** NOT through it:
logged-in interfaces, admin panels, internal tools, CLIs, scripts.

**Refusal phrase: "no SEO" or «без SEO».**

**Among the routers:** \`copywriting\` owns sound, seo-llmo discoverability.
Landing pages need both; internal panels neither.`;

const EVIDENCE_DOCS = `**Every documented fact needs proof:** \`file:line\`, a command with output,
or a test name. Compute numbers; resolve every named file/command/flag;
"docs are in sync" requires an exit code. Ship docs in the SAME change as code.

**The boundary — "this will be read as true."** NOT through it: drafts,
thinking aloud, an answer in chat, commit messages, code comments.

**Refusal phrase: "no docs" or "on my word" — «без доков», «на словах».** For
otherwise in-scope work, state that the document is unsupported.

**Among the routers:** \`task-pipeline\` owns delivery; evidence-docs its proof.`;

const TASK_PIPELINE = `**If \`task-pipeline\` is installed, substantial repository changes go through
it** — feature, fix, refactor, migration, integration, rewrite, adoption,
hardening, in any language. **Planning is part of the pipeline:** brainstorm,
spec and plan occupy stages 2–4, never a parallel planning cycle.

**The boundary.** NOT through it: questions,
explanations, reading/analysing code; typos, one-line edits, mechanical renames;
reconnaissance/measurement that commit nothing.

**Refusal phrase: "no pipeline" or «без пайплайна».** Name the chosen route
for borderline cases.

**Among the routers:** \`super-ux\` owns interface behavior; task-pipeline delivery.`;

const PROJECT_AUDIT = `**If \`task-pipeline\` is installed, whole-project truth goes through
\`project-audit\`** — finished, partial, broken or unexplored. Cold start/no brief:
discover the project and production evidence beyond Git; produce HTML + JSON.
**Read-only:** findings become proposed board rows, not project edits.

**The boundary.** NOT through it:
a run's deliverable audit, diff/PR review, skill construction (\`make-skill\`),
code vs scenarios (\`/ux-audit\`).

**Refusal phrase: "no diagnosis" or «без диагностики»** — avoid «без аудита»:
\`аудит\` triggers \`task-pipeline\`.

**Among the routers:** project-audit diagnoses before changes;
\`task-pipeline\` delivers them.`;

const MAKE_SKILL = `**If \`make-skill\` is installed, skill/plugin construction goes through it** —
create, retrofit, conformance audit («аудит скилов»), plugin wrapping, version
sync, validator+CI, all-channel publication. It owns front-matter limits,
\`claude plugin validate --strict\`, and plain \`~/.claude/skills/\` shadowing.

**The boundary.** NOT through
it: USING a skill, ordinary repo code, doctrine edits in a conformant skill.

**Refusal phrase: "no make-skill" or «без make-skill».**

**Among the routers:** make-skill checks construction; \`task-pipeline\` delivers.
A skill release takes both.`;

const AGENT_SYNC = `**If \`agent-sync\` is installed AND \`.claude/agent-sync.json\` exists, claim
shared registries BEFORE editing** — decisions, open questions, roadmap,
workstreams, dependencies. Reserve ids race-free and journal the run, even
without a coordination request.

**The boundary.** NOT through
it: projects without that config, ordinary code files, working alone.

**Refusal phrase: "no coordination" or «без координации».**

**Among the routers:** \`task-pipeline\` owns delivery; agent-sync file ownership
when multiple agents work.`;

/**
 * name -> { requires, answers, when, text }.
 *
 * Order: the first nine say what the change CONTAINS (eight subjects and the two
 * memberless rules after them), then how it reaches the repository and what is
 * true of the project, and the last two are about the tooling itself.
 */
const REGISTRY = {
  'super-ux': {
    requires: ['super-ux'],
    answers: 'what the interface must do',
    when: 'there is user-facing behaviour',
    text: SUPER_UX,
  },
  'sheleg-design': {
    requires: ['sheleg-design'],
    answers: 'how it looks and moves',
    when: 'there is a visual layer',
    text: SHELEG_DESIGN,
  },
  copywriting: {
    requires: ['super-ux'],
    answers: 'how it sounds',
    when: 'text a user of the product will read',
    text: COPYWRITING,
  },
  'sheleg-dev': {
    requires: ['sheleg-dev'],
    answers: 'what it runs on to charge, track and sign in',
    when: 'money, tracking, errors, sign-in or speed is being wired',
    text: SHELEG_DEV,
  },
  'agent-stack': {
    requires: ['agent-stack'],
    // "the thing being built is an agent" excludes the case where the thing being
    // built is what an agent CONNECTS TO. A session shipped and then audited an MCP
    // server without ever consulting this router, and re-established by hand three
    // facts `agent-interop` advertises: that MCP removed JSON-RPC batching in the
    // 2025-06-18 revision, the exact shape of `claude mcp add --transport http -H`,
    // and what a 401 may disclose without becoming a discovery oracle. The trigger
    // list already carried `MCP server`; the ROUTER TABLE is where the choice is
    // made, and its sentence said no. (#102)
    answers: 'how an agent system is built, judged and metered — and the wire it speaks outward',
    when: 'the thing being built is an agent, or a server one connects to',
    text: AGENT_STACK,
  },
  'telegram-dev': {
    requires: ['telegram-dev'],
    answers: 'which Telegram API a surface speaks, and what it costs',
    when: 'the thing being built lives inside Telegram',
    text: TELEGRAM_DEV,
  },
  // The two members that sat in the map table with no rule saying when to reach for
  // them — B-81's shape twice more, found by the 2026-10-08 routing audit (finding f).
  'xr-dev': {
    requires: ['xr-dev'],
    answers: 'how a Quest product moves from platform choice to launch and operation',
    when: 'the thing being built runs on a Meta Quest headset',
    text: XR_DEV,
  },
  'web3d-dev': {
    requires: ['web3d-dev'],
    answers: 'how a realtime 3D scene on the web runs, ships its assets and moves',
    when: 'a three.js or React Three Fiber scene renders in the page',
    text: WEB3D_DEV,
  },
  'seo-llmo': {
    requires: [],
    answers: 'whether a machine will find it',
    when: 'a logged-out reader can see the surface',
    text: SEO_LLMO,
  },
  'evidence-docs': {
    requires: [],
    answers: 'what proves it',
    when: 'something is stated as true',
    text: EVIDENCE_DOCS,
  },
  'task-pipeline': {
    requires: ['task-pipeline'],
    answers: 'how the change reaches the repository',
    when: 'the change touches the repository',
    text: TASK_PIPELINE,
  },
  'project-audit': {
    requires: ['task-pipeline'],
    answers: 'what is actually true of this project right now',
    when: 'the question is the whole project, not one change',
    text: PROJECT_AUDIT,
  },
  'make-skill': {
    requires: ['make-skill'],
    answers: 'how the skill itself is built',
    when: 'a skill or plugin changes shape',
    text: MAKE_SKILL,
  },
  'agent-sync': {
    requires: ['agent-sync'],
    answers: 'who is holding this file',
    when: 'the project has agent coordination on',
    text: AGENT_SYNC,
  },
};

/** Every router name, in table order. */
function order() {
  return Object.keys(REGISTRY);
}

/** Table rows for the names present, in registry order. Never a hand-kept list. */
function rows(names) {
  const present = names || [];
  return order()
    .filter((name) => present.includes(name))
    .map((name) => [name, REGISTRY[name].answers, REGISTRY[name].when]);
}

/** Are this router's required members all installed? */
function available(name, installed) {
  const entry = REGISTRY[name];
  if (!entry) return false;
  return entry.requires.every((m) => (installed || []).includes(m));
}

/**
 * The routers a given caller is allowed to speak for.
 *
 * With `member`, only the routers that member contributes — a single member's
 * installer speaks for itself and touches nobody else's section, which is what
 * lets the bundle and a lone installer both write. Crucially that excludes the
 * memberless rules: `seo-llmo` and `evidence-docs` belong to the family, and
 * super-ux's installer has no business writing them.
 *
 * Without `member`, everything whose required members are installed — plus the
 * memberless rules, which require nothing and therefore always qualify.
 */
function scope(opts) {
  const o = opts || {};
  if (o.member) {
    return order().filter((name) => REGISTRY[name].requires.includes(o.member));
  }
  return order().filter((name) => available(name, o.installed));
}

/**
 * The routers that belong in the block: in scope AND not switched off.
 * `isEnabled` is injected rather than imported so this module stays free of
 * the filesystem, like `routers.js` beside it.
 */
function resolve(opts) {
  const o = opts || {};
  const enabled = o.isEnabled || (() => true);
  const out = {};
  for (const name of scope(o)) {
    if (!enabled(name)) continue;
    out[name] = REGISTRY[name].text;
  }
  return out;
}

/**
 * The routers that must be REMOVED from the block: in scope and switched off.
 *
 * A router whose member is not installed is not "off" — there is no section
 * to remove, and reporting one would make every uninstalled member look like
 * a deliberate refusal.
 */
function disabled(opts) {
  const o = opts || {};
  const enabled = o.isEnabled || (() => true);
  return scope(o).filter((name) => !enabled(name));
}

module.exports = { REGISTRY, order, rows, available, scope, resolve, disabled };
