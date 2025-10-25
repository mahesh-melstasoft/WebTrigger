# Technology Stack

## Overview

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15.5.2, React 19.1.0, TypeScript 5 |
| **Backend** | Next.js API routes, Node.js |
| **Database** | PostgreSQL (Vercel Postgres ready), Prisma 6.14.0 |
| **Authentication** | JWT + TOTP 2FA (Google Authenticator) |
| **Payments** | Stripe integration |
| **Styling** | Tailwind CSS 4, Radix UI components |
| **External APIs** | SendGrid (email), Twilio (SMS), Slack webhooks |

## Core Dependencies

### Framework & Runtime
```json
{
  "next": "15.5.2",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "typescript": "5"
}
```

### Database & ORM
```json
{
  "@prisma/client": "6.14.0",
  "@prisma/extension-accelerate": "2.0.2",
  "prisma": "6.14.0"
}
```

### Authentication & Security
```json
{
  "jsonwebtoken": "9.0.2",
  "bcryptjs": "3.0.2",
  "speakeasy": "2.0.0"
}
```

### Payment Processing
```json
{
  "stripe": "18.4.0"
}
```

### UI Components & Styling
```json
{
  "tailwindcss": "4",
  "@tailwindcss/postcss": "4",
  "@radix-ui/react-checkbox": "1.3.3",
  "@radix-ui/react-dialog": "1.1.15",
  "@radix-ui/react-dropdown-menu": "2.1.16",
  "@radix-ui/react-label": "2.1.7",
  "@radix-ui/react-select": "2.2.6",
  "@radix-ui/react-slider": "1.3.6",
  "@radix-ui/react-slot": "1.2.3",
  "@radix-ui/react-tabs": "1.1.13",
  "lucide-react": "0.542.0",
  "class-variance-authority": "0.7.1",
  "clsx": "2.1.1",
  "tailwind-merge": "3.3.1"
}
```

### Data Visualization
```json
{
  "recharts": "3.1.2"
}
```

### HTTP & Utilities
```json
{
  "axios": "1.11.0",
  "qrcode": "1.5.4",
  "bmad-method": "4.44.1"
}
```

## Development Dependencies

```json
{
  "@types/bcryptjs": "2.4.6",
  "@types/jsonwebtoken": "9.0.10",
  "@types/qrcode": "1.5.5",
  "@types/speakeasy": "2.0.10",
  "@types/stripe": "8.0.416",
  "@types/node": "20",
  "@types/react": "19",
  "@types/react-dom": "19",
  "eslint": "9",
  "eslint-config-next": "15.5.2",
  "@eslint/eslintrc": "3",
  "ts-node": "10.9.2",
  "tsx": "4.20.5",
  "tw-animate-css": "1.3.7"
}
```

## Build & Development Scripts

```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "eslint",
  "postinstall": "prisma generate",
  "db:seed": "tsx prisma/seed.ts"
}
```

## Key Features by Dependency

### Authentication
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing with configurable rounds
- **speakeasy**: TOTP generation and verification for 2FA

### Data Management
- **@prisma/client**: Type-safe ORM for database queries
- **@prisma/extension-accelerate**: Query acceleration and connection pooling

### UI/UX
- **@radix-ui**: Unstyled, accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Comprehensive icon library
- **recharts**: React component library for charts

### External Integrations
- **stripe**: Payment processing and subscription management
- **axios**: HTTP client for API calls
- **qrcode**: QR code generation for TOTP setup

### Development
- **tsx**: Run TypeScript files directly in Node.js
- **ts-node**: TypeScript execution engine
- **eslint**: Code linting and quality

## Environment Requirements

### Required Environment Variables
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional Environment Variables
```
SENDGRID_API_KEY=SG_...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SLACK_BOT_TOKEN=...
```

## Deployment Platforms

### Primary: Vercel
- Native Next.js support
- Serverless functions
- PostgreSQL integration
- Environment variables management
- Git-based deployments

### Alternative: Self-Hosted
- Docker container support
- PostgreSQL database
- Node.js runtime environment
- Reverse proxy (Nginx/Apache)

## Performance Optimizations

### Build-Time
- Turbopack enabled for faster builds
- Prisma schema generation on postinstall
- TypeScript compilation optimization

### Runtime
- Prisma connection pooling (with Accelerate)
- Next.js API routes (serverless)
- Incremental Static Generation (ISG)
- Image optimization

## Versioning Strategy

All dependencies are pinned to specific versions for stability. Regular updates should be tested thoroughly before deployment.

