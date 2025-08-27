import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action } = await request.json();

        if (action === 'enable') {
            // Generate new TOTP secret
            const secret = speakeasy.generateSecret({
                name: `WebTrigger (${authResult.user!.email})`,
                issuer: 'WebTrigger',
                length: 32,
            });

            // Generate QR code
            const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

            // Store secret temporarily (user needs to verify before saving)
            await prisma.user.update({
                where: { id: authResult.user!.id },
                data: {
                    secret: `temp_${secret.base32}`, // Prefix to indicate temporary
                },
            });

            return NextResponse.json({
                secret: secret.base32,
                qrCode: qrCodeUrl,
                otpauth_url: secret.otpauth_url,
            });
        } else if (action === 'disable') {
            // Disable TOTP
            await prisma.user.update({
                where: { id: authResult.user!.id },
                data: { secret: null },
            });

            return NextResponse.json({ message: 'TOTP disabled successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('TOTP setup error:', error);
        return NextResponse.json(
            { error: 'Failed to setup TOTP' },
            { status: 500 }
        );
    }
}
