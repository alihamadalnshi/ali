import crypto from 'crypto';
import { POST } from '../api/polar-webhook';

// Setup mock global fetch to intercept Supabase client calls
const mockFetchResponses = new Map();

// Override global fetch
(global as any).fetch = async (url: string | URL, options: any = {}) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  const urlObj = new URL(urlStr);
  const path = urlObj.pathname;
  const search = urlObj.search;
  const method = options.method || 'GET';

  console.log(`[Mock Fetch] Intercepted request: ${method} ${path}${search}`);

  // 1. Profile select lookup
  if (path === '/rest/v1/profiles' && method === 'GET' && search.includes('email=eq.')) {
    return new Response(JSON.stringify([{ id: 'user_uuid_123', email: 'test@example.com' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // 2. Existing subscription lookup
  if (path === '/rest/v1/subscriptions' && method === 'GET' && search.includes('polar_subscription_id=eq.')) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // 3. Subscription upsert
  if (path === '/rest/v1/subscriptions' && method === 'POST') {
    return new Response(JSON.stringify({}), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  }

  // 4. Profiles update (reset generation count)
  if (path === '/rest/v1/profiles' && method === 'PATCH') {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
};

// Mock Webhook Secret (base64 encoded with prefix)
const MOCK_SECRET = 'polar_whs_' + Buffer.from('my-super-secret-key-12345678901234567890').toString('base64');
process.env.POLAR_WEBHOOK_SECRET = MOCK_SECRET;

// Mock Supabase environment variables
process.env.VITE_SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

async function runTests() {
  console.log('--- Starting Polar Webhook Tests (Web standard Request/Response) ---');

  const webhookId = 'evt_mock123';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = {
    type: 'subscription.created',
    data: {
      id: 'sub_polar123',
      customer_id: 'cust_polar123',
      product_id: '60301e52-ab64-49a0-b0fd-4ff028bedc78',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      amount: 900,
      currency: 'USD',
      recurring_interval: 'month',
      customer: {
        email: 'test@example.com',
      },
      product: {
        name: 'Basic',
      },
    },
  };

  const bodyStr = JSON.stringify(payload);
  const signedContent = `${webhookId}.${timestamp}.${bodyStr}`;
  const cleanMockSecret = MOCK_SECRET.replace(/^(whsec_|polar_whs_)/, '');
  const secretBytes = Buffer.from(cleanMockSecret, 'base64');
  const signatureVal = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');
  const signatureHeader = `v1,${signatureVal}`;

  // Test 1: Valid Signature
  {
    console.log('\nTest 1: Valid signature and supported event');
    const req = new Request('https://example.com/api/polar-webhook', {
      method: 'POST',
      headers: {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': signatureHeader,
        'content-type': 'application/json',
      },
      body: bodyStr,
    });

    const res = await POST(req);
    const status = res.status;
    const bodyText = await res.text();

    if (status === 200) {
      console.log('✅ Test Passed: Returned 200 OK');
      console.log('Response Payload:', bodyText);
    } else {
      console.error(`❌ Test Failed: Expected 200, got ${status}. Body: ${bodyText}`);
    }
  }

  // Test 2: Invalid Signature
  {
    console.log('\nTest 2: Invalid signature');
    const req = new Request('https://example.com/api/polar-webhook', {
      method: 'POST',
      headers: {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': 'v1,invalid-signature-value',
        'content-type': 'application/json',
      },
      body: bodyStr,
    });

    const res = await POST(req);
    const status = res.status;
    const bodyText = await res.text();

    if (status === 401) {
      console.log('✅ Test Passed: Returned 401 Unauthorized for invalid signature');
    } else {
      console.error(`❌ Test Failed: Expected 401, got ${status}. Body: ${bodyText}`);
    }
  }

  // Test 3: Unsupported Event
  {
    console.log('\nTest 3: Unsupported event type');
    const unsupportedPayload = { ...payload, type: 'unsupported.event' };
    const bodyStrUnsupported = JSON.stringify(unsupportedPayload);
    const signedContentUnsupported = `${webhookId}.${timestamp}.${bodyStrUnsupported}`;
    const signatureValUnsupported = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContentUnsupported)
      .digest('base64');

    const req = new Request('https://example.com/api/polar-webhook', {
      method: 'POST',
      headers: {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': `v1,${signatureValUnsupported}`,
        'content-type': 'application/json',
      },
      body: bodyStrUnsupported,
    });

    const res = await POST(req);
    const status = res.status;
    const bodyText = await res.text();

    if (status === 200 && JSON.parse(bodyText).ignored) {
      console.log('✅ Test Passed: Returned 200 OK and ignored unsupported event');
    } else {
      console.error(`❌ Test Failed: Expected 200 with ignored:true, got ${status}. Body: ${bodyText}`);
    }
  }
}

runTests().catch(console.error);
