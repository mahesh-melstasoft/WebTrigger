# Deployment checklist (Vercel)

This file lists the essential steps and environment variables required to deploy the project to Vercel.

## Required environment variables
- `DATABASE_URL` - Postgres connection string used by Prisma
- `NEXT_PUBLIC_BASE_URL` - Your production URL, e.g. `https://app.example.com` (used in SEO tags and sitemap)
- `ENCRYPTION_MASTER_KEY` - Random secret used for encrypting service credentials (store securely)
- `NEXTAUTH_URL` - URL used by authentication callbacks (if using NextAuth)
- `NEXTAUTH_SECRET` - Secret for NextAuth JWT signing (can fallback to ENCRYPTION_MASTER_KEY)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public VAPID key for web push notifications
- `VAPID_PRIVATE_KEY` - Private VAPID key for web push notifications
- Payment provider secrets (if used): `STRIPE_SECRET`, `PAYPAL_CLIENT_ID`, etc.
- Any 3rd-party service secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, etc.

## Recommended build step
- Vercel runs `npm run build` by default. Ensure `npx prisma generate --no-engine` is run if you prefer generating Prisma client without native engines in CI.

## Steps
1. Push your code to GitHub (main or a branch).
2. In Vercel, create a new project and connect to this repository.
3. Under Project Settings -> Environment Variables, add the keys above for Production and Preview as needed.
4. Deploy the project (Vercel will build automatically).
5. Verify logs for any missing env warnings (e.g., `ENCRYPTION_MASTER_KEY is not set`).

## Post-deploy
- Visit the production site and test PWA install from mobile browsers.
- Confirm API routes under `/api/*` work as expected with auth tokens.
- Test OAuth sign-in (Google/GitHub) and token exchange at `/api/auth/token-exchange`.
- Test push notifications by subscribing and sending test pushes.
