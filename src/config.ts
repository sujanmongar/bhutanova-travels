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

/** Unsplash IDs ("photo-…") or full URLs → responsive src. */
export function img(src: string, w = 1200) {
  const url = src.startsWith('photo-') ? `https://images.unsplash.com/${src}` : src;
  return url.includes('images.unsplash.com') ? `${url.split('?')[0]}?auto=format&fit=crop&q=80&w=${w}` : url;
}
export function srcset(src: string, widths = [480, 800, 1200, 1800, 2400]) {
  return img(src).includes('unsplash') ? widths.map((w) => `${img(src, w)} ${w}w`).join(', ') : undefined;
}
