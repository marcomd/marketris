let config = {};

// Load the configuration file for the game from the json file
export async function loadConfig() {
  const response = await fetch('./config.json');
  config = await response.json();
}

export function getConfig() {
  return config;
}