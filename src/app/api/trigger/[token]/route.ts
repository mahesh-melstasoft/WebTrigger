import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const callback = await prisma.callback.findUnique({
            where: { triggerToken: params.token },
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
        } catch (error: any) {
            await prisma.log.create({
                data: {
                    event: 'Callback failed',
                    details: `Failed to call ${callback.callbackUrl}: ${error.message}`,
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
