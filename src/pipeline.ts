import { assert } from './assert.js';
import { fileChecks, findings, type Checks, type Finding } from './checks.js';
import { SourceError } from './errors.js';
import { blame, parse } from './parser.js';
import { pictureOf, type Picture } from './picture.js';
import type { RenderOptions } from './render.js';
import { resolve, type ResolveOptions } from './resolve.js';

export interface DrawOptions extends ResolveOptions, RenderOptions {
  /**
   * Which kinds of finding to look for. Absent: what the file's
   * `diagram checks: (…)` says over the defaults. A function: given that, it
   * returns the checks to run, which is how `--checks` lays itself over the
   * file. `false`: none, as `--no-checks`.
   */
  checks?: false | ((fromFile: Checks) => Checks);
}

/**
 * The pipeline, written once: source to layout to picture, drawn by `drawn`,
 * then the findings about that same picture. An error in a statement written
 * over several lines names the line at fault, not the one the statement
 * starts on; see `blame`.
 */
export function drawSource<T>(
  source: string,
  options: DrawOptions,
  drawn: (picture: Picture) => T,
): { drawn: T; picture: Picture; findings: Finding[] } {
  const run = (text: string) => {
    const picture = pictureOf(resolve(parse(text), options));
    const made = drawn(picture);
    if (options.checks === false) return { drawn: made, picture, findings: [] };
    const fromFile = fileChecks(picture.layout);
    return { drawn: made, picture, findings: findings(picture, options.checks ? options.checks(fromFile) : fromFile) };
  };
  try {
    return run(source);
  } catch (error) {
    if (!(error instanceof SourceError)) throw error;
    const blamed = blame(source, error, run);
    assert(blamed.message === error.message && blamed.line >= error.line, 'blame moves an error to a later line of its statement, and never changes what it says');
    throw blamed;
  }
}
