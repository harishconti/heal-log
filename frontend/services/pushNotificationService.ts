import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// Configure notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'appointment_reminder' | 'patient_update' | 'note_comment' | 'sync_complete' | 'general';
  patientId?: string;
  noteId?: string;
  appointmentId?: string;
  message?: string;
}

class PushNotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private navigationCallback: ((data: NotificationData) => void) | null = null;

  /**
   * Initialize the push notification service
   * Call this on app startup
   */
  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const permissionGranted = await this.requestPermissions();
      if (!permissionGranted) {
        console.log('Push notification permissions not granted');
        return false;
      }

      // Set up listeners
      this.setupListeners();

      console.log('Push notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return false;
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'HealLog Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90D9',
        });

        // Create a channel for appointment reminders
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointment Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#4A90D9',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get the Expo push token for this device
   */
  async getPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'f0d96d22-8433-42c1-9a40-79607b887ac8', // From app.json
      })).data;
      console.log('Push token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Register the device token with the backend
   */
  async registerDeviceToken(userId: string): Promise<boolean> {
    try {
      const token = await this.getPushToken();
      if (!token) {
        console.log('No push token available');
        return false;
      }

      await api.post('/api/notifications/register-device', {
        user_id: userId,
        device_token: token,
        platform: Platform.OS,
        device_name: Platform.OS === 'android' ? 'Android Device' : 'iOS Device',
      });

      console.log('Device token registered successfully');
      return true;
    } catch (error) {
      console.error('Failed to register device token:', error);
      return false;
    }
  }

  /**
   * Unregister the device token (call on logout)
   */
  async unregisterDeviceToken(): Promise<boolean> {
    try {
      const token = await this.getPushToken();
      if (!token) return true;

      await api.post('/api/notifications/unregister-device', {
        device_token: token,
      });

      console.log('Device token unregistered successfully');
      return true;
    } catch (error) {
      console.error('Failed to unregister device token:', error);
      return false;
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Listen for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle foreground notification if needed
      }
    );

    // Listen for notification responses (user tapped on notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        this.handleNotificationNavigation(response.notification);
      }
    );
  }

  /**
   * Set a callback for notification navigation
   */
  setNavigationCallback(callback: (data: NotificationData) => void): void {
    this.navigationCallback = callback;
  }

  /**
   * Handle navigation when user taps a notification
   */
  private handleNotificationNavigation(notification: Notifications.Notification): void {
    const data = notification.request.content.data as NotificationData;

    if (this.navigationCallback) {
      this.navigationCallback(data);
    } else {
      // Default handling based on notification type
      switch (data.type) {
        case 'appointment_reminder':
          console.log('Navigate to appointments');
          break;
        case 'patient_update':
          console.log('Navigate to patient:', data.patientId);
          break;
        case 'note_comment':
          console.log('Navigate to note:', data.noteId);
          break;
        case 'sync_complete':
          console.log('Sync completed');
          break;
        default:
          console.log('General notification');
      }
    }
  }

  /**
   * Send a local notification (for testing or local reminders)
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    delaySeconds: number = 1
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || { type: 'general' },
          sound: 'default',
        },
        trigger: {
          seconds: delaySeconds,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule an appointment reminder
   */
  async scheduleAppointmentReminder(
    appointmentId: string,
    patientName: string,
    appointmentTime: Date,
    reminderMinutesBefore: number = 30
  ): Promise<string | null> {
    try {
      const reminderTime = new Date(appointmentTime.getTime() - reminderMinutesBefore * 60 * 1000);

      // Don't schedule if the reminder time is in the past
      if (reminderTime <= new Date()) {
        console.log('Appointment reminder time is in the past, skipping');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming Appointment',
          body: `Appointment with ${patientName} in ${reminderMinutesBefore} minutes`,
          data: {
            type: 'appointment_reminder',
            appointmentId,
          },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'appointments' }),
        },
        trigger: {
          date: reminderTime,
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      });

      console.log('Appointment reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule appointment reminder:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Clear all delivered notifications from the notification tray
   */
  async clearDeliveredNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('Delivered notifications cleared');
    } catch (error) {
      console.error('Failed to clear delivered notifications:', error);
    }
  }

  /**
   * Clean up listeners (call on app shutdown)
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    this.navigationCallback = null;
    console.log('Push notification service cleaned up');
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
