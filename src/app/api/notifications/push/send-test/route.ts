import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPush } from '@/lib/webpush';

export async function POST(request: Request) {
    try {
        // Authenticate using shared auth middleware
        const authResult = await (await import('@/lib/auth')).authMiddleware(request);
        if (!authResult.success || !authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = { id: authResult.user.id } as { id: string };

        const subscription = await prisma.pushSubscription.findFirst({ where: { userId: user.id } });
        if (!subscription) {
            return NextResponse.json({ error: 'No push subscription found for user' }, { status: 404 });
        }

        const payload = await request.json().catch(() => ({ title: 'Test', body: 'This is a test notification' }));

        try {
            await sendPush({ endpoint: subscription.endpoint, p256dhKey: subscription.p256dhKey, authKey: subscription.authKey }, payload);
            return NextResponse.json({ success: true });
        } catch (err) {
            console.error('Failed to send test push:', err);
            return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
        }
    } catch (error) {
        console.error('Send-test error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
