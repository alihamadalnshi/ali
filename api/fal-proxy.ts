import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://ali-nu-ten.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

// In-memory guest rate limiting cache (resets on container cold starts)
const guestIpCache = new Map<string, { count: number; resetTime: number }>();
const GUEST_LIMIT = 5;
const RESET_WINDOW = 3600 * 1000; // 1 hour

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  
  // Restrict CORS to trusted origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-fal-target-url, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl =
    (req.headers['x-fal-target-url'] as string) ||
    (req.query['target_url'] as string);

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  // Prevent SSRF and open proxy abuse by validating target domain
  try {
    const parsedUrl = new URL(targetUrl);
    if (
      !parsedUrl.hostname.endsWith('.fal.run') &&
      !parsedUrl.hostname.endsWith('.fal.ai') &&
      parsedUrl.hostname !== 'fal.run' &&
      parsedUrl.hostname !== 'fal.ai'
    ) {
      return res.status(400).json({ error: 'Forbidden target URL domain' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid target URL' });
  }

  // ── Authorization & Credit Verification ───────────────────────────────────
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[fal-proxy] Supabase environment variables are missing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Diagnostics: Verify that SUPABASE_SERVICE_ROLE_KEY belongs to VITE_SUPABASE_URL project
  try {
    const keyParts = supabaseServiceKey.split('.');
    if (keyParts.length === 3) {
      const payload = JSON.parse(Buffer.from(keyParts[1], 'base64').toString('utf8'));
      const ref = payload.ref;
      if (ref && !supabaseUrl.includes(ref)) {
        console.error(`[fal-proxy] Configuration Error: Service Role Key project reference "${ref}" does not match Supabase URL "${supabaseUrl}"`);
      }
    }
  } catch (err) {
    console.warn('[fal-proxy] Diagnostics failed to check key ref:', err);
  }

  // Initialize Admin client (bypass RLS for server-side limits checking)
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);
      if (authError || !user) {
        console.error('[fal-proxy] Session verification failed:', authError?.message || 'User object is null');
        return res.status(401).json({ 
          error: 'Invalid or expired session', 
          message: authError?.message || 'User not found' 
        });
      }
      userId = user.id;
    } catch (err: any) {
      console.error('[fal-proxy] Auth verification exception:', err);
      return res.status(401).json({ error: 'Authentication failed', message: err.message });
    }
  }

  if (userId) {
    // Authenticated User Flow: Validate generation count against subscription tier
    try {
      const [profileRes, subRes] = await Promise.all([
        adminSupabase.from('profiles').select('generation_count').eq('id', userId).single(),
        adminSupabase
          .from('subscriptions')
          .select('gateway_price_id, plan_name, status')
          .eq('user_id', userId)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (profileRes.error) {
        console.error(`[fal-proxy] Failed to fetch profile for ${userId}:`, profileRes.error.message);
        return res.status(500).json({ error: 'Failed to verify user profile' });
      }

      const used = profileRes.data?.generation_count ?? 0;
      let limit = 5; // Default free tier limit

      if (subRes.data) {
        const priceId = subRes.data.gateway_price_id;
        const planNameLower = subRes.data.plan_name?.toLowerCase() || '';

        // Match Price IDs or plan names to configuration limits
        if (priceId === process.env.VITE_PADDLE_PRICE_BUSINESS || planNameLower.includes('business')) {
          limit = 300;
        } else if (priceId === process.env.VITE_PADDLE_PRICE_PRO || planNameLower.includes('pro')) {
          limit = 100;
        } else if (priceId === process.env.VITE_PADDLE_PRICE_BASIC || planNameLower.includes('basic')) {
          limit = 30;
        }
      }

      if (used >= limit) {
        return res.status(429).json({ error: 'Generation limit reached. Please upgrade your plan.' });
      }
    } catch (err) {
      console.error('[fal-proxy] DB query failed during validation:', err);
      // Fallback: Proceed but log validation issue
    }
  } else {
    // Guest User Flow: Enforce IP-based rate limiting
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const clientRecord = guestIpCache.get(ip);

    if (clientRecord) {
      if (now > clientRecord.resetTime) {
        guestIpCache.set(ip, { count: 1, resetTime: now + RESET_WINDOW });
      } else if (clientRecord.count >= GUEST_LIMIT) {
        return res.status(429).json({ error: 'Guest generation limit reached. Please sign in to continue.' });
      } else {
        clientRecord.count += 1;
      }
    } else {
      guestIpCache.set(ip, { count: 1, resetTime: now + RESET_WINDOW });
    }
  }

  // ── Fal AI Request Dispatch ────────────────────────────────────────────────
  const falKey = process.env.FAL_KEY || process.env.VITE_FAL_KEY;
  if (!falKey) {
    console.error('[fal-proxy] Fal AI API Key is missing (FAL_KEY / VITE_FAL_KEY)');
    return res.status(500).json({ error: 'Fal AI configuration missing: API Key not set' });
  }

  const headers: Record<string, string> = {
    'Authorization': `Key ${falKey}`,
  };

  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'] as string;
  }
  if (req.headers['accept']) {
    headers['Accept'] = req.headers['accept'] as string;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method || 'POST',
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined,
    });

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    const text = await response.text();
    return res.status(response.status).send(text);
  } catch (error: any) {
    console.error('[fal-proxy] Request forwarding failed:', error);
    return res.status(500).json({ error: error.message || 'Proxy request failed' });
  }
}
