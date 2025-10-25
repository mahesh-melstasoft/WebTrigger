import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authMiddleware } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { returnUrl } = await request.json();

        // Validate input
        if (!returnUrl) {
            return NextResponse.json(
                { error: 'Missing required field: returnUrl' },
                { status: 400 }
            );
        }

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Get user's subscription
        const subscription = await prisma.subscription.findUnique({
            where: { userId: authResult.user!.id },
            include: { plan: true },
        });

        if (!subscription || !subscription.stripeCustomerId) {
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 404 }
            );
        }

        // Create customer portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: returnUrl,
        });

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('Customer portal session creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create customer portal session' },
            { status: 500 }
        );
    }
}
