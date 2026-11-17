'use strict';
/**
 * B-345: the router text of a domain member that is on in one project only.
 *
 * Since 2026-11-11 the Claude routing block carries a member's router only when its plugin is
 * on at user scope (R1, `enablement.claudeMembers`). `domains` turns telegram-dev, xr-dev and
 * web3d-dev off at user scope and on per project, so in exactly the projects that load them
 * their router text was nowhere. It goes into one file the hub owns whole, in that project:
 * `.claude/rules/sshlg-domains.md`. Claude Code reads `.claude/rules/*.md` as project memory
 * (measured 2026-11-17 on 2.1.299: `claude -p` in an empty git folder named a codeword planted
 * there). The file is personal like `.claude/settings.local.json` beside it, so it is written
 * only where git ignores it.
 *
 * Pure: the caller reads the files and writes the result; this module decides.
 */
const crypto = require('crypto');
const path = require('path');

const FILE = path.join('.claude', 'rules', 'sshlg-domains.md');
const HEAD = '<!-- Written by `npx sshlg-skills domains`: the routing text of the domain skills loaded only in '
  + 'this project. `domains --disable` and `--revert` remove it; reword a router with `npx sshlg-skills routers '
  + '--diff/--adopt`, not here. -->';

function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }

/**
 * The members whose router this project needs: on in the project, not on at user scope, and
 * not switched off with `config set routers.<name> off`. `plugins` maps member → plugin id.
 */
function membersFor({ members, plugins, project, user, isEnabled }) {
  return members.filter((m) => plugins[m] && project[plugins[m]] === true && user[plugins[m]] !== true
    && (!isEnabled || isEnabled(m)));
}

/** The file's text for these members, or null when none needs one. Authored wording wins. */
function render({ members, registry, authored }) {
  if (!members.length) return null;
  const parts = [HEAD];
  for (const m of members) {
    const own = authored ? authored(m) : undefined;
    const text = own !== undefined ? own : registry[m] && registry[m].text;
    if (text) parts.push(String(text).trim());
  }
  return parts.length > 1 ? parts.join('\n\n') + '\n' : null;
}

/**
 * What to do with the file: `{ action: 'write' | 'remove' | 'keep' | 'leave', why? }`.
 * `current` is the file's text (null when absent); `recorded` the sha256 this command last
 * wrote there (undefined when it never did). A file someone else wrote, or one edited since,
 * is never overwritten or removed.
 */
function decide({ want, current, recorded }) {
  const ours = current === null || (recorded !== undefined && sha256(current) === recorded);
  if (want === null) {
    if (current === null) return { action: 'keep' };
    return ours ? { action: 'remove' } : { action: 'leave', why: recorded === undefined ? 'not written by this command' : 'edited since this command wrote it' };
  }
  if (current === want) return { action: 'keep' };
  return ours ? { action: 'write' } : { action: 'leave', why: recorded === undefined ? 'not written by this command' : 'edited since this command wrote it' };
}

module.exports = { FILE, HEAD, sha256, membersFor, render, decide };
