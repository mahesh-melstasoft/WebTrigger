'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Code,
    Users,
    Mail,
    ArrowRight,
    Webhook,
    Zap,
    Shield,
    Globe,
    Copy,
    CheckCircle,
    MessageSquare
} from 'lucide-react';

export default function Documentation() {
    const [copiedUrl, setCopiedUrl] = useState('');

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedUrl(id);
            setTimeout(() => setCopiedUrl(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const quickStartSteps = [
        {
            step: 1,
            title: "Create an Account",
            description: "Sign up for a free account to get started with webhook management.",
            action: "Sign Up",
            link: "/signup"
        },
        {
            step: 2,
            title: "Create Your First Callback",
            description: "Set up a webhook endpoint that will receive trigger events.",
            action: "Add Callback",
            link: "/dashboard/add"
        },
        {
            step: 3,
            title: "Get Your Trigger URL",
            description: "Copy the unique URL that will trigger your webhook.",
            action: "View Dashboard",
            link: "/dashboard"
        },
        {
            step: 4,
            title: "Test Your Webhook",
            description: "Send a test request to verify your webhook is working correctly.",
            action: "Test Now",
            link: "/dashboard"
        }
    ];

    const features = [
        {
            icon: Webhook,
            title: "Webhook Management",
            description: "Create, configure, and manage webhook endpoints with ease.",
            color: "text-blue-500"
        },
        {
            icon: Zap,
            title: "Instant Triggers",
            description: "Trigger webhooks instantly with custom paths or secure tokens.",
            color: "text-yellow-500"
        },
        {
            icon: Shield,
            title: "Secure & Reliable",
            description: "Enterprise-grade security with JWT authentication and HTTPS.",
            color: "text-green-500"
        },
        {
            icon: Globe,
            title: "Custom Paths",
            description: "Create user-friendly URLs for your webhook triggers.",
            color: "text-purple-500"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Documentation
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Everything you need to know about building powerful webhook integrations with our platform.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Quick Navigation */}
                <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    <Link href="/docs/api-reference">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="text-center">
                                <Code className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <CardTitle className="text-lg">API Reference</CardTitle>
                                <CardDescription>
                                    Complete API documentation with examples
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/docs/community">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="text-center">
                                <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <CardTitle className="text-lg">Community</CardTitle>
                                <CardDescription>
                                    Join our community and get help
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/docs/contact">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="text-center">
                                <Mail className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                <CardTitle className="text-lg">Contact Us</CardTitle>
                                <CardDescription>
                                    Get in touch with our support team
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                        const tabsElement = document.querySelector('[role="tablist"]');
                        const integrationsTab = tabsElement?.querySelector('[value="integrations"]') as HTMLElement;
                        integrationsTab?.click();
                    }}>
                        <CardHeader className="text-center">
                            <MessageSquare className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                            <CardTitle className="text-lg">Integrations</CardTitle>
                            <CardDescription>
                                Connect with Slack and other services
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Link href="/dashboard">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="text-center">
                                <Webhook className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                                <CardTitle className="text-lg">Dashboard</CardTitle>
                                <CardDescription>
                                    Go to your webhook dashboard
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8">
                        {/* What is WebTrigger */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Webhook className="h-6 w-6 text-blue-500" />
                                    What is WebTrigger?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    WebTrigger is a powerful webhook management platform that allows you to create, manage, and trigger
                                    webhook endpoints with ease. Whether you&apos;re building integrations, automating workflows, or creating
                                    event-driven applications, WebTrigger provides the tools you need.
                                </p>
                                <div className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">For Developers</h4>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                RESTful API for webhook management
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Custom trigger paths and secure tokens
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Comprehensive logging and analytics
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">For Businesses</h4>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                User-friendly dashboard interface
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Real-time monitoring and alerts
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Scalable infrastructure
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Getting Started */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Getting Started</CardTitle>
                                <CardDescription>
                                    Follow these steps to set up your first webhook
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {quickStartSteps.map((step, index) => (
                                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                                                {step.step}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                                                <p className="text-gray-600 mt-1">{step.description}</p>
                                                <Button asChild variant="outline" size="sm" className="mt-2">
                                                    <Link href={step.link}>
                                                        {step.action}
                                                        <ArrowRight className="h-4 w-4 ml-1" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quickstart" className="space-y-8">
                        {/* Quick Start Guide */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Start Guide</CardTitle>
                                <CardDescription>
                                    Get up and running with WebTrigger in minutes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">1. Create Your Webhook Endpoint</h3>
                                    <div className="bg-gray-100 p-4 rounded-lg">
                                        <pre className="text-sm overflow-x-auto">
                                            {`// Example Node.js endpoint
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).send('OK');
});`}
                                        </pre>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">2. Create a Callback in WebTrigger</h3>
                                    <p className="text-gray-600">
                                        Use the dashboard to create a new callback pointing to your endpoint URL.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">3. Get Your Trigger URL</h3>
                                    <p className="text-gray-600">
                                        Copy the trigger URL from your dashboard - you can use either the token-based URL or create a custom path.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">4. Test Your Webhook</h3>
                                    <div className="bg-gray-100 p-4 rounded-lg">
                                        <pre className="text-sm overflow-x-auto">
                                            {`# Test with curl
curl https://your-app.com/api/trigger/custom/your-path

# Or with token
curl https://your-app.com/api/trigger/token/your-token`}
                                        </pre>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-8">
                        {/* Features Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <Card key={index}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Icon className={`h-6 w-6 ${feature.color}`} />
                                                {feature.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-600">{feature.description}</p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Sample URLs */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Example Trigger URLs</CardTitle>
                                <CardDescription>
                                    Here are examples of the different types of trigger URLs you can use
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Token-based URL</p>
                                            <p className="text-sm text-gray-600">Secure, auto-generated token</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard('https://your-app.com/api/trigger/token/abc123def456', 'token')}
                                        >
                                            {copiedUrl === 'token' ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Custom Path URL</p>
                                            <p className="text-sm text-gray-600">User-friendly, memorable path</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard('https://your-app.com/api/trigger/custom/order-update', 'custom')}
                                        >
                                            {copiedUrl === 'custom' ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="integrations" className="space-y-8">
                        {/* Slack Integration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-6 w-6 text-purple-500" />
                                    Slack Event Alert System
                                </CardTitle>
                                <CardDescription>
                                    Get real-time notifications about your webhook triggers directly in Slack
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">What You&apos;ll Receive</h4>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                ✅ Successful webhook executions
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-red-500" />
                                                ❌ Failed webhook executions
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-500" />
                                                📊 Daily statistics and metrics
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-purple-500" />
                                                🔍 Detailed trigger information
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Real-time notifications
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Non-blocking execution
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Rich message formatting
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Performance statistics
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Setup Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Setup Instructions</CardTitle>
                                <CardDescription>
                                    Follow these steps to enable Slack notifications for your webhooks
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                                            1
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Create a Slack App</h4>
                                            <p className="text-gray-600 mt-1">
                                                Go to <a href="https://api.slack.com/apps" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Slack Apps</a>,
                                                click &quot;Create New App&quot; → &quot;From scratch&quot;, enter your app name, and select your workspace.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                                            2
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Enable Incoming Webhooks</h4>
                                            <p className="text-gray-600 mt-1">
                                                In your app settings, go to &quot;Features&quot; → &quot;Incoming Webhooks&quot;, toggle it on,
                                                add a new webhook to your workspace, and copy the webhook URL.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                                            3
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Configure WebTrigger</h4>
                                            <p className="text-gray-600 mt-1">
                                                Go to Settings → Slack tab, paste your webhook URL, test the connection, and save changes.
                                            </p>
                                            <Button asChild variant="outline" size="sm" className="mt-2">
                                                <Link href="/settings">
                                                    Go to Settings
                                                    <ArrowRight className="h-4 w-4 ml-1" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Example Notifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Example Notifications</CardTitle>
                                <CardDescription>
                                    See what your Slack notifications will look like
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-green-700 mb-3">✅ Success Notification</h4>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {`✅ Webhook Triggered

Callback: My API Webhook
URL: https://api.example.com/webhook
Time: 2025-08-28 14:30:25
Status: Success

Status Code: 200
Response Time: 245ms

Today's Triggers: 15
Success Rate: 93.3%
Avg Response Time: 234ms`}
                                            </pre>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-red-700 mb-3">❌ Failure Notification</h4>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {`❌ Webhook Failed

Callback: My API Webhook
URL: https://api.example.com/webhook
Time: 2025-08-28 14:35:10
Status: Failed

Details: Connection timeout

Today's Triggers: 16
Success Rate: 87.5%
Avg Response Time: 234ms`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Troubleshooting */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Troubleshooting</CardTitle>
                                <CardDescription>
                                    Common issues and how to resolve them
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h4 className="font-semibold text-yellow-800 mb-2">Test Button Not Working</h4>
                                        <ul className="text-sm text-yellow-700 space-y-1">
                                            <li>• Verify your Slack webhook URL is correct</li>
                                            <li>• Make sure the URL starts with https://hooks.slack.com/</li>
                                            <li>• Check that your Slack app has permission to post to the selected channel</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-semibold text-blue-800 mb-2">Not Receiving Notifications</h4>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            <li>• Confirm your webhook URL is saved in WebTrigger settings</li>
                                            <li>• Check that your Slack app is active and has webhook permissions</li>
                                            <li>• Verify the selected Slack channel exists and is accessible</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <h4 className="font-semibold text-green-800 mb-2">Security Notes</h4>
                                        <ul className="text-sm text-green-700 space-y-1">
                                            <li>• ✅ Webhook URLs are stored securely in your database</li>
                                            <li>• ✅ Only you can view and modify your Slack webhook URL</li>
                                            <li>• ✅ Slack notifications include your email for identification</li>
                                            <li>• ✅ Failed Slack notifications don&apos;t break webhook functionality</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
