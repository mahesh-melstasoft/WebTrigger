import nodemailer from 'nodemailer';
import twilio from 'twilio';
import TelegramBot from 'node-telegram-bot-api';
import { prisma } from './prisma';
import { decryptSecret } from './cryptoHelper';
import { NotificationType } from '../generated/prisma';

// Reference decryptSecret and NotificationType to avoid unused import warnings
void decryptSecret;
void NotificationType;

export interface NotificationPayload {
  callbackName: string;
  callbackUrl: string;
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  triggeredAt: Date;
  userEmail: string;
}

export interface NotificationTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Email Notification Service
 */
export class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null;

  async initialize(smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  }) {
    // Check for SMTP configuration in environment or parameter
    const config = smtpConfig || {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    };

    if (!config.user || !config.pass) {
      console.warn('SMTP credentials not configured. Email notifications disabled.');
      return false;
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    return true;
  }

  async sendNotification(
    to: string[],
    template: NotificationTemplate,
    payload: NotificationPayload
  ): Promise<boolean> {
    if (!this.transporter) {
      await this.initialize();
      if (!this.transporter) return false;
    }

    try {
      const htmlBody = this.renderTemplate(template.htmlBody, payload);
      const textBody = template.textBody
        ? this.renderTemplate(template.textBody, payload)
        : this.stripHtml(htmlBody);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'WebTrigger <noreply@webtrigger.app>',
        to: to.join(', '),
        subject: this.renderTemplate(template.subject, payload),
        html: htmlBody,
        text: textBody,
      });

      return true;
    } catch (error) {
      console.error('Email notification error:', error);
      return false;
    }
  }

  private renderTemplate(template: string, payload: NotificationPayload): string {
    return template
      .replace(/\{\{callbackName\}\}/g, payload.callbackName)
      .replace(/\{\{callbackUrl\}\}/g, payload.callbackUrl)
      .replace(/\{\{status\}\}/g, payload.success ? 'Success' : 'Failed')
      .replace(/\{\{statusCode\}\}/g, String(payload.statusCode || 'N/A'))
      .replace(/\{\{responseTime\}\}/g, String(payload.responseTime || 'N/A'))
      .replace(/\{\{error\}\}/g, payload.error || 'None')
      .replace(/\{\{triggeredAt\}\}/g, payload.triggeredAt.toLocaleString())
      .replace(/\{\{userEmail\}\}/g, payload.userEmail)
      .replace(/\{\{statusEmoji\}\}/g, payload.success ? '✅' : '❌');
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }
}

/**
 * WhatsApp Notification Service (via Twilio)
 */
export class WhatsAppNotificationService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';

  async initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured. WhatsApp notifications disabled.');
      return false;
    }

    this.client = twilio(accountSid, authToken);
    return true;
  }

  async sendNotification(
    to: string[],
    payload: NotificationPayload
  ): Promise<boolean> {
    if (!this.client) {
      await this.initialize();
      if (!this.client) return false;
    }

    try {
      const message = this.formatMessage(payload);

      for (const phoneNumber of to) {
        await this.client.messages.create({
          from: this.fromNumber,
          to: `whatsapp:${phoneNumber}`,
          body: message,
        });
      }

      return true;
    } catch (error) {
      console.error('WhatsApp notification error:', error);
      return false;
    }
  }

  private formatMessage(payload: NotificationPayload): string {
    const emoji = payload.success ? '✅' : '❌';
    return `${emoji} *Webhook ${payload.success ? 'Success' : 'Failed'}*

*Callback:* ${payload.callbackName}
*URL:* ${payload.callbackUrl}
*Status:* ${payload.statusCode || 'N/A'}
*Response Time:* ${payload.responseTime || 'N/A'}ms
*Time:* ${payload.triggeredAt.toLocaleString()}

${payload.error ? `*Error:* ${payload.error}` : ''}

_WebTrigger Notification_`;
  }
}

/**
 * Telegram Notification Service
 */
export class TelegramNotificationService {
  private bot: TelegramBot | null = null;

  async initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.warn('Telegram bot token not configured. Telegram notifications disabled.');
      return false;
    }

    this.bot = new TelegramBot(token, { polling: false });
    return true;
  }

  async sendNotification(
    chatIds: string[],
    payload: NotificationPayload
  ): Promise<boolean> {
    if (!this.bot) {
      await this.initialize();
      if (!this.bot) return false;
    }

    try {
      const message = this.formatMessage(payload);

      for (const chatId of chatIds) {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }

      return true;
    } catch (error) {
      console.error('Telegram notification error:', error);
      return false;
    }
  }

  private formatMessage(payload: NotificationPayload): string {
    const emoji = payload.success ? '✅' : '❌';
    return `${emoji} *Webhook ${payload.success ? 'Success' : 'Failed'}*

*Callback:* ${payload.callbackName}
*URL:* ${payload.callbackUrl}
*Status:* ${payload.statusCode || 'N/A'}
*Response Time:* ${payload.responseTime || 'N/A'}ms
*Time:* ${payload.triggeredAt.toLocaleString()}

${payload.error ? `*Error:* ${payload.error}` : ''}

_WebTrigger Notification_`;
  }
}

/**
 * SMS Notification Service (via Twilio)
 */
export class SMSNotificationService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';

  async initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      console.warn('Twilio SMS credentials not configured. SMS notifications disabled.');
      return false;
    }

    this.client = twilio(accountSid, authToken);
    return true;
  }

  async sendNotification(
    to: string[],
    payload: NotificationPayload
  ): Promise<boolean> {
    if (!this.client) {
      await this.initialize();
      if (!this.client) return false;
    }

    try {
      const message = this.formatMessage(payload);

      for (const phoneNumber of to) {
        await this.client.messages.create({
          from: this.fromNumber,
          to: phoneNumber,
          body: message,
        });
      }

      return true;
    } catch (error) {
      console.error('SMS notification error:', error);
      return false;
    }
  }

  private formatMessage(payload: NotificationPayload): string {
    const emoji = payload.success ? '✅' : '❌';
    return `${emoji} ${payload.callbackName} - ${payload.success ? 'Success' : 'Failed'}
Status: ${payload.statusCode || 'N/A'}
Time: ${payload.responseTime || 'N/A'}ms
${payload.error ? `Error: ${payload.error.substring(0, 100)}` : ''}`;
  }
}

/**
 * Master Notification Orchestrator
 */
export class NotificationOrchestrator {
  private emailService = new EmailNotificationService();
  private whatsappService = new WhatsAppNotificationService();
  private telegramService = new TelegramNotificationService();
  private smsService = new SMSNotificationService();

  async sendNotifications(userId: string, payload: NotificationPayload): Promise<void> {
    // Get user's notification settings and subscription info
    const [settings, user] = await Promise.all([
      prisma.notificationSettings.findUnique({
        where: { userId },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
    ]);

    if (!settings || !user) {
      // No settings configured or user not found, skip notifications
      return;
    }

    // Check if user has paid subscription (not FREE)
    const hasPaidSubscription = user.role !== 'FREE';

    // Determine which event type this is
    const isSuccess = payload.success;
    const shouldNotify = isSuccess
      ? (settings.emailOnSuccess || settings.whatsappOnSuccess || settings.telegramOnSuccess || settings.smsOnSuccess || settings.pushOnSuccess)
      : (settings.emailOnFailure || settings.whatsappOnFailure || settings.telegramOnFailure || settings.smsOnFailure || settings.pushOnFailure);

    if (!shouldNotify) return;

    // Send Email Notifications
    if (settings.emailEnabled && ((isSuccess && settings.emailOnSuccess) || (!isSuccess && settings.emailOnFailure))) {
      const template = await this.getEmailTemplate(userId, isSuccess ? 'WEBHOOK_SUCCESS' : 'WEBHOOK_FAILURE');
      const recipients = [payload.userEmail, ...settings.emailRecipients];
      await this.emailService.sendNotification(recipients, template, payload);
    }

    // Send WhatsApp Notifications (PAID SUBSCRIPTION REQUIRED)
    if (hasPaidSubscription && settings.whatsappEnabled && settings.whatsappNumbers.length > 0 &&
      ((isSuccess && settings.whatsappOnSuccess) || (!isSuccess && settings.whatsappOnFailure))) {
      await this.whatsappService.sendNotification(settings.whatsappNumbers, payload);
    }

    // Send Telegram Notifications
    if (settings.telegramEnabled && settings.telegramChatIds.length > 0 &&
      ((isSuccess && settings.telegramOnSuccess) || (!isSuccess && settings.telegramOnFailure))) {
      await this.telegramService.sendNotification(settings.telegramChatIds, payload);
    }

    // Send SMS Notifications (PAID SUBSCRIPTION REQUIRED)
    if (hasPaidSubscription && settings.smsEnabled && settings.smsNumbers.length > 0 &&
      ((isSuccess && settings.smsOnSuccess) || (!isSuccess && settings.smsOnFailure))) {
      await this.smsService.sendNotification(settings.smsNumbers, payload);
    }

    // Send Push Notifications
    if (settings.pushEnabled && ((isSuccess && settings.pushOnSuccess) || (!isSuccess && settings.pushOnFailure))) {
      await this.sendPushToUser(userId, payload);
    }
  }

  // Send a push notification to a user's stored web push subscription (if present) with retry logic
  public async sendPushToUser(userId: string, payload: NotificationPayload, maxRetries: number = 3): Promise<boolean> {
    try {
      const subscription = await prisma.pushSubscription.findUnique({ where: { userId } });
      if (!subscription) return false;

      // Import sendPush dynamically to avoid loading web-push in non-server contexts
      const { sendPush } = await import('./webpush');

      let lastError: unknown;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await sendPush({ endpoint: subscription.endpoint, p256dhKey: subscription.p256dhKey, authKey: subscription.authKey }, payload);
          return true;
        } catch (err: unknown) {
          lastError = err;
          const errObj = typeof err === 'object' && err ? (err as Record<string, unknown>) : null;
          const status = errObj && 'statusCode' in errObj ? (errObj['statusCode'] as number | undefined) : undefined;
          const is410 = status === 410 || (errObj && ('status' in errObj) && errObj['status'] === 410);

          if (is410) {
            // Subscription is gone or invalid, remove it immediately
            try {
              await prisma.pushSubscription.deleteMany({ where: { userId } });
            } catch (delErr) {
              console.warn('Failed to delete stale push subscription:', delErr);
            }
            return false;
          }

          // For other errors, retry with exponential backoff if not the last attempt
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.warn(`Push notification attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      console.error(`Push notification failed after ${maxRetries + 1} attempts:`, lastError);
      return false;
    } catch (error) {
      console.error('sendPushToUser error:', error);
      return false;
    }
  }

  private async getEmailTemplate(userId: string, type: string): Promise<NotificationTemplate> {
    // Try to get user's custom template
    const customTemplate = await prisma.emailTemplate.findFirst({
      where: { userId, type: type as NotificationType },
    });

    if (customTemplate) {
      return {
        subject: customTemplate.subject,
        htmlBody: customTemplate.htmlBody,
        textBody: customTemplate.textBody || undefined,
      };
    }

    // Return default template
    return this.getDefaultTemplate(type);
  }

  private getDefaultTemplate(type: string): NotificationTemplate {
    const templates = {
      WEBHOOK_SUCCESS: {
        subject: '✅ Webhook Success: {{callbackName}}',
        htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .status { color: #10b981; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    td:first-child { font-weight: bold; width: 40%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{statusEmoji}} Webhook Success</h1>
    </div>
    <div class="content">
      <p>Your webhook has been triggered successfully!</p>
      <table>
        <tr><td>Callback Name</td><td>{{callbackName}}</td></tr>
        <tr><td>Callback URL</td><td>{{callbackUrl}}</td></tr>
        <tr><td>Status Code</td><td class="status">{{statusCode}}</td></tr>
        <tr><td>Response Time</td><td>{{responseTime}}ms</td></tr>
        <tr><td>Triggered At</td><td>{{triggeredAt}}</td></tr>
      </table>
    </div>
    <div class="footer">
      <p>WebTrigger - Smart Webhook Management</p>
      <p>User: {{userEmail}}</p>
    </div>
  </div>
</body>
</html>`,
        textBody: `✅ Webhook Success: {{callbackName}}

Your webhook has been triggered successfully!

Callback Name: {{callbackName}}
Callback URL: {{callbackUrl}}
Status Code: {{statusCode}}
Response Time: {{responseTime}}ms
Triggered At: {{triggeredAt}}

WebTrigger - Smart Webhook Management
User: {{userEmail}}`,
      },
      WEBHOOK_FAILURE: {
        subject: '❌ Webhook Failed: {{callbackName}}',
        htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fef2f2; padding: 20px; border: 1px solid #fecaca; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .error { color: #ef4444; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td { padding: 10px; border-bottom: 1px solid #fecaca; }
    td:first-child { font-weight: bold; width: 40%; }
    .error-box { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{statusEmoji}} Webhook Failed</h1>
    </div>
    <div class="content">
      <p>Your webhook execution failed. Please review the details below:</p>
      <table>
        <tr><td>Callback Name</td><td>{{callbackName}}</td></tr>
        <tr><td>Callback URL</td><td>{{callbackUrl}}</td></tr>
        <tr><td>Status Code</td><td class="error">{{statusCode}}</td></tr>
        <tr><td>Response Time</td><td>{{responseTime}}ms</td></tr>
        <tr><td>Triggered At</td><td>{{triggeredAt}}</td></tr>
      </table>
      <div class="error-box">
        <strong>Error Details:</strong><br>
        {{error}}
      </div>
      <p><a href="https://webtrigger.app/dashboard/logs" style="color: #3b82f6; text-decoration: none;">View Full Logs →</a></p>
    </div>
    <div class="footer">
      <p>WebTrigger - Smart Webhook Management</p>
      <p>User: {{userEmail}}</p>
    </div>
  </div>
</body>
</html>`,
        textBody: `❌ Webhook Failed: {{callbackName}}

Your webhook execution failed. Please review the details below:

Callback Name: {{callbackName}}
Callback URL: {{callbackUrl}}
Status Code: {{statusCode}}
Response Time: {{responseTime}}ms
Triggered At: {{triggeredAt}}

Error Details:
{{error}}

View Full Logs: https://webtrigger.app/dashboard/logs

WebTrigger - Smart Webhook Management
User: {{userEmail}}`,
      },
    };

    return templates[type as keyof typeof templates] || templates.WEBHOOK_SUCCESS;
  }

  // Cleanup stale push subscriptions - call this periodically (e.g., daily cron job)
  public async cleanupStaleSubscriptions(): Promise<{ deleted: number }> {
    try {
      // Get all subscriptions older than 30 days that haven't been used recently
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // For now, we'll do a simple cleanup based on age
      // In a production system, you might want to test each subscription
      const result = await prisma.pushSubscription.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      console.log(`Cleaned up ${result.count} stale push subscriptions`);
      return { deleted: result.count };
    } catch (error) {
      console.error('Failed to cleanup stale subscriptions:', error);
      return { deleted: 0 };
    }
  }
}

// Export singleton instance
// Export instance when needed; created lazily to avoid unused export warnings
export function getNotificationOrchestrator() {
  return new NotificationOrchestrator();
}
