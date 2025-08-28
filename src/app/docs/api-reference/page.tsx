'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Copy,
    CheckCircle,
    Key,
    Webhook,
    Activity,
    FileText,
    CreditCard
} from 'lucide-react';

export default function ApiReference() {
    const [copiedCode, setCopiedCode] = useState('');

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCode(id);
            setTimeout(() => setCopiedCode(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const apiEndpoints = [
        {
            category: "Authentication",
            endpoints: [
                {
                    method: "POST",
                    path: "/api/auth/signup",
                    description: "Create a new user account",
                    auth: false,
                    body: `{
  "email": "user@example.com",
  "password": "securepassword"
}`,
                    response: `{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "FREE"
  },
  "token": "jwt_token"
}`
                },
                {
                    method: "POST",
                    path: "/api/auth/login",
                    description: "Authenticate user and get token",
                    auth: false,
                    body: `{
  "email": "user@example.com",
  "password": "securepassword"
}`,
                    response: `{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "FREE"
  },
  "token": "jwt_token"
}`
                },
                {
                    method: "GET",
                    path: "/api/auth/me",
                    description: "Get current user information",
                    auth: true,
                    response: `{
  "id": "user_id",
  "email": "user@example.com",
  "role": "FREE",
  "displayName": "User Name"
}`
                }
            ]
        },
        {
            category: "Callbacks",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/callbacks",
                    description: "List all user callbacks",
                    auth: true,
                    response: `[
  {
    "id": "callback_id",
    "name": "My Webhook",
    "callbackUrl": "https://api.example.com/webhook",
    "activeStatus": true,
    "customPath": "my-trigger",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]`
                },
                {
                    method: "POST",
                    path: "/api/callbacks",
                    description: "Create a new callback",
                    auth: true,
                    body: `{
  "name": "Order Webhook",
  "callbackUrl": "https://api.example.com/orders",
  "activeStatus": true,
  "customPath": "new-order"
}`,
                    response: `{
  "id": "callback_id",
  "name": "Order Webhook",
  "callbackUrl": "https://api.example.com/orders",
  "activeStatus": true,
  "customPath": "new-order",
  "triggerToken": "token_here",
  "createdAt": "2025-01-01T00:00:00.000Z"
}`
                },
                {
                    method: "GET",
                    path: "/api/callbacks/{id}",
                    description: "Get specific callback details",
                    auth: true,
                    response: `{
  "id": "callback_id",
  "name": "My Webhook",
  "callbackUrl": "https://api.example.com/webhook",
  "activeStatus": true,
  "customPath": "my-trigger",
  "logs": [
    {
      "event": "Callback triggered",
      "details": "Called https://api.example.com/webhook",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}`
                },
                {
                    method: "PUT",
                    path: "/api/callbacks/{id}",
                    description: "Update callback settings",
                    auth: true,
                    body: `{
  "name": "Updated Webhook",
  "customPath": "updated-trigger"
}`,
                    response: `{
  "id": "callback_id",
  "name": "Updated Webhook",
  "customPath": "updated-trigger"
}`
                },
                {
                    method: "DELETE",
                    path: "/api/callbacks/{id}",
                    description: "Delete a callback",
                    auth: true,
                    response: `{
  "message": "Callback deleted successfully"
}`
                }
            ]
        },
        {
            category: "Triggers",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/trigger/token/{token}",
                    description: "Trigger callback using token",
                    auth: false,
                    response: `{
  "message": "Callback executed successfully",
  "data": {
    // Response from your webhook endpoint
  }
}`
                },
                {
                    method: "GET",
                    path: "/api/trigger/custom/{path}",
                    description: "Trigger callback using custom path",
                    auth: false,
                    response: `{
  "message": "Callback executed successfully via custom path",
  "customPath": "my-trigger",
  "data": {
    // Response from your webhook endpoint
  }
}`
                },
                {
                    method: "GET",
                    path: "/api/callbacks/{id}/trigger",
                    description: "Trigger callback by ID",
                    auth: false,
                    response: `{
  "message": "Callback executed successfully",
  "data": {
    // Response from your webhook endpoint
  }
}`
                }
            ]
        },
        {
            category: "Logs",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/logs",
                    description: "Get all user logs",
                    auth: true,
                    response: `[
  {
    "id": "log_id",
    "event": "Callback triggered",
    "details": "Called https://api.example.com/webhook",
    "callbackId": "callback_id",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]`
                },
                {
                    method: "GET",
                    path: "/api/logs/{id}",
                    description: "Get logs for specific callback",
                    auth: true,
                    response: `[
  {
    "id": "log_id",
    "event": "Callback triggered",
    "details": "Called https://api.example.com/webhook",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]`
                }
            ]
        },
        {
            category: "Subscription",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/subscription",
                    description: "Get user subscription details",
                    auth: true,
                    response: `{
  "id": "subscription_id",
  "planId": "plan_id",
  "status": "ACTIVE",
  "currentPeriodStart": "2025-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2025-02-01T00:00:00.000Z",
  "plan": {
    "name": "Pro",
    "price": 29.99,
    "maxTriggers": 500
  }
}`
                }
            ]
        }
    ];

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'bg-green-100 text-green-800';
            case 'POST': return 'bg-blue-100 text-blue-800';
            case 'PUT': return 'bg-yellow-100 text-yellow-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" asChild>
                            <Link href="/docs">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Documentation
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            API Reference
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Complete API documentation with examples and code samples.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Authentication Notice */}
                <Alert className="mb-8">
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Authentication:</strong> Most endpoints require a JWT token in the Authorization header:
                        <code className="ml-2 bg-gray-100 px-2 py-1 rounded">Authorization: Bearer YOUR_JWT_TOKEN</code>
                    </AlertDescription>
                </Alert>

                {/* API Categories */}
                <div className="space-y-8">
                    {apiEndpoints.map((category, categoryIndex) => (
                        <Card key={categoryIndex}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {category.category === 'Authentication' && <Key className="h-6 w-6 text-blue-500" />}
                                    {category.category === 'Callbacks' && <Webhook className="h-6 w-6 text-green-500" />}
                                    {category.category === 'Triggers' && <Activity className="h-6 w-6 text-purple-500" />}
                                    {category.category === 'Logs' && <FileText className="h-6 w-6 text-orange-500" />}
                                    {category.category === 'Subscription' && <CreditCard className="h-6 w-6 text-red-500" />}
                                    {category.category}
                                </CardTitle>
                                <CardDescription>
                                    {category.category === 'Authentication' && 'User registration, login, and profile management'}
                                    {category.category === 'Callbacks' && 'Create, manage, and configure webhook endpoints'}
                                    {category.category === 'Triggers' && 'Execute webhooks using various trigger methods'}
                                    {category.category === 'Logs' && 'View execution history and debugging information'}
                                    {category.category === 'Subscription' && 'Manage billing and subscription details'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {category.endpoints.map((endpoint, endpointIndex) => (
                                    <div key={endpointIndex} className="border rounded-lg p-6 space-y-4">
                                        {/* Endpoint Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge className={getMethodColor(endpoint.method)}>
                                                    {endpoint.method}
                                                </Badge>
                                                <code className="text-lg font-mono text-gray-900">
                                                    {endpoint.path}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {endpoint.auth ? (
                                                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                                                        <Key className="h-3 w-3 mr-1" />
                                                        Auth Required
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                        Public
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600">{endpoint.description}</p>

                                        {/* Request Body */}
                                        {endpoint.body && (
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-gray-900">Request Body:</h4>
                                                <div className="relative bg-gray-100 p-4 rounded-lg">
                                                    <pre className="text-sm overflow-x-auto">
                                                        <code>{endpoint.body}</code>
                                                    </pre>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute top-2 right-2"
                                                        onClick={() => copyToClipboard(endpoint.body!, `body-${categoryIndex}-${endpointIndex}`)}
                                                    >
                                                        {copiedCode === `body-${categoryIndex}-${endpointIndex}` ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Response */}
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-gray-900">Response:</h4>
                                            <div className="relative bg-gray-100 p-4 rounded-lg">
                                                <pre className="text-sm overflow-x-auto">
                                                    <code>{endpoint.response}</code>
                                                </pre>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => copyToClipboard(endpoint.response, `response-${categoryIndex}-${endpointIndex}`)}
                                                >
                                                    {copiedCode === `response-${categoryIndex}-${endpointIndex}` ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Error Codes */}
                <Card className="mt-12">
                    <CardHeader>
                        <CardTitle>Error Codes</CardTitle>
                        <CardDescription>
                            Common HTTP status codes and their meanings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-green-600">Success Codes</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">200 OK</code>
                                        <span className="text-sm text-gray-600">Request successful</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">201 Created</code>
                                        <span className="text-sm text-gray-600">Resource created</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-red-600">Error Codes</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded">400 Bad Request</code>
                                        <span className="text-sm text-gray-600">Invalid request data</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded">401 Unauthorized</code>
                                        <span className="text-sm text-gray-600">Authentication required</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded">403 Forbidden</code>
                                        <span className="text-sm text-gray-600">Access denied</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded">404 Not Found</code>
                                        <span className="text-sm text-gray-600">Resource not found</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded">409 Conflict</code>
                                        <span className="text-sm text-gray-600">Resource already exists</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded">500 Server Error</code>
                                        <span className="text-sm text-gray-600">Internal server error</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
