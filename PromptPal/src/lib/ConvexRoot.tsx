import { ClerkProviderWrapper, useAuth } from '@/lib/clerk';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { BootModeScreen } from './BootModeScreen';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    'EXPO_PUBLIC_CONVEX_URL is required for Convex mode.'
  );
}
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

export default function ConvexRoot() {
  return (
    <ClerkProviderWrapper>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <BootModeScreen
          mode="Convex Mode"
          title="Data Layer Loaded"
          body="Clerk and Convex providers are mounted successfully."
          details={[
            'Convex client initialized with production endpoint.',
            'App routes are intentionally disabled in this stage.',
          ]}
        />
      </ConvexProviderWithClerk>
    </ClerkProviderWrapper>
  );
}
