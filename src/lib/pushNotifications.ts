// Push Notification Manager for WebTrigger PWA
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private vapidPublicKey: string = 'BKxQzAyVzq8r5gE4j8QzAyVzq8r5gE4j8QzAyVzq8r5gE4j8QzAyVzq8r5gE4j8QzAyVzq8r5gE4j8QzAyVzq8r5g'; // Placeholder - should come from env
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker if not already registered
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not initialized');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (subscription) {
        const result = await subscription.unsubscribe();
        return result;
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  getSubscriptionData(subscription: PushSubscription): PushSubscriptionData | null {
    try {
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        return null;
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(p256dhKey),
          auth: this.arrayBufferToBase64(authKey)
        }
      };
    } catch (error) {
      console.error('Failed to extract subscription data:', error);
      return null;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  // Utility function to convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Send subscription to server
  async registerWithServer(subscriptionData: PushSubscriptionData): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        throw new Error('Failed to register push subscription with server');
      }

      return true;
    } catch (error) {
      console.error('Failed to register with server:', error);
      return false;
    }
  }

  // Unregister from server
  async unregisterFromServer(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/notifications/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unregister push subscription from server');
      }

      return true;
    } catch (error) {
      console.error('Failed to unregister from server:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pushNotifications = PushNotificationManager.getInstance();

// React hook for push notifications
import { useState, useEffect, useCallback } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSupport = useCallback(async () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    if (supported) {
      try {
        const subscription = await pushNotifications.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
    }
  }, []);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  const enablePushNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const initialized = await pushNotifications.initialize();
      if (!initialized) {
        throw new Error('Push notifications not supported');
      }

      const subscription = await pushNotifications.subscribe();
      if (!subscription) {
        throw new Error('Failed to subscribe to push notifications');
      }

      const subscriptionData = pushNotifications.getSubscriptionData(subscription);
      if (!subscriptionData) {
        throw new Error('Failed to extract subscription data');
      }

      const registered = await pushNotifications.registerWithServer(subscriptionData);
      if (!registered) {
        throw new Error('Failed to register with server');
      }

      setIsSubscribed(true);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable push notifications';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newPermission = await pushNotifications.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        await enablePushNotifications();
      }

      return newPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setError(errorMessage);
      return 'denied';
    } finally {
      setIsLoading(false);
    }
  }, [enablePushNotifications]);

  const disablePushNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const unregistered = await pushNotifications.unregisterFromServer();
      if (!unregistered) {
        console.warn('Failed to unregister from server, but continuing with local unsubscribe');
      }

      const unsubscribed = await pushNotifications.unsubscribe();
      if (!unsubscribed) {
        throw new Error('Failed to unsubscribe locally');
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable push notifications';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    enablePushNotifications,
    disablePushNotifications,
  };
}