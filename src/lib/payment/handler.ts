import Stripe from 'stripe';
import * as paypal from 'paypal-rest-sdk';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { encryptSecret, decryptSecret } from '../cryptoHelper';

// Keep encrypt/decrypt references for future use and avoid unused import lint
void encryptSecret;
void decryptSecret;

/**
 * Payment Gateway Types
 */
export enum PaymentGateway {
    STRIPE = 'stripe',
    PAYPAL = 'paypal',
    RAZORPAY = 'razorpay',
    BUYMEACOFFEE = 'buymeacoffee',
    PATREON = 'patreon'
}

/**
 * Payment Status
 */
export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    CANCELLED = 'cancelled'
}

/**
 * Donation Tier
 */
export interface DonationTier {
    id: string;
    name: string;
    amount: number;
    currency: string;
    description: string;
    benefits: string[];
}

/**
 * Payment Transaction
 */
export interface PaymentTransaction {
    id: string;
    gateway: PaymentGateway;
    amount: number;
    currency: string;
    status: PaymentStatus;
    customerId?: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    createdAt: number;
    completedAt?: number;
    refundedAt?: number;
}

/**
 * Payment Gateway Configuration
 */
export interface PaymentGatewayConfig {
    stripeApiKey?: string;
    paypalClientId?: string;
    paypalClientSecret?: string;
    paypalMode?: 'sandbox' | 'live';
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    buyMeCoffeeLink?: string;
    patreonAccessToken?: string;
    patreonCampaignId?: string;
}

/**
 * Payment Handler for managing multiple payment gateways
 */
export class PaymentHandler {
    private config: PaymentGatewayConfig;
    private stripe: Stripe | null = null;
    private razorpay: Razorpay | null = null;
    private transactions: Map<string, PaymentTransaction> = new Map();

    constructor(config: PaymentGatewayConfig) {
        this.config = config;
        this.initializeGateways();
    }

    /**
     * Initialize payment gateways
     */
    private initializeGateways(): void {
        // Initialize Stripe
        if (this.config.stripeApiKey) {
            this.stripe = new Stripe(this.config.stripeApiKey);
        }

        // Initialize PayPal
        if (this.config.paypalClientId && this.config.paypalClientSecret) {
            paypal.configure({
                mode: this.config.paypalMode || 'sandbox',
                client_id: this.config.paypalClientId,
                client_secret: this.config.paypalClientSecret,
            });
        }

        // Initialize Razorpay
        if (this.config.razorpayKeyId && this.config.razorpayKeySecret) {
            this.razorpay = new Razorpay({
                key_id: this.config.razorpayKeyId,
                key_secret: this.config.razorpayKeySecret,
            });
        }
    }

    /**
     * Create a Stripe payment intent
     * @param amount Amount in cents
     * @param currency Currency code (e.g., 'usd')
     * @param metadata Additional metadata
     */
    async createStripePaymentIntent(
        amount: number,
        currency: string = 'usd',
        metadata: Record<string, string | number | null> = {}
    ): Promise<{ clientSecret: string; paymentIntentId: string }> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata,
        });

        const transaction: PaymentTransaction = {
            id: paymentIntent.id,
            gateway: PaymentGateway.STRIPE,
            amount,
            currency,
            status: PaymentStatus.PENDING,
            metadata,
            createdAt: Date.now(),
        };

        this.transactions.set(paymentIntent.id, transaction);

        return {
            clientSecret: paymentIntent.client_secret || '',
            paymentIntentId: paymentIntent.id,
        };
    }

    /**
     * Create a Stripe donation
     * @param amount Amount in cents
     * @param email Customer email
     * @param tierName Donation tier name
     */
    async createStripeDonation(
        amount: number,
        email: string,
        tierName: string
    ): Promise<{ url: string; sessionId: string }> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Donation - ${tierName}`,
                            description: `Support via donation tier: ${tierName}`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cancel`,
            customer_email: email,
        });

        return {
            url: session.url || '',
            sessionId: session.id,
        };
    }

    /**
     * Create a PayPal payment
     * @param amount Amount in dollars
     * @param currency Currency code
     * @param description Payment description
     */
    async createPayPalPayment(
        amount: number,
        currency: string = 'USD',
        description: string = 'Donation'
    ): Promise<{ approvalUrl: string; paymentId: string }> {
        return new Promise((resolve, reject) => {
            const paymentDetails = {
                intent: 'sale' as 'sale' | 'authorize',
                payer: {
                    payment_method: 'paypal',
                },
                redirect_urls: {
                    return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/paypal/success`,
                    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/paypal/cancel`,
                },
                transactions: [
                    {
                        amount: {
                            total: amount.toString(),
                            currency,
                            details: {
                                subtotal: amount.toString(),
                            },
                        },
                        description,
                    },
                ],
            };

            paypal.payment.create(paymentDetails, (error: unknown, payment: unknown) => {
                if (error) {
                    reject(error);
                } else {
                    const paypalPayment = payment as { links?: Array<{ rel: string; href: string }>; id: string };
                    const approvalUrl = paypalPayment.links?.find((link) => link.rel === 'approval_url')?.href;
                    resolve({
                        approvalUrl: approvalUrl || '',
                        paymentId: paypalPayment.id,
                    });
                }
            });
        });
    }

    /**
     * Execute PayPal payment
     * @param paymentId Payment ID from creation
     * @param payerId Payer ID from PayPal redirect
     */
    async executePayPalPayment(paymentId: string, payerId: string): Promise<PaymentTransaction> {
        return new Promise((resolve, reject) => {
            paypal.payment.execute(
                paymentId,
                { payer_id: payerId },
                (error: unknown, payment: unknown) => {
                    if (error) {
                        reject(error);
                    } else {
                        const paypalPayment = payment as {
                            id: string;
                            transactions: Array<{ amount: { total: string; currency: string } }>;
                            state: string;
                            payer: { payer_info: { email: string } };
                        };
                        const transaction: PaymentTransaction = {
                            id: paypalPayment.id,
                            gateway: PaymentGateway.PAYPAL,
                            amount: parseFloat(paypalPayment.transactions[0].amount.total),
                            currency: paypalPayment.transactions[0].amount.currency,
                            status: paypalPayment.state === 'approved' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
                            paymentMethodId: paypalPayment.payer.payer_info.email,
                            metadata: { payerId },
                            createdAt: Date.now(),
                        };

                        this.transactions.set(paypalPayment.id, transaction);
                        resolve(transaction);
                    }
                }
            );
        });
    }

    /**
     * Create a Razorpay order
     * @param amount Amount in paise (1 rupee = 100 paise)
     * @param currency Currency code (default INR)
     * @param description Order description
     */
    async createRazorpayOrder(
        amount: number,
        currency: string = 'INR',
        description: string = 'Donation'
    ): Promise<{ orderId: string; amount: number; currency: string }> {
        if (!this.razorpay) {
            throw new Error('Razorpay is not configured');
        }

        const order = await this.razorpay.orders.create({
            amount,
            currency,
            receipt: `donation_${Date.now()}`,
            notes: {
                description,
            },
        });

        const transaction: PaymentTransaction = {
            id: order.id,
            gateway: PaymentGateway.RAZORPAY,
            amount: amount / 100, // Convert from paise to rupees
            currency,
            status: PaymentStatus.PENDING,
            metadata: { orderId: order.id },
            createdAt: Date.now(),
        };

        this.transactions.set(order.id, transaction);

        return {
            orderId: order.id,
            amount,
            currency,
        };
    }

    /**
     * Verify Razorpay payment
     * @param orderId Order ID
     * @param paymentId Payment ID from client
     * @param signature Signature from client
     */
    async verifyRazorpayPayment(
        orderId: string,
        paymentId: string,
        signature: string
    ): Promise<PaymentTransaction> {
        if (!this.razorpay) {
            throw new Error('Razorpay is not configured');
        }

        // Verify signature
        const hash = createHmac('sha256', this.config.razorpayKeySecret!)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (hash !== signature) {
            throw new Error('Invalid payment signature');
        }

        // Fetch payment details
        const payment = await this.razorpay.payments.fetch(paymentId);

        const transaction: PaymentTransaction = {
            id: paymentId,
            gateway: PaymentGateway.RAZORPAY,
            amount: (payment.amount as number) / 100,
            currency: payment.currency as string,
            status: payment.status === 'captured' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            paymentMethodId: paymentId,
            metadata: { orderId },
            createdAt: Date.now(),
            completedAt: payment.created_at ? (payment.created_at as number) * 1000 : undefined,
        };

        this.transactions.set(paymentId, transaction);
        return transaction;
    }

    /**
     * Get Buy Me a Coffee link
     */
    getBuyMeCoffeeLink(): string {
        if (!this.config.buyMeCoffeeLink) {
            throw new Error('Buy Me a Coffee link is not configured');
        }
        return this.config.buyMeCoffeeLink;
    }

    /**
     * Get Patreon link
     */
    getPatreonLink(): string {
        if (!this.config.patreonCampaignId) {
            throw new Error('Patreon campaign ID is not configured');
        }
        return `https://www.patreon.com/${this.config.patreonCampaignId}`;
    }

    /**
     * Get Patreon campaign members (requires access token)
     */
    async getPatreonMembers(): Promise<Record<string, unknown>[]> {
        if (!this.config.patreonAccessToken || !this.config.patreonCampaignId) {
            throw new Error('Patreon configuration is incomplete');
        }

        const response = await fetch(
            `https://www.patreon.com/api/oauth2/v2/campaigns/${this.config.patreonCampaignId}/members`,
            {
                headers: {
                    Authorization: `Bearer ${this.config.patreonAccessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch Patreon members');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get transaction history
     */
    getTransactionHistory(): PaymentTransaction[] {
        return Array.from(this.transactions.values()).sort(
            (a, b) => b.createdAt - a.createdAt
        );
    }

    /**
     * Get transaction by ID
     */
    getTransaction(id: string): PaymentTransaction | undefined {
        return this.transactions.get(id);
    }

    /**
     * Update transaction status
     */
    updateTransactionStatus(id: string, status: PaymentStatus): void {
        const transaction = this.transactions.get(id);
        if (transaction) {
            transaction.status = status;
            if (status === PaymentStatus.COMPLETED) {
                transaction.completedAt = Date.now();
            } else if (status === PaymentStatus.REFUNDED) {
                transaction.refundedAt = Date.now();
            }
        }
    }

    /**
     * Refund a Stripe payment
     */
    async refundStripePayment(paymentIntentId: string): Promise<void> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }

        await this.stripe.refunds.create({
            payment_intent: paymentIntentId,
        });

        this.updateTransactionStatus(paymentIntentId, PaymentStatus.REFUNDED);
    }

    /**
     * Create webhook endpoint for Stripe
     */
    getStripeWebhookSecret(): string {
        return process.env.STRIPE_WEBHOOK_SECRET || '';
    }

    /**
     * Verify Stripe webhook signature
     */
    verifyStripeWebhookSignature(
        body: Buffer | string,
        signature: string
    ): Record<string, unknown> | null {
        if (!this.stripe) {
            return null;
        }

        const webhookSecret = this.getStripeWebhookSecret();
        if (!webhookSecret) {
            return null;
        }

        try {
            const event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
            return event as unknown as Record<string, unknown>;
        } catch {
            return null;
        }
    }
}

/**
 * Helper function: Create payment handler with environment variables
 */
export function createPaymentHandler(): PaymentHandler {
    const config: PaymentGatewayConfig = {
        stripeApiKey: process.env.STRIPE_SECRET_KEY,
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
        paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
        paypalMode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
        buyMeCoffeeLink: process.env.BUYMEACOFFEE_LINK,
        patreonAccessToken: process.env.PATREON_ACCESS_TOKEN,
        patreonCampaignId: process.env.PATREON_CAMPAIGN_ID,
    };

    return new PaymentHandler(config);
}

/**
 * Singleton instance
 */
let paymentHandlerInstance: PaymentHandler | null = null;

/**
 * Get global payment handler instance
 */
export function getPaymentHandler(): PaymentHandler {
    if (!paymentHandlerInstance) {
        paymentHandlerInstance = createPaymentHandler();
    }
    return paymentHandlerInstance;
}

/**
 * Reset payment handler instance
 */
export function resetPaymentHandler(): void {
    paymentHandlerInstance = null;
}
