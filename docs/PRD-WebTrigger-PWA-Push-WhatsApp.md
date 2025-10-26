# Product Requirements Document (PRD)

Title: WebTrigger — PWA, Push Notifications, and WhatsApp Setup
Owner: Product / Engineering
Created: 2025-10-26
Version: 1.0

Overview
--------
WebTrigger is a lightweight webhook management dashboard that lets users create, manage and monitor webhook endpoints (triggers) and configure notification actions (email, Slack, Telegram, WhatsApp, SMS, push). This PRD covers the scope required to make the product production-ready as a progressive web app (PWA), add first-class push notifications, and provide a clear, secure WhatsApp setup flow (via Twilio credentials). It also summarizes non-functional requirements, API contracts, data considerations, acceptance criteria, rollout plan and success metrics.

Purpose
-------
Deliver a production-ready WebTrigger experience that:
- Installs and behaves like a native app on mobile/desktop (PWA).
- Supports browser push notifications with a clear onboarding flow (VAPID keys, permission request, subscribe/unsubscribe, and server-side registration).
- Makes WhatsApp notification setup straightforward by guiding users to add Twilio credentials and enabling WhatsApp notifications when available and permitted by plan.
- Keeps the system secure (encrypted credentials at rest, secrets in env, least-privilege APIs) and observable (logs, health, alerts).

High-level success metrics
--------------------------
- 95% of eligible users can enable push notifications within 2 minutes of visiting the PWA
- <1% crash rate for the PWA in the first 30 days after rollout
- Successful delivery of WhatsApp notification test messages for valid Twilio credentials >= 95% (after retries/backoff)
- Increase in DAU for mobile users using the PWA: +15% over baseline in 60 days

Business goals
--------------
1. Improve retention and re-engagement via push notifications.
2. Reduce onboarding friction for messaging channels (WhatsApp) to increase paid-plan upgrades.
3. Provide enterprise-grade handling for credentials and secrets.

Contract (Inputs / Outputs / Error modes)
- Inputs: authenticated user actions, service credentials (Twilio, SendGrid, Slack...), VAPID public key for push, webhook triggers and payloads
- Outputs: push subscription records, outgoing WhatsApp messages (via Twilio), in-app notifications, logs/metrics
- Error modes: denied notification permission, invalid Twilio credentials, network outages, push unsubscribed, missing env secrets

User personas
-------------
- Product Owner / Admin: sets up the WebTrigger instance, configures app brand, and manages team billing and plans.
- Developer / Integrator: creates webhook triggers, tests them, and configures integrations (SendGrid, Twilio) for notifications.
- Operator / Support: monitors delivery, troubleshooting failed notifications and credential issues.

Primary user stories
-------------------
1. As a logged-in user, I want to install WebTrigger as a PWA so I can quickly access it from my home screen.
2. As a logged-in user, I want to enable browser push notifications so I can receive immediate alerts when my triggers run.
3. As a logged-in user, I want a clear guided flow that lets me add Twilio credentials to enable WhatsApp notifications.
4. As a logged-in user, I want to test push and WhatsApp notifications from the settings screen.
5. As an admin, I want service credentials encrypted at rest and decryptable by the service using a secure master key.

Functional requirements
-----------------------

1) PWA: installable app
- Provide a valid Web App Manifest and icons.
- Serve a Service Worker at `/sw.js` that handles push events, background sync and offline fallbacks.
- Expose an `InstallPrompt` UI (BeforeInstallPrompt event) with a friendly CTA and analytics for acceptance/dismissal.

2) Push Notifications
- Generate a VAPID key pair for the app (documented setup). The public key is exposed to the client as NEXT_PUBLIC_VAPID_PUBLIC_KEY. The private key is managed on the server (env or secrets store) for sending notifications via web-push.
- On client: implement a robust hook `usePushNotifications()` that:
  - Detects support ('serviceWorker' and 'PushManager').
  - Offers a safe flow: request permission -> register service worker -> subscribe -> send subscription data to server.
  - Exposes enable/disable, subscription status and error state.
- On server: endpoints
  - POST /api/notifications/push/subscribe — save subscription data (endpoint + keys) associated with the user.
  - POST /api/notifications/push/unsubscribe — delete subscription and mark unsubscribed.
  - Admin endpoint to trigger a push to a user (for tests/debugging).
- Ensure idempotency, validation, and rate limiting for subscription endpoints.

3) WhatsApp (Twilio) setup
- Provide an in-UI CTA that opens the Add Service Credential modal with TWILIO as the selected provider. Pre-fill helper text listing required Twilio fields (Account SID, Auth Token, WhatsApp-enabled phone).
- Server-side
  - Create /api/service-credentials POST to accept credentials and store them encrypted.
  - When user triggers a WhatsApp test, server attempts to send a test message via Twilio and returns success/failure with helpful error messages.
- Authorization: Only users with a paid plan (if feature gated) may enable WhatsApp; settings UI must show gated messaging and prompts to upgrade.

4) Service Credentials & Encryption
- ENCRYPTION_MASTER_KEY must be required in production.
- Service credentials are encrypted at rest, using a KDF and authenticated encryption (e.g., AES-GCM or libsodium secretbox). The key should be rotated periodically (rotation plan).

5) Notifications preferences UI
- Clear settings in `Settings -> Notifications` for Email, WhatsApp, Telegram, SMS, Push.
- Add direct action buttons:
  - Push: Request permission / Enable / Disable
  - WhatsApp: Add Twilio credential button if missing; if present allow Test message.

Non-functional requirements
---------------------------
- Security: secrets in env, rotate keys, TLS only for endpoints. Limit access to service-credential decryption to the server process.
- Privacy: minimize personal data and avoid logging full phone numbers in plain text; mask numbers in UI.
- Performance: push subscription registration and credential creation should respond in <1s on average.
- Scalability: support thousands of push subscriptions; store subscription payloads efficiently (no large binary blobs). Use background workers to send high-volume outbound messages.
- Observability: add metrics for push subscription rate, permission acceptance rate, test message success rate, Twilio API error counts, and monitor failed attempts.
- Compliance: be mindful of WhatsApp/Meta policies and local messaging regulations.

Data model notes
----------------
- NotificationSettings (existing): track emailEnabled, whatsappEnabled, smsEnabled, pushSubscriptionExists (in DB or derived from push subscription table).
- PushSubscription (new table): id, userId, endpoint (string), keys (p256dh, auth), createdAt, updatedAt, lastSeenAt.
- ServiceCredentials (existing): provider, name, secret(encrypted), createdBy, createdAt. Add provider-specific metadata (phone number) as encrypted fields or separate columns masked in queries.

API contracts (summary)
-----------------------
1) POST /api/notifications/push/subscribe
  - Auth: Bearer token
  - Body: { endpoint: string, keys: { p256dh: string, auth: string } }
  - Response: 200 OK { success: true }
  - Errors: 400 invalid payload, 401 unauthenticated, 429 rate limit, 500 server error

2) POST /api/notifications/push/unsubscribe
  - Auth: Bearer token
  - Body: { endpoint?: string }
  - Response: 200 OK { success: true }

3) POST /api/service-credentials (existing)
  - Auth: Bearer token
  - Body: { name, provider: 'TWILIO'|'SENDGRID'|'SLACK'|..., secret }
  - Response: 201 Created { id, name, provider }
  - Side-effect: credential secret is encrypted at rest

4) POST /api/notifications/whatsapp/test
  - Auth: Bearer token
  - Body: { phone: string, credentialId: string }
  - Response: 200 OK { success: true } or 400/422 with provider error message

Acceptance criteria
-------------------
- PWA: The site is installable on at least Chrome (mobile) and shows an install prompt; SW handles push events and displays notifications.
- Push: Users can enable push from the Settings page; a subscription object is stored server-side; disabling unsubscribes locally and removes from server.
- WhatsApp: Users can add Twilio credentials through the Settings UI and send a test message that succeeds (if Twilio creds valid) or shows actionable errors.
- Security: ENCRYPTION_MASTER_KEY is required in production and service credentials are stored encrypted.
- CI/Build: Next.js production build runs without TypeScript/ESLint blocking errors.

Edge cases
----------
- Browser denies permission: show guidance and fallback (e.g., email notification recommendation).
- Service worker not available (older browsers): disable push UI and show graceful message.
- Twilio credentials invalid: capture and show provider error and guidance (check SID/token and sandbox whitelist).
- User has multiple devices: allow multiple pushSubscriptions per user; track lastSeenAt for pruning stale subscriptions.

Technical implementation notes
----------------------------
- Client
  - `usePushNotifications()` (already present) should be the single source of truth for push state.
  - Before requesting permission, ensure service worker registration and readiness.
  - Store a local flag to avoid repeating permission prompts and to track whether the user explicitly opted out.

- Server
  - Use `web-push` (Node) or equivalent for sending notifications using VAPID keys. Keep private key in env (e.g., VAPID_PRIVATE_KEY) and public in NEXT_PUBLIC_VAPID_PUBLIC_KEY.
  - Validate subscription payload shape before storing.
  - Use Prisma (already in project) to store PushSubscription entries.
  - For sending WhatsApp via Twilio, wrap Twilio API calls with retry/backoff and map Twilio error codes to helpful messages.

Security & secrets
------------------
- Require `ENCRYPTION_MASTER_KEY` in production. Validate at startup and fail fast if missing.
- Keep VAPID_PRIVATE_KEY and third-party provider secrets out of client-side code and env exposures.
- Rotate encryption keys periodically and provide a migration plan for re-encrypting stored credentials.

Monitoring & observability
--------------------------
- Metrics:
  - push.permission.requested, push.permission.granted, push.subscribed, push.unsubscribed
  - whatsapp.credential.added, whatsapp.test.success, whatsapp.test.failure
  - failed push send attempts, Twilio API error counts
- Logging: structured logs for subscription events and credential operations; redact secrets and PII.
- Alerts: high error rates for push/WhatsApp tests or credential creation should page/notify the operator.

Rollout & migration plan
------------------------
1. Staging rollout:
   - Generate VAPID key pair for staging and wire env vars.
   - QA push flows on staging across Chrome/Firefox on Android and desktop.
   - Test Twilio flows using test credentials and sandbox phone numbers.

2. Canary / Beta release:
   - Deploy to a subset of users (feature flag) and monitor metrics for 7 days.

3. Full release:
   - Set production VAPID keys, ensure `ENCRYPTION_MASTER_KEY` is set, and turn on the PWA features.

4. Post-release (30 days):
   - Monitor acceptance rates, errors, and engagement metrics. Rollback plan ready if critical failure.

Timeline & milestones (example)
-------------------------------
- Week 0: Finalize PRD and technical design; generate keys and review security requirements.
- Week 1: Implement Service Worker + Install Prompt + manifest + icons.
- Week 2: Finish push subscription flows and server subscribe/unsubscribe endpoints; add DB model and migrations.
- Week 3: Implement WhatsApp (Twilio) Add Credential flow + Test message endpoint.
- Week 4: QA, monitoring, and staging rollout; fix issues and prepare for canary.

Risks & mitigations
-------------------
- Risk: Users deny notifications and cannot be prompted again easily. Mitigation: Provide clear help modal describing how to re-enable in browser settings.
- Risk: Twilio API changes or account restrictions. Mitigation: Validate and surface Twilio response codes; document sandbox behavior.
- Risk: Misconfiguration of VAPID keys or missing ENCRYPTION_MASTER_KEY. Mitigation: Startup checks and CI validation; fail fast in production if keys missing.

QA & Test cases (high level)
----------------------------
1. PWA
  - Install flow appears on supported browsers.
  - Service worker registered and active.

2. Push
  - Request permission -> subscribed -> server stores subscription
  - Disable/unsubscribe removes server entry and local subscription
  - Attempt subscription when SW unavailable -> graceful error

3. WhatsApp (Twilio)
  - Add Twilio credential -> stored encrypted
  - Send test message -> returns success (valid creds) or helpful error (invalid creds)

4. Security
  - Ensure `ENCRYPTION_MASTER_KEY` is required in production builds (CI check)

Deployment checklist
--------------------
- Set environment variables in production:
  - DATABASE_URL
  - ENCRYPTION_MASTER_KEY
  - NEXT_PUBLIC_BASE_URL
  - NEXT_PUBLIC_VAPID_PUBLIC_KEY
  - VAPID_PRIVATE_KEY (server only)
  - TWILIO_ACCOUNT_SID (if using server-level account tasks)
  - TWILIO_AUTH_TOKEN
  - STRIPE keys (if billing present)
- Run Prisma migrations and `prisma generate --no-engine` in production build step as recommended.

Appendix: Quick commands
------------------------
Generate VAPID keys (example using web-push CLI):
```bash
npx web-push generate-vapid-keys -o vapid-keys.json
```

Store values:
 - NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
 - VAPID_PRIVATE_KEY=<privateKey> (server only)

Quality gates
-------------
- Build: next build completes with lint/type checks passing
- Tests: Unit tests for push helper and Twilio wrapper; integration test for subscribe/unsubscribe endpoints
- Observability: Metrics emitted for push and WhatsApp flows

Next steps (recommended)
------------------------
1. Review this PRD with stakeholders and sign off on scope and timeline.
2. Create implementation tickets (epics and stories) from the user stories and milestones above.
3. Generate VAPID keys for staging and production and add startup checks to fail fast when missing secrets.
4. Implement server-side endpoints and DB migrations for push subscriptions.
5. Improve Settings UI (we already added Push card and WhatsApp CTA) to include helper text and tests.

Files touched / to create (implementation hints)
- src/lib/pushNotifications.ts (client hook + manager) — already present; verify VAPID wiring
- src/app/sw.js (service worker) — ensure push event handler and showNotification
- src/app/api/notifications/push/subscribe (server route) — implement storing subscription
- src/app/api/notifications/push/unsubscribe (server route) — implement deletion
- prisma/migrations: add PushSubscription model and run prisma migrate
- docs/DEPLOYMENT.md — update with VAPID and ENCRYPTION_MASTER_KEY steps

Approval
--------
Please confirm acceptance of scope and the rollout approach. I can convert this PRD into granular GitHub issues and an implementation plan with concrete PRs, or start implementing the highest-priority items (VAPID wiring and push subscription endpoints) immediately.
