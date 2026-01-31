import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect unauthenticated users to sign-in
  if (isLoaded && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isSignedIn ? {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 24,
          left: 32,
          right: 32,
          height: 80,
          backgroundColor: colorScheme === 'dark' ? '#0F0F1A' : '#FFFFFF',
          borderRadius: 35,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          paddingBottom: 8,
          paddingTop: 12,
        } : { display: 'none' },
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: '900',
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="game/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="game/levels/[moduleId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="test-target-image"
        options={{
          href: null,
          title: 'Test S4',
        }}
      />
    </Tabs>
  );
}
