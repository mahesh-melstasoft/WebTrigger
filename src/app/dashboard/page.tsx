'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Plus,
    FileText,
    LogOut,
    MoreHorizontal,
    Edit,
    Trash2,
    Copy,
    CheckCircle,
    XCircle,
    Webhook,
    Activity,
    Settings
} from 'lucide-react';

interface Callback {
    id: string;
    name: string;
    callbackUrl: string;
    activeStatus: boolean;
    triggerToken: string;
    createdAt: string;
}

export default function Dashboard() {
    const [callbacks, setCallbacks] = useState<Callback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            } else {
                setError('Failed to fetch callbacks');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchCallbacks();
    }, [router, fetchCallbacks]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this callback?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/callbacks/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                setCallbacks(callbacks.filter(cb => cb.id !== id));
            } else {
                setError('Failed to delete callback');
            }
        } catch {
            setError('An error occurred');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const copyTriggerUrl = async (triggerToken: string) => {
        const url = `${window.location.origin}/api/trigger/token/${triggerToken}`;

        // Check if clipboard API is available
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(url);
                alert('Trigger URL copied to clipboard!');
            } catch {
                console.error('Failed to copy to clipboard');
                fallbackCopyTextToClipboard(url);
            }
        } else {
            fallbackCopyTextToClipboard(url);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600 mt-1">Manage your webhook callbacks</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button asChild variant="outline">
                                <Link href="/dashboard/logs">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Logs
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/dashboard/analytics">
                                    <Activity className="h-4 w-4 mr-2" />
                                    Analytics
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/settings">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard/add">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Callback
                                </Link>
                            </Button>
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6" variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Callbacks</CardTitle>
                            <Webhook className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{callbacks.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Callbacks</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {callbacks.filter(cb => cb.activeStatus).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Callbacks</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {callbacks.filter(cb => !cb.activeStatus).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Callbacks</CardTitle>
                        <CardDescription>
                            Manage your webhook endpoints and trigger URLs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {callbacks.length === 0 ? (
                            <div className="text-center py-12">
                                <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No callbacks yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Get started by creating your first callback endpoint.
                                </p>
                                <Button asChild>
                                    <Link href="/dashboard/add">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Callback
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Callback URL</TableHead>
                                        <TableHead>Trigger URL</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="w-[70px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {callbacks.map((callback) => (
                                        <TableRow key={callback.id}>
                                            <TableCell>
                                                <div className="font-medium text-gray-900">
                                                    {callback.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={callback.activeStatus ? 'default' : 'secondary'}>
                                                    {callback.activeStatus ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p className="text-sm text-gray-600 truncate" title={callback.callbackUrl}>
                                                        {callback.callbackUrl}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                                        /api/trigger/token/{callback.triggerToken?.substring(0, 8)}...
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyTriggerUrl(callback.triggerToken)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(callback.createdAt).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/edit/${callback.id}`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(callback.id)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
