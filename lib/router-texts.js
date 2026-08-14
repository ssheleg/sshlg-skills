'use strict';
/**
 * The packaged router texts — a façade over `routers-registry.js`.
 *
 * These are defaults, not the truth. Where the operator already wrote a rule
 * by hand, migration moves their wording in and these are never used — a rule
 * someone wrote in their own words is followed, and a rule that arrived as
 * boilerplate is skimmed.
 *
 * The declarations moved to `routers-registry.js`, where a router's text, its
 * table row and the members it needs live in one entry. This file stays as
 * the import path callers already use, so the move cost nobody a rewrite.
 */

const registry = require('./routers-registry.js');

const {
  'super-ux': SUPER_UX_ENTRY,
  'sheleg-design': SHELEG_DESIGN_ENTRY,
  copywriting: COPYWRITING_ENTRY,
  'sheleg-dev': SHELEG_DEV_ENTRY,
  'seo-llmo': SEO_LLMO_ENTRY,
  'evidence-docs': EVIDENCE_DOCS_ENTRY,
  'task-pipeline': TASK_PIPELINE_ENTRY,
  'make-skill': MAKE_SKILL_ENTRY,
  'agent-sync': AGENT_SYNC_ENTRY,
} = registry.REGISTRY;

const SUPER_UX = SUPER_UX_ENTRY.text;
const SHELEG_DESIGN = SHELEG_DESIGN_ENTRY.text;
const COPYWRITING = COPYWRITING_ENTRY.text;
const SHELEG_DEV = SHELEG_DEV_ENTRY.text;
const SEO_LLMO = SEO_LLMO_ENTRY.text;
const EVIDENCE_DOCS = EVIDENCE_DOCS_ENTRY.text;
const TASK_PIPELINE = TASK_PIPELINE_ENTRY.text;
const MAKE_SKILL = MAKE_SKILL_ENTRY.text;
const AGENT_SYNC = AGENT_SYNC_ENTRY.text;

/**
 * Skill name in `skills.json` → the routers it makes available.
 *
 * Derived from the registry rather than hand-kept: a router listed here but
 * missing there was exactly the drift the registry exists to end.
 */
const BY_MEMBER = registry.order().reduce((acc, name) => {
  for (const member of registry.REGISTRY[name].requires) {
    acc[member] = acc[member] || {};
    acc[member][name] = registry.REGISTRY[name].text;
  }
  return acc;
}, {});

/**
 * The routers contributed by the members actually installed.
 *
 * Routers with no required member (`seo-llmo`, `evidence-docs`) are rules
 * rather than skills, so they are always included: they hold whether or not
 * anything is installed, which is why a router stopped being a property of a
 * member in the first place.
 */
function forMembers(names) {
  return registry.resolve({ installed: names || [] });
}

module.exports = {
  SUPER_UX, SHELEG_DESIGN, COPYWRITING, SHELEG_DEV, SEO_LLMO,
  EVIDENCE_DOCS, TASK_PIPELINE, MAKE_SKILL, AGENT_SYNC,
  BY_MEMBER, forMembers,
};
