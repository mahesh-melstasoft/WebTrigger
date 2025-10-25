import speakeasy from 'speakeasy';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
    role: string;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
}

export async function authMiddleware(request: Request): Promise<AuthResult> {
    try {
        let token: string | null = null;

        // Check Authorization header first
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }

        // If no token in header, check query parameter (for EventSource compatibility)
        if (!token && request.url) {
            const url = new URL(request.url);
            token = url.searchParams.get('token');
        }

        if (!token) {
            return { success: false, error: 'No authorization token provided' };
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                isActive: true,
            },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (!user.isActive) {
            return { success: false, error: 'Account is deactivated' };
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName || undefined,
                role: user.role,
            },
        };
    } catch (error) {
        console.error('Auth middleware error:', error);
        return { success: false, error: 'Invalid or expired token' };
    }
}

export function generateSecret() {
    return speakeasy.generateSecret({ length: 32 });
}

export function verifyToken(secret: string, token: string) {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2,
    });
}

export function hashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
}

export function generateJWT(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJWT(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
        return null;
    }
}

export async function getUserFromToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    if (!payload) return null;
    // In real app, fetch user from DB, but for now return id
    return payload.userId;
}
