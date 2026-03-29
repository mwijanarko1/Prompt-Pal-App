import { Platform } from 'react-native';
import { logger } from '@/lib/logger';

/**
 * Lazy-load expo-notifications so the app does not crash when the dev client was built
 * before expo-notifications was added (native module missing). Rebuild with:
 * `npx expo run:ios` / `npx expo run:android` or a new EAS dev build.
 */
type NotificationsModule = {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  setNotificationChannelAsync: (
    id: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern: number[];
      lightColor: string;
    }
  ) => Promise<unknown>;
  getAllScheduledNotificationsAsync: () => Promise<
    Array<{ identifier: string; content: { data?: Record<string, unknown> } }>
  >;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  scheduleNotificationAsync: (request: {
    content: {
      title?: string | null;
      body?: string | null;
      sound?: boolean;
      data?: Record<string, unknown>;
    };
    trigger: Record<string, unknown>;
  }) => Promise<string>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
};

const ANDROID_IMPORTANCE_HIGH = 6;
const TRIGGER_DAILY = 'daily';

let notificationsModule: NotificationsModule | null | undefined;

function getNotificationsModule(): NotificationsModule | null {
  if (notificationsModule === null) return null;
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
    return notificationsModule;
  } catch (error) {
    logger.warn(
      'Notifications',
      'expo-notifications unavailable — rebuild your dev client after adding the package',
      { error }
    );
    notificationsModule = null;
    return null;
  }
}

/** Matches `userProgress` streak dates (`toISOString().split('T')[0]`). */
function isoDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function todayString(): string {
  return isoDateString(new Date());
}

function yesterdayString(): string {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isoDateString(y);
}

export const LEARNING_REMINDER_DATA_TAG = 'promptpal-learning-daily';

const LEARNING_CHANNEL_ID = 'learning-reminders';

let handlerConfigured = false;

export function ensureNotificationHandlerConfigured(): void {
  if (handlerConfigured) return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  try {
    handlerConfigured = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    handlerConfigured = false;
    logger.warn('Notifications', 'setNotificationHandler failed', { error });
  }
}

function isNativeMobile(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export type LearningReminderVariant = 'new_user' | 'active_today' | 'streak_at_risk' | 'inactive';

export function classifyLearningReminder(
  lastActivityDate: string | null,
  currentStreak: number
): LearningReminderVariant {
  const today = todayString();
  const yesterday = yesterdayString();

  if (!lastActivityDate) {
    return 'new_user';
  }
  if (lastActivityDate === today) {
    return 'active_today';
  }
  if (lastActivityDate === yesterday && currentStreak >= 1) {
    return 'streak_at_risk';
  }
  return 'inactive';
}

export function getLearningReminderCopy(
  variant: LearningReminderVariant,
  currentStreak: number
): { title: string; body: string } {
  switch (variant) {
    case 'new_user':
      return {
        title: 'Start your learning streak',
        body: 'Open PromptPal for a quick lesson — your first streak day is one session away.',
      };
    case 'active_today':
      if (currentStreak >= 3) {
        return {
          title: `${currentStreak}-day streak — nice`,
          body: 'You already practiced today. Come back tomorrow to keep the momentum going.',
        };
      }
      return {
        title: 'Great job today',
        body: 'Nice work. We’ll remind you when it’s time for more prompt practice.',
      };
    case 'streak_at_risk':
      return {
        title: `Keep your ${currentStreak}-day streak`,
        body: 'You haven’t practiced yet today — a short session keeps your streak alive.',
      };
    case 'inactive':
    default:
      return {
        title: 'Jump back into PromptPal',
        body: 'Your daily quest and modules are waiting — pick up where you left off.',
      };
  }
}

export async function setupNotificationChannels(): Promise<void> {
  if (!isNativeMobile()) return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync(LEARNING_CHANNEL_ID, {
      name: 'Learning reminders',
      importance: ANDROID_IMPORTANCE_HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });
  } catch (error) {
    logger.warn('Notifications', 'setNotificationChannelAsync failed', { error });
  }
}

export async function cancelLearningDailyReminders(): Promise<void> {
  if (!isNativeMobile()) return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of pending) {
      const tag = request.content.data?.tag;
      if (tag === LEARNING_REMINDER_DATA_TAG) {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
  } catch (error) {
    logger.warn('Notifications', 'Failed to cancel learning reminders', { error });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNativeMobile()) return false;
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    logger.warn('Notifications', 'Permission request failed', { error });
    return false;
  }
}

export type SyncLearningReminderInput = {
  enabled: boolean;
  currentStreak: number;
  lastActivityDate: string | null;
  hour?: number;
  minute?: number;
};

/**
 * Schedules one repeating local notification per day. Copy is chosen from current streak state and
 * refreshed whenever this runs (typically app foreground + Profile toggle), so messages stay in sync
 * with active vs inactive streaks without a push server.
 */
export async function syncLearningDailyReminderFromProgress(input: SyncLearningReminderInput): Promise<void> {
  const { enabled, currentStreak, lastActivityDate, hour = 9, minute = 0 } = input;

  if (!isNativeMobile()) return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    await cancelLearningDailyReminders();

    if (!enabled) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await setupNotificationChannels();

    const variant = classifyLearningReminder(lastActivityDate, currentStreak);
    const { title, body } = getLearningReminderCopy(variant, currentStreak);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { tag: LEARNING_REMINDER_DATA_TAG },
      },
      trigger: {
        type: TRIGGER_DAILY,
        hour,
        minute,
        channelId: LEARNING_CHANNEL_ID,
      },
    });
  } catch (error) {
    logger.warn('Notifications', 'Failed to sync learning reminder', { error });
  }
}

/** @deprecated Use syncLearningDailyReminderFromProgress with prefs store */
export async function scheduleDailyQuestReminder(): Promise<void> {
  await syncLearningDailyReminderFromProgress({
    enabled: true,
    currentStreak: 0,
    lastActivityDate: null,
    hour: 9,
    minute: 0,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (!isNativeMobile()) return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    logger.warn('Notifications', 'cancelAllScheduledNotificationsAsync failed', { error });
  }
}
