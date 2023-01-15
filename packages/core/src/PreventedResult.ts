/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable max-classes-per-file */
import { Complex } from './Utils';

export default class PreventedResult {
  preventedReasons: Complex[];

  constructor(preventedReasons: Complex[]) {
    this.preventedReasons = preventedReasons;
  }
}

export class PreventedResultError extends Error {
  constructor(public readonly preventedResult: PreventedResult) {
    super('The operation was prevented by a repository plugin.');
  }
}
