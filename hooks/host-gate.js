#!/usr/bin/env node
'use strict';
/**
 * `node host-gate.js <gemini|kimi|hermes>`: the family guard for a host that runs a command
 * per tool call (B-280, lib/hostgate.js). Reads the host's payload on stdin, runs
 * `pre-tool-use.js` beside it on the Claude-shaped call, and prints the refusal in the
 * host's words. Always exits 0 and prints nothing unless it refuses: Gemini blocks a call
 * on a loud failure, so a fault here must be silent.
 */
const path = require('path');

function main() {
  const host = process.argv[2];
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { raw += d; });
  process.stdin.on('end', () => {
    try {
      const gate = require(path.join(__dirname, '..', 'lib', 'hostgate.js'));
      if (!['gemini', 'kimi', 'hermes'].includes(host)) return;
      const call = gate.callOf(host, raw.trim().startsWith('{') ? JSON.parse(raw) : null, process.cwd());
      const payloads = gate.toClaude(host, call);
      if (!payloads.length) return;
      const why = gate.judgeSync(payloads, path.join(__dirname, '..'));
      const text = gate.answer(host, why);
      if (text) process.stdout.write(text);
    } catch (_) { /* a broken gate passes the call */ }
  });
  process.stdin.on('error', () => {});
}

try { main(); } catch (_) { process.exitCode = 0; }
