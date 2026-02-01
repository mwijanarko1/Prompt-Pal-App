/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const React = require('react');

const MockSvg = ({ children, width, height }) =>
  React.createElement('div', { 'data-testid': 'svg', style: { width, height } }, children);
const MockPolygon = () => React.createElement('div', { 'data-testid': 'polygon' });
const MockLine = () => React.createElement('div', { 'data-testid': 'line' });
const MockCircle = () => React.createElement('div', { 'data-testid': 'circle' });

module.exports = {
  default: MockSvg,
  Polygon: MockPolygon,
  Line: MockLine,
  Circle: MockCircle,
};
