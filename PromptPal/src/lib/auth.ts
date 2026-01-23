import * as SecureStore from 'expo-secure-store';
import { logger } from '@/lib/logger';
import { Platform } from 'react-native';

/**
 * Token cache that uses SecureStore on native platforms and localStorage on web.
 * This ensures compatibility across all platforms.
 */
export const tokenCache = {
  getToken: async (key: string) => {
    try {
      // Use localStorage on web, SecureStore on native
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (err) {
      logger.error('TokenCache', err, { operation: 'getToken', key });
      return null;
    }
  },
  saveToken: async (key: string, token: string) => {
    try {
      // Use localStorage on web, SecureStore on native
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(key, token);
        return;
      } else {
        return await SecureStore.setItemAsync(key, token);
      }
    } catch (err) {
      logger.error('TokenCache', err, { operation: 'saveToken', key });
      return;
    }
  },
};