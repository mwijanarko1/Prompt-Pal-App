import '../polyfills'; // Load polyfills first
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  console.log('[RootLayout] Rendering...');
  try {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Level Select' }} />
            <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
          </Stack>
          <StatusBar style="light" />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('[RootLayout] Error in render:', error);
    return null;
  }
}
