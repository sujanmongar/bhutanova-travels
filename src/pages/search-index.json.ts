import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { DESTINATIONS, catPath, tourPath } from '../utils';

// The site search's index: title + type + url (+ extra words) for everything a visitor might look for.
// Written once at build time as /search-index.json; the header fetches it the first time search opens,
// and /search/ on load (src/scripts/search.ts does the matching).
export const GET: APIRoute = async () => {
  const cats = (await getCollection('categories')).sort((a, b) => a.data.order - b.data.order);
  const guides = (await getCollection('guides')).sort((a, b) => a.data.order - b.data.order);
  const destinations = (await getCollection('destinations')).sort((a, b) => a.data.order - b.data.order);
  const tours = await getCollection('tours');
  const posts = await getCollection('blog');
  const sights = await getCollection('sights');
  const index = [
    { t: 'About Bhutan', k: 'Page', u: '/about-bhutan/' },
    { t: 'About us', k: 'Page', u: '/about/' },
    { t: 'Contact', k: 'Page', u: '/contact/' },
    ...cats.map((c) => ({ t: c.data.menuTitle, k: 'Category', u: catPath(c.id), x: c.data.title })),
    ...tours.map((t) => ({ t: t.data.title, k: 'Tour', u: tourPath(t), x: `${cats.find((c) => c.id === t.data.category.id)?.data.menuTitle ?? ''} ${t.data.days} days private tour` })),
    ...destinations.map((d) => ({ t: d.data.title, k: 'Destination', u: `${DESTINATIONS}${d.id}/`, x: d.data.region })),
    ...sights.map((x) => ({ t: x.data.title, k: 'Sight', u: `${DESTINATIONS}${x.id}/` })),
    ...guides.map((g) => ({ t: g.data.title, k: 'Guide', u: `/travel-guide/${g.id}/`, x: g.data.excerpt })),
    ...posts.map((p) => ({ t: p.data.title, k: 'Article', u: `/blog/${p.id}/` })),
  ];
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
