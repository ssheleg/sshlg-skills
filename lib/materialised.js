'use strict';

/**
 * A router not invoked because its doctrine already lives in the project — and the
 * difference between that and skipping it.
 *
 * Why it exists. A router's doctrine can be **materialised** inside a repository: tokens
 * in a stylesheet with their provenance markers, a voice pack and a fact registry under
 * `docs/brand/`, a scenario contract with a linter behind it. Once that has happened, work
 * that obeys the router perfectly stops invoking it — the answers are in the tree, cheaper
 * to read than to load. That is the success case, and **nothing distinguishes it from the
 * failure case**: a retrospective reading the run sees the same thing either way, a router
 * that owned the ground and was not invoked.
 *
 * One measured session did substantial work on a product's visual layer and its copy
 * across ten locales, invoked none of `sheleg-design`, `copywriting` or `task-pipeline`,
 * and obeyed all three — reading the pack's tokens out of the project's own
 * `[data-surface]` blocks, `docs/brand/facts.md` for what may be claimed, and running the
 * pipeline's stages by hand because the project already had the gate. The only reason that
 * was visible is that the agent chose to say so. And the honest half of the confession is
 * that the budget had gone into the locales and loading three routers was a cost the run
 * declined — a legitimate reason, and exactly what a skipped route sounds like.
 *
 * **The declaration is not the point; the CHECK is.** A project saying "this router's
 * doctrine lives here" is a claim, and a claim nobody resolves is the defect this whole
 * package is about. So a declaration naming a file that does not exist, or a marker the
 * file does not contain, is reported as **false** — the route was skipped after all, and
 * now with a document asserting otherwise, which is worse than silence.
 *
 * What this deliberately does NOT do: run the project's guards. Executing arbitrary code
 * out of somebody's repository is a different act with a different risk, and a launcher
 * that did it would be a worse thing than the problem. Existence is verified here; running
 * is the project's own gate, and the report says so rather than implying coverage.
 *
 * Pure, like `inventory.js` and `packs.js` — it is handed the declaration and a reader,
 * and returns rows. A fixture asserts it never reaches the filesystem itself.
 */

/** Where a project declares it, by convention. Named once. */
const DECL_PATH = '.claude/routers.json';

/**
 * `raw` is the parsed JSON; `known` is the router names that exist; `read(path)` returns
 * the file's text or `null`. Returns one row per declared router, sorted, so two runs over
 * one tree agree and a difference between them means something.
 *
 * A path may carry a `#fragment`, and the fragment is the sharper half of the claim:
 * `src/app/globals.css#data-surface` asserts not that the stylesheet exists but that it
 * carries the marker the doctrine is about. A file can survive a refactor that deletes
 * everything the router put in it.
 */
function check(raw, known, read) {
  const names = new Set(known || []);
  const rows = [];
  const decl = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  for (const router of Object.keys(decl).sort()) {
    const entry = decl[router] || {};
    const problems = [];
    const resolved = [];

    if (!names.has(router)) {
      problems.push(`\`${router}\` is not a router this family ships — the declaration is about nothing`);
    }

    const materialised = Array.isArray(entry.materialised) ? entry.materialised : [];
    if (!materialised.length) {
      problems.push('names no files — a claim that the doctrine lives here, with nothing to read it from');
    }

    for (const spec of materialised) {
      const at = String(spec).indexOf('#');
      const file = at === -1 ? String(spec) : String(spec).slice(0, at);
      const marker = at === -1 ? null : String(spec).slice(at + 1);
      const text = read(file);
      if (text === null || text === undefined) {
        problems.push(`\`${file}\` does not exist`);
        continue;
      }
      if (marker && text.indexOf(marker) === -1) {
        // The file surviving a refactor that removed everything the router put in it is
        // precisely the case a bare existence check cannot see.
        problems.push(`\`${file}\` exists but does not contain \`${marker}\``);
        continue;
      }
      resolved.push(spec);
    }

    const guards = Array.isArray(entry.guards) ? entry.guards : [];
    const guardsResolved = [];
    for (const g of guards) {
      if (read(String(g)) === null || read(String(g)) === undefined) {
        problems.push(`guard \`${g}\` does not exist`);
      } else {
        guardsResolved.push(String(g));
      }
    }

    rows.push({
      router,
      satisfied: problems.length === 0,
      resolved,
      guards: guardsResolved,
      problems,
    });
  }
  return rows;
}

/**
 * The report. Always prints something, including on a project with no declaration —
 * a check whose silence and whose pass look the same has not answered.
 */
function report(rows, opts) {
  const o = opts || {};
  const list = Array.isArray(rows) ? rows : [];
  const out = [`Materialised routers — what \`${DECL_PATH}\` claims, resolved`];

  if (!o.present) {
    out.push('');
    out.push(`  no ${DECL_PATH} here — nothing is claimed, which is the normal state.`);
    out.push('  A router not invoked in this project is a router not invoked.');
    return out.join('\n');
  }
  if (!list.length) {
    out.push('');
    out.push(`  ${DECL_PATH} exists and declares no router.`);
    return out.join('\n');
  }

  const ok = list.filter((r) => r.satisfied);
  const bad = list.filter((r) => !r.satisfied);
  out.push('');
  for (const r of list) {
    out.push(`  ${r.satisfied ? 'satisfied' : 'FALSE    '}  ${r.router}`);
    for (const f of r.resolved) out.push(`               read from ${f}`);
    for (const g of r.guards) out.push(`               guard      ${g}`);
    for (const p of r.problems) out.push(`               ✗ ${p}`);
  }
  out.push('');
  out.push(`  ${ok.length} satisfied, ${bad.length} false.`);
  if (bad.length) {
    out.push('  A FALSE row is worse than no declaration: the route was skipped and a');
    out.push('  document in the repository says it was not. Fix the paths or delete the');
    out.push('  entry — an unresolvable claim is the thing this check exists to refuse.');
  }
  out.push('');
  out.push('  What this proves and what it does not: every path above was resolved and');
  out.push('  every `#marker` found. **The guards were NOT run** — executing code out of');
  out.push('  a project is a different act with a different risk, and the project\'s own');
  out.push('  gate is what runs them. A satisfied row means the doctrine is READABLE');
  out.push('  here, not that it is obeyed.');
  return out.join('\n');
}

module.exports = { DECL_PATH, check, report };
