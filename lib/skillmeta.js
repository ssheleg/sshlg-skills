'use strict';
// Only the two scalar fields used for retrieval; not a general YAML evaluator.
function metadata(text) {
  const fm = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!fm) return {};
  const lines = fm[1].split(/\r?\n/);
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const m = /^(name|description):[ \t]*(.*)$/.exec(lines[i]);
    if (!m) continue;
    let value = m[2].trim();
    const block = /^[>|][+-]?(?:[ \t]+#.*)?$/.test(value);
    const parts = block ? [] : [value];
    while (i + 1 < lines.length && /^(?:[ \t]+|$)/.test(lines[i + 1]))
      parts.push(lines[++i].trim());
    value = parts.join(' ').trim();
    if (!block) {
      if (value.startsWith('"') && value.endsWith('"')) {
        try { value = JSON.parse(value); } catch (_) { value = value.slice(1, -1); }
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1).replace(/''/g, "'");
      } else value = value.replace(/[ \t]+#.*$/, '');
    }
    out[m[1]] = value.replace(/\s+/g, ' ').trim();
  }
  return out;
}

module.exports = {metadata};
