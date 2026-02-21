import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

function IndexWithAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading state while auth is being determined
  if (!isLoaded) {
    return null;
  }

  // Redirect authenticated users to the home page (tabs layout)
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Redirect unauthenticated users to sign-in
  return <Redirect href="/(auth)/sign-in" />;
}

export default function IndexScreen() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = !!publishableKey && publishableKey !== 'your_clerk_publishable_key_here';

  if (!isClerkConfigured) {
    return <Redirect href="/(tabs)" />;
  }

  return <IndexWithAuth />;
}
