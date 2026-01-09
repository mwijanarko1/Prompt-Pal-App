import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Level Select' }} />
        <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
