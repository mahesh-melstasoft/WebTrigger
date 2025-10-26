// Service Worker for WebTrigger PWA
const CACHE_NAME = 'webtrigger-v1';
const STATIC_CACHE = 'webtrigger-static-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll([
                '/',
                '/manifest.json',
                '/icon-192x192.png',
                '/icon-512x512.png',
            ]);
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
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached version or fetch from network
            return response || fetch(event.request).then((fetchResponse) => {
                // Cache successful responses
                if (fetchResponse.status === 200 && fetchResponse.type === 'basic') {
                    const responseClone = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return fetchResponse;
            }).catch(() => {
                // Return offline fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/');
                }
            });
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

    const options = {
        body: data.body || 'You have a new notification from WebTrigger',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            ...data.data
        },
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icon-192x192.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        tag: data.tag || 'webtrigger-notification'
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'WebTrigger', options)
    );
});

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