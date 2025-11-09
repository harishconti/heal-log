import AsyncStorage from "@react-native-async-storage/async-storage";
import api from './api';

const LAST_SCREEN_VIEW_KEY = "last_screen_view";
const FEATURE_ADOPTION_KEY = "feature_adoption";
const OFFLINE_ONLINE_TIME_KEY = "offline_online_time";

const sendTelemetry = async (eventType: string, payload: any) => {
  try {
    await api.post('/telemetry/', { event_type: eventType, payload });
  } catch (error) {
    // Suppress errors to avoid impacting user experience
  }
};

export const trackScreenView = async (screenName: string) => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SCREEN_VIEW_KEY, JSON.stringify({ screenName, timestamp: now }));
    await sendTelemetry('screen_view', { screenName });
  } catch (error) {
    console.error("Error tracking screen view:", error);
  }
};

export const trackFeatureAdoption = async (featureName: string) => {
  try {
    const now = new Date().toISOString();
    const existingFeatures = await AsyncStorage.getItem(FEATURE_ADOPTION_KEY);
    const features = existingFeatures ? JSON.parse(existingFeatures) : {};
    features[featureName] = { timestamp: now };
    await AsyncStorage.setItem(FEATURE_ADOPTION_KEY, JSON.stringify(features));
    await sendTelemetry('feature_adoption', { featureName });
  } catch (error) {
    console.error("Error tracking feature adoption:", error);
  }
};

export const trackOfflineOnlineTime = async (isOnline: boolean) => {
  try {
    const now = new Date().toISOString();
    const existingTime = await AsyncStorage.getItem(OFFLINE_ONLINE_TIME_KEY);
    const time = existingTime ? JSON.parse(existingTime) : { online: 0, offline: 0, lastChanged: now };
    const lastChanged = new Date(time.lastChanged);
    const diff = new Date(now).getTime() - lastChanged.getTime();
    if (isOnline) {
      time.offline += diff;
    } else {
      time.online += diff;
    }
    time.lastChanged = now;
    await AsyncStorage.setItem(OFFLINE_ONLINE_TIME_KEY, JSON.stringify(time));
    await sendTelemetry('offline_online_time', { isOnline, offlineDuration: time.offline, onlineDuration: time.online });
  } catch (error) {
    console.error("Error tracking offline/online time:", error);
  }
};
