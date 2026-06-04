import { webcrypto } from 'crypto';

const secret = 'polar_whs_VP90ydLeufJhPGx3jyhhCgWFGypzOHM74BgS2403L3q';
const id = '01cdc44c-3476-4698-acff-44e3b7abede0';
const timestamp = '1780612226';
const rawBody = '{"type":"customer.created","timestamp":"2026-06-04T20:25:15.638033Z","data":{"id":"ecf6e36a-728b-4134-8d44-f5f5f8f85375","created_at":"2026-06-04T20:25:13.810288Z","modified_at":null,"metadata":{},"external_id":null,"email":"ah3831950@gmail.com","email_verified":false,"type":"individual","name":null,"billing_address":{"line1":null,"line2":null,"postal_code":null,"city":null,"state":null,"country":"EG"},"tax_id":null,"locale":"en","organization_id":"fe5196f1-9852-440a-895a-219356beccdc","default_payment_method_id":null,"deleted_at":null,"avatar_url":"https://www.gravatar.com/avatar/77b81030897bb8c334a8ed1df5e5f8eeb214b7dee1bae4247dc5ebf9dabf7208?d=404"}}';

const signedContent = `${id}.${timestamp}.${rawBody}`;

async function run() {
  const cleanSecret = secret.replace(/^(whsec_|polar_whs_)/, '').trim();
  const binaryString = atob(cleanSecret);
  const secretBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    secretBytes[i] = binaryString.charCodeAt(i);
  }

  const encoder = new TextEncoder();
  const key = await webcrypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await webcrypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedContent)
  );

  const bytes = new Uint8Array(signatureBuffer);
  console.log('Subtle API bytes:', Array.from(bytes));
  
  // Method 1: String.fromCharCode and btoa
  const binaryStr = String.fromCharCode(...bytes);
  const sig1 = btoa(binaryStr);
  console.log('sig1 (btoa):', sig1);

  // Method 2: Buffer from bytes
  const sig2 = Buffer.from(bytes).toString('base64');
  console.log('sig2 (Buffer):', sig2);
}

run().catch(console.error);
