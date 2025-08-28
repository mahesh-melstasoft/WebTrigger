'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Activity, AlertCircle, CheckCircle, Clock, Globe, Code } from 'lucide-react';

interface LogDetails {
    id: string;
    event: string;
    details: string | null;
    createdAt: string;
    responseTime: number | null;
    statusCode: number | null;
    callback: {
        id: string;
        name: string;
        callbackUrl: string;
        timeoutDuration: number;
        activeStatus: boolean;
    };
}

export default function LogDetailsPage() {
    const [log, setLog] = useState<LogDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const params = useParams();
    const logId = params.id as string;

    useEffect(() => {
        const fetchLogDetails = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const response = await fetch(`/api/logs/${logId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setLog(data);
                } else if (response.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/login');
                } else if (response.status === 404) {
                    setError('Log entry not found');
                } else {
                    setError('Failed to fetch log details');
                }
            } catch {
                setError('An error occurred while fetching log details');
            } finally {
                setLoading(false);
            }
        };

        if (logId) {
            fetchLogDetails();
        }
    }, [logId, router]);

    const getEventIcon = (event: string) => {
        if (event.includes('triggered')) return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (event.includes('failed')) return <AlertCircle className="h-5 w-5 text-red-500" />;
        return <Activity className="h-5 w-5 text-blue-500" />;
    };

    const getEventBadgeVariant = (event: string) => {
        if (event.includes('triggered')) return 'default';
        if (event.includes('failed')) return 'destructive';
        return 'secondary';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading log details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/logs')}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Logs
                    </Button>

                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    if (!log) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/logs')}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Logs
                    </Button>

                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Log not found</h3>
                        <p className="text-gray-600">The requested log entry could not be found.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/logs')}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Logs
                    </Button>

                    <h1 className="text-3xl font-bold text-gray-900">Log Details</h1>
                    <p className="text-gray-600 mt-1">Detailed information about this callback execution</p>
                </div>

                <div className="space-y-6">
                    {/* Event Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {getEventIcon(log.event)}
                                Event Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Event Type</label>
                                    <div className="mt-1">
                                        <Badge variant={getEventBadgeVariant(log.event)} className="text-sm">
                                            {log.event}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Timestamp</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {log.responseTime && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Response Time</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span className={`text-sm font-medium ${log.responseTime < 1000 ? 'text-green-600' :
                                                    log.responseTime < 5000 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {log.responseTime}ms
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {log.statusCode && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Status Code</label>
                                        <div className="mt-1">
                                            <Badge variant={log.statusCode >= 200 && log.statusCode < 300 ? 'default' : 'destructive'}>
                                                {log.statusCode}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Callback Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Callback Information
                            </CardTitle>
                            <CardDescription>
                                Details about the callback that generated this log
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Callback Name</label>
                                    <div className="mt-1">
                                        <span className="text-sm text-gray-900 font-medium">{log.callback.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={log.callback.activeStatus ? 'default' : 'secondary'}>
                                            {log.callback.activeStatus ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Callback URL</label>
                                    <div className="mt-1">
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                                            {log.callback.callbackUrl}
                                        </code>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Timeout Duration</label>
                                    <div className="mt-1">
                                        <span className="text-sm text-gray-900">
                                            {log.callback.timeoutDuration}ms
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Callback ID</label>
                                    <div className="mt-1">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {log.callback.id}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Log Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                Execution Details
                            </CardTitle>
                            <CardDescription>
                                Detailed information about the callback execution
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {log.details ? (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <pre className="text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">
                                        {log.details}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No additional details available for this log entry.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Log ID */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Log ID</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                                {log.id}
                            </code>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
