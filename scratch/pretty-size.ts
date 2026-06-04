import crypto from 'crypto';

const secret1 = 'polar_whs_VP90ydLeufJhPGx3jyhhCgWFGypzOHM74BgS2403L3q';
const secret2 = 'polar_whs_wQfsTWv9irQzHRkSNISR7L391bOkibVjMhgsT3ROTxQe';

const id = '01cdc44c-3476-4698-acff-44e3b7abede0';
const timestamp = '1780611249';
const targetSignature = 'ogm8UoomyqZG8Q8b9qwOZ5tKCxc23i4h396vjaD45DU=';

const payload = {
  "type": "customer.created",
  "timestamp": "2026-06-04T20:25:15.638033Z",
  "data": {
    "id": "ecf6e36a-728b-4134-8d44-f5f5f8f85375",
    "created_at": "2026-06-04T20:25:13.810288Z",
    "modified_at": null,
    "metadata": {},
    "external_id": null,
    "email": "ah3831950@gmail.com",
    "email_verified": false,
    "type": "individual",
    "name": null,
    "billing_address": {
      "line1": null,
      "line2": null,
      "postal_code": null,
      "city": null,
      "state": null,
      "country": "EG"
    },
    "tax_id": null,
    "locale": "en",
    "organization_id": "fe5196f1-9852-440a-895a-219356beccdc",
    "default_payment_method_id": null,
    "deleted_at": null,
    "avatar_url": "https://www.gravatar.com/avatar/77b81030897bb8c334a8ed1df5e5f8eeb214b7dee1bae4247dc5ebf9dabf7208?d=404"
  }
};

function check(rawBody: string, label: string) {
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  
  for (const [secName, secret] of [['Secret1', secret1], ['Secret2', secret2]]) {
    const cleanSecret = secret.replace(/^(whsec_|polar_whs_)/, '').trim();
    const secretBytesBase64 = Buffer.from(cleanSecret, 'base64');
    const sig = crypto.createHmac('sha256', secretBytesBase64).update(signedContent).digest('base64');
    if (sig === targetSignature) {
      console.log(`🎉 FOUND MATCH! Secret: ${secName}, Format: ${label}, length ${rawBody.length}`);
      return true;
    }
  }
  return false;
}

// Try minified
check(JSON.stringify(payload), 'minified');

// Try with trailing newline
check(JSON.stringify(payload) + '\n', 'minified with LF');
check(JSON.stringify(payload) + '\r\n', 'minified with CRLF');

// Try pretty 2 spaces
check(JSON.stringify(payload, null, 2), 'pretty 2');
check(JSON.stringify(payload, null, 2).replace(/\n/g, '\r\n'), 'pretty 2 CRLF');
check(JSON.stringify(payload, null, 2) + '\n', 'pretty 2 with LF');

// Try pretty 4 spaces
check(JSON.stringify(payload, null, 4), 'pretty 4');
check(JSON.stringify(payload, null, 4).replace(/\n/g, '\r\n'), 'pretty 4 CRLF');

console.log('Finished checks.');
