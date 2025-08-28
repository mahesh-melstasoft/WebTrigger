import { NextRequest } from 'next/server';

export interface ApiKeyAuthResult {
    success: boolean;
    userId?: string;
    permissions?: string[];
    apiKey?: string;
}

export async function apiKeyAuthMiddleware(request: NextRequest): Promise<ApiKeyAuthResult> {
    try {
        // Get API key from header
        const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

        if (!apiKey) {
            return { success: false };
        }

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        // Find the API key
        const keyRecord = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { user: true },
        });

        if (!keyRecord) {
            return { success: false };
        }

        // Check if key is expired
        if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
            return { success: false };
        }

        // Update last used timestamp
        await prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() },
        });

        return {
            success: true,
            userId: keyRecord.userId,
            permissions: keyRecord.permissions,
            apiKey: keyRecord.key,
        };
    } catch (error) {
        console.error('API key authentication error:', error);
        return { success: false };
    }
}

export function hasPermission(requiredPermissions: string[], userPermissions: string[]): boolean {
    // Admin has all permissions
    if (userPermissions.includes('admin')) {
        return true;
    }

    // Check if user has all required permissions
    return requiredPermissions.every(permission => userPermissions.includes(permission));
}
