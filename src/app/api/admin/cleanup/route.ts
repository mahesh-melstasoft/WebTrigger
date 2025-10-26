import { NextRequest, NextResponse } from 'next/server';
import { getNotificationOrchestrator } from '@/lib/notificationService';
import { authMiddleware } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        if (authResult.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Run cleanup
        const orchestrator = getNotificationOrchestrator();
        const result = await orchestrator.cleanupStaleSubscriptions();

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${result.deleted} stale push subscriptions`,
            deleted: result.deleted
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json(
            { error: 'Failed to cleanup subscriptions' },
            { status: 500 }
        );
    }
}