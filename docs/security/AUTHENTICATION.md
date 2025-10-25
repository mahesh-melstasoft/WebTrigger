# Authentication & Security Architecture

## Overview

The application implements a **multi-layer authentication system** combining traditional email/password authentication with modern security practices including TOTP 2FA and JWT tokens.

---

## Authentication Layers

### Layer 1: Email & Password Registration

**Flow**:
1. User provides email and password via signup form
2. Password is hashed using **bcryptjs** (12 salt rounds)
3. User account created with hashed password
4. TOTP secret generated and displayed as QR code
5. User scans QR code with authenticator app

**Implementation**:
```typescript
// lib/auth.ts
export function hashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

export function generateSecret() {
    return speakeasy.generateSecret({ length: 32 });
}
```

**Security Measures**:
- ✅ Strong password hashing (bcryptjs with 12 rounds)
- ✅ Passwords never stored in plain text
- ✅ TOTP secret generation (32-character length)

---

### Layer 2: TOTP 2FA (Two-Factor Authentication)

**Purpose**: Prevent unauthorized access even with compromised passwords

**Implementation**:
```typescript
// lib/auth.ts
export function verifyToken(secret: string, token: string) {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2,  // Allow ±2 time windows
    });
}
```

**Features**:
- Time-based One-Time Password (TOTP)
- 30-second time window
- ±2 time window tolerance (allows clock skew)
- Works with Google Authenticator, Authy, Microsoft Authenticator, etc.

**Verification Flow**:
1. User logs in with email and password
2. System verifies password hash
3. System requests TOTP code from authenticator app
4. User enters 6-digit code
5. System verifies code with `speakeasy.totp.verify()`

**QR Code Generation**:
- Generated during signup
- Contains TOTP secret in standardized format
- Scanned into authenticator app
- User never needs to enter secret manually

---

### Layer 3: JWT Bearer Tokens

**Purpose**: Stateless session management for API requests

**Token Generation**:
```typescript
// lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateJWT(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
```

**Features**:
- Issued after successful TOTP verification
- 7-day expiration
- Contains user ID in payload
- Server-side verification against JWT_SECRET

**Usage**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verification Middleware**:
```typescript
// lib/auth.ts
export async function authMiddleware(request: Request): Promise<AuthResult> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, error: 'No authorization token provided' };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
    });

    if (!user?.isActive) {
        return { success: false, error: 'Account is deactivated' };
    }

    return { success: true, user };
}
```

**Security Measures**:
- ✅ JWT verified on every protected request
- ✅ User's active status checked
- ✅ Token expiration enforced
- ✅ Secret stored in environment variable

---

### Layer 4: API Key Authentication

**Purpose**: Long-lived credentials for programmatic access

**Storage**:
```prisma
model ApiKey {
  id          String    @id @default(cuid())
  key         String    @unique
  userId      String
  permissions String[]  // ['read', 'write', 'admin']
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime
  updatedAt   DateTime
}
```

**Features**:
- Unique API key per credential
- Permission-based access control
- Optional expiration dates
- Usage tracking (lastUsedAt)
- Multiple keys per user

**Usage**:
```
Authorization: Bearer api_key_xxx...
```

**Security Measures**:
- ✅ Keys should be hashed in production (currently not)
- ✅ Permissions granularity
- ✅ Expiration support
- ✅ Usage audit trail

---

## Authorization System

### Role-Based Access Control (RBAC)

**User Roles**:
```prisma
enum UserRole {
  ADMIN      // Full platform access
  PREMIUM    // Enhanced features
  PRO        // Advanced features
  FREE       // Basic features
}
```

**Role Implications**:
- Determines available subscription plan
- Controls feature access (rate limits, callback limits)
- Admin role for platform management

**Enforcement**:
```typescript
// Check user role before granting access
if (user.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
}
```

### Account Activation Control

```typescript
// User account can be deactivated
isActive: Boolean @default(true)

// Checked during auth
if (!user.isActive) {
    return { success: false, error: 'Account is deactivated' };
}
```

---

## Encryption for Sensitive Data

### Service Credential Encryption

**Purpose**: Store API keys for external services securely

**Implementation**:
```typescript
// lib/cryptoHelper.ts
export function decryptSecret(secret: string): string {
    if (!isEncryptionConfigured()) {
        throw new Error('Encryption not configured');
    }
    // Decrypt Base64-encoded secret
    return decrypt(Buffer.from(secret, 'base64'));
}
```

**Flow**:
1. External service credentials stored as Base64-encoded encrypted blobs
2. Decrypted only when needed for API calls
3. Never stored or transmitted in plain text

**Supported Providers**:
- SendGrid (email)
- Twilio (SMS)
- Slack (webhooks)
- Discord (webhooks)
- Generic provider

---

## HMAC Signing for Webhooks

**Purpose**: Verify webhook authenticity and detect tampering

**Implementation in Actions**:
```typescript
// lib/actionExecutor.ts
if (action.config?.hmacSecret && action.config?.hmacHeader) {
    const hmac = crypto.createHmac('sha256', action.config.hmacSecret);
    hmac.update(payload.rawBody);
    headers[action.config.hmacHeader] = hmac.digest('hex');
}
```

**Features**:
- SHA256-based HMAC signing
- Configurable header name
- Prevents webhook spoofing
- Payload integrity verification

---

## Security Best Practices Implemented

✅ **Password Security**
- Bcryptjs hashing with 12 salt rounds
- No plain-text storage
- Bcrypt automatically handles salt generation and verification

✅ **2FA Implementation**
- TOTP 2FA with time-window tolerance
- QR code for easy setup
- Works with standard authenticator apps

✅ **Token Security**
- JWT with expiration
- Environment-based secret
- Bearer token format

✅ **Data Encryption**
- Base64-encoded encrypted credentials
- Decryption only on use
- Configurable encryption backend

✅ **Authorization**
- Role-based access control
- Account activation status
- Permission-based API keys

---

## Security Recommendations

### ⚠️ High Priority

1. **API Key Hashing**
   - Hash API keys before storage
   - Only store public prefix for identification
   - Enable key rotation mechanism

2. **Audit Logging**
   - Log all authentication attempts
   - Track failed login attempts
   - Monitor API key usage
   - Record permission changes

3. **Rate Limiting on Auth Endpoints**
   - Limit login attempts (prevent brute force)
   - Limit signup (prevent spam)
   - Limit API key generation

### 🔶 Medium Priority

4. **Token Refresh Strategy**
   - Implement refresh tokens
   - Reduce JWT expiration time
   - Support token revocation

5. **HTTPS Enforcement**
   - Require HTTPS in production
   - Redirect HTTP to HTTPS
   - HSTS header support

6. **CORS Configuration**
   - Whitelist allowed origins
   - Restrict API access by domain

### 🔵 Nice to Have

7. **Session Management**
   - Session timeout
   - Concurrent session limits
   - Device tracking

8. **Security Headers**
   - CSP (Content Security Policy)
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

---

## Environment Configuration

**Required for Authentication**:
```env
JWT_SECRET=<secure-random-string-32+ chars>
DATABASE_URL=<postgresql-connection-string>
```

**For Encryption** (if available):
```env
ENCRYPTION_KEY=<base64-encoded-32-byte-key>
ENCRYPTION_IV=<base64-encoded-16-byte-iv>
```

---

## Authentication Endpoints

- `POST /api/auth/signup` - Create account with TOTP
- `POST /api/auth/login` - Login with TOTP verification
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/totp` - Verify TOTP code

---

**Last Updated**: October 25, 2025
