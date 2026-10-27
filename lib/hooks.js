'use strict';
/**
 * Wiring the family's hooks into `~/.claude/settings.json` (or the profile
 * `$CLAUDE_CONFIG_DIR` names), and the guard alone into Codex's `hooks.json`
 * (`plan(…, {host: 'codex'})`, opt-in through `hooks install --codex`). Cursor reads
 * the Claude entries itself; lib/hookpayload.js turns its payloads into Claude's.
 *
 * Seven events and a status line, and each one earns its cost differently:
 *
 * - `SessionStart` — one ~90-token pointer saying the routing block is not
 *   advisory, plus the session's title and the paths worth watching. This is the
 *   mechanism this family measured at 854 tokens in another pack and switched
 *   off, so the size is the design, not an accident.
 * - `UserPromptSubmit` — names the route a prompt asks for, and prints nothing
 *   on the turns that are most of them.
 * - `PreToolUse` — the half that HOLDS: a copy before any write to a file the
 *   operator cannot recover, and a refusal for the one command that has silently
 *   pinned a skill at an old version on this machine before.
 * - `PostToolUse` — what could only be checked after the fact: a credential in what
 *   Bash, Read or Grep printed (by vendor shape or by its label), shadowing copies,
 *   and the config `obsidian-wiki setup` truncates on every run.
 * - `Notification` — a desktop ping during an autonomous run.
 * - `ConfigChange` — notices when something else overwrites these very entries.
 *   It cannot report at the time (the event discards every channel it has), so it
 *   records and `SessionStart` speaks.
 * - `FileChanged` — the run ledger advancing a stage, said once.
 * - `statusLine` — where the pipeline is, read from the ledger it already keeps.
 *
 * **The operator's file wins.** A `statusLine` already set by something else is
 * never silently replaced: `plan()` reports the conflict and the caller decides.
 * The one thing this module will not do is take a setting it did not put there
 * and lose what was in it — that is how a person discovers their configuration
 * changed by noticing it is gone.
 *
 * Pure. `plan()` computes the edit and `describe()` explains it; writing is
 * `bin/sshlg-skills.js`'s job, through `protect()`, because this pack does not
 * get a second path to the operator's files.
 */

/**
 * Every event we wire, its matcher, and the script behind it.
 *
 * One table, because the previous shape listed the events inside `plan()` and
 * again inside `removal()`: two lists that agree until someone adds an event to
 * one of them, and then `remove` silently stops being an undo.
 */
/**
 * The PreToolUse matcher: `^(?:<names>|<mcp tools>)$`.
 *
 * Every name is a tool one of the two hosts that read this entry has: Claude Code (Edit,
 * Write, NotebookEdit, Bash, Read) and Cursor, which imports it from settings.json (Grep,
 * and Delete, which removes a file the guard must copy first). MultiEdit is gone: no
 * current host has it (Claude Code 2.1.299's tool list, report 2026-10-16 CLAUDE-6).
 *
 * The ORDER is load-bearing for Cursor. Its importer splits a Claude matcher on `|`, maps
 * each piece by exact name (Bash -> Shell, Edit -> Write, `mcp__s__t` -> `MCP:t`) and
 * joins the pieces back (cursor-agent 2026.09.02, test/hookpayload_test.js transcribes
 * it). So only the first and last piece carry the anchors: `^(?:Edit` (Cursor has no Edit;
 * Write is listed) and the MCP registry's last tool. Bash must sit in the middle, whole,
 * or Cursor never maps it to Shell and the secret guard stops reaching Cursor's shell.
 */
const PRE_TOOL_NAMES = ['Edit', 'Write', 'NotebookEdit', 'Bash', 'Read', 'Grep', 'Delete'];
const PRE_TOOL_MATCHER = `^(?:${PRE_TOOL_NAMES.join('|')}|${require('./mcpsecrets.js').MATCHER})$`;

/**
 * Codex runs Claude-format hooks from `~/.codex/hooks.json` (B-209). Only the guard is
 * wired there: `Bash` (shell and unified exec), `apply_patch` (Codex's only file writer;
 * its paths are read out of the patch by lib/hookpayload.js) and the same MCP tools.
 * Codex's matcher is a RegExp (https://learn.chatgpt.com/docs/hooks), so it is anchored.
 */
const CODEX_MATCHER = `^(?:Bash|apply_patch|${require('./mcpsecrets.js').MATCHER})$`;
const CODEX_WIRED = [{ event: 'PreToolUse', matcher: CODEX_MATCHER, script: 'pre-tool-use' }];

const WIRED = [
  // `resume` and `fork` join the original three: without them a resumed session
  // gets no routing pointer at all, and `sessionTitle` — which the reference says
  // is ignored on `clear` and `compact` — would have no event that can carry it.
  { event: 'SessionStart', matcher: 'startup|clear|compact|resume|fork', script: 'session-start' },
  { event: 'UserPromptSubmit', matcher: null, script: 'user-prompt-submit' },
  // The MCP tools whose answer carries a credential join the matcher by name, from
  // their registry (lib/mcpsecrets.js) — every other MCP call never spawns the hook.
  // Anchored (B-218, CLAUDE-6): the MCP part makes this a RegExp, which Claude Code tests
  // unanchored, so `Write` also woke the hook for `TodoWrite` and `Read` for
  // `ReadMcpResourceTool`. See PRE_TOOL_MATCHER for the order and the names.
  { event: 'PreToolUse', matcher: PRE_TOOL_MATCHER, script: 'pre-tool-use' },
  // Read and Grep join Bash for the output scans (secrets.scan, labelledsecrets): a file
  // read whole prints what `cat` would. MCP results are not matched — every MCP call would
  // pay a spawn — and the ones known to carry a secret are refused before they run.
  { event: 'PostToolUse', matcher: 'Bash|Read|Grep', script: 'post-tool-use' },
  { event: 'Notification', matcher: 'idle_prompt|agent_completed', script: 'notification' },
  { event: 'ConfigChange', matcher: 'user_settings', script: 'config-change' },
  // FileChanged's matcher is a filename, not a tool name. The watch list itself
  // arrives from SessionStart's `watchPaths`, because the ledger lives at
  // `.task-pipeline/run.md` and this matcher can only name files in the cwd.
  { event: 'FileChanged', matcher: 'run.md', script: 'file-changed' },
];

/** The events, in wiring order. */
const EVENTS = WIRED.map((w) => w.event);

/** Kept for readers of the previous shape: the `SessionStart` matcher. */
const MATCHER = WIRED[0].matcher;

/** Where the wired copy lives, relative to home. */
const RUNTIME = ['.sshlg-skills', 'runtime'];

/**
 * The directory the settings entries point at — never the package directory.
 *
 * `npx sshlg-skills hooks install` runs from npm's cache, which npx is free to
 * clean. Wiring that path produces hooks that work until the cache is pruned and
 * then fail silently on every prompt, which is worse than not installing them.
 * So `install` copies `hooks/` and `lib/` into the operator's own directory and
 * wires THAT — the same reason the routing block is written into a file the
 * operator keeps rather than referenced from wherever the pack happened to run.
 */
function runtimeDir(home) {
  return require('path').join(home, ...RUNTIME);
}

/** The entries, keyed by what they hook. */
function entries(root) {
  const script = (name) => `node "${root}/hooks/${name}.js"`;
  const out = {};
  for (const w of WIRED) {
    const group = { hooks: [{ type: 'command', command: script(w.script), shell: 'bash', async: false }] };
    if (w.matcher) group.matcher = w.matcher;
    // Matcher first, so a human diffing settings.json reads what it matches
    // before what it runs.
    out[w.event] = w.matcher
      ? { matcher: w.matcher, hooks: group.hooks }
      : { hooks: group.hooks };
  }
  out.statusLine = { type: 'command', command: script('statusline') };
  return out;
}

/**
 * The Codex entries, keyed by event. A handler carries `type`, `command` and a `timeout`
 * in seconds, the fields Codex documents; no `shell` or `async`, which are Claude's.
 */
function codexEntries(root) {
  const out = {};
  for (const w of CODEX_WIRED) {
    out[w.event] = {
      matcher: w.matcher,
      hooks: [{ type: 'command', command: `node "${root}/hooks/${w.script}.js"`, timeout: 10 }],
    };
  }
  return out;
}

/**
 * Codex's config root: `$CODEX_HOME`, else `<home>/.codex` (the resolution lib/apply.js
 * and lib/codexplugins.js use). The hooks file is `<root>/hooks.json`.
 */
function codexRoot(home, env) {
  const e = env || process.env;
  return e.CODEX_HOME || require('path').join(home, '.codex');
}

/**
 * What differs per host: which events, which entry shape, which handler fields are ours,
 * and whether a status line belongs to it. `timeout` is not ours on Codex: it is added
 * when absent and an operator's own value is kept.
 */
const PROFILES = {
  claude: { events: () => EVENTS, entries: (root) => entries(root), ownHookKeys: ['type', 'command', 'shell', 'async'], statusLine: true },
  codex: { events: () => CODEX_WIRED.map((w) => w.event), entries: (root) => codexEntries(root), ownHookKeys: ['type', 'command'], statusLine: false },
};
function profile(host) {
  return PROFILES[host || 'claude'] || PROFILES.claude;
}

/** Is this entry one of ours? Matched by path, so a rename is a fresh install. */
function isOurs(command, root) {
  return typeof command === 'string' && command.includes(`${root}/hooks/`);
}

/** The fields this module writes, per level. Anything else on our entries is the operator's. */
const OWN_GROUP_KEYS = ['matcher', 'hooks'];
const OWN_HOOK_KEYS = ['type', 'command', 'shell', 'async'];
const OWN_STATUS_KEYS = ['type', 'command'];

/**
 * The first field in which two flat objects differ, `command` first because it is the one
 * an operator acts on, then every other key in the order the installed entry has them.
 * `null` when they agree.
 */
function firstDifference(have, want) {
  const a = have || {};
  const b = want || {};
  const keys = ['command'].concat(Object.keys(a), Object.keys(b));
  for (const k of keys) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return k;
  }
  return null;
}

/**
 * Which part of an installed entry of ours is stale: the `matcher`, then the field of our
 * hook that differs (`command`, `async`, …, or one the operator added, such as `timeout`),
 * then any other field of the group. `order` only when the entry itself is right and the
 * event still differs — a duplicate of ours, or a position that moved (fix round #7: it
 * used to say `order` for an operator's `timeout`, and `command` for a status line whose
 * command was current).
 */
function whyDiffers(have, want) {
  if ((have.matcher || null) !== (want.matcher || null)) return 'matcher';
  const hh = have.hooks || [];
  const wh = want.hooks || [];
  if (hh.length !== wh.length) return 'hooks';
  for (let i = 0; i < wh.length; i += 1) {
    const d = firstDifference(hh[i], wh[i]);
    if (d) return d;
  }
  const g = firstDifference(
    Object.assign({}, have, { hooks: undefined, matcher: undefined }),
    Object.assign({}, want, { hooks: undefined, matcher: undefined }));
  return g || 'order';
}

/**
 * `want` laid over `have`: the fields we own take `want`'s value (or go, when `want` has
 * none), every other field keeps the installed value and its position. Key order follows
 * the installed entry, so a refresh that changes nothing writes the same bytes.
 */
function overlay(have, want, own) {
  const out = {};
  for (const k of Object.keys(have || {})) {
    if (!own.includes(k)) out[k] = have[k];
    else if (want[k] !== undefined) out[k] = want[k];
  }
  for (const k of Object.keys(want)) if (!(k in out)) out[k] = want[k];
  return out;
}

/** Our group refreshed in place, keeping the operator's fields (the update path). */
function refreshGroup(have, want, root, ownHookKeys) {
  const group = overlay(have, want, OWN_GROUP_KEYS.filter((k) => k !== 'hooks'));
  let placed = false;
  const hooks = [];
  for (const h of have.hooks || []) {
    if (!isOurs(h && h.command, root)) { hooks.push(h); continue; }
    if (placed) continue;                   // a second copy of ours inside one group
    hooks.push(overlay(h, want.hooks[0], ownHookKeys || OWN_HOOK_KEYS));
    placed = true;
  }
  group.hooks = hooks;
  return group;
}

/**
 * Has this machine consented to the family's hooks? One entry of ours anywhere in
 * `settings.hooks` (or the status line) is the consent: `hooks install` is the only
 * thing that writes it. Nothing of ours means nothing was asked for, and `update`
 * must not be the moment that changes.
 */
function consented(current, root) {
  const s = current || {};
  const hooks = s.hooks || {};
  const inHooks = Object.keys(hooks).some((ev) => Array.isArray(hooks[ev])
    && hooks[ev].some((m) => (m.hooks || []).some((h) => isOurs(h.command, root))));
  return inHooks || Boolean(s.statusLine && isOurs(s.statusLine.command, root));
}

/**
 * The edit to make, and what it would displace.
 *
 * Returns `{settings, changed, conflicts, reasons, skipped}`. `conflicts` lists settings
 * owned by someone else that the requested install would overwrite; the caller refuses on
 * those unless `force` is set, so replacing another tool's status line is always a
 * decision somebody made out loud.
 *
 * **One rule for "our entry is current"** (fix round 2, A): an entry of ours is current
 * when the fields this module writes (`OWN_GROUP_KEYS`, `OWN_HOOK_KEYS`, `OWN_STATUS_KEYS`)
 * match the package; any other field on it is the operator's and is kept, in place, by
 * every path — `hooks install`, `update`, `hooks status` and the ConfigChange detector
 * (`lib/displace.js`) all read this function, so none of them can call an operator's
 * `timeout` stale while another keeps it.
 *
 * `opts.refreshOnly` is the unattended `update` path (fix round #7, risks c and d). It
 * differs from install only in what it ADDS: it refreshes entries of ours that are
 * PRESENT — an event or status line the operator removed by hand stays removed, and a
 * family event a later release introduced is not wired either (`hooks install` is the act
 * that adds; both are listed in `skipped`) — and it never writes a status line somebody
 * else holds, so that status line is no conflict there: it is listed in `skipped` and
 * left byte-identical while the hook events are refreshed.
 */
function plan(current, root, opts) {
  const o = opts || {};
  const prof = profile(o.host);
  const next = JSON.parse(JSON.stringify(current || {}));
  const want = prof.entries(root);
  const conflicts = [];
  const changed = [];
  // Why each entry in `changed` is there (R03): `added` | `matcher` | `command` | `order`.
  // A status line that says only "(refreshed)" cannot tell an operator whether the
  // fix is a new matcher or a cosmetic reorder; this can, and the update path logs it.
  const reasons = [];
  const skipped = [];
  const refreshOnly = Boolean(o.refreshOnly);

  for (const event of prof.events()) {
    const present = next.hooks && Array.isArray(next.hooks[event])
      && next.hooks[event].some((m) => (m.hooks || []).some((h) => isOurs(h.command, root)));
    if (refreshOnly && !present) {
      skipped.push({ event, why: 'no entry of ours: removed by hand or never wired; `hooks install` adds it' });
      continue;
    }
    next.hooks = next.hooks || {};
    const existing = next.hooks[event] || [];
    // Ours is replaced in place; anyone else's is left beside it. Two packs can
    // both hook SessionStart, and dropping the other one is not this pack's call.
    const others = existing.filter(
      (m) => !(m.hooks || []).some((h) => isOurs(h.command, root))
    );
    const mine = existing.filter(
      (m) => (m.hooks || []).some((h) => isOurs(h.command, root))
    );
    // OUR ENTRY KEEPS ITS PLACE. `others.concat([want[event]])` always moved it to
    // the end, so on any machine where another pack also hooks this event the
    // multiset was identical and the ORDER was not — and `hooks` reported a
    // byte-perfect install as `(refreshed)`, permanently. Measured 2026-09-01 on a
    // machine whose nine runtime scripts are byte-identical to the package
    // (`diff -rq` silent): four events flagged, and exactly the four another tool
    // also registers. Following the advice rewrote `settings.json`, spent one of the
    // ten backup slots, changed nothing, and the condition came back.
    //
    // The README names four such packs by name, so this is the ordinary case, not
    // the exotic one. A status command that cries wolf is how an operator learns to
    // stop reading it.
    // What our entry should read: the package's fields laid over the installed entry, so
    // the operator's own fields survive — on `hooks install` exactly as on `update` (fix
    // round 2, A: install used to write the package's entry whole, so an operator's
    // `timeout` read as stale in `hooks status` and the named repair deleted it).
    const target = mine.length ? refreshGroup(mine[0], want[event], root, prof.ownHookKeys) : want[event];
    const merged = mine.length
      ? (() => {
        // Replace in place, and drop any duplicate of ours further down.
        let placed = false;
        const out = [];
        for (const m of existing) {
          const isMine = (m.hooks || []).some((h) => isOurs(h.command, root));
          if (!isMine) { out.push(m); continue; }
          if (!placed) { out.push(target); placed = true; }
        }
        return out;
      })()
      : others.concat([want[event]]);
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      changed.push(mine.length ? `${event} (refreshed)` : `${event} (added)`);
      reasons.push({ event, reason: mine.length ? whyDiffers(mine[0], target) : 'added' });
    }
    next.hooks[event] = merged;
  }

  if (!prof.statusLine) return { settings: next, changed, conflicts, reasons, skipped };
  const sl = next.statusLine;
  if (sl && sl.command && !isOurs(sl.command, root)) {
    if (refreshOnly) {
      // Never written on this path, so it is no conflict here — and must block nothing.
      skipped.push({ event: 'statusLine', why: `held by ${sl.command}: left as it is` });
    } else {
      conflicts.push({
        key: 'statusLine',
        held_by: sl.command,
        note: 'a status line set by something else: replacing it loses what it printed',
      });
      if (o.force) {
        next.statusLine = want.statusLine;
        changed.push('statusLine (replaced)');
        reasons.push({ event: 'statusLine', reason: 'command' });
      }
    }
  } else if (refreshOnly && !sl) {
    skipped.push({ event: 'statusLine', why: 'no status line of ours: removed by hand or never wired; `hooks install` adds it' });
  } else {
    const target = sl ? overlay(sl, want.statusLine, OWN_STATUS_KEYS) : want.statusLine;
    if (JSON.stringify(sl) !== JSON.stringify(target)) {
      next.statusLine = target;
      changed.push(sl ? 'statusLine (refreshed)' : 'statusLine (added)');
      reasons.push({ event: 'statusLine', reason: sl ? (firstDifference(sl, target) || 'order') : 'added' });
    }
  }

  return { settings: next, changed, conflicts, reasons, skipped };
}

/** The edit that removes ours and leaves everything else exactly as it was. */
function removal(current, root, opts) {
  const prof = profile((opts || {}).host);
  const next = JSON.parse(JSON.stringify(current || {}));
  const changed = [];

  for (const event of prof.events()) {
    if (!next.hooks || !next.hooks[event]) continue;
    // Our hook comes out of its group; the group goes only when nothing else is left in it
    // (final polish 6). `install` and `update` keep a foreign hook placed INSIDE our group
    // (`refreshGroup`), so dropping every group that contains ours dropped that hook too.
    let touched = false;
    const kept = [];
    for (const m of next.hooks[event]) {
      const hooks = m.hooks || [];
      if (!hooks.some((h) => isOurs(h && h.command, root))) { kept.push(m); continue; }
      touched = true;
      const others = hooks.filter((h) => !isOurs(h && h.command, root));
      if (others.length) kept.push(Object.assign({}, m, { hooks: others }));
    }
    if (touched) changed.push(event);
    // An empty array is not the same as an absent key to every reader of this
    // file, so the key goes when nothing is left in it.
    if (kept.length) next.hooks[event] = kept;
    else delete next.hooks[event];
  }
  if (next.hooks && !Object.keys(next.hooks).length) delete next.hooks;

  if (prof.statusLine && next.statusLine && isOurs(next.statusLine.command, root)) {
    delete next.statusLine;
    changed.push('statusLine');
  }
  return { settings: next, changed };
}

/** One line per entry, for the report a run prints about itself. */
function describe(root) {
  const w = entries(root);
  const rows = EVENTS.map((e) => {
    const m = w[e].matcher ? `   (matcher: ${w[e].matcher})` : '';
    return `${e.padEnd(17)}${w[e].hooks[0].command}${m}`;
  });
  rows.push(`${'statusLine'.padEnd(17)}${w.statusLine.command}`);
  return rows;
}

/** The Codex entry, one line per event, for `hooks` status. */
function describeCodex(root) {
  const w = codexEntries(root);
  return Object.keys(w).map((e) => `${e.padEnd(17)}${w[e].hooks[0].command}   (matcher: ${w[e].matcher})`);
}

/**
 * B-277: is the shared runtime copy in this run's scope? Every host whose hooks execute it
 * counts: Claude (`settings.json`, refreshed whenever the Claude host is in scope, as
 * before) and Codex (`hooks.json`), when Codex is in scope and an entry of ours is there.
 * Pure: `claude`/`codex` are the run's scope verdicts (`{inScope, skippedBy}`) and
 * `codexHooks` the parsed Codex hooks file, or null. Returns `{inScope, hosts, skippedBy}`.
 */
function runtimeScope({ claude, codex, codexHooks, root }) {
  const hosts = [];
  if (claude && claude.inScope) hosts.push('claude');
  if (codex && codex.inScope && consented(codexHooks, root)) hosts.push('codex');
  if (hosts.length) return { inScope: true, hosts };
  return { inScope: false, hosts, skippedBy: (claude && claude.skippedBy) || (codex && codex.skippedBy) || 'scope' };
}

module.exports = {
  runtimeScope,
  plan, removal, describe, describeCodex, entries, codexEntries, codexRoot, isOurs, consented,
  runtimeDir, whyDiffers, WIRED, CODEX_WIRED, EVENTS, MATCHER, RUNTIME, PRE_TOOL_MATCHER, CODEX_MATCHER,
};
