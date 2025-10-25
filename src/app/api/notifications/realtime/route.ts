import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

// In-memory store for SSE connections (in production, use Redis or similar)
const clients = new Map<string, { write: (data: string) => void; close: () => void }>();

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const authResult = await authMiddleware(request);
        if (!authResult.success) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = authResult.user!.id;

        // Set up Server-Sent Events
        const responseStream = new ReadableStream({
            start(controller) {
                // Send initial connection message
                const encoder = new TextEncoder();
                const initialMessage = `data: ${JSON.stringify({
                    type: 'connected',
                    message: 'Real-time notifications connected',
                    timestamp: new Date().toISOString()
                })}\n\n`;

                controller.enqueue(encoder.encode(initialMessage));

                // Store the controller for later use
                const writer = {
                    write: (data: string) => {
                        try {
                            controller.enqueue(encoder.encode(data));
                        } catch (_error) {
                            // Client disconnected, remove from clients map
                            clients.delete(userId);
                        }
                    },
                    close: () => {
                        try {
                            controller.close();
                        } catch (_error) {
                            // Already closed
                        }
                        clients.delete(userId);
                    }
                };

                // Store writer for this user
                clients.set(userId, writer);
            },
            cancel() {
                // Clean up when connection is closed
                clients.delete(userId);
            }
        });

        return new NextResponse(responseStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
            },
        });
    } catch (error) {
        console.error('SSE connection error:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}

// Function to send notification to specific user
export function sendRealtimeNotification(userId: string, notification: {
    type: 'webhook_success' | 'webhook_failure' | 'system';
    title: string;
    message: string;
    data?: Record<string, unknown>;
}) {
    const client = clients.get(userId);
    if (client) {
        const message = `data: ${JSON.stringify({
            ...notification,
            timestamp: new Date().toISOString()
        })}\n\n`;

        try {
            client.write(message);
        } catch (_error) {
            // Client disconnected, remove from clients map
            clients.delete(userId);
        }
    }
}

// Function to broadcast system notification to all connected users
export function broadcastSystemNotification(notification: {
    title: string;
    message: string;
    data?: Record<string, unknown>;
}) {
    const message = `data: ${JSON.stringify({
        type: 'system',
        ...notification,
        timestamp: new Date().toISOString()
    })}\n\n`;

    for (const [userId, client] of clients.entries()) {
        try {
            client.write(message);
        } catch (_error) {
            // Client disconnected, remove from clients map
            clients.delete(userId);
        }
    }
}