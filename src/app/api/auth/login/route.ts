import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, verifyToken, generateJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password, token } = await request.json();

        if (!email || !password || !token) {
            return NextResponse.json({ error: 'Email, password, and token are required' }, { status: 400 });
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

        if (!user.secret) {
            return NextResponse.json({ error: 'TOTP not set up' }, { status: 400 });
        }

        const isTokenValid = verifyToken(user.secret, token);
        if (!isTokenValid) {
            return NextResponse.json({ error: 'Invalid TOTP token' }, { status: 401 });
        }

        const jwt = generateJWT(user.id);

        return NextResponse.json({ message: 'Login successful', token: jwt });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
