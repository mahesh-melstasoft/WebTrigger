import axios from 'axios';

export interface SlackBlock {
    type: string;
    text?: {
        type: string;
        text: string;
    };
    fields?: Array<{
        type: string;
        text: string;
    }>;
    elements?: Array<{
        type: string;
        text: string;
    }>;
}

export interface SlackContextBlock extends SlackBlock {
    type: 'context';
    elements: Array<{
        type: string;
        text: string;
    }>;
}

export interface SlackAttachment {
    color?: string;
    footer?: string;
    ts?: number;
}

export interface SlackMessage {
    text?: string;
    blocks?: SlackBlock[];
    attachments?: SlackAttachment[];
}

export interface WebhookEvent {
    callbackId: string;
    callbackName: string;
    callbackUrl: string;
    event: string;
    details: string;
    statusCode?: number;
    responseTime?: number;
    success: boolean;
    triggeredAt: Date;
    userId: string;
    userEmail: string;
}

export class SlackService {
    private static async sendMessage(webhookUrl: string, message: SlackMessage): Promise<boolean> {
        try {
            const response = await axios.post(webhookUrl, message, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 5000, // 5 second timeout
            });

            return response.status === 200;
        } catch (error) {
            console.error('Failed to send Slack message:', error);
            return false;
        }
    }

    static async sendWebhookNotification(
        webhookUrl: string,
        event: WebhookEvent,
        stats?: {
            totalTriggersToday: number;
            successRate: number;
            avgResponseTime: number;
        }
    ): Promise<boolean> {
        const timestamp = event.triggeredAt.toLocaleString();
        const statusEmoji = event.success ? '✅' : '❌';
        const statusColor = event.success ? 'good' : 'danger';

        const blocks: (SlackBlock | SlackContextBlock)[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${statusEmoji} Webhook ${event.success ? 'Triggered' : 'Failed'}`,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Callback:*\n${event.callbackName}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*URL:*\n${event.callbackUrl}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Time:*\n${timestamp}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Status:*\n${event.success ? 'Success' : 'Failed'}`,
                    },
                ],
            },
        ];

        // Add response details if available
        if (event.statusCode || event.responseTime) {
            const responseFields = [];
            if (event.statusCode) {
                responseFields.push({
                    type: 'mrkdwn',
                    text: `*Status Code:*\n${event.statusCode}`,
                });
            }
            if (event.responseTime) {
                responseFields.push({
                    type: 'mrkdwn',
                    text: `*Response Time:*\n${event.responseTime}ms`,
                });
            }

            blocks.push({
                type: 'section',
                fields: responseFields,
            });
        }

        // Add details section
        if (event.details) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Details:*\n${event.details}`,
                },
            });
        }

        // Add statistics if available
        if (stats) {
            blocks.push({
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Today's Triggers:*\n${stats.totalTriggersToday}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Success Rate:*\n${stats.successRate.toFixed(1)}%`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Avg Response Time:*\n${stats.avgResponseTime.toFixed(0)}ms`,
                    },
                ],
            });
        }

        // Add footer
        blocks.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `User: ${event.userEmail} | WebTrigger`,
                },
            ],
        } as SlackContextBlock);

        const message: SlackMessage = {
            blocks,
            attachments: [
                {
                    color: statusColor,
                    footer: 'WebTrigger',
                    ts: Math.floor(event.triggeredAt.getTime() / 1000),
                },
            ],
        };

        return this.sendMessage(webhookUrl, message);
    }

    static async sendTestMessage(webhookUrl: string, userEmail: string): Promise<boolean> {
        const message: SlackMessage = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🔧 Slack Integration Test',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Hello! Your Slack webhook integration is working correctly.\n\n*User:* ${userEmail}\n*Time:* ${new Date().toLocaleString()}`,
                    },
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: 'WebTrigger - Smart Webhook Management',
                        },
                    ],
                } as SlackContextBlock,
            ],
        };

        return this.sendMessage(webhookUrl, message);
    }
}
