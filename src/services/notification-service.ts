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
export const scheduleAdaptiveDose = async (medicationName: string, intervalHours: number) => {
  const trigger = addHours(new Date(), intervalHours);
  
  // Cancel existing notifications for this medication to avoid duplicates
  // In a full app, we would store the notification ID in the DB
  
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🐾 Time for medication!",
      body: `It's time to give ${medicationName}. This dose is based on your pet's last recovery window.`,
      data: { medicationName },
      sound: 'default',
    },
    trigger,
  });

  return identifier;
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
