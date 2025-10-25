/**
 * Donation Tier Manager
 * Manages donation tiers for different platforms
 */

export interface DonationTier {
    id: string;
    name: string;
    amount: number;
    currency: string;
    description: string;
    benefits: string[];
    platform?: string; // stripe, paypal, razorpay, etc
    metadata?: Record<string, any>;
}

/**
 * Predefined donation tiers
 */
export const DEFAULT_DONATION_TIERS: DonationTier[] = [
    {
        id: 'coffee',
        name: 'Buy me a Coffee',
        amount: 5,
        currency: 'USD',
        description: 'Support with a small donation',
        benefits: ['Thank you message', 'Listed as a supporter'],
    },
    {
        id: 'pizza',
        name: 'Buy me a Pizza',
        amount: 15,
        currency: 'USD',
        description: 'Support with a medium donation',
        benefits: ['Thank you message', 'Listed as a major supporter', 'Monthly newsletter'],
    },
    {
        id: 'meal',
        name: 'Buy me a Meal',
        amount: 25,
        currency: 'USD',
        description: 'Support with a generous donation',
        benefits: [
            'Thank you message',
            'Listed as a major supporter',
            'Monthly newsletter',
            'Email support',
        ],
    },
    {
        id: 'monthly',
        name: 'Monthly Supporter',
        amount: 10,
        currency: 'USD',
        description: 'Recurring monthly support',
        benefits: [
            'Monthly thank you',
            'Early access to new features',
            'Priority support',
            'Exclusive content',
        ],
    },
    {
        id: 'yearly',
        name: 'Yearly Supporter',
        amount: 100,
        currency: 'USD',
        description: 'Yearly support membership',
        benefits: [
            'Annual thank you',
            'Lifetime early access',
            'Priority support',
            'Exclusive content',
            'Custom feature request',
        ],
    },
];

/**
 * Donation Tier Manager class
 */
export class DonationTierManager {
    private tiers: Map<string, DonationTier> = new Map();

    constructor(initialTiers: DonationTier[] = DEFAULT_DONATION_TIERS) {
        initialTiers.forEach((tier) => {
            this.tiers.set(tier.id, tier);
        });
    }

    /**
     * Get all tiers
     */
    getAllTiers(): DonationTier[] {
        return Array.from(this.tiers.values());
    }

    /**
     * Get tier by ID
     */
    getTier(id: string): DonationTier | undefined {
        return this.tiers.get(id);
    }

    /**
     * Get tiers by currency
     */
    getTiersByCurrency(currency: string): DonationTier[] {
        return Array.from(this.tiers.values()).filter((tier) => tier.currency === currency);
    }

    /**
     * Add a new tier
     */
    addTier(tier: DonationTier): void {
        this.tiers.set(tier.id, tier);
    }

    /**
     * Update tier
     */
    updateTier(id: string, updates: Partial<DonationTier>): void {
        const tier = this.tiers.get(id);
        if (tier) {
            this.tiers.set(id, { ...tier, ...updates, id });
        }
    }

    /**
     * Delete tier
     */
    deleteTier(id: string): void {
        this.tiers.delete(id);
    }

    /**
     * Get tiers sorted by amount
     */
    getTiersSortedByAmount(): DonationTier[] {
        return Array.from(this.tiers.values()).sort((a, b) => a.amount - b.amount);
    }

    /**
     * Format amount for display
     */
    formatAmount(tier: DonationTier): string {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: tier.currency,
        });
        return formatter.format(tier.amount);
    }

    /**
     * Get tier by amount
     */
    getTierByAmount(amount: number, currency: string): DonationTier | undefined {
        return Array.from(this.tiers.values()).find(
            (tier) => tier.amount === amount && tier.currency === currency
        );
    }

    /**
     * Create HTML option elements for dropdown
     */
    createHTMLOptions(): string {
        return this.getTiersSortedByAmount()
            .map(
                (tier) =>
                    `<option value="${tier.id}">${tier.name} - ${this.formatAmount(tier)}</option>`
            )
            .join('\n');
    }
}

// Global tier manager instance
let tierManagerInstance: DonationTierManager | null = null;

/**
 * Get global donation tier manager
 */
export function getDonationTierManager(): DonationTierManager {
    if (!tierManagerInstance) {
        tierManagerInstance = new DonationTierManager();
    }
    return tierManagerInstance;
}

/**
 * Reset tier manager (for testing)
 */
export function resetDonationTierManager(): void {
    tierManagerInstance = null;
}
