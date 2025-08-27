import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const callbackId = searchParams.get('callbackId');

        const logs = await prisma.log.findMany({
            where: {
                callback: {
                    userId,
                    ...(callbackId && { id: callbackId }),
                },
            },
            include: {
                callback: {
                    select: { name: true, id: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
