import { useEffect, useRef, useState, useCallback } from 'react';

export interface RealtimeNotification {
  type: 'webhook_success' | 'webhook_failure' | 'system' | 'connected';
  title: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const eventSource = new EventSource(`/api/notifications/realtime?token=${encodeURIComponent(token)}`);

      eventSource.onopen = () => {
        console.log('Real-time notifications connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const notification: RealtimeNotification = JSON.parse(event.data);

          // Add notification to state
          setNotifications(prev => {
            // Keep only last 50 notifications to prevent memory issues
            const newNotifications = [notification, ...prev].slice(0, 50);
            return newNotifications;
          });

          // Show browser notification if permission granted and not a connection message
          if (notification.type !== 'connected' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: `webtrigger-${notification.type}`,
              data: notification.data,
              requireInteraction: notification.type === 'webhook_failure'
            });
          }
        } catch (parseError) {
          console.error('Failed to parse notification:', parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error('Real-time notifications error:', event);
        setIsConnected(false);
        setError('Connection lost');

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          setError('Failed to reconnect after multiple attempts');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (connectionError) {
      console.error('Failed to create EventSource connection:', connectionError);
      setError('Failed to connect to real-time notifications');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setError(null);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((timestamp: string) => {
    // In a real app, you might want to mark notifications as read on the server
    // For now, we'll just remove them from the local state
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
  }, []);

  useEffect(() => {
    // Auto-connect when component mounts
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const tokenRef = useRef<string | null>(null);

  // Track token changes
  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (currentToken !== tokenRef.current) {
      tokenRef.current = currentToken;
      if (currentToken && !isConnected) {
        connect();
      } else if (!currentToken) {
        disconnect();
      }
    }
  }, [connect, disconnect, isConnected]);

  return {
    notifications,
    isConnected,
    error,
    connect,
    disconnect,
    clearNotifications,
    markAsRead,
  };
}