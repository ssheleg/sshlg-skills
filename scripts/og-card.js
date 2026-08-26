#!/usr/bin/env node
'use strict';
/**
 * The social card, generated. 1200x630 PNG, no dependencies, no rasterizer.
 *
 * Why this exists at all: every page declared `twitter:card` and shipped no image,
 * so a link to any of them rendered as an empty box on X — an unbacked claim in
 * the one place the follow button is meant to work. A hand-made card would have
 * been one PNG for eleven pages, or eleven files nobody regenerates when a name
 * changes. This renders one per page from the same manifest the page is rendered
 * from.
 *
 * Two pieces, both from Node built-ins:
 *
 *   - a PNG encoder. `zlib.deflateSync` does the compression; the rest is three
 *     chunks and a CRC. Truecolour, 8 bits, filter 0 — the simplest thing a
 *     decoder is required to accept.
 *   - a 5x7 bitmap font, blitted at an integer scale. There is no font file to
 *     ship, no text shaping and no hinting, and scaled pixels read as deliberate
 *     next to the terminal blocks on the site rather than as a compromise.
 *
 * A missing glyph THROWS. The alternative is a card that silently renders a hole
 * where a character was, which is exactly the class of defect this repository
 * refuses everywhere else: a claim that fails without saying so.
 */

const zlib = require('zlib');

// ------------------------------------------------------------------- PNG bytes

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  const head = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(head), 0);
  return Buffer.concat([len, head, crc]);
}

/** An RGB canvas with the two primitives this card needs. */
function canvas(width, height, bg) {
  const px = Buffer.alloc(width * height * 3);
  const fill = (x0, y0, w, h, [r, g, b]) => {
    const xs = Math.max(0, Math.round(x0));
    const ys = Math.max(0, Math.round(y0));
    const xe = Math.min(width, Math.round(x0 + w));
    const ye = Math.min(height, Math.round(y0 + h));
    for (let y = ys; y < ye; y += 1) {
      let o = (y * width + xs) * 3;
      for (let x = xs; x < xe; x += 1) { px[o] = r; px[o + 1] = g; px[o + 2] = b; o += 3; }
    }
  };
  fill(0, 0, width, height, bg);
  return {
    width,
    height,
    fill,
    /** A 1px-precise line, horizontal or vertical only — all this card draws. */
    line(x0, y0, x1, y1, colour, w = 1) {
      if (y0 === y1) fill(Math.min(x0, x1), y0, Math.abs(x1 - x0) + 1, w, colour);
      else if (x0 === x1) fill(x0, Math.min(y0, y1), w, Math.abs(y1 - y0) + 1, colour);
      else throw new Error('og-card draws axis-aligned lines only');
    },
    png() {
      const raw = Buffer.alloc((width * 3 + 1) * height);
      for (let y = 0; y < height; y += 1) {
        raw[y * (width * 3 + 1)] = 0;                              // filter: none
        px.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
      }
      const ihdr = Buffer.alloc(13);
      ihdr.writeUInt32BE(width, 0);
      ihdr.writeUInt32BE(height, 4);
      ihdr[8] = 8;        // bit depth
      ihdr[9] = 2;        // colour type: truecolour
      ihdr[10] = 0;       // deflate
      ihdr[11] = 0;       // adaptive filtering
      ihdr[12] = 0;       // no interlace
      return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
      ]);
    },
  };
}

// ------------------------------------------------------------------ the 5x7 font

const G = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####',
  F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.###.',
  H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '#####|..#..|..#..|..#..|..#..|..#..|#####',
  J: '...##|....#|....#|....#|#...#|#...#|.###.',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.###.|#...#|#....|.###.|....#|#...#|.###.',
  T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
  X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
  3: '####.|....#|....#|.###.|....#|....#|####.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  5: '#####|#....|#....|####.|....#|#...#|.###.',
  6: '..##.|.#...|#....|####.|#...#|#...#|.###.',
  7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
  ' ': '.....|.....|.....|.....|.....|.....|.....',
  '-': '.....|.....|.....|#####|.....|.....|.....',
  '.': '.....|.....|.....|.....|.....|.##..|.##..',
  ',': '.....|.....|.....|.....|.##..|.##..|.#...',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
  ':': '.....|.##..|.##..|.....|.##..|.##..|.....',
  '·': '.....|.....|.##..|.##..|.....|.....|.....',
  '@': '.###.|#...#|#.###|#.#.#|#.###|#....|.###.',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
  '(': '..##.|.#...|.#...|.#...|.#...|.#...|..##.',
  ')': '.##..|...#.|...#.|...#.|...#.|...#.|.##..',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
  "'": '..#..|..#..|.....|.....|.....|.....|.....',
  '"': '.#.#.|.#.#.|.....|.....|.....|.....|.....',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '%': '#...#|#..#.|...#.|..#..|.#...|#..#.|#...#',
  '=': '.....|.....|#####|.....|#####|.....|.....',
  '#': '.#.#.|#####|.#.#.|.#.#.|#####|.#.#.|.....',
  _: '.....|.....|.....|.....|.....|.....|#####',
};

/**
 * Typographic punctuation the prose uses and a 5x7 font has no room for. Mapped,
 * not dropped: a card that silently loses an em dash reads as a typo, and one that
 * throws on it cannot be built. Anything still unmapped reaches `drawText` and
 * throws there, which is the behaviour that keeps holes off the card.
 */
const FOLD = new Map(Object.entries({
  '—': '-', '–': '-', '‑': '-', '−': '-', '\u00a0': ' ',
  '’': "'", '‘': "'", '“': '"', '”': '"', '…': '...', '«': '"', '»': '"',
}));

const normalize = (s) => String(s).replace(/[^\x20-\x7e]/gu,
  (ch) => (FOLD.has(ch) ? FOLD.get(ch) : ch));

const GLYPH_W = 5;
const GLYPH_H = 7;

const ROWS = Object.fromEntries(Object.entries(G).map(([k, v]) => {
  const rows = v.split('|');
  if (rows.length !== GLYPH_H || rows.some((r) => r.length !== GLYPH_W)) {
    throw new Error(`og-card font: glyph ${k} is not ${GLYPH_W}x${GLYPH_H}`);
  }
  return [k, rows];
}));

/** Advance per character at a given scale: the glyph plus one scaled column. */
const advance = (scale) => (GLYPH_W + 1) * scale;
const textWidth = (s, scale) => {
  const n = normalize(s).length;
  return n ? n * advance(scale) - scale : 0;
};

function drawText(c, text, x, y, scale, colour, tracking = 0) {
  let cx = x;
  for (const ch of normalize(text)) {
    const rows = ROWS[ch];
    if (!rows) {
      throw new Error(`og-card font has no glyph for ${JSON.stringify(ch)} — `
        + 'a card must not render a hole where a character was');
    }
    for (let gy = 0; gy < GLYPH_H; gy += 1) {
      for (let gx = 0; gx < GLYPH_W; gx += 1) {
        if (rows[gy][gx] === '#') c.fill(cx + gx * scale, y + gy * scale, scale, scale, colour);
      }
    }
    cx += advance(scale) + tracking;
  }
  return cx;
}

/** The largest integer scale at which `text` fits `max` pixels, floored at `min`. */
function fitScale(text, max, hi, min = 2) {
  for (let s = hi; s > min; s -= 1) if (textWidth(text, s) <= max) return s;
  return min;
}

// -------------------------------------------------------------------- the card

const PALETTE = {
  // The workbench dark twin, the same token layer the pages consume
  // (styles/tokens/workbench.css). A card that disagrees with the page it
  // represents is a second palette, which the pack bans.
  bg: [0x0f, 0x12, 0x18],        // --bg
  ink: [0xe8, 0xec, 0xf3],       // --ink
  muted: [0x8a, 0x93, 0xa6],     // --muted
  dim: [0x5f, 0x68, 0x79],       // --muted, stepped down for the footer line
  line: [0x23, 0x2a, 0x36],      // --border
  accent: [0x4b, 0x8b, 0xff],    // --accent
  // No --warn here on purpose. The pack reserves amber for "needs a human" and
  // bans a semantic colour used decoratively; the eyebrow on a card is
  // decoration, so it takes the accent and amber has no way in.
};

const W = 1200;
const H = 630;
const PAD = 84;

/**
 * The mark: two concentric hexagons, the same shape the site's inline SVG draws.
 *
 * Scanline-filled rather than stroked, because a stroke needs a rasterizer and a
 * convex polygon needs six vertices and a loop. Drawn as fill-then-punch: the
 * outer hexagon in ink, a smaller one in the background colour, and again — which
 * is how an outline is made when there is no stroke.
 */
function hexPath(cx, cy, r) {
  const w = r * 0.866;               // cos(30°): flat left and right, points top and bottom
  return [
    [cx, cy - r], [cx + w, cy - r / 2], [cx + w, cy + r / 2],
    [cx, cy + r], [cx - w, cy + r / 2], [cx - w, cy - r / 2],
  ];
}

function fillPoly(c, pts, colour) {
  const ys = pts.map((p) => p[1]);
  const y0 = Math.round(Math.min(...ys));
  const y1 = Math.round(Math.max(...ys));
  for (let y = y0; y <= y1; y += 1) {
    const xs = [];
    for (let i = 0; i < pts.length; i += 1) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
    }
    if (xs.length >= 2) {
      const a = Math.round(Math.min(...xs));
      const b = Math.round(Math.max(...xs));
      c.fill(a, y, b - a + 1, 1, colour);
    }
  }
}

function mark(c, x, y, size, colour, bg) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  const t = Math.max(2, Math.round(size / 13));
  fillPoly(c, hexPath(cx, cy, r), colour);
  fillPoly(c, hexPath(cx, cy, r - t), bg);
  fillPoly(c, hexPath(cx, cy, r * 0.54), colour);
  fillPoly(c, hexPath(cx, cy, r * 0.54 - t), bg);
}

/**
 * @param {object} o
 * @param {string} o.eyebrow  small, above the rule — the role or the section
 * @param {string} o.title    the name, as large as it fits
 * @param {string[]} o.lines  one or two supporting lines
 * @param {string} o.footer   the URL a reader will type
 */
function card(o) {
  const c = canvas(W, H, PALETTE.bg);
  const up = (s) => String(s).toUpperCase();

  // a hairline frame, so the card reads as a card on a white timeline
  c.line(0, 0, W - 1, 0, PALETTE.line, 3);
  c.line(0, H - 3, W - 1, H - 3, PALETTE.line, 3);
  c.fill(0, 0, 3, H, PALETTE.line);
  c.fill(W - 3, 0, 3, H, PALETTE.line);
  // the accent, top-left, the one saturated thing on the card
  c.fill(0, 0, 190, 6, PALETTE.accent);

  mark(c, PAD, PAD - 10, 62, PALETTE.ink, PALETTE.bg);
  drawText(c, up('ssheleg skills'), PAD + 90, PAD + 8, 4, PALETTE.muted, 3);

  let y = 232;
  if (o.eyebrow) {
    const s = fitScale(up(o.eyebrow), W - PAD * 2, 4);
    drawText(c, up(o.eyebrow), PAD, y - 44, s, PALETTE.accent, 2);
  }
  const ts = fitScale(up(o.title), W - PAD * 2, 18, 6);
  drawText(c, up(o.title), PAD, y, ts, PALETTE.ink);
  y += GLYPH_H * ts + 46;

  c.fill(PAD, y - 22, 96, 4, PALETTE.accent);

  for (const line of (o.lines || []).slice(0, 2)) {
    const s = fitScale(up(line), W - PAD * 2, 5);
    drawText(c, up(line), PAD, y, s, PALETTE.muted, 1);
    y += GLYPH_H * s + 20;
  }

  if (o.footer) {
    const s = fitScale(up(o.footer), W - PAD * 2, 4);
    drawText(c, up(o.footer), PAD, H - PAD - GLYPH_H * s, s, PALETTE.dim, 1);
  }
  return c.png();
}

module.exports = {
  card, canvas, crc32, drawText, textWidth, fitScale, ROWS, PALETTE, hexPath, fillPoly,
  normalize,
  GLYPH_W, GLYPH_H, WIDTH: W, HEIGHT: H,
};
