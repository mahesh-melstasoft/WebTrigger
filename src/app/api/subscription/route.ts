import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Get user's subscription with plan details
        const subscription = await prisma.subscription.findUnique({
            where: { userId: authResult.user!.id },
            include: {
                plan: true,
            },
        });

        if (!subscription) {
            return NextResponse.json(null);
        }

        // Add caching headers (60 seconds by default for subscription data)
        const cacheSeconds = parseInt(process.env.SUBSCRIPTION_CACHE_SECONDS || '60');

        return NextResponse.json(subscription, {
            headers: {
                'Cache-Control': `private, max-age=${cacheSeconds}`,
                'Vary': 'Authorization'
            }
        });
    } catch (error) {
        console.error('Subscription fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscription' },
            { status: 500 }
        );
    }
}
