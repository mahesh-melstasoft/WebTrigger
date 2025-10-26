import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's notification settings
        const settings = await prisma.notificationSettings.findUnique({
            where: { userId: authResult.user!.id },
        });

        // Get user role for subscription check
        const user = await prisma.user.findUnique({
            where: { id: authResult.user!.id },
            select: { role: true },
        });

        const hasPaidSubscription = user?.role !== 'FREE';

        // Return settings with subscription info
        const notificationSettings = settings || {
            id: '',
            userId: authResult.user!.id,
            emailEnabled: true,
            emailRecipients: [],
            emailOnSuccess: true,
            emailOnFailure: true,
            whatsappEnabled: false,
            whatsappNumbers: [],
            whatsappOnSuccess: false,
            whatsappOnFailure: true,
            telegramEnabled: false,
            telegramChatIds: [],
            telegramOnSuccess: false,
            telegramOnFailure: true,
            smsEnabled: false,
            smsNumbers: [],
            smsOnSuccess: false,
            smsOnFailure: true,
            pushEnabled: false,
            pushOnSuccess: false,
            pushOnFailure: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({
            ...notificationSettings,
            hasPaidSubscription,
            subscriptionRequired: {
                whatsapp: !hasPaidSubscription,
                sms: !hasPaidSubscription,
            },
        });
    } catch (error) {
        console.error('Notification settings fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notification settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Get user role for subscription validation
        const user = await prisma.user.findUnique({
            where: { id: authResult.user!.id },
            select: { role: true },
        });

        const hasPaidSubscription = user?.role !== 'FREE';

        // Validate subscription requirements
        if (!hasPaidSubscription) {
            if (data.whatsappEnabled || data.smsEnabled) {
                return NextResponse.json(
                    { error: 'WhatsApp and SMS notifications require a paid subscription' },
                    { status: 403 }
                );
            }
        }

        // Validate recipient limits based on plan
        let maxRecipients = 1; // Free plan
        if (user?.role === 'PREMIUM') maxRecipients = 3; // Starter
        else if (user?.role === 'PRO') maxRecipients = 10; // Pro
        else if (user?.role === 'ADMIN') maxRecipients = -1; // Unlimited

        const totalRecipients = (data.emailRecipients?.length || 0) +
            (data.whatsappNumbers?.length || 0) +
            (data.telegramChatIds?.length || 0) +
            (data.smsNumbers?.length || 0);

        if (maxRecipients !== -1 && totalRecipients > maxRecipients) {
            return NextResponse.json(
                { error: `Your plan allows maximum ${maxRecipients} notification recipients total` },
                { status: 400 }
            );
        }

        // Update or create notification settings
        const settings = await prisma.notificationSettings.upsert({
            where: { userId: authResult.user!.id },
            update: {
                emailEnabled: data.emailEnabled ?? true,
                emailRecipients: data.emailRecipients ?? [],
                emailOnSuccess: data.emailOnSuccess ?? true,
                emailOnFailure: data.emailOnFailure ?? true,
                whatsappEnabled: hasPaidSubscription ? (data.whatsappEnabled ?? false) : false,
                whatsappNumbers: hasPaidSubscription ? (data.whatsappNumbers ?? []) : [],
                whatsappOnSuccess: data.whatsappOnSuccess ?? false,
                whatsappOnFailure: data.whatsappOnFailure ?? true,
                telegramEnabled: data.telegramEnabled ?? false,
                telegramChatIds: data.telegramChatIds ?? [],
                telegramOnSuccess: data.telegramOnSuccess ?? false,
                telegramOnFailure: data.telegramOnFailure ?? true,
                smsEnabled: hasPaidSubscription ? (data.smsEnabled ?? false) : false,
                smsNumbers: hasPaidSubscription ? (data.smsNumbers ?? []) : [],
                smsOnSuccess: data.smsOnSuccess ?? false,
                smsOnFailure: data.smsOnFailure ?? true,
                pushEnabled: data.pushEnabled ?? false,
                pushOnSuccess: data.pushOnSuccess ?? false,
                pushOnFailure: data.pushOnFailure ?? true,
            },
            create: {
                userId: authResult.user!.id,
                emailEnabled: data.emailEnabled ?? true,
                emailRecipients: data.emailRecipients ?? [],
                emailOnSuccess: data.emailOnSuccess ?? true,
                emailOnFailure: data.emailOnFailure ?? true,
                whatsappEnabled: false, // Always false for new settings without paid sub
                whatsappNumbers: [],
                whatsappOnSuccess: data.whatsappOnSuccess ?? false,
                whatsappOnFailure: data.whatsappOnFailure ?? true,
                telegramEnabled: data.telegramEnabled ?? false,
                telegramChatIds: data.telegramChatIds ?? [],
                telegramOnSuccess: data.telegramOnSuccess ?? false,
                telegramOnFailure: data.telegramOnFailure ?? true,
                smsEnabled: false, // Always false for new settings without paid sub
                smsNumbers: [],
                smsOnSuccess: data.smsOnSuccess ?? false,
                smsOnFailure: data.smsOnFailure ?? true,
                pushEnabled: data.pushEnabled ?? false,
                pushOnSuccess: data.pushOnSuccess ?? false,
                pushOnFailure: data.pushOnFailure ?? true,
            },
        });

        return NextResponse.json({
            ...settings,
            hasPaidSubscription,
            subscriptionRequired: {
                whatsapp: !hasPaidSubscription,
                sms: !hasPaidSubscription,
            },
        });
    } catch (error) {
        console.error('Notification settings update error:', error);
        return NextResponse.json(
            { error: 'Failed to update notification settings' },
            { status: 500 }
        );
    }
}