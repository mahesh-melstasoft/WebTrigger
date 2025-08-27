import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const callback = await prisma.callback.findFirst({
            where: { id: params.id, userId },
            include: { logs: { orderBy: { createdAt: 'desc' } } },
        });

        if (!callback) {
            return NextResponse.json({ error: 'Callback not found' }, { status: 404 });
        }

        return NextResponse.json(callback);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, callbackUrl, activeStatus } = await request.json();

        const callback = await prisma.callback.updateMany({
            where: { id: params.id, userId },
            data: {
                ...(name && { name }),
                ...(callbackUrl && { callbackUrl }),
                ...(activeStatus !== undefined && { activeStatus }),
            },
        });

        if (callback.count === 0) {
            return NextResponse.json({ error: 'Callback not found' }, { status: 404 });
        }

        const updatedCallback = await prisma.callback.findUnique({
            where: { id: params.id },
        });

        return NextResponse.json(updatedCallback);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getUserFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const callback = await prisma.callback.deleteMany({
            where: { id: params.id, userId },
        });

        if (callback.count === 0) {
            return NextResponse.json({ error: 'Callback not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Callback deleted' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
