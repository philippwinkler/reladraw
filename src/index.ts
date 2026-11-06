export * from './ast.js';
export * from './checks.js';
export * from './constants.js';
export { fontSizeFor, GAPS, TEXT_SIZES, UNIT } from './values.js';
export * from './errors.js';
export * from './grammar.js';
export * from './measure.js';
export * from './model.js';
export { parse } from './parser.js';
export { format } from './format.js';
export {
  DEFAULT_FORMAT,
  readFormatSettings,
  SETTINGS,
  SETTINGS_FILE,
  settingsFileText,
  type FormatSettings,
} from './format-settings.js';
export { resolve, type ResolveOptions } from './resolve.js';
export { render, type RenderOptions } from './render.js';
export { DARK_THEME, DEFAULT_THEME, THEMES, THEME_NAMES, type Theme } from './themes.js';

export { pictureOf, type Picture } from './picture.js';
export { type DrawOptions } from './pipeline.js';

import { assert } from './assert.js';
import type { Finding } from './checks.js';
import { drawSource, type DrawOptions } from './pipeline.js';
import { render, type RenderOptions } from './render.js';
import type { ResolveOptions } from './resolve.js';

/**
 * Source text in, SVG out. The whole pipeline in one call. An error in a
 * statement written over several lines names the line at fault, not the one
 * the statement starts on; see `blame`.
 */
export function compile(source: string, options: ResolveOptions & RenderOptions = {}): string {
  const made = draw(source, { ...options, checks: false });
  assert(made.findings.length === 0, 'with the checks off, nothing is found');
  return made.svg;
}

/**
 * Source text in; the SVG and the findings about it out. A finding never stops
 * the drawing: it says where the picture, drawn as written, may not read as
 * meant.
 */
export function draw(source: string, options: DrawOptions = {}): { svg: string; findings: Finding[] } {
  const made = drawSource(source, options, (picture) => render(picture, options));
  return { svg: made.drawn, findings: made.findings };
}
