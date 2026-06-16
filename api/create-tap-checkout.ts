import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const PLAN_PRICES: Record<string, { price: number; name: string }> = {
  basic: { price: 9, name: 'Basic' },
  pro: { price: 19, name: 'Pro' },
  business: { price: 49, name: 'Business' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId, email } = req.body;

  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'Missing required parameters (priceId, userId, email)' });
  }

  // Resolve plan pricing
  const planKey = priceId.toLowerCase();
  const plan = PLAN_PRICES[planKey];

  if (!plan) {
    return res.status(400).json({ error: `Invalid priceId: ${priceId}` });
  }

  // Retrieve user name from Supabase profiles
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[create-tap-checkout] Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  let fullName = 'Valued Customer';
  try {
    const { data } = await adminSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    if (data?.full_name) {
      fullName = data.full_name;
    }
  } catch (err) {
    console.warn('[create-tap-checkout] Failed to fetch user profile name, using default', err);
  }

  // Split name for Tap customer payload
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Valued';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  // Determine dynamic return URL (matches localhost or prod domain)
  const host = req.headers.host || 'localhost:5173';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const successUrl = `${protocol}://${host}/dashboard/settings?payment=success`;
  
  // Tap requires a public HTTPS URL for webhooks. Avoid sending local urls.
  const webhookUrl = `${protocol}://${host}/api/tap-webhook`;
  const postObject = protocol === 'https' && !host.includes('localhost') && !host.includes('127.0.0.1')
    ? { url: webhookUrl }
    : undefined;

  const tapSecretKey = process.env.TAP_SECRET_KEY;
  if (!tapSecretKey) {
    console.error('[create-tap-checkout] Missing TAP_SECRET_KEY environment variable');
    return res.status(500).json({ error: 'Tap Payments configuration missing' });
  }

  try {
    const tapResponse = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: plan.price,
        currency: 'USD',
        threeDSecure: true,
        save_card: false,
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: email.trim(),
        },
        source: {
          id: 'src_all',
        },
        redirect: {
          url: successUrl,
        },
        post: postObject,
        metadata: {
          userId,
          priceId: planKey,
          planName: plan.name,
        },
      }),
    });

    const tapData = await tapResponse.json();

    if (!tapResponse.ok || !tapData.transaction?.url) {
      console.error('[create-tap-checkout] Tap API error:', tapData);
      return res.status(400).json({
        error: tapData.errors?.[0]?.description || 'Failed to create Tap checkout session',
      });
    }

    return res.status(200).json({ redirectUrl: tapData.transaction.url });
  } catch (error: any) {
    console.error('[create-tap-checkout] Request failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to communicate with Tap Payments' });
  }
}
