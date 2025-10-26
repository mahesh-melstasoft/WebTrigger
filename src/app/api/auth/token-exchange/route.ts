import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { generateJWT } from '@/lib/auth';

export async function POST() {
    try {
        // Get the NextAuth session
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !(session.user as { id: string }).id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as { id: string }).id;

        // Generate the app's JWT
        const appToken = generateJWT(userId);

        return NextResponse.json({ token: appToken });
    } catch (error) {
        console.error('Token exchange error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}