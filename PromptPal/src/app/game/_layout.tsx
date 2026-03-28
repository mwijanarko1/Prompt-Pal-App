import { Stack } from 'expo-router';
import { SubscriptionAccessGuard } from '@/components/SubscriptionAccessGuard';

export default function GameLayout() {
  return (
    <SubscriptionAccessGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </SubscriptionAccessGuard>
  );
}
