import { useState, useEffect, useCallback } from 'react';
import pushNotificationService from '../services/pushNotificationService';
import { useAuthStore } from '../stores/authStore';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuthStore();

  // Initialize push notifications
  useEffect(() => {
    const initialize = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const initialized = await pushNotificationService.initialize();
        
        if (initialized) {
          const status = pushNotificationService.getStatus();
          setIsSupported(status.isSupported);
          setIsSubscribed(status.isSubscribed);
          setPermission(status.permission);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isAuthenticated]);

  // Request permission and subscribe
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pushNotificationService.requestPermission();
      
      const status = pushNotificationService.getStatus();
      setIsSubscribed(status.isSubscribed);
      setPermission(status.permission);
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pushNotificationService.unsubscribe();
      
      const status = pushNotificationService.getStatus();
      setIsSubscribed(status.isSubscribed);
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pushNotificationService.sendTestNotification();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    requestPermission,
    unsubscribe,
    sendTestNotification,
    isEnabled: pushNotificationService.isEnabled()
  };
};

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs);
      
      return prefs;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updated = await pushNotificationService.updatePreferences(newPreferences);
      setPreferences(updated);
      
      return updated;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    error,
    loadPreferences,
    updatePreferences
  };
};