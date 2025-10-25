# 📋 API Endpoints Implementation Checklist

**Tasks**: 7, 8, 9  
**Duration**: 6-9 days total  
**Start Date**: After Task 6 completion

---

## Task 7: Create API Endpoints for HTTP

**Duration**: 2-3 days

### Endpoints to Create

#### `POST /api/callbacks/{id}/http`
Configure HTTP method for callback

```typescript
// Request Body
{
  method: "POST",  // GET, POST, PUT, DELETE, HEAD, OPTIONS, PATCH
  headers: {
    "X-Custom": "value",
    "Authorization": "{secret:auth_token}"
  },
  body: {
    event: "webhook",
    id: "{callback_id}"
  },
  queryParams: {
    version: "v1"
  },
  authType: "BEARER",  // NONE, BASIC, BEARER, API_KEY, OAUTH2
  authConfig: {
    token: "secret-token"
  },
  timeout: 30000
}

// Response
{
  success: true,
  callback: { id, httpMethod, httpHeaders, ... }
}
```

#### `GET /api/callbacks/{id}/http`
Retrieve HTTP configuration

```typescript
// Response
{
  success: true,
  callback: {
    id: "cb-123",
    httpMethod: "POST",
    httpHeaders: { ... },
    httpBody: { ... },
    queryParams: { ... },
    authType: "BEARER",
    authConfig: { /* masked */ },
    requestDetails: { /* last request */ },
    responseDetails: { /* last response */ }
  }
}
```

#### `PUT /api/callbacks/{id}/http`
Update HTTP configuration

Same request body as POST, updates existing config

#### `DELETE /api/callbacks/{id}/http`
Clear HTTP configuration

```typescript
// Response
{
  success: true,
  message: "HTTP configuration cleared"
}
```

#### `GET /api/callbacks/{id}/http/logs`
Get HTTP execution logs

```typescript
// Query Parameters
- limit: number (default 50)
- offset: number (default 0)
- success: boolean (optional filter)
- dateFrom: ISO string (optional)
- dateTo: ISO string (optional)

// Response
{
  success: true,
  logs: [
    {
      id: "log-123",
      method: "POST",
      url: "https://...",
      status: 200,
      duration: 245,
      success: true,
      timestamp: "2025-10-25T14:30:00Z"
    }
  ],
  total: 1500,
  limit: 50,
  offset: 0
}
```

#### `POST /api/callbacks/{id}/http/test`
Send a test HTTP request

```typescript
// Request Body
{
  payload: { /* test data */ },
  templateContext: { /* variables */ }
}

// Response
{
  success: true,
  request: { method, url, headers, body, ... },
  response: { status, statusText, body, duration, ... },
  duration: 245
}
```

#### `GET /api/callbacks/{id}/http/variables`
Get available template variables reference

```typescript
// Response
{
  success: true,
  global: [
    { name: "timestamp", description: "ISO 8601 timestamp", example: "2025-10-25T14:30:00Z" },
    { name: "uuid", description: "UUID v4", example: "550e8400..." }
  ],
  context: [
    { name: "callback_id", required: true },
    { name: "user_id", required: false }
  ],
  environment: [
    { name: "DATABASE_URL" },
    { name: "API_KEY" }
  ]
}
```

### Validation Required

```typescript
// Use Zod schemas
const httpConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH']),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  queryParams: z.record(z.string()).optional(),
  authType: z.enum(['NONE', 'BASIC', 'BEARER', 'API_KEY', 'OAUTH2']).optional(),
  authConfig: z.unknown().optional(),
  timeout: z.number().min(1000).max(60000).optional()
});
```

### Error Handling

```typescript
// Return 400 for validation errors
{
  success: false,
  error: "Invalid HTTP method: INVALID",
  field: "method"
}

// Return 404 if callback not found
{
  success: false,
  error: "Callback not found"
}

// Return 403 if user doesn't own callback
{
  success: false,
  error: "Unauthorized"
}
```

### Database Operations

```typescript
// Save to Prisma
await prisma.callback.update({
  where: { id },
  data: {
    httpMethod: method,
    httpHeaders: headers ? JSON.parse(JSON.stringify(headers)) : null,
    httpBody: body ? JSON.parse(JSON.stringify(body)) : null,
    queryParams: queryParams ? JSON.parse(JSON.stringify(queryParams)) : null,
    authType,
    authConfig: authConfig ? HttpAuthHandler.encryptConfig(authConfig) : null
  }
});
```

### Location

`src/app/api/callbacks/[id]/http/route.ts`

---

## Task 8: Create API Endpoints for MQTT

**Duration**: 2-3 days

### Endpoints to Create

#### `POST /api/callbacks/{id}/mqtt`
Configure MQTT for callback

```typescript
// Request Body
{
  broker: "mqtt://broker.hivemq.com:1883",
  username: "mqtt_user",
  password: "secret_password",  // Gets encrypted
  clientId: "webtrigger-app",
  topic: "app/webhooks/{callback_id}",
  qos: 1,  // 0, 1, or 2
  retain: false,
  payloadFormat: "JSON",  // JSON, TEXT, XML
  payloadTemplate: {
    event: "triggered",
    id: "{callback_id}"
  },
  maxRetries: 3,
  retryDelayMs: 1000,
  enabled: true
}

// Response
{
  success: true,
  mqtt: {
    id: "mqtt-123",
    broker: "mqtt://...",
    topic: "app/webhooks/...",
    enabled: true,
    lastTestAt: null,
    lastTestStatus: null
  }
}
```

#### `GET /api/callbacks/{id}/mqtt`
Retrieve MQTT configuration

```typescript
// Response
{
  success: true,
  mqtt: {
    id: "mqtt-123",
    broker: "mqtt://...",
    username: "mqtt_user",
    topic: "app/webhooks/{callback_id}",
    qos: 1,
    retain: false,
    payloadFormat: "JSON",
    payloadTemplate: { ... },
    enabled: true,
    lastTestAt: "2025-10-25T14:00:00Z",
    lastTestStatus: true
  }
}
```

#### `PUT /api/callbacks/{id}/mqtt`
Update MQTT configuration

Same request body as POST

#### `DELETE /api/callbacks/{id}/mqtt`
Remove MQTT configuration

```typescript
// Response
{
  success: true,
  message: "MQTT configuration removed"
}
```

#### `GET /api/callbacks/{id}/mqtt/logs`
Get MQTT publish logs

```typescript
// Query Parameters
- limit: number (default 50)
- offset: number (default 0)
- success: boolean (optional)
- dateFrom: ISO string
- dateTo: ISO string

// Response
{
  success: true,
  logs: [
    {
      id: "log-123",
      topic: "app/webhooks/cb-123",
      qos: 1,
      success: true,
      duration: 156,
      timestamp: "2025-10-25T14:30:00Z"
    }
  ],
  total: 500,
  limit: 50,
  offset: 0
}
```

#### `POST /api/callbacks/{id}/mqtt/test`
Send test MQTT message

```typescript
// Request Body
{
  payload: { event: "test" },
  templateContext: { callback_id: "cb-123" }
}

// Response
{
  success: true,
  topic: "app/webhooks/cb-123",
  messageId: "msg-123",
  duration: 245,
  qos: 1,
  timestamp: "2025-10-25T14:30:00Z"
}
```

#### `POST /api/callbacks/{id}/mqtt/validate`
Validate broker connection

```typescript
// Request Body
{
  broker: "mqtt://broker.hivemq.com:1883",
  username: "user",
  password: "pass",
  clientId: "test-client"
}

// Response
{
  success: true,
  connected: true,
  broker: "mqtt://...",
  message: "Connected successfully"
}

// On error
{
  success: false,
  error: "Connection refused",
  broker: "mqtt://..."
}
```

#### `POST /api/mqtt/brokers/test`
Test any broker connection (admin endpoint)

```typescript
// Request Body
{
  broker: "mqtt://...",
  username: "user",
  password: "pass"
}

// Response (same as above)
```

### Validation Required

```typescript
const mqttConfigSchema = z.object({
  broker: z.string().url().startsWith('mqtt'),
  username: z.string().optional(),
  password: z.string().optional(),
  clientId: z.string().optional(),
  topic: z.string().min(1),
  qos: z.enum([0, 1, 2]),
  retain: z.boolean().optional(),
  payloadFormat: z.enum(['JSON', 'TEXT', 'XML']).optional(),
  payloadTemplate: z.unknown().optional(),
  maxRetries: z.number().min(0).max(10).optional(),
  retryDelayMs: z.number().min(100).max(60000).optional(),
  enabled: z.boolean().optional()
});
```

### Password Encryption

```typescript
import { encryptSecret, decryptSecret } from '@/lib/cryptoHelper';

// On save
const encrypted = encryptSecret(password);

// On retrieve
const decrypted = decryptSecret(mqtt.password);
```

### Location

`src/app/api/callbacks/[id]/mqtt/route.ts`  
`src/app/api/mqtt/brokers/route.ts`

---

## Task 9: Create API Endpoints for AMQP

**Duration**: 2-3 days

### Endpoints to Create (Same Pattern as MQTT)

#### `POST /api/callbacks/{id}/amqp`
Configure AMQP

```typescript
// Request Body
{
  brokerUrl: "amqp://user:pass@broker.example.com",
  exchangeName: "webhooks",
  routingKey: "callbacks.{callback_id}.triggered",
  exchangeType: "topic",  // direct, topic, fanout
  durable: true,
  autoDelete: false,
  username: "amqp_user",
  password: "secret",
  messageFormat: "JSON",
  messageTemplate: { event: "triggered", id: "{callback_id}" },
  priority: 5,
  persistent: true,
  contentType: "application/json",
  enabled: true
}

// Response
{ success: true, amqp: {...} }
```

#### `GET /api/callbacks/{id}/amqp`
Get AMQP configuration

#### `PUT /api/callbacks/{id}/amqp`
Update AMQP configuration

#### `DELETE /api/callbacks/{id}/amqp`
Remove AMQP configuration

#### `GET /api/callbacks/{id}/amqp/logs`
Get publish logs

#### `POST /api/callbacks/{id}/amqp/test`
Send test message

```typescript
// Similar to MQTT test
{
  success: true,
  exchange: "webhooks",
  routingKey: "callbacks.cb-123.triggered",
  messageId: "msg-123",
  duration: 245
}
```

#### `POST /api/callbacks/{id}/amqp/validate`
Validate broker connection

```typescript
// Same pattern as MQTT validation
```

### Validation Schema

```typescript
const amqpConfigSchema = z.object({
  brokerUrl: z.string().startsWith('amqp'),
  exchangeName: z.string(),
  routingKey: z.string(),
  exchangeType: z.enum(['direct', 'topic', 'fanout', 'headers']),
  username: z.string().optional(),
  password: z.string().optional(),
  durable: z.boolean().optional(),
  autoDelete: z.boolean().optional(),
  messageFormat: z.enum(['JSON', 'XML', 'TEXT']).optional(),
  messageTemplate: z.unknown().optional(),
  priority: z.number().min(0).max(10).optional(),
  persistent: z.boolean().optional(),
  contentType: z.string().optional(),
  enabled: z.boolean().optional()
});
```

### Location

`src/app/api/callbacks/{id}/amqp/route.ts`  
`src/app/api/amqp/brokers/route.ts`

---

## General Requirements for All Endpoints

### Authentication & Authorization
- ✅ Verify user is authenticated
- ✅ Verify user owns the callback
- ✅ Use session.user.id to filter results

```typescript
const session = await auth();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const callback = await prisma.callback.findUnique({
  where: { id, userId: session.user.id }
});
if (!callback) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

### Error Responses
- ✅ 400 - Validation error
- ✅ 401 - Unauthorized
- ✅ 403 - Forbidden
- ✅ 404 - Not found
- ✅ 500 - Server error

### Logging
- ✅ Log all actions (create, update, delete, test)
- ✅ Include user ID, callback ID, action type
- ✅ Don't log sensitive data (passwords, tokens)

### Pagination
- ✅ Support limit/offset for list endpoints
- ✅ Return total count
- ✅ Max limit 100

### Response Format

```typescript
// Success
{
  success: true,
  data: { /* result */ }
}

// Error
{
  success: false,
  error: "Error message",
  field: "field_name"  // Optional: which field failed
}

// List
{
  success: true,
  data: [ /* items */ ],
  total: 1500,
  limit: 50,
  offset: 0
}
```

---

## Testing Checklist

### Unit Tests
- [ ] HTTP method validation
- [ ] MQTT topic validation
- [ ] AMQP routing key validation
- [ ] Template variable resolution
- [ ] Auth config encryption/decryption
- [ ] Error handling

### Integration Tests
- [ ] Create HTTP config
- [ ] Update HTTP config
- [ ] Delete HTTP config
- [ ] Get HTTP logs
- [ ] Test HTTP request
- [ ] Same for MQTT
- [ ] Same for AMQP

### Manual Testing
- [ ] Test with httpbin.org (HTTP)
- [ ] Test with local Mosquitto (MQTT)
- [ ] Test with CloudAMQP or local RabbitMQ (AMQP)
- [ ] Verify logs are saved
- [ ] Verify error handling

---

## Performance Considerations

### Query Optimization
- ✅ Use indexes on common filters
- ✅ Batch operations when possible
- ✅ Use select() to only fetch needed fields

```typescript
// Don't fetch password for lists
select: {
  id: true,
  broker: true,
  topic: true,
  enabled: true,
  // Exclude password
}
```

### Caching
- ✅ Consider caching broker validation results (5 min)
- ✅ Cache template variable reference
- ✅ Invalidate cache on config update

### Rate Limiting
- ✅ Limit test requests (max 10/minute)
- ✅ Limit log retrieval (max 1000 results)

---

## Documentation for Each Endpoint

Create OpenAPI/Swagger definitions for all endpoints:

```typescript
/**
 * @openapi
 * /api/callbacks/{id}/http:
 *   post:
 *     summary: Configure HTTP method for callback
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HttpConfig'
 *     responses:
 *       200:
 *         description: HTTP config created/updated
 *       400:
 *         description: Validation error
 */
```

---

## Key Files to Create

```
src/app/api/
├── callbacks/
│   └── [id]/
│       ├── http/
│       │   └── route.ts
│       ├── mqtt/
│       │   └── route.ts
│       └── amqp/
│           └── route.ts
├── mqtt/
│   └── brokers/
│       └── route.ts
└── amqp/
    └── brokers/
        └── route.ts
```

---

## Integration with Existing Code

### Use These Services
- ✅ HttpExecutor from `@/lib/httpExecutor`
- ✅ HttpAuthHandler from `@/lib/httpAuth`
- ✅ MqttPublisher from `@/lib/mqtt/publisher`
- ✅ (Future) AmqpPublisher from `@/lib/amqp/publisher`
- ✅ cryptoHelper from `@/lib/cryptoHelper`

### Database
- ✅ prisma.callback (get, update, create)
- ✅ prisma.callbackMqtt (get, create, update, delete)
- ✅ prisma.callbackAmqp (get, create, update, delete)
- ✅ prisma.mqttPublishLog (create, find)
- ✅ prisma.amqpPublishLog (create, find)
- ✅ prisma.log (create, find)

---

## Success Criteria

- ✅ All 9 HTTP endpoints working
- ✅ All 7 MQTT endpoints working
- ✅ All 7 AMQP endpoints working
- ✅ Full validation with Zod
- ✅ Comprehensive error handling
- ✅ Request/response logging
- ✅ Integration tests passing
- ✅ Documentation complete
- ✅ No security issues in code review

---

**Estimated Effort**: 6-9 days  
**Complexity**: Medium  
**Dependencies**: Tasks 1-4 (Completed ✅), Tasks 5-6 (For AMQP)  
**Start After**: Task 6 completion

---

Generated: October 25, 2025  
For: Next Developer(s) working on API Endpoints

