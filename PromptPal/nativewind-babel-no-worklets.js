/**
 * NativeWind/CSS-interop Babel setup without react-native-worklets/plugin.
 * react-native-css-interop/babel.js adds worklets/plugin (for Reanimated 4);
 * we use Reanimated 3, so we replicate the needed plugins and omit worklets.
 */
module.exports = function () {
  return {
    plugins: [
      require("react-native-css-interop/dist/babel-plugin").default,
      [
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "automatic",
          importSource: "react-native-css-interop",
        },
      ],
      // Omit "react-native-worklets/plugin" - we use Reanimated 3 (worklets built-in)
    ],
  };
};
