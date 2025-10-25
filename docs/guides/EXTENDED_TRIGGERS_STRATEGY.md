# 🚀 Extended Trigger Capabilities - Implementation Strategy

**Date**: October 25, 2025  
**Current Status**: HTTP GET only + basic actions  
**Target**: Full HTTP methods + MQTT + AMQP + Vercel deployment  
**Constraint**: Hosted on Vercel (serverless)

---

## 📋 Executive Summary

Your application needs **three major enhancements**:

1. **Extended HTTP Methods** - Support GET, POST, HEAD, OPTIONS, DELETE, PUT
2. **MQTT Integration** - Pub/sub messaging system
3. **AMQP Integration** - Message queuing (RabbitMQ compatible)

All **must work on Vercel** (serverless environment with 10-second request timeout).

---

## 🎯 Phase 1: Extended HTTP Methods (Weeks 1-2)

### What's Needed

#### Current State
- ✅ HTTP GET implemented (basic)
- ✅ Custom paths support
- ✅ Token-based triggering
- ❌ Other HTTP methods not supported
- ❌ No request details (headers, body, auth)

#### What to Add
- ✅ Support GET, POST, HEAD, OPTIONS, DELETE, PUT
- ✅ Dynamic headers per method
- ✅ Query parameters support
- ✅ Request body templates
- ✅ Authentication details (Basic Auth, Bearer, API Key)
- ✅ Response details logging
- ✅ Request/response time tracking

### Database Schema Changes

```prisma
// Add to Callback model
model Callback {
  // ... existing fields ...
  
  // HTTP Method Details
  httpMethod       String      @default("GET")  // GET, POST, PUT, DELETE, HEAD, OPTIONS
  httpHeaders      Json?       // Headers template with variables
  httpBody         Json?       // Request body template
  queryParams      Json?       // Query parameters template
  authType         String?     // NONE, BASIC, BEARER, API_KEY
  authConfig       Json?       // Auth-specific config (username/password, token, etc)
  
  // Request Execution
  requestDetails   Json?       // Last request details (headers sent, body sent, etc)
  responseDetails  Json?       // Last response details (status, headers, body sample)
}

// New model for dynamic values
model CallbackHttpTemplate {
  id          String    @id @default(cuid())
  callbackId  String
  callback    Callback  @relation(fields: [callbackId], onDelete: Cascade)
  
  // Variable substitution
  variables   Json      // {"user_id": "123", "timestamp": "2025-10-25T..."}
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Implementation Files to Create/Update

```
src/
├── lib/
│   ├── httpExecutor.ts           [NEW] HTTP method executor with all verbs
│   ├── httpAuth.ts               [NEW] Authentication handling
│   └── httpTemplateEngine.ts     [NEW] Variable substitution in headers/body
├── app/api/trigger/
│   ├── [method]/route.ts         [NEW] Dynamic method handler
│   └── custom/[path]/route.ts    [UPDATE] Support all methods
└── types/
    └── http.ts                   [NEW] HTTP-related types
```

### Key Features

**1. HTTP Method Support**
```typescript
// Support all standard methods
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'];

// Each method can have:
// - Custom headers with variables
// - Custom body with variables  
// - Query parameters
// - Authentication
// - Timeout per method
```

**2. Authentication Types**
```typescript
type AuthType = 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY' | 'OAUTH2';

// Examples:
// BASIC: btoa(`${username}:${password}`)
// BEARER: `Authorization: Bearer ${token}`
// API_KEY: Custom header with key
// OAUTH2: Token refresh before request
```

**3. Variable Substitution in Headers/Body**
```typescript
// Support variables like:
// {timestamp}, {uuid}, {callback_id}, {user_id}
// {env:VARIABLE_NAME}
// {secret:SERVICE_CREDENTIAL}

// Example header template:
{
  "X-Request-ID": "{uuid}",
  "X-Timestamp": "{timestamp}",
  "Authorization": "Bearer {secret:auth_token}"
}

// Example body template:
{
  "callback_id": "{callback_id}",
  "triggered_at": "{timestamp}",
  "payload": "{original_payload}"
}
```

**4. Request Details Logging**
```typescript
// Log what was actually sent:
{
  method: "POST",
  url: "https://example.com/webhook",
  headers: { ... }, // headers actually sent
  body: { ... },    // body actually sent (sanitized)
  queryParams: { ... },
  responseStatus: 200,
  responseHeaders: { ... },
  responseBodySample: "...", // first 1KB
  duration: 245,
  timestamp: "2025-10-25T11:00:00Z"
}
```

### Implementation Steps

1. **Week 1, Days 1-2**: Schema design and Prisma migration
2. **Week 1, Days 3-4**: HTTP executor with all methods
3. **Week 1, Days 5**: Authentication handling
4. **Week 2, Days 1-2**: Template engine and variable substitution
5. **Week 2, Days 3-4**: API endpoints for configuration
6. **Week 2, Days 5**: Testing and documentation

---

## 🌐 Phase 2: MQTT Integration (Weeks 3-4)

### Challenge: MQTT + Vercel

**Problem**: Vercel is serverless with:
- ❌ 10-second request timeout
- ❌ No persistent connections allowed
- ❌ No websocket support in some regions
- ❌ Limited background job capabilities

**Solution**: Use managed MQTT service + async job queue

### Architecture

```
Your Webhook Trigger
    ↓
Vercel Edge Function (< 10 sec)
    ↓
Send to Job Queue (Bull/BullMQ)
    ↓
Background Worker (Heroku/Railway/AWS Lambda)
    ↓
Connect to MQTT Broker & Publish
    ↓
MQTT Subscribers
```

### Managed MQTT Services for Vercel

**Option 1: HiveMQ Cloud** (Recommended)
- ✅ Free tier: 100 connections, 100 messages/sec
- ✅ TLS/MQTT over WebSocket
- ✅ Easy integration
- ✅ Public broker option

**Option 2: AWS IoT Core**
- ✅ Built-in security
- ✅ Integration with AWS services
- ✅ More complex setup

**Option 3: CloudMQTT / Upstash**
- ✅ Managed Redis Streams as alternative
- ✅ Simpler for small scale

### Database Schema Changes

```prisma
// Add to callback/action system
model CallbackMqtt {
  id            String    @id @default(cuid())
  callbackId    String
  callback      Callback  @relation(fields: [callbackId], onDelete: Cascade)
  
  // MQTT Configuration
  broker        String    // mqtt://broker.example.com:1883
  topic         String    // my/topic/path
  qos           Int       @default(1) // 0, 1, 2
  retain        Boolean   @default(false)
  
  // Authentication
  username      String?
  password      String?   // Encrypted
  clientId      String?
  
  // Message Configuration
  payloadFormat String    // JSON, TEXT, XML
  payloadTemplate Json?   // Message template
  
  // Retry/Reliability
  maxRetries    Int       @default(3)
  retryDelayMs  Int       @default(1000)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model MqttPublishLog {
  id          String    @id @default(cuid())
  callbackId  String
  callback    Callback  @relation(fields: [callbackId], onDelete: Cascade)
  
  topic       String
  payload     String    // First 5KB
  qos         Int
  success     Boolean
  error       String?
  duration    Int       // ms
  
  createdAt   DateTime  @default(now())
}
```

### Implementation Files

```
src/
├── lib/
│   ├── mqtt/
│   │   ├── client.ts              [NEW] MQTT client wrapper
│   │   ├── publisher.ts           [NEW] Publish logic
│   │   ├── connector.ts           [NEW] Broker connection management
│   │   └── serializer.ts          [NEW] Message serialization
│   ├── queue/
│   │   ├── index.ts               [NEW] Job queue (BullMQ/RQueue)
│   │   └── mqttWorker.ts          [NEW] Background worker
│   └── mqtt-config.ts             [NEW] Configuration
└── app/api/
    ├── mqtt/
    │   ├── publish/route.ts        [NEW] Publish endpoint
    │   ├── config/route.ts         [NEW] Configuration management
    │   └── logs/route.ts           [NEW] View publish logs
    └── callbacks/[id]/mqtt/route.ts [NEW] MQTT config for callback
```

### Key Features

**1. Async Publishing (Vercel-Safe)**
```typescript
// User sends webhook trigger
POST /api/trigger/[id]
↓
// Immediately returns 200 OK
// Add to background job queue
// Job worker publishes to MQTT asynchronously

// Response:
{
  success: true,
  callback_id: "...",
  mqtt_job_id: "...", // Can track in dashboard
  message: "Queued for MQTT publication"
}
```

**2. MQTT Topic Management**
```typescript
// Support topic templates with variables:
// my/app/{user_id}/events/{event_type}
// 
// Resolve to:
// my/app/user123/events/webhook_triggered

// Automatic topic structure:
// app/{application}/{environment}/{resource}/{action}
```

**3. QoS Levels**
```typescript
// QoS 0: Fire and forget (no guarantee)
// QoS 1: At least once (broker confirms)
// QoS 2: Exactly once (guaranteed once - slower)
```

**4. Message Formatting**
```typescript
// Support templates:
{
  "event": "callback_triggered",
  "callback_id": "{callback_id}",
  "timestamp": "{timestamp}",
  "payload": "{original_payload}",
  "metadata": {
    "source": "webhook",
    "version": "1.0"
  }
}
```

### Dependencies to Add

```json
{
  "mqtt": "^5.0.0",
  "bullmq": "^4.0.0",
  "redis": "^4.6.0"
}
```

### Architecture Diagram

```
┌─────────────────────────────────────┐
│     Webhook Trigger Request         │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  Vercel Edge Function (< 10s)       │
│  - Validate trigger                 │
│  - Add job to Redis queue           │
│  - Return 200 OK immediately        │
└────────────┬────────────────────────┘
             │
             ↓
        Redis Queue
    (Bull/BullMQ)
             │
             ↓
┌─────────────────────────────────────┐
│  Background Worker (External)       │
│  - Poll job queue                   │
│  - Connect to MQTT broker           │
│  - Publish message                  │
│  - Log result                       │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   MQTT Broker (HiveMQ/AWS IoT)      │
│   - Route to subscribers            │
│   - Handle QoS/retries              │
└─────────────────────────────────────┘
```

### Implementation Steps

1. **Week 3, Days 1-2**: Redis queue setup + worker setup
2. **Week 3, Days 3-4**: MQTT client wrapper + publisher
3. **Week 3, Days 5**: HiveMQ integration + configuration
4. **Week 4, Days 1-2**: API endpoints for MQTT management
5. **Week 4, Days 3-4**: Dashboard UI for MQTT publishing
6. **Week 4, Days 5**: Testing and documentation

---

## 🔄 Phase 3: AMQP Integration (Weeks 5-6)

### Challenge: AMQP + Vercel

Same as MQTT - use job queue + external worker

### Architecture

```
Your Webhook Trigger
    ↓
Vercel Edge Function
    ↓
Job Queue (Redis/RabbitMQ Direct)
    ↓
AMQP Message Broker
    ↓
Consumers
```

### Managed AMQP Services

**Option 1: AWS MQ (RabbitMQ)**
- ✅ Managed RabbitMQ
- ✅ HA support
- ✅ Easy VPC integration

**Option 2: CloudAMQP**
- ✅ Managed RabbitMQ
- ✅ Free tier available
- ✅ Global presence

**Option 3: Upstash Redis (Alternative)**
- ✅ Use Redis Streams instead
- ✅ Simpler, lower cost
- ✅ Redis-native in Node.js

### Database Schema

```prisma
model CallbackAmqp {
  id              String    @id @default(cuid())
  callbackId      String
  callback        Callback  @relation(fields: [callbackId], onDelete: Cascade)
  
  // AMQP Configuration
  brokerUrl       String    // amqp://... connection string
  exchangeName    String
  routingKey      String
  exchangeType    String    @default("topic") // direct, topic, fanout
  durable         Boolean   @default(true)
  
  // Authentication
  username        String?
  password        String?   // Encrypted
  
  // Message Configuration
  messageFormat   String    @default("JSON") // JSON, XML, TEXT
  messageTemplate Json?
  priority        Int       @default(5) // 0-10
  
  // Delivery Settings
  persistent      Boolean   @default(true)
  contentType     String    @default("application/json")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model AmqpPublishLog {
  id            String    @id @default(cuid())
  callbackId    String
  callback      Callback  @relation(fields: [callbackId], onDelete: Cascade)
  
  exchange      String
  routingKey    String
  message       String    // First 5KB
  success       Boolean
  error         String?
  duration      Int
  
  createdAt     DateTime  @default(now())
}
```

### Implementation Files

```
src/
├── lib/
│   ├── amqp/
│   │   ├── client.ts              [NEW] AMQP client
│   │   ├── publisher.ts           [NEW] Publish logic
│   │   ├── connection.ts          [NEW] Connection pooling
│   │   └── serializer.ts          [NEW] Message serialization
│   ├── queue/
│   │   └── amqpWorker.ts          [NEW] Background worker
│   └── amqp-config.ts             [NEW] Configuration
└── app/api/
    ├── amqp/
    │   ├── publish/route.ts        [NEW] Publish endpoint
    │   ├── config/route.ts         [NEW] Configuration
    │   └── logs/route.ts           [NEW] Logs viewer
    └── callbacks/[id]/amqp/route.ts [NEW] AMQP config
```

### Key Features

**1. Exchange Types**
```typescript
// DIRECT: Exact routing key match
// TOPIC: Pattern matching (logs.#, logs.error.*)
// FANOUT: Broadcast to all bindings

// Automatic routing structure:
// webtrigger.callback.{callback_id}.{event_type}
```

**2. Message Properties**
```typescript
{
  exchange: "webhooks",
  routingKey: "callbacks.triggered",
  message: {
    id: "...",
    timestamp: "...",
    source: "webhook",
    data: {}
  },
  properties: {
    persistent: true,
    contentType: "application/json",
    priority: 5,
    expiration: "3600000" // 1 hour
  }
}
```

**3. Connection Pooling**
```typescript
// Maintain pool of connections
// Auto-reconnect on failure
// Graceful degradation if broker down
```

### Dependencies

```json
{
  "amqplib": "^0.10.0",
  "connection-pool": "^1.0.0"
}
```

### Implementation Steps

1. **Week 5, Days 1-2**: AMQP client wrapper + connection pooling
2. **Week 5, Days 3-4**: Publisher logic + exchange management
3. **Week 5, Days 5**: AWS MQ / CloudAMQP integration
4. **Week 6, Days 1-2**: API endpoints
5. **Week 6, Days 3-4**: Dashboard UI
6. **Week 6, Days 5**: Testing and documentation

---

## 🔧 Vercel Deployment Strategy

### Challenge: Serverless Limitations
- ✅ 10-second timeout per request
- ✅ No persistent connections
- ✅ Limited background jobs
- ✅ Stateless functions

### Solution Architecture

```
┌──────────────────────────────┐
│   Vercel (Trigger Handler)   │
│   - Fast request/response    │
│   - Add to job queue         │
│   - Return immediately       │
└──────────┬───────────────────┘
           │
      (< 1 second)
           │
           ↓
    ┌─────────────┐
    │ Redis Queue │
    │ (Upstash)   │
    └──────┬──────┘
           │
           ├─────────────────────────┬──────────────────┐
           ↓                         ↓                  ↓
    ┌────────────┐          ┌──────────────┐  ┌──────────────┐
    │HTTP Worker │          │MQTT Worker   │  │AMQP Worker   │
    │(Railway)   │          │(Railway)     │  │(Railway)     │
    └────────────┘          └──────────────┘  └──────────────┘
           ↓                         ↓                  ↓
    Direct HTTP calls       MQTT Broker          AMQP Broker
```

### Environment Setup

**Vercel (Main API)**
```env
REDIS_URL=redis://...          # Job queue (Upstash)
MQTT_BROKER_URL=...            # HiveMQ Cloud
AMQP_BROKER_URL=...            # CloudAMQP/AWS MQ
WORKER_API_KEY=...             # Verify worker requests
```

**Railway/Heroku (Workers)**
```env
REDIS_URL=redis://...          # Same as Vercel
MQTT_BROKER_URL=...
AMQP_BROKER_URL=...
DATABASE_URL=...               # PostgreSQL
```

### Trigger Flow

```
1. User sends: GET /api/trigger/my-callback
2. Vercel function (< 10ms):
   - Validate callback
   - Check rate limits
   - Add job to Redis queue
   - Return 200 OK
3. Background worker polls queue:
   - Fetch job
   - Execute HTTP/MQTT/AMQP
   - Log result
   - Update callback stats
4. Dashboard shows real-time status
```

### Redis Job Structure

```typescript
{
  id: "job-123",
  type: "TRIGGER",
  callbackId: "callback-id",
  userId: "user-id",
  
  // HTTP details
  httpMethod: "POST",
  httpUrl: "https://...",
  httpHeaders: {...},
  httpBody: {...},
  
  // MQTT details (if applicable)
  mqttTopic: "...",
  mqttPayload: {...},
  
  // AMQP details (if applicable)
  amqpExchange: "...",
  amqpRoutingKey: "...",
  amqpMessage: {...},
  
  // Execution tracking
  attempts: 0,
  maxAttempts: 3,
  createdAt: "...",
  processedAt: null,
  result: null
}
```

---

## 📊 Complete Timeline

```
PHASE 1: Extended HTTP Methods (Weeks 1-2)
├─ Week 1, Day 1-2:   Schema design
├─ Week 1, Day 3-5:   HTTP executor implementation
├─ Week 2, Day 1-3:   Template engine + auth
└─ Week 2, Day 4-5:   Testing & docs

PHASE 2: MQTT Integration (Weeks 3-4)
├─ Week 3, Day 1-2:   Queue + Worker setup
├─ Week 3, Day 3-5:   MQTT client + Publisher
├─ Week 4, Day 1-3:   API endpoints
└─ Week 4, Day 4-5:   UI + Testing

PHASE 3: AMQP Integration (Weeks 5-6)
├─ Week 5, Day 1-3:   AMQP client + Connection pooling
├─ Week 5, Day 4-5:   API endpoints
├─ Week 6, Day 1-3:   UI + Testing
└─ Week 6, Day 4-5:   Final integration & docs
```

---

## 🎯 Success Criteria

### Phase 1 Complete (Week 2)
- ✅ All 6 HTTP methods working
- ✅ Headers/body templates supported
- ✅ Authentication working (Basic, Bearer, API Key)
- ✅ Response details logged
- ✅ Tests passing

### Phase 2 Complete (Week 4)
- ✅ MQTT broker connected
- ✅ Messages publishing to topics
- ✅ Job queue working
- ✅ Background worker operational
- ✅ Dashboard showing MQTT activity

### Phase 3 Complete (Week 6)
- ✅ AMQP broker connected
- ✅ Messages publishing to exchanges
- ✅ Connection pooling working
- ✅ Full integration with existing system
- ✅ All tests passing
- ✅ Documentation complete

---

## 💾 Database Migration Steps

```bash
# Phase 1: HTTP Methods
npx prisma migrate dev --name add_http_method_details

# Phase 2: MQTT
npx prisma migrate dev --name add_mqtt_support

# Phase 3: AMQP
npx prisma migrate dev --name add_amqp_support
```

---

## 🚀 Implementation Priority

### Must Have (Phase 1)
- HTTP GET, POST, PUT, DELETE, HEAD, OPTIONS
- Headers with variables
- Body templates
- Basic/Bearer authentication

### Should Have (Phase 2)
- MQTT pub/sub
- Job queue for async operations
- Background workers

### Nice to Have (Phase 3)
- AMQP support
- Advanced message routing
- Message transformation

---

## 📚 References & Docs

- [Extended HTTP Methods Spec](./HTTP_METHODS_SPEC.md) (to be created)
- [MQTT Integration Guide](./MQTT_INTEGRATION.md) (to be created)
- [AMQP Integration Guide](./AMQP_INTEGRATION.md) (to be created)
- [Vercel Deployment](./VERCEL_DEPLOYMENT.md) (to be created)

---

**Created**: October 25, 2025  
**Total Estimated Duration**: 6 weeks  
**Team Size**: 2-3 developers + DevOps  
**Status**: Strategy Ready for Implementation

