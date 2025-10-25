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
    Settings,
    CreditCard,
    Bell,
    BellOff,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useRealtimeNotifications } from '@/lib/useRealtimeNotifications';

interface Callback {
    id: string;
    name: string;
    callbackUrl: string;
    activeStatus: boolean;
    triggerToken: string;
    customPath?: string | null;
    createdAt: string;
}

export default function Dashboard() {
    const [callbacks, setCallbacks] = useState<Callback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    // Real-time notifications
    const {
        notifications,
        isConnected,
        error: notificationError,
        clearNotifications,
        markAsRead
    } = useRealtimeNotifications();

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

    const copyTriggerUrl = async (triggerToken: string, customUrl?: string) => {
        const url = customUrl || `${window.location.origin}/api/trigger/token/${triggerToken}`;

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
        <>
            <div className="min-h-screen relative overflow-hidden">
                {/* Liquid AI inspired background - toned down */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100"></div>

                {/* Subtle animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                                <p className="text-gray-600 mt-1">Manage your webhook callbacks</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px] px-4">
                                    <Link href="/dashboard/logs">
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Logs
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px] px-4">
                                    <Link href="/dashboard/analytics">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Analytics
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px] px-4">
                                    <Link href="/billing">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Billing
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px] px-4">
                                    <Link href="/settings">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </Link>
                                </Button>
                                <Button asChild className="min-h-[44px] px-6">
                                    <Link href="/dashboard/add">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Callback
                                    </Link>
                                </Button>
                                <Button variant="outline" onClick={handleLogout} className="border-gray-300 text-gray-700 hover:bg-gray-50 min-h-[44px] px-4">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert className="mb-6 bg-red-50 border-red-200 text-red-800" variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Real-time Notifications */}
                    {notifications.length > 0 && (
                        <Card className="mb-6 bg-blue-50 border-blue-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isConnected ? (
                                            <Wifi className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <WifiOff className="h-4 w-4 text-red-500" />
                                        )}
                                        <CardTitle className="text-sm font-medium text-blue-900">
                                            Real-time Notifications
                                        </CardTitle>
                                        <Badge variant="secondary" className="text-xs">
                                            {notifications.length}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearNotifications}
                                            className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {notifications.slice(0, 5).map((notification, index) => (
                                        <div
                                            key={`${notification.timestamp}-${index}`}
                                            className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                                                notification.type === 'webhook_success'
                                                    ? 'bg-green-50 border border-green-200'
                                                    : notification.type === 'webhook_failure'
                                                    ? 'bg-red-50 border border-red-200'
                                                    : 'bg-gray-50 border border-gray-200'
                                            }`}
                                        >
                                            {notification.type === 'webhook_success' ? (
                                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            ) : notification.type === 'webhook_failure' ? (
                                                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900">{notification.title}</p>
                                                <p className="text-gray-600">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead(notification.timestamp)}
                                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    ))}
                                    {notifications.length > 5 && (
                                        <p className="text-xs text-gray-500 text-center py-2">
                                            +{notifications.length - 5} more notifications
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Connection Status Alert */}
                    {notificationError && (
                        <Alert className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
                            <BellOff className="h-4 w-4" />
                            <AlertDescription>
                                Real-time notifications: {notificationError}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Callbacks</CardTitle>
                                <Webhook className="h-4 w-4 text-gray-500" aria-hidden="true" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900" aria-label={`${callbacks.length} total callbacks`}>
                                    {callbacks.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Active Callbacks</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600" aria-label={`${callbacks.filter(cb => cb.activeStatus).length} active callbacks`}>
                                    {callbacks.filter(cb => cb.activeStatus).length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Inactive Callbacks</CardTitle>
                                <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600" aria-label={`${callbacks.filter(cb => !cb.activeStatus).length} inactive callbacks`}>
                                    {callbacks.filter(cb => !cb.activeStatus).length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Your Callbacks</CardTitle>
                            <CardDescription className="text-gray-600">
                                Manage your webhook endpoints and trigger URLs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {callbacks.length === 0 ? (
                                <div className="text-center py-12">
                                    <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No callbacks yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Get started by creating your first webhook endpoint. WebTrigger will send HTTP requests to your specified URL when triggered.
                                    </p>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                                        <h4 className="font-medium text-blue-900 mb-2">Quick Start Guide</h4>
                                        <ol className="text-sm text-blue-800 space-y-1 text-left">
                                            <li>1. Click &quot;Create Your First Callback&quot; below</li>
                                            <li>2. Enter a name and your webhook URL</li>
                                            <li>3. Copy the trigger URL and use it in your applications</li>
                                            <li>4. Test your webhook to ensure it works</li>
                                        </ol>
                                    </div>

                                    <Button asChild className="min-h-[44px] px-6">
                                        <Link href="/dashboard/add">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Your First Callback
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-4">
                                        {callbacks.map((callback) => (
                                            <Card key={callback.id} className="bg-white/90 backdrop-blur-sm border-gray-200">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-gray-900 truncate" title={callback.name}>
                                                                {callback.name}
                                                            </h3>
                                                            <Badge
                                                                variant={callback.activeStatus ? 'default' : 'secondary'}
                                                                className={`mt-1 ${callback.activeStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                                            >
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
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 min-w-[44px] min-h-[44px]"
                                                                    aria-label={`Actions for ${callback.name}`}
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-white border-gray-200">
                                                                <DropdownMenuItem asChild className="text-gray-700 hover:bg-gray-50">
                                                                    <Link href={`/dashboard/edit/${callback.id}`}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(callback.id)}
                                                                    className="text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <div className="space-y-3 text-sm">
                                                        <div>
                                                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Callback URL</p>
                                                            <p className="text-gray-700 break-all" title={callback.callbackUrl}>
                                                                {callback.callbackUrl}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Trigger URLs</p>
                                                            <div className="space-y-2">
                                                                {/* Token-based URL */}
                                                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                                    <code className="text-xs bg-white px-2 py-1 rounded font-mono text-gray-700 flex-1 min-w-0 break-all">
                                                                        /api/trigger/token/{callback.triggerToken?.substring(0, 8)}...
                                                                    </code>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => copyTriggerUrl(callback.triggerToken)}
                                                                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0 min-w-[44px] min-h-[44px]"
                                                                        aria-label="Copy token-based trigger URL"
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                {/* Custom path URL */}
                                                                {callback.customPath && (
                                                                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                                                                        <code className="text-xs bg-white px-2 py-1 rounded font-mono text-green-700 flex-1 min-w-0 break-all">
                                                                            /api/trigger/custom/{callback.customPath}
                                                                        </code>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => copyTriggerUrl(callback.customPath!, `${window.location.origin}/api/trigger/custom/${callback.customPath}`)}
                                                                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0 min-w-[44px] min-h-[44px]"
                                                                            aria-label="Copy custom path trigger URL"
                                                                        >
                                                                            <Copy className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                                                            <span>Created {new Date(callback.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-gray-200 hover:bg-gray-50">
                                                    <TableHead className="text-gray-600">Name</TableHead>
                                                    <TableHead className="text-gray-600">Status</TableHead>
                                                    <TableHead className="text-gray-600">Callback URL</TableHead>
                                                    <TableHead className="text-gray-600">Trigger URL</TableHead>
                                                    <TableHead className="text-gray-600">Created</TableHead>
                                                    <TableHead className="w-[70px] text-gray-600">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {callbacks.map((callback) => (
                                                    <TableRow key={callback.id} className="border-gray-200 hover:bg-gray-50">
                                                        <TableCell className="text-gray-900">
                                                            <div className="font-medium text-gray-900">
                                                                {callback.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={callback.activeStatus ? 'default' : 'secondary'} className={callback.activeStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
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
                                                        <TableCell className="text-gray-600">
                                                            <div className="max-w-xs">
                                                                <p className="text-sm text-gray-600 truncate" title={callback.callbackUrl}>
                                                                    {callback.callbackUrl}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">
                                                            <div className="space-y-2">
                                                                {/* Token-based URL */}
                                                                <div className="flex items-center gap-2">
                                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                                                                        /api/trigger/token/{callback.triggerToken?.substring(0, 8)}...
                                                                    </code>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => copyTriggerUrl(callback.triggerToken)}
                                                                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                                    >
                                                                        <Copy className="h-3 w-3" />
                                                                    </Button>
                                                                </div>

                                                                {/* Custom path URL */}
                                                                {callback.customPath && (
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="text-xs bg-green-100 px-2 py-1 rounded font-mono text-green-700">
                                                                            /api/trigger/custom/{callback.customPath}
                                                                        </code>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => copyTriggerUrl(callback.customPath!, `${window.location.origin}/api/trigger/custom/${callback.customPath}`)}
                                                                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                                        >
                                                                            <Copy className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">
                                                            <span className="text-sm text-gray-600">
                                                                {new Date(callback.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                                                                    <DropdownMenuItem asChild className="text-gray-700 hover:bg-gray-50">
                                                                        <Link href={`/dashboard/edit/${callback.id}`}>
                                                                            <Edit className="h-4 w-4 mr-2" />
                                                                            Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(callback.id)}
                                                                        className="text-red-600 hover:bg-red-50"
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
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
