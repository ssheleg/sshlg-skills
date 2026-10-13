#!/usr/bin/env node
'use strict';
// One read-only probe by default. Execution needs an explicitly armed fixed plan.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const W = require('../lib/releasewatch');
const args = process.argv.slice(2);
function value(flag) { const i = args.indexOf(flag); return i < 0 ? null : args[i + 1]; }
async function main() {
  const planFile = value('--plan'), repoArg = value('--repo'), stateArg = value('--state');
  if (!planFile || !repoArg) throw new Error('usage: release-watch.js --plan FILE --repo OWNED_CHECKOUT [--execute --state FILE] [--watch SECONDS]');
  const repo = fs.realpathSync(repoArg), planBytes = fs.readFileSync(planFile), p = W.validatePlan(JSON.parse(planBytes));
  const execute = args.includes('--execute'), interval = Number(value('--watch') || 0);
  if (interval && (!Number.isInteger(interval) || interval < 60 || interval > 300)) throw new Error('watch interval must be 60–300 seconds');
  if (execute && (p.allow_tag_push !== true || !stateArg)) throw new Error('execution requires allow_tag_push:true and a state file');
  const identity = crypto.createHash('sha256').update(planBytes).digest('hex');
  const state = stateArg && path.resolve(stateArg), lock = state && `${state}.lock`;
  const emit = result => {
    const row = { schema: 'release-watch-state/1', plan_sha256: identity, candidate: p.sha, run_id: p.run_id, at: new Date().toISOString(), ...result };
    if (state) {
      const tmp = `${state}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(row, null, 2) + '\n', { mode: 0o600, flag: 'wx' }); fs.renameSync(tmp, state);
    }
    console.log(JSON.stringify(row)); return row;
  };
  if (state) {
    if (fs.existsSync(state) && JSON.parse(fs.readFileSync(state)).plan_sha256 !== identity) throw new Error('state belongs to another plan');
    fs.writeFileSync(lock, `${process.pid}\n`, { mode: 0o600, flag: 'wx' });
  }
  let mutationStarted = false;
  try {
    const api = endpoint => JSON.parse(W.command(repo, 'gh', ['api', `repos/${p.repository}/${endpoint}`]));
    const check = () => {
      if (crypto.createHash('sha256').update(fs.readFileSync(planFile)).digest('hex') !== identity) throw new Error('plan changed while watching');
      const remote = W.command(repo, 'git', ['remote', 'get-url', 'origin']);
      const pushRemote = W.command(repo, 'git', ['remote', 'get-url', '--push', 'origin']);
      const allowed = [ `git@github.com:${p.repository}.git`, `https://github.com/${p.repository}.git`, `https://github.com/${p.repository}` ];
      if (!allowed.includes(remote) || !allowed.includes(pushRemote)) throw new Error('origin fetch/push URL does not match plan repository');
      W.cleanHead(repo, p.sha);
      const policy = JSON.parse(W.command(repo, 'git', ['show', `${p.sha}:pipeline.json`]));
      if (!policy.release || !policy.release.enabled || policy.release.approval !== 'checks') throw new Error('candidate does not authorize release by checks');
      const run = api(`actions/runs/${p.run_id}`);
      if (!['.github/workflows/validate.yml', '.github/workflows/pages.yml'].includes(run.path)) throw new Error('unsupported validation workflow path');
      const pages = JSON.parse(W.command(repo, 'gh', ['api', '--paginate', '--slurp', `repos/${p.repository}/actions/runs/${p.run_id}/attempts/${run.run_attempt}/jobs?per_page=100`]));
      const jobs = pages.flatMap(page => page.jobs || []);
      const main = api('branches/main').commit.sha;
      const receipt = W.readReceipt(path.resolve(path.dirname(planFile), p.local_receipt));
      return W.evaluate(p, run, jobs, main, receipt);
    };
    for (;;) {
      const verdict = check(); emit({ status: verdict, execute });
      if (verdict === 'READY') {
        if (!execute) return;
        const pins = W.checkPins(repo);
        emit({ status: 'TAG_INTENT', tag: p.tag, pins });
        mutationStarted = true;
        const result = W.safeTag(repo, p.tag, p.sha, true, () => {
          if (check() !== 'READY') throw new Error('candidate became unready before tag push');
        });
        // API reads cannot lock a simultaneous main advance. Record it after push;
        // never rewrite a tag to conceal that external race.
        const currentMain = api('branches/main').commit.sha;
        emit({ ...result, pins, main_after_push: currentMain, main_unchanged: currentMain === p.sha }); return;
      }
      if (!interval) { process.exitCode = 2; return; }
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }
  } catch (e) { emit({ status: mutationStarted ? 'NEEDS_RECONCILIATION' : 'REFUSED', tag: p.tag, reason: e.message }); throw e; }
  finally { if (lock) fs.unlinkSync(lock); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
