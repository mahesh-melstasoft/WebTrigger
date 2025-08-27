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
                body: JSON.stringify({ name, callbackUrl, activeStatus }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/dashboard');
            } else {
                setError(data.error);
            }
        } catch (err) {
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
