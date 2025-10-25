/**
 * Sri Lankan Payment Gateway Integration
 * Supports PayHere, Wave Money, Mobile Money, and Local Banks
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

/**
 * Sri Lankan Payment Gateway Types
 */
export enum SriLankanGateway {
    PAYHERE = 'payhere',
    WAVE_MONEY = 'wave_money',
    DIALOG_EZCASH = 'dialog_ezcash',
    MOBITEL_MCASH = 'mobitel_mcash',
    BANK_TRANSFER = 'bank_transfer',
    CRYPTO = 'crypto'
}

/**
 * Supported Local Banks in Sri Lanka
 */
export enum SriLankanBank {
    SAMPATH = 'sampath',
    COMMERCIAL = 'commercial',
    BOC = 'boc',
    HNB = 'hnb',
    SRILANKAN = 'srilankan',
    LOLC = 'lolc'
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
 * PayHere Payment Response
 */
export interface PayHereResponse {
    status: number;
    msg: string;
    paymentId?: string;
}

/**
 * Wave Money Payment Response
 */
export interface WaveMoneyResponse {
    status: 'success' | 'error';
    transactionId?: string;
    message: string;
    paymentUrl?: string;
}

/**
 * Sri Lankan Payment Transaction
 */
export interface SriLankanPaymentTransaction {
    id: string;
    gateway: SriLankanGateway;
    bank?: SriLankanBank;
    amount: number; // In LKR
    status: PaymentStatus;
    phoneNumber?: string;
    bankAccountId?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    createdAt: number;
    completedAt?: number;
    refundedAt?: number;
    notificationUrl?: string;
}

/**
 * PayHere Handler
 * Sri Lanka's leading payment gateway
 * Supports credit/debit cards, mobile money, bank transfers
 */
export class PayHereHandler {
    private merchantId: string;
    private merchantSecret: string;
    private apiInstance: AxiosInstance;
    private transactions: Map<string, SriLankanPaymentTransaction> = new Map();

    constructor(merchantId: string, merchantSecret: string) {
        this.merchantId = merchantId;
        this.merchantSecret = merchantSecret;

        this.apiInstance = axios.create({
            baseURL: 'https://api.payhere.lk/api/v3',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Create PayHere payment
     * @param amount Amount in LKR
     * @param orderId Order ID
     * @param customerEmail Customer email
     * @param customerPhone Customer phone
     * @param itemDescription Description of purchase
     * @param notifyUrl Webhook URL for notifications
     */
    async createPayment(
        amount: number,
        orderId: string,
        customerEmail: string,
        customerPhone: string,
        itemDescription: string,
        notifyUrl: string
    ): Promise<{ paymentUrl: string; paymentId: string }> {
        try {
            const checksum = this.generateChecksum(
                this.merchantId,
                orderId,
                amount,
                this.merchantSecret
            );

            const response = await this.apiInstance.post('/merchant/pay', {
                merchant_id: this.merchantId,
                return_web: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payhere/return`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payhere/cancel`,
                notify_url: notifyUrl,
                order_id: orderId,
                items: itemDescription,
                amount: amount.toString(),
                currency: 'LKR',
                first_name: customerPhone.substring(0, 5),
                last_name: customerPhone.substring(5),
                email: customerEmail,
                phone: customerPhone,
                address: 'Sri Lanka',
                city: 'Sri Lanka',
                country: 'Sri Lanka',
                custom_1: orderId,
                custom_2: customerEmail,
                checksum: checksum,
            });

            if (response.data.status === 'OK') {
                const transaction: SriLankanPaymentTransaction = {
                    id: orderId,
                    gateway: SriLankanGateway.PAYHERE,
                    amount,
                    status: PaymentStatus.PENDING,
                    phoneNumber: customerPhone,
                    metadata: { paymentId: response.data.paymentId },
                    createdAt: Date.now(),
                    notificationUrl: notifyUrl,
                };

                this.transactions.set(orderId, transaction);

                return {
                    paymentUrl: response.data.paymentUrl,
                    paymentId: response.data.paymentId,
                };
            } else {
                throw new Error(`PayHere error: ${response.data.msg}`);
            }
        } catch (error) {
            // keep stack but avoid unused var lint where error might be referenced in some environments
            void error;
            throw new Error(`Failed to create PayHere payment: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Verify PayHere notification
     * Called by PayHere webhook after payment
     */
    verifyNotification(notificationData: Record<string, unknown>): boolean {
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            sign
        } = notificationData;

        // Verify merchant ID
        if (merchant_id !== this.merchantId) {
            return false;
        }

        // Generate expected signature
        const md5String = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${this.merchantSecret}`;
        const expectedSign = crypto.createHash('md5').update(md5String).digest('hex').toUpperCase();

        return sign === expectedSign;
    }

    /**
     * Handle PayHere callback after payment
     */
    handleCallback(
        orderId: string,
        paymentId: string,
        statusCode: number,
        amount: number
    ): void {
        // amount parameter may be provided by downstream webhooks but isn't needed here yet
        void amount;
        const transaction = this.transactions.get(orderId);
        if (transaction) {
            if (statusCode === 2) {
                // Payment successful
                transaction.status = PaymentStatus.COMPLETED;
                transaction.completedAt = Date.now();
                transaction.metadata = { ...transaction.metadata, paymentId };
            } else if (statusCode === -1 || statusCode === -2) {
                // Payment failed
                transaction.status = PaymentStatus.FAILED;
            }
        }
    }

    /**
     * Generate PayHere checksum
     */
    private generateChecksum(merchantId: string, orderId: string, amount: number, secret: string): string {
        const md5String = `${merchantId}${orderId}${amount}${secret}`;
        return crypto.createHash('md5').update(md5String).digest('hex').toUpperCase();
    }

    /**
     * Get transaction by order ID
     */
    getTransaction(orderId: string): SriLankanPaymentTransaction | undefined {
        return this.transactions.get(orderId);
    }

    /**
     * Get all transactions
     */
    getAllTransactions(): SriLankanPaymentTransaction[] {
        return Array.from(this.transactions.values());
    }
}

/**
 * Wave Money Handler
 * Mobile money solution - SMS based payments
 */
export class WaveMoneyHandler {
    private apiKey: string;
    private apiInstance: AxiosInstance;
    private transactions: Map<string, SriLankanPaymentTransaction> = new Map();

    constructor(apiKey: string) {
        this.apiKey = apiKey;

        this.apiInstance = axios.create({
            baseURL: 'https://api.wavemoney.com.lk',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Create Wave Money payment request
     * @param amount Amount in LKR
     * @param phoneNumber Customer phone number
     * @param reference Payment reference
     * @param description Payment description
     */
    async createPaymentRequest(
        amount: number,
        phoneNumber: string,
        reference: string,
        description: string
    ): Promise<WaveMoneyResponse> {
        try {
            const response = await this.apiInstance.post('/payment/request', {
                amount,
                phone_number: phoneNumber,
                reference,
                description,
                return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/wavemoney/return`,
                notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wavemoney/notify`,
            });

            if (response.data.status === 'success') {
                const transaction: SriLankanPaymentTransaction = {
                    id: response.data.transactionId,
                    gateway: SriLankanGateway.WAVE_MONEY,
                    amount,
                    status: PaymentStatus.PENDING,
                    phoneNumber,
                    reference,
                    metadata: { transactionId: response.data.transactionId },
                    createdAt: Date.now(),
                };

                this.transactions.set(response.data.transactionId, transaction);

                return {
                    status: 'success',
                    transactionId: response.data.transactionId,
                    message: 'Payment request created successfully',
                    paymentUrl: response.data.paymentUrl,
                };
            } else {
                return {
                    status: 'error',
                    message: response.data.message || 'Failed to create payment request',
                };
            }
        } catch (error) {
            void error;
            throw new Error(`Wave Money error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check Wave Money payment status
     */
    async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
        try {
            const response = await this.apiInstance.get(`/payment/status/${transactionId}`);

            let status = PaymentStatus.PENDING;
            if (response.data.status === 'completed') {
                status = PaymentStatus.COMPLETED;
            } else if (response.data.status === 'failed') {
                status = PaymentStatus.FAILED;
            } else if (response.data.status === 'cancelled') {
                status = PaymentStatus.CANCELLED;
            }

            const transaction = this.transactions.get(transactionId);
            if (transaction) {
                transaction.status = status;
                if (status === PaymentStatus.COMPLETED) {
                    transaction.completedAt = Date.now();
                }
            }

            return status;
        } catch (error) {
            void error;
            throw new Error(`Failed to check Wave Money status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get transaction
     */
    getTransaction(transactionId: string): SriLankanPaymentTransaction | undefined {
        return this.transactions.get(transactionId);
    }
}

/**
 * Dialog eZ Cash Handler
 * Mobile money from Dialog Axiata
 */
export class DialogEzCashHandler {
    private apiKey: string;
    private apiInstance: AxiosInstance;
    private transactions: Map<string, SriLankanPaymentTransaction> = new Map();

    constructor(apiKey: string) {
        this.apiKey = apiKey;

        this.apiInstance = axios.create({
            baseURL: 'https://api.dialog-axiata.com/v1',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Charge Dialog eZ Cash account
     */
    async chargeAccount(
        phoneNumber: string,
        amount: number,
        reference: string,
        description: string
    ): Promise<SriLankanPaymentTransaction> {
        try {
            const response = await this.apiInstance.post('/charge', {
                phone: phoneNumber,
                amount,
                reference,
                description,
            });

            const transaction: SriLankanPaymentTransaction = {
                id: response.data.transactionId,
                gateway: SriLankanGateway.DIALOG_EZCASH,
                amount,
                status: response.data.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
                phoneNumber,
                reference,
                createdAt: Date.now(),
                completedAt: response.data.success ? Date.now() : undefined,
            };

            this.transactions.set(response.data.transactionId, transaction);
            return transaction;
        } catch (error) {
            throw new Error(`Dialog eZ Cash error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check balance
     */
    async checkBalance(phoneNumber: string): Promise<number> {
        try {
            const response = await this.apiInstance.get(`/balance/${phoneNumber}`);
            return response.data.balance;
        } catch (error) {
            throw new Error(`Failed to check balance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get transaction
     */
    getTransaction(transactionId: string): SriLankanPaymentTransaction | undefined {
        return this.transactions.get(transactionId);
    }
}

/**
 * Mobitel m-CASH Handler
 * Mobile money from Mobitel
 */
export class MobitelMCashHandler {
    private apiKey: string;
    private apiInstance: AxiosInstance;
    private transactions: Map<string, SriLankanPaymentTransaction> = new Map();

    constructor(apiKey: string) {
        this.apiKey = apiKey;

        this.apiInstance = axios.create({
            baseURL: 'https://api.mobitel-mcash.lk',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Create m-CASH payment
     */
    async createPayment(
        phoneNumber: string,
        amount: number,
        reference: string
    ): Promise<SriLankanPaymentTransaction> {
        try {
            const response = await this.apiInstance.post('/payment', {
                phone_number: phoneNumber,
                amount,
                reference,
                return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/mobitel/return`,
            });

            const transaction: SriLankanPaymentTransaction = {
                id: response.data.paymentId,
                gateway: SriLankanGateway.MOBITEL_MCASH,
                amount,
                status: PaymentStatus.PENDING,
                phoneNumber,
                reference,
                createdAt: Date.now(),
            };

            this.transactions.set(response.data.paymentId, transaction);
            return transaction;
        } catch (error) {
            void error;
            throw new Error(`Mobitel m-CASH error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Verify payment
     */
    async verifyPayment(paymentId: string): Promise<boolean> {
        try {
            const response = await this.apiInstance.get(`/payment/${paymentId}/verify`);
            const transaction = this.transactions.get(paymentId);
            if (transaction && response.data.verified) {
                transaction.status = PaymentStatus.COMPLETED;
                transaction.completedAt = Date.now();
            }
            return response.data.verified;
        } catch (error) {
            void error;
            return false;
        }
    }

    /**
     * Get transaction
     */
    getTransaction(paymentId: string): SriLankanPaymentTransaction | undefined {
        return this.transactions.get(paymentId);
    }
}

/**
 * Bank Transfer Handler
 * Direct bank transfers via local banks
 */
export class BankTransferHandler {
    private bankAccounts: Map<SriLankanBank, string> = new Map();
    private transactions: Map<string, SriLankanPaymentTransaction> = new Map();

    /**
     * Register bank account
     */
    registerBankAccount(bank: SriLankanBank, accountNumber: string): void {
        this.bankAccounts.set(bank, accountNumber);
    }

    /**
     * Get bank details for manual transfer
     */
    getBankDetails(bank: SriLankanBank): { bank: string; accountNumber: string } | null {
        const accountNumber = this.bankAccounts.get(bank);
        if (!accountNumber) {
            return null;
        }

        const bankNames: Record<SriLankanBank, string> = {
            [SriLankanBank.SAMPATH]: 'Sampath Bank',
            [SriLankanBank.COMMERCIAL]: 'Commercial Bank of Ceylon',
            [SriLankanBank.BOC]: 'Bank of Ceylon',
            [SriLankanBank.HNB]: 'Hatton National Bank',
            [SriLankanBank.SRILANKAN]: 'Sri Lankan Bank',
            [SriLankanBank.LOLC]: 'LOLC Finance',
        };

        return {
            bank: bankNames[bank],
            accountNumber,
        };
    }

    /**
     * Create manual transfer invoice
     */
    createTransferInvoice(
        orderId: string,
        amount: number,
        bank: SriLankanBank,
        customerEmail: string
    ): SriLankanPaymentTransaction {
        const transaction: SriLankanPaymentTransaction = {
            id: orderId,
            gateway: SriLankanGateway.BANK_TRANSFER,
            bank,
            amount,
            status: PaymentStatus.PENDING,
            bankAccountId: this.bankAccounts.get(bank),
            reference: `INV-${orderId}-${Date.now()}`,
            metadata: { customerEmail },
            createdAt: Date.now(),
        };

        this.transactions.set(orderId, transaction);
        return transaction;
    }

    /**
     * Mark transfer as verified
     */
    verifyTransfer(orderId: string, reference: string): void {
        const transaction = this.transactions.get(orderId);
        if (transaction) {
            transaction.status = PaymentStatus.COMPLETED;
            transaction.completedAt = Date.now();
            transaction.reference = reference;
        }
    }

    /**
     * Get transaction
     */
    getTransaction(orderId: string): SriLankanPaymentTransaction | undefined {
        return this.transactions.get(orderId);
    }

    /**
     * Get all registered banks
     */
    getRegisteredBanks(): { bank: SriLankanBank; accountNumber: string }[] {
        const banks: { bank: SriLankanBank; accountNumber: string }[] = [];
        this.bankAccounts.forEach((accountNumber, bank) => {
            banks.push({ bank, accountNumber });
        });
        return banks;
    }
}

/**
 * Cryptocurrency Handler (Optional)
 * Bitcoin, Ethereum, and other cryptocurrencies
 */
export class CryptoHandler {
    private transactions: Map<string, SriLankanPaymentTransaction> = new Map();

    /**
     * Create crypto payment address
     * Note: This would integrate with a service like Coinbase Commerce or BTCPay
     */
    async createPaymentAddress(
        orderId: string,
        amount: number, // In LKR (will be converted to crypto)
        cryptoType: 'BTC' | 'ETH' | 'USDC'
    ): Promise<{ address: string; conversionRate: number; cryptoAmount: number }> {
        // In production, this would call an actual crypto service
        const rates = {
            BTC: 6500000, // LKR per BTC (example)
            ETH: 250000, // LKR per ETH (example)
            USDC: 330, // LKR per USDC (example)
        };

        const rate = rates[cryptoType];
        const cryptoAmount = amount / rate;

        const transaction: SriLankanPaymentTransaction = {
            id: orderId,
            gateway: SriLankanGateway.CRYPTO,
            amount,
            status: PaymentStatus.PENDING,
            metadata: {
                cryptoType,
                cryptoAmount,
                conversionRate: rate,
            },
            createdAt: Date.now(),
        };

        this.transactions.set(orderId, transaction);

        return {
            address: `${cryptoType}_ADDRESS_${orderId}`, // Placeholder
            conversionRate: rate,
            cryptoAmount,
        };
    }

    /**
     * Get transaction
     */
    getTransaction(orderId: string): SriLankanPaymentTransaction | undefined {
        return this.transactions.get(orderId);
    }
}

/**
 * Master Sri Lankan Payment Handler
 * Coordinates all Sri Lankan payment methods
 */
export class SriLankanPaymentMaster {
    private payhere: PayHereHandler | null = null;
    private waveMoney: WaveMoneyHandler | null = null;
    private dialogEzCash: DialogEzCashHandler | null = null;
    private mobitelMCash: MobitelMCashHandler | null = null;
    private bankTransfer: BankTransferHandler;
    private crypto: CryptoHandler | null = null;

    constructor(config: {
        payhereMerchantId?: string;
        payhereMerchantSecret?: string;
        waveMoneyApiKey?: string;
        dialogEzCashApiKey?: string;
        mobitelMCashApiKey?: string;
        bankAccounts?: Record<SriLankanBank, string>;
    }) {
        if (config.payhereMerchantId && config.payhereMerchantSecret) {
            this.payhere = new PayHereHandler(config.payhereMerchantId, config.payhereMerchantSecret);
        }

        if (config.waveMoneyApiKey) {
            this.waveMoney = new WaveMoneyHandler(config.waveMoneyApiKey);
        }

        if (config.dialogEzCashApiKey) {
            this.dialogEzCash = new DialogEzCashHandler(config.dialogEzCashApiKey);
        }

        if (config.mobitelMCashApiKey) {
            this.mobitelMCash = new MobitelMCashHandler(config.mobitelMCashApiKey);
        }

        this.bankTransfer = new BankTransferHandler();
        if (config.bankAccounts) {
            Object.entries(config.bankAccounts).forEach(([bank, account]) => {
                this.bankTransfer.registerBankAccount(bank as SriLankanBank, account);
            });
        }

        this.crypto = new CryptoHandler();
    }

    /**
     * Get specific gateway
     */
    getPayHere(): PayHereHandler | null {
        return this.payhere;
    }

    getWaveMoney(): WaveMoneyHandler | null {
        return this.waveMoney;
    }

    getDialogEzCash(): DialogEzCashHandler | null {
        return this.dialogEzCash;
    }

    getMobitelMCash(): MobitelMCashHandler | null {
        return this.mobitelMCash;
    }

    getBankTransfer(): BankTransferHandler {
        return this.bankTransfer;
    }

    getCrypto(): CryptoHandler | null {
        return this.crypto;
    }

    /**
     * Get available gateways
     */
    getAvailableGateways(): SriLankanGateway[] {
        const gateways: SriLankanGateway[] = [];

        if (this.payhere) gateways.push(SriLankanGateway.PAYHERE);
        if (this.waveMoney) gateways.push(SriLankanGateway.WAVE_MONEY);
        if (this.dialogEzCash) gateways.push(SriLankanGateway.DIALOG_EZCASH);
        if (this.mobitelMCash) gateways.push(SriLankanGateway.MOBITEL_MCASH);
        gateways.push(SriLankanGateway.BANK_TRANSFER); // Always available
        if (this.crypto) gateways.push(SriLankanGateway.CRYPTO);

        return gateways;
    }
}

/**
 * Create master handler from environment variables
 * Only enables gateways that have their environment variables configured
 */
export function createSriLankanPaymentMaster(): SriLankanPaymentMaster {
    // Only include non-empty environment variables
    const config: Record<string, unknown> = {};

    // PayHere - requires both ID and secret
    if (process.env.PAYHERE_MERCHANT_ID?.trim() && process.env.PAYHERE_MERCHANT_SECRET?.trim()) {
        config.payhereMerchantId = process.env.PAYHERE_MERCHANT_ID;
        config.payhereMerchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    }

    // Wave Money
    if (process.env.WAVEMONEY_API_KEY?.trim()) {
        config.waveMoneyApiKey = process.env.WAVEMONEY_API_KEY;
    }

    // Dialog eZ Cash
    if (process.env.DIALOG_EZCASH_API_KEY?.trim()) {
        config.dialogEzCashApiKey = process.env.DIALOG_EZCASH_API_KEY;
    }

    // Mobitel m-CASH
    if (process.env.MOBITEL_MCASH_API_KEY?.trim()) {
        config.mobitelMCashApiKey = process.env.MOBITEL_MCASH_API_KEY;
    }

    // Bank Accounts - only include configured ones
    const bankAccounts: Record<string, string> = {};
    if (process.env.SAMPATH_ACCOUNT?.trim()) {
        bankAccounts[SriLankanBank.SAMPATH] = process.env.SAMPATH_ACCOUNT;
    }
    if (process.env.COMMERCIAL_ACCOUNT?.trim()) {
        bankAccounts[SriLankanBank.COMMERCIAL] = process.env.COMMERCIAL_ACCOUNT;
    }
    if (process.env.BOC_ACCOUNT?.trim()) {
        bankAccounts[SriLankanBank.BOC] = process.env.BOC_ACCOUNT;
    }
    if (process.env.HNB_ACCOUNT?.trim()) {
        bankAccounts[SriLankanBank.HNB] = process.env.HNB_ACCOUNT;
    }
    if (process.env.SRILANKAN_ACCOUNT?.trim()) {
        bankAccounts[SriLankanBank.SRILANKAN] = process.env.SRILANKAN_ACCOUNT;
    }
    if (process.env.LOLC_ACCOUNT?.trim()) {
        bankAccounts[SriLankanBank.LOLC] = process.env.LOLC_ACCOUNT;
    }

    if (Object.keys(bankAccounts).length > 0) {
        config.bankAccounts = bankAccounts;
    }

    return new SriLankanPaymentMaster(config);
}// Global instance
let masterInstance: SriLankanPaymentMaster | null = null;

/**
 * Get global instance
 */
export function getSriLankanPaymentMaster(): SriLankanPaymentMaster {
    if (!masterInstance) {
        masterInstance = createSriLankanPaymentMaster();
    }
    return masterInstance;
}
