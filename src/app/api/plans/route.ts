import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Get all active subscription plans
        const plans = await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' },
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Plans fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch plans' },
            { status: 500 }
        );
    }
}
