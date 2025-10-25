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
    Key,
    Plus,
    Trash2,
    Copy,
    Calendar,
    Eye,
    EyeOff,
    Mail,
    Database,
} from 'lucide-react';
import Image from 'next/image';
import { ApiKey } from '@/generated/prisma';

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

interface ServiceCredential {
    id: string;
    name: string;
    provider: string;
    createdAt: string;
}

interface NotificationSettings {
    id: string;
    userId: string;
    emailEnabled: boolean;
    emailRecipients: string[];
    emailOnSuccess: boolean;
    emailOnFailure: boolean;
    whatsappEnabled: boolean;
    whatsappNumbers: string[];
    whatsappOnSuccess: boolean;
    whatsappOnFailure: boolean;
    telegramEnabled: boolean;
    telegramChatIds: string[];
    telegramOnSuccess: boolean;
    telegramOnFailure: boolean;
    smsEnabled: boolean;
    smsNumbers: string[];
    smsOnSuccess: boolean;
    smsOnFailure: boolean;
    hasPaidSubscription: boolean;
    subscriptionRequired: {
        whatsapp: boolean;
        sms: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

const ACCOUNT_TYPES = [
    {
        id: 'free',
        name: 'Free',
        price: '$0/month',
        limits: '5 triggers',
        features: ['Basic webhook triggers', 'Email notifications (1 recipient)', 'Community support'],
        color: 'bg-gray-100 text-gray-800',
        icon: User
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '$9/month',
        limits: '50 triggers',
        features: ['Advanced webhook triggers', 'Email notifications (3 recipients)', 'WhatsApp & SMS notifications', 'Enhanced logging', 'Email support', 'Custom timeouts'],
        color: 'bg-blue-100 text-blue-800',
        icon: Zap,
        planId: 'cmev2jyjz0000hoe81bz1mm6u' // From seeded database
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29/month',
        limits: '500 triggers',
        features: ['Unlimited webhook triggers', 'Email notifications (10 recipients)', 'WhatsApp & SMS notifications', 'Advanced analytics', 'Priority support', 'Custom integrations'],
        color: 'bg-purple-100 text-purple-800',
        icon: Star,
        planId: 'cmev2jyoj0001hoe84vt6h8op' // From seeded database
    },
    {
        id: 'admin',
        name: 'Admin',
        price: 'Custom',
        limits: 'Unlimited',
        features: ['All Pro features', 'Unlimited notifications', 'User management', 'Admin dashboard', 'Custom reports', 'White-label options'],
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
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [showCreateApiKey, setShowCreateApiKey] = useState(false);
    const [newApiKeyName, setNewApiKeyName] = useState('');
    const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>(['read']);
    const [newApiKeyExpiresAt, setNewApiKeyExpiresAt] = useState('');
    const [newApiKeyNoExpiration, setNewApiKeyNoExpiration] = useState(false);
    const [creatingApiKey, setCreatingApiKey] = useState(false);
    const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
    const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());
    const [revealedApiKeys, setRevealedApiKeys] = useState<Map<string, string>>(new Map());
    const [serviceCredentials, setServiceCredentials] = useState<ServiceCredential[]>([]);
    const [showCreateCredential, setShowCreateCredential] = useState(false);
    const [newCredentialName, setNewCredentialName] = useState('');
    const [newCredentialProvider, setNewCredentialProvider] = useState('SENDGRID');
    const [newCredentialSecret, setNewCredentialSecret] = useState('');
    const [creatingCredential, setCreatingCredential] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [savingNotifications, setSavingNotifications] = useState(false);
    const router = useRouter();

    const fetchApiKeys = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/api-keys', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setApiKeys(data);
            }
        } catch {
            console.error('Failed to fetch API keys');
        }
    }, []);

    const fetchServiceCredentials = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/service-credentials', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setServiceCredentials(data);
            }
        } catch {
            console.error('Failed to fetch service credentials');
        }
    }, []);

    const fetchNotificationSettings = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoadingNotifications(true);
        try {
            const response = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setNotificationSettings(data);
            }
        } catch {
            console.error('Failed to fetch notification settings');
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

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
            console.error('An error occurred while fetching settings');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchSettings();
        fetchApiKeys();
        fetchServiceCredentials();
        fetchNotificationSettings();
    }, [fetchSettings, fetchApiKeys, fetchServiceCredentials, fetchNotificationSettings]);

    const handleCreateApiKey = async () => {
        if (!newApiKeyName.trim()) return;

        setCreatingApiKey(true);
        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newApiKeyName,
                    permissions: newApiKeyPermissions,
                    expiresAt: newApiKeyNoExpiration ? null : (newApiKeyExpiresAt || null),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setCreatedApiKey(data.apiKey);
                setShowCreateApiKey(false);
                setNewApiKeyName('');
                setNewApiKeyPermissions(['read']);
                setNewApiKeyExpiresAt('');
                fetchApiKeys(); // Refresh the list
                setSuccess('API key created successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create API key');
            }
        } catch {
            console.error('An error occurred while creating the API key');
        } finally {
            setCreatingApiKey(false);
        }
    };

    const handleDeleteApiKey = async (apiKeyId: string) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }

        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/api-keys/${apiKeyId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setApiKeys(apiKeys.filter(key => key.id !== apiKeyId));
                setSuccess('API key deleted successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete API key');
            }
        } catch {
            console.error('An error occurred while deleting the API key');
        }
    };

    const copyApiKey = (apiKey: string) => {
        navigator.clipboard.writeText(apiKey);
        setSuccess('API key copied to clipboard!');
    };

    const toggleApiKeyVisibility = async (apiKeyId: string) => {
        const isVisible = visibleApiKeys.has(apiKeyId);

        if (!isVisible && !revealedApiKeys.has(apiKeyId)) {
            // Fetch the specific API key with the actual key value
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch(`/api/api-keys?includeKey=true&keyId=${apiKeyId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const apiKeyData = await response.json();
                    if (apiKeyData.key) {
                        setRevealedApiKeys(prev => new Map(prev.set(apiKeyId, apiKeyData.key)));
                    } else {
                        console.error('API key not found or no key returned');
                    }
                } else {
                    const errorData = await response.json();
                    console.error('Failed to fetch API key:', errorData.error);
                }
            } catch (error) {
                console.error('Failed to fetch API key:', error);
            }
        }

        setVisibleApiKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(apiKeyId)) {
                newSet.delete(apiKeyId);
            } else {
                newSet.add(apiKeyId);
            }
            return newSet;
        });
    };

    const handleCreateCredential = async () => {
        if (!newCredentialName.trim() || !newCredentialSecret.trim()) return;

        setCreatingCredential(true);
        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/service-credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newCredentialName,
                    provider: newCredentialProvider,
                    secret: newCredentialSecret,
                }),
            });

            if (response.ok) {
                setShowCreateCredential(false);
                setNewCredentialName('');
                setNewCredentialProvider('SENDGRID');
                setNewCredentialSecret('');
                fetchServiceCredentials(); // Refresh the list
                setSuccess('Service credential created successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create service credential');
            }
        } catch {
            setError('An error occurred while creating the service credential');
        } finally {
            setCreatingCredential(false);
        }
    };

    const handleDeleteCredential = async (credentialId: string) => {
        if (!confirm('Are you sure you want to delete this service credential? This action cannot be undone.')) {
            return;
        }

        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/service-credentials/${credentialId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setServiceCredentials(serviceCredentials.filter(cred => cred.id !== credentialId));
                setSuccess('Service credential deleted successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete service credential');
            }
        } catch {
            setError('An error occurred while deleting the service credential');
        }
    };

    const handleSaveNotifications = async () => {
        if (!notificationSettings) return;

        setSavingNotifications(true);
        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(notificationSettings),
            });

            if (response.ok) {
                const data = await response.json();
                setNotificationSettings(data);
                setSuccess('Notification settings saved successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to save notification settings');
            }
        } catch {
            setError('An error occurred while saving notification settings');
        } finally {
            setSavingNotifications(false);
        }
    };

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
                body: JSON.stringify({
                    appName: settings.appName,
                    appDescription: settings.appDescription,
                    colorPalette: settings.colorPalette,
                    displayName: settings.displayName,
                    slackWebhookUrl: settings.slackWebhookUrl,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
                setSuccess('Settings saved successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to save settings');
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
                    <TabsList className="grid w-full grid-cols-9">
                        <TabsTrigger value="app">App Branding</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                        <TabsTrigger value="actions">Actions</TabsTrigger>
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

                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Webhook Notifications
                                </CardTitle>
                                <CardDescription>
                                    Configure notifications for webhook success and failure events
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {loadingNotifications ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Settings className="h-6 w-6 animate-spin text-blue-500" />
                                        <span className="ml-2">Loading notification settings...</span>
                                    </div>
                                ) : notificationSettings ? (
                                    <>
                                        {/* Email Notifications */}
                                        <Card className="border-gray-200">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-5 w-5 text-blue-500" />
                                                        <CardTitle className="text-lg">Email Notifications</CardTitle>
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Available on all plans
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="emailEnabled"
                                                        checked={notificationSettings.emailEnabled}
                                                        onChange={(e) => setNotificationSettings({
                                                            ...notificationSettings,
                                                            emailEnabled: e.target.checked
                                                        })}
                                                        className="rounded"
                                                    />
                                                    <Label htmlFor="emailEnabled">Enable email notifications</Label>
                                                </div>

                                                {notificationSettings.emailEnabled && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>Additional Recipients (comma-separated emails)</Label>
                                                            <Input
                                                                value={notificationSettings.emailRecipients.join(', ')}
                                                                onChange={(e) => setNotificationSettings({
                                                                    ...notificationSettings,
                                                                    emailRecipients: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                                                                })}
                                                                placeholder="user1@example.com, user2@example.com"
                                                            />
                                                            <p className="text-sm text-gray-600">
                                                                Maximum {settings?.accountType === 'free' ? '1' : settings?.accountType === 'starter' ? '3' : settings?.accountType === 'pro' ? '10' : 'unlimited'} recipients
                                                            </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Notify on:</Label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={notificationSettings.emailOnSuccess}
                                                                        onChange={(e) => setNotificationSettings({
                                                                            ...notificationSettings,
                                                                            emailOnSuccess: e.target.checked
                                                                        })}
                                                                        className="rounded"
                                                                    />
                                                                    Success
                                                                </label>
                                                                <label className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={notificationSettings.emailOnFailure}
                                                                        onChange={(e) => setNotificationSettings({
                                                                            ...notificationSettings,
                                                                            emailOnFailure: e.target.checked
                                                                        })}
                                                                        className="rounded"
                                                                    />
                                                                    Failure
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* WhatsApp Notifications */}
                                        <Card className={`border-gray-200 ${notificationSettings.subscriptionRequired.whatsapp ? 'opacity-75' : ''}`}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-5 w-5 text-green-500" />
                                                        <CardTitle className="text-lg">WhatsApp Notifications</CardTitle>
                                                    </div>
                                                    {notificationSettings.subscriptionRequired.whatsapp ? (
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                            Paid plans only
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            Available
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {notificationSettings.subscriptionRequired.whatsapp ? (
                                                    <Alert>
                                                        <Crown className="h-4 w-4" />
                                                        <AlertDescription>
                                                            WhatsApp notifications require a paid subscription. Upgrade your plan to enable this feature.
                                                        </AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="whatsappEnabled"
                                                                checked={notificationSettings.whatsappEnabled}
                                                                onChange={(e) => setNotificationSettings({
                                                                    ...notificationSettings,
                                                                    whatsappEnabled: e.target.checked
                                                                })}
                                                                className="rounded"
                                                            />
                                                            <Label htmlFor="whatsappEnabled">Enable WhatsApp notifications</Label>
                                                        </div>

                                                        {notificationSettings.whatsappEnabled && (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <Label>Phone Numbers (with country code)</Label>
                                                                    <Input
                                                                        value={notificationSettings.whatsappNumbers.join(', ')}
                                                                        onChange={(e) => setNotificationSettings({
                                                                            ...notificationSettings,
                                                                            whatsappNumbers: e.target.value.split(',').map(num => num.trim()).filter(num => num)
                                                                        })}
                                                                        placeholder="+1234567890, +0987654321"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Notify on:</Label>
                                                                    <div className="flex gap-4">
                                                                        <label className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={notificationSettings.whatsappOnSuccess}
                                                                                onChange={(e) => setNotificationSettings({
                                                                                    ...notificationSettings,
                                                                                    whatsappOnSuccess: e.target.checked
                                                                                })}
                                                                                className="rounded"
                                                                            />
                                                                            Success
                                                                        </label>
                                                                        <label className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={notificationSettings.whatsappOnFailure}
                                                                                onChange={(e) => setNotificationSettings({
                                                                                    ...notificationSettings,
                                                                                    whatsappOnFailure: e.target.checked
                                                                                })}
                                                                                className="rounded"
                                                                            />
                                                                            Failure
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Telegram Notifications */}
                                        <Card className="border-gray-200">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-5 w-5 text-blue-500" />
                                                        <CardTitle className="text-lg">Telegram Notifications</CardTitle>
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Available on all plans
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="telegramEnabled"
                                                        checked={notificationSettings.telegramEnabled}
                                                        onChange={(e) => setNotificationSettings({
                                                            ...notificationSettings,
                                                            telegramEnabled: e.target.checked
                                                        })}
                                                        className="rounded"
                                                    />
                                                    <Label htmlFor="telegramEnabled">Enable Telegram notifications</Label>
                                                </div>

                                                {notificationSettings.telegramEnabled && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>Chat IDs</Label>
                                                            <Input
                                                                value={notificationSettings.telegramChatIds.join(', ')}
                                                                onChange={(e) => setNotificationSettings({
                                                                    ...notificationSettings,
                                                                    telegramChatIds: e.target.value.split(',').map(id => id.trim()).filter(id => id)
                                                                })}
                                                                placeholder="123456789, 987654321"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Notify on:</Label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={notificationSettings.telegramOnSuccess}
                                                                        onChange={(e) => setNotificationSettings({
                                                                            ...notificationSettings,
                                                                            telegramOnSuccess: e.target.checked
                                                                        })}
                                                                        className="rounded"
                                                                    />
                                                                    Success
                                                                </label>
                                                                <label className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={notificationSettings.telegramOnFailure}
                                                                        onChange={(e) => setNotificationSettings({
                                                                            ...notificationSettings,
                                                                            telegramOnFailure: e.target.checked
                                                                        })}
                                                                        className="rounded"
                                                                    />
                                                                    Failure
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* SMS Notifications */}
                                        <Card className={`border-gray-200 ${notificationSettings.subscriptionRequired.sms ? 'opacity-75' : ''}`}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-5 w-5 text-purple-500" />
                                                        <CardTitle className="text-lg">SMS Notifications</CardTitle>
                                                    </div>
                                                    {notificationSettings.subscriptionRequired.sms ? (
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                            Paid plans only
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            Available
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {notificationSettings.subscriptionRequired.sms ? (
                                                    <Alert>
                                                        <Crown className="h-4 w-4" />
                                                        <AlertDescription>
                                                            SMS notifications require a paid subscription. Upgrade your plan to enable this feature.
                                                        </AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id="smsEnabled"
                                                                checked={notificationSettings.smsEnabled}
                                                                onChange={(e) => setNotificationSettings({
                                                                    ...notificationSettings,
                                                                    smsEnabled: e.target.checked
                                                                })}
                                                                className="rounded"
                                                            />
                                                            <Label htmlFor="smsEnabled">Enable SMS notifications</Label>
                                                        </div>

                                                        {notificationSettings.smsEnabled && (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <Label>Phone Numbers (with country code)</Label>
                                                                    <Input
                                                                        value={notificationSettings.smsNumbers.join(', ')}
                                                                        onChange={(e) => setNotificationSettings({
                                                                            ...notificationSettings,
                                                                            smsNumbers: e.target.value.split(',').map(num => num.trim()).filter(num => num)
                                                                        })}
                                                                        placeholder="+1234567890, +0987654321"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Notify on:</Label>
                                                                    <div className="flex gap-4">
                                                                        <label className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={notificationSettings.smsOnSuccess}
                                                                                onChange={(e) => setNotificationSettings({
                                                                                    ...notificationSettings,
                                                                                    smsOnSuccess: e.target.checked
                                                                                })}
                                                                                className="rounded"
                                                                            />
                                                                            Success
                                                                        </label>
                                                                        <label className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={notificationSettings.smsOnFailure}
                                                                                onChange={(e) => setNotificationSettings({
                                                                                    ...notificationSettings,
                                                                                    smsOnFailure: e.target.checked
                                                                                })}
                                                                                className="rounded"
                                                                            />
                                                                            Failure
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleSaveNotifications}
                                                disabled={savingNotifications}
                                            >
                                                {savingNotifications ? (
                                                    <>
                                                        <Settings className="h-4 w-4 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Save Notification Settings
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load notification settings</h3>
                                        <p className="text-gray-600">Please try refreshing the page.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="api-keys" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    API Keys
                                </CardTitle>
                                <CardDescription>
                                    Manage API keys for programmatic access to your WebTrigger account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Create API Key Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium">Your API Keys</h3>
                                        <Button
                                            onClick={() => setShowCreateApiKey(!showCreateApiKey)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create API Key
                                        </Button>
                                    </div>

                                    {/* Create API Key Form */}
                                    {showCreateApiKey && (
                                        <Card className="border-blue-200 bg-blue-50">
                                            <CardHeader>
                                                <CardTitle className="text-blue-900">Create New API Key</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div>
                                                        <Label htmlFor="apiKeyName">API Key Name</Label>
                                                        <Input
                                                            id="apiKeyName"
                                                            value={newApiKeyName}
                                                            onChange={(e) => setNewApiKeyName(e.target.value)}
                                                            placeholder="My API Key"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="apiKeyExpiresAt">Expiration Date</Label>
                                                        <Input
                                                            id="apiKeyExpiresAt"
                                                            type="datetime-local"
                                                            value={newApiKeyExpiresAt}
                                                            onChange={(e) => setNewApiKeyExpiresAt(e.target.value)}
                                                            disabled={newApiKeyNoExpiration}
                                                            min={new Date().toISOString().slice(0, 16)}
                                                        />
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <input
                                                                type="checkbox"
                                                                id="noExpiration"
                                                                checked={newApiKeyNoExpiration}
                                                                onChange={(e) => {
                                                                    setNewApiKeyNoExpiration(e.target.checked);
                                                                    if (e.target.checked) {
                                                                        setNewApiKeyExpiresAt('');
                                                                    }
                                                                }}
                                                                className="rounded"
                                                            />
                                                            <Label htmlFor="noExpiration" className="text-sm">No expiration</Label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Permissions</Label>
                                                    <div className="grid gap-2 mt-2">
                                                        {[
                                                            { value: 'read', label: 'Read - View webhooks and logs' },
                                                            { value: 'write', label: 'Write - Create and modify webhooks' },
                                                            { value: 'admin', label: 'Admin - Full access including user management' }
                                                        ].map((permission) => (
                                                            <label key={permission.value} className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={newApiKeyPermissions.includes(permission.value)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setNewApiKeyPermissions([...newApiKeyPermissions, permission.value]);
                                                                        } else {
                                                                            setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== permission.value));
                                                                        }
                                                                    }}
                                                                    className="rounded"
                                                                />
                                                                <span className="text-sm">{permission.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={handleCreateApiKey}
                                                        disabled={creatingApiKey || !newApiKeyName.trim()}
                                                    >
                                                        {creatingApiKey ? (
                                                            <>
                                                                <Settings className="h-4 w-4 mr-2 animate-spin" />
                                                                Creating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Key className="h-4 w-4 mr-2" />
                                                                Create API Key
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowCreateApiKey(false);
                                                            setNewApiKeyName('');
                                                            setNewApiKeyPermissions(['read']);
                                                            setNewApiKeyExpiresAt('');
                                                            setNewApiKeyNoExpiration(false);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Created API Key Display */}
                                    {createdApiKey && (
                                        <Card className="border-green-200 bg-green-50">
                                            <CardHeader>
                                                <CardTitle className="text-green-900 flex items-center gap-2">
                                                    <CheckCircle className="h-5 w-5" />
                                                    API Key Created Successfully
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <Label>API Key (Copy this - it will only be shown once)</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            value={createdApiKey}
                                                            readOnly
                                                            className="font-mono text-sm"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => copyApiKey(createdApiKey)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Alert>
                                                    <Key className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Store this API key securely. You can use it in the <code>X-API-Key</code> header or as a Bearer token for API authentication.
                                                    </AlertDescription>
                                                </Alert>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setCreatedApiKey(null)}
                                                >
                                                    Dismiss
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* API Keys List */}
                                <div className="space-y-4">
                                    {apiKeys.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys found</h3>
                                            <p className="text-gray-600 mb-4">
                                                Create your first API key to enable programmatic access to WebTrigger.
                                            </p>
                                            <Button onClick={() => setShowCreateApiKey(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create API Key
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {apiKeys.map((apiKey) => (
                                                <Card key={apiKey.id} className="border-gray-200">
                                                    <CardContent className="pt-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-2 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-medium">{apiKey.name}</h4>
                                                                    {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                                                                        <Badge variant="destructive">Expired</Badge>
                                                                    )}
                                                                    {!apiKey.expiresAt && (
                                                                        <Badge variant="outline">No Expiration</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="h-4 w-4" />
                                                                        Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                                                    </div>
                                                                    {apiKey.lastUsedAt && (
                                                                        <div className="flex items-center gap-1">
                                                                            <CheckCircle className="h-4 w-4" />
                                                                            Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                    {apiKey.expiresAt && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Calendar className="h-4 w-4" />
                                                                            Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {apiKey.permissions.map((permission) => (
                                                                        <Badge key={permission} variant="outline">
                                                                            {permission}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => toggleApiKeyVisibility(apiKey.id)}
                                                                >
                                                                    {visibleApiKeys.has(apiKey.id) ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteApiKey(apiKey.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {visibleApiKeys.has(apiKey.id) && (
                                                            <div className="mt-4 p-3 bg-gray-50 rounded border">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <Label className="text-sm font-medium">API Key:</Label>
                                                                        <div className="mt-1 font-mono text-sm bg-white p-2 rounded border break-all">
                                                                            {revealedApiKeys.get(apiKey.id) || 'Loading...'}
                                                                        </div>
                                                                        <p className="text-xs text-amber-600 mt-1">
                                                                            ⚠️ Keep this key secure and do not share it publicly.
                                                                        </p>
                                                                    </div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => copyApiKey(revealedApiKeys.get(apiKey.id) || '')}
                                                                        disabled={!revealedApiKeys.get(apiKey.id)}
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* API Usage Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>API Usage</CardTitle>
                                <CardDescription>
                                    How to use your API keys for authentication
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-medium mb-2">Using X-API-Key Header:</h4>
                                        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                                            curl -H &quot;X-API-Key: wbk_a1b2c3d4e5f6...&quot; https://your-app.com/api/callbacks
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Using Authorization Header:</h4>
                                        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                                            curl -H &quot;Authorization: Bearer wbk_a1b2c3d4e5f6...&quot; https://your-app.com/api/callbacks
                                        </div>
                                    </div>
                                </div>
                                <Alert>
                                    <Key className="h-4 w-4" />
                                    <AlertDescription>
                                        API keys are 32-byte cryptographically secure keys generated server-side.
                                        You can view them by clicking the eye icon, but store them securely and rotate regularly.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="actions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Actions & Service Credentials
                                </CardTitle>
                                <CardDescription>
                                    Configure additional actions to run when your webhooks are triggered, and manage your service credentials
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Service Credentials Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium">Service Credentials</h3>
                                        <Button
                                            onClick={() => setShowCreateCredential(!showCreateCredential)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Credential
                                        </Button>
                                    </div>

                                    {/* Create Service Credential Form */}
                                    {showCreateCredential && (
                                        <Card className="border-green-200 bg-green-50">
                                            <CardHeader>
                                                <CardTitle className="text-green-900">Add Service Credential</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div>
                                                        <Label htmlFor="credName">Credential Name</Label>
                                                        <Input
                                                            id="credName"
                                                            value={newCredentialName}
                                                            onChange={(e) => setNewCredentialName(e.target.value)}
                                                            placeholder="My SendGrid API Key"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="credProvider">Provider</Label>
                                                        <select
                                                            id="credProvider"
                                                            value={newCredentialProvider}
                                                            onChange={(e) => setNewCredentialProvider(e.target.value)}
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        >
                                                            <option value="SENDGRID">SendGrid</option>
                                                            <option value="SLACK">Slack</option>
                                                            <option value="DISCORD">Discord</option>
                                                            <option value="GENERIC">Generic</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="credSecret">API Key / Secret</Label>
                                                    <Input
                                                        id="credSecret"
                                                        type="password"
                                                        value={newCredentialSecret}
                                                        onChange={(e) => setNewCredentialSecret(e.target.value)}
                                                        placeholder="Enter your API key or webhook URL"
                                                    />
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        This will be encrypted and stored securely
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={handleCreateCredential}
                                                        disabled={creatingCredential || !newCredentialName.trim() || !newCredentialSecret.trim()}
                                                    >
                                                        {creatingCredential ? (
                                                            <>
                                                                <Settings className="h-4 w-4 mr-2 animate-spin" />
                                                                Creating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Key className="h-4 w-4 mr-2" />
                                                                Add Credential
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowCreateCredential(false);
                                                            setNewCredentialName('');
                                                            setNewCredentialProvider('SENDGRID');
                                                            setNewCredentialSecret('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Service Credentials List */}
                                    <div className="space-y-4">
                                        {serviceCredentials.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No service credentials</h3>
                                                <p className="text-gray-600 mb-4">
                                                    Add API keys for services like SendGrid, Slack, etc. to enable additional webhook actions.
                                                </p>
                                                <Button onClick={() => setShowCreateCredential(true)}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Your First Credential
                                                </Button>
                                            </div>
                                        ) : (
                                            serviceCredentials.map((cred) => (
                                                <Card key={cred.id} className="border-gray-200">
                                                    <CardContent className="pt-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-medium">{cred.name}</h4>
                                                                    <Badge variant="outline">{cred.provider}</Badge>
                                                                </div>
                                                                <p className="text-sm text-gray-600">
                                                                    Created: {new Date(cred.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeleteCredential(cred.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Available Actions Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Available Actions</CardTitle>
                                        <CardDescription>
                                            Actions you can configure for your webhooks
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="p-4 border rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MessageSquare className="h-5 w-5 text-blue-500" />
                                                    <h4 className="font-medium">Slack Notification</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Send webhook notifications to Slack channels
                                                </p>
                                                <Badge variant="outline" className="mt-2">Requires Slack Webhook URL</Badge>
                                            </div>

                                            <div className="p-4 border rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Mail className="h-5 w-5 text-green-500" />
                                                    <h4 className="font-medium">Email via SendGrid</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Send email notifications when webhooks trigger
                                                </p>
                                                <Badge variant="outline" className="mt-2">Requires SendGrid API Key</Badge>
                                            </div>

                                            <div className="p-4 border rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Settings className="h-5 w-5 text-purple-500" />
                                                    <h4 className="font-medium">HTTP POST (Enhanced)</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Forward webhooks with HMAC signing and custom headers
                                                </p>
                                                <Badge variant="outline" className="mt-2">No additional credentials needed</Badge>
                                            </div>

                                            <div className="p-4 border rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Database className="h-5 w-5 text-orange-500" />
                                                    <h4 className="font-medium">Store to Database</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Store webhook payloads for audit and analysis
                                                </p>
                                                <Badge variant="outline" className="mt-2">Built-in</Badge>
                                            </div>
                                        </div>

                                        <Alert>
                                            <Zap className="h-4 w-4" />
                                            <AlertDescription>
                                                Actions are configured per webhook in the dashboard. Add your service credentials above to enable email and Slack actions.
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Appearance Settings
                                </CardTitle>
                                <CardDescription>
                                    Customize the look and feel of your WebTrigger dashboard
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="colorPalette">Color Theme</Label>
                                        <select
                                            id="colorPalette"
                                            value={settings.colorPalette}
                                            onChange={(e) => setSettings({ ...settings, colorPalette: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="default">Default</option>
                                            <option value="blue">Blue</option>
                                            <option value="green">Green</option>
                                            <option value="purple">Purple</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Choose your preferred color scheme for the dashboard
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 mb-2">Theme Options:</h4>
                                        <div className="grid gap-3 text-sm text-blue-800">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                                <span><strong>Default:</strong> Clean blue theme with light backgrounds</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                                <span><strong>Green:</strong> Nature-inspired green color scheme</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                                <span><strong>Purple:</strong> Elegant purple theme</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-gray-800 rounded"></div>
                                                <span><strong>Dark:</strong> Dark mode for low-light environments</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Alert>
                                        <Settings className="h-4 w-4" />
                                        <AlertDescription>
                                            Theme changes will be applied immediately. Some color preferences may require a page refresh to take full effect.
                                        </AlertDescription>
                                    </Alert>
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
