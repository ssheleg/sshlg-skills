'use strict';

// JSON.parse owns syntax. This second walk records source spans and rejects
// duplicate decoded keys (JSON.parse would silently choose the last value).
// No comments/JSONC, key guessing or whole-document serialization.
function parse(text) {
  const data = JSON.parse(text);
  let i = 0;
  const ws = () => { while (/\s/.test(text[i] || '') && i < text.length) i++; };
  function string() {
    const start = i++;
    while (i < text.length) {
      if (text[i] === '\\') i += 2;
      else if (text[i++] === '"') break;
    }
    return { start, end: i, value: JSON.parse(text.slice(start, i)) };
  }
  function value(depth) {
    if (depth > 128) throw new Error('JSON nesting exceeds the supported limit');
    ws(); const start = i;
    if (text[i] === '"') return string();
    if (text[i] === '{') {
      i++; ws(); const props = [], keys = new Set();
      while (text[i] !== '}') {
        const key = string();
        if (keys.has(key.value)) throw new Error('duplicate JSON object key');
        keys.add(key.value); ws(); i++; // colon, already syntax-validated
        const v = value(depth + 1);
        props.push({ key: key.value, start: key.start, keyEnd: key.end, value: v, end: v.end });
        ws(); if (text[i] !== ',') break;
        i++; ws();
      }
      i++; return { start, end: i, props };
    }
    if (text[i] === '[') {
      i++; ws();
      while (text[i] !== ']') {
        value(depth + 1); ws(); if (text[i] !== ',') break;
        i++; ws();
      }
      i++; return { start, end: i };
    }
    while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;
    return { start, end: i };
  }
  const root = value(0);
  return { data, root };
}

// Edits only the property's value or its adjacent separator. For new properties
// use the object's existing key layout; unrelated values retain their raw bytes.
function edit(text, object, key, value) {
  if (!object || !object.props) throw new Error('target is not an object');
  const ps = object.props, index = ps.findIndex(p => p.key === key), p = ps[index];
  const splice = (start, end, insert = '') => text.slice(0, start) + insert + text.slice(end);
  if (p && value !== undefined) {
    // A replaced object or array keeps the layout of its line: pretty in a multi-line
    // object (the format Claude Code itself writes), compact in a single-line one.
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    const lineStart = text.lastIndexOf('\n', p.start - 1) + 1;
    const lead = text.slice(lineStart, p.start);
    const multiline = /[\r\n]/.test(text.slice(object.start + 1, ps[0].start)) && /^[ \t]*$/.test(lead);
    const encoded = multiline && value !== null && typeof value === 'object'
      ? JSON.stringify(value, null, 2).replace(/\n/g, nl + lead) : JSON.stringify(value);
    return splice(p.value.start, p.value.end, encoded);
  }
  if (p) {
    if (ps.length === 1) {
      // Insertion into an empty object precedes its original whitespace.
      // Preserve that suffix when undoing it instead of normalizing `{  }`.
      return p.start === object.start + 1 ? splice(p.start, p.end) : splice(object.start + 1, object.end - 1);
    }
    if (index < ps.length - 1) return splice(p.start, ps[index + 1].start);
    return splice(ps[index - 1].end, p.end);
  }
  if (value === undefined) return text;
  const first = ps[0], prefix = text.slice(object.start + 1, first ? first.start : object.end - 1);
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const multiline = /[\r\n]/.test(prefix);
  const indent = multiline ? prefix.slice(prefix.lastIndexOf('\n') + 1) : '';
  const colon = first ? text.slice(first.keyEnd, first.value.start) : ': ';
  const encoded = multiline ? JSON.stringify(value, null, 2).replace(/\n/g, newline + indent) : JSON.stringify(value);
  const member = JSON.stringify(key) + colon + encoded;
  if (ps.length) return splice(ps[ps.length - 1].end, ps[ps.length - 1].end, ',' + (multiline ? newline + indent : '') + member);
  // Empty object has no foreign property bytes to alter. Keep its existing gap.
  return splice(object.start + 1, object.start + 1, member);
}

module.exports = { parse, edit };
