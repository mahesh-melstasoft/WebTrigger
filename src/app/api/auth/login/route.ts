import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, verifyToken, generateJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password, token } = await request.json();

        if (!email || !password || !token) {
            return NextResponse.json({ error: 'Email, password, and token are required' }, { status: 400 });
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
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
