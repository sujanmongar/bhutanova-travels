export const SITE = {
  name: 'Bhutanova Travels',
  tagline: 'Bhutan tours, treks & festival journeys',
  description:
    'Bhutanova Travels is a Thimphu-based tour operator crafting cultural, festival, trekking and luxury tours across Bhutan, guided by the values of Gross National Happiness.',
  address: '4730 Babesa, Thimphu, Bhutan',
  hours: 'Mon–Sat, 9am–6pm Bhutan time (GMT+6)',
  about: 'Private tours, treks and festival trips across Bhutan, planned and run by a licensed operator in Thimphu.',
  email: 'info@bhutanovatravels.com',
  // Where email links and the form's email fallback actually send (Site settings → Where emails go). The address shown
  // stays `email`; this one is the owner's inbox until the company mailbox is ready.
  emailTo: 'sujanallaymongar506@gmail.com',
  phone: '+975 77 34 44 26',
  phoneAlt: '+975 17 44 99 32',
  whatsapp: '97577344426',
  // Department of Tourism licence (footer, homepage proof line). Empty until the owner sends the real number: every
  // place that shows it hides it while empty.
  licence: '1234',
  // The reply promise under enquiry buttons and forms.
  promise: 'Free day-by-day plan and price within 24 hours. Nothing to pay to ask.',
  // The hero's pre-filled WhatsApp message for a free trip plan (the page address goes after it).
  waPlan: "Hi Bhutanova Travels, I'd like a free trip plan.\nWhen: \nTravellers: \nInterested in: ",
  // Subject of the enquiry emails the form sends.
  formSubject: 'New trip enquiry',
  // Search Console / Bing Webmaster verification codes (the content="…" value only). Empty = no tag.
  verify: {} as { google?: string; bing?: string },
  // Default share image (Site settings → Default share image). Undefined = the layout's own fallback photo.
  ogImage: undefined as string | undefined,
  // '#' or '' = profile not set up yet: its icon is hidden in the footer and it's left out of the structured data.
  social: {
    facebook: '#',
    instagram: '#',
    linkedin: '#',
    twitter: '#',
    google: '#',
    tripadvisor: '#',
    whatsapp: 'https://wa.me/97577344426',
  },
  // The footer's Quick links column. A '/' address is a page on this site; https:// opens in a new tab.
  quickLinks: [
    { label: 'Department of Tourism', href: 'https://www.bhutan.travel/' },
    { label: 'Department of Immigration', href: 'https://www.immi.gov.bt/' },
    { label: 'Drukair', href: 'https://www.drukair.com.bt/' },
    { label: 'Bhutan Airlines', href: 'https://www.bhutanairlines.bt/' },
    { label: 'ABTO', href: 'https://abto.org.bt/' },
  ] as Array<{ label: string; href: string }>,
  // Web3Forms access key (free at web3forms.com, made with the office email; it is public by design, not a secret).
  // Empty = forms open the visitor's mail app with the details written out.
  formKey: '389257ce-4664-4dcf-8982-c370c535a561',
  // The site's own branded sender (functions/api/enquiry.js + Resend). Off until RESEND_API_KEY and ENQUIRY_TO are set
  // in Cloudflare; while off, the form goes straight to Web3Forms.
  ownMailer: false,
};

/** WhatsApp chat link that opens with a message naming the exact page (and section) the visitor came from. */
export function wa(pageUrl: string, about?: string) {
  const text = `Hi Bhutanova Travels${about ? `, I'd like to ask about ${about}` : ''}.\n${pageUrl}`;
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}
export const tel = (p: string) => `tel:${p.replace(/\s/g, '')}`;
export const mailto = (email = SITE.emailTo) => `mailto:${email}`;

/** JSON for a <script type="application/ld+json"> tag. JSON.stringify alone doesn't escape "</script>",
 *  which would let CMS-edited text (FAQ answers, titles) break out of the tag and inject a script. */
export const ldJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

/** Unsplash IDs ("photo-…"), Sanity CDN URLs or other URLs → responsive src. Both CDNs resize on the fly. */
/** With `h`, the CDN returns exactly the frame's shape: a centred cover crop (same as CSS object-fit: cover),
 *  or, given `fp` (the editor's hotspot, 0–1 inside any rect crop), a crop kept around that focal point. */
export function img(src: string, w = 1200, h?: number, fp?: { x: number; y: number }) {
  const url = src.startsWith('photo-') ? `https://images.unsplash.com/${src}` : src;
  fp ??= fpOf(src);  // a Sanity photo's focal point travels in its address (see content.config.ts)
  const focus = h && fp ? `&crop=focalpoint&fp-x=${fp.x.toFixed(3)}&fp-y=${fp.y.toFixed(3)}` : '';
  if (url.includes('images.unsplash.com')) return `${url.split('?')[0]}?auto=format&fit=crop&q=80&w=${w}${h ? `&h=${h}` : ''}${focus}`;
  if (url.includes('cdn.sanity.io')) {
    const [base, query = ''] = url.split('?');
    const rect = new URLSearchParams(query).get('rect'); // an editor's crop, kept through resizing
    return `${base}?${rect ? `rect=${rect}&` : ''}auto=format&q=70&w=${w}${h ? `&h=${h}&fit=crop` : ''}${focus}`;
  }
  return url;
}
export function srcset(src: string, widths = [480, 800, 1200, 1800, 2400], ratio?: number, fp?: { x: number; y: number }) {
  return /unsplash|cdn\.sanity\.io/.test(img(src)) ? widths.map((w) => `${img(src, w, ratio && Math.round(w / ratio), fp)} ${w}w`).join(', ') : undefined;
}

/** The editor's focal point carried in a document photo's address (fp-x/fp-y), for CDN crops and CSS object-position. */
export function fpOf(src: string) {
  const q = new URLSearchParams(src.split('?')[1] ?? '');
  return q.has('fp-x') ? { x: Number(q.get('fp-x')), y: Number(q.get('fp-y')) } : undefined;
}
/** An image from a page-builder block; `hotspot` is the focal point the editor dragged in Sanity. */
export type BlockImage = { url: string; alt?: string; hotspot?: { x: number; y: number } };
/** First photo on a page-builder page (its hero or banner) — the share-image fallback. */
export const coverImage = (sections: Array<Record<string, any>>) => sections[0]?.image?.url;
/** Focal point → CSS object-position, so cover-cropped images keep the subject in frame. */
export const focal = (h?: { x: number; y: number }) => (h ? `${Math.round(h.x * 100)}% ${Math.round(h.y * 100)}%` : '50% 50%');

/** Per-page SEO overrides edited in the Sanity "SEO" tab; each falls back to the page's own title/excerpt/image. */
export type Seo = { title?: string; description?: string; image?: string; noindex?: boolean };

// An editor's crop becomes the CDN's rect=left,top,width,height (pixels), and the focal point is
// re-expressed inside the cropped area so object-position still lands on the subject.
export function applyCrop({ url, crop, dims, hotspot, ...rest }: any) {
  const [l, t] = [crop?.left ?? 0, crop?.top ?? 0];
  const [w, h] = [1 - l - (crop?.right ?? 0), 1 - t - (crop?.bottom ?? 0)];
  const ratio = dims && (w * dims.width) / (h * dims.height); // the photo's shape after the crop, for width/height
  if (!dims || (w > 0.999 && h > 0.999)) return { ...rest, url, hotspot, ratio };
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const rect = [l * dims.width, t * dims.height, w * dims.width, h * dims.height].map(Math.round).join(',');
  return { ...rest, url: `${url}?rect=${rect}`, ratio, hotspot: hotspot && { x: clamp((hotspot.x - l) / w), y: clamp((hotspot.y - t) / h) } };
}

// Local review: under `astro dev` with a read token in .env, unpublished drafts show on localhost, so
// content can be checked before it goes live. Builds (CI has no token, and a build is never DEV) always
// read published content, so a draft can't reach the live site by accident.
export const TOKEN = import.meta.env.DEV ? import.meta.env.SANITY_READ_TOKEN : undefined;

export function photoUrl(v: any) {
  if (!v.url) return undefined;
  const { url, hotspot } = applyCrop(v);
  if (!hotspot || (Math.abs(hotspot.x - 0.5) < 0.01 && Math.abs(hotspot.y - 0.5) < 0.01)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}fp-x=${hotspot.x.toFixed(3)}&fp-y=${hotspot.y.toFixed(3)}`;
}

// Site settings (Studio → Site settings): contact details, office hours, licence, social profiles, the footer's line
// about us and the banners of the pages the site builds itself. Read once per build; an empty field keeps the default.
type PageBanner = { heading?: string; line?: string; image?: string; alt?: string; seoTitle?: string; seoDescription?: string };
const PHOTO_Q = '{ "_s": true, "url": asset->url, hotspot, crop, "dims": asset->metadata.dimensions }';
const BANNER_Q = `{ heading, line, "image": image${PHOTO_Q}, "alt": image.alt, seoTitle, seoDescription }`;
const settingsRes = await fetch(`https://234ghw8x.api.sanity.io/v2025-02-19/data/query/production?perspective=${TOKEN ? 'drafts' : 'published'}&query=${encodeURIComponent(
  `*[_id == "settings"][0]{ phone, phoneAlt, email, emailTo, address, hours, licence, about, promise, waPlan, formSubject, "verify": verify{ google, bing },
    facebook, instagram, linkedin, twitter, google, tripadvisor, quickLinks[defined(label) && defined(href)]{ label, href }, "ogImage": ogImage${PHOTO_Q},
    "pages": { "tours": tours${BANNER_Q}, "destinations": destinations${BANNER_Q}, "guides": guides${BANNER_Q}, "blog": blog${BANNER_Q}, "contact": contact${BANNER_Q} } }`,
)}`, TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : undefined);
if (!settingsRes.ok) throw new Error(`Sanity settings query failed (${settingsRes.status})`);
const settings = JSON.parse(await settingsRes.text(), (_, v) => (v === null ? undefined : v?._s ? photoUrl(v) : v)).result ?? {};
for (const k of ['phone', 'phoneAlt', 'email', 'emailTo', 'address', 'hours', 'licence', 'about', 'promise', 'waPlan', 'formSubject', 'ogImage'] as const) if (settings[k]) (SITE as any)[k] = settings[k];
if (settings.verify) SITE.verify = settings.verify;
if (settings.quickLinks?.length) SITE.quickLinks = settings.quickLinks;
if (settings.email && !settings.emailTo) SITE.emailTo = settings.email;  // "Where emails go" empty = the email shown
SITE.whatsapp = SITE.phone.replace(/\D/g, '');
SITE.social = {
  facebook: settings.facebook ?? SITE.social.facebook, instagram: settings.instagram ?? SITE.social.instagram,
  linkedin: settings.linkedin ?? SITE.social.linkedin, twitter: settings.twitter ?? SITE.social.twitter,
  google: settings.google ?? SITE.social.google, tripadvisor: settings.tripadvisor ?? SITE.social.tripadvisor, whatsapp: `https://wa.me/${SITE.whatsapp}`,
};
/** A built-in page's banner (the Studio's values where filled in, else the page's own) and its Google title/description,
 *  which Base uses as typed, like any page's SEO tab. */
export const pageBanner = (key: 'tours' | 'destinations' | 'guides' | 'blog' | 'contact', d: { heading: string; line: string; image: string; alt: string }) => {
  const s: PageBanner = settings.pages?.[key] ?? {};
  return {
    heading: s.heading || d.heading, line: s.line || d.line, image: s.image || d.image, alt: s.image ? s.alt || '' : d.alt,
    seo: { title: s.seoTitle, description: s.seoDescription } as Seo,
  };
};
