import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { SlackService } from '@/lib/slack';

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { webhookUrl } = await request.json();

        if (!webhookUrl) {
            return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
        }

        // Validate webhook URL format
        if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
            return NextResponse.json({ error: 'Invalid Slack webhook URL format' }, { status: 400 });
        }

        // Send test message
        const success = await SlackService.sendTestMessage(webhookUrl, authResult.user!.email);

        if (success) {
            return NextResponse.json({
                message: 'Test message sent successfully to Slack!',
                success: true
            });
        } else {
            return NextResponse.json({
                error: 'Failed to send test message to Slack',
                success: false
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Slack test error:', error);
        return NextResponse.json(
            { error: 'Failed to test Slack webhook' },
            { status: 500 }
        );
    }
}
