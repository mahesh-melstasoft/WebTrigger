import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authMiddleware } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
    try {
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { newPlanId } = await request.json();

        if (!newPlanId) {
            return NextResponse.json({ error: 'Missing newPlanId' }, { status: 400 });
        }

        const { prisma } = await import('@/lib/prisma');

        const currentSubscription = await prisma.subscription.findUnique({
            where: { userId: authResult.user!.id },
            include: { plan: true }
        });

        if (!currentSubscription) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }

        const newPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: newPlanId }
        });

        if (!newPlan || !newPlan.isActive) {
            return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
        }

        if (!currentSubscription.stripeSubscriptionId) {
            return NextResponse.json({ error: 'No Stripe subscription found' }, { status: 400 });
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);

        const updatedSubscription = await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
            items: [{
                id: stripeSubscription.items.data[0].id,
                price_data: {
                    currency: newPlan.currency.toLowerCase(),
                    product: newPlan.name,
                    unit_amount: Math.round(newPlan.price * 100),
                    recurring: {
                        interval: newPlan.interval as 'month' | 'year',
                    },
                },
            }],
            proration_behavior: 'create_prorations',
        });

        await prisma.subscription.update({
            where: { id: currentSubscription.id },
            data: { planId: newPlanId }
        });

        const newUserRole = newPlan.name.toLowerCase().includes('admin') ? 'ADMIN' :
            newPlan.name.toLowerCase().includes('pro') ? 'PRO' :
            newPlan.name.toLowerCase().includes('starter') ? 'PREMIUM' : 'FREE';

        await prisma.user.update({
            where: { id: authResult.user!.id },
            data: { role: newUserRole as 'ADMIN' | 'PRO' | 'PREMIUM' | 'FREE' }
        });

        return NextResponse.json({
            success: true,
            message: `Successfully upgraded to ${newPlan.name}`,
            subscription: updatedSubscription
        });
    } catch (error) {
        console.error('Subscription upgrade error:', error);
        return NextResponse.json({ error: 'Failed to upgrade subscription' }, { status: 500 });
    }
}
