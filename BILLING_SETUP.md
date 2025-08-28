# Billing & Subscription Setup Guide

This guide will help you set up the Stripe integration for billing and subscriptions in your WebTrigger application.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com) if you don't have one)
2. Your application should be running and accessible via HTTPS in production

## Step 1: Get Your Stripe Keys

1. Log in to your Stripe Dashboard
2. Go to **Developers** > **API Keys**
3. Copy your **Publishable key** and **Secret key**
4. For webhooks, you'll also need to create a webhook endpoint

## Step 2: Configure Environment Variables

Update your `.env` file with your Stripe keys:

```env
# Stripe configuration
STRIPE_SECRET_KEY="sk_test_your_actual_secret_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_actual_webhook_secret_here"
```

## Step 3: Set Up Stripe Products and Prices

You need to create products and prices in Stripe that match your subscription plans:

### Option A: Using Stripe Dashboard (Recommended)

1. Go to **Products** in your Stripe Dashboard
2. Create three products with the following details:

#### Starter Plan ($9.99/month)
- **Name**: Starter
- **Description**: Perfect for small projects and testing
- **Price**: $9.99 per month
- **API ID**: Copy this for the next step

#### Pro Plan ($29.99/month)
- **Name**: Pro
- **Description**: For growing businesses and teams
- **Price**: $29.99 per month
- **API ID**: Copy this for the next step

#### Admin Plan ($99.99/month)
- **Name**: Admin
- **Description**: Full access with administrative features
- **Price**: $99.99 per month
- **API ID**: Copy this for the next step

### Option B: Using Stripe CLI

If you prefer using the command line:

```bash
# Install Stripe CLI
# Follow instructions at: https://stripe.com/docs/stripe-cli

# Create products and prices
stripe products create --name="Starter" --description="Perfect for small projects and testing"
stripe products create --name="Pro" --description="For growing businesses and teams"
stripe products create --name="Admin" --description="Full access with administrative features"

# Create prices for each product (replace PRODUCT_ID with actual IDs)
stripe prices create --product=PRODUCT_ID --unit-amount=999 --currency=usd --interval=month
stripe prices create --product=PRODUCT_ID --unit-amount=2999 --currency=usd --interval=month
stripe prices create --product=PRODUCT_ID --unit-amount=9999 --currency=usd --interval=month
```

## Step 4: Update Database with Stripe Price IDs

1. After creating prices in Stripe, copy the Price IDs (they start with `price_`)
2. Update your `prisma/seed.ts` file with the actual Price IDs:

```typescript
// Replace the stripePriceId values with your actual Stripe Price IDs
starterPlan = await prisma.subscriptionPlan.upsert({
  // ... other fields
  create: {
    // ... other fields
    stripePriceId: 'price_your_actual_starter_price_id', // Replace this
  },
});

// Do the same for proPlan and adminPlan
```

3. Run the seed script again:

```bash
npm run db:seed
```

## Step 5: Set Up Webhooks

Webhooks are crucial for handling subscription events like successful payments, failed payments, and cancellations.

### Using Stripe Dashboard

1. Go to **Developers** > **Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/payments/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** and add it to your `.env` file

### Using Stripe CLI (for local development)

```bash
# Forward webhooks to your local development server
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## Step 6: Test the Integration

### Test Cards

Use these test card numbers to test your integration:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Testing Flow

1. Sign up for a new account (will default to Pro plan)
2. Go to **Billing** page
3. Click **Subscribe** on any plan
4. Use test card details in Stripe Checkout
5. Complete the payment
6. Verify the subscription is created in your database
7. Test the customer portal by clicking **Manage Billing**

## Step 7: Production Deployment

### Environment Setup

1. Ensure your production environment has HTTPS enabled
2. Update all webhook URLs to use your production domain
3. Use live Stripe keys instead of test keys
4. Update the webhook endpoint in Stripe Dashboard with production URL

### Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Environment Variables**: Never commit real API keys to version control
3. **HTTPS Only**: Webhooks should only be sent over HTTPS
4. **Rate Limiting**: Consider implementing rate limiting on webhook endpoints

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
   - Check that the webhook secret matches the endpoint

2. **Payment session creation fails**
   - Verify `STRIPE_SECRET_KEY` is correct
   - Check that the plan IDs exist in your database
   - Ensure the success/cancel URLs are valid

3. **Subscription not created after payment**
   - Check webhook delivery in Stripe Dashboard
   - Verify the webhook endpoint is working
   - Check application logs for errors

### Debug Mode

Enable debug logging by adding this to your environment:

```env
STRIPE_DEBUG=true
```

## Support

If you encounter issues:

1. Check the Stripe Dashboard for error logs
2. Review your application logs
3. Test with Stripe's test mode first
4. Refer to Stripe's documentation: https://stripe.com/docs

## Features Included

- ✅ Multiple subscription plans (Free, Starter, Pro, Admin)
- ✅ Stripe Checkout integration
- ✅ Customer Portal for billing management
- ✅ Webhook handling for subscription events
- ✅ Automatic user role updates based on subscription
- ✅ Beta period: All new users default to Pro plan
- ✅ Modern billing UI with usage statistics
- ✅ Subscription status tracking
- ✅ Payment method management

Your billing system is now ready! Users can subscribe to plans, manage their billing through the customer portal, and you'll receive real-time updates via webhooks.
