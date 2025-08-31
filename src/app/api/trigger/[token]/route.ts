import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { SlackService } from '@/lib/slack';
import { executeAction, ActionPayload } from '@/lib/actionExecutor';

// Helper function to execute actions for a callback
async function executeActionsForCallback(callbackId: string, payload: ActionPayload, prisma: typeof import('@/lib/prisma').prisma) {
    try {
        const actions = await prisma.action.findMany({
            where: { callbackId, enabled: true },
            orderBy: { order: 'asc' },
        }); const results = [];
        for (const action of actions) {
            try {
                // Get service credential if referenced
                let serviceCredential = null;
                if (action.config && typeof action.config === 'object' && 'serviceCredentialId' in action.config) {
                    const config = action.config as { serviceCredentialId?: string };
                    if (config.serviceCredentialId) {
                        serviceCredential = await prisma.serviceCredential.findFirst({
                            where: { id: config.serviceCredentialId },
                        });
                    }
                }                // Type guard for action config
                const actionConfig = action.config && typeof action.config === 'object' && !Array.isArray(action.config)
                    ? action.config as Record<string, unknown>
                    : undefined;

                // Type guard for serviceCredential
                const credential = serviceCredential && typeof serviceCredential.meta === 'object' && serviceCredential.meta !== null
                    ? { ...serviceCredential, meta: serviceCredential.meta as Record<string, unknown> }
                    : serviceCredential ? { ...serviceCredential, meta: undefined } : undefined;

                const result = await executeAction({ ...action, config: actionConfig }, payload, credential);

                // Store execution result
                await prisma.actionExecution.create({
                    data: {
                        actionId: action.id,
                        callbackId,
                        status: result.success ? 'SUCCESS' : 'FAILED',
                        response: result.responseBody ? { body: result.responseBody, status: result.status } : undefined,
                        error: result.error,
                        durationMs: result.durationMs,
                    },
                });

                results.push({ actionId: action.id, type: action.type, success: result.success, durationMs: result.durationMs });
            } catch (error) {
                console.error(`Action ${action.id} failed:`, error);
                await prisma.actionExecution.create({
                    data: {
                        actionId: action.id,
                        callbackId,
                        status: 'FAILED',
                        error: error instanceof Error ? error.message : String(error),
                        durationMs: 0,
                    },
                });
                results.push({ actionId: action.id, type: action.type, success: false, error: error instanceof Error ? error.message : String(error) });
            }
        }

        return results;
    } catch (error) {
        console.error('Failed to execute actions:', error);
        return [];
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // Dynamic import to avoid build-time initialization
        const { prisma } = await import('@/lib/prisma');

        const callback = await prisma.callback.findUnique({
            where: { triggerToken: token },
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

            // Execute actions for this callback
            const actionPayload: ActionPayload = {
                rawBody: JSON.stringify({ message: 'Callback executed successfully', data: response.data }),
                parsedJson: { message: 'Callback executed successfully', data: response.data },
                headers: Object.fromEntries(request.headers.entries()),
                clientIp: clientIP,
                userAgent,
                receivedAt: new Date().toISOString(),
            };

            const actionResults = await executeActionsForCallback(callback.id, actionPayload, prisma);

            return NextResponse.json({
                message: 'Callback executed successfully',
                data: response.data,
                actionsExecuted: actionResults.length,
                actionResults
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

            // Execute actions even on failure
            const actionPayload: ActionPayload = {
                rawBody: JSON.stringify({ error: 'Callback failed', details: errorMessage }),
                parsedJson: { error: 'Callback failed', details: errorMessage },
                headers: Object.fromEntries(request.headers.entries()),
                clientIp: clientIP,
                userAgent,
                receivedAt: new Date().toISOString(),
            };

            const actionResults = await executeActionsForCallback(callback.id, actionPayload, prisma);

            return NextResponse.json({
                error: 'Failed to execute callback',
                actionsExecuted: actionResults.length,
                actionResults
            }, { status: 500 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}