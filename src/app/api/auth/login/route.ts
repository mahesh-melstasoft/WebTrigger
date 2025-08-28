import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, verifyToken, generateJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password, token } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Check if required environment variables are set
        if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL environment variable is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if user has 2FA enabled
        if (user.secret) {
            // User has 2FA enabled, require TOTP token
            if (!token) {
                return NextResponse.json({ error: 'TOTP token is required for accounts with 2FA enabled' }, { status: 400 });
            }

            const isTokenValid = verifyToken(user.secret, token);
            if (!isTokenValid) {
                return NextResponse.json({ error: 'Invalid TOTP token' }, { status: 401 });
            }
        } else {
            // User doesn't have 2FA enabled, no token required
            // This is fine, continue with login
        }

        const jwt = generateJWT(user.id);

        return NextResponse.json({
            message: 'Login successful',
            token: jwt,
            twoFactorEnabled: !!user.secret
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
