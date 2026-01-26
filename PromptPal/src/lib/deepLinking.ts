import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { logger } from '@/lib/logger';

export const handleDeepLink = (url: string) => {
  try {
    const { path, queryParams } = Linking.parse(url);

    if (path === 'level') {
      if (!queryParams?.id) {
        logger.warn('DeepLinking', 'Missing id parameter for level link');
        return;
      }
      router.push(`/(tabs)/game/levels/${queryParams.id}`);
    } else if (path === 'quest') {
      router.push('/(tabs)/library');
    } else if (path === 'module') {
      if (!queryParams?.id) {
        logger.warn('DeepLinking', 'Missing id parameter for module link');
        return;
      }
      router.push(`/(tabs)/game/levels/${queryParams.id}`);
    }
  } catch (error) {
    logger.error('DeepLinking', error, { operation: 'handleDeepLink', url });
  }
};

export const generateShareLink = (type: 'level' | 'quest' | 'module', id: string) => {
  return Linking.createURL(type, { queryParams: { id } });
};
