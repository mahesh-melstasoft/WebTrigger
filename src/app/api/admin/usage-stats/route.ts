import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success || auth.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total requests
        const totalRequests = await prisma.rateLimitLog.aggregate({
            _sum: {
                requestCount: true,
            },
        });

        // Get requests today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const requestsToday = await prisma.rateLimitLog.aggregate({
            _sum: {
                requestCount: true,
            },
            where: {
                period: 'day',
                periodStart: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        // Get requests this month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const requestsThisMonth = await prisma.rateLimitLog.aggregate({
            _sum: {
                requestCount: true,
            },
            where: {
                period: 'month',
                periodStart: {
                    gte: firstDayOfMonth,
                    lt: firstDayOfNextMonth,
                },
            },
        });

        // Get average response time and success rate
        const logsWithResponse = await prisma.log.findMany({
            where: {
                responseTime: {
                    not: null,
                },
            },
            select: {
                responseTime: true,
                success: true,
            },
        });

        const averageResponseTime = logsWithResponse.length > 0
            ? Math.round(logsWithResponse.reduce((sum: number, log: { responseTime: number | null; success: boolean }) => sum + (log.responseTime || 0), 0) / logsWithResponse.length)
            : 0;

        const successCount = logsWithResponse.filter((log: { responseTime: number | null; success: boolean }) => log.success).length;
        const successRate = logsWithResponse.length > 0
            ? Math.round((successCount / logsWithResponse.length) * 100)
            : 100;

        // Get top callbacks
        const topCallbacks = await prisma.rateLimitLog.groupBy({
            by: ['callbackId'],
            _sum: {
                requestCount: true,
            },
            orderBy: {
                _sum: {
                    requestCount: 'desc',
                },
            },
            take: 10,
        });

        // Get callback details
        const callbackDetails = await Promise.all(
            topCallbacks.map(async (item: { callbackId: string; _sum: { requestCount: number | null } }) => {
                const callback = await prisma.callback.findUnique({
                    where: { id: item.callbackId },
                    select: { id: true, name: true },
                });
                return {
                    id: item.callbackId,
                    name: callback?.name || 'Unknown',
                    requestCount: item._sum.requestCount || 0,
                };
            })
        );

        const usageStats = {
            totalRequests: totalRequests._sum.requestCount || 0,
            requestsToday: requestsToday._sum.requestCount || 0,
            requestsThisMonth: requestsThisMonth._sum.requestCount || 0,
            averageResponseTime,
            successRate,
            topCallbacks: callbackDetails,
        };

        return NextResponse.json(usageStats);
    } catch (error) {
        console.error('Error fetching usage stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
