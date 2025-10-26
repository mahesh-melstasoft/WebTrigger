// Service Worker for WebTrigger PWA
const CACHE_NAME = 'webtrigger-v1.1';
const STATIC_CACHE = 'webtrigger-static-v1.1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            }),
            // Pre-cache the offline page
            caches.open(CACHE_NAME).then((cache) => {
                return cache.add('/offline');
            })
        ]).catch((error) => {
            console.error('Service Worker installation failed:', error);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        }).catch((error) => {
            console.error('Service Worker activation failed:', error);
        })
    );
});

// Fetch event - serve from cache when offline with network-first strategy for API calls
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Network-first strategy for API calls
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache successful API responses for offline use
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached API response if available
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline indicator for API calls
                        return new Response(
                            JSON.stringify({
                                error: 'offline',
                                message: 'You are currently offline. This data may be outdated.'
                            }),
                            {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    });
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((fetchResponse) => {
                    if (fetchResponse.status === 200) {
                        const responseClone = fetchResponse.clone();
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return fetchResponse;
                });
            })
        );
        return;
    }

    // Stale-while-revalidate for pages
    event.respondWith(
        caches.match(event.request).then((response) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Return offline page for navigation requests when offline
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline');
                }
            });

            // Return cached version immediately, then update cache in background
            return response || fetchPromise;
        })
    );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
    console.log('Push received:', event);

    let data = {};
    if (event.data) {
        data = event.data.json();
    }

    // Create rich notification content based on webhook data
    const title = data.title || `Webhook ${data.success ? 'Success' : 'Failed'}`;
    const body = data.body || createNotificationBody(data);
    const icon = '/icon-192x192.png';

    // Basic notification options compatible with Firefox
    const options = {
        body,
        icon,
        data: {
            dateOfArrival: Date.now(),
            callbackId: data.callbackId,
            callbackName: data.callbackName,
            success: data.success,
            url: data.url || '/dashboard',
            ...data.data
        },
        tag: data.tag || `webtrigger-${data.callbackId || 'notification'}`
    };

    // Add Firefox-compatible options
    if ('vibrate' in Notification.prototype) {
        options.vibrate = data.success ? [200, 100, 200] : [500, 200, 500, 200, 500];
    }

    if ('badge' in Notification.prototype) {
        options.badge = '/icon-192x192.png';
    }

    // Add actions if supported (Firefox doesn't support actions)
    if ('actions' in Notification.prototype) {
        options.actions = [
            {
                action: 'view',
                title: 'View Details',
                icon: '/icon-192x192.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ];
        options.requireInteraction = !data.success;
    }

    // Add timestamp to the notification
    if (data.triggeredAt) {
        options.body += `\n${new Date(data.triggeredAt).toLocaleTimeString()}`;
    }

    event.waitUntil(
        self.registration.showNotification(title, options).catch((error) => {
            console.error('Failed to show notification:', error);
            // Fallback to basic notification
            return self.registration.showNotification(title, {
                body: body,
                icon: icon,
                tag: options.tag
            });
        })
    );
});

// Helper function to create notification body from webhook data
function createNotificationBody(data) {
    if (!data.callbackName) return 'You have a new notification from WebTrigger';

    let body = `${data.callbackName}`;

    if (data.statusCode) {
        body += ` - Status: ${data.statusCode}`;
    }

    if (data.responseTime) {
        body += ` (${data.responseTime}ms)`;
    }

    if (data.error) {
        body += `\nError: ${data.error.substring(0, 50)}${data.error.length > 50 ? '...' : ''}`;
    }

    return body;
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click received:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Default action or 'view' action
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const url = event.notification.data?.url || '/dashboard';

            // Check if there's already a window/tab open with the target URL
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }

            // If no suitable window is found, open a new one
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);

    if (event.tag === 'webhook-trigger-sync') {
        event.waitUntil(triggerPendingWebhooks());
    }
});

// Function to handle pending webhooks when back online
async function triggerPendingWebhooks() {
    try {
        // Get pending webhooks from IndexedDB or similar
        // This is a placeholder - implement based on your needs
        console.log('Processing pending webhooks...');

        // Show notification when sync completes
        self.registration.showNotification('WebTrigger', {
            body: 'Pending webhooks have been processed',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
        });
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: '1.0.0' });
    }
});