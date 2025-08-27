import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const callback = await prisma.callback.findUnique({
            where: { id },
        });

        if (!callback) {
            return NextResponse.json({ error: 'Callback not found' }, { status: 404 });
        }

        if (!callback.activeStatus) {
            return NextResponse.json({ error: 'Callback is inactive' }, { status: 403 });
        }

        // Execute the callback: call the callbackUrl
        try {
            const response = await axios.get(callback.callbackUrl);
            await prisma.log.create({
                data: {
                    event: 'Callback triggered',
                    details: `Called ${callback.callbackUrl}, status: ${response.status}`,
                    callbackId: callback.id,
                },
            });
            return NextResponse.json({ message: 'Callback executed successfully', data: response.data });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await prisma.log.create({
                data: {
                    event: 'Callback failed',
                    details: `Failed to call ${callback.callbackUrl}: ${errorMessage}`,
                    callbackId: callback.id,
                },
            });
            return NextResponse.json({ error: 'Failed to execute callback' }, { status: 500 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
