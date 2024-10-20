

import { getConfig } from '../config.js';

export const printDebug = function (message) {
  const { debug } = getConfig();

  if (debug) {
    console.log(message);
  }
}