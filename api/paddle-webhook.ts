import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import type {
  EventName,
  SubscriptionActivatedEvent,
  SubscriptionCanceledEvent,
  SubscriptionUpdatedEvent,
  TransactionCompletedEvent,
} from '@paddle/paddle-node-sdk';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body on Vercel Node.js Serverless Functions
async function getRawBody(req: any): Promise<string> {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// ── Paddle server SDK singleton ──────────────────────────────────────────────
function getPaddleServer(): Paddle {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error('PADDLE_API_KEY is not set');
  }
  return new Paddle(process.env.PADDLE_API_KEY, {
    environment:
      process.env.VITE_PADDLE_ENV === 'sandbox'
        ? Environment.sandbox
        : Environment.production,
  });
}

// ── Map Paddle Price IDs to plan names ───────────────────────────────────────
// These should match the Price IDs from your Paddle Dashboard → Catalog → Prices.
// We read from env vars so they can be configured per environment.
const PRICE_TO_PLAN: Record<string, { name: string; key: string }> = {
  [process.env.VITE_PADDLE_PRICE_BASIC || '']: { name: 'Basic', key: 'basic' },
  [process.env.VITE_PADDLE_PRICE_PRO || '']: { name: 'Pro', key: 'pro' },
  [process.env.VITE_PADDLE_PRICE_BUSINESS || '']: { name: 'Business', key: 'business' },
};

function getPlanFromPriceId(priceId: string): { name: string; key: string } {
  return PRICE_TO_PLAN[priceId] || { name: 'Paid Plan', key: 'paid' };
}

function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Extract the Paddle signature header
  const signature = (req.headers['paddle-signature'] as string) ?? '';
  const rawBody = await getRawBody(req);

  if (!signature) {
    return res.status(400).json({ error: 'Missing paddle-signature header' });
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing PADDLE_WEBHOOK_SECRET environment variable');
    return res.status(500).json({ error: 'Webhook secret is not configured' });
  }

  // 2. Verify signature using the Paddle SDK
  const paddle = getPaddleServer();
  let event: any;
  try {
    event = paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
  } catch (err: any) {
    console.error('Paddle signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (!event) {
    return res.status(400).json({ error: 'Unknown event' });
  }

  console.log(`Received verified Paddle event: ${event.eventType} (${event.eventId})`);

  // 3. Initialize Supabase admin client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return res.status(500).json({ error: 'Database credentials not configured' });
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // 4. Idempotency check — prevent duplicate processing
  const { error: idempotencyError } = await adminSupabase
    .from('webhook_events')
    .insert({
      event_id: event.eventId,
      occurred_at: event.occurredAt || new Date().toISOString(),
      processed_at: new Date().toISOString(),
    });

  if (idempotencyError) {
    // If insert fails due to unique constraint, event was already processed
    if (idempotencyError.code === '23505') {
      console.log(`Event ${event.eventId} already processed, skipping.`);
      return res.status(200).json({ ok: true, skipped: true });
    }
    console.warn('Idempotency check warning:', idempotencyError.message);
  }

  // 5. Route by event type
  try {
    switch (event.eventType as EventName) {

      // ── Subscription activated (new subscription starts) ──
      case 'subscription.activated': {
        const data = event.data as SubscriptionActivatedEvent['data'];
        const customData = data.customData as Record<string, string> | null;
        const userId = customData?.userId;

        if (!userId) {
          console.warn('subscription.activated missing userId in customData');
          break;
        }

        const priceId = data.items?.[0]?.price?.id ?? '';
        const plan = getPlanFromPriceId(priceId);

        const dbSubscription: Record<string, any> = {
          user_id: userId,
          gateway_subscription_id: data.id,
          gateway_customer_id: data.customerId || null,
          gateway_price_id: priceId,
          plan_name: plan.name,
          status: data.status?.toLowerCase() || 'active',
          current_period_start: parseDate(data.currentBillingPeriod?.startsAt),
          current_period_end: parseDate(data.currentBillingPeriod?.endsAt),
          cancel_at_period_end: data.scheduledChange?.action === 'cancel' || false,
          amount: data.items?.[0]?.price?.unitPrice?.amount
            ? Number(data.items[0].price.unitPrice.amount)
            : null,
          currency: data.currencyCode || null,
          recurring_interval: data.items?.[0]?.price?.billingCycle?.interval || 'month',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { error: upsertError } = await adminSupabase
          .from('subscriptions')
          .upsert(dbSubscription, { onConflict: 'gateway_subscription_id' });

        if (upsertError) {
          console.error('Failed to upsert subscription:', upsertError.message);
          return res.status(500).json({ error: 'Failed to write subscription data' });
        }

        // Reset user's generation_count in profiles to 0
        const { error: profileError } = await adminSupabase
          .from('profiles')
          .update({
            generation_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileError) {
          console.error(`Failed to reset credits for user ${userId}:`, profileError.message);
        } else {
          console.log(`Reset generation credits to 0 for user ${userId}`);
        }

        console.log(`Activated subscription ${data.id} for user ${userId} (${plan.name})`);
        break;
      }

      // ── Subscription updated (plan change, renewal, etc.) ──
      case 'subscription.updated': {
        const data = event.data as SubscriptionUpdatedEvent['data'];

        const priceId = data.items?.[0]?.price?.id ?? '';
        const plan = getPlanFromPriceId(priceId);

        const updateData: Record<string, any> = {
          status: data.status?.toLowerCase() || 'active',
          gateway_price_id: priceId,
          plan_name: plan.name,
          current_period_start: parseDate(data.currentBillingPeriod?.startsAt),
          current_period_end: parseDate(data.currentBillingPeriod?.endsAt),
          cancel_at_period_end: data.scheduledChange?.action === 'cancel' || false,
          amount: data.items?.[0]?.price?.unitPrice?.amount
            ? Number(data.items[0].price.unitPrice.amount)
            : null,
          currency: data.currencyCode || null,
          recurring_interval: data.items?.[0]?.price?.billingCycle?.interval || 'month',
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await adminSupabase
          .from('subscriptions')
          .update(updateData)
          .eq('gateway_subscription_id', data.id);

        if (updateError) {
          console.error('Failed to update subscription:', updateError.message);
          return res.status(500).json({ error: 'Failed to update subscription' });
        }

        // If subscription renewed/reactivated, reset credits
        if (['active', 'trialing'].includes(data.status?.toLowerCase() || '')) {
          // Get user_id from subscription record
          const { data: subRecord } = await adminSupabase
            .from('subscriptions')
            .select('user_id')
            .eq('gateway_subscription_id', data.id)
            .maybeSingle();

          if (subRecord?.user_id) {
            await adminSupabase
              .from('profiles')
              .update({
                generation_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', subRecord.user_id);
          }
        }

        console.log(`Updated subscription ${data.id} → ${data.status} (${plan.name})`);
        break;
      }

      // ── Subscription canceled ──
      case 'subscription.canceled': {
        const data = event.data as SubscriptionCanceledEvent['data'];

        const { error: cancelError } = await adminSupabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('gateway_subscription_id', data.id);

        if (cancelError) {
          console.error('Failed to cancel subscription:', cancelError.message);
        }

        console.log(`Canceled subscription ${data.id}`);
        break;
      }

      // ── One-time transaction completed (future-proof) ──
      case 'transaction.completed': {
        const data = event.data as TransactionCompletedEvent['data'];
        const customData = data.customData as Record<string, string> | null;
        console.log(`Transaction completed: ${data.id}`, customData);
        // Handle one-time payments here if needed in the future
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.eventType}`);
        break;
    }
  } catch (err: any) {
    console.error('[paddle webhook] PROCESSING ERROR:', err);
    return res.status(500).json({ error: 'Internal error' });
  }

  // 6. Always return 200 to acknowledge receipt
  return res.status(200).json({ ok: true });
}
