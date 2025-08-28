import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { SlackService } from '@/lib/slack';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const callback = await prisma.callback.findUnique({
            where: { id },
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
            return NextResponse.json({ error: 'Callback not found' }, { status: 404 });
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
                    event: 'Callback triggered',
                    details: `Called ${callback.callbackUrl}, status: ${response.status} | IP: ${clientIP} | User-Agent: ${userAgent} | Referer: ${referer}`,
                    callbackId: callback.id,
                    responseTime,
                    statusCode: response.status,
                    success: true,
                },
            });

            // Send Slack notification if webhook URL is configured
            if (callback.user.slackWebhookUrl) {
                try {
                    // Get today's statistics for the user
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const [todayStats, totalSuccess] = await Promise.all([
                        prisma.log.count({
                            where: {
                                callback: { userId: callback.userId },
                                createdAt: { gte: today, lt: tomorrow },
                            },
                        }),
                        prisma.log.count({
                            where: {
                                callback: { userId: callback.userId },
                                success: true,
                                createdAt: { gte: today, lt: tomorrow },
                            },
                        }),
                    ]);

                    const successRate = todayStats > 0 ? (totalSuccess / todayStats) * 100 : 100;

                    // Get average response time for today
                    const avgResponseTimeResult = await prisma.log.aggregate({
                        where: {
                            callback: { userId: callback.userId },
                            createdAt: { gte: today, lt: tomorrow },
                            responseTime: { not: null },
                        },
                        _avg: { responseTime: true },
                    });

                    const avgResponseTime = avgResponseTimeResult._avg.responseTime || 0;

                    await SlackService.sendWebhookNotification(callback.user.slackWebhookUrl, {
                        callbackId: callback.id,
                        callbackName: callback.name,
                        callbackUrl: callback.callbackUrl,
                        event: 'Callback triggered',
                        details: `Called ${callback.callbackUrl}, status: ${response.status} | IP: ${clientIP} | User-Agent: ${userAgent} | Referer: ${referer}`,
                        statusCode: response.status,
                        responseTime,
                        success: true,
                        triggeredAt: new Date(),
                        userId: callback.userId,
                        userEmail: callback.user.email,
                    }, {
                        totalTriggersToday: todayStats,
                        successRate,
                        avgResponseTime,
                    });
                } catch (slackError) {
                    console.error('Failed to send Slack notification:', slackError);
                    // Don't fail the webhook execution if Slack fails
                }
            }

            return NextResponse.json({ message: 'Callback executed successfully', data: response.data });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Get client information for error logging
            const clientIP = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
            const userAgent = request.headers.get('user-agent') || 'unknown';

            await prisma.log.create({
                data: {
                    event: 'Callback failed',
                    details: `Failed to call ${callback.callbackUrl}: ${errorMessage} | IP: ${clientIP} | User-Agent: ${userAgent}`,
                    callbackId: callback.id,
                    success: false,
                },
            });

            // Send Slack notification for failed webhook if webhook URL is configured
            if (callback.user.slackWebhookUrl) {
                try {
                    // Get today's statistics for the user
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const [todayStats, totalSuccess] = await Promise.all([
                        prisma.log.count({
                            where: {
                                callback: { userId: callback.userId },
                                createdAt: { gte: today, lt: tomorrow },
                            },
                        }),
                        prisma.log.count({
                            where: {
                                callback: { userId: callback.userId },
                                success: true,
                                createdAt: { gte: today, lt: tomorrow },
                            },
                        }),
                    ]);

                    const successRate = todayStats > 0 ? (totalSuccess / todayStats) * 100 : 100;

                    // Get average response time for today
                    const avgResponseTimeResult = await prisma.log.aggregate({
                        where: {
                            callback: { userId: callback.userId },
                            createdAt: { gte: today, lt: tomorrow },
                            responseTime: { not: null },
                        },
                        _avg: { responseTime: true },
                    });

                    const avgResponseTime = avgResponseTimeResult._avg.responseTime || 0;

                    await SlackService.sendWebhookNotification(callback.user.slackWebhookUrl, {
                        callbackId: callback.id,
                        callbackName: callback.name,
                        callbackUrl: callback.callbackUrl,
                        event: 'Callback failed',
                        details: `Failed to call ${callback.callbackUrl}: ${errorMessage} | IP: ${clientIP} | User-Agent: ${userAgent}`,
                        success: false,
                        triggeredAt: new Date(),
                        userId: callback.userId,
                        userEmail: callback.user.email,
                    }, {
                        totalTriggersToday: todayStats,
                        successRate,
                        avgResponseTime,
                    });
                } catch (slackError) {
                    console.error('Failed to send Slack notification:', slackError);
                    // Don't fail the webhook execution if Slack fails
                }
            }

            return NextResponse.json({ error: 'Failed to execute callback' }, { status: 500 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
