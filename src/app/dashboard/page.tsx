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
    CreditCard
} from 'lucide-react';

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
                {/* Liquid AI inspired background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>

                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                                <p className="text-gray-300 mt-1">Manage your webhook callbacks</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                    <Link href="/dashboard/logs">
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Logs
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                    <Link href="/dashboard/analytics">
                                        <Activity className="h-4 w-4 mr-2" />
                                        Analytics
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                    <Link href="/billing">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Billing
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
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
                                <Button variant="outline" onClick={handleLogout} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert className="mb-6 bg-red-900/50 border-red-700 text-red-100" variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                        <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">Total Callbacks</CardTitle>
                                <Webhook className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{callbacks.length}</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">Active Callbacks</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-400">
                                    {callbacks.filter(cb => cb.activeStatus).length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">Inactive Callbacks</CardTitle>
                                <XCircle className="h-4 w-4 text-red-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-400">
                                    {callbacks.filter(cb => !cb.activeStatus).length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">Your Callbacks</CardTitle>
                            <CardDescription className="text-gray-300">
                                Manage your webhook endpoints and trigger URLs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {callbacks.length === 0 ? (
                                <div className="text-center py-12">
                                    <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">No callbacks yet</h3>
                                    <p className="text-gray-300 mb-4">
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
                                        <TableRow className="border-gray-700 hover:bg-white/5">
                                            <TableHead className="text-gray-300">Name</TableHead>
                                            <TableHead className="text-gray-300">Status</TableHead>
                                            <TableHead className="text-gray-300">Callback URL</TableHead>
                                            <TableHead className="text-gray-300">Trigger URL</TableHead>
                                            <TableHead className="text-gray-300">Created</TableHead>
                                            <TableHead className="w-[70px] text-gray-300">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {callbacks.map((callback) => (
                                            <TableRow key={callback.id} className="border-gray-700 hover:bg-white/5">
                                                <TableCell className="text-white">
                                                    <div className="font-medium text-white">
                                                        {callback.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={callback.activeStatus ? 'default' : 'secondary'} className={callback.activeStatus ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
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
                                                <TableCell className="text-gray-300">
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-gray-300 truncate" title={callback.callbackUrl}>
                                                            {callback.callbackUrl}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-300">
                                                    <div className="space-y-2">
                                                        {/* Token-based URL */}
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-gray-300">
                                                                /api/trigger/token/{callback.triggerToken?.substring(0, 8)}...
                                                            </code>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => copyTriggerUrl(callback.triggerToken)}
                                                                className="text-gray-400 hover:text-white hover:bg-gray-800"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        {/* Custom path URL */}
                                                        {callback.customPath && (
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-xs bg-green-800 px-2 py-1 rounded font-mono text-green-300">
                                                                    /api/trigger/custom/{callback.customPath}
                                                                </code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyTriggerUrl(callback.customPath!, `${window.location.origin}/api/trigger/custom/${callback.customPath}`)}
                                                                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-300">
                                                    <span className="text-sm text-gray-300">
                                                        {new Date(callback.createdAt).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                                            <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700">
                                                                <Link href={`/dashboard/edit/${callback.id}`}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(callback.id)}
                                                                className="text-red-400 hover:bg-red-900/50"
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
        </>
    );
}
