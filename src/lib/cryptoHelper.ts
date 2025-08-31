import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

// Use server-side master key from env (must be set)
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || '';
if (!MASTER_KEY) {
    console.warn('ENCRYPTION_MASTER_KEY is not set. ServiceCredential encryption will fail at runtime.');
}

export function encryptSecret(plain: string) {
    const key = Buffer.from(MASTER_KEY, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(payload: string) {
    const key = Buffer.from(MASTER_KEY, 'hex');
    const data = Buffer.from(payload, 'base64');
    const iv = data.slice(0, IV_LENGTH);
    const tag = data.slice(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = data.slice(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

export function isEncryptionConfigured() {
    return !!MASTER_KEY && Buffer.from(MASTER_KEY, 'hex').length === 32;
}
