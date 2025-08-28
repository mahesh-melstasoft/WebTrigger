import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecret, hashPassword } from '@/lib/auth';
import qrcode from 'qrcode';

export async function POST(request: NextRequest) {
    try {
        const { email, password, enable2FA = false } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        if (enable2FA) {
            // Generate TOTP secret and QR code for 2FA setup
            const secret = generateSecret();
            const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url!);

            // Create user with inactive status and temporary secret
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    secret: `temp_${secret.base32}`, // Temporary secret until verified
                    isActive: false, // Account inactive until TOTP verification
                },
            });

            return NextResponse.json({
                message: 'Account created. Please scan the QR code and verify with TOTP to complete setup.',
                userId: user.id,
                qrCodeUrl: qrCodeDataUrl,
                secret: secret.base32,
                otpauth_url: secret.otpauth_url,
                requiresVerification: true,
                twoFactorEnabled: true,
            });
        } else {
            // Create user without 2FA - directly active
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    secret: null, // No TOTP secret
                    isActive: true, // Account active immediately
                },
            });

            return NextResponse.json({
                message: 'Account created successfully! You can now log in.',
                userId: user.id,
                requiresVerification: false,
                twoFactorEnabled: false,
            });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
