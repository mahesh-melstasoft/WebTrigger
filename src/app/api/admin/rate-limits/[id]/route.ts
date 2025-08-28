import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success || auth.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { requestsPerSecond, requestsPerMinute, requestsPerHour, requestsPerMonth, isActive } = body;

        const updatedLimit = await prisma.rateLimit.update({
            where: { id },
            data: {
                ...(requestsPerSecond !== undefined && { requestsPerSecond }),
                ...(requestsPerMinute !== undefined && { requestsPerMinute }),
                ...(requestsPerHour !== undefined && { requestsPerHour }),
                ...(requestsPerMonth !== undefined && { requestsPerMonth }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                plan: {
                    select: {
                        name: true,
                        price: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedLimit);
    } catch (error) {
        console.error('Error updating rate limit:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
