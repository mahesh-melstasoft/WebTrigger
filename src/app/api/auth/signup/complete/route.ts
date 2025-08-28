import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { userId, token } = await request.json();

        if (!userId || !token) {
            return NextResponse.json({ error: 'User ID and TOTP token are required' }, { status: 400 });
        }

        // Get user with temporary secret
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                secret: true,
                isActive: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.isActive) {
            return NextResponse.json({ error: 'Account is already active' }, { status: 400 });
        }

        if (!user.secret || !user.secret.startsWith('temp_')) {
            return NextResponse.json({ error: 'Invalid account state' }, { status: 400 });
        }

        // Extract the actual secret (remove 'temp_' prefix)
        const actualSecret = user.secret.substring(5);

        // Verify TOTP token
        const verified = speakeasy.totp.verify({
            secret: actualSecret,
            encoding: 'base32',
            token: token,
            window: 2, // Allow 2 steps (30 seconds) tolerance
        });

        if (!verified) {
            return NextResponse.json({ error: 'Invalid TOTP token' }, { status: 400 });
        }

        // Complete signup: activate account and clean up temporary secret
        await prisma.user.update({
            where: { id: userId },
            data: {
                secret: actualSecret, // Remove temp_ prefix
                isActive: true,
            },
        });

        return NextResponse.json({
            message: 'Account setup completed successfully! You can now log in.',
            success: true,
        });
    } catch (error) {
        console.error('Signup completion error:', error);
        return NextResponse.json(
            { error: 'Failed to complete signup' },
            { status: 500 }
        );
    }
}
