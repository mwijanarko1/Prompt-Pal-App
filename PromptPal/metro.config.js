// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for import.meta and web compatibility (zustand ESM issue)
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'mjs', 'cjs'],
  unstable_enablePackageExports: true,
  // Prioritize CommonJS over ESM to avoid import.meta issues
  unstable_conditionNames: ['browser', 'require', 'react-native'],
};

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  unstable_allowRequireContext: true,
};

module.exports = withNativeWind(config, { input: "./src/app/global.css" });
