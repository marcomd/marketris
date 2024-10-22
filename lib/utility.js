

import { getConfig } from '../config.js';

export const printDebug = function (message) {
  const { debug } = getConfig();

  if (debug) {
    console.log(message);
  }
}

// Function to add a log message
export const addLogMessage = function (message) {
  const logContainer = document.getElementById('game-log');
  const logMessage = document.createElement('div');
  logMessage.className = 'log-message';
  logMessage.textContent = message;
  logContainer.appendChild(logMessage);

  // Fade out the message after 5 seconds
  setTimeout(() => {
    logMessage.style.opacity = '0';
    setTimeout(() => {
      logContainer.removeChild(logMessage);
    }, 1000); // Wait for the fade-out transition to complete
  }, 15000);
}