import { BootModeScreen } from '../lib/BootModeScreen';

export default function BootScreen() {
  return (
    <BootModeScreen
      mode="Router Mode"
      title="Router Boot Ready"
      body="Expo Router mounted successfully with the isolation boot route."
      details={[
        'File-based navigation is active.',
        'Tabs and app feature routes are disabled in this probe stage.',
      ]}
    />
  );
}
