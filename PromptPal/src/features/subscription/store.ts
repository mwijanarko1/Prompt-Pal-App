import { create } from 'zustand';
import { getCustomerInfo, isProEntitled } from '@/lib/subscriptions';

interface SubscriptionState {
  isPro: boolean;
  isLoading: boolean;
  syncFromRevenueCat: () => Promise<boolean>;
  setPro: (value: boolean) => void;
  /** Call when RevenueCat is not configured so UI does not wait forever. */
  finishGateCheckWithoutClient: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPro: false,
  isLoading: true,
  setPro: (value) => set({ isPro: value, isLoading: false }),
  finishGateCheckWithoutClient: () => set({ isLoading: false }),
  syncFromRevenueCat: async () => {
    try {
      const info = await getCustomerInfo();
      const entitled = isProEntitled(info);
      set({ isPro: entitled, isLoading: false });
      return entitled;
    } catch (error) {
      console.warn('[Subscription] Failed to sync from RevenueCat', error);
      set({ isLoading: false });
      return false;
    }
  },
}));
