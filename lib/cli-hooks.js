'use strict';
/**
 * `hooks`: what the family wires into each host, and its removal.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const os = require('os');

const { lazy, log } = require('./cli-core.js');
const hooksSettingsFile = lazy('./cli-rewire.js', 'hooksSettingsFile');

/**
 * The stash key holding whatever status line `hooks install --force` displaced.
 *
 * Deliberately its own key, not the router stash: `hooks remove` must be able to
 * give a tool back its status line without touching wording adoption parked under
 * `adopted:<name>`.
 */
const DISPLACED_STATUSLINE = 'displaced:statusLine';

/**
 * `hooks` — wire the family's three entries into the operator's settings.json.
 *
 * The whole edit is computed by `lib/hooks.js`, which is pure and fixtured; this
 * function does the two things that need a filesystem: take the backup, and
 * write. It goes through `protect()` for the same reason the routing block does
 * — `settings.json` is the operator's file, has no version control behind it,
 * and this pack does not get a second write path to one of those.
 */
function cmdHooks(argv) {
  const fs = require('fs');
  const pathMod = require('path');
  const hooksLib = require('../lib/hooks.js');
  const apply = require('../lib/apply.js');
  const configLib = require('../lib/config.js');

  const sub = (argv[0] && !argv[0].startsWith('-')) ? argv[0] : 'status';
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run');
  const home = os.homedir();
  // The settings point at the copy in the operator's directory, never at this
  // package: run via npx, `__dirname` is npm's cache and npx may prune it, which
  // would leave hooks that fail silently on every prompt.
  const root = hooksLib.runtimeDir(home);
  const pkgRoot = pathMod.resolve(__dirname, '..');
  // The profile Claude Code reads: CLAUDE_CONFIG_DIR, else ~/.claude (B-218, CLAUDE-8).
  const file = hooksSettingsFile(home);
  const wantCodex = argv.includes('--codex');
  // B-280: the guard for Gemini, Kimi, Hermes, Pi and OpenCode (lib/hostgate-install.js).
  const gateLib = require('../lib/hostgate-install.js');
  const wantGates = gateLib.HOSTS.filter((h) => argv.includes(`--${h}`));
  const gateOpts = () => {
    const found = require('../lib/posix-perms.js').findExecutable('node', String(process.env.PATH || '').split(pathMod.delimiter).filter(Boolean));
    return { home, env: process.env, root, node: found || process.execPath };
  };
  const codexDir = hooksLib.codexRoot(home);
  const codexFile = pathMod.join(codexDir, 'hooks.json');

  if (sub === 'recovery') {
    const args = argv.slice(1), action = args.shift();
    let json = false, expected;
    // A usage error is exit 2, apart from a refusal (1); JSON only when asked for.
    const invalid = reason => {
      if (argv.includes('--json')) console.log(JSON.stringify({ ok: false, state: 'USAGE', reason }));
      else log(`hooks recovery: ${reason}`);
      return 2;
    };
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--json' && !json) json = true;
      else if (args[i] === '--expect' && expected === undefined && args[i + 1] && /^(absent|[a-f0-9]{64})$/.test(args[i + 1])) expected = args[++i];
      else return invalid('unsupported recovery argument; use inspect, then recover --expect <digest|absent>');
    }
    if (!['inspect', 'recover'].includes(action) || (action === 'inspect' && expected !== undefined) || (action === 'recover' && expected === undefined)) {
      return invalid('use recovery inspect, then recovery recover --expect <digest|absent>');
    }
    const recovery = require('../lib/runtime-recovery');
    const result = action === 'inspect' ? recovery.inspect(root) : recovery.recover(root, expected);
    if (json) console.log(JSON.stringify(result));
    else log(`runtime recovery: ${result.state}${result.expected ? '; expected=' + result.expected : ''}${result.reason ? '; ' + result.reason : ''}`);
    return result.ok && (action !== 'inspect' || result.state === 'NO_LOCK');
  }

  /**
   * Refresh the wired copy from this package. Idempotent; called on install.
   *
   * The copy itself moved to `lib/runtime.js` in v0.47.0 so `update` could call the
   * SAME one. It lived here as a closure, which is why `update` could not reach it and
   * why a machine that only ran `update` executed hook code from whichever release last
   * ran `hooks install` — `B-22`, found at stage 8 rather than by a gate.
   */
  function syncRuntime() {
    const result = require('../lib/runtime.js').sync(pkgRoot, root, { create: true });
    if (result.ok === false) throw new Error(result.reason);
    if (result.retired && result.retired.length) log(`  runtime: retired ${result.retired.length} dropped file(s) to ${root}/.retired/: ${result.retired.join(', ')}`);
    if (result.ownedError) log(`  runtime warning: ${result.ownedError}`);
    return root;
  }

  let current = {};
  let currentText = null;
  if (fs.existsSync(file)) {
    try {
      currentText = fs.readFileSync(file, 'utf8');
      current = JSON.parse(currentText);
    } catch (e) {
      // Refusing beats guessing. A settings.json that does not parse is either
      // mid-edit or damaged, and rewriting it from a partial read is how the
      // rest of it disappears.
      log(`hooks: ${file} не парсится (${e.message}): ничего не записано.`);
      return false;
    }
  }

  // Codex's hooks.json (B-209): read the same way, only when Codex is installed here. An
  // agent's home is never created, so an absent Codex home means nothing to read or write.
  const codex = { present: fs.existsSync(codexDir), current: {}, text: null, error: null };
  if (codex.present && fs.existsSync(codexFile)) {
    try {
      codex.text = fs.readFileSync(codexFile, 'utf8');
      codex.current = JSON.parse(codex.text);
    } catch (e) { codex.error = e.message; }
  }

  /** One write path for both files: compare, copy, replace, read back (B-218, CLAUDE-7). */
  function writeHooksFile(target, before, data, label) {
    const r = apply.protectedWrite(target, JSON.stringify(data, null, 2) + '\n', { home, expected: before });
    if (r.ok) return r;
    if (r.action === 'changed') log(`hooks: НЕ записан ${target}: файл изменился после чтения (кто-то ещё пишет его). Ничего не перезаписано; запусти команду ещё раз.`);
    else if (r.action === 'backup-failed') log(`hooks: НЕ записан ${target}: не удалось сделать копию (${r.error}). Файл не изменён.`);
    else log(`hooks: НЕ записан ${target} (${label}: ${r.action}).`);
    return null;
  }

  /** The Codex lines of `hooks` status. */
  function codexStatus() {
    if (!codex.present) { log(`\nhooks codex: Codex здесь не найден (${codexDir}), нечего проверять`); return; }
    if (codex.error) { log(`\nhooks codex: ${codexFile} не парсится (${codex.error})`); return; }
    const { reasons } = hooksLib.plan(codex.current, root, { host: 'codex' });
    const stale = reasons.filter((r) => r.reason !== 'added');
    if (!reasons.length) {
      log(`\nhooks codex: подключено и совпадает: ${codexFile}\n  ` + hooksLib.describeCodex(root).join('\n  ')
        + '\n  Codex запускает хук только после проверки в /hooks (доверие привязано к хешу записи)');
    } else if (stale.length) {
      log(`\nhooks codex: устарело: ${codexFile}\n  ` + stale.map((r) => `${r.event}: ${r.reason}`).join('\n  ')
        + '\n  обновить: npx sshlg-skills hooks install --codex (после записи Codex попросит заново доверить хук в /hooks)');
    } else {
      log(`\nhooks codex: не подключено: ${codexFile}\n  добавить: npx sshlg-skills hooks install --codex`);
    }
  }

  if (sub === 'status') {
    // The same plan `hooks install` writes and `update` refreshes (fix round 2, A): an entry
    // is current when the fields this pack writes match, so a field the operator added (a
    // `timeout`) is not "stale". An entry of ours that is absent — removed by hand, never
    // installed, or an event a later release added — is listed apart: `update` never adds
    // one, only `hooks install` does, and saying "stale" would hide which repair applies.
    const { conflicts, reasons } = hooksLib.plan(current, root, {});
    const stale = reasons.filter((r) => r.reason !== 'added');
    const absent = reasons.filter((r) => r.reason === 'added');
    log(`hooks: что ставит семья (${file})\n  ` + hooksLib.describe(root).join('\n  '));
    if (stale.length) {
      log(`\nhooks: устарело: ${stale.map((r) => r.event).join(', ')}\n  ` +
        stale.map((r) => `${r.event}: ${r.reason}`).join('\n  ') + '\n  ' +
        'обновить: npx sshlg-skills hooks install (или update)');
    }
    if (absent.length) {
      log(`\nhooks: не подключено здесь (снято вручную или ещё не ставилось): ` +
        `${absent.map((r) => r.event).join(', ')}\n  ` +
        'добавить: npx sshlg-skills hooks install (update их не добавляет)');
    }
    if (!reasons.length) log('\nhooks: всё на месте и совпадает');
    for (const c of conflicts) log(`hooks: ${c.key} держит ${c.held_by} (${c.note})`);
    codexStatus();
    for (const h of gateLib.HOSTS) {
      const p = gateLib.plan(h, gateOpts());
      if (p.state === 'absent-host') continue;
      const wiredNow = gateLib.planRemoval(h, gateOpts()).state === 'remove';
      if (p.state === 'current' && wiredNow) log(`\nhooks ${h}: подключено и совпадает: ${p.file}`);
      else if (wiredNow) log(`\nhooks ${h}: устарело: ${p.file}\n  обновить: npx sshlg-skills hooks install --${h} (или update)`);
      else if (p.state === 'conflict' || p.state === 'unreadable') log(`\nhooks ${h}: ${p.file}: ${p.reason}`);
      else log(`\nhooks ${h}: не подключено: ${p.file}\n  добавить: npx sshlg-skills hooks install --${h}`);
    }
    return true;
  }

  if (sub === 'remove') {
    const { settings, changed } = hooksLib.removal(current, root);
    // Give back what --force displaced. `--adopt` already solves this shape for
    // router wording by parking the replaced text; a status line taken with the
    // operator's consent and then silently not returned would be the same defect
    // with a different key. Without this, `remove` is not an undo.
    const parked = configLib.stashGet(configLib.readConfig(home), DISPLACED_STATUSLINE);
    if (parked) {
      try {
        settings.statusLine = JSON.parse(parked);
        changed.push('statusLine (returned to its previous owner)');
      } catch (e) {
        log(`hooks: припаркованный statusLine не парсится (${e.message}): оставляю без него`);
      }
    }
    const codexOut = codex.present && !codex.error && codex.text !== null
      ? hooksLib.removal(codex.current, root, { host: 'codex' }) : { changed: [] };
    if (codex.error) log(`hooks codex: ${codexFile} не парсится (${codex.error}), не трогаю`);
    const gateOut = gateLib.HOSTS.map((h) => gateLib.planRemoval(h, gateOpts()));
    for (const g of gateOut) if (g.state === 'unreadable' || g.state === 'conflict') log(`hooks ${g.host}: ${g.file}: ${g.reason}, не трогаю`);
    const gateRemove = gateOut.filter((g) => g.state === 'remove');
    if (!changed.length && !codexOut.changed.length && !gateRemove.length) { log('hooks: ничего нашего не установлено'); return true; }
    if (dryRun) {
      if (changed.length) log(`hooks: --dry-run: снял бы ${changed.join(', ')}`);
      if (codexOut.changed.length) log(`hooks codex: --dry-run: снял бы ${codexOut.changed.join(', ')} из ${codexFile}`);
      for (const g of gateRemove) log(`hooks ${g.host}: --dry-run: ${g.next === null ? 'удалил бы' : 'снял бы гейт из'} ${g.file}`);
      return true;
    }
    if (changed.length) {
      const w = writeHooksFile(file, currentText, settings, 'remove');
      if (!w) return false;
      if (parked) configLib.stashClear(home, DISPLACED_STATUSLINE);
      log(`hooks: снято: ${changed.join(', ')}`);
      log(`hooks: копия до записи: ${w.backup}`);
    }
    if (codexOut.changed.length) {
      const w = writeHooksFile(codexFile, codex.text, codexOut.settings, 'remove codex');
      if (!w) return false;
      log(`hooks codex: снято: ${codexOut.changed.join(', ')} из ${codexFile}`);
      log(`hooks codex: копия до записи: ${w.backup}`);
    }
    for (const g of gateRemove) {
      const w = gateLib.write(g, { home });
      if (!w.ok) { log(`hooks ${g.host}: НЕ снято с ${g.file} (${w.action}${w.error ? `: ${w.error}` : ''}); файл не изменён`); return false; }
      log(`hooks ${g.host}: ${w.action === 'deleted' ? 'удалён' : 'снят гейт из'} ${g.file}`);
      if (w.backup) log(`hooks ${g.host}: копия до записи: ${w.backup}`);
    }
    return true;
  }

  if (sub !== 'install') { log(`hooks: неизвестное подкоманда '${sub}'`); return false; }

  // `--codex` is checked before anything is written: an install that cannot do what was
  // asked of it writes nothing, rather than half of it.
  let codexPlan = null;
  if (wantCodex) {
    if (!codex.present) {
      log(`hooks codex: Codex здесь не найден (${codexDir}; CODEX_HOME или ~/.codex). Ничего не записано.`);
      return false;
    }
    if (codex.error) {
      log(`hooks codex: ${codexFile} не парсится (${codex.error}). Ничего не записано.`);
      return false;
    }
    codexPlan = hooksLib.plan(codex.current, root, { host: 'codex' });
  }
  const gatePlans = [];
  for (const h of wantGates) {
    const p = gateLib.plan(h, gateOpts());
    if (['absent-host', 'unreadable', 'conflict'].includes(p.state)) {
      log(`hooks ${h}: ${p.reason || p.state}. Ничего не записано.`);
      return false;
    }
    gatePlans.push(p);
  }

  const { settings, changed, conflicts } = hooksLib.plan(current, root, { force });
  const blocking = conflicts.filter(() => !force);
  if (blocking.length) {
    for (const c of blocking) {
      log(`hooks: ${c.key} уже держит ${c.held_by}\n  ${c.note}`);
    }
    log('hooks: ничего не записано. Заменить осознанно: npx sshlg-skills hooks install --force');
    return false;
  }
  if (dryRun) {
    log(changed.length
      ? `hooks: --dry-run: записал бы ${changed.join(', ')}, скопировав в ${root}`
      : `hooks: --dry-run: записи не нужны; обновил бы копию в ${root}`);
    if (codexPlan) {
      log(codexPlan.changed.length
        ? `hooks codex: --dry-run: записал бы ${codexPlan.changed.join(', ')} в ${codexFile}`
        : `hooks codex: --dry-run: ${codexFile} уже на месте`);
    }
    for (const p of gatePlans) log(p.state === 'current' ? `hooks ${p.host}: --dry-run: ${p.file} уже на месте` : `hooks ${p.host}: --dry-run: записал бы гейт в ${p.file}`);
    return true;
  }

  // The copy is refreshed even when settings need no change: a `hooks install`
  // after a package update must move the new scripts into place, and "already
  // wired" was true of the paths while the code behind them was stale.
  try {
    syncRuntime();
    log(`hooks: скрипты синхронизированы в ${root}`);
  } catch (e) {
    log(`hooks: не удалось скопировать скрипты в ${root} (${e.message}): настройки не изменены`);
    return false;
  }

  if (!changed.length) log(`hooks: настройки уже на месте (${file})`);
  else {
    // Park what force displaced BEFORE writing over it, and only if nothing is
    // parked already: a second forced install must not overwrite the original
    // owner's entry with our own, which is the write-once rule `adopted:<name>`
    // follows for the same reason.
    for (const c of conflicts) {
      if (c.key !== 'statusLine') continue;
      if (configLib.stashGet(configLib.readConfig(home), DISPLACED_STATUSLINE)) continue;
      configLib.stashSet(home, DISPLACED_STATUSLINE, JSON.stringify(current.statusLine));
    }
    const w = writeHooksFile(file, currentText, settings, 'install');
    if (!w) return false;
    log(`hooks: записано: ${changed.join(', ')}`);
    log(`hooks: файл: ${file}`);
    for (const c of conflicts) {
      log(`hooks: вытеснено: ${c.key} держал ${c.held_by}`);
      log(`hooks: прежний ${c.key} сохранён в ${configLib.configPath(home)}; ` +
          `\`hooks remove\` вернёт его на место`);
    }
    if (w.backup) log(`hooks: копия до записи: ${w.backup}`);
    else log('hooks: файла не было, копировать было нечего');
    log('hooks: перезапусти Claude Code, хуки читаются на старте сессии');
  }

  if (codexPlan) {
    if (!codexPlan.changed.length) log(`hooks codex: ${codexFile} уже на месте`);
    else {
      const w = writeHooksFile(codexFile, codex.text, codexPlan.settings, 'install codex');
      if (!w) return false;
      log(`hooks codex: записано: ${codexPlan.changed.join(', ')} (${codexFile})`);
      log(w.backup ? `hooks codex: копия до записи: ${w.backup}` : 'hooks codex: файла не было, копировать было нечего');
      log('hooks codex: открой Codex и доверь хук в /hooks. До этого Codex его не запускает (доверие привязано к хешу записи)');
    }
  }
  for (const p of gatePlans) {
    if (p.state === 'current') { log(`hooks ${p.host}: ${p.file} уже на месте`); continue; }
    const w = gateLib.write(p, { home });
    if (!w.ok) { log(`hooks ${p.host}: НЕ записан ${p.file} (${w.action}${w.error ? `: ${w.error}` : ''}); файл не изменён`); return false; }
    log(`hooks ${p.host}: записан гейт (${p.file})`);
    log(w.backup ? `hooks ${p.host}: копия до записи: ${w.backup}` : `hooks ${p.host}: файла не было, копировать было нечего`);
    log(`hooks ${p.host}: ${gateLib.NOTES[p.host]}`);
  }
  return true;
}

Object.assign(module.exports, {
  DISPLACED_STATUSLINE, cmdHooks
});
