// Startup checks for production environment
export function ensureStartupRequirements() {
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.ENCRYPTION_MASTER_KEY) {
            // During next build this file may be imported; avoid throwing during build to not block compilation.
            // Instead, log a clear error that will be visible in server logs. Operators should set this in production.
            console.error('ENCRYPTION_MASTER_KEY is not set. ServiceCredential encryption will fail at runtime. Set ENCRYPTION_MASTER_KEY in production environment.');
        }
        // Additional production checks (VAPID private key) can be added here
    }
}
