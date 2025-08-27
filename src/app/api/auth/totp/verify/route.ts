import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token, action } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Get user's TOTP secret
        const user = await prisma.user.findUnique({
            where: { id: authResult.user!.id },
            select: { secret: true },
        });

        if (!user?.secret) {
            return NextResponse.json({ error: 'TOTP not enabled' }, { status: 400 });
        }

        // Handle temporary secrets (during setup)
        const isTempSecret = user.secret.startsWith('temp_');
        const actualSecret = isTempSecret ? user.secret.substring(5) : user.secret;

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

        if (action === 'verify_setup' && isTempSecret) {
            // Complete TOTP setup by removing temp prefix
            await prisma.user.update({
                where: { id: authResult.user!.id },
                data: { secret: actualSecret },
            });

            return NextResponse.json({
                message: 'TOTP setup completed successfully',
                verified: true
            });
        }

        return NextResponse.json({
            message: 'TOTP token verified successfully',
            verified: true
        });
    } catch (error) {
        console.error('TOTP verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify TOTP token' },
            { status: 500 }
        );
    }
}
