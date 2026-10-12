'use strict';
/**
 * Machine predicates: a router or a hook route that holds only on a machine
 * with something installed outside the family (B-169).
 *
 * `requires` names family members, which the manifest can check. Some rules
 * are about the MACHINE instead — `fabric` is true only where Fabric's
 * services directory exists — and a block that carried such a rule onto every
 * machine wrote an organisation's tooling into the global file of people who
 * have never installed it (USR-012, project-observatory release iteration 1).
 *
 * Each predicate takes a probe `{ env, platform, home, exists }`, so the
 * registry and the matcher stay pure and a test hands in the machine it wants.
 * `probe()` builds the real one.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

function probe(over) {
  const o = over || {};
  return {
    env: o.env || process.env,
    platform: o.platform || process.platform,
    home: o.home || process.env.HOME || os.homedir(),
    exists: o.exists || ((p) => { try { return fs.statSync(p).isDirectory(); } catch (e) { return false; } }),
  };
}

/**
 * Where Fabric keeps its service descriptors: `$FABRIC_SERVICES_DIR` when set,
 * else the per-OS default the fabric router's own text names.
 */
function fabricServicesDir(m) {
  const env = m.env || {};
  if (env.FABRIC_SERVICES_DIR) return env.FABRIC_SERVICES_DIR;
  if (m.platform === 'darwin') return path.join(m.home, 'Library', 'Application Support', 'ai.passioncode.fabric', 'services');
  if (m.platform === 'win32') {
    const local = env.LOCALAPPDATA || path.win32.join(m.home, 'AppData', 'Local');
    return path.win32.join(local, 'passioncode-fabric', 'services');
  }
  return path.join(env.XDG_DATA_HOME || path.join(m.home, '.local', 'share'), 'passioncode-fabric', 'services');
}

/** name -> { what, holds(probe) }. `what` is what the operator reads when a rule is left out. */
const PREDICATES = {
  fabric: {
    what: 'Fabric is not installed on this machine (no services directory)',
    holds: (m) => m.exists(fabricServicesDir(m)),
  },
};

/** Does the named predicate hold? An unknown name never holds: a typo must not write a rule everywhere. */
function holds(name, m) {
  const p = PREDICATES[name];
  return !!p && p.holds(m || probe());
}

module.exports = { probe, fabricServicesDir, holds, PREDICATES };
