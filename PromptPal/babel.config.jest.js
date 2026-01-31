/** Minimal Babel config for Jest. Avoids Expo/NativeWind presets that can break in Jest. */
/* eslint-env node */
/* eslint-disable no-undef -- CommonJS config file; module is defined in Node */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
