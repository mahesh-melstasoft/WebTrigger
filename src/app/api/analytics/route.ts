import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
        const userId = authResult.user!.id;

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default: // 7d
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get user's callbacks
        const callbacks = await prisma.callback.findMany({
            where: { userId },
            select: { id: true, name: true },
        });

        // 1. Triggers over time (daily aggregation)
        const triggersOverTime = await prisma.$queryRaw`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count
            FROM "Log"
            WHERE callback_id IN (
                SELECT id FROM "Callback" WHERE user_id = ${userId}
            )
            AND created_at >= ${startDate}
            AND event LIKE '%triggered%'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        `;

        // 2. Triggers by callback
        const triggersByCallback = await prisma.log.groupBy({
            by: ['callbackId'],
            where: {
                callback: { userId },
                createdAt: { gte: startDate },
                event: { contains: 'triggered' },
            },
            _count: { id: true },
        });

        // Get callback names for the above query
        const callbackMap = new Map(callbacks.map(cb => [cb.id, cb.name]));
        const triggersByCallbackWithNames = triggersByCallback.map(item => ({
            name: callbackMap.get(item.callbackId) || 'Unknown',
            count: item._count.id,
        }));

        // 3. Success/Failure rates
        const successFailureData = await prisma.$queryRaw`
            SELECT
                CASE
                    WHEN event LIKE '%triggered%' THEN 'Success'
                    WHEN event LIKE '%failed%' THEN 'Failure'
                    ELSE 'Other'
                END as status,
                COUNT(*) as count
            FROM "Log"
            WHERE callback_id IN (
                SELECT id FROM "Callback" WHERE user_id = ${userId}
            )
            AND created_at >= ${startDate}
            GROUP BY
                CASE
                    WHEN event LIKE '%triggered%' THEN 'Success'
                    WHEN event LIKE '%failed%' THEN 'Failure'
                    ELSE 'Other'
                END
        `;

        // 4. Average response times (if we had duration data in logs)
        // For now, we'll show timeout distribution
        const timeoutDistribution = await prisma.callback.groupBy({
            by: ['timeoutDuration'],
            where: { userId },
            _count: { id: true },
        });

        // 5. Most active hours
        const hourlyActivity = await prisma.$queryRaw`
            SELECT
                EXTRACT(hour from created_at) as hour,
                COUNT(*) as count
            FROM "Log"
            WHERE callback_id IN (
                SELECT id FROM "Callback" WHERE user_id = ${userId}
            )
            AND created_at >= ${startDate}
            GROUP BY EXTRACT(hour from created_at)
            ORDER BY EXTRACT(hour from created_at)
        `;

        // 6. Recent activity (last 24 hours)
        const recentActivity = await prisma.log.findMany({
            where: {
                callback: { userId },
                createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
            },
            include: {
                callback: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            triggersOverTime,
            triggersByCallback: triggersByCallbackWithNames,
            successFailureData,
            timeoutDistribution: timeoutDistribution.map(item => ({
                timeout: item.timeoutDuration,
                count: item._count.id,
            })),
            hourlyActivity,
            recentActivity: recentActivity.map(log => ({
                id: log.id,
                event: log.event,
                callbackName: log.callback.name,
                createdAt: log.createdAt,
            })),
            period,
            totalCallbacks: callbacks.length,
        });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
