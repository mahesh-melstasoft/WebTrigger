import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authMiddleware(request);
        if (!authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const trigger = await prisma.callback.findUnique({
            where: {
                id: id,
                userId: authResult.user.id,
            },
        });

        if (!trigger) {
            return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
        }

        return NextResponse.json(trigger);
    } catch (error) {
        console.error('Error fetching trigger:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authMiddleware(request);
        if (!authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const trigger = await prisma.callback.update({
            where: {
                id: id,
                userId: authResult.user.id,
            },
            data: body,
        });

        return NextResponse.json(trigger);
    } catch (error) {
        console.error('Error updating trigger:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authMiddleware(request);
        if (!authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.callback.delete({
            where: {
                id: id,
                userId: authResult.user.id,
            },
        });

        return NextResponse.json({ message: 'Trigger deleted successfully' });
    } catch (error) {
        console.error('Error deleting trigger:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
