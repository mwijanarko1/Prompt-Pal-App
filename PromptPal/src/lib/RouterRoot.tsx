import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../app/global.css";

export default function RouterRoot() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="boot" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
