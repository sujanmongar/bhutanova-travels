export const SITE = {
  name: 'Bhutanova Travels',
  tagline: 'Bhutan tours, treks & festival journeys',
  description:
    'Bhutanova Travels is a Thimphu-based tour operator crafting cultural, festival, trekking and luxury tours across Bhutan, guided by the values of Gross National Happiness.',
  address: '4730 Babesa, Thimphu, Bhutan',
  email: 'info@bhutanovatravels.com',
  phone: '+975 77 34 44 26',
  phoneAlt: '+975 17 44 99 32',
  whatsapp: '97577344426',
  social: {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/',
    twitter: 'https://x.com/',
    whatsapp: 'https://wa.me/97577344426',
  },
  // Paste a Formspree / Web3Forms / Basin endpoint here. Empty = forms open the visitor's mail app.
  formEndpoint: '',
};

/** WhatsApp chat link that opens with a message naming the exact page (and section) the visitor came from. */
export function wa(pageUrl: string, about?: string) {
  const text = `Hi Bhutanova Travels${about ? `, I'd like to ask about ${about}` : ''}.\n${pageUrl}`;
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}
export const tel = (p: string) => `tel:${p.replace(/\s/g, '')}`;

/** JSON for a <script type="application/ld+json"> tag. JSON.stringify alone doesn't escape "</script>",
 *  which would let CMS-edited text (FAQ answers, titles) break out of the tag and inject a script. */
export const ldJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

/** Unsplash IDs ("photo-…"), Sanity CDN URLs or other URLs → responsive src. Both CDNs resize on the fly. */
export function img(src: string, w = 1200) {
  const url = src.startsWith('photo-') ? `https://images.unsplash.com/${src}` : src;
  if (url.includes('images.unsplash.com')) return `${url.split('?')[0]}?auto=format&fit=crop&q=80&w=${w}`;
  if (url.includes('cdn.sanity.io')) {
    const [base, query = ''] = url.split('?');
    const rect = new URLSearchParams(query).get('rect'); // an editor's crop, kept through resizing
    return `${base}?${rect ? `rect=${rect}&` : ''}auto=format&q=80&w=${w}`;
  }
  return url;
}
export function srcset(src: string, widths = [480, 800, 1200, 1800, 2400]) {
  return /unsplash|cdn\.sanity\.io/.test(img(src)) ? widths.map((w) => `${img(src, w)} ${w}w`).join(', ') : undefined;
}

/** An image from a page-builder block; `hotspot` is the focal point the editor dragged in Sanity. */
export type BlockImage = { url: string; alt?: string; hotspot?: { x: number; y: number } };
/** First photo on a page-builder page (banner or slideshow) — the share-image fallback. */
export const coverImage = (sections: Array<Record<string, any>>) => sections[0]?.image?.url ?? sections[0]?.slides?.[0]?.image?.url;
/** Focal point → CSS object-position, so cover-cropped images keep the subject in frame. */
export const focal = (h?: { x: number; y: number }) => (h ? `${Math.round(h.x * 100)}% ${Math.round(h.y * 100)}%` : '50% 50%');

/** Per-page SEO overrides edited in the Sanity "SEO" tab; each falls back to the page's own title/excerpt/image. */
export type Seo = { title?: string; description?: string; image?: string; noindex?: boolean };
