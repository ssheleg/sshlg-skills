'use strict';
/**
 * The string literals of a JavaScript source, each with the call it is an argument of.
 *
 * Used by `test/person_text_test.js` (B-278): the operator's rule is that text a person
 * reads carries no em dash, and the launcher's person-facing text is what it hands to an
 * output sink (`log(`, `console.error(`, `say(`, a thrown `Error(`). Comments are code
 * documentation and are skipped; so is everything that is not a string.
 *
 * A tokenizer, not a parser, and small on purpose: it knows comments, the three quote
 * kinds (template literals with nested `${}` expressions), regular-expression literals
 * (by the previous significant token) and parentheses. That is enough to say which
 * call a literal sits inside. Zero dependencies, like the rest of the hub.
 */

const REGEX_BEFORE = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
const REGEX_KEYWORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);

/**
 * `[{ text, line, callee, chain, start, end, decl }]` for every string literal (template
 * text parts included) in `src`; `src.slice(start, end)` is the literal's raw source
 * text, and `decl` the top-level `const`/`let`/`var` it sits in ('' outside one). `callee` is the dotted name before the innermost enclosing `(`,
 * or '' when the literal is not inside a call; `chain` lists every enclosing callee,
 * innermost first.
 */
function literals(src) {
  const out = [];
  const stack = [];          // open brackets: { ch, callee }
  const tplDepth = [];       // brace depth at which each open `${` returns to its template
  let i = 0;
  let line = 1;
  let prev = '';             // the previous significant token (punctuator or word)

  const callees = () => stack.filter((s) => s.ch === '(').map((s) => s.callee).reverse();

  let decl = '';             // the top-level `const|let|var NAME` the cursor is inside
  let declNext = false;

  function emit(text, at, start, end) {
    const chain = callees();
    out.push({ text, line: at, callee: chain[0] || '', chain, start, end, decl });
  }

  function readQuoted(q) {
    const at = line;
    let s = '';
    i += 1;
    const start = i;
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\') { s += src[i] + (src[i + 1] || ''); i += 2; continue; }
      if (src[i] === '\n') line += 1;
      s += src[i];
      i += 1;
    }
    emit(s, at, start, i);
    i += 1;
    prev = 'str';
  }

  // Reads template text up to the closing backtick or the next `${`. Returns true
  // when it stopped at `${` (an expression follows).
  function readTemplateText() {
    const at = line;
    const start = i;
    let s = '';
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { s += c + (src[i + 1] || ''); i += 2; continue; }
      if (c === '`') { emit(s, at, start, i); i += 1; prev = 'str'; return false; }
      if (c === '$' && src[i + 1] === '{') { emit(s, at, start, i); i += 2; prev = '{'; return true; }
      if (c === '\n') line += 1;
      s += c;
      i += 1;
    }
    emit(s, at, start, i);
    return false;
  }

  function readRegex() {
    i += 1;
    let inClass = false;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '\n') { line += 1; break; }   // not a regex after all; give up on the line
      if (inClass) { if (c === ']') inClass = false; }
      else if (c === '[') inClass = true;
      else if (c === '/') { i += 1; break; }
      i += 1;
    }
    while (i < src.length && /[a-z]/i.test(src[i])) i += 1;
    prev = 're';
  }

  // The dotted name immediately before position `end` (exclusive), skipping spaces.
  function nameBefore(end) {
    let j = end - 1;
    while (j >= 0 && /\s/.test(src[j])) j -= 1;
    let k = j;
    while (k >= 0 && /[A-Za-z0-9_$.]/.test(src[k])) k -= 1;
    const name = src.slice(k + 1, j + 1);
    // `new Error(` reads as `Error`; keywords before `(` (if, for, while) are not callees.
    if (/^(if|for|while|switch|catch|function|return|typeof)$/.test(name)) return '';
    return name;
  }

  if (src.startsWith('#!')) { while (i < src.length && src[i] !== '\n') i += 1; }

  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '\n') { line += 1; i += 1; continue; }
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i += 1; continue; }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line += 1; i += 1; }
      i += 2;
      continue;
    }
    if (c === '\'' || c === '"') { readQuoted(c); continue; }
    if (c === '`') { i += 1; if (readTemplateText()) tplDepth.push(stack.length); continue; }
    if (c === '/') {
      if (REGEX_BEFORE.has(prev) || REGEX_KEYWORDS.has(prev) || prev === '') { readRegex(); continue; }
      i += 1; prev = '/'; continue;
    }
    if (c === '(' || c === '[' || c === '{') {
      stack.push({ ch: c, callee: c === '(' ? nameBefore(i) : '' });
      i += 1; prev = c; continue;
    }
    if (c === ')' || c === ']' || c === '}') {
      if (c === '}' && tplDepth.length && tplDepth[tplDepth.length - 1] === stack.length) {
        tplDepth.pop();
        i += 1;
        if (readTemplateText()) tplDepth.push(stack.length);
        continue;
      }
      stack.pop();
      i += 1; prev = c === '}' ? '}' : ')'; continue;
    }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j += 1;
      prev = src.slice(i, j);
      i = j;
      if (!stack.length) {
        if (declNext) { decl = prev; declNext = false; }
        else if (prev === 'const' || prev === 'let' || prev === 'var') declNext = true;
        else if (prev === 'function' || prev === 'class' || prev === 'module') decl = '';
      }
      continue;
    }
    if (c === ';' && !stack.length) decl = '';
    prev = c;
    i += 1;
  }
  return out;
}

module.exports = { literals };
