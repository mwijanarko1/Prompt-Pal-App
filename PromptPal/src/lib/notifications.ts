import * as Notifications from 'expo-notifications';

export async function setupNotificationChannels() {
  await Notifications.setNotificationChannelAsync('daily-quests', {
    name: 'Daily Quests',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B00',
  });
}

export async function scheduleDailyQuestReminder() {
  await setupNotificationChannels(); // Add this
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
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
