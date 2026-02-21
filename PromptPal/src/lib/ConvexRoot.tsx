import { View, Text, StyleSheet } from 'react-native';
import { ClerkProviderWrapper, useAuth } from '@/lib/clerk';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

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
        <View style={styles.container}>
          <Text style={styles.title}>CONVEX MODE</Text>
          <Text style={styles.body}>Clerk + Convex providers enabled. No app screens.</Text>
        </View>
      </ConvexProviderWithClerk>
    </ClerkProviderWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    color: '#C7C7C7',
    fontSize: 14,
    textAlign: 'center',
  },
});
