'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Webhook, Globe, Copy, ExternalLink } from 'lucide-react';

interface Callback {
    id: string;
    name: string;
    callbackUrl: string;
    activeStatus: boolean;
    triggerToken: string;
    customPath?: string | null;
}

export default function EditCallback() {
    const [name, setName] = useState('');
    const [callbackUrl, setCallbackUrl] = useState('');
    const [activeStatus, setActiveStatus] = useState(true);
    const [triggerToken, setTriggerToken] = useState('');
    const [customPath, setCustomPath] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const router = useRouter();
    const params = useParams();

    // Get the id from params asynchronously
    const [id, setId] = useState<string>('');

    const fetchCallback = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/callbacks/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const callback: Callback = await response.json();
                setName(callback.name);
                setCallbackUrl(callback.callbackUrl);
                setActiveStatus(callback.activeStatus);
                setTriggerToken(callback.triggerToken);
                setCustomPath(callback.customPath || '');
            } else {
                setError('Failed to fetch callback');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setFetchLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id as string);
        };
        getParams();
    }, [params]);

    useEffect(() => {
        if (id) {
            fetchCallback();
        }
    }, [id, fetchCallback]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/callbacks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, callbackUrl, activeStatus, customPath: customPath || undefined }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/dashboard');
            } else {
                setError(data.error);
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyTriggerUrl = async (url?: string) => {
        const triggerUrl = url || `${window.location.origin}/api/trigger/token/${triggerToken}`;

        // Check if clipboard API is available
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(triggerUrl);
                alert('Trigger URL copied to clipboard!');
            } catch {
                console.error('Failed to copy to clipboard');
                fallbackCopyTextToClipboard(triggerUrl);
            }
        } else {
            fallbackCopyTextToClipboard(triggerUrl);
        }
    };

    const fallbackCopyTextToClipboard = (text: string) => {
        // Fallback method for copying text
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert('Trigger URL copied to clipboard!');
            } else {
                alert('Failed to copy URL. Please copy manually: ' + text);
            }
        } catch {
            console.error('Fallback copy failed');
            alert('Failed to copy URL. Please copy manually: ' + text);
        }

        document.body.removeChild(textArea);
    };

    if (fetchLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading callback...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex items-center gap-3">
                        <Webhook className="h-8 w-8 text-blue-500" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Callback</h1>
                            <p className="text-gray-600 mt-1">Update your webhook endpoint configuration</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Callback Details</CardTitle>
                        <CardDescription>
                            Modify your webhook endpoint settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter a name for your callback"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="callbackUrl">Callback URL</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="callbackUrl"
                                        type="url"
                                        placeholder="https://your-app.com/webhook"
                                        value={callbackUrl}
                                        onChange={(e) => setCallbackUrl(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customPath">Custom Trigger Path (Optional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-sm text-gray-500">/</span>
                                    <Input
                                        id="customPath"
                                        type="text"
                                        placeholder="my-custom-trigger"
                                        value={customPath}
                                        onChange={(e) => setCustomPath(e.target.value)}
                                        className="pl-8"
                                        pattern="^[a-zA-Z0-9_-]*$"
                                        title="Only letters, numbers, hyphens, and underscores allowed"
                                    />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Create a custom URL path to trigger this webhook. Leave empty to use only the token-based URL.
                                </p>
                            </div>

                            {triggerToken && (
                                <div className="space-y-4">
                                    <Label>Trigger URLs</Label>

                                    {/* Token-based URL */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Token-based URL:</p>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
                                            <ExternalLink className="h-4 w-4 text-gray-400" />
                                            <code className="text-sm text-gray-700 font-mono flex-1">
                                                {window.location.origin}/api/trigger/token/{triggerToken}
                                            </code>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyTriggerUrl(`${window.location.origin}/api/trigger/token/${triggerToken}`)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Custom path URL */}
                                    {customPath && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Custom Path URL:</p>
                                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-200">
                                                <ExternalLink className="h-4 w-4 text-green-400" />
                                                <code className="text-sm text-green-700 font-mono flex-1">
                                                    {window.location.origin}/api/trigger/custom/{customPath}
                                                </code>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyTriggerUrl(`${window.location.origin}/api/trigger/custom/${customPath}`)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500">
                                        These are the public URLs that can trigger your callback
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="activeStatus"
                                    checked={activeStatus}
                                    onCheckedChange={(checked: boolean) => setActiveStatus(checked)}
                                />
                                <Label htmlFor="activeStatus" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Active - Allow this callback to be triggered
                                </Label>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating callback...
                                    </>
                                ) : (
                                    'Update Callback'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
