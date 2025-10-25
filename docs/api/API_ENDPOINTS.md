# API Endpoints Reference

## Overview

This document provides a comprehensive reference of all API endpoints organized by resource.

---

## Authentication Endpoints

### Signup
```
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure-password"
}

Response (200):
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "secret": "JBSWY3DPEBLW64TMMQ======"
  },
  "qrCode": "data:image/png;base64,..."
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure-password",
  "totp": "123456"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "PREMIUM"
  }
}
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response (200):
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "PREMIUM",
    "isActive": true,
    "createdAt": "2025-10-01T10:00:00Z"
  }
}
```

---

## Callback Management Endpoints

### List Callbacks
```
GET /api/callbacks
Authorization: Bearer <token>
Query Parameters:
  - limit: number (default: 10)
  - offset: number (default: 0)
  - active: boolean (optional)

Response (200):
{
  "callbacks": [
    {
      "id": "callback-id",
      "name": "Order Webhook",
      "callbackUrl": "https://api.example.com/webhooks/orders",
      "activeStatus": true,
      "triggerToken": "token-uuid",
      "customPath": "order-webhook",
      "timeoutDuration": 30000,
      "cachePeriod": 0,
      "createdAt": "2025-10-01T10:00:00Z",
      "updatedAt": "2025-10-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Create Callback
```
POST /api/callbacks
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "Order Webhook",
  "callbackUrl": "https://api.example.com/webhooks/orders",
  "activeStatus": true,
  "customPath": "order-webhook",
  "timeoutDuration": 30000,
  "cachePeriod": 3600
}

Response (201):
{
  "id": "callback-id",
  "name": "Order Webhook",
  "callbackUrl": "https://api.example.com/webhooks/orders",
  "activeStatus": true,
  "triggerToken": "token-uuid",
  "customPath": "order-webhook",
  "timeoutDuration": 30000,
  "cachePeriod": 3600,
  "createdAt": "2025-10-25T10:00:00Z",
  "updatedAt": "2025-10-25T10:00:00Z"
}
```

### Update Callback
```
PUT /api/callbacks/[id]
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "Updated Webhook",
  "callbackUrl": "https://api.example.com/webhooks/orders-v2",
  "activeStatus": true,
  "timeoutDuration": 45000,
  "cachePeriod": 7200
}

Response (200):
{
  "id": "callback-id",
  "name": "Updated Webhook",
  "callbackUrl": "https://api.example.com/webhooks/orders-v2",
  "activeStatus": true,
  "triggerToken": "token-uuid",
  "customPath": "order-webhook",
  "timeoutDuration": 45000,
  "cachePeriod": 7200,
  "updatedAt": "2025-10-25T11:00:00Z"
}
```

### Delete Callback
```
DELETE /api/callbacks/[id]
Authorization: Bearer <token>

Response (204):
No content
```

---

## Callback Triggering Endpoints (Public)

### Trigger by Token
```
GET /api/trigger/[token]
Query Parameters:
  - All query parameters passed to callback
Body: POST payload passed to callback

Response (200):
{
  "success": true,
  "callbackId": "callback-id",
  "triggeredAt": "2025-10-25T11:00:00Z"
}
```

### Trigger by Custom Path
```
GET /api/trigger/custom/[path]
Query Parameters:
  - All query parameters passed to callback
Body: POST payload passed to callback

Response (200):
{
  "success": true,
  "callbackId": "callback-id",
  "triggeredAt": "2025-10-25T11:00:00Z"
}
```

---

## Logging & Analytics Endpoints

### Get Callback Logs
```
GET /api/logs
Authorization: Bearer <token>
Query Parameters:
  - callbackId: string (required)
  - limit: number (default: 20)
  - offset: number (default: 0)
  - startDate: ISO date string (optional)
  - endDate: ISO date string (optional)

Response (200):
{
  "logs": [
    {
      "id": "log-id",
      "event": "callback_executed",
      "callbackId": "callback-id",
      "responseTime": 245,
      "statusCode": 200,
      "success": true,
      "createdAt": "2025-10-25T11:00:00Z",
      "details": "{...}"
    }
  ],
  "total": 1
}
```

### Get Analytics Dashboard
```
GET /api/analytics
Authorization: Bearer <token>
Query Parameters:
  - period: 'hour' | 'day' | 'week' | 'month' (default: 'day')
  - callbackId: string (optional)

Response (200):
{
  "totalTriggers": 1200,
  "successRate": 99.2,
  "averageResponseTime": 342,
  "callbackStats": [
    {
      "callbackId": "callback-id",
      "callbackName": "Order Webhook",
      "triggers": 150,
      "success": 148,
      "failed": 2,
      "avgResponseTime": 245
    }
  ],
  "hourlyTrends": [
    {
      "hour": "2025-10-25T10:00:00Z",
      "triggers": 100,
      "success": 99,
      "failed": 1
    }
  ]
}
```

---

## API Keys Endpoints

### List API Keys
```
GET /api/api-keys
Authorization: Bearer <token>

Response (200):
{
  "keys": [
    {
      "id": "key-id",
      "name": "Production Key",
      "key": "api_key_xxx...",  // Masked
      "permissions": ["read", "write"],
      "expiresAt": "2026-10-25T00:00:00Z",
      "lastUsedAt": "2025-10-25T11:00:00Z",
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ]
}
```

### Create API Key
```
POST /api/api-keys
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "Production Key",
  "permissions": ["read", "write"],
  "expiresAt": "2026-10-25T00:00:00Z"
}

Response (201):
{
  "id": "key-id",
  "name": "Production Key",
  "key": "api_key_xxx...",  // Full key shown only once
  "permissions": ["read", "write"],
  "expiresAt": "2026-10-25T00:00:00Z",
  "createdAt": "2025-10-25T11:00:00Z"
}
```

### Delete API Key
```
DELETE /api/api-keys/[id]
Authorization: Bearer <token>

Response (204):
No content
```

---

## Subscription & Billing Endpoints

### Get Subscription Status
```
GET /api/subscription
Authorization: Bearer <token>

Response (200):
{
  "subscription": {
    "id": "subscription-id",
    "planId": "plan-id",
    "plan": {
      "id": "plan-id",
      "name": "Pro",
      "price": 29.99,
      "maxTriggers": 10000,
      "features": ["Analytics", "Rate Limiting", "Custom Paths"]
    },
    "status": "ACTIVE",
    "currentPeriodStart": "2025-10-01T00:00:00Z",
    "currentPeriodEnd": "2025-11-01T00:00:00Z"
  }
}
```

### Get Available Plans
```
GET /api/plans
Authorization: Bearer <token> (optional)

Response (200):
{
  "plans": [
    {
      "id": "plan-id-free",
      "name": "Free",
      "price": 0,
      "maxTriggers": 100,
      "features": ["Basic Callbacks", "1 Custom Path"]
    },
    {
      "id": "plan-id-pro",
      "name": "Pro",
      "price": 29.99,
      "maxTriggers": 10000,
      "features": ["Analytics", "Rate Limiting", "Unlimited Paths"]
    }
  ]
}
```

### Create Checkout Session
```
POST /api/subscription/create-checkout
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "planId": "plan-id-pro",
  "successUrl": "https://app.example.com/subscription/success",
  "cancelUrl": "https://app.example.com/subscription/cancel"
}

Response (200):
{
  "sessionId": "cs_live_xxx...",
  "url": "https://checkout.stripe.com/pay/cs_live_xxx..."
}
```

### Webhook (Stripe)
```
POST /api/payments/webhook
Content-Type: application/json
Stripe-Signature: t=...,v1=...

# Handles:
# - checkout.session.completed
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed

Response (200):
{
  "received": true
}
```

---

## Settings Endpoints

### Get User Settings
```
GET /api/settings
Authorization: Bearer <token>

Response (200):
{
  "settings": {
    "displayName": "John Doe",
    "slackWebhookUrl": "https://hooks.slack.com/services/...",
    "notifications": {
      "onFailure": true,
      "onSuccess": false,
      "rateLimit": "daily"
    }
  }
}
```

### Update User Settings
```
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "displayName": "John Doe",
  "slackWebhookUrl": "https://hooks.slack.com/services/...",
  "notifications": {
    "onFailure": true
  }
}

Response (200):
{
  "settings": { ... }
}
```

---

## Service Credentials Endpoints

### List Service Credentials
```
GET /api/service-credentials
Authorization: Bearer <token>

Response (200):
{
  "credentials": [
    {
      "id": "cred-id",
      "name": "SendGrid API",
      "provider": "SENDGRID",
      "meta": { "masked": true },
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ]
}
```

### Add Service Credential
```
POST /api/service-credentials
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "SendGrid API",
  "provider": "SENDGRID",
  "secret": "SG_xxx...",
  "meta": { "email": "noreply@example.com" }
}

Response (201):
{
  "id": "cred-id",
  "name": "SendGrid API",
  "provider": "SENDGRID",
  "createdAt": "2025-10-25T11:00:00Z"
}
```

### Delete Service Credential
```
DELETE /api/service-credentials/[id]
Authorization: Bearer <token>

Response (204):
No content
```

---

## Admin Endpoints

### Get Rate Limits
```
GET /api/admin/rate-limits
Authorization: Bearer <admin-token>

Response (200):
{
  "rateLimits": [
    {
      "id": "limit-id",
      "planId": "plan-id",
      "planName": "Pro",
      "requestsPerSecond": 5,
      "requestsPerMinute": 300,
      "requestsPerHour": 10000,
      "requestsPerMonth": 1000000,
      "isActive": true
    }
  ]
}
```

### Update Rate Limit
```
PUT /api/admin/rate-limits/[id]
Authorization: Bearer <admin-token>
Content-Type: application/json

Request:
{
  "requestsPerSecond": 10,
  "requestsPerMinute": 600,
  "requestsPerHour": 20000,
  "requestsPerMonth": 2000000
}

Response (200):
{
  "id": "limit-id",
  "requestsPerSecond": 10,
  ...
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created
- `204 No Content` - Resource deleted
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

**Last Updated**: October 25, 2025
