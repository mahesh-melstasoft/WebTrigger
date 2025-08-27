import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId, successUrl, cancelUrl } = await request.json();

        // Validate input
        if (!planId || !successUrl || !cancelUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: planId, successUrl, cancelUrl' },
                { status: 400 }
            );
        }

        // Get plan details
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan || !plan.isActive) {
            return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
        }

        // Get or create Stripe customer
        let customer;
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: authResult.user!.id },
        });

        if (existingSubscription?.stripeCustomerId) {
            customer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
        } else {
            customer = await stripe.customers.create({
                email: authResult.user!.email,
                metadata: {
                    userId: authResult.user!.id,
                },
            });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: plan.currency.toLowerCase(),
                        product_data: {
                            name: plan.name,
                            description: plan.description || `${plan.maxTriggers} triggers per ${plan.interval}`,
                        },
                        unit_amount: Math.round(plan.price * 100), // Convert to cents
                        recurring: {
                            interval: plan.interval as 'month' | 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                userId: authResult.user!.id,
                planId: plan.id,
            },
        });

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('Payment session creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment session' },
            { status: 500 }
        );
    }
}
