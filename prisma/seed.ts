import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding subscription plans...');

    // Create Starter plan
    const starterPlan = await prisma.subscriptionPlan.upsert({
        where: { name: 'Starter' },
        update: {},
        create: {
            name: 'Starter',
            description: 'Perfect for small projects and testing',
            price: 9.99,
            currency: 'USD',
            interval: 'month',
            maxTriggers: 50,
            maxTimeoutDuration: 30000,
            features: ['Advanced webhook triggers', 'Enhanced logging', 'Email support', 'Custom timeouts'],
            stripePriceId: 'price_starter_plan', // This should be replaced with actual Stripe price ID
        },
    });

    // Create Pro plan
    const proPlan = await prisma.subscriptionPlan.upsert({
        where: { name: 'Pro' },
        update: {},
        create: {
            name: 'Pro',
            description: 'For growing businesses and teams',
            price: 29.99,
            currency: 'USD',
            interval: 'month',
            maxTriggers: 500,
            maxTimeoutDuration: 60000,
            features: ['Unlimited webhook triggers', 'Advanced analytics', 'Priority support', 'Custom integrations'],
            stripePriceId: 'price_pro_plan', // This should be replaced with actual Stripe price ID
        },
    });

    // Create Admin plan
    const adminPlan = await prisma.subscriptionPlan.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Full access with administrative features',
            price: 99.99,
            currency: 'USD',
            interval: 'month',
            maxTriggers: -1, // Unlimited
            maxTimeoutDuration: 120000,
            features: ['All Pro features', 'User management', 'Admin dashboard', 'Custom reports', 'White-label options'],
            stripePriceId: 'price_admin_plan', // This should be replaced with actual Stripe price ID
        },
    });

    console.log('Subscription plans seeded successfully:', {
        starter: starterPlan.id,
        pro: proPlan.id,
        admin: adminPlan.id,
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
