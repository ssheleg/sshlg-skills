'use strict';
/**
 * `config`: list and set this machine's settings.
 *
 * Cut from bin/sshlg-skills.js on 2026-11-17 with every body unchanged (B-357); the launcher
 * keeps the usage, the flag parser and main(). Names of another command module are reached
 * through core.lazy, so no module requires another at load.
 */


const { lazy, log, triggersLib } = require('./cli-core.js');
const extraRootPlans = lazy('./cli-install.js', 'extraRootPlans');
const refreshSchedule = lazy('./cli-schedule.js', 'refreshSchedule');

/**
 * B-262: `config set extraRoots.<agent> ack|default`. `ack` records the folder's current
 * fingerprint (lib/extraroots.js) so `update` prints one line for it until its contents
 * change; `default` removes the record. Only a root `update` REPORTS can be acknowledged.
 */
function configExtraRoot(home, agent, value, argc) {
  const X = require('../lib/extraroots.js');
  const configLib = require('../lib/config.js');
  const agents = X.hosts(home, process.env).map((h) => h.agent);
  if (!agents.includes(agent)) {
    log(`config set extraRoots.${agent}: the folder must be one of ${agents.join(', ')}`);
    return 2;
  }
  if (argc !== 3 || !['ack', 'default'].includes(value)) {
    log(`config set extraRoots.${agent}: expected exactly ack or default`);
    return 2;
  }
  if (value === 'default') {
    configLib.extraAckSet(home, agent, null);
    log(`extraRoots.${agent}: default; update prints the full report for this folder again.`);
    return 0;
  }
  const d = extraRootPlans({}).find((x) => x.agent === agent);
  if (!d || !d.holds) { log(`extraRoots.${agent}: refused: ${d ? d.dir : agent} holds no family entry, so there is nothing to acknowledge`); return 2; }
  if (d.action !== 'report') { log(`extraRoots.${agent}: refused: ${d.dir} is refreshed by update (its host is installed), so it is not reported`); return 2; }
  const before = configLib.extraAckGet(configLib.readConfig(home))[agent];
  configLib.extraAckSet(home, agent, { fingerprint: d.fingerprint, at: new Date().toISOString().slice(0, 10), entries: d.holds });
  const kept = before && before.fingerprint === d.fingerprint;
  log(`extraRoots.${agent}: acknowledged${kept ? ` (already, on ${before.at}; unchanged)` : ''}: ${d.dir}, ${d.holds} family entr${d.holds === 1 ? 'y' : 'ies'}.`);
  log('update prints one line for it until its contents change; `config set extraRoots.' + agent + ' default` undoes this.');
  return 0;
}

function cmdConfig(argv) {
  const registry = require('../lib/routers-registry.js');
  const configLib = require('../lib/config.js');
  const home = process.env.HOME || require('os').homedir();
  const [sub, key, value] = argv;

  if (!sub || sub === 'list') {
    const config = configLib.readConfig(home);
    log(`Настройки пака: ${configLib.configPath(home)}\n`);
    for (const name of registry.order()) {
      log(`  routers.${name.padEnd(16)} ${configLib.isEnabled(config, name) ? 'on' : 'off'}`);
    }
    log(`  update.mode${' '.repeat(11)} ${configLib.updateMode(config)}`);
    log(`  rules.star${' '.repeat(12)} ${configLib.starEnabled(config) ? 'on' : 'off'}`);
    try { log(`  rules.wait             ${require('../lib/wait-rule-policy.js').read(home).enabled ? 'on' : 'off'}`); }
    catch (e) { log(`  rules.wait             unknown: ${e.message}`); return 2; }
    const declared = configLib.externalGet(config);
    const names = Object.keys(declared).sort();
    log(names.length ? '\nОбъявленные маршруты (не участники семьи):' : '\nОбъявленных маршрутов нет.');
    for (const n of names) {
      const spec = declared[n] || {};
      const problems = triggersLib().routeProblems(n, spec);
      log(`  routes.external.${n}  → ${spec.skill || n}${problems.length ? '  (НЕ действует: ' + problems[0] + ')' : ''}`);
      log(`    triggers: ${triggersLib().splitTriggers(spec.triggers).join(', ')}`);
    }
    const packs = configLib.packOverridesGet(config);
    log(`\nВидимость паков (поверх pack-marks.json): hidePacks ${packs.hidePacks.length}, showPacks ${packs.showPacks.length}`);
    for (const p of packs.hidePacks) log(`  visibility.pack.${p}  hide`);
    for (const p of packs.showPacks) log(`  visibility.pack.${p}  show`);
    const acks = configLib.extraAckGet(config);
    for (const a of Object.keys(acks).sort()) log(`  extraRoots.${a}  ack (${acks[a].at}, ${acks[a].entries} family entries)`);
    log('\nПоменять:  npx sshlg-skills config set routers.<имя> on|off');
    log('           npx sshlg-skills config set update.mode auto|notify|off');
    log('           npx sshlg-skills config set rules.star on|off');
    log('           npx sshlg-skills config set rules.wait on|off');
    log('           npx sshlg-skills config set routes.external.<имя>.triggers "слово, фраза, …"');
    log('           npx sshlg-skills config set routes.external.<имя>.skill <skill-id>');
    log('           npx sshlg-skills config set routes.external.<имя> off');
    log('           npx sshlg-skills config set visibility.pack.<owner/repo> hide|show|default');
    log('           npx sshlg-skills config set extraRoots.<qwen-code|devin|droid|grok> ack|default');
    return 0;
  }

  if (sub !== 'set') {
    log(`config: неизвестная подкоманда "${sub}": есть list и set`);
    return 2;
  }

  if (key === 'rules.wait') {
    if (argv.length !== 3 || !['on', 'off'].includes(value)) {
      log('config set rules.wait: expected exactly on or off');
      return 2;
    }
    try {
      require('../lib/wait-rule-policy.js').set(home, value);
      log(`rules.wait: ${value}; persistent instruction policy recorded.`);
      log('Preview with `npx sshlg-skills rules`; apply with `rules --apply` and the desired host scope.');
      return 0;
    } catch (e) { log(`rules.wait: refused: ${e.message}`); return 2; }
  }

  if (key === 'rules.star') {
    if (configLib.STATES.indexOf(value) === -1) {
      log(`config set: состояние должно быть on или off: получено "${value === undefined ? '' : value}"`);
      return 2;
    }
    const was = configLib.starEnabled(configLib.readConfig(home)) ? 'on' : 'off';
    if (was === value) { log(`rules.star: ${value} (без изменений)`); return 0; }
    configLib.setStar(home, value);
    log(`rules.star: ${was} → ${value}`);
    log('Блок маршрутизации получит или потеряет строку со звездой при следующем npx sshlg-skills update.');
    return 0;
  }

  if (key === 'update.auto') {
    if (configLib.STATES.indexOf(value) === -1) {
      log(`config set: состояние должно быть on или off: получено "${value === undefined ? '' : value}"`);
      return 2;
    }
    // The key maps to a mode (on: auto, off: notify) and the last key set wins: unchanged
    // means the mode it maps to is already the mode, not merely "auto or not" (B-323).
    const was = configLib.updateMode(configLib.readConfig(home));
    const want = value === 'on' ? 'auto' : 'notify';
    if (was !== want) configLib.setAutoUpdate(home, value);
    log(`update.auto: ${value} (update.mode: ${was === want ? `${want}, без изменений` : `${was} → ${want}`})`);
    log(value === 'off'
      ? 'Набор больше не обновляется сам. Обновить вручную: npx sshlg-skills@latest update'
      : 'Набор будет обновляться сам: каждую ночь и когда ты отойдёшь, целиком, все паки.');
    return refreshSchedule({}) ? 0 : 1;
  }

  if (key === 'update.mode') {
    if (!configLib.UPDATE_MODES.includes(value)) {
      log(`config set: update.mode должен быть ${configLib.UPDATE_MODES.join(', ')}: получено "${value === undefined ? '' : value}"`);
      return 2;
    }
    const was = configLib.updateMode(configLib.readConfig(home));
    if (was !== value) configLib.setUpdateMode(home, value);
    log(`update.mode: ${was === value ? `${value} (без изменений)` : `${was} → ${value}`}`);
    log({
      auto: 'Набор обновляется сам: каждую ночь и когда ты отойдёшь, целиком, все паки.',
      notify: 'Набор сам не обновляется; в начале сессии одна строка скажет, что вышел новый, и чем его поставить.',
      off: 'Набор сам не обновляется и ничего об этом не говорит. Обновить вручную: npx sshlg-skills@latest update',
    }[value]);
    return refreshSchedule({}) ? 0 : 1;
  }

  if (key && key.indexOf('routes.external.') === 0) return configExternal(home, key, argv.slice(2));

  if (key && key.indexOf('extraRoots.') === 0) return configExtraRoot(home, key.slice('extraRoots.'.length), value, argv.length);

  if (key && key.indexOf('visibility.pack.') === 0) {
    const pack = key.slice('visibility.pack.'.length);
    const before = configLib.packOverridesGet(configLib.readConfig(home));
    const was = before.showPacks.includes(pack) ? 'show' : before.hidePacks.includes(pack) ? 'hide' : 'default';
    try { configLib.setPackOverride(home, pack, value); } catch (e) {
      log(`config set ${key}: ${e.message}`);
      return 2;
    }
    log(`visibility.pack.${pack}: ${was} → ${value}${was === value ? ' (без изменений)' : ''}`);
    log('Действует на Gemini, Pi, OpenCode и Hermes. На Claude и Codex переопределение пака ничего не меняет:');
    log('там скрыто всё вне ядра, а оставить скил в списке можно через `visibility --apply --keep <скил>`.');
    log('Применить: npx sshlg-skills visibility --apply (предпросмотр: без --apply).');
    return 0;
  }

  if (!key || key.indexOf('routers.') !== 0) {
    log('config set: ключ должен начинаться с "routers.", "routes.external.", "visibility.pack." или "extraRoots.", или быть "update.mode", "update.auto" или "rules.star"');
    return 2;
  }

  const name = key.slice('routers.'.length);
  if (!Object.prototype.hasOwnProperty.call(registry.REGISTRY, name)) {
    log(`config set: роутера "${name}" нет. Валидные имена:`);
    for (const n of registry.order()) log(`  routers.${n}`);
    return 2;
  }

  if (configLib.STATES.indexOf(value) === -1) {
    log(`config set: состояние должно быть on или off: получено "${value === undefined ? '' : value}"`);
    return 2;
  }

  const was = configLib.isEnabled(configLib.readConfig(home), name) ? 'on' : 'off';
  if (was === value) {
    log(`routers.${name}: ${value} (без изменений)`);
    return 0;
  }
  configLib.setRouter(home, name, value);
  log(`routers.${name}: ${was} → ${value}`);
  log('Запусти `npx sshlg-skills routers --update`, чтобы применить.');
  return 0;
}

/**
 * `config set routes.external.<name>[.triggers|.skill|.line] <value…>` — a route the
 * operator declares for a skill outside the family.
 *
 * Every word after the key is the value, so an unquoted trigger list still arrives
 * whole. The declaration is validated BEFORE it is written: the prompt hook that reads
 * it must fail silent and would drop a bad entry without a word, so this is the one
 * place a mistake can be said out loud. `off` removes the declaration.
 */
function configExternal(home, key, rest) {
  const configLib = require('../lib/config.js');
  const T = triggersLib();
  const m = /^routes\.external\.([^.]+)(?:\.(triggers|skill|line))?$/.exec(key);
  const value = rest.join(' ').trim();
  if (!m) {
    log(`config set: не понял ключ "${key}": routes.external.<имя>.triggers|skill|line или routes.external.<имя> off`);
    return 2;
  }
  const [, name, field] = m;
  if (!field) {
    if (value !== 'off') {
      log(`config set ${key}: без поля принимается только off: получено "${value}"`);
      return 2;
    }
    const was = configLib.externalClear(home, name);
    log(was === undefined ? `routes.external.${name}: не объявлен (без изменений)`
                          : `routes.external.${name}: удалён: ${configLib.configPath(home)}`);
    return 0;
  }
  if (!value) {
    log(`config set ${key}: нужно значение`);
    return 2;
  }
  const current = configLib.externalGet(configLib.readConfig(home))[name] || {};
  const patch = { [field]: field === 'triggers' ? T.splitTriggers(value) : value };
  const next = Object.assign({}, current, patch);
  // Setting the skill or the line before the triggers is allowed; anything else wrong
  // with the declaration is refused now rather than dropped by the hook later.
  const problems = T.routeProblems(name, next)
    .filter((p) => field === 'triggers' || !/^no triggers/.test(p));
  if (problems.length) {
    log(`config set ${key}: не записано:`);
    for (const p of problems) log(`  - ${p}`);
    return 2;
  }
  const stored = configLib.externalSet(home, name, patch);
  log(`routes.external.${name}.${field}: записано в ${configLib.configPath(home)}`);
  const route = T.externalRoutes({ [name]: stored })[0];
  if (route) {
    log(`  → ${route.skill}; ${route.triggers.length} trigger(s): ${route.triggers.join(', ')}`);
    log('  Хук промпта назовёт этот маршрут со следующего сообщения; `conflicts` и');
    log('  `toolkit --for` читают его при каждом запуске.');
  } else {
    log('  Маршрут ещё не действует: задай routes.external.' + name + '.triggers');
  }
  return 0;
}

Object.assign(module.exports, {
  configExtraRoot, cmdConfig, configExternal
});
