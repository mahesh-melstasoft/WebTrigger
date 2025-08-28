'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Save,
    User,
    Settings,
    Crown,
    Zap,
    Star,
    CheckCircle,
    AlertCircle,
    Shield,
    CreditCard,
    QrCode,
    MessageSquare,
} from 'lucide-react';
import Image from 'next/image';

interface UserSettings {
    id: string;
    email: string;
    displayName: string;
    accountType: string;
    appName: string;
    appDescription: string;
    colorPalette: string;
    triggerLimit: number;
    secret?: string | null;
    slackWebhookUrl?: string;
    createdAt: string;
}

const ACCOUNT_TYPES = [
    {
        id: 'free',
        name: 'Free',
        price: '$0/month',
        limits: '5 triggers',
        features: ['Basic webhook triggers', 'Standard logging', 'Community support'],
        color: 'bg-gray-100 text-gray-800',
        icon: User
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '$9/month',
        limits: '50 triggers',
        features: ['Advanced webhook triggers', 'Enhanced logging', 'Email support', 'Custom timeouts'],
        color: 'bg-blue-100 text-blue-800',
        icon: Zap,
        planId: 'cmev2jyjz0000hoe81bz1mm6u' // From seeded database
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29/month',
        limits: '500 triggers',
        features: ['Unlimited webhook triggers', 'Advanced analytics', 'Priority support', 'Custom integrations'],
        color: 'bg-purple-100 text-purple-800',
        icon: Star,
        planId: 'cmev2jyoj0001hoe84vt6h8op' // From seeded database
    },
    {
        id: 'admin',
        name: 'Admin',
        price: 'Custom',
        limits: 'Unlimited',
        features: ['All Pro features', 'User management', 'Admin dashboard', 'Custom reports', 'White-label options'],
        color: 'bg-gold-100 text-gold-800',
        icon: Crown,
        planId: 'cmev2jysg0002hoe8i59phiv9' // From seeded database
    }
];

export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [totpSetup, setTotpSetup] = useState<{
        secret: string;
        qrCode: string;
        otpauth_url: string;
    } | null>(null);
    const [totpToken, setTotpToken] = useState('');
    const [showTotpSetup, setShowTotpSetup] = useState(false);
    const [slackTesting, setSlackTesting] = useState(false);
    const router = useRouter();

    const fetchSettings = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await fetch('/api/settings', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            } else {
                setError('Failed to fetch settings');
            }
        } catch {
            setError('An error occurred while fetching settings');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setSuccess('Settings saved successfully!');
                // Update the document title if app name changed
                if (settings.appName && settings.appName !== 'WebTrigger') {
                    document.title = `${settings.appName} - Settings`;
                }
            } else {
                setError('Failed to save settings');
            }
        } catch {
            setError('An error occurred while saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleAccountTypeChange = (newType: string) => {
        if (!settings) return;

        const accountType = ACCOUNT_TYPES.find(type => type.id === newType);
        if (!accountType) return;

        setSettings({
            ...settings,
            accountType: newType,
            triggerLimit: newType === 'admin' ? -1 : parseInt(accountType.limits.split(' ')[0]) || 5
        });
    };

    const handleTotpToggle = async () => {
        if (!settings) return;

        if (settings.secret) {
            // Disable TOTP
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/auth/totp/setup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ action: 'disable' }),
                });

                if (response.ok) {
                    setSettings({ ...settings, secret: null });
                    setSuccess('TOTP disabled successfully');
                } else {
                    setError('Failed to disable TOTP');
                }
            } catch {
                setError('An error occurred while disabling TOTP');
            }
        } else {
            // Enable TOTP
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/auth/totp/setup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ action: 'enable' }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setTotpSetup(data);
                    setShowTotpSetup(true);
                } else {
                    setError('Failed to setup TOTP');
                }
            } catch {
                setError('An error occurred while setting up TOTP');
            }
        }
    };

    const handleTotpVerify = async () => {
        if (!settings || !totpToken) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/totp/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ token: totpToken, action: 'verify_setup' }),
            });

            if (response.ok) {
                setSettings({ ...settings, secret: totpSetup?.secret });
                setShowTotpSetup(false);
                setTotpSetup(null);
                setTotpToken('');
                setSuccess('TOTP enabled successfully');
            } else {
                setError('Invalid verification code');
            }
        } catch {
            setError('An error occurred while verifying TOTP');
        }
    };

    const handleSlackTest = async () => {
        if (!settings?.slackWebhookUrl) return;

        setSlackTesting(true);
        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/slack/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ webhookUrl: settings.slackWebhookUrl }),
            });

            if (response.ok) {
                setSuccess('Test message sent to Slack successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to send test message to Slack');
            }
        } catch {
            setError('An error occurred while testing Slack webhook');
        } finally {
            setSlackTesting(false);
        }
    };

    const handleUpgrade = async () => {
        if (!settings) return;

        const selectedAccountType = ACCOUNT_TYPES.find(type => type.id === settings.accountType);
        if (!selectedAccountType) return;

        if (settings.accountType === 'free') {
            // Redirect to Stripe checkout for new subscription
            if (!selectedAccountType.planId) {
                setError('Plan ID not found for selected account type');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/payments/create-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        planId: selectedAccountType.planId,
                        successUrl: `${window.location.origin}/settings?success=true`,
                        cancelUrl: `${window.location.origin}/settings?canceled=true`,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    window.location.href = data.url;
                } else {
                    setError('Failed to create payment session');
                }
            } catch {
                setError('An error occurred while processing payment');
            }
        } else {
            // Redirect to Stripe customer portal for existing subscribers
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/payments/create-portal-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        returnUrl: `${window.location.origin}/settings`,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    window.location.href = data.url;
                } else {
                    setError('Failed to create customer portal session');
                }
            } catch {
                setError('An error occurred while accessing billing portal');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings Not Available</h2>
                    <p className="text-gray-600">Unable to load your settings. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Customize your WebTrigger experience</p>
                </div>

                {(error || success) && (
                    <Alert className={`mb-6 ${error ? 'variant="destructive"' : ''}`}>
                        {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        <AlertDescription>{error || success}</AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="app" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="app">App Branding</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="slack">Slack</TabsTrigger>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                    </TabsList>

                    <TabsContent value="app" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    App Customization
                                </CardTitle>
                                <CardDescription>
                                    Customize how your WebTrigger instance appears to you
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4">
                                    <div>
                                        <Label htmlFor="appName">App Name</Label>
                                        <Input
                                            id="appName"
                                            value={settings.appName}
                                            onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                            placeholder="WebTrigger"
                                        />
                                        <p className="text-sm text-gray-600 mt-1">
                                            This will be displayed as your app&apos;s title
                                        </p>
                                    </div>
                                    <div>
                                        <Label htmlFor="appDescription">App Description</Label>
                                        <textarea
                                            id="appDescription"
                                            value={settings.appDescription}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, appDescription: e.target.value })}
                                            placeholder="Smart webhook management made simple"
                                            rows={3}
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <p className="text-sm text-gray-600 mt-1">
                                            Brief description of your app&apos;s purpose
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="account" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Crown className="h-5 w-5" />
                                    Account Type
                                </CardTitle>
                                <CardDescription>
                                    Choose your subscription plan and manage billing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {ACCOUNT_TYPES.map((type) => {
                                        const Icon = type.icon;
                                        const isCurrent = settings.accountType === type.id;
                                        return (
                                            <Card
                                                key={type.id}
                                                className={`cursor-pointer transition-all ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                                                    }`}
                                                onClick={() => handleAccountTypeChange(type.id)}
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <Icon className="h-6 w-6 text-blue-500" />
                                                        {isCurrent && <CheckCircle className="h-5 w-5 text-green-500" />}
                                                    </div>
                                                    <CardTitle className="text-lg">{type.name}</CardTitle>
                                                    <CardDescription className="text-2xl font-bold text-blue-600">
                                                        {type.price}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="space-y-2">
                                                        <Badge variant="secondary" className={type.color}>
                                                            {type.limits}
                                                        </Badge>
                                                        <ul className="text-sm text-gray-600 space-y-1">
                                                            {type.features.map((feature, index) => (
                                                                <li key={index} className="flex items-center gap-2">
                                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                                    {feature}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Current Plan Details</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Trigger Limit:</span>
                                        <Badge variant="outline">
                                            {settings.triggerLimit === -1 ? 'Unlimited' : `${settings.triggerLimit} triggers`}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Two-Factor Authentication
                                </CardTitle>
                                <CardDescription>
                                    Add an extra layer of security to your account with TOTP
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Google Authenticator</h4>
                                        <p className="text-sm text-gray-600">
                                            Use an authenticator app to generate verification codes
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={settings?.secret ? 'default' : 'secondary'}>
                                            {settings?.secret ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTotpToggle()}
                                        >
                                            {settings?.secret ? 'Disable' : 'Enable'}
                                        </Button>
                                    </div>
                                </div>

                                {showTotpSetup && totpSetup && (
                                    <Card className="border-orange-200 bg-orange-50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-orange-800">
                                                <QrCode className="h-5 w-5" />
                                                Setup Instructions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="text-center">
                                                <p className="text-sm text-orange-700 mb-4">
                                                    Scan this QR code with your authenticator app:
                                                </p>
                                                {totpSetup.qrCode ? (
                                                    <Image
                                                        src={totpSetup.qrCode}
                                                        alt="TOTP QR Code"
                                                        width={200}
                                                        height={200}
                                                        className="mx-auto border rounded"
                                                        style={{ maxWidth: '200px', height: 'auto' }}
                                                    />
                                                ) : (
                                                    <div className="mx-auto border rounded bg-gray-100 p-8 text-center">
                                                        <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-500">QR Code</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-white p-3 rounded border font-mono text-sm">
                                                {totpSetup.secret}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="totpToken">Enter verification code:</Label>
                                                <Input
                                                    id="totpToken"
                                                    value={totpToken}
                                                    onChange={(e) => setTotpToken(e.target.value)}
                                                    placeholder="000000"
                                                    maxLength={6}
                                                />
                                                <Button
                                                    onClick={handleTotpVerify}
                                                    disabled={totpToken.length !== 6}
                                                    className="w-full"
                                                >
                                                    Verify & Enable
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Method
                                </CardTitle>
                                <CardDescription>
                                    Manage your payment information and billing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium">Current Plan</h4>
                                            <p className="text-sm text-gray-600">
                                                {ACCOUNT_TYPES.find(type => type.id === settings?.accountType)?.name || 'Free'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleUpgrade}
                                            disabled={settings?.accountType === 'admin'}
                                        >
                                            {settings?.accountType === 'free' ? 'Upgrade' : 'Manage Billing'}
                                        </Button>
                                    </div>

                                    {settings?.accountType !== 'free' && (
                                        <Alert>
                                            <CreditCard className="h-4 w-4" />
                                            <AlertDescription>
                                                Your subscription is managed through Stripe. Click &quot;Manage Billing&quot; to update payment methods or cancel.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="slack" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Slack Notifications
                                </CardTitle>
                                <CardDescription>
                                    Get notified in Slack when your webhooks are triggered
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
                                        <Input
                                            id="slackWebhookUrl"
                                            type="url"
                                            value={settings.slackWebhookUrl || ''}
                                            onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
                                            placeholder="https://hooks.slack.com/services/..."
                                        />
                                        <p className="text-sm text-gray-600 mt-1">
                                            Enter your Slack webhook URL to receive notifications when webhooks are triggered
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 mb-2">How to get a Slack Webhook URL:</h4>
                                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                            <li>Go to <a href="https://slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline">Slack Apps</a></li>
                                            <li>Click &quot;Create New App&quot; → &quot;From scratch&quot;</li>
                                            <li>Name your app and select your workspace</li>
                                            <li>Go to &quot;Incoming Webhooks&quot; and toggle &quot;Activate Incoming Webhooks&quot;</li>
                                            <li>Click &quot;Add New Webhook to Workspace&quot;</li>
                                            <li>Select the channel where you want to receive notifications</li>
                                            <li>Copy the webhook URL and paste it above</li>
                                        </ol>
                                    </div>

                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-900 mb-2">What you&apos;ll receive:</h4>
                                        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                                            <li>Real-time notifications when webhooks are triggered</li>
                                            <li>Success/failure status with response details</li>
                                            <li>Response time and status codes</li>
                                            <li>Daily statistics summary</li>
                                            <li>Client information (IP, User-Agent)</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleSlackTest}
                                            disabled={!settings.slackWebhookUrl || slackTesting}
                                        >
                                            {slackTesting ? (
                                                <>
                                                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                                                    Testing...
                                                </>
                                            ) : (
                                                <>
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Test Slack Webhook
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile Settings
                                </CardTitle>
                                <CardDescription>
                                    Manage your personal information and preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4">
                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={settings.email}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-sm text-gray-600 mt-1">
                                            Email cannot be changed here. Contact support for email updates.
                                        </p>
                                    </div>
                                    <div>
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={settings.displayName}
                                            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                                            placeholder="Your display name"
                                        />
                                        <p className="text-sm text-gray-600 mt-1">
                                            This name will be displayed in your dashboard and logs
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end mt-8">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Settings className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
