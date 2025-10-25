'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    CreditCard,
    Crown,
    Zap,
    Star,
    CheckCircle,
    AlertCircle,
    Calendar,
    DollarSign,
    TrendingUp,
} from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: string;
    maxTriggers: number;
    features: string[];
    isActive: boolean;
}

interface Subscription {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    stripeSubscriptionId?: string | null;
    plan: {
        id: string;
        name: string;
        description: string;
        price: number;
        interval: string;
        maxTriggers: number;
        features: string[];
    };
}

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const fetchBillingData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            // Fetch user data (removed unused user state)
            const userResponse = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }

            // Fetch subscription data
            const subResponse = await fetch('/api/subscription', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (subResponse.ok) {
                const subData = await subResponse.json();
                setSubscription(subData);
            }

            // Fetch available plans
            const plansResponse = await fetch('/api/plans');
            if (plansResponse.ok) {
                const plansData = await plansResponse.json();
                setPlans(plansData);
            }
        } catch (err) {
            console.error('Error fetching billing data:', err);
            setError('Failed to load billing information');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchBillingData();
    }, [fetchBillingData]);

    const handleSubscribe = async (planId: string) => {
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');

            // Check if user already has a subscription
            if (subscription && subscription.stripeSubscriptionId) {
                // User has an existing subscription - upgrade/downgrade
                const response = await fetch('/api/subscription/upgrade', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ newPlanId: planId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setSuccess(data.message || 'Subscription updated successfully!');
                    // Refresh data
                    setTimeout(() => fetchBillingData(), 1000);
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to update subscription');
                }
            } else {
                // New subscription - use Stripe checkout
                const response = await fetch('/api/payments/create-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        planId,
                        successUrl: `${window.location.origin}/billing?success=true`,
                        cancelUrl: `${window.location.origin}/billing?canceled=true`,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    window.location.href = data.url;
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to create payment session');
                }
            }
        } catch (err) {
            console.error('Error processing subscription:', err);
            setError('An error occurred while processing your request');
        }
    };

    const handleManageBilling = async () => {
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/payments/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    returnUrl: `${window.location.origin}/billing`,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = data.url;
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create customer portal session');
            }
        } catch (err) {
            console.error('Error creating customer portal session:', err);
            setError('An error occurred while accessing billing portal');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'PAST_DUE':
                return 'bg-red-100 text-red-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <CheckCircle className="h-4 w-4" />;
            case 'PAST_DUE':
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <CreditCard className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading billing information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
                    <p className="text-gray-600 mt-1">Manage your subscription and payment methods</p>
                </div>

                {(error || success) && (
                    <Alert className={`mb-6 ${error ? 'variant="destructive"' : ''}`}>
                        {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        <AlertDescription>{error || success}</AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="plans">Plans</TabsTrigger>
                        <TabsTrigger value="history">Billing History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Current Subscription */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Current Subscription
                                </CardTitle>
                                <CardDescription>
                                    Your current plan and billing information
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {subscription ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold">{subscription.plan.name}</h3>
                                                <p className="text-gray-600">{subscription.plan.description}</p>
                                            </div>
                                            <Badge className={getStatusColor(subscription.status)}>
                                                {getStatusIcon(subscription.status)}
                                                {subscription.status}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Price:</span>
                                                <span className="font-semibold">
                                                    ${subscription.plan.price}/{subscription.plan.interval}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Triggers:</span>
                                                <span className="font-semibold">
                                                    {subscription.plan.maxTriggers === -1 ? 'Unlimited' : subscription.plan.maxTriggers}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">Next billing:</span>
                                                <span className="font-semibold">
                                                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <Button onClick={handleManageBilling} variant="outline">
                                                Manage Billing & Payment Methods
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                                        <p className="text-gray-600 mb-4">
                                            You&apos;re currently on the free plan. Upgrade to unlock more features.
                                        </p>
                                        <Button asChild>
                                            <Link href="#plans">View Plans</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Usage Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Usage Statistics
                                </CardTitle>
                                <CardDescription>
                                    Your current usage for this billing period
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">0</div>
                                        <div className="text-sm text-gray-600">Triggers Used</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            of {subscription?.plan.maxTriggers === -1 ? '∞' : subscription?.plan.maxTriggers || 5}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">0</div>
                                        <div className="text-sm text-gray-600">Success Rate</div>
                                        <div className="text-xs text-gray-500 mt-1">This month</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">0</div>
                                        <div className="text-sm text-gray-600">Active Webhooks</div>
                                        <div className="text-xs text-gray-500 mt-1">Currently running</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="plans" className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                            <p className="text-gray-600">Select the perfect plan for your webhook management needs</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {plans.map((plan) => {
                                const isCurrentPlan = subscription?.plan.id === plan.id;
                                const isPopular = plan.name === 'Pro'; // Mark Pro as popular

                                return (
                                    <Card key={plan.id} className={`relative ${isPopular ? 'border-purple-500 shadow-xl scale-105' : ''}`}>
                                        {isPopular && (
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                                <Badge className="bg-purple-500 text-white px-4 py-1">Most Popular</Badge>
                                            </div>
                                        )}

                                        <CardHeader className="text-center pb-8">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                                {plan.name === 'Starter' && <Zap className="h-6 w-6 text-gray-600" />}
                                                {plan.name === 'Pro' && <Star className="h-6 w-6 text-gray-600" />}
                                                {plan.name === 'Admin' && <Crown className="h-6 w-6 text-gray-600" />}
                                            </div>
                                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                            <div className="mt-4">
                                                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                                                <span className="text-gray-600">/{plan.interval}</span>
                                            </div>
                                            <CardDescription className="mt-2">{plan.maxTriggers === -1 ? 'Unlimited triggers' : `${plan.maxTriggers} triggers per month`}</CardDescription>
                                        </CardHeader>

                                        <CardContent>
                                            <ul className="space-y-3 mb-8">
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center space-x-3">
                                                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                        <span className="text-gray-600">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {isCurrentPlan ? (
                                                <Button className="w-full" disabled>
                                                    Current Plan
                                                </Button>
                                            ) : (
                                                <Button
                                                    className={`w-full ${isPopular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                                    variant={isPopular ? 'default' : 'outline'}
                                                    onClick={() => handleSubscribe(plan.id)}
                                                >
                                                    {subscription ? (
                                                        plan.price > subscription.plan.price ? 'Upgrade' : 'Downgrade'
                                                    ) : 'Subscribe'}
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Billing History
                                </CardTitle>
                                <CardDescription>
                                    View your past invoices and payments
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12">
                                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Billing History</h3>
                                    <p className="text-gray-600 mb-4">
                                        Your billing history will appear here once you have an active subscription.
                                    </p>
                                    {subscription && (
                                        <Button onClick={handleManageBilling} variant="outline">
                                            View Invoices
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
