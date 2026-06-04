import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Disable default body parser to receive raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read the raw request body stream
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Signature verification following the Standard Webhooks specification
function verifySignature(
  secret: string,
  id: string,
  timestamp: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  if (!secret || !id || !timestamp || !rawBody || !signatureHeader) {
    return false;
  }

  // 1. Validate timestamp to prevent replay attacks (tolerance of 5 minutes)
  const timestampMs = parseInt(timestamp, 10) * 1000;
  const now = Date.now();
  if (isNaN(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) {
    console.warn(`Webhook timestamp is out of tolerance window: ${timestamp}`);
    return false;
  }

  // 2. Prepare signed content
  const signedContent = `${id}.${timestamp}.${rawBody}`;

  // 3. Decode base64 secret
  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(secret, 'base64');
  } catch (err) {
    console.error("Invalid webhook secret encoding (must be base64):", err);
    return false;
  }

  // 4. Compute expected signature in base64
  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  // 5. Check if any signature in the header matches
  const signatures = signatureHeader.split(' ');
  for (const sig of signatures) {
    const parts = sig.split(',');
    if (parts.length !== 2 || parts[0] !== 'v1') {
      continue;
    }
    const signatureVal = parts[1];

    try {
      const expectedBuffer = Buffer.from(expectedSignature);
      const actualBuffer = Buffer.from(signatureVal);

      if (
        expectedBuffer.length === actualBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, actualBuffer)
      ) {
        return true;
      }
    } catch (e) {
      // Ignore errors from parsing/comparison
    }
  }

  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Retrieve headers
  const id = req.headers['webhook-id'] as string;
  const timestamp = req.headers['webhook-timestamp'] as string;
  const signature = req.headers['webhook-signature'] as string;

  if (!id || !timestamp || !signature) {
    return res.status(400).json({ error: 'Missing webhook headers' });
  }

  // Get raw body
  let rawBodyBuffer: Buffer;
  try {
    rawBodyBuffer = await getRawBody(req);
  } catch (err: any) {
    console.error('Failed to read request body:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }
  const rawBody = rawBodyBuffer.toString('utf8');

  // Verify signature
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Missing POLAR_WEBHOOK_SECRET environment variable');
    return res.status(500).json({ error: 'Webhook secret is not configured' });
  }

  const isValid = verifySignature(secret, id, timestamp, rawBody, signature);
  if (!isValid) {
    console.warn('Webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse webhook payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err: any) {
    console.error('Failed to parse JSON body:', err);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventType = payload.type;
  const data = payload.data;

  console.log(`Received verified Polar webhook event: ${eventType}`);

  // List of subscription events we want to process
  const supportedEvents = [
    'subscription.created',
    'subscription.updated',
    'subscription.active',
    'subscription.canceled',
    'subscription.revoked',
    'subscription.uncanceled'
  ];

  if (!supportedEvents.includes(eventType)) {
    console.log(`Event type ${eventType} is not handled. Ignoring.`);
    return res.status(200).json({ received: true, ignored: true });
  }

  // Initialize Supabase Client with service role key
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Database credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Extract customer email to look up profile
  const customerEmail = data.customer?.email;
  if (!customerEmail) {
    console.warn('No customer email found in webhook data');
    return res.status(200).json({ received: true, error: 'No customer email found in webhook data' });
  }

  // Look up user profile by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle();

  if (profileError) {
    console.error(`Error querying profiles for email ${customerEmail}:`, profileError);
    return res.status(500).json({ error: 'Failed to query user profile' });
  }

  if (!profile) {
    console.warn(`User profile not found for email: ${customerEmail}`);
    return res.status(200).json({
      received: true,
      error: `User profile not found for email: ${customerEmail}`
    });
  }

  const userId = profile.id;

  // Check if we are inserting a new subscription or updating an existing one
  const { data: existingSub, error: existingSubError } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_start')
    .eq('polar_subscription_id', data.id)
    .maybeSingle();

  if (existingSubError) {
    console.error(`Error querying existing subscription ${data.id}:`, existingSubError);
    return res.status(500).json({ error: 'Failed to query existing subscription' });
  }

  // Map Polar subscription fields to DB schema
  const dbSubscription: Record<string, any> = {
    user_id: userId,
    polar_subscription_id: data.id,
    polar_customer_id: data.customer_id || null,
    product_id: data.product_id,
    product_name: data.product?.name || null,
    status: data.status,
    current_period_start: data.current_period_start || null,
    current_period_end: data.current_period_end || null,
    cancel_at_period_end: data.cancel_at_period_end ?? false,
    amount: data.amount || null,
    currency: data.currency || null,
    recurring_interval: data.recurring_interval || null,
    updated_at: new Date().toISOString()
  };

  if (!existingSub) {
    dbSubscription.created_at = new Date().toISOString();
  }

  // Upsert subscription
  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(dbSubscription, { onConflict: 'polar_subscription_id' });

  if (upsertError) {
    console.error(`Error upserting subscription ${data.id}:`, upsertError);
    return res.status(500).json({ error: 'Failed to update subscription in database' });
  }

  console.log(`Successfully synced subscription ${data.id} for user ${userId}`);

  // Reset user's generation_count in profiles if this is a new/renewed/activated subscription
  if (['active', 'trialing'].includes(data.status)) {
    const isNew = !existingSub;
    const statusChanged = existingSub && existingSub.status !== data.status;
    const periodAdvanced =
      existingSub &&
      existingSub.current_period_start &&
      data.current_period_start &&
      new Date(existingSub.current_period_start).getTime() !== new Date(data.current_period_start).getTime();

    if (isNew || statusChanged || periodAdvanced) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          generation_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error(`Error resetting generation count for user ${userId}:`, profileUpdateError);
      } else {
        console.log(`Reset generation count to 0 for user ${userId} (Reason: ${isNew ? 'New' : statusChanged ? 'Status change' : 'Renewal'})`);
      }
    }
  }

  return res.status(200).json({ received: true, synced: true });
}
