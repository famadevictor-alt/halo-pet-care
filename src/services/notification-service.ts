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

// Create Android notification channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('clinical-reminders', {
    name: 'Clinical Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

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
 * Schedules multiple nagging notifications to ensure adherence.
 * @param medicationId 
 * @param medicationName 
 * @param initialDate Date for the first reminder
 * @param intervalMins Minutes between reminders
 * @param count Number of reminders to schedule
 */
export const scheduleNaggingReminders = async (
  medicationId: string, 
  medicationName: string, 
  initialDate: Date, 
  intervalMins: number = 5, 
  count: number = 3
) => {
  const identifiers: string[] = [];
  
  // Validation
  if (!(initialDate instanceof Date) || isNaN(initialDate.getTime())) {
    console.error('Notification Error: Invalid initialDate');
    return [];
  }

  const safeInterval = Math.max(1, parseInt(intervalMins.toString()) || 5);
  const safeCount = Math.max(1, parseInt(count.toString()) || 1);

  for (let i = 0; i < safeCount; i++) {
    try {
      const triggerTime = new Date(initialDate.getTime() + (i * safeInterval * 60000));
      const secondsFromNow = Math.floor((triggerTime.getTime() - Date.now()) / 1000);
      
      // Skip if trigger time is in the past (must be at least 1 second in future)
      if (secondsFromNow <= 0) continue;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i === 0 ? "🐾 Medication Reminder" : "⚠️ MISSED DOSE NAG",
          body: i === 0 
            ? `It's time for ${medicationName}.` 
            : `URGENT: ${medicationName} is now overdue. Please administer it as soon as possible.`,
          data: { medicationId, medicationName, isNag: i > 0 },
          sound: 'default',
          priority: i === 0 ? 'default' : 'high',
          android: {
            channelId: 'clinical-reminders',
            priority: 'high',
          }
        },
        trigger: {
          type: 'timeInterval', // Use string literal for maximum compatibility
          seconds: Math.max(1, secondsFromNow),
          repeats: false
        } as any,
      });
      
      identifiers.push(identifier);
    } catch (error) {
      console.error(`Failed to schedule reminder ${i}:`, error);
    }
  }

  return identifiers;
};

/**
 * Schedules an adaptive notification based on the last dose taken.
 */
export const scheduleAdaptiveDose = async (
  medicationId: string, 
  medicationName: string, 
  intervalHours: number,
  nagIntervalMins: number = 5,
  nagCount: number = 3
) => {
  const hours = typeof intervalHours === 'string' ? parseFloat(intervalHours) : intervalHours;
  if (isNaN(hours) || hours <= 0) return null;

  const initialTriggerDate = new Date(Date.now() + (hours * 3600000));
  
  return await scheduleNaggingReminders(
    medicationId, 
    medicationName, 
    initialTriggerDate, 
    nagIntervalMins, 
    nagCount
  );
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

export const scheduleAppointmentReminders = async (
  appointmentId: string, 
  appointmentTitle: string, 
  appointmentAt: string, 
  nagIntervalMins: number = 60, 
  nagCount: number = 1
) => {
  const apptDate = new Date(appointmentAt);
  
  return await scheduleNaggingReminders(
    appointmentId, 
    `Appointment: ${appointmentTitle}`, 
    apptDate, 
    nagIntervalMins, 
    nagCount
  );
};

export const cancelAppointmentNotifications = async (appointmentId: string) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.medicationId === appointmentId) { // We reuse medicationId field for simplicity or rename data key
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling appointment notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
