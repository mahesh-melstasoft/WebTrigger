# Epic 3: Webhook Integration

**Epic ID**: 3  
**Epic Name**: Webhook Integration  
**Priority**: CRITICAL  
**Status**: To Do  
**Total Story Points**: 15  

## Epic Goal

Automatically send notifications to users when their webhooks execute, connecting the notification system to the core webhook execution flow.

## Business Value

- **Core Product Value**: Users get notified when their webhooks actually run
- **Proactive Monitoring**: Immediate alerts for webhook failures
- **Trust Building**: Users know their integrations are working
- **Reduced Support**: Fewer "is my webhook working?" questions

## User Personas

- **Primary**: Developers monitoring production webhook integrations
- **Secondary**: DevOps teams tracking system health
- **Tertiary**: Business users monitoring critical business processes

## Success Metrics

- 95% of webhook executions trigger appropriate notifications
- < 5 second delay between webhook execution and notification send
- 90% notification delivery success rate
- 50% reduction in support tickets about webhook status

---

## Story 3.1: Auto-Send Notifications on Webhook Success

**As a** system  
**I want to** automatically send notifications when webhooks succeed  
**So that** users are informed of successful executions  

**Acceptance Criteria:**
1. Trigger notifications after webhook execution completes successfully
2. Respect user's notification settings (success enabled)
3. Send to all configured channels (email, WhatsApp, Telegram, SMS)
4. Include webhook execution details (callback name, status code, response time)
5. Use user's custom templates if set, fallback to default success template
6. Log notification delivery status for monitoring

**Priority:** CRITICAL  
**Story Points:** 5  
**Dependencies:** Notification service, Webhook execution system, Story 1.1 (settings view)

---

## Story 3.2: Auto-Send Notifications on Webhook Failure

**As a** system  
**I want to** automatically send notifications when webhooks fail  
**So that** users can quickly respond to issues  

**Acceptance Criteria:**
1. Trigger notifications after webhook execution fails
2. Respect user's notification settings (failure enabled)
3. Include error details (status code, error message, response body)
4. Send to all configured channels with higher priority
5. Use failure-specific templates with detailed error information
6. Log notification delivery and include error context

**Priority:** CRITICAL  
**Story Points:** 5  
**Dependencies:** Notification service, Webhook execution system, Story 3.1

---

## Story 3.3: Notification Rate Limiting

**As a** system  
**I want to** rate limit notifications per user  
**So that** I prevent spam and control costs  

**Acceptance Criteria:**
1. Limit notifications per user per hour (Free: 10, Starter: 50, Pro: 200, Admin: unlimited)
2. Higher limits for paid plans
3. Graceful degradation when limit exceeded (queue or skip)
4. Show warning in UI when approaching limit
5. Admin override capability for critical notifications
6. Rate limit applies per channel type

**Priority:** MEDIUM  
**Story Points:** 5  
**Dependencies:** Notification service, User subscription system

---

## Technical Context

### Existing Implementation

**Notification Service**: ✅ Complete
- `src/lib/notificationService.ts` - Orchestrator with 4 channel services
- Template rendering with variables
- Default success/failure templates

**Webhook Execution**: ✅ Exists
- Action executor system for HTTP/MQTT/AMQP triggers
- Callback execution flow
- Error handling and logging

### Required Integration Points

**Webhook Success Flow**:
```
Webhook Execution → Success → Call notificationOrchestrator.sendNotifications({
  type: 'WEBHOOK_SUCCESS',
  callbackId: callback.id,
  callbackName: callback.name,
  statusCode: response.status,
  responseTime: executionTime,
  userId: callback.userId
})
```

**Webhook Failure Flow**:
```
Webhook Execution → Failure → Call notificationOrchestrator.sendNotifications({
  type: 'WEBHOOK_FAILURE', 
  callbackId: callback.id,
  callbackName: callback.name,
  statusCode: error.status || 0,
  error: error.message,
  responseBody: error.response?.body,
  userId: callback.userId
})
```

### Rate Limiting Implementation

**Redis-based Rate Limiting**:
```typescript
const RATE_LIMITS = {
  FREE: 10,      // per hour
  STARTER: 50,
  PRO: 200,
  ADMIN: -1      // unlimited
};

async function checkRateLimit(userId: string, channel: string): Promise<boolean> {
  const key = `notifications:${userId}:${channel}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 3600); // 1 hour
  }
  
  const limit = getUserRateLimit(userId);
  return limit === -1 || current <= limit;
}
```

### Notification Payload Structure

```typescript
interface NotificationPayload {
  type: 'WEBHOOK_SUCCESS' | 'WEBHOOK_FAILURE';
  callbackId: string;
  callbackName: string;
  statusCode: number;
  responseTime?: number;
  error?: string;
  responseBody?: string;
  timestamp: Date;
  userId: string;
}
```

### Template Variables Available

**Success Template Variables**:
- `{{callbackName}}` - Name of the webhook callback
- `{{statusCode}}` - HTTP status code (200, 201, etc.)
- `{{responseTime}}` - Execution time in milliseconds
- `{{timestamp}}` - When the webhook executed

**Failure Template Variables**:
- `{{callbackName}}` - Name of the webhook callback  
- `{{statusCode}}` - Error status code
- `{{error}}` - Error message
- `{{responseBody}}` - Response body (truncated)
- `{{timestamp}}` - When the failure occurred

---

## Architecture References

- **Notification Service**: `src/lib/notificationService.ts`
- **Action Executor**: `src/lib/actionExecutor.ts`
- **Database Models**: `prisma/schema.prisma` (NotificationSettings, Callback)
- **Template System**: Built into notification service

---

## Definition of Done

- [ ] All 3 stories completed with ACs met
- [ ] Webhook executions trigger notifications automatically
- [ ] Success and failure notifications work correctly
- [ ] Rate limiting prevents spam while allowing legitimate notifications
- [ ] Integration tests verify end-to-end notification flow
- [ ] Performance impact minimal (< 500ms added to webhook execution)
- [ ] Error handling prevents notification failures from breaking webhooks
- [ ] Logging provides visibility into notification delivery

---

## Notes

- **Critical Path**: This epic connects the notification system to actual webhook execution
- **Async Processing**: Notifications should not block webhook execution
- **Error Isolation**: Notification failures should not affect webhook success/failure determination
- **Template Fallback**: Use default templates if user hasn't configured custom ones
- **Rate Limiting**: Consider per-channel limits vs global limits
- **Testing**: Requires integration tests with actual webhook execution flow

