import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.localStorage.getItem(name);
      }
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(name, value);
      } else {
        await SecureStore.setItemAsync(name, value);
      }
    } catch {
      /* ignore */
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem(name);
      } else {
        await SecureStore.deleteItemAsync(name);
      }
    } catch {
      /* ignore */
    }
  },
};

export interface NotificationPrefsState {
  learningRemindersEnabled: boolean;
  /** Local hour 0–23 for the daily reminder */
  reminderHour: number;
  reminderMinute: number;
  setLearningRemindersEnabled: (value: boolean) => void;
}

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      learningRemindersEnabled: false,
      reminderHour: 9,
      reminderMinute: 0,
      setLearningRemindersEnabled: (value) => set({ learningRemindersEnabled: value }),
    }),
    {
      name: 'promptpal-notification-prefs',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
