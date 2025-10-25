# 📚 Developer Guide: HTTP + MQTT Implementation

**Last Updated**: October 25, 2025  
**For Developers Working On**: API Endpoints (Tasks 7-9), UI Components (Task 10)

---

## 🎯 What You Need to Know

### The Architecture

Your application now supports **3 ways** to trigger external systems:

1. **HTTP Methods** - Direct webhook calls
   - User configures URL, method, headers, body
   - Supports GET, POST, PUT, DELETE, HEAD, OPTIONS, PATCH
   - Direct execution (synchronous)

2. **MQTT Publishing** - Message broker
   - Publish to topics asynchronously
   - Requires connection to external MQTT broker
   - Uses Redis job queue for reliability

3. **AMQP (Future)** - Message queues
   - Similar to MQTT but for RabbitMQ/AWS MQ
   - Exchange-based routing
   - Coming in Tasks 5-6

---

## 🔧 HTTP Module (src/lib/httpExecutor.ts)

### Usage Example

```typescript
import { HttpExecutor } from '@/lib/httpExecutor';

// Simple GET
const response = await HttpExecutor.get('https://api.example.com/health');
console.log(response.success, response.response?.status);

// POST with auth
const result = await HttpExecutor.post(
  'https://api.example.com/webhook',
  { event: 'triggered', id: '123' },
  {
    auth: {
      type: 'BEARER',
      bearer: { token: 'secret-token' }
    }
  }
);

// Full config with templates
const config = {
  method: 'POST',
  url: 'https://api.example.com/webhooks/{user_id}',
  headers: {
    'X-Callback-ID': '{callback_id}',
    'Authorization': 'Bearer {secret:auth_token}'
  },
  body: {
    event: 'webhook_triggered',
    timestamp: '{timestamp}',
    data: { /* original payload */ }
  },
  auth: {
    type: 'BEARER',
    bearer: { token: 'fallback-token' }
  },
  timeout: 30000
};

const result = await HttpExecutor.executeWithTemplate(config, {
  callback_id: 'cb-123',
  user_id: 'user-456',
  secret: { auth_token: 'secret' }
});
```

### Key Interfaces

```typescript
interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
  auth?: AuthConfig;
  timeout?: number;
}

interface HttpExecutionResult {
  success: boolean;
  request: HttpRequestDetails;
  response?: HttpResponseDetails;
  error?: string;
  duration: number;
}
```

### What Gets Logged

```typescript
request: {
  method: 'POST',
  url: 'https://api.example.com/webhook',
  headers: { 
    'Authorization': '***secret-suffix',  // Masked
    'Content-Type': 'application/json'
  },
  body: 'First 5KB of request body or truncated message',
  timestamp: '2025-10-25T14:30:00Z',
  size: 1024
}

response: {
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' },
  body: 'First 5KB of response or truncated message',
  bodySize: 256,
  duration: 245,
  timestamp: '2025-10-25T14:30:00.245Z'
}
```

---

## 🔑 Authentication Module (src/lib/httpAuth.ts)

### Available Auth Types

#### 1. No Authentication
```typescript
const auth = { type: 'NONE' };
```

#### 2. Basic Auth
```typescript
const auth = {
  type: 'BASIC',
  basic: {
    username: 'user@example.com',
    password: 'secret-password'
  }
};
// Generates: Authorization: Basic base64(user:pass)
```

#### 3. Bearer Token
```typescript
const auth = {
  type: 'BEARER',
  bearer: {
    token: 'my-secret-token'
  }
};
// Generates: Authorization: Bearer my-secret-token
```

#### 4. API Key
```typescript
const auth = {
  type: 'API_KEY',
  apiKey: {
    key: 'sk_live_1234567890',
    header: 'X-API-Key',
    prefix: 'Token'  // Optional
  }
};
// Generates: X-API-Key: Token sk_live_1234567890
```

#### 5. OAuth2
```typescript
const auth = {
  type: 'OAUTH2',
  oauth2: {
    clientId: 'client_id_xxx',
    clientSecret: 'client_secret_xxx',
    tokenUrl: 'https://oauth.example.com/token',
    grantType: 'client_credentials',
    scopes: ['read', 'write']  // Optional
  }
};
// Auto-fetches token, handles caching and refresh
```

### Helper Functions

```typescript
import { 
  createBasicAuth, 
  createBearerAuth, 
  createApiKeyAuth, 
  createOAuth2Auth,
  HttpAuthHandler 
} from '@/lib/httpAuth';

// Quick setup
const bearer = createBearerAuth('token-123');
const basic = createBasicAuth('user', 'pass');
const apiKey = createApiKeyAuth('key-123', 'X-API-Key');

// Validation
const validation = HttpAuthHandler.validate(bearer);
if (!validation.valid) {
  console.error(validation.errors);
}

// Encryption (for storage)
const encrypted = HttpAuthHandler.encryptConfig(bearer);
const decrypted = HttpAuthHandler.decryptConfig(encrypted);

// Safe logging (masks sensitive data)
const safe = HttpAuthHandler.toSafeConfig(bearer);
console.log(safe);
// { type: 'BEARER', masked: { token: '***d4' }, ... }
```

---

## 📡 MQTT Module (src/lib/mqtt/)

### Publisher Setup

```typescript
import { MqttPublisher, publishToMqtt } from '@/lib/mqtt/publisher';
import { encryptSecret } from '@/lib/cryptoHelper';

// Option 1: Create publisher instance
const publisher = new MqttPublisher({
  broker: 'mqtt://broker.hivemq.com:1883',
  username: 'mqtt_user',
  password: 'encrypted_password',  // Use encryptSecret()
  clientId: 'webtrigger-app',
  topic: 'app/webhooks/{callback_id}/triggered',
  qos: 1,
  retain: false,
  payloadFormat: 'JSON'
});

// Publish
const result = await publisher.publish({
  payload: { event: 'triggered', data: {} },
  templateContext: {
    callback_id: 'cb-123',
    timestamp: new Date().toISOString()
  }
});

console.log(result);
// {
//   success: true,
//   topic: 'app/webhooks/cb-123/triggered',
//   payload: { event, data },
//   payloadSize: 256,
//   duration: 145
// }

await publisher.disconnect();

// Option 2: One-off publish
const quickResult = await publishToMqtt(
  {
    broker: 'mqtt://broker.hivemq.com:1883',
    topic: 'app/events',
    qos: 1
  },
  { event: 'test' }
);
```

### Key Classes

#### MqttClientWrapper
Low-level MQTT client with pooling:

```typescript
import { MqttClientWrapper, MqttConnectionPool } from '@/lib/mqtt/client';

// Direct usage
const client = new MqttClientWrapper({
  broker: 'mqtt://broker.hivemq.com:1883',
  username: 'user',
  password: 'pass'
});

await client.connect();
const result = await client.publish('my/topic', JSON.stringify({ test: true }), { qos: 1 });
await client.disconnect();

// Connection pooling
import { getGlobalMqttPool } from '@/lib/mqtt/client';

const pool = getGlobalMqttPool();
const connection = await pool.getConnection(config);
await connection.publish('topic', payload);
// Connection stays alive for reuse
```

#### MqttPublisher
High-level publisher with templates:

```typescript
import { MqttPublisher } from '@/lib/mqtt/publisher';

const publisher = new MqttPublisher({
  broker: 'mqtt://broker.hivemq.com:1883',
  topic: 'app/{app_id}/events/{type}',
  qos: 2,
  payloadFormat: 'JSON',
  maxRetries: 3
});

// Templates are resolved automatically
const result = await publisher.publish({
  payload: { message: 'Hello' },
  templateContext: {
    app_id: 'app-123',
    type: 'webhook'
  }
});

// Result topic: app/app-123/events/webhook
```

### Message Formats

#### JSON (Default)
```typescript
{
  payloadFormat: 'JSON',
  payload: { key: 'value', nested: { data: 123 } }
}
// Publishes: {"key":"value","nested":{"data":123}}
```

#### TEXT
```typescript
{
  payloadFormat: 'TEXT',
  payload: 'Plain text message'
}
// Publishes: Plain text message
```

#### XML
```typescript
{
  payloadFormat: 'XML',
  payload: { event: 'triggered', id: '123' }
}
// Publishes: <payload><event>triggered</event><id>123</id></payload>
```

---

## 🔗 Template Variables (Shared)

Both HTTP and MQTT support variable substitution:

### Global Variables (No Context Needed)
```
{timestamp}       → "2025-10-25T14:30:00.123Z"
{timestamp_unix}  → "1729876200"
{timestamp_ms}    → "1729876200123"
{uuid}            → "550e8400-e29b-41d4-a716-446655440000"
{date}            → "2025-10-25"
{time}            → "14:30:00"
```

### Context Variables (Provided at Runtime)
```
{callback_id}     → callback.id
{user_id}         → provided in templateContext
{custom_field}    → provided in templateContext
```

### Environment Variables
```
{env:DATABASE_URL}     → process.env.DATABASE_URL
{env:API_KEY}          → process.env.API_KEY
```

### Service Secrets
```
{secret:stripe_key}    → Decrypted from ServiceCredential
{secret:auth_token}    → Decrypted secret
```

---

## 🛠️ Database Integration

### Storing HTTP Configuration

```typescript
import { prisma } from '@/lib/prisma';

const callback = await prisma.callback.update({
  where: { id: 'cb-123' },
  data: {
    httpMethod: 'POST',
    httpHeaders: JSON.parse(JSON.stringify({
      'X-Custom-Header': 'value',
      'Authorization': 'Bearer token'
    })),
    httpBody: JSON.parse(JSON.stringify({
      event: 'webhook',
      id: '{callback_id}'
    })),
    queryParams: JSON.parse(JSON.stringify({
      v: '1'
    })),
    authType: 'BEARER',
    authConfig: JSON.parse(JSON.stringify({
      token: 'secret-token'
    }))
  }
});
```

### Storing MQTT Configuration

```typescript
const mqttConfig = await prisma.callbackMqtt.create({
  data: {
    callbackId: 'cb-123',
    broker: 'mqtt://broker.hivemq.com:1883',
    username: 'user',
    password: encryptSecret('password'),
    topic: 'app/webhooks/{user_id}',
    qos: 1,
    payloadFormat: 'JSON',
    payloadTemplate: {
      event: 'triggered',
      id: '{callback_id}',
      user: '{user_id}'
    },
    enabled: true
  }
});
```

### Logging Results

```typescript
// HTTP
const httpLog = await prisma.log.create({
  data: {
    callbackId: 'cb-123',
    event: 'http_webhook',
    statusCode: result.response?.status,
    responseTime: result.duration,
    success: result.success,
    details: JSON.stringify({
      method: result.request.method,
      url: result.request.url,
      error: result.error
    })
  }
});

// MQTT
const mqttLog = await prisma.mqttPublishLog.create({
  data: {
    callbackId: 'cb-123',
    topic: publishResult.topic,
    payload: publishResult.payload,
    qos: 1,
    success: publishResult.success,
    duration: publishResult.duration,
    error: publishResult.error
  }
});
```

---

## ⚡ Performance Considerations

### HTTP Executor
- **Timeout**: Default 30 seconds, configurable
- **Retry**: Up to 3 attempts with exponential backoff
- **Logging**: First 5KB of request/response body only
- **Memory**: One-time allocation per request, then GC

### MQTT Publisher
- **Connection Pooling**: Reuses connections for same broker
- **Async**: Non-blocking publish operations
- **Retry**: Configurable retry count and delay
- **Payload**: Full payload sent (no truncation at publish time)

### Optimization Tips
1. **Use connection pooling** for MQTT
2. **Set appropriate timeouts** for HTTP
3. **Log sparingly** - first 5KB is usually enough
4. **Batch publishes** when possible
5. **Use QoS 1** for MQTT unless you need QoS 2

---

## 🧪 Testing

### Mock HTTP Requests
```typescript
// Use httpbin.org for testing
const result = await HttpExecutor.post(
  'https://httpbin.org/post',
  { test: 'data' }
);

console.log(result.success);  // Should be true
console.log(result.response?.status);  // Should be 200
```

### Test MQTT Locally
```bash
# Start Mosquitto
mosquitto

# In Node.js
const result = await publishToMqtt(
  {
    broker: 'mqtt://localhost:1883',
    topic: 'test/topic',
    qos: 1
  },
  { message: 'test' }
);
```

---

## 🐛 Debugging

### Enable Request Logging
```typescript
const result = await HttpExecutor.execute(config);
console.log('Request:', result.request);
console.log('Response:', result.response);
console.log('Errors:', result.error);
```

### Check MQTT Connection
```typescript
const publisher = new MqttPublisher(config);
await publisher.initialize();

const status = publisher.getStatus();
console.log(status);
// { initialized: true, connected: true, broker: '...', topic: '...' }
```

### Validate Templates
```typescript
import { HttpTemplateEngine } from '@/lib/httpTemplateEngine';

const unresolved = HttpTemplateEngine.findUnresolved(
  'Hello {name}, timestamp is {timestamp}',
  { name: 'John' }
);
console.log(unresolved);  // ['timestamp'] - missing context
```

---

## 📋 Next Steps for Team

### For API Endpoint Developers (Task 7-9)
1. Read the HTTP_MQTT_QUICKSTART.md for usage patterns
2. Create endpoints like:
   - `POST /api/callbacks/{id}/http` - Configure HTTP
   - `POST /api/callbacks/{id}/mqtt` - Configure MQTT
   - `GET /api/callbacks/{id}/logs` - Get execution logs
3. Test with httpbin.org and local Mosquitto
4. Implement request validation with Zod

### For UI Developers (Task 10)
1. Create form components for HTTP method selection
2. Add headers/body editor with template variables reference
3. Build MQTT configuration form
4. Show execution logs with filtering
5. Add test button for manual trigger

### For DevOps (Task 11)
1. Setup Redis for job queue
2. Create background worker service
3. Deploy to Railway/Heroku
4. Configure MQTT broker (HiveMQ Cloud or AWS IoT Core)
5. Setup monitoring and alerts

---

## 📚 Reference Documents

- **EXTENDED_TRIGGERS_STRATEGY.md** - High-level architecture
- **IMPLEMENTATION_PROGRESS.md** - What's been completed
- **HTTP_MQTT_QUICKSTART.md** - Code examples
- **This file** - Developer guide for implementation

---

**Last Updated**: October 25, 2025  
**Next Review**: After Tasks 5-6 (AMQP) completion  
**Questions?** Refer to quickstart guide or examine test files

