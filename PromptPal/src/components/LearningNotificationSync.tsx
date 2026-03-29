import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useNotificationPrefsStore } from '@/features/notifications/store';
import { useUserProgressStore } from '@/features/user/store';
import { syncLearningDailyReminderFromProgress } from '@/lib/notifications';

/**
 * Keeps the daily local notification in sync with streak state whenever prefs or progress change,
 * and refreshes when the app returns to foreground.
 */
export function LearningNotificationSync() {
  const learningRemindersEnabled = useNotificationPrefsStore((s) => s.learningRemindersEnabled);
  const reminderHour = useNotificationPrefsStore((s) => s.reminderHour);
  const reminderMinute = useNotificationPrefsStore((s) => s.reminderMinute);
  const currentStreak = useUserProgressStore((s) => s.currentStreak);
  const lastActivityDate = useUserProgressStore((s) => s.lastActivityDate);

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    void syncLearningDailyReminderFromProgress({
      enabled: learningRemindersEnabled,
      currentStreak,
      lastActivityDate,
      hour: reminderHour,
      minute: reminderMinute,
    });
  }, [learningRemindersEnabled, currentStreak, lastActivityDate, reminderHour, reminderMinute]);

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void syncLearningDailyReminderFromProgress({
        enabled: useNotificationPrefsStore.getState().learningRemindersEnabled,
        currentStreak: useUserProgressStore.getState().currentStreak,
        lastActivityDate: useUserProgressStore.getState().lastActivityDate,
        hour: useNotificationPrefsStore.getState().reminderHour,
        minute: useNotificationPrefsStore.getState().reminderMinute,
      });
    });

    return () => sub.remove();
  }, []);

  return null;
}
