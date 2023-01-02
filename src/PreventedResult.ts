import { Complex } from './Utils';

export default class PreventedResult {
  preventedReasons: Complex[];

  constructor(preventedReasons: Complex[]) {
    this.preventedReasons = preventedReasons;
  }
}
