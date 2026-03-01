# Stripe Integration — Wave 2 ZapCRM

## Prerequisites

- Stripe account (https://stripe.com)
- Stripe CLI installed

## 1. Create Stripe Account

1. Go to https://dashboard.stripe.com
2. Create account
3. Get API keys:
   - Publishable key (pk_test_*)
   - Secret key (sk_test_*)

## 2. Configure Environment

Update `.env`:
```
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Local Development

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Listen for webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy webhook secret to .env
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## 4. Webhook Events

Setup webhooks for:
- `customer.created`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.completed`
- `charge.failed`

## 5. Production Deployment

1. Create production API keys in Stripe dashboard
2. Update GitHub secrets:
   - `STRIPE_PUBLIC_KEY` (production)
   - `STRIPE_SECRET_KEY` (production)
   - `STRIPE_WEBHOOK_SECRET` (production)
3. Deploy webhook endpoint to production
4. Configure Stripe dashboard webhooks to production URL

## Testing

Use Stripe test cards:
- `4242 4242 4242 4242` — Success
- `4000 0000 0000 0002` — Card declined

[See Stripe test cards](https://stripe.com/docs/testing)
