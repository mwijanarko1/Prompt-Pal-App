/**
 * Manual mock for react-native-svg so RadarChart (and other SVG usage) can render in Jest.
 */
/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports -- Jest mock; CommonJS and require() are required */
const React = require('react');

function Svg(props) {
  return React.createElement('Svg', props, props.children);
}
function Polygon(props) {
  return React.createElement('Polygon', props);
}
function Line(props) {
  return React.createElement('Line', props);
}
function Circle(props) {
  return React.createElement('Circle', props);
}

module.exports = {
  __esModule: true,
  default: Svg,
  Svg,
  Polygon,
  Line,
  Circle,
};
