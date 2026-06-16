import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Extract Charge ID from the webhook payload
  const chargeId = req.body?.id;
  if (!chargeId) {
    console.error('[tap-webhook] Webhook payload is missing charge ID');
    return res.status(400).json({ error: 'Missing charge ID in payload' });
  }

  console.log(`[tap-webhook] Received webhook for Tap charge: ${chargeId}`);

  const tapSecretKey = process.env.TAP_SECRET_KEY;
  if (!tapSecretKey) {
    console.error('[tap-webhook] Missing TAP_SECRET_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 2. Fetch the authentic charge state directly from Tap's secure API
  // This bypasses webhook spoofing and is the most secure validation strategy
  let charge: any;
  try {
    const tapResponse = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tapSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!tapResponse.ok) {
      const errData = await tapResponse.json();
      console.error(`[tap-webhook] Tap API failed to return charge ${chargeId}:`, errData);
      return res.status(400).json({ error: 'Failed to retrieve charge info from Tap' });
    }

    charge = await tapResponse.json();
  } catch (err: any) {
    console.error('[tap-webhook] Network error fetching charge info:', err);
    return res.status(500).json({ error: 'Failed to connect to Tap Payments' });
  }

  // 3. Initialize Supabase Admin client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[tap-webhook] Missing Supabase credentials');
    return res.status(500).json({ error: 'Database credentials not configured' });
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // 4. Process charge status
  const status = charge.status?.toUpperCase();
  if (status !== 'CAPTURED') {
    console.log(`[tap-webhook] Charge status is ${status} (not CAPTURED). No action taken.`);
    return res.status(200).json({ ok: true, message: 'Status is not CAPTURED' });
  }

  // 5. Idempotency Check (prevent duplicate processing of the same charge)
  try {
    const { error: idempotencyError } = await adminSupabase
      .from('webhook_events')
      .insert({
        event_id: charge.id,
        occurred_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      });

    if (idempotencyError) {
      if (idempotencyError.code === '23505') {
        console.log(`[tap-webhook] Charge ${charge.id} was already processed. Skipping.`);
        return res.status(200).json({ ok: true, skipped: true });
      }
      console.warn('[tap-webhook] Idempotency insert warning:', idempotencyError.message);
    }
  } catch (err) {
    console.error('[tap-webhook] Idempotency check exception:', err);
  }

  // Retrieve user metadata sent during checkout creation
  const userId = charge.metadata?.userId;
  const priceId = charge.metadata?.priceId;
  const planName = charge.metadata?.planName || 'Paid Plan';

  if (!userId || !priceId) {
    console.warn(`[tap-webhook] Charge ${charge.id} is missing metadata (userId: ${userId}, priceId: ${priceId})`);
    return res.status(200).json({ ok: true, message: 'Missing metadata' });
  }

  console.log(`[tap-webhook] Processing successful payment for user ${userId}, plan ${priceId}`);

  try {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1); // 1-month period

    const dbSubscription = {
      user_id: userId,
      gateway_subscription_id: charge.id,
      gateway_customer_id: charge.customer?.id || null,
      gateway_price_id: priceId,
      plan_name: planName,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: expiryDate.toISOString(),
      cancel_at_period_end: false,
      amount: charge.amount ? Math.round(charge.amount * 100) : null, // Convert to cents
      currency: charge.currency || 'USD',
      recurring_interval: 'month',
      updated_at: now.toISOString(),
      created_at: now.toISOString(),
    };

    // Upsert subscription mapping
    const { error: upsertError } = await adminSupabase
      .from('subscriptions')
      .upsert(dbSubscription, { onConflict: 'gateway_subscription_id' });

    if (upsertError) {
      console.error('[tap-webhook] Failed to upsert subscription:', upsertError.message);
      return res.status(500).json({ error: 'Database update failed' });
    }

    // Reset user generation_count to 0
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        generation_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error(`[tap-webhook] Failed to reset credits for user ${userId}:`, profileError.message);
    } else {
      console.log(`[tap-webhook] Reset credits successfully for user ${userId}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[tap-webhook] Webhook exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
