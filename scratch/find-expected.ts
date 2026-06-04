import crypto from 'crypto';

const secret1 = 'polar_whs_VP90ydLeufJhPGx3jyhhCgWFGypzOHM74BgS2403L3q';
const secret2 = 'polar_whs_wQfsTWv9irQzHRkSNISR7L391bOkibVjMhgsT3ROTxQe';

const id = '01cdc44c-3476-4698-acff-44e3b7abede0';
const timestamp = '1780612226';
const rawBody = '{"type":"customer.created","timestamp":"2026-06-04T20:25:15.638033Z","data":{"id":"ecf6e36a-728b-4134-8d44-f5f5f8f85375","created_at":"2026-06-04T20:25:13.810288Z","modified_at":null,"metadata":{},"external_id":null,"email":"ah3831950@gmail.com","email_verified":false,"type":"individual","name":null,"billing_address":{"line1":null,"line2":null,"postal_code":null,"city":null,"state":null,"country":"EG"},"tax_id":null,"locale":"en","organization_id":"fe5196f1-9852-440a-895a-219356beccdc","default_payment_method_id":null,"deleted_at":null,"avatar_url":"https://www.gravatar.com/avatar/77b81030897bb8c334a8ed1df5e5f8eeb214b7dee1bae4247dc5ebf9dabf7208?d=404"}}';

const targetSignature = '/26r8u6yVuq+sQ+WlduSHl8DR/EceCu7maW7Ebl1EQk=';
const expectedSignatureOnVercel = 'pQ7drWOeWWAA1YVZfmpSpijmtdGwgCG/eMIiAtdjNMk=';

function check(secret: string, secName: string) {
  const clean = secret.replace(/^(whsec_|polar_whs_)/, '').trim();
  const variations = [
    { label: 'clean base64', key: Buffer.from(clean, 'base64') },
    { label: 'clean utf-8', key: Buffer.from(clean, 'utf-8') },
    { label: 'full base64', key: Buffer.from(secret, 'base64') },
    { label: 'full utf-8', key: Buffer.from(secret, 'utf-8') }
  ];

  // Try rawBody formatting options
  const payloads = [
    { label: 'rawBody', val: rawBody },
    { label: 'rawBody with LF', val: rawBody + '\n' },
    { label: 'rawBody with CRLF', val: rawBody + '\r\n' }
  ];

  for (const p of payloads) {
    const signedContent = `${id}.${timestamp}.${p.val}`;
    for (const v of variations) {
      const sig = crypto.createHmac('sha256', v.key).update(signedContent).digest('base64');
      if (sig === expectedSignatureOnVercel) {
        console.log(`Matched EXPECTED: Secret=${secName}, variation=${v.label}, payload=${p.label}`);
      }
      if (sig === targetSignature) {
        console.log(`Matched TARGET (Polar): Secret=${secName}, variation=${v.label}, payload=${p.label}`);
      }
    }
  }
}

check(secret1, 'Secret 1');
check(secret2, 'Secret 2');
console.log('Done.');
