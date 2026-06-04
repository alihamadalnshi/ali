const crypto = require('crypto');

const secret = 'polar_whs_VP90ydLeufJhPGx3jyhhCgWFGypzOHM74BgS2403L3q';
const id = '01cdc44c-3476-4698-acff-44e3b7abede0';
const timestamp = '1780609218';
const rawBody = `{"type":"customer.created","timestamp":"2026-06-04T20:25:15.638033Z","data":{"id":"ecf6e36a-728b-4134-8d44-f5f5f8f85375","created_at":"2026-06-04T20:25:13.810288Z","modified_at":null,"metadata":{},"external_id":null,"email":"ah3831950@gmail.com","email_verified":false,"type":"individual","name":null,"billing_address":{"line1":null,"line2":null,"postal_code":null,"city":null,"state":null,"country":"EG"},"tax_id":null,"locale":"en","organization_id":"fe5196f1-9852-440a-895a-219356beccdc","default_payment_method_id":null,"deleted_at":null,"avatar_url":"https://www.gravatar.com/avatar/77b81030897bb8c334a8ed1df5e5f8eeb214b7dee1bae4247dc5ebf9dabf7208?d=404"}}`;

const targetSignature = '5HD4Ga/BSRjU+wpaKfkMA0mC200m/tm0GD9s65VCkdA=';

const signedContent = `${id}.${timestamp}.${rawBody}`;

// Try 1: Decoded base64 key
const cleanSecret = secret.replace(/^(whsec_|polar_whs_)/, '');
const secretBytesBase64 = Buffer.from(cleanSecret, 'base64');
const sig1 = crypto.createHmac('sha256', secretBytesBase64).update(signedContent).digest('base64');
console.log('Sig 1 (Base64 decoded secret):', sig1);
console.log('Sig 1 Match:', sig1 === targetSignature);

// Try 2: Raw string secret
const secretBytesRaw = Buffer.from(secret);
const sig2 = crypto.createHmac('sha256', secretBytesRaw).update(signedContent).digest('base64');
console.log('Sig 2 (Raw secret string):', sig2);
console.log('Sig 2 Match:', sig2 === targetSignature);

// Try 3: Raw clean secret string
const secretBytesRawClean = Buffer.from(cleanSecret);
const sig3 = crypto.createHmac('sha256', secretBytesRawClean).update(signedContent).digest('base64');
console.log('Sig 3 (Raw clean secret string):', sig3);
console.log('Sig 3 Match:', sig3 === targetSignature);

// Try 4: Raw secret with trimmed/untouched base64 decode
const secretBytesBase64Untouched = Buffer.from(secret, 'base64');
const sig4 = crypto.createHmac('sha256', secretBytesBase64Untouched).update(signedContent).digest('base64');
console.log('Sig 4 (Base64 decoded untouched secret):', sig4);
console.log('Sig 4 Match:', sig4 === targetSignature);
