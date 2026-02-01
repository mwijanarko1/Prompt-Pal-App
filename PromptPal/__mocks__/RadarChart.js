/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const React = require('react');

function RadarChart() {
  return React.createElement('div', { 'data-testid': 'radar-chart' }, 'RadarChart');
}

module.exports = { RadarChart };
