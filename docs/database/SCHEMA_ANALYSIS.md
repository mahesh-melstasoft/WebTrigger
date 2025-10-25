# Database Schema Analysis

## Overview

The application uses PostgreSQL with Prisma ORM. The schema consists of 11 core models with carefully designed relationships, constraints, and enums for flexibility and data integrity.

---

## Core Data Models

### 1. User (Authentication & Account)

```prisma
model User {
  id              String        @id @default(cuid())
  email           String        @unique
  password        String
  displayName     String?
  secret          String?       // TOTP secret
  role            UserRole      @default(FREE)
  subscriptionId  String?
  subscription    Subscription? @relation
  isActive        Boolean       @default(true)
  slackWebhookUrl String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  callbacks          Callback[]
  rateLimitLogs      RateLimitLog[]
  apiKeys            ApiKey[]
  actions            Action[]
  serviceCredentials ServiceCredential[]
}

enum UserRole {
  ADMIN, PREMIUM, PRO, FREE
}
```

**Purpose**: Core user identity and account management  
**Key Fields**:
- `email`: Unique identifier, used for login
- `password`: Bcrypt hashed password
- `secret`: Base32-encoded TOTP secret for 2FA
- `role`: 4-tier subscription tier system
- `displayName`: Optional user display name
- `slackWebhookUrl`: For notification delivery
- `isActive`: Soft delete capability

**Relationships**:
- 1-to-many with Callback, RateLimitLog, ApiKey, Action, ServiceCredential
- 1-to-1 with Subscription

---

### 2. Subscription (Billing & Subscription)

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  planId               String
  plan                 SubscriptionPlan   @relation(fields: [planId])
  userId               String             @unique
  user                 User               @relation(fields: [userId], onDelete: Cascade)
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}

enum SubscriptionStatus {
  ACTIVE, INACTIVE, CANCELLED, PAST_DUE
}
```

**Purpose**: Track user subscription state and Stripe integration  
**Key Fields**:
- `stripeCustomerId`: Unique Stripe customer identifier
- `stripeSubscriptionId`: Stripe subscription object ID
- `status`: Current subscription state
- `currentPeriodStart/End`: Billing period tracking
- `planId`: Foreign key to SubscriptionPlan

**Relationships**:
- Many-to-1 with SubscriptionPlan
- 1-to-1 with User (cascade delete)

---

### 3. SubscriptionPlan (Pricing Tiers)

```prisma
model SubscriptionPlan {
  id                 String   @id @default(cuid())
  name               String   @unique
  description        String?
  price              Float
  currency           String   @default("USD")
  interval           String   @default("month")
  maxTriggers        Int
  maxTimeoutDuration Int      // seconds
  features           String[] // JSON array
  isActive           Boolean  @default(true)
  stripePriceId      String?  @unique
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  subscriptions Subscription[]
  rateLimits    RateLimit[]
}
```

**Purpose**: Define subscription tiers and pricing  
**Key Fields**:
- `name`: Plan identifier (Starter, Pro, Admin)
- `price`: Monthly/yearly price
- `maxTriggers`: Callback execution limit
- `maxTimeoutDuration`: Max execution time per callback
- `features`: Array of plan features
- `stripePriceId`: Stripe price object ID
- `isActive`: Soft-delete flag

---

### 4. Callback (Core Entity - Webhook Definitions)

```prisma
model Callback {
  id              String   @id @default(cuid())
  name            String
  callbackUrl     String
  activeStatus    Boolean  @default(true)
  triggerToken    String?  @unique @default(uuid())
  customPath      String?  @unique
  userId          String
  user            User     @relation(fields: [userId], onDelete: Cascade)
  timeoutDuration Int      @default(30000)     // ms
  cachePeriod     Int      @default(0)         // seconds
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  logs          Log[]
  rateLimitLogs RateLimitLog[]
  actions       Action[]
  executions    ActionExecution[]
}
```

**Purpose**: Define webhook callbacks to be triggered  
**Key Fields**:
- `callbackUrl`: Target URL to call
- `triggerToken`: UUID for public trigger endpoint
- `customPath`: Alternative custom URL path (unique)
- `activeStatus`: Enable/disable callback
- `timeoutDuration`: How long to wait for callback (default 30s)
- `cachePeriod`: Cache period in seconds (0 = no cache)

**Relationships**:
- Many-to-1 with User (cascade delete)
- 1-to-many with Log, RateLimitLog, Action, ActionExecution

---

### 5. Log (Execution Audit Trail)

```prisma
model Log {
  id           String   @id @default(cuid())
  event        String
  details      String?
  callbackId   String
  callback     Callback @relation(fields: [callbackId], onDelete: Cascade)
  createdAt    DateTime @default(now())
  responseTime Int?     // milliseconds
  statusCode   Int?     // HTTP status
  success      Boolean  @default(true)
}
```

**Purpose**: Log all callback executions and outcomes  
**Key Fields**:
- `event`: Event type/name
- `details`: Additional details (JSON string)
- `responseTime`: Execution duration in ms
- `statusCode`: HTTP response code
- `success`: Boolean success indicator

---

### 6. Action (Multi-Step Execution)

```prisma
model Action {
  id         String     @id @default(cuid())
  callbackId String
  callback   Callback   @relation(fields: [callbackId], onDelete: Cascade)
  userId     String
  user       User       @relation(fields: [userId], onDelete: Cascade)
  type       ActionType
  config     Json       // Flexible configuration
  enabled    Boolean    @default(true)
  order      Int        @default(0)
  parallel   Boolean    @default(false)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  executions ActionExecution[]
}

enum ActionType {
  HTTP_POST, SLACK, EMAIL, SMS, STORE, QUEUE, DISCORD
}
```

**Purpose**: Define pluggable actions for callbacks  
**Key Fields**:
- `type`: Action type (HTTP POST, Slack, Email, etc.)
- `config`: JSON configuration (URL, headers, template, etc.)
- `enabled`: Activation flag
- `order`: Execution order
- `parallel`: Whether to run in parallel with other actions

**Relationships**:
- Many-to-1 with Callback (cascade delete)
- Many-to-1 with User (cascade delete)
- 1-to-many with ActionExecution

---

### 7. ActionExecution (Execution Records)

```prisma
model ActionExecution {
  id         String                @id @default(cuid())
  actionId   String
  action     Action                @relation(fields: [actionId], onDelete: Cascade)
  callbackId String
  callback   Callback              @relation(fields: [callbackId], onDelete: Cascade)
  status     ActionExecutionStatus @default(PENDING)
  attempt    Int                   @default(0)
  response   Json?                 // API response
  error      String?               // Error message
  durationMs Int?                  // Execution time
  createdAt  DateTime              @default(now())
  updatedAt  DateTime              @updatedAt
}

enum ActionExecutionStatus {
  PENDING, RUNNING, SUCCESS, FAILED
}
```

**Purpose**: Track individual action executions  
**Key Fields**:
- `status`: Execution state (PENDING → RUNNING → SUCCESS/FAILED)
- `attempt`: Retry attempt number
- `response`: JSON response from external service
- `error`: Error message if failed
- `durationMs`: How long execution took

---

### 8. RateLimit (Plan Rate Limiting)

```prisma
model RateLimit {
  id                String           @id @default(cuid())
  planId            String
  plan              SubscriptionPlan @relation(fields: [planId], onDelete: Cascade)
  requestsPerSecond Int              @default(1)
  requestsPerMinute Int              @default(60)
  requestsPerHour   Int              @default(1000)
  requestsPerMonth  Int              @default(10000)
  isActive          Boolean          @default(true)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}
```

**Purpose**: Define rate limits per subscription plan  
**Key Fields**:
- Four-tier rate limiting: second, minute, hour, month
- `isActive`: Enable/disable rate limiting
- Attached to SubscriptionPlan

---

### 9. RateLimitLog (Request Counting)

```prisma
model RateLimitLog {
  id           String   @id @default(cuid())
  callbackId   String
  callback     Callback @relation(fields: [callbackId], onDelete: Cascade)
  userId       String
  user         User     @relation(fields: [userId], onDelete: Cascade)
  period       String   // 'second', 'minute', 'hour', 'month'
  periodStart  DateTime
  requestCount Int      @default(1)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([callbackId, period, periodStart])
}
```

**Purpose**: Track request counts per period for rate limiting  
**Key Fields**:
- `period`: Time bucket (second, minute, hour, month)
- `periodStart`: Start of period
- `requestCount`: Number of requests in this period
- Unique constraint on (callbackId, period, periodStart)

---

### 10. ApiKey (API Authentication)

```prisma
model ApiKey {
  id          String    @id @default(cuid())
  name        String
  key         String    @unique
  userId      String
  user        User      @relation(fields: [userId], onDelete: Cascade)
  permissions String[]  // ['read', 'write', 'admin']
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("api_keys")
}
```

**Purpose**: API authentication and authorization  
**Key Fields**:
- `key`: Unique API key (should be hashed in production)
- `permissions`: Array of permission strings
- `expiresAt`: Optional expiration date
- `lastUsedAt`: Track last usage for audit

---

### 11. ServiceCredential (Encrypted Credentials)

```prisma
model ServiceCredential {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], onDelete: Cascade)
  name      String
  provider  ServiceProvider
  secret    String          // Base64 encrypted
  meta      Json?           // Additional metadata
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
}

enum ServiceProvider {
  SENDGRID, TWILIO, SLACK, DISCORD, GENERIC
}
```

**Purpose**: Store encrypted external service credentials  
**Key Fields**:
- `secret`: Base64-encoded encrypted API key/token
- `provider`: Service provider type
- `meta`: Optional metadata (masked on reads)
- `name`: Friendly name for credential

---

## Relationship Diagram

```
User (1)
  ├─→ (1) Subscription → (1) SubscriptionPlan
  ├─→ (many) Callback
  │    ├─→ (many) Log
  │    ├─→ (many) RateLimitLog ←─ (1) RateLimit ← (1) SubscriptionPlan
  │    └─→ (many) Action
  │         └─→ (many) ActionExecution
  ├─→ (many) ApiKey
  ├─→ (many) Action
  └─→ (many) ServiceCredential
```

---

## Indexes & Constraints

### Unique Constraints
- `User.email` - Single email per user
- `Callback.triggerToken` - Unique trigger tokens
- `Callback.customPath` - Unique custom paths
- `ApiKey.key` - Unique API keys
- `SubscriptionPlan.name` - Unique plan names
- `SubscriptionPlan.stripePriceId` - Unique Stripe mapping
- `Subscription.stripeCustomerId` - Unique Stripe customer
- `Subscription.stripeSubscriptionId` - Unique Stripe subscription
- `Subscription.userId` - One subscription per user
- `RateLimitLog` (callbackId, period, periodStart) - Composite unique

### Cascade Deletes
- User deletion cascades to: Callback, ApiKey, Action, ServiceCredential
- Callback deletion cascades to: Log, RateLimitLog, Action, ActionExecution
- Action deletion cascades to: ActionExecution
- SubscriptionPlan deletion cascades to: RateLimit, Subscription

---

## Growth Considerations

### Scaling Points
1. **RateLimitLog** - High-volume inserts, consider partitioning by date
2. **Log** - Archive old logs to separate table
3. **ActionExecution** - Track execution records, may grow large

### Future Enhancements
- Add indexes on `userId`, `callbackId` for faster queries
- Consider denormalizing user subscription info on User model
- Add `tags` or `categories` to callbacks for organization
- Audit table for compliance requirements

---

**Last Updated**: October 25, 2025
