import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success || auth.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimits = await prisma.rateLimit.findMany({
            include: {
                plan: {
                    select: {
                        name: true,
                        price: true,
                    },
                },
            },
            orderBy: {
                plan: {
                    price: 'asc',
                },
            },
        });

        return NextResponse.json(rateLimits);
    } catch (error) {
        console.error('Error fetching rate limits:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
