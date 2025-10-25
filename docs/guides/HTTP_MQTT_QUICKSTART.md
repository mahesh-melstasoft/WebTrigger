# 🏗️ Extended Triggers Architecture & Quick Start

**Last Updated**: October 25, 2025  
**Completed**: HTTP Methods + MQTT Support

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Webhook Trigger                         │
│                  (Custom Path or Token)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                    (Received)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              HTTP Request Processor                          │
│  - Parse webhook data                                       │
│  - Apply template substitution                              │
│  - Validate callback configuration                          │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
    ┌─────────────┐ ┌────────────┐ ┌─────────────┐
    │   HTTP      │ │   MQTT     │ │    AMQP     │
    │ Trigger     │ │ Publisher  │ │ (Queued)    │
    │ (Direct)    │ │ (Queued)   │ │             │
    └─────────────┘ └────────────┘ └─────────────┘
         │              │              │
         ↓              ↓              ↓
    ┌─────────────────────────────────────┐
    │        Action Executor              │
    │  - Execute configured actions       │
    │  - Log results                      │
    │  - Send notifications               │
    └─────────────────────────────────────┘
```

---

## 🚀 HTTP Methods - Quick Start

### 1. Configure Callback with HTTP Method

```typescript
import { prisma } from '@/lib/prisma';

// Create callback with HTTP configuration
const callback = await prisma.callback.create({
  data: {
    userId: 'user-123',
    name: 'Payment Notification',
    callbackUrl: 'https://api.example.com/webhooks/payment',
    
    // HTTP Configuration
    httpMethod: 'POST',
    httpHeaders: JSON.parse(JSON.stringify({
      'X-Callback-ID': '{callback_id}',
      'X-Timestamp': '{timestamp}',
      'Authorization': '{secret:api_key}'
    })),
    httpBody: JSON.parse(JSON.stringify({
      event: 'payment_completed',
      callbackId: '{callback_id}',
      timestamp: '{timestamp}',
      payload: '{original_payload}'
    })),
    queryParams: JSON.parse(JSON.stringify({
      version: 'v1',
      client_id: '{client_id}'
    })),
    
    // Authentication
    authType: 'BEARER',
    authConfig: JSON.parse(JSON.stringify({
      token: 'secret-token-here'
    }))
  }
});
```

### 2. Execute HTTP Request

```typescript
import { HttpExecutor } from '@/lib/httpExecutor';

const result = await HttpExecutor.executeWithTemplate(
  {
    method: 'POST',
    url: 'https://api.example.com/webhooks/payment',
    headers: {
      'X-Callback-ID': '{callback_id}',
      'Authorization': 'Bearer {secret:token}'
    },
    body: {
      event: 'payment',
      id: '{callback_id}'
    },
    auth: {
      type: 'BEARER',
      bearer: { token: 'my-token' }
    }
  },
  {
    callback_id: callback.id,
    timestamp: new Date().toISOString(),
    secret: { token: 'my-secret' }
  }
);

console.log(result);
// {
//   success: true,
//   request: { method, url, headers, body, ... },
//   response: { status: 200, headers, body, duration, ... },
//   duration: 245
// }
```

### 3. Use Helper Methods

```typescript
// Simple GET
const get = await HttpExecutor.get('https://api.example.com/health');

// Simple POST
const post = await HttpExecutor.post('https://api.example.com/webhook', {
  event: 'triggered',
  id: '123'
});

// PUT with auth
const put = await HttpExecutor.put(
  'https://api.example.com/webhook/123',
  { status: 'updated' },
  {
    auth: {
      type: 'BEARER',
      bearer: { token: 'my-token' }
    }
  }
);

// DELETE
const del = await HttpExecutor.delete('https://api.example.com/webhook/123');

// OPTIONS
const options = await HttpExecutor.options('https://api.example.com/webhook');

// HEAD
const head = await HttpExecutor.head('https://api.example.com/webhook');
```

---

## 📡 MQTT - Quick Start

### 1. Configure MQTT for Callback

```typescript
import { prisma } from '@/lib/prisma';

// Add MQTT configuration to callback
const callbackWithMqtt = await prisma.callbackMqtt.create({
  data: {
    callbackId: callback.id,
    
    // Broker
    broker: 'mqtt://broker.hivemq.com:1883',
    username: 'mqtt_user',
    password: 'encrypted_password', // Use encryptSecret()
    clientId: 'webtrigger-callback-123',
    
    // Topic with variables
    topic: 'app/payments/{user_id}/completed',
    
    // Quality of Service
    qos: 1, // At least once delivery
    retain: false,
    
    // Message
    payloadFormat: 'JSON',
    payloadTemplate: {
      event: 'payment_completed',
      callbackId: '{callback_id}',
      timestamp: '{timestamp}',
      data: '{original_payload}'
    },
    
    // Retry
    maxRetries: 3,
    retryDelayMs: 1000,
    
    enabled: true
  }
});
```

### 2. Publish Message

```typescript
import { MqttPublisher } from '@/lib/mqtt/publisher';

const publisher = new MqttPublisher({
  broker: 'mqtt://broker.hivemq.com:1883',
  username: 'mqtt_user',
  password: 'password',
  topic: 'app/payments/{user_id}/completed',
  qos: 1,
  payloadFormat: 'JSON'
});

const result = await publisher.publish({
  payload: {
    event: 'payment_completed',
    amount: 99.99
  },
  templateContext: {
    user_id: 'user-456',
    callback_id: callback.id,
    timestamp: new Date().toISOString()
  }
});

console.log(result);
// {
//   success: true,
//   topic: 'app/payments/user-456/completed',
//   payload: { event, amount },
//   payloadSize: 89,
//   duration: 156
// }

await publisher.disconnect();
```

### 3. Quick Publish (One-Off)

```typescript
import { publishToMqtt } from '@/lib/mqtt/publisher';

const result = await publishToMqtt(
  {
    broker: 'mqtt://broker.hivemq.com:1883',
    topic: 'app/events/{event_type}',
    qos: 1
  },
  {
    event: 'user_signup',
    userId: 'user-123',
    timestamp: new Date().toISOString()
  },
  {
    event_type: 'signup'
  }
);
```

---

## 🔐 Authentication Examples

### Basic Auth

```typescript
import { HttpExecutor, createBasicAuth } from '@/lib/httpAuth';

const result = await HttpExecutor.execute({
  method: 'GET',
  url: 'https://api.example.com/data',
  auth: createBasicAuth('username', 'password')
});
```

### Bearer Token

```typescript
import { createBearerAuth } from '@/lib/httpAuth';

const result = await HttpExecutor.execute({
  method: 'POST',
  url: 'https://api.example.com/webhook',
  body: { data: 'test' },
  auth: createBearerAuth('my-secret-token')
});
```

### API Key

```typescript
import { createApiKeyAuth } from '@/lib/httpAuth';

const result = await HttpExecutor.execute({
  method: 'GET',
  url: 'https://api.example.com/data',
  auth: createApiKeyAuth(
    'sk_live_xxxxxxxxx',  // API key
    'X-API-Key',          // Header name
    'Token'               // Optional prefix
  )
});
```

### OAuth2

```typescript
import { createOAuth2Auth } from '@/lib/httpAuth';

const result = await HttpExecutor.execute({
  method: 'POST',
  url: 'https://api.example.com/webhook',
  body: { data: 'test' },
  auth: createOAuth2Auth(
    'client_id_xxxxx',
    'client_secret_xxxxx',
    'https://oauth.example.com/token'
  )
});
```

---

## 📊 Template Variables Reference

### Built-in Variables (Global)

```
{timestamp}           → "2025-10-25T14:30:00.123Z" (ISO 8601)
{timestamp_unix}      → "1729876200" (Unix seconds)
{timestamp_ms}        → "1729876200123" (Unix milliseconds)
{uuid}                → "550e8400-e29b-41d4-a716-446655440000"
{uuid_v4}             → Same as {uuid}
{date}                → "2025-10-25" (YYYY-MM-DD)
{time}                → "14:30:00" (HH:MM:SS)
```

### Context Variables

```
{callback_id}         → "callback-123-abc"
{user_id}             → Context-dependent, provided in template context
{payload}             → JSON stringified original payload
```

### Environment Variables

```
{env:DATABASE_URL}    → Value of DATABASE_URL environment variable
{env:API_KEY}         → Value of API_KEY environment variable
```

### Service Secrets

```
{secret:stripe_key}   → Decrypted secret from ServiceCredential
{secret:api_token}    → Decrypted secret
```

### Custom Variables (Context-Provided)

```
In template context:
{
  custom_field: 'value123',
  user_name: 'John Doe'
}

In template:
{custom_field}        → "value123"
{user_name}           → "John Doe"
```

---

## 🧪 Testing HTTP Methods

### Test All Methods

```typescript
const testUrl = 'https://httpbin.org';

// GET
const get = await HttpExecutor.get(`${testUrl}/get`);
console.log('GET:', get.success);

// POST
const post = await HttpExecutor.post(`${testUrl}/post`, { test: 'data' });
console.log('POST:', post.success);

// PUT
const put = await HttpExecutor.put(`${testUrl}/put`, { test: 'data' });
console.log('PUT:', put.success);

// DELETE
const del = await HttpExecutor.delete(`${testUrl}/delete`);
console.log('DELETE:', del.success);

// HEAD
const head = await HttpExecutor.head(`${testUrl}/get`);
console.log('HEAD:', head.success);

// OPTIONS
const options = await HttpExecutor.options(`${testUrl}/options`);
console.log('OPTIONS:', options.success);

// PATCH
const patch = await HttpExecutor.patch(`${testUrl}/patch`, { test: 'data' });
console.log('PATCH:', patch.success);
```

---

## 🔗 MQTT Broker Setup

### HiveMQ Cloud (Recommended for Testing)

1. Sign up at https://www.hivemq.cloud/
2. Create cluster
3. Add credentials:
   ```typescript
   const config = {
     broker: 'mqtt://xxxxx-xxxxxxx.s1.eu.hivemq.cloud:1883',
     username: 'your_username',
     password: 'your_password'
   };
   ```

### AWS IoT Core

1. Create IoT Core device
2. Download certificates
3. Configure:
   ```typescript
   const config = {
     broker: 'mqtts://xxxxxxxxxxxxxx.iot.us-east-1.amazonaws.com:8883',
     clientId: 'device_id'
     // With certificates (requires additional setup)
   };
   ```

### Local Testing (Mosquitto)

```bash
# Install
brew install mosquitto

# Start broker
mosquitto -p 1883

# Subscribe (in another terminal)
mosquitto_sub -t 'test/#'

# Publish test
mosquitto_pub -t 'test/hello' -m 'Hello MQTT'
```

---

## 📝 Example: Complete Integration

```typescript
// 1. Create callback with HTTP
const callback = await prisma.callback.create({
  data: {
    userId: 'user-123',
    name: 'Payment Webhook',
    callbackUrl: 'https://api.example.com/webhooks/payment',
    httpMethod: 'POST',
    httpHeaders: JSON.parse(JSON.stringify({
      'X-Webhook-ID': '{callback_id}',
      'X-Timestamp': '{timestamp}'
    })),
    authType: 'BEARER',
    authConfig: JSON.parse(JSON.stringify({
      token: 'secret-token'
    }))
  }
});

// 2. Add MQTT publishing
await prisma.callbackMqtt.create({
  data: {
    callbackId: callback.id,
    broker: 'mqtt://broker.hivemq.com:1883',
    topic: 'payments/webhook/{status}',
    qos: 1,
    payloadFormat: 'JSON'
  }
});

// 3. Execute both HTTP and MQTT when triggered
async function handleWebhookTrigger(data: any) {
  // HTTP
  const httpResult = await HttpExecutor.post(
    callback.callbackUrl,
    data,
    {
      auth: {
        type: 'BEARER',
        bearer: { token: 'secret-token' }
      }
    }
  );
  
  // MQTT
  const mqttResult = await publishToMqtt(
    {
      broker: 'mqtt://broker.hivemq.com:1883',
      topic: 'payments/webhook/completed',
      qos: 1
    },
    {
      webhook_id: callback.id,
      http_status: httpResult.response?.status,
      success: httpResult.success
    }
  );
  
  return { httpResult, mqttResult };
}
```

---

## 🎯 Next Steps

1. **API Endpoints** (Task 7-9)
   - Create REST endpoints for managing HTTP/MQTT/AMQP configurations
   - Test endpoints

2. **Dashboard UI** (Task 10)
   - Build React components for configuration
   - Add visualizations for logs and metrics

3. **Background Workers** (Task 11)
   - Setup Redis job queue
   - Deploy worker service to Railway/Heroku

4. **Testing** (Task 12)
   - Unit tests for all executors
   - Integration tests with test brokers

---

**Generated**: October 25, 2025  
**Status**: Architecture & APIs Ready  
**Next**: Build API endpoints and UI components

