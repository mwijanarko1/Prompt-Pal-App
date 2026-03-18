import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, ActivityIndicator } from "react-native";

function IndexWithAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading state while auth is being determined (returning null causes white screen)
  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B1220",
        }}
      >
        <Text style={{ color: "#FF6B00", fontSize: 32, fontWeight: "bold", marginBottom: 16 }}>Prompt</Text>
        <Text style={{ color: "#4F46E5", fontSize: 32, fontWeight: "bold", marginBottom: 24 }}>Pal</Text>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 16 }}>Loading...</Text>
      </View>
    );
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
