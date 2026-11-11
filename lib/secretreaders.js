'use strict';
// B-171/B-172: bounded, pure recognition of content-reader operands. This is not
// a shell interpreter or a security boundary. No filesystem reads, symlink
// resolution, arbitrary evaluation, aliases/functions or external script analysis.
const path = require('path').posix;
const READERS = new Set(['cat', 'bat', 'less', 'more', 'head', 'tail', 'xxd', 'od', 'strings', 'nl']);
const FILTERS = new Set(['grep', 'rg', 'sed', 'awk', 'jq']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash']);

function resolve(value, state) {
  let s = String(value || '').replace(/^~(?=\/|$)|^\$\{?HOME\}?(?=\/|$)/, state.home);
  s = s.replace(/\$\{([A-Za-z_]\w*|\d+)\}|\$([A-Za-z_]\w*|\d)/g,
    (m, a, b) => state.vars[a || b] === undefined ? m : state.vars[a || b]);
  return path.resolve(state.cwd, s);
}

// A credential-bearing FILE. Templates and prose are exempt (G4, 2026-11-11): a
// `.env.example` documents names, and a `*.md` page under `secrets/` is a README.
function protectedFile(p) {
  const base = path.basename(p);
  if (/^\.env\.(?:example|sample|template)$/.test(base) || /\.md$/i.test(base)) return false;
  return /(?:^|\/)secrets(?:\/|$)/.test(p)
    || /^\.env(?:[.*-].*)?$/.test(base)
    || /\.(?:key|pem|p12|pfx)$/.test(base)
    || /^(?:id_(?:rsa|dsa|ecdsa|ed25519)|\.netrc|\.pgpass|\.npmrc|credentials(?:\.(?:json|ya?ml))?)$/.test(base)
    || /(?:^|\/)(?:\.claude\.json|\.mcp\.json)$/.test(p)
    || /(?:^|\/)\.claude\/(?:settings(?:\.local)?\.json|\.credentials\.json)$/.test(p)
    || /(?:^|\/)\.codex\/(?:config\.toml|auth\.json)$/.test(p)
    || /(?:^|\/)\.cursor\/mcp\.json$/.test(p)
    || /(?:^|\/)(?:\.config\/opencode|\.local\/share\/opencode|\.opencode)\/(?:opencode|auth)\.jsonc?$/.test(p)
    || /(?:^|\/)\.config\/agentgateway\/servers\.ya?ml$/.test(p);
}

// A client-configuration FOLDER and the protected entries directly inside it (a
// trailing `/` marks a directory). Searching the folder reads those entries unless
// the search excludes them (G3, 2026-11-11).
const FOLDERS = [
  [/(?:^|\/)\.claude$/, ['settings.json', 'settings.local.json', '.credentials.json']],
  [/(?:^|\/)\.codex$/, ['config.toml', 'auth.json']],
  [/(?:^|\/)\.cursor$/, ['mcp.json']],
  [/(?:^|\/)(?:\.opencode|\.config\/opencode|\.local\/share\/opencode)$/,
    ['opencode.json', 'opencode.jsonc', 'auth.json', 'auth.jsonc']],
  [/(?:^|\/)\.config\/agentgateway$/, ['servers.yaml', 'servers.yml', 'secrets/']],
];
function folderEntries(p) {
  for (const [rx, entries] of FOLDERS) if (rx.test(p)) return entries;
  return null;
}

function protectedPath(value, options = {}) {
  if (typeof value !== 'string' || !value) return false;
  const state = { home: options.home || '/__home__', cwd: options.cwd || '/', vars: options.vars || {} };
  const p = resolve(value, state);
  return protectedFile(p) || Boolean(folderEntries(p));
}

// A ripgrep or grep glob, matched against one entry name. Leading `**/` and a
// trailing `/` or `/**` are dropped; `*`, `?` and `{a,b}` are understood. A glob
// that still names a path matches nothing here, so it covers nothing.
function globMatches(glob, name) {
  let g = String(glob || '').replace(/^(?:\*\*\/)+/, '').replace(/\/(?:\*\*)?$/, '');
  if (!g || g.includes('/')) return false;
  let rx = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') rx += '[^/]*';
    else if (c === '?') rx += '[^/]';
    else if (c === '{') { const end = g.indexOf('}', i); if (end < 0) return false;
      rx += '(?:' + g.slice(i + 1, end).split(',').map(x => x.replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')).join('|') + ')'; i = end; }
    else rx += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + rx + '$').test(name);
}

// The exclusions and inclusions a search names (rg `-g`/`--glob`/`--iglob`, grep
// `--include`/`--exclude`/`--exclude-dir`), each as {glob, negate, dirOnly, fileOnly},
// plus {hiddenSkipped} when ripgrep runs without `--hidden`.
function searchFilters(cmd, args) {
  const out = [];
  const take = (flag, value) => {
    if (value === undefined) return;
    if (cmd === 'rg' && ['-g', '--glob', '--iglob'].includes(flag)) {
      const negate = value.startsWith('!');
      out.push({ glob: negate ? value.slice(1) : value, negate });
    } else if (cmd === 'grep' && flag === '--exclude') out.push({ glob: value, negate: true, fileOnly: true });
    else if (cmd === 'grep' && flag === '--exclude-dir') out.push({ glob: value, negate: true, dirOnly: true });
    else if (cmd === 'grep' && flag === '--include') out.push({ glob: value, negate: false, fileOnly: true });
  };
  // ripgrep skips hidden files unless told otherwise; grep -r reads them.
  if (cmd === 'rg' && !args.some(a => a === '--hidden' || a === '-.' || /^-[^-]*u[^-]*u/.test(a))) {
    out.push({ hiddenSkipped: true });
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') break;
    const eq = /^(--[a-z-]+)=(.*)$/.exec(a);
    if (eq) take(eq[1], eq[2]);
    else if (/^-g.+/.test(a) && cmd === 'rg') take('-g', a.slice(2));
    else if (['-g', '--glob', '--iglob', '--include', '--exclude', '--exclude-dir'].includes(a)) take(a, args[++i]);
  }
  return out;
}

// True when a search of this protected folder provably skips every protected entry
// in it: each entry is excluded by a matching negative glob of its kind, or (for a
// file) inclusions exist and none of them matches it.
function folderCovered(p, filters) {
  if (protectedFile(p)) return false;
  const entries = folderEntries(p);
  if (!entries) return false;
  const hiddenSkipped = filters.some(f => f.hiddenSkipped);
  filters = filters.filter(f => !f.hiddenSkipped);
  const includes = filters.filter(f => !f.negate);
  return entries.every((entry) => {
    const dir = entry.endsWith('/');
    const name = dir ? entry.slice(0, -1) : entry;
    if (hiddenSkipped && name.startsWith('.')) return true;
    if (filters.some(f => f.negate && (dir ? !f.fileOnly : !f.dirOnly) && globMatches(f.glob, name))) return true;
    return !dir && includes.length > 0 && !includes.some(f => globMatches(f.glob, name));
  });
}

// Quotes make an operand one word; separators inside them are data. Substitution
// bodies are kept separately so `stat "$(cat FILE)"` cannot masquerade as metadata.
function lex(source) {
  const tokens = [];
  const substitutions = [];
  let word = '', started = false, quote = null;
  const flush = () => { if (started) tokens.push({ word }); word = ''; started = false; };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '\\' && quote !== "'") {
      if (source[i + 1] !== '\n') { word += source[i + 1] || ''; started = true; }
      i++; continue;
    }
    if (quote !== "'" && ((c === '$' && source[i + 1] === '(') || c === '`')) {
      const tick = c === '`';
      let j = i + (tick ? 1 : 2), depth = 1, inner = '', q = null;
      for (; j < source.length; j++) {
        const a = source[j];
        if (a === '\\') { inner += a + (source[++j] || ''); continue; }
        if (q) { if (a === q) q = null; inner += a; continue; }
        if (a === '"' || a === "'") { q = a; inner += a; continue; }
        if (tick && a === '`') break;
        if (!tick && a === '(') depth++;
        if (!tick && a === ')' && --depth === 0) break;
        inner += a;
      }
      substitutions.push(inner);
      // Preserve the body's path words for a reader consuming its returned value.
      word += `__sub_${substitutions.length - 1}__`; started = true; i = j; continue;
    }
    if (quote) { if (c === quote) quote = null; else word += c; started = true; continue; }
    if (c === '"' || c === "'") { quote = c; started = true; continue; }
    if (c === '#' && !started) { while (i < source.length && source[i] !== '\n') i++; flush(); tokens.push({ op: ';' }); continue; }
    if (/[;|&\n()<>]/.test(c)) {
      flush();
      let op = c;
      if ((c === '&' || c === '|' || c === '>') && source[i + 1] === c) op += source[++i];
      else if ((c === '>' || c === '<') && source[i + 1] === '&') op += source[++i];
      tokens.push({ op }); continue;
    }
    if (/\s/.test(c)) { flush(); continue; }
    word += c; started = true;
  }
  flush();
  return { tokens, substitutions };
}

// Filter programs/patterns are not file operands. Recognise the options whose
// values would otherwise be mistaken for paths. Unknown dialects remain outside
// this bounded contract; this is intentionally not a full getopt implementation.
function operands(cmd, args) {
  const files = [], programFiles = [];
  let program = false, options = true, metadata = false;
  const search = cmd === 'grep' || cmd === 'rg';
  const consumes = new Set(search
    ? ['-A', '-B', '-C', '-m', '--after-context', '--before-context', '--context', '--max-count', '--encoding', '--color', '--sort', '--sortr', '--include', '--exclude', '--exclude-dir', '--max-columns', '--max-filesize', '--max-depth', '--threads', '-j', '--replace', '--field-match-separator', '--field-context-separator', '--path-separator', '--label', '--binary-files', '--directories', '--devices']
    : cmd === 'awk' ? ['-F', '-v'] : cmd === 'jq' ? ['--indent'] : []);
  if (cmd === 'rg') for (const opt of ['-g', '--glob', '--iglob', '-t', '--type', '-T', '--type-not', '-r']) consumes.add(opt);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (options && a === '--') { options = false; continue; }
    if (options && a.startsWith('-') && a !== '-') {
      if (search && (/^-[^-]*[cqlL]/.test(a) || ['--count', '--count-matches', '--quiet', '--files-with-matches', '--files-without-match', '--files', '--files-without-matches'].includes(a))) metadata = true;
      if (a === '-e' || a === '--regexp' || a === '--expression') { i++; program = true; continue; }
      if (/^-[e].+/.test(a) || /^--(?:regexp|expression)=/.test(a)) { program = true; continue; }
      if (a === '-f' || a === '--file' || a === '--from-file') { programFiles.push(args[++i]); program = true; continue; }
      if (/^-f.+/.test(a)) { programFiles.push(a.slice(2)); program = true; continue; }
      if (/^--(?:file|from-file)=/.test(a)) { programFiles.push(a.split('=').slice(1).join('=')); program = true; continue; }
      if (cmd === 'jq' && ['--arg', '--argjson'].includes(a)) { i += 2; continue; }
      if (cmd === 'jq' && ['--slurpfile', '--rawfile'].includes(a)) { i++; programFiles.push(args[++i]); continue; }
      if (consumes.has(a)) i++;
      continue;
    }
    if (!program && !(search && args.includes('--files'))) { program = true; continue; }
    files.push(a);
  }
  return { files, programFiles, metadata };
}

// A Python example inside a quoted string/comment is not a call. This only
// locates code positions; dynamic Python and f-string evaluation are out of scope.
function pythonCodePositions(code) {
  const positions = new Set();
  let quote = null, comment = false;
  for (let i = 0; i < code.length; i++) {
    if (comment) { if (code[i] === '\n') comment = false; else continue; }
    if (quote) {
      if (code[i] === '\\') { i++; continue; }
      if (code.startsWith(quote, i)) { i += quote.length - 1; quote = null; }
      continue;
    }
    positions.add(i);
    if (code[i] === '#') comment = true;
    else if (code[i] === "'" || code[i] === '"') {
      quote = code.startsWith(code[i].repeat(3), i) ? code[i].repeat(3) : code[i];
      i += quote.length - 1;
    }
  }
  return positions;
}

function pythonWriteOnly(tail, afterPath = true) {
  const src = afterPath ? tail.replace(/^\s*,/, '') : tail;
  // A literal non-reading mode is the only exception; unknown modes may read.
  return /^\s*(?:mode\s*=\s*)?(['"])(?:[wax]b?|b[wax])\1\s*[,)]/.test(src);
}

function inspect(command, options = {}, depth = 0) {
  if (typeof command !== 'string' || depth > 8) return false;
  const state = { home: options.home || '/__home__', cwd: options.cwd || '/',
    vars: { ...(options.vars || {}) }, aliases: new Set(options.aliases || []) };
  const parsed = lex(command);
  for (const body of parsed.substitutions) if (inspect(body, state, depth + 1)) return true;
  // A substitution placeholder names a body in the parse that PRODUCED it: an inner
  // `$(…)` resolves against the inner body's own substitutions, never the outer list
  // (the outer list sent `"$(echo "$(echo FILE)")"` back to itself until the stack ran
  // out, and the hook's silence turned that into an allow). Past the nesting bound the
  // answer is a refusal: an operand this guard cannot follow is not proven harmless.
  const word = (s, subs, level) => {
    if (!s) return false;
    const sub = /__sub_(\d+)__/.exec(s);
    if (sub) {
      if (level > 8) return true;
      const inner = lex(subs[Number(sub[1])] || '');
      return inner.tokens.some(t => t.word && word(t.word, inner.substitutions, level + 1));
    }
    return protectedPath(s, state) || state.aliases.has(resolve(s, state));
  };
  const secret = (s) => word(s, parsed.substitutions, 0);
  let words = [], redirects = [], pipelinePath = false;
  const run = (end) => {
    if (!words.length) return false;
    let w = words.slice(); words = [];
    const input = redirects.slice(); redirects = [];
    if (['local', 'export', 'declare'].includes(w[0])) w.shift();
    for (;;) {
      while (w.length && /^[A-Za-z_]\w*=/.test(w[0])) {
        const a = w.shift(), at = a.indexOf('='); state.vars[a.slice(0, at)] = a.slice(at + 1);
      }
      if (!['command', 'exec', 'sudo', 'env'].includes(path.basename(w[0] || ''))) break;
      w.shift();
      while (w[0]?.startsWith('-')) {
        const opt = w.shift();
        if (['-u', '-g', '-C', '--user', '--group', '--unset'].includes(opt)) w.shift();
      }
    }
    if (!w.length) return false;
    const cmd = path.basename(w[0] || ''), args = w.slice(1);
    if (cmd === 'cd') {
      let i = 0;
      while (/^-[LPe@]+$/.test(args[i] || '')) i++;
      if (args[i] === '--') i++;
      if (!args[i]) state.cwd = state.home;
      else if (args[i] !== '-') state.cwd = resolve(args[i], state);
    }
    if (cmd === 'cp' || cmd === 'ln') {
      const paths = args.filter(a => !a.startsWith('-'));
      if (paths.slice(0, -1).some(secret) && paths.length > 1) state.aliases.add(resolve(paths[paths.length - 1], state));
    }
    if (SHELLS.has(cmd)) {
      const i = args.findIndex(a => /^-[^-]*c/.test(a));
      const vars = { ...state.vars };
      args.slice(i + 2).forEach((a, n) => { vars[n] = a; });
      if (i >= 0 && inspect(args[i + 1], { ...state, vars }, depth + 1)) return true;
    }
    if (/^python(?:\d+(?:\.\d+)?)?$/.test(cmd)) {
      const at = args.indexOf('-c'), code = args[at + 1] || '';
      if (at >= 0) {
        const positions = pythonCodePositions(code);
        for (const m of code.matchAll(/\bopen\s*\(\s*(?:file\s*=\s*)?(['"])(.*?)\1/g)) {
          if (positions.has(m.index) && secret(m[2]) && !pythonWriteOnly(code.slice(m.index + m[0].length))) return true;
        }
        for (const m of code.matchAll(/\bPath\s*\(\s*(['"])(.*?)\1\s*\)\s*\.\s*(read_text|read_bytes|open)\s*\(/g)) {
          if (positions.has(m.index) && secret(m[2])
              && !(m[3] === 'open' && pythonWriteOnly(code.slice(m.index + m[0].length), false))) return true;
        }
        for (const m of code.matchAll(/\bopen\s*\(\s*(?:file\s*=\s*)?sys\.argv\[(\d+)\]/g)) {
          if (positions.has(m.index) && secret(args[at + 1 + Number(m[1])]) && !pythonWriteOnly(code.slice(m.index + m[0].length))) return true;
        }
      }
    }
    if (cmd === 'claude' && args[0] === 'mcp' && args[1] === 'get' && !args.includes('--help') && !args.includes('-h')) return true;
    if (cmd === 'dd' && args.some(a => a.startsWith('if=') && secret(a.slice(3)))) return true;
    if (READERS.has(cmd) && args.concat(input).some(secret)) return true;
    if (FILTERS.has(cmd)) {
      const op = operands(cmd, args);
      if (op.programFiles.some(secret)) return true;
      if (!op.metadata) {
        const filters = searchFilters(cmd, args);
        for (const f of op.files.concat(input)) {
          if (!secret(f)) continue;
          if ((cmd === 'rg' || cmd === 'grep') && !/__sub_\d+__/.test(f) && !state.aliases.has(resolve(f, state))
              && folderCovered(resolve(f, state), filters)) continue;
          return true;
        }
      }
    }
    if (cmd === 'xargs') {
      // Here the file's CONTENT becomes argv (and often error text), not a list
      // of known safe path names; metadata consumers are not a safe exception.
      if (input.some(secret)) return true;
      let i = 0, replacement = null;
      while (i < args.length && args[i].startsWith('-')) {
        if ((args[i] === '-a' || args[i] === '--arg-file') && secret(args[i + 1])) return true;
        if (args[i].startsWith('--arg-file=') && secret(args[i].slice(11))) return true;
        if (args[i].startsWith('-a') && args[i].length > 2 && secret(args[i].slice(2))) return true;
        if (args[i] === '-I' || args[i] === '--replace') replacement = args[i + 1];
        else if (args[i].startsWith('-I')) replacement = args[i].slice(2);
        else if (args[i].startsWith('--replace=')) replacement = args[i].slice(10);
        if (['-a', '--arg-file', '-n', '-L', '-I', '-P', '-s', '-d', '--max-args', '--replace', '--delimiter'].includes(args[i])) i++;
        i++;
      }
      let nested = args.slice(i);
      if (pipelinePath) {
        const marker = '/__guard__/secrets/path'; // symbolic path taint, never opened
        nested = replacement ? nested.map(a => a.split(replacement).join(marker)) : nested.concat(marker);
      }
      if (nested.length && inspect(nested.map(a => JSON.stringify(a)).join(' '), state, depth + 1)) return true;
    }
    if (cmd === 'find') {
      const at = args.findIndex(a => a === '-exec' || a === '-execdir');
      if (at >= 0) {
        let nested = args.slice(at + 1).filter(a => a !== ';' && a !== '+');
        if (args.slice(0, at).some(secret)) nested = nested.map(a => a.split('{}').join('/__guard__/secrets/path'));
        if (inspect(nested.map(a => JSON.stringify(a)).join(' '), state, depth + 1)) return true;
      }
    }
    // Only path-producing commands feed xargs path taint, not grep patterns.
    pipelinePath = end === '|' && (pipelinePath || (['echo', 'printf', 'find'].includes(cmd) && args.some(secret)));
    return false;
  };
  const tokens = parsed.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.word !== undefined) { words.push(t.word); continue; }
    if (['<', '>', '>>', '>&', '<&'].includes(t.op)) {
      if (/^\d+$/.test(words[words.length - 1] || '')) words.pop();
      if (tokens[i + 1]?.word !== undefined) { if (t.op === '<') redirects.push(tokens[i + 1].word); i++; }
      continue;
    }
    if (run(t.op)) return true;
    if (t.op !== '|') pipelinePath = false;
  }
  return run('');
}

function inspectTool(name, input, options = {}) {
  if (!input || typeof input !== 'object') return false;
  if (name === 'Read') return protectedPath(input.file_path, options);
  if (name === 'Grep' && input.output_mode === 'content') {
    const target = input.path || options.cwd;
    if (input.glob && typeof target === 'string') {
      const state = { home: options.home || '/__home__', cwd: options.cwd || '/', vars: {} };
      const glob = String(input.glob);
      const filter = { glob: glob.replace(/^!/, ''), negate: glob.startsWith('!') };
      if (folderCovered(resolve(target, state), [filter])) return false;
    }
    return protectedPath(target, options) || protectedPath(input.glob, options);
  }
  return false;
}

module.exports = { inspect, inspectTool, protectedPath, globMatches, folderCovered, searchFilters };
