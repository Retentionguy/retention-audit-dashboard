/**
 * Stripe payment integration (P0.2 from spec).
 * Replaces the demo doPurchase() function with real Stripe Checkout.
 *
 * Setup steps:
 * 1. Create a Stripe account at https://stripe.com
 * 2. Create products/prices in the Stripe dashboard for each plan
 * 3. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env.local
 * 4. Add price IDs to .env.local (see .env.example)
 * 5. npm install stripe
 *
 * Stripe Price IDs to create (add to .env.local after creating in Stripe dashboard):
 * STRIPE_PRICE_CREDITS_1=price_...
 * STRIPE_PRICE_CREDITS_3=price_...
 * STRIPE_PRICE_CREDITS_8=price_...
 * STRIPE_PRICE_MONTHLY=price_...  (Smart Prep $14.99/mo)
 * STRIPE_PRICE_ANNUAL=price_...   ($119.99/yr)
 */

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const PRICE_MAP = {
  credits_1:  process.env.STRIPE_PRICE_CREDITS_1,
  credits_3:  process.env.STRIPE_PRICE_CREDITS_3,
  credits_8:  process.env.STRIPE_PRICE_CREDITS_8,
  smart_prep: process.env.STRIPE_PRICE_MONTHLY,
  annual:     process.env.STRIPE_PRICE_ANNUAL,
};

const CREDITS_MAP = {
  credits_1: 1,
  credits_3: 3,
  credits_8: 8,
};

/**
 * Create a Stripe Checkout session.
 * Call from POST /api/create-checkout-session
 */
async function createCheckoutSession({ planKey, userId, userEmail, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured — add STRIPE_SECRET_KEY to .env');

  const priceId = PRICE_MAP[planKey];
  if (!priceId) throw new Error(`No Stripe price configured for plan: ${planKey}`);

  const isSubscription = ['smart_prep', 'annual'].includes(planKey);

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
    metadata: { userId, planKey },
  });

  return session;
}

/**
 * Handle Stripe webhook events.
 * Call from POST /api/stripe-webhook with raw body.
 */
function constructWebhookEvent(rawBody, signature) {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
}

/**
 * Process checkout.session.completed event.
 * Updates user plan in database via supabaseAdmin or SQLite.
 */
async function handleCheckoutComplete(session, db) {
  const { userId, planKey } = session.metadata || {};
  if (!userId || !planKey) return;

  if (CREDITS_MAP[planKey]) {
    // Add credits
    db.prepare('UPDATE users SET plan = "credits", credits = credits + ? WHERE id = ?')
      .run(CREDITS_MAP[planKey], userId);
  } else {
    // Activate subscription
    const expires = new Date();
    if (planKey === 'annual') expires.setFullYear(expires.getFullYear() + 1);
    else expires.setMonth(expires.getMonth() + 1);

    db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?')
      .run(planKey, expires.toISOString(), userId);
  }
}

/**
 * Create a Stripe Customer Portal session for billing management.
 */
async function createPortalSession({ customerId, returnUrl }) {
  if (!stripe) throw new Error('Stripe not configured');
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
  return session;
}

module.exports = {
  stripe,
  createCheckoutSession,
  constructWebhookEvent,
  handleCheckoutComplete,
  createPortalSession,
  PRICE_MAP,
  CREDITS_MAP,
};
