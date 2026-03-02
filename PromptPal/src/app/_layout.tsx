import './global.css';
import { BootModeScreen } from '../lib/BootModeScreen';

const SAFE_MODE = process.env.EXPO_PUBLIC_SAFE_MODE === '1';
const BOOT_MODE = (process.env.EXPO_PUBLIC_BOOT_MODE || 'full').toLowerCase();

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
  if (SAFE_MODE || BOOT_MODE === 'safe') {
    return <SafeModeScreen />;
  }

  if (BOOT_MODE === 'gesture') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const GestureRoot = require('../lib/GestureRoot').default;
    return <GestureRoot />;
  }

  if (BOOT_MODE === 'router') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RouterRoot = require('../lib/RouterRoot').default;
    return <RouterRoot />;
  }

  if (BOOT_MODE === 'clerk') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ClerkRoot = require('../lib/ClerkRoot').default;
    return <ClerkRoot />;
  }

  if (BOOT_MODE === 'convex') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ConvexRoot = require('../lib/ConvexRoot').default;
    return <ConvexRoot />;
  }

  if (BOOT_MODE === 'full-lite') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const NormalRootLite = require('../lib/NormalRootLite').default;
    return <NormalRootLite />;
  }

  // Lazy-load the normal root to avoid importing native modules in SAFE_MODE.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NormalRoot = require('../lib/NormalRoot').default;
  return <NormalRoot />;
}
