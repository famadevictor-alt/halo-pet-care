import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { addHours } from 'date-fns';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return null;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A8EB2',
    });
  }

  return (await Notifications.getExpoPushTokenAsync()).data;
};

/**
 * Schedules an adaptive notification based on the last dose taken.
 * @param medicationName Name of the medication
 * @param intervalHours Hours until next dose
 */
export const scheduleAdaptiveDose = async (medicationId: string, medicationName: string, intervalHours: number) => {
  // Ensure intervalHours is a valid number
  const hours = typeof intervalHours === 'string' ? parseFloat(intervalHours) : intervalHours;
  
  if (isNaN(hours) || hours <= 0) {
    console.warn(`Invalid interval for ${medicationName}: ${intervalHours}`);
    return null;
  }

  // Convert hours to seconds for a more robust TimeIntervalTrigger
  // Ensure it's at least 60 seconds to avoid trigger errors on some platforms
  const seconds = Math.max(60, Math.floor(hours * 3600));

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🐾 Time for medication!",
      body: `It's time to give ${medicationName}. This dose is based on your pet's last recovery window.`,
      data: { medicationId, medicationName },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false
    },
  });

  return identifier;
};

export const cancelMedicationNotifications = async (medicationId: string) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
