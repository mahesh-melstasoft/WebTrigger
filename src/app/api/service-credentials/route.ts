import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { prisma } = await import('@/lib/prisma');
        const creds = await prisma.serviceCredential.findMany({ where: { userId: auth.user!.id } });
        // Mask secret before returning
        const masked = creds.map((c: { id: string; name: string; provider: string; meta: unknown; createdAt: Date }) => ({ 
            id: c.id, 
            name: c.name, 
            provider: c.provider, 
            meta: c.meta, 
            createdAt: c.createdAt 
        }));
        return NextResponse.json(masked);
    } catch (error) {
        console.error('Service credentials list error:', error);
        return NextResponse.json({ error: 'Failed to list credentials' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name, provider, secret, meta } = body;
        if (!name || !provider || !secret) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const { prisma } = await import('@/lib/prisma');
        const { encryptSecret, isEncryptionConfigured } = await import('@/lib/cryptoHelper');
        if (!isEncryptionConfigured()) return NextResponse.json({ error: 'Server encryption not configured' }, { status: 500 });

        const encrypted = encryptSecret(secret);
        const created = await prisma.serviceCredential.create({ data: { userId: auth.user!.id, name, provider, secret: encrypted, meta } });
        return NextResponse.json({ id: created.id, name: created.name, provider: created.provider, createdAt: created.createdAt }, { status: 201 });
    } catch (error) {
        console.error('Service credential create error:', error);
        return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await authMiddleware(request);
        if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const { prisma } = await import('@/lib/prisma');
        await prisma.serviceCredential.deleteMany({ where: { id, userId: auth.user!.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Service credential delete error:', error);
        return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
    }
}
