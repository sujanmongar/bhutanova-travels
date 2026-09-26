// POST /api/enquiry — the site's own enquiry sender (a Cloudflare Pages Function, deployed with the site).
// It turns the form into the branded email in src/emails/enquiry.mjs and sends it through Resend to the team's inbox,
// with the guest as "Reply to". Set in Cloudflare → Pages → bhutanova-travels → Settings → Variables and secrets:
//   RESEND_API_KEY (secret)   the key from resend.com
//   ENQUIRY_TO                where enquiries go (comma-separated for several inboxes)
//   ENQUIRY_FROM (optional)   e.g. "Bhutanova Travels <enquiries@bhutanovatravels.com>" once the domain is verified in Resend
// Until those exist it answers 503 and the form falls back to Web3Forms, then to the visitor's email app.
import { enquiryEmail } from '../../src/emails/enquiry.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const FIELDS = ['name', 'email', 'phone', 'tour', 'travellers', 'days', 'when', 'notes', 'page', 'kind'];

export async function onRequestPost({ request, env }) {
  // Only this site's own pages may send (stops other sites posting through it)
  // (compared as text: some browsers send the literal "null")
  const origin = request.headers.get('origin');
  const self = new URL(request.url).origin;
  if (origin && origin !== self) return json({ ok: false }, 403);

  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad request' }, 400); }
  if (form.get('botcheck')) return json({ ok: true });  // the hidden spam trap: pretend it worked
  const d = Object.fromEntries(FIELDS.map((k) => [k, String(form.get(k) ?? '').trim().slice(0, k === 'notes' ? 5000 : 300)]));
  if (!d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return json({ ok: false, error: 'name and email needed' }, 400);
  // The "sent from" link in the email must be a page of this site, never an address a sender made up
  try { if (new URL(d.page).origin !== self) d.page = ''; } catch { d.page = ''; }
  if (!env.RESEND_API_KEY || !env.ENQUIRY_TO) return json({ ok: false, error: 'not configured' }, 503);

  const { subject, html, text } = enquiryEmail(d);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.ENQUIRY_FROM || 'Bhutanova Travels website <onboarding@resend.dev>',
      to: env.ENQUIRY_TO.split(',').map((s) => s.trim()).filter(Boolean),
      reply_to: d.email,
      subject, html, text,
    }),
  });
  return json({ ok: res.ok }, res.ok ? 200 : 502);
}
