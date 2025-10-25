'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, Users, Activity, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AdminAnalytics {
    overview: {
        totalUsers: number;
        activeUsers: number;
        totalCallbacks: number;
        activeCallbacks: number;
        totalTriggers: number;
        successCount: number;
        failureCount: number;
        successRate: string;
        avgResponseTime: number;
    };
    subscriptionStats: Array<{ role: string; _count: { id: number } }>;
    httpMethodStats: Array<{ httpMethod: string; _count: { id: number } }>;
    actionTypeStats: Array<{ type: string; _count: { id: number } }>;
    period: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#a4de6c'];

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AdminAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('7d');
    const router = useRouter();

    const fetchAdminAnalytics = useCallback(async (selectedPeriod: string) => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const analyticsData = await response.json();
                setData(analyticsData);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            } else if (response.status === 403) {
                setError('Access Denied - Admin privileges required');
            } else {
                setError('Failed to fetch admin analytics');
            }
        } catch {
            setError('An error occurred while fetching analytics');
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
        fetchAdminAnalytics(period);
    }, [router, fetchAdminAnalytics, period]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
                    <p className="text-gray-600">Loading admin analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="h-8 w-8 text-purple-600" />
                                Admin Analytics Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">System-wide monitoring and insights</p>
                        </div>

                        <Select value={period} onValueChange={(val) => { setPeriod(val); fetchAdminAnalytics(val); }}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {error && (
                    <Alert className="mb-6" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {data && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
                                    <p className="text-xs text-muted-foreground">{data.overview.activeUsers} active</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Callbacks</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.overview.totalCallbacks}</div>
                                    <p className="text-xs text-muted-foreground">{data.overview.activeCallbacks} active</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.overview.totalTriggers}</div>
                                    <p className="text-xs text-muted-foreground">in selected period</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.overview.successRate}%</div>
                                    <p className="text-xs text-muted-foreground">{data.overview.successCount} succeeded</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{Math.round(data.overview.avgResponseTime)}ms</div>
                                    <p className="text-xs text-muted-foreground">average time</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>User Roles</CardTitle>
                                    <CardDescription>Distribution of user subscription tiers</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={data.subscriptionStats.map(s => ({ name: s.role, value: s._count.id }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {data.subscriptionStats.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>HTTP Methods</CardTitle>
                                    <CardDescription>Distribution of HTTP methods used</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={data.httpMethodStats.map(s => ({ method: s.httpMethod, count: s._count.id }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="method" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Action Types</CardTitle>
                                    <CardDescription>Distribution of action types configured</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={data.actionTypeStats.map(s => ({ type: s.type, count: s._count.id }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#ffc658" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
