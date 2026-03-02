import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BootModeScreen } from './BootModeScreen';

export default function GestureRoot() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BootModeScreen
        mode="Gesture Mode"
        title="Gesture Layer Verified"
        body="GestureHandlerRootView is mounted and stable."
        details={[
          'Native gesture bridge is active.',
          'Router and feature modules are intentionally not mounted.',
        ]}
      />
    </GestureHandlerRootView>
  );
}
