'use strict';

/**
 * Curated recommendation packs — what a task can reach that is NOT installed yet.
 *
 * Why it exists, and why `toolkit` is not it. `toolkit` enumerates what this machine
 * already has and ranks it by term overlap; by construction it cannot name a skill that
 * is absent, and absence is the whole question when somebody hands you a listicle. Asked
 * for a design shortlist on the machine this was written on, `toolkit --for` returned
 * `build-zoom-meeting-app` third — term overlap on *web* and *mobile* — which is the
 * documented limit of that instrument working exactly as advertised, not a defect.
 *
 * Why a pack is DECLARED and never derived. The same reason `inventory.js` refuses to
 * guess an entry point: a recommendation that names an install command which does not
 * exist sends an operator to a dead end with a machine's authority. Two published
 * listicles were measured on 2026-09-03 while this was written, and between them they
 * carried three moved addresses, five wrong star counts, one command that does not exist
 * (`claude plugin add …` → `error: unknown command 'add'`) and one install line that
 * copies a marketplace straight into `~/.claude/skills`, which is the plain-copy shadow
 * this package spends `lib/shadow.js` and two prune passes preventing. `assertPack()`
 * refuses both of those shapes mechanically, so the class cannot come back by hand.
 *
 * Why popularity is not a field. Every star count in both articles was wrong — by 2.7×
 * in the worst case — because a number copied out of a page is true for one afternoon.
 * What a pack carries instead is the ADDRESS, and `--check` resolves the addresses at
 * the moment they are read. A fact that rots is either measured on use or not shipped.
 *
 * Why entries that are already installed stay in the pack. Half the value of the answer
 * is *"you already have five of these"* — a pack that listed only the missing ones would
 * be a shopping list, and the operator would install a sixth copy of `webapp-testing`.
 *
 * Why LANES. "Design work" is not one route. Choosing a visual direction, animating a
 * hero, re-theming a dashboard and auditing contrast are four different questions with
 * four different owners, and a flat list of skills answers none of them. A lane names
 * the question, the family router that owns it, and the outside tools that serve it —
 * and where no router owns it, the lane says `gap` out loud rather than implying cover.
 *
 * **This module reports and never writes.** Same refusal as `lib/updatemodel.js`, for the
 * same reason recorded there: `~/.claude/settings.json` and `known_marketplaces.json`
 * belong to the operator and to Claude Code, and a launcher that changed somebody's
 * installed set to match its own opinion is the class of act that destroyed
 * `~/.claude/CLAUDE.md` twice in this repository's history. The command prints what to
 * run; a person runs it.
 *
 * Pure, like `inventory.js`, `routers.js` and `drift.js` — a fixture asserts it never
 * reaches the filesystem. The one impure walk is `readSkills()`, imported rather than
 * reimplemented, because a second answer to "what is installed" agrees with the first
 * until somebody fixes one of them.
 */

const { readSkills } = require('./conflicts.js');

/**
 * The lanes a design task actually splits into.
 *
 * `owner` is a family ROUTER name or `null`. `null` is not an oversight and must not be
 * quietly filled: it is the finding. Three lanes here have no owner — implementing the
 * markup, verifying it in a browser, and accessibility — and the third is the one that
 * matters, because no router in this family asks whether the thing can be used at all.
 *
 * `modes` answers the question a lane cannot: a NEW design enters at `style`, a REDESIGN
 * enters at `verify` and `a11y` because you measure what is there before replacing it,
 * and an UPDATE enters at `tokens` because changing a token is not the same act as
 * editing the component that reads it.
 */
const LANES = [
  { id: 'scenarios', asks: 'what the interface must do', owner: 'super-ux' },
  { id: 'style', asks: 'which visual direction it commits to', owner: 'sheleg-design' },
  { id: 'brand-surface', asks: 'landing, hero, marketing surface', owner: 'sheleg-design' },
  { id: 'product-surface', asks: 'dashboard, admin, app UI', owner: 'sheleg-design' },
  { id: 'motion', asks: 'animation, transitions, and their calm fallback', owner: 'sheleg-design' },
  { id: 'tokens', asks: 'theme, palette, spacing and type scales', owner: 'sheleg-design' },
  { id: 'figma', asks: 'the design-to-code seam', owner: 'sheleg-design' },
  { id: 'copy', asks: 'how the surface sounds', owner: 'copywriting' },
  { id: 'implement', asks: 'the quality of the code that renders it', owner: null, fallback: 'web-design-guidelines', refusal: 'no markup review' },
  { id: 'mobile', asks: 'React Native and Expo surfaces', owner: null, fallback: 'vercel-react-native-skills', refusal: 'no mobile' },
  { id: 'verify', asks: 'what it actually looks like in a browser', owner: null, fallback: 'webapp-testing', refusal: 'not looked at' },
  { id: 'a11y', asks: 'whether it can be used at all', owner: null, fallback: 'accesslint', refusal: 'no a11y' },
  { id: 'speed', asks: 'how fast the thing they land on is', owner: 'sheleg-dev' },
  { id: 'handoff', asks: 'what a developer receives, and how it is checked', owner: null, fallback: 'designer-skills-ops', refusal: 'no handoff' },
];

const MODES = [
  ['new design', 'style → brand-surface or product-surface → tokens → motion'],
  ['redesign', 'verify + a11y FIRST — measure what is there — then style'],
  ['update', 'tokens, not the components that read them'],
  ['audit', 'a11y → verify → speed; nothing is redrawn until all three have spoken'],
];

/**
 * An install command that is known-dead or known-harmful, refused at declaration time.
 *
 * Both shapes were copied verbatim out of published articles on 2026-09-03. The first
 * does not exist; the second installs a plain copy into `~/.claude/skills`, which
 * shadows a plugin of the same name and serves its frozen version for ever — the exact
 * failure `lib/shadow.js` detects and `install`/`update` prune after every run. A pack
 * that printed either would be teaching the operator the thing this package exists to
 * un-teach.
 */
const DEAD_INSTALLS = [
  { re: /\bclaude\s+plugin\s+add\b/i, why: '`claude plugin add` is not a subcommand — `claude plugin --help` lists `install` and `marketplace`' },
  // Keyed on the DESTINATION, not on the flag. The first draft demanded a lowercase
  // `r` in the flag cluster and `cp -R` — as ordinary as `cp -r` — walked straight
  // past it; its own fixture caught that before the guard shipped. What makes the
  // line harmful is where it lands, and the flags are cosmetic to that.
  { re: /\bcp\b[^&;|]*\s(?:~|\$\{?HOME\}?)\/\.claude\/skills\/?\s*(?:$|[&;|])/, why: 'copies into ~/.claude/skills, which shadows a plugin of the same name for ever' },
  { re: /\bskills\s+update\s+\S/, why: 'a bare `skills update <name>` re-creates a plain Claude copy beside the plugin' },
];

/**
 * `design` — the only pack, deliberately.
 *
 * Splitting it into `design`, `frontend` and `a11y` was considered and refused: three
 * packs mean three commands an agent has to remember at the moment it is least likely
 * to, and the lanes above already carry the split inside one answer.
 *
 * `provides` lists the skill ids that prove the entry is present. It is a list rather
 * than a name because a marketplace ships several — `ui-ux-pro-max` ships seven — and
 * asking for one of them is enough to know the operator has it.
 */
const PACKS = {
  design: {
    id: 'design',
    role: 'what a design, redesign, front-end or mobile-UI task can reach beyond the family',
    lanes: LANES,
    modes: MODES,
    entries: [
      {
        id: 'frontend-design',
        provides: ['frontend-design'],
        lane: 'style',
        source: 'anthropics/skills',
        install: ['npx --yes skills add anthropics/skills --skill frontend-design'],
        why: 'refuses the default look before a line is written — bans Inter/Roboto/Arial, forces one committed aesthetic direction',
      },
      {
        id: 'web-design-guidelines',
        provides: ['web-design-guidelines'],
        lane: 'implement',
        source: 'vercel-labs/agent-skills',
        install: ['npx --yes skills add vercel-labs/agent-skills --skill web-design-guidelines'],
        why: 'audits built markup against the Web Interface Guidelines — the lane no family router owns',
      },
      {
        id: 'vercel-react-best-practices',
        provides: ['vercel-react-best-practices'],
        lane: 'implement',
        source: 'vercel-labs/agent-skills',
        install: ['npx --yes skills add vercel-labs/agent-skills --skill vercel-react-best-practices'],
        why: 'React and Next.js rules the visual layer cannot see — re-render cost, boundaries, data flow',
      },
      {
        id: 'vercel-composition-patterns',
        provides: ['vercel-composition-patterns'],
        lane: 'product-surface',
        source: 'vercel-labs/agent-skills',
        install: ['npx --yes skills add vercel-labs/agent-skills --skill vercel-composition-patterns'],
        why: 'component architecture for app UI, where sheleg-design decides the look and something has to decide the seams',
      },
      {
        id: 'vercel-react-native-skills',
        provides: ['vercel-react-native-skills'],
        lane: 'mobile',
        source: 'vercel-labs/agent-skills',
        install: ['npx --yes skills add vercel-labs/agent-skills --skill vercel-react-native-skills'],
        why: 'the mobile lane has no family owner at all — navigation, list performance, native animation',
      },
      {
        id: 'vercel-react-view-transitions',
        provides: ['vercel-react-view-transitions'],
        lane: 'motion',
        source: 'vercel-labs/agent-skills',
        install: ['npx --yes skills add vercel-labs/agent-skills --skill vercel-react-view-transitions'],
        why: 'the browser primitive behind route transitions — sheleg-design owns the doctrine, this owns the API',
      },
      {
        id: 'theme-factory',
        provides: ['theme-factory'],
        lane: 'tokens',
        source: 'anthropics/skills',
        install: ['npx --yes skills add anthropics/skills --skill theme-factory'],
        why: 'generates the token set instead of inventing a hex per component',
      },
      {
        id: 'webapp-testing',
        provides: ['webapp-testing'],
        lane: 'verify',
        source: 'anthropics/skills',
        install: ['npx --yes skills add anthropics/skills --skill webapp-testing'],
        why: 'opens the page in a real browser and screenshots it — the only entry here that lets a model grade its own visual work',
      },
      {
        id: 'figma',
        provides: ['figma-use', 'figma-design-to-code', 'figma-generate-design', 'figma-generate-library'],
        lane: 'figma',
        source: 'claude-plugins-official',
        install: ['claude plugin install figma@claude-plugins-official'],
        why: 'reads the actual file rather than riffing — and generate-library runs the seam backwards, from code to components',
      },
      {
        id: 'ui-ux-pro-max',
        // `design-system` is one of the seven this ships and is deliberately NOT here.
        // It is also the name of a skill many machines already carry from another
        // source, so listing it would make presence answer *yes* on the strength of an
        // unrelated skill — the pack would report `ui-ux-pro-max` installed on a
        // machine that has never seen it. A `provides` id has to be one only this
        // entry could have put there.
        provides: ['ui-ux-pro-max', 'ui-styling', 'banner-design'],
        lane: 'style',
        source: 'nextlevelbuilder/ui-ux-pro-max-skill',
        install: [
          'claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill',
          'claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill',
        ],
        why: 'a searchable body of styles, palettes and font pairings — the widest style lane available, and the one a blank page most needs',
        caveat: 'ships SEVEN skills, one of them named `design-system`, which is also the name of a skill many machines already carry. Install it as a PLUGIN, never with the `uipro` CLI: that writes plain copies into each agent\'s skills directory, and a plain copy shadows a plugin of the same name for ever.',
      },
      {
        id: 'impeccable',
        provides: ['impeccable'],
        lane: 'product-surface',
        source: 'pbakaus/impeccable',
        install: [
          'claude plugin marketplace add pbakaus/impeccable',
          'claude plugin install impeccable@impeccable',
        ],
        why: 'the brand-versus-product split, which is the distinction sheleg-design also draws between its vitrine surfaces and its workbench ones — plus 23 verbs that act on an existing screen rather than drawing a new one',
        caveat: 'the strongest collision in this pack, and it is named rather than hidden: it is `user-invocable`, and its description is written to fire on every design prompt — "design, redesign, … animate, colorize, … landing pages, dashboards, product UI". The router still decides the route. Reach for it as a TOOL inside a lane; it is not a second entry point beside `/sheleg-design`.',
      },
      {
        id: 'accesslint',
        provides: ['accessibility-audit', 'accessibility-scan', 'accessibility-fix', 'accessibility-diff', 'accessibility-inspect'],
        lane: 'a11y',
        source: 'AccessLint/skills',
        install: [
          'claude plugin marketplace add AccessLint/skills',
          'claude plugin install accesslint@accesslint',
        ],
        why: 'the a11y lane has NO owner in this family — no router asks whether the interface can be used at all. Five skills: WCAG 2.2 audit, rule-engine scan, live keyboard and screen-reader checks, remediation, and a CI regression diff',
        caveat: 'published install lines point at `accesslint/claude-marketplace`, which now redirects to `AccessLint/skills`, and copy the skills into `~/.claude/skills` — a plain copy that shadows. The two commands above are the plugin channel.',
      },
      {
        id: 'designer-skills-ops',
        provides: ['handoff-spec', 'design-qa-checklist', 'design-debt-audit'],
        lane: 'handoff',
        source: 'Owl-Listener/designer-skills',
        install: [
          'claude plugin marketplace add Owl-Listener/designer-skills',
          'claude plugin install design-ops@designer-skills',
        ],
        why: 'what a developer actually receives — handoff specs with measurements and edge cases, a QA checklist, a design-debt audit. Nobody in the family owns the handoff',
        caveat: 'the marketplace holds 33 plugins and 107 skills; installing all of it roughly doubles a normal machine\'s roster and lands `user-flow-diagram`, `heuristic-evaluation` and `wireframe-spec` straight on `super-ux`. Install THIS plugin, not the marketplace. Its own `design-critique` shares a name with a skill shipped by `anthropics/knowledge-work-plugins`.',
      },
      {
        id: 'designer-skills-toolkit',
        provides: ['design-rationale', 'case-study', 'design-token-audit'],
        lane: 'handoff',
        source: 'Owl-Listener/designer-skills',
        install: [
          'claude plugin marketplace add Owl-Listener/designer-skills',
          'claude plugin install designer-toolkit@designer-skills',
        ],
        why: 'writes down WHY a visual decision was made — the artefact that makes a redesign six months later an edit rather than a re-guess',
        caveat: 'its `ux-writing` lands on `copywriting`\'s ground; the brand pack still decides how the product sounds.',
      },
      {
        id: 'excalidraw-diagram',
        provides: ['excalidraw-diagram'],
        lane: 'handoff',
        source: 'coleam00/excalidraw-diagram-skill',
        install: ['npx --yes skills add https://github.com/coleam00/excalidraw-diagram-skill --skill excalidraw-diagram'],
        why: 'emits a real `.excalidraw` file somebody can open and edit, rather than a picture of a diagram',
        caveat: 'last pushed 2026-03-01 — the quietest source in this pack. `--check` reports its age; decide with that in front of you.',
      },
    ],
    declined: [
      {
        id: 'awesome-codex-skills',
        source: 'composio-community/awesome-codex-skills',
        reason: '880 SKILL.md files and no `.claude-plugin/`, so it installs by copying. Measured against this machine on 2026-09-03 it duplicates NINE already-installed skills — `theme-factory`, `webapp-testing`, `canvas-design`, `skill-creator`, `brand-guidelines`, `slack-gif-creator`, `mcp-builder`, `template-skill`, `internal-comms` — every one of them a shadow. Take single skills out of it by name if you want them; `theme-factory` above is one of those.',
      },
      {
        id: 'designer-skills (whole marketplace)',
        source: 'Owl-Listener/designer-skills',
        reason: '33 plugins, 107 skills. `visual-critique` (7 skills) and `ui-design` (20) are `sheleg-design`\'s subject end to end, and `prototyping-testing` carries `user-flow-diagram`, `wireframe-spec` and `heuristic-evaluation`, which are `ux-flows` and `ux-audit` under other names. Two of its plugins are recommended above, individually.',
      },
      {
        id: 'bencium-marketplace',
        source: 'bencium/bencium-marketplace',
        reason: '16 plugins, of which four touch design. `bencium-controlled-ux-designer` advertises an "always-ask-first protocol for visual decisions" — a behavioural mandate that competes with whichever router is running, which is the `superpowers` shape this package already disables. `typography` and `design-audit` are `sheleg-design`\'s ground. Nothing here closes a lane the pack does not already cover.',
      },
      {
        id: 'design process pack',
        source: null,
        reason: 'named in a published listicle with no repository given, and a GitHub search does not resolve it. An address that cannot be checked is not a recommendation — this row exists so the next reader of that article does not spend the search again.',
      },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * Declaration-time refusals
 * ------------------------------------------------------------------ */

function assertEntry(pack, e, laneIds, seen) {
  const at = `${pack}/${e && e.id ? e.id : '<unnamed>'}`;
  if (!e || !e.id) throw new Error(`${at}: an entry needs an id`);
  if (seen.has(e.id)) throw new Error(`${at}: duplicate id — presence would be decided twice and could disagree`);
  seen.add(e.id);
  if (!Array.isArray(e.provides) || !e.provides.length) {
    throw new Error(`${at}: needs at least one \`provides\` id, or nothing can tell whether it is installed`);
  }
  if (!e.source) throw new Error(`${at}: needs a source — a recommendation with no address cannot be checked`);
  if (!e.why) throw new Error(`${at}: needs a \`why\` — a list of names is not a recommendation`);
  if (laneIds.indexOf(e.lane) === -1) throw new Error(`${at}: lane ${JSON.stringify(e.lane)} is not declared`);
  if (!Array.isArray(e.install) || !e.install.length) {
    throw new Error(`${at}: needs an install command — an entry the operator cannot act on is a note, not a recommendation`);
  }
  for (const cmd of e.install) {
    for (const dead of DEAD_INSTALLS) {
      if (dead.re.test(cmd)) throw new Error(`${at}: refused install command ${JSON.stringify(cmd)} — ${dead.why}`);
    }
  }
}

function assertDeclined(pack, d, seen) {
  const at = `${pack}/declined/${d && d.id ? d.id : '<unnamed>'}`;
  if (!d || !d.id) throw new Error(`${at}: a declined row needs an id`);
  if (seen.has(d.id)) throw new Error(`${at}: id already used by a recommended entry`);
  if (!d.reason) throw new Error(`${at}: a decline with no measured reason is an opinion`);
  if (d.install) throw new Error(`${at}: carries an install command — a row cannot decline something and tell you how to install it`);
}

/** Every structural rule, run over one pack. Throws on the first violation. */
function assertPack(pack) {
  if (!pack || !pack.id) throw new Error('a pack needs an id');
  if (!pack.role) throw new Error(`${pack.id}: needs a role — the one line saying what the pack is for`);
  const laneIds = (pack.lanes || []).map((l) => l.id);
  if (!laneIds.length) throw new Error(`${pack.id}: needs lanes — a flat list of skills answers no question`);
  // An unowned lane MUST carry a default and a refusal phrase. Naming the gap and
  // stopping there was measured failing: a session read `a11y GAP` in its own output,
  // shipped two public pages with a data table and three code blocks, and opened the
  // lane not at all. Every owned route in this family has a refusal phrase precisely
  // so that declining it is an act; an unowned lane had none, which made skipping it
  // indistinguishable from never knowing it existed. (#100)
  const ids = new Set((pack.entries || []).map((e) => e.id));
  for (const l of pack.lanes || []) {
    if (l.owner) continue;
    if (!l.fallback) throw new Error(`${pack.id}/${l.id}: an unowned lane needs a \`fallback\` — a gap with no stated default is a gap the run walks past`);
    if (!ids.has(l.fallback)) throw new Error(`${pack.id}/${l.id}: fallback ${JSON.stringify(l.fallback)} is not an entry in this pack, so its install command cannot be printed`);
    if (!l.refusal) throw new Error(`${pack.id}/${l.id}: an unowned lane needs a \`refusal\` phrase — silence is how skipping it reads as an oversight`);
  }
  const seen = new Set();
  for (const e of pack.entries || []) assertEntry(pack.id, e, laneIds, seen);
  for (const d of pack.declined || []) assertDeclined(pack.id, d, seen);
  return pack;
}

/* ------------------------------------------------------------------ *
 * Presence
 * ------------------------------------------------------------------ */

/**
 * Which entries this machine already has.
 *
 * An entry is present when ANY of its `provides` ids is installed, and the row records
 * which one and through which provider — because "you have it" and "you have a plain
 * copy of it that shadows the plugin" are different answers and the provider is what
 * separates them.
 */
function presence(pack, skills) {
  const index = new Map();
  for (const s of Array.isArray(skills) ? skills : []) {
    if (!s || !s.id) continue;
    if (!index.has(s.id)) index.set(s.id, []);
    index.get(s.id).push(s.plugin || '(unknown)');
  }
  const present = [];
  const missing = [];
  for (const e of pack.entries || []) {
    const hits = e.provides.filter((id) => index.has(id));
    if (hits.length) {
      present.push({ entry: e, via: hits[0], providers: index.get(hits[0]), found: hits });
    } else {
      missing.push({ entry: e });
    }
  }
  return { present, missing };
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

/**
 * Wrap `text`, prefixing the first line with `first` and the rest with a run of spaces
 * the same width. Two prefixes rather than one: the first draft passed a single indent
 * and then re-prefixed every line at the call site, which printed `why:  why:  …` on
 * every continuation — the label is part of the first line, not part of the wrap.
 */
function wrap(text, width, first) {
  const cont = ' '.repeat(first.length);
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const out = [];
  let line = '';
  for (const w of words) {
    if (line && (line.length + 1 + w.length) > width) { out.push(line); line = w; } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) out.push(line);
  return out.map((l, i) => (i ? cont : first) + l);
}

function pad(s, n) { return String(s).padEnd(n); }

/** The lane table — the part that answers "where does this task even go". */
function renderLanes(pack, present) {
  const have = new Set();
  for (const p of present) have.add(p.entry.id);
  const lines = ['  lanes — the question, who owns it, what serves it'];
  const laneW = Math.max(...pack.lanes.map((l) => l.id.length));
  const ownW = Math.max(...pack.lanes.map((l) => (l.owner || 'GAP — no family router owns this').length));
  for (const lane of pack.lanes) {
    const tools = (pack.entries || [])
      .filter((e) => e.lane === lane.id)
      .map((e) => (have.has(e.id) ? e.id : `${e.id}*`));
    const owner = lane.owner || 'GAP — no family router owns this';
    const serves = tools.join(', ') || (lane.owner ? "the router's own" : 'nothing — and nobody owns it');
    lines.push(`    ${pad(lane.id, laneW)}  ${pad(owner, ownW)}  ${serves}`);
  }
  lines.push('    * = declared by this pack and not installed here.');

  // The half that makes an unowned lane actionable. Printing `GAP` and stopping is
  // information; a run needs a default it can take AND a phrase for declining it out
  // loud, which is what every owned route in this family already has.
  const orphans = pack.lanes.filter((l) => !l.owner);
  if (orphans.length) {
    lines.push('');
    lines.push(`  the ${orphans.length} lanes nobody owns — take the default or decline it OUT LOUD`);
    for (const l of orphans) {
      const e = (pack.entries || []).find((x) => x.id === l.fallback);
      const state = have.has(l.fallback) ? 'installed here' : 'NOT installed';
      lines.push(`    ${pad(l.id, 10)} default: ${pad(l.fallback, 27)} ${state}`);
      if (!have.has(l.fallback) && e) lines.push(`                 $ ${e.install[0]}`);
      lines.push(`               declining it is "${l.refusal}" — said in the report, not by silence`);
    }
    lines.push('    A lane skipped without its phrase is indistinguishable from a lane');
    lines.push('    nobody knew about. That is what happened: a run read `a11y GAP` in');
    lines.push('    this output and shipped two public pages without opening it.');
  }
  return lines;
}

/**
 * The report. `opts.lane` narrows to one lane; `opts.verbose` prints every `why`.
 *
 * The closing paragraph is not decoration and cannot be switched off: a curated list
 * printed by the same tool that ships the routers reads as a mandate unless it says
 * otherwise, and the whole arbitration rule in the routing block is that the router
 * decides the route.
 */
function report(pack, skills, opts) {
  const o = opts || {};
  assertPack(pack);
  const { present, missing } = presence(pack, skills);
  const lines = [];

  lines.push(`Pack "${pack.id}" — ${present.length} present, ${missing.length} missing, ${(pack.declined || []).length} declined`);
  lines.push(`  ${pack.role}`);
  lines.push('');

  lines.push(...renderLanes(pack, present));
  lines.push('');

  lines.push('  entry modes — the same lanes, entered in a different order');
  for (const [mode, route] of pack.modes || []) lines.push(`    ${pad(mode, 13)}${route}`);
  lines.push('');

  const wanted = (e) => !o.lane || e.lane === o.lane;

  const here = present.filter((p) => wanted(p.entry));
  lines.push(`  present (${here.length})`);
  // Column widths are MEASURED from the rows, never guessed: `pad` only ever grows a
  // field, so a hardcoded width is a claim about the data that a 29-character id
  // falsifies by running into the next column. `lib/toolkit.js` records the same
  // defect against its own shortlist row and patched it with an unconditional space,
  // which hides the overflow rather than removing it.
  const idW = Math.max(0, ...here.map((p) => p.entry.id.length));
  const laneW = Math.max(0, ...here.map((p) => p.entry.lane.length));
  for (const p of here) {
    lines.push(`    ${pad(p.entry.id, idW)}  ${pad(p.entry.lane, laneW)}  ${p.providers.join(', ')}`);
  }
  if (!here.length) lines.push('    none');
  lines.push('');

  const gone = missing.filter((m) => wanted(m.entry));
  lines.push(`  missing (${gone.length}) — the command is printed, never run`);
  for (const m of gone) {
    const e = m.entry;
    lines.push('');
    lines.push(`    ${e.id}   [lane: ${e.lane}]   ${e.source}`);
    lines.push(...wrap(e.why, 74, '      why:  '));
    if (e.caveat) lines.push(...wrap(e.caveat, 74, '      note: '));
    for (const cmd of e.install) lines.push(`      $ ${cmd}`);
  }
  if (!gone.length) lines.push('    none — everything this pack declares is installed here.');

  if (!o.lane && (pack.declined || []).length) {
    lines.push('');
    lines.push(`  considered and NOT recommended (${pack.declined.length})`);
    for (const d of pack.declined) {
      lines.push('');
      lines.push(`    ${d.id}${d.source ? `   ${d.source}` : '   (no address given)'}`);
      lines.push(...wrap(d.reason, 74, '      '));
    }
  }

  lines.push('');
  lines.push('  These are RECOMMENDATIONS measured against this machine, not a mandate.');
  lines.push('  The router still decides the route and everything above is a tool it may');
  lines.push('  reach for — never a second entry point. Popularity is deliberately not a');
  lines.push('  field here: every star count in the two articles this pack was built from');
  lines.push('  was wrong, three of their addresses had moved and one of their install');
  lines.push('  commands does not exist. `--check` resolves the addresses instead.');

  return lines.join('\n');
}

/** The index, when no pack is named. */
function index(packs) {
  const lines = ['Packs — curated recommendations, measured against this machine'];
  for (const p of Object.values(packs || {})) {
    lines.push(`  ${pad(p.id, 12)}${(p.entries || []).length} entries, ${(p.lanes || []).length} lanes — ${p.role}`);
  }
  lines.push('');
  lines.push('  `npx sshlg-skills pack <name>` for one, `--lane <id>` to narrow it,');
  lines.push('  `--check` to resolve every declared address over the network.');
  return lines.join('\n');
}

/**
 * Render the outcome of `--check`. The fetching lives in the command, not here, so this
 * module stays pure — `results` is `[{id, source, status, movedTo, pushedAt, error}]`.
 *
 * A row that could not be reached prints as `unreachable`, never as `gone`: the machine
 * that runs this may simply be offline, and a check that reports absence when it means
 * silence is the failure the retro's instruction #11 is about.
 */
function checkReport(results) {
  const rows = Array.isArray(results) ? results : [];
  const lines = ['Address check — every source this pack declares'];
  let bad = 0;
  let unreachable = 0;
  for (const r of rows) {
    let verdict;
    if (r.error) { verdict = `unreachable (${r.error})`; unreachable += 1; }
    else if (r.movedTo) { verdict = `MOVED → ${r.movedTo}`; bad += 1; } else if (r.status === 404) { verdict = 'GONE (404)'; bad += 1; } else if (r.archived) { verdict = 'archived'; bad += 1; } else verdict = `ok${r.pushedAt ? `, last push ${r.pushedAt}` : ''}`;
    lines.push(`  ${pad(r.id, 28)}${pad(r.source || '—', 44)}${verdict}`);
  }
  lines.push('');
  lines.push(bad
    ? `  ${bad} address(es) need editing in lib/packs.js before the next release.`
    : '  Every declared address resolves to itself.');
  lines.push('  A row reading `unreachable` is a claim about this network, not about the');
  lines.push('  repository — re-run it before editing anything.');
  return { text: lines.join('\n'), bad, unreachable };
}

/**
 * The exit code `--check` should carry, and why it is never 1.
 *
 * Borrowed wholesale from `test/check_pins.py`'s split, for the reason recorded in
 * `.github/workflows/validate.yml`: a check that fails a build for something the commit
 * did not cause teaches people to re-run it rather than to read it. **An address that
 * moved upstream is not this commit's defect** — nobody here edited it — so it warns.
 * And `unreachable` never counts, because an offline machine or an exhausted API quota
 * would otherwise turn a network outage into a red build; that is the same refusal
 * `checkReport` makes in prose two lines above.
 *
 * The consequence, stated because it is the cost: nothing BLOCKS on a rotted address.
 * The pack was built from articles where three of five addresses had moved, so rot is
 * the expected state rather than the exception, and this is what makes it visible on
 * every run instead of on the day somebody remembers to look.
 */
function checkExit(summary) {
  return summary && summary.bad ? 2 : 0;
}

module.exports = {
  PACKS, LANES, MODES, DEAD_INSTALLS,
  assertPack, presence, report, index, checkReport, checkExit, readSkills,
};
