'use strict';
/**
 * `routers`: the managed routing block in every host instruction file.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */

const fs = require('fs');
const path = require('path');

const {
  ROOT, SKILLS, atomic, claudeScope, log, manifest, readLineSync, scopedRoutingTargets
} = require('./cli-core.js');

/**
 * `routers` — write the managed routing block.
 *
 * Exposed as its own command so a single member's installer can delegate here
 * instead of vendoring the writer. The block lists several routers and a
 * precedence table describing what this machine actually has; a lone member
 * rendering it would produce a table for routers nobody installed, which is
 * worse than no table.
 */
function cmdRouters(f) {
  const registry = require('../lib/routers-registry.js');
  const configLib = require('../lib/config.js');
  const apply = require('../lib/apply.js');
  const consent = require('../lib/consent.js');
  const migrate = require('../lib/migrate.js');
  const drift = require('../lib/drift.js');
  const fs = require('fs');
  const path = require('path');
  const home = process.env.HOME || require('os').homedir();

  if (f.diff && f.adopt) {
    log('--diff смотрит, --adopt меняет. Вместе они не идут: сначала посмотри, потом принимай.');
    process.exit(2);
  }

  // Adoption runs BEFORE the settings are read for this run. Clearing an
  // authored entry is what lets the packaged text through, and reading the
  // config first would hand the rest of the command the record it just
  // deleted.
  const adopted = [];
  if (f.adopt && f.adopt.length) {
    for (const name of f.adopt) {
      if (!Object.prototype.hasOwnProperty.call(registry.REGISTRY, name)) {
        log(`--adopt: роутера "${name}" нет. Валидные имена: ${registry.order().join(', ')}`);
        process.exit(2);
      }
      if (f.dryRun) {
        // A preview must not report an adoption that would not happen: with no
        // authored entry there is nothing to take over.
        if (configLib.authoredGet(configLib.readConfig(home), name) !== undefined) adopted.push(name);
        else log(`routers: "${name}" и так на пакетном тексте: принимать нечего`);
        continue;
      }
      const previous = configLib.authoredClear(home, name);
      if (previous === undefined) {
        log(`routers: "${name}" и так на пакетном тексте: принимать нечего`);
        continue;
      }
      // Parked, not dropped: the one act that overwrites a person's words
      // keeps them, under a key the on/off switch will not hand back.
      //
      // Write-once. What is already parked is the only surviving copy of what
      // the operator wrote; a second adoption — after an authored entry
      // reappeared by any route — would park today's text over it and leave
      // nothing to restore from.
      const parked = configLib.stashGet(configLib.readConfig(home), drift.stashKey(name));
      if (parked === undefined) configLib.stashSet(home, drift.stashKey(name), previous);
      adopted.push(name);
    }
  }

  // The settings decide which routers this machine wants; the registry decides
  // which ones it may speak for. With --member, only that member's own — a
  // lone installer speaks for itself and never for the family's rules.
  const config = configLib.readConfig(home);
  const isEnabled = (n) => configLib.isEnabled(config, n);
  // The machine decides the routers that hold only where something is installed
  // outside the family (B-169: `fabric` needs Fabric's services directory).
  const machine = require(path.join(ROOT, 'lib', 'machine.js'));
  const scopeOpts = f.member
    ? { member: f.member, isEnabled }
    : { installed: manifest.skills.map((s) => s.name), isEnabled, machine: machine.probe({ home }) };

  const packaged = registry.resolve(scopeOpts);
  const switchedOff = registry.disabled(scopeOpts);
  // Off this machine: a section a block already carries (1.58.0 wrote `fabric`
  // everywhere) leaves it. Not a refusal, so it is not reported as one below.
  const offMachine = registry.offMachine(scopeOpts);
  const remove = switchedOff.concat(offMachine);
  // R1 (audit 2026-11-11): the Claude target speaks only for members whose Claude plugin
  // is enabled at user scope. `pluginOff` are routers in this run's scope whose member
  // is installed but disabled for Claude: they leave CLAUDE.md, and every other host keeps
  // its current detection. Settings that cannot be read keep the old scope.
  const enablement = require(path.join(ROOT, 'lib', 'enablement.js'));
  const pluginOff = [];
  if (!f.member) {
    const claudeInstalled = enablement.claudeMembers(manifest.skills, enablement.userEnabled(home));
    const claudeScope = registry.scope(Object.assign({}, scopeOpts, { installed: claudeInstalled }));
    for (const name of registry.scope(scopeOpts)) if (!claudeScope.includes(name)) pluginOff.push(name);
  }

  // The registry's own text, copied before the precedence loop below writes
  // the operator's over it. This is the only moment both sides exist in one
  // place, and without the copy the comparison has nothing to compare.
  const registryText = Object.assign({}, packaged);

  // `--diff` inspects and returns. It writes nothing, asks no consent and does
  // not reach the block: the whole reason to look is to decide, and a look
  // that changed the file would be a decision taken on the operator's behalf.
  if (f.diff) {
    if (!Object.prototype.hasOwnProperty.call(registry.REGISTRY, f.diff)) {
      // Exit 2, the same as `--adopt` above and `config set` below: naming a
      // thing that is not a router is one mistake and deserves one code.
      log(`--diff: роутера "${f.diff}" нет. Валидные имена: ${registry.order().join(', ')}`);
      process.exit(2);
    }
    const mine = configLib.authoredGet(config, f.diff);
    const theirs = registryText[f.diff];
    if (theirs === undefined) {
      log(`routers --diff ${f.diff}: этот роутер сейчас не в области действия: его участник не установлен или он выключен настройкой.`);
      return true;
    }
    if (mine === undefined) {
      log(`routers --diff ${f.diff}: раздел идёт пакетным текстом: расходиться не с чем.`);
      return true;
    }
    if (!drift.diverged({ packaged: { [f.diff]: theirs }, authored: { [f.diff]: mine } }).length) {
      log(`routers --diff ${f.diff}: тексты совпадают.`);
      return true;
    }
    log(`--- твой текст (${configLib.configPath(home)})`);
    log(mine);
    log('');
    log('+++ пакетный текст (lib/routers-registry.js)');
    log(theirs);
    log('');
    log(`Принять пакетный:  npx sshlg-skills routers --update --adopt ${f.diff}`);
    return true;
  }

  // Precedence for a body: what the operator wrote > what a setting took out
  // > the packaged default.
  //
  // `preserve` is the half that matters on every run after the first. Once
  // migration has moved a hand-written rule in and removed its heading, the
  // file no longer says the section is theirs — so without this record the
  // packaged text regenerates over it, and "hand-written rules win" would be
  // true exactly once.
  const restored = [];
  const preserve = [];
  for (const name of Object.keys(packaged)) {
    const authored = configLib.authoredGet(config, name);
    if (authored !== undefined) {
      packaged[name] = authored; // used only if the section is missing entirely
      preserve.push(name);
      continue;
    }
    const stashed = configLib.stashGet(config, name);
    if (stashed !== undefined) {
      packaged[name] = stashed;
      restored.push(name);
    }
  }

  if (!Object.keys(packaged).length && !remove.length) {
    log('routers: ни один установленный участник не даёт роутера: нечего писать');
    return true;
  }

  const mode = f.mode || 'install';
  let decision = 'yes';
  if (f.dryRun) {
    // A preview answers "what would I get", not "what happens if I decline".
    // Nothing is written either way, so it previews the block itself and says
    // plainly that no decision was made.
    log('--dry-run: показываю, что было бы записано. Ничего не изменено, ' +
        'согласие не запрошено и не записано.');
  } else if (mode === 'install') {
    decision = consent.askConsent({
      home,
      persist: !f.dryRun,
      interactive: process.stdin.isTTY === true,
      answer: f.routers,
      prompt: (q) => { process.stdout.write(q); return readLineSync(); },
      log,
    });
  }

  // Hand-written rules win over the packaged text, so migration runs first and
  // its result is what gets written.
  const superseded = {};
  const sources = {};
  // Migration reads and may rewrite instructions before the emitter runs.
  // It must use the same selected hosts, not inspect every installed profile.
  const scoped = scopedRoutingTargets(f);
  for (const t of scoped.hostTargets) {
    const file = path.join(apply.hostRoot(t, home), t.file);   // honours CODEX_HOME & co. (B-165)
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    const moved = migrate.migrate(src, { fallbacks: packaged });
    const wants = moved.text !== src && decision === 'yes' && !f.dryRun;
    // Nothing to write counts as nothing left undone; only a wanted write can
    // fail to happen.
    let wrote = !wants;
    if (wants) {
      // Through `protect()`, like every other write to a file the operator owns
      // and did not write. For eight releases this one was not, and it was the
      // only write in the pack that could destroy `~/.claude/CLAUDE.md` leaving
      // no copy anywhere: reproduced 2026-08-16 against a scratch HOME with the
      // backup directory unwritable, the file went from four sections to three
      // lines while the run printed «Файл не изменён». The house rule names the
      // shape — there is no second write path — and this was the second one.
      const saved = apply.protect(file, { home });
      if (saved.action === 'backup-failed') {
        log(`${file}: НЕ записан: не удалось сделать резервную копию ` +
            `(${saved.error}). Файл не изменён. Освободи ` +
            `~/.sshlg-skills/backups/ и повтори.`);
      } else {
        atomic.write(file, moved.text);
        wrote = true;
      }
    }
    // Hand the migrated text on rather than letting apply re-read the file:
    // on a dry run nothing was written, and re-reading would preview the
    // additions without the removals that come with them.
    //
    // But only what is true of the disk now. A refused write means the
    // operator's headings are still in the file, so passing the migrated text
    // would hand `apply` a baseline in which they had already gone — and it
    // would then compute a diff against a state that does not exist.
    sources[file] = decision === 'yes' && wrote ? moved.text : src;
    if (!wrote) continue;
    Object.assign(packaged, moved.routers);
    Object.assign(superseded, moved.superseded);
    // Whatever migration just moved is the operator's, and this is the only
    // moment it is still identifiable as such: the heading it came from is
    // about to leave the file.
    //
    // `moved.migrated`, NOT `moved.routers`. The latter is the bodies to
    // write, fallbacks merged in, so iterating it claimed authorship of all
    // eight routers on the first run of any machine.
    for (const name of moved.migrated || []) {
      if (preserve.indexOf(name) === -1) preserve.push(name);
      if (!f.dryRun && decision === 'yes') configLib.authoredSet(home, name, moved.routers[name]);
    }
  }

  // B-202: what this hub last wrote into each file, so a refresh can tell its own
  // bytes from a hand edit inside a section or region. Hub metadata, not an
  // operator file: no backup; a damaged record reads as none, which keeps MORE.
  const store = require('../lib/store.js');
  const renderedFile = path.join(home, '.sshlg-skills', 'routers-rendered.json');
  const renderedRecord = store.readJson(renderedFile);
  const renderedFiles = renderedRecord.schema === 1 && renderedRecord.files && typeof renderedRecord.files === 'object'
    ? renderedRecord.files : {};

  const res = apply.apply({
    rendered: renderedFiles,
    home, mode, consent: decision, routers: packaged,
    // Only the selected host files are written; the rest stay byte-identical.
    hostTargets: scoped.hostTargets, includeCursor: scoped.includeCursor,
    extraTargets: scoped.extraTargets,
    // What the operator decided once, so a target added in a later release
    // reaches a machine that already said yes.
    consentRecorded: consent.readState(home).routers,
    // With --member the caller speaks only for itself and must not render a
    // roster of the whole family from a manifest it happens to ship.
    members: f.member ? [] : SKILLS,
    // B-180: the star line rides only when the operator turned it on.
    star: require('../lib/config.js').starEnabled(require('../lib/config.js').readConfig(home)),
    remove, preserve, sources, dryRun: f.dryRun, log,
    perAgent: pluginOff.length ? { claude: {
      routers: Object.fromEntries(Object.entries(packaged).filter(([name]) => !pluginOff.includes(name))),
      remove: remove.concat(pluginOff.filter((name) => !remove.includes(name))),
    } } : undefined,
  });

  // Whatever left the block is kept, not dropped. A switch that loses the
  // operator's wording on the way out is a switch nobody dares use twice, and
  // the file it was taken from has no version control behind it.
  if (!f.dryRun && decision === 'yes') {
    for (const r of res.targets) {
      for (const [name, body] of Object.entries(r.removed || {})) {
        // A section that left because the machine lacks what it is about keeps
        // only words the operator wrote; the packaged text needs no copy, and a
        // stashed copy would come back instead of the current text the day the
        // machine gains it.
        if ((offMachine.includes(name) || pluginOff.includes(name)) && registry.REGISTRY[name]
            && body.trim() === registry.REGISTRY[name].text.trim()) continue;
        configLib.stashSet(home, name, body);
      }
    }
    for (const [id, body] of Object.entries(superseded)) {
      configLib.stashSet(home, 'superseded:' + id, body);
    }
    // A restored section is live again, so its copy in the settings is now a
    // stale duplicate of text that has a home.
    for (const name of restored) configLib.stashClear(home, name);
  }

  // Hand edits the refresh kept (B-202). Named by file:line in the preview and the run,
  // every time, until resolved: a section becomes the operator's authored text (so
  // `--diff` / `--adopt` apply); a region is a refused refresh and the run is partial.
  const keptRegions = [];
  const lines = (k) => (k.startLine === k.endLine ? `${k.startLine}` : `${k.startLine}-${k.endLine}`);
  for (const r of res.targets) {
    for (const k of r.kept || []) {
      if (k.kind === 'section') {
        log(`routers: ${r.file}:${lines(k)}: section "${k.name}" holds text the pack did not write; kept as it is and ${f.dryRun ? 'would be ' : ''}recorded as your authored text for ${k.name}.`);
        log(`  Compare: npx sshlg-skills routers --diff ${k.name}   Take the packaged text: npx sshlg-skills routers --update --adopt ${k.name}`);
        if (!f.dryRun && decision === 'yes' && configLib.authoredGet(configLib.readConfig(home), k.name) === undefined) {
          configLib.authoredSet(home, k.name, k.body);
        }
      } else {
        keptRegions.push(k);
        log(`routers: ${r.file}:${lines(k)}: the ${k.name} region holds text the pack did not write; the region was left as it is, not refreshed.`);
        log('  Move those lines outside the block (above its BEGIN or below its END marker), then run: npx sshlg-skills routers --update');
      }
    }
  }
  if (!f.dryRun && decision === 'yes') {
    const next = Object.assign({}, renderedFiles);
    for (const r of res.targets) {
      if (r.rendered && ['unchanged', 'updated', 'created'].includes(r.action)) next[r.file] = r.rendered;
    }
    // Written only when it changes, so a run that changed nothing writes nothing.
    if (JSON.stringify(next) !== JSON.stringify(renderedFiles) || renderedRecord.schema !== 1) {
      try { store.writeJson(renderedFile, () => ({ schema: 1, files: next })); }
      catch (e) { log(`routers: the record of what was written (${renderedFile}) was not saved: ${e.message}; the next refresh keeps more, never less`); }
    }
  }

  // A copy of every file this run modified, taken before it was modified. Said
  // once rather than per target: four identical lines about the same directory
  // is how a useful line becomes noise the operator learns to skip.
  const saved = res.targets.filter((t) => t.backup && t.backup.action === 'saved');
  const blocked = res.targets.filter((t) => t.action === 'backup-failed');

  for (const r of res.targets) {
    if (r.action === 'agent-absent') continue;
    log(`routers: ${r.file}: ${r.action}`);
    if (r.action === 'opted-out' && decision === 'yes') {
      log('  it carries the line <!-- SSHLG:ROUTERS:OPTOUT --> (written by you, or by an install run without '
        + 'a terminal before 1.84.1); delete that line and run this again to receive the block');
    }
    // B-206: a refusal or a symlink the hub will not write through says why, and what to do.
    if (r.reason) log(`  ${r.reason}`);
    for (const l of (r.plugin && r.plugin.lines) || []) log(`  ${l}`);
    if (r.diff) log(r.diff);
  }
  if (saved.length) {
    log(`routers: копии до записи: ${path.dirname(saved[0].backup.path)} (${saved.length})`);
  }
  for (const b of blocked) {
    // The write did not happen. Saying only "backup-failed" leaves the operator
    // to guess whether their file was touched, which is the one thing they need
    // to know for certain.
    log(`routers: ${b.file}: НЕ записан: не удалось сделать резервную копию ` +
        `(${b.backup && b.backup.error}). Файл не изменён.`);
  }
  if (switchedOff.length) log(`routers: выключены настройкой: ${switchedOff.join(', ')}`);
  for (const name of offMachine) {
    const what = machine.PREDICATES[registry.REGISTRY[name].machine];
    log(`routers: ${name}: not on this machine: ${what ? what.what : 'its machine predicate does not hold'}`);
  }
  for (const id of Object.keys(superseded)) {
    log(`routers: вытеснен рукописный раздел "${id}": тело сохранено в ${configLib.configPath(home)}`);
  }
  if (adopted.length) {
    log(`routers: принят пакетный текст: ${adopted.join(', ')}` +
        (f.dryRun ? ' (--dry-run: ничего не записано)'
                  : `; прежние формулировки сохранены в ${configLib.configPath(home)}`));
  }

  // The report, last, because it is about the NEXT run rather than this one.
  //
  // The operator's wording wins on every run, which is the point — but a
  // router reworded upstream then never arrives, and until now nothing said
  // so. Reporting does not change what was just written; it removes the one
  // outcome nobody chose, which is finding out by reading two files side by
  // side.
  const diverging = drift.diverged({
    packaged: registryText,
    authored: (configLib.readConfig(home) || {}).authored || {},
  });
  if (diverging.length) {
    log('');
    log(`routers: твой текст расходится с пакетным: ${diverging.map((e) => e.name).join(', ')}`);
    log('  Твоё слово по-прежнему выигрывает: блок записан с твоими формулировками.');
    log('  Посмотреть разницу:  npx sshlg-skills routers --diff <имя>');
    log('  Принять пакетный:    npx sshlg-skills routers --update --adopt <имя>');
  }
  // A refused region refresh makes a real run partial (exit 1), like a refused wait
  // block; a preview is a render and exits 0, as `update --dry-run` does.
  return f.dryRun || !keptRegions.length;
}

Object.assign(module.exports, {
  cmdRouters
});
