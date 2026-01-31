/**
 * Wrapper around babel-preset-expo that forces worklets: false and reanimated: false
 * so the preset never tries to load 'react-native-worklets/plugin' (not used with Reanimated 3).
 */
const expoPreset = require('babel-preset-expo');

module.exports = function (api, options = {}) {
  return expoPreset(api, {
    ...options,
    worklets: false,
    reanimated: false,
  });
};
