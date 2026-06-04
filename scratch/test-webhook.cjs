const crypto = require('crypto');
const { Readable } = require('stream');

// Setup mock global fetch to intercept Supabase client calls
const mockFetchResponses = new Map();

global.fetch = async (url, options) => {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const search = urlObj.search;
  const method = options.method || 'GET';

  console.log(`[Mock Fetch] Intercepted request: ${method} ${path}${search}`);

  // 1. Profile select lookup
  if (path === '/rest/v1/profiles' && method === 'GET' && search.includes('email=eq.')) {
    return {
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [{ id: 'user_uuid_123', email: 'test@example.com' }],
      text: async () => JSON.stringify([{ id: 'user_uuid_123', email: 'test@example.com' }]),
    };
  }

  // 2. Existing subscription lookup
  if (path === '/rest/v1/subscriptions' && method === 'GET' && search.includes('polar_subscription_id=eq.')) {
    return {
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [], // No existing subscription
      text: async () => '[]',
    };
  }

  // 3. Subscription upsert
  if (path === '/rest/v1/subscriptions' && method === 'POST') {
    return {
      status: 201,
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
      text: async () => '{}',
    };
  }

  // 4. Profiles update (reset generation count)
  if (path === '/rest/v1/profiles' && method === 'PATCH') {
    return {
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
      text: async () => '{}',
    };
  }

  return {
    status: 404,
    ok: false,
    headers: new Headers(),
    json: async () => ({ error: 'Not found' }),
    text: async () => 'Not found',
  };
};

// Import the handler
const imported = require('../api/polar-webhook');
const handler = typeof imported === 'function' ? imported : imported.default;

// Mock Webhook Secret (base64 encoded with prefix)
const MOCK_SECRET = 'polar_whs_' + Buffer.from('my-super-secret-key-12345678901234567890').toString('base64');
process.env.POLAR_WEBHOOK_SECRET = MOCK_SECRET;

// Mock Supabase environment variables
process.env.VITE_SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

// Helper to create a mock request stream
function createMockRequest(headers, body) {
  const req = Readable.from([body]);
  req.method = 'POST';
  req.headers = headers;
  return req;
}

// Helper to create a mock response
function createMockResponse() {
  const jsonMock = (...args) => {
    jsonMock.calls.push(args);
  };
  jsonMock.calls = [];
  const statusMock = (code) => {
    statusMock.calls.push(code);
    return { json: jsonMock };
  };
  statusMock.calls = [];
  const res = {
    status: statusMock,
  };
  return { res, statusMock, jsonMock };
}

async function runTests() {
  console.log('--- Starting Polar Webhook Tests (CJS with Fetch Mock) ---');

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
    const req = createMockRequest(
      {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': signatureHeader,
      },
      bodyStr
    );
    const { res, statusMock, jsonMock } = createMockResponse();

    await handler(req, res);

    if (statusMock.calls[0] === 200) {
      console.log('✅ Test Passed: Returned 200 OK');
      console.log('Response Payload:', jsonMock.calls[0][0]);
    } else {
      console.error('❌ Test Failed: Expected 200, got', statusMock.calls[0]);
    }
  }

  // Test 2: Invalid Signature
  {
    console.log('\nTest 2: Invalid signature');
    const req = createMockRequest(
      {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': 'v1,invalid-signature-value',
      },
      bodyStr
    );
    const { res, statusMock } = createMockResponse();

    await handler(req, res);

    if (statusMock.calls[0] === 401) {
      console.log('✅ Test Passed: Returned 401 Unauthorized for invalid signature');
    } else {
      console.error('❌ Test Failed: Expected 401, got', statusMock.calls[0]);
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

    const req = createMockRequest(
      {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': `v1,${signatureValUnsupported}`,
      },
      bodyStrUnsupported
    );
    const { res, statusMock, jsonMock } = createMockResponse();

    await handler(req, res);

    if (statusMock.calls[0] === 200 && jsonMock.calls[0][0]?.ignored) {
      console.log('✅ Test Passed: Returned 200 OK and ignored unsupported event');
    } else {
      console.error('❌ Test Failed: Expected 200 with ignored:true, got', statusMock.calls[0]);
    }
  }

  // Test 4: Pre-parsed body fallback (like Vercel parser default behavior)
  {
    console.log('\nTest 4: Pre-parsed body fallback (body parsing enabled by runtime)');
    const req = Readable.from([]); // Empty stream (consumed)
    req.method = 'POST';
    req.headers = {
      'webhook-id': webhookId,
      'webhook-timestamp': timestamp,
      'webhook-signature': signatureHeader,
    };
    req.body = payload; // Already parsed by runtime

    const { res, statusMock, jsonMock } = createMockResponse();

    await handler(req, res);

    if (statusMock.calls[0] === 200) {
      console.log('✅ Test Passed: Returned 200 OK with pre-parsed body fallback');
      console.log('Response Payload:', jsonMock.calls[0][0]);
    } else {
      console.error('❌ Test Failed: Expected 200, got', statusMock.calls[0]);
    }
  }
}

runTests().catch(console.error);

