'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { spawnSync } = require('child_process');
const SHA = /^[a-f0-9]{40}$/;
const TAG = /^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
function demand(ok, why) { if (!ok) throw new Error(why); }
function command(cwd, cmd, args) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024 });
  demand(!r.error && r.status === 0, `${cmd} failed (${r.error ? r.error.code : r.status})`);
  return r.stdout.trim();
}
const git = (repo, ...args) => command(repo, 'git', args);
function validatePlan(p) {
  demand(p && p.schema === 'release-watch/1', 'unsupported plan schema');
  demand(/^[\w.-]+\/[\w.-]+$/.test(p.repository), 'invalid repository');
  demand(SHA.test(p.sha) && TAG.test(p.tag), 'fixed commit SHA and semver tag required');
  demand(Number.isSafeInteger(p.run_id) && p.run_id > 0 && Number.isSafeInteger(p.workflow_id) && p.workflow_id > 0, 'fixed run/workflow IDs required');
  demand(['workflow_dispatch', 'schedule', 'push'].includes(p.event), 'unsupported CI event');
  demand(Array.isArray(p.required_jobs) && p.required_jobs.length > 0
    && p.required_jobs.every(x => typeof x === 'string' && x.length > 0)
    && new Set(p.required_jobs).size === p.required_jobs.length
    && p.required_jobs.some(x => /(^| \/ )validate$/.test(x)), 'named validate job required');
  demand(typeof p.local_receipt === 'string' && p.local_receipt.length > 0, 'exact local npm receipt required');
  return p;
}
function evaluate(p, run, jobs, main, receipt) {
  validatePlan(p);
  demand(main === p.sha, 'main moved; prepare a new explicit candidate');
  demand(run.id === p.run_id && run.workflow_id === p.workflow_id && run.event === p.event && run.head_sha === p.sha, 'CI identity does not match candidate');
  demand(receipt && receipt.source_commit === p.sha && receipt.command === 'npm test' && receipt.exit_code === 0, 'local npm evidence does not match exact candidate');
  if (run.status !== 'completed') {
    demand(['queued', 'in_progress', 'waiting', 'pending', 'requested'].includes(run.status), 'unknown CI status');
    return 'WAIT';
  }
  demand(run.conclusion === 'success', 'CI did not succeed');
  for (const name of p.required_jobs) {
    const matches = jobs.filter(j => j.name === name);
    demand(matches.length === 1 && matches[0].status === 'completed' && matches[0].conclusion === 'success', `required job not successful: ${name}`);
  }
  return 'READY';
}
function readReceipt(file) {
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  demand(typeof r.stdout_artifact === 'string' && path.basename(r.stdout_artifact) === r.stdout_artifact, 'receipt requires a sibling log artifact');
  demand(/^[a-f0-9]{64}$/.test(r.stdout_sha256), 'receipt log digest required');
  const artifact = path.join(path.dirname(file), r.stdout_artifact), raw = fs.readFileSync(artifact);
  const bytes = artifact.endsWith('.gz') ? zlib.gunzipSync(raw, { maxOutputLength: 128 * 1024 * 1024 }) : raw;
  demand(crypto.createHash('sha256').update(bytes).digest('hex') === r.stdout_sha256, 'local test log digest mismatch');
  return r;
}
function checkPins(repo) {
  const r = spawnSync('python3', ['test/check_pins.py', '--strict'], { cwd: repo, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
  demand(!r.error && [0, 2, 3].includes(r.status), 'fresh strict pin measurement failed');
  return { exit_code: r.status, stdout_sha256: crypto.createHash('sha256').update(r.stdout).digest('hex'),
    warning: r.status === 2 ? 'published pins behind latest' : r.status === 3 ? 'own tag not yet published' : null };
}
function cleanHead(repo, sha) {
  demand(git(repo, 'rev-parse', 'HEAD') === sha, 'checkout HEAD does not match fixed candidate');
  demand(git(repo, 'status', '--porcelain', '--untracked-files=no', '--ignore-submodules=none') === '', 'tracked worktree/index is dirty');
  demand(!git(repo, 'submodule', 'status', '--recursive').split('\n').some(s => /^[+\-U]/.test(s)), 'submodule checkout is missing or differs from pin');
  demand(git(repo, 'submodule', 'foreach', '--quiet', '--recursive', 'git status --porcelain --untracked-files=no --ignore-submodules=none') === '', 'tracked submodule worktree/index is dirty');
}
function remoteTag(repo, tag) {
  const rows = git(repo, 'ls-remote', '--tags', 'origin', `refs/tags/${tag}`, `refs/tags/${tag}^{}`).split('\n').filter(Boolean);
  const refs = Object.fromEntries(rows.map(s => s.split(/\s+/).reverse()));
  return { object: refs[`refs/tags/${tag}`], commit: refs[`refs/tags/${tag}^{}`] };
}
function safeTag(repo, tag, sha, push, beforePush = () => {}) {
  demand(TAG.test(tag) && SHA.test(sha), 'invalid fixed tag/commit');
  cleanHead(repo, sha);
  const exists = git(repo, 'tag', '--list', tag) === tag;
  if (exists) {
    demand(git(repo, 'cat-file', '-t', `refs/tags/${tag}`) === 'tag', 'existing local lightweight tag is immutable here');
    demand(git(repo, 'rev-parse', `refs/tags/${tag}^{}`) === sha, 'existing local tag targets another commit');
  }
  const version = JSON.parse(git(repo, 'show', `${sha}:package.json`)).version;
  demand(tag === `v${version}`, 'tag does not match committed package version');
  if (push) {
    const remote = remoteTag(repo, tag);
    if (remote.object) {
      demand(remote.commit === sha, 'existing remote tag is lightweight or targets another commit');
      demand(!exists || git(repo, 'rev-parse', `refs/tags/${tag}`) === remote.object, 'local and remote annotated tag objects differ');
      return { status: 'ALREADY_PUSHED', tag_object: remote.object, sha };
    }
  }
  const log = git(repo, 'show', `${sha}:CHANGELOG.md`);
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lines = log.split('\n');
  const start = lines.findIndex(line => new RegExp(`^##+ \\[?v?${escaped}\\]?(?:\\s|$)`).test(line));
  const next = start < 0 ? [] : lines.slice(start + 1);
  const end = next.findIndex(line => /^##+ /.test(line));
  const notes = next.slice(0, end < 0 ? next.length : end).join('\n').trim();
  demand(start >= 0 && notes, 'committed changelog section missing');
  beforePush();
  cleanHead(repo, sha);
  if (!exists) git(repo, 'tag', '-a', tag, sha, '-m', `${tag}\n\n${notes}`);
  const object = git(repo, 'rev-parse', `refs/tags/${tag}`);
  if (push) {
    beforePush();
    git(repo, 'push', 'origin', `refs/tags/${tag}:refs/tags/${tag}`);
    const remote = remoteTag(repo, tag);
    demand(remote.object === object && remote.commit === sha, 'push readback differs; preserve refs and investigate');
  }
  return { status: push ? 'TAG_PUSHED' : 'TAG_CREATED', tag_object: object, sha };
}
module.exports = { validatePlan, evaluate, readReceipt, checkPins, cleanHead, safeTag, command };
