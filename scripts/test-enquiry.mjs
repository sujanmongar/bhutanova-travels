// Checks the enquiry sender without sending anything: node scripts/test-enquiry.mjs
import assert from 'node:assert';
const { onRequestPost } = await import('../functions/api/enquiry.js');
const req = (fields, origin = 'https://bhutanova-travels.pages.dev') => {
  const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return new Request('https://bhutanova-travels.pages.dev/api/enquiry', { method: 'POST', body: fd, headers: { origin } });
};
const ok = { name: 'Anna Keller', email: 'anna@example.com', tour: 'Glimpse of Bhutan (6 days)', notes: 'Hello' };
let r = await onRequestPost({ request: req(ok), env: {} }); assert.equal(r.status, 503);
r = await onRequestPost({ request: req({ ...ok, email: 'nope' }), env: {} }); assert.equal(r.status, 400);
r = await onRequestPost({ request: req(ok, 'https://evil.example'), env: {} }); assert.equal(r.status, 403);
r = await onRequestPost({ request: req({ ...ok, botcheck: 'on' }), env: {} }); assert.equal(r.status, 200);
r = await onRequestPost({ request: req(ok, 'null'), env: {} }); assert.equal(r.status, 403);
let sent;
globalThis.fetch = async (url, init) => { sent = { url, body: JSON.parse(init.body), auth: init.headers.Authorization }; return new Response('{}', { status: 200 }); };
r = await onRequestPost({ request: req(ok), env: { RESEND_API_KEY: 're_test', ENQUIRY_TO: 'a@x.com, b@x.com' } });
assert.equal(r.status, 200);
assert.equal(sent.url, 'https://api.resend.com/emails');
assert.deepEqual(sent.body.to, ['a@x.com', 'b@x.com']);
assert.equal(sent.body.reply_to, 'anna@example.com');
assert.match(sent.body.subject, /Trip enquiry: Anna Keller, Glimpse of Bhutan/);
assert.match(sent.body.html, /Reply to Anna/);
r = await onRequestPost({ request: req({ ...ok, page: 'https://evil.example/phish' }), env: { RESEND_API_KEY: 're_test', ENQUIRY_TO: 'a@x.com' } });
assert.ok(!sent.body.html.includes('evil.example'), 'a made-up "sent from" link is dropped');
console.log('all checks passed');
