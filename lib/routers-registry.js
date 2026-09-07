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

const SUPER_UX = `**If \`super-ux\` is installed, ALL work on the product and its interface goes
through the chain, scenarios first** — product decisions, funnels, onboarding,
payment steps: anything with a user and a path. \`docs/ux/scenarios.md\` is the
source of truth; no file → offer \`/ux\` before touching UI; a user-facing change
updates the scenarios in the same change; checking code against them is
\`/ux-audit\`, with \`file:line\` evidence.

**The boundary — "this has a user."** NOT through the chain: internal
scripts, migrations with no interface, data work, infrastructure — no scenario
for a cron job.

**Refusal phrase: "no scenarios" or «без сценариев».**

**Among the routers:** super-ux decides what the interface must do;
\`sheleg-design\` how it looks; \`copywriting\` how it sounds.`;

const SHELEG_DESIGN = `**If \`sheleg-design\` is installed, the visual layer goes through it** — tokens
and themes, typography and rhythm, motion and its degradation to calm, the
brand's visual language, and the Figma seam (tokens as variables, design into
code without hand-copied values). A cinematic landing page, a dashboard, an
admin panel, an agent's interface — one and the same layer.

**Before design, redesign, layout, front-end or mobile-UI work, MEASURE what else
is reachable:** \`npx sshlg-skills pack design\` — it names each lane's owner and
the exact install command for what this machine is missing (accessibility has NO
owner in this family); it reports and never installs, and every tool it lists is a
tool, never a second entry point.

**The boundary — "HOW it looks is being decided."** NOT through it: a purely
structural change (what sits where is \`super-ux\`), text (\`copywriting\`), the backend, internal scripts —
no palette for a log parser.

**Refusal phrase: "no design" or «без дизайна».**

**Among the routers:** \`super-ux\` decides what the interface must do;
sheleg-design how it looks and moves. The wireframe goes to the first, the
visual on top of it to the second.`;

const SHELEG_DEV = `**If \`sheleg-dev\` is installed, WIRING the integration layer goes through it** —
card money (\`stripe-billing\`), crypto (\`crypto-payments\`), purchase pixels and
server events (\`ad-tracking\`), production errors (\`error-tracking\`), sign-in
(\`google-signin\`, \`google-auth\`), page speed (\`frontend-performance\`). The
webhook is the payment and the redirect only proves a browser; one \`event_id\` on
both sides or the revenue counts twice.

**The boundary — "it is being WIRED, not decided."** NOT through it: what the
paywall must do
or which tiers exist (\`super-ux\`), how the checkout looks (\`sheleg-design\`),
the words on it (\`copywriting\`), the price itself — a business decision nobody's
skill makes.

**Refusal phrase: "no wiring" or «без обвязки»** — not «без интеграций», because
\`интеграция\` is \`task-pipeline\`'s own trigger and a refusal built on that word
fires the hook it exists to silence.

**Among the routers:** \`super-ux\` decides what the payment step must do;
sheleg-dev what it runs on. The paywall goes to the first, the charge behind the
button to the second.`;

const AGENT_STACK = `**If \`agent-stack\` is installed, building an agent SYSTEM goes through it** —
the orchestrator's loop and work-graph, what the agent is told (system prompts,
tool descriptions, workflow versus agent), the evals that say whether it got
better, the protocols it speaks outward (MCP, A2A, the registry, the gateway),
and the wallet under reselling LLM access.

**The boundary — "an agent system is being BUILT, not used."** NOT through it:
a single LLM call in
a script, the wording of one prompt, the interface a person sees (\`super-ux\`,
\`sheleg-design\`), taking the money — \`sheleg-dev\` charges the card and this
meters what was burned behind it — and coordinating the agents editing THIS
repository, which is \`agent-sync\`; not every sentence with the word "agent".

**Refusal phrase: "no agent layer" or «без агентного слоя».**

**Among the routers:** \`agent-sync\` says who is holding this file right now;
agent-stack is about the agent being built. The first coordinates the work, the
second is what the work produces.`;

const TELEGRAM_DEV = `**If \`telegram-dev\` is installed, work on a Telegram surface goes through it** —
a bot on the official Bot API, a user account over MTProto, or a Mini App inside
the client. Its seams: \`update_id\` is the only idempotency key an update
carries; a session file is a logged-in person, revocable and bannable; a Mini
App's entire authentication is one signed query string handed over already
parsed (\`initDataUnsafe\`).

**The boundary — "Telegram is the platform, not the transport."** NOT through
it: sending yourself an alert through a
bot (one HTTP call), what the bot should do (\`super-ux\`), how its Mini App
looks (\`sheleg-design\`), charging a card (\`sheleg-dev\`) — Telegram the
platform, not the transport.

**Refusal phrase: "no telegram" or «без телеграма».**

**Among the routers:** \`sheleg-dev\` wires the money that reaches a card;
telegram-dev owns Telegram's own rails — Stars, the bot token, the account — and
the risk that sits beside them.`;

const COPYWRITING = `**If \`super-ux\` is installed, any text a user of the product will read is
written through \`copywriting\`** — interface strings, errors, empty states,
landing pages, pricing, blog, user-facing changelog, posts, store listings, ads,
email. First act: read the brand pack (\`docs/brand/voice.md\`,
\`terminology.md\`, \`facts.md\`); no pack → \`/brand-init\` before writing.

**The boundary — "it ships to a user of the product."** NOT through the skill:
a commit or PR description, code comments, a README for
developers, internal docs, an answer in chat.

**Refusal phrase: "no brand" or "draft it" — «без бренда», «черновиком».** It
applies to work that WOULD have crossed the boundary: write directly and say the
pack was skipped on request, rather than skipping it silently.

**Among the routers:** \`sheleg-design\` decides how it looks; copywriting how it
sounds — neither waits for the other, both read the scenarios, and where they
land on one screen the outputs are compared before shipping. A landing page
passes both plus \`task-pipeline\`; a social post passes copywriting alone and
changes no repository.`;

const SEO_LLMO = `**Every public web surface is designed for two readers at once, AT DESIGN
TIME** — a human and the machine that will quote it: URLs and hierarchy, one
question per page, an answer extractable without running JS, markup and entities,
facts with a single home, internal links that explain the structure. Redoing this
after launch costs more — the addresses have already spread. The check afterwards
is \`/seo-aeo-audit\`, and it checks rather than designs; \`seo-llmo\` is the
standing rule, shipped in no pack.

**The boundary — "a logged-out reader or a crawler will see it."** NOT through
the rule: interfaces behind a login, admin panels, internal tools, CLIs, scripts.

**Refusal phrase: "no SEO" or «без SEO».**

**Among the routers:** \`copywriting\` decides how it sounds; seo-llmo whether a
machine will find it. A landing page needs both; an internal panel needs
neither.`;

const EVIDENCE_DOCS = `**A claim without proof is not documentation.** Every fact that reaches a
document carries its receipt: \`file:line\`, a command and its output, a test
name; a number is computed, not restated; every named file, command or flag
resolves; "docs are in sync" is an exit code. Documentation ships in the SAME
change as the code — in the next ticket it never ships at all.

**The boundary — "this will be read as true."** NOT through the rule: a draft, thinking out loud, an answer in chat, a commit message, a code
comment.

**Refusal phrase: "no docs" or "on my word" — «без доков», «на словах».** It
applies to work that WOULD have crossed the boundary: say plainly that the
document is unsupported, rather than handing out a grade in place of a
measurement.

**Among the routers:** \`task-pipeline\` decides how a change reaches the
repository; evidence-docs what proves whatever is written about it.`;

const TASK_PIPELINE = `**If \`task-pipeline\` is installed, any work that CHANGES THE REPOSITORY goes
through it** — feature, fix, refactor, migration, integration, rewrite, adoption,
hardening; any language, any wording. **Planning that work is part of the
pipeline, not a cycle beside it:** brainstorm, spec and plan are its stages 2–4,
and no separate planning route exists alongside it.

**The boundary — "it changes the repository," and it cuts both ways.** NOT
through the pipeline: a question and its answer, an explanation,
reading and analysing code; a typo, a one-line edit, a mechanical rename;
reconnaissance and measurement that commit nothing — no ten stages for a single
character.

**Refusal phrase: "no pipeline" or «без пайплайна».** For a borderline case, name
the route you are taking in one line rather than choosing silently.

**Among the routers:** \`super-ux\` decides what the interface must do;
task-pipeline how the change reaches the repository. The first owns the
content, the second the delivery.`;

const PROJECT_AUDIT = `**If \`task-pipeline\` is installed, asking what is TRUE of a whole project goes
through \`project-audit\`** — finished, half-built, broken, never looked at. Cold
start, no brief: discover what the project is, read the production evidence a
repository cannot hold, leave an HTML report beside a JSON sidecar. It is
**read-only**: findings leave as proposed board rows, nothing is written.

**The boundary — "the subject is the project, not a change."** NOT through it:
auditing one deliverable inside a run (the pipeline's own ladder),
reviewing a diff or a PR, a skill's construction (\`make-skill\`), code against
its scenarios (\`/ux-audit\`).

**Refusal phrase: "no diagnosis" or «без диагностики»** — not «без аудита»,
because \`аудит\` is \`task-pipeline\`'s own trigger and a refusal containing a
trigger fires the hook it exists to silence.

**Among the routers:** \`task-pipeline\` decides how a change reaches the
repository; project-audit says what is there before any change is proposed. The
first owns the delivery, the second the diagnosis.`;

const MAKE_SKILL = `**If \`make-skill\` is installed, work ON a skill or plugin goes through it** —
creating one, retrofitting it to the standard, auditing conformance («аудит
скилов» lands here), wrapping it in a plugin, syncing versions, validator+CI,
publishing to every channel. It knows the front-matter limits, what
\`claude plugin validate --strict\` demands, and why a plain copy in
\`~/.claude/skills/\` shadows the plugin.

**The boundary — "the construction of the skill itself changes."** NOT through
it: work done WITH a skill, ordinary code in an ordinary repository, editing doctrine inside a skill
that already meets the standard.

**Refusal phrase: "no make-skill" or «без make-skill».**

**Among the routers:** \`task-pipeline\` carries a change through its stages;
make-skill answers whether the result meets the skill standard. A skill's
release passes both.`;

const AGENT_SYNC = `**If \`agent-sync\` is installed AND the project has \`.claude/agent-sync.json\`,
shared registries are edited only under a claim** — decisions, open questions,
roadmap, workstreams, dependencies. The claim is taken BEFORE the edit, ids are
reserved race-free, the run is journalled — even when nobody asked about
coordination: an unclaimed edit to a shared file is how two agents overwrite
each other.

**The boundary — "a file in a project where coordination is on."** NOT through
it: a project with no \`.claude/agent-sync.json\`, ordinary code files, working
alone.

**Refusal phrase: "no coordination" or «без координации».**

**Among the routers:** \`task-pipeline\` decides how a change reaches the
repository; agent-sync who is holding this file right now. The second matters
only where there is more than one agent.`;

/**
 * name -> { requires, answers, when, text }.
 *
 * Order: the first seven say what the change CONTAINS, the eighth how it
 * reaches the repository, the last two are about the tooling itself.
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
