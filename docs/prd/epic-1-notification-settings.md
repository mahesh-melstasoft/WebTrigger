# Epic 1: Notification Settings Management

**Epic ID**: 1  
**Epic Name**: Notification Settings Management  
**Priority**: CRITICAL  
**Status**: To Do  
**Total Story Points**: 26  

## Epic Goal

Enable users to configure multi-channel notification settings (Email, WhatsApp, Telegram, SMS) with plan-based recipient limits, allowing them to control when and how they receive webhook execution alerts.

## Business Value

- Users can monitor webhook executions without constantly checking dashboard
- Multi-channel support provides flexibility for different user preferences
- Plan-based limits create natural upgrade incentives
- Reduces support burden by proactively alerting users to failures

## User Personas

- **Primary**: Developers integrating webhooks into their applications
- **Secondary**: DevOps engineers monitoring production systems
- **Tertiary**: Product managers tracking system health

## Success Metrics

- 60% of active users configure at least one notification channel
- 30% of Free users upgrade to access additional recipients/channels
- Notification response time < 30 seconds from webhook execution
- 90% notification delivery success rate

---

## Story 1.1: View Notification Settings

**As a** registered user  
**I want to** view my current notification settings for all channels  
**So that** I can understand which notifications are enabled  

**Acceptance Criteria:**
1. Display enabled/disabled status for Email, WhatsApp, Telegram, SMS
2. Show configured recipient lists for each channel
3. Display notification triggers (success-only, failure-only, both)
4. Show plan limits for recipient counts
5. Display last notification sent timestamp
6. Indicate which channels are available for user's plan

**Priority:** HIGH  
**Story Points:** 3  
**Dependencies:** Database schema (NotificationSettings model) ✅ Complete

---

## Story 1.2: Enable/Disable Email Notifications

**As a** user  
**I want to** enable or disable email notifications  
**So that** I can control when I receive email alerts  

**Acceptance Criteria:**
1. Toggle email notifications on/off
2. Select notification triggers (success, failure, or both)
3. See confirmation when settings are saved
4. Validate at least one channel is enabled (optional requirement)
5. Show current email addresses that will receive notifications
6. Update settings in real-time without page reload

**Priority:** HIGH  
**Story Points:** 3  
**Dependencies:** Story 1.1

---

## Story 1.3: Manage Email Recipients

**As a** user with paid plan  
**I want to** add additional email addresses to receive notifications  
**So that** my team members can also be alerted  

**Acceptance Criteria:**
1. Add email addresses up to plan limit (Free: 1, Starter: 3, Pro: 10, Admin: unlimited)
2. Validate email format before adding
3. Remove email addresses from recipient list
4. Show remaining available slots
5. Display error when limit exceeded
6. Primary user email always included

**Priority:** HIGH  
**Story Points:** 5  
**Dependencies:** Story 1.2

---

## Story 1.4: Enable WhatsApp Notifications

**As a** user with Starter plan or higher  
**I want to** configure WhatsApp notification recipients  
**So that** I receive instant alerts on my phone  

**Acceptance Criteria:**
1. Enable/disable WhatsApp notifications
2. Add phone numbers with country code validation
3. Respect plan limits (Starter: 1, Pro: 5, Admin: unlimited)
4. Select notification triggers (success, failure, or both)
5. Show WhatsApp setup instructions
6. Display Twilio sandbox join link for testing

**Priority:** MEDIUM  
**Story Points:** 5  
**Dependencies:** Story 1.1, Twilio account configuration

---

## Story 1.5: Enable Telegram Notifications

**As a** user with Starter plan or higher  
**I want to** configure Telegram notification recipients  
**So that** I receive alerts in Telegram  

**Acceptance Criteria:**
1. Enable/disable Telegram notifications
2. Add Telegram chat IDs
3. Respect plan limits (Starter: 1, Pro: 5, Admin: unlimited)
4. Show instructions for getting chat ID
5. Provide bot setup guide with screenshots
6. Test Telegram connection before saving

**Priority:** MEDIUM  
**Story Points:** 5  
**Dependencies:** Story 1.1, Telegram bot token configuration

---

## Story 1.6: Enable SMS Notifications

**As a** user with Starter plan or higher  
**I want to** configure SMS notification recipients  
**So that** I receive text message alerts  

**Acceptance Criteria:**
1. Enable/disable SMS notifications
2. Add phone numbers with validation
3. Respect plan limits (Starter: 1, Pro: 5, Admin: unlimited)
4. Show SMS character limits and pricing info
5. Select notification triggers (success, failure, or both)
6. Display SMS delivery status

**Priority:** LOW  
**Story Points:** 5  
**Dependencies:** Story 1.1, Twilio account with SMS credits

---

## Technical Context

### Existing Implementation

**Backend Service**: ✅ Complete
- `src/lib/notificationService.ts` - NotificationOrchestrator with 4 channel services
- Email: Nodemailer (SMTP - Gmail, SendGrid, custom)
- WhatsApp: Twilio WhatsApp API
- Telegram: node-telegram-bot-api (Bot API)
- SMS: Twilio SMS API

**Database Schema**: ✅ Complete
- `NotificationSettings` model with all channel configurations
- `EmailTemplate` model for custom templates
- Plan-based recipient limits enforced in schema

### Required Implementation

**API Endpoints** (To Do):
- `GET /api/notifications/settings` - Fetch user settings
- `PUT /api/notifications/settings` - Update settings
- `POST /api/notifications/test` - Send test notifications

**UI Components** (To Do):
- `/settings/notifications` - Main settings page
- Channel toggle components
- Recipient management UI with plan limit indicators
- Setup guides modals

**Integration Points**:
- User subscription/plan data for limit enforcement
- Service credentials for Twilio/Telegram configuration
- Email service configuration (SMTP)

### Plan-Based Limits

```typescript
const NOTIFICATION_LIMITS = {
  FREE: { email: 1, whatsapp: 0, telegram: 0, sms: 0 },
  PREMIUM: { email: 3, whatsapp: 1, telegram: 1, sms: 1 },
  PRO: { email: 10, whatsapp: 5, telegram: 5, sms: 5 },
  ADMIN: { email: -1, whatsapp: -1, telegram: -1, sms: -1 } // unlimited
};
```

---

## Architecture References

- **Tech Stack**: Next.js 15.5.2, React 19, TypeScript 5, Prisma 6.14.0
- **Database**: PostgreSQL with Prisma ORM
- **Notification Service**: `src/lib/notificationService.ts`
- **Schema**: `prisma/schema.prisma` (NotificationSettings, EmailTemplate models)
- **Documentation**: `NOTIFICATION_SYSTEM_IMPLEMENTATION.md`

---

## Definition of Done

- [ ] All 6 stories completed with ACs met
- [ ] API endpoints implemented and tested
- [ ] UI components built with responsive design
- [ ] Plan limits enforced on backend
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Security review completed (credential storage, validation)
- [ ] User can configure all 4 notification channels
- [ ] Upgrade prompts work for Free users

---

## Notes

- Backend notification service already complete (commit: 645c47b)
- Focus stories on API endpoints and UI implementation
- Ensure proper error handling for external services (Twilio, Telegram)
- Consider progressive disclosure for advanced settings
- Include inline help/tooltips for technical setup (chat IDs, phone formats)

