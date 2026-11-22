'use strict';
/**
 * B-331: the flags each launcher command reads, so `main()` refuses one it does
 * not read before the command runs. Pure: decides from the argument vector only.
 *
 * Before this table these commands looked flags up by name (`argv.includes`,
 * `argv.indexOf`) and never saw the rest, so a mistyped `--jsno` printed the
 * human table with exit 0 and a mistyped `--aply` looked like a finished preview.
 *
 * `flags` take no value. `valued` take the next token as their value unless that
 * token starts with `--`, which is the rule every one of these commands already
 * applies when it reads the value. `sub` replaces the set after a first
 * positional word; `selfSub` names a first word whose own parser refuses.
 *
 * A command absent from TABLE refuses unknown flags in its own parser and is
 * named in SELF_PARSING; `test/cli_unknown_flag_test.js` fails a command that
 * `main()` dispatches on and neither list names.
 */
const GATE_HOSTS = require('./hostgate-install.js').HOSTS.map((h) => `--${h}`);

const TABLE = {
  list: { flags: ['--verbose', '-v', '--json'] },
  agents: {},
  hosts: {},
  injectors: {},
  conflicts: {},
  toolkit: { flags: ['--json', '--copies'], valued: ['--for', '--find', '--expand', '--limit'] },
  visibility: {
    flags: ['--apply', '--revert', '--measure'], valued: ['--days', '--full-days', '--keep'],
    sub: { marks: { flags: ['--init', '--replace', '--apply'], valued: ['--show'] } },
  },
  // --update-step is the step `update` runs through this command; it stays accepted.
  domains: { flags: ['--apply', '--revert', '--no-usage', '--update-step'], valued: ['--root', '--enable', '--disable', '--project'] },
  pack: { flags: ['--check'], valued: ['--lane'] },
  materialised: { valued: ['--root'] },
  signature: { flags: ['--no-star'], valued: ['--used', '--format', '--part'] },
  humanizers: { flags: ['--quiet'] },
  hooks: { flags: ['--force', '--dry-run', '--codex', ...GATE_HOSTS], selfSub: ['recovery'] },
  restore: {},
  // `config set <key> <value…>`: the verb and the key are checked; a value is the
  // operator's own text (a route line may begin with a dash).
  config: { positionsOnly: 2 },
};

const ALIASES = { ls: 'list', packs: 'pack', materialized: 'materialised' };

/** Commands whose own parser refuses an unknown flag (each has a test of its own). */
const SELF_PARSING = ['install', 'i', 'update', 'up', 'uninstall', 'un', 'backup', 'wipe', 'routers', 'rules', 'blocks',
  'schedule', 'enroll', 'settings', 'context'];

/**
 * The install family shares one parser (`parseFlags` in bin/sshlg-skills.js), so each
 * command used to accept every flag any of them reads: `backup --dry-run` took a real
 * backup, `wipe --no-claude` wiped Claude's skills too, `routers --all` wrote as if
 * unscoped. FAMILY names what each command reads, itself or in a helper it hands its
 * flags to (`uninstall` and `routers` scope their host files by `--agent`,
 * `--no-claude` and `--claude-only`). `update` keeps `--routers`: it runs the routing
 * refresh `install` runs and hands it the same answer.
 */
const SCOPE = ['--agent', '-a', '--no-claude', '--claude-only'];
const FAMILY = {
  install: [...SCOPE, '--all', '--dry-run', '--routers', '--member'],
  update: [...SCOPE, '--all', '--dry-run', '--routers', '--member', '--bump-pins'],
  uninstall: [...SCOPE, '--dry-run', '--member'],
  backup: [],
  wipe: ['--dry-run'],
  routers: [...SCOPE, '--dry-run', '--routers', '--member', '--update', '--diff', '--adopt'],
};
const FAMILY_ALIASES = { i: 'install', up: 'update', un: 'uninstall' };
/** Every flag `parseFlags` knows, and those of them that take the next token as a value. */
const FAMILY_FLAGS = ['--all', '--no-claude', '--claude-only', '--bump-pins', '--dry-run', '--update', '--diff', '--adopt',
  '--member', '--routers', '--agent', '-a'];
const FAMILY_VALUED = ['--diff', '--adopt', '--member', '--routers', '--agent', '-a'];

function familyCovers(cmd) { return Object.prototype.hasOwnProperty.call(FAMILY, FAMILY_ALIASES[cmd] || cmd); }

/**
 * The first flag in `rest` that the shared parser knows and `cmd` does not read, or
 * null. A token no family command reads is left to the parser, which refuses it; a
 * valued flag's value is skipped by the parser's own rule (a value never starts with `-`).
 */
function foreignFamilyFlag(cmd, rest) {
  if (!familyCovers(cmd)) return null;
  const own = FAMILY[FAMILY_ALIASES[cmd] || cmd];
  const args = rest || [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!FAMILY_FLAGS.includes(a)) continue;
    if (!own.includes(a)) return a;
    if (FAMILY_VALUED.includes(a) && args[i + 1] !== undefined && !String(args[i + 1]).startsWith('-')) i++;
  }
  return null;
}

function covers(cmd) { return Object.prototype.hasOwnProperty.call(TABLE, ALIASES[cmd] || cmd); }

const isFlag = (a) => typeof a === 'string' && a.length > 1 && a[0] === '-' && a !== '--';

/**
 * The first flag in `rest` that `cmd` does not read, or null. `rest` is what
 * follows the command name. Null for a command the table does not cover.
 */
function unknownFlag(cmd, rest) {
  if (!covers(cmd)) return null;
  let spec = TABLE[ALIASES[cmd] || cmd];
  const args = rest || [];
  if (spec.positionsOnly) {
    for (const a of args.slice(0, spec.positionsOnly)) if (isFlag(a)) return a;
    return null;
  }
  const first = args[0];
  if (first && !isFlag(first)) {
    if (spec.selfSub && spec.selfSub.includes(first)) return null;
    if (spec.sub && spec.sub[first]) spec = spec.sub[first];
  }
  const flags = spec.flags || [], valued = spec.valued || [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') return null;
    if (!isFlag(a)) continue;
    if (flags.includes(a)) continue;
    if (valued.includes(a)) {
      if (args[i + 1] !== undefined && !String(args[i + 1]).startsWith('--')) i++;
      continue;
    }
    return a;
  }
  return null;
}

module.exports = { TABLE, ALIASES, SELF_PARSING, FAMILY, FAMILY_FLAGS, covers, unknownFlag, familyCovers, foreignFamilyFlag };
