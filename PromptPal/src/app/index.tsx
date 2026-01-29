import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function IndexScreen() {
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

