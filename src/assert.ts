/**
 * The code's own promises, checked as it runs.
 *
 * A `SourceError` says the file is wrong; a failed assertion says this program
 * is. Assertions state what one part of the pipeline promises another — a
 * lookup that cannot miss, a solved size that is never negative, a line with
 * at least two points — and never what a writer might get wrong, which the
 * parser and resolver refuse in the language's own words.
 *
 * Always on: they cost a comparison each, and a promise broken in a drawing
 * nobody is debugging is the one most worth hearing about. They read and
 * never change, so taking one out changes nothing a working program does.
 */

/** A promise in the code that did not hold: a bug in reladraw, never in the file being drawn. */
export class BrokenPromise extends Error {
  constructor(message: string) {
    super(`internal error: ${message} — please report this as a bug`);
    this.name = 'BrokenPromise';
  }
}

/** Stops with `promise` named when `condition` is false. */
export function assert(condition: unknown, promise: string): asserts condition {
  if (!condition) throw new BrokenPromise(promise);
}

/**
 * A value the code knows is there — a lookup that cannot miss, an index that
 * is in range — returned once checked, with `promise` saying why it must be.
 */
export function assertFound<T>(value: T | undefined, promise: string): T {
  assert(value !== undefined, promise);
  return value;
}
