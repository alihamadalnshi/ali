import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-fal-target-url, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl =
    (req.headers['x-fal-target-url'] as string) ||
    (req.query['target_url'] as string);

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  const headers: Record<string, string> = {
    'Authorization': `Key ${process.env.FAL_KEY}`,
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
    console.error('Fal proxy error:', error);
    return res.status(500).json({ error: error.message || 'Proxy error' });
  }
}
