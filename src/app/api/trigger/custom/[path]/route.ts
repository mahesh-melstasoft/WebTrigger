import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string }> }
) {
    try {
        const { path } = await params;

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        const callback = await prisma.callback.findUnique({
            where: { customPath: path },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        slackWebhookUrl: true,
                    },
                },
            },
        });

        if (!callback) {
            return NextResponse.json({ error: 'Custom trigger path not found' }, { status: 404 });
        }

        if (!callback.activeStatus) {
            return NextResponse.json({ error: 'Callback is inactive' }, { status: 403 });
        }

        // Execute the callback: call the callbackUrl
        try {
            const startTime = Date.now();
            const response = await axios.get(callback.callbackUrl);
            const responseTime = Date.now() - startTime;

            // Get client information
            const clientIP = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
            const userAgent = request.headers.get('user-agent') || 'unknown';
            const referer = request.headers.get('referer') || 'unknown';

            await prisma.log.create({
                data: {
                    event: 'Custom path callback triggered',
                    details: `Custom path: ${path} | Called ${callback.callbackUrl}, status: ${response.status} | IP: ${clientIP} | User-Agent: ${userAgent} | Referer: ${referer}`,
                    callbackId: callback.id,
                    responseTime,
                    statusCode: response.status,
                    success: true,
                },
            });

            // Send notifications using the orchestrator (includes push notifications if enabled)
            try {
                const { getNotificationOrchestrator } = await import('@/lib/notificationService');
                await getNotificationOrchestrator().sendNotifications(callback.userId, {
                    callbackName: callback.name,
                    callbackUrl: callback.callbackUrl,
                    success: true,
                    statusCode: response.status,
                    responseTime,
                    triggeredAt: new Date(),
                    userEmail: callback.user?.email || ''
                });
            } catch (notifyErr) {
                console.warn('Failed to send notifications (success):', notifyErr);
            }

            return NextResponse.json({
                message: 'Callback executed successfully via custom path',
                customPath: path,
                data: response.data
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Get client information for error logging
            const clientIP = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
            const userAgent = request.headers.get('user-agent') || 'unknown';

            await prisma.log.create({
                data: {
                    event: 'Custom path callback failed',
                    details: `Custom path: ${path} | Failed to call ${callback.callbackUrl}: ${errorMessage} | IP: ${clientIP} | User-Agent: ${userAgent}`,
                    callbackId: callback.id,
                    success: false,
                },
            });

            // Send notifications using the orchestrator (includes push notifications if enabled)
            try {
                const { getNotificationOrchestrator } = await import('@/lib/notificationService');
                await getNotificationOrchestrator().sendNotifications(callback.userId, {
                    callbackName: callback.name,
                    callbackUrl: callback.callbackUrl,
                    success: false,
                    error: errorMessage,
                    triggeredAt: new Date(),
                    userEmail: callback.user?.email || ''
                });
            } catch (notifyErr) {
                console.warn('Failed to send notifications (failure):', notifyErr);
            }

            return NextResponse.json({
                error: 'Failed to execute callback via custom path',
                customPath: path
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error with custom path trigger:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
