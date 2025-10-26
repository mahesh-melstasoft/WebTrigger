# Architecture — WebTrigger

This document describes the architecture for WebTrigger (PWA + Push + WhatsApp), including component boundaries, data flows, operational controls, security model, scaling guidance, and deployment steps. Use this as a source of truth for design reviews and implementation decisions.

## Goals
- Provide a reliable, secure webhook management service (WebTrigger) with PWA installability and push notification support.
- Provide a straightforward and secure credential flow for WhatsApp via Twilio.
- Ensure production readiness with secrets management, observability, scalability and a rollback-safe deployment plan.

---

## High-level components

1. Next.js App (App Router)
   - Code: `src/app/*` and `src/components/*`
   - Responsibilities: UI, server actions and API routes, rendering, authentication wrapper, feature flags, and simple server-side logic (API routes).
   - Deployed on: Vercel (recommended) or other Node/Edge provider.

2. Static Assets & PWA
   - Files: `public/manifest.json`, `public/sw.js`, icons in `public/`
   - Responsibilities: installable experience, SW registration, offline assets and handling push events.

3. Client Push Manager
   - File: `src/lib/pushNotifications.ts`
   - Responsibilities: Service worker registration, requesting Notification permission, subscribing via PushManager, extracting keys, and sending subscription to server API.

4. API and Server-side logic
   - Files: `src/app/api/*`, e.g. `src/app/api/notifications/push/*`, `src/app/api/service-credentials/*`
   - Responsibilities: Authenticated endpoints to store subscriptions, encrypt credentials, test providers, and trigger outbound messages.

5. Database (Postgres) + Prisma
   - Files: `prisma/schema.prisma`, `src/generated/prisma` (Prisma client)
   - Responsibilities: Application data (Users, Callbacks, ServiceCredentials, PushSubscription, NotificationSettings, etc.).

6. Outbound Messaging (Workers)
   - Location: Separate worker process or serverless functions; can be co-located in Next.js but recommended to run as background workers.
   - Responsibilities: Send pushes (via web-push using VAPID_PRIVATE_KEY), send WhatsApp messages via Twilio SDK, retries/backoff, DLQ for failures.
   - Implementation hints: Use `web-push` npm package and `twilio` npm package, queue with BullMQ (Redis) or native serverless task queues.

7. Secrets & Key Management
   - Examples: `ENCRYPTION_MASTER_KEY` (service credential encryption), `VAPID_PRIVATE_KEY` (server), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client), TWILIO secrets, DATABASE_URL
   - Store: Vercel environment variables or a secrets manager (recommended: KMS + environment injection for production).

8. Observability & Monitoring
   - Logs: Structured logs (pino/winston) with redaction for secrets.
   - Tracing / Errors: Sentry or similar.
   - Metrics: push.subscription.count, push.send.success/failure, whatsapp.test.success/failure, api.rate.limit events.

---

## Data model highlights

Key Prisma models (see `prisma/schema.prisma`):
- `User` — user accounts and relationships.
- `PushSubscription` — stores `endpoint`, `p256dhKey`, `authKey`, `userId`.
- `ServiceCredential` — encrypted `secret`, provider and meta.
- `NotificationSettings` — per-user preferences for channels.

Encryption:
- `ServiceCredential.secret` must be encrypted at rest using `ENCRYPTION_MASTER_KEY`.
- Use authenticated encryption (e.g., AES-GCM) and store an HMAC or version header for rotation.

---

## Typical flows

1) Push subscription (client -> server)

Sequence:
- Browser: user clicks "Enable Push" in Settings (client calls `usePushNotifications.requestPermission()`)
- Client registers service worker (`/sw.js`) and calls `serviceWorkerRegistration.pushManager.subscribe()` with VAPID public key
- Client sends subscription data { endpoint, keys: { p256dh, auth } } to `POST /api/notifications/push/subscribe` (Authorization: Bearer token)
- Server upserts `PushSubscription` record for user

ASCII sequence:

Client -> Next.js API: requestPermission
Client -> ServiceWorker registration
Client -> PushManager.subscribe -> subscription
Client -> POST /api/notifications/push/subscribe {endpoint, keys}
Next API -> DB: upsert PushSubscription
Response -> Client success

2) Send push notification (worker path)

- Event (manual/admin or webhook trigger) places message on queue with userId or subscription id
- Worker picks job, loads PushSubscription(s)
- Worker uses `web-push` with VAPID_PRIVATE_KEY to send push payload
- On success: update lastSeenAt or lastSentAt metric; on failure map codes and retry; on permanent failure remove subscription

3) WhatsApp test flow (credential creation & test)

- User clicks "Add Twilio Credential" -> UI opens Add Credential modal (preselect provider TWILIO)
- Client posts credential to `POST /api/service-credentials` (server encrypts secret and stores)
- User clicks "Test WhatsApp" -> `POST /api/notifications/whatsapp/test` with phone and credentialId
- Server decrypts credential, calls Twilio API to send test message. Returns success/failure and logs details

---

## Security model

1. Transport: enforce TLS for all endpoints. Do not expose secrets in client code.
2. Auth: API endpoints require Bearer token auth (current app uses local token in localStorage). For production, consider rotating to secure session cookies or NextAuth/OAuth.
3. Secrets: store `ENCRYPTION_MASTER_KEY`, `VAPID_PRIVATE_KEY`, `TWILIO_*` as server-only env variables. Do not commit them.
4. Encryption at rest: `ServiceCredential.secret` encrypted using `ENCRYPTION_MASTER_KEY`. Implement key versioning and a migration path.
5. Least privilege: worker/service roles only have access to the secrets they need.
6. Input validation: strictly validate shape of push subscription objects and credential payloads server-side.
7. Rate limiting: apply per-user and per-endpoint limits to prevent abuse (e.g., push subscribe spamming).

---

## Reliability & scaling

Worker design:
- Use an asynchronous worker (Node process or serverless) to send outbound pushes and messages. Scale workers horizontally.
- Use a queue (Redis + BullMQ, or platform queue) to buffer outgoing messages and retry with exponential backoff.

Push scaling notes:
- The Push API relies on browser vendor push services (e.g., FCM) to deliver messages. You are responsible for sending messages in a timely manner and handling transient errors.
- For very high volumes, batch sends across multiple worker instances and avoid sending very large payloads.

Database scaling:
- For typical usage, a single managed Postgres instance (Heroku, RDS, Azure Postgres) is suitable.
- For high scale: partition by tenant/user or use read replicas for reporting.

Pruning subscriptions:
- Keep `lastSeenAt` and prune stale subscriptions periodically (e.g., background job) to avoid accumulating invalid endpoints.

Idempotency & retries:
- Ensure sending behaviors are idempotent when possible. Use dedup keys in queue jobs.
- For provider errors (e.g., Twilio), map transient vs permanent errors and use retry/backoff accordingly. Move permanent failures to a DLQ for human inspection.

---

## Observability & operations

- Logging: structured logs (JSON) with correlation ID for flows (e.g., request id, user id, callback id).
- Tracing: instrument request flows and worker jobs with a tracing solution (OpenTelemetry/Sentry/Apm).
- Metrics: push subscription counts, send success/failure, whatsapp test counts, error rates, latency percentiles.
- Alerts: paging thresholds for high error rates (e.g., >5% failure rate for pushes sustained) and worker queue lag.
- Backups: daily DB backups retained 30 days; point-in-time recovery enabled on managed DB.

---

## Deployment & CI/CD

1. CI
- Run: `npm ci`, `npm run lint`, `npm run build`, `npm test`.
- Enforce `prisma generate --no-engine` in production pipeline (see Prisma note). Add a CI job that validates migrations are applied.

2. CD (Vercel recommended)
- Add environment variables in Vercel dashboard: `DATABASE_URL`, `ENCRYPTION_MASTER_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `TWILIO_*` and any Stripe keys.
- Use Vercel preview deployments for PRs and canary rollout.

3. Migration workflow
- Dev: `npx prisma migrate dev --name <desc>`
- Prod: `npx prisma migrate deploy` (run during CI/CD deploy) and then `npx prisma generate --no-engine`

4. Worker deployment
- Option 1: Separate Node worker running on a VM/Container with access to the same DB and Redis.
- Option 2: Serverless functions that process queue messages (e.g., Cloud Run jobs / AWS Lambda with SQS / Vercel background functions).

---

## Operational playbooks (short)

1. Push failing for many users
- Check worker queue backlog and worker logs
- Check VAPID_PRIVATE_KEY presence and web-push error codes
- Prune stale subscriptions and report metrics

2. WhatsApp messages failing
- Inspect Twilio error codes returned by API and map to human-friendly messages
- Check credentials exist and are not expired/rotated
- Review Twilio account (sandbox vs production) and message permissions

3. Credential compromise suspected
- Rotate `ENCRYPTION_MASTER_KEY` (requires re-encrypt process), rotate provider secrets in their consoles (Twilio/SendGrid), and revoke old keys
- Notify affected users if required by policy

---

## File & API map (quick reference)
- Client push logic: `src/lib/pushNotifications.ts`
- Service Worker: `public/sw.js`
- Manifest: `public/manifest.json`
- Push subscribe/unsubscribe endpoints:
  - `src/app/api/notifications/push/subscribe/route.ts`
  - `src/app/api/notifications/push/unsubscribe/route.ts`
- Service credentials: `src/app/api/service-credentials/route.ts` (existing)
- Prisma schema: `prisma/schema.prisma`
- Startup checks: `src/lib/startup.ts` (ensures `ENCRYPTION_MASTER_KEY` warning)
- PRD & backlog: `docs/PRD-WebTrigger-PWA-Push-WhatsApp.md`, `docs/ISSUES-WebTrigger-PWA-Push-WhatsApp.md`

---

## Next recommended engineering steps
1. Implement auth token -> user resolution in API routes (use existing auth middleware or `src/lib/auth.ts`).
2. Implement `src/lib/webpush.ts` to centralize web-push sending and integrate with workers.
3. Implement worker process with queue (BullMQ + Redis) to handle outbound messages and retry logic.
4. Harden secret management: prefer KMS for production key storage and rotate keys periodically.
5. Add integration tests for the push flow and WhatsApp flow (with Twilio test credentials).
6. Add monitoring dashboards and alerts.

---

If you want, I can now:
- Generate the worker skeleton (queue + job handlers) and web-push helper and add tests (I can implement these next).
- Implement auth wiring for the new push subscribe/unsubscribe routes.

Which of these should I implement next?