/**
 * Payment Gateway Configuration Helper
 * Automatically enables/disables gateways based on environment variables
 */

/**
 * Check if environment variable is configured (not empty/blank)
 */
function isConfigured(value: string | undefined): boolean {
    return Boolean(value && value.trim() !== '');
}

/**
 * Payment Gateway Configuration Status
 */
export interface GatewayConfigStatus {
    payhere: boolean;
    waveMoney: boolean;
    dialogEzCash: boolean;
    mobitelMCash: boolean;
    bankTransfer: boolean;
    crypto: boolean;
}

/**
 * Get configuration status for all Sri Lankan payment gateways
 * Returns which gateways are enabled based on environment variables
 */
export function getSriLankanGatewayStatus(): GatewayConfigStatus {
    return {
        payhere:
            isConfigured(process.env.PAYHERE_MERCHANT_ID) &&
            isConfigured(process.env.PAYHERE_MERCHANT_SECRET),
        waveMoney: isConfigured(process.env.WAVEMONEY_API_KEY),
        dialogEzCash: isConfigured(process.env.DIALOG_EZCASH_API_KEY),
        mobitelMCash: isConfigured(process.env.MOBITEL_MCASH_API_KEY),
        bankTransfer:
            isConfigured(process.env.SAMPATH_ACCOUNT) ||
            isConfigured(process.env.COMMERCIAL_ACCOUNT) ||
            isConfigured(process.env.BOC_ACCOUNT) ||
            isConfigured(process.env.HNB_ACCOUNT) ||
            isConfigured(process.env.SRILANKAN_ACCOUNT) ||
            isConfigured(process.env.LOLC_ACCOUNT),
        crypto: true, // Crypto doesn't require external API keys (just for demo)
    };
}

/**
 * Get list of enabled gateway names
 */
export function getEnabledGateways(): string[] {
    const status = getSriLankanGatewayStatus();
    const enabled: string[] = [];

    if (status.payhere) enabled.push('PayHere');
    if (status.waveMoney) enabled.push('Wave Money');
    if (status.dialogEzCash) enabled.push('Dialog eZ Cash');
    if (status.mobitelMCash) enabled.push('Mobitel m-CASH');
    if (status.bankTransfer) enabled.push('Bank Transfer');
    if (status.crypto) enabled.push('Cryptocurrency');

    return enabled;
}

/**
 * Get list of disabled gateway names (for configuration warnings)
 */
export function getDisabledGateways(): string[] {
    const status = getSriLankanGatewayStatus();
    const disabled: string[] = [];

    if (!status.payhere) disabled.push('PayHere');
    if (!status.waveMoney) disabled.push('Wave Money');
    if (!status.dialogEzCash) disabled.push('Dialog eZ Cash');
    if (!status.mobitelMCash) disabled.push('Mobitel m-CASH');
    if (!status.bankTransfer) disabled.push('Bank Transfer');
    if (!status.crypto) disabled.push('Cryptocurrency');

    return disabled;
}

/**
 * Check if any Sri Lankan gateways are configured
 */
export function isAnySriLankanGatewayConfigured(): boolean {
    const enabled = getEnabledGateways();
    return enabled.length > 0;
}

/**
 * Log configuration status (useful for debugging)
 */
export function logGatewayConfigStatus(): void {
    const enabled = getEnabledGateways();
    const disabled = getDisabledGateways();

    console.log('🇱🇰 Sri Lankan Payment Gateways Status:');
    console.log(`✅ Enabled (${enabled.length}):`, enabled.join(', ') || 'None');
    console.log(`❌ Disabled (${disabled.length}):`, disabled.join(', ') || 'None');
}

/**
 * Validate gateway configuration with detailed report
 */
export function validateGatewayConfiguration(): {
    isValid: boolean;
    report: string;
} {
    const status = getSriLankanGatewayStatus();
    const enabled = getEnabledGateways();

    if (enabled.length === 0) {
        return {
            isValid: false,
            report:
                'No payment gateways configured. Please set environment variables for at least one gateway.',
        };
    }

    if (!status.payhere) {
        return {
            isValid: true,
            report:
                'PayHere not configured. Set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET to enable it.',
        };
    }

    return {
        isValid: true,
        report: `${enabled.length} payment gateway(s) configured: ${enabled.join(', ')}`,
    };
}

/**
 * Get PayHere configuration if enabled, otherwise null
 */
export function getPayHereConfig(): {
    merchantId: string;
    merchantSecret: string;
} | null {
    if (
        !isConfigured(process.env.PAYHERE_MERCHANT_ID) ||
        !isConfigured(process.env.PAYHERE_MERCHANT_SECRET)
    ) {
        return null;
    }

    return {
        merchantId: process.env.PAYHERE_MERCHANT_ID!,
        merchantSecret: process.env.PAYHERE_MERCHANT_SECRET!,
    };
}

/**
 * Get Wave Money configuration if enabled, otherwise null
 */
export function getWaveMoneyConfig(): { apiKey: string } | null {
    if (!isConfigured(process.env.WAVEMONEY_API_KEY)) {
        return null;
    }

    return {
        apiKey: process.env.WAVEMONEY_API_KEY!,
    };
}

/**
 * Get Dialog eZ Cash configuration if enabled, otherwise null
 */
export function getDialogEzCashConfig(): { apiKey: string } | null {
    if (!isConfigured(process.env.DIALOG_EZCASH_API_KEY)) {
        return null;
    }

    return {
        apiKey: process.env.DIALOG_EZCASH_API_KEY!,
    };
}

/**
 * Get Mobitel m-CASH configuration if enabled, otherwise null
 */
export function getMobitelMCashConfig(): { apiKey: string } | null {
    if (!isConfigured(process.env.MOBITEL_MCASH_API_KEY)) {
        return null;
    }

    return {
        apiKey: process.env.MOBITEL_MCASH_API_KEY!,
    };
}

/**
 * Get bank accounts configuration if any are enabled
 */
export function getBankAccountsConfig(): Record<string, string> | null {
    const accounts: Record<string, string> = {};

    if (isConfigured(process.env.SAMPATH_ACCOUNT)) {
        accounts['SAMPATH'] = process.env.SAMPATH_ACCOUNT!;
    }
    if (isConfigured(process.env.COMMERCIAL_ACCOUNT)) {
        accounts['COMMERCIAL'] = process.env.COMMERCIAL_ACCOUNT!;
    }
    if (isConfigured(process.env.BOC_ACCOUNT)) {
        accounts['BOC'] = process.env.BOC_ACCOUNT!;
    }
    if (isConfigured(process.env.HNB_ACCOUNT)) {
        accounts['HNB'] = process.env.HNB_ACCOUNT!;
    }
    if (isConfigured(process.env.SRILANKAN_ACCOUNT)) {
        accounts['SRILANKAN'] = process.env.SRILANKAN_ACCOUNT!;
    }
    if (isConfigured(process.env.LOLC_ACCOUNT)) {
        accounts['LOLC'] = process.env.LOLC_ACCOUNT!;
    }

    return Object.keys(accounts).length > 0 ? accounts : null;
}

/**
 * Update Sri Lankan Payment Master with only enabled gateways
 * Call this during application initialization
 */
export function initializeSriLankanPaymentWithConfig() {
    const status = getSriLankanGatewayStatus();
    const config: any = {};

    // Only add configuration if gateway is enabled
    if (status.payhere) {
        const payhere = getPayHereConfig();
        if (payhere) {
            config.payhereMerchantId = payhere.merchantId;
            config.payhereMerchantSecret = payhere.merchantSecret;
        }
    }

    if (status.waveMoney) {
        const waveMoney = getWaveMoneyConfig();
        if (waveMoney) {
            config.waveMoneyApiKey = waveMoney.apiKey;
        }
    }

    if (status.dialogEzCash) {
        const dialog = getDialogEzCashConfig();
        if (dialog) {
            config.dialogEzCashApiKey = dialog.apiKey;
        }
    }

    if (status.mobitelMCash) {
        const mobitel = getMobitelMCashConfig();
        if (mobitel) {
            config.mobitelMCashApiKey = mobitel.apiKey;
        }
    }

    if (status.bankTransfer) {
        const banks = getBankAccountsConfig();
        if (banks) {
            config.bankAccounts = {};
            if (banks.SAMPATH) config.bankAccounts['sampath'] = banks.SAMPATH;
            if (banks.COMMERCIAL) config.bankAccounts['commercial'] = banks.COMMERCIAL;
            if (banks.BOC) config.bankAccounts['boc'] = banks.BOC;
            if (banks.HNB) config.bankAccounts['hnb'] = banks.HNB;
            if (banks.SRILANKAN) config.bankAccounts['srilankan'] = banks.SRILANKAN;
            if (banks.LOLC) config.bankAccounts['lolc'] = banks.LOLC;
        }
    }

    return config;
}

/**
 * Middleware/hook to log gateway status on application start
 * Call this in your app initialization
 */
export function initializePaymentGatewayLogging() {
    if (process.env.NODE_ENV !== 'test') {
        logGatewayConfigStatus();
        const { isValid, report } = validateGatewayConfiguration();
        if (!isValid) {
            console.warn('⚠️ Warning:', report);
        } else {
            console.log('✅', report);
        }
    }
}
