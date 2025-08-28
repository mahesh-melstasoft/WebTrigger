'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Shield,
    Clock,
    Activity,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Calendar,
    Zap
} from 'lucide-react';

interface RateLimit {
    id: string;
    planId: string;
    plan: {
        name: string;
        price: number;
    };
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerMonth: number;
    isActive: boolean;
}

interface UsageStats {
    totalRequests: number;
    requestsToday: number;
    requestsThisMonth: number;
    averageResponseTime: number;
    successRate: number;
    topCallbacks: Array<{
        id: string;
        name: string;
        requestCount: number;
    }>;
}

export default function AdminRateLimits() {
    const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingLimit, setEditingLimit] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        requestsPerSecond: 1,
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerMonth: 10000
    });

    useEffect(() => {
        fetchRateLimits();
        fetchUsageStats();
    }, []);

    const fetchRateLimits = async () => {
        try {
            const response = await fetch('/api/admin/rate-limits');
            if (response.ok) {
                const data = await response.json();
                setRateLimits(data);
            }
        } catch (error) {
            console.error('Error fetching rate limits:', error);
        }
    };

    const fetchUsageStats = async () => {
        try {
            const response = await fetch('/api/admin/usage-stats');
            if (response.ok) {
                const data = await response.json();
                setUsageStats(data);
            }
        } catch (error) {
            console.error('Error fetching usage stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateRateLimit = async (limitId: string) => {
        try {
            const response = await fetch(`/api/admin/rate-limits/${limitId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await fetchRateLimits();
                setEditingLimit(null);
            }
        } catch (error) {
            console.error('Error updating rate limit:', error);
        }
    };

    const toggleRateLimit = async (limitId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/admin/rate-limits/${limitId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive }),
            });

            if (response.ok) {
                await fetchRateLimits();
            }
        } catch (error) {
            console.error('Error toggling rate limit:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" asChild>
                                <Link href="/dashboard">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <div className="flex items-center space-x-2">
                                <Shield className="h-6 w-6 text-blue-600" />
                                <span className="text-xl font-bold text-gray-900">Rate Limiting & Analytics</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <Tabs defaultValue="limits" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="limits">Rate Limits</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="limits" className="space-y-8">
                        {/* Usage Overview */}
                        {usageStats && (
                            <div className="grid md:grid-cols-4 gap-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">All time</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Today</CardTitle>
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{usageStats.requestsToday.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">Requests today</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{usageStats.averageResponseTime}ms</div>
                                        <p className="text-xs text-muted-foreground">Average time</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{usageStats.successRate}%</div>
                                        <p className="text-xs text-muted-foreground">Success rate</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Rate Limits Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Rate Limits by Plan</CardTitle>
                                <CardDescription>
                                    Configure rate limits for each subscription plan
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {rateLimits.map((limit) => (
                                        <div key={limit.id} className="border rounded-lg p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{limit.plan.name}</h3>
                                                    <p className="text-sm text-gray-600">${limit.plan.price}/month</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={limit.isActive ? "default" : "secondary"}>
                                                        {limit.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toggleRateLimit(limit.id, !limit.isActive)}
                                                    >
                                                        {limit.isActive ? "Disable" : "Enable"}
                                                    </Button>
                                                </div>
                                            </div>

                                            {editingLimit === limit.id ? (
                                                <div className="grid md:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="rps">Requests/Second</Label>
                                                        <Input
                                                            id="rps"
                                                            type="number"
                                                            value={formData.requestsPerSecond}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, requestsPerSecond: parseInt(e.target.value) }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="rpm">Requests/Minute</Label>
                                                        <Input
                                                            id="rpm"
                                                            type="number"
                                                            value={formData.requestsPerMinute}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, requestsPerMinute: parseInt(e.target.value) }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="rph">Requests/Hour</Label>
                                                        <Input
                                                            id="rph"
                                                            type="number"
                                                            value={formData.requestsPerHour}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, requestsPerHour: parseInt(e.target.value) }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="rpmo">Requests/Month</Label>
                                                        <Input
                                                            id="rpmo"
                                                            type="number"
                                                            value={formData.requestsPerMonth}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, requestsPerMonth: parseInt(e.target.value) }))}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4 flex gap-2">
                                                        <Button onClick={() => updateRateLimit(limit.id)}>
                                                            Save Changes
                                                        </Button>
                                                        <Button variant="outline" onClick={() => setEditingLimit(null)}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid md:grid-cols-4 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-blue-600">{limit.requestsPerSecond}</div>
                                                        <div className="text-sm text-gray-600">per second</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-blue-600">{limit.requestsPerMinute}</div>
                                                        <div className="text-sm text-gray-600">per minute</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-blue-600">{limit.requestsPerHour}</div>
                                                        <div className="text-sm text-gray-600">per hour</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-blue-600">{limit.requestsPerMonth}</div>
                                                        <div className="text-sm text-gray-600">per month</div>
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingLimit(limit.id);
                                                                setFormData({
                                                                    requestsPerSecond: limit.requestsPerSecond,
                                                                    requestsPerMinute: limit.requestsPerMinute,
                                                                    requestsPerHour: limit.requestsPerHour,
                                                                    requestsPerMonth: limit.requestsPerMonth
                                                                });
                                                            }}
                                                        >
                                                            Edit Limits
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-8">
                        {/* Top Callbacks */}
                        {usageStats?.topCallbacks && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Performing Callbacks</CardTitle>
                                    <CardDescription>
                                        Most active webhooks this month
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {usageStats.topCallbacks.map((callback, index) => (
                                            <div key={callback.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{callback.name}</p>
                                                        <p className="text-sm text-gray-600">Callback ID: {callback.id}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-blue-600">{callback.requestCount.toLocaleString()}</p>
                                                    <p className="text-sm text-gray-600">requests</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* System Health */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        System Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Database</span>
                                            <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>API Response</span>
                                            <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Rate Limiting</span>
                                            <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                        Recent Alerts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">No recent alerts</p>
                                        <p className="text-xs text-gray-500">All systems operating normally</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-blue-500" />
                                        Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Avg Response</span>
                                            <span className="font-semibold">{usageStats?.averageResponseTime || 0}ms</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Success Rate</span>
                                            <span className="font-semibold">{usageStats?.successRate || 0}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Uptime</span>
                                            <span className="font-semibold">99.9%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
