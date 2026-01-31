// Full RN/NativeWind test env: guard css-interop wrapJSX so maybeHijackSafeAreaProvider
// never sees null/undefined type. The Babel transform uses react-native-css-interop/jsx-runtime,
// so we mock that subpath. When type is null/undefined we substitute Empty so React doesn't crash.
jest.mock('react-native-css-interop/jsx-runtime', () => {
  const ReactJSXRuntime = require('react/jsx-runtime');
  const origWrapJSX = jest.requireActual('react-native-css-interop').wrapJSX;
  const guard = (baseJsx) => {
    const wrapped = origWrapJSX(baseJsx);
    const Empty = () => null;
    Empty.displayName = 'Empty';
    return (type, props, ...rest) => {
      if (type == null) return baseJsx.call(baseJsx, Empty, props, ...rest);
      return wrapped(type, props, ...rest);
    };
  };
  return {
    Fragment: ReactJSXRuntime.Fragment,
    jsx: guard(ReactJSXRuntime.jsx),
    jsxs: guard(ReactJSXRuntime.jsxs),
    jsxDEV: guard(ReactJSXRuntime.jsxDEV),
  };
});
