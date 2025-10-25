// Type declarations for paypal-rest-sdk
declare module 'paypal-rest-sdk' {
    interface ConfigureOptions {
        mode: 'sandbox' | 'live';
        client_id: string;
        client_secret: string;
    }

    interface PayerInfo {
        email: string;
        first_name?: string;
        last_name?: string;
    }

    interface Amount {
        total: string;
        currency: string;
        details?: {
            subtotal: string;
            tax?: string;
            shipping?: string;
        };
    }

    interface Transaction {
        amount: Amount;
        description?: string;
        invoice_number?: string;
    }

    interface PaymentDetails {
        intent: 'sale' | 'authorize';
        payer: {
            payment_method: string;
            payer_info?: PayerInfo;
        };
        redirect_urls: {
            return_url: string;
            cancel_url: string;
        };
        transactions: Transaction[];
    }

    interface PaymentLink {
        rel: string;
        href: string;
    }

    interface Payment {
        id: string;
        state: string;
        links: PaymentLink[];
        payer: {
            payer_info: PayerInfo;
        };
        transactions: Transaction[];
    }

    export function configure(options: ConfigureOptions): void;

    export namespace payment {
        function create(
            details: PaymentDetails,
            callback: (error: Error | null, payment: Payment) => void
        ): void;

        function execute(
            paymentId: string,
            executionDetails: { payer_id: string },
            callback: (error: Error | null, payment: Payment) => void
        ): void;
    }
}
