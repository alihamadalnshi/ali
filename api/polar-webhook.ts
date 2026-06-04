import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Signature verification following the Standard Webhooks specification
function verifySignature(
  secret: string,
  id: string,
  timestamp: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  if (!secret || !id || !timestamp || !rawBody || !signatureHeader) {
    console.warn('verifySignature: Missing required parameters', {
      hasSecret: !!secret,
      id,
      timestamp,
      hasRawBody: !!rawBody,
      signatureHeader
    });
    return false;
  }

  // 1. Validate timestamp to prevent replay attacks
  const timestampMs = parseInt(timestamp, 10) * 1000;
  const now = Date.now();
  const timeDifferenceMs = Math.abs(now - timestampMs);
  
  if (isNaN(timestampMs)) {
    console.warn(`Webhook timestamp is not a number: ${timestamp}`);
    return false;
  }

  // Tolerant to 24 hours for redeliveries and debugging
  if (timeDifferenceMs > 24 * 60 * 60 * 1000) {
    console.warn(`Webhook timestamp is too old (older than 24 hours). Event time: ${new Date(timestampMs).toISOString()}, Server time: ${new Date(now).toISOString()}`);
    return false;
  }

  if (timeDifferenceMs > 5 * 60 * 1000) {
    console.log(`Webhook timestamp difference is ${timeDifferenceMs / 1000}s (more than 5 mins). Tolerating up to 24h.`);
  }

  // 2. Prepare signed content
  const signedContent = `${id}.${timestamp}.${rawBody}`;

  // 3. Decode base64 secret (after trimming and stripping any whsec_ or polar_whs_ prefix)
  let secretBytes: Buffer;
  try {
    const trimmedSecret = secret.trim();
    const cleanSecret = trimmedSecret.replace(/^(whsec_|polar_whs_)/, '');
    secretBytes = Buffer.from(cleanSecret, 'base64');
  } catch (err) {
    console.error("Invalid webhook secret encoding (must be base64):", err);
    return false;
  }

  // 4. Compute expected signature in base64
  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  console.log('Signature Verification Debug:', {
    webhookId: id,
    timestamp,
    rawBodyLength: rawBody.length,
    rawBody: rawBody,
    expectedSignature,
    signatureHeader
  });

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
        console.log('Webhook signature successfully matched expected signature.');
        return true;
      }
    } catch (e) {
      // Ignore errors
    }
  }

  console.warn('Webhook signature mismatch. No signatures matched the expected signature.');
  return false;
}

export async function POST(request: Request) {
  // Retrieve headers
  const id = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');
  const signature = request.headers.get('webhook-signature');

  console.log('Webhook headers received:', {
    'webhook-id': id,
    'webhook-timestamp': timestamp,
    'webhook-signature': signature ? `${signature.substring(0, 20)}...` : undefined,
    'content-type': request.headers.get('content-type'),
  });

  if (!id || !timestamp || !signature) {
    return new Response(JSON.stringify({ error: 'Missing webhook headers' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read the raw body as a string using standard Web API
  let rawBody = '';
  try {
    rawBody = await request.text();
    console.log('Read raw body using request.text(). Length:', rawBody.length);
  } catch (err) {
    console.error('Failed to read request body:', err);
    return new Response(JSON.stringify({ error: 'Failed to read request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (rawBody.length === 0) {
    return new Response(JSON.stringify({ error: 'Empty request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify signature
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Missing POLAR_WEBHOOK_SECRET environment variable');
    return new Response(JSON.stringify({ error: 'Webhook secret is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isValid = verifySignature(secret, id, timestamp, rawBody, signature);
  if (!isValid) {
    console.warn('Webhook signature verification failed');
    return new Response(
      JSON.stringify({
        error: 'Invalid signature',
        debug: {
          id,
          timestamp,
          rawBodyLength: rawBody.length,
          rawBody: rawBody,
          secretLength: secret ? secret.length : 0,
          secretPrefix: secret ? `${secret.substring(0, 15)}...` : 'missing',
          signatureHeader: signature ? `${signature.substring(0, 20)}...` : undefined,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse webhook payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err: any) {
    console.error('Failed to parse JSON body:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(JSON.stringify({ received: true, ignored: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Initialize Supabase Client with service role key
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response(JSON.stringify({ error: 'Database credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Extract customer email to look up profile
  const customerEmail = data.customer?.email;
  if (!customerEmail) {
    console.warn('No customer email found in webhook data');
    return new Response(JSON.stringify({ received: true, error: 'No customer email found in webhook data' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Look up user profile by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle();

  if (profileError) {
    console.error(`Error querying profiles for email ${customerEmail}:`, profileError);
    return new Response(JSON.stringify({ error: 'Failed to query user profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!profile) {
    console.warn('User profile not found for email: ' + customerEmail);
    return new Response(
      JSON.stringify({
        received: true,
        error: 'User profile not found for email: ' + customerEmail
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
    return new Response(JSON.stringify({ error: 'Failed to query existing subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(JSON.stringify({ error: 'Failed to update subscription in database' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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

  return new Response(JSON.stringify({ received: true, synced: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
// Trigger redeployment after env var update
