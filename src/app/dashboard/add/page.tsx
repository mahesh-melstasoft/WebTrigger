'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Webhook, Globe } from 'lucide-react';

export default function AddCallback() {
    const [name, setName] = useState('');
    const [callbackUrl, setCallbackUrl] = useState('');
    const [activeStatus, setActiveStatus] = useState(true);
    const [customPath, setCustomPath] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/callbacks', {
                method: 'POST',
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
                            <h1 className="text-3xl font-bold text-gray-900">Add Callback</h1>
                            <p className="text-gray-600 mt-1">Create a new webhook endpoint</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Callback Details</CardTitle>
                        <CardDescription>
                            Configure your webhook endpoint that will be triggered by the public URL
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
                                    className="min-h-[44px]"
                                    aria-describedby="name-help"
                                />
                                <p id="name-help" className="text-sm text-gray-500">
                                    Choose a descriptive name to easily identify this webhook
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="callbackUrl">Callback URL</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                                    <Input
                                        id="callbackUrl"
                                        type="url"
                                        placeholder="https://your-app.com/webhook"
                                        value={callbackUrl}
                                        onChange={(e) => setCallbackUrl(e.target.value)}
                                        className="pl-10 min-h-[44px]"
                                        required
                                        aria-describedby="callback-url-help"
                                    />
                                </div>
                                    <p className="text-sm text-gray-500">
                                        The URL where WebTrigger will send webhook payloads when triggered
                                    </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customPath">Custom Trigger Path (Optional)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-sm text-gray-500" aria-hidden="true">/</span>
                                    <Input
                                        id="customPath"
                                        type="text"
                                        placeholder="my-custom-trigger"
                                        value={customPath}
                                        onChange={(e) => setCustomPath(e.target.value)}
                                        className="pl-8 min-h-[44px]"
                                        pattern="^[a-zA-Z0-9_-]*$"
                                        title="Only letters, numbers, hyphens, and underscores allowed"
                                        aria-describedby="custom-path-help"
                                    />
                                </div>
                                <p id="custom-path-help" className="text-sm text-gray-500">
                                    Create a custom URL path to trigger this webhook. Leave empty to use the default token-based URL.
                                </p>
                                {customPath && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="text-sm text-blue-800 font-medium mb-1">Your custom URL will be:</p>
                                        <code className="text-sm bg-white px-2 py-1 rounded font-mono text-blue-700 break-all">
                                            {window.location.origin}/api/trigger/custom/{customPath}
                                        </code>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                                <Checkbox
                                    id="activeStatus"
                                    checked={activeStatus}
                                    onCheckedChange={(checked: boolean) => setActiveStatus(checked)}
                                    className="min-w-[20px] min-h-[20px]"
                                />
                                <div className="flex-1">
                                    <Label htmlFor="activeStatus" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Active - Allow this callback to be triggered
                                    </Label>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Inactive callbacks won&apos;t receive webhook payloads
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full min-h-[44px] px-6" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating callback...
                                    </>
                                ) : (
                                    'Create Callback'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
