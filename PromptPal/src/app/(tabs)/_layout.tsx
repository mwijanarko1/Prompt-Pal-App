import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { useOnboardingStore } from '@/features/onboarding/store';

const BRAND = '#FF6B00';
const MARGIN_H = 72;

function TabsNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { hasCompletedOnboarding } = useOnboardingStore();

  const bgColor = '#FFFFFF';
  const inactiveColor = '#64748B';
  const activeColor = BRAND;
  const bottomOffset =
    Platform.OS === 'ios' ? Math.max(insets.bottom + 4, 28) : 24;

  // Show onboarding flow fullscreen if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: isDark ? styles.sceneDark : styles.sceneLight,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomOffset,
          marginHorizontal: MARGIN_H,
          height: 64,
          borderRadius: 32,
          backgroundColor: bgColor,
          borderWidth: 1.5,
          borderTopWidth: 1.5,
          borderColor: activeColor,
          borderTopColor: activeColor, // Force top color consistency
          paddingTop: 6,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.1,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarItemStyle: {
          height: 50,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          href: null,
          title: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'trophy' : 'trophy-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabLayoutWithAuth() {
  const { isSignedIn, isLoaded } = useAuth();
  if (isLoaded && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <TabsNavigator />;
}

export default function TabLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured =
    !!publishableKey && publishableKey !== 'your_clerk_publishable_key_here';
  if (!isClerkConfigured) return <TabsNavigator />;
  return <TabLayoutWithAuth />;
}

const styles = StyleSheet.create({
  sceneDark: { backgroundColor: '#0B1220' },
  sceneLight: { backgroundColor: '#F7F7FB' },
});
