import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Level Select' }} />
        <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
