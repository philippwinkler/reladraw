/**
 * The file's value vocabulary: its unit, the gap words and distances, the text
 * sizes, and opacity, each read from the words as written. Gathered here from
 * constants.ts and place.ts so the spec's values have one home, ahead of
 * reading every value once at the boundary; the readers are unchanged.
 */
import { assert } from './assert.js';
import type { Attrs } from './ast.js';
import { SourceError } from './errors.js';

/**
 * The file's unit, in pixels: about a quarter of an ordinary one-line box, so
 * the gap words land near whole numbers. Findings measure in it. Provisional
 * until the gap words are measured against it.
 */
export const UNIT = 12;
/**
 * The named gaps a placement may ask for, each an exact distance in whole
 * units. Chosen 2026-10-14 against today's spacing: 2, 4 and 8 units keep the
 * old look, where 1, 2 and 3 left a line barely longer than its arrowhead.
 */
export const GAPS: Record<string, number> = {
  // A zero gap turns an offset into edge-to-edge contact, so "my top edge
  // against Docker's bottom edge" needs no vocabulary of its own.
  none: 0,
  tight: 2 * UNIT,
  normal: 4 * UNIT,
  wide: 8 * UNIT,
};
assert(
  GAPS['none'] === 0 && Object.values(GAPS).every((gap) => Number.isInteger(gap / UNIT) && gap >= 0),
  'the named gaps are whole units, from none at zero',
);

/**
 * A gap as written: a gap word, a number in the file's unit, or a number of
 * pixels with `px`. A distance is never negative; the words for an overlap are
 * `inside` and `on`.
 */
export function gapPixels(written: string, subject: string, line: number): number {
  const word = GAPS[written];
  if (word !== undefined) return word;
  if (/^\d*\.?\d+$/.test(written)) return Number(written) * UNIT;
  const pixels = /^(\d*\.?\d+)px$/.exec(written);
  if (pixels) return Number(pixels[1]);
  if (written.startsWith('-')) {
    throw new SourceError(
      `${subject}: a distance is never negative, so ${written} is not one — to overlap, place it inside or on the other`,
      line,
    );
  }
  throw new SourceError(
    `${subject}: "${written}" is not a distance — write one of ${Object.keys(GAPS).join(', ')}, ` +
      'a number in the file\'s unit, or a number of pixels such as 12px',
    line,
  );
}

/**
 * A region's `opacity:`, an amount from none to full: `0` to `1.0`. The one
 * look whose bare number is not a multiple of its normal (design.org 8.3).
 */
export function checkOpacity(value: string, subject: string, line: number): void {
  if (/^\d*\.?\d+$/.test(value) && Number(value) <= 1) return;
  throw new SourceError(
    `${subject}: "opacity: ${value}" — opacity is an amount from 0 (none) to 1.0 (solid), such as opacity: 0.5`,
    line,
  );
}

/**
 * The named text sizes, each a multiple of the document's own size. A plain
 * number is a multiple too, and `16px` a size in pixels: nothing else in the
 * diagram moving can make either wrong. The names stay preferred because they
 * say why one text is bigger than another.
 *
 * `small` is sampled rather than chosen. In
 * `examples/reference/arch.png` the box and container texts run 25
 * pixels baseline to baseline and every annotation runs 21, which is this
 * ratio; `./dev.sh textrows` is how that was read off. `large` is the same step
 * taken the other way, so the scale is symmetric about the document size.
 */
export const TEXT_SIZES: Record<string, number> = {
  small: 21 / 25,
  normal: 1,
  large: 25 / 21,
};
assert(
  TEXT_SIZES['normal'] === 1 && Object.values(TEXT_SIZES).every((scale) => scale > 0),
  'every text size is a positive multiple of normal, and normal is the document size',
);

/**
 * What each kind of text is set at when the file says nothing. A node with no
 * body annotates the diagram rather than being part of it, and at the size of a
 * box text an aside reads as a statement — so `shape: none` starts small and
 * says so by having no body. This is a default and not a ceiling: `(size: …)`
 * in the text's brackets overrides it, the same way `fill:` overrides the
 * theme's color.
 */
const DEFAULT_TEXT_SIZE: Record<string, string> = { none: 'small' };

/**
 * The size a piece of text is set at. Shared by the resolver, which reserves
 * the room, and the renderer, which fills it, so the two cannot disagree about
 * how much room there is.
 */
export function fontSizeFor(
  kind: string,
  textAttrs: Attrs,
  fontSize: number,
  line: number,
): number {
  const named = textAttrs['size'] ?? DEFAULT_TEXT_SIZE[kind] ?? 'normal';
  const scale = TEXT_SIZES[named];
  if (scale !== undefined) return Math.round(fontSize * scale);
  // A bare number is a multiple of normal; `px` fixes it in pixels (design.org 3.8).
  const number = /^(\d*\.?\d+)(px)?$/.exec(named);
  if (number && Number(number[1]) > 0) {
    return number[2] ? Number(number[1]) : Math.round(fontSize * Number(number[1]));
  }
  const hint = named.startsWith('-') || /^0*\.?0+(px)?$/.test(named) ? '; a text size has to be more than zero' : '';
  throw new SourceError(
    `size takes ${Object.keys(TEXT_SIZES).join(', ')}, a multiple of normal such as 1.2, or pixels such as 16px, not "${named}"${hint}`,
    line,
  );
}
