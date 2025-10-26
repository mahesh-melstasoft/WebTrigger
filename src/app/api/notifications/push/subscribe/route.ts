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

        const body = await request.json();
        const { endpoint, keys } = body || {};
        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
        }

        // Upsert subscription for user
        await prisma.pushSubscription.upsert({
            where: { userId: user.id },
            update: {
                endpoint,
                p256dhKey: keys.p256dh,
                authKey: keys.auth,
            },
            create: {
                userId: user.id,
                endpoint,
                p256dhKey: keys.p256dh,
                authKey: keys.auth,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
