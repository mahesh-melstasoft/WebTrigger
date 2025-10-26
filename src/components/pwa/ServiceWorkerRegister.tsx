'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        // Only register service worker if supported and not already registered
        if ('serviceWorker' in navigator) {
            // Check if service worker is already registered
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                const existingRegistration = registrations.find(reg => reg.scope === `${window.location.origin}/`);

                if (!existingRegistration) {
                    // Register service worker for PWA functionality
                    navigator.serviceWorker.register('/sw.js', {
                        scope: '/'
                    }).then((registration) => {
                        console.log('Service Worker registered successfully:', registration.scope);

                        // Handle service worker updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New service worker available, you could show a notification here
                                        console.log('New service worker available, consider refreshing the page');
                                    }
                                });
                            }
                        });
                    }).catch((error) => {
                        console.error('Service Worker registration failed:', error);
                    });
                } else {
                    console.log('Service Worker already registered:', existingRegistration.scope);
                }
            }).catch((error) => {
                console.error('Error checking service worker registrations:', error);
            });
        }
    }, []);

    return null; // This component doesn't render anything
}