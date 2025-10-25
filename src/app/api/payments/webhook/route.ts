import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (!sig) {
            return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        } catch (err: unknown) {
            console.error('Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
        console.error('Missing userId or planId in session metadata');
        return;
    }

    try {
        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Get plan details
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            console.error('Plan not found:', planId);
            return;
        }

        // Create or update subscription
        await prisma.subscription.upsert({
            where: { userId },
            update: {
                planId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            create: {
                planId,
                userId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        // Update user role based on plan
        const userRole = plan.name.toLowerCase().includes('admin') ? 'ADMIN' :
            plan.name.toLowerCase().includes('pro') ? 'PRO' :
                plan.name.toLowerCase().includes('starter') ? 'PREMIUM' : 'FREE';

        await prisma.user.update({
            where: { id: userId },
            data: { role: userRole as 'ADMIN' | 'PRO' | 'PREMIUM' | 'FREE' },
        });

        console.log(`Subscription created for user ${userId} with plan ${plan.name}`);
    } catch (error) {
        console.error('Error handling checkout completion:', error);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        const existingSubscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
        });

        if (!existingSubscription) {
            console.error('Subscription not found:', subscription.id);
            return;
        }

        const status = subscription.status === 'active' ? 'ACTIVE' :
            subscription.status === 'canceled' ? 'CANCELLED' :
                subscription.status === 'past_due' ? 'PAST_DUE' : 'INACTIVE';

        await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
                status: status as 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAST_DUE',
                // Note: Period dates will be updated by successful payment events
            },
        });

        console.log(`Subscription updated: ${subscription.id} - ${status}`);
    } catch (error) {
        console.error('Error handling subscription update:', error);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                status: 'CANCELLED',
            },
        });

        console.log(`Subscription cancelled: ${subscription.id}`);
    } catch (error) {
        console.error('Error handling subscription deletion:', error);
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);
    // Additional logic for successful payments can be added here
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice: ${invoice.id}`);
    // Additional logic for failed payments can be added here
}
