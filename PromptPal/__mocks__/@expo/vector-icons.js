/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const React = require('react');

const MockIcon = ({ name, size, color, children }) =>
  React.createElement('View', { 'data-testid': `icon-${name}`, 'data-size': size, 'data-color': color }, children);

module.exports = {
  Ionicons: MockIcon,
};
