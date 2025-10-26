# Backlog: WebTrigger PWA, Push & WhatsApp — Epics and Stories

Reference PRD: `docs/PRD-WebTrigger-PWA-Push-WhatsApp.md`

This document shards the PRD into epics, user stories, acceptance criteria, technical tasks, estimates, and suggested priorities. Use these as issue templates when creating issues in GitHub or your project tracker.

---

## Epic A — PWA Foundations
Goal: Make WebTrigger installable and offline-friendly with a Service Worker, manifest and install prompt.
Priority: High
Milestone: Week 1

Stories:

A.1 Add web app manifest and icons
- Description: Provide a valid `manifest.json` with app name, icons for multiple sizes, theme_color, background_color, display and start_url.
- Tasks:
  - Create `public/manifest.json` with required fields
  - Add icons to `public/` (192px, 512px, maskable)
  - Link manifest in `src/app/layout.tsx`
- Estimate: 1
- Acceptance criteria:
  - `manifest.json` is present and validated by Chrome manifest inspector
  - App is recognized as PWA by browser when served over HTTPS

A.2 Implement Service Worker and provide `/sw.js`
- Description: Add a lightweight service worker that handles `install`, `activate`, `fetch` (basic caching) and `push` events with sample `showNotification` handling.
- Tasks:
  - Add `public/sw.js` or route at `/sw.js`
  - Implement caching strategy for static assets (cache-first) and fallback
  - Add push event listener to display notification with payload support
  - Ensure service worker uses `self.skipWaiting()`/`clients.claim()` appropriately
- Estimate: 3
- Acceptance criteria:
  - SW registers on supported browsers and shows notifications when push events are simulated
  - Offline page load of basic UI works for primary routes

A.3 PWA Install Prompt component
- Description: Implement a client component that listens for `beforeinstallprompt` and shows a friendly CTA in the UI.
- Tasks:
  - Reuse or enhance existing `InstallPrompt` component
  - Track analytics events when user accepts/dismisses
- Estimate: 2
- Acceptance criteria:
  - `beforeinstallprompt` captured and the UI can trigger `prompt()`
  - Analytics events emitted for accept/dismiss

---

## Epic B — Push Notifications (Client + Server)
Goal: Enable browser push: subscription lifecycle, server storage, and safe client UX.
Priority: High
Milestone: Week 2

B.1 Add DB model and migration for push subscriptions (Prisma)
- Description: Add a `PushSubscription` model in Prisma and generate a migration.
- Tasks:
  - Add Prisma model to `prisma/schema.prisma`:
    ```prisma
    model PushSubscription {
      id        String   @id @default(cuid())
      userId    String   @index
      endpoint  String   @unique
      p256dh    String
      auth      String
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
      lastSeenAt DateTime?
    }
    ```
  - Run `prisma migrate dev` to create migration
  - Run `prisma generate`
- Estimate: 2
- Acceptance criteria:
  - DB migration applied locally and Prisma client regenerated

B.2 Server endpoints: subscribe/unsubscribe
- Description: Implement `/api/notifications/push/subscribe` and `/api/notifications/push/unsubscribe` (auth required).
- Tasks:
  - Create API routes under `src/app/api/notifications/push/route.ts` or appropriate structure
  - Validate payload shapes and auth
  - Upsert subscription record on subscribe
  - Remove or mark unsubscribed on unsubscribe
  - Add rate limiting (simple in-memory or existing rate-limit util)
- Estimate: 3
- Acceptance criteria:
  - Client can POST a subscription and see it persisted in DB
  - Unsubscribe removes DB entry

B.3 Web-push sending helper and VAPID wiring
- Description: Create a server helper that sends push messages using VAPID keys. Add startup checks for VAPID private key presence in production.
- Tasks:
  - Add `src/lib/webpush.ts` wrapper around `web-push` package
  - Add environment variables: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client) and `VAPID_PRIVATE_KEY` (server)
  - Add a test/admin endpoint to send a test push to a subscription id
  - Emit metrics on send result
- Estimate: 3
- Acceptance criteria:
  - Server can send a push message to a subscription (when valid keys are provided)
  - CI/Startup warns/fails when private key missing in production

B.4 Client: finalize `usePushNotifications()` and UX polish
- Description: Ensure the client hook handles register/subscribe/unsubscribe flows correctly and the Settings UI uses it.
- Tasks:
  - Ensure service worker registration occurs before subscription
  - Add loading/error states and user-friendly messages
  - Persist a client-side opt-out flag to avoid repeat prompts
  - Hook into analytics for permission, subscribe, unsubscribe events
- Estimate: 2
- Acceptance criteria:
  - From settings page user can request permission, subscribe, and unsubscribe successfully
  - Subscription is persisted server-side and toggling the UI reflects server state

---

## Epic C — WhatsApp via Twilio (Credential flow + Test)
Goal: Provide a clear flow to add Twilio credentials and send test WhatsApp messages securely.
Priority: High
Milestone: Week 3

C.1 Add TWILIO as credential provider option in UI
- Description: Ensure Add Credential modal includes `TWILIO` as provider and helper text for required fields.
- Tasks:
  - Add `TWILIO` option to provider select (already added in recent edits)
  - Add inline helper text explaining Account SID, Auth Token, WhatsApp number formatting, and sandbox rules
- Estimate: 1
- Acceptance criteria:
  - Add Credential modal preselectable with TWILIO and helper text present

C.2 Server: accept and store Twilio credential (encrypted)
- Description: Use existing service credential endpoint; ensure Twilio credentials stored encrypted with `ENCRYPTION_MASTER_KEY`.
- Tasks:
  - Ensure `service-credentials` POST route encrypts credential secret (if not already)
  - Add server-side validation for Twilio values (basic format checks)
- Estimate: 2
- Acceptance criteria:
  - After creating credential, secret is not recoverable via raw DB queries (encrypted)

C.3 Endpoint: send test WhatsApp message
- Description: Implement `/api/notifications/whatsapp/test` which uses the provided credential to attempt sending a test message and returns structured provider errors when they occur.
- Tasks:
  - Implement Twilio wrapper with retry/backoff and error mapping
  - Implement API route that accepts phone and credentialId, validates auth, attempts to send, and returns result
  - Add log events and metrics
- Estimate: 3
- Acceptance criteria:
  - Valid credentials send a test message (if Twilio number is configured) and API returns success
  - Invalid credentials return clear error messages with Twilio error code mapping

C.4 UI: WhatsApp test button, masked numbers and gating
- Description: Allow users to test WhatsApp after adding Twilio credentials; hide/mask phone numbers in lists and show gating if plan restricted.
- Tasks:
  - Add Test button to WhatsApp card when a Twilio credential and phone are present
  - Mask phone numbers in lists (e.g., +1•••1234)
  - Show upgrade CTA if feature gated
- Estimate: 2
- Acceptance criteria:
  - User can click Test and receive a pass/fail message with troubleshooting tips

---

## Epic D — Credentials Encryption & Key Management
Goal: Ensure all service credentials are encrypted at rest and production requires ENCRYPTION_MASTER_KEY.
Priority: High
Milestone: Week 1-2 (parallel)

D.1 Startup enforcement for `ENCRYPTION_MASTER_KEY`
- Description: Fail-fast if `ENCRYPTION_MASTER_KEY` not set in production. Warn in staging/dev if absent.
- Tasks:
  - Add startup check in `src/lib/prisma.ts` or a new `src/lib/startup.ts`
  - Modify docker/CI docs to document env var requirement
- Estimate: 1
- Acceptance criteria:
  - Production runtime exits with a clear error if key is missing

D.2 Encryption helper and migration path
- Description: Centralize encryption helpers for encrypt/decrypt operations and provide a safe rotation path.
- Tasks:
  - Add `src/lib/cryptoHelper.ts` if not present; use AES-GCM or libsodium
  - Update service-credential store and read paths to use the helper
  - Document rotation plan in `docs/`
- Estimate: 3
- Acceptance criteria:
  - Credentials are stored encrypted and decrypted transparently when accessed by authorized server code

---

## Epic E — Observability, Metrics & QA
Goal: Add metrics, logging and tests for push & WhatsApp flows.
Priority: Medium
Milestone: Week 3-4

E.1 Metrics and logging for push/whatsapp flows
- Description: Emit simple metrics (permission requests, subscriptions, test attempts).
- Tasks:
  - Integrate with existing metrics (or simple logging if none exists)
  - Add counters for push.permission.requested, push.subscribed, whatsapp.test.success/fail
- Estimate: 2
- Acceptance criteria:
  - Metrics visible in logs or metrics backend and track test events

E.2 Unit and integration tests
- Description: Add unit tests for `usePushNotifications()` logic and Twilio helper, and an integration test for subscribe/unsubscribe endpoints.
- Tasks:
  - Add Jest/Playwright tests for client hook (mock ServiceWorkerGlobalScope)
  - Add integration tests for server endpoints (auth mock, DB test instance)
- Estimate: 4
- Acceptance criteria:
  - Test suite covers the main happy paths and one negative case each for push and WhatsApp

---

## Sprint slices (example 2-week sprint plan)

Sprint 1 (2 weeks)
- A.1 Add manifest and icons (1)
- A.3 InstallPrompt (2)
- D.1 Startup enforcement for ENCRYPTION_MASTER_KEY (1)
- B.1 Prisma model & migration (2)
- B.2 Subscribe/unsubscribe endpoints (3)
- CI/Build validation: ensure `next build` runs

Sprint 2 (2 weeks)
- A.2 Service Worker + basic caching + push event (3)
- B.3 web-push helper + VAPID wiring (3)
- B.4 Client push hook polish + Settings UX (2)
- E.1 Metrics lightweight (2)

Sprint 3 (2 weeks)
- C.1 TWILIO provider UI polish (1)
- C.2 Server-side credential storage encryption checks (2)
- C.3 WhatsApp test endpoint (3)
- C.4 WhatsApp test UI and masking (2)
- E.2 Unit/integration tests (4)

---

## Issue template (copy into GitHub issue body)

Title: [Epic/Story] Short description

Body:
- PRD reference: `docs/PRD-WebTrigger-PWA-Push-WhatsApp.md`
- Story: One-line summary
- Description: Longer description and UX flow
- Acceptance criteria:
  - AC 1
  - AC 2
- Tasks:
  - task 1
  - task 2
- Estimate: X points
- Priority: High/Medium/Low
- Related: links to other issues or PRD

---

## Notes and assumptions
- Use existing authentication (Bearer token in localStorage) for internal API calls. If you want to migrate to cookie sessions or NextAuth, add a migration epic.
- The PRD and this backlog assume Prisma is the single source of truth and that `ENCRYPTION_MASTER_KEY` is available as an environment variable in production. If key management should be moved to a secrets manager (AWS KMS / GCP KMS / Azure KeyVault), add a dedicated epic.

---

If you want, I can now:
1. Create GitHub issues for the top-priority stories on `main` (need repo permissions/token). OR
2. Start implementing Sprint 1 items (manifest, install prompt, ENCRYPTION_MASTER_KEY check, Prisma model and subscribe endpoint). OR
3. Generate a CSV/JSON output ready for import into a project management tool.

Which should I do next?