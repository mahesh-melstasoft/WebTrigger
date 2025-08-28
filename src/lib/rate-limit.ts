import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RateLimit {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerMonth: number;
}

export async function checkRateLimit(
    userId: string,
    callbackId: string
): Promise<{ allowed: boolean; limit?: RateLimit; remaining?: number }> {
    try {
        // Get user's subscription and rate limits
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: {
                    include: {
                        plan: {
                            include: {
                                rateLimits: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user?.subscription?.plan?.rateLimits?.[0]) {
            // No rate limit set, allow request
            return { allowed: true };
        }

        const rateLimit = user.subscription.plan.rateLimits[0];
        if (!rateLimit.isActive) {
            return { allowed: true };
        }

        const now = new Date();

        // Check different time periods
        const periods = [
            { name: 'second', duration: 1000, limit: rateLimit.requestsPerSecond },
            { name: 'minute', duration: 60 * 1000, limit: rateLimit.requestsPerMinute },
            { name: 'hour', duration: 60 * 60 * 1000, limit: rateLimit.requestsPerHour },
            { name: 'month', duration: 30 * 24 * 60 * 60 * 1000, limit: rateLimit.requestsPerMonth },
        ];

        for (const period of periods) {
            const periodStart = new Date(now.getTime() - (now.getTime() % period.duration));

            const existingLog = await prisma.rateLimitLog.findUnique({
                where: {
                    callbackId_period_periodStart: {
                        callbackId,
                        period: period.name,
                        periodStart,
                    },
                },
            });

            if (existingLog && existingLog.requestCount >= period.limit) {
                return {
                    allowed: false,
                    limit: {
                        requestsPerSecond: rateLimit.requestsPerSecond,
                        requestsPerMinute: rateLimit.requestsPerMinute,
                        requestsPerHour: rateLimit.requestsPerHour,
                        requestsPerMonth: rateLimit.requestsPerMonth,
                    },
                };
            }
        }

        // All checks passed, log the request
        for (const period of periods) {
            const periodStart = new Date(now.getTime() - (now.getTime() % period.duration));

            await prisma.rateLimitLog.upsert({
                where: {
                    callbackId_period_periodStart: {
                        callbackId,
                        period: period.name,
                        periodStart,
                    },
                },
                update: {
                    requestCount: {
                        increment: 1,
                    },
                },
                create: {
                    callbackId,
                    userId,
                    period: period.name,
                    periodStart,
                    requestCount: 1,
                },
            });
        }

        return { allowed: true };
    } catch (error) {
        console.error('Rate limit check error:', error);
        // Allow request on error to avoid blocking legitimate traffic
        return { allowed: true };
    }
}

export function createRateLimitResponse(limit: RateLimit) {
    return NextResponse.json(
        {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            limits: {
                'X-RateLimit-Per-Second': limit.requestsPerSecond,
                'X-RateLimit-Per-Minute': limit.requestsPerMinute,
                'X-RateLimit-Per-Hour': limit.requestsPerHour,
                'X-RateLimit-Per-Month': limit.requestsPerMonth,
            },
        },
        {
            status: 429,
            headers: {
                'X-RateLimit-Per-Second': limit.requestsPerSecond.toString(),
                'X-RateLimit-Per-Minute': limit.requestsPerMinute.toString(),
                'X-RateLimit-Per-Hour': limit.requestsPerHour.toString(),
                'X-RateLimit-Per-Month': limit.requestsPerMonth.toString(),
                'Retry-After': '60', // Retry after 60 seconds
            },
        }
    );
}
