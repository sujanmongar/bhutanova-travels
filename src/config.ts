export const SITE = {
  name: 'Bhutanova Travels',
  tagline: 'Bhutan tours, treks & festival journeys',
  description:
    'Bhutanova Travels is a Thimphu-based tour operator crafting cultural, festival, trekking and luxury tours across Bhutan, guided by the values of Gross National Happiness.',
  address: '4730 Babesa, Thimphu, Bhutan',
  email: 'info@bhutanovatravels.com',
  phone: '+975 77 88 99 51',
  phoneAlt: '+975 77 88 99 60',
  social: {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/',
    twitter: 'https://x.com/',
    whatsapp: 'https://wa.me/97577889951',
  },
  // Paste a Formspree / Web3Forms / Basin endpoint here. Empty = forms open the visitor's mail app.
  formEndpoint: '',
};

/** Unsplash IDs ("photo-…") or full URLs → responsive src. */
export function img(src: string, w = 1200) {
  const url = src.startsWith('photo-') ? `https://images.unsplash.com/${src}` : src;
  return url.includes('images.unsplash.com') ? `${url.split('?')[0]}?auto=format&fit=crop&q=70&w=${w}` : url;
}
export function srcset(src: string, widths = [480, 800, 1200, 1800]) {
  return img(src).includes('unsplash') ? widths.map((w) => `${img(src, w)} ${w}w`).join(', ') : undefined;
}
