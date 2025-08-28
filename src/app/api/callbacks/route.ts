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

        // Add caching headers (45 seconds by default for callbacks data)
        const cacheSeconds = parseInt(process.env.CALLBACKS_CACHE_SECONDS || '45');

        return NextResponse.json(callbacks, {
            headers: {
                'Cache-Control': `private, max-age=${cacheSeconds}`,
                'Vary': 'Authorization'
            }
        });
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

        const { name, callbackUrl, activeStatus, customPath } = await request.json();

        if (!name || !callbackUrl) {
            return NextResponse.json({ error: 'Name and callbackUrl are required' }, { status: 400 });
        }

        // Validate custom path if provided
        if (customPath) {
            // Check if custom path is valid (alphanumeric, hyphens, underscores only)
            if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
                return NextResponse.json({
                    error: 'Custom path can only contain letters, numbers, hyphens, and underscores'
                }, { status: 400 });
            }

            // Check if custom path is already taken
            const existingCallback = await prisma.callback.findUnique({
                where: { customPath }
            });

            if (existingCallback) {
                return NextResponse.json({
                    error: 'Custom path is already taken. Please choose a different path.'
                }, { status: 409 });
            }
        }

        const callback = await prisma.callback.create({
            data: {
                name,
                callbackUrl,
                activeStatus: activeStatus ?? true,
                customPath: customPath || null,
                userId,
            },
        });

        return NextResponse.json(callback, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
