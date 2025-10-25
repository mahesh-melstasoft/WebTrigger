/**
 * Sri Lankan Donation Tiers
 * Currency: LKR (Sri Lankan Rupees)
 * Approximate USD conversions at 1 USD = 330 LKR
 */

/**
 * Donation Tier
 */
export interface DonationTier {
    id: string;
    nameEn: string;
    nameSi?: string; // Sinhala name
    amount: number; // In LKR
    amountUSD?: number; // For reference
    description: string;
    descriptionSi?: string;
    icon?: string;
    color?: string;
    benefits: string[];
    benefitsSi?: string[];
    isRecurring?: boolean;
    frequency?: 'monthly' | 'yearly'; // For recurring tiers
}

/**
 * Default Sri Lankan Donation Tiers in LKR
 */
export const DEFAULT_SRI_LANKAN_TIERS: DonationTier[] = [
    {
        id: 'tea-break',
        nameEn: '☕ Tea Break',
        nameSi: '☕ තේ බිම්බ',
        amount: 500, // ~$1.50
        amountUSD: 1.5,
        description: 'Buy me a cup of Sri Lankan tea',
        descriptionSi: 'මට ශ්‍රී ලංකා තේ කෝපයක් දෙන්න',
        icon: '☕',
        color: '#8B7355',
        benefits: ['Thank you message', 'Listed as supporter'],
        benefitsSi: ['ස්තුතිවන්ත සිටිවීම', 'සහায়කයා ලෙස ලැයිස්ට කිරීම'],
    },
    {
        id: 'breakfast',
        nameEn: '🥞 Breakfast',
        nameSi: '🥞 උදෑසන ආහාර',
        amount: 1500, // ~$4.50
        amountUSD: 4.5,
        description: 'Support with a local breakfast meal',
        descriptionSi: 'දේශීය උදෑසන ආහාරයකින් සහාය දෙන්න',
        icon: '🥞',
        color: '#DAA520',
        benefits: [
            'Thank you message',
            'Listed as supporter',
            'Early access to new features',
        ],
        benefitsSi: [
            'ස්තුතිවන්ත සිටිවීම',
            'සහායකයා ලෙස ලැයිස්ට කිරීම',
            'නව විශේෂාංග වලට මුල් ප්‍රවේශය',
        ],
    },
    {
        id: 'lunch',
        nameEn: '🍛 Lunch',
        nameSi: '🍛 භෝජනය',
        amount: 3000, // ~$9
        amountUSD: 9,
        description: 'Buy me a delicious Sri Lankan lunch',
        descriptionSi: 'මට 맛있는ශ්‍රී ලංකා භෝජනයක් දෙන්න',
        icon: '🍛',
        color: '#FF6347',
        benefits: [
            'Thank you message',
            'Listed as supporter (with link)',
            'Early access to new features',
            'Monthly supporter badge',
        ],
        benefitsSi: [
            'ස්තුතිවන්ත සිටිවීම',
            'සහායකයා ලෙස ලැයිස්ට කිරීම (සබැඳි සහිතව)',
            'නව විශේෂාංග වලට මුල් ප්‍රවේශය',
            'මාසික සහායක බිම්බය',
        ],
    },
    {
        id: 'dinner',
        nameEn: '🍲 Dinner',
        nameSi: '🍲 රාතු ආහාර',
        amount: 5000, // ~$15
        amountUSD: 15,
        description: 'Sponsor me a full Sri Lankan dinner',
        descriptionSi: 'මට සම්පූර්ණ ශ්‍රී ලංකා රාතු ආහාරයක් ස්පොන්සරකරන්න',
        icon: '🍲',
        color: '#FF4500',
        benefits: [
            'Thank you message',
            'Listed as sponsor (with link and logo)',
            'Early access to new features',
            'Monthly sponsor badge',
            'Direct message access (monthly)',
        ],
        benefitsSi: [
            'ස්තුතිවන්ත සිටිවීම',
            'ස්පොන්සර ලෙස ලැයිස්ට කිරීම (සබැඳි සහ ලාංඡනය සහිතව)',
            'නව විශේෂාංග වලට මුල් ප්‍රවේශය',
            'මාසික ස්පොන්සර බිම්බය',
            'සෘජු පණිවුඩ ප්‍රවේශය (මාසික)',
        ],
    },
];

/**
 * Monthly Recurring Tier
 */
export const MONTHLY_SUPPORTER_TIER: DonationTier = {
    id: 'monthly-supporter',
    nameEn: '💚 Monthly Supporter',
    nameSi: '💚 මාසික සහායක',
    amount: 5000, // ~$15/month
    amountUSD: 15,
    description: 'Support me with a monthly subscription',
    descriptionSi: 'මාසික ග්‍රහණයෙන් මට සහාය දෙන්න',
    icon: '💚',
    color: '#00AA00',
    isRecurring: true,
    frequency: 'monthly',
    benefits: [
        'All benefits above',
        'Exclusive monthly updates',
        'Discord server access',
        'Custom feature requests',
        'Logo on website',
    ],
    benefitsSi: [
        'ඉහත සියලු ප්‍රතිලාභ',
        'අනන්‍ය මාසික යාවත්කාල කිරීම්',
        'Discord සේවාදායක ප්‍රවේශය',
        'අභිරුචි විශේෂාංග ඉල්ලීම්',
        'වෙබ් අඩවිය මත ලාංඡනය',
    ],
};

/**
 * Yearly Recurring Tier
 */
export const YEARLY_SUPPORTER_TIER: DonationTier = {
    id: 'yearly-supporter',
    nameEn: '🏆 Yearly Supporter',
    nameSi: '🏆 වාර්ෂික සහායක',
    amount: 50000, // ~$150/year
    amountUSD: 150,
    description: 'Support me yearly and be an elite sponsor',
    descriptionSi: 'වසරකට එක්වරම සහාය දෙන්න සහ එක්සත්‍ර ස්පොන්සර වන්න',
    icon: '🏆',
    color: '#FFD700',
    isRecurring: true,
    frequency: 'yearly',
    benefits: [
        'All monthly benefits',
        'Lifetime supporter status',
        'Private consulting calls (quarterly)',
        'Priority support channel',
        'Dedicated thank you video',
        'Featured in hall of fame',
        'Free early access to all products',
    ],
    benefitsSi: [
        'සියලු මාසික ප්‍රතිලාභ',
        'ජීවිතකാල සහායක තත්ත්වය',
        'පෞද්ගලික උපදේශන ඇමතුම් (ත්‍රෛමාසික)',
        'ප්‍රাथමිකතා සහාය චానල',
        'ඉතිරි කරන ලද තෙවි වීඩියෝ',
        'කිරිසිතකරණ ශ්‍රී සටහනේ එක්ස්ත්‍ර කිරීම',
        'සියලු නිෂ්පාදනවලට නිර්වචනය වැඩිම ප්‍රවේශය',
    ],
};

/**
 * Special Occasion Tier
 */
export const SPECIAL_OCCASION_TIER: DonationTier = {
    id: 'special-occasion',
    nameEn: '🎉 Special Occasion',
    nameSi: '🎉 විශේෂ අවස්තා',
    amount: 10000, // ~$30 (for special events)
    amountUSD: 30,
    description: 'Support for special occasions or projects',
    descriptionSi: 'විශේෂ අවස්තා හෝ ව්‍යාපෘති සඳහා සහාය',
    icon: '🎉',
    color: '#FF1493',
    benefits: [
        'Premium supporter status',
        'Special thank you from team',
        'Mentioned in newsletter',
        'Custom project support',
    ],
    benefitsSi: [
        'ප්‍රිමියම් සහායක තත්ත්වය',
        'කණ්ඩායමෙන් විශේෂ ස්තුතිවන්තතා',
        'පුවත්පතෙහි සඳහන් කිරීම',
        'අභිරුචි ව්‍යාපෘති සහාය',
    ],
};

/**
 * Donation Tier Manager for Sri Lanka
 */
export class SriLankanDonationTierManager {
    private tiers: Map<string, DonationTier> = new Map();
    private customTiers: DonationTier[] = [];

    constructor(defaultTiers?: DonationTier[]) {
        const tiersToUse = defaultTiers || [
            ...DEFAULT_SRI_LANKAN_TIERS,
            MONTHLY_SUPPORTER_TIER,
            YEARLY_SUPPORTER_TIER,
            SPECIAL_OCCASION_TIER,
        ];

        tiersToUse.forEach((tier) => {
            this.tiers.set(tier.id, tier);
        });
    }

    /**
     * Get tier by ID
     */
    getTier(id: string): DonationTier | undefined {
        return this.tiers.get(id);
    }

    /**
     * Get all tiers
     */
    getAllTiers(language: 'en' | 'si' = 'en'): DonationTier[] {
        const tiers = Array.from(this.tiers.values());
        return this.sortByAmount(tiers);
    }

    /**
     * Get only one-time tiers
     */
    getOneTimeTiers(language: 'en' | 'si' = 'en'): DonationTier[] {
        return this.getAllTiers(language).filter((t) => !t.isRecurring);
    }

    /**
     * Get only recurring tiers
     */
    getRecurringTiers(language: 'en' | 'si' = 'en'): DonationTier[] {
        return this.getAllTiers(language).filter((t) => t.isRecurring);
    }

    /**
     * Add custom tier
     */
    addCustomTier(tier: DonationTier): void {
        this.tiers.set(tier.id, tier);
        this.customTiers.push(tier);
    }

    /**
     * Update tier
     */
    updateTier(id: string, updates: Partial<DonationTier>): void {
        const tier = this.tiers.get(id);
        if (tier) {
            Object.assign(tier, updates);
        }
    }

    /**
     * Remove tier
     */
    removeTier(id: string): void {
        this.tiers.delete(id);
        this.customTiers = this.customTiers.filter((t) => t.id !== id);
    }

    /**
     * Sort tiers by amount
     */
    private sortByAmount(tiers: DonationTier[]): DonationTier[] {
        return tiers.sort((a, b) => a.amount - b.amount);
    }

    /**
     * Get tier name in specified language
     */
    getTierName(id: string, language: 'en' | 'si' = 'en'): string {
        const tier = this.tiers.get(id);
        if (!tier) return '';
        return language === 'si' && tier.nameSi ? tier.nameSi : tier.nameEn;
    }

    /**
     * Format tier for HTML display
     */
    formatTierAsHTML(tier: DonationTier, language: 'en' | 'si' = 'en'): string {
        const name = language === 'si' && tier.nameSi ? tier.nameSi : tier.nameEn;
        const description =
            language === 'si' && tier.descriptionSi ? tier.descriptionSi : tier.description;
        const benefits = language === 'si' && tier.benefitsSi ? tier.benefitsSi : tier.benefits;

        return `
      <div class="tier-card" style="border-color: ${tier.color || '#ccc'}">
        <div class="tier-header" style="background-color: ${tier.color || '#f0f0f0'}">
          <h3>${name}</h3>
          <p class="price">LKR ${tier.amount.toLocaleString()}</p>
          ${tier.amountUSD ? `<p class="price-usd">≈ $${tier.amountUSD}</p>` : ''}
        </div>
        <div class="tier-content">
          <p>${description}</p>
          <ul class="benefits">
            ${benefits.map((b) => `<li>${b}</li>`).join('')}
          </ul>
          ${tier.isRecurring ? `<p class="recurring">${tier.frequency === 'monthly' ? 'Monthly' : 'Yearly'}</p>` : ''}
        </div>
      </div>
    `;
    }

    /**
     * Get tier with USD conversion
     */
    getTierWithUSD(id: string, exchangeRate: number = 330): DonationTier | undefined {
        const tier = this.tiers.get(id);
        if (!tier) return undefined;
        return {
            ...tier,
            amountUSD: tier.amount / exchangeRate,
        };
    }

    /**
     * Convert LKR to USD
     */
    convertToUSD(lkr: number, exchangeRate: number = 330): number {
        return lkr / exchangeRate;
    }

    /**
     * Convert USD to LKR
     */
    convertToLKR(usd: number, exchangeRate: number = 330): number {
        return usd * exchangeRate;
    }

    /**
     * Get tiers grouped by currency
     */
    getTiersGroupedByCurrency(): {
        lkr: DonationTier[];
        usd: DonationTier[];
    } {
        const tiers = this.getAllTiers();
        return {
            lkr: tiers,
            usd: tiers.map((t) => ({
                ...t,
                amount: this.convertToUSD(t.amount),
            })),
        };
    }

    /**
     * Get suggested tier for amount
     */
    getSuggestedTier(amount: number): DonationTier | undefined {
        const allTiers = this.getAllTiers();
        let suggested = allTiers[0];

        for (const tier of allTiers) {
            if (Math.abs(tier.amount - amount) < Math.abs(suggested.amount - amount)) {
                suggested = tier;
            }
        }

        return suggested;
    }

    /**
     * Get HTML formatted list of all tiers
     */
    getAllTiersAsHTML(language: 'en' | 'si' = 'en'): string {
        const tiers = this.getAllTiers(language);
        return `
      <div class="tiers-container">
        ${tiers.map((tier) => this.formatTierAsHTML(tier, language)).join('')}
      </div>
    `;
    }
}

/**
 * Create default Sri Lankan tier manager
 */
export function createSriLankanTierManager(): SriLankanDonationTierManager {
    return new SriLankanDonationTierManager();
}

// Global instance
let tierManagerInstance: SriLankanDonationTierManager | null = null;

/**
 * Get global tier manager instance
 */
export function getSriLankanTierManager(): SriLankanDonationTierManager {
    if (!tierManagerInstance) {
        tierManagerInstance = createSriLankanTierManager();
    }
    return tierManagerInstance;
}
