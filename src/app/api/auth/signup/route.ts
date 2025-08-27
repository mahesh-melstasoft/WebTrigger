import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecret, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);
        const secret = generateSecret();

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                secret: secret.base32,
            },
        });

        return NextResponse.json({
            message: 'User created successfully',
            qrCodeUrl: secret.otpauth_url, // For QR code generation
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
