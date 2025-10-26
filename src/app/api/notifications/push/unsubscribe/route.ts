import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const auth = request.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Authenticate using shared auth middleware
        const authResult = await (await import('@/lib/auth')).authMiddleware(request);
        if (!authResult.success || !authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = { id: authResult.user.id } as { id: string };

        // Optionally accept endpoint in body to remove specific subscription
        const body = await request.json().catch(() => ({}));
        const endpoint = body?.endpoint;

        // Delete subscription(s) for user
        if (endpoint) {
            await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint } });
        } else {
            await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
