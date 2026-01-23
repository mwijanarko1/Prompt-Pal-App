import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, SafeAreaView } from 'react-native';

/**
 * Inner layout component that uses Clerk authentication.
 * Only rendered when Clerk is configured.
 */
function LayoutInner() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Redirect to sign-in if not signed in and trying to access home
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <View className="flex-row items-center mb-6">
            <Text className="text-primary text-4xl font-bold">Prompt</Text>
            <Text className="text-secondary text-4xl font-bold">Pal</Text>
          </View>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-onSurfaceVariant text-base mt-4 text-center">
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

/**
 * Layout wrapper that only renders the authenticated layout when Clerk is configured.
 * When Clerk is not configured, allows access without authentication (for development).
 */
export default function Layout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = publishableKey && publishableKey !== 'your_clerk_publishable_key_here';
  
  // If Clerk is not configured, allow access without authentication (development mode)
  if (!isClerkConfigured) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }
  
  return <LayoutInner />;
}
