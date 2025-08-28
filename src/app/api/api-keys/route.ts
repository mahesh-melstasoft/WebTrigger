import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Get all API keys for the user
        const apiKeys = await prisma.apiKey.findMany({
            where: {
                userId: authResult.user!.id,
            },
            select: {
                id: true,
                name: true,
                permissions: true,
                expiresAt: true,
                lastUsedAt: true,
                createdAt: true,
                updatedAt: true,
                // Don't return the actual key for security
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(apiKeys);
    } catch (error) {
        console.error('API keys fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch API keys' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        // Generate a secure API key
        const apiKey = `wbk_${crypto.randomBytes(32).toString('hex')}`;

        // Create the API key
        const newApiKey = await prisma.apiKey.create({
            data: {
                name,
                key: apiKey,
                userId: authResult.user!.id,
                permissions,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
            select: {
                id: true,
                name: true,
                permissions: true,
                expiresAt: true,
                createdAt: true,
                // Return the key only on creation
                key: true,
            },
        });

        return NextResponse.json(newApiKey, { status: 201 });
    } catch (error) {
        console.error('API key creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create API key' },
            { status: 500 }
        );
    }
}
