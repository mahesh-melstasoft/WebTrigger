import speakeasy from 'speakeasy';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
