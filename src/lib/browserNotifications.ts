// Browser Notification Utilities for WebTrigger PWA

// Browser Notification Utilities for WebTrigger PWA

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: unknown;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class BrowserNotificationManager {
  private static instance: BrowserNotificationManager;
  private permission: NotificationPermission = 'default';
  private isPWA: boolean = false;

  private constructor() {
    this.checkPWAMode();
    this.updatePermission();
  }

  static getInstance(): BrowserNotificationManager {
    if (!BrowserNotificationManager.instance) {
      BrowserNotificationManager.instance = new BrowserNotificationManager();
    }
    return BrowserNotificationManager.instance;
  }

  private checkPWAMode(): void {
    // Check if running as PWA
    this.isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                 (window.navigator as { standalone?: boolean }).standalone === true;
  }

  private updatePermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  isPWAMode(): boolean {
    return this.isPWA;
  }

  async showNotification(payload: NotificationPayload): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
      });

      // Auto-close after 5 seconds unless it requires interaction
      if (!payload.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle notification click
      notification.onclick = () => {
        // Focus the window/tab
        window.focus();

        // Navigate to dashboard if not already there
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }

        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Webhook-specific notification methods
  async showWebhookSuccess(callbackName: string, statusCode: number, responseTime: number): Promise<Notification | null> {
    return this.showNotification({
      title: '✅ Webhook Success',
      body: `${callbackName} - Status: ${statusCode} (${responseTime}ms)`,
      tag: `webhook-${callbackName}-success`,
      data: { type: 'webhook_success', callbackName, statusCode, responseTime },
      icon: '/icon-192x192.png',
    });
  }

  async showWebhookFailure(callbackName: string, statusCode: number, error: string): Promise<Notification | null> {
    return this.showNotification({
      title: '❌ Webhook Failed',
      body: `${callbackName} - ${error}`,
      tag: `webhook-${callbackName}-failure`,
      data: { type: 'webhook_failure', callbackName, statusCode, error },
      icon: '/icon-192x192.png',
      requireInteraction: true, // Keep failure notifications visible
    });
  }

  async showSystemNotification(title: string, message: string): Promise<Notification | null> {
    return this.showNotification({
      title: `🔔 ${title}`,
      body: message,
      tag: 'system-notification',
      data: { type: 'system', title, message },
      icon: '/icon-192x192.png',
    });
  }
}

// Provide a safe getter so server-side imports don't instantiate the class
export function getBrowserNotifications(): BrowserNotificationManager | null {
  if (typeof window === 'undefined') return null;
  return BrowserNotificationManager.getInstance();
}

// React hook for using browser notifications (safe on server)
import React from 'react';

export function useBrowserNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = React.useState(false);
  const [isPWA, setIsPWA] = React.useState(false);

  React.useEffect(() => {
    const bn = getBrowserNotifications();
    if (!bn) return;
    setIsSupported(bn.isSupported());
    setPermission(bn.getPermission());
    setIsPWA(bn.isPWAMode());
  }, []);

  const requestPermission = React.useCallback(async () => {
    const bn = getBrowserNotifications();
    if (!bn) return 'denied';
    const newPermission = await bn.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const showNotification = React.useCallback((payload: NotificationPayload) => {
    const bn = getBrowserNotifications();
    if (!bn) return Promise.resolve(null as Notification | null);
    return bn.showNotification(payload);
  }, []);

  const showWebhookSuccess = React.useCallback((callbackName: string, statusCode: number, responseTime: number) => {
    const bn = getBrowserNotifications();
    if (!bn) return Promise.resolve(null as Notification | null);
    return bn.showWebhookSuccess(callbackName, statusCode, responseTime);
  }, []);

  const showWebhookFailure = React.useCallback((callbackName: string, statusCode: number, error: string) => {
    const bn = getBrowserNotifications();
    if (!bn) return Promise.resolve(null as Notification | null);
    return bn.showWebhookFailure(callbackName, statusCode, error);
  }, []);

  const showSystemNotification = React.useCallback((title: string, message: string) => {
    const bn = getBrowserNotifications();
    if (!bn) return Promise.resolve(null as Notification | null);
    return bn.showSystemNotification(title, message);
  }, []);

  return {
    permission,
    isSupported,
    isPWA,
    requestPermission,
    showNotification,
    showWebhookSuccess,
    showWebhookFailure,
    showSystemNotification,
  };
}