import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

export const tokenCache = {
  getToken: async (key: string) => {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      logger.error('TokenCache', err, { operation: 'getToken', key });
      return null;
    }
  },
  saveToken: async (key: string, token: string) => {
    try {
      return await SecureStore.setItemAsync(key, token);
    } catch (err) {
      logger.error('TokenCache', err, { operation: 'saveToken', key });
      return;
    }
  },
};