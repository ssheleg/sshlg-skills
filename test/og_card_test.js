#!/usr/bin/env node
'use strict';
// Fixtures for scripts/og-card.js — the social card, encoded by hand.
//
// A card is a claim about a page, made in the one place a reader sees before
// deciding whether to click. Four ways this could be worse than shipping none:
//
//   - the PNG is malformed. A decoder that rejects it shows nothing, and every
//     platform fails differently, so the bytes are checked here rather than
//     discovered on a timeline.
//   - a glyph is missing and the card renders a HOLE where a character was. The
//     encoder throws instead, and this is the fixture that keeps it throwing.
//   - a card claims a size it is not. `og:image:width` is read by crawlers that
//     never fetch the file.
//   - the build is not deterministic, so every run republishes eleven binaries
//     and no diff means anything.
//
// The last fixture is the one that pays for itself: every string the site
// actually puts on a card is rendered here, driven from `skills.json` and the
// router registry. A member arriving with a character the font lacks fails the
// suite instead of shipping a card with a gap in the name.

const assert = require('assert');
const zlib = require('zlib');

const og = require('../scripts/og-card.js');
const data = require('../skills.json');

let checks = 0;
const failures = [];
function it(name, fn) {
  checks += 1;
  try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const SAMPLE = {
  eyebrow: 'what the interface must do',
  title: 'super-ux',
  lines: ['7 Agent Skills · one installable pack', 'npx skills add ssheleg/super-ux'],
  footer: 'ssheleg.github.io/sshlg-skills/skills/super-ux',
};

/** Walk the chunk list, verifying each CRC the way a decoder would. */
function chunks(buf) {
  assert.deepStrictEqual([...buf.slice(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'PNG signature');
  const out = [];
  let i = 8;
  while (i < buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.slice(i + 4, i + 8).toString('ascii');
    const body = buf.slice(i + 8, i + 8 + len);
    const crc = buf.readUInt32BE(i + 8 + len);
    assert.strictEqual(og.crc32(buf.slice(i + 4, i + 8 + len)), crc,
      `${type}: CRC does not verify — a decoder is required to reject this`);
    out.push({ type, body });
    i += 12 + len;
  }
  return out;
}

// -------------------------------------------------------------------- the bytes

it('the encoder emits a PNG a decoder is required to accept', () => {
  const cs = chunks(og.card(SAMPLE));
  assert.deepStrictEqual(cs.map((c) => c.type), ['IHDR', 'IDAT', 'IEND'],
    'exactly the three chunks, in order');
  const ihdr = cs[0].body;
  assert.strictEqual(ihdr.readUInt32BE(0), og.WIDTH);
  assert.strictEqual(ihdr.readUInt32BE(4), og.HEIGHT);
  assert.strictEqual(ihdr[8], 8, 'bit depth');
  assert.strictEqual(ihdr[9], 2, 'colour type: truecolour');
  assert.strictEqual(ihdr[10], 0, 'compression: deflate');
  assert.strictEqual(ihdr[12], 0, 'no interlace — the simplest thing to decode');
  assert.strictEqual(cs[2].body.length, 0, 'IEND carries no data');
});

it('the size the meta tag claims is the size of the image', () => {
  assert.strictEqual(og.WIDTH, 1200, 'the card size every platform crops from');
  assert.strictEqual(og.HEIGHT, 630);
  assert.strictEqual(og.WIDTH / og.HEIGHT > 1.9, true, 'the 1.91:1 the large card wants');
});

it('every scanline declares the no-op filter, and the corner is the background', () => {
  const cs = chunks(og.card(SAMPLE));
  const raw = zlib.inflateSync(cs[1].body);
  const stride = og.WIDTH * 3 + 1;
  assert.strictEqual(raw.length, stride * og.HEIGHT, 'raw size is width*3+1 per row');
  for (const y of [0, 1, 314, og.HEIGHT - 1]) {
    assert.strictEqual(raw[y * stride], 0, `row ${y}: filter byte is not 0`);
  }
  // 40px in from the left on a row below the frame: the flat background.
  const o = 315 * stride + 1 + 40 * 3;
  assert.deepStrictEqual([raw[o], raw[o + 1], raw[o + 2]], og.PALETTE.bg,
    'the background is not the palette background');
});

it('twice from the same input is byte-identical', () => {
  assert.ok(og.card(SAMPLE).equals(og.card(SAMPLE)),
    'a non-deterministic encoder republishes eleven binaries on every run');
});

it('a different input is a different card', () => {
  assert.ok(!og.card(SAMPLE).equals(og.card({ ...SAMPLE, title: 'agent-sync' })));
});

// -------------------------------------------------------------------- the font

it('the font table is square, and a malformed glyph is refused at load', () => {
  for (const [ch, rows] of Object.entries(og.ROWS)) {
    assert.strictEqual(rows.length, og.GLYPH_H, `${ch}: wrong height`);
    for (const r of rows) assert.strictEqual(r.length, og.GLYPH_W, `${ch}: wrong width`);
    assert.ok(/^[.#]+$/.test(rows.join('')), `${ch}: a glyph pixel is neither . nor #`);
  }
  assert.ok(og.ROWS.A.join('').includes('#'), 'A is blank');
  assert.strictEqual(og.ROWS[' '].join('').includes('#'), false, 'space is not blank');
});

it('a character with no glyph throws rather than leaving a hole', () => {
  const c = og.canvas(40, 20, og.PALETTE.bg);
  assert.throws(() => og.drawText(c, 'ok☃', 0, 0, 1, og.PALETTE.ink),
    /no glyph for/, 'a snowman must stop the build, not appear as a gap');
});

it('typographic punctuation is folded, not dropped', () => {
  assert.strictEqual(og.normalize('a — b'), 'a - b');
  assert.strictEqual(og.normalize('“q” ’s …'), '"q" \'s ...');
  assert.strictEqual(og.normalize('a b'), 'a b');
  assert.strictEqual(og.normalize('7 skills · v1'), '7 skills · v1',
    'the middle dot has a glyph and must survive as itself');
});

it('fitScale never returns a scale that overflows the width it was given', () => {
  for (const text of ['x', 'seo-aeo-audit', 'ssheleg skills',
    'agent orchestrators, their evals, the protocols they speak']) {
    for (const max of [120, 400, 1032]) {
      const s = og.fitScale(text.toUpperCase(), max, 18);
      assert.ok(s >= 2, `${text}: scale ${s} is below the floor`);
      if (s > 2) {
        assert.ok(og.textWidth(text.toUpperCase(), s) <= max,
          `${text} at scale ${s} is ${og.textWidth(text.toUpperCase(), s)}px in ${max}px`);
      }
    }
  }
});

it('fitScale with tracking measures the width drawText will actually paint', () => {
  // B-105: `drawText` advances `advance(scale) + tracking` per character and
  // `fitScale` counted none of the tracking, so a long eyebrow chose a scale
  // whose PAINTED width overran the box it was fitted to — the sheleg-dev
  // eyebrow reached x=1199 of a 1200px canvas. The painted width of n
  // characters is textWidth + (n-1)*tracking; above the floor, the scale the
  // tracked fit returns must respect it.
  const painted = (text, s, tr) => og.textWidth(text, s)
    + Math.max(0, og.normalize(text).length - 1) * tr;
  for (const [text, tr] of [
    ['INTEGRATIONS: MONEY IN, TRACKING, ERRORS, SIGN-IN, SPEED', 2],
    ['NPX SKILLS ADD SSHELEG/SHELEG-DESIGN-SKILL', 1],
    ['12 RULES · EACH NAMES THE PHRASE THAT DECLINES IT', 2],
  ]) {
    for (const max of [400, 1032]) {
      const s = og.fitScale(text, max, 5, 2, tr);
      if (s > 2) {
        assert.ok(painted(text, s, tr) <= max,
          `${text.slice(0, 24)}… at scale ${s} paints ${painted(text, s, tr)}px in ${max}px`);
      }
    }
  }
  // And tracking 0 is the legacy metric exactly, so every already-committed
  // card keeps its bytes: same signature, same answer.
  const t = 'INTEGRATIONS: MONEY IN, TRACKING, ERRORS, SIGN-IN, SPEED';
  assert.strictEqual(og.fitScale(t, 1032, 4, 2, 0), og.fitScale(t, 1032, 4));
});

it('the tracked fit keeps a long eyebrow inside the box; the legacy fit is the defect, gated', () => {
  // The B-105 card, both ways. The eyebrow band sits at y=188..(188+7*scale);
  // its fitted box ends at PAD + (W - 2*PAD) = W - PAD. The card frame paints
  // its own 3px vertical line at the right edge, so the scan stops before it.
  const spec = {
    eyebrow: 'integrations: money in, tracking, errors, sign-in, speed',
    title: 'sheleg-dev',
    lines: ['7 Agent Skills · one installable pack'],
    footer: 'ssheleg.github.io/sshlg-skills/skills/sheleg-dev',
  };
  const inkPastBox = (buf) => {
    const raw = zlib.inflateSync(chunks(buf)[1].body);
    const stride = og.WIDTH * 3 + 1;
    let found = 0;
    for (let y = 185; y < 221; y += 1) {
      for (let x = og.WIDTH - og.PAD; x < og.WIDTH - 3; x += 1) {
        const o = y * stride + 1 + x * 3;
        const px = [raw[o], raw[o + 1], raw[o + 2]];
        if (!px.every((v, i) => v === og.PALETTE.bg[i])) found += 1;
      }
    }
    return found;
  };
  const legacy = inkPastBox(og.card(spec));
  const tracked = inkPastBox(og.card({ ...spec, fitTracking: true }));
  assert.ok(legacy > 0,
    'the legacy metric no longer overflows on the B-105 eyebrow — the gate is testing nothing');
  assert.strictEqual(tracked, 0,
    `the tracked fit still paints ${tracked} eyebrow pixels past the box it was fitted to`);
});

// ------------------------------------------------- every string the site renders

it('every card the site will actually build renders without a missing glyph', () => {
  const strings = [
    'ssheleg skills', 'routing', 'agent skills for the work around the code',
    'no services, no telemetry, no api keys', 'which pack answers what, and when',
    'ssheleg.github.io/sshlg-skills',
  ];
  for (const m of data.skills) {
    strings.push(m.name, m.role, `npx skills add ${m.repo}`,
      `${(m.skillNames || []).length} skills in the pack · v${m.version}`,
      `ssheleg.github.io/sshlg-skills/skills/${m.name}`);
  }
  const c = og.canvas(4000, 40, og.PALETTE.bg);
  for (const s of strings) {
    assert.doesNotThrow(() => og.drawText(c, String(s).toUpperCase(), 0, 0, 1, og.PALETTE.ink),
      `a card string has a character the font lacks: ${JSON.stringify(s)}`);
  }
});

it('the polygon fill closes — the mark is drawn, not merely attempted', () => {
  const c = og.canvas(64, 64, og.PALETTE.bg);
  og.fillPoly(c, og.hexPath(32, 32, 28), og.PALETTE.ink);
  const raw = zlib.inflateSync(chunks(c.png())[1].body);
  const stride = 64 * 3 + 1;
  const at = (x, y) => {
    const o = y * stride + 1 + x * 3;
    return [raw[o], raw[o + 1], raw[o + 2]];
  };
  assert.deepStrictEqual(at(32, 32), og.PALETTE.ink, 'the centre is not filled');
  assert.deepStrictEqual(at(1, 1), og.PALETTE.bg, 'the corner is inside the hexagon');
  assert.deepStrictEqual(at(32, 5), og.PALETTE.ink, 'the top vertex is missing');
});

it('a diagonal line is refused rather than drawn wrong', () => {
  const c = og.canvas(10, 10, og.PALETTE.bg);
  assert.throws(() => c.line(0, 0, 9, 9, og.PALETTE.ink), /axis-aligned/);
});

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} of ${checks} failed`);
  process.exit(1);
}
console.log(`PASS: og-card — ${checks} checks `
  + `(${Object.keys(og.ROWS).length} glyphs, ${og.WIDTH}x${og.HEIGHT})`);
