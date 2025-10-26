import webpush from 'web-push';

export interface StoredPushSubscription {
    endpoint: string;
    p256dhKey: string;
    authKey: string;
}

export function ensureVapidConfig(): { publicKey: string; privateKey: string } {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';

    if (!publicKey || !privateKey) {
        console.error('VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the environment.');
    }

    return { publicKey, privateKey };
}

export function configureWebPush() {
    const { publicKey, privateKey } = ensureVapidConfig();
    if (publicKey && privateKey) {
        webpush.setVapidDetails(
            `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`,
            publicKey,
            privateKey
        );
        return true;
    }
    return false;
}

export async function sendPush(subscription: StoredPushSubscription, payload: string | object) {
    configureWebPush();

    const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.p256dhKey,
            auth: subscription.authKey,
        },
    };

    try {
        const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
        // web-push types are flexible; keep the cast scoped to this call.
        const res = await webpush.sendNotification(pushSubscription as unknown, body);
        return res;
    } catch (err) {
        console.error('web-push send error:', err);
        throw err;
    }
}
