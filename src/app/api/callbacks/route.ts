import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const callbacks = await prisma.callback.findMany({
            where: { userId },
            include: { logs: { orderBy: { createdAt: 'desc' }, take: 5 } },
        });

        return NextResponse.json(callbacks);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, callbackUrl, activeStatus } = await request.json();

        if (!name || !callbackUrl) {
            return NextResponse.json({ error: 'Name and callbackUrl are required' }, { status: 400 });
        }

        const callback = await prisma.callback.create({
            data: {
                name,
                callbackUrl,
                activeStatus: activeStatus ?? true,
                userId,
            },
        });

        return NextResponse.json(callback, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
