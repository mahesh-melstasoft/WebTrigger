import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: apiKeyId } = await params;
        const body = await request.json();
        const { name, permissions, expiresAt } = body;

        if (!name || !permissions || !Array.isArray(permissions)) {
            return NextResponse.json(
                { error: 'Name and permissions are required' },
                { status: 400 }
            );
        }

        // Validate permissions
        const validPermissions = ['read', 'write', 'admin'];
        const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
        if (invalidPermissions.length > 0) {
            return NextResponse.json(
                { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
                { status: 400 }
            );
        }

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Update the API key
        const updatedApiKey = await prisma.apiKey.update({
            where: {
                id: apiKeyId,
                userId: authResult.user!.id, // Ensure user can only update their own keys
            },
            data: {
                name,
                permissions,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
            select: {
                id: true,
                name: true,
                permissions: true,
                expiresAt: true,
                lastUsedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedApiKey);
    } catch (error) {
        console.error('API key update error:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }
        return NextResponse.json(
            { error: 'Failed to update API key' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: apiKeyId } = await params;

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Delete the API key
        await prisma.apiKey.delete({
            where: {
                id: apiKeyId,
                userId: authResult.user!.id, // Ensure user can only delete their own keys
            },
        });

        return NextResponse.json({ message: 'API key deleted successfully' });
    } catch (error) {
        console.error('API key deletion error:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }
        return NextResponse.json(
            { error: 'Failed to delete API key' },
            { status: 500 }
        );
    }
}
