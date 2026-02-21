import * as SecureStore from 'expo-secure-store';
import { logger } from '@/lib/logger';
import { Platform } from 'react-native';

/**
 * Secure token cache that uses SecureStore on native platforms.
 * On web, tokens are stored in memory only and should be managed via httpOnly cookies
 * set by the server. This prevents XSS attacks from stealing tokens.
 * 
 * SECURITY NOTE: For production web deployments, implement httpOnly cookies
 * and remove localStorage usage entirely.
 */

// In-memory storage for web (cleared on page reload)
const webMemoryCache = new Map<string, string>();

export const tokenCache = {
  getToken: async (key: string) => {
    try {
      // Use SecureStore on native platforms
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      }
      
      // On web, use in-memory cache only (more secure than localStorage)
      // For production, implement httpOnly cookies instead
      if (typeof window !== 'undefined') {
        // Check if we're in a development environment where localStorage might be acceptable
        if (__DEV__ && window.localStorage.getItem(key)) {
          // Migrate from localStorage to memory on first access
          const token = window.localStorage.getItem(key);
          if (token) {
            webMemoryCache.set(key, token);
            window.localStorage.removeItem(key); // Clear from localStorage
            logger.warn('TokenCache', 'Migrated token from localStorage to memory');
          }
        }
        return webMemoryCache.get(key) || null;
      }
      return null;
    } catch (err) {
      logger.error('TokenCache', err, { operation: 'getToken', key });
      return null;
    }
  },
  saveToken: async (key: string, token: string) => {
    try {
      // Use SecureStore on native platforms
      if (Platform.OS !== 'web') {
        return await SecureStore.setItemAsync(key, token);
      }
      
      // On web, store in memory only (cleared on page reload)
      // For production, tokens should be managed via httpOnly cookies
      webMemoryCache.set(key, token);
      
      // Also clear any existing localStorage entry for security
      if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
        window.localStorage.removeItem(key);
      }
    } catch (err) {
      logger.error('TokenCache', err, { operation: 'saveToken', key });
      return;
    }
  },
  deleteToken: async (key: string) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else {
        webMemoryCache.delete(key);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      }
    } catch (err) {
      logger.error('TokenCache', err, { operation: 'deleteToken', key });
    }
  },
  clearCache: () => {
    webMemoryCache.clear();
    if (typeof window !== 'undefined') {
      // Clear any Clerk-related tokens from localStorage for security
      const keysToRemove = Object.keys(window.localStorage).filter(key => 
        key.includes('clerk') || key.includes('__clerk') || key.includes('token')
      );
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    }
  },
};