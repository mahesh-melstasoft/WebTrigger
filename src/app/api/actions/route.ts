import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(request.url);
        const callbackId = url.searchParams.get('callbackId');

        const where = callbackId ? { callbackId, userId: auth.user!.id } : { userId: auth.user!.id };

        const actions = await prisma.action.findMany({
            where,
            include: { executions: { orderBy: { createdAt: 'desc' }, take: 5 } },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(actions);
    } catch (error) {
        console.error('Actions list error:', error);
        return NextResponse.json({ error: 'Failed to list actions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { callbackId, type, config, enabled, order, parallel, serviceCredentialId } = body;

        if (!callbackId || !type) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        // Validate action type
        const validTypes = ['HTTP_POST', 'SLACK', 'EMAIL', 'STORE'];
        if (!validTypes.includes(type)) return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });

        // Verify callback ownership
        const callback = await prisma.callback.findFirst({
            where: { id: callbackId, userId: auth.user!.id },
        });
        if (!callback) return NextResponse.json({ error: 'Callback not found' }, { status: 404 });

        // Verify service credential ownership if provided
        let serviceCredential = null;
        if (serviceCredentialId) {
            serviceCredential = await prisma.serviceCredential.findFirst({
                where: { id: serviceCredentialId, userId: auth.user!.id },
            });
            if (!serviceCredential) return NextResponse.json({ error: 'Service credential not found' }, { status: 404 });
        }

        const action = await prisma.action.create({
            data: {
                callbackId,
                userId: auth.user!.id,
                type,
                config: config || {},
                enabled: enabled ?? true,
                order: order ?? 0,
                parallel: parallel ?? false,
            },
        });

        return NextResponse.json(action, { status: 201 });
    } catch (error) {
        console.error('Action create error:', error);
        return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'Missing action id' }, { status: 400 });

        // Verify action ownership
        const existingAction = await prisma.action.findFirst({
            where: { id, userId: auth.user!.id },
        });
        if (!existingAction) return NextResponse.json({ error: 'Action not found' }, { status: 404 });

        const action = await prisma.action.update({
            where: { id },
            data: updates,
        });

        return NextResponse.json(action);
    } catch (error) {
        console.error('Action update error:', error);
        return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing action id' }, { status: 400 });

        // Verify action ownership and delete
        const deleted = await prisma.action.deleteMany({
            where: { id, userId: auth.user!.id },
        });

        if (deleted.count === 0) return NextResponse.json({ error: 'Action not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Action delete error:', error);
        return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
    }
}
