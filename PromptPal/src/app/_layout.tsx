import './global.css';
import { BootModeScreen } from '../lib/BootModeScreen';

const SAFE_MODE = process.env.EXPO_PUBLIC_SAFE_MODE === '1';

function SafeModeScreen() {
  return (
    <BootModeScreen
      mode="Safe Mode"
      title="Startup Isolation Active"
      body="PromptPal is running with startup protections enabled while we isolate a crash trigger."
      details={[
        'Core runtime loaded successfully.',
        'Subsystems will be re-enabled incrementally.',
        'No user data is modified in this mode.',
      ]}
    />
  );
}

export default function RootLayout() {
  if (SAFE_MODE) {
    return <SafeModeScreen />;
  }

  // Lazy-load the normal root to keep the emergency safe screen isolated.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NormalRoot = require('../lib/NormalRoot').default;
  return <NormalRoot />;
}
