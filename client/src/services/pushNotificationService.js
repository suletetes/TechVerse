import { useAuthStore } from '../stores/authStore';

class PushNotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.isSubscribed = false;
    this.subscription = null;
    this.registration = null;
    this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI2BN9XplSCYgDbrn7rVgLOYWX2CCKw2OFGEVwdXsaQhQRAcgYKRZdh9Ag';
  }

  // Initialize the service
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check existing subscription
      await this.checkExistingSubscription();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Check if user already has a subscription
  async checkExistingSubscription() {
    try {
      if (!this.registration) return false;

      this.subscription = await this.registration.pushManager.getSubscription();
      this.isSubscribed = !!this.subscription;

      if (this.isSubscribed) {
        console.log('User is already subscribed to push notifications');
        // Optionally sync with server
        await this.syncSubscriptionWithServer();
      }

      return this.isSubscribed;
    } catch (error) {
      console.error('Error checking existing subscription:', error);
      return false;
    }
  }

  // Request permission and subscribe
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      await this.subscribe();
      
      return true;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    try {
      if (!this.registration) {
        throw new Error('Service worker not registered');
      }

      // Convert VAPID key
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Subscribe to push manager
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      this.isSubscribed = true;

      // Send subscription to server
      await this.sendSubscriptionToServer();

      console.log('Successfully subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      if (!this.subscription) {
        console.log('No active subscription to unsubscribe from');
        return true;
      }

      // Unsubscribe from push manager
      const successful = await this.subscription.unsubscribe();

      if (successful) {
        this.subscription = null;
        this.isSubscribed = false;

        // Notify server
        await this.removeSubscriptionFromServer();

        console.log('Successfully unsubscribed from push notifications');
      }

      return successful;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer() {
    try {
      const { token } = useAuthStore.getState();
      
      if (!token || !this.subscription) {
        throw new Error('No authentication token or subscription available');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: this.subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('Subscription sent to server successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer() {
    try {
      const { token } = useAuthStore.getState();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('Subscription removed from server successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
      throw error;
    }
  }

  // Sync existing subscription with server
  async syncSubscriptionWithServer() {
    if (this.subscription) {
      try {
        await this.sendSubscriptionToServer();
      } catch (error) {
        console.warn('Failed to sync subscription with server:', error);
      }
    }
  }

  // Send test notification
  async sendTestNotification() {
    try {
      const { token } = useAuthStore.getState();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('Test notification sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const { token } = useAuthStore.getState();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const { token } = useAuthStore.getState();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Utility methods
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get current status
  getStatus() {
    return {
      isSupported: this.isSupported,
      isSubscribed: this.isSubscribed,
      permission: Notification.permission,
      hasSubscription: !!this.subscription,
      hasRegistration: !!this.registration
    };
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.isSupported && 
           Notification.permission === 'granted' && 
           this.isSubscribed;
  }

  // Show local notification (fallback)
  showLocalNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/img/logo-192.png',
        badge: '/img/badge-72.png',
        ...options
      });
    } else {
      console.warn('Notification permission not granted');
      return null;
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;