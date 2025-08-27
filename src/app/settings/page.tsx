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
    Palette,
    User,
    Settings,
    Crown,
    Zap,
    Star,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface UserSettings {
    id: string;
    email: string;
    displayName: string;
    accountType: string;
    appName: string;
    appDescription: string;
    colorPalette: string;
    triggerLimit: number;
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
        icon: Zap
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29/month',
        limits: '500 triggers',
        features: ['Unlimited webhook triggers', 'Advanced analytics', 'Priority support', 'Custom integrations'],
        color: 'bg-purple-100 text-purple-800',
        icon: Star
    },
    {
        id: 'admin',
        name: 'Admin',
        price: 'Custom',
        limits: 'Unlimited',
        features: ['All Pro features', 'User management', 'Admin dashboard', 'Custom reports', 'White-label options'],
        color: 'bg-gold-100 text-gold-800',
        icon: Crown
    }
];

const COLOR_PALETTES = [
    { id: 'default', name: 'Default Blue', colors: ['#3b82f6', '#1d4ed8', '#dbeafe'] },
    { id: 'green', name: 'Forest Green', colors: ['#10b981', '#059669', '#d1fae5'] },
    { id: 'purple', name: 'Royal Purple', colors: ['#8b5cf6', '#7c3aed', '#e9d5ff'] },
    { id: 'orange', name: 'Sunset Orange', colors: ['#f97316', '#ea580c', '#fed7aa'] },
    { id: 'pink', name: 'Rose Pink', colors: ['#ec4899', '#db2777', '#fce7f3'] },
    { id: 'teal', name: 'Ocean Teal', colors: ['#14b8a6', '#0d9488', '#ccfbf1'] }
];

export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="app">App Branding</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
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
                                                className={`cursor-pointer transition-all ${
                                                    isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
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

                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5" />
                                    Color Palette
                                </CardTitle>
                                <CardDescription>
                                    Choose your preferred color scheme
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {COLOR_PALETTES.map((palette) => (
                                        <Card
                                            key={palette.id}
                                            className={`cursor-pointer transition-all ${
                                                settings.colorPalette === palette.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                                            }`}
                                            onClick={() => setSettings({ ...settings, colorPalette: palette.id })}
                                        >
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base">{palette.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex gap-2">
                                                    {palette.colors.map((color, index) => (
                                                        <div
                                                            key={index}
                                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                                {settings.colorPalette === palette.id && (
                                                    <div className="mt-2 flex items-center gap-2 text-green-600">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Selected</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
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
