'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw, Home, Settings } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                        <WifiOff className="h-8 w-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl">You&apos;re Offline</CardTitle>
                    <CardDescription>
                        No internet connection detected. Some features may not be available.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Wifi className="h-4 w-4" />
                        <AlertDescription>
                            WebTrigger will automatically sync your data when you&apos;re back online.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Available Offline:</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• View cached dashboard data</li>
                            <li>• Access recent webhook logs</li>
                            <li>• Browse previously loaded pages</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Limited Offline:</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• Creating new webhooks</li>
                            <li>• Real-time notifications</li>
                            <li>• Syncing with server</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-2 pt-4">
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/">
                                    <Home className="h-4 w-4 mr-2" />
                                    Home
                                </Link>
                            </Button>

                            <Button variant="outline" asChild>
                                <Link href="/settings">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="text-center pt-4 border-t">
                        <p className="text-xs text-gray-500">
                            WebTrigger PWA - Smart Webhook Management
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}