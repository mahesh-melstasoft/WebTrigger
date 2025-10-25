import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is ADMIN
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        if (authResult.user!.email !== adminEmail && authResult.user!.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '7d';
        const userId = searchParams.get('userId');

        const { prisma } = await import('@/lib/prisma');

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const totalUsers = await prisma.user.count().catch(() => 0);
        const activeUsers = await prisma.user.count({ where: { isActive: true } }).catch(() => 0);
        const totalCallbacks = await prisma.callback.count({ where: userId ? { userId } : undefined }).catch(() => 0);
        const activeCallbacks = await prisma.callback.count({ where: { activeStatus: true, ...(userId ? { userId } : {}) } }).catch(() => 0);

        const totalTriggers = await prisma.log.count({
            where: { createdAt: { gte: startDate }, event: { contains: 'triggered' }, ...(userId ? { callback: { userId } } : {}) }
        }).catch(() => 0);

        const successCount = await prisma.log.count({
            where: { createdAt: { gte: startDate }, success: true, ...(userId ? { callback: { userId } } : {}) }
        }).catch(() => 0);

        const failureCount = await prisma.log.count({
            where: { createdAt: { gte: startDate }, success: false, ...(userId ? { callback: { userId } } : {}) }
        }).catch(() => 0);

        const subscriptionStats = await prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
            ...(userId ? { where: { id: userId } } : {})
        }).catch(() => []);

        const httpMethodStats = await prisma.callback.groupBy({
            by: ['httpMethod'],
            _count: { id: true },
            ...(userId ? { where: { userId } } : {})
        }).catch(() => []);

        const actionTypeStats = await prisma.action.groupBy({
            by: ['type'],
            _count: { id: true },
            ...(userId ? { where: { userId } } : {})
        }).catch(() => []);

        const avgResponseTime = await prisma.log.aggregate({
            where: { createdAt: { gte: startDate }, responseTime: { not: null }, ...(userId ? { callback: { userId } } : {}) },
            _avg: { responseTime: true }
        }).catch(() => ({ _avg: { responseTime: 0 } }));

        return NextResponse.json({
            overview: {
                totalUsers,
                activeUsers,
                totalCallbacks,
                activeCallbacks,
                totalTriggers,
                successCount,
                failureCount,
                successRate: totalTriggers > 0 ? ((successCount / (successCount + failureCount)) * 100).toFixed(2) : 0,
                avgResponseTime: avgResponseTime._avg.responseTime || 0
            },
            subscriptionStats,
            httpMethodStats,
            actionTypeStats,
            period
        });
    } catch (error) {
        console.error('Admin analytics fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin analytics data' }, { status: 500 });
    }
}
