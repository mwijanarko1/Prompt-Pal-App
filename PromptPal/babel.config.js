module.exports = function(api) {
  // Must read caller before api.cache() to avoid "Caching has already been configured"
  const platform = api.caller((c) => c?.platform) ?? 'native';
  api.cache(true);
  const plugins = [
    // Reanimated plugin must be last when present. Only run on native to avoid web
    // bundle transform errors (500); Reanimated on web uses JS fallback.
    ...(platform !== 'web' ? ['react-native-reanimated/plugin'] : [])
  ];
  return {
    presets: [
      ['./babel-preset-expo-no-worklets.js', { jsxImportSource: 'nativewind' }],
      './nativewind-babel-no-worklets.js'
    ],
    plugins
  };
};
