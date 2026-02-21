import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function TabsNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: isDark ? '#111111' : '#FFFFFF',
          borderTopColor: isDark ? '#2A2A2A' : '#E6E6E6',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabLayoutWithAuth() {
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect unauthenticated users to sign-in
  if (isLoaded && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <TabsNavigator />;
}

export default function TabLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = !!publishableKey && publishableKey !== 'your_clerk_publishable_key_here';

  if (!isClerkConfigured) {
    return <TabsNavigator />;
  }

  return <TabLayoutWithAuth />;
}
