'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, BarChart3, TrendingUp, Clock, Activity, AlertCircle } from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
    triggersOverTime: Array<{ date: string; count: number }>;
    triggersByCallback: Array<{ name: string; count: number }>;
    successFailureData: Array<{ status: string; count: number }>;
    timeoutDistribution: Array<{ timeout: number; count: number }>;
    hourlyActivity: Array<{ hour: number; count: number }>;
    recentActivity: Array<{
        id: string;
        event: string;
        callbackName: string;
        createdAt: string;
    }>;
    period: string;
    totalCallbacks: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('7d');
    const router = useRouter();

    const fetchAnalytics = useCallback(async (selectedPeriod: string) => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/analytics?period=${selectedPeriod}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const analyticsData = await response.json();
                setData(analyticsData);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            } else {
                setError('Failed to fetch analytics data');
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
        fetchAnalytics(period);
    }, [router, fetchAnalytics, period]);

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
        fetchAnalytics(newPeriod);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading analytics...</p>
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
                            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                            <p className="text-gray-600 mt-1">Visual insights into your webhook performance</p>
                        </div>

                        <Select value={period} onValueChange={handlePeriodChange}>
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
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {data.triggersOverTime.reduce((sum, item) => sum + Number(item.count), 0)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        in selected period
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Callbacks</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.totalCallbacks}</div>
                                    <p className="text-xs text-muted-foreground">
                                        configured callbacks
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {data.successFailureData.length > 0
                                            ? Math.round(
                                                (Number(data.successFailureData.find(d => d.status === 'Success')?.count || 0) /
                                                    data.successFailureData.reduce((sum, d) => sum + Number(d.count), 0)) * 100
                                            )
                                            : 0}%
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        success rate
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {data.triggersOverTime.length > 0
                                            ? Math.round(
                                                data.triggersOverTime.reduce((sum, item) => sum + Number(item.count), 0) /
                                                data.triggersOverTime.length
                                            )
                                            : 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        triggers per day
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Triggers Over Time */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Triggers Over Time</CardTitle>
                                    <CardDescription>Daily trigger count for the selected period</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={data.triggersOverTime.map(item => ({
                                            ...item,
                                            date: new Date(item.date).toLocaleDateString(),
                                            count: Number(item.count)
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.6}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Triggers by Callback */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Triggers by Callback</CardTitle>
                                    <CardDescription>Distribution of triggers across your callbacks</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data.triggersByCallback}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Success/Failure Pie Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Success vs Failure</CardTitle>
                                    <CardDescription>Overall success rate distribution</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={data.successFailureData.map((item) => ({
                                                    ...item,
                                                    count: Number(item.count)
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ status, percent }) => `${status} ${((percent || 0) * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {data.successFailureData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Hourly Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hourly Activity</CardTitle>
                                    <CardDescription>Trigger activity by hour of day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={data.hourlyActivity.map(item => ({
                                            hour: `${item.hour}:00`,
                                            count: Number(item.count)
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="hour" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#ffc658"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Timeout Distribution */}
                        {data.timeoutDistribution.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Timeout Distribution</CardTitle>
                                    <CardDescription>Distribution of timeout settings across your callbacks</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data.timeoutDistribution.map(item => ({
                                            timeout: `${item.timeout}ms`,
                                            count: item.count
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="timeout" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#ff7c7c" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest callback executions (last 24 hours)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.recentActivity.length > 0 ? (
                                        data.recentActivity.map((activity) => (
                                            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Activity className="h-4 w-4 text-blue-500" />
                                                    <div>
                                                        <p className="text-sm font-medium">{activity.callbackName}</p>
                                                        <p className="text-xs text-gray-600">{activity.event}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(activity.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500 py-4">No recent activity</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
