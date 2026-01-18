module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      // If you need custom plugin for worklets, use:
      // 'react-native-worklets/plugin'
      // DO NOT also include react-native-reanimated/plugin
    ]
  };
};

