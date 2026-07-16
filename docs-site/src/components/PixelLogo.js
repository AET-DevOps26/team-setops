// Uppercase glyphs sit on the full 7-row grid (cap height).
const UPPER = {
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
};

// Lowercase glyphs use the same full 7-row cap height as uppercase, so the
// word reads as one uniform block — case comes from which letterform is
// used (spelling "DevPulse"), not from a height difference.
const LOWER = {
  e: ['01110', '10001', '10001', '11111', '10000', '10001', '01110'],
  v: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  u: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  s: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  l: ['00100', '00100', '00100', '00100', '00100', '00100', '01110'],
};

const WORD = 'DevPulse';
const GLYPH_W = 5;
const GLYPH_H = 7;
const LETTER_GAP = 1;
const PIXEL_GAP = 0.12;
const SHADOW_OFFSET = 1;

function glyphFor(char) {
  return char === char.toUpperCase() ? UPPER[char] : LOWER[char];
}

// Bold weight is a 1px dilation (down + right) of the base glyphs, so the
// letterforms stay derived from a single source of truth instead of a
// second hand-drawn bitmap that could drift out of sync.
function bolden(rows) {
  const bit = (r, c) => (rows[r]?.[c] === '1' ? 1 : 0);
  const bold = [];
  for (let r = 0; r < GLYPH_H + 1; r++) {
    let row = '';
    for (let c = 0; c < GLYPH_W + 1; c++) {
      row += bit(r, c) || bit(r - 1, c) || bit(r, c - 1) ? '1' : '0';
    }
    bold.push(row);
  }
  return bold;
}

const BOLD_GLYPHS = Object.fromEntries(
  [...WORD].map((char) => [char, bolden(glyphFor(char))]),
);

const BOLD_W = GLYPH_W + 1;
const BOLD_H = GLYPH_H + 1;
const width = WORD.length * (BOLD_W + LETTER_GAP) - LETTER_GAP + SHADOW_OFFSET;
const height = BOLD_H + SHADOW_OFFSET;

function pixels(char, li) {
  return BOLD_GLYPHS[char].flatMap((row, ri) =>
    [...row].map((bit, ci) =>
      bit === '1' ? (
        <rect
          key={`${li}-${ri}-${ci}`}
          x={li * (BOLD_W + LETTER_GAP) + ci + PIXEL_GAP / 2}
          y={ri + PIXEL_GAP / 2}
          width={1 - PIXEL_GAP}
          height={1 - PIXEL_GAP}
          fill="currentColor"
        />
      ) : null,
    ),
  );
}

export default function PixelLogo({className}) {
  const letters = [...WORD];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="DevPulse">
      <g
        className="pixel-logo-shadow"
        transform={`translate(${SHADOW_OFFSET}, ${SHADOW_OFFSET})`}>
        {letters.map((char, li) => pixels(char, li))}
      </g>
      <g className="pixel-logo-fill">
        {letters.map((char, li) => pixels(char, li))}
      </g>
    </svg>
  );
}
