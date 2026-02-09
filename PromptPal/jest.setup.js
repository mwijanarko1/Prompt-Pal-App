// Define React Native globals
global.__DEV__ = true;

// Mock native modules bridge
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
  __fbBatchedBridgeConfig: {
    remoteModuleConfig: {},
    localModulesConfig: {},
  },
}));

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      PlatformConstants: {
        forceTouchAvailable: false,
      },
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    Alert: {
      alert: jest.fn(),
    },
  };
});
