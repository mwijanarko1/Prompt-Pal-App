import { logger } from '@/lib/logger';

type NotificationsModule = {
  AndroidImportance: {
    HIGH: number;
  };
  setNotificationChannelAsync: (channelId: string, channel: {
    name: string;
    importance: number;
    vibrationPattern: number[];
    lightColor: string;
  }) => Promise<void>;
  scheduleNotificationAsync: (request: {
    content: {
      title: string;
      body: string;
      sound: boolean;
    };
    trigger: {
      hour: number;
      minute: number;
      repeats: boolean;
      type: 'daily';
    };
  }) => Promise<void>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
};

function getNotificationsModule(): NotificationsModule | null {
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch (error) {
    logger.warn('Notifications', 'expo-notifications is not installed', { error });
    return null;
  }
}

export async function setupNotificationChannels() {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync('daily-quests', {
    name: 'Daily Quests',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B00',
  });
}

export async function scheduleDailyQuestReminder() {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await setupNotificationChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Quest Available!',
      body: 'Complete today\'s quest to earn bonus XP',
      sound: true,
    },
    trigger: { hour: 9, minute: 0, repeats: true, type: 'daily' as const },
  });
}

export async function requestNotificationPermissions() {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllNotifications() {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
}
