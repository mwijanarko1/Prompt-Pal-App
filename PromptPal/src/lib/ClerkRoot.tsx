import { ClerkProviderWrapper } from '@/lib/clerk';
import { BootModeScreen } from './BootModeScreen';

export default function ClerkRoot() {
  return (
    <ClerkProviderWrapper>
      <BootModeScreen
        mode="Clerk Mode"
        title="Auth Provider Loaded"
        body="Clerk is mounted successfully in isolation."
        details={[
          'Authentication context is available.',
          'Convex and feature routes are not mounted in this stage.',
        ]}
      />
    </ClerkProviderWrapper>
  );
}
