'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
// useBrowserNotifications is intentionally not used at module load to avoid SSR window access
// import { useBrowserNotifications } from '@/lib/browserNotifications';
import { usePushNotifications } from '@/lib/pushNotifications';
import {
    Smartphone,
    Tablet,
    Monitor,
    Download,
    Bell,
    Zap,
    CheckCircle,
    XCircle,
    Info,
    ExternalLink
} from 'lucide-react';

// Type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAPage() {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    // router is not required here but can be enabled later if navigation is needed
    // const _router = useRouter();

    // Browser notifications (getter used elsewhere) - keep hook for side-effects when needed
    // const _browserNotifications = useBrowserNotifications();

    // Push notifications
    const pushNotifications = usePushNotifications();

    useEffect(() => {
        // Check if app is already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
            }
        };

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        // Check notification permission
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }

        checkInstalled();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
            setIsInstallable(false);
        }

        setDeferredPrompt(null);
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    const sendTestNotification = () => {
        if (notificationPermission === 'granted') {
            new Notification('WebTrigger PWA', {
                body: 'This is a test notification from your installed WebTrigger app!',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'test-notification'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">WebTrigger PWA</h1>
                            <p className="text-gray-600 mt-1">Installable Progressive Web App</p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/dashboard">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Installation Status */}
                <div className="mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Installation Status
                            </CardTitle>
                            <CardDescription>
                                Install WebTrigger as a Progressive Web App for the best experience
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isInstalled ? (
                                <Alert className="bg-green-50 border-green-200 text-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        WebTrigger PWA is installed! You can now use it offline and receive notifications.
                                    </AlertDescription>
                                </Alert>
                            ) : isInstallable ? (
                                <div className="space-y-4">
                                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            WebTrigger can be installed as an app on your device for a native-like experience.
                                        </AlertDescription>
                                    </Alert>
                                    <Button onClick={handleInstall} size="lg" className="w-full sm:w-auto">
                                        <Download className="h-4 w-4 mr-2" />
                                        Install WebTrigger App
                                    </Button>
                                </div>
                            ) : (
                                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Installation prompt will appear when available. Make sure you&apos;re using a supported browser (Chrome, Edge, Safari).
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Browser Notifications */}
                <div className="mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Browser Notifications
                            </CardTitle>
                            <CardDescription>
                                Get notified when your webhooks trigger, even when the app is not open
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Notification Permission</span>
                                    <Badge variant={
                                        notificationPermission === 'granted' ? 'default' :
                                            notificationPermission === 'denied' ? 'destructive' : 'secondary'
                                    }>
                                        {notificationPermission === 'granted' ? 'Granted' :
                                            notificationPermission === 'denied' ? 'Denied' : 'Not Set'}
                                    </Badge>
                                </div>
                                {notificationPermission !== 'granted' && (
                                    <Button onClick={requestNotificationPermission} variant="outline">
                                        Enable Notifications
                                    </Button>
                                )}
                            </div>

                            {notificationPermission === 'granted' && (
                                <div className="pt-4 border-t">
                                    <Button onClick={sendTestNotification} variant="outline">
                                        <Bell className="h-4 w-4 mr-2" />
                                        Send Test Notification
                                    </Button>
                                </div>
                            )}

                            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Browser notifications work best when WebTrigger is installed as a PWA.
                                    You&apos;ll receive notifications for webhook successes and failures.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>

                {/* Push Notifications */}
                <div className="mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Push Notifications
                            </CardTitle>
                            <CardDescription>
                                Receive notifications even when the app is closed (requires PWA installation)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!pushNotifications.isSupported ? (
                                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Push notifications are not supported in this browser. Try Chrome, Edge, or Firefox.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium">Push Notifications</span>
                                            <Badge variant={
                                                pushNotifications.isSubscribed ? 'default' :
                                                    pushNotifications.permission === 'denied' ? 'destructive' : 'secondary'
                                            }>
                                                {pushNotifications.isSubscribed ? 'Enabled' :
                                                    pushNotifications.permission === 'denied' ? 'Blocked' :
                                                        'Not Set'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {pushNotifications.isSubscribed ? (
                                                <Button
                                                    onClick={pushNotifications.disablePushNotifications}
                                                    disabled={pushNotifications.isLoading}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Disable
                                                </Button>
                                            ) : pushNotifications.permission === 'granted' ? (
                                                <Button
                                                    onClick={pushNotifications.enablePushNotifications}
                                                    disabled={pushNotifications.isLoading}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Enable Push
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={pushNotifications.requestPermission}
                                                    disabled={pushNotifications.isLoading}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Request Permission
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {pushNotifications.error && (
                                        <Alert className="bg-red-50 border-red-200 text-red-800">
                                            <XCircle className="h-4 w-4" />
                                            <AlertDescription>{pushNotifications.error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Alert className="bg-green-50 border-green-200 text-green-800">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Push notifications work in the background and can wake up your device.
                                            Perfect for critical webhook monitoring.
                                        </AlertDescription>
                                    </Alert>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Device Compatibility */}
                <div className="mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                        <CardHeader>
                            <CardTitle>Device Compatibility</CardTitle>
                            <CardDescription>
                                WebTrigger PWA works on all modern devices and platforms
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Smartphone className="h-8 w-8 text-blue-500" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Mobile Phones</h3>
                                        <p className="text-sm text-gray-600">iOS & Android</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Tablet className="h-8 w-8 text-green-500" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Tablets</h3>
                                        <p className="text-sm text-gray-600">iPad & Android tablets</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Monitor className="h-8 w-8 text-purple-500" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Desktop/Laptop</h3>
                                        <p className="text-sm text-gray-600">Windows, macOS, Linux</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Features */}
                <div className="mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                PWA Features
                            </CardTitle>
                            <CardDescription>
                                Enhanced capabilities when installed as a Progressive Web App
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Offline Capabilities</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• View cached dashboard data</li>
                                        <li>• Access recent webhook logs</li>
                                        <li>• Use app without internet connection</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Native App Experience</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• App icon on home screen</li>
                                        <li>• Launch from app drawer</li>
                                        <li>• Full-screen experience</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Real-time webhook alerts</li>
                                        <li>• Background notification delivery</li>
                                        <li>• Custom notification sounds</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Performance</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Faster loading times</li>
                                        <li>• Background sync</li>
                                        <li>• Reduced data usage</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="text-center">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg">
                                <Link href="/dashboard">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Go to Dashboard
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/dashboard/add">
                                    <Download className="h-4 w-4 mr-2" />
                                    Add Your First Callback
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}