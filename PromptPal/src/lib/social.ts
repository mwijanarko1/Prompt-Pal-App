import { Share } from 'react-native';
import { logger } from '@/lib/logger';

export async function shareProgress(levelTitle: string, score: number) {
  const message = `I just scored ${score} on "${levelTitle}" in PromptPal! 🎮`;
  try {
    await Share.share({ message });
  } catch (error) {
    logger.error('Social', error, { operation: 'shareProgress' });
  }
}

export async function shareAchievement(achievementTitle: string) {
  const message = `I just unlocked the "${achievementTitle}" achievement in PromptPal! 🏆`;
  try {
    await Share.share({ message });
  } catch (error) {
    logger.error('Social', error, { operation: 'shareAchievement' });
  }
}
