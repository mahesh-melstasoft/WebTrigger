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

        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: authResult.user!.id },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                secret: true,
                slackWebhookUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get subscription data
        const subscription = await prisma.subscription.findFirst({
            where: { userId: authResult.user!.id },
            include: {
                plan: true,
            },
        });

        // Determine account type and trigger limit
        let accountType = 'free';
        let triggerLimit = 5;

        if (subscription) {
            accountType = subscription.plan.name.toLowerCase();
            triggerLimit = subscription.plan.maxTriggers;
        } else if (user.role === 'ADMIN') {
            accountType = 'admin';
            triggerLimit = -1;
        } else if (user.role === 'PRO') {
            accountType = 'pro';
            triggerLimit = 500;
        } else if (user.role === 'PREMIUM') {
            accountType = 'starter';
            triggerLimit = 50;
        }

        // Return settings data
        const settings = {
            id: user.id,
            email: user.email,
            displayName: user.displayName || '',
            accountType,
            appName: 'WebTrigger', // Default app name
            appDescription: 'Smart webhook management made simple', // Default description
            colorPalette: 'default',
            triggerLimit,
            secret: user.secret,
            slackWebhookUrl: user.slackWebhookUrl || '',
            createdAt: user.createdAt.toISOString(),
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
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

        const { displayName, appName, appDescription, colorPalette, slackWebhookUrl } = await request.json();

        // Update user data
        const updatedUser = await prisma.user.update({
            where: { id: authResult.user!.id },
            data: {
                displayName: displayName || null,
                slackWebhookUrl: slackWebhookUrl || null,
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                secret: true,
                slackWebhookUrl: true,
                createdAt: true,
            },
        });

        // Get subscription data
        const subscription = await prisma.subscription.findFirst({
            where: { userId: authResult.user!.id },
            include: {
                plan: true,
            },
        });

        // Determine account type and trigger limit
        let accountType = 'free';
        let triggerLimit = 5;

        if (subscription) {
            accountType = subscription.plan.name.toLowerCase();
            triggerLimit = subscription.plan.maxTriggers;
        } else if (updatedUser.role === 'ADMIN') {
            accountType = 'admin';
            triggerLimit = -1;
        } else if (updatedUser.role === 'PRO') {
            accountType = 'pro';
            triggerLimit = 500;
        } else if (updatedUser.role === 'PREMIUM') {
            accountType = 'starter';
            triggerLimit = 50;
        }

        // Return updated settings
        const settings = {
            id: updatedUser.id,
            email: updatedUser.email,
            displayName: updatedUser.displayName || '',
            accountType,
            appName: appName || 'WebTrigger',
            appDescription: appDescription || 'Smart webhook management made simple',
            colorPalette: colorPalette || 'default',
            triggerLimit,
            secret: updatedUser.secret,
            slackWebhookUrl: updatedUser.slackWebhookUrl || '',
            createdAt: updatedUser.createdAt.toISOString(),
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
