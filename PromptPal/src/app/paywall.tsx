import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { purchasePlan, restorePurchases, isProEntitled } from '@/lib/subscriptions';
import { useSubscriptionStore } from '@/features/subscription/store';

type Plan = {
  id: 'monthly' | 'yearly';
  title: string;
  price: string;
  subtitle: string;
  badge?: string;
};

const plans: Plan[] = [
  {
    id: 'monthly',
    title: 'PromptPal Pro Monthly',
    price: '$9.99 / month',
    subtitle: '7-day free trial, then monthly billing',
    badge: 'Most Flexible',
  },
  {
    id: 'yearly',
    title: 'PromptPal Pro Yearly',
    price: '$59.99 / year',
    subtitle: 'Best value for long-term learning',
    badge: 'Best Value',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const setPro = useSubscriptionStore((state) => state.setPro);

  const startSubscription = async (planId: Plan['id']) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const info = await purchasePlan(planId);
      const entitled = isProEntitled(info);
      setPro(entitled);
      if (entitled) {
        Alert.alert('Success', 'Your subscription is active.');
        router.back();
      } else {
        Alert.alert('Purchase pending', 'Purchase finished but entitlement is not active yet.');
      }
    } catch (error: any) {
      const message = error?.userCancelled
        ? 'Purchase cancelled.'
        : (error?.message || 'Unable to complete purchase right now.');
      Alert.alert('Purchase failed', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const info = await restorePurchases();
      const entitled = isProEntitled(info);
      setPro(entitled);
      Alert.alert('Restore complete', entitled ? 'Your Pro access has been restored.' : 'No active subscription found.');
    } catch (error: any) {
      Alert.alert('Restore failed', error?.message || 'Unable to restore purchases.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface">
          <Ionicons name="chevron-back" size={22} color="#F9FAFB" />
        </Pressable>
        <Text className="text-onSurface text-lg font-black uppercase tracking-[2px]">Upgrade</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="rounded-3xl border border-primary/30 bg-primary/10 p-5 mb-6">
          <Text className="text-primary text-xs font-black uppercase tracking-widest mb-2">PromptPal Pro</Text>
          <Text className="text-onSurface text-2xl font-black mb-2">Unlock full access</Text>
          <Text className="text-onSurfaceVariant text-sm">
            Access all current and future premium modules, expanded usage limits, and priority features.
          </Text>
        </View>

        <View className="gap-4">
          {plans.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => startSubscription(plan.id)}
              disabled={isProcessing}
              className={`rounded-3xl border border-outline/30 bg-surface p-5 ${isProcessing ? 'opacity-70' : ''}`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-onSurface text-base font-black">{plan.title}</Text>
                {plan.badge ? (
                  <View className="rounded-full bg-secondary/20 px-3 py-1">
                    <Text className="text-secondary text-[10px] font-black uppercase tracking-wider">{plan.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-onSurface text-xl font-black mb-1">{plan.price}</Text>
              <Text className="text-onSurfaceVariant text-xs uppercase tracking-widest">{plan.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleRestorePurchases}
          disabled={isProcessing}
          className={`mt-6 h-12 rounded-2xl border border-outline/30 items-center justify-center ${isProcessing ? 'opacity-70' : ''}`}
        >
          {isProcessing ? (
            <ActivityIndicator color="#F9FAFB" />
          ) : (
            <Text className="text-onSurface text-xs font-black uppercase tracking-widest">Restore Purchases</Text>
          )}
        </Pressable>

        <Text className="text-onSurfaceVariant text-[10px] leading-4 mt-6 opacity-80">
          Subscriptions auto-renew unless canceled at least 24 hours before renewal. You can manage or cancel in Apple ID settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
