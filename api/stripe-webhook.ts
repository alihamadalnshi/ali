import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Map Stripe Price IDs to Plan Names
const PRICE_TO_PLAN_NAME: Record<string, string> = {
  'price_1TewGYEB6cMflNwVx4JdDLty': 'Basic',
  'price_1TewH2EB6cMflNwV3eujiWCv': 'Pro',
  'price_1TewHUEB6cMflNwV5lvnmVBS': 'Business',
};

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signatureHeader.split(',');
    const t = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signatures = parts
      .filter(p => p.startsWith('v1='))
      .map(p => p.split('=')[1]);

    if (!t || signatures.length === 0) return false;

    const signedPayload = `${t}.${rawBody}`;

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(secret);
    const dataBytes = encoder.encode(signedPayload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      dataBytes
    );

    // Convert signatureBuffer to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signatures.includes(expectedSignature);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return new Response(JSON.stringify({ error: 'Stripe webhook secret is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Read raw body as string
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('Failed to read request body:', err);
    return new Response(JSON.stringify({ error: 'Failed to read request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Verify signature
  const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    console.warn('Stripe signature verification failed');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Parse event
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Failed to parse event JSON:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`Received verified Stripe event: ${event.type}`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return new Response(JSON.stringify({ error: 'Database credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return new Response(JSON.stringify({ error: 'Stripe Secret Key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Helper to fetch full subscription details from Stripe
  const fetchStripeSubscription = async (subscriptionId: string) => {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch subscription from Stripe: ${res.statusText}`);
    }
    return res.json();
  };

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (!userId || !subscriptionId) {
        console.warn('Missing client_reference_id or subscription ID in checkout session');
        return new Response(JSON.stringify({ received: true, ignored: true, reason: 'Missing user ID or subscription ID' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`Processing checkout completed for user: ${userId}, subscription: ${subscriptionId}`);

      // Fetch subscription from Stripe to get exact periods/pricing details
      const stripeSub = await fetchStripeSubscription(subscriptionId);
      const priceId = stripeSub.items.data[0].price.id;
      const planName = PRICE_TO_PLAN_NAME[priceId] || stripeSub.items.data[0].price.nickname || 'Paid Plan';

      const dbSubscription: Record<string, any> = {
        user_id: userId,
        polar_subscription_id: subscriptionId, // Stripe Subscription ID
        polar_customer_id: customerId, // Stripe Customer ID
        product_id: priceId, // Stripe Price ID
        product_name: planName,
        status: stripeSub.status,
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        amount: stripeSub.items.data[0].price.unit_amount,
        currency: stripeSub.items.data[0].price.currency.toUpperCase(),
        recurring_interval: stripeSub.items.data[0].price.recurring.interval,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { error: upsertError } = await adminSupabase
        .from('subscriptions')
        .upsert(dbSubscription, { onConflict: 'polar_subscription_id' });

      if (upsertError) {
        console.error('Failed to upsert subscription to database:', upsertError.message);
        return new Response(JSON.stringify({ error: 'Failed to write subscription data' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Reset user's generation_count in profiles to 0
      if (['active', 'trialing'].includes(stripeSub.status)) {
        const { error: profileUpdateError } = await adminSupabase
          .from('profiles')
          .update({
            generation_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileUpdateError) {
          console.error(`Failed to reset credits for user ${userId}:`, profileUpdateError.message);
        } else {
          console.log(`Reset generation credits to 0 for user ${userId}`);
        }
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const stripeSub = event.data.object;
      const subscriptionId = stripeSub.id;

      console.log(`Processing subscription update/delete for: ${subscriptionId}`);

      // Query database to find subscription record
      const { data: existingSub, error: queryError } = await adminSupabase
        .from('subscriptions')
        .select('user_id, status')
        .eq('polar_subscription_id', subscriptionId)
        .maybeSingle();

      if (queryError) {
        console.error('Failed to query existing subscription:', queryError.message);
        return new Response(JSON.stringify({ error: 'Database query error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!existingSub) {
        console.warn(`No matching subscription found in database for ID: ${subscriptionId}`);
        return new Response(JSON.stringify({ received: true, ignored: true, reason: 'Subscription ID not found' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const priceId = stripeSub.items.data[0].price.id;
      const planName = PRICE_TO_PLAN_NAME[priceId] || stripeSub.items.data[0].price.nickname || 'Paid Plan';

      const updateData: Record<string, any> = {
        status: stripeSub.status,
        product_id: priceId,
        product_name: planName,
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        amount: stripeSub.items.data[0].price.unit_amount,
        currency: stripeSub.items.data[0].price.currency.toUpperCase(),
        recurring_interval: stripeSub.items.data[0].price.recurring.interval,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await adminSupabase
        .from('subscriptions')
        .update(updateData)
        .eq('polar_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Failed to update subscription in database:', updateError.message);
        return new Response(JSON.stringify({ error: 'Failed to update subscription data' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If subscription was reactivated/renewed, reset generation_count
      const oldStatus = existingSub.status;
      const newStatus = stripeSub.status;
      if (['active', 'trialing'].includes(newStatus) && !['active', 'trialing'].includes(oldStatus)) {
        const { error: profileUpdateError } = await adminSupabase
          .from('profiles')
          .update({
            generation_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSub.user_id);

        if (profileUpdateError) {
          console.error(`Failed to reset credits for user ${existingSub.user_id}:`, profileUpdateError.message);
        } else {
          console.log(`Re-activated/Renewed subscription credits for user ${existingSub.user_id}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error handling webhook event:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
