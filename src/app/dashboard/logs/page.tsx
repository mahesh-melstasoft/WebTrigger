'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Filter, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface Log {
    id: string;
    event: string;
    details: string | null;
    createdAt: string;
    callback: { name: string; id: string };
}

interface Callback {
    id: string;
    name: string;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [callbacks, setCallbacks] = useState<Callback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCallback, setSelectedCallback] = useState<string>('all');
    const router = useRouter();

    const fetchCallbacks = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/callbacks', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setCallbacks(data);
            }
        } catch {
            console.error('Failed to fetch callbacks');
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const url = selectedCallback === 'all'
                ? '/api/logs'
                : `/api/logs?callbackId=${selectedCallback}`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            } else {
                setError('Failed to fetch logs');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    }, [selectedCallback, router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchCallbacks();
        fetchLogs();
    }, [router, fetchCallbacks, fetchLogs]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getEventIcon = (event: string) => {
        if (event.includes('triggered')) return <CheckCircle className="h-4 w-4 text-green-500" />;
        if (event.includes('failed')) return <AlertCircle className="h-4 w-4 text-red-500" />;
        return <Activity className="h-4 w-4 text-blue-500" />;
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
                    <p className="text-gray-600">Loading logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
                            <p className="text-gray-600 mt-1">Monitor all callback executions and events</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <Select value={selectedCallback} onValueChange={setSelectedCallback}>
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Filter by callback" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Callbacks</SelectItem>
                                    {callbacks.map((callback) => (
                                        <SelectItem key={callback.id} value={callback.id}>
                                            {callback.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>
                            {selectedCallback === 'all'
                                ? `Showing all ${logs.length} log entries`
                                : `Showing logs for selected callback (${logs.length} entries)`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                                <p className="text-gray-600">
                                    {selectedCallback === 'all'
                                        ? 'No callback executions have been logged yet.'
                                        : 'No logs found for the selected callback.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Callback</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => router.push(`/dashboard/logs/${log.id}`)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getEventIcon(log.event)}
                                                    <Badge variant={getEventBadgeVariant(log.event)}>
                                                        {log.event}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-gray-900">
                                                    {log.callback.name}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    {log.details ? (
                                                        <p className="text-sm text-gray-600 truncate" title={log.details}>
                                                            {log.details}
                                                        </p>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No details</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
