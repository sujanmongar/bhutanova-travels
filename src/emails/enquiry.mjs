// The email the team gets for each website enquiry (sent by functions/api/enquiry.js). Email apps ignore most modern
// CSS, so this is the old reliable way: tables, inline styles, web-safe fonts, no images (Gmail blocks SVG logos).
const NAVY = '#162e44', INK = '#132433', TEXT = '#41515f', LINE = '#e3e8ed', SOFT = '#f5f7f9', ORANGE = '#ffa500';
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LABELS = [['name', 'Name'], ['email', 'Email'], ['phone', 'Phone or WhatsApp'], ['tour', 'Tour'], ['travellers', 'Travellers'], ['days', 'Days'], ['when', 'When'], ['notes', 'Message']];

export function enquiryEmail(d, now = new Date()) {
  const name = (d.name || '').trim();
  const first = name.split(/\s+/)[0] || 'the guest';
  const trip = d.tour || (d.days ? `${d.days}-day trip` : 'a trip of their own');
  const subject = d.tour ? `Trip enquiry: ${name}, ${d.tour}` : `${d.kind === 'message' ? 'Website message' : 'Trip enquiry'}: ${name}`;
  const when = now.toLocaleString('en-GB', { timeZone: 'Asia/Thimphu', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const digits = (d.phone || '').replace(/\D/g, '');
  const replyHref = `mailto:${encodeURIComponent(d.email)}?subject=${encodeURIComponent(`Your Bhutan trip: plan and price`)}`;
  const chips = [d.travellers && `${d.travellers} travellers`, d.days && `${d.days} days`, d.when].filter(Boolean);

  const btn = (href, label, bg, fg) =>
    `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};font:600 15px/1 Arial,Helvetica,sans-serif;text-decoration:none;padding:14px 22px;border-radius:999px;margin:0 8px 8px 0">${esc(label)}</a>`;
  const rows = LABELS.filter(([k]) => (d[k] || '').trim()).map(([k, label]) => `
      <tr>
        <td style="padding:12px 0;border-top:1px solid ${LINE};width:36%;vertical-align:top;font:600 13px/1.5 Arial,Helvetica,sans-serif;color:${TEXT};text-transform:uppercase;letter-spacing:.06em">${label}</td>
        <td style="padding:12px 0;border-top:1px solid ${LINE};vertical-align:top;font:15px/1.6 Arial,Helvetica,sans-serif;color:${INK};white-space:pre-wrap">${k === 'email' ? `<a href="mailto:${esc(d.email)}" style="color:${INK}">${esc(d.email)}</a>` : esc(d[k])}</td>
      </tr>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${SOFT}">
<div style="display:none;max-height:0;overflow:hidden">${esc(`${name}: ${trip}${chips.length ? ' · ' + chips.join(' · ') : ''}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="background:${NAVY};padding:22px 28px">
      <span style="font:400 24px/1 Georgia,'Times New Roman',serif;color:#ffffff">Bhutanova</span>
      <span style="font:600 11px/1 Arial,Helvetica,sans-serif;color:#cfd8e0;letter-spacing:.3em;margin-left:6px">TRAVELS</span>
      <div style="width:40px;height:3px;background:${ORANGE};margin-top:12px;border-radius:2px"></div>
    </td></tr>
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0 0 8px;font:600 12px/1 Arial,Helvetica,sans-serif;color:${TEXT};letter-spacing:.1em;text-transform:uppercase">New enquiry · ${esc(when)} Bhutan time</p>
      <h1 style="margin:0 0 12px;font:400 26px/1.25 Georgia,'Times New Roman',serif;color:${INK}">${esc(name)} would like a plan for ${esc(trip)}</h1>
      ${chips.length ? `<p style="margin:0 0 20px;font:15px/1.6 Arial,Helvetica,sans-serif;color:${TEXT}">${chips.map(esc).join(' &nbsp;·&nbsp; ')}</p>` : ''}
      <div style="margin:0 0 8px">${btn(replyHref, `Reply to ${first}`, NAVY, '#ffffff')}${digits.length >= 8 ? btn(`https://wa.me/${digits}`, `WhatsApp ${first}`, '#25d366', INK) : ''}</div>
      <p style="margin:0 0 20px;font:14px/1.5 Arial,Helvetica,sans-serif;color:${TEXT}">We promised a free day-by-day plan and price within 24 hours.</p>
    </td></tr>
    <tr><td style="padding:0 28px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
      <tr><td colspan="2" style="border-top:1px solid ${LINE}"></td></tr></table></td></tr>
    <tr><td style="background:${SOFT};padding:16px 28px;font:13px/1.6 Arial,Helvetica,sans-serif;color:${TEXT}">
      Sent from <a href="${esc(d.page || '#')}" style="color:${TEXT}">${esc((d.page || '').replace(/^https?:\/\//, '') || 'the website')}</a> · Bhutanova Travels website
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [`New enquiry, ${when} Bhutan time`, `${name} would like a plan for ${trip}.`, '',
    ...LABELS.filter(([k]) => (d[k] || '').trim()).map(([k, l]) => `${l}: ${d[k]}`), '', `Sent from ${d.page || 'the website'}`].join('\n');
  return { subject, html, text };
}
