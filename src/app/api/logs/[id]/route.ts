import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: logId } = await params;

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Get log with callback details
        const log = await prisma.log.findUnique({
            where: {
                id: logId,
                callback: {
                    userId: authResult.user!.id, // Ensure user can only access their own logs
                },
            },
            select: {
                id: true,
                event: true,
                details: true,
                createdAt: true,
                responseTime: true,
                statusCode: true,
                callback: {
                    select: {
                        id: true,
                        name: true,
                        callbackUrl: true,
                        timeoutDuration: true,
                        activeStatus: true,
                    },
                },
            },
        });

        if (!log) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        return NextResponse.json(log);
    } catch (error) {
        console.error('Log details fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch log details' },
            { status: 500 }
        );
    }
}
