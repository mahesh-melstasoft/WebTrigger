import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authResult = await authMiddleware(request);

        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.error || 'Unauthorized' },
                { status: 401 }
            );
        }

        // Return user data without sensitive information
        const userData = {
            id: authResult.user!.id,
            email: authResult.user!.email,
            displayName: authResult.user!.displayName || authResult.user!.email.split('@')[0],
            role: authResult.user!.role,
            // You can add more user data here as needed
        };

        return NextResponse.json(userData);
    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
