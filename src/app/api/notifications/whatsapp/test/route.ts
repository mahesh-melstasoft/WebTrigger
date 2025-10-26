import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { decryptSecret } from '@/lib/cryptoHelper';
import twilio from 'twilio';

export async function POST(request: Request) {
    try {
        const authResult = await authMiddleware(request);
        if (!authResult.success || !authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = authResult.user.id;

        const body = await request.json().catch(() => ({}));
        const toNumber = body?.phone;

        // Find Twilio credential for user
        const cred = await prisma.serviceCredential.findFirst({
            where: { userId, provider: 'TWILIO' },
        });

        if (!cred) {
            return NextResponse.json({ error: 'No Twilio credential found for user' }, { status: 404 });
        }

        // Decrypt secret; expect either raw token or JSON with accountSid/authToken/fromNumber
        const decrypted = decryptSecret(cred.secret);
        let accountSid = process.env.TWILIO_ACCOUNT_SID || '';
        let authToken = process.env.TWILIO_AUTH_TOKEN || '';
        let fromNumber = process.env.TWILIO_WHATSAPP_FROM || '';

        try {
            const parsed = JSON.parse(decrypted);
            accountSid = parsed.accountSid || accountSid;
            authToken = parsed.authToken || authToken;
            fromNumber = parsed.fromNumber || fromNumber;
        } catch {
            // not JSON - assume decrypted is auth token; fallback to env + cred
            // If decrypted contains a colon-separated value accountSid:authToken use that
            if (decrypted.includes(':')) {
                const [sid, token, from] = decrypted.split(':');
                if (sid && token) {
                    accountSid = sid;
                    authToken = token;
                    if (from) fromNumber = from;
                }
            } else {
                // Use decrypted as authToken, keep accountSid from env
                authToken = decrypted || authToken;
            }
        }

        if (!accountSid || !authToken || !fromNumber) {
            return NextResponse.json({ error: 'Incomplete Twilio configuration. Ensure Account SID, Auth Token and WhatsApp from number are configured.' }, { status: 422 });
        }

        const client = twilio(accountSid, authToken);

        const to = toNumber || fromNumber; // if user didn't pass phone, try same number (useful for sandbox)
        if (!to) {
            return NextResponse.json({ error: 'Missing target phone number for test message' }, { status: 400 });
        }

        try {
            const message = await client.messages.create({
                from: `whatsapp:${fromNumber}`,
                to: `whatsapp:${to}`,
                body: 'WebTrigger test message: Hello from WebTrigger!'
            });

            return NextResponse.json({ success: true, sid: message.sid });
        } catch (err: unknown) {
            console.error('Twilio send error:', err);
            // Map some common Twilio errors to friendly messages
            const errObj = typeof err === 'object' && err ? (err as Record<string, unknown>) : null;
            const status = errObj && 'status' in errObj && typeof errObj.status === 'number' ? errObj.status : 500;
            const code = errObj && 'code' in errObj && typeof errObj.code === 'number' ? (errObj.code as number) : null;
            let message = 'Failed to send WhatsApp test message';

            if (code === 21606) message = 'WhatsApp sandbox error: destination number not joined to sandbox.';
            else if (code === 20003) message = 'Authentication error: invalid Twilio credentials.';
            else if (code === 21608) message = 'From number not enabled for WhatsApp.';
            else if (errObj && 'message' in errObj) message = String(errObj.message);
            return NextResponse.json({ error: message, code }, { status: typeof status === 'number' ? status : 500 });
        }
    } catch (error) {
        console.error('WhatsApp test error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
