/**
 * Mock for @expo/vector-icons so components that use Ionicons etc. can render in Jest.
 */
/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports -- Jest mock; CommonJS and require() are required */
const React = require('react');
const Icon = (props) => React.createElement('Icon', props, null);
module.exports = { Ionicons: Icon };
