'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    ArrowLeft,
    Clock,
    Zap,
    CheckCircle,
    AlertCircle,
    Info
} from 'lucide-react';

interface Callback {
    id: string;
    name: string;
    callbackUrl: string;
    cachePeriod: number;
    activeStatus: boolean;
}

interface UserLimits {
    maxCachePeriod: number;
    planName: string;
}

export default function CacheSettings() {
    const [callbacks, setCallbacks] = useState<Callback[]>([]);
    const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchCallbacks();
        fetchUserLimits();
    }, []);

    const fetchCallbacks = async () => {
        try {
            const response = await fetch('/api/callbacks');
            if (response.ok) {
                const data = await response.json();
                setCallbacks(data);
            }
        } catch (error) {
            console.error('Error fetching callbacks:', error);
        }
    };

    const fetchUserLimits = async () => {
        try {
            const response = await fetch('/api/user/limits');
            if (response.ok) {
                const data = await response.json();
                setUserLimits(data);
            }
        } catch (error) {
            console.error('Error fetching user limits:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCachePeriod = async (callbackId: string, cachePeriod: number) => {
        setSaving(callbackId);
        try {
            const response = await fetch(`/api/callbacks/${callbackId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cachePeriod }),
            });

            if (response.ok) {
                await fetchCallbacks();
                setMessage({ type: 'success', text: 'Cache period updated successfully!' });
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Failed to update cache period' });
            }
        } catch (error) {
            console.error('Error updating cache period:', error);
            setMessage({ type: 'error', text: 'Failed to update cache period' });
        } finally {
            setSaving(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const formatCachePeriod = (seconds: number) => {
        if (seconds === 0) return 'No caching';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    const getCachePeriodValue = (seconds: number) => {
        if (seconds === 0) return 0;
        if (seconds <= 60) return seconds;
        if (seconds <= 3600) return 60 + Math.round(seconds / 60);
        return 120 + Math.round(seconds / 3600);
    };

    const getCachePeriodFromValue = (value: number) => {
        if (value === 0) return 0;
        if (value <= 60) return value;
        if (value <= 120) return (value - 60) * 60;
        return (value - 120) * 3600;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" asChild>
                                <Link href="/dashboard">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <div className="flex items-center space-x-2">
                                <Clock className="h-6 w-6 text-blue-600" />
                                <span className="text-xl font-bold text-gray-900">Cache Settings</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* User Limits Info */}
                {userLimits && (
                    <Card className="mb-8 border-blue-200 bg-blue-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                Your Plan Limits
                            </CardTitle>
                            <CardDescription>
                                Current plan: <Badge variant="default">{userLimits.planName}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Maximum Cache Period</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCachePeriod(userLimits.maxCachePeriod)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Cache Benefit</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        Reduces API calls & improves performance
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Message */}
                {message && (
                    <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Cache Settings */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Webhook Cache Settings</h2>
                        <p className="text-gray-600">
                            Configure caching for your webhooks to reduce redundant API calls and improve performance
                        </p>
                    </div>

                    {callbacks.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Webhooks Found</h3>
                                <p className="text-gray-600 mb-4">Create your first webhook to configure cache settings</p>
                                <Button asChild>
                                    <Link href="/dashboard/add">Create Webhook</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {callbacks.map((callback) => (
                                <Card key={callback.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{callback.name}</CardTitle>
                                                <CardDescription className="font-mono text-sm">
                                                    {callback.callbackUrl}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={callback.activeStatus ? "default" : "secondary"}>
                                                    {callback.activeStatus ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <Label className="text-base font-semibold">Cache Period</Label>
                                            <p className="text-sm text-gray-600 mb-4">
                                                How long to cache responses before making new API calls
                                            </p>

                                            <div className="space-y-4">
                                                <Slider
                                                    value={[getCachePeriodValue(callback.cachePeriod)]}
                                                    onValueChange={(value: number[]) => {
                                                        const newCachePeriod = getCachePeriodFromValue(value[0]);
                                                        if (userLimits && newCachePeriod <= userLimits.maxCachePeriod) {
                                                            updateCachePeriod(callback.id, newCachePeriod);
                                                        }
                                                    }}
                                                    max={userLimits ? (userLimits.maxCachePeriod >= 3600 ? 120 + Math.floor(userLimits.maxCachePeriod / 3600) : Math.max(120, userLimits.maxCachePeriod)) : 120}
                                                    min={0}
                                                    step={1}
                                                    className="w-full"
                                                    disabled={saving === callback.id}
                                                />

                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>No caching</span>
                                                    <span className="font-semibold text-blue-600">
                                                        Current: {formatCachePeriod(callback.cachePeriod)}
                                                    </span>
                                                    <span>Max: {userLimits ? formatCachePeriod(userLimits.maxCachePeriod) : 'Unlimited'}</span>
                                                </div>
                                            </div>

                                            {userLimits && callback.cachePeriod > userLimits.maxCachePeriod && (
                                                <Alert className="mt-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Current cache period exceeds your plan limit. Please reduce it to {formatCachePeriod(userLimits.maxCachePeriod)} or below.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <div className="text-sm text-gray-600">
                                                <strong>Cache Impact:</strong> {callback.cachePeriod === 0 ? 'No caching' : `Saves API calls for ${formatCachePeriod(callback.cachePeriod)}`}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={`/dashboard/edit/${callback.id}`}>
                                                    Edit Webhook
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cache Information */}
                <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-600" />
                            How Caching Works
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Reduces redundant API calls
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Improves response times
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Saves on API costs
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Reduces server load
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Best Practices</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Use shorter cache periods for frequently changing data</li>
                                    <li>• Use longer cache periods for static or slowly changing data</li>
                                    <li>• Monitor your API usage to optimize cache settings</li>
                                    <li>• Consider your users&apos; tolerance for stale data</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
