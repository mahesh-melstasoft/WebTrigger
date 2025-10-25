import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subscriptionData = await request.json();

        // Validate subscription data
        if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        // Store or update push subscription
        const pushSubscription = await prisma.pushSubscription.upsert({
            where: {
                userId: authResult.user!.id
            },
            update: {
                endpoint: subscriptionData.endpoint,
                p256dhKey: subscriptionData.keys.p256dh,
                authKey: subscriptionData.keys.auth,
                updatedAt: new Date()
            },
            create: {
                userId: authResult.user!.id,
                endpoint: subscriptionData.endpoint,
                p256dhKey: subscriptionData.keys.p256dh,
                authKey: subscriptionData.keys.auth
            }
        });

        return NextResponse.json({
            success: true,
            subscriptionId: pushSubscription.id
        });
    } catch (error) {
        console.error('Push subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to save push subscription' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Remove push subscription
        await prisma.pushSubscription.deleteMany({
            where: { userId: authResult.user!.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push unsubscription error:', error);
        return NextResponse.json(
            { error: 'Failed to remove push subscription' },
            { status: 500 }
        );
    }
}